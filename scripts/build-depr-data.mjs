// Builds the DEPR alignment data used by the planner and the coverage panel.
//
//   node --env-file=.env.local scripts/build-depr-data.mjs "<path to Genial Skill maestros/standards>"
//
// Outputs (committed, read at runtime by server/depr.js):
//   server/depr-standards.json  { "mat-3": [{ code, domain, text }] }  grade expectations (3-level codes)
//   server/lesson-standards.json { lessons: { "<id>": ["3.N.1.2", …] }, domains: { mat: { N: "Numeración y Operación" } } }
//
// The lesson map comes from the Athenas lesson detail (ConstructedCodeHandleModelList)
// for every lesson in server/catalog-snapshot.json.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const standardsDir = process.argv[2]
if (!standardsDir) throw new Error('Pass the path to the DEPR standards folder (Genial Skill maestros/standards).')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE_PREFIX = { mat: 'mat', esp: 'esp', ing: 'ing', cie: 'cie', est: 'est' }
const GRADES = ['k', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

// 1. Grade expectations (top level = grade.domain.number)
const standards = {}
for (const prefix of Object.keys(FILE_PREFIX)) {
  for (const g of GRADES) {
    const file = path.join(standardsDir, `pr-${prefix}-${g}.json`)
    if (!fs.existsSync(file)) continue
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'))
    standards[`${prefix}-${g}`] = rows
      .filter(r => r.code.split('.').length === 3)
      .map(r => ({ code: r.code, domain: r.domain, text: r.expectation }))
  }
}
fs.writeFileSync(path.join(root, 'server/depr-standards.json'), JSON.stringify(standards))
console.log('depr-standards.json:', Object.keys(standards).length, 'subject-grade sets')

// 2. Lesson → standard codes, from Athenas lesson detail
const base = (process.env.ATHENAS_BASE_URL || process.env.ATHENAS_API_BASE || 'https://athenasapi-dev.genialskillsweb.com').replace(/\/+$/, '')
const key = process.env.ATHENAS_API_KEY
if (!key) throw new Error('ATHENAS_API_KEY is required')

const SUBJECT_TO_PREFIX = {
  'mat-sp': 'mat', 'mat-en': 'mat', 'a1-sp': 'mat', 'geo-sp': 'mat',
  sp: 'esp', en: 'ing', 'sci-so': 'est',
  'sci-sp': 'cie', 'sci-en': 'cie', 'bi-sp': 'cie', 'qu-sp': 'cie', 'fi-sp': 'cie',
}

const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'server/catalog-snapshot.json'), 'utf8'))
const jobs = []
for (const [combo, rows] of Object.entries(snapshot)) {
  if (combo === '_meta') continue
  const [subjectCode] = combo.split('/')
  for (const r of rows) jobs.push({ id: r.id, prefix: SUBJECT_TO_PREFIX[subjectCode] })
}

const lessons = {}
const domains = {}
let done = 0
async function worker() {
  while (jobs.length) {
    const job = jobs.shift()
    try {
      const r = await fetch(`${base}/api/lessons/lesson/`, {
        method: 'POST',
        headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ LessonId: job.id, AddLessonNo: true, OnlyPublishedQuizzes: true, ExamType: '1' }),
      })
      if (r.ok) {
        const m = (await r.json()).LessonModifierRequestModel || {}
        const codes = []
        for (const c of m.ConstructedCodeHandleModelList || []) {
          const code = c.ConstructedFullCode || c.ConstructedCodeFull || c.MainCode
          if (!code) continue
          codes.push(code)
          // The first non-grade part of the code description is the domain name.
          const domainPart = (c.ConstructedCodeCodeModels || []).find(p => String(p.CodeTypeId) !== '3')
          const domain = code.split('.')[1]
          if (job.prefix && domain && domainPart?.CodeDescription) {
            domains[job.prefix] ??= {}
            domains[job.prefix][domain] ??= domainPart.CodeDescription.trim()
          }
        }
        if (codes.length) lessons[job.id] = [...new Set(codes)]
      }
    } catch (err) {
      console.warn('lesson', job.id, err.message)
    }
    done += 1
    if (done % 200 === 0) console.log(done, 'lessons processed')
  }
}
await Promise.all(Array.from({ length: 8 }, worker))
fs.writeFileSync(path.join(root, 'server/lesson-standards.json'), JSON.stringify({ lessons, domains }))
console.log('lesson-standards.json:', Object.keys(lessons).length, 'lessons with standards of', done)
