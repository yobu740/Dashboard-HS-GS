// Turns a plan's per-subject lesson queues into dated calendar sessions.
//
// The AI decides *what* to study (which Athenas lessons, in what order, how
// many sessions a week per subject). This module decides *when*: it is pure
// date math, so it runs the same on the server and in the browser, and the UI
// can re-run it after the family edits the plan.

export const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s) {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function addMinutes(hhmm, minutes) {
  const [h, m] = String(hhmm || '09:00').split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function slotsPerDay(settings) {
  const lesson = Math.max(15, Number(settings.minutesPerLesson) || 40)
  const gap = Math.max(0, Number(settings.breakMinutes) || 0)
  const day = Math.max(lesson, Number(settings.minutesPerDay) || 120)
  return Math.max(1, Math.floor((day + gap) / (lesson + gap)))
}

export function weeklyCapacity(settings) {
  return slotsPerDay(settings) * (settings.days?.length || 5)
}

/**
 * Scale requested sessions-per-week so they fit the weekly capacity. Each
 * subject keeps at least one session; extra capacity is left free rather than
 * padded, so families keep unstructured time.
 */
export function fitQuotas(subjects, capacity) {
  const requested = subjects.map(s => Math.max(1, Math.round(Number(s.sessionsPerWeek) || 1)))
  let total = requested.reduce((a, b) => a + b, 0)
  if (total <= capacity) return requested
  const quotas = requested.map(r => Math.max(1, Math.floor((r * capacity) / total)))
  total = quotas.reduce((a, b) => a + b, 0)
  // Trim from the largest quotas if rounding still overshoots.
  while (total > capacity) {
    const i = quotas.indexOf(Math.max(...quotas))
    if (quotas[i] <= 1) break
    quotas[i] -= 1
    total -= 1
  }
  return quotas
}

/**
 * @param {Array<{key, name, sessionsPerWeek, lessons: Array<{id, title}>}>} subjects
 *        In priority order; earlier subjects get earlier time slots.
 * @param {{startDate, weeks, days: number[], startTime, minutesPerDay, minutesPerLesson, breakMinutes}} settings
 *        `days` are JS weekday numbers (1 = Monday).
 * @returns sessions sorted by date/time.
 */
export function buildSchedule(subjects, settings) {
  const days = [...(settings.days?.length ? settings.days : [1, 2, 3, 4, 5])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  const perDay = slotsPerDay(settings)
  const quotas = fitQuotas(subjects, perDay * days.length)
  const lessonMinutes = Math.max(15, Number(settings.minutesPerLesson) || 40)
  const gap = Math.max(0, Number(settings.breakMinutes) || 0)
  const weeks = Math.max(1, Number(settings.weeks) || 12)

  const start = parseISODate(settings.startDate || toISODate(new Date()))
  // Week 1 begins on the Monday of the start date's week.
  const monday = new Date(start)
  monday.setDate(start.getDate() - ((start.getDay() + 6) % 7))

  const cursor = subjects.map(() => 0)
  const reviewCount = subjects.map(() => 0)
  const sessions = []

  for (let w = 0; w < weeks; w++) {
    // Spread each subject's weekly quota across days, least-loaded day first,
    // avoiding the same subject twice in one day when possible.
    const plan = days.map(() => [])
    const order = subjects.map((_, i) => i).sort((a, b) => quotas[b] - quotas[a])
    for (const si of order) {
      for (let q = 0; q < quotas[si]; q++) {
        const candidates = plan
          .map((list, di) => ({ di, load: list.length, has: list.includes(si) }))
          .filter(c => c.load < perDay)
        if (!candidates.length) break
        candidates.sort((a, b) => (a.has - b.has) || (a.load - b.load) || (a.di - b.di))
        plan[candidates[0].di].push(si)
      }
    }

    days.forEach((weekday, di) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + w * 7 + ((weekday + 6) % 7))
      if (date < start) return
      const iso = toISODate(date)
      plan[di].sort((a, b) => a - b).forEach((si, slot) => {
        const subject = subjects[si]
        const lesson = subject.lessons?.[cursor[si]]
        const time = addMinutes(settings.startTime, slot * (lessonMinutes + gap))
        if (lesson) {
          cursor[si] += 1
          sessions.push({
            id: `${iso}-${subject.key}-${lesson.id}`,
            date: iso,
            time,
            week: w + 1,
            minutes: lessonMinutes,
            subjectKey: subject.key,
            kind: 'lesson',
            lessonId: String(lesson.id),
            title: lesson.title,
            levelCode: lesson.levelCode,
          })
        } else {
          reviewCount[si] += 1
          sessions.push({
            id: `${iso}-${subject.key}-review-${reviewCount[si]}`,
            date: iso,
            time,
            week: w + 1,
            minutes: lessonMinutes,
            subjectKey: subject.key,
            kind: 'review',
            lessonId: null,
            title: `Repaso y práctica de ${subject.name}`,
          })
        }
      })
    })
  }

  sessions.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
  return { sessions, quotas, slotsPerDay: perDay }
}
