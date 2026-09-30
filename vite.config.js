import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Serves the Vercel functions in api/*.js from the Vite dev server, so
// `npm run dev` runs the whole app (UI + Athenas proxy + AI planner) without
// the Vercel CLI. Server env vars come from .env / .env.local (non-VITE_ ones
// are never exposed to the browser bundle).
function apiRoutes() {
  const routes = { '/api/plan': './api/plan.js', '/api/catalog': './api/catalog.js', '/api/lesson': './api/lesson.js' }
  return {
    name: 'local-api-routes',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const [k, v] of Object.entries(env)) if (!(k in process.env)) process.env[k] = v

      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url.split('?')[0]
        const file = routes[pathname]
        if (!file) return next()
        try {
          const mod = await server.ssrLoadModule(file)
          await mod.default(req, res)
        } catch (err) {
          server.config.logger.error(`[api] ${pathname}: ${err.stack || err}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err.message || err) }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiRoutes()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
