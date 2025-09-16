// packages/backend-services/user-management/src/routes/users.js

const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate } = require('../../../shared/middleware/auth');
const { catchAsync } = require('../../../shared/middleware/errorHandler');

// Basic user profile route
router.get('/profile', authenticate, catchAsync(async (req, res) => {
  // For now, return user info from JWT token
  res.json({
    status: 'success',
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        citizenId: req.user.citizenId,
        ward: req.user.ward
      }
    }
  });
}));

// Export router
module.exports = router;
