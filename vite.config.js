import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
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
      },
    },
  },
})
