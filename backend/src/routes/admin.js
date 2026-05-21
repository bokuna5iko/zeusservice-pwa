const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 1. Импортируем твои новые контроллеры
const statisticsController = require('../controllers/StatisticsController');
const archiveController = require('../controllers/ArchiveController');

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
router.get('/history', adminController.getAdminHistory); 
router.post('/visits/add', adminController.createVisit);
router.get('/stats', authenticateToken, isAdmin, adminController.getStats);
router.get('/users/verify/:id', authenticateToken, isAdmin, adminController.verifyUserById);

// ==========================================================================
// НАШИ НОВЫЕ РОУТЫ (Защищаем их теми же мидлварами)
// ==========================================================================

// Комплексная статистика за сегодня (метрики 2х2 + график по часам)
// Полный путь: GET /api/admin/stats/today
router.get('/stats/today', authenticateToken, isAdmin, statisticsController.getTodayDashboardStats);

// Архив клиентов (справочник с поиском и лимитом в 50 записей)
// Полный путь: GET /api/admin/clients/archive
router.get('/clients/archive', authenticateToken, isAdmin, archiveController.getClientArchive);

module.exports = router;