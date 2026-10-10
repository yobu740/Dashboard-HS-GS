// Genial Skills Homeschool — app root.
// Holds navigation, the family store and the overlays (onboarding with
// Lecturina, follow-up chat, lesson detail and lesson player); each section
// lives in src/app/sections.
import { useMemo, useState } from 'react'
import './App.css'
import { useFamilyStore, progressKey } from './app/store.js'
import Shell from './app/Shell.jsx'
import GuidedOnboarding from './app/GuidedOnboarding.jsx'
import ChatOnboarding from './app/ChatOnboarding.jsx'
import LecturinaFab from './app/LecturinaFab.jsx'
import LessonModal from './app/LessonModal.jsx'
import LessonPlayer from './app/LessonPlayer.jsx'
import Home from './app/sections/Home.jsx'
import Students from './app/sections/Students.jsx'
import Planning from './app/sections/Planning.jsx'
import Calendar from './app/sections/Calendar.jsx'
import Catalog from './app/sections/Catalog.jsx'
import Portfolio from './app/sections/Portfolio.jsx'
import Tutoring from './app/sections/Tutoring.jsx'
import Community from './app/sections/Community.jsx'

const ONBOARDING_SEEN = 'gs_onboarding_seen'
const PARENT_NAME = 'Brian'

function seenOnboarding() {
  try { return localStorage.getItem(ONBOARDING_SEEN) === '1' } catch { return false }
}

export default function App() {
  const family = useFamilyStore()
  const students = family.state.students
  const [section, setSection] = useState('inicio')
  const [focusStudentId, setFocusStudentId] = useState(null)
  // { mode: 'guided' } for a new plan, { mode: 'chat', student } to adjust one.
  const [lecturina, setLecturina] = useState(() => (!students.length && !seenOnboarding() ? { mode: 'guided' } : null))
  const [openLesson, setOpenLesson] = useState(null) // { session, studentId }
  const [playing, setPlaying] = useState(null) // { session, studentId }

  const doneKeysByStudent = useMemo(() => Object.fromEntries(
    students.map(s => [s.id, new Set(Object.keys(family.state.progress[s.id] || {}))]),
  ), [students, family.state.progress])

  const studentOf = id => students.find(s => s.id === id)
  const openSession = (session, studentId) => setOpenLesson({ session, studentId })
  const playSession = (session, studentId) => { setOpenLesson(null); setPlaying({ session, studentId }) }
  const startGuided = () => setLecturina({ mode: 'guided' })
  const startChat = student => setLecturina({ mode: 'chat', student })
  const openPlan = id => { setFocusStudentId(id); setSection('planificacion') }
  const closeLecturina = () => {
    try { localStorage.setItem(ONBOARDING_SEEN, '1') } catch { /* ignore */ }
    setLecturina(null)
  }
  const saveStudent = student => { family.upsertStudent(student); setFocusStudentId(student.id) }

  const shared = { students, doneKeysByStudent, openSession, playSession, onAdd: startGuided }

  return (
    <>
      <Shell active={section} onNavigate={setSection} parentName={PARENT_NAME}>
        {section === 'inicio' && <Home {...shared} parentName={PARENT_NAME} toggleDone={family.toggleDone} goTo={setSection} onStart={startGuided} />}
        {section === 'estudiantes' && <Students {...shared} onChat={startChat} onRemove={family.removeStudent} onOpenPlan={openPlan} />}
        {section === 'planificacion' && <Planning {...shared} studentId={focusStudentId} setStudentId={setFocusStudentId} store={family} onChat={startChat} />}
        {section === 'calendario' && <Calendar {...shared} toggleDone={family.toggleDone} />}
        {section === 'catalogo' && <Catalog students={students} updatePlan={family.updatePlan} openSession={openSession} />}
        {section === 'portafolio' && <Portfolio {...shared} studentId={focusStudentId} setStudentId={setFocusStudentId} progress={family.state.progress} parentName={PARENT_NAME} />}
        {section === 'tutoria' && <Tutoring students={students} doneKeysByStudent={doneKeysByStudent} playSession={playSession} />}
        {section === 'comunidad' && <Community parentName={PARENT_NAME} />}
      </Shell>

      {lecturina?.mode === 'guided' && (
        <GuidedOnboarding studentCount={students.length} onSaveStudent={saveStudent} onFinish={closeLecturina} />
      )}
      {lecturina?.mode === 'chat' && (
        <ChatOnboarding key={lecturina.student.id} existingStudent={lecturina.student} studentCount={students.length} onSaveStudent={saveStudent} onFinish={closeLecturina} />
      )}
      {!lecturina && !playing && students.length > 0 && <LecturinaFab students={students} onChat={startChat} />}

      {openLesson && (
        <LessonModal
          session={openLesson.session}
          subjects={studentOf(openLesson.studentId)?.plan.subjects || []}
          done={doneKeysByStudent[openLesson.studentId]?.has(progressKey(openLesson.session))}
          onToggleDone={openLesson.session.date && openLesson.studentId ? () => family.toggleDone(openLesson.studentId, openLesson.session) : undefined}
          onPlay={() => playSession(openLesson.session, openLesson.studentId)}
          onClose={() => setOpenLesson(null)}
        />
      )}
      {playing && (
        <LessonPlayer
          session={playing.session}
          subject={studentOf(playing.studentId)?.plan.subjects.find(s => s.key === playing.session.subjectKey)}
          done={doneKeysByStudent[playing.studentId]?.has(progressKey(playing.session))}
          onToggleDone={playing.session.date && playing.studentId ? () => family.toggleDone(playing.studentId, playing.session) : undefined}
          onClose={() => setPlaying(null)}
        />
      )}
    </>
  )
}
