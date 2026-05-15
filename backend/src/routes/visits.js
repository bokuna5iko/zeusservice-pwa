const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/authMiddleware'); 
const authController = require('../controllers/authController');
const visitController = require('../controllers/visitController');
const userController = require('../controllers/userController');

// Профиль (доступен всем залогиненным)
router.get('/me', authenticateToken, authController.getMe);

// Получить историю своих визитов
router.get('/history', authenticateToken, visitController.getUserHistory);

// Начисление визита (ТОЛЬКО для админов)
router.post('/add', authenticateToken, adminOnly, visitController.addVisit);

// Обновление профиля (PUT)
router.put('/update', authenticateToken, userController.updateProfile);

module.exports = router;

