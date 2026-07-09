// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",

  plugins: [
    react(),
    VitePWA({
      // 🌟 Настройка типа регистрации обновлений
      registerType: "promptForUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "icons/**/*"],

      // 🌟 Манифест нативного PWA-приложения
      manifest: {
        name: "ZEUS AUTO | Система лояльности",
        short_name: "ZEUS AUTO",
        description:
          "Приложение автомойки ZEUS AUTO для клиентов и администраторов",
        theme_color: "#0f172a" /* Цвет шапки в тон нашей новой темной темы */,
        background_color: "#020617" /* Цвет экрана загрузки (сплэш-скрина) */,
        display:
          "standalone" /* Запуск в режиме отдельного нативного приложения без адресной строки */,
        orientation: "portrait" /* Железная портретная ориентация */,
        start_url: "/",
        icons: [
          {
            src: "/icons/zeuslogo-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/ios/180.png",
            sizes: "180x180",
            type: "image/png",
          },
          {
            src: "/icons/zeuslogo-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      // 🌟 Стратегия кэширования движка Workbox
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"], // Кэшируем фронтенд-ресурсы для работы офлайн
        runtimeCaching: [
          // 🔄 СМАРТ-КЭШ ИСТОРИИ АДМИНА: Стратегия Stale-While-Revalidate
          {
            urlPattern: ({ url }) => url.pathname === "/api/admin/visits/today",
            handler: "NetworkFirst",
            options: {
              cacheName: "admin-visits-today",
              expiration: {
                maxEntries: 1, // Нам нужен только 1 слепок текущего дня
                maxAgeSeconds: 60 * 60 * 4, // Храним историю ровно  24 часа
             },
	      networkTimeoutSeconds: 3,  // Если сеть не ответила за 3 сек — берём из кэша
            },
          },
          // 🛑 СТРАТЕГИЯ NETWORK ONLY: Полный запрет на кэширование остальных эндпоинтов (авторизация, создание визитов)
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly", // Остальные запросы идут строго мимо кэша напрямую в сеть!
          },
          // 🔄 СТРАТЕГИЯ CACHE FIRST: Шрифты берем железно из локальной памяти
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // Храним кэш год
              },
            },
          },
        ],
      },
    }),
  ],

  // 🌟 Настройки локального сервера разработки и проксирования
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
