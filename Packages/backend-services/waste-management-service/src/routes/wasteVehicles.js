const express = require('express');
const router = express.Router();

// GET /vehicles - Get all waste vehicles
router.get('/', (req, res) => {
  const { status, zone } = req.query;
  
  res.json({
    status: 'success',
    message: 'Waste vehicles endpoint',
    data: {
      vehicles: [
        {
          id: 'WV001',
          registrationNumber: 'GJ-01-AB-1234',
          type: 'compactor_truck',
          status: 'active',
          currentLocation: {
            latitude: 23.0225,
            longitude: 72.5714,
            address: 'Ahmedabad, Gujarat'
          },
          assignedZone: 'Zone-A',
          driverName: 'Rajesh Kumar'
        },
        {
          id: 'WV002',
          registrationNumber: 'GJ-01-CD-5678',
          type: 'side_loader',
          status: 'active',
          assignedZone: 'Zone-B',
          driverName: 'Suresh Patel'
        }
      ],
      totalVehicles: 2,
      filters: { status, zone }
    }
  });
});

// POST /vehicles - Add new vehicle
router.post('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Add new vehicle endpoint',
    data: { 
      id: 'WV003',
      status: 'active',
      message: 'Vehicle added successfully'
    }
  });
});

// GET /vehicles/:id - Get specific vehicle
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    status: 'success',
    message: `Get vehicle ${id}`,
    data: {
      id,
      registrationNumber: 'GJ-01-XY-9999',
      type: 'compactor_truck',
      status: 'active',
      capacity: 8.5,
      fuelType: 'diesel',
      assignedZone: 'Zone-A'
    }
  });
});

// GET /vehicles/:id/tracking - Get vehicle tracking info
router.get('/:id/tracking', (req, res) => {
  const { id } = req.params;
  res.json({
    status: 'success',
    message: `Tracking info for vehicle ${id}`,
    data: {
      vehicleId: id,
      currentLocation: {
        latitude: 23.0225,
        longitude: 72.5714,
        timestamp: new Date().toISOString()
      },
      isTracking: true,
      speed: 25,
      routeProgress: 65
    }
  });
});

// PUT /vehicles/:id/location - Update vehicle location
router.put('/:id/location', (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;
  
  res.json({
    status: 'success',
    message: `Location updated for vehicle ${id}`,
    data: {
      vehicleId: id,
      location: { latitude, longitude },
      updatedAt: new Date().toISOString()
    }
  });
});

// GET /vehicles/tracking/active - Get all active vehicle tracking
router.get('/tracking/active', (req, res) => {
  res.json({
    status: 'success',
    message: 'Active vehicle tracking',
    data: {
      activeVehicles: [
        {
          vehicleId: 'WV001',
          location: { latitude: 23.0225, longitude: 72.5714 },
          speed: 30,
          status: 'in_transit'
        },
        {
          vehicleId: 'WV002',
          location: { latitude: 23.0325, longitude: 72.5814 },
          speed: 0,
          status: 'collecting'
        }
      ],
      totalActive: 2
    }
  });
});

module.exports = router;
