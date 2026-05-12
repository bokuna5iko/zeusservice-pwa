import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Zeus Auto',
        short_name: 'Zeus',
        description: 'Система автоматизации и лояльности автомойки',
        theme_color: '#ffffff',
        icons: [
          {
            "src": "android/zeuslogo-192x192.png", // Без слова public
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "android/zeuslogo-512x512.png", // Без слова public
            "sizes": "512x512",
            "type": "image/png"
          }
        ]
      }
    })
  ],
})