const Decimal = require('decimal.js');

module.exports = (sequelize, DataTypes) => {
  const WasteCollectionRecord = sequelize.define('WasteCollectionRecord', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Collection Identification
    recordId: {
      type: DataTypes.STRING(30),
      unique: true,
      allowNull: false
    },
    
    // References
    scheduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'WasteCollectionSchedules',
        key: 'id'
      }
    },
    
    binId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'WasteBins',
        key: 'id'
      }
    },
    
    vehicleId: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    
    // Collection Details
    collectionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    collectionTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    
    // Location Information
    collectionLocation: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'GPS coordinates and address of collection point'
    },
    
    ward: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    zone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    
    // Waste Information
    wasteType: {
      type: DataTypes.ENUM(
        'household',
        'organic',
        'recyclable',
        'hazardous',
        'electronic',
        'construction',
        'medical',
        'mixed'
      ),
      allowNull: false
    },
    
    wasteCategory: {
      type: DataTypes.ENUM(
        'biodegradable',
        'non_biodegradable',
        'recyclable',
        'hazardous',
        'e_waste',
        'mixed'
      ),
      allowNull: false
    },
    
    // Quantity Measurements
    estimatedWeight: {
      type: DataTypes.DECIMAL(8, 2), // in kg
      allowNull: true
    },
    
    actualWeight: {
      type: DataTypes.DECIMAL(8, 2), // in kg
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    volume: {
      type: DataTypes.DECIMAL(8, 2), // in liters
      allowNull: true,
      validate: {
        min: 0
      }
    },
    
    density: {
      type: DataTypes.DECIMAL(6, 2), // kg per cubic meter
      allowNull: true
    },
    
    // Quality Assessment
    wasteQuality: {
      type: DataTypes.ENUM('excellent', 'good', 'mixed', 'poor', 'contaminated'),
      allowNull: true
    },
    
    segregationScore: {
      type: DataTypes.DECIMAL(5, 2), // 0-100 score
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    
    contaminationLevel: {
      type: DataTypes.ENUM('none', 'low', 'medium', 'high'),
      defaultValue: 'none'
    },
    
    // Collection Process
    collectionMethod: {
      type: DataTypes.ENUM('manual', 'mechanical', 'vacuum', 'automated'),
      allowNull: false
    },
    
    collectionDuration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true
    },
    
    crewMembers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    
    driverName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Status and Verification
    status: {
      type: DataTypes.ENUM(
        'collected',
        'in_transit',
        'delivered',
        'processed',
        'disposed',
        'recycled'
      ),
      defaultValue: 'collected'
    },
    
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    verifiedBy: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Processing Information
    processingFacility: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    disposalMethod: {
      type: DataTypes.ENUM(
        'landfill',
        'incineration',
        'composting',
        'recycling',
        'biogas',
        'waste_to_energy'
      ),
      allowNull: true
    },
    
    recyclingProgramId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'RecyclingPrograms',
        key: 'id'
      }
    },
    
    // Environmental Impact
    carbonFootprint: {
      type: DataTypes.DECIMAL(8, 3), // in kg CO2
      allowNull: true
    },
    
    recyclingValue: {
      type: DataTypes.DECIMAL(8, 2), // in currency units
      allowNull: true
    },
    
    energyRecovered: {
      type: DataTypes.DECIMAL(8, 2), // in kWh
      allowNull: true
    },
    
    // Documentation
    photos: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'URLs of collection photos'
    },
    
    beforePhoto: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    
    afterPhoto: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    
    // Issues and Feedback
    issues: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Issues encountered during collection'
    },
    
    citizenFeedback: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Citizen feedback about collection'
    },
    
    // Weather and Conditions
    weatherConditions: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Weather conditions during collection'
    },
    
    accessibilityIssues: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Cost Information
    collectionCost: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    
    transportCost: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    
    processingCost: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    
    totalCost: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    
    // Additional Information
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'waste_collection_records',
    timestamps: true,
    indexes: [
      {
        fields: ['recordId'],
        unique: true
      },
      {
        fields: ['scheduleId']
      },
      {
        fields: ['binId']
      },
      {
        fields: ['vehicleId']
      },
      {
        fields: ['collectionDate']
      },
      {
        fields: ['ward', 'zone']
      },
      {
        fields: ['wasteType', 'wasteCategory']
      },
      {
        fields: ['status']
      }
    ],
    hooks: {
      beforeCreate: async (record) => {
        // Generate unique record ID
        const date = new Date(record.collectionDate);
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = record.collectionTime.replace(/:/g, '');
        
        const count = await WasteCollectionRecord.count({
          where: {
            collectionDate: {
              [sequelize.Op.gte]: new Date(date.setHours(0, 0, 0, 0)),
              [sequelize.Op.lt]: new Date(date.setHours(23, 59, 59, 999))
            }
          }
        });
        
        record.recordId = `WCR${dateStr}${timeStr}${String(count + 1).padStart(4, '0')}`;
        
        // Calculate density if weight and volume are available
        if (record.actualWeight && record.volume && record.volume > 0) {
          record.density = new Decimal(record.actualWeight)
            .dividedBy(new Decimal(record.volume).dividedBy(1000)) // Convert liters to cubic meters
            .toNumber();
        }
      },
      
      beforeSave: async (record) => {
        // Calculate total cost
        const costs = [
          record.collectionCost || 0,
          record.transportCost || 0,
          record.processingCost || 0
        ];
        
        record.totalCost = costs.reduce((sum, cost) => sum + parseFloat(cost), 0);
        
        // Update segregation score based on contamination
        if (record.contaminationLevel && !record.segregationScore) {
          const scores = {
            'none': 100,
            'low': 80,
            'medium': 60,
            'high': 30
          };
          record.segregationScore = scores[record.contaminationLevel] || 50;
        }
      }
    }
  });

  // Instance methods
  WasteCollectionRecord.prototype.markAsDelivered = async function(facility, method = null) {
    this.status = 'delivered';
    this.processingFacility = facility;
    
    if (method) {
      this.disposalMethod = method;
    }
    
    await this.save();
    return this;
  };

  WasteCollectionRecord.prototype.addIssue = async function(issueType, description, severity = 'medium') {
    const issues = [...(this.issues || [])];
    issues.push({
      type: issueType,
      description,
      severity,
      reportedAt: new Date()
    });
    
    this.issues = issues;
    await this.save();
    
    return this;
  };

  WasteCollectionRecord.prototype.verify = async function(verifierId, notes = null) {
    this.isVerified = true;
    this.verifiedBy = verifierId;
    this.verifiedAt = new Date();
    
    if (notes) {
      this.notes = notes;
    }
    
    await this.save();
    return this;
  };

  WasteCollectionRecord.prototype.calculateEnvironmentalImpact = function() {
    const weight = parseFloat(this.actualWeight) || 0;
    
    // Carbon footprint calculations (approximate)
    const carbonFactors = {
      'landfill': 0.5, // kg CO2 per kg waste
      'incineration': 0.3,
      'recycling': -0.2, // negative = carbon saved
      'composting': 0.1,
      'waste_to_energy': 0.2
    };
    
    const factor = carbonFactors[this.disposalMethod] || 0.4;
    this.carbonFootprint = weight * factor;
    
    // Recycling value (if recyclable)
    if (this.wasteCategory === 'recyclable') {
      const recyclingRates = {
        'plastic': 0.5, // per kg
        'paper': 0.3,
        'metal': 2.0,
        'glass': 0.2
      };
      
      // Simplified calculation - would be more complex in reality
      this.recyclingValue = weight * 0.5; // Average rate
    }
    
    return {
      carbonFootprint: this.carbonFootprint,
      recyclingValue: this.recyclingValue
    };
  };

  // Class methods
  WasteCollectionRecord.getCollectionsByDate = function(startDate, endDate, filters = {}) {
    const where = {
      collectionDate: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    if (filters.ward) where.ward = filters.ward;
    if (filters.zone) where.zone = filters.zone;
    if (filters.wasteType) where.wasteType = filters.wasteType;
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    
    return this.findAll({
      where,
      order: [['collectionDate', 'DESC']],
      include: [
        { association: 'schedule' },
        { association: 'bin' }
      ]
    });
  };

  WasteCollectionRecord.getWasteStatistics = function(period = 'month', filters = {}) {
    const where = {};
    
    // Date filtering
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    where.collectionDate = { [sequelize.Op.gte]: startDate };
    
    if (filters.ward) where.ward = filters.ward;
    if (filters.zone) where.zone = filters.zone;
    if (filters.wasteType) where.wasteType = filters.wasteType;
    
    return this.findAll({
      attributes: [
        'wasteType',
        'wasteCategory',
        'ward',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCollections'],
        [sequelize.fn('SUM', sequelize.col('actualWeight')), 'totalWeight'],
        [sequelize.fn('AVG', sequelize.col('segregationScore')), 'avgSegregationScore'],
        [sequelize.fn('SUM', sequelize.col('recyclingValue')), 'totalRecyclingValue']
      ],
      where,
      group: ['wasteType', 'wasteCategory', 'ward']
    });
  };

  WasteCollectionRecord.getRecyclingStats = function(startDate, endDate) {
    return this.findAll({
      attributes: [
        'disposalMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('actualWeight')), 'totalWeight'],
        [sequelize.fn('SUM', sequelize.col('recyclingValue')), 'totalValue'],
        [sequelize.fn('AVG', sequelize.col('carbonFootprint')), 'avgCarbonFootprint']
      ],
      where: {
        collectionDate: {
          [sequelize.Op.between]: [startDate, endDate]
        },
        disposalMethod: {
          [sequelize.Op.ne]: null
        }
      },
      group: ['disposalMethod']
    });
  };

  return WasteCollectionRecord;
};
