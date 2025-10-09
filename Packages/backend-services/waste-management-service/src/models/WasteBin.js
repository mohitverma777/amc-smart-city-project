module.exports = (sequelize, DataTypes) => {
  const WasteBin = sequelize.define('WasteBin', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Bin Identification
    binId: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    
    qrCode: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true
    },
    
    rfidTag: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    },
    
    // Location Information
    location: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        hasCoordinates(value) {
          if (!value.latitude || !value.longitude) {
            throw new Error('Location must include latitude and longitude');
          }
        }
      }
    },
    
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    
    ward: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    zone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    
    area: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    
    landmark: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    
    // Bin Specifications
    binType: {
      type: DataTypes.ENUM(
        'household',
        'commercial',
        'public',
        'industrial',
        'medical',
        'e_waste',
        'hazardous'
      ),
      allowNull: false
    },
    
    wasteCategory: {
      type: DataTypes.ENUM(
        'mixed',
        'organic',
        'recyclable',
        'non_recyclable',
        'hazardous',
        'electronic',
        'medical'
      ),
      allowNull: false
    },
    
    capacity: {
      type: DataTypes.DECIMAL(6, 2), // in liters
      allowNull: false,
      validate: {
        min: 10,
        max: 10000
      }
    },
    
    material: {
      type: DataTypes.ENUM('plastic', 'metal', 'fiberglass', 'concrete'),
      allowNull: false
    },
    
    color: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    
    // IoT and Smart Features
    hasIoTSensor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    sensorType: {
      type: DataTypes.ENUM('ultrasonic', 'weight', 'laser', 'camera'),
      allowNull: true
    },
    
    deviceId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    
    batteryLevel: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    
    signalStrength: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    
    lastSensorUpdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Fill Level Monitoring
    currentFillLevel: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    
    fillLevelHistory: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of fill level readings with timestamps'
    },
    
    // Collection Information
    lastCollectionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    nextScheduledCollection: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    collectionFrequency: {
      type: DataTypes.ENUM('daily', 'alternate_days', 'weekly', 'on_demand'),
      defaultValue: 'weekly'
    },
    
    totalCollections: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    averageWasteGeneration: {
      type: DataTypes.DECIMAL(8, 2), // kg per day
      allowNull: true
    },
    
    // Status and Condition
    status: {
      type: DataTypes.ENUM(
        'active',
        'full',
        'overflowing',
        'damaged',
        'maintenance',
        'missing',
        'retired'
      ),
      defaultValue: 'active'
    },
    
    condition: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'damaged'),
      defaultValue: 'good'
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
    
    maintenanceNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Environmental Factors
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    accessRestrictions: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    
    installationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Alerts and Issues
    hasAlerts: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    alerts: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of active alerts'
    },
    
    issuesReported: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Usage Statistics
    peakUsageDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER), // 0=Sunday, 1=Monday, etc.
      defaultValue: []
    },
    
    peakUsageHours: {
      type: DataTypes.ARRAY(DataTypes.INTEGER), // 0-23 hours
      defaultValue: []
    },
    
    // Additional Information
    adoptedBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Individual or organization that adopted this bin'
    },
    
    sponsoredBy: {
      type: DataTypes.STRING(100),
      allowNull: true
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
    tableName: 'waste_bins',
    timestamps: true,
    indexes: [
      {
        fields: ['binId'],
        unique: true
      },
      {
        fields: ['ward', 'zone']
      },
      {
        fields: ['status']
      },
      {
        fields: ['binType', 'wasteCategory']
      },
      {
        fields: ['hasIoTSensor']
      },
      {
        fields: ['currentFillLevel']
      },
      {
        fields: ['nextScheduledCollection']
      },
      {
        fields: ['deviceId'],
        unique: true,
        where: {
          deviceId: {
            [sequelize.Op.ne]: null
          }
        }
      }
    ],
    hooks: {
      beforeCreate: async (bin) => {
        // Generate unique bin ID
        const year = new Date().getFullYear().toString().slice(-2);
        const zoneCode = bin.zone.replace(/[^A-Z0-9]/g, '');
        const typeCode = bin.binType.substring(0, 2).toUpperCase();
        
        const count = await WasteBin.count({
          where: {
            zone: bin.zone,
            binType: bin.binType
          }
        });
        
        bin.binId = `WB${year}${zoneCode}${typeCode}${String(count + 1).padStart(4, '0')}`;
        
        // Generate QR code data
        bin.qrCode = `amc-bin:${bin.binId}:${bin.location.latitude},${bin.location.longitude}`;
      },
      
      beforeUpdate: async (bin, options) => {
        // Update alerts based on fill level
        if (bin.changed('currentFillLevel')) {
          const alerts = [...(bin.alerts || [])];
          
          if (bin.currentFillLevel >= 95) {
            bin.status = 'overflowing';
            alerts.push({
              type: 'overflow',
              message: 'Bin is overflowing',
              severity: 'critical',
              createdAt: new Date()
            });
          } else if (bin.currentFillLevel >= 85) {
            bin.status = 'full';
            alerts.push({
              type: 'full',
              message: 'Bin is nearly full',
              severity: 'high',
              createdAt: new Date()
            });
          } else if (bin.status === 'full' || bin.status === 'overflowing') {
            bin.status = 'active';
          }
          
          bin.alerts = alerts;
          bin.hasAlerts = alerts.length > 0;
        }
      }
    }
  });

  // Instance methods
  WasteBin.prototype.updateFillLevel = async function(fillLevel, sensorData = {}) {
    // Update current fill level
    this.currentFillLevel = Math.max(0, Math.min(100, fillLevel));
    this.lastSensorUpdate = new Date();
    
    // Update sensor data
    if (sensorData.batteryLevel !== undefined) {
      this.batteryLevel = sensorData.batteryLevel;
    }
    
    if (sensorData.signalStrength !== undefined) {
      this.signalStrength = sensorData.signalStrength;
    }
    
    // Add to fill level history
    const history = [...(this.fillLevelHistory || [])];
    history.push({
      level: fillLevel,
      timestamp: new Date(),
      ...sensorData
    });
    
    // Keep only last 100 readings
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.fillLevelHistory = history;
    
    await this.save();
    return this;
  };

  WasteBin.prototype.recordCollection = async function(wasteAmount, collectionDate = null) {
    this.lastCollectionDate = collectionDate || new Date();
    this.totalCollections = this.totalCollections + 1;
    this.currentFillLevel = 0; // Bin is empty after collection
    
    // Update average waste generation
    if (this.totalCollections > 1 && this.averageWasteGeneration) {
      this.averageWasteGeneration = (
        (parseFloat(this.averageWasteGeneration) * (this.totalCollections - 1) + wasteAmount) / 
        this.totalCollections
      );
    } else {
      this.averageWasteGeneration = wasteAmount;
    }
    
    // Clear collection-related alerts
    this.alerts = (this.alerts || []).filter(alert => 
      !['full', 'overflow'].includes(alert.type)
    );
    this.hasAlerts = this.alerts.length > 0;
    
    // Set next collection date based on frequency
    this.setNextCollectionDate();
    
    await this.save();
    return this;
  };

  WasteBin.prototype.setNextCollectionDate = function() {
    if (!this.lastCollectionDate) return;
    
    const nextDate = new Date(this.lastCollectionDate);
    
    switch (this.collectionFrequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'alternate_days':
        nextDate.setDate(nextDate.getDate() + 2);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
    }
    
    this.nextScheduledCollection = nextDate;
  };

  WasteBin.prototype.addAlert = async function(type, message, severity = 'medium') {
    const alerts = [...(this.alerts || [])];
    alerts.push({
      type,
      message,
      severity,
      createdAt: new Date()
    });
    
    this.alerts = alerts;
    this.hasAlerts = true;
    
    await this.save();
    return this;
  };

  WasteBin.prototype.clearAlerts = async function(alertType = null) {
    if (alertType) {
      this.alerts = (this.alerts || []).filter(alert => alert.type !== alertType);
    } else {
      this.alerts = [];
    }
    
    this.hasAlerts = this.alerts.length > 0;
    
    await this.save();
    return this;
  };

  WasteBin.prototype.needsCollection = function() {
    return this.currentFillLevel >= 85 || 
           (this.nextScheduledCollection && new Date() >= this.nextScheduledCollection);
  };

  WasteBin.prototype.getEfficiencyScore = function() {
    if (this.totalCollections === 0) return 0;
    
    // Calculate efficiency based on utilization vs collection frequency
    const avgFillAtCollection = this.averageWasteGeneration ? 
      (this.averageWasteGeneration / this.capacity) * 100 : 50;
    
    return Math.min(100, Math.max(0, avgFillAtCollection));
  };

  // Class methods
  WasteBin.findNearbyBins = function(latitude, longitude, radiusKm = 1, wasteCategory = null) {
    // This would typically use PostGIS for proper geospatial queries
    const where = { isActive: true };
    
    if (wasteCategory) {
      where.wasteCategory = wasteCategory;
    }
    
    return this.findAll({
      where,
      order: [['updatedAt', 'DESC']] // Temporary ordering
    });
  };

  WasteBin.getBinsNeedingCollection = function() {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { currentFillLevel: { [sequelize.Op.gte]: 85 } },
          { nextScheduledCollection: { [sequelize.Op.lte]: new Date() } }
        ],
        status: { [sequelize.Op.notIn]: ['maintenance', 'damaged', 'missing'] }
      },
      order: [['currentFillLevel', 'DESC']]
    });
  };

  WasteBin.getOverflowingBins = function() {
    return this.findAll({
      where: {
        status: { [sequelize.Op.in]: ['full', 'overflowing'] }
      },
      order: [['currentFillLevel', 'DESC']]
    });
  };

  WasteBin.getBinStatistics = function(filters = {}) {
    const where = { isActive: true };
    
    if (filters.ward) where.ward = filters.ward;
    if (filters.zone) where.zone = filters.zone;
    if (filters.binType) where.binType = filters.binType;
    
    return this.findAll({
      attributes: [
        'status',
        'binType',
        'wasteCategory',
        'ward',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('currentFillLevel')), 'avgFillLevel'],
        [sequelize.fn('SUM', sequelize.col('totalCollections')), 'totalCollections']
      ],
      where,
      group: ['status', 'binType', 'wasteCategory', 'ward']
    });
  };

  WasteBin.getSmartBins = function() {
    return this.findAll({
      where: {
        hasIoTSensor: true,
        deviceId: { [sequelize.Op.ne]: null }
      },
      order: [['lastSensorUpdate', 'DESC']]
    });
  };

  return WasteBin;
};
