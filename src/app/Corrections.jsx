// Corrections the Genial Skills AI made to the child's practices and exams
// (levels 3 and 4: written answers, with the whiteboard or a photo of the
// work, graded with the lesson's rubric). In Homeschool the parent receives
// these grades; there is nothing to confirm.
import { useEffect } from 'react'
import { AlertTriangle, Camera, PenLine, Sparkles, X } from 'lucide-react'
import { SubjectIcon } from './brand/BrandIcon.jsx'
import { ProgressBar, StudentAvatar, subjectMeta } from './ui.jsx'

const KIND = {
  exam: { label: 'Examen', className: 'bg-[#f3e8f7] text-[#7e3a8e]' },
  practice: { label: 'Práctica', className: 'bg-[#fff1e3] text-[#b45a14]' },
}

/** Written-answer points and multiple-choice hits of one record. */
export function correctionScore(record) {
  const graded = (record.open || []).filter(o => o.grading)
  const points = graded.reduce((a, o) => a + (o.grading.points || 0), 0)
  const max = graded.reduce((a, o) => a + (o.grading.max || 0), 0)
  const sel = record.selection && record.selection.total ? record.selection : null
  const parts = [max ? points / max : null, sel ? sel.correct / sel.total : null].filter(x => x !== null)
  return { points, max, sel, ratio: parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null }
}

const fmtWhen = iso => new Date(iso).toLocaleDateString('es-PR', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export function CorrectionRow({ record, student, onOpen, showStudent = false }) {
  const meta = subjectMeta(record.subjectKey)
  const { points, max, sel, ratio } = correctionScore(record)
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-cream">
      <span className="relative">
        <SubjectIcon subject={record.subjectKey} size={34} />
        {!record.seen && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-brand ring-2 ring-white" aria-label="Nueva" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-navy">{record.lessonTitle || meta.name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${KIND[record.kind]?.className}`}>{KIND[record.kind]?.label}</span>
          {showStudent && student && <span className="font-bold">{student.name}</span>}
          <span className="first-letter:uppercase">{fmtWhen(record.at || record.receivedAt)}</span>
        </span>
      </span>
      <span className="shrink-0 text-right">
        {max > 0 && <span className="block font-display text-base font-semibold text-navy">{points}/{max}</span>}
        {sel && <span className="block text-[11px] font-bold text-slate-500">{sel.correct}/{sel.total} selección</span>}
        {ratio === null && <span className="text-xs text-slate-400">Entregado</span>}
      </span>
    </button>
  )
}

function OpenAnswer({ item, index, childName }) {
  const g = item.grading
  const ratio = g?.max ? g.points / g.max : 0
  return (
    <section className="rounded-3xl border border-sand p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">Pregunta {index + 1} · respuesta escrita</p>
        {g && <span className={`rounded-full px-3 py-1 font-display text-sm font-semibold ${ratio >= 0.75 ? 'bg-[#e4f4ef] text-[#2b7a63]' : ratio >= 0.5 ? 'bg-[#fff1e3] text-[#b45a14]' : 'bg-red-50 text-red-700'}`}>{g.points} / {g.max}</span>}
      </div>
      {item.prompt && <p className="font-bold text-navy">{item.prompt}</p>}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-slate-400 uppercase"><PenLine className="h-3.5 w-3.5" /> Lo que escribió {childName}</p>
          <p className="rounded-2xl bg-cream p-3 text-sm whitespace-pre-line text-slate-700">{item.answer || <span className="text-slate-400">(sin texto)</span>}</p>
        </div>
        {item.image && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-slate-400 uppercase"><Camera className="h-3.5 w-3.5" /> {item.imageFrom === 'photo' ? 'Foto de su trabajo' : 'Su pizarra'}</p>
            <a href={item.image} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-sand bg-white">
              <img src={item.image} alt={`Trabajo de ${childName}`} className="max-h-72 w-full object-contain" />
            </a>
          </div>
        )}
      </div>

      {g ? (
        <>
          <ul className="mt-5 space-y-3">
            {g.criteria.map(c => (
              <li key={c.id}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="font-bold text-navy">{c.criterion}</span>
                  <span className="shrink-0 font-bold text-slate-500">{c.points}/{c.max}</span>
                </div>
                <ProgressBar value={c.max ? c.points / c.max : 0} color={c.points === c.max ? '#48af97' : c.points === 0 ? '#e26d5a' : '#f4a14a'} />
                <p className="mt-1 text-sm text-slate-500">{c.reason || c.level}</p>
              </li>
            ))}
          </ul>
          {g.feedback && <p className="mt-4 rounded-2xl bg-gold-light/50 p-3 text-sm text-slate-700"><span className="font-bold text-navy">Comentario para {childName}: </span>{g.feedback}</p>}
          {g.solution && (
            <div className="mt-4 rounded-2xl border border-mint/40 bg-[#e4f4ef]/60 p-4">
              <p className="mb-1 text-xs font-extrabold tracking-wide text-[#2b7a63] uppercase">Así se resuelve</p>
              <p className="text-sm whitespace-pre-line text-slate-700">{g.solution}</p>
            </div>
          )}
          {g.review && (
            <p className="mt-4 flex gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              La IA no está segura de esta corrección{g.reviewReason ? ` (${g.reviewReason})` : ''}. Vale la pena revisarla con {childName}.
            </p>
          )}
        </>
      ) : <p className="mt-4 text-sm text-slate-500">Esta respuesta no se pudo corregir (se entregó sin conexión o sin contenido).</p>}
    </section>
  )
}

export function CorrectionDetail({ record, student, onClose }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const meta = subjectMeta(record.subjectKey)
  const { points, max, sel } = correctionScore(record)
  const name = student?.name || 'tu hijo(a)'
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Corrección">
        <div className="flex items-start gap-4 p-6" style={{ backgroundColor: meta.soft }}>
          <SubjectIcon subject={record.subjectKey} size={48} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold tracking-wide uppercase" style={{ color: meta.color }}>{meta.name} · {KIND[record.kind]?.label}{record.quizTitle && record.quizTitle.toLowerCase() !== KIND[record.kind]?.label.toLowerCase() ? ` · ${record.quizTitle}` : ''}</p>
            <h2 className="mt-0.5 font-display text-2xl leading-tight font-semibold text-navy">{record.lessonTitle}</h2>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-600">
              {student && <StudentAvatar student={student} size={22} />} {name} · <span className="first-letter:uppercase">{fmtWhen(record.at || record.receivedAt)}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-white/70" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-navy p-4 text-white">
            <Sparkles className="h-5 w-5 shrink-0 text-gold" />
            <p className="min-w-[200px] flex-1 text-sm text-white/85">Corregido por la IA de Genial Skills con la rúbrica de la lección. Es la nota final: no tienes que confirmarla.</p>
            <div className="flex gap-4 text-right">
              {max > 0 && <div><p className="font-display text-2xl font-semibold">{points}/{max}</p><p className="text-[11px] font-bold text-white/60 uppercase">Respuestas escritas</p></div>}
              {sel && <div><p className="font-display text-2xl font-semibold">{sel.correct}/{sel.total}</p><p className="text-[11px] font-bold text-white/60 uppercase">Selección</p></div>}
            </div>
          </div>
          {(record.open || []).map((item, i) => <OpenAnswer key={`${item.questionId}-${i}`} item={item} index={i} childName={name} />)}
          {!record.open?.length && <p className="text-sm text-slate-500">Este examen solo tenía preguntas de selección.</p>}
        </div>
      </div>
    </div>
  )
}
