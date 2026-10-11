// Catálogo — the published Genial Skills (Athenas) lessons. Filter by the
// subjects that have lessons, grade and text; assign a lesson to a child's
// plan (its learn → practice → exam sessions are scheduled automatically).
import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, Landmark, Loader2, Plus, Search } from 'lucide-react'
import { GRADES, SUBJECT_KEYS, gradeLabel } from '../../../shared/subjects.js'
import { fetchCatalog } from '../api.js'
import { rescheduledPlan } from '../store.js'
import { SubjectIcon } from '../brand/BrandIcon.jsx'
import { Button, PageHeader, Panel, subjectMeta } from '../ui.jsx'

export default function Catalog({ students, updatePlan, openSession }) {
  const [targetId, setTargetId] = useState(students[0]?.id || '')
  const target = students.find(s => s.id === targetId)
  const [subject, setSubject] = useState(target?.plan.subjects[0]?.key || 'math')
  const [level, setLevel] = useState(target?.level || '3')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [justAdded, setJustAdded] = useState(null)

  useEffect(() => { if (target) setLevel(target.level) }, [targetId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true
    setResult(null)
    setError('')
    fetchCatalog({ level, subject, language: target?.language })
      .then(r => alive && setResult(r))
      .catch(err => alive && setError(err.message))
    return () => { alive = false }
  }, [level, subject, target?.language])

  const inPlan = useMemo(() => new Set(target?.plan.subjects.flatMap(s => s.lessons.map(l => String(l.id))) || []), [target])
  const lessons = (result?.lessons || []).filter(l => !query || l.title.toLowerCase().includes(query.toLowerCase()) || String(l.id) === query.trim())
  const meta = subjectMeta(subject)

  const assign = lesson => {
    updatePlan(target.id, plan => {
      const entry = { id: lesson.id, title: lesson.title, levelCode: lesson.levelCode, subjectCode: lesson.subjectCode, standards: lesson.standards || [] }
      const exists = plan.subjects.some(s => s.key === subject)
      const subjects = exists
        ? plan.subjects.map(s => (s.key === subject ? { ...s, lessons: [...s.lessons, entry] } : s))
        : [...plan.subjects, { key: subject, name: meta.name, color: meta.color, athenasCode: lesson.subjectCode, sessionsPerWeek: 2, focus: 'Materia añadida desde el catálogo.', rationale: 'Lecciones elegidas por la familia.', lessons: [entry] }]
      return rescheduledPlan({ ...plan, subjects })
    })
    setJustAdded(lesson.id)
  }

  return (
    <>
      <PageHeader
        eyebrow="Biblioteca"
        title="Catálogo de lecciones"
        subtitle="Lecciones publicadas de Genial Skills. Asigna cualquiera al plan y se agenda con su práctica y su examen."
        actions={students.length > 0 && (
          <label className="flex items-center gap-2 rounded-full border border-sand bg-white py-1.5 pr-2 pl-4 text-sm font-bold text-slate-500">
            Asignar a
            <select value={targetId} onChange={e => setTargetId(e.target.value)} className="rounded-full bg-cream px-3 py-1.5 font-bold text-navy focus:outline-none">
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}
      />

      <Panel className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {SUBJECT_KEYS.map(k => {
            const m = subjectMeta(k)
            const on = subject === k
            return (
              <button key={k} type="button" onClick={() => setSubject(k)} aria-pressed={on} className={`flex items-center gap-2 rounded-2xl border-2 py-1.5 pr-4 pl-1.5 text-sm font-bold transition-all ${on ? 'text-white shadow-md' : 'border-sand bg-white text-navy hover:border-gold'}`} style={on ? { backgroundColor: m.color, borderColor: m.color } : undefined}>
                <span className={`rounded-xl ${on ? 'bg-white' : ''}`}><SubjectIcon subject={k} size={30} /></span>
                {m.name}
              </button>
            )
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
          <select value={level} onChange={e => setLevel(e.target.value)} className="h-11 rounded-full border border-sand bg-white px-4 font-bold text-navy focus:border-gold focus:outline-none" aria-label="Grado">
            {GRADES.map(g => <option key={g} value={g}>{gradeLabel(g)}{target && g === target.level ? ` · ${target.name}` : ''}</option>)}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por título o número de lección" className="h-11 w-full rounded-full border border-sand bg-white pr-4 pl-11 text-navy placeholder:text-slate-400 focus:border-gold focus:outline-none" />
          </div>
        </div>
      </Panel>

      {!result && !error && <p className="flex items-center gap-2 py-10 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Cargando lecciones…</p>}
      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {result && (
        <>
          <p className="mb-4 text-sm font-bold text-slate-500">{lessons.length} lecciones de {meta.name} · {gradeLabel(level)}</p>
          {!lessons.length && <Panel className="p-10 text-center text-slate-500">No hay lecciones publicadas para esta combinación.</Panel>}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {lessons.slice(0, 80).map(l => {
              const added = inPlan.has(String(l.id))
              return (
                <Panel key={l.id} as="article" className="group flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="relative flex h-28 items-center justify-between overflow-hidden px-5" style={{ backgroundColor: meta.soft }}>
                    <span className="font-display text-4xl font-semibold opacity-15" style={{ color: meta.color }}>#{l.no || l.id}</span>
                    <SubjectIcon subject={subject} size={58} className="transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg leading-snug font-semibold text-navy">{l.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-extrabold">
                      <span className="rounded-full bg-cream px-2.5 py-1 text-slate-600">{gradeLabel(l.levelCode)}</span>
                      {l.standards?.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#e9edfc] px-2.5 py-1 text-[#3449b8]"><Landmark className="h-3 w-3" /> {l.standards.length} {l.standards.length === 1 ? 'expectativa' : 'expectativas'} DEPR</span>}
                    </div>
                    <div className="mt-auto flex gap-2 pt-5">
                      <Button size="sm" className="flex-1" onClick={() => openSession({ lessonId: l.id, title: l.title, subjectKey: subject, levelCode: l.levelCode }, target?.id)}><Eye className="h-4 w-4" /> Vista previa</Button>
                      {target && (
                        <Button size="sm" variant={added ? 'secondary' : 'dark'} className="flex-1" disabled={added} onClick={() => assign(l)}>
                          {added ? <><Check className="h-4 w-4" /> {justAdded === l.id ? 'Añadida' : 'En el plan'}</> : <><Plus className="h-4 w-4" /> Asignar</>}
                        </Button>
                      )}
                    </div>
                  </div>
                </Panel>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
