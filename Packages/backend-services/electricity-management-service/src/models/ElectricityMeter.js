module.exports = (sequelize, DataTypes) => {
  const ElectricityMeter = sequelize.define('ElectricityMeter', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Meter Identification
    meterNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    
    serialNumber: {
      type: DataTypes.STRING(50),
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
      },
      onDelete: 'CASCADE'
    },
    
    // Meter Specifications
    meterType: {
      type: DataTypes.ENUM(
        'electromechanical',
        'electronic_single_phase',
        'electronic_three_phase',
        'smart_meter_ami',
        'smart_meter_rf',
        'prepaid_meter'
      ),
      allowNull: false
    },
    
    make: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    model: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    manufacturingYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1990,
        max: new Date().getFullYear()
      }
    },
    
    // Technical Specifications
    accuracy: {
      type: DataTypes.DECIMAL(4, 2), // percentage
      allowNull: false,
      validate: {
        min: 0.5,
        max: 2.0
      }
    },
    
    ratedVoltage: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    
    ratedCurrent: {
      type: DataTypes.DECIMAL(6, 2), // in Amperes
      allowNull: false
    },
    
    maxCurrent: {
      type: DataTypes.DECIMAL(6, 2), // in Amperes
      allowNull: false
    },
    
    ratedFrequency: {
      type: DataTypes.DECIMAL(4, 1), // in Hz
      defaultValue: 50.0
    },
    
    phases: {
      type: DataTypes.ENUM('single', 'three'),
      allowNull: false
    },
    
    // Installation Details
    installationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    installationLocation: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'GPS coordinates and description of meter location'
    },
    
    installedBy: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Status and Condition
    status: {
      type: DataTypes.ENUM(
        'active',
        'inactive',
        'faulty',
        'under_maintenance',
        'replaced',
        'stolen'
      ),
      defaultValue: 'active',
      index: true
    },
    
    condition: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'damaged'),
      defaultValue: 'good'
    },
    
    // Reading Information
    initialReading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    currentReading: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    
    lastReadingDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Smart Meter Features
    isSmartMeter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      index: true
    },
    
    communicationType: {
      type: DataTypes.ENUM('none', 'rf', 'gsm', 'gprs', 'wifi', 'plc', 'zigbee'),
      allowNull: true
    },
    
    deviceId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'IoT device identifier for smart meters'
    },
    
    simCardNumber: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    
    // Advanced Features
    hasTODMeter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Time of Day metering capability'
    },
    
    hasLoadLimiter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    hasRemoteDisconnect: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    hasEventLogger: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Calibration and Testing
    lastCalibrationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    nextCalibrationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    calibrationInterval: {
      type: DataTypes.INTEGER, // in months
      defaultValue: 60 // 5 years
    },
    
    testCertificateNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // Maintenance Information
    lastMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    nextMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    maintenanceInterval: {
      type: DataTypes.INTEGER, // in months
      defaultValue: 12
    },
    
    // Performance Metrics
    totalReadings: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    communicationSuccessRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    
    lastCommunication: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Power Quality Monitoring (Smart Meters)
    voltageMonitoring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    currentMonitoring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    powerFactorMonitoring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    harmonicsMonitoring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Security Features
    meterSeal: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    tamperEvents: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    lastTamperDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Location and Environmental
    meterLocation: {
      type: DataTypes.ENUM(
        'outdoor_pole',
        'outdoor_wall',
        'indoor_panel',
        'meter_room',
        'underground_chamber'
      ),
      allowNull: true
    },
    
    weatherProtection: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // Additional Information
    warranty: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Warranty information including dates and coverage'
    },
    
    specifications: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional technical specifications'
    },
    
    notes: {
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
    tableName: 'electricity_meters',
    timestamps: true,
    indexes: [
      {
        fields: ['meterNumber'],
        unique: true
      },
      {
        fields: ['serialNumber'],
        unique: true
      },
      {
        fields: ['connectionId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['meterType']
      },
      {
        fields: ['isSmartMeter']
      },
      {
        fields: ['deviceId'],
        unique: true,
        where: {
          deviceId: {
            [sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['lastReadingDate']
      }
    ],
    hooks: {
      beforeCreate: async (meter) => {
        // Generate meter number if not provided
        if (!meter.meterNumber) {
          const year = new Date().getFullYear().toString().slice(-2);
          const typeCode = meter.meterType.substring(0, 3).toUpperCase();
          
          const count = await ElectricityMeter.count({
            where: { meterType: meter.meterType }
          });
          
          meter.meterNumber = `MTR${year}${typeCode}${String(count + 1).padStart(6, '0')}`;
        }
        
        // Set calibration dates
        const now = new Date(meter.installationDate);
        const nextCalibration = new Date(now);
        nextCalibration.setMonth(nextCalibration.getMonth() + meter.calibrationInterval);
        meter.nextCalibrationDate = nextCalibration;
        
        // Set maintenance dates
        const nextMaintenance = new Date(now);
        nextMaintenance.setMonth(nextMaintenance.getMonth() + meter.maintenanceInterval);
        meter.nextMaintenanceDate = nextMaintenance;
      },
      
      beforeUpdate: async (meter, options) => {
        // Update calibration date when calibrated
        if (meter.changed('lastCalibrationDate')) {
          const nextCalibration = new Date(meter.lastCalibrationDate);
          nextCalibration.setMonth(nextCalibration.getMonth() + meter.calibrationInterval);
          meter.nextCalibrationDate = nextCalibration;
        }
        
        // Update maintenance date when maintained
        if (meter.changed('lastMaintenanceDate')) {
          const nextMaintenance = new Date(meter.lastMaintenanceDate);
          nextMaintenance.setMonth(nextMaintenance.getMonth() + meter.maintenanceInterval);
          meter.nextMaintenanceDate = nextMaintenance;
        }
      }
    }
  });

  // Instance methods
  ElectricityMeter.prototype.updateReading = async function(reading, readingDate = null) {
    this.currentReading = reading;
    this.lastReadingDate = readingDate || new Date();
    this.totalReadings += 1;
    
    if (this.isSmartMeter) {
      this.lastCommunication = new Date();
    }
    
    await this.save();
    return this;
  };

  ElectricityMeter.prototype.recordTamperEvent = async function(eventType, description = null) {
    this.tamperEvents += 1;
    this.lastTamperDate = new Date();
    
    // Log tamper event (would integrate with security monitoring)
    const tamperLog = {
      eventType,
      description,
      timestamp: new Date(),
      meterNumber: this.meterNumber,
      connectionId: this.connectionId
    };
    
    // Store in metadata
    const events = this.metadata.tamperEvents || [];
    events.push(tamperLog);
    this.metadata = { ...this.metadata, tamperEvents: events };
    
    await this.save();
    return tamperLog;
  };

  ElectricityMeter.prototype.performMaintenance = async function(maintenanceType, performedBy, notes = null) {
    this.lastMaintenanceDate = new Date();
    this.condition = 'good'; // Assume maintenance improves condition
    
    const nextMaintenance = new Date();
    nextMaintenance.setMonth(nextMaintenance.getMonth() + this.maintenanceInterval);
    this.nextMaintenanceDate = nextMaintenance;
    
    // Record maintenance activity
    const maintenanceRecord = {
      type: maintenanceType,
      performedBy,
      date: new Date(),
      notes
    };
    
    const maintenance = this.metadata.maintenanceHistory || [];
    maintenance.push(maintenanceRecord);
    this.metadata = { ...this.metadata, maintenanceHistory: maintenance };
    
    await this.save();
    return maintenanceRecord;
  };

  ElectricityMeter.prototype.calibrate = async function(calibratedBy, testResults = {}) {
    this.lastCalibrationDate = new Date();
    
    const nextCalibration = new Date();
    nextCalibration.setMonth(nextCalibration.getMonth() + this.calibrationInterval);
    this.nextCalibrationDate = nextCalibration;
    
    // Record calibration
    const calibrationRecord = {
      calibratedBy,
      date: new Date(),
      testResults,
      accuracy: testResults.accuracy || this.accuracy
    };
    
    const calibrations = this.metadata.calibrationHistory || [];
    calibrations.push(calibrationRecord);
    this.metadata = { ...this.metadata, calibrationHistory: calibrations };
    
    await this.save();
    return calibrationRecord;
  };

  ElectricityMeter.prototype.isDueForMaintenance = function() {
    if (!this.nextMaintenanceDate) return false;
    const now = new Date();
    const dueDate = new Date(this.nextMaintenanceDate);
    return now >= dueDate;
  };

  ElectricityMeter.prototype.isDueForCalibration = function() {
    if (!this.nextCalibrationDate) return false;
    const now = new Date();
    const dueDate = new Date(this.nextCalibrationDate);
    return now >= dueDate;
  };

  ElectricityMeter.prototype.getAge = function() {
    const now = new Date();
    const installDate = new Date(this.installationDate);
    const ageInYears = (now - installDate) / (1000 * 60 * 60 * 24 * 365);
    return Math.floor(ageInYears * 10) / 10; // Round to 1 decimal place
  };

  ElectricityMeter.prototype.calculateCommunicationHealth = function() {
    if (!this.isSmartMeter) return null;
    
    const daysSinceLastComm = this.lastCommunication ? 
      (new Date() - new Date(this.lastCommunication)) / (1000 * 60 * 60 * 24) : 999;
    
    let health = 'excellent';
    if (daysSinceLastComm > 7) health = 'poor';
    else if (daysSinceLastComm > 3) health = 'fair';
    else if (daysSinceLastComm > 1) health = 'good';
    
    return {
      status: health,
      daysSinceLastCommunication: Math.floor(daysSinceLastComm),
      successRate: this.communicationSuccessRate || 0
    };
  };

  // Class methods
  ElectricityMeter.findByMeterNumber = function(meterNumber) {
    return this.findOne({
      where: { meterNumber },
      include: [{ association: 'connection' }]
    });
  };

  ElectricityMeter.getSmartMeters = function(filters = {}) {
    const where = { isSmartMeter: true };
    
    if (filters.status) where.status = filters.status;
    if (filters.communicationType) where.communicationType = filters.communicationType;
    
    return this.findAll({
      where,
      include: [{ association: 'connection' }],
      order: [['lastCommunication', 'DESC']]
    });
  };

  ElectricityMeter.getDueForMaintenance = function(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.findAll({
      where: {
        nextMaintenanceDate: {
          [sequelize.Op.lte]: futureDate
        },
        status: { [sequelize.Op.ne]: 'replaced' }
      },
      include: [{ association: 'connection' }],
      order: [['nextMaintenanceDate', 'ASC']]
    });
  };

  ElectricityMeter.getDueForCalibration = function(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.findAll({
      where: {
        nextCalibrationDate: {
          [sequelize.Op.lte]: futureDate
        },
        status: { [sequelize.Op.ne]: 'replaced' }
      },
      include: [{ association: 'connection' }],
      order: [['nextCalibrationDate', 'ASC']]
    });
  };

  ElectricityMeter.getMeterStatistics = function() {
    return this.findAll({
      attributes: [
        'meterType',
        'status',
        'make',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('communicationSuccessRate')), 'avgCommRate'],
        [sequelize.fn('SUM', sequelize.col('tamperEvents')), 'totalTamperEvents']
      ],
      where: { isActive: true },
      group: ['meterType', 'status', 'make']
    });
  };

  ElectricityMeter.getCommunicationHealth = function() {
    return this.findAll({
      where: {
        isSmartMeter: true,
        status: 'active'
      },
      attributes: [
        'meterNumber',
        'lastCommunication',
        'communicationSuccessRate',
        'connectionId'
      ],
      order: [['lastCommunication', 'DESC']]
    });
  };

  return ElectricityMeter;
};
