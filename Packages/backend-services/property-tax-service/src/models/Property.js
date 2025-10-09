const Decimal = require('decimal.js');

module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define('Property', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Property Identification
    propertyId: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    
    surveyNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    plotNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // Property Type and Usage
    propertyType: {
      type: DataTypes.ENUM(
        'residential',
        'commercial', 
        'industrial',
        'institutional',
        'agricultural',
        'mixed'
      ),
      allowNull: false
    },
    
    usageType: {
      type: DataTypes.ENUM(
        'self_occupied',
        'rented',
        'vacant',
        'mixed',
        'under_construction'
      ),
      allowNull: false
    },
    
    // Property Dimensions
    totalArea: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    
    builtUpArea: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    
    carpetArea: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    
    // Location Information
    address: {
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
    
    coordinates: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidCoordinates(value) {
          if (value && (!value.latitude || !value.longitude)) {
            throw new Error('Coordinates must include both latitude and longitude');
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
    
    // Construction Details
    constructionYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1800,
        max: new Date().getFullYear() + 5
      }
    },
    
    floors: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      validate: {
        min: 0,
        max: 50
      }
    },
    
    constructionType: {
      type: DataTypes.ENUM(
        'rcc',
        'load_bearing',
        'steel_frame',
        'wooden',
        'mixed',
        'temporary'
      ),
      allowNull: true
    },
    
    // Property Value and Assessment
    guidanceValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Government guidance value per sq ft'
    },
    
    marketValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Current market value of property'
    },
    
    annualRentalValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Annual rental value for tax calculation'
    },
    
    // Amenities and Features
    amenities: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Property amenities like parking, garden, etc.'
    },
    
    waterConnection: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    electricityConnection: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    sewerageConnection: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Status and Registration
    registrationStatus: {
      type: DataTypes.ENUM(
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'inactive'
      ),
      defaultValue: 'draft'
    },
    
    registrationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    approvedBy: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Tax Information
    exemptFromTax: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    exemptionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    exemptionValidUntil: {
      type: DataTypes.DATE,
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
      comment: 'Additional property-specific data'
    },
    
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'properties',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyId'],
        unique: true
      },
      {
        fields: ['ward']
      },
      {
        fields: ['zone']
      },
      {
        fields: ['propertyType']
      },
      {
        fields: ['usageType']
      },
      {
        fields: ['registrationStatus']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['exemptFromTax']
      }
    ],
    hooks: {
      beforeCreate: async (property) => {
        // Generate unique property ID
        const year = new Date().getFullYear();
        const zone = property.zone.replace(/[^A-Z0-9]/g, '');
        const count = await Property.count({
          where: {
            zone: property.zone,
            createdAt: {
              [sequelize.Op.gte]: new Date(year, 0, 1),
              [sequelize.Op.lt]: new Date(year + 1, 0, 1)
            }
          }
        });
        
        property.propertyId = `PROP${year}${zone}${String(count + 1).padStart(6, '0')}`;
      },
      
      beforeUpdate: async (property, options) => {
        // Update approval information
        if (property.changed('registrationStatus') && property.registrationStatus === 'approved') {
          property.approvedBy = options.userId || 'system';
          property.approvedAt = new Date();
          
          if (!property.registrationDate) {
            property.registrationDate = new Date();
          }
        }
      }
    }
  });

  // Instance methods
  Property.prototype.calculateAnnualRentalValue = function() {
    // Calculate ARV based on various factors
    const baseValue = new Decimal(this.marketValue || this.guidanceValue || 0);
    const areaFactor = new Decimal(this.builtUpArea || this.totalArea);
    
    // Location factor based on zone
    const locationFactors = {
      'Zone-A': 1.5,
      'Zone-B': 1.2,
      'Zone-C': 1.0,
      'Zone-D': 0.8
    };
    
    const locationFactor = new Decimal(locationFactors[this.zone] || 1.0);
    
    // Property type factor
    const propertyTypeFactors = {
      'commercial': 1.8,
      'industrial': 1.5,
      'residential': 1.0,
      'institutional': 0.5
    };
    
    const propertyTypeFactor = new Decimal(propertyTypeFactors[this.propertyType] || 1.0);
    
    // Usage factor
    const usageFactors = {
      'rented': 1.0,
      'self_occupied': 0.7,
      'vacant': 0.8,
      'mixed': 0.9
    };
    
    const usageFactor = new Decimal(usageFactors[this.usageType] || 1.0);
    
    // Calculate ARV (typically 10% of market value with adjustments)
    const arvPercentage = new Decimal(0.10);
    const calculatedARV = baseValue
      .times(areaFactor)
      .times(locationFactor)
      .times(propertyTypeFactor)
      .times(usageFactor)
      .times(arvPercentage);
    
    return calculatedARV.toNumber();
  };

  Property.prototype.getCurrentAssessment = async function(financialYear) {
    const TaxAssessment = require('./TaxAssessment')(sequelize, DataTypes);
    
    const currentYear = financialYear || process.env.CURRENT_FINANCIAL_YEAR;
    
    return await TaxAssessment.findOne({
      where: {
        propertyId: this.id,
        financialYear: currentYear
      },
      include: [{ association: 'taxRate' }]
    });
  };

  Property.prototype.getTotalOutstanding = async function() {
    const TaxBill = require('./TaxBill')(sequelize, DataTypes);
    const TaxPayment = require('./TaxPayment')(sequelize, DataTypes);
    
    const bills = await TaxBill.findAll({
      include: [{
        association: 'assessment',
        where: { propertyId: this.id }
      }, {
        association: 'payments'
      }]
    });
    
    let totalOutstanding = new Decimal(0);
    
    for (const bill of bills) {
      const billAmount = new Decimal(bill.totalAmount);
      const paidAmount = bill.payments.reduce((sum, payment) => {
        return sum.plus(new Decimal(payment.amount));
      }, new Decimal(0));
      
      const outstanding = billAmount.minus(paidAmount);
      if (outstanding.greaterThan(0)) {
        totalOutstanding = totalOutstanding.plus(outstanding);
      }
    }
    
    return totalOutstanding.toNumber();
  };

  // Class methods
  Property.findByPropertyId = function(propertyId) {
    return this.findOne({
      where: { propertyId },
      include: [
        { association: 'owners' },
        { association: 'assessments' },
        { association: 'documents' }
      ]
    });
  };

  Property.findByOwner = function(citizenId) {
    return this.findAll({
      include: [{
        association: 'owners',
        where: { citizenId }
      }]
    });
  };

  Property.getPropertiesByWard = function(ward, options = {}) {
    const where = { ward };
    
    if (options.propertyType) {
      where.propertyType = options.propertyType;
    }
    
    if (options.registrationStatus) {
      where.registrationStatus = options.registrationStatus;
    }
    
    return this.findAll({
      where,
      include: [{ association: 'owners' }],
      order: [['createdAt', 'DESC']]
    });
  };

  Property.getStatsByZone = function(zone) {
    return this.findAll({
      attributes: [
        'propertyType',
        'usageType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalArea')), 'totalArea'],
        [sequelize.fn('AVG', sequelize.col('annualRentalValue')), 'avgARV']
      ],
      where: { zone, isActive: true },
      group: ['propertyType', 'usageType']
    });
  };

  return Property;
};
