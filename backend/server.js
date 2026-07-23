const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./src/config/db");
const { initSmsAuthTables } = require("./src/db/initSmsAuth");

// 🌟 ДОБАВЛЕНО: Нативные модули для интеграции Socket.io
const http = require("http");
const { Server } = require("socket.io");

// Логи для отладки при старте
console.log("--- СЕРВЕР ОБНОВЛЕН (РЕЖИМ REALTIME) ---");
console.log("Время запуска:", new Date().toLocaleTimeString());
console.log(
  "БД:",
  process.env.DB_NAME,
  process.env.DB_PASSWORD ? "✅ Пароль есть" : "❌ Пароля нет",
);
console.log("----------------------------------------");

const app = express();
const PORT = process.env.PORT || 3000;

// 🌟 ИСПРАВЛЕНО: Оборачиваем инстанс Express в HTTP-сервер Node.js
const server = http.createServer(app);

// 🌟 ИСПРАВЛЕНО: Инициализируем сервер Socket.io поверх нашего HTTP-сервера
const io = new Server(server, {
  cors: {
    origin: "*", // Позволяет фронтенду подключаться без конфликтов политик CORS
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// МИДЛВАРЫ
app.use(cors()); // Важно: cors должен быть ПЕРЕД роутами
app.use(express.json());

// 1. Импортируем роуты
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");
const visitRoutes = require("./src/routes/visits");
const shiftRoutes = require("./src/routes/shifts"); // Импортируем новые роуты смен сотрудников
const workShiftRoutes = require("./src/routes/workShifts"); // Роуты пульта (операционные смены кассы)

// 2. Маршруты API или же регистрации эндпоинтов
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", visitRoutes);
app.use("/api/shifts", shiftRoutes); // Монтируем роутер смен на префикс /api/shifts
app.use("/api/work-shifts", workShiftRoutes); // Монтируем пульт управления на /api/work-shifts

// Тестовый маршрут, чтобы проверить связь через браузер
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", message: "Server is reaching out!" });
});

// Эндпоинт проверки здоровья (Health Check) для инфраструктуры
app.get("/api/health", async (req, res) => {
  try {
    // Делаем легковесный запрос в БД. Если Postgres жива — она ответит мгновенно
    await db.query("SELECT 1");
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("🚨 Health Check Failed (DB Unavailable):", err.message);
    res.status(503).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

// 🌟 ДОБАВЛЕНО: Глобальный обработчик сокет-событий
io.on("connection", (socket) => {
  console.log(`🔌 Новое сокет-подключение: ${socket.id}`);

  // Когда фронтенд пульта управления загружается, он шлет это событие, чтобы зайти в закрытую комнату
  socket.on("join_admin_room", () => {
    socket.join("admin_dashboard");
    console.log(`👑 Сокет ${socket.id} вошел в комнату администраторов (АРМ)`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Сокет отключился: ${socket.id}`);
  });
});

// 🌟 ДОБАВЛЕНО: Шарим инстанс 'io' внутри Express, чтобы вызывать сокеты из любых контроллеров через req.app.get("io")
app.set("io", io);

// Обработка ошибок, чтобы сервер не падал от одного кривого запроса
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);
  res.status(500).json({ message: "Внутренняя ошибка сервера" });
});

async function startServer() {
  try {
    await initSmsAuthTables();
    console.log("✅ SMS auth tables ready");
  } catch (err) {
    console.error("⚠️ SMS auth init failed:", err.message);
  }

  server.listen(PORT, () => {
    console.log(`
    ================================
    🚀 СЕРВЕР С SOCKET.IO ЗАПУЩЕН
    📍 Адрес: http://localhost:${PORT}
    🛠 Режим: Realtime Sync 2.0
    📱 SMS: ${process.env.SMS_PROVIDER || "dev"}
    ================================
    `);
  });
}

startServer();
