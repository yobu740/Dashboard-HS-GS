// Comunidad — homeschool families in Puerto Rico: forum, groups, events and
// resources. Sample content; posts, joins and RSVPs are kept locally until the
// community service exists. Support lives in the header "Ayuda" menu.
import { useState } from 'react'
import { CalendarDays, Download, FileText, MapPin, MessageSquare, PenLine, PlayCircle, Users, X } from 'lucide-react'
import { newId, useLocalState } from '../store.js'
import { SubjectIcon } from '../brand/BrandIcon.jsx'
import { Button, PageHeader, Panel, Segmented } from '../ui.jsx'

const CATEGORIES = ['Todos', 'Matemáticas', 'Lectura y escritura', 'Ciencias', 'Organización', 'Legal y DEPR', 'Primeros pasos']

const SEED_POSTS = [
  { id: 'p1', author: 'Mariela R.', town: 'Bayamón', category: 'Matemáticas', title: '¿Cómo enseñan las fracciones en 3er grado?', body: 'Mi hija entiende mejor con objetos. Estamos usando pizzas de cartón y la lección de Genial Skills de fracciones equivalentes. ¿Qué otras ideas les han funcionado?', replies: 14, ago: 'hace 2 horas', color: '#3fae82' },
  { id: 'p2', author: 'José L.', town: 'Ponce', category: 'Legal y DEPR', title: 'Requisitos para homeschool en Puerto Rico: lo que aprendí', body: 'Resumí lo que necesitamos documentar y cómo usamos el portafolio para llevar evidencia del progreso.', replies: 31, ago: 'ayer', color: '#4662e5' },
  { id: 'p3', author: 'Carmen D.', town: 'Caguas', category: 'Organización', title: 'Nuestra rutina de 3 horas con dos hijos de distinto grado', body: 'Alternamos: mientras uno practica, el otro aprende con el tutor IA. Les comparto el horario.', replies: 22, ago: 'hace 3 días', color: '#a34787' },
  { id: 'p4', author: 'Ana P.', town: 'Mayagüez', category: 'Lectura y escritura', title: 'Libros cortos para niños que se distraen con textos largos', body: 'Lista de cuentos de 2 a 5 páginas que le funcionaron a mi hijo de 4to grado.', replies: 9, ago: 'hace 4 días', color: '#d96464' },
  { id: 'p5', author: 'Luis M.', town: 'Carolina', category: 'Primeros pasos', title: 'Primera semana de homeschool: ¿es normal sentirse abrumado?', body: 'Salimos de la escuela tradicional a mitad de año. Cualquier consejo es bienvenido.', replies: 40, ago: 'hace 1 semana', color: '#c48a45' },
]
const GROUPS = [
  { id: 'g1', name: 'Homeschool Área Metro', members: 412, text: 'Encuentros mensuales en San Juan, Guaynabo y Bayamón.', icon: MapPin },
  { id: 'g2', name: 'Familias bilingües', members: 238, text: 'Recursos y prácticas para criar y educar en español e inglés.', icon: MessageSquare },
  { id: 'g3', name: 'Refuerzo de Matemáticas', members: 305, text: 'Padres de niños en escuela que refuerzan matemáticas en casa.', icon: Users },
  { id: 'g4', name: 'Homeschool Sur', members: 167, text: 'Ponce, Juana Díaz, Coamo y pueblos vecinos.', icon: MapPin },
  { id: 'g5', name: 'Ciencias en casa', members: 289, text: 'Experimentos sencillos con materiales de la casa.', icon: Users },
  { id: 'g6', name: 'Necesidades especiales', members: 143, text: 'Apoyo para familias con niños con diagnósticos de aprendizaje.', icon: MessageSquare },
]
const EVENTS = [
  { id: 'e1', day: 18, month: 'oct', title: 'Taller de ciencias: el ciclo del agua', place: 'Parque de las Ciencias, Bayamón', kind: 'Presencial', subject: 'science' },
  { id: 'e2', day: 23, month: 'oct', title: 'Cómo documentar el progreso para el DEPR', place: 'Videoconferencia', kind: 'Virtual', subject: 'social' },
  { id: 'e3', day: 2, month: 'nov', title: 'Excursión al Viejo San Juan: historia de Puerto Rico', place: 'Plaza de Armas, San Juan', kind: 'Presencial', subject: 'social' },
  { id: 'e4', day: 9, month: 'nov', title: 'Club de lectura en familia', place: 'Videoconferencia', kind: 'Virtual', subject: 'spanish' },
]
const RESOURCES = [
  { id: 'r1', title: 'Guía para empezar el homeschool en Puerto Rico', type: 'PDF', icon: FileText },
  { id: 'r2', title: 'Cómo usar el portafolio como evidencia de progreso', type: 'Video', icon: PlayCircle },
  { id: 'r3', title: 'Estrategias para enseñar a niños de distintos grados a la vez', type: 'PDF', icon: FileText },
  { id: 'r4', title: 'Motivación: rutinas cortas y celebrar logros', type: 'Video', icon: PlayCircle },
  { id: 'r5', title: 'Estándares de Contenido y Expectativas de Grado (DEPR)', type: 'Enlace', icon: FileText },
]

function Composer({ onPost, onClose }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState(CATEGORIES[1])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); onPost({ title: title.trim(), body: body.trim(), category }) }}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-navy">Nueva publicación</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-cream" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Sobre qué quieres conversar?" className="h-11 w-full rounded-2xl border border-sand px-4 focus:border-gold focus:outline-none" />
        <textarea required value={body} onChange={e => setBody(e.target.value)} placeholder="Cuéntale a la comunidad…" className="mt-3 min-h-32 w-full rounded-2xl border border-sand px-4 py-3 focus:border-gold focus:outline-none" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.slice(1).map(c => <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full border px-3 py-1 text-xs font-bold ${category === c ? 'border-navy bg-navy text-white' : 'border-sand text-navy'}`}>{c}</button>)}
        </div>
        <Button type="submit" variant="primary" className="mt-6 w-full" disabled={!title.trim() || !body.trim()}>Publicar</Button>
      </form>
    </div>
  )
}

export default function Community({ parentName = 'Brian' }) {
  const [tab, setTab] = useState('foro')
  const [category, setCategory] = useState('Todos')
  const [composing, setComposing] = useState(false)
  const [state, setState] = useLocalState('gs_community_v1', { posts: [], groups: [], events: [] })

  const posts = [...state.posts, ...SEED_POSTS].filter(p => category === 'Todos' || p.category === category)
  const toggle = (key, id) => setState(s => ({ ...s, [key]: s[key].includes(id) ? s[key].filter(x => x !== id) : [...s[key], id] }))

  return (
    <>
      <PageHeader
        eyebrow="Familias homeschool de Puerto Rico"
        title="Comunidad"
        subtitle="Comparte ideas, encuentra grupos cerca de ti y participa en talleres y excursiones."
        actions={<Button variant="primary" onClick={() => setComposing(true)}><PenLine className="h-4 w-4" /> Publicar</Button>}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'foro', label: 'Foro' }, { value: 'grupos', label: 'Grupos' }, { value: 'eventos', label: 'Eventos' }, { value: 'recursos', label: 'Recursos' }]} />
        <p className="text-sm font-bold text-slate-500">1,247 familias · 89 conversaciones hoy</p>
      </div>

      {tab === 'foro' && (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Panel className="h-fit p-3">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={`flex w-full rounded-2xl px-4 py-2.5 text-left text-sm font-bold transition-colors ${category === c ? 'bg-navy text-white' : 'text-navy hover:bg-cream'}`}>{c}</button>
            ))}
          </Panel>
          <div className="space-y-4">
            <button type="button" onClick={() => setComposing(true)} className="flex w-full items-center gap-3 rounded-[26px] border border-sand bg-white p-4 text-left text-slate-400 transition-colors hover:border-gold">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-display font-semibold text-white">{parentName.charAt(0)}</span>
              ¿Qué quieres compartir con otras familias?
            </button>
            {posts.map(p => (
              <Panel key={p.id} as="article" className="p-6 transition-shadow hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full font-display font-semibold text-white" style={{ backgroundColor: p.color || '#f47d45' }}>{p.author.charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-navy">{p.author} <span className="font-normal text-slate-400">· {p.town} · {p.ago}</span></p>
                  </div>
                  <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-extrabold text-slate-600">{p.category}</span>
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-navy">{p.title}</h3>
                <p className="mt-1.5 text-slate-600">{p.body}</p>
                <p className="mt-4 flex items-center gap-1.5 text-sm font-bold text-slate-500"><MessageSquare className="h-4 w-4" /> {p.replies} respuestas</p>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {tab === 'grupos' && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {GROUPS.map(({ id, name, members, text, icon: Icon }) => {
            const joined = state.groups.includes(id)
            return (
              <Panel key={id} className="flex flex-col p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-light text-gold-dark"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-4 font-display text-xl font-semibold text-navy">{name}</h3>
                <p className="mt-1 text-sm text-slate-500">{text}</p>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="text-sm font-bold text-slate-500">{members + (joined ? 1 : 0)} familias</span>
                  <Button size="sm" variant={joined ? 'secondary' : 'dark'} onClick={() => toggle('groups', id)}>{joined ? 'Eres miembro' : 'Unirme'}</Button>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      {tab === 'eventos' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {EVENTS.map(e => {
            const going = state.events.includes(e.id)
            return (
              <Panel key={e.id} className="flex items-center gap-5 p-5">
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-3xl bg-navy text-white">
                  <span className="font-display text-3xl leading-none font-semibold">{e.day}</span>
                  <span className="text-xs font-extrabold tracking-wide text-gold uppercase">{e.month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><SubjectIcon subject={e.subject} size={20} /><span className="text-[11px] font-extrabold tracking-wide text-slate-400 uppercase">{e.kind}</span></div>
                  <h3 className="mt-1 font-display text-lg leading-snug font-semibold text-navy">{e.title}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {e.place}</p>
                </div>
                <Button size="sm" variant={going ? 'secondary' : 'primary'} onClick={() => toggle('events', e.id)} className="shrink-0">{going ? 'Asistiré' : 'Me interesa'}</Button>
              </Panel>
            )
          })}
          <Panel className="flex items-center gap-4 border-dashed bg-white/60 p-5 lg:col-span-2">
            <CalendarDays className="h-6 w-6 text-gold-dark" />
            <p className="text-sm text-slate-500">¿Organizas un taller o una excursión para familias homeschool? Publícalo en el foro con la categoría Organización.</p>
          </Panel>
        </div>
      )}

      {tab === 'recursos' && (
        <Panel className="divide-y divide-sand">
          {RESOURCES.map(({ id, title, type, icon: Icon }) => (
            <div key={id} className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e9edfc] text-[#3449b8]"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-navy">{title}</p>
                <p className="text-xs font-bold text-slate-400">{type}</p>
              </div>
              <Button size="sm"><Download className="h-4 w-4" /> Abrir</Button>
            </div>
          ))}
        </Panel>
      )}

      {composing && (
        <Composer
          onClose={() => setComposing(false)}
          onPost={p => {
            setState(s => ({ ...s, posts: [{ id: newId(), author: parentName, town: 'Tu publicación', ago: 'ahora', replies: 0, color: '#f47d45', ...p }, ...s.posts] }))
            setComposing(false)
            setTab('foro')
            setCategory('Todos')
          }}
        />
      )}
    </>
  )
}
