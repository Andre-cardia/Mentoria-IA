import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
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
        main:     resolve(__dirname, 'index.html'),
        lead:     resolve(__dirname, 'lead.html'),
        brand:    resolve(__dirname, 'brand.html'),
        obrigado: resolve(__dirname, 'obrigado.html'),
        privacidade: resolve(__dirname, 'privacidade.html'),
        termos: resolve(__dirname, 'termos.html'),
        plataforma: resolve(__dirname, 'plataforma.html'),
      },
    },
  },
})
