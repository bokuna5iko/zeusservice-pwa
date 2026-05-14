const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');

// Middleware для проверки роли админа
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Требуются права администратора' });
    }
};

// Защищенный путь статистики
router.get('/stats', authenticateToken, isAdmin, adminController.getStats);

module.exports = router;