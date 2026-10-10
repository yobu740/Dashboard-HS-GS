// Portafolio — the child's learning record built from real progress: totals,
// progress by subject, DEPR coverage, completed work, evidence uploaded by the
// parent (photos + notes), and a printable progress report.
import { useMemo, useRef, useState } from 'react'
import { Award, BookOpenCheck, Camera, Clock3, FileDown, ImagePlus, Trash2, X } from 'lucide-react'
import { SUBJECTS, gradeLabel } from '../../../shared/subjects.js'
import { SESSION_KINDS, parseISODate } from '../../../shared/scheduler.js'
import { progressKey, newId, useLocalState } from '../store.js'
import { deprCoverage } from '../depr.js'
import { SubjectIcon } from '../brand/BrandIcon.jsx'
import DeprPanel from '../DeprPanel.jsx'
import { Button, EmptyState, KindBadge, PageHeader, Panel, PanelTitle, ProgressBar, StudentTabs, subjectMeta } from '../ui.jsx'

const fmtDay = iso => new Date(iso).toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long' })

/** Downscale a photo so evidence fits in browser storage. */
function readImage(file, max = 900) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function printReport({ student, stats, bySubject, coverage, completed, evidence, parentName }) {
  const rows = bySubject.map(s => `<tr><td>${escapeHtml(s.name)}</td><td>${s.done} / ${s.total}</td><td>${s.practices}</td><td>${s.exams}</td><td>${Math.round(s.minutes / 60 * 10) / 10} h</td></tr>`).join('')
  const depr = coverage.length ? `<h2>Currículo del Departamento de Educación</h2><table><tr><th>Materia</th><th>Expectativas completadas</th><th>En el plan</th><th>Del grado</th></tr>${coverage.map(c => `<tr><td>${escapeHtml(c.name)}</td><td>${c.completed}</td><td>${c.planned}</td><td>${c.total}</td></tr>`).join('')}</table>` : ''
  const done = completed.slice(0, 60).map(c => `<li><strong>${escapeHtml(c.session.title)}</strong> — ${escapeHtml(SUBJECTS[c.session.subjectKey]?.name)} · ${SESSION_KINDS[c.session.kind].label} · ${new Date(c.at).toLocaleDateString('es-PR')}</li>`).join('')
  const ev = evidence.map(e => `<div class="ev">${e.image ? `<img src="${e.image}">` : ''}<p><strong>${escapeHtml(e.title)}</strong><br>${escapeHtml(e.note)}</p></div>`).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Portafolio de ${escapeHtml(student.name)}</title>
<style>body{font-family:Nunito,Arial,sans-serif;color:#1b2537;margin:40px;max-width:900px}h1{color:#1f3756;margin:0}h2{color:#1f3756;border-bottom:3px solid #f47d45;padding-bottom:6px;margin-top:32px}
.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #ebe4d6;padding-bottom:16px}.brand{color:#f47d45;font-weight:800;letter-spacing:.1em;font-size:12px}
.stats{display:flex;gap:16px;margin-top:20px}.stat{flex:1;background:#f7f4ee;border-radius:14px;padding:14px}.stat b{display:block;font-size:26px;color:#1f3756}
table{width:100%;border-collapse:collapse;margin-top:10px}th,td{text-align:left;padding:8px;border-bottom:1px solid #ebe4d6;font-size:14px}th{background:#f7f4ee}
ul{padding-left:18px;font-size:14px;line-height:1.6}.evs{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.ev img{width:100%;border-radius:10px}.ev p{font-size:13px}
.foot{margin-top:40px;color:#64748b;font-size:12px}@media print{body{margin:16px}}</style></head><body>
<div class="top"><div><div class="brand">GENIAL SKILLS · HOMESCHOOL</div><h1>Portafolio de aprendizaje</h1><p>${escapeHtml(student.name)} · ${escapeHtml(gradeLabel(student.level))}${student.age ? ` · ${student.age} años` : ''}</p></div>
<div style="text-align:right;font-size:13px">Periodo: ${escapeHtml(student.plan.settings.startDate)} · ${student.plan.settings.weeks} semanas<br>Preparado por ${escapeHtml(parentName)}<br>${new Date().toLocaleDateString('es-PR')}</div></div>
<div class="stats"><div class="stat"><b>${stats.lessons}</b>lecciones completadas</div><div class="stat"><b>${stats.practices}</b>prácticas</div><div class="stat"><b>${stats.exams}</b>exámenes</div><div class="stat"><b>${stats.hours}</b>horas de estudio</div></div>
<h2>Progreso por materia</h2><table><tr><th>Materia</th><th>Lecciones completadas</th><th>Prácticas</th><th>Exámenes</th><th>Tiempo</th></tr>${rows}</table>
${depr}
<h2>Trabajo completado</h2>${done ? `<ul>${done}</ul>` : '<p>Aún no hay actividades completadas.</p>'}
${evidence.length ? `<h2>Evidencias</h2><div class="evs">${ev}</div>` : ''}
<p class="foot">Reporte generado por Genial Skills Homeschool con lecciones del catálogo de Genial Skills.</p>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`
  const w = window.open('', '_blank')
  if (!w) return alert('Permite las ventanas emergentes para generar el reporte.')
  w.document.write(html)
  w.document.close()
}

function EvidenceForm({ student, onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [subject, setSubject] = useState(student.plan.subjects[0]?.key || 'math')
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)
  const pick = async file => { if (!file) return; setBusy(true); try { setImage(await readImage(file)) } finally { setBusy(false) } }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
        onSubmit={e => { e.preventDefault(); onSave({ id: newId(), title: title.trim(), note: note.trim(), subject, image, date: new Date().toISOString() }) }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-navy">Nueva evidencia</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-cream" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} className="flex h-44 w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-sand bg-cream/60 text-slate-500 hover:border-gold">
          {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-sm font-bold"><Camera className="h-7 w-7" /> {busy ? 'Procesando…' : 'Añadir foto (opcional)'}</span>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => pick(e.target.files?.[0])} />
        <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (ej. Maqueta del sistema solar)" className="mt-4 h-11 w-full rounded-2xl border border-sand px-4 focus:border-gold focus:outline-none" />
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="¿Qué aprendió? ¿Cómo lo hizo?" className="mt-3 min-h-24 w-full rounded-2xl border border-sand px-4 py-3 focus:border-gold focus:outline-none" />
        <div className="mt-3 flex flex-wrap gap-2">
          {student.plan.subjects.map(s => (
            <button key={s.key} type="button" onClick={() => setSubject(s.key)} className={`flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-xs font-bold ${subject === s.key ? 'border-navy bg-navy text-white' : 'border-sand text-navy'}`}>
              <SubjectIcon subject={s.key} size={20} /> {subjectMeta(s.key).name}
            </button>
          ))}
        </div>
        <Button type="submit" variant="primary" className="mt-6 w-full" disabled={!title.trim()}>Guardar evidencia</Button>
      </form>
    </div>
  )
}

export default function Portfolio({ students, studentId, setStudentId, progress, doneKeysByStudent, parentName, onAdd }) {
  const [evidenceStore, setEvidenceStore] = useLocalState('gs_portfolio_v1', {})
  const [adding, setAdding] = useState(false)
  const student = students.find(s => s.id === studentId) || students[0]

  const view = useMemo(() => {
    if (!student) return null
    const done = doneKeysByStudent[student.id] || new Set()
    const log = progress[student.id] || {}
    const doneSessions = student.plan.sessions.filter(s => done.has(progressKey(s)))
    const completed = Object.entries(log)
      .map(([key, at]) => ({ at, session: student.plan.sessions.find(s => progressKey(s) === key) }))
      .filter(x => x.session)
      .sort((a, b) => b.at.localeCompare(a.at))
    const bySubject = student.plan.subjects.map(sub => {
      const mine = doneSessions.filter(s => s.subjectKey === sub.key)
      return {
        key: sub.key,
        name: subjectMeta(sub.key).name,
        total: sub.lessons.length,
        done: sub.lessons.filter(l => done.has(`lesson:${l.id}:exam`)).length,
        practices: mine.filter(s => s.kind === 'practice').length,
        exams: mine.filter(s => s.kind === 'exam').length,
        minutes: mine.reduce((a, s) => a + s.minutes, 0),
      }
    })
    const minutes = doneSessions.reduce((a, s) => a + s.minutes, 0)
    return {
      done, completed, bySubject,
      stats: {
        lessons: bySubject.reduce((a, s) => a + s.done, 0),
        practices: doneSessions.filter(s => s.kind === 'practice').length,
        exams: doneSessions.filter(s => s.kind === 'exam').length,
        hours: Math.round((minutes / 60) * 10) / 10,
      },
      coverage: student.profile?.depr ? deprCoverage(student.plan, done) : [],
    }
  }, [student, progress, doneKeysByStudent])

  if (!student) {
    return (
      <>
        <PageHeader eyebrow="Evidencia del aprendizaje" title="Portafolio" />
        <EmptyState title="El portafolio se llena solo" text="Cada lección, práctica y examen completado aparece aquí, junto con las fotos y notas que subas. Empieza creando el plan." actionLabel="Comenzar con Lecturina" onAction={onAdd} />
      </>
    )
  }

  const evidence = evidenceStore[student.id] || []
  const saveEvidence = item => { setEvidenceStore(s => ({ ...s, [student.id]: [item, ...(s[student.id] || [])] })); setAdding(false) }
  const removeEvidence = id => setEvidenceStore(s => ({ ...s, [student.id]: (s[student.id] || []).filter(e => e.id !== id) }))
  const stats = [
    { icon: BookOpenCheck, label: 'Lecciones completadas', value: view.stats.lessons, tone: 'bg-[#e6f6ef] text-[#2b7a5f]' },
    { icon: Award, label: 'Exámenes tomados', value: view.stats.exams, tone: 'bg-[#f3e8f7] text-[#7e3a8e]' },
    { icon: Clock3, label: 'Horas de estudio', value: view.stats.hours, tone: 'bg-[#fff1e3] text-[#b45a14]' },
    { icon: Camera, label: 'Evidencias', value: evidence.length, tone: 'bg-[#e9edfc] text-[#3449b8]' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Evidencia del aprendizaje"
        title={`Portafolio de ${student.name}`}
        subtitle={`${gradeLabel(student.level)} · Todo lo completado en Genial Skills, más tus fotos y notas.`}
        actions={(
          <>
            <Button onClick={() => setAdding(true)}><ImagePlus className="h-4 w-4" /> Subir evidencia</Button>
            <Button variant="primary" onClick={() => printReport({ student, stats: view.stats, bySubject: view.bySubject, coverage: view.coverage, completed: view.completed, evidence, parentName })}><FileDown className="h-4 w-4" /> Reporte de progreso</Button>
          </>
        )}
      />
      <StudentTabs students={students} activeId={student.id} onChange={setStudentId} />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, tone }) => (
          <Panel key={label} className="flex items-center gap-4 p-5">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-6 w-6" /></span>
            <div>
              <p className="font-display text-3xl font-semibold text-navy">{value}</p>
              <p className="text-xs font-bold text-slate-500">{label}</p>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Panel className="p-6">
            <PanelTitle>Progreso por materia</PanelTitle>
            <div className="space-y-5">
              {view.bySubject.map(s => (
                <div key={s.key} className="flex items-center gap-4">
                  <SubjectIcon subject={s.key} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap justify-between gap-2">
                      <span className="font-bold text-navy">{s.name}</span>
                      <span className="text-xs text-slate-500">{s.done}/{s.total} lecciones · {s.practices} {s.practices === 1 ? 'práctica' : 'prácticas'} · {s.exams} {s.exams === 1 ? 'examen' : 'exámenes'}</span>
                    </div>
                    <ProgressBar value={s.total ? s.done / s.total : 0} color={subjectMeta(s.key).color} className="h-2.5" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {student.profile?.depr && <DeprPanel plan={student.plan} doneKeys={view.done} gradeName={gradeLabel(student.level)} />}

          <Panel className="p-6">
            <PanelTitle action={<Button size="sm" onClick={() => setAdding(true)}><ImagePlus className="h-4 w-4" /> Subir</Button>}>Evidencias y proyectos</PanelTitle>
            {evidence.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {evidence.map(e => (
                  <article key={e.id} className="group overflow-hidden rounded-3xl border border-sand">
                    <div className="relative h-36" style={{ backgroundColor: subjectMeta(e.subject).soft }}>
                      {e.image ? <img src={e.image} alt={e.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><SubjectIcon subject={e.subject} size={54} /></div>}
                      <button type="button" onClick={() => window.confirm('¿Eliminar esta evidencia?') && removeEvidence(e.id)} className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600" aria-label={`Eliminar ${e.title}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] font-extrabold tracking-wide uppercase" style={{ color: subjectMeta(e.subject).color }}>{subjectMeta(e.subject).name}</p>
                      <h3 className="font-bold text-navy">{e.title}</h3>
                      {e.note && <p className="mt-1 line-clamp-3 text-sm text-slate-500">{e.note}</p>}
                      <p className="mt-2 text-xs text-slate-400">{new Date(e.date).toLocaleDateString('es-PR')}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <button type="button" onClick={() => setAdding(true)} className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-sand py-10 text-slate-500 hover:border-gold hover:text-navy">
                <Camera className="h-7 w-7" />
                <span className="font-bold">Sube fotos de proyectos, cuadernos o experimentos</span>
                <span className="text-sm">Aparecerán en el reporte de progreso.</span>
              </button>
            )}
          </Panel>
        </div>

        <Panel className="h-fit p-6">
          <PanelTitle>Trabajo completado</PanelTitle>
          {view.completed.length ? (
            <ol className="relative space-y-4 border-l-2 border-sand pl-5">
              {view.completed.slice(0, 25).map(c => (
                <li key={`${c.session.id}-${c.at}`} className="relative">
                  <span className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full ring-4 ring-white" style={{ backgroundColor: subjectMeta(c.session.subjectKey).color }} />
                  <p className="text-xs text-slate-400 first-letter:uppercase">{fmtDay(c.at)}</p>
                  <p className="font-bold text-navy">{c.session.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><span>{subjectMeta(c.session.subjectKey).name}</span><KindBadge kind={c.session.kind} /></div>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-slate-500">Cuando {student.name} complete lecciones, prácticas o exámenes, aparecerán aquí con su fecha.</p>}
        </Panel>
      </div>

      {adding && <EvidenceForm student={student} onSave={saveEvidence} onClose={() => setAdding(false)} />}
    </>
  )
}
