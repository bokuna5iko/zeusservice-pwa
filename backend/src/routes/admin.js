const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware для проверки роли админа
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Требуются права администратора' });
    }
};

router.get('/stats/today-count', adminController.getTodayCount);
router.get('/stats/last-visits', adminController.getLastVisits);
router.get('/services', adminController.getAllServices);
router.get('/history', adminController.getAdminHistory); // Получение истории за 7 дней для админа
router.post('/visits/add', adminController.createVisit);// Зачисление визита из калькулятора

// Защищенный путь статистики
router.get('/stats', authenticateToken, isAdmin, adminController.getStats);

module.exports = router;