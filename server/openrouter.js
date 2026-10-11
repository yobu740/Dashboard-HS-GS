// OpenRouter chat-completions call with JSON-schema structured output.
// Same provider as Genial Skills Maestro; model via OPENROUTER_MODEL.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export const MODEL = () => process.env.OPENROUTER_MODEL || 'openai/gpt-4o'

export async function callOpenRouter({ messages, schema, schemaName, maxTokens = 4000, temperature = 0.4 }) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    const err = new Error('No hay OPENROUTER_API_KEY configurada.')
    err.noCredentials = true
    throw err
  }
  const r = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'Genial Skills Homeschool' },
    body: JSON.stringify({
      model: MODEL(),
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_schema', json_schema: { name: schemaName, strict: true, schema } },
      messages,
    }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(`OpenRouter ${r.status}: ${data?.error?.message || 'error'}`)
    err.noCredentials = r.status === 401
    throw err
  }
  const choice = data.choices?.[0]
  if (choice?.finish_reason === 'length') throw new Error('La respuesta del modelo quedó incompleta.')
  // Some models wrap JSON in a code fence even with response_format set.
  const text = String(choice?.message?.content || '').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  return { json: JSON.parse(text), model: data.model || MODEL() }
}
