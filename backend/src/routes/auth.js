const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Только /login! Не /api/auth/login и не /auth/login
router.post('/login', authController.login);

// 🌟 ДОБАВЛЯЕМ РОУТ РЕГИСТРАЦИИ
router.post('/register', authController.register);

router.post('/sms/send', authController.sendSmsCode);
router.post('/sms/verify', authController.verifySmsCode);

module.exports = router;