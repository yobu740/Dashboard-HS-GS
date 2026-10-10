// Lesson detail pulled live from Athenas: objectives, standards, description.
import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Loader2, Play, X } from 'lucide-react'
import { fetchLesson } from './api.js'
import { gradeLabel } from '../../shared/subjects.js'
import { WEEKDAY_LABELS, SESSION_KINDS, parseISODate } from '../../shared/scheduler.js'
import { SubjectIcon } from './brand/BrandIcon.jsx'
import { Button, KindBadge, subjectMeta } from './ui.jsx'

const STEP_NOTE = {
  practice: 'Hoy toca practicar esta lección. Se abre directo en la sección de Práctica.',
  exam: 'Examen de la lección. Se abre directo en la sección de Examen; al terminarlo, la lección cuenta como completada.',
  review: 'Repaso de destrezas: vuelve a practicar esta lección de semanas anteriores para afianzar lo aprendido.',
}

export default function LessonModal({ session, onClose, done, onToggleDone, onPlay }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const meta = subjectMeta(session.subjectKey)
  const kind = session.date ? SESSION_KINDS[session.kind] : null

  useEffect(() => {
    if (!session.lessonId) return
    let alive = true
    setDetail(null)
    setError('')
    fetchLesson(session.lessonId)
      .then(d => alive && setDetail(d))
      .catch(err => alive && setError(err.status === 503 ? 'El detalle de la lección se muestra cuando la API de Athenas está configurada.' : err.message))
    return () => { alive = false }
  }, [session.lessonId])

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const date = session.date ? parseISODate(session.date) : null
  const level = detail?.levelCode || session.levelCode

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="lesson-title" className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4 p-6" style={{ backgroundColor: meta.soft }}>
          <SubjectIcon subject={session.subjectKey} size={50} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold tracking-wide uppercase" style={{ color: meta.color }}>{meta.name}{level ? ` · ${gradeLabel(level)}` : ''}</p>
            <h2 id="lesson-title" className="mt-0.5 font-display text-2xl leading-tight font-semibold text-navy">{detail?.title || session.title}</h2>
            {date && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <KindBadge kind={session.kind} />
                {WEEKDAY_LABELS[date.getDay()]} {date.toLocaleDateString('es-PR', { day: 'numeric', month: 'long' })} · {session.time} · {session.minutes} min
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-white/70 hover:text-navy" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-[15px] text-slate-700">
          {!session.lessonId && <p>Sesión libre para repasar lo aprendido en {meta.name}: vuelve a las lecciones que costaron más, practica o haz un proyecto corto.</p>}
          {session.lessonId && STEP_NOTE[session.kind] && session.date && <p className="rounded-2xl bg-cream p-4 text-sm text-slate-700">{STEP_NOTE[session.kind]}</p>}
          {session.lessonId && !detail && !error && <p className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando la lección…</p>}
          {error && <p className="rounded-2xl bg-cream p-4 text-sm text-slate-600">{error}</p>}

          {detail?.objectives?.length > 0 && (
            <section>
              <h3 className="mb-2 font-display text-lg font-semibold text-navy">Objetivos</h3>
              <ul className="space-y-1.5">{detail.objectives.map((o, i) => <li key={i} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />{o}</li>)}</ul>
            </section>
          )}
          {detail?.standards?.length > 0 && (
            <section>
              <h3 className="mb-2 font-display text-lg font-semibold text-navy">Estándares del DEPR</h3>
              <ul className="space-y-2">{detail.standards.map(s => <li key={s.code} className="text-sm"><span className="mr-2 rounded-full bg-cream px-2 py-0.5 font-mono text-xs font-bold text-navy">{s.code}</span>{s.description}</li>)}</ul>
            </section>
          )}
          {detail?.description && (
            <section>
              <h3 className="mb-2 font-display text-lg font-semibold text-navy">De qué trata</h3>
              <p className="leading-relaxed whitespace-pre-line">{detail.description}</p>
            </section>
          )}
          {detail?.definitions?.length > 0 && (
            <section>
              <h3 className="mb-2 font-display text-lg font-semibold text-navy">Vocabulario</h3>
              <dl className="grid gap-2 sm:grid-cols-2">
                {detail.definitions.slice(0, 8).map(d => <div key={d.name} className="rounded-2xl bg-cream/70 p-3 text-sm"><dt className="font-bold text-navy">{d.name}</dt><dd className="mt-0.5 text-slate-600">{d.desc}</dd></div>)}
              </dl>
            </section>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand p-5">
          {onToggleDone ? (
            <button type="button" onClick={onToggleDone} className="flex items-center gap-2 text-sm font-bold text-navy">
              {done ? <CheckCircle2 className="h-5 w-5 text-mint" /> : <Circle className="h-5 w-5 text-slate-300" />} {done ? 'Completada' : 'Marcar como completada'}
            </button>
          ) : <span className="font-mono text-xs text-slate-400">{session.lessonId ? `Lección #${session.lessonId}` : ''}</span>}
          {session.lessonId && onPlay && (
            <Button variant="primary" onClick={onPlay}><Play className="h-4 w-4 fill-current" /> {kind ? `Empezar: ${kind.label}` : 'Abrir lección'}</Button>
          )}
        </div>
      </div>
    </div>
  )
}
