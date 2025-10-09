const { 
  WasteCollectionSchedule, 
  WasteVehicle, 
  WasteBin, 
  WasteCollectionRecord, 
  sequelize 
} = require('../models');
const vehicleTrackingService = require('../services/vehicleTrackingService');
const routeOptimizationService = require('../services/routeOptimizationService');
const notificationService = require('../services/notificationService');
const logger = require('@amc/shared/utils/logger');
const { catchAsync } = require('@amc/shared/middleware/errorHandler');
const { Op } = require('sequelize');

class WasteCollectionController {
  // Create new collection schedule
  createSchedule = catchAsync(async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        routeName,
        routeId,
        ward,
        zone,
        area,
        wasteType,
        collectionFrequency,
        scheduledDays,
        startTime,
        endTime,
        vehicleId,
        driverAssigned,
        crewMembers,
        collectionPoints,
        estimatedWasteQuantity
      } = req.body;

      // Validate vehicle availability
      const vehicle = await WasteVehicle.findOne({
        where: { vehicleId, status: 'active' }
      });

      if (!vehicle) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Vehicle not available or not found',
          code: 'VEHICLE_NOT_AVAILABLE'
        });
      }

      // Check if vehicle can handle the waste type
      if (!vehicle.wasteTypesHandled.includes(wasteType)) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: `Vehicle cannot handle ${wasteType} waste`,
          code: 'INCOMPATIBLE_WASTE_TYPE'
        });
      }

      // Validate collection points and optimize route
      const optimizedPoints = await routeOptimizationService.optimizeRoute(
        collectionPoints,
        vehicle.currentLocation
      );

      const scheduleData = {
        routeName,
        routeId,
        ward,
        zone,
        area,
        wasteType,
        collectionFrequency,
        scheduledDays,
        startTime,
        endTime,
        vehicleId,
        driverAssigned,
        crewMembers,
        collectionPoints: optimizedPoints,
        estimatedWasteQuantity,
        scheduledDate: new Date(),
        estimatedDuration: optimizedPoints.length * 15 // 15 minutes per point
      };

      const schedule = await WasteCollectionSchedule.create(scheduleData, { transaction });

      await transaction.commit();

      // Send notifications to crew
      try {
        await notificationService.sendScheduleNotification(
          driverAssigned,
          crewMembers,
          schedule
        );
      } catch (notificationError) {
        logger.error('Failed to send schedule notification:', notificationError);
      }

      res.status(201).json({
        status: 'success',
        message: 'Collection schedule created successfully',
        data: {
          schedule,
          optimizedRoute: {
            totalPoints: optimizedPoints.length,
            estimatedDuration: schedule.estimatedDuration,
            estimatedDistance: optimizedPoints.reduce((sum, point) => sum + (point.distanceFromPrevious || 0), 0)
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Get collection schedules
  getSchedules = catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      date,
      ward,
      zone,
      wasteType,
      status,
      vehicleId
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (date) {
      const targetDate = new Date(date);
      where.scheduledDate = {
        [Op.gte]: new Date(targetDate.setHours(0, 0, 0, 0)),
        [Op.lt]: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }

    if (ward) where.ward = ward;
    if (zone) where.zone = zone;
    if (wasteType) where.wasteType = wasteType;
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;

    const { count, rows } = await WasteCollectionSchedule.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['scheduledDate', 'DESC'], ['startTime', 'ASC']],
      include: [
        { 
          association: 'vehicle',
          attributes: ['vehicleId', 'registrationNumber', 'vehicleType', 'status']
        },
        {
          association: 'records',
          limit: 5,
          order: [['collectionDate', 'DESC']]
        }
      ]
    });

    // Add real-time tracking data for active schedules
    const schedulesWithTracking = await Promise.all(
      rows.map(async (schedule) => {
        const scheduleData = schedule.toJSON();
        
        if (schedule.status === 'in_progress') {
          try {
            const trackingData = await vehicleTrackingService.getVehicleLocation(schedule.vehicleId);
            scheduleData.realTimeTracking = trackingData;
          } catch (trackingError) {
            logger.warn('Failed to get vehicle tracking data:', trackingError);
          }
        }
        
        return scheduleData;
      })
    );

    res.json({
      status: 'success',
      data: {
        schedules: schedulesWithTracking,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalCount: count,
          limit: parseInt(limit)
        }
      }
    });
  });

  // Start collection
  startCollection = catchAsync(async (req, res) => {
    const { scheduleId } = req.params;
    const { actualStartTime, crewPresent, vehicleCondition } = req.body;

    const schedule = await WasteCollectionSchedule.findByPk(scheduleId, {
      include: [{ association: 'vehicle' }]
    });

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found',
        code: 'SCHEDULE_NOT_FOUND'
      });
    }

    if (schedule.status !== 'scheduled') {
      return res.status(400).json({
        status: 'error',
        message: 'Collection can only be started for scheduled collections',
        code: 'INVALID_STATUS'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Update schedule status
      await schedule.startCollection(actualStartTime ? new Date(actualStartTime) : null);

      // Create initial collection record
      const initialRecord = await WasteCollectionRecord.create({
        scheduleId: schedule.id,
        vehicleId: schedule.vehicleId,
        collectionDate: new Date(),
        collectionTime: new Date().toTimeString().slice(0, 8),
        collectionLocation: schedule.collectionPoints || {},
        ward: schedule.ward,
        zone: schedule.zone,
        wasteType: schedule.wasteType,
        wasteCategory: this.getWasteCategoryFromType(schedule.wasteType),
        collectionMethod: 'manual',
        crewMembers: crewPresent || schedule.crewMembers,
        driverName: schedule.driverAssigned,
        actualWeight: 0,
        status: 'in_transit'
      }, { transaction });

      // Start real-time tracking
      await vehicleTrackingService.startTracking(schedule.vehicleId, {
        scheduleId: schedule.id,
        route: schedule.collectionPoints,
        startTime: schedule.actualStartTime
      });

      await transaction.commit();

      // Send real-time notifications
      try {
        await notificationService.sendCollectionStartNotification(schedule);
      } catch (notificationError) {
        logger.error('Failed to send collection start notification:', notificationError);
      }

      res.json({
        status: 'success',
        message: 'Collection started successfully',
        data: {
          schedule,
          initialRecord,
          trackingEnabled: true
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Update collection progress
  updateProgress = catchAsync(async (req, res) => {
    const { scheduleId } = req.params;
    const { 
      collectedPoints, 
      currentLocation, 
      wasteCollected, 
      issues,
      photos 
    } = req.body;

    const schedule = await WasteCollectionSchedule.findByPk(scheduleId);

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found',
        code: 'SCHEDULE_NOT_FOUND'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Update collection points status
      if (collectedPoints && collectedPoints.length > 0) {
        for (const pointUpdate of collectedPoints) {
          await schedule.updateCollectionPoint(
            pointUpdate.index,
            pointUpdate.collected,
            pointUpdate.wasteAmount
          );

          // Create collection record for each completed point
          if (pointUpdate.collected) {
            await WasteCollectionRecord.create({
              scheduleId: schedule.id,
              vehicleId: schedule.vehicleId,
              binId: pointUpdate.binId || null,
              collectionDate: new Date(),
              collectionTime: new Date().toTimeString().slice(0, 8),
              collectionLocation: schedule.collectionPoints[pointUpdate.index],
              ward: schedule.ward,
              zone: schedule.zone,
              wasteType: schedule.wasteType,
              wasteCategory: this.getWasteCategoryFromType(schedule.wasteType),
              actualWeight: pointUpdate.wasteAmount || 0,
              collectionMethod: 'manual',
              crewMembers: schedule.crewMembers,
              driverName: schedule.driverAssigned,
              photos: pointUpdate.photos || [],
              status: 'collected'
            }, { transaction });
          }
        }
      }

      // Update vehicle location
      if (currentLocation) {
        await vehicleTrackingService.updateLocation(
          schedule.vehicleId,
          currentLocation.latitude,
          currentLocation.longitude
        );
      }

      // Add any issues reported
      if (issues && issues.length > 0) {
        for (const issue of issues) {
          await schedule.addIssue(issue.type, issue.description, issue.severity);
        }
      }

      await transaction.commit();

      res.json({
        status: 'success',
        message: 'Collection progress updated successfully',
        data: {
          schedule,
          completionPercentage: schedule.completionPercentage,
          collectedPoints: schedule.collectionPoints.filter(p => p.collected).length,
          totalPoints: schedule.collectionPoints.length
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Complete collection
  completeCollection = catchAsync(async (req, res) => {
    const { scheduleId } = req.params;
    const { 
      totalWasteCollected, 
      actualEndTime, 
      finalLocation,
      fuelUsed,
      distanceTraveled,
      completionNotes 
    } = req.body;

    const schedule = await WasteCollectionSchedule.findByPk(scheduleId, {
      include: [{ association: 'vehicle' }]
    });

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found',
        code: 'SCHEDULE_NOT_FOUND'
      });
    }

    if (schedule.status !== 'in_progress') {
      return res.status(400).json({
        status: 'error',
        message: 'Only in-progress collections can be completed',
        code: 'INVALID_STATUS'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Complete the schedule
      await schedule.completeCollection(
        totalWasteCollected,
        actualEndTime ? new Date(actualEndTime) : null
      );

      // Update vehicle statistics
      if (schedule.vehicle && distanceTraveled) {
        await schedule.vehicle.recordTrip(
          distanceTraveled,
          totalWasteCollected,
          fuelUsed || 0
        );
      }

      // Stop vehicle tracking
      await vehicleTrackingService.stopTracking(schedule.vehicleId);

      // Update any associated bins
      const collectedBins = await WasteBin.findAll({
        where: {
          id: { [Op.in]: schedule.collectionPoints
            .filter(p => p.collected && p.binId)
            .map(p => p.binId) 
          }
        }
      });

      for (const bin of collectedBins) {
        const pointData = schedule.collectionPoints.find(p => p.binId === bin.id);
        if (pointData) {
          await bin.recordCollection(pointData.wasteAmount);
        }
      }

      await transaction.commit();

      // Generate collection summary report
      const summary = await this.generateCollectionSummary(schedule);

      // Send completion notifications
      try {
        await notificationService.sendCollectionCompleteNotification(schedule, summary);
      } catch (notificationError) {
        logger.error('Failed to send completion notification:', notificationError);
      }

      res.json({
        status: 'success',
        message: 'Collection completed successfully',
        data: {
          schedule,
          summary,
          performance: {
            efficiency: schedule.completionPercentage,
            wastePerHour: totalWasteCollected / ((schedule.actualEndTime - schedule.actualStartTime) / (1000 * 60 * 60)),
            fuelEfficiency: distanceTraveled && fuelUsed ? distanceTraveled / fuelUsed : null
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Get collection statistics
  getCollectionStats = catchAsync(async (req, res) => {
    const {
      period = 'month',
      startDate,
      endDate,
      ward,
      zone,
      wasteType,
      vehicleId
    } = req.query;

    // Check permissions
    if (!['officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const filters = {};
    if (ward) filters.ward = ward;
    if (zone) filters.zone = zone;
    if (wasteType) filters.wasteType = wasteType;
    if (vehicleId) filters.vehicleId = vehicleId;

    // Set date range based on period
    let dateRange = {};
    if (startDate && endDate) {
      dateRange = { startDate: new Date(startDate), endDate: new Date(endDate) };
    } else {
      const now = new Date();
      switch (period) {
        case 'week':
          dateRange.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateRange.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          dateRange.startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          dateRange.startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      dateRange.endDate = now;
    }

    const [
      collectionStats,
      wasteStats,
      vehicleStats,
      performanceMetrics
    ] = await Promise.all([
      WasteCollectionSchedule.getCollectionStats({...filters, ...dateRange}),
      WasteCollectionRecord.getWasteStatistics(period, filters),
      this.getVehiclePerformanceStats(filters, dateRange),
      this.getCollectionPerformanceMetrics(filters, dateRange)
    ]);

    res.json({
      status: 'success',
      data: {
        period,
        dateRange,
        collectionStats,
        wasteStats,
        vehicleStats,
        performanceMetrics,
        filters
      }
    });
  });

  // Get active collections (real-time monitoring)
  getActiveCollections = catchAsync(async (req, res) => {
    const activeSchedules = await WasteCollectionSchedule.getActiveSchedules();
    
    // Add real-time tracking data
    const activeCollectionsWithTracking = await Promise.all(
      activeSchedules.map(async (schedule) => {
        try {
          const tracking = await vehicleTrackingService.getVehicleLocation(schedule.vehicleId);
          const progress = await this.calculateCollectionProgress(schedule);
          
          return {
            ...schedule.toJSON(),
            realTimeLocation: tracking,
            progress
          };
        } catch (error) {
          logger.warn(`Failed to get tracking data for vehicle ${schedule.vehicleId}:`, error);
          return schedule.toJSON();
        }
      })
    );

    res.json({
      status: 'success',
      data: {
        activeCollections: activeCollectionsWithTracking,
        totalActive: activeCollectionsWithTracking.length
      }
    });
  });

  // Helper methods
  getWasteCategoryFromType(wasteType) {
    const categoryMap = {
      'household': 'mixed',
      'organic': 'biodegradable',
      'recyclable': 'recyclable',
      'hazardous': 'hazardous',
      'electronic': 'e_waste',
      'construction': 'non_biodegradable',
      'medical': 'hazardous',
      'mixed': 'mixed'
    };
    
    return categoryMap[wasteType] || 'mixed';
  }

  async generateCollectionSummary(schedule) {
    const records = await WasteCollectionRecord.findAll({
      where: { scheduleId: schedule.id }
    });

    const totalWeight = records.reduce((sum, record) => sum + parseFloat(record.actualWeight), 0);
    const collectedPoints = schedule.collectionPoints.filter(p => p.collected).length;
    const duration = (schedule.actualEndTime - schedule.actualStartTime) / (1000 * 60); // minutes

    return {
      totalWasteCollected: totalWeight,
      pointsCollected: collectedPoints,
      totalPoints: schedule.collectionPoints.length,
      duration,
      efficiency: schedule.completionPercentage,
      averageWastePerPoint: collectedPoints > 0 ? totalWeight / collectedPoints : 0,
      records: records.length
    };
  }

  async calculateCollectionProgress(schedule) {
    const now = new Date();
    const startTime = new Date(schedule.actualStartTime);
    const estimatedEndTime = new Date(startTime.getTime() + schedule.estimatedDuration * 60000);
    
    const timeElapsed = (now - startTime) / (1000 * 60); // minutes
    const timeProgress = Math.min(100, (timeElapsed / schedule.estimatedDuration) * 100);
    
    return {
      timeProgress,
      pointProgress: schedule.completionPercentage,
      isOnSchedule: timeProgress <= schedule.completionPercentage + 10, // 10% tolerance
      estimatedCompletion: estimatedEndTime
    };
  }

  async getVehiclePerformanceStats(filters, dateRange) {
    // Implementation would calculate vehicle performance metrics
    return {
      totalVehiclesUsed: 0,
      averageFuelConsumption: 0,
      totalDistance: 0,
      maintenanceAlerts: 0
    };
  }

  async getCollectionPerformanceMetrics(filters, dateRange) {
    // Implementation would calculate collection performance metrics
    return {
      onTimeCompletionRate: 0,
      averageCollectionTime: 0,
      citizenSatisfactionScore: 0,
      wasteRecoveryRate: 0
    };
  }
}

module.exports = new WasteCollectionController();
