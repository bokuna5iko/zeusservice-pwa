const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./src/config/db"); // 🌟 ДОБАВЛЕНО: Импортируем пул БД для проверки здоровья

// Логи для отладки при старте
console.log("--- СЕРВЕР ОБНОВЛЕН ---");
console.log("Время запуска:", new Date().toLocaleTimeString());
console.log(
  "БД:",
  process.env.DB_NAME,
  process.env.DB_PASSWORD ? "✅ Пароль есть" : "❌ Пароля нет",
);
console.log("-----------------------");

const app = express();
const PORT = process.env.PORT || 3000;

// МИДЛВАРЫ
app.use(cors()); // Важно: cors должен быть ПЕРЕД роутами
app.use(express.json());

// 1. Импортируем роуты
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");
const visitRoutes = require("./src/routes/visits");
const shiftRoutes = require("./src/routes/shifts"); // 🌟 ИСПРАВЛЕНО: Импортируем новые роуты смен

// 2. Маршруты API или же регистрации эндпоинтов
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", visitRoutes);
app.use("/api/shifts", shiftRoutes); // 🌟 ИСПРАВЛЕНО: Монтируем роутер смен на префикс /api/shifts

// Тестовый маршрут, чтобы проверить связь через браузер
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", message: "Server is reaching out!" });
});

// 🌟 ДОБАВЛЕНО: Эндпоинт проверки здоровья (Health Check) для инфраструктуры
app.get("/api/health", async (req, res) => {
  try {
    // Делаем легковесный запрос в БД. Если Postgres жива — она ответит мгновенно
    await db.query("SELECT 1");

    // Статус 200 — всё супер
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("🚨 Health Check Failed (DB Unavailable):", err.message);

    // Статус 503 Service Unavailable — жесткий сигнал для Docker/Kubernetes/PM2, что сервер "приуныл"
    res.status(503).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

// ЕДИНСТВЕННЫЙ запуск сервера
app.listen(PORT, () => {
  console.log(`
    ================================
    🚀 С СЕРВЕР ЗАПУЩЕН
    📍 Адрес: http://localhost:${PORT}
    🛠 Режим: React Migration
    ================================
    `);
});

// Обработка ошибок, чтобы сервер не падал от одного кривого запроса
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);
  res.status(500).json({ message: "Внутренняя ошибка сервера" });
});
