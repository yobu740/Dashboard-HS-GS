// Renders an AI study plan: summary, per-subject sequence of real Athenas
// lessons, and the first week's agenda. Used in onboarding review and in the
// Plan section (where it is editable).
import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, Lightbulb, Minus, Plus, Sparkles, Trash2, CalendarDays } from 'lucide-react'
import { gradeLabel } from '../../shared/subjects.js'
import { WEEKDAY_LABELS, parseISODate } from '../../shared/scheduler.js'
import { SubjectDot } from './ui.jsx'

export function PlanSourceBadge({ plan }) {
  if (plan.source === 'ai') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
        <Sparkles className="h-3.5 w-3.5" /> Diseñado con IA
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
      title={plan.aiError || ''}
    >
      Plan automático (IA no disponible)
    </span>
  )
}

function formatDay(iso) {
  const d = parseISODate(iso)
  return `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

export default function PlanView({ plan, childLevel, editable = false, onRemoveLesson, onChangeFrequency, onOpenLesson, doneKeys }) {
  const [open, setOpen] = useState(() => new Set(editable ? [] : [plan.subjects[0]?.key]))
  const toggle = key => setOpen(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const subjectByKey = useMemo(() => Object.fromEntries(plan.subjects.map(s => [s.key, s])), [plan.subjects])
  const firstWeek = useMemo(() => {
    const days = new Map()
    for (const s of plan.sessions.filter(x => x.week === plan.sessions[0]?.week)) {
      if (!days.has(s.date)) days.set(s.date, [])
      days.get(s.date).push(s)
    }
    return [...days.entries()]
  }, [plan.sessions])

  const totalLessons = plan.subjects.reduce((a, s) => a + s.lessons.length, 0)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <PlanSourceBadge plan={plan} />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {plan.settings.weeks} semanas · {totalLessons} lecciones de Genial Skills · {plan.sessions.length} sesiones
          </span>
        </div>
        <p className="text-[15px] leading-relaxed text-slate-800">{plan.summary}</p>
        <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#a88a4f]" />
          {plan.weeklyRhythm}
        </p>
        {plan.tips?.length > 0 && (
          <div className="mt-4 rounded-xl bg-[#c0a267]/10 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#7a6230]">
              <Lightbulb className="h-4 w-4" /> Consejos para ti
            </p>
            <ul className="space-y-1.5 text-sm text-slate-700">
              {plan.tips.map((t, i) => <li key={i} className="flex gap-2"><span className="text-[#a88a4f]">•</span>{t}</li>)}
            </ul>
          </div>
        )}
        {plan.warnings?.length > 0 && (
          <div className="mt-4 space-y-1 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {plan.warnings.map((w, i) => (
              <p key={i} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{w}</p>
            ))}
          </div>
        )}
      </section>

      {/* Subjects */}
      <section>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Materias y secuencia de lecciones</h3>
        <div className="space-y-3">
          {plan.subjects.map(s => {
            const isOpen = open.has(s.key)
            const done = doneKeys ? s.lessons.filter(l => doneKeys.has(`lesson:${l.id}`)).length : 0
            return (
              <div key={s.key} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl" style={{ backgroundColor: `${s.color}1a` }}>
                    {s.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h4 className="font-semibold text-slate-900">{s.name}</h4>
                      <span className="text-xs font-medium" style={{ color: s.color }}>
                        {s.sessionsPerWeek} sesiones/semana · {s.lessons.length} lecciones
                        {doneKeys ? ` · ${done} completadas` : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">{s.focus}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{s.rationale}</p>
                  </div>
                  {editable && (
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1" title="Sesiones por semana">
                      <button type="button" className="rounded p-1 hover:bg-slate-100" aria-label="Menos sesiones" onClick={() => onChangeFrequency(s.key, -1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{s.sessionsPerWeek}</span>
                      <button type="button" className="rounded p-1 hover:bg-slate-100" aria-label="Más sesiones" onClick={() => onChangeFrequency(s.key, 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggle(s.key)}
                  className="flex w-full items-center gap-1.5 border-t border-slate-100 bg-slate-50 px-4 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {isOpen ? 'Ocultar lecciones' : 'Ver lecciones en orden'}
                </button>
                {isOpen && (
                  <ol className="divide-y divide-slate-100">
                    {s.lessons.map((l, i) => {
                      const isDone = doneKeys?.has(`lesson:${l.id}`)
                      return (
                        <li key={l.id} className="group flex items-center gap-3 px-4 py-2.5 text-sm">
                          <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-400">{i + 1}</span>
                          <button
                            type="button"
                            onClick={() => onOpenLesson?.({ lessonId: l.id, title: l.title, subjectKey: s.key, levelCode: l.levelCode })}
                            className={`min-w-0 flex-1 truncate text-left hover:underline ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                          >
                            {l.title}
                          </button>
                          {l.levelCode && l.levelCode !== childLevel && (
                            <span className="shrink-0 rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
                              Puente · {gradeLabel(l.levelCode)}
                            </span>
                          )}
                          <span className="shrink-0 font-mono text-[11px] text-slate-400">#{l.id}</span>
                          {editable && (
                            <button
                              type="button"
                              onClick={() => onRemoveLesson(s.key, l.id)}
                              className="shrink-0 rounded p-1 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                              aria-label={`Quitar ${l.title}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* First week */}
      {firstWeek.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Así se ve la primera semana</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {firstWeek.map(([date, sessions]) => (
              <div key={date} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-sm font-semibold text-slate-800">{formatDay(date)}</p>
                <ul className="space-y-2">
                  {sessions.map(s => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => s.lessonId && onOpenLesson?.(s)}
                        className="w-full rounded-lg border-l-4 bg-slate-50 px-2.5 py-1.5 text-left hover:bg-slate-100"
                        style={{ borderColor: subjectByKey[s.subjectKey]?.color }}
                      >
                        <span className="block text-[11px] font-medium text-slate-500">{s.time} · {subjectByKey[s.subjectKey]?.name}</span>
                        <span className="block text-xs font-medium leading-snug text-slate-800">{s.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <SubjectDot color="#c0a267" className="h-1.5 w-1.5" />
        Lecciones reales del catálogo de Athenas ({plan.catalogMode === 'live' ? 'API en vivo' : 'copia local del catálogo'}).
      </p>
    </div>
  )
}
