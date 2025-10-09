const Decimal = require('decimal.js');

module.exports = (sequelize, DataTypes) => {
  const WaterBill = sequelize.define('WaterBill', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Bill Identification
    billNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    
    connectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'WaterConnections',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    // Billing Period
    billingPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false
    },
    
    billingPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    
    billDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    
    // Meter Readings
    previousReading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    currentReading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    consumption: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    // Rate Information
    waterRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      comment: 'Rate per kiloliter'
    },
    
    sewerageRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Sewerage charge per kiloliter'
    },
    
    // Charges Calculation
    minimumCharge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    waterCharges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    sewerageCharges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // Additional Charges
    meterRent: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    developmentCharges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    maintenanceCharges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // Taxes
    serviceTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    gst: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // Previous Outstanding
    previousOutstanding: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // Penalties and Rebates
    latePaymentPenalty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    rebateAmount: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // Total Calculations
    currentCharges: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Current period charges excluding outstanding'
    },
    
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Total amount including outstanding and penalties'
    },
    
    // Payment Information
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    outstandingAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    
    // Status
    status: {
      type: DataTypes.ENUM(
        'generated',
        'sent',
        'partially_paid',
        'paid',
        'overdue',
        'cancelled'
      ),
      defaultValue: 'generated'
    },
    
    // Payment Tracking
    lastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // Additional Information
    disconnectionNotice: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    disconnectionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'water_bills',
    timestamps: true,
    indexes: [
      {
        fields: ['billNumber'],
        unique: true
      },
      {
        fields: ['connectionId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['dueDate']
      },
      {
        fields: ['billingPeriodStart', 'billingPeriodEnd']
      }
    ],
    hooks: {
      beforeCreate: async (bill) => {
        // Generate unique bill number
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        
        const count = await WaterBill.count({
          where: {
            createdAt: {
              [sequelize.Op.gte]: new Date(year, new Date().getMonth(), 1),
              [sequelize.Op.lt]: new Date(year, new Date().getMonth() + 1, 1)
            }
          }
        });
        
        bill.billNumber = `WTB${year}${month}${String(count + 1).padStart(6, '0')}`;
        
        // Set due date (30 days from bill date)
        const dueDate = new Date(bill.billDate);
        dueDate.setDate(dueDate.getDate() + 30);
        bill.dueDate = dueDate;
        
        // Calculate charges
        await bill.calculateCharges();
      },
      
      beforeSave: async (bill) => {
        // Calculate outstanding amount
        bill.outstandingAmount = new Decimal(bill.totalAmount)
          .minus(new Decimal(bill.paidAmount))
          .toNumber();
        
        // Update status based on payment
        if (bill.paidAmount >= bill.totalAmount) {
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
  WaterBill.prototype.calculateCharges = async function() {
    try {
      const consumption = new Decimal(this.consumption);
      const waterRate = new Decimal(this.waterRate);
      const sewerageRate = new Decimal(this.sewerageRate);
      const minimumCharge = new Decimal(this.minimumCharge);
      
      // Calculate water charges
      let waterCharges = consumption.times(waterRate);
      if (waterCharges.lessThan(minimumCharge)) {
        waterCharges = minimumCharge;
      }
      this.waterCharges = waterCharges.toNumber();
      
      // Calculate sewerage charges (usually percentage of water charges)
      this.sewerageCharges = consumption.times(sewerageRate).toNumber();
      
      // Calculate current charges
      let currentCharges = new Decimal(this.waterCharges)
        .plus(new Decimal(this.sewerageCharges))
        .plus(new Decimal(this.meterRent))
        .plus(new Decimal(this.developmentCharges))
        .plus(new Decimal(this.maintenanceCharges));
      
      this.currentCharges = currentCharges.toNumber();
      
      // Calculate taxes
      const taxableAmount = currentCharges;
      this.serviceTax = taxableAmount.times(new Decimal(0.18)).toNumber(); // 18% GST
      this.gst = this.serviceTax; // For India, service tax is GST
      
      // Calculate total with taxes
      currentCharges = currentCharges.plus(new Decimal(this.serviceTax));
      
      // Add previous outstanding and penalties
      const totalWithOutstanding = currentCharges
        .plus(new Decimal(this.previousOutstanding))
        .plus(new Decimal(this.latePaymentPenalty))
        .minus(new Decimal(this.rebateAmount));
      
      this.totalAmount = totalWithOutstanding.toNumber();
      this.outstandingAmount = this.totalAmount;
      
    } catch (error) {
      console.error('Charge calculation failed:', error);
      throw error;
    }
  };

  WaterBill.prototype.applyPayment = async function(paymentAmount, paymentMethod = null) {
    const amount = new Decimal(paymentAmount);
    const currentPaid = new Decimal(this.paidAmount);
    
    this.paidAmount = currentPaid.plus(amount).toNumber();
    this.lastPaymentDate = new Date();
    
    if (paymentMethod) {
      this.paymentMethod = paymentMethod;
    }
    
    // Update status
    if (this.paidAmount >= this.totalAmount) {
      this.status = 'paid';
      this.outstandingAmount = 0;
    } else {
      this.status = 'partially_paid';
      this.outstandingAmount = new Decimal(this.totalAmount)
        .minus(new Decimal(this.paidAmount))
        .toNumber();
    }
    
    await this.save();
    return this;
  };

  WaterBill.prototype.applyLatePaymentPenalty = function() {
    if (new Date() > this.dueDate && this.status !== 'paid') {
      const daysOverdue = Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
      const penaltyRate = parseFloat(process.env.LATE_PAYMENT_PENALTY) || 2.0;
      
      // Calculate penalty as percentage of current charges
      const penaltyAmount = new Decimal(this.currentCharges)
        .times(new Decimal(penaltyRate / 100))
        .times(new Decimal(Math.ceil(daysOverdue / 30))); // Monthly penalty
      
      this.latePaymentPenalty = penaltyAmount.toNumber();
      this.totalAmount = new Decimal(this.totalAmount)
        .plus(penaltyAmount)
        .toNumber();
      
      this.outstandingAmount = new Decimal(this.totalAmount)
        .minus(new Decimal(this.paidAmount))
        .toNumber();
    }
    
    return this;
  };

  // Class methods
  WaterBill.findByConnection = function(connectionId, options = {}) {
    const where = { connectionId };
    
    if (options.status) {
      where.status = options.status;
    }
    
    return this.findAll({
      where,
      order: [['billDate', 'DESC']],
      limit: options.limit || 20
    });
  };

  WaterBill.getOverdueBills = function() {
    return this.findAll({
      where: {
        status: ['generated', 'sent', 'partially_paid'],
        dueDate: { [sequelize.Op.lt]: new Date() }
      },
      include: [{ association: 'connection' }],
      order: [['dueDate', 'ASC']]
    });
  };

  WaterBill.getCollectionStats = function(period = 'month') {
    const dateCondition = {
      'today': { [sequelize.Op.gte]: new Date().toDateString() },
      'week': { [sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      'month': { [sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      'quarter': { [sequelize.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    };

    return this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.col('paidAmount')), 'paidAmount'],
        [sequelize.fn('SUM', sequelize.col('outstandingAmount')), 'outstandingAmount']
      ],
      where: {
        billDate: dateCondition[period] || dateCondition.month
      },
      group: ['status']
    });
  };

  return WaterBill;
};
