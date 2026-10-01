// Onboarding as a conversation with Lecturina, the Genial Skills mascot.
//
// The parent chats; the server (/api/chat) decides Lecturina's next question
// from what is still missing and from what the parent just said, so the path
// branches: full homeschool plan vs. reinforcement of specific subjects or
// skills. When the profile is complete Lecturina offers to build the plan,
// shows it inside the chat, and keeps taking change requests ("menos días",
// "agrega ciencias") that rebuild it, until the parent accepts it.
import { useEffect, useRef, useState } from 'react'
import { Check, CheckCircle2, Circle, Loader2, Send, Sparkles, X } from 'lucide-react'
import lecturina from '../assets/lecturina.png'
import { emptyProfile, plannerProfile, profileSummary } from '../../shared/profile.js'
import { gradeLabel } from '../../shared/subjects.js'
import { generatePlan, sendChat } from './api.js'
import { STUDENT_COLORS, newId } from './store.js'
import PlanView from './PlanView.jsx'
import DeprPanel from './DeprPanel.jsx'

const CREATE = '¡Crea mi plan!'
const COUNT_LABELS = { learn: 'lecciones', practice: 'prácticas', exam: 'exámenes', review: 'repasos' }
const ACCEPT = 'Aceptar y empezar'

const FIRST_GREETING = {
  role: 'assistant',
  content: '¡Hola! Soy Lecturina 🤖, la asistente de Genial Skills. Te ayudo a armar un plan de estudio con nuestras lecciones, a la medida de tu hijo(a). Para empezar, ¿educan en casa o buscas refuerzo en algunas materias?',
  quickReplies: ['Educamos en casa (homeschool)', 'Busco refuerzo en algunas materias', 'Quiero trabajar una destreza específica'],
}

/** Profiles created before the chat existed have no mode/skills. */
function fromStudent(student) {
  const p = student.profile
  return {
    ...emptyProfile(),
    ...p,
    mode: p.mode || 'homeschool',
    subjects: p.subjects.map(s => ({ skills: '', ...s })),
    depr: p.depr ?? false,
    schedule: { ...emptyProfile().schedule, ...p.schedule },
  }
}

function Avatar({ size = 'h-9 w-9' }) {
  return <img src={lecturina} alt="Lecturina" className={`${size} shrink-0 rounded-full bg-teal-50 object-contain`} />
}

function PlanCard({ plan, name, onOpen, onAccept, accepted }) {
  const counts = plan.sessions.reduce((a, s) => ({ ...a, [s.kind]: (a[s.kind] || 0) + 1 }), {})
  return (
    <div className="w-full max-w-xl overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-white">
        <p className="text-xs font-medium uppercase tracking-wide opacity-90">{plan.mode === 'refuerzo' ? 'Plan de refuerzo' : 'Plan de estudio'}{plan.source === 'ai' ? ' · diseñado con IA' : ''}</p>
        <p className="text-lg font-semibold">El plan de {name}</p>
        <p className="text-xs opacity-90">{plan.settings.weeks} semanas desde {plan.settings.startDate}</p>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed text-gray-700">{plan.summary}</p>
        <ul className="space-y-1.5">
          {plan.subjects.map(s => (
            <li key={s.key} className="flex items-center gap-2 text-sm">
              <span className="text-base">{s.emoji}</span>
              <span className="font-medium text-gray-800">{s.name}</span>
              <span className="text-gray-500">· {s.sessionsPerWeek} sesiones/sem · {s.lessons.length} lecciones</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500">
          {Object.entries(COUNT_LABELS).map(([k, label]) => `${counts[k] || 0} ${label}`).join(' · ')}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={onOpen} className="rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Ver plan completo</button>
          {!accepted && <button type="button" onClick={onAccept} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">{ACCEPT}</button>}
        </div>
      </div>
    </div>
  )
}

export default function ChatOnboarding({ existingStudent, studentCount = 0, onSaveStudent, onFinish }) {
  const [profile, setProfile] = useState(() => (existingStudent ? fromStudent(existingStudent) : emptyProfile()))
  const [messages, setMessages] = useState(() => [existingStudent
    ? { role: 'assistant', content: `¡Hola de nuevo! 😊 ¿Qué quieres cambiar del plan de ${existingStudent.name}?`, quickReplies: ['Cambiar días u horario', 'Agregar o quitar materias', 'Enfocar en una destreza'] }
    : FIRST_GREETING])
  const [plan, setPlan] = useState(existingStudent?.plan || null)
  const [ready, setReady] = useState(!!existingStudent)
  const [missing, setMissing] = useState([])
  const [busy, setBusy] = useState(null) // null | 'chat' | 'plan'
  const [input, setInput] = useState('')
  const [picked, setPicked] = useState([])
  const [viewPlan, setViewPlan] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') (viewPlan ? setViewPlan(null) : close()) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const childName = profile.child.name || 'tu hijo(a)'
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && m.kind !== 'plan')
  const chips = busy ? [] : (lastAssistant?.quickReplies || [])

  const push = (...msgs) => setMessages(prev => [...prev, ...msgs])

  const buildPlan = async (nextProfile, intro) => {
    setBusy('plan')
    if (intro !== false) push({ role: 'assistant', content: intro || `¡Manos a la obra! Estoy buscando lecciones de ${gradeLabel(nextProfile.child.level)} y armando el calendario de ${nextProfile.child.name}… ✨` })
    try {
      const result = await generatePlan(plannerProfile(nextProfile))
      if (!result.subjects?.length) throw new Error('No encontré lecciones publicadas para esas materias y ese grado.')
      setPlan(result)
      push(
        { role: 'assistant', kind: 'plan', plan: result },
        {
          role: 'assistant',
          content: `Aquí está el plan de ${nextProfile.child.name}. Cada lección tiene su día para aprender, practicar y tomar el examen. ¿Lo aceptamos o quieres cambiar algo? Puedes decírmelo con tus palabras.`,
          quickReplies: [ACCEPT, 'Menos tiempo al día', 'Agregar otra materia', 'Cambiar los días'],
        },
      )
    } catch (err) {
      push({ role: 'assistant', content: `Ay, algo falló armando el plan (${err.message}). ¿Lo intento de nuevo?`, quickReplies: [CREATE] })
    } finally {
      setBusy(null)
    }
  }

  const accept = () => {
    const p = plannerProfile(profile)
    onSaveStudent({
      id: existingStudent?.id || newId(),
      name: p.child.name,
      age: p.child.age,
      level: p.child.level,
      language: p.child.language,
      color: existingStudent?.color || STUDENT_COLORS[studentCount % STUDENT_COLORS.length],
      profile: p,
      plan,
    })
    onFinish()
  }

  const send = async raw => {
    const text = String(raw || '').trim()
    if (!text || busy) return
    setInput('')
    setPicked([])
    const userMsg = { role: 'user', content: text }
    push(userMsg)
    if (text === ACCEPT && plan) return accept()
    if (text === CREATE && ready) return buildPlan(profile)

    setBusy('chat')
    try {
      const history = [...messages, userMsg].filter(m => m.kind !== 'plan').map(m => ({ role: m.role, content: m.content }))
      const turn = await sendChat({ messages: history, profile, planExists: !!plan })
      setProfile(turn.profile)
      setMissing(turn.missing)
      setReady(turn.ready)
      push({ role: 'assistant', content: turn.reply, quickReplies: turn.quickReplies, multiSelect: turn.multiSelect })
      setBusy(null)
      // Lecturina's reply already says she is rebuilding the plan.
      if (turn.regenerate) await buildPlan(turn.profile, false)
    } catch (err) {
      push({ role: 'assistant', content: `Perdona, tuve un problema de conexión (${err.message}). ¿Me lo repites?` })
      setBusy(null)
    } finally {
      inputRef.current?.focus()
    }
  }

  const close = () => {
    if (plan && existingStudent) return onFinish()
    if (window.confirm('¿Cerrar la conversación? Podrás volver a hablar con Lecturina desde Planificación.')) onFinish()
  }

  const summary = profileSummary(profile)
  const required = summary.filter(f => !f.optional)
  const known = required.filter(f => f.value).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Conversación con Lecturina">
      <div className="flex h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <Avatar size="h-11 w-11" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">Lecturina</p>
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Asistente de planificación · Genial Skills
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 md:hidden">{known}/{required.length}</span>
            <button type="button" onClick={close} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Cerrar"><X className="h-5 w-5" /></button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-teal-50/40 to-white px-4 py-5">
            {messages.map((m, i) => (
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-blue-500 px-4 py-2.5 text-sm text-white">{m.content}</p>
                </div>
              ) : (
                <div key={i} className="flex items-end gap-2">
                  <Avatar size="h-8 w-8" />
                  {m.kind === 'plan'
                    ? <PlanCard plan={m.plan} name={childName} accepted={m.plan !== plan} onOpen={() => setViewPlan(m.plan)} onAccept={() => send(ACCEPT)} />
                    : <p className="max-w-[80%] whitespace-pre-line rounded-2xl rounded-bl-sm border bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">{m.content}</p>}
                </div>
              )
            ))}
            {busy && (
              <div className="flex items-end gap-2">
                <Avatar size="h-8 w-8" />
                <p className="flex items-center gap-2 rounded-2xl rounded-bl-sm border bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                  {busy === 'plan' ? <><Loader2 className="h-4 w-4 animate-spin" /> Armando el plan…</> : (
                    <span className="flex gap-1" aria-label="Lecturina está escribiendo">
                      {[0, 1, 2].map(d => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${d * 150}ms` }} />)}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t bg-white px-4 pt-3">
              {chips.map(c => {
                const sel = picked.includes(c)
                const primary = c === CREATE || c === ACCEPT
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => (lastAssistant.multiSelect && !primary ? setPicked(p => (sel ? p.filter(x => x !== c) : [...p, c])) : send(c))}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${primary ? 'border-green-600 bg-green-600 font-medium text-white hover:bg-green-700' : sel ? 'border-blue-500 bg-blue-500 text-white' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  >
                    {sel && <Check className="mr-1 inline h-3.5 w-3.5" />}{c}
                  </button>
                )
              })}
              {lastAssistant?.multiSelect && picked.length > 0 && (
                <button type="button" onClick={() => send(picked.join(', '))} className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Enviar ({picked.length})</button>
              )}
            </div>
          )}

          <form className="flex items-center gap-2 bg-white p-3" onSubmit={e => { e.preventDefault(); send(input) }}>
            <input
              ref={inputRef}
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={plan ? 'Pídele un cambio a Lecturina…' : 'Escribe tu respuesta…'}
              className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              aria-label="Mensaje para Lecturina"
              disabled={!!busy}
            />
            <button type="submit" disabled={!input.trim() || !!busy} className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40" aria-label="Enviar">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* What Lecturina knows so far */}
        <aside className="hidden w-72 shrink-0 flex-col border-l bg-gray-50 md:flex">
          <div className="border-b p-4">
            <p className="text-sm font-semibold text-gray-900">Lo que sé hasta ahora</p>
            <div className="mt-2 h-1.5 rounded-full bg-gray-200">
              <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${(known / required.length) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500">{known} de {required.length} datos necesarios</p>
          </div>
          <ul className="flex-1 space-y-3 overflow-y-auto p-4">
            {summary.map(f => (
              <li key={f.label} className="flex gap-2 text-sm">
                {f.value ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : <Circle className={`mt-0.5 h-4 w-4 shrink-0 ${f.optional ? 'text-gray-200' : 'text-gray-300'}`} />}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">{f.label}{f.optional ? ' (opcional)' : ''}</p>
                  <p className={f.value ? 'text-gray-900' : 'text-gray-400'}>{f.value || '—'}</p>
                </div>
              </li>
            ))}
            {profile.notes && (
              <li className="text-sm">
                <p className="text-xs font-medium text-gray-500">Notas</p>
                <p className="text-gray-700">{profile.notes}</p>
              </li>
            )}
          </ul>
          <div className="border-t p-4">
            {plan ? (
              <button type="button" onClick={() => send(ACCEPT)} disabled={!!busy} className="w-full rounded-md bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40">{ACCEPT}</button>
            ) : (
              <button type="button" onClick={() => send(CREATE)} disabled={!ready || !!busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40" title={ready ? '' : `Falta: ${missing.join(', ')}`}>
                <Sparkles className="h-4 w-4" /> {CREATE}
              </button>
            )}
          </div>
        </aside>
      </div>

      {viewPlan && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-2 sm:p-4" onClick={() => setViewPlan(null)}>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-gray-50 p-4 shadow-2xl sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">El plan de {childName}</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => setViewPlan(null)} className="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-gray-50">Volver al chat</button>
                <button type="button" onClick={() => { setViewPlan(null); send(ACCEPT) }} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">{ACCEPT}</button>
              </div>
            </div>
            <div className="space-y-6">
              <PlanView plan={viewPlan} childLevel={profile.child.level} />
              {viewPlan.depr && <DeprPanel plan={viewPlan} gradeName={gradeLabel(profile.child.level)} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
