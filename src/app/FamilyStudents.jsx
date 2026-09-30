// "Estudiantes": the family's students with their plan progress. Adding a
// student opens the onboarding popup for that child.
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { SUBJECTS, gradeLabel } from '../../shared/subjects.js'
import { deprCoverage } from './depr.js'

export default function FamilyStudents({ students, doneKeysByStudent, onAdd, onEdit, onRemove, onOpenPlan }) {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-gray-600">Cada estudiante tiene su propio plan de estudio</p>
        </div>
        <Button onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Añadir Estudiante</Button>
      </div>

      {!students.length && (
        <Card><CardContent className="py-10 text-center text-gray-600">Aún no has añadido estudiantes. Usa “Añadir Estudiante” para crear su plan con IA.</CardContent></Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {students.map(s => {
          const done = doneKeysByStudent[s.id]
          const lessons = s.plan.subjects.flatMap(x => x.lessons)
          const completed = lessons.filter(l => done?.has(`lesson:${l.id}:exam`)).length
          const pct = lessons.length ? Math.round((completed / lessons.length) * 100) : 0
          const coverage = s.profile?.depr ? deprCoverage(s.plan, done) : []
          return (
            <Card key={s.id} className="transition-shadow hover:shadow-lg">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-100 text-2xl font-bold text-white" style={{ backgroundColor: s.color }}>{s.name.charAt(0)}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                    <p className="text-sm text-gray-600">{gradeLabel(s.level)}{s.age ? ` · ${s.age} años` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{pct}%</p>
                    <p className="text-xs text-gray-500">{completed}/{lessons.length} lecciones</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.profile.subjects.map(x => (
                    <span key={x.key} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${SUBJECTS[x.key].color}1a`, color: SUBJECTS[x.key].color }}>
                      {SUBJECTS[x.key].name}{x.support === 'refuerzo' ? ' · refuerzo' : x.support === 'avanzado' ? ' · avanzado' : ''}
                    </span>
                  ))}
                </div>
                {s.profile.interests?.length > 0 && <p className="text-sm text-gray-600"><strong>Intereses:</strong> {s.profile.interests.join(', ')}</p>}
                {coverage.length > 0 && (
                  <p className="text-sm text-gray-600"><strong>DEPR:</strong> {coverage.map(c => `${c.name} ${c.completed}/${c.total}`).join(' · ')}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onOpenPlan(s.id)}>Ver plan</Button>
                  <Button size="sm" variant="outline" onClick={() => onEdit(s)}><Pencil className="mr-1 h-4 w-4" /> Editar perfil</Button>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-600" onClick={() => window.confirm(`¿Eliminar a ${s.name} y su plan?`) && onRemove(s.id)} aria-label={`Eliminar a ${s.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
