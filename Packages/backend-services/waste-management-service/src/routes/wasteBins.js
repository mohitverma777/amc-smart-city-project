const express = require('express');
const router = express.Router();

// GET /bins - Get all waste bins
router.get('/', (req, res) => {
  const { ward, zone, status } = req.query;
  
  res.json({
    status: 'success',
    message: 'Waste bins endpoint',
    data: {
      bins: [
        {
          id: 'WB001',
          location: 'Main Street, Ward 1',
          fillLevel: 75,
          status: 'active',
          lastCollection: '2025-09-24T06:00:00Z'
        },
        {
          id: 'WB002', 
          location: 'Park Avenue, Ward 1',
          fillLevel: 45,
          status: 'active',
          lastCollection: '2025-09-23T06:00:00Z'
        }
      ],
      totalBins: 2,
      filters: { ward, zone, status }
    }
  });
});

// POST /bins - Add new bin
router.post('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Add new waste bin endpoint',
    data: { 
      id: 'WB003',
      status: 'active',
      message: 'Waste bin added successfully'
    }
  });
});

// GET /bins/:id - Get specific bin
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    status: 'success',
    message: `Get waste bin ${id}`,
    data: {
      id,
      location: 'Sample Location',
      fillLevel: 60,
      status: 'active',
      capacity: 120,
      type: 'mixed_waste'
    }
  });
});

// PUT /bins/:id/fill-level - Update bin fill level
router.put('/:id/fill-level', (req, res) => {
  const { id } = req.params;
  const { fillLevel } = req.body;
  
  res.json({
    status: 'success',
    message: `Fill level updated for bin ${id}`,
    data: {
      id,
      fillLevel: fillLevel || 75,
      updatedAt: new Date().toISOString()
    }
  });
});

// GET /bins/overflow/alerts - Get overflow alerts
router.get('/overflow/alerts', (req, res) => {
  res.json({
    status: 'success',
    message: 'Overflow alerts',
    data: {
      alerts: [
        {
          binId: 'WB001',
          location: 'Main Street',
          fillLevel: 95,
          alertTime: new Date().toISOString(),
          severity: 'high'
        }
      ],
      totalAlerts: 1
    }
  });
});

module.exports = router;
