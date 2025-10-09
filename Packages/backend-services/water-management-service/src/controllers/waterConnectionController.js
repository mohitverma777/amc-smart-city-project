const { WaterConnection, MeterReading, WaterBill, sequelize } = require('../models');
const waterBillingService = require('../services/waterBillingService');
const notificationService = require('../services/notificationService');
const logger = require('@amc/shared/utils/logger');
const { catchAsync } = require('@amc/shared/middleware/errorHandler');
const { Op } = require('sequelize');

class WaterConnectionController {
  // Apply for new water connection
  applyForConnection = catchAsync(async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        propertyId,
        premiseAddress,
        connectionType,
        connectionCategory,
        pipeSize,
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
      const existingConnection = await WaterConnection.findOne({
        where: {
          'premiseAddress.street': premiseAddress.street,
          'premiseAddress.area': premiseAddress.area,
          'premiseAddress.pincode': premiseAddress.pincode,
          status: {
            [Op.in]: ['active', 'connected', 'approved', 'work_in_progress']
          }
        }
      });

      if (existingConnection) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'An active water connection already exists at this address',
          code: 'DUPLICATE_CONNECTION'
        });
      }

      // Create water connection application
      const connectionData = {
        customerCitizenId: req.user.citizenId,
        propertyId,
        premiseAddress,
        ward: premiseAddress.ward || req.user.ward,
        zone: premiseAddress.zone || 'Zone-A', // Default zone
        connectionType,
        connectionCategory,
        pipeSize,
        contactNumber: contactNumber || req.user.mobileNumber,
        emailAddress: emailAddress || req.user.email,
        specialInstructions
      };

      const connection = await WaterConnection.create(connectionData, { transaction });

      // Calculate charges
      const securityDeposit = connection.calculateSecurityDeposit();
      const connectionCharges = connection.calculateConnectionCharges();

      await connection.update({
        securityDeposit,
        connectionCharges
      }, { transaction });

      await transaction.commit();

      // Send application confirmation notification
      try {
        await notificationService.sendConnectionApplicationNotification(
          req.user.id,
          connection
        );
      } catch (notificationError) {
        logger.error('Failed to send application notification:', notificationError);
      }

      res.status(201).json({
        status: 'success',
        message: 'Water connection application submitted successfully',
        data: {
          connection,
          applicationNumber: connection.applicationNumber,
          estimatedCharges: {
            securityDeposit,
            connectionCharges,
            totalAmount: securityDeposit + connectionCharges
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Get user's water connections
  getMyConnections = catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      connectionType
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { customerCitizenId: req.user.citizenId };

    if (status) {
      where.status = status;
    }
    
    if (connectionType) {
      where.connectionType = connectionType;
    }

    const { count, rows } = await WaterConnection.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          association: 'meterReadings',
          limit: 1,
          order: [['readingDate', 'DESC']]
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
        
        return {
          ...connection.toJSON(),
          currentConsumption: consumptionData,
          outstandingAmount
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
      connection = await WaterConnection.findByPk(identifier, {
        include: [
          {
            association: 'meterReadings',
            limit: 12,
            order: [['readingDate', 'DESC']]
          },
          {
            association: 'bills',
            limit: 6,
            order: [['billDate', 'DESC']]
          }
        ]
      });
    } else {
      connection = await WaterConnection.findByConnectionNumber(identifier);
    }

    if (!connection) {
      return res.status(404).json({
        status: 'error',
        message: 'Water connection not found',
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
    const consumptionData = await connection.getCurrentConsumption();
    const outstandingAmount = await this.getConnectionOutstanding(connection.id);
    const consumptionHistory = await this.getConsumptionHistory(connection.id);

    res.json({
      status: 'success',
      data: {
        connection,
        currentConsumption: consumptionData,
        outstandingAmount,
        consumptionHistory
      }
    });
  });

  // Update connection status (officers only)
  updateConnectionStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, remarks, meterNumber, meterType } = req.body;

    // Check officer permissions
    if (!['officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only officers can update connection status',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const connection = await WaterConnection.findByPk(id);

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
      if (meterNumber) updateData.meterNumber = meterNumber;
      if (meterType) updateData.meterType = meterType;

      await connection.update(updateData, { transaction });

      // Create initial meter reading if connection is activated
      if (status === 'active' && oldStatus !== 'active') {
        await MeterReading.create({
          connectionId: connection.id,
          currentReading: connection.initialMeterReading,
          previousReading: 0,
          consumption: 0,
          readingType: 'initial',
          readingSource: 'manual',
          readBy: req.user.id,
          isValidated: true,
          validatedBy: req.user.id,
          validatedAt: new Date(),
          status: 'validated'
        }, { transaction });
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

  // Add meter reading
  addMeterReading = catchAsync(async (req, res) => {
    const { connectionId } = req.params;
    const {
      currentReading,
      readingDate,
      meterImage,
      remarks
    } = req.body;

    const connection = await WaterConnection.findByPk(connectionId);

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

    // Validate reading date
    const readingDateObj = new Date(readingDate || Date.now());
    const lastReading = await MeterReading.findOne({
      where: { connectionId },
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
      lastReading.currentReading : 
      connection.initialMeterReading;

    if (currentReading < lastReadingValue) {
      return res.status(400).json({
        status: 'error',
        message: 'Current reading cannot be less than previous reading',
        code: 'INVALID_READING_VALUE'
      });
    }

    // Create meter reading
    const meterReading = await MeterReading.create({
      connectionId,
      currentReading,
      readingDate: readingDateObj,
      readingSource: isOfficer ? 'manual' : 'mobile_app',
      readBy: req.user.id,
      readerName: req.user.name,
      meterImage,
      remarks,
      isValidated: isOfficer,
      validatedBy: isOfficer ? req.user.id : null,
      validatedAt: isOfficer ? new Date() : null,
      status: isOfficer ? 'validated' : 'pending'
    });

    // Update connection's next bill date if this reading makes it due for billing
    const shouldUpdateBillDate = await this.shouldUpdateBillingDate(connection, meterReading);
    if (shouldUpdateBillDate) {
      const nextBillDate = new Date();
      nextBillDate.setMonth(nextBillDate.getMonth() + 1);
      await connection.update({ nextBillDate });
    }

    res.status(201).json({
      status: 'success',
      message: 'Meter reading added successfully',
      data: {
        meterReading,
        consumption: meterReading.consumption,
        needsValidation: !isOfficer
      }
    });
  });

  // Get connection bills
  getConnectionBills = catchAsync(async (req, res) => {
    const { connectionId } = req.params;
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const connection = await WaterConnection.findByPk(connectionId);

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

    if (status) {
      where.status = status;
    }

    const { count, rows } = await WaterBill.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['billDate', 'DESC']]
    });

    res.json({
      status: 'success',
      data: {
        bills: rows,
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
      const bill = await waterBillingService.generateBill(connectionId);

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

  // Get connection statistics for officers
  getConnectionStatistics = catchAsync(async (req, res) => {
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
      revenueStats,
      consumptionStats
    ] = await Promise.all([
      WaterConnection.getConnectionStats(filters),
      this.getRevenueStatistics(filters, period),
      this.getConsumptionStatistics(filters, period)
    ]);

    res.json({
      status: 'success',
      data: {
        connectionStats,
        revenueStats,
        consumptionStats,
        period,
        filters
      }
    });
  });

  // Helper methods
  async validatePropertyOwnership(propertyId, citizenId) {
    // This would integrate with property-tax-service to validate ownership
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

  async getConnectionOutstanding(connectionId) {
    const bills = await WaterBill.findAll({
      where: {
        connectionId,
        status: { [Op.in]: ['generated', 'sent', 'partially_paid'] }
      }
    });

    return bills.reduce((total, bill) => total + parseFloat(bill.outstandingAmount), 0);
  }

  async getConsumptionHistory(connectionId, months = 12) {
    return await MeterReading.getConsumptionStats(connectionId, 'month');
  }

  async shouldUpdateBillingDate(connection, meterReading) {
    // Logic to determine if this reading should trigger bill generation
    const daysSinceLastBill = connection.lastBillDate ? 
      Math.floor((new Date() - connection.lastBillDate) / (1000 * 60 * 60 * 24)) : 
      999;

    const billingDays = {
      'monthly': 30,
      'quarterly': 90,
      'half_yearly': 180
    };

    return daysSinceLastBill >= (billingDays[connection.billingCycle] || 30);
  }

  async getRevenueStatistics(filters, period) {
    // Implementation would calculate revenue statistics
    return {
      totalRevenue: 0,
      paidAmount: 0,
      outstandingAmount: 0
    };
  }

  async getConsumptionStatistics(filters, period) {
    // Implementation would calculate consumption statistics
    return {
      totalConsumption: 0,
      averageConsumption: 0,
      peakConsumption: 0
    };
  }
}

module.exports = new WaterConnectionController();
