// Onboarding conversation with Lecturina, the Genial Skills mascot.
//
// Each turn the model gets the conversation, the profile gathered so far and
// the list of fields still missing (computed by shared/profile.js). It answers
// with its next message, suggested quick replies and the profile updates it
// understood. The code validates and merges those updates and decides when
// the profile is complete — the model only steers the conversation.
//
// The conversation branches on what the family says: full homeschool plan vs.
// reinforcement of specific subjects/skills, digging into difficulties,
// interests, school schedule, etc. After a plan exists, the same chat takes
// change requests ("menos ciencias", "solo martes y jueves") and flags that
// the plan must be regenerated.
//
// Without OpenRouter (or if a call fails) a scripted engine asks the missing
// fields in order, so the onboarding always works.
import { callOpenRouter } from './openrouter.js'
import { emptyProfile, mergeProfile, missingFields } from '../shared/profile.js'
import { GRADES, SUBJECT_KEYS, gradeLabel } from '../shared/subjects.js'

const nullable = schema => ({ ...schema, type: [schema.type, 'null'] })

const UPDATES_SCHEMA = {
  type: 'object',
  properties: {
    mode: { type: ['string', 'null'], enum: ['homeschool', 'refuerzo', null] },
    childName: nullable({ type: 'string' }),
    age: nullable({ type: 'integer' }),
    grade: { type: ['string', 'null'], enum: [...GRADES, null] },
    language: { type: ['string', 'null'], enum: ['es', 'en', 'bi', null] },
    subjects: {
      type: ['array', 'null'],
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', enum: SUBJECT_KEYS },
          support: { type: 'string', enum: ['refuerzo', 'al-dia', 'avanzado'] },
          skills: { type: 'string', description: 'Destrezas o temas específicos a trabajar, o cadena vacía.' },
        },
        required: ['key', 'support', 'skills'],
        additionalProperties: false,
      },
    },
    replaceSubjects: { type: 'boolean', description: 'true si la lista de materias reemplaza la anterior (p. ej. "solo matemáticas").' },
    removeSubjects: { type: ['array', 'null'], items: { type: 'string', enum: SUBJECT_KEYS } },
    interests: nullable({ type: 'array', items: { type: 'string' } }),
    learningStyles: nullable({ type: 'array', items: { type: 'string' } }),
    goals: nullable({ type: 'array', items: { type: 'string' } }),
    approach: { type: ['string', 'null'], enum: ['estructurado', 'mixto', 'flexible', null] },
    depr: nullable({ type: 'boolean' }),
    days: { type: ['array', 'null'], items: { type: 'integer' }, description: '0=domingo … 6=sábado' },
    minutesPerDay: nullable({ type: 'integer' }),
    minutesPerLesson: nullable({ type: 'integer' }),
    startTime: nullable({ type: 'string', description: 'HH:MM' }),
    startDate: nullable({ type: 'string', description: 'YYYY-MM-DD' }),
    weeks: nullable({ type: 'integer' }),
    notes: nullable({ type: 'string', description: 'Detalles útiles que no caben en otros campos (dificultades, diagnósticos, contexto).' }),
  },
  required: ['mode', 'childName', 'age', 'grade', 'language', 'subjects', 'replaceSubjects', 'removeSubjects', 'interests', 'learningStyles', 'goals', 'approach', 'depr', 'days', 'minutesPerDay', 'minutesPerLesson', 'startTime', 'startDate', 'weeks', 'notes'],
  additionalProperties: false,
}

const TURN_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'Mensaje de Lecturina para el padre o la madre.' },
    quickReplies: { type: 'array', items: { type: 'string' }, description: '0 a 6 respuestas sugeridas, cortas.' },
    multiSelect: { type: 'boolean', description: 'true si el usuario puede elegir varias respuestas sugeridas a la vez.' },
    updates: UPDATES_SCHEMA,
    regenerate: { type: 'boolean', description: 'true si ya hay un plan y el usuario pidió un cambio que requiere rehacerlo.' },
  },
  required: ['reply', 'quickReplies', 'multiSelect', 'updates', 'regenerate'],
  additionalProperties: false,
}

const FIELD_GUIDE = {
  mode: 'si educan en casa (plan completo) o buscan refuerzo en algunas materias o destrezas',
  childName: 'el nombre del niño o la niña',
  grade: 'el grado que cursa',
  subjects: 'qué materias quieren trabajar (y cómo va en cada una)',
  skills: 'qué destrezas o temas específicos le cuestan (p. ej. fracciones, comprensión lectora)',
  depr: 'si quieren seguir los estándares del Departamento de Educación (DEPR); es opcional',
  days: 'qué días de la semana pueden estudiar',
  minutesPerDay: 'cuánto tiempo al día pueden dedicar',
  weeks: 'por cuánto tiempo quieren el plan (un mes, un trimestre, un semestre, el año)',
}

const SYSTEM_PROMPT = `Eres Lecturina, la mascota robot de Genial Skills: alegre, cálida y práctica. Conversas con un padre o una madre en Puerto Rico para armar un plan de estudio para su hijo(a) con lecciones de Genial Skills.

Cómo conversar:
- Escribe en español, en frases cortas (1 a 3 oraciones). Puedes usar algún emoji, sin exagerar.
- Haz UNA pregunta a la vez (dos solo si son muy cortas y relacionadas). Nunca preguntes algo que ya está en el perfil.
- Adapta el camino a lo que te cuentan:
  · Si educan en casa (homeschool): materias del plan y cómo va en cada una, intereses o cómo aprende, si quieren alinear con el DEPR, días, tiempo diario y duración.
  · Si buscan refuerzo: qué materias, y sobre todo QUÉ destrezas específicas le cuestan (profundiza con una pregunta de seguimiento si la respuesta es general, p. ej. "¿qué parte de la lectura se le hace difícil?"). Pregunta si va a la escuela y en qué horario puede estudiar (tardes, fines de semana). Sesiones más cortas.
  · Si mencionan una dificultad, un diagnóstico o un interés, reconócelo con empatía y úsalo; guarda el detalle en notes.
- Tu siguiente pregunta debe ser sobre el PRIMER dato de la lista de faltantes, salvo que antes convenga una pregunta corta de seguimiento sobre lo que acaba de contar (una dificultad, un interés). Si el usuario contesta algo distinto a lo que preguntaste, guárdalo y vuelve al primer faltante.
- Ofrece quickReplies útiles para responder rápido (p. ej. grados, materias, días como "Lunes a viernes", "3 días", tiempos como "30 min", "1 hora", "2 horas", duración como "1 mes", "Un trimestre", "Un semestre", "Año escolar"). Usa multiSelect=true cuando se puedan elegir varias (materias, intereses).
- En updates pon SOLO lo que el usuario dijo o confirmó en su último mensaje; todo lo demás va en null. Materias: math, spanish (Español), english (Inglés), science (Ciencias), social (Estudios Sociales). Si dice "todas", incluye las CINCO materias en subjects (y marca support según lo que diga de cada una). Si menciona una dificultad de una materia, pon esa materia con support "refuerzo" y la destreza en skills. Grados: k, 1 … 12. Días: 0=domingo, 1=lunes … 6=sábado. "Un mes"=4 semanas, "trimestre"=9, "semestre"=18, "año escolar"=36.
- Cuando no falte nada, resume en 2-3 oraciones lo que entendiste y ofrece como quickReplies "¡Crea mi plan!" y "Quiero cambiar algo".
- Si ya hay un plan y el usuario pide un cambio, actualiza los campos, pon regenerate=true y di que vas a rearmar el plan. Si solo pregunta algo, contesta sin regenerar.
- No inventes lecciones ni prometas contenido específico; el plan lo arma después el planificador con el catálogo real.`

function contextMessage(profile, missing, planExists) {
  const today = new Date().toISOString().slice(0, 10)
  return `Fecha de hoy: ${today}.
Perfil actual (JSON): ${JSON.stringify(profile)}
Datos que faltan, en orden: ${missing.length ? missing.map(f => `${f} (${FIELD_GUIDE[f]})`).join('; ') : 'ninguno — el perfil está completo'}.
${planExists ? 'Ya se generó un plan para este perfil.' : 'Todavía no hay plan.'}`
}

async function aiTurn(messages, profile, missing, planExists) {
  const { json } = await callOpenRouter({
    schemaName: 'onboarding_turn',
    schema: TURN_SCHEMA,
    maxTokens: 1500,
    temperature: 0.6,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-24).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content).slice(0, 2000) })),
      { role: 'system', content: contextMessage(profile, missing, planExists) },
    ],
  })
  return json
}

/* ------------------------------------------------------------------ */
/* Scripted fallback: parse the last answer, ask the next missing field. */

const strip = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const SUBJECT_WORDS = {
  math: ['mate', 'matematica', 'math', 'fraccion', 'suma', 'resta', 'multiplic', 'divis'],
  spanish: ['espanol', 'lectura', 'escritura', 'ortografia', 'gramatica'],
  english: ['ingles', 'english'],
  science: ['ciencia', 'science', 'biolog', 'quimica', 'fisica'],
  social: ['sociales', 'historia', 'geografia', 'social'],
}
const DAY_WORDS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 }

function parseAnswer(field, text, profile) {
  const t = strip(text)
  const u = {}
  if (field === 'mode') {
    if (/refuerzo|reforzar|ayuda|escuela|tutoria|destreza/.test(t)) u.mode = 'refuerzo'
    else if (/casa|homeschool|completo|hogar/.test(t)) u.mode = 'homeschool'
  }
  if (field === 'childName') {
    const name = String(text).trim().replace(/^(se llama|mi (hijo|hija|nene|nena) (se llama|es)|es|soy)\s+/i, '').split(/[,.\s]+/)[0]
    if (name) u.childName = name.replace(/^./, c => c.toUpperCase())
  }
  if (field === 'grade' || /grado|kinder|\bk\b/.test(t)) {
    const m = t.match(/\b(1[0-2]|[1-9])\b/) || (/kinder|\bk\b/.test(t) ? ['k', 'k'] : null)
    if (m) u.grade = m[1]
  }
  if (field === 'subjects' || field === 'skills') {
    const keys = SUBJECT_KEYS.filter(k => SUBJECT_WORDS[k].some(w => t.includes(w)))
    if (/todas/.test(t)) keys.push(...SUBJECT_KEYS)
    const support = profile.mode === 'refuerzo' ? 'refuerzo' : 'al-dia'
    if (field === 'subjects' && keys.length) u.subjects = [...new Set(keys)].map(key => ({ key, support, skills: '' }))
    if (field === 'skills') u.subjects = (keys.length ? keys : profile.subjects.map(s => s.key)).map(key => ({ key, support: 'refuerzo', skills: String(text).trim() }))
  }
  if (field === 'depr') {
    if (/^\s*(si|claro|ok|dale)|alinear|seguir/.test(t)) u.depr = true
    else if (/^\s*no/.test(t)) u.depr = false
  }
  if (field === 'days') {
    if (/lunes a viernes|todos los dias de semana/.test(t)) u.days = [1, 2, 3, 4, 5]
    else if (/fin(es)? de semana/.test(t)) u.days = [6, 0]
    else {
      const named = Object.entries(DAY_WORDS).filter(([w]) => t.includes(w)).map(([, d]) => d)
      const n = Number((t.match(/\b([1-7])\s*dias?/) || [])[1])
      u.days = named.length ? named : n ? [[3], [2, 4], [1, 3, 5], [1, 2, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 5, 6]][n - 1] : undefined
    }
  }
  if (field === 'minutesPerDay') {
    const h = t.match(/(\d+(?:[.,]\d+)?)\s*h/)
    const m = t.match(/(\d+)\s*m/)
    if (h) u.minutesPerDay = Math.round(parseFloat(h[1].replace(',', '.')) * 60)
    else if (m) u.minutesPerDay = Number(m[1])
    else if (/media hora/.test(t)) u.minutesPerDay = 30
    else if (/una hora/.test(t)) u.minutesPerDay = 60
  }
  if (field === 'weeks') {
    const n = Number((t.match(/(\d+)\s*semanas?/) || [])[1])
    u.weeks = n || (/mes/.test(t) ? 4 : /trimestre/.test(t) ? 9 : /semestre/.test(t) ? 18 : /ano/.test(t) ? 36 : undefined)
  }
  return u
}

const SCRIPT = {
  mode: { q: '¡Hola! Soy Lecturina 🤖. ¿Tu hijo(a) estudia en casa o buscas refuerzo en algunas materias?', r: ['Educamos en casa (homeschool)', 'Busco refuerzo en algunas materias'] },
  childName: { q: '¿Cómo se llama tu hijo(a)?', r: [] },
  grade: { q: p => `¿En qué grado está ${p.child.name || 'tu hijo(a)'}?`, r: ['Kinder', '1', '2', '3', '4', '5', '6', '7', '8'] },
  subjects: { q: p => (p.mode === 'refuerzo' ? '¿En qué materias necesita refuerzo?' : '¿Qué materias quieres incluir en el plan?'), r: ['Matemáticas', 'Español', 'Inglés', 'Ciencias', 'Estudios Sociales', 'Todas'], multi: true },
  skills: { q: '¿Qué destrezas o temas específicos le cuestan? Por ejemplo: fracciones, comprensión lectora, ortografía…', r: [] },
  depr: { q: '¿Quieres que el plan siga los estándares del Departamento de Educación (DEPR)? Es opcional.', r: ['Sí, alinear con el DEPR', 'No, enfocarnos en sus intereses'] },
  days: { q: '¿Qué días puede estudiar?', r: ['Lunes a viernes', '3 días', '2 días', 'Fines de semana'] },
  minutesPerDay: { q: '¿Cuánto tiempo al día pueden dedicarle?', r: ['30 min', '45 min', '1 hora', '2 horas', '3 horas'] },
  weeks: { q: '¿Por cuánto tiempo quieres el plan?', r: ['1 mes', 'Un trimestre', 'Un semestre', 'Año escolar'] },
}

function scriptedTurn(messages, profile, planExists) {
  const before = missingFields(profile)
  const last = [...messages].reverse().find(m => m.role === 'user')
  let updates = {}
  if (last && before.length) updates = parseAnswer(before[0], last.content, profile)
  const next = mergeProfile(profile, updates)
  const missing = missingFields(next)
  if (!missing.length) {
    return {
      reply: planExists
        ? 'Listo, tomé nota. Si quieres, rearmo el plan con esos cambios.'
        : `¡Perfecto! Ya tengo lo necesario para ${next.child.name} (${gradeLabel(next.child.level)}). ¿Creo el plan?`,
      quickReplies: ['¡Crea mi plan!', 'Quiero cambiar algo'],
      multiSelect: false,
      updates,
      regenerate: false,
    }
  }
  const step = SCRIPT[missing[0]]
  const repeated = before[0] === missing[0] && last
  return {
    reply: `${repeated ? 'Perdona, no te entendí del todo. ' : ''}${typeof step.q === 'function' ? step.q(next) : step.q}`,
    quickReplies: step.r,
    multiSelect: !!step.multi,
    updates,
    regenerate: false,
  }
}

/* ------------------------------------------------------------------ */

export async function chatTurn({ messages = [], profile, planExists = false }) {
  const current = profile?.child && profile?.schedule ? profile : emptyProfile()
  let turn
  let source = 'ai'
  try {
    turn = await aiTurn(messages, current, missingFields(current), planExists)
  } catch (err) {
    console.warn('[chat] AI unavailable, using scripted turn:', err.message)
    turn = scriptedTurn(messages, current, planExists)
    source = 'script'
  }
  const updates = Object.fromEntries(Object.entries(turn.updates || {}).filter(([, v]) => v !== null && v !== undefined))
  const next = mergeProfile(current, updates)
  const missing = missingFields(next)
  const changed = JSON.stringify(next) !== JSON.stringify(current)
  return {
    reply: turn.reply,
    quickReplies: (turn.quickReplies || []).slice(0, 6),
    multiSelect: !!turn.multiSelect,
    profile: next,
    missing,
    ready: missing.length === 0,
    regenerate: planExists && missing.length === 0 && changed && (turn.regenerate || source === 'script'),
    source,
  }
}

