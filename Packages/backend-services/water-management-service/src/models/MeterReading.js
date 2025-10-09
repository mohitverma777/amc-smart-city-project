const Decimal = require('decimal.js');

module.exports = (sequelize, DataTypes) => {
  const MeterReading = sequelize.define('MeterReading', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Connection Reference
    connectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'WaterConnections',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    // Reading Information
    readingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    currentReading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    previousReading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    
    consumption: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    // Reading Type and Source
    readingType: {
      type: DataTypes.ENUM(
        'regular',
        'special',
        'estimated',
        'final',
        'initial'
      ),
      defaultValue: 'regular'
    },
    
    readingSource: {
      type: DataTypes.ENUM(
        'manual',
        'automated',
        'iot_sensor',
        'mobile_app',
        'web_portal'
      ),
      defaultValue: 'manual'
    },
    
    // Reader Information
    readBy: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    readerName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Validation and Quality
    isValidated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    validatedBy: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    validatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Image Evidence
    meterImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path to meter reading photo'
    },
    
    // Billing Period
    billingPeriodStart: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    billingPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Status and Flags
    status: {
      type: DataTypes.ENUM(
        'pending',
        'validated',
        'billed',
        'disputed',
        'corrected'
      ),
      defaultValue: 'pending'
    },
    
    isEstimated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    isBilled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Anomaly Detection
    hasAnomaly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    anomalyType: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    anomalyDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Additional Information
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional reading data from IoT sensors'
    }
  }, {
    tableName: 'water_meter_readings',
    timestamps: true,
    indexes: [
      {
        fields: ['connectionId', 'readingDate'],
        unique: true
      },
      {
        fields: ['readingDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['readingType']
      },
      {
        fields: ['isValidated']
      },
      {
        fields: ['hasAnomaly']
      }
    ],
    hooks: {
      beforeCreate: async (reading) => {
        // Calculate consumption if previous reading exists
        if (reading.previousReading !== null) {
          reading.consumption = new Decimal(reading.currentReading)
            .minus(new Decimal(reading.previousReading))
            .toNumber();
        } else {
          // Get the most recent reading
          const lastReading = await MeterReading.findOne({
            where: { connectionId: reading.connectionId },
            order: [['readingDate', 'DESC']]
          });
          
          if (lastReading) {
            reading.previousReading = lastReading.currentReading;
            reading.consumption = new Decimal(reading.currentReading)
              .minus(new Decimal(lastReading.currentReading))
              .toNumber();
          } else {
            // Use connection's initial reading
            const WaterConnection = require('./WaterConnection')(sequelize, DataTypes);
            const connection = await WaterConnection.findByPk(reading.connectionId);
            
            if (connection) {
              reading.previousReading = connection.initialMeterReading;
              reading.consumption = new Decimal(reading.currentReading)
                .minus(new Decimal(connection.initialMeterReading))
                .toNumber();
            }
          }
        }
        
        // Anomaly detection
        await reading.detectAnomalies();
      },
      
      beforeUpdate: async (reading, options) => {
        // Update validation timestamp
        if (reading.changed('isValidated') && reading.isValidated) {
          reading.validatedBy = options.userId || 'system';
          reading.validatedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  MeterReading.prototype.detectAnomalies = async function() {
    try {
      // Get recent readings for comparison
      const recentReadings = await MeterReading.findAll({
        where: {
          connectionId: this.connectionId,
          readingDate: {
            [sequelize.Op.lt]: this.readingDate
          }
        },
        order: [['readingDate', 'DESC']],
        limit: 6
      });

      if (recentReadings.length < 3) {
        return; // Not enough data for anomaly detection
      }

      // Calculate average consumption
      const avgConsumption = recentReadings.reduce((sum, reading) => {
        return sum.plus(new Decimal(reading.consumption));
      }, new Decimal(0)).dividedBy(recentReadings.length);

      const currentConsumption = new Decimal(this.consumption);
      
      // Check for unusual consumption (more than 300% of average)
      if (currentConsumption.greaterThan(avgConsumption.times(3))) {
        this.hasAnomaly = true;
        this.anomalyType = 'high_consumption';
        this.anomalyDescription = `Consumption (${currentConsumption}) is ${currentConsumption.dividedBy(avgConsumption).toFixed(1)}x higher than average (${avgConsumption.toFixed(1)})`;
      }
      
      // Check for zero consumption anomaly
      if (currentConsumption.equals(0) && avgConsumption.greaterThan(10)) {
        this.hasAnomaly = true;
        this.anomalyType = 'zero_consumption';
        this.anomalyDescription = 'Zero consumption detected when average is significant';
      }
      
      // Check for negative consumption (meter rollover or error)
      if (currentConsumption.lessThan(0)) {
        this.hasAnomaly = true;
        this.anomalyType = 'negative_consumption';
        this.anomalyDescription = 'Negative consumption detected - possible meter error';
      }
      
    } catch (error) {
      console.error('Anomaly detection failed:', error);
    }
  };

  MeterReading.prototype.validate = async function(userId) {
    this.isValidated = true;
    this.validatedBy = userId;
    this.validatedAt = new Date();
    this.status = 'validated';
    
    await this.save();
    return this;
  };

  MeterReading.prototype.markAsDisputed = async function(reason) {
    this.status = 'disputed';
    this.remarks = reason;
    
    await this.save();
    return this;
  };

  // Class methods
  MeterReading.findByConnection = function(connectionId, options = {}) {
    const where = { connectionId };
    
    if (options.startDate) {
      where.readingDate = { [sequelize.Op.gte]: options.startDate };
    }
    
    if (options.endDate) {
      where.readingDate = {
        ...where.readingDate,
        [sequelize.Op.lte]: options.endDate
      };
    }
    
    return this.findAll({
      where,
      order: [['readingDate', options.order || 'DESC']],
      limit: options.limit || 50
    });
  };

  MeterReading.getPendingValidation = function() {
    return this.findAll({
      where: {
        isValidated: false,
        status: 'pending'
      },
      include: [{ association: 'connection' }],
      order: [['readingDate', 'ASC']]
    });
  };

  MeterReading.getAnomalousReadings = function() {
    return this.findAll({
      where: { hasAnomaly: true },
      include: [{ association: 'connection' }],
      order: [['readingDate', 'DESC']]
    });
  };

  MeterReading.getConsumptionStats = function(connectionId, period = 'month') {
    const dateFilter = {
      'week': { [sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      'month': { [sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      'quarter': { [sequelize.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      'year': { [sequelize.Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    };

    return this.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', period, sequelize.col('readingDate')), 'period'],
        [sequelize.fn('SUM', sequelize.col('consumption')), 'totalConsumption'],
        [sequelize.fn('AVG', sequelize.col('consumption')), 'avgConsumption'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'readingCount']
      ],
      where: {
        connectionId,
        readingDate: dateFilter[period],
        isValidated: true
      },
      group: [sequelize.fn('DATE_TRUNC', period, sequelize.col('readingDate'))],
      order: [[sequelize.fn('DATE_TRUNC', period, sequelize.col('readingDate')), 'ASC']]
    });
  };

  return MeterReading;
};
