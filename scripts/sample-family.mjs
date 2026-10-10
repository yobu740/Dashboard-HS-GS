// Builds a sample family (two students with real AI plans and some progress)
// for visual QA. Writes JSON to the path given, to load into localStorage
// under "gs_homeschool_v2".
//
//   node --env-file=.env.local scripts/sample-family.mjs out.json
import fs from 'node:fs'
import { generatePlan } from '../server/planner.js'
import { plannerProfile } from '../shared/profile.js'

const out = process.argv[2]
if (!out) throw new Error('Pass the output path.')

const today = new Date()
const monday = new Date(today)
monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7)
const start = monday.toISOString().slice(0, 10)
const base = o => plannerProfile({ learningStyles: [], goals: [], notes: '', approach: null, interests: [], ...o })

const sofia = base({
  mode: 'homeschool', depr: true, interests: ['Animales', 'Espacio'],
  child: { name: 'Sofía', age: 8, level: '3', language: 'es' },
  subjects: ['math', 'spanish', 'english', 'science'].map((key, i) => ({ key, support: i === 0 ? 'refuerzo' : 'al-dia', skills: '' })),
  schedule: { startDate: start, weeks: 9, days: [1, 2, 3, 4, 5], startTime: '09:00', minutesPerDay: 180, minutesPerLesson: 40, breakMinutes: 10 },
})
const mateo = base({
  mode: 'refuerzo', depr: false,
  child: { name: 'Mateo', age: 10, level: '5', language: 'es' },
  subjects: [{ key: 'math', support: 'refuerzo', skills: 'fracciones' }, { key: 'spanish', support: 'refuerzo', skills: 'comprensión lectora' }],
  schedule: { startDate: start, weeks: 9, days: [1, 3, 4], startTime: null, minutesPerDay: 45, minutesPerLesson: null, breakMinutes: 10 },
})

const [a, b] = await Promise.all([generatePlan(sofia), generatePlan(mateo)])
const todayIso = today.toISOString().slice(0, 10)
const key = s => (s.lessonId && s.kind !== 'review' ? `lesson:${s.lessonId}:${s.kind}` : s.id)
const progress = plan => Object.fromEntries(plan.sessions.filter(s => s.date < todayIso).slice(0, 18).map(s => [key(s), new Date(`${s.date}T15:00:00`).toISOString()]))

fs.writeFileSync(out, JSON.stringify({
  parentName: 'Brian',
  students: [
    { id: 's1', name: 'Sofía', age: 8, level: '3', language: 'es', color: '#f47d45', profile: sofia, plan: a },
    { id: 's2', name: 'Mateo', age: 10, level: '5', language: 'es', color: '#4662e5', profile: mateo, plan: b },
  ],
  progress: { s1: progress(a), s2: progress(b) },
}))
console.log('plans:', a.source, b.source, '| tip:', a.tips?.[0])
