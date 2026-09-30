async function request(url, options) {
  const r = await fetch(url, options)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(data.error || `Error ${r.status}`)
    err.status = r.status
    throw err
  }
  return data
}

export function generatePlan(profile) {
  return request('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  })
}

export function fetchCatalog({ level, subject, language }) {
  const q = new URLSearchParams({ level, subject, language: language || 'es' })
  return request(`/api/catalog?${q}`)
}

export function fetchLesson(id) {
  return request(`/api/lesson?id=${encodeURIComponent(id)}`)
}

// Genial Skills lesson viewer (genial-skills-redesign on Vercel). In live mode
// it assembles any Athenas lesson by id through its own /api/lesson proxy.
const VIEWER_URL = import.meta.env.VITE_LESSON_VIEWER_URL || 'https://genial-skills-redesign.vercel.app/'
export const VIEWER_ORIGIN = new URL(VIEWER_URL).origin

const ENGLISH_CODES = new Set(['en', 'mat-en', 'sci-en', 'bi-en', 'che-en', 'phy-en', 'pc-en'])

export function lessonUrl(id, subjectCode) {
  const url = new URL(VIEWER_URL)
  url.searchParams.set('lesson', id)
  url.searchParams.set('live', '1')
  // Host mode: viewer hides its own chrome and reports progress via postMessage.
  url.searchParams.set('host', '1')
  url.searchParams.set('lang', ENGLISH_CODES.has(subjectCode) ? 'en' : 'es')
  return url.toString()
}
