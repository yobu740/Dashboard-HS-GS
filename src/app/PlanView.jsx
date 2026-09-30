// Renders an AI study plan: summary, per-subject sequence of real Athenas
// lessons (each with its learn → practice → exam sessions), and the first
// week's agenda. Used in the onboarding popup and in Planificación, where it
// is editable.
import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, ChevronDown, ChevronRight, Lightbulb, Minus, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { gradeLabel } from '../../shared/subjects.js'
import { SESSION_KINDS, WEEKDAY_LABELS, parseISODate } from '../../shared/scheduler.js'
import { progressKey } from './store.js'

export function PlanSourceBadge({ plan }) {
  if (plan.source === 'ai') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
        <Sparkles className="h-3.5 w-3.5" /> Diseñado con IA
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800" title={plan.aiError || ''}>
      Plan automático (IA no disponible)
    </span>
  )
}

const STEP_STYLE = {
  learn: 'bg-blue-50 text-blue-700 border-blue-200',
  practice: 'bg-amber-50 text-amber-700 border-amber-200',
  exam: 'bg-purple-50 text-purple-700 border-purple-200',
}

function shortDate(iso) {
  const d = parseISODate(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
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
  // lessonId → { learn: session, practice: session, exam: session }
  const stepsByLesson = useMemo(() => {
    const map = new Map()
    for (const s of plan.sessions) {
      if (!s.lessonId || s.kind === 'review') continue
      if (!map.has(s.lessonId)) map.set(s.lessonId, {})
      map.get(s.lessonId)[s.kind] = s
    }
    return map
  }, [plan.sessions])
  const firstWeek = useMemo(() => {
    const days = new Map()
    for (const s of plan.sessions.filter(x => x.week === plan.sessions[0]?.week)) {
      if (!days.has(s.date)) days.set(s.date, [])
      days.get(s.date).push(s)
    }
    return [...days.entries()]
  }, [plan.sessions])

  const totalLessons = plan.subjects.reduce((a, s) => a + s.lessons.length, 0)
  const counts = plan.sessions.reduce((acc, s) => ({ ...acc, [s.kind]: (acc[s.kind] || 0) + 1 }), {})

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <PlanSourceBadge plan={plan} />
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              {plan.settings.weeks} semanas · {totalLessons} lecciones de Genial Skills
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              {counts.learn || 0} lecciones · {counts.practice || 0} prácticas · {counts.exam || 0} exámenes · {counts.review || 0} repasos
            </span>
          </div>
          <p className="leading-relaxed text-gray-800">{plan.summary}</p>
          <p className="flex items-start gap-2 text-sm text-gray-600">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            {plan.weeklyRhythm} Cada lección se trabaja en tres días: aprender, practicar y examen. Además hay repasos de destrezas de semanas anteriores.
          </p>
          {plan.tips?.length > 0 && (
            <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-yellow-900">
                <Lightbulb className="h-4 w-4" /> Consejos para ti
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {plan.tips.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
          )}
          {plan.warnings?.length > 0 && (
            <div className="space-y-1 rounded-lg border-l-4 border-orange-400 bg-orange-50 p-3 text-sm text-orange-900">
              {plan.warnings.map((w, i) => <p key={i} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{w}</p>)}
            </div>
          )}
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Materias y secuencia de lecciones</h3>
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {['learn', 'practice', 'exam'].map(k => (
            <span key={k} className={`rounded border px-2 py-0.5 font-medium ${STEP_STYLE[k]}`}>{SESSION_KINDS[k].label}</span>
          ))}
          <span className="text-gray-500">Cada lección: fecha de cada paso · ✓ = hecho</span>
        </div>
        <div className="space-y-3">
          {plan.subjects.map(s => {
            const isOpen = open.has(s.key)
            const done = doneKeys ? s.lessons.filter(l => doneKeys.has(`lesson:${l.id}:exam`)).length : 0
            return (
              <Card key={s.key} className="gap-0 overflow-hidden py-0">
                <div className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl" style={{ backgroundColor: `${s.color}1a` }}>{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h4 className="font-semibold text-gray-900">{s.name}</h4>
                      <span className="text-xs font-medium" style={{ color: s.color }}>
                        {s.sessionsPerWeek} sesiones/semana · {s.lessons.length} lecciones{doneKeys ? ` · ${done} completadas` : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-700">{s.focus}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{s.rationale}</p>
                  </div>
                  {editable && (
                    <div className="flex items-center gap-1 rounded-lg border p-1" title="Sesiones por semana">
                      <button type="button" className="rounded p-1 hover:bg-gray-100" aria-label="Menos sesiones" onClick={() => onChangeFrequency(s.key, -1)}><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-5 text-center text-sm font-semibold">{s.sessionsPerWeek}</span>
                      <button type="button" className="rounded p-1 hover:bg-gray-100" aria-label="Más sesiones" onClick={() => onChangeFrequency(s.key, 1)}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => toggle(s.key)} className="flex w-full items-center gap-1.5 border-t bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {isOpen ? 'Ocultar lecciones' : 'Ver lecciones en orden'}
                </button>
                {isOpen && (
                  <ol className="divide-y divide-gray-100">
                    {s.lessons.map((l, i) => {
                      const steps = stepsByLesson.get(String(l.id)) || {}
                      return (
                        <li key={l.id} className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-sm">
                          <span className="w-6 shrink-0 text-right text-xs font-semibold text-gray-400">{i + 1}</span>
                          <button
                            type="button"
                            onClick={() => onOpenLesson?.(steps.learn || { lessonId: l.id, title: l.title, subjectKey: s.key, levelCode: l.levelCode })}
                            className={`min-w-0 flex-1 truncate text-left hover:underline ${doneKeys?.has(`lesson:${l.id}:exam`) ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                          >
                            {l.title}
                          </button>
                          {l.levelCode && l.levelCode !== childLevel && (
                            <span className="shrink-0 rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">Puente · {gradeLabel(l.levelCode)}</span>
                          )}
                          <span className="flex shrink-0 gap-1">
                            {['learn', 'practice', 'exam'].map(k => steps[k] && (
                              <button
                                key={k}
                                type="button"
                                onClick={() => onOpenLesson?.(steps[k])}
                                className={`rounded border px-1.5 py-0.5 text-[11px] font-medium hover:brightness-95 ${STEP_STYLE[k]}`}
                                title={`${SESSION_KINDS[k].label}: ${formatDay(steps[k].date)}`}
                              >
                                {doneKeys?.has(progressKey(steps[k])) ? '✓ ' : ''}{SESSION_KINDS[k].short} {shortDate(steps[k].date)}
                              </button>
                            ))}
                          </span>
                          {editable && (
                            <button type="button" onClick={() => onRemoveLesson(s.key, l.id)} className="shrink-0 rounded p-1 text-gray-300 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100" aria-label={`Quitar ${l.title}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      {firstWeek.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Así se ve la primera semana</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {firstWeek.map(([date, sessions]) => (
              <div key={date} className="rounded-lg border bg-white p-3">
                <p className="mb-2 text-sm font-semibold text-gray-800">{formatDay(date)}</p>
                <ul className="space-y-2">
                  {sessions.map(x => (
                    <li key={x.id}>
                      <button type="button" onClick={() => onOpenLesson?.(x)} className="w-full rounded-md border-l-4 bg-gray-50 px-2.5 py-1.5 text-left hover:bg-gray-100" style={{ borderColor: subjectByKey[x.subjectKey]?.color }}>
                        <span className="block text-[11px] font-medium text-gray-500">{x.time} · {subjectByKey[x.subjectKey]?.name} · {SESSION_KINDS[x.kind].short}</span>
                        <span className="block text-xs font-medium leading-snug text-gray-800">{x.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-gray-400">
        Lecciones reales del catálogo de Athenas ({plan.catalogMode === 'live' ? 'API en vivo' : 'copia local del catálogo'}).
      </p>
    </div>
  )
}
