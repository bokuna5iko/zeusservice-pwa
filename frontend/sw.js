const CACHE_NAME = 'zeus-auto-v1';

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW]: Installed');
    self.skipWaiting();
});

// Активация
self.addEventListener('activate', (event) => {
    console.log('[SW]: Activated');
});

// Обработка запросов (пустая, чтобы не мешать разработке)
self.addEventListener('fetch', (event) => {
    // Пока просто пропускаем все запросы мимо кэша
});