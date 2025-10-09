// Packages/backend-services/user-management/src/routes/auth.js
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Simple routes without validation for now
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
