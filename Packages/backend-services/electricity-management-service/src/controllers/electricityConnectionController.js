const { 
  ElectricityConnection, 
  ElectricityMeter,
  ElectricityBill, 
  MeterReading,
  TariffRate,
  sequelize 
} = require('../models');
const electricityBillingService = require('../services/electricityBillingService');
const smartMeterService = require('../services/smartMeterService');
const loadManagementService = require('../services/loadManagementService');
const notificationService = require('../services/notificationService');
const logger = require('@amc/shared/utils/logger');
const { catchAsync } = require('@amc/shared/middleware/errorHandler');
const { Op } = require('sequelize');
const Decimal = require('decimal.js');

class ElectricityConnectionController {
  // Apply for new electricity connection
  applyForConnection = catchAsync(async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        propertyId,
        premiseAddress,
        connectionType,
        connectionCategory,
        sanctionedLoad,
        voltage,
        phases,
        supplyType,
        contactNumber,
        emailAddress,
        specialInstructions
      } = req.body;

      // Validate property ownership if propertyId provided
      if (propertyId) {
        const propertyOwnership = await this.validatePropertyOwnership(
          propertyId, 
          req.user.citizenId
        );
        
        if (!propertyOwnership) {
          await transaction.rollback();
          return res.status(403).json({
            status: 'error',
            message: 'You do not have ownership of this property',
            code: 'INVALID_PROPERTY_OWNERSHIP'
          });
        }
      }

      // Check for existing active connection at the same address
      const existingConnection = await ElectricityConnection.findOne({
        where: {
          'premiseAddress.street': premiseAddress.street,
          'premiseAddress.area': premiseAddress.area,
          'premiseAddress.pincode': premiseAddress.pincode,
          status: {
            [Op.in]: ['active', 'connected', 'estimate_prepared', 'work_in_progress']
          }
        }
      });

      if (existingConnection) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'An active electricity connection already exists at this address',
          code: 'DUPLICATE_CONNECTION'
        });
      }

      // Validate load capacity in the area
      const loadAvailability = await loadManagementService.checkLoadAvailability(
        premiseAddress.ward,
        premiseAddress.zone,
        sanctionedLoad
      );

      if (!loadAvailability.available) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient load capacity in the area',
          code: 'LOAD_UNAVAILABLE',
          data: {
            requestedLoad: sanctionedLoad,
            availableLoad: loadAvailability.availableCapacity,
            reason: loadAvailability.reason
          }
        });
      }

      // Create electricity connection application
      const connectionData = {
        customerCitizenId: req.user.citizenId,
        propertyId,
        premiseAddress,
        ward: premiseAddress.ward || req.user.ward,
        zone: premiseAddress.zone || 'Zone-A',
        connectionType,
        connectionCategory,
        sanctionedLoad,
        voltage,
        phases,
        supplyType,
        contactNumber: contactNumber || req.user.mobileNumber,
        emailAddress: emailAddress || req.user.email,
        specialInstructions
      };

      const connection = await ElectricityConnection.create(connectionData, { transaction });

      // Calculate charges
      const securityDeposit = connection.calculateSecurityDeposit();
      const developmentCharges = connection.calculateDevelopmentCharges();
      const serviceConnectionCharges = this.calculateServiceConnectionCharges(connection);

      await connection.update({
        securityDeposit,
        developmentCharges,
        serviceConnectionCharges
      }, { transaction });

      // Check subsidy eligibility
      const subsidyEligible = connection.isEligibleForSubsidy();
      const subsidyDetails = subsidyEligible ? 
        await this.calculateSubsidyDetails(connection) : null;

      if (subsidyEligible) {
        await connection.update({
          subsidyEligible: true,
          subsidyPercentage: subsidyDetails.percentage,
          freeUnitsPerMonth: subsidyDetails.freeUnits
        }, { transaction });
      }

      await transaction.commit();

      // Send application confirmation notification
      try {
        await notificationService.sendConnectionApplicationNotification(
          req.user.id,
          connection,
          { subsidyEligible, subsidyDetails }
        );
      } catch (notificationError) {
        logger.error('Failed to send application notification:', notificationError);
      }

      res.status(201).json({
        status: 'success',
        message: 'Electricity connection application submitted successfully',
        data: {
          connection,
          applicationNumber: connection.applicationNumber,
          estimatedCharges: {
            securityDeposit,
            developmentCharges,
            serviceConnectionCharges,
            totalAmount: securityDeposit + developmentCharges + serviceConnectionCharges,
            subsidyApplied: subsidyEligible ? subsidyDetails : null
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Get user's electricity connections
  getMyConnections = catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      connectionType
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { customerCitizenId: req.user.citizenId };

    if (status) where.status = status;
    if (connectionType) where.connectionType = connectionType;

    const { count, rows } = await ElectricityConnection.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          association: 'meter',
          required: false
        },
        {
          association: 'bills',
          limit: 3,
          order: [['billDate', 'DESC']],
          where: { status: { [Op.ne]: 'cancelled' } },
          required: false
        }
      ]
    });

    // Calculate consumption and outstanding for each connection
    const connectionsWithData = await Promise.all(
      rows.map(async (connection) => {
        const consumptionData = await connection.getCurrentConsumption();
        const outstandingAmount = await this.getConnectionOutstanding(connection.id);
        
        // Get current month's demand
        const currentDemand = await this.getCurrentDemand(connection.id);
        
        return {
          ...connection.toJSON(),
          currentConsumption: consumptionData,
          currentDemand,
          outstandingAmount,
          subsidyStatus: connection.subsidyEligible ? {
            eligible: true,
            percentage: connection.subsidyPercentage,
            freeUnits: connection.freeUnitsPerMonth
          } : null
        };
      })
    );

    res.json({
      status: 'success',
      data: {
        connections: connectionsWithData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalCount: count,
          limit: parseInt(limit)
        }
      }
    });
  });

  // Get connection details
  getConnection = catchAsync(async (req, res) => {
    const { identifier } = req.params;
    
    let connection;
    
    // Check if identifier is UUID or connection number
    if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      connection = await ElectricityConnection.findByPk(identifier, {
        include: [
          { association: 'meter' },
          {
            association: 'bills',
            limit: 12,
            order: [['billDate', 'DESC']]
          }
        ]
      });
    } else {
      connection = await ElectricityConnection.findByConnectionNumber(identifier);
    }

    if (!connection) {
      return res.status(404).json({
        status: 'error',
        message: 'Electricity connection not found',
        code: 'CONNECTION_NOT_FOUND'
      });
    }

    // Check access permissions
    const isOwner = connection.customerCitizenId === req.user.citizenId;
    const isOfficer = ['officer', 'admin'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this connection',
        code: 'ACCESS_DENIED'
      });
    }

    // Get additional data
    const [
      consumptionData,
      outstandingAmount,
      consumptionHistory,
      loadProfile,
      powerQuality
    ] = await Promise.all([
      connection.getCurrentConsumption(),
      this.getConnectionOutstanding(connection.id),
      this.getConsumptionHistory(connection.id),
      this.getLoadProfile(connection.id),
      connection.meter && connection.meter.isSmartMeter ? 
        smartMeterService.getPowerQuality(connection.meter.deviceId) : null
    ]);

    res.json({
      status: 'success',
      data: {
        connection,
        currentConsumption: consumptionData,
        outstandingAmount,
        consumptionHistory,
        loadProfile,
        powerQuality
      }
    });
  });

  // Update connection status (officers only)
  updateConnectionStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, remarks, meterDetails } = req.body;

    // Check officer permissions
    if (!['officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only officers can update connection status',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const connection = await ElectricityConnection.findByPk(id);

    if (!connection) {
      return res.status(404).json({
        status: 'error',
        message: 'Connection not found',
        code: 'CONNECTION_NOT_FOUND'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const oldStatus = connection.status;
      
      // Update connection details
      const updateData = { status };
      if (remarks) updateData.remarks = remarks;

      await connection.update(updateData, { transaction });

      // Create meter if connection is being activated
      if (status === 'connected' && meterDetails && !connection.meter) {
        const meter = await ElectricityMeter.create({
          ...meterDetails,
          connectionId: connection.id,
          installationDate: new Date(),
          initialReading: meterDetails.initialReading || 0
        }, { transaction });

        await connection.update({
          meterNumber: meter.meterNumber
        }, { transaction });

        // Initialize smart meter if applicable
        if (meter.isSmartMeter && meter.deviceId) {
          try {
            await smartMeterService.initializeSmartMeter(meter.deviceId, {
              connectionId: connection.id,
              meterId: meter.id,
              tariffCategory: connection.tariffCategory
            });
          } catch (smartMeterError) {
            logger.error('Failed to initialize smart meter:', smartMeterError);
          }
        }
      }

      // Reserve load capacity
      if (status === 'active' && oldStatus !== 'active') {
        await loadManagementService.reserveLoad(
          connection.ward,
          connection.zone,
          connection.sanctionedLoad,
          connection.id
        );
      }

      await transaction.commit();

      // Send status update notification
      try {
        await notificationService.sendConnectionStatusNotification(
          connection.customerCitizenId,
          connection,
          { oldStatus, newStatus: status }
        );
      } catch (notificationError) {
        logger.error('Failed to send status notification:', notificationError);
      }

      res.json({
        status: 'success',
        message: 'Connection status updated successfully',
        data: { connection }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Add meter reading (manual or smart meter)
  addMeterReading = catchAsync(async (req, res) => {
    const { connectionId } = req.params;
    const {
      energyReading,
      maxDemand,
      powerFactor,
      readingDate,
      readingType = 'regular',
      voltageData,
      meterImage,
      remarks
    } = req.body;

    const connection = await ElectricityConnection.findByPk(connectionId, {
      include: [{ association: 'meter' }]
    });

    if (!connection) {
      return res.status(404).json({
        status: 'error',
        message: 'Connection not found',
        code: 'CONNECTION_NOT_FOUND'
      });
    }

    if (!connection.meter) {
      return res.status(400).json({
        status: 'error',
        message: 'No meter installed for this connection',
        code: 'NO_METER_INSTALLED'
      });
    }

    // Check permissions
    const isOwner = connection.customerCitizenId === req.user.citizenId;
    const isOfficer = ['officer', 'admin'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Validate reading date
    const readingDateObj = new Date(readingDate || Date.now());
    const lastReading = await MeterReading.findOne({
      where: { meterId: connection.meter.id },
      order: [['readingDate', 'DESC']]
    });

    if (lastReading && readingDateObj <= lastReading.readingDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Reading date must be after the last recorded reading date',
        code: 'INVALID_READING_DATE'
      });
    }

    // Validate reading value
    const lastReadingValue = lastReading ? 
      lastReading.energyReading : 
      connection.meter.initialReading;

    if (energyReading < lastReadingValue) {
      return res.status(400).json({
        status: 'error',
        message: 'Current reading cannot be less than previous reading',
        code: 'INVALID_READING_VALUE'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Create meter reading
      const meterReading = await MeterReading.create({
        meterId: connection.meter.id,
        connectionId: connection.id,
        energyReading,
        maxDemand,
        powerFactor,
        readingDate: readingDateObj,
        readingType,
        voltageR: voltageData?.r || null,
        voltageY: voltageData?.y || null,
        voltageB: voltageData?.b || null,
        currentR: voltageData?.currentR || null,
        currentY: voltageData?.currentY || null,
        currentB: voltageData?.currentB || null,
        readBy: req.user.id,
        readerName: req.user.name,
        meterImage,
        remarks,
        isValidated: isOfficer,
        validatedBy: isOfficer ? req.user.id : null,
        validatedAt: isOfficer ? new Date() : null,
        status: isOfficer ? 'validated' : 'pending'
      }, { transaction });

      // Update meter's current reading
      await connection.meter.updateReading(energyReading, readingDateObj);

      // Update connection's load metrics
      if (maxDemand && maxDemand > connection.maxDemandRecorded) {
        await connection.update({
          maxDemandRecorded: maxDemand,
          currentLoad: maxDemand
        }, { transaction });
      }

      // Calculate load factor if we have enough data
      if (lastReading && maxDemand > 0) {
        const consumption = new Decimal(energyReading).minus(new Decimal(lastReadingValue));
        const hours = (readingDateObj - lastReading.readingDate) / (1000 * 60 * 60);
        
        if (hours > 0) {
          connection.updateLoadFactor(consumption.toNumber(), maxDemand, hours);
        }
      }

      // Update power factor
      if (powerFactor) {
        await connection.update({ powerFactor }, { transaction });
      }

      await transaction.commit();

      // Check for billing eligibility
      const shouldGenerateBill = await this.shouldGenerateBill(connection, meterReading);
      
      res.status(201).json({
        status: 'success',
        message: 'Meter reading added successfully',
        data: {
          meterReading,
          consumption: meterReading.consumption,
          demand: maxDemand,
          powerFactor,
          needsValidation: !isOfficer,
          billGeneration: {
            eligible: shouldGenerateBill,
            nextBillDate: connection.nextBillDate
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Get connection bills
  getConnectionBills = catchAsync(async (req, res) => {
    const { connectionId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    } = req.query;

    const connection = await ElectricityConnection.findByPk(connectionId);

    if (!connection) {
      return res.status(404).json({
        status: 'error',
        message: 'Connection not found',
        code: 'CONNECTION_NOT_FOUND'
      });
    }

    // Check permissions
    const isOwner = connection.customerCitizenId === req.user.citizenId;
    const isOfficer = ['officer', 'admin'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const offset = (page - 1) * limit;
    const where = { connectionId };

    if (status) where.status = status;
    if (startDate) {
      where.billDate = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.billDate = {
        ...where.billDate,
        [Op.lte]: new Date(endDate)
      };
    }

    const { count, rows } = await ElectricityBill.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['billDate', 'DESC']]
    });

    // Calculate bill statistics
    const billStats = {
      totalBills: count,
      totalAmount: rows.reduce((sum, bill) => sum + parseFloat(bill.totalAmount), 0),
      paidAmount: rows.reduce((sum, bill) => sum + parseFloat(bill.paidAmount), 0),
      outstandingAmount: rows.reduce((sum, bill) => sum + parseFloat(bill.outstandingAmount), 0),
      avgMonthlyConsumption: rows.length > 0 ? 
        rows.reduce((sum, bill) => sum + parseFloat(bill.unitsConsumed), 0) / rows.length : 0
    };

    res.json({
      status: 'success',
      data: {
        bills: rows,
        statistics: billStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalCount: count,
          limit: parseInt(limit)
        }
      }
    });
  });

  // Generate bill for connection
  generateBill = catchAsync(async (req, res) => {
    const { connectionId } = req.params;

    // Check officer permissions
    if (!['officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only officers can generate bills',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    try {
      const bill = await electricityBillingService.generateBill(connectionId);

      res.status(201).json({
        status: 'success',
        message: 'Bill generated successfully',
        data: { bill }
      });

    } catch (error) {
      if (error.message.includes('No validated meter reading found')) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot generate bill without validated meter readings',
          code: 'NO_VALIDATED_READINGS'
        });
      }
      throw error;
    }
  });

  // Get electricity statistics for officers
  getElectricityStatistics = catchAsync(async (req, res) => {
    // Check officer permissions
    if (!['officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { ward, zone, connectionType, period = 'month' } = req.query;

    const filters = {};
    if (ward) filters.ward = ward;
    if (zone) filters.zone = zone;
    if (connectionType) filters.connectionType = connectionType;

    const [
      connectionStats,
      loadDistribution,
      revenueStats,
      consumptionTrends,
      smartMeterStats
    ] = await Promise.all([
      ElectricityConnection.getConnectionStats(filters),
      ElectricityConnection.getLoadDistribution(filters.zone),
      this.getRevenueStatistics(filters, period),
      this.getConsumptionTrends(filters, period),
      this.getSmartMeterStatistics(filters)
    ]);

    res.json({
      status: 'success',
      data: {
        connectionStats,
        loadDistribution,
        revenueStats,
        consumptionTrends,
        smartMeterStats,
        period,
        filters
      }
    });
  });

  // Helper methods
  async validatePropertyOwnership(propertyId, citizenId) {
    try {
      const response = await axios.get(
        `${process.env.PROPERTY_TAX_SERVICE_URL}/properties/${propertyId}/owners`,
        {
          headers: {
            'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN
          }
        }
      );

      return response.data.owners.some(owner => owner.citizenId === citizenId);
    } catch (error) {
      logger.error('Property ownership validation failed:', error);
      return false;
    }
  }

  calculateServiceConnectionCharges(connection) {
    const baseCharges = {
      'domestic': 5000,
      'commercial': 15000,
      'industrial': 25000,
      'agricultural': 3000,
      'institutional': 10000,
      'street_light': 2000
    };

    let charges = new Decimal(baseCharges[connection.connectionType] || 5000);

    // Add load-based charges
    if (connection.sanctionedLoad > 10) {
      const additionalLoad = new Decimal(connection.sanctionedLoad).minus(10);
      charges = charges.plus(additionalLoad.times(500)); // ₹500 per additional kW
    }

    // Underground supply premium
    if (connection.supplyType === 'underground') {
      charges = charges.times(1.5);
    }

    return charges.toNumber();
  }

  async calculateSubsidyDetails(connection) {
    if (connection.connectionType !== 'domestic' || connection.connectionCategory !== 'bpl') {
      return null;
    }

    return {
      percentage: 50, // 50% subsidy on bill amount
      freeUnits: 50,  // First 50 units free per month
      maxSubsidyAmount: 500 // Maximum ₹500 subsidy per month
    };
  }

  async getConnectionOutstanding(connectionId) {
    const bills = await ElectricityBill.findAll({
      where: {
        connectionId,
        status: { [Op.in]: ['generated', 'sent', 'partially_paid'] }
      }
    });

    return bills.reduce((total, bill) => total + parseFloat(bill.outstandingAmount), 0);
  }

  async getCurrentDemand(connectionId) {
    const latestReading = await MeterReading.findOne({
      where: { connectionId },
      order: [['readingDate', 'DESC']]
    });

    return latestReading ? parseFloat(latestReading.maxDemand || 0) : 0;
  }

  async getConsumptionHistory(connectionId, months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return await ElectricityBill.findAll({
      where: {
        connectionId,
        billDate: { [Op.gte]: startDate }
      },
      attributes: ['billDate', 'unitsConsumed', 'maxDemand', 'totalAmount'],
      order: [['billDate', 'ASC']]
    });
  }

  async getLoadProfile(connectionId) {
    const connection = await ElectricityConnection.findByPk(connectionId, {
      include: [{ association: 'meter' }]
    });

    if (!connection || !connection.meter || !connection.meter.isSmartMeter) {
      return null;
    }

    return await smartMeterService.getLoadProfile(connection.meter.deviceId, 7); // Last 7 days
  }

  async shouldGenerateBill(connection, reading) {
    const daysSinceLastBill = connection.lastBillDate ? 
      Math.floor((new Date() - connection.lastBillDate) / (1000 * 60 * 60 * 24)) : 
      999;

    const billingDays = connection.billingCycle === 'monthly' ? 30 : 60;
    
    return daysSinceLastBill >= billingDays;
  }

  async getRevenueStatistics(filters, period) {
    // Implementation would calculate revenue statistics
    return {
      totalRevenue: 0,
      collectionEfficiency: 0,
      averageRevenue: 0
    };
  }

  async getConsumptionTrends(filters, period) {
    // Implementation would calculate consumption trends
    return {
      totalConsumption: 0,
      averageConsumption: 0,
      peakDemand: 0,
      loadFactor: 0
    };
  }

  async getSmartMeterStatistics(filters) {
    const smartMeters = await ElectricityMeter.getSmartMeters(filters);
    
    return {
      totalSmartMeters: smartMeters.length,
      activeSmartMeters: smartMeters.filter(m => m.status === 'active').length,
      communicationHealth: smartMeters.filter(m => {
        const health = m.calculateCommunicationHealth();
        return health && ['excellent', 'good'].includes(health.status);
      }).length
    };
  }
}

module.exports = new ElectricityConnectionController();
