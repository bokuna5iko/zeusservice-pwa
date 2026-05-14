const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth'); 
const authController = require('../controllers/authController');
const visitController = require('../controllers/visitController');

// Профиль (доступен всем залогиненным)
router.get('/me', authenticateToken, authController.getMe);

// Получить историю своих визитов
router.get('/history', authenticateToken, visitController.getUserHistory);

// Начисление визита (ТОЛЬКО для админов)
router.post('/add', authenticateToken, adminOnly, visitController.addVisit);

module.exports = router;

