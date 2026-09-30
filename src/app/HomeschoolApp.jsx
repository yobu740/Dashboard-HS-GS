// Root of the reworked homeschool dashboard. First visit → AI onboarding.
// Afterwards the dashboard is driven entirely by each student's plan.
import { useMemo, useState } from 'react'
import { CalendarDays, FolderOpen, Home, Route, Users } from 'lucide-react'
import logo from '../assets/logo.svg'
import '../App.css'
import { useFamilyStore, progressKey } from './store.js'
import Onboarding from './Onboarding.jsx'
import LessonModal from './LessonModal.jsx'
import LessonPlayer from './LessonPlayer.jsx'
import TodaySection from './sections/TodaySection.jsx'
import PlanSection from './sections/PlanSection.jsx'
import CalendarSection from './sections/CalendarSection.jsx'
import CatalogSection from './sections/CatalogSection.jsx'
import StudentsSection from './sections/StudentsSection.jsx'

const NAV = [
  { id: 'hoy', label: 'Hoy', icon: Home },
  { id: 'plan', label: 'Plan de estudio', icon: Route },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  { id: 'catalogo', label: 'Catálogo', icon: FolderOpen },
  { id: 'estudiantes', label: 'Estudiantes', icon: Users },
]

export default function HomeschoolApp() {
  const store = useFamilyStore()
  const { state } = store
  const [section, setSection] = useState('hoy')
  // null | { student?: existing student to redo }  — shows onboarding over the dashboard
  const [onboarding, setOnboarding] = useState(null)
  const [openLesson, setOpenLesson] = useState(null) // { session, studentId }
  const [playing, setPlaying] = useState(null) // { session, studentId }
  const [activeStudentId, setActiveStudentId] = useState(null)

  const activeStudent = state.students.find(s => s.id === activeStudentId) || state.students[0]

  const doneKeysByStudent = useMemo(() => Object.fromEntries(
    state.students.map(s => [s.id, new Set(Object.keys(state.progress[s.id] || {}))]),
  ), [state.students, state.progress])

  const completeOnboarding = ({ parentName, student }) => {
    if (parentName) store.setParentName(parentName)
    store.upsertStudent(student)
    setActiveStudentId(student.id)
    setOnboarding(null)
    setSection(state.students.length ? 'plan' : 'hoy')
  }

  if (!state.students.length || onboarding) {
    return (
      <Onboarding
        parentName={state.parentName}
        existingStudent={onboarding?.student}
        studentCount={onboarding?.student ? state.students.indexOf(onboarding.student) : state.students.length}
        onComplete={completeOnboarding}
        onCancel={state.students.length ? () => setOnboarding(null) : null}
      />
    )
  }

  const openSession = (session, studentId) => setOpenLesson({ session, studentId })
  const playSession = (session, studentId) => { setOpenLesson(null); setPlaying({ session, studentId }) }
  const modalStudent = openLesson && state.students.find(s => s.id === openLesson.studentId)
  const playingStudent = playing && state.students.find(s => s.id === playing.studentId)

  const shared = {
    state,
    store,
    activeStudent,
    setActiveStudentId,
    doneKeysByStudent,
    openSession,
    playSession,
    startOnboarding: student => setOnboarding({ student }),
    goTo: setSection,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-slate-700 px-4 py-3 text-white sm:px-6">
        <img src={logo} alt="Genial Skills" className="h-8" />
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold">
            {(state.parentName || '?').charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{state.parentName}</span>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        <aside className="md:min-h-[calc(100vh-56px)] md:w-28" style={{ backgroundColor: '#c0a267' }}>
          <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:p-3">
            {NAV.map(item => {
              const Icon = item.icon
              const active = section === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-w-20 flex-col items-center gap-1 rounded-lg px-2 py-3 text-center transition-colors ${
                    active ? 'bg-yellow-700 text-white' : 'text-yellow-50 hover:bg-yellow-700/70 hover:text-white'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {section === 'hoy' && <TodaySection {...shared} />}
          {section === 'plan' && <PlanSection {...shared} />}
          {section === 'calendario' && <CalendarSection {...shared} />}
          {section === 'catalogo' && <CatalogSection {...shared} />}
          {section === 'estudiantes' && <StudentsSection {...shared} />}
        </main>
      </div>

      {openLesson && (
        <LessonModal
          session={openLesson.session}
          subjects={modalStudent?.plan.subjects || []}
          done={doneKeysByStudent[openLesson.studentId]?.has(progressKey(openLesson.session))}
          onToggleDone={openLesson.session.date ? () => store.toggleDone(openLesson.studentId, openLesson.session) : undefined}
          onPlay={() => playSession(openLesson.session, openLesson.studentId)}
          onClose={() => setOpenLesson(null)}
        />
      )}

      {playing && (
        <LessonPlayer
          session={playing.session}
          subject={playingStudent?.plan.subjects.find(s => s.key === playing.session.subjectKey)}
          done={doneKeysByStudent[playing.studentId]?.has(progressKey(playing.session))}
          onToggleDone={playing.session.date ? () => store.toggleDone(playing.studentId, playing.session) : undefined}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  )
}
