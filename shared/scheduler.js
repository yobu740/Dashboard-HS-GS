// Turns a plan's per-subject lesson queues into dated calendar sessions.
//
// The AI decides *what* to study (which Athenas lessons, in what order, how
// many sessions a week per subject). This module decides *when*. It is pure
// date math, so it runs the same on the server and in the browser, and the UI
// can re-run it after the family edits the plan.
//
// Every lesson is worked in three sessions on different days:
//   learn    → concept, vocabulary, examples
//   practice → the lesson's practice section, at least one session later
//   exam     → the lesson's exam, at least two sessions after practice
// Steps of consecutive lessons interleave (learn L2 before examining L1), so
// the exam doubles as a spaced retrieval check. On top of that, subjects with
// 4+ sessions a week get a weekly "Repaso de destrezas" (2-3 sessions: every
// other week) that revisits the practice of a lesson learned weeks earlier.

export const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const SESSION_KINDS = {
  learn: { label: 'Aprender', section: 'concept', short: 'Lección' },
  practice: { label: 'Practicar', section: 'practice', short: 'Práctica' },
  exam: { label: 'Examen', section: 'exam', short: 'Examen' },
  review: { label: 'Repaso de destrezas', section: 'practice', short: 'Repaso' },
}

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
  while (total > capacity) {
    const i = quotas.indexOf(Math.max(...quotas))
    if (quotas[i] <= 1) break
    quotas[i] -= 1
    total -= 1
  }
  return quotas
}

/** Weeks (1-based) in which a subject with this weekly quota gets a skills review. */
function hasReviewWeek(quota, week) {
  if (week < 2) return false
  if (quota >= 4) return true
  return quota >= 2 && week % 2 === 0
}

/** How many new lessons fit in a subject's sessions over the period. */
export function lessonCapacity(quota, weeks) {
  let reviews = 0
  for (let w = 1; w <= weeks; w++) if (hasReviewWeek(quota, w)) reviews += 1
  return Math.max(1, Math.floor((quota * weeks - reviews) / 3))
}

/** Calendar slots (date, time, subject index), before deciding what each one holds. */
function layoutSlots(subjects, settings, quotas, perDay) {
  const days = [...(settings.days?.length ? settings.days : [1, 2, 3, 4, 5])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  const lessonMinutes = Math.max(15, Number(settings.minutesPerLesson) || 40)
  const gap = Math.max(0, Number(settings.breakMinutes) || 0)
  const weeks = Math.max(1, Number(settings.weeks) || 12)
  const start = parseISODate(settings.startDate || toISODate(new Date()))
  const monday = new Date(start)
  monday.setDate(start.getDate() - ((start.getDay() + 6) % 7))

  const slots = []
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
      plan[di].sort((a, b) => a - b).forEach((si, slot) => {
        slots.push({ date: toISODate(date), time: addMinutes(settings.startTime, slot * (lessonMinutes + gap)), week: w + 1, si, minutes: lessonMinutes })
      })
    })
  }
  return slots
}

/**
 * Decide what each of one subject's slots holds (in chronological order).
 * Returns [{ kind, lesson }] aligned with `slots`.
 */
function sequenceSubject(lessons, slots, quota) {
  const out = []
  const state = lessons.map(() => ({ learnAt: null, practiceAt: null, examAt: null, reviews: 0 }))
  let next = 0
  const lastSlotOfWeek = new Set()
  slots.forEach((s, k) => { if (k === slots.length - 1 || slots[k + 1].week !== s.week) lastSlotOfWeek.add(k) })

  slots.forEach((slot, k) => {
    const remaining = slots.length - k
    const pendingSteps = state.reduce((n, st) => n + (st.learnAt !== null && st.practiceAt === null ? 1 : 0) + (st.learnAt !== null && st.examAt === null ? 1 : 0), 0)
    const learned = state.map((st, i) => ({ st, i })).filter(x => x.st.learnAt !== null)

    // Weekly skills review: revisit a lesson learned in an earlier week.
    if (lastSlotOfWeek.has(k) && hasReviewWeek(quota, slot.week)) {
      const older = learned.filter(x => slots[x.st.learnAt].week < slot.week && x.st.examAt !== null)
      if (older.length) {
        // Least-reviewed first, then the oldest: spaced repetition without repeats.
        older.sort((a, b) => a.st.reviews - b.st.reviews || a.st.learnAt - b.st.learnAt)
        older[0].st.reviews += 1
        out.push({ kind: 'review', lesson: lessons[older[0].i] })
        return
      }
    }

    const examDue = learned.find(x => x.st.practiceAt !== null && x.st.examAt === null && k - x.st.practiceAt >= 2)
    if (examDue) { examDue.st.examAt = k; out.push({ kind: 'exam', lesson: lessons[examDue.i] }); return }

    const practiceDue = learned.find(x => x.st.practiceAt === null && k - x.st.learnAt >= 1)
    // Start a new lesson only if there is room to also practice and examine it.
    if (next < lessons.length && remaining - pendingSteps >= 3 && !(practiceDue && k - practiceDue.st.learnAt >= 2)) {
      state[next].learnAt = k
      out.push({ kind: 'learn', lesson: lessons[next] })
      next += 1
      return
    }
    if (practiceDue) { practiceDue.st.practiceAt = k; out.push({ kind: 'practice', lesson: lessons[practiceDue.i] }); return }

    // Near the end of the period: finish outstanding steps even without the gap.
    const anyExam = learned.find(x => x.st.practiceAt !== null && x.st.examAt === null)
    if (anyExam) { anyExam.st.examAt = k; out.push({ kind: 'exam', lesson: lessons[anyExam.i] }); return }

    const review = learned.sort((a, b) => a.st.reviews - b.st.reviews || a.st.learnAt - b.st.learnAt)[0]
    if (review) { review.st.reviews += 1; out.push({ kind: 'review', lesson: lessons[review.i] }); return }
    out.push({ kind: 'review', lesson: null })
  })
  return { steps: out, scheduledLessons: next }
}

/**
 * @param {Array<{key, name, sessionsPerWeek, lessons: Array<{id, title}>}>} subjects
 *        In priority order; earlier subjects get earlier time slots.
 * @param {{startDate, weeks, days: number[], startTime, minutesPerDay, minutesPerLesson, breakMinutes}} settings
 *        `days` are JS weekday numbers (1 = Monday).
 * @returns sessions sorted by date/time, the effective weekly quotas, and how
 *          many lessons of each subject fit in the period.
 */
export function buildSchedule(subjects, settings) {
  const perDay = slotsPerDay(settings)
  const quotas = fitQuotas(subjects, perDay * (settings.days?.length || 5))
  const slots = layoutSlots(subjects, settings, quotas, perDay)
  const sessions = []
  const scheduledLessons = []

  subjects.forEach((subject, si) => {
    const mine = slots.filter(s => s.si === si)
    const { steps, scheduledLessons: count } = sequenceSubject(subject.lessons || [], mine, quotas[si])
    scheduledLessons[si] = count
    mine.forEach((slot, k) => {
      const { kind, lesson } = steps[k]
      sessions.push({
        id: `${slot.date}-${slot.time}-${subject.key}`,
        date: slot.date,
        time: slot.time,
        week: slot.week,
        minutes: slot.minutes,
        subjectKey: subject.key,
        kind,
        lessonId: lesson ? String(lesson.id) : null,
        title: lesson ? lesson.title : `Repaso y práctica de ${subject.name}`,
        levelCode: lesson?.levelCode,
      })
    })
  })

  sessions.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
  return { sessions, quotas, slotsPerDay: perDay, scheduledLessons }
}
