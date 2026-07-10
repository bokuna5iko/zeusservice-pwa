// backend/src/routes/workShifts.js
const express = require("express");
const router = express.Router();
const workShiftController = require("../controllers/workShiftController");

// Базовые операционные роуты
router.get("/status", workShiftController.getCurrentShiftStatus);
router.post("/open", workShiftController.openShift);
router.get("/pre-close-report/:shiftId", workShiftController.getPreCloseReport);
router.post("/close", workShiftController.closeShift);

// Модуль архива и трат
router.get("/expenses/today", workShiftController.getTodayExpenses);
router.post("/expenses", workShiftController.addExpense);
router.get("/archive/calendar", workShiftController.getShiftArchiveCalendar);

module.exports = router;
