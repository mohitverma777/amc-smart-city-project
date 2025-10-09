// Packages/backend-services/user-management/src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Import middleware from shared
const { authenticate, authorize } = require('../../../shared/middleware/auth');
const { catchAsync } = require('../../../shared/middleware/errorHandler');

console.log('🚀 Admin routes loaded');

// Admin user management routes
router.post('/users', 
  authenticate, 
  authorize('admin'), 
  catchAsync(adminController.createUser)
);

router.get('/users', 
  authenticate, 
  authorize('admin'), 
  catchAsync(adminController.getAllUsers)
);

router.get('/users/:userId', 
  authenticate, 
  authorize('admin'), 
  catchAsync(adminController.getUserDetails)
);

router.put('/users/:userId', 
  authenticate, 
  authorize('admin'), 
  catchAsync(adminController.updateUser)
);

router.patch('/users/:userId/deactivate', 
  authenticate, 
  authorize('admin'), 
  catchAsync(adminController.deactivateUser)
);

router.get('/stats', 
  authenticate, 
  authorize('admin'), 
  catchAsync(adminController.getUserStats)
);

module.exports = router;
