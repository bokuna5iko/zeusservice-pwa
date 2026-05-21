import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Zeus Auto',
        short_name: 'Zeus',
        description: 'Система автоматизации и лояльности автомойки',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/android/zeuslogo-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/android/zeuslogo-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
    }),
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,  // ← ИСПРАВЛЕНО: true вместо 'all'
    cors: true
  }
})
