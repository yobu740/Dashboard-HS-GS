// Planificación — the study plan of each child: sequence of real lessons
// (learn → practice → exam), weekly rhythm, optional DEPR tracking, and the
// ways to change it (− / + per subject, remove lessons, ask Lecturina, new AI
// version). Replaces the old mock planning screens.
import { useState } from 'react'
import { Landmark, Loader2, MessageCircle, RefreshCw } from 'lucide-react'
import { Switch } from '@/components/ui/switch.jsx'
import { gradeLabel } from '../../../shared/subjects.js'
import { generatePlan } from '../api.js'
import { rescheduledPlan } from '../store.js'
import PlanView from '../PlanView.jsx'
import DeprPanel from '../DeprPanel.jsx'
import { Button, EmptyState, PageHeader, Panel, StudentTabs } from '../ui.jsx'

export default function Planning({ students, studentId, setStudentId, store, doneKeysByStudent, openSession, onChat, onAdd }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const student = students.find(s => s.id === studentId) || students[0]

  if (!student) {
    return (
      <>
        <PageHeader eyebrow="Plan de estudio" title="Planificación" />
        <EmptyState title="Creemos el primer plan" text="Lecturina te hace unas preguntas y arma un plan con lecciones de Genial Skills, práctica, exámenes y repasos." actionLabel="Comenzar con Lecturina" onAction={onAdd} />
      </>
    )
  }

  const edit = updater => store.updatePlan(student.id, plan => rescheduledPlan(updater(plan)))
  const removeLesson = (key, id) => edit(plan => ({ ...plan, subjects: plan.subjects.map(s => (s.key === key ? { ...s, lessons: s.lessons.filter(l => l.id !== id) } : s)) }))
  const changeFrequency = (key, delta) => edit(plan => ({ ...plan, subjects: plan.subjects.map(s => (s.key === key ? { ...s, sessionsPerWeek: Math.max(1, s.sessionsPerWeek + delta) } : s)) }))
  const setDepr = on => store.upsertStudent({ ...student, profile: { ...student.profile, depr: on } })

  const regenerate = async () => {
    if (!window.confirm(`¿Crear una nueva versión del plan de ${student.name}? Reemplaza el plan actual; el progreso marcado se conserva.`)) return
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
    <>
      <PageHeader
        eyebrow="Plan de estudio"
        title={`El plan de ${student.name}`}
        subtitle={`${gradeLabel(student.level)} · ${student.plan.mode === 'refuerzo' ? 'Refuerzo' : 'Homeschool'} · ${student.plan.settings.weeks} semanas desde el ${new Date(`${student.plan.settings.startDate}T00:00`).toLocaleDateString('es-PR', { day: 'numeric', month: 'long' })}`}
        actions={(
          <>
            <Button variant="primary" onClick={() => onChat(student)}><MessageCircle className="h-4 w-4" /> Ajustar con Lecturina</Button>
            <Button onClick={regenerate} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} {busy ? 'Creando…' : 'Nueva versión'}</Button>
          </>
        )}
      />
      <StudentTabs students={students} activeId={student.id} onChange={setStudentId} />
      {error && <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <Panel className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e9edfc] text-[#3449b8]"><Landmark className="h-5 w-5" /></span>
          <div>
            <p className="font-bold text-navy">Seguir el currículo del Departamento de Educación</p>
            <p className="text-sm text-slate-500">Muestra qué expectativas del grado cubre el plan. Al crear una nueva versión, Lecturina las prioriza.</p>
          </div>
        </div>
        <Switch checked={!!student.profile?.depr} onCheckedChange={setDepr} aria-label="Seguir el currículo del DEPR" />
      </Panel>

      <div className="space-y-8">
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
    </>
  )
}
