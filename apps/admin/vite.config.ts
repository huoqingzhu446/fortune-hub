import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function normalizeBase(base: string) {
  if (!base.startsWith('/')) {
    return `/${base}/`
  }

  return base.endsWith('/') ? base : `${base}/`
}

function redirectRootToBase(base: string) {
  return {
    name: 'redirect-root-to-base',
    configureServer(server: { middlewares: { use: (handler: (req: { url?: string }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: () => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) {
          next()
          return
        }

        if (req.url === '/' || req.url === '/index.html') {
          res.statusCode = 302
          res.setHeader('Location', base)
          res.end()
          return
        }

        if (req.url === base.slice(0, -1)) {
          res.statusCode = 302
          res.setHeader('Location', base)
          res.end()
          return
        }

        next()
      })
    },
  }
}

const publicBase = normalizeBase(process.env.VITE_PUBLIC_BASE || '/admin/')

// https://vite.dev/config/
export default defineConfig({
  base: publicBase,
  plugins: [vue(), redirectRootToBase(publicBase)],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
