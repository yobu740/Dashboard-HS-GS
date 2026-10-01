// POST /api/chat { messages, profile, planExists } → Lecturina's next turn + updated profile.
import { chatTurn } from '../server/chat.js'
import { readJson, sendJson, sendError } from '../server/http.js'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
  try {
    sendJson(res, 200, await chatTurn(await readJson(req)))
  } catch (err) {
    sendError(res, err)
  }
}
