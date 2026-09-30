// GET /api/lesson?id=931 → lesson detail (objectives, standards, description).
import { fetchLessonDetail } from '../server/athenas.js'
import { queryOf, sendJson, sendError } from '../server/http.js'

export default async function handler(req, res) {
  try {
    const id = queryOf(req).get('id')
    if (!id || !/^\d+$/.test(id)) return sendJson(res, 400, { error: 'id inválido' })
    sendJson(res, 200, await fetchLessonDetail(id), { 'Cache-Control': 'public, max-age=300' })
  } catch (err) {
    sendError(res, err)
  }
}
