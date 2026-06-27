// backend/src/routes/workShifts.js
const express = require("express");
const router = express.Router();
const workShiftController = require("../controllers/workShiftController");

// Маршрут проверки статуса операционной смены (открыта/закрыта)
router.get("/status", workShiftController.getCurrentShiftStatus);

// Маршрут открытия дня в 09:00
router.post("/open", workShiftController.openShift);

// Маршрут закрытия дня в 22:00
router.post("/close", workShiftController.closeShift);

// Маршрут добавления расхода денег из кассы
router.post("/expenses", workShiftController.addExpense);

// 🌟 ДОБАВЛЕНО: Роут на получение списка трат за сегодня
router.get("/expenses/today", workShiftController.getTodayExpenses);

module.exports = router;
