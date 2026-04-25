import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Replica os rewrites do vercel.json para o dev server local
const devRewrites = {
  name: 'dev-rewrites',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/plataforma' || req.url.startsWith('/plataforma/')) {
        req.url = '/plataforma.html'
      } else if (req.url === '/lead') {
        req.url = '/lead.html'
      } else if (req.url === '/brand') {
        req.url = '/brand.html'
      } else if (req.url === '/obrigado') {
        req.url = '/obrigado.html'
      } else if (req.url === '/neuralhub' || req.url.startsWith('/neuralhub/')) {
        req.url = '/neuralhub.html'
      }
      next()
    })
  },
}

export default defineConfig({
  plugins: [react(), devRewrites],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx,ts,tsx}', 'server/**/*.test.{js,ts}'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        lead:       resolve(__dirname, 'lead.html'),
        brand:      resolve(__dirname, 'brand.html'),
        obrigado:   resolve(__dirname, 'obrigado.html'),
        privacidade: resolve(__dirname, 'privacidade.html'),
        termos:     resolve(__dirname, 'termos.html'),
        plataforma: resolve(__dirname, 'plataforma.html'),
        neuralhub:  resolve(__dirname, 'neuralhub.html'),
      },
    },
  },
})
