// GET /api/catalog?level=3&subject=math&language=es → published Athenas lessons.
import { lessonsForSubject, athenasMode } from '../server/athenas.js'
import { SUBJECTS } from '../shared/subjects.js'
import { lessonExpectations } from '../server/depr.js'
import { queryOf, sendJson, sendError } from '../server/http.js'

export default async function handler(req, res) {
  try {
    const q = queryOf(req)
    const level = q.get('level')
    const subject = q.get('subject')
    if (!level || !SUBJECTS[subject]) return sendJson(res, 400, { error: 'level y subject son requeridos' })
    const result = await lessonsForSubject(subject, level, q.get('language') || 'es')
    // DEPR expectations each lesson works, for the grade requested.
    const lessons = result.lessons.map(l => ({ ...l, standards: lessonExpectations(l.id, level) }))
    sendJson(res, 200, { ...result, lessons, mode: athenasMode() }, { 'Cache-Control': 'public, max-age=300' })
  } catch (err) {
    sendError(res, err)
  }
}
