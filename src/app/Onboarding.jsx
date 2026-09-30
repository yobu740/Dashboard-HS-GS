// AI onboarding: asks the family about the child, their subjects, how they
// learn and the time available, then asks the planner (Claude + Athenas
// catalogue) for a study plan and calendar, and lets the parent review it.
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2, RefreshCw, Sparkles, X } from 'lucide-react'
import logo from '../assets/logo.svg'
import { SUBJECTS, SUBJECT_KEYS, GRADES, gradeLabel } from '../../shared/subjects.js'
import { WEEKDAY_SHORT, toISODate, weeklyCapacity, slotsPerDay } from '../../shared/scheduler.js'
import { generatePlan } from './api.js'
import { Chip, OptionCard, Field, inputClass, PrimaryButton, SecondaryButton } from './ui.jsx'
import PlanView from './PlanView.jsx'
import LessonModal from './LessonModal.jsx'
import { STUDENT_COLORS, newId } from './store.js'

const LEARNING_STYLES = [
  { id: 'visual', label: '👀 Visual (imágenes, videos)' },
  { id: 'practico', label: '🖐️ Práctico (hacer, experimentar)' },
  { id: 'auditivo', label: '👂 Auditivo (escuchar, conversar)' },
  { id: 'lector', label: '📚 Lectura y escritura' },
  { id: 'movimiento', label: '🏃 Necesita moverse / pausas' },
]

const INTERESTS = ['Animales', 'Deportes', 'Arte y dibujo', 'Música', 'Tecnología', 'Naturaleza', 'Espacio', 'Cocina', 'Historia', 'Videojuegos', 'Construir cosas', 'Lectura']

const GOALS = [
  'Cubrir el currículo completo del grado',
  'Reforzar las áreas donde tiene dificultad',
  'Avanzar a su propio ritmo',
  'Prepararse para regresar a la escuela',
  'Desarrollar hábitos de estudio',
  'Fortalecer el inglés',
]

const APPROACHES = [
  { id: 'estructurado', icon: '🗓️', title: 'Estructurado', description: 'Horario fijo, todas las materias cada semana, como la escuela.' },
  { id: 'mixto', icon: '⚖️', title: 'Mixto', description: 'Una rutina clara, con espacio para proyectos e intereses.' },
  { id: 'flexible', icon: '🌱', title: 'Flexible', description: 'Menos carga fija; dejamos tiempo libre para explorar.' },
]

const LANGUAGES = [
  { id: 'es', icon: '🇵🇷', title: 'Español', description: 'Las lecciones de materias en español.' },
  { id: 'en', icon: '🇺🇸', title: 'Inglés', description: 'Preferimos las lecciones en inglés cuando existan.' },
  { id: 'bi', icon: '🔄', title: 'Bilingüe', description: 'Una mezcla de ambos idiomas.' },
]

const SUPPORT = [
  { id: 'refuerzo', label: 'Necesita refuerzo' },
  { id: 'al-dia', label: 'Va al día' },
  { id: 'avanzado', label: 'Está avanzado' },
]

function nextMonday() {
  const d = new Date()
  const add = (8 - d.getDay()) % 7 || 0
  d.setDate(d.getDate() + add)
  return toISODate(d)
}

function initialAnswers(student) {
  if (student?.profile) {
    const p = student.profile
    return {
      name: p.child.name, age: p.child.age || '', level: p.child.level, language: p.child.language,
      subjects: Object.fromEntries(p.subjects.map(s => [s.key, s.support])),
      learningStyles: p.learningStyles || [], interests: p.interests || [], goals: p.goals || [],
      approach: p.approach || 'mixto', notes: p.notes || '', schedule: { ...p.schedule },
    }
  }
  return {
    name: '', age: '', level: '', language: 'es',
    subjects: { math: 'al-dia', spanish: 'al-dia', english: 'al-dia', science: 'al-dia', social: 'al-dia' },
    learningStyles: [], interests: [], goals: [], approach: 'mixto', notes: '',
    schedule: { startDate: nextMonday(), weeks: 9, days: [1, 2, 3, 4, 5], startTime: '09:00', minutesPerDay: 180, minutesPerLesson: 40, breakMinutes: 10 },
  }
}

function toProfile(a, parentName) {
  return {
    parentName,
    child: { name: a.name.trim(), age: a.age ? Number(a.age) : null, level: a.level, language: a.language },
    subjects: SUBJECT_KEYS.filter(k => a.subjects[k]).map(k => ({ key: k, support: a.subjects[k] })),
    learningStyles: a.learningStyles.map(id => LEARNING_STYLES.find(x => x.id === id)?.label.replace(/^\S+\s/, '') || id),
    interests: a.interests,
    goals: a.goals,
    approach: a.approach,
    notes: a.notes.trim(),
    schedule: a.schedule,
  }
}

const toggleIn = (list, value) => (list.includes(value) ? list.filter(x => x !== value) : [...list, value])

const GENERATING_STEPS = [
  'Analizando el perfil y las metas',
  'Buscando lecciones de Genial Skills para el grado',
  'Seleccionando y ordenando la secuencia de cada materia',
  'Armando el calendario de la familia',
]

export default function Onboarding({ parentName: initialParent, existingStudent, studentCount = 0, onComplete, onCancel }) {
  const askParent = !initialParent
  const [parentName, setParentName] = useState(initialParent || '')
  const [answers, setAnswers] = useState(() => initialAnswers(existingStudent))
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState('questions') // questions | generating | review | error
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')
  const [genStep, setGenStep] = useState(0)
  const [openLesson, setOpenLesson] = useState(null)

  const set = patch => setAnswers(a => ({ ...a, ...patch }))
  const setSchedule = patch => setAnswers(a => ({ ...a, schedule: { ...a.schedule, ...patch } }))
  const childName = answers.name.trim() || 'tu hijo(a)'

  const steps = useMemo(() => [
    ...(askParent ? [{
      id: 'welcome',
      title: '¡Bienvenido(a) a Genial Skills Homeschool!',
      subtitle: 'En unos minutos vamos a diseñar un plan de estudio personalizado, con lecciones reales de Genial Skills y un calendario sugerido. Primero, ¿cómo te llamas?',
      valid: parentName.trim().length > 0,
    }] : []),
    { id: 'child', title: existingStudent ? `Actualicemos el perfil de ${existingStudent.name}` : studentCount ? 'Añadamos otro estudiante' : 'Cuéntanos sobre tu hijo(a)', subtitle: 'Usaremos su grado para buscar las lecciones que le corresponden.', valid: answers.name.trim() && answers.level },
    { id: 'language', title: `¿En qué idioma prefieres que ${childName} estudie?`, subtitle: 'Si no hay lecciones en ese idioma para su grado, usaremos la mejor alternativa y te avisaremos.', valid: !!answers.language },
    { id: 'subjects', title: `¿Qué materias quieres cubrir con ${childName}?`, subtitle: 'Y cómo sientes que va en cada una. Las que necesiten refuerzo recibirán más tiempo y lecciones puente del grado anterior.', valid: Object.values(answers.subjects).some(Boolean) },
    { id: 'learning', title: `¿Cómo aprende mejor ${childName}?`, subtitle: 'Elige todo lo que aplique. Nos ayuda a priorizar temas y a darte consejos útiles.', valid: true },
    { id: 'goals', title: '¿Qué quieren lograr este periodo?', subtitle: 'Elige tus metas y el estilo de homeschool que te funciona.', valid: !!answers.approach },
    { id: 'schedule', title: '¿Cuánto tiempo tienen para estudiar?', subtitle: 'Con esto armamos el calendario. Siempre lo puedes ajustar después.', valid: answers.schedule.days.length > 0 && answers.schedule.startDate },
    { id: 'notes', title: '¿Algo más que debamos saber?', subtitle: 'Opcional: diagnósticos, experiencias previas, temas que le emocionan o que evita… Todo ayuda a que el plan sea más suyo.', valid: true },
  ], [askParent, parentName, answers, childName, studentCount])

  const current = steps[step]
  const isLast = step === steps.length - 1

  useEffect(() => {
    if (phase !== 'generating') return
    const t = setInterval(() => setGenStep(s => Math.min(s + 1, GENERATING_STEPS.length - 1)), 2600)
    return () => clearInterval(t)
  }, [phase])

  const runPlanner = async () => {
    setPhase('generating')
    setGenStep(0)
    setError('')
    try {
      const result = await generatePlan(toProfile(answers, parentName.trim()))
      if (!result.subjects?.length) throw new Error('No encontramos lecciones publicadas para las materias y el grado elegidos.')
      setPlan(result)
      setPhase('review')
    } catch (err) {
      setError(err.message || String(err))
      setPhase('error')
    }
  }

  const accept = () => {
    const profile = toProfile(answers, parentName.trim())
    onComplete({
      parentName: parentName.trim(),
      student: {
        id: existingStudent?.id || newId(),
        name: profile.child.name,
        age: profile.child.age,
        level: profile.child.level,
        language: profile.child.language,
        color: existingStudent?.color || STUDENT_COLORS[studentCount % STUDENT_COLORS.length],
        profile,
        plan,
      },
    })
  }

  const capacity = weeklyCapacity(answers.schedule)
  const perDay = slotsPerDay(answers.schedule)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f7f3ea] via-white to-slate-50">
      <header className="flex items-center justify-between bg-slate-700 px-6 py-3 text-white">
        <img src={logo} alt="Genial Skills" className="h-8" />
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600">
            <X className="h-4 w-4" /> Cancelar
          </button>
        )}
      </header>

      {phase === 'questions' && (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:py-12">
          <div className="mb-8">
            <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
              <span>Paso {step + 1} de {steps.length}</span>
              <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-[#c0a267]" /> Plan con IA</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#c0a267] transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{current.title}</h1>
          <p className="mt-2 text-slate-600">{current.subtitle}</p>

          <div className="mt-8 flex-1 space-y-5">
            {current.id === 'welcome' && (
              <Field label="Tu nombre">
                <input autoFocus className={inputClass} value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Ej. Brian" />
              </Field>
            )}

            {current.id === 'child' && (
              <>
                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <Field label="Nombre">
                    <input autoFocus className={inputClass} value={answers.name} onChange={e => set({ name: e.target.value })} placeholder="Ej. Sofía" />
                  </Field>
                  <Field label="Edad (opcional)">
                    <input className={inputClass} type="number" min="3" max="19" value={answers.age} onChange={e => set({ age: e.target.value })} />
                  </Field>
                </div>
                <Field label="¿Qué grado está cursando?">
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map(g => (
                      <Chip key={g} selected={answers.level === g} onClick={() => set({ level: g })}>
                        {g === 'k' ? 'Kínder' : `${g}°`}
                      </Chip>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {current.id === 'language' && (
              <div className="grid gap-3">
                {LANGUAGES.map(l => (
                  <OptionCard key={l.id} {...l} selected={answers.language === l.id} onClick={() => set({ language: l.id })} />
                ))}
              </div>
            )}

            {current.id === 'subjects' && (
              <div className="space-y-3">
                {SUBJECT_KEYS.map(k => {
                  const s = SUBJECTS[k]
                  const on = !!answers.subjects[k]
                  return (
                    <div key={k} className={`rounded-xl border-2 bg-white p-4 transition-all ${on ? '' : 'border-slate-200 opacity-70'}`} style={on ? { borderColor: s.color } : undefined}>
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-slate-700"
                          checked={on}
                          onChange={() => set({ subjects: { ...answers.subjects, [k]: on ? null : 'al-dia' } })}
                        />
                        <span className="text-xl">{s.emoji}</span>
                        <span className="font-semibold text-slate-900">{s.name}</span>
                      </label>
                      {on && (
                        <div className="mt-3 flex flex-wrap gap-2 pl-8">
                          {SUPPORT.map(opt => (
                            <Chip key={opt.id} color={s.color} selected={answers.subjects[k] === opt.id} onClick={() => set({ subjects: { ...answers.subjects, [k]: opt.id } })}>
                              {opt.label}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {current.id === 'learning' && (
              <>
                <Field label="Estilo de aprendizaje">
                  <div className="flex flex-wrap gap-2">
                    {LEARNING_STYLES.map(s => (
                      <Chip key={s.id} selected={answers.learningStyles.includes(s.id)} onClick={() => set({ learningStyles: toggleIn(answers.learningStyles, s.id) })}>
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </Field>
                <Field label="Intereses" hint="Escribe otro interés y presiona Enter para añadirlo.">
                  <div className="flex flex-wrap gap-2">
                    {[...new Set([...INTERESTS, ...answers.interests])].map(i => (
                      <Chip key={i} color="#a88a4f" selected={answers.interests.includes(i)} onClick={() => set({ interests: toggleIn(answers.interests, i) })}>
                        {i}
                      </Chip>
                    ))}
                  </div>
                  <input
                    className={`${inputClass} mt-3`}
                    placeholder="Ej. dinosaurios"
                    onKeyDown={e => {
                      const v = e.currentTarget.value.trim()
                      if (e.key === 'Enter' && v) {
                        e.preventDefault()
                        if (!answers.interests.includes(v)) set({ interests: [...answers.interests, v] })
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </Field>
              </>
            )}

            {current.id === 'goals' && (
              <>
                <Field label="Metas (elige las que apliquen)">
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map(g => (
                      <Chip key={g} selected={answers.goals.includes(g)} onClick={() => set({ goals: toggleIn(answers.goals, g) })}>{g}</Chip>
                    ))}
                  </div>
                </Field>
                <Field label="Estilo de homeschool">
                  <div className="grid gap-3">
                    {APPROACHES.map(a => (
                      <OptionCard key={a.id} {...a} selected={answers.approach === a.id} onClick={() => set({ approach: a.id })} />
                    ))}
                  </div>
                </Field>
              </>
            )}

            {current.id === 'schedule' && (
              <>
                <Field label="Días de estudio">
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 0].map(d => (
                      <Chip key={d} selected={answers.schedule.days.includes(d)} onClick={() => setSchedule({ days: toggleIn(answers.schedule.days, d) })}>
                        {WEEKDAY_SHORT[d]}
                      </Chip>
                    ))}
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tiempo de estudio al día">
                    <select className={inputClass} value={answers.schedule.minutesPerDay} onChange={e => setSchedule({ minutesPerDay: Number(e.target.value) })}>
                      {[60, 90, 120, 150, 180, 240, 300].map(m => <option key={m} value={m}>{m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`}</option>)}
                    </select>
                  </Field>
                  <Field label="Duración de cada sesión">
                    <select className={inputClass} value={answers.schedule.minutesPerLesson} onChange={e => setSchedule({ minutesPerLesson: Number(e.target.value) })}>
                      {[20, 30, 40, 45, 60].map(m => <option key={m} value={m}>{m} minutos</option>)}
                    </select>
                  </Field>
                  <Field label="Hora de inicio">
                    <input type="time" className={inputClass} value={answers.schedule.startTime} onChange={e => setSchedule({ startTime: e.target.value })} />
                  </Field>
                  <Field label="Fecha de inicio">
                    <input type="date" className={inputClass} value={answers.schedule.startDate} onChange={e => setSchedule({ startDate: e.target.value })} />
                  </Field>
                </div>
                <Field label="¿Para cuánto tiempo quieres el plan?">
                  <div className="flex flex-wrap gap-2">
                    {[[4, '1 mes'], [9, 'Un trimestre'], [18, 'Un semestre'], [36, 'Año escolar']].map(([w, label]) => (
                      <Chip key={w} selected={answers.schedule.weeks === w} onClick={() => setSchedule({ weeks: w })}>{label} · {w} sem</Chip>
                    ))}
                  </div>
                </Field>
                <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  Esto da hasta <strong>{perDay} sesiones al día</strong> y <strong>{capacity} sesiones a la semana</strong> (con recesos de 10 minutos).
                </p>
              </>
            )}

            {current.id === 'notes' && (
              <>
                <textarea
                  className={`${inputClass} min-h-32`}
                  value={answers.notes}
                  onChange={e => set({ notes: e.target.value })}
                  placeholder={`Ej. ${childName} lee muy bien pero se frustra con la resta. Estamos saliendo de la escuela tradicional a mitad de año.`}
                />
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  <p className="mb-2 font-semibold text-slate-900">Resumen</p>
                  <p><strong>{childName}</strong>{answers.age ? `, ${answers.age} años` : ''} · {answers.level ? gradeLabel(answers.level) : '—'} · {LANGUAGES.find(l => l.id === answers.language)?.title}</p>
                  <p className="mt-1">{SUBJECT_KEYS.filter(k => answers.subjects[k]).map(k => `${SUBJECTS[k].name} (${SUPPORT.find(s => s.id === answers.subjects[k])?.label.toLowerCase()})`).join(' · ')}</p>
                  <p className="mt-1">{answers.schedule.days.map(d => WEEKDAY_SHORT[d]).join(', ')} · {answers.schedule.minutesPerDay} min/día · {answers.schedule.weeks} semanas desde {answers.schedule.startDate}</p>
                </div>
              </>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between">
            <SecondaryButton onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Atrás
            </SecondaryButton>
            {isLast ? (
              <PrimaryButton onClick={runPlanner} className="bg-[#a88a4f] hover:bg-[#8f7440]">
                <Sparkles className="h-4 w-4" /> Crear el plan de {childName}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => setStep(s => s + 1)} disabled={!current.valid}>
                Continuar <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            )}
          </div>
        </main>
      )}

      {phase === 'generating' && (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#c0a267]/30" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#c0a267] text-white">
              <Sparkles className="h-9 w-9" />
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Diseñando el plan de {childName}</h1>
          <p className="mt-2 text-slate-600">Esto puede tomar hasta un minuto.</p>
          <ul className="mt-8 w-full space-y-3 text-left">
            {GENERATING_STEPS.map((label, i) => (
              <li key={label} className={`flex items-center gap-3 text-sm transition-opacity ${i > genStep ? 'opacity-40' : ''}`}>
                {i < genStep ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" /></span>
                ) : i === genStep ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#a88a4f]" />
                ) : (
                  <span className="h-6 w-6 rounded-full border-2 border-slate-300" />
                )}
                <span className="text-slate-700">{label.replace('el grado', gradeLabel(answers.level))}</span>
              </li>
            ))}
          </ul>
        </main>
      )}

      {phase === 'error' && (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
          <h1 className="text-xl font-bold text-slate-900">No pudimos crear el plan</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <div className="mt-6 flex gap-3">
            <SecondaryButton onClick={() => setPhase('questions')}><ArrowLeft className="h-4 w-4" /> Revisar respuestas</SecondaryButton>
            <PrimaryButton onClick={runPlanner}><RefreshCw className="h-4 w-4" /> Intentar de nuevo</PrimaryButton>
          </div>
        </main>
      )}

      {phase === 'review' && plan && (
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#a88a4f]">Plan sugerido</p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">El plan de estudio de {childName}</h1>
              <p className="mt-1 text-slate-600">{gradeLabel(answers.level)} · {answers.schedule.weeks} semanas desde {answers.schedule.startDate}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SecondaryButton onClick={() => { setPhase('questions'); setStep(steps.length - 1) }}>
                <ArrowLeft className="h-4 w-4" /> Ajustar respuestas
              </SecondaryButton>
              <SecondaryButton onClick={runPlanner}><RefreshCw className="h-4 w-4" /> Generar otra versión</SecondaryButton>
              <PrimaryButton onClick={accept} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="h-4 w-4" /> Aceptar plan y empezar
              </PrimaryButton>
            </div>
          </div>
          <PlanView plan={plan} childLevel={answers.level} onOpenLesson={setOpenLesson} />
        </main>
      )}

      {openLesson && <LessonModal session={openLesson} subjects={plan?.subjects || []} onClose={() => setOpenLesson(null)} />}
    </div>
  )
}
