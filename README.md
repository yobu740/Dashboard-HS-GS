# Genial Skills Homeschool

Dashboard para familias que educan en casa. Un **onboarding con IA** le pregunta a la familia sobre el estudiante y genera un **plan de estudio con lecciones reales de Athenas** y un **calendario sugerido**.

## Flujo

1. **Onboarding (8 pasos):** nombre del padre o la madre, estudiante (nombre, edad, grado), idioma de instrucción, materias con su nivel (necesita refuerzo, va al día o está avanzado), estilo de aprendizaje e intereses, metas y enfoque (estructurado, mixto o flexible), horario (días, minutos al día, duración de cada sesión, fecha de inicio y duración del plan) y notas libres.
2. **Generación:** el servidor trae el catálogo publicado de Athenas para el grado. Si una materia necesita refuerzo, incluye también el grado anterior. Si está avanzada, incluye el siguiente. Un LLM vía **OpenRouter** (por defecto `openai/gpt-4o`, igual que Genial Skills Maestro) escoge y ordena lecciones **por ID** de ese catálogo y define cuántas sesiones por semana tiene cada materia. Luego el servidor descarta cualquier ID que no exista, limita las lecciones puente a ~30% de la materia y completa la secuencia con el catálogo si el modelo se quedó corto.
3. **Calendario:** `shared/scheduler.js` reparte las lecciones en los días y horas de la familia. Cuando se acaban las lecciones de una materia, agrega sesiones de repaso.
4. **Revisión:** la familia ve el resumen, los consejos, la secuencia por materia y la primera semana. Desde ahí puede aceptar el plan, ajustar sus respuestas o pedir otra versión.
5. **Dashboard:** Hoy, Plan de estudio (editable), Calendario (mes y semana), Catálogo (añadir lecciones al plan) y Estudiantes (varios hijos).
6. **Lecciones:** "Empezar" abre la lección completa (concepto, vocabulario, ejemplos, práctica, examen y tutor IA) dentro del dashboard. Usa el visor de Genial Skills del proyecto `genial-skills-redesign` (`https://genial-skills-redesign.vercel.app/?lesson={id}&live=1`), que arma cualquier lección de Athenas por ID.

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
src/app/        Frontend nuevo (Onboarding, PlanView, LessonPlayer, secciones del dashboard)
```

`src/App.jsx`, `NewOnboardingSystem.jsx` y los otros componentes del prototipo anterior siguen en el repo como referencia, pero ya no se montan.

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
