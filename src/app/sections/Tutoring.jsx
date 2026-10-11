// Tutoría — help for each skill:
//   1. Tutor IA: every Genial Skills lesson has an AI tutor; open the next
//      lesson or practice the skills the family flagged.
//   2. Tutores certificados: directory + booking (stored locally).
//   3. Mis sesiones: booked tutoring sessions.
import { useMemo, useState } from 'react'
import { BadgeCheck, CalendarClock, MapPin, Play, Sparkles, Star, Video, X } from 'lucide-react'
import lecturina from '../../assets/lecturina.png'
import { SUBJECT_KEYS, gradeLabel } from '../../../shared/subjects.js'
import { toISODate } from '../../../shared/scheduler.js'
import { newId, progressKey, useLocalState } from '../store.js'
import { SubjectIcon } from '../brand/BrandIcon.jsx'
import { Button, PageHeader, Panel, PanelTitle, StudentAvatar, subjectMeta } from '../ui.jsx'

// Directory sample. In production this comes from the tutors service.
const TUTORS = [
  { id: 't1', name: 'Ana Martínez', title: 'Maestra de Matemáticas', subject: 'math', grades: 'K a 6to', modality: 'Virtual', town: 'San Juan', rating: 4.9, reviews: 127, price: 25, bio: 'Fracciones, operaciones y resolución de problemas con material concreto.', color: '#3fae82' },
  { id: 't2', name: 'Carlos Rivera', title: 'Doctor en Ciencias', subject: 'science', grades: '4to a 8vo', modality: 'Virtual y presencial', town: 'Bayamón', rating: 4.8, reviews: 94, price: 30, bio: 'Experimentos en casa y método científico paso a paso.', color: '#c48a45' },
  { id: 't3', name: 'Sofía Morales', title: 'Maestra de Inglés', subject: 'english', grades: 'K a 8vo', modality: 'Virtual', town: 'Ponce', rating: 4.9, reviews: 156, price: 25, bio: 'Conversación, fonética y comprensión lectora en inglés.', color: '#a34787' },
  { id: 't4', name: 'Luis Vega', title: 'Maestro de Estudios Sociales', subject: 'social', grades: '3ro a 12mo', modality: 'Presencial', town: 'Caguas', rating: 4.7, reviews: 61, price: 20, bio: 'Historia de Puerto Rico con proyectos y visitas guiadas.', color: '#d96464' },
  { id: 't5', name: 'Marisol Cruz', title: 'Especialista en Lectura', subject: 'spanish', grades: 'K a 5to', modality: 'Virtual y presencial', town: 'Mayagüez', rating: 5.0, reviews: 88, price: 28, bio: 'Lectoescritura, ortografía y comprensión lectora.', color: '#4662e5' },
  { id: 't6', name: 'Jorge Santiago', title: 'Maestro de Álgebra', subject: 'math', grades: '6to a 12mo', modality: 'Virtual', town: 'Carolina', rating: 4.8, reviews: 72, price: 30, bio: 'Álgebra, geometría y preparación para exámenes.', color: '#3fae82' },
]
const TIMES = ['9:00 a. m.', '11:00 a. m.', '2:00 p. m.', '4:00 p. m.', '6:00 p. m.']

const initials = name => name.split(' ').map(n => n[0]).join('').slice(0, 2)

function BookingDialog({ tutor, students, onBook, onClose }) {
  const days = useMemo(() => Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d }).filter(d => d.getDay() !== 0).slice(0, 5), [])
  const [studentId, setStudentId] = useState(students[0]?.id || '')
  const [day, setDay] = useState(toISODate(days[0]))
  const [time, setTime] = useState(TIMES[2])
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Agendar con ${tutor.name}`}>
        <div className="flex items-center gap-4 bg-navy p-6 text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-xl font-semibold" style={{ backgroundColor: tutor.color }}>{initials(tutor.name)}</span>
          <div className="flex-1">
            <p className="text-xs font-extrabold tracking-wide text-gold uppercase">Agendar tutoría</p>
            <h3 className="font-display text-xl font-semibold">{tutor.name}</h3>
            <p className="text-sm text-white/70">{tutor.title} · ${tutor.price} por hora</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-white/60 hover:bg-white/10" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 p-6">
          {students.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-bold text-navy">¿Para quién?</p>
              <div className="flex flex-wrap gap-2">
                {students.map(s => <button key={s.id} type="button" onClick={() => setStudentId(s.id)} className={`flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-bold ${studentId === s.id ? 'border-navy bg-navy text-white' : 'border-sand text-navy'}`}><StudentAvatar student={s} size={24} /> {s.name}</button>)}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-bold text-navy">Día</p>
            <div className="grid grid-cols-5 gap-2">
              {days.map(d => {
                const iso = toISODate(d)
                return (
                  <button key={iso} type="button" onClick={() => setDay(iso)} className={`rounded-2xl border py-2 text-center ${day === iso ? 'border-brand bg-brand text-white' : 'border-sand text-navy hover:border-gold'}`}>
                    <span className="block text-[11px] font-extrabold uppercase opacity-80">{d.toLocaleDateString('es-PR', { weekday: 'short' })}</span>
                    <span className="block font-display text-xl font-semibold">{d.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-navy">Hora</p>
            <div className="flex flex-wrap gap-2">
              {TIMES.map(t => <button key={t} type="button" onClick={() => setTime(t)} className={`rounded-full border px-3.5 py-1.5 text-sm font-bold ${time === t ? 'border-navy bg-navy text-white' : 'border-sand text-navy hover:border-gold'}`}>{t}</button>)}
            </div>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="¿En qué necesita ayuda? (ej. le cuesta la resta con reagrupación)" className="min-h-20 w-full rounded-2xl border border-sand px-4 py-3 text-sm focus:border-gold focus:outline-none" />
          <Button variant="primary" className="w-full" onClick={() => onBook({ id: newId(), tutorId: tutor.id, studentId, day, time, note: note.trim() })}>Confirmar tutoría</Button>
        </div>
      </div>
    </div>
  )
}

export default function Tutoring({ students, doneKeysByStudent, playSession }) {
  const [filter, setFilter] = useState('all')
  const [booking, setBooking] = useState(null)
  const [sessions, setSessions] = useLocalState('gs_tutoring_v1', [])
  const today = toISODate(new Date())

  // Next pending lesson + flagged skills per child, for the AI tutor card.
  const helpers = students.map(s => {
    const done = doneKeysByStudent[s.id] || new Set()
    const next = s.plan.sessions.find(x => x.date >= today && x.lessonId && !done.has(progressKey(x))) || s.plan.sessions.find(x => x.lessonId && !done.has(progressKey(x)))
    const focus = s.profile.subjects.filter(x => x.support === 'refuerzo' || x.skills)
    return { student: s, next, focus }
  })

  const tutors = TUTORS.filter(t => filter === 'all' || t.subject === filter)
  const upcoming = sessions.filter(x => x.day >= today).sort((a, b) => a.day.localeCompare(b.day))

  return (
    <>
      <PageHeader eyebrow="Ayuda personalizada" title="Tutoría" subtitle="El tutor IA de Genial está dentro de cada lección. Cuando haga falta, agenda una tutoría con un maestro certificado." />

      <section className="relative mb-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-navy to-navy-2 p-7 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-16 -bottom-24 h-72 w-72 rounded-full bg-mint/25 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.16em] text-gold uppercase"><Sparkles className="h-4 w-4" /> Tutor IA en cada lección</p>
            <h2 className="mt-2 max-w-xl font-display text-3xl font-semibold">Si se atasca, el tutor le explica de otra forma, le da ejemplos y le hace preguntas.</h2>
            <div className={`mt-6 grid gap-4 ${helpers.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {helpers.length ? helpers.map(({ student, next, focus }) => (
                <div key={student.id} className="rounded-3xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                  <div className="flex items-center gap-3">
                    <StudentAvatar student={student} size={36} />
                    <p className="font-bold">{student.name}</p>
                  </div>
                  {focus.length > 0 && <p className="mt-3 text-sm text-white/70">Reforzar: {focus.map(f => `${subjectMeta(f.key).name}${f.skills ? ` (${f.skills})` : ''}`).join(' · ')}</p>}
                  {next && (
                    <button type="button" onClick={() => playSession(next, student.id)} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white p-2 pr-4 text-left text-navy transition-transform hover:-translate-y-0.5">
                      <SubjectIcon subject={next.subjectKey} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-extrabold text-brand uppercase">Abrir con el tutor IA</span>
                        <span className="block truncate text-sm font-bold">{next.title}</span>
                      </span>
                      <Play className="h-4 w-4 shrink-0 fill-current text-brand" />
                    </button>
                  )}
                </div>
              )) : <p className="text-white/70">Crea el plan de tu hijo(a) para abrir sus lecciones con el tutor IA.</p>}
            </div>
          </div>
          <div className="hidden h-44 w-44 items-center justify-center rounded-full bg-white shadow-2xl ring-8 ring-white/10 lg:flex">
            <img src={lecturina} alt="" className="h-36 w-36" />
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-navy">Tutores certificados</h2>
            <div className="flex flex-wrap gap-1 rounded-full border border-sand bg-white p-1">
              <button type="button" onClick={() => setFilter('all')} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === 'all' ? 'bg-navy text-white' : 'text-slate-500'}`}>Todos</button>
              {SUBJECT_KEYS.map(k => (
                <button key={k} type="button" onClick={() => setFilter(k)} className={`flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-1 text-xs font-bold ${filter === k ? 'bg-navy text-white' : 'text-slate-500'}`}><SubjectIcon subject={k} size={18} /> {subjectMeta(k).name}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {tutors.map(t => (
              <Panel key={t.id} as="article" className="flex flex-col p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-semibold text-white" style={{ backgroundColor: t.color }}>{initials(t.name)}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-1.5 font-display text-lg font-semibold text-navy">{t.name} <BadgeCheck className="h-4 w-4 text-mint" aria-label="Certificado" /></h3>
                    <p className="text-sm text-slate-500">{t.title}</p>
                  </div>
                  <SubjectIcon subject={t.subject} size={30} />
                </div>
                <p className="mt-4 text-sm text-slate-600">{t.bio}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {t.rating} ({t.reviews})</span>
                  <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> {t.modality}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t.town}</span>
                  <span>{t.grades}</span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <p><span className="font-display text-2xl font-semibold text-navy">${t.price}</span><span className="text-sm text-slate-500"> / hora</span></p>
                  <Button variant="dark" size="sm" onClick={() => setBooking(t)} disabled={!students.length}>Agendar</Button>
                </div>
              </Panel>
            ))}
          </div>
        </section>

        <Panel className="h-fit p-6">
          <PanelTitle>Mis tutorías</PanelTitle>
          {upcoming.length ? (
            <ul className="space-y-3">
              {upcoming.map(x => {
                const t = TUTORS.find(y => y.id === x.tutorId)
                const s = students.find(y => y.id === x.studentId)
                return (
                  <li key={x.id} className="rounded-3xl border border-sand p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl font-display font-semibold text-white" style={{ backgroundColor: t?.color }}>{initials(t?.name || '?')}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-navy">{t?.name}</p>
                        <p className="text-xs text-slate-500">{s ? `${s.name} · ` : ''}{subjectMeta(t?.subject).name}</p>
                      </div>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm font-bold text-navy"><CalendarClock className="h-4 w-4 text-brand" /> <span className="inline-block first-letter:uppercase">{new Date(`${x.day}T00:00`).toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long' })}</span> · {x.time}</p>
                    {x.note && <p className="mt-1 text-xs text-slate-500">{x.note}</p>}
                    <button type="button" onClick={() => setSessions(list => list.filter(y => y.id !== x.id))} className="mt-2 text-xs font-bold text-slate-400 hover:text-red-600">Cancelar</button>
                  </li>
                )
              })}
            </ul>
          ) : <p className="text-sm text-slate-500">No tienes tutorías agendadas. Elige un tutor para agendar la primera.</p>}
          {students.length > 0 && <p className="mt-5 border-t border-sand pt-4 text-xs text-slate-400">Para {students.map(s => `${s.name} (${gradeLabel(s.level)})`).join(', ')}.</p>}
        </Panel>
      </div>

      {booking && <BookingDialog tutor={booking} students={students} onClose={() => setBooking(null)} onBook={b => { setSessions(list => [...list, b]); setBooking(null) }} />}
    </>
  )
}
