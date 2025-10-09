const db = require('../models');

class UtilityService {
  // Get all active utilities
  async getAllUtilities() {
    try {
      const [water, waste, streetlights] = await Promise.all([
        db.WaterTank.findAll({ where: { isActive: true } }),
        db.WasteBin.findAll({ where: { isActive: true } }),
        db.StreetLight.findAll({ where: { isActive: true } })
      ]);

      return {
        success: true,
        data: { water, waste, streetlights }
      };
    } catch (error) {
      console.error('Error fetching utilities:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Calculate utility statistics
  async calculateStatistics() {
    try {
      const utilities = await this.getAllUtilities();
      
      if (!utilities.success) {
        throw new Error('Failed to fetch utilities');
      }

      const { water, waste, streetlights } = utilities.data;

      // Water statistics
      const waterStats = {
        total: water.length,
        avgLevel: 0,
        critical: 0,
        normal: 0
      };

      if (water.length > 0) {
        const levels = water.map(tank => (tank.currentLevel / tank.capacity) * 100);
        waterStats.avgLevel = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
        waterStats.critical = water.filter(tank => (tank.currentLevel / tank.capacity) < 0.3).length;
        waterStats.normal = water.filter(tank => (tank.currentLevel / tank.capacity) >= 0.7).length;
      }

      // Waste statistics
      const wasteStats = {
        total: waste.length,
        avgFill: 0,
        needsCollection: 0,
        normal: 0
      };

      if (waste.length > 0) {
        const fills = waste.map(bin => (bin.currentFill / bin.capacity) * 100);
        wasteStats.avgFill = Math.round(fills.reduce((a, b) => a + b, 0) / fills.length);
        wasteStats.needsCollection = waste.filter(bin => (bin.currentFill / bin.capacity) > 0.8).length;
        wasteStats.normal = waste.filter(bin => (bin.currentFill / bin.capacity) < 0.5).length;
      }

      // Street lights statistics
      const lightStats = {
        total: streetlights.length,
        totalLights: streetlights.reduce((sum, light) => sum + light.totalLights, 0),
        workingLights: streetlights.reduce((sum, light) => sum + light.workingLights, 0),
        efficiency: 0
      };

      if (lightStats.totalLights > 0) {
        lightStats.efficiency = Math.round((lightStats.workingLights / lightStats.totalLights) * 100);
      }

      return {
        success: true,
        data: {
          water: waterStats,
          waste: wasteStats,
          lights: lightStats
        }
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update utility data (for simulation)
  async updateUtilityData() {
    try {
      // Simulate water level changes
      const waterTanks = await db.WaterTank.findAll({ where: { isActive: true } });
      for (const tank of waterTanks) {
        const change = Math.floor(Math.random() * 200) - 100; // -100 to +100
        const newLevel = Math.max(0, Math.min(tank.capacity, tank.currentLevel + change));
        await tank.update({ currentLevel: newLevel });
      }

      // Simulate waste bin fill changes
      const wasteBins = await db.WasteBin.findAll({ where: { isActive: true } });
      for (const bin of wasteBins) {
        const change = Math.floor(Math.random() * 50); // 0 to +50
        const newFill = Math.min(bin.capacity, bin.currentFill + change);
        await bin.update({ currentFill: newFill });
      }

      // Simulate street light changes (occasionally)
      const streetLights = await db.StreetLight.findAll({ where: { isActive: true } });
      for (const light of streetLights) {
        if (Math.random() < 0.1) { // 10% chance
          const change = Math.floor(Math.random() * 3) - 1; // -1 to +1
          const newWorking = Math.max(0, Math.min(light.totalLights, light.workingLights + change));
          await light.update({ workingLights: newWorking });
        }
      }

      return {
        success: true,
        message: 'Utility data updated successfully'
      };
    } catch (error) {
      console.error('Error updating utility data:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new UtilityService();
