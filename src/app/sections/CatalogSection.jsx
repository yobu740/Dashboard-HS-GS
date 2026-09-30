// Browse the real Athenas catalogue for a student's grade and add lessons to
// their plan.
import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Plus, Search } from 'lucide-react'
import { SUBJECTS, SUBJECT_KEYS, GRADES, gradeLabel } from '../../../shared/subjects.js'
import { fetchCatalog } from '../api.js'
import { rescheduledPlan } from '../store.js'
import StudentPills from '../StudentPills.jsx'
import { Chip, inputClass } from '../ui.jsx'

export default function CatalogSection({ state, store, activeStudent: student, setActiveStudentId, openSession }) {
  const [level, setLevel] = useState(student.level)
  const [subject, setSubject] = useState(student.plan.subjects[0]?.key || 'math')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setLevel(student.level) }, [student.id, student.level])

  useEffect(() => {
    let alive = true
    setResult(null)
    setError('')
    fetchCatalog({ level, subject, language: student.language })
      .then(r => alive && setResult(r))
      .catch(err => alive && setError(err.message))
    return () => { alive = false }
  }, [level, subject, student.language])

  const inPlan = useMemo(() => new Set(student.plan.subjects.flatMap(s => s.lessons.map(l => l.id))), [student.plan])
  const lessons = (result?.lessons || []).filter(l => !query || l.title.toLowerCase().includes(query.toLowerCase()) || l.id === query.trim())

  const addToPlan = lesson => store.updatePlan(student.id, plan => {
    const meta = SUBJECTS[subject]
    const entry = { id: lesson.id, title: lesson.title, levelCode: lesson.levelCode, subjectCode: lesson.subjectCode }
    const exists = plan.subjects.some(s => s.key === subject)
    const subjects = exists
      ? plan.subjects.map(s => (s.key === subject ? { ...s, lessons: [...s.lessons, entry] } : s))
      : [...plan.subjects, {
          key: subject, name: meta.name, color: meta.color, emoji: meta.emoji, athenasCode: lesson.subjectCode,
          sessionsPerWeek: 1, focus: 'Materia añadida desde el catálogo.', rationale: 'Lecciones elegidas por la familia.',
          available: result?.lessons.length || 0, lessons: [entry],
        }]
    return rescheduledPlan({ ...plan, subjects })
  })

  return (
    <div className="mx-auto max-w-5xl">
      <StudentPills students={state.students} activeId={student.id} onChange={setActiveStudentId} />
      <h1 className="text-3xl font-bold text-slate-900">Catálogo de lecciones</h1>
      <p className="mt-1 text-slate-600">Lecciones publicadas de Genial Skills. Añade cualquiera al plan de {student.name} y se agenda automáticamente.</p>

      <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap gap-2">
          {SUBJECT_KEYS.map(k => (
            <Chip key={k} color={SUBJECTS[k].color} selected={subject === k} onClick={() => setSubject(k)}>
              {SUBJECTS[k].emoji} {SUBJECTS[k].name}
            </Chip>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <select className={inputClass} value={level} onChange={e => setLevel(e.target.value)} aria-label="Grado">
            {GRADES.map(g => <option key={g} value={g}>{gradeLabel(g)}{g === student.level ? ` (${student.name})` : ''}</option>)}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Buscar por título o ID" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        {!result && !error && <p className="flex items-center gap-2 p-4 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando catálogo…</p>}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {result && (
          <>
            <p className="mb-2 text-sm text-slate-500">
              {lessons.length} lecciones {result.code && <span className="font-mono">({result.code})</span>}
              {result.mode === 'snapshot' && ' · copia local del catálogo'}
            </p>
            {!lessons.length && <p className="rounded-xl bg-white p-6 text-center text-slate-500">No hay lecciones publicadas para esta combinación.</p>}
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {lessons.map(l => {
                const added = inPlan.has(l.id)
                return (
                  <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openSession({ lessonId: l.id, title: l.title, subjectKey: subject, levelCode: l.levelCode }, student.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-slate-800 hover:underline">{l.title}</span>
                      <span className="font-mono text-[11px] text-slate-400">#{l.id}{l.no ? ` · lección ${l.no}` : ''}</span>
                    </button>
                    {added ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" /> En el plan</span>
                    ) : (
                      <button type="button" onClick={() => addToPlan(l)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <Plus className="h-3.5 w-3.5" /> Añadir al plan
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
