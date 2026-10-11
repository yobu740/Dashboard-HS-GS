// Shared visual primitives for the redesigned dashboard (brand tokens live in
// App.css: navy, gold, brand orange, cream, sand, mint; Fredoka + Nunito).
import lecturina from '../assets/lecturina.png'
import { SUBJECTS } from '../../shared/subjects.js'

export const subjectMeta = key => SUBJECTS[key] || { key, name: key, color: '#94a3b8', soft: '#f1f5f9' }

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.16em] text-gold-dark">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ className = '', children, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={`rounded-[26px] border border-sand bg-white shadow-[0_1px_2px_rgba(31,55,86,0.04),0_8px_24px_-12px_rgba(31,55,86,0.12)] ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

export function PanelTitle({ children, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-center justify-between gap-3 ${className}`}>
      <h2 className="font-display text-lg font-semibold text-navy">{children}</h2>
      {action}
    </div>
  )
}

const BTN = {
  primary: 'bg-brand text-white shadow-[0_8px_20px_-8px_rgba(244,125,69,0.8)] hover:bg-brand-dark',
  dark: 'bg-navy text-white hover:bg-navy-2',
  secondary: 'border border-sand bg-white text-navy hover:border-gold hover:bg-gold-light/40',
  ghost: 'text-navy hover:bg-sand/60',
  light: 'bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25',
}
const SIZE = { sm: 'h-9 px-3.5 text-sm', md: 'h-11 px-5 text-[15px]', lg: 'h-13 px-7 text-base' }

export function Button({ variant = 'secondary', size = 'md', className = '', children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-40 ${BTN[variant]} ${SIZE[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export function StudentAvatar({ student, size = 44, ring = false }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white ${ring ? 'ring-4 ring-white' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, ${student.color}, ${student.color}cc)` }}
      aria-hidden="true"
    >
      {student.name.charAt(0).toUpperCase()}
    </span>
  )
}

export function Ring({ value, size = 64, stroke = 7, color = '#f47d45', track = '#ebe4d6', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value || 0))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round" className="transition-[stroke-dasharray] duration-700" />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-center">{children ?? <span className="font-display text-sm font-semibold text-navy">{Math.round(pct * 100)}%</span>}</span>
    </div>
  )
}

export const KIND_STYLE = {
  learn: { label: 'Aprender', className: 'bg-[#e9edfc] text-[#3449b8]' },
  practice: { label: 'Practicar', className: 'bg-[#fff1e3] text-[#b45a14]' },
  exam: { label: 'Examen', className: 'bg-[#f3e8f7] text-[#7e3a8e]' },
  review: { label: 'Repaso', className: 'bg-[#e4f4ef] text-[#2b7a63]' },
}

export function KindBadge({ kind, className = '' }) {
  const k = KIND_STYLE[kind] || KIND_STYLE.learn
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide uppercase ${k.className} ${className}`}>{k.label}</span>
}

export function ProgressBar({ value, color = '#f47d45', className = '', track = 'bg-sand' }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full ${track} ${className}`}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, backgroundColor: color }} />
    </div>
  )
}

export function EmptyState({ title, text, actionLabel, onAction, compact = false }) {
  return (
    <Panel className={`flex flex-col items-center text-center ${compact ? 'px-6 py-10' : 'px-8 py-16'}`}>
      <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-white ring-8 ring-gold-light/40">
        <img src={lecturina} alt="" className="h-20 w-20" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-navy">{title}</h2>
      {text && <p className="mt-2 max-w-md text-slate-500">{text}</p>}
      {actionLabel && <Button variant="primary" className="mt-6" onClick={onAction}>{actionLabel}</Button>}
    </Panel>
  )
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`inline-flex rounded-full border border-sand bg-white p-1 ${className}`} role="tablist">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${value === o.value ? 'bg-navy text-white' : 'text-slate-500 hover:text-navy'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function StudentTabs({ students, activeId, onChange }) {
  if (students.length < 2) return null
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {students.map(s => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={`flex items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-sm font-bold transition-all ${s.id === activeId ? 'border-navy bg-navy text-white' : 'border-sand bg-white text-navy hover:border-gold'}`}
        >
          <StudentAvatar student={s} size={28} />
          {s.name}
        </button>
      ))}
    </div>
  )
}
