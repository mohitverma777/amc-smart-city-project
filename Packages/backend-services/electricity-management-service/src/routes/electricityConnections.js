const express = require('express');
const router = express.Router();
const electricityConnectionController = require('../controllers/electricityConnectionController');
const meterReadingController = require('../controllers/meterReadingController');
const electricityBillingController = require('../controllers/electricityBillingController');
const loadManagementController = require('../controllers/loadManagementController');
const smartMeterController = require('../controllers/smartMeterController');
const { authenticate, authorize } = require('@amc/shared/middleware/auth');
const validation = require('@amc/shared/middleware/validation');
const upload = require('../middleware/fileUpload');
const rateLimit = require('express-rate-limit');

// Rate limiting for connection applications
const connectionApplicationLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2, // Maximum 2 applications per day per IP
  message: {
    status: 'error',
    message: 'Too many connection applications. Please try again tomorrow.',
    code: 'CONNECTION_APPLICATION_LIMIT_EXCEEDED'
  }
});

// Electricity Connection Routes
router.post('/apply',
  authenticate,
  connectionApplicationLimit,
  validation.validate(validation.schemas.electricityConnectionApplication),
  electricityConnectionController.applyForConnection
);

router.get('/my-connections',
  authenticate,
  validation.validateQuery(validation.schemas.pagination),
  electricityConnectionController.getMyConnections
);

router.get('/statistics',
  authenticate,
  authorize('officer', 'admin'),
  electricityConnectionController.getElectricityStatistics
);

router.get('/:identifier',
  authenticate,
  electricityConnectionController.getConnection
);

router.patch('/:id/status',
  authenticate,
  authorize('officer', 'admin'),
  validation.validate(validation.schemas.connectionStatusUpdate),
  electricityConnectionController.updateConnectionStatus
);

// Meter Reading Routes
router.post('/:connectionId/readings',
  authenticate,
  upload.single('meterImage'),
  validation.validate(validation.schemas.meterReading),
  electricityConnectionController.addMeterReading
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
  electricityConnectionController.getConnectionBills
);

router.post('/:connectionId/generate-bill',
  authenticate,
  authorize('officer', 'admin'),
  electricityConnectionController.generateBill
);

router.post('/bulk-billing',
  authenticate,
  authorize('admin'),
  electricityBillingController.bulkBillGeneration
);

router.get('/bills/:billId/download',
  authenticate,
  electricityBillingController.downloadBill
);

// Smart Meter Routes
router.get('/smart-meters/overview',
  authenticate,
  authorize('officer', 'admin'),
  smartMeterController.getSmartMeterOverview
);

router.get('/smart-meters/:deviceId/realtime',
  authenticate,
  smartMeterController.getRealtimeData
);

router.get('/smart-meters/:deviceId/power-quality',
  authenticate,
  smartMeterController.getPowerQuality
);

router.get('/smart-meters/:deviceId/load-profile',
  authenticate,
  smartMeterController.getLoadProfile
);

router.post('/smart-meters/:deviceId/configure',
  authenticate,
  authorize('officer', 'admin'),
  smartMeterController.configureMeter
);

// Load Management Routes
router.get('/load-management/distribution',
  authenticate,
  authorize('officer', 'admin'),
  loadManagementController.getLoadDistribution
);

router.get('/load-management/forecast/:zone',
  authenticate,
  authorize('officer', 'admin'),
  loadManagementController.getDemandForecast
);

router.get('/load-management/stability',
  authenticate,
  authorize('officer', 'admin'),
  loadManagementController.getGridStability
);

router.post('/load-management/shed-load',
  authenticate,
  authorize('admin'),
  loadManagementController.implementLoadShedding
);

router.get('/load-management/violations',
  authenticate,
  authorize('officer', 'admin'),
  loadManagementController.getLoadViolations
);

// Power Outage Management
router.get('/outages/current',
  authenticate,
  loadManagementController.getCurrentOutages
);

router.post('/outages/report',
  authenticate,
  validation.validate(validation.schemas.outageReport),
  loadManagementController.reportOutage
);

router.patch('/outages/:outageId/update',
  authenticate,
  authorize('officer', 'admin'),
  loadManagementController.updateOutage
);

// Analytics and Reporting
router.get('/analytics/consumption-trends',
  authenticate,
  authorize('officer', 'admin'),
  electricityConnectionController.getConsumptionTrends
);

router.get('/analytics/revenue-report',
  authenticate,
  authorize('officer', 'admin'),
  electricityBillingController.getRevenueReport
);

router.get('/analytics/energy-efficiency',
  authenticate,
  authorize('officer', 'admin'),
  electricityConnectionController.getEnergyEfficiencyReport
);

router.get('/analytics/carbon-emissions',
  authenticate,
  authorize('officer', 'admin'),
  electricityConnectionController.getCarbonEmissionsReport
);

module.exports = router;
