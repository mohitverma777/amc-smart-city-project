const { WaterConnection, WaterBill, MeterReading, sequelize } = require('../models');
const Decimal = require('decimal.js');
const logger = require('@amc/shared/utils/logger');
const { Op } = require('sequelize');

class WaterBillingService {
  // Generate bill for a specific connection
  async generateBill(connectionId) {
    const transaction = await sequelize.transaction();

    try {
      const connection = await WaterConnection.findByPk(connectionId, {
        include: [{
          association: 'meterReadings',
          where: { isValidated: true },
          order: [['readingDate', 'DESC']],
          limit: 2
        }]
      });

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.status !== 'active') {
        throw new Error('Cannot generate bill for inactive connection');
      }

      const meterReadings = connection.meterReadings;
      if (meterReadings.length === 0) {
        throw new Error('No validated meter reading found for this connection');
      }

      // Get current and previous readings
      const currentReading = meterReadings;
      const previousReading = meterReadings || null;

      // Check if bill already exists for this period
      const existingBill = await WaterBill.findOne({
        where: {
          connectionId: connection.id,
          billingPeriodEnd: currentReading.readingDate
        }
      });

      if (existingBill) {
        throw new Error('Bill already exists for this billing period');
      }

      // Calculate billing period
      const billingPeriodEnd = new Date(currentReading.readingDate);
      const billingPeriodStart = previousReading ? 
        new Date(previousReading.readingDate) : 
        new Date(connection.connectionDate);

      // Get consumption
      const consumption = new Decimal(currentReading.consumption);

      // Get applicable rates
      const rates = await this.getApplicableRates(
        connection.connectionType,
        connection.zone,
        billingPeriodEnd
      );

      // Get previous outstanding
      const previousOutstanding = await this.getPreviousOutstanding(connection.id);

      // Create bill
      const billData = {
        connectionId: connection.id,
        billingPeriodStart,
        billingPeriodEnd,
        previousReading: previousReading ? previousReading.currentReading : connection.initialMeterReading,
        currentReading: currentReading.currentReading,
        consumption: consumption.toNumber(),
        waterRate: rates.waterRate,
        sewerageRate: rates.sewerageRate,
        minimumCharge: rates.minimumCharge,
        meterRent: rates.meterRent,
        previousOutstanding
      };

      const bill = await WaterBill.create(billData, { transaction });

      // Mark meter reading as billed
      await currentReading.update({ 
        isBilled: true,
        status: 'billed'
      }, { transaction });

      // Update connection's last bill date and next bill date
      const nextBillDate = new Date(billingPeriodEnd);
      nextBillDate.setMonth(nextBillDate.getMonth() + 1);

      await connection.update({
        lastBillDate: bill.billDate,
        nextBillDate
      }, { transaction });

      await transaction.commit();

      logger.info('Bill generated successfully', {
        billId: bill.id,
        billNumber: bill.billNumber,
        connectionId: connection.id,
        amount: bill.totalAmount
      });

      return bill;

    } catch (error) {
      await transaction.rollback();
      logger.error('Bill generation failed:', error);
      throw error;
    }
  }

  // Bulk bill generation for all due connections
  async generateBulkBills() {
    try {
      const dueConnections = await WaterConnection.getDueForBilling();
      
      const results = {
        total: dueConnections.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const connection of dueConnections) {
        try {
          await this.generateBill(connection.id);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            connectionId: connection.id,
            connectionNumber: connection.connectionNumber,
            error: error.message
          });
          
          logger.error('Failed to generate bill for connection', {
            connectionId: connection.id,
            error: error.message
          });
        }
      }

      logger.info('Bulk bill generation completed', results);
      return results;

    } catch (error) {
      logger.error('Bulk bill generation failed:', error);
      throw error;
    }
  }

  // Apply payment to bill
  async applyPayment(billId, paymentAmount, paymentReference, paymentMethod) {
    const transaction = await sequelize.transaction();

    try {
      const bill = await WaterBill.findByPk(billId, { transaction });

      if (!bill) {
        throw new Error('Bill not found');
      }

      if (bill.status === 'paid') {
        throw new Error('Bill is already fully paid');
      }

      const amount = new Decimal(paymentAmount);
      const outstandingAmount = new Decimal(bill.outstandingAmount);

      if (amount.greaterThan(outstandingAmount)) {
        throw new Error('Payment amount cannot exceed outstanding amount');
      }

      // Apply payment to bill
      await bill.applyPayment(paymentAmount, paymentMethod);

      // Create payment record for tracking
      await this.createPaymentRecord(bill, paymentAmount, paymentReference, paymentMethod);

      await transaction.commit();

      logger.info('Payment applied successfully', {
        billId: bill.id,
        billNumber: bill.billNumber,
        paymentAmount,
        newStatus: bill.status
      });

      return bill;

    } catch (error) {
      await transaction.rollback();
      logger.error('Payment application failed:', error);
      throw error;
    }
  }

  // Apply late payment penalties
  async applyLatePenalties() {
    try {
      const overdueBills = await WaterBill.getOverdueBills();
      let updatedCount = 0;

      for (const bill of overdueBills) {
        const originalAmount = bill.totalAmount;
        bill.applyLatePaymentPenalty();
        
        if (bill.totalAmount !== originalAmount) {
          await bill.save();
          updatedCount++;
          
          logger.info('Late payment penalty applied', {
            billId: bill.id,
            originalAmount,
            newAmount: bill.totalAmount,
            penaltyAmount: bill.latePaymentPenalty
          });
        }
      }

      logger.info(`Applied late payment penalties to ${updatedCount} bills`);
      return updatedCount;

    } catch (error) {
      logger.error('Failed to apply late payment penalties:', error);
      throw error;
    }
  }

  // Get applicable water rates
  async getApplicableRates(connectionType, zone, effectiveDate) {
    // This would typically fetch from a water_rates table
    // For now, using configuration-based rates
    
    const baseRates = {
      domestic: {
        waterRate: parseFloat(process.env.WATER_RATE_PER_KL) || 15.50,
        sewerageRate: parseFloat(process.env.SEWERAGE_RATE_PER_KL) || 8.25,
        minimumCharge: parseFloat(process.env.MINIMUM_CHARGE) || 150.00,
        meterRent: 25.00
      },
      commercial: {
        waterRate: 25.00,
        sewerageRate: 12.50,
        minimumCharge: 300.00,
        meterRent: 50.00
      },
      industrial: {
        waterRate: 35.00,
        sewerageRate: 18.00,
        minimumCharge: 1000.00,
        meterRent: 100.00
      }
    };

    const rates = baseRates[connectionType] || baseRates.domestic;

    // Apply zone-based multipliers
    const zoneMultipliers = {
      'Zone-A': 1.2,
      'Zone-B': 1.0,
      'Zone-C': 0.8,
      'Zone-D': 0.6
    };

    const multiplier = zoneMultipliers[zone] || 1.0;

    return {
      waterRate: rates.waterRate * multiplier,
      sewerageRate: rates.sewerageRate * multiplier,
      minimumCharge: rates.minimumCharge,
      meterRent: rates.meterRent
    };
  }

  // Get previous outstanding amount for connection
  async getPreviousOutstanding(connectionId) {
    const previousBills = await WaterBill.findAll({
      where: {
        connectionId,
        status: { [Op.in]: ['generated', 'sent', 'partially_paid'] }
      }
    });

    return previousBills.reduce((total, bill) => {
      return total + parseFloat(bill.outstandingAmount);
    }, 0);
  }

  // Create payment record
  async createPaymentRecord(bill, amount, reference, method) {
    // This would integrate with the payment service to create a payment record
    try {
      const paymentData = {
        serviceType: 'water_bill',
        serviceReferenceId: bill.id,
        amount,
        customerCitizenId: bill.connection?.customerCitizenId,
        description: `Water bill payment for ${bill.billNumber}`,
        paymentMethod: method,
        status: 'completed',
        gatewayTransactionId: reference
      };

      // Call payment service API
      const response = await axios.post(
        `${process.env.PAYMENT_SERVICE_URL}/payments/record`,
        paymentData,
        {
          headers: {
            'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN
          }
        }
      );

      logger.info('Payment record created', {
        paymentId: response.data.paymentId,
        billNumber: bill.billNumber
      });

    } catch (error) {
      logger.error('Failed to create payment record:', error);
      // Don't throw error - payment was successful, just recording failed
    }
  }

  // Generate consumption report
  async generateConsumptionReport(filters = {}) {
    try {
      const { ward, zone, connectionType, startDate, endDate } = filters;

      const whereCondition = {};
      if (ward) whereCondition['$connection.ward$'] = ward;
      if (zone) whereCondition['$connection.zone$'] = zone;
      if (connectionType) whereCondition['$connection.connectionType$'] = connectionType;

      if (startDate || endDate) {
        whereCondition.billingPeriodStart = {};
        if (startDate) whereCondition.billingPeriodStart[Op.gte] = new Date(startDate);
        if (endDate) whereCondition.billingPeriodStart[Op.lte] = new Date(endDate);
      }

      const consumptionData = await WaterBill.findAll({
        attributes: [
          [sequelize.col('connection.connectionType'), 'connectionType'],
          [sequelize.col('connection.ward'), 'ward'],
          [sequelize.fn('COUNT', sequelize.col('WaterBill.id')), 'billCount'],
          [sequelize.fn('SUM', sequelize.col('consumption')), 'totalConsumption'],
          [sequelize.fn('AVG', sequelize.col('consumption')), 'avgConsumption'],
          [sequelize.fn('MAX', sequelize.col('consumption')), 'maxConsumption'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue']
        ],
        include: [{
          model: WaterConnection,
          as: 'connection',
          attributes: []
        }],
        where: whereCondition,
        group: [
          sequelize.col('connection.connectionType'),
          sequelize.col('connection.ward')
        ],
        order: [
          [sequelize.col('connection.ward'), 'ASC'],
          [sequelize.col('connection.connectionType'), 'ASC']
        ]
      });

      return {
        filters,
        reportGeneratedAt: new Date(),
        data: consumptionData
      };

    } catch (error) {
      logger.error('Consumption report generation failed:', error);
      throw error;
    }
  }

  // Water loss calculation
  async calculateWaterLoss(ward, startDate, endDate) {
    try {
      // Get total supply data (this would come from water treatment plants)
      const totalSupply = await this.getTotalWaterSupply(ward, startDate, endDate);
      
      // Get total consumption from bills
      const consumptionData = await WaterBill.sum('consumption', {
        include: [{
          model: WaterConnection,
          as: 'connection',
          where: { ward }
        }],
        where: {
          billingPeriodStart: { [Op.gte]: startDate },
          billingPeriodEnd: { [Op.lte]: endDate }
        }
      });

      const totalConsumption = consumptionData || 0;
      const waterLoss = totalSupply - totalConsumption;
      const lossPercentage = totalSupply > 0 ? (waterLoss / totalSupply) * 100 : 0;

      return {
        ward,
        period: { startDate, endDate },
        totalSupply,
        totalConsumption,
        waterLoss,
        lossPercentage: Math.round(lossPercentage * 100) / 100
      };

    } catch (error) {
      logger.error('Water loss calculation failed:', error);
      throw error;
    }
  }

  // Helper method to get total water supply (mock implementation)
  async getTotalWaterSupply(ward, startDate, endDate) {
    // This would integrate with water treatment plant systems
    // For now, returning mock data based on average supply rates
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const avgSupplyPerDay = 1000000; // 1 million liters per day per ward (mock)
    
    return days * avgSupplyPerDay;
  }
}

module.exports = new WaterBillingService();
