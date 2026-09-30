// "Calendario Académico" of the original dashboard, showing the real plan
// sessions (learn / practice / exam / review) of every student.
import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { SESSION_KINDS, parseISODate, toISODate } from '../../shared/scheduler.js'
import { progressKey } from './store.js'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const KIND_OBJECTIVE = {
  learn: 'Estudiar el concepto, el vocabulario y los ejemplos de la lección.',
  practice: 'Practicar lo aprendido en la sección de práctica de la lección.',
  exam: 'Tomar el examen de la lección para demostrar lo aprendido.',
  review: 'Repasar destrezas de una lección de semanas anteriores.',
}

function mondayOf(d) {
  const x = new Date(d)
  x.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return x
}

export default function FamilyCalendar({ students, doneKeysByStudent, toggleDone, openSession, playSession }) {
  const today = toISODate(new Date())
  const firstDate = useMemo(() => {
    const dates = students.map(s => s.plan.sessions[0]?.date).filter(Boolean).sort()
    return dates[0] && dates[0] > today ? dates[0] : today
  }, [students, today])

  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(() => parseISODate(firstDate))
  const [studentFilters, setStudentFilters] = useState(() => Object.fromEntries(students.map(s => [s.id, true])))
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [selected, setSelected] = useState(null) // { session, student }

  const subjects = useMemo(() => [...new Map(students.flatMap(s => s.plan.subjects).map(s => [s.key, s])).values()], [students])

  const byDate = useMemo(() => {
    const map = new Map()
    for (const student of students) {
      if (studentFilters[student.id] === false) continue
      const subj = Object.fromEntries(student.plan.subjects.map(s => [s.key, s]))
      for (const session of student.plan.sessions) {
        if (subjectFilter !== 'all' && session.subjectKey !== subjectFilter) continue
        if (!map.has(session.date)) map.set(session.date, [])
        map.get(session.date).push({ session, student, subject: subj[session.subjectKey], done: doneKeysByStudent[student.id]?.has(progressKey(session)) })
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.session.time.localeCompare(b.session.time))
    return map
  }, [students, studentFilters, subjectFilter, doneKeysByStudent])

  const move = delta => setCursor(c => {
    const d = new Date(c)
    if (view === 'week') d.setDate(d.getDate() + 7 * delta)
    else d.setMonth(d.getMonth() + delta, 1)
    return d
  })

  const Event = ({ item, compact }) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setSelected(item)}
      onKeyDown={e => e.key === 'Enter' && setSelected(item)}
      className={`cursor-pointer rounded p-1 text-xs transition-all hover:shadow-md ${item.done ? 'opacity-60' : ''}`}
      style={{ backgroundColor: `${item.student.color}20`, borderColor: item.done ? undefined : item.student.color, borderWidth: item.done ? undefined : '2px' }}
      title={`${item.session.title} - ${item.student.name} - ${item.subject?.name}`}
    >
      <div className="flex items-center space-x-1">
        <span>{item.subject?.emoji}</span>
        <span className="truncate"><strong>{SESSION_KINDS[item.session.kind].short}:</strong> {item.session.title}</span>
        {item.done && <span>✓</span>}
      </div>
      <div className="text-gray-600">{compact ? item.session.time : item.student.name}</div>
    </div>
  )

  // Month grid (Monday first)
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = mondayOf(monthStart)
  const monthDays = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d })
  const trimmedMonth = monthDays.slice(0, monthDays.findLastIndex(d => d.getMonth() === cursor.getMonth()) + 1)
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = mondayOf(cursor); d.setDate(d.getDate() + i); return d })

  const sel = selected
  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Calendario Académico</h1>
          <p className="text-gray-600">Lecciones, prácticas y exámenes asignados a tus estudiantes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={view === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setView('month')}>Mes</Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setView('week')}>Semana</Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Estudiantes:</span>
          {students.map(s => (
            <label key={s.id} className="flex cursor-pointer items-center space-x-2">
              <input type="checkbox" checked={studentFilters[s.id] !== false} onChange={e => setStudentFilters(p => ({ ...p, [s.id]: e.target.checked }))} className="rounded" />
              <div className="h-3 w-3 rounded" style={{ backgroundColor: s.color }} />
              <span className="text-sm">{s.name}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Materia:</span>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="rounded border px-2 py-1 text-sm">
            <option value="all">Todas</option>
            {subjects.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <button type="button" onClick={() => move(-1)} className="rounded p-1 hover:bg-gray-100" aria-label="Anterior"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" onClick={() => move(1)} className="rounded p-1 hover:bg-gray-100" aria-label="Siguiente"><ChevronRight className="h-5 w-5" /></button>
              {view === 'month'
                ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
                : `Semana del ${weekDays[0].getDate()} - ${weekDays[6].getDate()} de ${MONTHS[weekDays[6].getMonth()]}, ${weekDays[6].getFullYear()}`}
              <button type="button" onClick={() => setCursor(parseISODate(firstDate))} className="ml-2 rounded border px-2 py-0.5 text-xs font-normal hover:bg-gray-50">
                {firstDate === today ? 'Hoy' : 'Inicio del plan'}
              </button>
            </span>
            <div className="flex flex-wrap items-center gap-4 text-sm font-normal">
              <div className="flex items-center space-x-1"><div className="h-3 w-3 rounded border-2 border-gray-400" /><span>Asignado</span></div>
              <div className="flex items-center space-x-1"><div className="h-3 w-3 rounded bg-green-400 opacity-60" /><span>Completado</span></div>
              {['learn', 'practice', 'exam', 'review'].map(k => <span key={k} className="text-xs text-gray-500">{SESSION_KINDS[k].short}</span>)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {view === 'month' ? (
            <div className="grid grid-cols-7 gap-1">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div key={d} className="border-b p-2 text-center font-semibold text-gray-600">{d}</div>)}
              {trimmedMonth.map(d => {
                const iso = toISODate(d)
                const items = byDate.get(iso) || []
                const inMonth = d.getMonth() === cursor.getMonth()
                return (
                  <div key={iso} className={`min-h-[100px] border border-gray-200 p-1 ${inMonth ? '' : 'bg-gray-50'}`}>
                    {inMonth && (
                      <>
                        <div className={`mb-1 text-sm font-medium ${iso === today ? 'inline-block rounded bg-blue-500 px-1.5 text-white' : 'text-gray-700'}`}>{d.getDate()}</div>
                        <div className="space-y-1">
                          {items.slice(0, 3).map(item => <Event key={`${item.student.id}-${item.session.id}`} item={item} compact />)}
                          {items.length > 3 && (
                            <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => { setView('week'); setCursor(d) }}>+{items.length - 3} más</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[760px] grid-cols-8 gap-2">
                <div className="font-semibold text-gray-600">Hora</div>
                {weekDays.map(d => (
                  <div key={toISODate(d)} className={`border-b p-2 text-center font-semibold ${toISODate(d) === today ? 'text-blue-600' : 'text-gray-600'}`}>
                    {DAY_SHORT[d.getDay()]} {d.getDate()}
                  </div>
                ))}
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = i + 7
                  return (
                    <React.Fragment key={hour}>
                      <div className="p-2 text-sm text-gray-500">{hour}:00</div>
                      {weekDays.map(d => {
                        const items = (byDate.get(toISODate(d)) || []).filter(x => Number(x.session.time.slice(0, 2)) === hour)
                        return (
                          <div key={toISODate(d)} className="min-h-[60px] space-y-1 border border-gray-100 p-1">
                            {items.map(item => <Event key={`${item.student.id}-${item.session.id}`} item={item} />)}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold">Detalles de la Lección</h3>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">✕</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded" style={{ backgroundColor: sel.student.color }} />
                <span className="font-medium">{sel.student.name}</span>
              </div>
              <div>
                <div className="mb-1 flex items-center space-x-2">
                  <span className="text-lg">{sel.subject?.emoji}</span>
                  <span className="font-medium">{sel.subject?.name}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{SESSION_KINDS[sel.session.kind].label}</span>
                </div>
                <h4 className="text-lg font-semibold">{sel.session.title}</h4>
              </div>
              <div>
                <span className="text-sm text-gray-600">Objetivo:</span>
                <p className="text-sm">{KIND_OBJECTIVE[sel.session.kind]}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Fecha/Hora:</span>
                  <p className="text-sm">{parseISODate(sel.session.date).toLocaleDateString('es-PR')}<br />{sel.session.time}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Duración:</span>
                  <p className="text-sm">{sel.session.minutes} min</p>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Estado:</span>
                <select
                  value={sel.done ? 'completed' : 'assigned'}
                  onChange={e => {
                    const wantDone = e.target.value === 'completed'
                    if (wantDone !== !!sel.done) toggleDone(sel.student.id, sel.session)
                    setSelected({ ...sel, done: wantDone })
                  }}
                  className="ml-2 rounded border px-2 py-1 text-sm"
                >
                  <option value="assigned">Asignado</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { openSession(sel.session, sel.student.id); setSelected(null) }}>Ver Recursos</Button>
                <Button className="flex-1" disabled={!sel.session.lessonId} onClick={() => { playSession(sel.session, sel.student.id); setSelected(null) }}>
                  <Play className="mr-1 h-4 w-4" /> Empezar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
