const Decimal = require('decimal.js');

module.exports = (sequelize, DataTypes) => {
  const ElectricityConnection = sequelize.define('ElectricityConnection', {
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
      allowNull: false,
      index: true
    },
    
    zone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      index: true
    },
    
    // Connection Type and Category
    connectionType: {
      type: DataTypes.ENUM(
        'domestic',
        'commercial',
        'industrial',
        'agricultural',
        'institutional',
        'street_light'
      ),
      allowNull: false,
      index: true
    },
    
    connectionCategory: {
      type: DataTypes.ENUM(
        'bpl',          // Below Poverty Line
        'apl',          // Above Poverty Line
        'hig',          // High Income Group
        'commercial',
        'industrial_small',
        'industrial_medium',
        'industrial_large'
      ),
      allowNull: false
    },
    
    // Technical Specifications
    sanctionedLoad: {
      type: DataTypes.DECIMAL(8, 2), // in kW
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    contractedDemand: {
      type: DataTypes.DECIMAL(8, 2), // in kW
      allowNull: true,
      validate: {
        min: 0
      }
    },
    
    voltage: {
      type: DataTypes.ENUM('110V', '220V', '440V', '11KV', '33KV', '110KV'),
      allowNull: false
    },
    
    phases: {
      type: DataTypes.ENUM('single', 'three'),
      allowNull: false
    },
    
    supplyType: {
      type: DataTypes.ENUM('overhead', 'underground', 'mixed'),
      allowNull: false
    },
    
    // Meter Information
    meterNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    
    meterType: {
      type: DataTypes.ENUM('electromechanical', 'electronic', 'smart', 'prepaid'),
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
        'technical_feasibility',
        'estimate_prepared',
        'payment_pending',
        'work_in_progress',
        'ready_for_connection',
        'connected',
        'active',
        'disconnected_temporary',
        'disconnected_permanent',
        'cancelled'
      ),
      defaultValue: 'applied',
      index: true
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
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    
    developmentCharges: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    
    serviceConnectionCharges: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    
    // Billing Configuration
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'bi_monthly'),
      defaultValue: 'monthly'
    },
    
    tariffCategory: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'LT-1' // Low Tension domestic
    },
    
    lastBillDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    nextBillDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Supply Quality
    powerFactor: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      }
    },
    
    averageVoltage: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    },
    
    // Load Management
    currentLoad: {
      type: DataTypes.DECIMAL(8, 2), // in kW
      defaultValue: 0
    },
    
    maxDemandRecorded: {
      type: DataTypes.DECIMAL(8, 2), // in kW
      defaultValue: 0
    },
    
    loadFactor: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    
    // Subsidies and Concessions
    subsidyEligible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    subsidyPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    
    freeUnitsPerMonth: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    
    // Technical Details
    nearestTransformer: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    feederName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    distributionTransformer: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // Smart Features
    isSmartMeter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    hasLoadLimiter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    hasTimeOfDayMeter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'electricity_connections',
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
        fields: ['ward', 'zone']
      },
      {
        fields: ['status']
      },
      {
        fields: ['connectionType', 'connectionCategory']
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
      },
      {
        fields: ['tariffCategory']
      }
    ],
    hooks: {
      beforeCreate: async (connection) => {
        // Generate unique connection number
        const year = new Date().getFullYear();
        const zoneCode = connection.zone.replace(/[^A-Z0-9]/g, '');
        const typeCode = connection.connectionType.toUpperCase().substring(0, 3);
        
        const count = await ElectricityConnection.count({
          where: {
            zone: connection.zone,
            connectionType: connection.connectionType,
            createdAt: {
              [sequelize.Op.gte]: new Date(year, 0, 1),
              [sequelize.Op.lt]: new Date(year + 1, 0, 1)
            }
          }
        });
        
        connection.connectionNumber = `ELE${year}${zoneCode}${typeCode}${String(count + 1).padStart(6, '0')}`;
        
        // Generate application number
        if (!connection.applicationNumber) {
          connection.applicationNumber = `ELEAPP${year}${String(count + 1).padStart(8, '0')}`;
        }
        
        // Set tariff category based on connection type
        if (!connection.tariffCategory) {
          connection.tariffCategory = connection.getTariffCategory();
        }
      },
      
      beforeUpdate: async (connection, options) => {
        // Update approval and connection dates
        if (connection.changed('status')) {
          const now = new Date();
          
          switch (connection.status) {
            case 'estimate_prepared':
              connection.approvalDate = now;
              break;
            case 'connected':
            case 'active':
              if (!connection.connectionDate) {
                connection.connectionDate = now;
              }
              // Set next bill date
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
  ElectricityConnection.prototype.getTariffCategory = function() {
    const categoryMap = {
      'domestic': {
        'bpl': 'LT-1A', // Subsidized domestic
        'apl': 'LT-1B', // Regular domestic
        'hig': 'LT-1C'  // High income domestic
      },
      'commercial': {
        'commercial': 'LT-2'
      },
      'industrial': {
        'industrial_small': 'LT-3A',
        'industrial_medium': 'HT-3B',
        'industrial_large': 'HT-3C'
      },
      'agricultural': {
        'default': 'AT-1'
      },
      'institutional': {
        'default': 'LT-4'
      },
      'street_light': {
        'default': 'LT-5'
      }
    };
    
    const typeCategories = categoryMap[this.connectionType] || {};
    return typeCategories[this.connectionCategory] || typeCategories['default'] || 'LT-1B';
  };

  ElectricityConnection.prototype.calculateSecurityDeposit = function() {
    const baseRates = {
      'domestic': 100, // per kW
      'commercial': 500,
      'industrial': 1000,
      'agricultural': 50,
      'institutional': 300,
      'street_light': 100
    };
    
    const ratePerKW = baseRates[this.connectionType] || 100;
    const multiplier = parseFloat(process.env.SECURITY_DEPOSIT_MULTIPLIER) || 3;
    
    return new Decimal(this.sanctionedLoad)
      .times(new Decimal(ratePerKW))
      .times(new Decimal(multiplier))
      .toNumber();
  };

  ElectricityConnection.prototype.calculateDevelopmentCharges = function() {
    const chargesPerKW = {
      'domestic': 1000,
      'commercial': 3000,
      'industrial': 5000,
      'agricultural': 500,
      'institutional': 2000,
      'street_light': 800
    };
    
    const rate = chargesPerKW[this.connectionType] || 1000;
    return new Decimal(this.sanctionedLoad).times(new Decimal(rate)).toNumber();
  };

  ElectricityConnection.prototype.isEligibleForSubsidy = function() {
    if (this.connectionType !== 'domestic') return false;
    if (this.connectionCategory !== 'bpl') return false;
    if (this.sanctionedLoad > 5) return false; // Max 5 kW for subsidy
    
    return true;
  };

  ElectricityConnection.prototype.getCurrentConsumption = async function() {
    const MeterReading = require('./MeterReading')(sequelize, DataTypes);
    
    const latestReading = await MeterReading.findOne({
      where: { 
        connectionId: this.id,
        readingType: { [sequelize.Op.in]: ['regular', 'smart_meter'] }
      },
      order: [['readingDate', 'DESC']]
    });
    
    if (!latestReading) {
      return {
        currentReading: this.initialMeterReading,
        consumption: 0,
        demand: 0,
        period: null
      };
    }
    
    const previousReading = await MeterReading.findOne({
      where: {
        connectionId: this.id,
        readingDate: { [sequelize.Op.lt]: latestReading.readingDate },
        readingType: { [sequelize.Op.in]: ['regular', 'smart_meter'] }
      },
      order: [['readingDate', 'DESC']]
    });
    
    const previousValue = previousReading ? 
      previousReading.energyReading : 
      this.initialMeterReading;
    
    const consumption = new Decimal(latestReading.energyReading)
      .minus(new Decimal(previousValue))
      .toNumber();
    
    return {
      currentReading: latestReading.energyReading,
      consumption,
      demand: latestReading.maxDemand || 0,
      powerFactor: latestReading.powerFactor || null,
      period: {
        from: previousReading ? previousReading.readingDate : this.connectionDate,
        to: latestReading.readingDate
      }
    };
  };

  ElectricityConnection.prototype.updateLoadFactor = function(energyConsumed, maxDemand, hours) {
    if (maxDemand > 0 && hours > 0) {
      const averageDemand = energyConsumed / hours;
      this.loadFactor = (averageDemand / maxDemand) * 100;
    }
  };

  // Class methods
  ElectricityConnection.findByConnectionNumber = function(connectionNumber) {
    return this.findOne({
      where: { connectionNumber },
      include: [
        { association: 'meter', limit: 1 },
        { association: 'bills', limit: 5, order: [['billDate', 'DESC']] }
      ]
    });
  };

  ElectricityConnection.findByCustomer = function(customerCitizenId) {
    return this.findAll({
      where: { customerCitizenId, isActive: true },
      order: [['createdAt', 'DESC']]
    });
  };

  ElectricityConnection.getDueForBilling = function() {
    return this.findAll({
      where: {
        status: 'active',
        nextBillDate: {
          [sequelize.Op.lte]: new Date()
        }
      },
      include: [{ association: 'meter' }]
    });
  };

  ElectricityConnection.getConnectionStats = function(filters = {}) {
    const where = { isActive: true };
    
    if (filters.ward) where.ward = filters.ward;
    if (filters.zone) where.zone = filters.zone;
    if (filters.connectionType) where.connectionType = filters.connectionType;
    
    return this.findAll({
      attributes: [
        'status',
        'connectionType',
        'connectionCategory',
        'tariffCategory',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('sanctionedLoad')), 'totalLoad'],
        [sequelize.fn('AVG', sequelize.col('sanctionedLoad')), 'averageLoad']
      ],
      where,
      group: ['status', 'connectionType', 'connectionCategory', 'tariffCategory']
    });
  };

  ElectricityConnection.getLoadDistribution = function(zone = null) {
    const where = { 
      status: 'active',
      isActive: true 
    };
    
    if (zone) where.zone = zone;
    
    return this.findAll({
      attributes: [
        'connectionType',
        'zone',
        [sequelize.fn('SUM', sequelize.col('sanctionedLoad')), 'totalSanctionedLoad'],
        [sequelize.fn('SUM', sequelize.col('currentLoad')), 'totalCurrentLoad'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'connectionCount'],
        [sequelize.fn('AVG', sequelize.col('loadFactor')), 'averageLoadFactor']
      ],
      where,
      group: ['connectionType', 'zone'],
      order: [['zone', 'ASC']]
    });
  };

  return ElectricityConnection;
};
