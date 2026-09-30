// Lesson detail pulled live from Athenas: objectives, standards, description.
import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Loader2, Play, X } from 'lucide-react'
import { fetchLesson } from './api.js'
import { gradeLabel } from '../../shared/subjects.js'
import { WEEKDAY_LABELS, parseISODate } from '../../shared/scheduler.js'

export default function LessonModal({ session, subjects, onClose, done, onToggleDone, onPlay }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const subject = subjects.find(s => s.key === session.subjectKey)

  useEffect(() => {
    if (!session.lessonId) return
    let alive = true
    setDetail(null)
    setError('')
    fetchLesson(session.lessonId)
      .then(d => alive && setDetail(d))
      .catch(err => alive && setError(err.status === 503 ? 'El detalle de la lección se muestra cuando la API de Athenas está configurada (ATHENAS_API_KEY).' : err.message))
    return () => { alive = false }
  }, [session.lessonId])

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const date = session.date ? parseISODate(session.date) : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start gap-3 border-b border-slate-100 bg-white p-5" style={{ borderTop: `4px solid ${subject?.color || '#c0a267'}` }}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: subject?.color }}>
              {subject?.emoji} {subject?.name}
              {(detail?.levelCode || session.levelCode) && ` · ${gradeLabel(detail?.levelCode || session.levelCode)}`}
            </p>
            <h2 id="lesson-title" className="mt-1 text-xl font-bold text-slate-900">{detail?.title || session.title}</h2>
            {date && (
              <p className="mt-1 text-sm text-slate-500">
                {WEEKDAY_LABELS[date.getDay()]} {date.toLocaleDateString('es-PR', { day: 'numeric', month: 'long' })} · {session.time} · {session.minutes} min
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5 text-sm text-slate-700">
          {!session.lessonId && (
            <p>Sesión libre para repasar lo aprendido en {subject?.name}: vuelve a las lecciones que costaron más, practica ejercicios o haz un proyecto corto.</p>
          )}
          {session.lessonId && !detail && !error && (
            <p className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando la lección desde Athenas…</p>
          )}
          {error && <p className="rounded-lg bg-slate-50 p-3 text-slate-600">{error}</p>}

          {detail?.objectives?.length > 0 && (
            <section>
              <h3 className="mb-1.5 font-semibold text-slate-900">Objetivos</h3>
              <ul className="list-disc space-y-1 pl-5">{detail.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
            </section>
          )}
          {detail?.standards?.length > 0 && (
            <section>
              <h3 className="mb-1.5 font-semibold text-slate-900">Estándares</h3>
              <ul className="space-y-1.5">
                {detail.standards.map(s => (
                  <li key={s.code}><span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{s.code}</span>{s.description}</li>
                ))}
              </ul>
            </section>
          )}
          {detail?.description && (
            <section>
              <h3 className="mb-1.5 font-semibold text-slate-900">De qué trata</h3>
              <p className="whitespace-pre-line leading-relaxed">{detail.description}</p>
            </section>
          )}
          {detail?.definitions?.length > 0 && (
            <section>
              <h3 className="mb-1.5 font-semibold text-slate-900">Vocabulario</h3>
              <dl className="space-y-1">
                {detail.definitions.slice(0, 8).map(d => <div key={d.name}><dt className="inline font-medium">{d.name}: </dt><dd className="inline">{d.desc}</dd></div>)}
              </dl>
            </section>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5">
          {session.lessonId ? <span className="font-mono text-xs text-slate-400">Lección Athenas #{session.lessonId}</span> : <span />}
          <div className="flex gap-2">
            {session.lessonId && onPlay && (
              <button type="button" onClick={onPlay} className="inline-flex items-center gap-1.5 rounded-lg bg-[#c0a267] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#d1b67e]">
                <Play className="h-4 w-4" /> Empezar lección
              </button>
            )}
            {onToggleDone && (
              <button
                type="button"
                onClick={onToggleDone}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold ${done ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {done ? 'Completada' : 'Marcar como completada'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
