// Family calendar: every student's sessions by month or week.
import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { WEEKDAY_SHORT, WEEKDAY_LABELS, parseISODate, toISODate } from '../../../shared/scheduler.js'
import { progressKey } from '../store.js'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

function startOfWeek(d) {
  const x = new Date(d)
  x.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return x
}

export default function CalendarSection({ state, doneKeysByStudent, openSession }) {
  const today = toISODate(new Date())
  const firstDate = useMemo(() => {
    const dates = state.students.map(s => s.plan.sessions[0]?.date).filter(Boolean).sort()
    return dates[0] && dates[0] > today ? dates[0] : today
  }, [state.students, today])

  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(() => parseISODate(firstDate))
  const [hidden, setHidden] = useState(() => new Set())

  const byDate = useMemo(() => {
    const map = new Map()
    for (const student of state.students) {
      if (hidden.has(student.id)) continue
      const subjects = Object.fromEntries(student.plan.subjects.map(s => [s.key, s]))
      for (const session of student.plan.sessions) {
        if (!map.has(session.date)) map.set(session.date, [])
        map.get(session.date).push({ session, student, subject: subjects[session.subjectKey] })
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.session.time.localeCompare(b.session.time))
    return map
  }, [state.students, hidden])

  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(cursor)
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = startOfWeek(first)
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    const count = Math.ceil(((last - start) / 86400000 + 1) / 7) * 7
    return Array.from({ length: count }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }, [view, cursor])

  const move = delta => setCursor(c => {
    const d = new Date(c)
    if (view === 'week') d.setDate(d.getDate() + 7 * delta)
    else d.setMonth(d.getMonth() + delta, 1)
    return d
  })

  const title = view === 'month'
    ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    : `Semana del ${days[0].getDate()} de ${MONTHS[days[0].getMonth()].toLowerCase()}`

  const Pill = ({ item, compact }) => {
    const done = doneKeysByStudent[item.student.id]?.has(progressKey(item.session))
    return (
      <button
        type="button"
        onClick={() => openSession(item.session, item.student.id)}
        title={`${item.student.name} · ${item.subject?.name} · ${item.session.title}`}
        className={`flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] leading-tight hover:brightness-95 ${done ? 'opacity-50' : ''}`}
        style={{ backgroundColor: `${item.subject?.color}1f`, color: item.subject?.color }}
      >
        {state.students.length > 1 && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.student.color }} />}
        {done && <CheckCircle2 className="h-3 w-3 shrink-0" />}
        <span className={`truncate font-medium ${compact ? '' : 'whitespace-normal'}`}>
          {compact ? item.session.title : `${item.session.time} · ${item.session.title}`}
        </span>
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Calendario</h1>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
          {[['month', 'Mes'], ['week', 'Semana']].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setView(id)} className={`rounded-md px-3 py-1.5 font-medium ${view === id ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => move(1)} className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label="Siguiente"><ChevronRight className="h-4 w-4" /></button>
          <button type="button" onClick={() => setCursor(parseISODate(firstDate))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">{firstDate === today ? 'Hoy' : 'Inicio del plan'}</button>
          <h2 className="ml-2 text-lg font-semibold text-slate-800">{title}</h2>
        </div>
        {state.students.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {state.students.map(s => (
              <label key={s.id} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={!hidden.has(s.id)}
                  onChange={() => setHidden(h => { const n = new Set(h); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n })}
                  style={{ accentColor: s.color }}
                />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <div className="grid min-w-[720px] grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          {WEEK_ORDER.map(d => <div key={d} className="py-2">{view === 'week' ? WEEKDAY_LABELS[d] : WEEKDAY_SHORT[d]}</div>)}
        </div>
        <div className="grid min-w-[720px] grid-cols-7">
          {days.map(d => {
            const iso = toISODate(d)
            const items = byDate.get(iso) || []
            const outside = view === 'month' && d.getMonth() !== cursor.getMonth()
            const limit = view === 'month' ? 3 : Infinity
            return (
              <div key={iso} className={`border-b border-r border-slate-100 p-1.5 ${view === 'month' ? 'min-h-28' : 'min-h-96'} ${outside ? 'bg-slate-50/60' : ''}`}>
                <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${iso === today ? 'bg-[#c0a267] text-white' : outside ? 'text-slate-300' : 'text-slate-600'}`}>
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {items.slice(0, limit).map(item => <Pill key={`${item.student.id}-${item.session.id}`} item={item} compact={view === 'month'} />)}
                  {items.length > limit && (
                    <button type="button" onClick={() => { setView('week'); setCursor(d) }} className="px-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800">
                      +{items.length - limit} más
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        {[...new Map(state.students.flatMap(s => s.plan.subjects).map(s => [s.key, s])).values()].map(s => (
          <span key={s.key} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />{s.name}</span>
        ))}
      </div>
    </div>
  )
}
