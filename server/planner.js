// Study-plan generator.
//
// 1. Pull the real Athenas catalogue for the child's grade (and neighbouring
//    grades for subjects that need reinforcement / enrichment).
// 2. Ask an LLM (via OpenRouter) to act as a homeschool curriculum advisor: pick and sequence
//    lessons *by id* from that catalogue and set a weekly rhythm per subject.
// 3. Validate every id against the catalogue (anything invented is dropped),
//    then lay the lessons onto the family's calendar with shared/scheduler.js
//    (each lesson: learn → practice → exam, plus weekly skills reviews).
// 4. When the family opts in, align with the DEPR grade expectations: the
//    model sees which expectations each lesson covers and is asked to cover
//    as many as possible; the plan ships the expectations for the coverage UI.
//
// With no OpenRouter key the heuristic planner below produces the same
// plan shape, so the product flow works end to end in any environment.

import { catalogFor, athenasMode } from './athenas.js'
import { SUBJECTS, GRADES, gradeLabel } from '../shared/subjects.js'
import { buildSchedule, fitQuotas, lessonCapacity, weeklyCapacity, slotsPerDay, WEEKDAY_LABELS } from '../shared/scheduler.js'
import { gradeExpectations, lessonExpectations } from './depr.js'

// OpenRouter (same provider as Genial Skills Maestro). Any model with
// structured-output support works; override with OPENROUTER_MODEL.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o'

const SUPPORT_LABEL = {
  refuerzo: 'necesita refuerzo',
  'al-dia': 'va al día',
  avanzado: 'está avanzado',
}

const LANGUAGE_LABEL = { es: 'español', en: 'inglés', bi: 'bilingüe (español e inglés)' }

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'Resumen del plan para la familia (3-5 oraciones, cálido y concreto, en español).',
    },
    weeklyRhythm: {
      type: 'string',
      description: 'Cómo se ve una semana típica (1-2 oraciones).',
    },
    tips: {
      type: 'array',
      items: { type: 'string' },
      description: '3-4 consejos prácticos para el padre/madre, ligados al perfil del niño.',
    },
    subjects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subjectKey: { type: 'string', enum: Object.keys(SUBJECTS) },
          sessionsPerWeek: { type: 'integer' },
          focus: { type: 'string', description: 'Enfoque de la materia en una frase.' },
          rationale: { type: 'string', description: 'Por qué este ritmo y esta secuencia (1-2 oraciones).' },
          lessonIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs de lecciones del catálogo, en el orden en que se deben estudiar.',
          },
        },
        required: ['subjectKey', 'sessionsPerWeek', 'focus', 'rationale', 'lessonIds'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'weeklyRhythm', 'tips', 'subjects'],
  additionalProperties: false,
}

const SYSTEM_PROMPT = `Eres el asesor curricular de Genial Skills para familias que educan en casa (homeschool), principalmente en Puerto Rico.

Tu trabajo: a partir del perfil del estudiante y del catálogo real de lecciones de Athenas (la plataforma de lecciones de Genial Skills), diseñar un plan de estudio para el periodo indicado.

Cómo decidir:
- Solo puedes usar lecciones del catálogo que se te entrega, identificadas por su ID exacto. Nunca inventes IDs ni títulos.
- Ordena las lecciones de cada materia en una secuencia pedagógica lógica: fundamentos y prerrequisitos primero, luego aplicación. El orden del catálogo es solo una referencia.
- Si una materia "necesita refuerzo", empieza con lecciones puente del grado anterior (vienen marcadas) antes de las del grado actual, y dale más sesiones por semana. Las lecciones puente no deben pasar de un 30% de la materia: la meta es llegar al contenido de su grado.
- Si una materia "está avanzado", puedes cerrar con lecciones del grado siguiente (vienen marcadas) y darle un ritmo normal.
- Usa los intereses y el estilo de aprendizaje del niño para priorizar temas y para los consejos, sin inventar contenido de las lecciones.
- La suma de sesiones por semana de todas las materias no puede pasar de la capacidad semanal indicada. Puedes dejar algo de capacidad libre si el enfoque de la familia es flexible.
- Cada lección se trabaja en TRES sesiones en días distintos: aprender (concepto, vocabulario, ejemplos), practicar y examen. Además, cada materia tiene una sesión semanal de repaso de destrezas. Por eso el número de lecciones por materia es la "capacidad de lecciones" indicada en el perfil según las sesiones por semana que elijas. lessonIds debe tener EXACTAMENTE esa cantidad (o todas las disponibles si no alcanzan).
- Si el perfil indica alineación con el DEPR, cada lección trae las expectativas del grado que trabaja (códigos como 3.N.1). Prioriza cubrir la mayor cantidad posible de expectativas distintas del grado y de todos sus dominios; evita elegir varias lecciones que repitan exactamente las mismas expectativas si hay alternativas. Menciona en el resumen que el plan sigue los estándares del Departamento de Educación.
- Escribe todo el texto en español, dirigido al padre o madre, en tono cálido, claro y práctico. Sin jerga educativa innecesaria.`

function describeProfile(profile, capacity, perDay) {
  const { child, schedule } = profile
  const days = (schedule.days || []).map(d => WEEKDAY_LABELS[d]).join(', ')
  const lines = [
    `Estudiante: ${child.name}${child.age ? `, ${child.age} años` : ''}, ${gradeLabel(child.level)}.`,
    `Idioma de instrucción preferido: ${LANGUAGE_LABEL[child.language] || 'español'}.`,
    `Materias y nivel percibido por la familia: ${profile.subjects.map(s => `${SUBJECTS[s.key].name} (${SUPPORT_LABEL[s.support] || 'va al día'})`).join('; ')}.`,
  ]
  if (profile.learningStyles?.length) lines.push(`Estilo de aprendizaje: ${profile.learningStyles.join(', ')}.`)
  if (profile.interests?.length) lines.push(`Intereses: ${profile.interests.join(', ')}.`)
  if (profile.goals?.length) lines.push(`Metas de la familia: ${profile.goals.join('; ')}.`)
  if (profile.approach) lines.push(`Enfoque preferido: ${profile.approach}.`)
  if (profile.notes) lines.push(`Notas de la familia: ${String(profile.notes).slice(0, 1200)}`)
  lines.push(
    `Horario: ${days}; ${schedule.minutesPerDay} minutos al día; sesiones de ${schedule.minutesPerLesson} minutos; hasta ${perDay} sesiones por día.`,
    `Periodo: ${schedule.weeks} semanas a partir de ${schedule.startDate}.`,
    `Capacidad semanal total: ${capacity} sesiones.`,
    `Capacidad de lecciones por materia en ${schedule.weeks} semanas, según sesiones por semana: ${[1, 2, 3, 4, 5, 6].map(q => `${q} ses/sem → ${lessonCapacity(q, Number(schedule.weeks) || 12)} lecciones`).join('; ')}.`,
    profile.depr
      ? 'Alineación con el DEPR: SÍ. La familia quiere cumplir con las expectativas de grado del Departamento de Educación de Puerto Rico.'
      : 'Alineación con el DEPR: no solicitada. Prioriza las necesidades e intereses del niño.',
  )
  return lines.join('\n')
}

function describeCatalog(catalog, childLevel, depr) {
  const blocks = []
  for (const [key, entry] of Object.entries(catalog)) {
    const name = SUBJECTS[key].name
    if (!entry.lessons.length) {
      blocks.push(`## ${name} (${key})\nNo hay lecciones publicadas para este grado.`)
      continue
    }
    const rows = entry.lessons.map(l => {
      const tag = l.levelCode === childLevel ? '' : ` [puente: ${gradeLabel(l.levelCode)}]`
      const std = depr && l.standards?.length ? ` | ${l.standards.join(', ')}` : ''
      return `${l.id} | ${l.title}${tag}${std}`
    })
    let block = `## ${name} (${key}) — ${entry.lessons.length} lecciones\nID | Título${depr ? ' | Expectativas DEPR' : ''}\n${rows.join('\n')}`
    const grade = depr && gradeExpectations(key, childLevel)
    if (grade) {
      block += `\n\nExpectativas DEPR de ${name}, ${gradeLabel(childLevel)} (${grade.expectations.length}):\n` +
        grade.expectations.map(e => `${e.code} — ${e.text.slice(0, 140)}`).join('\n')
    }
    blocks.push(block)
  }
  return blocks.join('\n\n')
}

async function planWithAI(profile, catalog, capacity, perDay) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    const err = new Error('No hay OPENROUTER_API_KEY configurada.')
    err.noCredentials = true
    throw err
  }
  const r = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'X-Title': 'Genial Skills Homeschool',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 12000,
      // Structured output: the model must answer with JSON matching PLAN_SCHEMA.
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'study_plan', strict: true, schema: PLAN_SCHEMA },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `# Perfil
${describeProfile(profile, capacity, perDay)}

# Catálogo de Athenas
${describeCatalog(catalog, profile.child.level, profile.depr)}

Diseña el plan. Responde solo con el JSON.`,
        },
      ],
    }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(`OpenRouter ${r.status}: ${data?.error?.message || 'error'}`)
    err.noCredentials = r.status === 401
    throw err
  }
  const choice = data.choices?.[0]
  if (choice?.finish_reason === 'length') throw new Error('La respuesta del modelo quedó incompleta.')
  // Some models wrap JSON in a code fence even with response_format set.
  const text = String(choice?.message?.content || '').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  return { raw: JSON.parse(text), model: data.model || MODEL }
}

/** Deterministic plan used when the AI is unavailable. */
function planHeuristically(profile, catalog, capacity) {
  const weight = { refuerzo: 1.5, 'al-dia': 1, avanzado: 1 }
  const active = profile.subjects.filter(s => catalog[s.key]?.lessons.length)
  const totalWeight = active.reduce((a, s) => a + (weight[s.support] || 1), 0) || 1
  const usable = profile.approach === 'flexible' ? Math.max(active.length, Math.round(capacity * 0.8)) : capacity
  const weeks = Number(profile.schedule.weeks) || 12

  const subjects = active.map(s => {
    const perWeek = Math.max(1, Math.floor((usable * (weight[s.support] || 1)) / totalWeight))
    const slots = lessonCapacity(perWeek, weeks)
    const all = catalog[s.key].lessons
    const own = all.filter(l => l.levelCode === profile.child.level)
    const before = all.filter(l => l.levelCode !== profile.child.level && all.indexOf(l) < all.indexOf(own[0]))
    const after = all.filter(l => l.levelCode !== profile.child.level && !before.includes(l))
    // Bridge lessons from the previous grade take at most ~30% of the slots, so
    // the child still reaches their own grade's content within the period.
    const lessons = [...before.slice(0, Math.ceil(slots * 0.3)), ...own, ...after]
    return {
      subjectKey: s.key,
      sessionsPerWeek: perWeek,
      focus: s.support === 'refuerzo'
        ? 'Reforzar bases antes de avanzar con el grado.'
        : s.support === 'avanzado' ? 'Completar el grado y adelantar contenido.' : 'Cubrir el contenido del grado a ritmo constante.',
      rationale: `Secuencia del catálogo de Athenas para ${gradeLabel(profile.child.level)}, ${perWeek} sesiones por semana.`,
      lessonIds: lessons.slice(0, slots).map(l => l.id),
    }
  })

  const name = profile.child.name
  return {
    summary: `Este plan organiza ${weeks} semanas de estudio para ${name} con lecciones reales de Genial Skills en ${subjects.length} materias. Las materias que necesitan refuerzo tienen más sesiones y empiezan repasando el grado anterior.`,
    weeklyRhythm: `${profile.schedule.days.length} días a la semana, alrededor de ${profile.schedule.minutesPerDay} minutos diarios.`,
    tips: [
      'Empieza cada día con la materia que requiere más concentración.',
      'Al terminar cada lección, pide un resumen de 2 minutos en sus propias palabras.',
      'Usa los días de repaso para practicar lo que costó más en la semana.',
    ],
    subjects,
  }
}

/** Keep only catalogue ids, fill gaps heuristically, attach titles/colors. */
function normalizePlan(raw, profile, catalog, capacity) {
  const fallback = planHeuristically(profile, catalog, capacity)
  const byKey = new Map((raw.subjects || []).map(s => [s.subjectKey, s]))
  const subjects = []
  const warnings = []

  for (const { key } of profile.subjects) {
    const entry = catalog[key]
    const meta = SUBJECTS[key]
    if (!entry?.lessons.length) {
      warnings.push(`No hay lecciones publicadas de ${meta.name} para ${gradeLabel(profile.child.level)} en Athenas todavía.`)
      continue
    }
    const index = new Map(entry.lessons.map(l => [l.id, l]))
    let chosen = byKey.get(key)
    const seen = new Set()
    let ids = (chosen?.lessonIds || []).map(String).filter(id => index.has(id) && !seen.has(id) && seen.add(id))
    const dropped = (chosen?.lessonIds || []).length - ids.length
    if (dropped > 0) console.warn(`[planner] dropped ${dropped} ${key} lesson ids not in the catalogue`)
    if (!chosen || !ids.length) {
      chosen = fallback.subjects.find(s => s.subjectKey === key)
      ids = chosen.lessonIds
    }
    if (entry.fallbackUsed) warnings.push(`${meta.name}: se usaron lecciones en ${entry.code?.endsWith('-en') ? 'inglés' : 'español'} porque no hay lecciones publicadas en el idioma preferido para este grado.`)

    subjects.push({
      key,
      name: meta.name,
      color: meta.color,
      emoji: meta.emoji,
      athenasCode: entry.code,
      sessionsPerWeek: Math.max(1, Number(chosen.sessionsPerWeek) || 1),
      focus: chosen.focus,
      rationale: chosen.rationale,
      available: entry.lessons.length,
      lessons: ids.map(id => {
        const l = index.get(id)
        return { id: l.id, title: l.title, levelCode: l.levelCode, subjectCode: l.subjectCode, standards: l.standards }
      }),
    })
  }

  return {
    summary: raw.summary || fallback.summary,
    weeklyRhythm: raw.weeklyRhythm || fallback.weeklyRhythm,
    tips: (raw.tips?.length ? raw.tips : fallback.tips).slice(0, 5),
    subjects,
    warnings,
  }
}

/**
 * Models often pick fewer lessons than the calendar has room for. Fill each
 * subject up to its lesson capacity with the remaining catalogue lessons —
 * the child's own grade first, then the next grade (never extra bridge
 * lessons from the grade below, which are capped at ~30% of the subject).
 * With DEPR alignment on, lessons that cover still-uncovered expectations go
 * first.
 */
function topUpLessons(plan, profile, catalog, capacity) {
  const weeks = Number(profile.schedule.weeks) || 12
  const quotas = fitQuotas(plan.subjects, capacity)
  const below = new Set(profile.subjects.filter(s => s.support === 'refuerzo').map(s => s.key))
  plan.subjects.forEach((subject, i) => {
    const target = lessonCapacity(quotas[i], weeks)
    // Bridge lessons from the grade below: keep the model's order, cap at ~30%.
    const bridgeCap = Math.ceil(target * 0.3)
    let bridges = 0
    subject.lessons = subject.lessons.filter(l => {
      if (!below.has(subject.key) || l.levelCode === profile.child.level || GRADES.indexOf(l.levelCode) > GRADES.indexOf(profile.child.level)) return true
      bridges += 1
      return bridges <= bridgeCap
    })
    if (subject.lessons.length >= target) {
      subject.lessons = subject.lessons.slice(0, target)
      return
    }
    const chosen = new Set(subject.lessons.map(l => l.id))
    const pool = catalog[subject.key].lessons.filter(l => !chosen.has(l.id))
    let own = pool.filter(l => l.levelCode === profile.child.level)
    if (profile.depr) {
      const covered = new Set(subject.lessons.flatMap(l => l.standards || []))
      const gain = l => (l.standards || []).filter(c => !covered.has(c)).length
      own = own.map((l, order) => ({ l, order, gain: gain(l) })).sort((a, b) => (b.gain > 0) - (a.gain > 0) || a.order - b.order).map(x => x.l)
    }
    const other = below.has(subject.key) ? [] : pool.filter(l => l.levelCode !== profile.child.level)
    const extra = [...own, ...other].slice(0, target - subject.lessons.length)
    subject.lessons.push(...extra.map(l => ({ id: l.id, title: l.title, levelCode: l.levelCode, subjectCode: l.subjectCode, standards: l.standards })))
  })
}

export async function generatePlan(profile) {
  if (!profile?.child?.level || !profile?.subjects?.length) {
    const err = new Error('El perfil necesita grado y al menos una materia.')
    err.status = 400
    throw err
  }
  const schedule = profile.schedule
  const capacity = weeklyCapacity(schedule)
  const perDay = slotsPerDay(schedule)

  const catalog = await catalogFor({ level: profile.child.level, language: profile.child.language, subjects: profile.subjects })
  // DEPR expectations each lesson works (child's grade only; bridge lessons count for their own grade).
  for (const entry of Object.values(catalog)) {
    entry.lessons = entry.lessons.map(l => ({ ...l, standards: lessonExpectations(l.id, profile.child.level) }))
  }

  let raw
  let source = 'ai'
  let model = null
  let aiError = null
  try {
    ;({ raw, model } = await planWithAI(profile, catalog, capacity, perDay))
  } catch (err) {
    aiError = err.noCredentials
      ? 'No hay una OPENROUTER_API_KEY válida configurada.'
      : err.message || String(err)
    console.warn('[planner] AI unavailable, using heuristic plan:', aiError)
    raw = planHeuristically(profile, catalog, capacity)
    source = 'heuristic'
  }

  const plan = normalizePlan(raw, profile, catalog, capacity)
  topUpLessons(plan, profile, catalog, capacity)
  const { sessions, quotas, scheduledLessons } = buildSchedule(plan.subjects, schedule)
  plan.subjects.forEach((s, i) => {
    s.sessionsPerWeek = quotas[i]
    // Keep only the lessons that fit in the period; the rest would never be scheduled.
    s.lessons = s.lessons.slice(0, scheduledLessons[i])
  })
  // Grade expectations ship with every plan so DEPR tracking can be switched on later.
  const alignment = {}
  for (const s of plan.subjects) {
    const grade = gradeExpectations(s.key, profile.child.level)
    if (grade) alignment[s.key] = grade
  }

  return {
    ...plan,
    source,
    model,
    aiError,
    catalogMode: athenasMode(),
    createdAt: new Date().toISOString(),
    settings: schedule,
    depr: !!profile.depr,
    alignment,
    sessions,
  }
}
