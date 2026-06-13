import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    // Proxy the API in dev so the session cookie is same-origin.
    proxy: {
      '/api': 'http://localhost:3000',
      '/factions': 'http://localhost:3000',
      '/keywords': 'http://localhost:3000',
      '/lists': 'http://localhost:3000',
    },
  },
})
