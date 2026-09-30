// "Hoy": what each student studies today (or on the next study day), with
// quick completion checkboxes and progress for the week and the whole plan.
import { useMemo } from 'react'
import { ArrowRight, CheckCircle2, Circle, Lightbulb, Play, RotateCcw } from 'lucide-react'
import { gradeLabel } from '../../../shared/subjects.js'
import { WEEKDAY_LABELS, parseISODate, toISODate } from '../../../shared/scheduler.js'
import { progressKey } from '../store.js'
import { ProgressRing } from '../ui.jsx'

function dayTitle(iso, today) {
  if (iso === today) return 'Hoy'
  const d = parseISODate(iso)
  return `${WEEKDAY_LABELS[d.getDay()]} ${d.toLocaleDateString('es-PR', { day: 'numeric', month: 'long' })}`
}

function weekBounds(today) {
  const d = parseISODate(today)
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return [toISODate(monday), toISODate(sunday)]
}

function StudentDay({ student, doneKeys, today, onToggle, onOpen, onPlay, onGoToPlan }) {
  const plan = student.plan
  const subjectByKey = Object.fromEntries(plan.subjects.map(s => [s.key, s]))

  const stats = useMemo(() => {
    const lessons = plan.sessions.filter(s => s.kind === 'lesson')
    const doneLessons = lessons.filter(s => doneKeys.has(progressKey(s))).length
    const [from, to] = weekBounds(today)
    const week = plan.sessions.filter(s => s.date >= from && s.date <= to)
    const weekDone = week.filter(s => doneKeys.has(progressKey(s))).length
    // Earliest date that still has pending work, from today on; falls back to the plan's last day.
    const pendingDates = plan.sessions.filter(s => s.date >= today).map(s => s.date)
    const focusDate = pendingDates[0] || plan.sessions[plan.sessions.length - 1]?.date
    const overdue = plan.sessions.filter(s => s.date < today && !doneKeys.has(progressKey(s)))
    return { lessons: lessons.length, doneLessons, week, weekDone, focusDate, overdue }
  }, [plan.sessions, doneKeys, today])

  const daySessions = plan.sessions.filter(s => s.date === stats.focusDate)
  const started = plan.sessions[0]?.date <= today

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-4 border-b border-slate-100 p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: student.color }}>
          {student.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{student.name}</h2>
          <p className="text-sm text-slate-500">{gradeLabel(student.level)}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right text-xs text-slate-500 sm:block">
            <p><strong className="text-slate-800">{stats.weekDone}/{stats.week.length}</strong> esta semana</p>
            <p><strong className="text-slate-800">{stats.doneLessons}/{stats.lessons}</strong> lecciones del plan</p>
          </div>
          <ProgressRing value={stats.lessons ? stats.doneLessons / stats.lessons : 0} color={student.color} />
        </div>
      </div>

      <div className="p-5">
        {!started && (
          <p className="mb-3 rounded-lg bg-[#c0a267]/10 px-3 py-2 text-sm text-[#7a6230]">
            El plan empieza el {dayTitle(plan.sessions[0].date, today).toLowerCase()}. Así se verá el primer día:
          </p>
        )}
        {started && stats.focusDate !== today && stats.focusDate && (
          <p className="mb-3 text-sm text-slate-500">Hoy no hay sesiones. Próximo día de estudio:</p>
        )}
        <h3 className="mb-3 font-semibold text-slate-800">{stats.focusDate ? dayTitle(stats.focusDate, today) : 'Plan completado'}</h3>
        <ul className="space-y-2">
          {daySessions.map(s => {
            const done = doneKeys.has(progressKey(s))
            const subject = subjectByKey[s.subjectKey]
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-slate-200">
                <button type="button" onClick={() => onToggle(s)} aria-label={done ? 'Marcar como pendiente' : 'Marcar como completada'} className="shrink-0">
                  {done ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Circle className="h-6 w-6 text-slate-300 hover:text-slate-500" />}
                </button>
                <span className="w-12 shrink-0 text-xs font-medium text-slate-500">{s.time}</span>
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: subject?.color }} />
                <button type="button" onClick={() => onOpen(s)} className="min-w-0 flex-1 text-left">
                  <span className="block text-xs font-medium" style={{ color: subject?.color }}>{subject?.name}</span>
                  <span className={`block truncate text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {s.kind === 'review' && <RotateCcw className="mr-1 inline h-3.5 w-3.5" />}
                    {s.title}
                  </span>
                </button>
                <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{s.minutes} min</span>
                {s.lessonId && (
                  <button
                    type="button"
                    onClick={() => onPlay(s)}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                    aria-label={`Empezar ${s.title}`}
                  >
                    <Play className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Empezar</span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {stats.overdue.length > 0 && (
          <button type="button" onClick={onGoToPlan} className="mt-4 flex items-center gap-1 text-sm font-medium text-amber-700 hover:underline">
            {stats.overdue.length} sesiones anteriores sin marcar <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function TodaySection({ state, store, doneKeysByStudent, openSession, playSession, goTo }) {
  const today = toISODate(new Date())
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const tipsFrom = state.students[0]

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{greeting}, {state.parentName}</h1>
        <p className="mt-1 text-slate-600">
          {new Date().toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long' })} · Esto es lo que toca estudiar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {state.students.map(student => (
            <StudentDay
              key={student.id}
              student={student}
              today={today}
              doneKeys={doneKeysByStudent[student.id]}
              onToggle={s => store.toggleDone(student.id, s)}
              onOpen={s => openSession(s, student.id)}
              onPlay={s => playSession(s, student.id)}
              onGoToPlan={() => goTo('calendario')}
            />
          ))}
        </div>

        <aside className="space-y-4">
          {tipsFrom?.plan.tips?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                <Lightbulb className="h-5 w-5 text-[#a88a4f]" /> Consejos del plan de {tipsFrom.name}
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                {tipsFrom.plan.tips.map((t, i) => <li key={i} className="flex gap-2"><span className="text-[#a88a4f]">•</span>{t}</li>)}
              </ul>
            </div>
          )}
          <div className="rounded-2xl bg-slate-800 p-5 text-white">
            <p className="font-semibold">¿Algo cambió?</p>
            <p className="mt-1 text-sm text-slate-300">Ajusta el ritmo, quita lecciones o pide a la IA una nueva versión del plan.</p>
            <button type="button" onClick={() => goTo('plan')} className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[#c0a267] px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-[#d1b67e]">
              Ir al plan de estudio <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
