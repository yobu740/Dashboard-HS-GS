// Athenas lesson API client (server-side only — the X-API-KEY never reaches
// the browser).
//
// Upstream endpoints (same ones used by Genial Skills Maestro):
//   GET  /api/lessons/published/genial-web/{subjectCode}/{levelCode} → catalogue
//   POST /api/lessons/lesson/                                        → full lesson
//
// Without ATHENAS_API_KEY the catalogue falls back to catalog-snapshot.json, a
// metadata-only capture of the published catalogue (ids + titles), so the
// onboarding still assigns real lesson ids. Lesson detail needs the live API.

import snapshot from './catalog-snapshot.json' with { type: 'json' }
import { codesFor, shiftGrade } from '../shared/subjects.js'

const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map()

function config() {
  return {
    base: (process.env.ATHENAS_BASE_URL || process.env.ATHENAS_API_BASE || 'https://athenasapi-dev.genialskillsweb.com').replace(/\/+$/, ''),
    key: process.env.ATHENAS_API_KEY || '',
  }
}

export function athenasMode() {
  return config().key ? 'live' : 'snapshot'
}

function normalizeRow(x, subjectCode, levelCode) {
  return {
    id: String(x.Id ?? x.id),
    no: Number(x.LessonNo ?? x.no) || 0,
    title: String(x.LessonTitle ?? x.title ?? '').trim(),
    subjectCode,
    levelCode,
  }
}

/** Published lessons for one subject code at one level, ordered by lesson number. */
export async function fetchPublished(subjectCode, levelCode) {
  const cacheKey = `${subjectCode}/${levelCode}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows

  const { base, key } = config()
  let rows
  if (key) {
    try {
      const r = await fetch(`${base}/api/lessons/published/genial-web/${encodeURIComponent(subjectCode)}/${encodeURIComponent(levelCode)}`, {
        headers: { 'X-API-KEY': key },
      })
      // Athenas answers 400 for subject/level pairs that do not exist.
      if (r.status === 400 || r.status === 404) rows = []
      else if (!r.ok) throw new Error(`Athenas ${r.status}`)
      else {
        const j = await r.json()
        rows = (Array.isArray(j?.LessonRequestModel) ? j.LessonRequestModel : []).map(x => normalizeRow(x, subjectCode, levelCode))
      }
    } catch (err) {
      console.warn(`[athenas] live catalogue failed for ${cacheKey}, using snapshot:`, err.message)
    }
  }
  if (!rows) rows = (snapshot[cacheKey] || []).map(x => normalizeRow(x, subjectCode, levelCode))

  // Unnumbered lessons (LessonNo 0, mostly newer blueprint lessons) go last.
  const rank = r => (r.no > 0 ? r.no : Number.MAX_SAFE_INTEGER)
  rows = rows.filter(r => r.id && r.title).sort((a, b) => rank(a) - rank(b) || Number(a.id) - Number(b.id))
  cache.set(cacheKey, { at: Date.now(), rows })
  return rows
}

/**
 * Candidate lessons for one subject for a child. Tries the subject's codes in
 * preference order and keeps the first that has lessons at the child's grade.
 * `support` widens the grade window: 'refuerzo' adds the previous grade,
 * 'avanzado' adds the next one, so the planner can pick bridging lessons.
 */
export async function lessonsForSubject(subjectKey, level, language, support = 'al-dia') {
  const codes = codesFor(subjectKey, level, language)
  const levels = [level]
  if (support === 'refuerzo') { const prev = shiftGrade(level, -1); if (prev) levels.unshift(prev) }
  if (support === 'avanzado') { const next = shiftGrade(level, 1); if (next) levels.push(next) }

  for (const code of codes) {
    const own = await fetchPublished(code, level)
    if (!own.length) continue
    const lists = await Promise.all(levels.map(l => (l === level ? own : fetchPublished(code, l))))
    return { code, lessons: lists.flat(), fallbackUsed: code !== codes[0] }
  }
  return { code: null, lessons: [], fallbackUsed: false }
}

export async function catalogFor({ level, language = 'es', subjects = [] }) {
  const out = {}
  await Promise.all(subjects.map(async ({ key, support }) => {
    out[key] = await lessonsForSubject(key, level, language, support)
  }))
  return out
}

const NAMED_ENTITIES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
  iquest: '¿', iexcl: '¡', laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
  ndash: '–', mdash: '—', hellip: '…', deg: '°', times: '×', divide: '÷', middot: '·',
}

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name] ?? m)
}

function plainText(html) {
  // Athenas content is sometimes entity-encoded twice (&amp;aacute;), so decode
  // before and after stripping tags.
  const text = decodeEntities(String(html || ''))
    .replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(text)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
}

function standardFrom(c) {
  const code = c.ConstructedFullCode || c.ConstructedCodeFull || c.MainCode || ''
  const parts = Array.isArray(c.ConstructedCodeCodeModels) ? c.ConstructedCodeCodeModels : []
  const description = parts
    .filter(p => String(p.CodeTypeId) !== '3') // 3 = grade level, not the standard text
    .map(p => p.CodeDescription)
    .filter(Boolean)
    .join(', ')
  return { code, description }
}

/** Full lesson detail, reduced to what the family-facing UI shows. */
export async function fetchLessonDetail(lessonId) {
  const { base, key } = config()
  if (!key) {
    const err = new Error('ATHENAS_API_KEY no está configurada; el detalle de la lección requiere la API en vivo.')
    err.status = 503
    throw err
  }
  const r = await fetch(`${base}/api/lessons/lesson/`, {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ LessonId: String(lessonId), AddLessonNo: true, OnlyPublishedQuizzes: true, ExamType: '1' }),
  })
  if (!r.ok) {
    const err = new Error(`Athenas ${r.status}`)
    err.status = r.status === 404 ? 404 : 502
    throw err
  }
  const j = await r.json()
  const m = j.LessonModifierRequestModel || {}
  const lm = m.LessonModel || {}
  return {
    id: String(lm.Id || lessonId),
    title: lm.LessonTitle || '',
    lessonNo: lm.LessonNo || null,
    subjectCode: lm.SubjectCode || null,
    levelCode: lm.LevelCode || null,
    description: plainText(m.LessonDetailModel?.Description).slice(0, 2500),
    concept: plainText(m.LessonDetailModel?.Concept).slice(0, 1500),
    objectives: (m.LessonObjectiveModelList || []).map(o => plainText(o.Desc)).filter(Boolean),
    strategies: (m.LessonStrategyModelList || []).map(s => plainText(s.Desc)).filter(Boolean),
    definitions: (m.LessonDefinitionModelList || []).map(d => ({ name: plainText(d.Name), desc: plainText(d.Desc) })).filter(d => d.name),
    standards: (m.ConstructedCodeHandleModelList || []).map(standardFrom).filter(s => s.code),
  }
}
