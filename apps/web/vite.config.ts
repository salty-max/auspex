import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    // `*.svg?react` imports become inline React components. The icons are
    // pre-cleaned (currentColor, viewBox) by scripts/import-icons.ts, so svgr's
    // own optimizer is off; `icon` defaults their size to 1em.
    svgr({ svgrOptions: { icon: true, svgo: false } }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    // Keep a single React instance — deps like react-i18next must share it.
    dedupe: ['react', 'react-dom'],
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
