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
// Зачисление визита из калькулятора
router.post('/visits/add', adminController.createVisit);

// Защищенный путь статистики
router.get('/stats', authenticateToken, isAdmin, adminController.getStats);

module.exports = router;