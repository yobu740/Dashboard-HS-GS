// First-time onboarding: a guided experience with Lecturina on the right and
// one question at a time on the left — answers as large interactive buttons,
// with a free-text box underneath for anything the buttons don't cover.
//
// The questions are not a fixed script: each answer goes to /api/chat (the
// same engine as the follow-up chat), which picks the next question from what
// is still missing and from what the parent just said, so the path branches
// (homeschool vs. reinforcement, follow-ups on difficulties, …). When the
// profile is complete Lecturina builds the plan; the parent can accept it or
// ask for changes in their own words.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Send, Sparkles, X } from 'lucide-react'
import lecturina from '../assets/lecturina.png'
import { emptyProfile, plannerProfile, profileSummary } from '../../shared/profile.js'
import { SUBJECTS, gradeLabel } from '../../shared/subjects.js'
import { SubjectIcon } from './brand/BrandIcon.jsx'
import { generatePlan, sendChat } from './api.js'
import { STUDENT_COLORS, newId } from './store.js'
import PlanView from './PlanView.jsx'
import DeprPanel from './DeprPanel.jsx'

const CREATE = '¡Crea mi plan!'
const CHANGE = 'Quiero cambiar algo'

const FIRST_TURN = {
  reaction: '¡Hola! Soy Lecturina.',
  question: '¿Cómo te puedo ayudar?',
  intro: 'Te haré unas preguntas cortas y armaré un plan de estudio con lecciones de Genial Skills, a la medida de tu hijo(a).',
  options: ['Educamos en casa (homeschool)', 'Refuerzo en algunas materias', 'Trabajar una destreza específica'],
  multiSelect: false,
}

const BUILD_STEPS = ['Leyendo lo que me contaste', 'Buscando lecciones de Genial Skills', 'Ordenando la secuencia de cada materia', 'Armando el calendario']

/** Strips a leading emoji the model may still add: "<emoji> Matemáticas" → "Matemáticas". */
function splitEmoji(option) {
  const m = String(option).match(/^(\p{Extended_Pictographic}(?:️|⃣|‍\p{Extended_Pictographic})*|\d️?⃣)\s*(.*)$/u)
  return m ? { icon: m[1], label: m[2] } : { icon: null, label: option }
}

const SUBJECT_BY_NAME = Object.fromEntries(Object.values(SUBJECTS).map(s => [s.name.toLowerCase(), s.key]))
const subjectFromLabel = label => SUBJECT_BY_NAME[String(label).toLowerCase().trim()] || (/^ingl/i.test(label) ? 'english' : /^(sociales|estudios)/i.test(label) ? 'social' : null)

function SpeechBubble({ children, busy }) {
  return (
    <div className="relative mx-auto max-w-[300px] rounded-3xl bg-white px-5 py-4 text-[15px] leading-snug font-semibold text-navy shadow-xl">
      {busy ? (
        <span className="flex h-6 items-center gap-1.5" aria-label="Lecturina está pensando">
          {[0, 1, 2].map(i => <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: `${i * 140}ms` }} />)}
        </span>
      ) : children}
      <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white ring-1 ring-slate-100 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
    </div>
  )
}

function OptionButton({ option, index, selected, multi, primary, onClick }) {
  const { label } = splitEmoji(option)
  const subject = subjectFromLabel(label)
  if (primary) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group col-span-full flex items-center justify-center gap-3 rounded-2xl bg-brand px-6 py-5 font-display text-xl font-semibold text-white shadow-[0_14px_30px_-12px_rgba(244,125,69,0.9)] transition-all hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
      >
        <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" /> {label}
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={multi ? selected : undefined}
      className={`group relative flex items-center gap-4 rounded-2xl border-2 bg-white px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${
        selected ? 'border-brand bg-[#fff5ee] shadow-md' : 'border-sand hover:border-gold'
      }`}
    >
      {subject
        ? <SubjectIcon subject={subject} size={36} className="transition-transform group-hover:scale-110" />
        : <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-semibold transition-colors ${selected ? 'bg-brand text-white' : 'bg-cream text-gold-dark group-hover:bg-gold-light'}`}>{String.fromCharCode(65 + index)}</span>}
      <span className="flex-1 text-[15px] leading-snug font-bold text-navy">{label}</span>
      {multi ? (
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? 'border-brand bg-brand text-white' : 'border-slate-300'}`}>
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
      ) : (
        index < 9 && <kbd className="hidden shrink-0 rounded-md border border-sand px-1.5 font-sans text-xs font-bold text-slate-400 sm:block">{index + 1}</kbd>
      )}
    </button>
  )
}

export default function GuidedOnboarding({ studentCount = 0, onSaveStudent, onFinish }) {
  const [profile, setProfile] = useState(emptyProfile)
  const [turn, setTurn] = useState(FIRST_TURN)
  const [messages, setMessages] = useState([{ role: 'assistant', content: `${FIRST_TURN.reaction} ${FIRST_TURN.question}` }])
  const [history, setHistory] = useState([])
  const [picked, setPicked] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState('questions') // questions | building | plan
  const [plan, setPlan] = useState(null)
  const [buildStep, setBuildStep] = useState(0)
  const [bubble, setBubble] = useState(null) // overrides the reaction (errors, plan comments)
  const [viewPlan, setViewPlan] = useState(false)
  const inputRef = useRef(null)

  const name = profile.child.name || 'tu hijo(a)'
  const summary = profileSummary(profile)
  const required = summary.filter(f => !f.optional)
  const known = required.filter(f => f.value).length
  const knownChips = summary.filter(f => f.value).slice(0, 6)

  useEffect(() => {
    if (phase !== 'building') return
    setBuildStep(0)
    const t = setInterval(() => setBuildStep(s => Math.min(s + 1, BUILD_STEPS.length - 1)), 1800)
    return () => clearInterval(t)
  }, [phase])

  const build = async nextProfile => {
    setPhase('building')
    setBubble(`¡Manos a la obra! Estoy armando el plan de ${nextProfile.child.name}.`)
    try {
      const result = await generatePlan(plannerProfile(nextProfile))
      if (!result.subjects?.length) throw new Error('No encontré lecciones publicadas para esas materias y ese grado.')
      setPlan(result)
      setPhase('plan')
      setBubble(`¿Qué te parece? Si quieres cambiar algo, dímelo abajo con tus palabras y lo ajusto.`)
    } catch (err) {
      setPhase(plan ? 'plan' : 'questions')
      setBubble(`Ay, algo falló armando el plan (${err.message}). ¿Lo intentamos de nuevo?`)
    }
  }

  const answer = async raw => {
    const text = String(raw || '').trim()
    if (!text || busy) return
    if (text === CREATE && ready) return build(profile)
    setInput('')
    setPicked([])
    const nextMessages = [...messages, { role: 'user', content: text }]
    if (phase === 'questions') setHistory(h => [...h, { profile, turn, messages, ready }])
    setBusy(true)
    setBubble(null)
    try {
      const r = await sendChat({ messages: nextMessages, profile, planExists: !!plan })
      setMessages([...nextMessages, { role: 'assistant', content: r.reply }])
      setProfile(r.profile)
      setReady(r.ready)
      if (phase === 'plan') {
        setBubble(r.reaction || r.question)
        setBusy(false)
        if (r.regenerate) await build(r.profile)
        return
      }
      setTurn({ reaction: r.reaction, question: r.question, options: r.quickReplies, multiSelect: r.multiSelect })
    } catch (err) {
      setBubble(`Perdona, tuve un problema de conexión (${err.message}). ¿Lo intentas otra vez?`)
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  const back = () => {
    const prev = history[history.length - 1]
    if (!prev || busy) return
    setHistory(h => h.slice(0, -1))
    setProfile(prev.profile)
    setTurn(prev.turn)
    setMessages(prev.messages)
    setReady(prev.ready)
    setPicked([])
    setBubble(null)
  }

  const accept = () => {
    const p = plannerProfile(profile)
    onSaveStudent({
      id: newId(),
      name: p.child.name,
      age: p.child.age,
      level: p.child.level,
      language: p.child.language,
      color: STUDENT_COLORS[studentCount % STUDENT_COLORS.length],
      profile: p,
      plan,
    })
    onFinish()
  }

  const close = () => {
    if (window.confirm('¿Salir? Podrás volver a hablar con Lecturina desde Planificación.')) onFinish()
  }

  // Keyboard: 1-9 picks an option, Esc closes
  const keyRef = useRef()
  keyRef.current = e => {
    if (e.key === 'Escape') return viewPlan ? setViewPlan(false) : close()
    if (phase !== 'questions' || busy || /INPUT|TEXTAREA/.test(e.target?.tagName || '')) return
    const i = Number(e.key) - 1
    const option = turn.options?.[i]
    if (option && !turn.multiSelect) answer(option)
  }
  useEffect(() => {
    const onKey = e => keyRef.current(e)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const options = useMemo(() => {
    const list = turn.options || []
    // Keep the "create" button last and full width.
    return [...list.filter(o => o !== CREATE), ...list.filter(o => o === CREATE)]
  }, [turn.options])

  const bubbleText = bubble ?? (phase === 'questions' ? (turn.reaction || '¡Cuéntame!') : '')
  const counts = plan ? plan.sessions.reduce((a, s) => ({ ...a, [s.kind]: (a[s.kind] || 0) + 1 }), {}) : {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label="Plan de estudio con Lecturina">
      <div className="relative grid h-[min(780px,94vh)] w-full max-w-6xl overflow-hidden rounded-[32px] bg-cream shadow-2xl lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: question + answers */}
        <section className="flex min-h-0 flex-col">
          <header className="flex items-center gap-4 px-6 pt-6 sm:px-10">
            <button type="button" onClick={back} disabled={!history.length || busy || phase !== 'questions'} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:invisible">
              <ArrowLeft className="h-4 w-4" /> Atrás
            </button>
            <div className="flex flex-1 items-center gap-1.5" aria-label={`${known} de ${required.length} datos`}>
              {required.map((f, i) => (
                <span key={f.label} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i < known ? 'bg-brand' : 'bg-sand'}`} />
              ))}
            </div>
            <button type="button" onClick={close} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar"><X className="h-5 w-5" /></button>
          </header>

          {/* Mobile: Lecturina inline */}
          <div className="flex items-center gap-3 px-6 pt-5 lg:hidden">
            <img src={lecturina} alt="" className="h-14 w-14" />
            <p className="rounded-2xl rounded-tl-sm bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm">{busy ? '…' : bubbleText}</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6 sm:px-10">
            {phase === 'questions' && (
              <div key={turn.question} className="my-auto animate-in fade-in slide-in-from-bottom-3 duration-500">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-dark">Lecturina pregunta</p>
                <h2 className="font-display text-3xl leading-tight font-semibold text-balance text-navy sm:text-[2.6rem]">{turn.question}</h2>
                {turn.intro && <p className="mt-3 max-w-xl text-lg text-slate-500">{turn.intro}</p>}

                {options.length > 0 && (
                  <div className={`mt-8 grid gap-3 ${options.length > 3 ? 'sm:grid-cols-2' : ''} ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                    {options.map((o, i) => (
                      <OptionButton
                        key={o}
                        option={o}
                        index={i}
                        multi={turn.multiSelect && o !== CREATE}
                        primary={o === CREATE}
                        selected={picked.includes(o)}
                        onClick={() => (turn.multiSelect && o !== CREATE
                          ? setPicked(p => (p.includes(o) ? p.filter(x => x !== o) : [...p, o]))
                          : answer(o))}
                      />
                    ))}
                  </div>
                )}
                {turn.multiSelect && (
                  <button
                    type="button"
                    disabled={!picked.length || busy}
                    onClick={() => answer(picked.map(p => splitEmoji(p).label).join(', '))}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white transition-all hover:bg-navy-2 disabled:opacity-30"
                  >
                    Continuar{picked.length ? ` (${picked.length})` : ''} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {phase === 'building' && (
              <div className="my-auto animate-in fade-in duration-500">
                <h2 className="font-display text-3xl font-semibold text-navy sm:text-[2.6rem]">Estoy armando el plan de {name}…</h2>
                <ul className="mt-8 space-y-4">
                  {BUILD_STEPS.map((s, i) => (
                    <li key={s} className={`flex items-center gap-3 text-lg transition-opacity ${i > buildStep ? 'opacity-30' : ''}`}>
                      {i < buildStep ? <CheckCircle2 className="h-7 w-7 text-mint" /> : i === buildStep ? <Loader2 className="h-7 w-7 animate-spin text-brand" /> : <span className="h-7 w-7 rounded-full border-2 border-sand" />}
                      <span className="text-slate-700">{s.replace('lecciones', `lecciones de ${gradeLabel(profile.child.level || '3')}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {phase === 'plan' && plan && (
              <div className="my-auto animate-in fade-in slide-in-from-bottom-3 duration-500">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-gold-dark">{plan.mode === 'refuerzo' ? 'Plan de refuerzo' : 'Plan de estudio'} listo</p>
                <h2 className="font-display text-3xl font-semibold text-navy sm:text-[2.6rem]">El plan de {name}</h2>
                <div className="mt-6 overflow-hidden rounded-3xl border border-sand bg-white shadow-sm">
                  <div className="space-y-4 p-6">
                    <p className="leading-relaxed text-slate-600">{plan.summary}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {plan.subjects.map(s => (
                        <div key={s.key} className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3">
                          <SubjectIcon subject={s.key} size={32} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-500">{s.sessionsPerWeek} sesiones/sem · {s.lessons.length} lecciones</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">
                      {plan.settings.weeks} semanas · {counts.learn || 0} lecciones, {counts.practice || 0} prácticas, {counts.exam || 0} exámenes y {counts.review || 0} repasos
                    </p>
                    {plan.depr && <DeprPanel plan={plan} gradeName={gradeLabel(profile.child.level)} compact />}
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={accept} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-bold text-white shadow-[0_14px_30px_-12px_rgba(244,125,69,0.9)] transition-all hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-40">
                    <Check className="h-5 w-5" /> Aceptar y empezar
                  </button>
                  <button type="button" onClick={() => setViewPlan(true)} className="rounded-full border border-sand bg-white px-6 py-3 font-bold text-navy transition-colors hover:border-gold">
                    Ver plan completo
                  </button>
                </div>
              </div>
            )}
          </div>

          {phase !== 'building' && (
            <form onSubmit={e => { e.preventDefault(); answer(input) }} className="px-6 pb-6 sm:px-10">
              <div className="flex items-center gap-2 rounded-2xl border-2 border-sand bg-white p-1.5 pl-4 shadow-sm transition-colors focus-within:border-gold">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={phase === 'plan' ? '¿Quieres cambiar algo? Dímelo con tus palabras…' : 'O escríbelo con tus palabras…'}
                  className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  aria-label="Respuesta escrita"
                  disabled={busy}
                />
                <button type="submit" disabled={!input.trim() || busy} className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white transition-all hover:bg-navy-2 disabled:bg-sand" aria-label="Enviar">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Right: Lecturina */}
        <aside className="relative hidden flex-col items-center justify-center overflow-hidden bg-navy px-8 lg:flex">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-mint/25 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center">
            {(bubbleText || busy) && (
              <div key={bubbleText} className="mb-6 animate-in fade-in zoom-in-95 duration-300">
                <SpeechBubble busy={busy}>{bubbleText}</SpeechBubble>
              </div>
            )}
            <div className="lecturina-float relative">
              <span className="absolute inset-0 rounded-full bg-white/40 blur-xl" />
              <div className="relative flex h-60 w-60 items-center justify-center rounded-full bg-white shadow-[0_24px_50px_rgba(15,23,42,0.30)] ring-8 ring-white/30">
                <img src={lecturina} alt="Lecturina, asistente de Genial Skills" className="h-48 w-48" />
              </div>
            </div>
            <p className="mt-5 font-display text-xl font-semibold text-white">Lecturina</p>
            <p className="text-sm text-white/70">Tu asistente de Genial Skills</p>
          </div>
          {knownChips.length > 0 && (
            <div className="absolute inset-x-6 bottom-6 z-10 flex flex-wrap justify-center gap-1.5">
              {knownChips.map(f => (
                <span key={f.label} className="max-w-full truncate rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/90 ring-1 ring-white/15" title={`${f.label}: ${f.value}`}>
                  {f.value}
                </span>
              ))}
            </div>
          )}
        </aside>
      </div>

      {viewPlan && plan && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 p-2 sm:p-4" onClick={() => setViewPlan(false)}>
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] bg-cream p-4 shadow-2xl sm:p-8" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-2xl font-semibold text-navy">El plan de {name}</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => setViewPlan(false)} className="rounded-full border bg-white px-4 py-1.5 text-sm hover:bg-gray-50">Volver</button>
                <button type="button" onClick={accept} className="rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-dark">Aceptar y empezar</button>
              </div>
            </div>
            <div className="space-y-8">
              <PlanView plan={plan} childLevel={profile.child.level} />
              {plan.depr && <DeprPanel plan={plan} gradeName={gradeLabel(profile.child.level)} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
