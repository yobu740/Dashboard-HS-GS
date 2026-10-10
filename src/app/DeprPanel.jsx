// Cumplimiento del currículo (DEPR): how many of the grade's official
// expectations the plan covers and how many are completed (exam done), by
// subject and domain. Optional — families switch it on in Planificación.
import { useState } from 'react'
import { CheckCircle2, ChevronDown, Circle, CircleDot, Landmark } from 'lucide-react'
import { deprCoverage } from './depr.js'
import { SubjectIcon } from './brand/BrandIcon.jsx'
import { Panel, subjectMeta } from './ui.jsx'

function Bar({ planned, completed, total, color }) {
  const p = total ? (planned / total) * 100 : 0
  const c = total ? (completed / total) * 100 : 0
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-sand" role="img" aria-label={`${completed} completadas y ${planned} en el plan de ${total}`}>
      <div className="absolute inset-y-0 left-0 rounded-full opacity-30" style={{ width: `${p}%`, backgroundColor: color }} />
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${c}%`, backgroundColor: color }} />
    </div>
  )
}

export default function DeprPanel({ plan, doneKeys, gradeName, compact = false }) {
  const [open, setOpen] = useState(null)
  const coverage = deprCoverage(plan, doneKeys)
  if (!coverage.length) return null

  if (compact) {
    return (
      <div className="space-y-3">
        {coverage.map(s => (
          <div key={s.key} className="flex items-center gap-3">
            <SubjectIcon subject={s.key} size={22} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex justify-between text-xs"><span className="font-bold text-navy">{s.name}</span><span className="text-slate-500">{s.planned} de {s.total} expectativas</span></div>
              <Bar planned={s.planned} completed={s.completed} total={s.total} color={subjectMeta(s.key).color} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Panel className="p-6 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9edfc] text-[#3449b8]"><Landmark className="h-6 w-6" /></span>
          <div>
            <h2 className="font-display text-xl font-semibold text-navy">Currículo del Departamento de Educación</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Expectativas de {gradeName} según los Estándares de Contenido y Expectativas de Grado. <strong className="text-slate-700">En el plan</strong>: alguna lección asignada la trabaja. <strong className="text-slate-700">Completada</strong>: ya se hizo el examen de esa lección. Este plan cubre {plan.settings.weeks} semanas; el resto del grado va en los próximos periodos.
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-navy" /> Completadas</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-navy opacity-30" /> En el plan</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {coverage.map(s => {
          const color = subjectMeta(s.key).color
          return (
            <div key={s.key} className="rounded-3xl border border-sand p-5">
              <div className="mb-3 flex items-center gap-3">
                <SubjectIcon subject={s.key} size={34} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-navy">{s.name}</h3>
                  <p className="text-xs text-slate-500">{s.completed} completadas · {s.planned} en el plan · {s.total} del grado</p>
                </div>
              </div>
              <Bar planned={s.planned} completed={s.completed} total={s.total} color={color} />
              <div className="mt-4 space-y-1">
                {s.domains.map(d => {
                  const id = `${s.key}:${d.domain}`
                  const isOpen = open === id
                  return (
                    <div key={d.domain} className="rounded-2xl transition-colors hover:bg-cream/60">
                      <button type="button" onClick={() => setOpen(isOpen ? null : id)} className="flex w-full items-center gap-3 px-3 py-2 text-left" aria-expanded={isOpen}>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy">{d.name}</span>
                        <span className="w-24 shrink-0"><Bar planned={d.planned} completed={d.completed} total={d.total} color={color} /></span>
                        <span className="w-10 shrink-0 text-right text-xs text-slate-500">{d.planned}/{d.total}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <ul className="space-y-2.5 px-3 pt-1 pb-3">
                          {d.expectations.map(e => (
                            <li key={e.code} className="flex gap-2.5 text-sm">
                              {e.completed
                                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-label="Completada" />
                                : e.planned ? <CircleDot className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} aria-label="En el plan" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-label="Pendiente" />}
                              <div>
                                <span className="mr-1.5 font-mono text-xs text-slate-400">{e.code}</span>
                                <span className="text-slate-700">{e.text}</span>
                                {e.lessons.length > 0 && <p className="mt-0.5 text-xs font-bold" style={{ color }}>{e.lessons.map(l => l.title).join(' · ')}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-5 text-xs text-slate-400">{coverage[0].source}</p>
    </Panel>
  )
}
