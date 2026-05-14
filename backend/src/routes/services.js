const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken } = require('../middleware/auth');

// Получить список всех услуг (доступно всем авторизованным пользователям)
router.get('/', authenticateToken, serviceController.getAllServices);

module.exports = router;