// src/routes/shifts.js
const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shiftController");
const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");

// Маршруты Сотрудника (Worker)
router.get(
  "/worker/history",
  authenticateToken,
  shiftController.getWorkerHistory,
);
router.post("/worker/request", authenticateToken, shiftController.requestShift);

// Маршруты Администратора (Admin)
router.get(
  "/admin/pending",
  authenticateToken,
  requireRole("admin"),
  shiftController.getPendingShifts,
);
router.get(
  "/admin/calendar",
  authenticateToken,
  requireRole("admin"),
  shiftController.getAdminCalendar,
); // 🌟 ДОБАВЛЕНО: Сетка смен для аккордеонов
router.post(
  "/admin/batch-update",
  authenticateToken,
  requireRole("admin"),
  shiftController.batchUpdateShifts,
);

module.exports = router;
