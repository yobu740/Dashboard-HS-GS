// Small presentational primitives shared by onboarding and dashboard.
import { Check } from 'lucide-react'

export function Chip({ selected, onClick, children, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        selected
          ? 'border-transparent text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
      style={selected ? { backgroundColor: color || '#334155' } : undefined}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}

export function OptionCard({ selected, onClick, title, description, icon, color = '#c0a267' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex w-full items-start gap-3 rounded-xl border-2 bg-white p-4 text-left transition-all ${
        selected ? 'shadow-md' : 'border-slate-200 hover:border-slate-300'
      }`}
      style={selected ? { borderColor: color, backgroundColor: `${color}0d` } : undefined}
    >
      {icon && <span className="text-2xl leading-none">{icon}</span>}
      <span className="flex-1">
        <span className="block font-semibold text-slate-900">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-slate-600">{description}</span>}
      </span>
      {selected && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#c0a267] focus:outline-none focus:ring-2 focus:ring-[#c0a267]/30'

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

export function SubjectDot({ color, className = 'h-2.5 w-2.5' }) {
  return <span className={`inline-block shrink-0 rounded-full ${className}`} style={{ backgroundColor: color }} />
}

export function ProgressRing({ value, size = 64, stroke = 7, color = '#c0a267', label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value || 0))
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${pct * c} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
        {label ?? `${Math.round(pct * 100)}%`}
      </span>
    </div>
  )
}
