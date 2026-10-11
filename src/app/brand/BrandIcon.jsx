// Official Genial Skills artwork rendered inline (preserves gradients and
// strokes). Subject icons come from the Genial Skills lesson app; navigation
// icons from this dashboard and the student navigation rail.
import { SUBJECT_SVGS, NAV_SVGS } from './icons.js'
import { SUBJECTS } from '../../../shared/subjects.js'

// Provisional icons (same flat white/cream style) until the official
// Calendario and Comunidad artwork is available.
const PROVISIONAL = {
  calendar: `<svg viewBox="0 0 80 69" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="12" width="48" height="46" rx="7" fill="#FFFFFF"/><rect x="16" y="12" width="48" height="13" rx="7" fill="#D99289"/><rect x="16" y="19" width="48" height="6" fill="#D99289"/><rect x="26" y="7" width="5" height="11" rx="2.5" fill="#E6EEF0"/><rect x="49" y="7" width="5" height="11" rx="2.5" fill="#E6EEF0"/><g fill="#E6EEF0"><rect x="23" y="31" width="8" height="7" rx="2"/><rect x="36" y="31" width="8" height="7" rx="2"/><rect x="49" y="31" width="8" height="7" rx="2"/><rect x="23" y="43" width="8" height="7" rx="2"/><rect x="49" y="43" width="8" height="7" rx="2"/></g><rect x="36" y="43" width="8" height="7" rx="2" fill="#7DD577"/></svg>`,
  community: `<svg viewBox="0 0 80 69" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="22" r="10" fill="#FFFFFF"/><path d="M24 52c0-9 7-15 16-15s16 6 16 15v3H24z" fill="#FFFFFF"/><circle cx="18" cy="28" r="7" fill="#E6EEF0"/><path d="M6 54c0-7 5-12 12-12 3 0 5.6 1 7.5 2.6C22.4 47.4 20.6 51 20.6 55H6z" fill="#E6EEF0"/><circle cx="62" cy="28" r="7" fill="#D99289"/><path d="M74 54c0-7-5-12-12-12-3 0-5.6 1-7.5 2.6 3.1 2.8 4.9 6.4 4.9 10.4H74z" fill="#D99289"/></svg>`,
}

const SUBJECT_ICON_KEY = { math: 'mat-sp', spanish: 'esp', english: 'ing', science: 'cie', social: 'soc', health: 'sal' }

const dataUri = svg => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'))}`

// Rendered as images: isolates each SVG's ids and any <style>/<text> it carries.
function Svg({ svg, size, className = '', label }) {
  return <img src={dataUri(svg)} alt={label || ''} aria-hidden={label ? undefined : true} className={`shrink-0 object-contain ${className}`} style={{ width: size, height: size }} />
}

/** Subject artwork by our subject key (math, spanish, …). */
export function SubjectIcon({ subject, size = 40, className, label }) {
  const svg = SUBJECT_SVGS[SUBJECT_ICON_KEY[subject]]
  if (!svg) return <span className={`inline-block shrink-0 rounded-full ${className || ''}`} style={{ width: size, height: size, backgroundColor: SUBJECTS[subject]?.color || '#ccc' }} />
  return <Svg svg={svg} size={size * 1.26} className={className} label={label} />
}

/** Navigation artwork: home, students, planning, calendar, catalog, progress, teams, community. */
export function NavIcon({ name, size = 30, className }) {
  const svg = NAV_SVGS[name] || PROVISIONAL[name]
  if (!svg) return null
  return (
    <img src={dataUri(svg)} alt="" aria-hidden="true" className={`shrink-0 object-contain ${className || ''}`} style={{ width: size, height: size }} />
  )
}
