// Students: one card per child, add another (runs the onboarding again) or reset.
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { SUBJECTS, gradeLabel } from '../../../shared/subjects.js'
import { progressKey } from '../store.js'
import { ProgressRing, SecondaryButton } from '../ui.jsx'

export default function StudentsSection({ state, store, doneKeysByStudent, startOnboarding, setActiveStudentId, goTo }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Estudiantes</h1>
          <p className="mt-1 text-slate-600">Cada estudiante tiene su propio plan, diseñado a partir de sus respuestas.</p>
        </div>
        <button type="button" onClick={() => startOnboarding(null)} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
          <Plus className="h-4 w-4" /> Añadir estudiante
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {state.students.map(s => {
          const lessons = s.plan.sessions.filter(x => x.kind === 'lesson')
          const done = lessons.filter(x => doneKeysByStudent[s.id]?.has(progressKey(x))).length
          const p = s.profile
          return (
            <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: s.color }}>{s.name.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-slate-900">{s.name}</h2>
                  <p className="text-sm text-slate-500">{gradeLabel(s.level)}{s.age ? ` · ${s.age} años` : ''}</p>
                </div>
                <ProgressRing value={lessons.length ? done / lessons.length : 0} color={s.color} />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.subjects.map(x => (
                  <span key={x.key} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${SUBJECTS[x.key].color}1a`, color: SUBJECTS[x.key].color }}>
                    {SUBJECTS[x.key].name}{x.support === 'refuerzo' ? ' · refuerzo' : x.support === 'avanzado' ? ' · avanzado' : ''}
                  </span>
                ))}
              </div>
              {p.interests?.length > 0 && <p className="mt-3 text-sm text-slate-600"><strong>Intereses:</strong> {p.interests.join(', ')}</p>}
              <p className="mt-1 text-sm text-slate-600"><strong>Progreso:</strong> {done} de {lessons.length} lecciones</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SecondaryButton onClick={() => { setActiveStudentId(s.id); goTo('plan') }}>Ver plan</SecondaryButton>
                <SecondaryButton onClick={() => startOnboarding(s)}><Pencil className="h-4 w-4" /> Editar perfil</SecondaryButton>
                <button
                  type="button"
                  onClick={() => window.confirm(`¿Eliminar a ${s.name} y su plan?`) && store.removeStudent(s.id)}
                  className="rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Eliminar a ${s.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => window.confirm('¿Borrar todos los datos y empezar el onboarding de nuevo?') && store.reset()}
          className="text-sm text-slate-500 underline-offset-2 hover:text-red-600 hover:underline"
        >
          Borrar todo y empezar de nuevo
        </button>
      </div>
    </div>
  )
}
