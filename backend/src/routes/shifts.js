// src/routes/shifts.js
const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shiftController");

// 🌟 ИСПРАВЛЕНО: Импортируем твои точные системные функции защиты
// ⚠️ Примечание: Если твой файл на диске называется auth.js, замени путь на '../middleware/auth'
const {
  authenticateToken,
  adminOnly,
} = require("../middleware/authMiddleware");

// Маршруты Сотрудника (Worker)
router.get(
  "/worker/history",
  authenticateToken,
  shiftController.getWorkerHistory,
);
router.post("/worker/request", authenticateToken, shiftController.requestShift);

// Маршруты Администратора (Admin)
// 🌟 ИСПРАВЛЕНО: Применяем твой родной adminOnly
router.get(
  "/admin/pending",
  authenticateToken,
  adminOnly,
  shiftController.getPendingShifts,
);
router.get(
  "/admin/calendar",
  authenticateToken,
  adminOnly,
  shiftController.getAdminCalendar,
);
router.post(
  "/admin/batch-update",
  authenticateToken,
  adminOnly,
  shiftController.batchUpdateShifts,
);

module.exports = router;
