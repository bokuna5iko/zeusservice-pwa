// backend/src/routes/admin.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// 1. Импортируем контроллеры (🌟 ИСПРАВЛЕНО: Добавили импорт visitController)
const statisticsController = require("../controllers/StatisticsController");
const archiveController = require("../controllers/ArchiveController");
const visitController = require("../controllers/visitController");

// Импортируем проверку токена авторизации
const { authenticateToken } = require("../middleware/authMiddleware");

// Middleware для проверки роли админа
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Требуются права администратора" });
  }
};

// Базовые роуты админки
router.get("/stats/today-count", adminController.getTodayCount);
router.get("/stats/last-visits", adminController.getLastVisits);
router.get("/services", adminController.getAllServices);
router.get(
  "/history",
  authenticateToken,
  isAdmin,
  adminController.getAdminHistory,
);

router.post(
  "/visits/add",
  authenticateToken,
  isAdmin,
  adminController.createVisit,
);

router.get("/stats", authenticateToken, isAdmin, adminController.getStats);

router.get(
  "/users/verify/:id",
  authenticateToken,
  isAdmin,
  adminController.verifyUserById,
);

// 🌟 ИСПРАВЛЕНО: Заменили authMiddleware на authenticateToken,
// добавили жесткую защиту через isAdmin и подключили visitController!
router.get(
  "/visits/today",
  authenticateToken,
  isAdmin,
  visitController.getAdminVisitsToday,
);

// Комплексная статистика за сегодня (метрики 2х2 + график по часам)
// Полный путь: GET /api/admin/stats/today
router.get(
  "/stats/today",
  authenticateToken,
  isAdmin,
  statisticsController.getTodayDashboardStats,
);

// Архив клиентов (справочник с поиском и лимитом в 50 записей)
// Полный путь: GET /api/admin/clients/archive
router.get(
  "/clients/archive",
  authenticateToken,
  isAdmin,
  archiveController.getClientArchive,
);

// Точечное редактирование полей заезда администратором (Умные формы)
// Полный путь: PATCH /api/admin/visits/update/:id
router.patch(
  "/visits/update/:id",
  authenticateToken,
  isAdmin,
  adminController.updateVisit,
);

module.exports = router;
