// Inicio — one screen that answers "what do we do today?".
//   Hero: greeting, today's summary, the next session as the main action, and
//         Lecturina with a tip from the plan.
//   Hoy:  one column per child with today's sessions (or the next study day).
//   Side: this week at a glance, upcoming exams, DEPR curriculum (if on).
// Without students it is a welcome screen that starts the onboarding.
import { useMemo } from 'react'
import { ArrowRight, BookOpenCheck, CalendarCheck2, CheckCircle2, Circle, Landmark, Play, RotateCcw, Sparkles } from 'lucide-react'
import lecturina from '../../assets/lecturina.png'
import { gradeLabel } from '../../../shared/subjects.js'
import { WEEKDAY_LABELS, parseISODate, toISODate } from '../../../shared/scheduler.js'
import { progressKey } from '../store.js'
import { deprCoverage } from '../depr.js'
import { SubjectIcon } from '../brand/BrandIcon.jsx'
import { Button, KindBadge, Panel, PanelTitle, ProgressBar, Ring, StudentAvatar, subjectMeta } from '../ui.jsx'

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

function mondayOf(iso) {
  const d = parseISODate(iso)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function longDate(iso) {
  return parseISODate(iso).toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function Welcome({ onStart }) {
  const features = [
    { icon: Sparkles, title: 'Un plan a la medida', text: 'Lecturina te hace unas preguntas y arma el plan de tu hijo(a), sea homeschool completo o refuerzo de algunas destrezas.' },
    { icon: BookOpenCheck, title: 'Lecciones reales de Genial Skills', text: 'Cada lección con su práctica y su examen, en días distintos, y repasos de lo aprendido.' },
    { icon: Landmark, title: 'Alineado al DEPR, si lo quieres', text: 'Ve qué expectativas del grado vas cubriendo según los estándares del Departamento de Educación.' },
    { icon: CalendarCheck2, title: 'Un calendario que se ajusta', text: 'Dile a Lecturina "solo lunes y miércoles" y el plan se reorganiza solo.' },
  ]
  return (
    <div className="relative overflow-hidden rounded-[36px] bg-navy px-6 py-10 text-white sm:px-12 sm:py-14">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-mint/20 blur-3xl" />
      <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="mb-3 text-xs font-extrabold tracking-[0.18em] text-gold uppercase">Genial Skills Homeschool</p>
          <h1 className="max-w-2xl font-display text-4xl leading-[1.05] font-semibold sm:text-5xl">Planifica el aprendizaje de tu hijo(a) en minutos</h1>
          <p className="mt-4 max-w-xl text-lg text-white/75">Cuéntale a Lecturina cómo es tu hijo(a) y qué necesita. Ella arma el plan, el calendario y las lecciones.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/90"><Icon className="h-5 w-5" /></span>
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className="mt-0.5 block text-sm text-white/65">{text}</span>
                </span>
              </div>
            ))}
          </div>
          <Button variant="primary" size="lg" className="mt-9" onClick={onStart}>
            Comenzar con Lecturina <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative mx-auto hidden lg:block">
          <div className="lecturina-float flex h-72 w-72 items-center justify-center rounded-full bg-white shadow-[0_30px_60px_rgba(0,0,0,0.35)] ring-[14px] ring-white/10">
            <img src={lecturina} alt="Lecturina" className="h-56 w-56" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SessionRow({ session, student, done, onToggle, onOpen, onPlay }) {
  const subject = subjectMeta(session.subjectKey)
  return (
    <li className={`group flex items-center gap-3 rounded-2xl border p-3 transition-all ${done ? 'border-transparent bg-cream/70' : 'border-sand bg-white hover:border-gold hover:shadow-md'}`}>
      <button type="button" onClick={onToggle} aria-label={done ? 'Marcar como pendiente' : 'Marcar como completada'} className="shrink-0 text-slate-300 transition-colors hover:text-mint">
        {done ? <CheckCircle2 className="h-6 w-6 text-mint" /> : <Circle className="h-6 w-6" />}
      </button>
      <span className="hidden w-11 shrink-0 text-xs font-bold text-slate-400 sm:block">{session.time}</span>
      <SubjectIcon subject={session.subjectKey} size={34} className="hidden sm:block" />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className={`block text-[15px] leading-snug font-bold sm:truncate ${done ? 'text-slate-400 line-through' : 'text-navy'}`}>
          {session.kind === 'review' && <RotateCcw className="mr-1 inline h-3.5 w-3.5" />}
          {session.title}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className="font-bold sm:hidden">{session.time}</span>
          <span style={{ color: subject.color }} className="font-bold">{subject.name}</span>
          <KindBadge kind={session.kind} />
        </span>
      </button>
      {!done && session.lessonId && (
        <Button variant="primary" size="sm" onClick={() => onPlay(session, student.id)} className="shrink-0" aria-label={`Empezar ${session.title}`}>
          <Play className="h-3.5 w-3.5 fill-current" /> <span className="hidden sm:inline">Empezar</span>
        </Button>
      )}
    </li>
  )
}

export default function Home({ students, parentName = 'Brian', doneKeysByStudent, toggleDone, openSession, playSession, goTo, onStart }) {
  const today = toISODate(new Date())

  const data = useMemo(() => students.map(student => {
    const plan = student.plan
    const done = doneKeysByStudent[student.id] || new Set()
    const firstDate = plan.sessions[0]?.date
    const focusDate = plan.sessions.find(s => s.date >= today)?.date || plan.sessions[plan.sessions.length - 1]?.date
    const monday = mondayOf(firstDate > today ? firstDate : today)
    const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return toISODate(d) })
    const week = plan.sessions.filter(s => s.date >= weekDates[0] && s.date <= weekDates[6])
    const daySessions = plan.sessions.filter(s => s.date === focusDate)
    const lessons = plan.subjects.flatMap(s => s.lessons)
    const exams = plan.sessions.filter(s => s.kind === 'exam' && s.date >= today && !done.has(progressKey(s)))
    return {
      student, plan, done, focusDate, weekDates, week, daySessions,
      weekDone: week.filter(s => done.has(progressKey(s))).length,
      lessonsDone: lessons.filter(l => done.has(`lesson:${l.id}:exam`)).length,
      lessonsTotal: lessons.length,
      exams,
      started: firstDate <= today,
      coverage: student.profile?.depr ? deprCoverage(plan, done) : [],
    }
  }), [students, doneKeysByStudent, today])

  if (!students.length) return <Welcome onStart={onStart} />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const todayAll = data.flatMap(d => d.plan.sessions.filter(s => s.date === today))
  const nextDay = data.map(d => d.focusDate).filter(Boolean).sort()[0]
  const todayPending = data.flatMap(d => d.daySessions.filter(s => s.date === today && !d.done.has(progressKey(s))).map(s => ({ s, d })))
  const next = data.flatMap(d => d.daySessions.filter(s => !d.done.has(progressKey(s)) && s.lessonId).map(s => ({ s, d })))[0]
  const weekTotal = data.reduce((a, d) => a + d.week.length, 0)
  const weekDone = data.reduce((a, d) => a + d.weekDone, 0)
  const notStarted = data.every(d => !d.started)
  const tip = data[0].plan.tips?.[new Date().getDate() % Math.max(1, data[0].plan.tips.length)]
  const summary = notStarted
    ? `El plan empieza el ${longDate(data[0].plan.sessions[0].date)}. Así se ve el primer día.`
    : !todayAll.length
      ? `Hoy no hay sesiones. Lo próximo es el ${longDate(nextDay)}.`
      : todayPending.length
        ? `Hoy ${todayPending.length === 1 ? 'queda 1 sesión' : `quedan ${todayPending.length} sesiones`}${students.length > 1 ? ` entre ${students.map(s => s.name).join(' y ')}` : ` para ${students[0].name}`}.`
        : 'Todo lo de hoy está hecho. ¡Excelente trabajo!'

  // This week, all children combined
  const weekDates = data[0].weekDates
  const perDay = weekDates.map(date => {
    const items = data.flatMap(d => d.week.filter(s => s.date === date).map(s => d.done.has(progressKey(s))))
    return { date, total: items.length, done: items.filter(Boolean).length }
  })
  const maxDay = Math.max(1, ...perDay.map(d => d.total))
  const exams = data.flatMap(d => d.exams.map(s => ({ s, d }))).sort((a, b) => a.s.date.localeCompare(b.s.date)).slice(0, 4)
  const coverage = data.filter(d => d.coverage.length)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-navy text-white">
        <div className="pointer-events-none absolute -top-28 right-40 h-80 w-80 rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-10 h-80 w-80 rounded-full bg-mint/20 blur-3xl" />
        <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gold first-letter:uppercase">{longDate(today)}</p>
            <h1 className="mt-1 font-display text-4xl font-semibold sm:text-5xl">{greeting}, {parentName}</h1>
            <p className="mt-3 max-w-xl text-lg text-white/75">{summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {next ? (
                <button
                  type="button"
                  onClick={() => playSession(next.s, next.d.student.id)}
                  className="group flex max-w-full min-w-0 items-center gap-4 rounded-[22px] bg-white py-2.5 pr-5 pl-2.5 text-left text-navy shadow-xl transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white transition-transform group-hover:scale-105"><Play className="h-5 w-5 fill-current" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold tracking-wide text-brand uppercase">Siguiente · {next.d.student.name}</span>
                    <span className="block max-w-[320px] truncate font-display text-lg font-semibold">{next.s.title}</span>
                  </span>
                </button>
              ) : null}
              <Button variant="light" onClick={() => goTo('calendario')}>Ver la semana</Button>
            </div>
          </div>
          <div className="hidden items-end gap-4 lg:flex">
            {tip && (
              <div className="relative mb-16 max-w-[260px] rounded-3xl rounded-br-md bg-white px-5 py-4 text-sm text-navy shadow-xl">
                <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-brand uppercase">Consejo de Lecturina</span>
                {tip}
              </div>
            )}
            <div className="lecturina-float flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-white shadow-2xl ring-8 ring-white/10">
              <img src={lecturina} alt="Lecturina" className="h-32 w-32" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Today, per child */}
        <div className={`grid grid-cols-[minmax(0,1fr)] gap-6 ${data.length > 1 ? '2xl:grid-cols-2' : ''}`}>
          {data.map(d => {
            const pct = d.week.length ? d.weekDone / d.week.length : 0
            return (
              <Panel key={d.student.id} className="p-6">
                <div className="mb-5 flex items-center gap-4">
                  <StudentAvatar student={d.student} size={52} />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-semibold text-navy">{d.student.name}</h2>
                    <p className="text-sm text-slate-500">{gradeLabel(d.student.level)} · {d.plan.mode === 'refuerzo' ? 'Refuerzo' : 'Homeschool'}</p>
                  </div>
                  <div className="text-right">
                    <Ring value={pct} size={58} stroke={6} color={d.student.color} />
                  </div>
                </div>
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="font-display font-semibold text-navy">{d.focusDate === today ? 'Hoy' : <span className="inline-block first-letter:uppercase">{longDate(d.focusDate)}</span>}</p>
                  <p className="text-xs font-bold text-slate-400">{d.weekDone} de {d.week.length} sesiones esta semana</p>
                </div>
                <ul className="space-y-2.5">
                  {d.daySessions.map(s => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      student={d.student}
                      done={d.done.has(progressKey(s))}
                      onToggle={() => toggleDone(d.student.id, s)}
                      onOpen={() => openSession(s, d.student.id)}
                      onPlay={playSession}
                    />
                  ))}
                </ul>
                <div className="mt-5 flex items-center gap-3 border-t border-sand pt-4">
                  <ProgressBar value={d.lessonsTotal ? d.lessonsDone / d.lessonsTotal : 0} color={d.student.color} className="flex-1" />
                  <span className="shrink-0 text-xs font-bold text-slate-500">{d.lessonsDone}/{d.lessonsTotal} lecciones del plan</span>
                </div>
              </Panel>
            )
          })}
        </div>

        {/* Side rail */}
        <div className="space-y-6">
          <Panel className="p-6">
            <PanelTitle action={<button type="button" onClick={() => goTo('calendario')} className="text-sm font-bold text-brand hover:underline">Calendario</button>}>Esta semana</PanelTitle>
            <div className="flex h-32 items-end justify-between gap-2">
              {perDay.map(day => {
                const d = parseISODate(day.date)
                const isToday = day.date === today
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5" title={`${WEEKDAY_LABELS[d.getDay()]}: ${day.done}/${day.total}`}>
                    <div className="relative flex h-24 w-full max-w-[30px] items-end overflow-hidden rounded-xl bg-cream">
                      <div className="w-full rounded-xl bg-gold-light" style={{ height: `${(day.total / maxDay) * 100}%` }}>
                        <div className="h-full w-full origin-bottom rounded-xl bg-mint transition-transform duration-700" style={{ transform: `scaleY(${day.total ? day.done / day.total : 0})` }} />
                      </div>
                    </div>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${isToday ? 'bg-navy text-white' : 'text-slate-400'}`}>{DAY_LETTERS[d.getDay()]}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">Completadas</span>
              <span className="font-display font-semibold text-navy">{weekDone} de {weekTotal}</span>
            </div>
          </Panel>

          <Panel className="p-6">
            <PanelTitle>Próximos exámenes</PanelTitle>
            {exams.length ? (
              <ul className="space-y-3">
                {exams.map(({ s, d }) => (
                  <li key={`${d.student.id}-${s.id}`}>
                    <button type="button" onClick={() => openSession(s, d.student.id)} className="flex w-full items-center gap-3 rounded-2xl p-1.5 text-left hover:bg-cream">
                      <SubjectIcon subject={s.subjectKey} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-navy">{s.title}</span>
                        <span className="block text-xs text-slate-500">{students.length > 1 ? `${d.student.name} · ` : ''}<span className="inline-block first-letter:uppercase">{parseISODate(s.date).toLocaleDateString('es-PR', { weekday: 'short', day: 'numeric', month: 'short' })}</span></span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No hay exámenes pendientes.</p>}
          </Panel>

          {coverage.length > 0 && (
            <Panel className="p-6">
              <PanelTitle action={<button type="button" onClick={() => goTo('planificacion')} className="text-sm font-bold text-brand hover:underline">Detalle</button>}>Currículo DEPR</PanelTitle>
              <div className="space-y-5">
                {coverage.map(d => (
                  <div key={d.student.id}>
                    {coverage.length > 1 && <p className="mb-2 text-xs font-extrabold tracking-wide text-slate-400 uppercase">{d.student.name}</p>}
                    <div className="space-y-3">
                      {d.coverage.map(c => (
                        <div key={c.key} className="flex items-center gap-3">
                          <SubjectIcon subject={c.key} size={24} />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="font-bold text-navy">{c.name}</span>
                              <span className="text-slate-500">{c.planned}/{c.total}</span>
                            </div>
                            <ProgressBar value={c.total ? c.planned / c.total : 0} color={subjectMeta(c.key).color} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-400">Expectativas del grado cubiertas por el plan.</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
