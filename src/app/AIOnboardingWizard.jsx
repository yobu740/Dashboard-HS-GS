// Onboarding popup — same shell as the original NewOnboardingWizard (header,
// step indicators, progress bar, skip-with-explanation, ←/→ and ESC), with
// the "Estudiantes" and "Planes" steps replaced by the AI planner questions.
// The last step shows the suggested study plan and calendar.
//
// The plan is requested in the background as soon as the schedule step is
// done, so it is usually ready by the time the family reaches the last step.
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, BookOpen, Calendar, CheckCircle, FileText, Bell, Landmark, Loader2, RefreshCw, Sparkles, Star, Users, X,
} from 'lucide-react'
import { SUBJECTS, SUBJECT_KEYS, GRADES, gradeLabel } from '../../shared/subjects.js'
import { WEEKDAY_LABELS, toISODate, weeklyCapacity, slotsPerDay } from '../../shared/scheduler.js'
import { Step4NotificationsSetup, Step5PortfolioConfig, SkipModal } from '../NewOnboardingSystem.jsx'
import { generatePlan } from './api.js'
import { STUDENT_COLORS, newId } from './store.js'
import PlanView from './PlanView.jsx'
import DeprPanel from './DeprPanel.jsx'

const LEARNING_STYLES = ['Visual (imágenes, videos)', 'Práctico (hacer, experimentar)', 'Auditivo (escuchar, conversar)', 'Lectura y escritura', 'Necesita moverse / pausas']
const INTERESTS = ['Animales', 'Deportes', 'Arte y dibujo', 'Música', 'Tecnología', 'Naturaleza', 'Espacio', 'Cocina', 'Historia', 'Videojuegos', 'Construir cosas', 'Lectura']
const GOALS = ['Cubrir el currículo completo del grado', 'Reforzar las áreas donde tiene dificultad', 'Avanzar a su propio ritmo', 'Prepararse para regresar a la escuela', 'Desarrollar hábitos de estudio', 'Fortalecer el inglés']
const APPROACHES = [
  { id: 'estructurado', title: 'Estructurado', description: 'Horario fijo, todas las materias cada semana.' },
  { id: 'mixto', title: 'Mixto', description: 'Rutina clara con espacio para proyectos.' },
  { id: 'flexible', title: 'Flexible', description: 'Menos carga fija, más tiempo libre.' },
]
const LANGUAGES = [
  { id: 'es', title: 'Español' },
  { id: 'en', title: 'Inglés' },
  { id: 'bi', title: 'Bilingüe' },
]
const SUPPORT = [
  { id: 'refuerzo', label: 'Necesita refuerzo' },
  { id: 'al-dia', label: 'Va al día' },
  { id: 'avanzado', label: 'Está avanzado' },
]
const DURATIONS = [[4, '1 mes'], [9, 'Un trimestre'], [18, 'Un semestre'], [36, 'Año escolar']]

function nextMonday() {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7))
  return toISODate(d)
}

function initialAnswers(student) {
  const p = student?.profile
  if (p) {
    return {
      name: p.child.name, age: p.child.age || '', level: p.child.level, language: p.child.language,
      subjects: Object.fromEntries(p.subjects.map(s => [s.key, s.support])),
      learningStyles: p.learningStyles || [], interests: p.interests || [], goals: p.goals || [],
      approach: p.approach || 'mixto', notes: p.notes || '', depr: p.depr ?? true, schedule: { ...p.schedule },
    }
  }
  return {
    name: '', age: '', level: '', language: 'es',
    subjects: { math: 'al-dia', spanish: 'al-dia', english: 'al-dia', science: 'al-dia', social: 'al-dia' },
    learningStyles: [], interests: [], goals: [], approach: 'mixto', notes: '', depr: true,
    schedule: { startDate: nextMonday(), weeks: 9, days: [1, 2, 3, 4, 5], startTime: '09:00', minutesPerDay: 180, minutesPerLesson: 40, breakMinutes: 10 },
  }
}

function toProfile(a) {
  return {
    child: { name: a.name.trim(), age: a.age ? Number(a.age) : null, level: a.level, language: a.language },
    subjects: SUBJECT_KEYS.filter(k => a.subjects[k]).map(k => ({ key: k, support: a.subjects[k] })),
    learningStyles: a.learningStyles,
    interests: a.interests,
    goals: a.goals,
    approach: a.approach,
    notes: a.notes.trim(),
    depr: a.depr,
    schedule: a.schedule,
  }
}

const toggleIn = (list, value) => (list.includes(value) ? list.filter(x => x !== value) : [...list, value])

function Pill({ selected, onClick, children, color = '#3b82f6' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${selected ? 'border-transparent font-medium text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
      style={selected ? { backgroundColor: color } : undefined}
    >
      {children}
    </button>
  )
}

function StepHeader({ icon: Icon, color, title, subtitle }) {
  return (
    <>
      <Icon className={`mx-auto mb-4 h-16 w-16 ${color}`} />
      <h3 className="mb-2 text-2xl font-semibold">{title}</h3>
      <p className="mb-6 text-gray-600">{subtitle}</p>
    </>
  )
}

function StepButtons({ onSkip, onNext, nextLabel = 'Continuar', disabled }) {
  return (
    <div className="mt-6 flex justify-center gap-4">
      {onSkip && <button type="button" onClick={onSkip} className="px-4 py-2 text-gray-500 hover:text-gray-700">Omitir este paso</button>}
      <button type="button" onClick={onNext} disabled={disabled} className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
        {nextLabel}
      </button>
    </div>
  )
}

const inputClass = 'w-full rounded-md border px-3 py-2'

export default function AIOnboardingWizard({ existingStudent, studentCount = 0, short = false, onSaveStudent, onFinish }) {
  const [answers, setAnswers] = useState(() => initialAnswers(existingStudent))
  const [step, setStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState([])
  const [skippedSteps, setSkippedSteps] = useState([])
  const [skipModal, setSkipModal] = useState(null)
  const [plan, setPlan] = useState(null)
  const [planState, setPlanState] = useState('idle') // idle | loading | ready | error
  const [planError, setPlanError] = useState('')
  const requestRef = useRef(0)
  const planKeyRef = useRef('')

  const set = patch => setAnswers(a => ({ ...a, ...patch }))
  const setSchedule = patch => setAnswers(a => ({ ...a, schedule: { ...a.schedule, ...patch } }))
  const childName = answers.name.trim() || 'tu hijo(a)'
  const profileReady = answers.name.trim() && answers.level && SUBJECT_KEYS.some(k => answers.subjects[k]) && answers.schedule.days.length

  const steps = useMemo(() => [
    { id: 'student', title: 'Estudiante', icon: Users, description: 'Sin los datos del estudiante no podemos sugerir un plan. Puedes crearlo más tarde desde Planificación → Plan con IA.' },
    { id: 'subjects', title: 'Materias', icon: BookOpen, description: 'Usaremos todas las materias con nivel "va al día". Puedes ajustarlo más tarde en Planificación.' },
    { id: 'learning', title: 'Aprendizaje', icon: Star, description: 'El plan se hará sin considerar intereses ni estilo de aprendizaje. Puedes editarlo más tarde.' },
    { id: 'curriculum', title: 'Currículo', icon: Landmark, description: 'El plan seguirá los estándares del DEPR. Puedes desactivarlo en Planificación.' },
    { id: 'calendar', title: 'Calendario', icon: Calendar, description: 'Usaremos lunes a viernes, 3 horas al día. Puedes ajustar tu horario desde Planificación en cualquier momento.' },
    ...(short ? [] : [
      { id: 'notifications', title: 'Notificaciones', icon: Bell, description: 'Las notificaciones se pueden activar desde Configuración.' },
      { id: 'portfolio', title: 'Portafolio', icon: FileText, description: 'Configura tu portafolio desde la sección Portafolio cuando lo necesites.' },
    ]),
    { id: 'plan', title: 'Tu plan', icon: Sparkles, description: 'Podrás crear tu plan con IA más tarde desde Planificación.' },
  ], [short])

  const current = steps[step - 1]
  const planStep = steps.length

  const requestPlan = () => {
    if (!profileReady) return
    const profile = toProfile(answers)
    const key = JSON.stringify(profile)
    if (key === planKeyRef.current && (planState === 'loading' || planState === 'ready')) return
    planKeyRef.current = key
    const id = ++requestRef.current
    setPlanState('loading')
    setPlanError('')
    generatePlan(profile)
      .then(result => {
        if (id !== requestRef.current) return
        if (!result.subjects?.length) throw new Error('No encontramos lecciones publicadas para las materias y el grado elegidos.')
        setPlan(result)
        setPlanState('ready')
      })
      .catch(err => {
        if (id !== requestRef.current) return
        setPlanError(err.message || String(err))
        setPlanState('error')
      })
  }

  const goTo = n => {
    const target = Math.min(Math.max(1, n), steps.length)
    // Start (or refresh) the plan in the background once the schedule is known.
    if (target > steps.findIndex(s => s.id === 'calendar') + 1) requestPlan()
    setStep(target)
  }

  const handleNext = () => {
    if (!completedSteps.includes(step)) setCompletedSteps(prev => [...prev, step])
    if (step < steps.length) goTo(step + 1)
  }
  const handleSkip = () => setSkipModal({ title: current.title, description: current.description, stepNumber: step })
  const confirmSkip = () => {
    if (!skippedSteps.includes(step)) setSkippedSteps(prev => [...prev, step])
    setSkipModal(null)
    if (step < steps.length) goTo(step + 1)
    else onFinish()
  }
  const handleClose = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar el asistente? Podrás crear el plan más tarde desde Planificación.')) onFinish()
  }

  const accept = () => {
    const profile = toProfile(answers)
    onSaveStudent({
      id: existingStudent?.id || newId(),
      name: profile.child.name,
      age: profile.child.age,
      level: profile.child.level,
      language: profile.child.language,
      color: existingStudent?.color || STUDENT_COLORS[studentCount % STUDENT_COLORS.length],
      profile,
      plan,
    })
    onFinish()
  }

  // Keyboard navigation (arrows only when not typing in a field)
  const keyRef = useRef()
  keyRef.current = e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')
    if (e.key === 'Escape' && !skipModal) handleClose()
    else if (!typing && e.key === 'ArrowLeft' && step > 1) goTo(step - 1)
    else if (!typing && e.key === 'ArrowRight' && step < steps.length) handleNext()
  }
  useEffect(() => {
    const onKey = e => keyRef.current(e)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const capacity = weeklyCapacity(answers.schedule)
  const perDay = slotsPerDay(answers.schedule)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
        <div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${current.id === 'plan' && planState === 'ready' ? 'max-w-5xl' : 'max-w-4xl'}`}>
          <div className="p-6 sm:p-8">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 id="wizard-title" className="text-2xl font-bold text-gray-800">
                  {existingStudent ? `Actualiza el plan de ${existingStudent.name}` : studentCount ? 'Añade un estudiante' : '¡Bienvenido a Genial Skills Homeschool!'}
                </h1>
                <p className="text-gray-600">Responde unas preguntas y te sugerimos un plan de estudio con lecciones de Genial Skills.</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500">Paso {step} de {steps.length}</span>
                <button type="button" onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Cerrar asistente"><X className="h-5 w-5" /></button>
              </div>
            </header>

            <div className="mb-6 flex items-center justify-between gap-1 overflow-x-auto">
              {steps.map((s, i) => {
                const n = i + 1
                const isCompleted = completedSteps.includes(n)
                const isSkipped = skippedSteps.includes(n)
                const isCurrent = n === step
                const isAccessible = n <= step
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => isAccessible && goTo(n)}
                    disabled={!isAccessible}
                    className={`flex min-w-16 flex-col items-center rounded-lg p-2 transition-colors ${
                      isCurrent ? 'bg-blue-100 text-blue-700'
                        : isCompleted ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : isSkipped ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : isAccessible ? 'text-gray-600 hover:bg-gray-100' : 'cursor-not-allowed text-gray-400'
                    }`}
                    aria-label={`Paso ${n}: ${s.title}${isCompleted ? ' (completado)' : isSkipped ? ' (omitido)' : isCurrent ? ' (actual)' : ''}`}
                  >
                    <span className="mb-1 flex h-8 w-8 items-center justify-center">
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : isSkipped ? <AlertTriangle className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                    </span>
                    <span className="text-xs font-medium">{s.title}</span>
                  </button>
                )
              })}
            </div>

            <div className="mb-8 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(step / steps.length) * 100}%` }}
                role="progressbar"
                aria-valuenow={step}
                aria-valuemin={1}
                aria-valuemax={steps.length}
              />
            </div>

            <main className="mb-8 min-h-[400px]">
              {current.id === 'student' && (
                <div className="text-center">
                  <StepHeader icon={Users} color="text-blue-500" title="Cuéntanos sobre tu hijo(a)" subtitle="Con su grado buscamos las lecciones de Genial Skills que le corresponden." />
                  <div className="mx-auto max-w-md space-y-4 text-left">
                    <div className="flex gap-2">
                      <input className="min-w-0 flex-1 rounded-md border px-3 py-2" placeholder="Nombre del estudiante" aria-label="Nombre del estudiante" value={answers.name} onChange={e => set({ name: e.target.value })} autoFocus />
                      <input className="w-24 shrink-0 rounded-md border px-3 py-2" type="number" min="3" max="19" placeholder="Edad" aria-label="Edad" value={answers.age} onChange={e => set({ age: e.target.value })} />
                    </div>
                    <select className={inputClass} value={answers.level} onChange={e => set({ level: e.target.value })} aria-label="Grado del estudiante">
                      <option value="">Grado que está cursando</option>
                      {GRADES.map(g => <option key={g} value={g}>{g === 'k' ? 'Kinder' : gradeLabel(g)}</option>)}
                    </select>
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">¿En qué idioma prefieres las lecciones?</p>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map(l => <Pill key={l.id} selected={answers.language === l.id} onClick={() => set({ language: l.id })}>{l.title}</Pill>)}
                      </div>
                    </div>
                  </div>
                  <StepButtons onSkip={handleSkip} onNext={handleNext} disabled={!answers.name.trim() || !answers.level} />
                </div>
              )}

              {current.id === 'subjects' && (
                <div className="text-center">
                  <StepHeader icon={BookOpen} color="text-green-500" title={`¿Qué materias va a estudiar ${childName}?`} subtitle="Y cómo va en cada una. Las que necesitan refuerzo reciben más tiempo y lecciones puente del grado anterior." />
                  <div className="mx-auto grid max-w-2xl gap-3 text-left">
                    {SUBJECT_KEYS.map(k => {
                      const s = SUBJECTS[k]
                      const on = !!answers.subjects[k]
                      return (
                        <div key={k} className={`rounded-lg border-2 p-3 transition-colors ${on ? '' : 'border-gray-200 opacity-70'}`} style={on ? { borderColor: s.color } : undefined}>
                          <label className="flex cursor-pointer items-center gap-3">
                            <input type="checkbox" className="h-4 w-4" checked={on} onChange={() => set({ subjects: { ...answers.subjects, [k]: on ? null : 'al-dia' } })} />
                            <span className="text-lg">{s.emoji}</span>
                            <span className="font-medium">{s.name}</span>
                          </label>
                          {on && (
                            <div className="mt-2 flex flex-wrap gap-2 pl-7">
                              {SUPPORT.map(o => <Pill key={o.id} color={s.color} selected={answers.subjects[k] === o.id} onClick={() => set({ subjects: { ...answers.subjects, [k]: o.id } })}>{o.label}</Pill>)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <StepButtons onSkip={handleSkip} onNext={handleNext} disabled={!SUBJECT_KEYS.some(k => answers.subjects[k])} />
                </div>
              )}

              {current.id === 'learning' && (
                <div className="text-center">
                  <StepHeader icon={Star} color="text-yellow-500" title={`¿Cómo aprende mejor ${childName}?`} subtitle="Nos ayuda a priorizar temas y a darte consejos útiles." />
                  <div className="mx-auto max-w-2xl space-y-5 text-left">
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Estilo de aprendizaje</p>
                      <div className="flex flex-wrap gap-2">{LEARNING_STYLES.map(x => <Pill key={x} selected={answers.learningStyles.includes(x)} onClick={() => set({ learningStyles: toggleIn(answers.learningStyles, x) })}>{x}</Pill>)}</div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Intereses</p>
                      <div className="flex flex-wrap gap-2">{[...new Set([...INTERESTS, ...answers.interests])].map(x => <Pill key={x} color="#f59e0b" selected={answers.interests.includes(x)} onClick={() => set({ interests: toggleIn(answers.interests, x) })}>{x}</Pill>)}</div>
                      <input
                        className={`${inputClass} mt-2`}
                        placeholder="Otro interés (Enter para añadir)"
                        onKeyDown={e => {
                          const v = e.currentTarget.value.trim()
                          if (e.key === 'Enter' && v) { e.preventDefault(); if (!answers.interests.includes(v)) set({ interests: [...answers.interests, v] }); e.currentTarget.value = '' }
                        }}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Metas para este periodo</p>
                      <div className="flex flex-wrap gap-2">{GOALS.map(x => <Pill key={x} color="#10b981" selected={answers.goals.includes(x)} onClick={() => set({ goals: toggleIn(answers.goals, x) })}>{x}</Pill>)}</div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Estilo de homeschool</p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {APPROACHES.map(a => (
                          <button key={a.id} type="button" onClick={() => set({ approach: a.id })} className={`rounded-lg border-2 p-3 text-left ${answers.approach === a.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <span className="block font-medium">{a.title}</span>
                            <span className="block text-xs text-gray-600">{a.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea className={`${inputClass} min-h-20`} placeholder={`Algo más que debamos saber (opcional). Ej. ${childName} se frustra con la resta.`} value={answers.notes} onChange={e => set({ notes: e.target.value })} />
                  </div>
                  <StepButtons onSkip={handleSkip} onNext={handleNext} />
                </div>
              )}

              {current.id === 'curriculum' && (
                <div className="text-center">
                  <StepHeader icon={Landmark} color="text-indigo-500" title="¿Quieres seguir el currículo del Departamento de Educación?" subtitle="Es opcional. Si lo activas, el plan prioriza las expectativas de grado del DEPR y verás cuánto se va cumpliendo." />
                  <div className="mx-auto max-w-lg space-y-3 text-left">
                    {[
                      { value: true, title: 'Sí, alinear con los estándares del DEPR', text: `La IA escoge lecciones que cubran la mayor cantidad de expectativas de ${answers.level ? gradeLabel(answers.level) : 'su grado'}. En Planificación verás el cumplimiento por materia y dominio.` },
                      { value: false, title: 'No, enfocarnos en sus intereses y necesidades', text: 'El plan se arma solo con el perfil de tu hijo(a). Puedes activar el seguimiento del DEPR más tarde.' },
                    ].map(o => (
                      <button key={String(o.value)} type="button" onClick={() => set({ depr: o.value })} className={`w-full rounded-lg border-2 p-4 text-left ${answers.depr === o.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="block font-medium text-gray-900">{o.title}</span>
                        <span className="mt-1 block text-sm text-gray-600">{o.text}</span>
                      </button>
                    ))}
                  </div>
                  <StepButtons onSkip={handleSkip} onNext={handleNext} />
                </div>
              )}

              {current.id === 'calendar' && (
                <div className="text-center">
                  <StepHeader icon={Calendar} color="text-purple-500" title="Ajusta tu calendario familiar" subtitle="Con tu horario armamos el calendario de lecciones, prácticas y exámenes." />
                  <div className="mx-auto max-w-md space-y-5 text-left">
                    <div>
                      <h4 className="mb-3 font-medium">Días de estudio</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4, 5, 6, 0].map(d => {
                          const on = answers.schedule.days.includes(d)
                          return (
                            <button key={d} type="button" onClick={() => setSchedule({ days: toggleIn(answers.schedule.days, d) })} className={`rounded-lg border p-3 ${on ? 'border-purple-500 bg-purple-50 font-medium text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {WEEKDAY_LABELS[d]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm font-medium text-gray-700">Hora de inicio
                        <input type="time" className={`${inputClass} mt-1`} value={answers.schedule.startTime} onChange={e => setSchedule({ startTime: e.target.value })} />
                      </label>
                      <label className="text-sm font-medium text-gray-700">Fecha de inicio
                        <input type="date" className={`${inputClass} mt-1`} value={answers.schedule.startDate} onChange={e => setSchedule({ startDate: e.target.value })} />
                      </label>
                      <label className="text-sm font-medium text-gray-700">Tiempo al día
                        <select className={`${inputClass} mt-1`} value={answers.schedule.minutesPerDay} onChange={e => setSchedule({ minutesPerDay: Number(e.target.value) })}>
                          {[60, 90, 120, 150, 180, 240, 300].map(m => <option key={m} value={m}>{Math.floor(m / 60)} h{m % 60 ? ` ${m % 60} min` : ''}</option>)}
                        </select>
                      </label>
                      <label className="text-sm font-medium text-gray-700">Cada sesión
                        <select className={`${inputClass} mt-1`} value={answers.schedule.minutesPerLesson} onChange={e => setSchedule({ minutesPerLesson: Number(e.target.value) })}>
                          {[20, 30, 40, 45, 60].map(m => <option key={m} value={m}>{m} minutos</option>)}
                        </select>
                      </label>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Duración del plan</p>
                      <div className="flex flex-wrap gap-2">{DURATIONS.map(([w, label]) => <Pill key={w} color="#a855f7" selected={answers.schedule.weeks === w} onClick={() => setSchedule({ weeks: w })}>{label}</Pill>)}</div>
                    </div>
                    <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">Hasta <strong>{perDay} sesiones al día</strong> y <strong>{capacity} a la semana</strong>, con recesos de 10 minutos.</p>
                  </div>
                  <StepButtons onSkip={handleSkip} onNext={handleNext} disabled={!answers.schedule.days.length || !answers.schedule.startDate} />
                </div>
              )}

              {current.id === 'notifications' && <Step4NotificationsSetup onNext={handleNext} onSkip={handleSkip} />}
              {current.id === 'portfolio' && <Step5PortfolioConfig onNext={handleNext} onSkip={handleSkip} />}

              {current.id === 'plan' && (
                <div>
                  {!profileReady && (
                    <div className="py-12 text-center">
                      <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
                      <h3 className="mb-2 text-xl font-semibold">Faltan datos para crear el plan</h3>
                      <p className="mb-6 text-gray-600">Necesitamos el nombre y grado del estudiante, al menos una materia y los días de estudio.</p>
                      <div className="flex justify-center gap-4">
                        <button type="button" onClick={() => goTo(1)} className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">Completar datos</button>
                        <button type="button" onClick={onFinish} className="px-4 py-2 text-gray-500 hover:text-gray-700">Terminar sin plan</button>
                      </div>
                    </div>
                  )}
                  {profileReady && planState === 'loading' && (
                    <div className="py-16 text-center">
                      <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
                      <h3 className="mb-2 text-xl font-semibold">Diseñando el plan de {childName}…</h3>
                      <p className="text-gray-600">Buscando lecciones de {gradeLabel(answers.level)}, ordenándolas y armando el calendario{answers.depr ? ' alineado al DEPR' : ''}.</p>
                    </div>
                  )}
                  {profileReady && planState === 'error' && (
                    <div className="py-12 text-center">
                      <h3 className="mb-2 text-xl font-semibold">No pudimos crear el plan</h3>
                      <p className="mb-6 text-sm text-gray-600">{planError}</p>
                      <button type="button" onClick={() => { planKeyRef.current = ''; requestPlan() }} className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">Intentar de nuevo</button>
                    </div>
                  )}
                  {profileReady && planState === 'idle' && (
                    <div className="py-12 text-center">
                      <button type="button" onClick={requestPlan} className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">Crear plan con IA</button>
                    </div>
                  )}
                  {profileReady && planState === 'ready' && plan && (
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Plan sugerido</p>
                          <h3 className="text-2xl font-semibold">El plan de estudio de {childName}</h3>
                          <p className="text-gray-600">{gradeLabel(answers.level)} · {answers.schedule.weeks} semanas desde {answers.schedule.startDate}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => { planKeyRef.current = ''; requestPlan() }} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <RefreshCw className="h-4 w-4" /> Generar otra versión
                          </button>
                          <button type="button" onClick={accept} className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700">
                            Aceptar plan y empezar
                          </button>
                        </div>
                      </div>
                      <PlanView plan={plan} childLevel={answers.level} />
                      {answers.depr && <DeprPanel plan={plan} gradeName={gradeLabel(answers.level)} />}
                    </div>
                  )}
                </div>
              )}
            </main>

            <footer className="flex items-center justify-between">
              <button type="button" className="px-6 py-2 text-gray-600 transition-colors hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => goTo(step - 1)} disabled={step === 1}>
                Anterior
              </button>
              <div className="hidden items-center gap-4 sm:flex">
                <span className="text-xs text-gray-500">Todos los pasos son opcionales • Usa ← → para navegar</span>
                <span className="text-xs text-gray-400">ESC para cerrar</span>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <SkipModal
        isOpen={!!skipModal}
        onClose={() => setSkipModal(null)}
        onConfirm={confirmSkip}
        stepTitle={skipModal?.title}
        stepDescription={skipModal?.description}
        stepNumber={skipModal?.stepNumber}
      />
    </>
  )
}
