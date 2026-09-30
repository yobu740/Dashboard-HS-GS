// Subject catalogue shared by the server (Athenas lookups, planner) and the UI.
//
// Athenas identifies a subject by a code and a grade by a level code
// ("k", "1" … "12"). One homeschool subject can map to several codes depending
// on grade and instruction language, e.g. high-school science is split into
// Biology (10), Chemistry (11) and Physics (12).

export const SUBJECTS = {
  math: {
    key: 'math',
    name: 'Matemáticas',
    color: '#16a34a',
    emoji: '➗',
  },
  spanish: {
    key: 'spanish',
    name: 'Español',
    color: '#dc2626',
    emoji: '📖',
  },
  english: {
    key: 'english',
    name: 'Inglés',
    color: '#2563eb',
    emoji: '🗣️',
  },
  science: {
    key: 'science',
    name: 'Ciencias',
    color: '#7c3aed',
    emoji: '🔬',
  },
  social: {
    key: 'social',
    name: 'Estudios Sociales',
    color: '#ea580c',
    emoji: '🌎',
  },
}

export const SUBJECT_KEYS = Object.keys(SUBJECTS)

export const GRADES = ['k', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export function gradeLabel(level) {
  if (level === 'k') return 'Kindergarten'
  const n = Number(level)
  const suffix = { 1: 'ro', 2: 'do', 3: 'ro', 4: 'to', 5: 'to', 6: 'to', 7: 'mo', 8: 'vo', 9: 'no', 10: 'mo', 11: 'mo', 12: 'mo' }[n] || ''
  return `${n}${suffix} grado`
}

export function shiftGrade(level, delta) {
  const i = GRADES.indexOf(level)
  if (i < 0) return null
  const j = i + delta
  return j >= 0 && j < GRADES.length ? GRADES[j] : null
}

/**
 * Ordered Athenas subject codes to try for a subject at a grade.
 * `language` is 'es' | 'en' | 'bi' (bilingual). The first codes that return
 * published lessons win; later ones are fallbacks.
 */
export function codesFor(subjectKey, level, language = 'es') {
  const n = level === 'k' ? 0 : Number(level)
  const prefersEnglish = language === 'en'
  const bilingual = language === 'bi'

  switch (subjectKey) {
    case 'math': {
      if (n >= 10) return ['geo-sp', 'a1-sp']
      if (n >= 8) return ['a1-sp', 'mat-sp']
      if (prefersEnglish) return ['mat-en', 'mat-sp']
      if (bilingual) return ['mat-sp', 'mat-en']
      return ['mat-sp', 'mat-en']
    }
    case 'spanish':
      return ['sp']
    case 'english':
      return ['en']
    case 'science': {
      if (n === 10) return ['bi-sp', 'sci-sp']
      if (n === 11) return ['qu-sp', 'sci-sp']
      if (n === 12) return ['fi-sp', 'sci-sp']
      if (n === 9) return ['sci-sp', 'bi-sp']
      return prefersEnglish ? ['sci-en', 'sci-sp'] : ['sci-sp', 'sci-en']
    }
    case 'social':
      return ['sci-so']
    default:
      return []
  }
}
