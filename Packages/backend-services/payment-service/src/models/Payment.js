const Decimal = require('decimal.js');

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Payment Identification
    paymentId: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    
    // Transaction Details
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR'
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Service Integration
    serviceType: {
      type: DataTypes.ENUM(
        'property_tax',
        'grievance_fee',
        'water_bill',
        'waste_fee',
        'license_fee',
        'penalty',
        'other'
      ),
      allowNull: false
    },
    
    serviceReferenceId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Reference ID from the requesting service'
    },
    
    // Customer Information
    customerCitizenId: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    
    customerEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    customerPhone: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    
    // Payment Gateway Details
    gatewayProvider: {
      type: DataTypes.ENUM(
        'razorpay',
        'stripe',
        'payu',
        'ccavenue',
        'upi',
        'netbanking',
        'offline'
      ),
      allowNull: false
    },
    
    gatewayTransactionId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    gatewayOrderId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    gatewayPaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Payment Method
    paymentMethod: {
      type: DataTypes.ENUM(
        'credit_card',
        'debit_card',
        'net_banking',
        'upi',
        'wallet',
        'cash',
        'cheque',
        'dd'
      ),
      allowNull: true
    },
    
    // Status and Processing
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded'
      ),
      defaultValue: 'pending'
    },
    
    // Timestamps
    initiatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Fees and Charges
    gatewayFees: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0
    },
    
    processingFees: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0
    },
    
    netAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Amount after deducting fees'
    },
    
    // Failure Information
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    gatewayResponse: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Full response from payment gateway'
    },
    
    // Receipt Information
    receiptNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    
    receiptGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Refund Information
    refundAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Additional Data
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    
    // Audit Trail
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true
    },
    
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      {
        fields: ['paymentId'],
        unique: true
      },
      {
        fields: ['customerCitizenId']
      },
      {
        fields: ['serviceType', 'serviceReferenceId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['gatewayProvider']
      },
      {
        fields: ['gatewayTransactionId']
      },
      {
        fields: ['receiptNumber'],
        unique: true,
        where: {
          receiptNumber: {
            [sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['initiatedAt']
      }
    ],
    hooks: {
      beforeCreate: async (payment) => {
        // Generate unique payment ID
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        payment.paymentId = `PAY${timestamp}${random}`;
        
        // Calculate net amount
        const amount = new Decimal(payment.amount);
        const fees = new Decimal(payment.gatewayFees || 0).plus(new Decimal(payment.processingFees || 0));
        payment.netAmount = amount.minus(fees).toNumber();
      },
      
      beforeUpdate: async (payment, options) => {
        // Update timestamps based on status changes
        if (payment.changed('status')) {
          const now = new Date();
          
          switch (payment.status) {
            case 'completed':
              payment.completedAt = now;
              if (!payment.receiptNumber) {
                payment.receiptNumber = await generateReceiptNumber();
              }
              break;
            case 'failed':
            case 'cancelled':
              payment.failedAt = now;
              break;
          }
        }
      }
    }
  });

  // Instance methods
  Payment.prototype.markAsCompleted = async function(gatewayResponse = {}) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.gatewayResponse = gatewayResponse;
    this.receiptGenerated = true;
    
    if (!this.receiptNumber) {
      this.receiptNumber = await generateReceiptNumber();
    }
    
    await this.save();
    return this;
  };

  Payment.prototype.markAsFailed = async function(reason, gatewayResponse = {}) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    this.gatewayResponse = gatewayResponse;
    
    await this.save();
    return this;
  };

  Payment.prototype.processRefund = async function(refundAmount, reason) {
    const currentRefund = new Decimal(this.refundAmount || 0);
    const newRefundAmount = currentRefund.plus(new Decimal(refundAmount));
    const totalAmount = new Decimal(this.amount);
    
    if (newRefundAmount.greaterThan(totalAmount)) {
      throw new Error('Refund amount cannot exceed payment amount');
    }
    
    this.refundAmount = newRefundAmount.toNumber();
    this.refundReason = reason;
    
    if (newRefundAmount.equals(totalAmount)) {
      this.status = 'refunded';
    } else {
      this.status = 'partially_refunded';
    }
    
    await this.save();
    return this;
  };

  // Class methods
  Payment.findByServiceReference = function(serviceType, serviceReferenceId) {
    return this.findAll({
      where: {
        serviceType,
        serviceReferenceId
      },
      order: [['createdAt', 'DESC']]
    });
  };

  Payment.findByCustomer = function(customerCitizenId, options = {}) {
    const where = { customerCitizenId };
    
    if (options.serviceType) {
      where.serviceType = options.serviceType;
    }
    
    if (options.status) {
      where.status = options.status;
    }
    
    return this.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 50
    });
  };

  Payment.getPaymentStats = function(filters = {}) {
    const where = {};
    
    if (filters.startDate) {
      where.createdAt = { [sequelize.Op.gte]: filters.startDate };
    }
    
    if (filters.endDate) {
      where.createdAt = { 
        ...where.createdAt,
        [sequelize.Op.lte]: filters.endDate 
      };
    }
    
    if (filters.serviceType) {
      where.serviceType = filters.serviceType;
    }
    
    return this.findAll({
      attributes: [
        'status',
        'serviceType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'avgAmount']
      ],
      where,
      group: ['status', 'serviceType']
    });
  };

  return Payment;
};

// Helper function to generate receipt number
async function generateReceiptNumber() {
  const Payment = require('./index').Payment;
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const count = await Payment.count({
    where: {
      receiptNumber: {
        [sequelize.Op.like]: `RCP${year}${month}%`
      }
    }
  });
  
  return `RCP${year}${month}${String(count + 1).padStart(6, '0')}`;
}
