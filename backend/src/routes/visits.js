const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { authenticateToken } = require('../middleware/auth');

// Маршруты
router.get('/me', authenticateToken, visitController.getUserMe);
router.post('/add', authenticateToken, visitController.addVisit);

module.exports = router;