// Full-screen lesson player. Embeds the Genial Skills lesson viewer
// (genial-skills-redesign, same one the MED portal uses) in live mode, so any
// Athenas lesson id from the plan opens with its concept, examples, practice
// and exam. The viewer runs on another origin, so we use its host mode
// (?host=1: own section menu, no Genial top bar) rather than ?embed=1, which
// needs same-origin control. In host mode it posts progress messages; when the
// student finishes, the session is marked done automatically.
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import { lessonUrl, VIEWER_ORIGIN } from './api.js'
import { SESSION_KINDS } from '../../shared/scheduler.js'

export default function LessonPlayer({ session, subject, done, onToggleDone, onClose }) {
  const kind = SESSION_KINDS[session.kind] || SESSION_KINDS.learn
  const url = lessonUrl(session.lessonId, subject?.athenasCode || session.subjectCode, kind.section)
  const [percent, setPercent] = useState(null)
  const doneRef = useRef(done)
  doneRef.current = done

  useEffect(() => {
    // Toggle only once, even if several messages arrive before the next render.
    const markDone = () => {
      if (doneRef.current || !onToggleDone) return
      doneRef.current = true
      onToggleDone()
    }
    const onMessage = e => {
      if (e.origin !== VIEWER_ORIGIN || !e.data?.type) return
      if (e.data.type === 'med-lesson' && typeof e.data.percent === 'number') {
        setPercent(e.data.percent)
        if (e.data.percent >= 100) markDone()
      }
      if (e.data.type === 'med-lesson-finish') {
        markDone()
        onClose()
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onToggleDone, onClose])

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900" role="dialog" aria-modal="true" aria-label={session.title}>
      <div className="flex items-center gap-3 bg-slate-700 px-3 py-2 text-white sm:px-4">
        <button type="button" onClick={onClose} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-slate-600">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Volver al dashboard</span>
        </button>
        <span className="h-6 w-1 shrink-0 rounded-full" style={{ backgroundColor: subject?.color || '#c0a267' }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-300">{subject?.name} · {kind.label}</p>
          <p className="truncate text-sm font-semibold">{session.title}</p>
        </div>
        {percent !== null && (
          <div className="hidden w-32 items-center gap-2 md:flex" title="Progreso de la lección">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-500">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="w-9 text-right text-xs font-semibold text-slate-200">{percent}%</span>
          </div>
        )}
        <a href={url} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 hover:bg-slate-600 sm:flex" title="Abrir en una pestaña nueva">
          <ExternalLink className="h-4 w-4" />
        </a>
        {onToggleDone && (
          <button
            type="button"
            onClick={onToggleDone}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${done ? 'bg-emerald-500 text-white' : 'bg-[#c0a267] text-slate-900 hover:bg-[#d1b67e]'}`}
          >
            {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            <span className="hidden sm:inline">{done ? 'Completada' : 'Marcar como completada'}</span>
          </button>
        )}
      </div>
      <iframe
        key={url}
        src={url}
        title={session.title}
        className="w-full flex-1 border-0 bg-white"
        allow="autoplay; fullscreen; microphone; clipboard-write"
      />
    </div>
  )
}
