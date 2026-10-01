# Genial Skills Homeschool

Dashboard para familias que educan en casa. Un **onboarding con IA** le pregunta a la familia sobre el estudiante y genera un **plan de estudio con lecciones reales de Athenas** y un **calendario sugerido**.

## Flujo

1. **Onboarding conversacional con Lecturina** (mascota de Genial Skills), en un popup sobre el dashboard. La conversación se ramifica según lo que cuenta la familia: **educación en el hogar** (plan completo: materias y nivel, intereses, DEPR, horario) o **refuerzo** de materias o destrezas específicas (qué le cuesta, horario después de la escuela, sesiones cortas). Cada turno lo decide `server/chat.js`: el modelo propone la pregunta y extrae datos; el código valida y decide qué falta (`shared/profile.js`). Un panel muestra "Lo que sé hasta ahora". El plan aparece dentro del chat y se puede seguir ajustando con palabras ("solo lunes y miércoles", "agrega ciencias"), lo que lo rearma. Sin IA, un guion de respaldo hace las mismas preguntas.
2. **Generación:** el servidor trae el catálogo publicado de Athenas para el grado (y el grado anterior o siguiente si la materia necesita refuerzo o está avanzada). Un LLM vía **OpenRouter** escoge y ordena lecciones **por ID** (en refuerzo, solo las relacionadas con las destrezas mencionadas). El tiempo semanal se reparte parejo entre materias; las de refuerzo reciben primero las sesiones sobrantes. El servidor descarta IDs inexistentes, limita las lecciones puente a ~30% y completa la secuencia si el modelo se queda corto.
3. **Ciclo por lección:** cada lección se trabaja en tres días: **Aprender** (concepto, vocabulario, ejemplos) → **Practicar** → **Examen**, intercalado entre lecciones. Las materias con 4+ sesiones por semana tienen un **repaso de destrezas** semanal (2-3 sesiones: cada dos semanas) que vuelve a una lección de semanas anteriores (`shared/scheduler.js`).
4. **DEPR (opcional):** con el interruptor activo, la IA prioriza cubrir las expectativas de grado de los *Estándares de Contenido y Expectativas de Grado* del DEPR, y Planificación muestra el cumplimiento por materia y dominio (en el plan / completadas al hacer el examen). 95% de las lecciones de Athenas tienen su código de estándar.
5. **Dashboard original:** mientras no hay estudiantes se ve el contenido demo. Con un plan, Inicio, Estudiantes, Calendario, Planificación (tarjeta "Plan de estudio con IA") y Catálogo usan los datos reales; Portafolio, Tutoría, Mensajería y Comunidad quedan como estaban.
6. **Lecciones:** "Empezar" abre la lección de Genial Skills dentro del dashboard (visor de `genial-skills-redesign` en modo `?host=1`, abriendo en la sección del paso con `?section=practice|exam`).

## Estructura

```
api/            Funciones serverless (Vercel). También las sirve `npm run dev`.
  plan.js         POST /api/plan     → plan con IA + calendario
  catalog.js      GET  /api/catalog  → lecciones publicadas por grado y materia
  lesson.js       GET  /api/lesson   → detalle (objetivos, estándares, descripción)
server/
  athenas.js      Cliente de Athenas (X-API-KEY del lado del servidor, caché de 10 min)
  planner.js      Prompt + structured output vía OpenRouter, validación de IDs, planificador de respaldo
  catalog-snapshot.json  Copia del catálogo publicado (IDs + títulos) para cuando no hay key
shared/
  subjects.js     Materias ↔ códigos de Athenas (mat-sp, sp, en, sci-sp, sci-so, bi-sp…)
  scheduler.js    Plan → sesiones con fecha (se usa en el servidor y en el navegador)
  chat.js         Conversación de onboarding (IA + guion de respaldo)
  depr.js         Expectativas de grado del DEPR y estándares por lección
  depr-standards.json, lesson-standards.json   generados por scripts/build-depr-data.mjs
src/App.jsx     Dashboard original; monta las vistas reales cuando hay estudiantes
src/app/        ChatOnboarding (Lecturina), PlanView, DeprPanel, FamilyHome/Calendar/Catalog/Students, AIPlanning, LessonPlayer
```

Para regenerar los datos del DEPR: `node --env-file=.env.local scripts/build-depr-data.mjs "<ruta a Genial Skill maestros/standards>"`.

## Configuración

```bash
npm install --legacy-peer-deps   # react-beautiful-dnd (del prototipo viejo) no declara soporte para React 19
cp .env.example .env.local        # llenar las keys
npm run dev
```

| Variable | Para qué |
|---|---|
| `OPENROUTER_API_KEY` | Plan con IA. Sin ella se usa el planificador automático y el plan muestra la etiqueta "Plan automático". |
| `OPENROUTER_MODEL` | Opcional, por defecto `openai/gpt-4o`. Debe soportar structured outputs (`response_format: json_schema`). |
| `ATHENAS_API_KEY` | Catálogo en vivo y detalle de lecciones. Sin ella, el catálogo sale de `catalog-snapshot.json` y el detalle no está disponible. |
| `ATHENAS_API_BASE` | Por defecto `https://athenasapi-dev.genialskillsweb.com` |
| `VITE_LESSON_VIEWER_URL` | Opcional. Visor de lecciones que se incrusta; por defecto `https://genial-skills-redesign.vercel.app/`. |

Las keys van en `.env.local`, que está en `.gitignore`. `.env.example` es solo la plantilla que se sube al repo y nunca debe llevar valores reales.

En Vercel, estas mismas variables se configuran en Settings → Environment Variables. `/api/plan` tiene `maxDuration: 300` por si el modelo tarda (con GPT-4o tarda ~10 s).

## Datos

Todo se guarda en `localStorage` bajo la llave `gs_homeschool_v2`: familia, estudiantes, perfiles, planes y progreso. El progreso se guarda por ID de lección, así que se conserva cuando el plan se reorganiza. En Estudiantes, la opción "Borrar todo y empezar de nuevo" vuelve a abrir el onboarding.
