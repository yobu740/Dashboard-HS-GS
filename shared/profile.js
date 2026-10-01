// The planning profile the onboarding chat fills in, shared by the server
// (chat engine, planner) and the browser (chat sidebar).
//
// Two paths:
//   homeschool → the child studies at home; the plan covers whole subjects.
//   refuerzo   → the child goes to school (or homeschools) and the family wants
//                reinforcement in some subjects or specific skills.
// The code, not the model, decides which fields are still missing.

import { GRADES, SUBJECTS, gradeLabel } from './subjects.js'
import { toISODate, WEEKDAY_SHORT } from './scheduler.js'

export const MODES = {
  homeschool: 'Educación en el hogar (plan completo)',
  refuerzo: 'Refuerzo de materias o destrezas',
}

export const SUPPORT_LEVELS = ['refuerzo', 'al-dia', 'avanzado']

function nextMonday() {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7))
  return toISODate(d)
}

export function emptyProfile() {
  return {
    mode: null,
    child: { name: null, age: null, level: null, language: 'es' },
    subjects: [],
    learningStyles: [],
    interests: [],
    goals: [],
    approach: null,
    notes: '',
    depr: null,
    schedule: { startDate: nextMonday(), weeks: null, days: [], startTime: null, minutesPerDay: null, minutesPerLesson: null, breakMinutes: 10 },
  }
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
const uniq = list => [...new Set(list.filter(Boolean).map(x => String(x).trim()).filter(Boolean))]

/** Apply validated updates (from the model or the scripted engine) to a profile. */
export function mergeProfile(profile, u = {}) {
  const p = structuredClone(profile)
  if (u.mode && MODES[u.mode]) p.mode = u.mode
  if (u.childName) p.child.name = String(u.childName).trim().slice(0, 40)
  if (Number.isFinite(u.age)) p.child.age = clamp(Math.round(u.age), 3, 19)
  if (u.grade && GRADES.includes(String(u.grade).toLowerCase())) p.child.level = String(u.grade).toLowerCase()
  if (['es', 'en', 'bi'].includes(u.language)) p.child.language = u.language
  if (Array.isArray(u.subjects) && u.subjects.length) {
    const incoming = u.subjects.filter(s => SUBJECTS[s?.key]).map(s => ({
      key: s.key,
      support: SUPPORT_LEVELS.includes(s.support) ? s.support : (p.mode === 'refuerzo' ? 'refuerzo' : 'al-dia'),
      skills: s.skills ? String(s.skills).trim().slice(0, 200) : '',
    }))
    if (u.replaceSubjects) p.subjects = incoming
    else {
      for (const s of incoming) {
        const existing = p.subjects.find(x => x.key === s.key)
        if (existing) Object.assign(existing, { support: s.support, skills: s.skills || existing.skills })
        else p.subjects.push(s)
      }
    }
  }
  if (Array.isArray(u.removeSubjects)) p.subjects = p.subjects.filter(s => !u.removeSubjects.includes(s.key))
  if (Array.isArray(u.interests)) p.interests = uniq([...p.interests, ...u.interests]).slice(0, 12)
  if (Array.isArray(u.learningStyles)) p.learningStyles = uniq([...p.learningStyles, ...u.learningStyles]).slice(0, 6)
  if (Array.isArray(u.goals)) p.goals = uniq([...p.goals, ...u.goals]).slice(0, 6)
  if (['estructurado', 'mixto', 'flexible'].includes(u.approach)) p.approach = u.approach
  if (typeof u.depr === 'boolean') p.depr = u.depr
  if (Array.isArray(u.days)) {
    const days = uniq(u.days.map(Number).filter(d => d >= 0 && d <= 6)).map(Number)
    if (days.length) p.schedule.days = days.sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  }
  if (Number.isFinite(u.minutesPerDay)) p.schedule.minutesPerDay = clamp(Math.round(u.minutesPerDay), 20, 360)
  if (Number.isFinite(u.minutesPerLesson)) p.schedule.minutesPerLesson = clamp(Math.round(u.minutesPerLesson), 15, 60)
  if (u.startTime && /^\d{1,2}:\d{2}$/.test(u.startTime)) p.schedule.startTime = u.startTime.padStart(5, '0')
  if (u.startDate && /^\d{4}-\d{2}-\d{2}$/.test(u.startDate)) p.schedule.startDate = u.startDate
  if (Number.isFinite(u.weeks)) p.schedule.weeks = clamp(Math.round(u.weeks), 2, 40)
  if (u.notes) p.notes = [p.notes, String(u.notes).trim()].filter(Boolean).join(' ').slice(-1200)
  return p
}

/** Fields still needed before a plan can be generated, in the order to ask. */
export function missingFields(p) {
  const missing = []
  if (!p.mode) missing.push('mode')
  if (!p.child.name) missing.push('childName')
  if (!p.child.level) missing.push('grade')
  if (!p.subjects.length) missing.push('subjects')
  if (p.mode === 'refuerzo' && p.subjects.length && !p.subjects.some(s => s.skills)) missing.push('skills')
  if (p.mode === 'homeschool' && p.depr === null) missing.push('depr')
  if (!p.schedule.days.length) missing.push('days')
  if (!p.schedule.minutesPerDay) missing.push('minutesPerDay')
  if (!p.schedule.weeks) missing.push('weeks')
  return missing
}

/** Profile ready for the planner, with defaults that depend on the path. */
export function plannerProfile(p) {
  const refuerzo = p.mode === 'refuerzo'
  const minutesPerLesson = p.schedule.minutesPerLesson || (refuerzo ? 30 : 40)
  return {
    ...p,
    approach: p.approach || (refuerzo ? 'flexible' : 'mixto'),
    depr: !!p.depr,
    schedule: {
      ...p.schedule,
      startTime: p.schedule.startTime || (refuerzo ? '15:30' : '09:00'),
      minutesPerLesson: Math.min(minutesPerLesson, p.schedule.minutesPerDay || minutesPerLesson),
    },
  }
}

/** Human-readable checklist for the chat sidebar. */
export function profileSummary(p) {
  const s = p.schedule
  return [
    { label: 'Tipo de plan', value: p.mode ? MODES[p.mode] : null },
    { label: 'Estudiante', value: p.child.name ? `${p.child.name}${p.child.age ? `, ${p.child.age} años` : ''}` : null },
    { label: 'Grado', value: p.child.level ? gradeLabel(p.child.level) : null },
    {
      label: 'Materias',
      value: p.subjects.length
        ? p.subjects.map(x => `${SUBJECTS[x.key].name}${x.skills ? ` (${x.skills})` : x.support === 'refuerzo' ? ' (refuerzo)' : x.support === 'avanzado' ? ' (avanzado)' : ''}`).join(' · ')
        : null,
    },
    { label: 'Intereses', value: p.interests.length ? p.interests.join(', ') : null, optional: true },
    { label: 'Currículo DEPR', value: p.depr === null ? null : p.depr ? 'Sí, alinear' : 'No', optional: p.mode !== 'homeschool' },
    { label: 'Días', value: s.days.length ? s.days.map(d => WEEKDAY_SHORT[d]).join(', ') : null },
    { label: 'Tiempo al día', value: s.minutesPerDay ? `${s.minutesPerDay} min` : null },
    { label: 'Duración', value: s.weeks ? `${s.weeks} semanas` : null },
  ]
}
