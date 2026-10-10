// Estudiantes — one card per child: plan type, overall and per-subject
// progress, and the actions that matter (plan, ask Lecturina, remove).
import { MessageCircle, Plus, Route, Trash2 } from 'lucide-react'
import { gradeLabel } from '../../../shared/subjects.js'
import { SubjectIcon } from '../brand/BrandIcon.jsx'
import { Button, EmptyState, PageHeader, Panel, ProgressBar, Ring, StudentAvatar, subjectMeta } from '../ui.jsx'

export default function Students({ students, doneKeysByStudent, onAdd, onChat, onRemove, onOpenPlan }) {
  if (!students.length) {
    return (
      <>
        <PageHeader eyebrow="Familia" title="Estudiantes" />
        <EmptyState title="Aún no hay estudiantes" text="Lecturina te ayuda a crear el perfil y el plan de estudio de cada hijo(a)." actionLabel="Añadir estudiante" onAction={onAdd} />
      </>
    )
  }

  return (
    <>
      <PageHeader eyebrow="Familia" title="Estudiantes" subtitle="Cada hijo(a) tiene su propio plan, calendario y progreso." actions={<Button variant="primary" onClick={onAdd}><Plus className="h-4 w-4" /> Añadir estudiante</Button>} />
      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {students.map(s => {
          const done = doneKeysByStudent[s.id]
          const lessons = s.plan.subjects.flatMap(x => x.lessons)
          const completed = lessons.filter(l => done?.has(`lesson:${l.id}:exam`)).length
          const p = s.profile
          return (
            <Panel key={s.id} className="flex flex-col overflow-hidden">
              <div className="relative bg-gradient-to-br from-navy to-navy-2 px-6 pt-6 pb-14 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold tracking-wide uppercase">{p.mode === 'refuerzo' ? 'Refuerzo' : 'Homeschool'}</span>
                    <h2 className="mt-3 font-display text-2xl font-semibold">{s.name}</h2>
                    <p className="text-sm text-white/70">{gradeLabel(s.level)}{s.age ? ` · ${s.age} años` : ''}</p>
                  </div>
                  <button type="button" onClick={() => window.confirm(`¿Eliminar a ${s.name} y su plan?`) && onRemove(s.id)} className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white" aria-label={`Eliminar a ${s.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="relative z-10 -mt-10 flex items-end justify-between px-6">
                <StudentAvatar student={s} size={72} ring />
                <div className="rounded-2xl bg-white p-1 shadow-md">
                  <Ring value={lessons.length ? completed / lessons.length : 0} size={64} stroke={6} color={s.color}>
                    <span className="font-display text-sm font-semibold text-navy">{lessons.length ? Math.round((completed / lessons.length) * 100) : 0}%</span>
                  </Ring>
                </div>
              </div>
              <div className="flex flex-1 flex-col px-6 pt-4 pb-6">
                <p className="text-sm text-slate-500">{completed} de {lessons.length} lecciones completadas · {s.plan.settings.weeks} semanas</p>
                <ul className="mt-5 space-y-3.5">
                  {s.plan.subjects.map(sub => {
                    const subDone = sub.lessons.filter(l => done?.has(`lesson:${l.id}:exam`)).length
                    const skills = p.subjects.find(x => x.key === sub.key)?.skills
                    return (
                      <li key={sub.key} className="flex items-center gap-3">
                        <SubjectIcon subject={sub.key} size={30} />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex justify-between gap-2 text-sm">
                            <span className="truncate font-bold text-navy">{subjectMeta(sub.key).name}{skills ? <span className="font-normal text-slate-500"> · {skills}</span> : null}</span>
                            <span className="shrink-0 text-xs text-slate-500">{subDone}/{sub.lessons.length}</span>
                          </div>
                          <ProgressBar value={sub.lessons.length ? subDone / sub.lessons.length : 0} color={subjectMeta(sub.key).color} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {p.interests?.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {p.interests.map(i => <span key={i} className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-slate-600">{i}</span>)}
                  </div>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  <Button variant="dark" size="sm" onClick={() => onOpenPlan(s.id)}><Route className="h-4 w-4" /> Ver plan</Button>
                  <Button size="sm" onClick={() => onChat(s)}><MessageCircle className="h-4 w-4" /> Ajustar con Lecturina</Button>
                </div>
              </div>
            </Panel>
          )
        })}
        <button type="button" onClick={onAdd} className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[26px] border-2 border-dashed border-sand bg-white/50 text-slate-500 transition-colors hover:border-gold hover:bg-white hover:text-navy">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-light text-gold-dark"><Plus className="h-6 w-6" /></span>
          <span className="font-display text-lg font-semibold">Añadir estudiante</span>
          <span className="max-w-[220px] text-center text-sm">Lecturina te hará unas preguntas para armar su plan.</span>
        </button>
      </div>
    </>
  )
}
