import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        // Exclude html — navigation requests must reach the server so it can
        // inject per-route apple-touch-icon / manifest / title tags.
        globPatterns: ['**/*.{js,css,svg,webmanifest}'],
        navigateFallback: null,
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/music': 'http://localhost:4000',
      '/auth': 'http://localhost:4000',
    },
  },
})
