const Decimal = require('decimal.js');

module.exports = (sequelize, DataTypes) => {
  const ElectricityBill = sequelize.define('ElectricityBill', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Bill Identification
    billNumber: {
      type: DataTypes.STRING(30),
      unique: true,
      allowNull: false
    },
    
    // Connection Reference
    connectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ElectricityConnections',
        key: 'id'
      }
    },
    
    // Billing Period
    billDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      index: true
    },
    
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true
    },
    
    billingPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false
    },
    
    billingPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    
    // Meter Readings
    previousReading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    
    currentReading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    
    unitsConsumed: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    
    // Demand Charges
    maxDemand: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: { min: 0 }
    },
    
    sanctionedLoad: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    
    // Tariff Information
    tariffCategory: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    
    energyRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      comment: 'Rate per unit (kWh)'
    },
    
    demandRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Rate per kW of demand'
    },
    
    // Slab-wise Consumption (for tiered pricing)
    consumptionSlabs: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of slab-wise consumption and rates'
    },
    
    // Time-of-Day Consumption (for smart meters)
    todConsumption: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Peak, off-peak, and normal hour consumption'
    },
    
    // Bill Components
    energyCharges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    demandCharges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    fixedCharges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    fuelSurcharge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    electricityDuty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    // Subsidies and Adjustments
    subsidyAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    freeUnits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    adjustmentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // Total Amounts
    subTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    
    // Outstanding and Payments
    previousOutstanding: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    outstandingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    // Late Payment Charges
    latePaymentPenalty: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    interestOnArrears: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    // Bill Status
    status: {
      type: DataTypes.ENUM(
        'generated',
        'sent',
        'viewed',
        'partially_paid',
        'paid',
        'overdue',
        'cancelled'
      ),
      defaultValue: 'generated',
      index: true
    },
    
    // Power Factor Penalties
    powerFactor: {
      type: DataTypes.DECIMAL(4, 3),
      allowNull: true,
      validate: { min: 0, max: 1 }
    },
    
    powerFactorPenalty: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    // Load Factor Information
    loadFactor: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: { min: 0, max: 100 }
    },
    
    // Meter Rent
    meterRent: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    // Additional Charges
    rebate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    additionalCharges: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of additional charges with descriptions'
    },
    
    // Payment Information
    paymentHistory: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of payment records'
    },
    
    // Environmental Impact
    carbonEmissions: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
      comment: 'CO2 emissions in kg for this billing period'
    },
    
    renewableEnergyPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: { min: 0, max: 100 }
    },
    
    // Additional Information
    billRemarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    generatedBy: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    approvedBy: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'electricity_bills',
    timestamps: true,
    indexes: [
      { fields: ['billNumber'], unique: true },
      { fields: ['connectionId'] },
      { fields: ['billDate'] },
      { fields: ['dueDate'] },
      { fields: ['status'] },
      { fields: ['tariffCategory'] },
      { fields: ['connectionId', 'billDate'] }
    ],
    hooks: {
      beforeCreate: async (bill) => {
        // Generate unique bill number
        const date = new Date(bill.billDate);
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        
        const count = await ElectricityBill.count({
          where: {
            billDate: {
              [sequelize.Op.gte]: new Date(date.setHours(0, 0, 0, 0)),
              [sequelize.Op.lt]: new Date(date.setHours(23, 59, 59, 999))
            }
          }
        });
        
        bill.billNumber = `ELE${dateStr}${String(count + 1).padStart(6, '0')}`;
        
        // Calculate due date (30 days from bill date)
        const dueDate = new Date(bill.billDate);
        dueDate.setDate(dueDate.getDate() + 30);
        bill.dueDate = dueDate;
        
        // Calculate units consumed
        bill.unitsConsumed = new Decimal(bill.currentReading)
          .minus(new Decimal(bill.previousReading))
          .toNumber();
        
        // Calculate outstanding amount
        bill.outstandingAmount = new Decimal(bill.totalAmount)
          .plus(new Decimal(bill.previousOutstanding))
          .minus(new Decimal(bill.paidAmount))
          .toNumber();
      },
      
      beforeSave: async (bill) => {
        // Recalculate totals
        const energyCharges = new Decimal(bill.energyCharges);
        const demandCharges = new Decimal(bill.demandCharges);
        const fixedCharges = new Decimal(bill.fixedCharges);
        const fuelSurcharge = new Decimal(bill.fuelSurcharge);
        const electricityDuty = new Decimal(bill.electricityDuty);
        const meterRent = new Decimal(bill.meterRent);
        const powerFactorPenalty = new Decimal(bill.powerFactorPenalty);
        
        bill.subTotal = energyCharges
          .plus(demandCharges)
          .plus(fixedCharges)
          .plus(fuelSurcharge)
          .plus(electricityDuty)
          .plus(meterRent)
          .plus(powerFactorPenalty)
          .toNumber();
        
        // Apply subsidies and adjustments
        const subsidyAmount = new Decimal(bill.subsidyAmount);
        const adjustmentAmount = new Decimal(bill.adjustmentAmount);
        const rebate = new Decimal(bill.rebate);
        const latePaymentPenalty = new Decimal(bill.latePaymentPenalty);
        const interestOnArrears = new Decimal(bill.interestOnArrears);
        
        bill.totalAmount = new Decimal(bill.subTotal)
          .minus(subsidyAmount)
          .plus(adjustmentAmount)
          .minus(rebate)
          .plus(latePaymentPenalty)
          .plus(interestOnArrears)
          .toNumber();
        
        // Recalculate outstanding
        bill.outstandingAmount = new Decimal(bill.totalAmount)
          .plus(new Decimal(bill.previousOutstanding))
          .minus(new Decimal(bill.paidAmount))
          .toNumber();
        
        // Update status based on payment
        if (bill.outstandingAmount <= 0) {
          bill.status = 'paid';
        } else if (bill.paidAmount > 0) {
          bill.status = 'partially_paid';
        } else if (new Date() > bill.dueDate) {
          bill.status = 'overdue';
        }
      }
    }
  });

  // Instance methods
  ElectricityBill.prototype.applyPayment = async function(amount, paymentMethod = 'online', reference = null) {
    const paymentAmount = new Decimal(amount);
    const currentOutstanding = new Decimal(this.outstandingAmount);
    
    if (paymentAmount.greaterThan(currentOutstanding)) {
      throw new Error('Payment amount cannot exceed outstanding amount');
    }
    
    this.paidAmount = new Decimal(this.paidAmount).plus(paymentAmount).toNumber();
    
    // Add to payment history
    const payment = {
      amount: paymentAmount.toNumber(),
      method: paymentMethod,
      reference,
      timestamp: new Date()
    };
    
    const history = [...(this.paymentHistory || [])];
    history.push(payment);
    this.paymentHistory = history;
    
    await this.save();
    return this;
  };

  ElectricityBill.prototype.applyLatePaymentPenalty = function() {
    if (this.status !== 'overdue') return;
    
    const penaltyRate = parseFloat(process.env.LATE_PAYMENT_PENALTY) || 2; // 2% per month
    const daysOverdue = Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
    const monthsOverdue = Math.max(1, Math.floor(daysOverdue / 30));
    
    const penaltyAmount = new Decimal(this.totalAmount)
      .times(new Decimal(penaltyRate))
      .times(new Decimal(monthsOverdue))
      .dividedBy(100)
      .toNumber();
    
    this.latePaymentPenalty = penaltyAmount;
  };

  ElectricityBill.prototype.calculatePowerFactorPenalty = function() {
    if (!this.powerFactor || this.powerFactor >= 0.9) return 0;
    
    // Penalty for poor power factor (below 0.9)
    const penaltyPercentage = (0.9 - this.powerFactor) * 100; // 1% for each 0.01 below 0.9
    const penalty = new Decimal(this.energyCharges)
      .times(new Decimal(penaltyPercentage))
      .dividedBy(100)
      .toNumber();
    
    this.powerFactorPenalty = penalty;
    return penalty;
  };

  ElectricityBill.prototype.calculateCarbonEmissions = function() {
    // Average emission factor for India: 0.82 kg CO2 per kWh
    const emissionFactor = 0.82;
    this.carbonEmissions = new Decimal(this.unitsConsumed)
      .times(new Decimal(emissionFactor))
      .toNumber();
    
    return this.carbonEmissions;
  };

  // Class methods
  ElectricityBill.getOverdueBills = function() {
    return this.findAll({
      where: {
        status: 'overdue',
        outstandingAmount: { [sequelize.Op.gt]: 0 }
      },
      order: [['dueDate', 'ASC']]
    });
  };

  ElectricityBill.getRevenueStats = function(startDate, endDate, filters = {}) {
    const where = {
      billDate: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    if (filters.tariffCategory) where.tariffCategory = filters.tariffCategory;
    if (filters.connectionType) where['$connection.connectionType$'] = filters.connectionType;
    
    return this.findAll({
      attributes: [
        'tariffCategory',
        [sequelize.fn('COUNT', sequelize.col('ElectricityBill.id')), 'billCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
        [sequelize.fn('SUM', sequelize.col('paidAmount')), 'collectedRevenue'],
        [sequelize.fn('SUM', sequelize.col('outstandingAmount')), 'outstandingRevenue'],
        [sequelize.fn('SUM', sequelize.col('unitsConsumed')), 'totalUnits'],
        [sequelize.fn('AVG', sequelize.col('unitsConsumed')), 'avgConsumption']
      ],
      where,
      group: ['tariffCategory'],
      include: [{ 
        association: 'connection', 
        attributes: [] 
      }]
    });
  };

  ElectricityBill.getConsumptionTrends = function(period = 'month') {
    const dateFormat = period === 'month' ? '%Y-%m' : 
                      period === 'quarter' ? '%Y-Q%q' : '%Y';
    
    return this.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('billDate'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('unitsConsumed')), 'totalConsumption'],
        [sequelize.fn('AVG', sequelize.col('unitsConsumed')), 'avgConsumption'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'billCount']
      ],
      where: {
        status: { [sequelize.Op.ne]: 'cancelled' }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('billDate'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('billDate'), dateFormat), 'ASC']]
    });
  };

  return ElectricityBill;
};
