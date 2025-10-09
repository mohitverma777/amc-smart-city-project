const Decimal = require('decimal.js');

module.exports = (sequelize, DataTypes) => {
  const TaxAssessment = sequelize.define('TaxAssessment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Properties',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    financialYear: {
      type: DataTypes.STRING(9),
      allowNull: false,
      validate: {
        is: /^\d{4}-\d{4}$/
      }
    },
    
    // Assessment Values
    annualRentalValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    assessedValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Value used for tax calculation'
    },
    
    // Tax Rate Information
    taxRateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'TaxRates',
        key: 'id'
      }
    },
    
    taxRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: 'Tax rate percentage applied'
    },
    
    // Tax Components
    baseTax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    educationCess: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    healthCess: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    fireTax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    waterTax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    sewerageTax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    garbageTax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    lightingTax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // Additional Charges
    penaltyAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    interestAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    rebateAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // Total Calculations
    totalTax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    
    finalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Total amount after penalties, interest, and rebates'
    },
    
    // Assessment Information
    assessmentType: {
      type: DataTypes.ENUM(
        'regular',
        'revised',
        'supplementary',
        'correction'
      ),
      defaultValue: 'regular'
    },
    
    assessmentStatus: {
      type: DataTypes.ENUM(
        'draft',
        'calculated',
        'approved',
        'billed',
        'paid',
        'overdue'
      ),
      defaultValue: 'draft'
    },
    
    // Dates
    assessmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
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
    calculationMethod: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Method used for calculation'
    },
    
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional assessment data'
    }
  }, {
    tableName: 'tax_assessments',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyId', 'financialYear'],
        unique: true
      },
      {
        fields: ['financialYear']
      },
      {
        fields: ['assessmentStatus']
      },
      {
        fields: ['dueDate']
      },
      {
        fields: ['assessmentType']
      }
    ],
    hooks: {
      beforeCreate: (assessment) => {
        // Set due date (typically end of financial year)
        const [startYear] = assessment.financialYear.split('-');
        assessment.dueDate = new Date(`${parseInt(startYear) + 1}-03-31`);
      },
      
      beforeSave: (assessment) => {
        // Calculate total tax
        const components = [
          'baseTax', 'educationCess', 'healthCess', 'fireTax',
          'waterTax', 'sewerageTax', 'garbageTax', 'lightingTax'
        ];
        
        let total = new Decimal(0);
        components.forEach(component => {
          total = total.plus(new Decimal(assessment[component] || 0));
        });
        
        assessment.totalTax = total.toNumber();
        
        // Calculate final amount
        const finalAmount = total
          .plus(new Decimal(assessment.penaltyAmount || 0))
          .plus(new Decimal(assessment.interestAmount || 0))
          .minus(new Decimal(assessment.rebateAmount || 0));
        
        assessment.finalAmount = finalAmount.toNumber();
      }
    }
  });

  // Instance methods
  TaxAssessment.prototype.calculateTax = async function() {
    const TaxRate = require('./TaxRate')(sequelize, DataTypes);
    const Property = require('./Property')(sequelize, DataTypes);
    
    const property = await Property.findByPk(this.propertyId);
    const taxRate = await TaxRate.findByPk(this.taxRateId);
    
    if (!property || !taxRate) {
      throw new Error('Property or tax rate not found');
    }

    // Calculate base tax
    const assessedValue = new Decimal(this.assessedValue);
    const rate = new Decimal(taxRate.rate);
    
    this.baseTax = assessedValue.times(rate).toNumber();
    
    // Calculate cess and additional taxes
    this.educationCess = new Decimal(this.baseTax).times(new Decimal(taxRate.educationCessRate || 0)).toNumber();
    this.healthCess = new Decimal(this.baseTax).times(new Decimal(taxRate.healthCessRate || 0)).toNumber();
    
    // Property-specific taxes
    if (property.waterConnection) {
      this.waterTax = new Decimal(property.builtUpArea || property.totalArea)
        .times(new Decimal(taxRate.waterTaxRate || 0)).toNumber();
    }
    
    if (property.sewerageConnection) {
      this.sewerageTax = new Decimal(property.builtUpArea || property.totalArea)
        .times(new Decimal(taxRate.sewerageTaxRate || 0)).toNumber();
    }
    
    // Fire tax (for commercial properties)
    if (property.propertyType === 'commercial') {
      this.fireTax = new Decimal(this.baseTax).times(new Decimal(taxRate.fireTaxRate || 0)).toNumber();
    }
    
    // Garbage tax
    this.garbageTax = new Decimal(taxRate.garbageTaxFlat || 0).toNumber();
    
    // Lighting tax
    this.lightingTax = new Decimal(taxRate.lightingTaxFlat || 0).toNumber();
    
    await this.save();
    return this;
  };

  TaxAssessment.prototype.applyPenalty = function(penaltyRate = null) {
    const currentDate = new Date();
    const dueDate = new Date(this.dueDate);
    
    if (currentDate > dueDate) {
      const daysPastDue = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24));
      const rate = penaltyRate || parseFloat(process.env.LATE_PAYMENT_PENALTY_RATE) || 1.5;
      
      // Calculate penalty (1.5% per month, minimum one month)
      const monthsPastDue = Math.max(1, Math.ceil(daysPastDue / 30));
      const penaltyAmount = new Decimal(this.totalTax)
        .times(new Decimal(rate / 100))
        .times(new Decimal(monthsPastDue));
      
      this.penaltyAmount = penaltyAmount.toNumber();
    }
    
    return this;
  };

  TaxAssessment.prototype.applyEarlyPaymentDiscount = function() {
    const currentDate = new Date();
    const dueDate = new Date(this.dueDate);
    const discountPeriod = new Date(dueDate);
    discountPeriod.setMonth(discountPeriod.getMonth() - 3); // 3 months before due date
    
    if (currentDate <= discountPeriod) {
      const discountRate = parseFloat(process.env.EARLY_PAYMENT_DISCOUNT_RATE) || 5.0;
      const discountAmount = new Decimal(this.totalTax)
        .times(new Decimal(discountRate / 100));
      
      this.rebateAmount = discountAmount.toNumber();
    }
    
    return this;
  };

  // Class methods
  TaxAssessment.findByProperty = function(propertyId, financialYear = null) {
    const where = { propertyId };
    
    if (financialYear) {
      where.financialYear = financialYear;
    }
    
    return this.findAll({
      where,
      include: [{ association: 'taxRate' }],
      order: [['financialYear', 'DESC']]
    });
  };

  TaxAssessment.getOverdueAssessments = function() {
    return this.findAll({
      where: {
        assessmentStatus: ['approved', 'billed'],
        dueDate: {
          [sequelize.Op.lt]: new Date()
        }
      },
      include: [{ association: 'property' }]
    });
  };

  TaxAssessment.getAssessmentStats = function(financialYear) {
    return this.findAll({
      attributes: [
        'assessmentStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('finalAmount')), 'totalAmount']
      ],
      where: { financialYear },
      group: ['assessmentStatus']
    });
  };

  return TaxAssessment;
};
