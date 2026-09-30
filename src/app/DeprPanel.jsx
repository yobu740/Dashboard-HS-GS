// "Cumplimiento del currículo (DEPR)": how much of the grade's official
// expectations the plan covers, and how much is already completed, by subject
// and domain. Optional — families turn it on/off.
import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Circle, CircleDot, Landmark } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { deprCoverage } from './depr.js'

function Bar({ planned, completed, total, color }) {
  const p = total ? (planned / total) * 100 : 0
  const c = total ? (completed / total) * 100 : 0
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-gray-200" role="img" aria-label={`${completed} completadas y ${planned} en el plan de ${total}`}>
      <div className="absolute inset-y-0 left-0 rounded-full opacity-35" style={{ width: `${p}%`, backgroundColor: color }} />
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${c}%`, backgroundColor: color }} />
    </div>
  )
}

export default function DeprPanel({ plan, doneKeys, gradeName, compact = false }) {
  const [open, setOpen] = useState(null) // "subject:domain"
  const coverage = deprCoverage(plan, doneKeys)
  if (!coverage.length) return null

  if (compact) {
    return (
      <div className="space-y-2">
        {coverage.map(s => (
          <div key={s.key}>
            <div className="mb-1 flex justify-between text-xs text-gray-600">
              <span>{s.name}</span>
              <span><strong className="text-gray-900">{s.completed}</strong> / {s.planned} en plan / {s.total}</span>
            </div>
            <Bar planned={s.planned} completed={s.completed} total={s.total} color={s.color} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-blue-600" />
          <span>Cumplimiento del currículo del Departamento de Educación</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Expectativas de {gradeName} según los Estándares de Contenido y Expectativas de Grado del DEPR. Una expectativa está
          <strong> en el plan</strong> cuando alguna lección asignada la trabaja, y <strong>completada</strong> cuando se hizo el examen de esa lección.
          Este plan cubre {plan.settings.weeks} semanas; el resto del grado se cubre en los siguientes periodos.
        </p>
        <div className="flex flex-wrap gap-4 pt-1 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-full bg-blue-600" /> Completadas</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-full bg-blue-600 opacity-35" /> En el plan</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-full bg-gray-200" /> Pendientes para otro periodo</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {coverage.map(s => (
          <div key={s.key}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-semibold text-gray-900">{s.emoji} {s.name}</h4>
              <span className="text-sm text-gray-600">
                <strong className="text-gray-900">{s.completed}</strong> completadas · <strong className="text-gray-900">{s.planned}</strong> en el plan · {s.total} expectativas del grado
              </span>
            </div>
            <Bar planned={s.planned} completed={s.completed} total={s.total} color={s.color} />
            <div className="mt-3 divide-y divide-gray-100 rounded-lg border">
              {s.domains.map(d => {
                const id = `${s.key}:${d.domain}`
                const isOpen = open === id
                return (
                  <div key={d.domain}>
                    <button type="button" onClick={() => setOpen(isOpen ? null : id)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50">
                      {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      <span className="min-w-0 flex-1 text-sm font-medium text-gray-800">{d.name}</span>
                      <span className="w-28 shrink-0"><Bar planned={d.planned} completed={d.completed} total={d.total} color={s.color} /></span>
                      <span className="w-16 shrink-0 text-right text-xs text-gray-500">{d.planned}/{d.total}</span>
                    </button>
                    {isOpen && (
                      <ul className="space-y-2 bg-gray-50 px-4 py-3">
                        {d.expectations.map(e => (
                          <li key={e.code} className="flex gap-2 text-sm">
                            {e.completed
                              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-label="Completada" />
                              : e.planned
                                ? <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-label="En el plan" />
                                : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" aria-label="Pendiente" />}
                            <div>
                              <span className="mr-1.5 font-mono text-xs text-gray-500">{e.code}</span>
                              <span className="text-gray-800">{e.text}</span>
                              {e.lessons.length > 0 && (
                                <p className="mt-0.5 text-xs text-blue-700">Lecciones: {e.lessons.map(l => l.title).join(' · ')}</p>
                              )}
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
        ))}
        <p className="text-xs text-gray-400">{coverage[0].source}</p>
      </CardContent>
    </Card>
  )
}
