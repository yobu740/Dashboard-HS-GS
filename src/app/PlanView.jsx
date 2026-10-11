// A study plan: summary and tips, each subject's sequence of real Athenas
// lessons (with the date of every learn → practice → exam step), and the
// first week. Used in Planificación (editable) and at the end of onboarding.
import { useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Lightbulb, Minus, Plus, Sparkles, Trash2 } from 'lucide-react'
import { gradeLabel } from '../../shared/subjects.js'
import { WEEKDAY_LABELS, parseISODate } from '../../shared/scheduler.js'
import { progressKey } from './store.js'
import { SubjectIcon } from './brand/BrandIcon.jsx'
import { KindBadge, KIND_STYLE, Panel, PanelTitle, ProgressBar, subjectMeta } from './ui.jsx'

const shortDate = iso => { const d = parseISODate(iso); return `${d.getDate()}/${d.getMonth() + 1}` }
const dayTitle = iso => { const d = parseISODate(iso); return `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()}` }

export default function PlanView({ plan, childLevel, editable = false, onRemoveLesson, onChangeFrequency, onOpenLesson, doneKeys }) {
  const [open, setOpen] = useState(() => new Set([plan.subjects[0]?.key]))
  const toggle = key => setOpen(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

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

  const counts = plan.sessions.reduce((a, s) => ({ ...a, [s.kind]: (a[s.kind] || 0) + 1 }), {})

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="p-6 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {plan.source === 'ai'
              ? <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-extrabold text-white"><Sparkles className="h-3.5 w-3.5" /> Diseñado con IA</span>
              : <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800" title={plan.aiError || ''}>Plan automático</span>}
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-slate-600">{plan.settings.weeks} semanas</span>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700">{plan.summary}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {['learn', 'practice', 'exam', 'review'].map(k => (
              <div key={k} className={`rounded-2xl px-4 py-3 ${KIND_STYLE[k].className}`}>
                <p className="font-display text-2xl font-semibold">{counts[k] || 0}</p>
                <p className="text-xs font-extrabold tracking-wide uppercase opacity-80">{k === 'learn' ? 'Lecciones' : k === 'practice' ? 'Prácticas' : k === 'exam' ? 'Exámenes' : 'Repasos'}</p>
              </div>
            ))}
          </div>
          {plan.warnings?.length > 0 && (
            <div className="mt-5 space-y-1 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              {plan.warnings.map((w, i) => <p key={i} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{w}</p>)}
            </div>
          )}
        </Panel>
        {plan.tips?.length > 0 && (
          <Panel className="bg-gradient-to-br from-gold-light/60 to-white p-6">
            <p className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-navy"><Lightbulb className="h-5 w-5 text-gold-dark" /> Consejos</p>
            <ul className="space-y-3 text-sm text-slate-700">
              {plan.tips.map((t, i) => <li key={i} className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-dark" />{t}</li>)}
            </ul>
          </Panel>
        )}
      </div>

      <section>
        <PanelTitle>Materias y secuencia de lecciones</PanelTitle>
        <div className="space-y-4">
          {plan.subjects.map(s => {
            const meta = subjectMeta(s.key)
            const isOpen = open.has(s.key)
            const done = s.lessons.filter(l => doneKeys?.has(`lesson:${l.id}:exam`)).length
            return (
              <Panel key={s.key} className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <SubjectIcon subject={s.key} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-xl font-semibold text-navy">{meta.name}</h3>
                      <span className="text-sm font-bold" style={{ color: meta.color }}>{s.lessons.length} lecciones · {s.sessionsPerWeek} sesiones por semana</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{s.focus}</p>
                    {doneKeys && <ProgressBar value={s.lessons.length ? done / s.lessons.length : 0} color={meta.color} className="mt-3 max-w-xs" />}
                  </div>
                  {editable && (
                    <div className="flex items-center gap-1 rounded-full border border-sand bg-cream p-1" title="Sesiones por semana">
                      <button type="button" className="rounded-full p-1.5 text-navy hover:bg-white" aria-label={`Menos sesiones de ${meta.name}`} onClick={() => onChangeFrequency(s.key, -1)}><Minus className="h-4 w-4" /></button>
                      <span className="w-6 text-center font-display font-semibold text-navy">{s.sessionsPerWeek}</span>
                      <button type="button" className="rounded-full p-1.5 text-navy hover:bg-white" aria-label={`Más sesiones de ${meta.name}`} onClick={() => onChangeFrequency(s.key, 1)}><Plus className="h-4 w-4" /></button>
                    </div>
                  )}
                  <button type="button" onClick={() => toggle(s.key)} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-navy hover:bg-cream" aria-expanded={isOpen}>
                    {isOpen ? 'Ocultar' : 'Ver lecciones'} <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {isOpen && (
                  <ol className="divide-y divide-sand/70 border-t border-sand">
                    {s.lessons.map((l, i) => {
                      const steps = stepsByLesson.get(String(l.id)) || {}
                      const finished = doneKeys?.has(`lesson:${l.id}:exam`)
                      return (
                        <li key={l.id} className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream font-display text-xs font-semibold text-slate-500">{i + 1}</span>
                          <button type="button" onClick={() => onOpenLesson?.(steps.learn || { lessonId: l.id, title: l.title, subjectKey: s.key, levelCode: l.levelCode })} className={`min-w-0 flex-1 truncate text-left font-bold hover:underline ${finished ? 'text-slate-400 line-through' : 'text-navy'}`}>
                            {l.title}
                          </button>
                          {l.levelCode && l.levelCode !== childLevel && <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-700">Puente · {gradeLabel(l.levelCode)}</span>}
                          <span className="flex shrink-0 gap-1.5">
                            {['learn', 'practice', 'exam'].map(k => steps[k] && (
                              <button key={k} type="button" onClick={() => onOpenLesson?.(steps[k])} title={`${KIND_STYLE[k].label}: ${dayTitle(steps[k].date)}`} className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-opacity hover:opacity-80 ${KIND_STYLE[k].className} ${doneKeys?.has(progressKey(steps[k])) ? 'opacity-50' : ''}`}>
                                {doneKeys?.has(progressKey(steps[k])) && <Check className="mr-0.5 inline h-3 w-3" />}{KIND_STYLE[k].label} {shortDate(steps[k].date)}
                              </button>
                            ))}
                          </span>
                          {editable && (
                            <button type="button" onClick={() => onRemoveLesson(s.key, l.id)} className="shrink-0 rounded-full p-1.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100" aria-label={`Quitar ${l.title}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                )}
              </Panel>
            )
          })}
        </div>
      </section>

      {firstWeek.length > 0 && (
        <section>
          <PanelTitle>La primera semana</PanelTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {firstWeek.map(([date, sessions]) => (
              <Panel key={date} className="p-4">
                <p className="mb-3 font-display font-semibold text-navy first-letter:uppercase">{dayTitle(date)}</p>
                <ul className="space-y-2">
                  {sessions.map(x => (
                    <li key={x.id}>
                      <button type="button" onClick={() => onOpenLesson?.(x)} className="flex w-full items-start gap-2.5 rounded-2xl bg-cream/70 p-2.5 text-left transition-colors hover:bg-gold-light/50">
                        <SubjectIcon subject={x.subjectKey} size={24} />
                        <span className="min-w-0">
                          <span className="block text-[11px] font-bold text-slate-400">{x.time}</span>
                          <span className="block text-xs leading-snug font-bold text-navy">{x.title}</span>
                          <KindBadge kind={x.kind} className="mt-1" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
