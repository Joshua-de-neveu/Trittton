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
      // Only register the service worker in production builds — dev would interfere with HMR.
      devOptions: { enabled: false },
      manifest: {
        name: 'Trittton — UCSD Course Browser',
        short_name: 'Trittton',
        description: 'Browse UCSD courses, plan schedules with AI, track graduation progress.',
        theme_color: '#3b82f6',
        background_color: '#111113',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Precache the app shell so the UI shows up offline.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Don't precache /api/courses — it's 1.5 MB and useCourseData has its own IndexedDB cache.
        // Instead let runtime caching handle it with a stale-while-revalidate.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // GET /api/courses — let the SW cache it for a day. The IDB cache above is the
            // primary, but a SW cache lets a fully-cold-tab restore work without it.
            urlPattern: ({ url }) => url.pathname === '/api/courses',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'trittton-courses-v1',
              expiration: { maxEntries: 4, maxAgeSeconds: 86400 },
            },
          },
          {
            // RMP / prereq / term lists — these change rarely, cheap to revalidate.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/rmp') || url.pathname.startsWith('/api/prereqs') || url.pathname.startsWith('/api/terms'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'trittton-meta-v1',
              expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 3 },
            },
          },
          {
            // External fonts — fall back to cache when offline.
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'trittton-fonts-v1',
              expiration: { maxEntries: 20, maxAgeSeconds: 86400 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
