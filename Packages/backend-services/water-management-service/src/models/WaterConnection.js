const Decimal = require('decimal.js');

module.exports = (sequelize, DataTypes) => {
  const WaterConnection = sequelize.define('WaterConnection', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Connection Identification
    connectionNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    
    applicationNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true
    },
    
    // Customer Information
    customerCitizenId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'users',
        key: 'citizenId'
      }
    },
    
    // Property Details
    propertyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    
    premiseAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidAddress(value) {
          if (!value.street || !value.area || !value.pincode) {
            throw new Error('Address must include street, area, and pincode');
          }
        }
      }
    },
    
    ward: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    zone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    
    // Connection Type and Category
    connectionType: {
      type: DataTypes.ENUM(
        'domestic',
        'commercial',
        'industrial',
        'institutional',
        'bulk'
      ),
      allowNull: false
    },
    
    connectionCategory: {
      type: DataTypes.ENUM(
        'new',
        'additional',
        'temporary',
        'bulk_supply'
      ),
      allowNull: false
    },
    
    // Technical Specifications
    pipeSize: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Pipe diameter in mm'
    },
    
    meterNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    
    meterType: {
      type: DataTypes.ENUM('mechanical', 'digital', 'smart'),
      allowNull: true
    },
    
    initialMeterReading: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    
    // Status and Approval
    status: {
      type: DataTypes.ENUM(
        'applied',
        'document_verification',
        'site_inspection',
        'approved',
        'work_in_progress',
        'connected',
        'active',
        'suspended',
        'disconnected',
        'cancelled'
      ),
      defaultValue: 'applied'
    },
    
    applicationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    connectionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Financial Details
    securityDeposit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    
    connectionCharges: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    
    // Billing Configuration
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'half_yearly'),
      defaultValue: 'monthly'
    },
    
    lastBillDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    nextBillDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Service Details
    supplyHours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      validate: {
        min: 0,
        max: 24
      }
    },
    
    supplyDays: {
      type: DataTypes.INTEGER,
      defaultValue: 7,
      validate: {
        min: 1,
        max: 7
      }
    },
    
    // Contact Information
    contactNumber: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: /^[6-9]\d{9}$/
      }
    },
    
    emailAddress: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    
    // Additional Information
    specialInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'water_connections',
    timestamps: true,
    indexes: [
      {
        fields: ['connectionNumber'],
        unique: true
      },
      {
        fields: ['customerCitizenId']
      },
      {
        fields: ['ward']
      },
      {
        fields: ['zone']
      },
      {
        fields: ['status']
      },
      {
        fields: ['connectionType']
      },
      {
        fields: ['meterNumber'],
        unique: true,
        where: {
          meterNumber: {
            [sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['nextBillDate']
      }
    ],
    hooks: {
      beforeCreate: async (connection) => {
        // Generate unique connection number
        const year = new Date().getFullYear();
        const zone = connection.zone.replace(/[^A-Z0-9]/g, '');
        const type = connection.connectionType.toUpperCase().substring(0, 3);
        
        const count = await WaterConnection.count({
          where: {
            zone: connection.zone,
            connectionType: connection.connectionType,
            createdAt: {
              [sequelize.Op.gte]: new Date(year, 0, 1),
              [sequelize.Op.lt]: new Date(year + 1, 0, 1)
            }
          }
        });
        
        connection.connectionNumber = `WTR${year}${zone}${type}${String(count + 1).padStart(6, '0')}`;
        
        // Generate application number if not provided
        if (!connection.applicationNumber) {
          connection.applicationNumber = `APP${year}${String(count + 1).padStart(8, '0')}`;
        }
      },
      
      beforeUpdate: async (connection, options) => {
        // Update approval and connection dates
        if (connection.changed('status')) {
          const now = new Date();
          
          switch (connection.status) {
            case 'approved':
              connection.approvalDate = now;
              break;
            case 'connected':
            case 'active':
              if (!connection.connectionDate) {
                connection.connectionDate = now;
              }
              // Set next bill date if not set
              if (!connection.nextBillDate) {
                const nextBill = new Date(now);
                nextBill.setMonth(nextBill.getMonth() + 1);
                connection.nextBillDate = nextBill;
              }
              break;
          }
        }
      }
    }
  });

  // Instance methods
  WaterConnection.prototype.calculateSecurityDeposit = function() {
    const rates = {
      'domestic': 1000,
      'commercial': 5000,
      'industrial': 15000,
      'institutional': 3000,
      'bulk': 25000
    };
    
    return rates[this.connectionType] || 1000;
  };

  WaterConnection.prototype.calculateConnectionCharges = function() {
    // Base charges by connection type
    const baseCharges = {
      'domestic': 2500,
      'commercial': 7500,
      'industrial': 20000,
      'institutional': 5000,
      'bulk': 50000
    };
    
    let charges = new Decimal(baseCharges[this.connectionType] || 2500);
    
    // Add pipe size charges
    if (this.pipeSize) {
      const pipeSize = parseInt(this.pipeSize);
      if (pipeSize > 15) {
        charges = charges.plus(new Decimal(pipeSize * 50));
      }
    }
    
    return charges.toNumber();
  };

  WaterConnection.prototype.getCurrentConsumption = async function() {
    const MeterReading = require('./MeterReading')(sequelize, DataTypes);
    
    const latestReading = await MeterReading.findOne({
      where: { connectionId: this.id },
      order: [['readingDate', 'DESC']]
    });
    
    if (!latestReading) {
      return {
        currentReading: this.initialMeterReading,
        consumption: 0,
        period: null
      };
    }
    
    const previousReading = await MeterReading.findOne({
      where: {
        connectionId: this.id,
        readingDate: { [sequelize.Op.lt]: latestReading.readingDate }
      },
      order: [['readingDate', 'DESC']]
    });
    
    const previousValue = previousReading ? 
      previousReading.currentReading : 
      this.initialMeterReading;
    
    return {
      currentReading: latestReading.currentReading,
      consumption: new Decimal(latestReading.currentReading)
        .minus(new Decimal(previousValue))
        .toNumber(),
      period: {
        from: previousReading ? previousReading.readingDate : this.connectionDate,
        to: latestReading.readingDate
      }
    };
  };

  // Class methods
  WaterConnection.findByConnectionNumber = function(connectionNumber) {
    return this.findOne({
      where: { connectionNumber },
      include: [
        { association: 'meterReadings', limit: 5, order: [['readingDate', 'DESC']] },
        { association: 'bills', limit: 3, order: [['billDate', 'DESC']] }
      ]
    });
  };

  WaterConnection.findByCustomer = function(customerCitizenId) {
    return this.findAll({
      where: { customerCitizenId, isActive: true },
      order: [['createdAt', 'DESC']]
    });
  };

  WaterConnection.getDueForBilling = function() {
    return this.findAll({
      where: {
        status: 'active',
        nextBillDate: {
          [sequelize.Op.lte]: new Date()
        }
      },
      include: [{ association: 'meterReadings' }]
    });
  };

  WaterConnection.getConnectionStats = function(filters = {}) {
    const where = { isActive: true };
    
    if (filters.ward) where.ward = filters.ward;
    if (filters.zone) where.zone = filters.zone;
    if (filters.connectionType) where.connectionType = filters.connectionType;
    
    return this.findAll({
      attributes: [
        'status',
        'connectionType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['status', 'connectionType']
    });
  };

  return WaterConnection;
};
