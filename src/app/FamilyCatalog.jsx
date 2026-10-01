// "Catálogo de lecciones" of the original dashboard with the real Athenas
// catalogue. The original filter sidebar drives the query (materia × grado);
// "Asignar Lección" adds the lesson to a student's plan (learn → practice →
// exam are scheduled automatically) and "Vista Previa" opens its detail.
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import CatalogFilters from '../CatalogFilters.jsx'
import { SUBJECTS, gradeLabel } from '../../shared/subjects.js'
import { fetchCatalog } from './api.js'
import { rescheduledPlan } from './store.js'

const FILTER_SUBJECTS = { English: 'english', Español: 'spanish', Matemáticas: 'math', Ciencias: 'science', 'Estudios Sociales': 'social' }
const FILTER_GRADES = {
  Kinder: 'k', '1er Grado': '1', '2do Grado': '2', '3er Grado': '3', '4to Grado': '4', '5to Grado': '5', '6to Grado': '6',
  '7mo Grado': '7', '8vo Grado': '8', '9no Grado': '9', '10mo Grado': '10', '11mo Grado': '11', '12mo Grado': '12',
}

export default function FamilyCatalog({ students, updatePlan, openSession }) {
  const [filters, setFilters] = useState({ materias: [], grados: [] })
  const [targetId, setTargetId] = useState(students[0]?.id || '')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const target = students.find(s => s.id === targetId)

  // Default query: the selected student's grade and plan subjects (or 3rd grade, all subjects).
  const query = useMemo(() => {
    const subjects = filters.materias.map(m => FILTER_SUBJECTS[m]).filter(Boolean)
    const grades = filters.grados.map(g => FILTER_GRADES[g]).filter(Boolean)
    return {
      subjects: subjects.length ? subjects : target ? target.plan.subjects.map(s => s.key) : Object.keys(SUBJECTS),
      grades: grades.length ? grades : [target?.level || '3'],
      language: target?.language || 'es',
    }
  }, [filters, target])

  useEffect(() => {
    let alive = true
    setResults(null)
    setError('')
    const pairs = query.grades.flatMap(level => query.subjects.map(subject => ({ level, subject }))).slice(0, 12)
    Promise.all(pairs.map(p => fetchCatalog({ ...p, language: query.language }).then(r => r.lessons.map(l => ({ ...l, subjectKey: p.subject }))).catch(() => [])))
      .then(lists => alive && setResults(lists.flat()))
      .catch(err => alive && setError(err.message))
    return () => { alive = false }
  }, [query])

  const inPlan = useMemo(() => new Set(target?.plan.subjects.flatMap(s => s.lessons.map(l => String(l.id))) || []), [target])

  const assign = lesson => updatePlan(target.id, plan => {
    const meta = SUBJECTS[lesson.subjectKey]
    const entry = { id: lesson.id, title: lesson.title, levelCode: lesson.levelCode, subjectCode: lesson.subjectCode, standards: lesson.standards || [] }
    const exists = plan.subjects.some(s => s.key === lesson.subjectKey)
    const subjects = exists
      ? plan.subjects.map(s => (s.key === lesson.subjectKey ? { ...s, lessons: [...s.lessons, entry] } : s))
      : [...plan.subjects, {
          key: lesson.subjectKey, name: meta.name, color: meta.color, emoji: meta.emoji, athenasCode: lesson.subjectCode,
          sessionsPerWeek: 2, focus: 'Materia añadida desde el catálogo.', rationale: 'Lecciones elegidas por la familia.', lessons: [entry],
        }]
    return rescheduledPlan({ ...plan, subjects })
  })

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de lecciones</h1>
          <p className="text-gray-600">Lecciones publicadas de Genial Skills (Athenas)</p>
        </div>
        {students.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Asignar a:
            <select value={targetId} onChange={e => setTargetId(e.target.value)} className="rounded border px-2 py-1">
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({gradeLabel(s.level)})</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <CatalogFilters onFiltersChange={f => setFilters({ materias: f.materias, grados: f.grados })} />
          <p className="mt-2 text-xs text-gray-500">Sin filtros se muestran las materias y el grado de {target?.name || '3er grado'}.</p>
        </div>

        <div className="lg:col-span-3">
          {!results && !error && <p className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando lecciones…</p>}
          {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {results && (
            <>
              <p className="mb-3 text-sm text-gray-500">{results.length} lecciones</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.slice(0, 60).map(lesson => {
                  const meta = SUBJECTS[lesson.subjectKey]
                  const added = inPlan.has(String(lesson.id))
                  return (
                    <Card key={`${lesson.subjectKey}-${lesson.id}`} className="transition-shadow hover:shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="mb-3 h-24 w-full overflow-hidden rounded-lg">
                          <img src="/catalog-default.jpg" alt="" className="h-full w-full object-cover" />
                        </div>
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{meta.name}</Badge>
                          <Badge variant="outline" className="text-xs">{gradeLabel(lesson.levelCode)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 space-y-2">
                          <div className="flex justify-between text-sm"><span className="text-gray-600">Sesiones:</span><span>Aprender, práctica y examen</span></div>
                          <div className="flex justify-between text-sm"><span className="text-gray-600">Lección:</span><span className="font-mono text-xs">#{lesson.id}</span></div>
                        </div>
                        <div className="space-y-2">
                          <Button className="w-full" size="sm" disabled={!target || added} onClick={() => assign(lesson)}>
                            {added ? <><Check className="mr-1 h-4 w-4" /> En el plan de {target.name}</> : 'Asignar Lección'}
                          </Button>
                          <Button variant="outline" className="w-full" size="sm" onClick={() => openSession({ lessonId: lesson.id, title: lesson.title, subjectKey: lesson.subjectKey, levelCode: lesson.levelCode }, target?.id)}>
                            <BookOpen className="mr-1 h-4 w-4" /> Vista Previa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
