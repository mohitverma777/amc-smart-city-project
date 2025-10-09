const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');

// Public routes (for dashboard/map display)
router.get('/utilities/overview', utilityController.getUtilitiesOverview);
router.get('/utilities/water', utilityController.getWaterSupply);
router.get('/utilities/waste', utilityController.getWasteCollection);
router.get('/utilities/streetlights', utilityController.getStreetLights);
router.get('/utilities/statistics', utilityController.getStatistics);

// Admin routes (future - add authentication middleware)
router.post('/utilities/water', utilityController.createWaterTank);
router.put('/utilities/water/:id', utilityController.updateWaterTank);
router.delete('/utilities/water/:id', utilityController.deleteWaterTank);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'utility-management-routes',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
