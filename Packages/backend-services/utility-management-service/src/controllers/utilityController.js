const db = require('../models');
const { Op } = require('sequelize');

class UtilityController {
  // Get complete overview of all utilities
  async getUtilitiesOverview(req, res) {
    try {
      console.log('📊 Fetching utilities overview...');
      
      const [water, waste, streetlights] = await Promise.all([
        db.WaterTank.findAll({
          where: { isActive: true },
          order: [['zone', 'ASC']]
        }),
        db.WasteBin.findAll({
          where: { isActive: true },
          order: [['zone', 'ASC']]
        }),
        db.StreetLight.findAll({
          where: { isActive: true },
          order: [['zone', 'ASC']]
        })
      ]);

      console.log(`✅ Found ${water.length} water tanks, ${waste.length} waste bins, ${streetlights.length} street lights`);

      res.json({
        success: true,
        data: {
          water,
          waste,
          streetlights,
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Error fetching utilities overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch utilities overview',
        error: error.message
      });
    }
  }

  // Get water supply data
  async getWaterSupply(req, res) {
    try {
      const waterTanks = await db.WaterTank.findAll({
        where: { isActive: true },
        order: [['zone', 'ASC']],
        attributes: [
          'id',
          'zone',
          'location',
          'capacity',
          'currentLevel',
          'latitude',
          'longitude',
          'lastRefill',
          'status',
          'updatedAt'
        ]
      });

      // Calculate percentage for each tank
      const waterData = waterTanks.map(tank => ({
        id: tank.id,
        zone: tank.zone,
        location: tank.location,
        level: Math.round((tank.currentLevel / tank.capacity) * 100),
        capacity: tank.capacity,
        currentLevel: tank.currentLevel,
        latitude: parseFloat(tank.latitude),
        longitude: parseFloat(tank.longitude),
        lastRefill: tank.lastRefill,
        status: tank.status,
        updatedAt: tank.updatedAt
      }));

      res.json({
        success: true,
        data: waterData
      });
    } catch (error) {
      console.error('❌ Error fetching water supply:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch water supply data',
        error: error.message
      });
    }
  }

  // Get waste collection data
  async getWasteCollection(req, res) {
    try {
      const wasteBins = await db.WasteBin.findAll({
        where: { isActive: true },
        order: [['zone', 'ASC']],
        attributes: [
          'id',
          'zone',
          'location',
          'capacity',
          'currentFill',
          'latitude',
          'longitude',
          'lastCollection',
          'status',
          'updatedAt'
        ]
      });

      // Calculate fill percentage
      const wasteData = wasteBins.map(bin => ({
        id: bin.id,
        zone: bin.zone,
        location: bin.location,
        fill: Math.round((bin.currentFill / bin.capacity) * 100),
        capacity: bin.capacity,
        currentFill: bin.currentFill,
        latitude: parseFloat(bin.latitude),
        longitude: parseFloat(bin.longitude),
        lastCollection: bin.lastCollection,
        status: bin.status,
        updatedAt: bin.updatedAt
      }));

      res.json({
        success: true,
        data: wasteData
      });
    } catch (error) {
      console.error('❌ Error fetching waste collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch waste collection data',
        error: error.message
      });
    }
  }

  // Get street lights data
  async getStreetLights(req, res) {
    try {
      const streetLights = await db.StreetLight.findAll({
        where: { isActive: true },
        order: [['zone', 'ASC']],
        attributes: [
          'id',
          'zone',
          'location',
          'totalLights',
          'workingLights',
          'latitude',
          'longitude',
          'lastMaintenance',
          'status',
          'updatedAt'
        ]
      });

      const lightsData = streetLights.map(light => ({
        id: light.id,
        zone: light.zone,
        location: light.location,
        total: light.totalLights,
        working: light.workingLights,
        latitude: parseFloat(light.latitude),
        longitude: parseFloat(light.longitude),
        lastMaintenance: light.lastMaintenance,
        status: light.status,
        efficiency: Math.round((light.workingLights / light.totalLights) * 100),
        updatedAt: light.updatedAt
      }));

      res.json({
        success: true,
        data: lightsData
      });
    } catch (error) {
      console.error('❌ Error fetching street lights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch street lights data',
        error: error.message
      });
    }
  }

  // Get statistics
  async getStatistics(req, res) {
    try {
      const [waterTanks, wasteBins, streetLights] = await Promise.all([
        db.WaterTank.findAll({ where: { isActive: true } }),
        db.WasteBin.findAll({ where: { isActive: true } }),
        db.StreetLight.findAll({ where: { isActive: true } })
      ]);

      // Calculate water statistics
      const waterStats = {
        avgLevel: 0,
        critical: 0,
        normal: 0
      };

      if (waterTanks.length > 0) {
        const levels = waterTanks.map(tank => (tank.currentLevel / tank.capacity) * 100);
        waterStats.avgLevel = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
        waterStats.critical = waterTanks.filter(tank => (tank.currentLevel / tank.capacity) < 0.3).length;
        waterStats.normal = waterTanks.filter(tank => (tank.currentLevel / tank.capacity) >= 0.7).length;
      }

      // Calculate waste statistics
      const wasteStats = {
        avgFill: 0,
        needsCollection: 0,
        normal: 0
      };

      if (wasteBins.length > 0) {
        const fills = wasteBins.map(bin => (bin.currentFill / bin.capacity) * 100);
        wasteStats.avgFill = Math.round(fills.reduce((a, b) => a + b, 0) / fills.length);
        wasteStats.needsCollection = wasteBins.filter(bin => (bin.currentFill / bin.capacity) > 0.8).length;
        wasteStats.normal = wasteBins.filter(bin => (bin.currentFill / bin.capacity) < 0.5).length;
      }

      // Calculate lights statistics
      const lightStats = {
        totalLights: 0,
        workingLights: 0,
        efficiency: 0
      };

      if (streetLights.length > 0) {
        lightStats.totalLights = streetLights.reduce((sum, light) => sum + light.totalLights, 0);
        lightStats.workingLights = streetLights.reduce((sum, light) => sum + light.workingLights, 0);
        lightStats.efficiency = Math.round((lightStats.workingLights / lightStats.totalLights) * 100);
      }

      res.json({
        success: true,
        data: {
          water: waterStats,
          waste: wasteStats,
          lights: lightStats
        }
      });
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  // Create water tank
  async createWaterTank(req, res) {
    try {
      const waterTank = await db.WaterTank.create(req.body);
      res.status(201).json({
        success: true,
        data: waterTank,
        message: 'Water tank created successfully'
      });
    } catch (error) {
      console.error('❌ Error creating water tank:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create water tank',
        error: error.message
      });
    }
  }

  // Update water tank
  async updateWaterTank(req, res) {
    try {
      const { id } = req.params;
      const [updated] = await db.WaterTank.update(req.body, {
        where: { id }
      });

      if (updated) {
        const updatedTank = await db.WaterTank.findByPk(id);
        res.json({
          success: true,
          data: updatedTank,
          message: 'Water tank updated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Water tank not found'
        });
      }
    } catch (error) {
      console.error('❌ Error updating water tank:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update water tank',
        error: error.message
      });
    }
  }

  // Delete water tank
  async deleteWaterTank(req, res) {
    try {
      const { id } = req.params;
      const deleted = await db.WaterTank.update(
        { isActive: false },
        { where: { id } }
      );

      if (deleted) {
        res.json({
          success: true,
          message: 'Water tank deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Water tank not found'
        });
      }
    } catch (error) {
      console.error('❌ Error deleting water tank:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete water tank',
        error: error.message
      });
    }
  }
}

module.exports = new UtilityController();
