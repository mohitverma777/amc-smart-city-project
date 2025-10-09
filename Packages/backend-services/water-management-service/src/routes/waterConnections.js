const express = require('express');
const router = express.Router();
const waterConnectionController = require('../controllers/waterConnectionController');
const meterReadingController = require('../controllers/meterReadingController');
const waterQualityController = require('../controllers/waterQualityController');
const { authenticate, authorize } = require('@amc/shared/middleware/auth');
const validation = require('@amc/shared/middleware/validation');
const upload = require('../middleware/fileUpload');
const rateLimit = require('express-rate-limit');

// Rate limiting for connection applications
const connectionApplicationLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Maximum 3 applications per day per IP
  message: {
    status: 'error',
    message: 'Too many connection applications. Please try again tomorrow.',
    code: 'CONNECTION_APPLICATION_LIMIT_EXCEEDED'
  }
});

// Water Connection Routes
router.post('/apply',
  authenticate,
  connectionApplicationLimit,
  validation.validate(validation.schemas.waterConnectionApplication),
  waterConnectionController.applyForConnection
);

router.get('/my-connections',
  authenticate,
  validation.validateQuery(validation.schemas.pagination),
  waterConnectionController.getMyConnections
);

router.get('/statistics',
  authenticate,
  authorize('officer', 'admin'),
  waterConnectionController.getConnectionStatistics
);

router.get('/:identifier',
  authenticate,
  waterConnectionController.getConnection
);

router.patch('/:id/status',
  authenticate,
  authorize('officer', 'admin'),
  validation.validate(validation.schemas.connectionStatusUpdate),
  waterConnectionController.updateConnectionStatus
);

// Meter Reading Routes
router.post('/:connectionId/readings',
  authenticate,
  upload.single('meterImage'),
  validation.validate(validation.schemas.meterReading),
  waterConnectionController.addMeterReading
);

router.get('/:connectionId/readings',
  authenticate,
  validation.validateQuery(validation.schemas.readingsQuery),
  meterReadingController.getConnectionReadings
);

router.patch('/readings/:readingId/validate',
  authenticate,
  authorize('officer', 'admin'),
  meterReadingController.validateReading
);

router.get('/readings/pending-validation',
  authenticate,
  authorize('officer', 'admin'),
  meterReadingController.getPendingValidation
);

// Billing Routes
router.get('/:connectionId/bills',
  authenticate,
  validation.validateQuery(validation.schemas.billsQuery),
  waterConnectionController.getConnectionBills
);

router.post('/:connectionId/generate-bill',
  authenticate,
  authorize('officer', 'admin'),
  waterConnectionController.generateBill
);

router.post('/bulk-billing',
  authenticate,
  authorize('admin'),
  waterConnectionController.bulkBillGeneration
);

// Water Quality Routes
router.get('/quality/locations',
  authenticate,
  waterQualityController.getQualityLocations
);

router.get('/quality/trends',
  authenticate,
  validation.validateQuery(validation.schemas.qualityTrendsQuery),
  waterQualityController.getQualityTrends
);

router.post('/quality/report',
  authenticate,
  authorize('officer', 'admin'),
  validation.validate(validation.schemas.waterQualityReport),
  waterQualityController.submitQualityReport
);

router.get('/quality/alerts',
  authenticate,
  authorize('officer', 'admin'),
  waterQualityController.getQualityAlerts
);

module.exports = router;
