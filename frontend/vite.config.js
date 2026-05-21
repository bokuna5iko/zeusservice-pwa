import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Автоматически обновляет приложение у пользователя при деплое новой версии
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/**/*'], // Какие статические ресурсы кэшировать сразу
      
      manifest: {
        name: 'ZEUS AUTO | Система лояльности',
        short_name: 'ZEUS AUTO',
        description: 'Приложение автомойки ZEUS AUTO для клиентов и администраторов',
        theme_color: '#0f172a',      /* Цвет шапки в тон нашей новой темной темы */
        background_color: '#020617', /* Цвет экрана загрузки (сплэш-скрина) */
        display: 'standalone',       /* Запуск в режиме отдельного нативного приложения без адресной строки */
        orientation: 'portrait',     /* Железная портретная ориентация */
        start_url: '/',
        icons: [
          {
            src: '/icons/zeuslogo-192x192.png', 
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/ios/180.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/icons/zeuslogo-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },

      // 👇 ВПИХНУЛИ WORKBOX СЮДА (На один уровень с объектом manifest)
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'], // Кэшируем фронтенд-ресурсы для работы офлайн
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst', // Инструкция брать шрифты железно из кэша
            options: {
              cacheName: 'google-fonts',
              expiration: { 
                maxEntries: 10, 
                maxAgeSeconds: 60 * 60 * 24 * 365 // Храним кэш год
              }
            }
          }
        ]
      }
    }),
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    cors: true,
    // Наш прокси-сервер для связи с бэком
    proxy: {
      '/api': {
        target: 'http://localhost:3000', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})