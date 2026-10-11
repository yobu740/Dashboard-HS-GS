// Tiny helpers so the same handlers run as Vercel functions (api/*.js) and
// inside the Vite dev server (see vite.config.js).

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {}
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf8')
  return text ? JSON.parse(text) : {}
}

export function sendJson(res, status, data, headers = {}) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
  res.end(JSON.stringify(data))
}

export function queryOf(req) {
  return new URL(req.url, 'http://localhost').searchParams
}

export function sendError(res, err) {
  const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 500
  sendJson(res, status, { error: err?.message || String(err) })
}
