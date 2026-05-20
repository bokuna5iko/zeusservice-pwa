const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Логи для отладки при старте
console.log('--- СЕРВЕР ОБНОВЛЕН ---');
console.log('Время запуска:', new Date().toLocaleTimeString());
console.log('БД:', process.env.DB_NAME, process.env.DB_PASSWORD ? "✅ Пароль есть" : "❌ Пароля нет");
console.log('-----------------------');

const app = express();
const PORT = process.env.PORT || 3000;

// МИДЛВАРЫ
app.use(cors()); // Важно: cors должен быть ПЕРЕД роутами
app.use(express.json());

// 1. Импортируем роуты
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const visitRoutes = require('./src/routes/visits');

// 2. Маршруты API или же регистрации эндпоинтов
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', visitRoutes);

// Тестовый маршрут, чтобы проверить связь через браузер
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Server is reaching out!' });
});

// ЕДИНСТВЕННЫЙ запуск сервера
app.listen(PORT, () => {
    console.log(`
    ================================
    🚀 СЕРВЕР ЗАПУЩЕН
    📍 Адрес: http://localhost:${PORT}
    🛠 Режим: React Migration
    ================================
    `);
});

// Обработка ошибок, чтобы сервер не падал от одного кривого запроса
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});