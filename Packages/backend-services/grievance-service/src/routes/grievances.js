// Packages/backend-services/grievance-service/src/routes/grievances.js
const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievanceController');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('@amc/shared/middleware/auth');
const validation = require('@amc/shared/middleware/validation');
const upload = require('../middleware/fileUpload');
const rateLimit = require('express-rate-limit');

// Rate limiting for different endpoints
const createGrievanceLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 grievance submissions per windowMs
  message: {
    status: 'error',
    message: 'Too many grievance submissions, please try again later.',
    code: 'GRIEVANCE_RATE_LIMIT_EXCEEDED'
  }
});

// Grievance CRUD operations
router.post('/', 
  authenticate,
  createGrievanceLimit,
  upload.array('attachments', 5), // Max 5 files
  validation.validate(validation.grievanceCreation),
  grievanceController.createGrievance
);

router.get('/my-grievances',
  authenticate,
  validation.validateQuery(validation.schemas.pagination),
  grievanceController.getMyGrievances
);

router.get('/officer-view',
  authenticate,
  authorize('officer', 'admin'),
  grievanceController.getGrievancesForOfficers
);

router.get('/statistics',
  authenticate,
  authorize('officer', 'admin'),
  grievanceController.getStatistics
);

router.get('/:identifier',
  authenticate,
  grievanceController.getGrievance
);

router.put('/:id',
  authenticate,
  validation.validate(validation.grievanceUpdate),
  grievanceController.updateGrievance
);

router.patch('/:id/status',
  authenticate,
  authorize('officer', 'admin'),
  validation.validate(validation.statusUpdate),
  grievanceController.updateStatus
);

router.post('/:id/feedback',
  authenticate,
  validation.validate(validation.feedbackSchema),
  grievanceController.addFeedback
);

// File operations
router.post('/:id/attachments',
  authenticate,
  upload.array('files', 3),
  grievanceController.addAttachments
);

router.delete('/attachments/:attachmentId',
  authenticate,
  grievanceController.removeAttachment
);

// Category management
router.get('/categories/list',
  categoryController.getCategories
);

router.get('/categories/hierarchy',
  categoryController.getCategoryHierarchy
);

router.post('/categories',
  authenticate,
  authorize('admin'),
  validation.validate(validation.categoryCreation),
  categoryController.createCategory
);

router.put('/categories/:id',
  authenticate,
  authorize('admin'),
  validation.validate(validation.categoryUpdate),
  categoryController.updateCategory
);

router.delete('/categories/:id',
  authenticate,
  authorize('admin'),
  categoryController.deleteCategory
);

module.exports = router;
