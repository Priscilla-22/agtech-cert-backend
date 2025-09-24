const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/AuthController');
const dashboardController = require('../controllers/DashboardController');

const router = express.Router();

router.post('/register', authController.register.bind(authController));
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));
router.put('/profile', authenticateToken, authController.updateProfile.bind(authController));
router.get('/dashboard/stats', authenticateToken, dashboardController.getStats.bind(dashboardController));

module.exports = router;