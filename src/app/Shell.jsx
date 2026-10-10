// App frame: navy top bar (logo, help, user) and the gold navigation rail
// with the official Genial Skills artwork. On small screens the rail becomes
// a slide-in drawer.
import { useEffect, useState } from 'react'
import { HelpCircle, LifeBuoy, Mail, Menu, MessageCircle, X } from 'lucide-react'
import logo from '../assets/logo.svg'
import { NavIcon } from './brand/BrandIcon.jsx'

export const NAV = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'estudiantes', label: 'Estudiantes', icon: 'students' },
  { id: 'planificacion', label: 'Planificación', icon: 'planning' },
  { id: 'calendario', label: 'Calendario', icon: 'calendar' },
  { id: 'catalogo', label: 'Catálogo', icon: 'catalog' },
  { id: 'portafolio', label: 'Portafolio', icon: 'progress' },
  { id: 'tutoria', label: 'Tutoría', icon: 'teams' },
  { id: 'comunidad', label: 'Comunidad', icon: 'community' },
]

function NavList({ active, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1.5 p-3" aria-label="Secciones">
      {NAV.map(item => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 transition-all duration-200 ${
              isActive ? 'bg-gold-dark/90 shadow-[inset_0_2px_6px_rgba(0,0,0,0.18)]' : 'hover:bg-white/15'
            }`}
          >
            {isActive && <span className="absolute top-1/2 -left-3 h-8 w-1.5 -translate-y-1/2 rounded-r-full bg-white" />}
            <NavIcon name={item.icon} size={38} className="transition-transform duration-200 group-hover:scale-110" />
            <span className="text-[11px] leading-tight font-extrabold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function HelpMenu({ onClose }) {
  const items = [
    { icon: MessageCircle, title: 'Chat con soporte', text: 'Lunes a viernes, 8:00 a. m. a 6:00 p. m.' },
    { icon: LifeBuoy, title: 'Centro de ayuda', text: 'Guías para usar Genial Skills Homeschool' },
    { icon: Mail, title: 'Escribir a soporte', text: 'Respuesta en menos de 24 horas' },
  ]
  return (
    <div className="absolute top-14 right-0 z-50 w-80 rounded-3xl border border-sand bg-white p-3 text-ink shadow-2xl" role="menu">
      <p className="px-3 pt-1 pb-2 font-display text-base font-semibold text-navy">¿En qué te ayudamos?</p>
      {items.map(({ icon: Icon, title, text }) => (
        <button key={title} type="button" onClick={onClose} className="flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-cream" role="menuitem">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-light text-gold-dark"><Icon className="h-4.5 w-4.5" /></span>
          <span>
            <span className="block text-sm font-bold text-navy">{title}</span>
            <span className="block text-xs text-slate-500">{text}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export default function Shell({ active, onNavigate, parentName = 'Brian', children }) {
  const [drawer, setDrawer] = useState(false)
  const [help, setHelp] = useState(false)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setDrawer(false); setHelp(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = id => { setDrawer(false); onNavigate(id) }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 bg-navy px-4 text-white shadow-[0_4px_20px_-8px_rgba(0,0,0,0.4)] sm:px-6">
        <button type="button" onClick={() => setDrawer(true)} className="rounded-xl p-2 hover:bg-white/10 lg:hidden" aria-label="Abrir menú"><Menu className="h-6 w-6" /></button>
        <img src={logo} alt="Genial Skills" className="h-8" />
        <span className="ml-1 hidden rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-white/80 sm:inline">Homeschool</span>
        <div className="relative ml-auto flex items-center gap-2">
          <button type="button" onClick={() => setHelp(h => !h)} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-white/90 ring-1 ring-white/25 transition-colors hover:bg-white/10" aria-expanded={help}>
            <HelpCircle className="h-4.5 w-4.5" /> <span className="hidden sm:inline">Ayuda</span>
          </button>
          {help && <HelpMenu onClose={() => setHelp(false)} />}
          <div className="ml-1 flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 sm:pr-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-display font-semibold">{parentName.charAt(0)}</span>
            <span className="hidden text-sm font-bold sm:inline">{parentName}</span>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[108px] shrink-0 overflow-y-auto bg-gradient-to-b from-[#c8aa6f] to-[#b8975a] lg:block">
          <NavList active={active} onNavigate={go} />
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
            <button type="button" className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={() => setDrawer(false)} aria-label="Cerrar menú" />
            <aside className="absolute inset-y-0 left-0 w-[132px] overflow-y-auto bg-gradient-to-b from-[#c8aa6f] to-[#b8975a] pt-3 shadow-2xl animate-in slide-in-from-left duration-200">
              <button type="button" onClick={() => setDrawer(false)} className="mx-auto mb-1 flex rounded-full p-2 text-white hover:bg-white/15" aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
              <NavList active={active} onNavigate={go} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-9">
          <div className="mx-auto max-w-[1360px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
