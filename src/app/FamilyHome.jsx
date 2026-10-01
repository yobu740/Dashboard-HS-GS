// "Inicio" of the original dashboard, driven by the family's real students and
// AI plans instead of the demo data. Same layout and components as the
// original: student card with progress ring, last activity and alerts; tabbed
// study card; quick actions; weekly agenda and quick calendar.
import { useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, Calendar, CheckCircle, Clock, FileText, Landmark, Play, Star, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { gradeLabel } from '../../shared/subjects.js'
import { SESSION_KINDS, WEEKDAY_LABELS, parseISODate, toISODate } from '../../shared/scheduler.js'
import { progressKey } from './store.js'
import { deprCoverage } from './depr.js'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function weekBounds(iso) {
  const d = parseISODate(iso)
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return [toISODate(monday), toISODate(sunday)]
}

function dayLabel(iso) {
  const d = parseISODate(iso)
  return `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()}`
}

function fmtHours(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export default function FamilyHome({ students, progress, doneKeysByStudent, openSession, playSession, goTo, generatePDF, parentName = 'Brian' }) {
  const [activeId, setActiveId] = useState(students[0].id)
  const [tab, setTab] = useState('lessons')
  const student = students.find(s => s.id === activeId) || students[0]
  const plan = student.plan
  const done = doneKeysByStudent[student.id] || new Set()
  const today = toISODate(new Date())
  const subjectByKey = Object.fromEntries(plan.subjects.map(s => [s.key, s]))

  // Before the plan starts, "this week" is the plan's first week.
  const focusDate = plan.sessions[0]?.date > today ? plan.sessions[0].date : today
  const [from, to] = weekBounds(focusDate)

  const stats = useMemo(() => {
    const lessons = plan.subjects.flatMap(s => s.lessons)
    const completedLessons = lessons.filter(l => done.has(`lesson:${l.id}:exam`)).length
    const week = plan.sessions.filter(s => s.date >= from && s.date <= to)
    const overdue = plan.sessions.filter(s => s.date < today && !done.has(progressKey(s)))
    const exams = plan.sessions.filter(s => s.kind === 'exam')
    const minutesBySubject = plan.subjects.map(sub => {
      const mine = week.filter(s => s.subjectKey === sub.key)
      return {
        subject: sub,
        planned: mine.reduce((a, s) => a + s.minutes, 0),
        done: mine.filter(s => done.has(progressKey(s))).reduce((a, s) => a + s.minutes, 0),
      }
    })
    const recent = Object.entries(progress[student.id] || {})
      .sort((a, b) => b[1].localeCompare(a[1]))
      .slice(0, 4)
      .map(([key]) => plan.sessions.find(s => progressKey(s) === key))
      .filter(Boolean)
    return { lessons, completedLessons, week, overdue, exams, minutesBySubject, recent }
  }, [plan, done, from, to, today, progress, student.id])

  const coverage = student.profile?.depr ? deprCoverage(plan, done) : []
  const pendingExams = stats.exams.filter(s => !done.has(progressKey(s)) && s.date <= to)
  const completedExams = stats.exams.filter(s => done.has(progressKey(s)))
  const pct = stats.lessons.length ? Math.round((stats.completedLessons / stats.lessons.length) * 100) : 0
  const upcoming = plan.sessions.filter(s => s.date >= today).slice(0, 5)

  const SessionRow = ({ s, action = 'open' }) => (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{s.title}</p>
        <p className="text-xs text-gray-600">{subjectByKey[s.subjectKey]?.name} • {SESSION_KINDS[s.kind].label} • {dayLabel(s.date)} {s.time}</p>
      </div>
      {action === 'play' && s.lessonId
        ? <Button size="sm" onClick={() => playSession(s, student.id)}><Play className="mr-1 h-3.5 w-3.5" /> Empezar</Button>
        : <Button size="sm" variant="outline" onClick={() => openSession(s, student.id)}>Ver lección</Button>}
    </div>
  )

  // Quick calendar for the focus month
  const monthDate = parseISODate(focusDate)
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const sessionDays = new Set(plan.sessions.filter(s => s.date.startsWith(toISODate(first).slice(0, 7))).map(s => Number(s.date.slice(8))))

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Bienvenido, {parentName}</h1>
        <p className="text-gray-600">Aquí está el progreso de tus hijos esta semana</p>
      </div>

      {students.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {students.map(s => (
            <button key={s.id} type="button" onClick={() => setActiveId(s.id)} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${s.id === student.id ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} /> {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="h-full transition-shadow hover:shadow-lg">
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex flex-col items-center space-y-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-blue-100 text-3xl font-bold text-white" style={{ backgroundColor: student.color }}>
                  {student.name.charAt(0)}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-600">{gradeLabel(student.level)}</p>
                </div>
              </div>
              <div className="flex flex-1 justify-center">
                <div className="relative h-24 w-24">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray={`${(pct * 251.2) / 100} 251.2`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{pct}%</span>
                    <span className="text-xs font-medium text-gray-600">Del plan</span>
                    <span className="text-xs text-gray-500">{stats.completedLessons}/{stats.lessons.length} lecciones</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-3">
              <p className="mb-2 text-sm font-medium text-blue-800">Última actividad:</p>
              <div className="space-y-1 text-sm text-blue-700">
                {stats.recent.length
                  ? stats.recent.map(s => <p key={s.id}>• {SESSION_KINDS[s.kind].label}: {s.title} - <span className="font-medium">{subjectByKey[s.subjectKey]?.name}</span></p>)
                  : <p>• Aún no hay actividad. El plan empieza el {dayLabel(plan.sessions[0]?.date || today).toLowerCase()}.</p>}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {plan.source === 'ai' && <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">✨ Plan con IA</span>}
              {coverage.map(c => (
                <span key={c.key} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800" title="Expectativas del grado (DEPR) completadas / en el plan">
                  🏛️ {c.name}: {c.completed}/{c.planned} DEPR
                </span>
              ))}
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                Alertas Personalizadas para {student.name}
              </h4>
              <div className="space-y-3">
                {stats.overdue.length > 0 && (
                  <div className="flex items-start space-x-3 rounded-lg border-l-4 border-red-400 bg-red-50 p-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm"><strong>{student.name}</strong> tiene {stats.overdue.length} sesiones sin completar de días anteriores.</p>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => goTo('calendario')}>Revisar Calendario</Button>
                    </div>
                  </div>
                )}
                {pendingExams.length > 0 && (
                  <div className="flex items-start space-x-3 rounded-lg border-l-4 border-orange-400 bg-orange-50 p-3">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <div className="flex-1">
                      <p className="text-sm">Esta semana: examen de <strong>{pendingExams[0].title}</strong>{pendingExams.length > 1 ? ` y ${pendingExams.length - 1} más` : ''}.</p>
                      <Button size="sm" className="mt-2 h-7 text-xs" onClick={() => setTab('assignments')}>Ver Exámenes</Button>
                    </div>
                  </div>
                )}
                {!stats.overdue.length && !pendingExams.length && (
                  <div className="flex items-start space-x-3 rounded-lg border-l-4 border-green-400 bg-green-50 p-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <p className="text-sm"><strong>{student.name}</strong> va al día con su plan.</p>
                  </div>
                )}
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => goTo('planificacion')}>Ver Plan Completo</Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-0">
            <div className="border-b">
              <nav className="flex space-x-8 px-6 pt-6">
                {[['time', 'Tiempo de Estudio'], ['lessons', 'Lecciones Asignadas'], ['assignments', 'Asignaciones']].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setTab(id)} className={`border-b-2 px-1 py-2 text-sm font-medium ${tab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-6">
              {tab === 'time' && (
                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold"><TrendingUp className="mr-2 h-5 w-5" /> Semana del {dayLabel(from).toLowerCase()}</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium text-gray-600">Materia</th>
                        <th className="py-2 text-left font-medium text-gray-600">Planificado</th>
                        <th className="py-2 text-left font-medium text-gray-600">Completado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.minutesBySubject.map(r => (
                        <tr key={r.subject.key} className="border-b last:border-0">
                          <td className="py-2">{r.subject.name}</td>
                          <td className="py-2">{fmtHours(r.planned)}</td>
                          <td className="py-2">{fmtHours(r.done)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab === 'lessons' && (
                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold"><BookOpen className="mr-2 h-5 w-5" /> Lecciones de {gradeLabel(student.level)}</h3>
                  <div className="space-y-3">
                    {stats.week.filter(s => !done.has(progressKey(s))).slice(0, 6).map(s => <SessionRow key={s.id} s={s} action="play" />)}
                    {!stats.week.some(s => !done.has(progressKey(s))) && <p className="text-sm text-gray-600">Todo lo de esta semana está completado. 🎉</p>}
                  </div>
                </div>
              )}
              {tab === 'assignments' && (
                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold"><FileText className="mr-2 h-5 w-5" /> Exámenes de las lecciones</h3>
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-semibold text-orange-600">Pendientes ({pendingExams.length})</h4>
                    <div className="space-y-3">
                      {pendingExams.slice(0, 4).map(s => (
                        <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-orange-400 bg-orange-50 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{s.title}</p>
                            <p className="text-xs text-gray-600">{subjectByKey[s.subjectKey]?.name} • {dayLabel(s.date)}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => playSession(s, student.id)}>Tomar examen</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-green-600">Completados ({completedExams.length})</h4>
                    <div className="space-y-3">
                      {completedExams.slice(-3).reverse().map(s => (
                        <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-green-400 bg-green-50 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{s.title}</p>
                            <p className="text-xs text-gray-600">{subjectByKey[s.subjectKey]?.name} • {dayLabel(s.date)}</p>
                          </div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openSession(s, student.id)}>Ver lección</Button>
                        </div>
                      ))}
                      {!completedExams.length && <p className="text-sm text-gray-500">Aún no hay exámenes completados.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {coverage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Landmark className="mr-2 h-5 w-5 text-indigo-600" /> Currículo del Departamento de Educación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {coverage.map(c => (
                <div key={c.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-gray-800">{c.emoji} {c.name}</span>
                    <span className="text-gray-600">{c.completed} completadas · {c.planned} en el plan · {c.total} del grado</span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-gray-200">
                    <div className="absolute inset-y-0 left-0 rounded-full opacity-35" style={{ width: `${(c.planned / c.total) * 100}%`, backgroundColor: c.color }} />
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(c.completed / c.total) * 100}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => goTo('planificacion')}>Ver detalle por dominio</Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>Acciones Rápidas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Button className="flex h-16 flex-col items-center justify-center space-y-2" onClick={() => goTo('planificacion')}>
              <BookOpen className="h-6 w-6" /><span>Ver Planificación</span>
            </Button>
            <Button variant="outline" className="flex h-16 flex-col items-center justify-center space-y-2" onClick={() => setTab('assignments')}>
              <Target className="h-6 w-6" /><span>Exámenes</span>
            </Button>
            <Button variant="outline" className="flex h-16 flex-col items-center justify-center space-y-2">
              <Star className="h-6 w-6" /><span>Crear Recompensa</span>
            </Button>
            <Button variant="outline" className="flex h-16 flex-col items-center justify-center space-y-2 border-red-200 bg-red-50 hover:bg-red-100" onClick={generatePDF}>
              <FileText className="h-6 w-6 text-red-600" /><span className="text-red-600">Exportar PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center"><Calendar className="mr-2 h-5 w-5" /> Agenda Semanal</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcoming.map(s => {
                const isDone = done.has(progressKey(s))
                return (
                  <button key={s.id} type="button" onClick={() => openSession(s, student.id)} className="flex w-full items-center space-x-3 rounded-lg border p-3 text-left hover:bg-gray-50">
                    <div className={`h-3 w-3 rounded-full ${isDone ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-gray-600">{subjectByKey[s.subjectKey]?.name} • {SESSION_KINDS[s.kind].short} - {dayLabel(s.date)}</p>
                        </div>
                        <span className="text-xs text-gray-500">{s.time}</span>
                      </div>
                    </div>
                    {isDone ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Play className="h-4 w-4 text-gray-400" />}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center"><Calendar className="mr-2 h-5 w-5" /> Calendario Rápido</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600">Aquí puedes ver un resumen de tu calendario.</p>
            <button type="button" onClick={() => goTo('calendario')} className="w-full rounded-lg bg-gray-50 p-4 text-left">
              <div className="mb-3 text-center text-sm font-semibold text-gray-700">{MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}</div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i} className="py-1 text-center font-semibold text-gray-500">{d}</div>)}
                {Array.from({ length: 42 }, (_, i) => {
                  const day = i - first.getDay() + 1
                  const inMonth = day > 0 && day <= daysInMonth
                  const iso = inMonth ? toISODate(new Date(first.getFullYear(), first.getMonth(), day)) : ''
                  return (
                    <div key={i} className={`rounded py-1 text-center ${!inMonth ? 'text-gray-300' : iso === today ? 'bg-blue-500 font-semibold text-white' : sessionDays.has(day) ? 'bg-orange-100 font-medium text-orange-700' : 'text-gray-700'}`}>
                      {inMonth ? day : ''}
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center"><span className="mr-1 h-2 w-2 rounded bg-blue-500" /> Hoy</span>
                <span className="flex items-center"><span className="mr-1 h-2 w-2 rounded bg-orange-400" /> Sesiones</span>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
