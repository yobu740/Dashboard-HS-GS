// DEPR curriculum coverage for a plan, computed in the browser from the grade
// expectations the server ships with each plan (plan.alignment) and the DEPR
// codes attached to each lesson (lesson.standards).
//
//   planned   → some lesson in the plan works this expectation
//   completed → a lesson that works it has its exam done

export function deprCoverage(plan, doneKeys) {
  const out = []
  for (const subject of plan.subjects) {
    const grade = plan.alignment?.[subject.key]
    if (!grade) continue
    const lessonsBy = new Map()
    for (const lesson of subject.lessons) {
      for (const code of lesson.standards || []) {
        if (!lessonsBy.has(code)) lessonsBy.set(code, [])
        lessonsBy.get(code).push(lesson)
      }
    }
    const isDone = l => !!doneKeys?.has(`lesson:${l.id}:exam`)
    const expectations = grade.expectations.map(e => {
      const lessons = lessonsBy.get(e.code) || []
      return { ...e, lessons, planned: lessons.length > 0, completed: lessons.some(isDone) }
    })
    const domains = Object.entries(grade.domains).map(([domain, name]) => {
      const list = expectations.filter(e => e.domain === domain)
      return {
        domain,
        name,
        total: list.length,
        planned: list.filter(e => e.planned).length,
        completed: list.filter(e => e.completed).length,
        expectations: list,
      }
    }).filter(d => d.total)
    out.push({
      key: subject.key,
      name: subject.name,
      color: subject.color,
      emoji: subject.emoji,
      source: grade.source,
      total: expectations.length,
      planned: expectations.filter(e => e.planned).length,
      completed: expectations.filter(e => e.completed).length,
      domains,
    })
  }
  return out
}
