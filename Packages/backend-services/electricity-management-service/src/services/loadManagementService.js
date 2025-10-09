const { ElectricityConnection, LoadManagement } = require('../models');
const GridAnalytics = require('../models/GridAnalytics');
const logger = require('@amc/shared/utils/logger');
const { Op } = require('sequelize');
const Decimal = require('decimal.js');

class LoadManagementService {
  constructor() {
    this.zoneCapacities = new Map();
    this.loadAlerts = new Map();
    this.demandForecasts = new Map();
  }

  // Check load availability in a zone
  async checkLoadAvailability(ward, zone, requestedLoad) {
    try {
      // Get zone capacity
      const zoneCapacity = await this.getZoneCapacity(zone);
      
      // Calculate current allocated load
      const currentLoad = await this.getCurrentAllocatedLoad(zone);
      
      // Calculate available capacity
      const availableCapacity = new Decimal(zoneCapacity.totalCapacity)
        .minus(new Decimal(currentLoad))
        .toNumber();
      
      const requestedLoadDecimal = new Decimal(requestedLoad);
      
      if (requestedLoadDecimal.greaterThan(availableCapacity)) {
        return {
          available: false,
          requestedLoad: requestedLoad,
          availableCapacity,
          totalCapacity: zoneCapacity.totalCapacity,
          currentLoad,
          reason: 'Insufficient capacity in zone'
        };
      }
      
      // Check transformer capacity at ward level
      const wardCapacity = await this.getWardCapacity(ward);
      const wardCurrentLoad = await this.getCurrentAllocatedLoad(ward, 'ward');
      const wardAvailable = new Decimal(wardCapacity.totalCapacity)
        .minus(new Decimal(wardCurrentLoad))
        .toNumber();
      
      if (requestedLoadDecimal.greaterThan(wardAvailable)) {
        return {
          available: false,
          requestedLoad: requestedLoad,
          availableCapacity: wardAvailable,
          totalCapacity: wardCapacity.totalCapacity,
          currentLoad: wardCurrentLoad,
          reason: 'Insufficient capacity in ward'
        };
      }
      
      return {
        available: true,
        requestedLoad: requestedLoad,
        availableCapacity,
        zoneCapacity: zoneCapacity.totalCapacity,
        wardCapacity: wardCapacity.totalCapacity
      };
      
    } catch (error) {
      logger.error('Failed to check load availability:', error);
      throw error;
    }
  }

  // Reserve load for a connection
  async reserveLoad(ward, zone, sanctionedLoad, connectionId) {
    try {
      // Create load management record
      const loadRecord = await LoadManagement.create({
        connectionId,
        ward,
        zone,
        sanctionedLoad,
        currentUtilization: 0,
        status: 'reserved',
        reservedDate: new Date()
      });

      // Update zone and ward load tracking
      await this.updateLoadTracking(zone, 'zone', sanctionedLoad, 'reserve');
      await this.updateLoadTracking(ward, 'ward', sanctionedLoad, 'reserve');

      logger.info('Load reserved successfully', {
        connectionId,
        ward,
        zone,
        sanctionedLoad
      });

      return loadRecord;

    } catch (error) {
      logger.error('Failed to reserve load:', error);
      throw error;
    }
  }

  // Update load utilization
  async updateLoadUtilization(connectionId, currentDemand) {
    try {
      const loadRecord = await LoadManagement.findOne({
        where: { connectionId }
      });

      if (!loadRecord) {
        logger.warn(`No load record found for connection: ${connectionId}`);
        return;
      }

      const utilizationPercentage = new Decimal(currentDemand)
        .dividedBy(new Decimal(loadRecord.sanctionedLoad))
        .times(100)
        .toNumber();

      await loadRecord.update({
        currentUtilization: utilizationPercentage,
        peakDemand: Math.max(loadRecord.peakDemand || 0, currentDemand),
        lastUpdated: new Date()
      });

      // Check for load violations
      if (currentDemand > loadRecord.sanctionedLoad * 1.1) { // 10% tolerance
        await this.handleLoadViolation(connectionId, currentDemand, loadRecord.sanctionedLoad);
      }

      return loadRecord;

    } catch (error) {
      logger.error('Failed to update load utilization:', error);
      throw error;
    }
  }

  // Get zone capacity information
  async getZoneCapacity(zone) {
    try {
      // In a real implementation, this would fetch from transformer/feeder data
      const zoneCapacities = {
        'Zone-A': { totalCapacity: 10000, transformers: 5 }, // 10 MW
        'Zone-B': { totalCapacity: 8000, transformers: 4 },  // 8 MW
        'Zone-C': { totalCapacity: 12000, transformers: 6 }, // 12 MW
        'Zone-D': { totalCapacity: 6000, transformers: 3 }   // 6 MW
      };

      return zoneCapacities[zone] || { totalCapacity: 5000, transformers: 2 };

    } catch (error) {
      logger.error('Failed to get zone capacity:', error);
      throw error;
    }
  }

  // Get ward capacity information
  async getWardCapacity(ward) {
    try {
      // Ward capacity is typically 20-30% of zone capacity
      const wardCapacities = {
        'Ward-1': { totalCapacity: 2000 },
        'Ward-2': { totalCapacity: 1800 },
        'Ward-3': { totalCapacity: 2200 },
        'Ward-4': { totalCapacity: 1600 },
        'Ward-5': { totalCapacity: 2400 }
      };

      return wardCapacities[ward] || { totalCapacity: 1500 };

    } catch (error) {
      logger.error('Failed to get ward capacity:', error);
      throw error;
    }
  }

  // Calculate current allocated load
  async getCurrentAllocatedLoad(area, type = 'zone') {
    try {
      const whereClause = type === 'zone' ? { zone: area } : { ward: area };
      
      const result = await ElectricityConnection.sum('sanctionedLoad', {
        where: {
          ...whereClause,
          status: { [Op.in]: ['active', 'connected'] }
        }
      });

      return result || 0;

    } catch (error) {
      logger.error('Failed to calculate current allocated load:', error);
      throw error;
    }
  }

  // Update load tracking records
  async updateLoadTracking(area, type, load, operation) {
    try {
      // Store load tracking data in MongoDB for analytics
      const loadData = new GridAnalytics({
        area,
        type,
        operation,
        load,
        timestamp: new Date(),
        metadata: {
          source: 'load_management_service',
          operation
        }
      });

      await loadData.save();

    } catch (error) {
      logger.error('Failed to update load tracking:', error);
    }
  }

  // Handle load violations
  async handleLoadViolation(connectionId, currentDemand, sanctionedLoad) {
    try {
      const connection = await ElectricityConnection.findByPk(connectionId);
      
      if (!connection) return;

      const violationPercentage = ((currentDemand - sanctionedLoad) / sanctionedLoad) * 100;

      // Create violation record
      const violation = {
        connectionId,
        customerCitizenId: connection.customerCitizenId,
        sanctionedLoad,
        actualDemand: currentDemand,
        violationPercentage,
        timestamp: new Date(),
        status: 'detected'
      };

      // Store violation
      await this.storeLoadViolation(violation);

      // Send alert if violation is significant (>20%)
      if (violationPercentage > 20) {
        await this.sendLoadViolationAlert(connection, violation);
      }

      logger.warn('Load violation detected', {
        connectionId,
        connectionNumber: connection.connectionNumber,
        sanctionedLoad,
        actualDemand: currentDemand,
        violationPercentage
      });

    } catch (error) {
      logger.error('Failed to handle load violation:', error);
    }
  }

  // Store load violation
  async storeLoadViolation(violation) {
    try {
      const violationData = new GridAnalytics({
        area: 'load_violation',
        type: 'violation',
        data: violation,
        timestamp: new Date()
      });

      await violationData.save();

    } catch (error) {
      logger.error('Failed to store load violation:', error);
    }
  }

  // Send load violation alert
  async sendLoadViolationAlert(connection, violation) {
    try {
      // Integration with notification service
      const alertData = {
        recipientId: connection.customerCitizenId,
        type: 'load_violation',
        title: 'Load Limit Exceeded',
        message: `Your electricity consumption has exceeded the sanctioned load limit by ${violation.violationPercentage.toFixed(1)}%`,
        priority: 'high',
        metadata: {
          connectionId: connection.id,
          connectionNumber: connection.connectionNumber,
          violation
        }
      };

      // Implementation would call notification service API
      logger.info('Load violation alert sent', {
        connectionId: connection.id,
        violation: violation.violationPercentage
      });

    } catch (error) {
      logger.error('Failed to send load violation alert:', error);
    }
  }

  // Get load distribution analytics
  async getLoadDistributionAnalytics(zone = null) {
    try {
      const where = { status: 'active' };
      if (zone) where.zone = zone;

      const distribution = await ElectricityConnection.findAll({
        attributes: [
          'connectionType',
          'zone',
          'ward',
          [sequelize.fn('COUNT', sequelize.col('id')), 'connectionCount'],
          [sequelize.fn('SUM', sequelize.col('sanctionedLoad')), 'totalLoad'],
          [sequelize.fn('AVG', sequelize.col('sanctionedLoad')), 'avgLoad'],
          [sequelize.fn('SUM', sequelize.col('currentLoad')), 'currentUtilization']
        ],
        where,
        group: ['connectionType', 'zone', 'ward'],
        order: [['zone', 'ASC'], ['ward', 'ASC']]
      });

      return distribution;

    } catch (error) {
      logger.error('Failed to get load distribution analytics:', error);
      throw error;
    }
  }

  // Forecast demand based on historical data
  async forecastDemand(zone, days = 30) {
    try {
      // Get historical consumption data
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const historicalData = await GridAnalytics.find({
        area: zone,
        type: 'consumption',
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });

      if (historicalData.length === 0) {
        return { forecast: 0, confidence: 0, trend: 'stable' };
      }

      // Simple moving average forecast (in production, use advanced ML models)
      const recent7Days = historicalData.slice(-7);
      const avgRecent = recent7Days.reduce((sum, data) => sum + data.load, 0) / recent7Days.length;
      
      const previous7Days = historicalData.slice(-14, -7);
      const avgPrevious = previous7Days.length > 0 ? 
        previous7Days.reduce((sum, data) => sum + data.load, 0) / previous7Days.length : avgRecent;

      const trendPercentage = ((avgRecent - avgPrevious) / avgPrevious) * 100;
      let trend = 'stable';
      if (trendPercentage > 5) trend = 'increasing';
      else if (trendPercentage < -5) trend = 'decreasing';

      const forecast = avgRecent * (1 + (trendPercentage / 100));
      const confidence = Math.min(100, (historicalData.length / days) * 100);

      return {
        forecast,
        confidence,
        trend,
        trendPercentage,
        historicalAverage: avgRecent
      };

    } catch (error) {
      logger.error('Failed to forecast demand:', error);
      throw error;
    }
  }

  // Monitor grid stability
  async monitorGridStability() {
    try {
      const zones = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D'];
      const stability = [];

      for (const zone of zones) {
        const capacity = await this.getZoneCapacity(zone);
        const currentLoad = await this.getCurrentAllocatedLoad(zone);
        const utilizationPercentage = (currentLoad / capacity.totalCapacity) * 100;
        
        let status = 'stable';
        if (utilizationPercentage > 90) status = 'critical';
        else if (utilizationPercentage > 80) status = 'warning';
        else if (utilizationPercentage > 70) status = 'monitor';

        stability.push({
          zone,
          capacity: capacity.totalCapacity,
          currentLoad,
          utilizationPercentage,
          status,
          availableCapacity: capacity.totalCapacity - currentLoad
        });
      }

      // Store stability metrics
      for (const zoneStability of stability) {
        await this.storeStabilityMetrics(zoneStability);
      }

      return stability;

    } catch (error) {
      logger.error('Failed to monitor grid stability:', error);
      throw error;
    }
  }

  // Store stability metrics
  async storeStabilityMetrics(metrics) {
    try {
      const stabilityData = new GridAnalytics({
        area: metrics.zone,
        type: 'stability',
        data: metrics,
        timestamp: new Date()
      });

      await stabilityData.save();

    } catch (error) {
      logger.error('Failed to store stability metrics:', error);
    }
  }

  // Handle load shedding during peak demand
  async managePeakLoad() {
    try {
      const stability = await this.monitorGridStability();
      const criticalZones = stability.filter(zone => zone.status === 'critical');

      for (const zone of criticalZones) {
        logger.warn(`Critical load in ${zone.zone}: ${zone.utilizationPercentage}%`);
        
        // Implement load shedding logic
        await this.implementLoadShedding(zone.zone, zone.utilizationPercentage);
      }

      return {
        totalZones: stability.length,
        criticalZones: criticalZones.length,
        loadSheddingImplemented: criticalZones.length > 0
      };

    } catch (error) {
      logger.error('Failed to manage peak load:', error);
      throw error;
    }
  }

  // Implement load shedding (placeholder - would integrate with SCADA systems)
  async implementLoadShedding(zone, utilizationPercentage) {
    try {
      // Priority-based load shedding
      const sheddingPriority = [
        'street_light',
        'commercial',
        'industrial',
        'institutional',
        'domestic'
      ];

      logger.info(`Implementing load shedding in ${zone}`, {
        utilization: utilizationPercentage,
        priority: sheddingPriority
      });

      // In production, this would communicate with SCADA/DMS systems
      // to actually control circuit breakers and switches

      // Store load shedding event
      const sheddingEvent = new GridAnalytics({
        area: zone,
        type: 'load_shedding',
        data: {
          utilizationPercentage,
          priority: sheddingPriority,
          timestamp: new Date(),
          reason: 'peak_load_management'
        },
        timestamp: new Date()
      });

      await sheddingEvent.save();

    } catch (error) {
      logger.error('Failed to implement load shedding:', error);
    }
  }
}

module.exports = new LoadManagementService();
