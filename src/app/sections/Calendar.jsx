// Calendario — every child's sessions by month or week, colored by subject.
import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Play, X } from 'lucide-react'
import { SESSION_KINDS, parseISODate, toISODate } from '../../../shared/scheduler.js'
import { progressKey } from '../store.js'
import { SubjectIcon } from '../brand/BrandIcon.jsx'
import { Button, EmptyState, KindBadge, PageHeader, Panel, Segmented, StudentAvatar, subjectMeta } from '../ui.jsx'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const KIND_OBJECTIVE = {
  learn: 'Concepto, vocabulario y ejemplos de la lección.',
  practice: 'La sección de práctica de la lección.',
  exam: 'El examen de la lección.',
  review: 'Repaso de una lección de semanas anteriores.',
}

const mondayOf = d => { const x = new Date(d); x.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return x }

export default function Calendar({ students, doneKeysByStudent, toggleDone, openSession, playSession, onAdd }) {
  const today = toISODate(new Date())
  const firstDate = useMemo(() => {
    const dates = students.map(s => s.plan.sessions[0]?.date).filter(Boolean).sort()
    return dates[0] && dates[0] > today ? dates[0] : today
  }, [students, today])
  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(() => parseISODate(firstDate))
  const [hidden, setHidden] = useState(() => new Set())
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const subjects = useMemo(() => [...new Set(students.flatMap(s => s.plan.subjects.map(x => x.key)))], [students])
  const byDate = useMemo(() => {
    const map = new Map()
    for (const student of students) {
      if (hidden.has(student.id)) continue
      for (const session of student.plan.sessions) {
        if (subjectFilter !== 'all' && session.subjectKey !== subjectFilter) continue
        if (!map.has(session.date)) map.set(session.date, [])
        map.get(session.date).push({ session, student, done: doneKeysByStudent[student.id]?.has(progressKey(session)) })
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.session.time.localeCompare(b.session.time))
    return map
  }, [students, hidden, subjectFilter, doneKeysByStudent])

  if (!students.length) {
    return (
      <>
        <PageHeader eyebrow="Agenda" title="Calendario" />
        <EmptyState title="Tu calendario está vacío" text="Cuando crees el plan con Lecturina, aquí verás cada lección, práctica y examen." actionLabel="Comenzar con Lecturina" onAction={onAdd} />
      </>
    )
  }

  const move = delta => setCursor(c => { const d = new Date(c); view === 'week' ? d.setDate(d.getDate() + 7 * delta) : d.setMonth(d.getMonth() + delta, 1); return d })
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = mondayOf(monthStart)
  const lastOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
  const cells = Math.ceil(((lastOfMonth - gridStart) / 86400000 + 1) / 7) * 7
  const monthDays = Array.from({ length: cells }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d })
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = mondayOf(cursor); d.setDate(d.getDate() + i); return d })
  const multi = students.length > 1

  const Event = ({ item, detailed }) => {
    const meta = subjectMeta(item.session.subjectKey)
    return (
      <button
        type="button"
        onClick={() => setSelected(item)}
        className={`flex w-full items-start gap-1.5 rounded-xl px-2 py-1.5 text-left transition-all hover:shadow-md ${item.done ? 'opacity-45' : ''}`}
        style={{ backgroundColor: meta.soft, boxShadow: multi ? `inset 3px 0 0 ${item.student.color}` : undefined }}
        title={`${item.session.title} · ${meta.name}${multi ? ` · ${item.student.name}` : ''}`}
      >
        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[11px] font-bold text-navy ${item.done ? 'line-through' : ''}`}>{item.session.title}</span>
          <span className="block text-[10px] font-bold text-slate-500">{item.session.time} · {SESSION_KINDS[item.session.kind].short}</span>
          {detailed && multi && <span className="block text-[10px] text-slate-500">{item.student.name}</span>}
        </span>
      </button>
    )
  }

  const title = view === 'month'
    ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    : `${weekDays[0].getDate()} – ${weekDays[6].getDate()} de ${MONTHS[weekDays[6].getMonth()]}`

  return (
    <>
      <PageHeader eyebrow="Agenda" title="Calendario" subtitle="Lecciones, prácticas, exámenes y repasos de cada día." actions={<Segmented value={view} onChange={setView} options={[{ value: 'month', label: 'Mes' }, { value: 'week', label: 'Semana' }]} />} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} className="rounded-full border border-sand bg-white p-2 hover:border-gold" aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => move(1)} className="rounded-full border border-sand bg-white p-2 hover:border-gold" aria-label="Siguiente"><ChevronRight className="h-4 w-4" /></button>
          <h2 className="ml-2 font-display text-2xl font-semibold text-navy first-letter:uppercase">{title}</h2>
          <Button size="sm" className="ml-2" onClick={() => setCursor(parseISODate(firstDate))}>{firstDate === today ? 'Hoy' : 'Inicio del plan'}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {multi && students.map(s => (
            <button key={s.id} type="button" onClick={() => setHidden(h => { const n = new Set(h); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n })} className={`flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-bold transition-opacity ${hidden.has(s.id) ? 'border-sand bg-white opacity-40' : 'border-sand bg-white'}`} aria-pressed={!hidden.has(s.id)}>
              <StudentAvatar student={s} size={24} /> {s.name}
            </button>
          ))}
          <div className="flex flex-wrap gap-1 rounded-full border border-sand bg-white p-1">
            <button type="button" onClick={() => setSubjectFilter('all')} className={`rounded-full px-3 py-1 text-xs font-bold ${subjectFilter === 'all' ? 'bg-navy text-white' : 'text-slate-500'}`}>Todas</button>
            {subjects.map(k => (
              <button key={k} type="button" onClick={() => setSubjectFilter(k)} className={`flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-1 text-xs font-bold ${subjectFilter === k ? 'bg-navy text-white' : 'text-slate-500'}`}>
                <SubjectIcon subject={k} size={18} /> {subjectMeta(k).name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 border-b border-sand bg-cream/60">
              {weekDays.map((d, i) => (
                <div key={i} className="px-3 py-2.5 text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                  {DAYS[i]}{view === 'week' && <span className={`ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full font-display text-sm normal-case ${toISODate(d) === today ? 'bg-brand text-white' : 'text-navy'}`}>{d.getDate()}</span>}
                </div>
              ))}
            </div>
            {view === 'month' ? (
              <div className="grid grid-cols-7">
                {monthDays.map(d => {
                  const iso = toISODate(d)
                  const items = byDate.get(iso) || []
                  const inMonth = d.getMonth() === cursor.getMonth()
                  return (
                    <div key={iso} className={`min-h-[118px] border-r border-b border-sand/70 p-1.5 ${inMonth ? '' : 'bg-cream/40'}`}>
                      <span className={`mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full font-display text-sm ${iso === today ? 'bg-brand font-semibold text-white' : inMonth ? 'text-navy' : 'text-slate-300'}`}>{d.getDate()}</span>
                      {inMonth && (
                        <div className="space-y-1">
                          {items.slice(0, 3).map(item => <Event key={`${item.student.id}-${item.session.id}`} item={item} />)}
                          {items.length > 3 && <button type="button" onClick={() => { setView('week'); setCursor(d) }} className="px-2 text-[11px] font-bold text-brand hover:underline">+{items.length - 3} más</button>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {weekDays.map(d => {
                  const items = byDate.get(toISODate(d)) || []
                  return (
                    <div key={toISODate(d)} className="min-h-[420px] space-y-1.5 border-r border-sand/70 p-2">
                      {items.length ? items.map(item => <Event key={`${item.student.id}-${item.session.id}`} item={item} detailed />) : <p className="pt-6 text-center text-xs text-slate-300">Libre</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Detalle de la sesión">
            <div className="flex items-start gap-4 p-6" style={{ backgroundColor: subjectMeta(selected.session.subjectKey).soft }}>
              <SubjectIcon subject={selected.session.subjectKey} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold tracking-wide uppercase" style={{ color: subjectMeta(selected.session.subjectKey).color }}>{subjectMeta(selected.session.subjectKey).name}</p>
                <h3 className="mt-0.5 font-display text-xl font-semibold text-navy">{selected.session.title}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-white/60" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <KindBadge kind={selected.session.kind} />
                <span className="text-slate-500 inline-block first-letter:uppercase">{parseISODate(selected.session.date).toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long' })} · {selected.session.time} · {selected.session.minutes} min</span>
              </div>
              {multi && <p className="flex items-center gap-2 text-sm font-bold text-navy"><StudentAvatar student={selected.student} size={24} /> {selected.student.name}</p>}
              <p className="text-sm text-slate-600">{KIND_OBJECTIVE[selected.session.kind]}</p>
              <button type="button" onClick={() => { toggleDone(selected.student.id, selected.session); setSelected({ ...selected, done: !selected.done }) }} className="flex items-center gap-2 text-sm font-bold text-navy">
                {selected.done ? <CheckCircle2 className="h-5 w-5 text-mint" /> : <Circle className="h-5 w-5 text-slate-300" />} {selected.done ? 'Completada' : 'Marcar como completada'}
              </button>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => { openSession(selected.session, selected.student.id); setSelected(null) }}>Ver detalle</Button>
                <Button variant="primary" className="flex-1" disabled={!selected.session.lessonId} onClick={() => { playSession(selected.session, selected.student.id); setSelected(null) }}><Play className="h-4 w-4 fill-current" /> Empezar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
