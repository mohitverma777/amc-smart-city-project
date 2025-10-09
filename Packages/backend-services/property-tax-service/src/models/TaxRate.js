module.exports = (sequelize, DataTypes) => {
  const TaxRate = sequelize.define('TaxRate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Rate Classification
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
    
    zone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    
    // Base Tax Rate
    rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      validate: {
        min: 0,
        max: 1 // Maximum 100%
      },
      comment: 'Base tax rate as decimal (e.g., 0.08 for 8%)'
    },
    
    // Additional Tax Rates
    educationCessRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      comment: 'Education cess rate as decimal'
    },
    
    healthCessRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      comment: 'Health cess rate as decimal'
    },
    
    fireTaxRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      comment: 'Fire tax rate as decimal'
    },
    
    // Per Square Foot Rates
    waterTaxRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Water tax per sq ft'
    },
    
    sewerageTaxRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Sewerage tax per sq ft'
    },
    
    // Flat Rates
    garbageTaxFlat: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Flat garbage tax amount'
    },
    
    lightingTaxFlat: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Flat lighting tax amount'
    },
    
    // Validity Period
    effectiveFrom: {
      type: DataTypes.DATE,
      allowNull: false
    },
    
    effectiveUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    financialYear: {
      type: DataTypes.STRING(9),
      allowNull: false,
      validate: {
        is: /^\d{4}-\d{4}$/
      }
    },
    
    // Status and Approval
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    approvedBy: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Additional Information
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    calculationFormula: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Formula or method for tax calculation'
    },
    
    exemptions: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Exemption criteria and amounts'
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'tax_rates',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyType', 'usageType', 'zone', 'financialYear'],
        unique: true,
        name: 'unique_tax_rate_combination'
      },
      {
        fields: ['financialYear']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['effectiveFrom', 'effectiveUntil']
      }
    ],
    validate: {
      effectiveDateRange() {
        if (this.effectiveUntil && this.effectiveFrom >= this.effectiveUntil) {
          throw new Error('Effective from date must be before effective until date');
        }
      }
    }
  });

  // Instance methods
  TaxRate.prototype.isCurrentlyActive = function() {
    const now = new Date();
    return this.isActive && 
           this.effectiveFrom <= now && 
           (!this.effectiveUntil || this.effectiveUntil >= now);
  };

  TaxRate.prototype.calculateTotalRate = function() {
    const baseRate = parseFloat(this.rate);
    const educationCess = parseFloat(this.educationCessRate);
    const healthCess = parseFloat(this.healthCessRate);
    const fireTax = parseFloat(this.fireTaxRate);
    
    return baseRate + (baseRate * educationCess) + (baseRate * healthCess) + (baseRate * fireTax);
  };

  // Class methods
  TaxRate.findApplicableRate = function(propertyType, usageType, zone, financialYear = null) {
    const currentFinancialYear = financialYear || process.env.CURRENT_FINANCIAL_YEAR;
    
    return this.findOne({
      where: {
        propertyType,
        usageType,
        zone,
        financialYear: currentFinancialYear,
        isActive: true,
        effectiveFrom: { [sequelize.Op.lte]: new Date() },
        [sequelize.Op.or]: [
          { effectiveUntil: null },
          { effectiveUntil: { [sequelize.Op.gte]: new Date() } }
        ]
      }
    });
  };

  TaxRate.getCurrentRates = function(financialYear = null) {
    const currentFinancialYear = financialYear || process.env.CURRENT_FINANCIAL_YEAR;
    
    return this.findAll({
      where: {
        financialYear: currentFinancialYear,
        isActive: true
      },
      order: [['propertyType', 'ASC'], ['usageType', 'ASC'], ['zone', 'ASC']]
    });
  };

  TaxRate.getRateHistory = function(propertyType, usageType, zone) {
    return this.findAll({
      where: {
        propertyType,
        usageType,
        zone
      },
      order: [['financialYear', 'DESC']]
    });
  };

  return TaxRate;
};
