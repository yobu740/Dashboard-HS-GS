// Editable study plan: change weekly rhythm, drop lessons, regenerate with AI
// or redo the onboarding questions. Every edit re-runs the scheduler.
import { useState } from 'react'
import { Loader2, MessageSquareText, RefreshCw } from 'lucide-react'
import { gradeLabel } from '../../../shared/subjects.js'
import { generatePlan } from '../api.js'
import { rescheduledPlan } from '../store.js'
import PlanView from '../PlanView.jsx'
import StudentPills from '../StudentPills.jsx'
import { SecondaryButton } from '../ui.jsx'

export default function PlanSection({ state, store, activeStudent: student, setActiveStudentId, doneKeysByStudent, openSession, startOnboarding }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const edit = updater => store.updatePlan(student.id, plan => rescheduledPlan(updater(plan)))

  const removeLesson = (subjectKey, lessonId) => edit(plan => ({
    ...plan,
    subjects: plan.subjects.map(s => (s.key === subjectKey ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) } : s)),
  }))

  const changeFrequency = (subjectKey, delta) => edit(plan => ({
    ...plan,
    subjects: plan.subjects.map(s => (s.key === subjectKey ? { ...s, sessionsPerWeek: Math.max(1, s.sessionsPerWeek + delta) } : s)),
  }))

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
    <div className="mx-auto max-w-5xl">
      <StudentPills students={state.students} activeId={student.id} onChange={setActiveStudentId} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Plan de estudio de {student.name}</h1>
          <p className="mt-1 text-slate-600">
            {gradeLabel(student.level)} · {student.plan.settings.weeks} semanas desde {student.plan.settings.startDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={() => startOnboarding(student)}>
            <MessageSquareText className="h-4 w-4" /> Cambiar respuestas
          </SecondaryButton>
          <SecondaryButton onClick={regenerate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {busy ? 'Generando…' : 'Nueva versión con IA'}
          </SecondaryButton>
        </div>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <p className="mb-4 text-sm text-slate-500">Usa − / + para cambiar cuántas sesiones por semana tiene cada materia. Pasa el cursor sobre una lección para quitarla. El calendario se reorganiza solo.</p>
      <PlanView
        plan={student.plan}
        childLevel={student.level}
        editable
        doneKeys={doneKeysByStudent[student.id]}
        onRemoveLesson={removeLesson}
        onChangeFrequency={changeFrequency}
        onOpenLesson={s => openSession(s, student.id)}
      />
    </div>
  )
}
