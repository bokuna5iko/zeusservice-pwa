const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const visitController = require('../controllers/visitController');

router.get('/me', authenticateToken, authController.getMe);
router.post('/add', authenticateToken, visitController.addVisit);

module.exports = router;
