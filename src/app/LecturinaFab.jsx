// Floating Lecturina button on the dashboard: opens the follow-up chat to
// adjust a student's plan ("menos días", "agrega ciencias", …).
import { useState } from 'react'
import lecturina from '../assets/lecturina.png'

export default function LecturinaFab({ students, onChat }) {
  const [open, setOpen] = useState(false)
  if (!students.length) return null
  const start = s => { setOpen(false); onChat(s) }

  return (
    <div className="fixed right-5 bottom-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-64 animate-in fade-in slide-in-from-bottom-2 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-200 duration-200">
          <p className="px-2 pb-2 text-sm font-semibold text-slate-800">¿De qué plan quieres hablar?</p>
          {students.map(s => (
            <button key={s.id} type="button" onClick={() => start(s)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: s.color }}>{s.name.charAt(0)}</span>
              <span className="text-sm font-medium text-slate-700">{s.name}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => (students.length === 1 ? start(students[0]) : setOpen(o => !o))}
        className="group flex items-center gap-3 rounded-full bg-white p-1.5 sm:pr-5 shadow-xl shadow-navy/20 ring-1 ring-sand transition-all hover:-translate-y-0.5 hover:shadow-2xl"
        aria-label="Hablar con Lecturina"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-2 ring-gold-light">
          <img src={lecturina} alt="" className="h-11 w-11 transition-transform group-hover:scale-110" />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block font-display text-base font-semibold text-navy">Lecturina</span>
          <span className="block text-xs text-slate-500">¿Ajustamos el plan?</span>
        </span>
      </button>
    </div>
  )
}
