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
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'logo.png', 'studio-hero.png'],
      manifest: {
        name: 'JOWI 98.1 FM',
        short_name: 'JOWI',
        description: 'Listen live to JOWI 98.1 FM — jamuomo...',
        theme_color: '#0a0c0e',
        background_color: '#0a0c0e',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('react-router')) return 'router'
            if (id.includes('react-dom') || id.includes('/react/')) return 'react'
            if (id.includes('lucide-react')) return 'icons'
          }
        },
      },
    },
  },
  server: {
    proxy: {
      // Shoutcast stats have no CORS — proxy for local/dev
      '/api/listeners': {
        target: 'https://s23.myradiostream.com:20542',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/stats?json=1',
      },
    },
  },
  preview: {
    proxy: {
      '/api/listeners': {
        target: 'https://s23.myradiostream.com:20542',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/stats?json=1',
      },
    },
  },
})
