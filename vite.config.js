import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// O domínio reservado .localhost permite conferir as duas experiências sem alterar o DNS.
function rotasLocais(server) {
  server.middlewares.use((req, res, next) => {
    const { pathname, search } = new URL(req.url, 'http://localhost')
    const hostname = (req.headers.host || '').split(':')[0]
    const institucional = ['neuralhub.ia.br', 'neuralhub.localhost'].includes(hostname)

    if (institucional) {
      if (pathname === '/' || pathname === '/neuralhub-compartilhado.html') {
        res.writeHead(307, { Location: '/neuralhub.html' + search })
        return res.end()
      }
      if (/^\/(?:plataforma(?:\.html|\/.*)?|solicitar-proposta|blog(?:\/.*)?|(?:aulas\/)?governanca-ia(?:\/.*)?)$/.test(pathname)) {
        const destino = pathname === '/plataforma.html' ? '/plataforma' : pathname
        res.writeHead(307, { Location: 'https://mentoria.neuralhub.ia.br' + destino + search })
        return res.end()
      }
    }

    const paginas = {
      '/lead': '/lead.html',
      '/brand': '/brand.html',
      '/obrigado': '/obrigado.html',
      '/solicitar-proposta': '/index.html',
    }

    let destino = paginas[pathname]
    if (/^\/auditoria(?:\/|$)/.test(pathname)) destino = '/auditoria.html'
    if (/^\/plataforma(?:\/|$)/.test(pathname)) destino = '/plataforma.html'
    if (/^\/gestao(?:\/|$)/.test(pathname)) destino = '/gestao.html'
    if (institucional && ['/privacidade', '/termos'].includes(pathname)) destino = pathname + '.html'
    if (/^\/neuralhub(?:\.html$|\/|$)/.test(pathname)) {
      destino = institucional ? '/identidade-neuralhub/inicio.html' : '/neuralhub-compartilhado.html'
    }

    if (destino) req.url = destino + search
    next()
  })
}

const devRewrites = {
  name: 'dev-rewrites',
  configureServer: rotasLocais,
  configurePreviewServer: rotasLocais,
}

export default defineConfig({
  plugins: [react(), devRewrites],
  test: {
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          globals: false,
          environment: 'happy-dom',
          setupFiles: './src/test/setup.js',
          include: ['src/**/*.test.{js,jsx,ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          globals: false,
          environment: 'node',
          include: ['server/**/*.test.{js,ts}', 'api/**/*.test.{js,ts}'],
        },
      },
    ],
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
        gestao:     resolve(__dirname, 'gestao.html'),
        neuralhub:  resolve(__dirname, 'neuralhub-compartilhado.html'),
        auditoria:  resolve(__dirname, 'auditoria.html'),
      },
    },
  },
})
