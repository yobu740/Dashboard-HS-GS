// Planificación → "Plan de estudio con IA": a card on the original "Gestión
// Académica" page, and the plan view it opens (editable sequence, calendar
// rhythm, optional DEPR curriculum tracking).
import { useState } from 'react'
import { ArrowLeft, Landmark, Loader2, MessageSquareText, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { gradeLabel } from '../../shared/subjects.js'
import { generatePlan } from './api.js'
import { rescheduledPlan } from './store.js'
import PlanView from './PlanView.jsx'
import DeprPanel from './DeprPanel.jsx'

export function AIPlanCard({ students, doneKeysByStudent, onOpenPlan, onCreate }) {
  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <span>Plan de estudio con IA</span>
          <Badge className="bg-violet-600">Nuevo</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-gray-600">
          Responde unas preguntas sobre tu hijo(a) y la IA arma un plan con lecciones reales de Genial Skills: cada lección con su práctica y su examen,
          repasos de destrezas y, si quieres, alineado a los estándares del Departamento de Educación.
        </p>
        {students.length > 0 ? (
          <div className="space-y-2">
            {students.map(s => {
              const lessons = s.plan.subjects.flatMap(x => x.lessons)
              const done = lessons.filter(l => doneKeysByStudent[s.id]?.has(`lesson:${l.id}:exam`)).length
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full font-semibold text-white" style={{ backgroundColor: s.color }}>{s.name.charAt(0)}</span>
                    <div>
                      <p className="font-medium">{s.name} · {gradeLabel(s.level)}</p>
                      <p className="text-xs text-gray-600">{lessons.length} lecciones · {done} completadas · {s.plan.settings.weeks} semanas{s.profile?.depr ? ' · DEPR' : ''}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onOpenPlan(s.id)}>Ver plan</Button>
                </div>
              )
            })}
            <Button variant="outline" size="sm" className="w-full" onClick={() => onCreate(null)}><Plus className="mr-1 h-4 w-4" /> Plan para otro estudiante</Button>
          </div>
        ) : (
          <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={() => onCreate(null)}>
            <Sparkles className="mr-2 h-4 w-4" /> Crear plan con IA
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function AIPlanning({ students, studentId, setStudentId, store, doneKeysByStudent, openSession, onEditAnswers, onBack }) {
  const student = students.find(s => s.id === studentId) || students[0]
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const edit = updater => store.updatePlan(student.id, plan => rescheduledPlan(updater(plan)))
  const removeLesson = (key, id) => edit(plan => ({ ...plan, subjects: plan.subjects.map(s => (s.key === key ? { ...s, lessons: s.lessons.filter(l => l.id !== id) } : s)) }))
  const changeFrequency = (key, delta) => edit(plan => ({ ...plan, subjects: plan.subjects.map(s => (s.key === key ? { ...s, sessionsPerWeek: Math.max(1, s.sessionsPerWeek + delta) } : s)) }))
  const setDepr = on => store.upsertStudent({ ...student, profile: { ...student.profile, depr: on } })

  const regenerate = async () => {
    if (!window.confirm(`¿Generar una nueva versión del plan de ${student.name}? Reemplaza el plan actual (el progreso marcado se conserva).`)) return
    setBusy(true)
    setError('')
    try {
      const plan = await generatePlan(student.profile)
      store.updatePlan(student.id, () => plan)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2"><ArrowLeft className="mr-1 h-4 w-4" /> Gestión Académica</Button>
          <h1 className="mb-1 text-3xl font-bold text-gray-900">Plan de estudio de {student.name}</h1>
          <p className="text-gray-600">{gradeLabel(student.level)} · {student.plan.settings.weeks} semanas desde {student.plan.settings.startDate}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {students.length > 1 && (
            <select value={student.id} onChange={e => setStudentId(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <Button variant="outline" onClick={() => onEditAnswers(student)}><MessageSquareText className="mr-2 h-4 w-4" /> Cambiar respuestas</Button>
          <Button variant="outline" onClick={regenerate} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {busy ? 'Generando…' : 'Nueva versión con IA'}
          </Button>
        </div>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="font-medium text-gray-900">Seguir el currículo del Departamento de Educación (DEPR)</p>
              <p className="text-sm text-gray-600">Muestra qué expectativas de grado cubre el plan y cuáles ya se completaron. Al generar una nueva versión, la IA prioriza cubrirlas.</p>
            </div>
          </div>
          <Switch checked={!!student.profile?.depr} onCheckedChange={setDepr} aria-label="Seguir el currículo del DEPR" />
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500">Usa − / + para cambiar cuántas sesiones por semana tiene cada materia; pasa el cursor sobre una lección para quitarla. El calendario se reorganiza solo.</p>
      <PlanView
        plan={student.plan}
        childLevel={student.level}
        editable
        doneKeys={doneKeysByStudent[student.id]}
        onRemoveLesson={removeLesson}
        onChangeFrequency={changeFrequency}
        onOpenLesson={s => openSession(s, student.id)}
      />
      {student.profile?.depr && <DeprPanel plan={student.plan} doneKeys={doneKeysByStudent[student.id]} gradeName={gradeLabel(student.level)} />}
    </div>
  )
}
