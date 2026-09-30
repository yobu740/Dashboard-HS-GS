// Family state: parent, students (each with onboarding profile + AI plan) and
// lesson progress. Persisted in localStorage — this prototype has no backend DB.
import { useCallback, useEffect, useState } from 'react'
import { buildSchedule } from '../../shared/scheduler.js'

const STORAGE_KEY = 'gs_homeschool_v2'

const EMPTY = { parentName: '', students: [], progress: {} }

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
  } catch {
    return EMPTY
  }
}

export const STUDENT_COLORS = ['#f97316', '#0ea5e9', '#a855f7', '#10b981', '#ec4899', '#eab308']

export function newId() {
  return Math.random().toString(36).slice(2, 10)
}

/** Progress is keyed by lesson id (so it survives rescheduling) or session id for reviews. */
export function progressKey(session) {
  return session.lessonId ? `lesson:${session.lessonId}` : session.id
}

export function rescheduledPlan(plan) {
  const { sessions, quotas } = buildSchedule(plan.subjects, plan.settings)
  return {
    ...plan,
    sessions,
    subjects: plan.subjects.map((s, i) => ({ ...s, sessionsPerWeek: quotas[i] })),
  }
}

export function useFamilyStore() {
  const [state, setState] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* storage full or blocked */ }
  }, [state])

  const setParentName = useCallback(name => setState(s => ({ ...s, parentName: name })), [])

  const upsertStudent = useCallback(student => setState(s => {
    const exists = s.students.some(x => x.id === student.id)
    return {
      ...s,
      students: exists ? s.students.map(x => (x.id === student.id ? student : x)) : [...s.students, student],
    }
  }), [])

  const removeStudent = useCallback(id => setState(s => {
    const progress = { ...s.progress }
    delete progress[id]
    return { ...s, students: s.students.filter(x => x.id !== id), progress }
  }), [])

  const updatePlan = useCallback((studentId, updater) => setState(s => ({
    ...s,
    students: s.students.map(x => (x.id === studentId ? { ...x, plan: updater(x.plan) } : x)),
  })), [])

  const toggleDone = useCallback((studentId, session) => setState(s => {
    const key = progressKey(session)
    const mine = { ...(s.progress[studentId] || {}) }
    if (mine[key]) delete mine[key]
    else mine[key] = new Date().toISOString()
    return { ...s, progress: { ...s.progress, [studentId]: mine } }
  }), [])

  const reset = useCallback(() => setState(EMPTY), [])

  return { state, setParentName, upsertStudent, removeStudent, updatePlan, toggleDone, reset }
}
