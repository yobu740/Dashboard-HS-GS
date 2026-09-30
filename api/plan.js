// POST /api/plan  { profile } → AI study plan with real Athenas lessons + calendar.
import { generatePlan } from '../server/planner.js'
import { readJson, sendJson, sendError } from '../server/http.js'

export const config = { maxDuration: 300 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
  try {
    const { profile } = await readJson(req)
    sendJson(res, 200, await generatePlan(profile))
  } catch (err) {
    sendError(res, err)
  }
}
