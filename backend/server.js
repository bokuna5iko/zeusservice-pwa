require('dotenv').config();
console.log('--- СЕРВЕР ОБНОВЛЕН ---');
console.log('Время запуска:', new Date().toLocaleTimeString());
console.log('Пароль базы:', process.env.DB_PASSWORD ? "OK" : "ПУСТО");
console.log('-----------------------');
console.log('--- ПРОВЕРКА ENV ---');
console.log('Пароль из файла:', process.env.DB_PASSWORD); 
console.log('Имя базы:', process.env.DB_NAME);
const express = require('express');
const cors = require('cors');
const path = require('path');

// 1. Импортируем наши новые роуты (модули)
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const visitRoutes = require('./src/routes/visits');
const serviceRoutes = require('./src/routes/services');

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Глобальные настройки
app.use(cors());
app.use(express.json());

// 3. Раздача статики (фронтенд)
// Убедись, что папка frontend находится на одном уровне с папкой backend
app.use(express.static(path.join(__dirname, '../frontend')));

// 4. Подключаем маршруты к приложению
// Теперь все пути будут начинаться с /api
app.use('/api/auth', authRoutes);   // Вход
app.use('/api/admin', adminRoutes); // Статистика
app.use('/api/user', visitRoutes);  // Визиты и профиль
app.use('/api/visits', visitRoutes);
app.use('/api/services', serviceRoutes);

/// 5. Обработка всех остальных путей (для SPA)
///app.get('/:splat*', (req, res) => {
///    res.sendFile(path.join(__dirname, '../frontend/index.html'));
///});

// 6. Запуск робота
app.listen(PORT, () => {
    console.log(`
    ================================
    🚀 СЕРВЕР ЗАПУЩЕН
    📍 Адрес: http://localhost:${PORT}
    🛠 Режим: Рефакторинг завершен
    ================================
    `);
});
