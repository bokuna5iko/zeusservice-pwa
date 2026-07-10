const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  adminOnly,
} = require("../middleware/authMiddleware");

const authController = require("../controllers/authController");
const visitController = require("../controllers/visitController");
const userController = require("../controllers/userController");
// Смена временного пароля на постоянный (с хэшированием)
router.post(
  "/change-password",
  authenticateToken,
  userController.changePassword,
);

// Профиль (доступен всем залогиненным)
router.get("/me", authenticateToken, authController.getMe);

// Получить историю своих личных визитов (для клиентов)
router.get("/history", authenticateToken, visitController.getUserHistory);

// 🌟 ИСПРАВЛЕНО: Заменили имя мидлвары на authenticateToken и ЖЕСТКО закрыли роут через adminOnly!
// Теперь обычный клиент сюда физически не пролезет
router.get(
  "/visits/today",
  authenticateToken,
  adminOnly,
  visitController.getAdminVisitsToday,
);

// Начисление визита (ТОЛЬКО для админов)
router.post("/add", authenticateToken, adminOnly, visitController.addVisit);

// Обновление профиля (PUT)
router.put("/update", authenticateToken, userController.updateProfile);

// Генерация безопасной динамической строки для QR-кода (Доступно всем залогиненным)
router.get("/generate", authenticateToken, userController.generateQrString);

module.exports = router;
