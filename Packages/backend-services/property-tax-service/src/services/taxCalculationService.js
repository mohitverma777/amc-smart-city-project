const { Property, TaxAssessment, TaxRate, TaxBill } = require('../models');
const Decimal = require('decimal.js');
const logger = require('@amc/shared/utils/logger');

class TaxCalculationService {
  // Calculate tax for a property for a given financial year
  async calculatePropertyTax(propertyId, financialYear = null) {
    try {
      const currentYear = financialYear || process.env.CURRENT_FINANCIAL_YEAR;
      
      const property = await Property.findByPk(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      // Check if property is exempt from tax
      if (property.exemptFromTax) {
        if (!property.exemptionValidUntil || new Date(property.exemptionValidUntil) >= new Date()) {
          logger.info('Property is exempt from tax', { propertyId, reason: property.exemptionReason });
          return this.createExemptAssessment(property, currentYear);
        }
      }

      // Find applicable tax rate
      const taxRate = await TaxRate.findApplicableRate(
        property.propertyType,
        property.usageType,
        property.zone,
        currentYear
      );

      if (!taxRate) {
        throw new Error(`No tax rate found for ${property.propertyType}/${property.usageType}/${property.zone} for ${currentYear}`);
      }

      // Calculate Annual Rental Value if not set
      let arv = property.annualRentalValue;
      if (!arv) {
        arv = property.calculateAnnualRentalValue();
        await property.update({ annualRentalValue: arv });
      }

      // Create or update assessment
      let assessment = await TaxAssessment.findOne({
        where: {
          propertyId: property.id,
          financialYear: currentYear
        }
      });

      if (!assessment) {
        assessment = await TaxAssessment.create({
          propertyId: property.id,
          financialYear: currentYear,
          annualRentalValue: arv,
          assessedValue: arv,
          taxRateId: taxRate.id,
          taxRate: taxRate.rate,
          assessmentType: 'regular'
        });
      } else {
        // Update existing assessment
        assessment.annualRentalValue = arv;
        assessment.assessedValue = arv;
        assessment.taxRateId = taxRate.id;
        assessment.taxRate = taxRate.rate;
        await assessment.save();
      }

      // Calculate taxes
      await assessment.calculateTax();

      logger.info('Tax calculated successfully', {
        propertyId,
        assessmentId: assessment.id,
        totalTax: assessment.totalTax,
        finalAmount: assessment.finalAmount
      });

      return assessment;
    } catch (error) {
      logger.error('Tax calculation failed:', error);
      throw error;
    }
  }

  // Create exempt assessment
  async createExemptAssessment(property, financialYear) {
    const assessment = await TaxAssessment.create({
      propertyId: property.id,
      financialYear: financialYear,
      annualRentalValue: 0,
      assessedValue: 0,
      taxRateId: null,
      taxRate: 0,
      baseTax: 0,
      totalTax: 0,
      finalAmount: 0,
      assessmentType: 'exempt',
      assessmentStatus: 'approved',
      remarks: `Property exempt: ${property.exemptionReason}`
    });

    return assessment;
  }

  // Bulk calculate taxes for all properties
  async bulkCalculateTaxes(financialYear = null, filters = {}) {
    try {
      const currentYear = financialYear || process.env.CURRENT_FINANCIAL_YEAR;
      
      const where = {
        isActive: true,
        registrationStatus: 'approved'
      };

      if (filters.ward) where.ward = filters.ward;
      if (filters.zone) where.zone = filters.zone;
      if (filters.propertyType) where.propertyType = filters.propertyType;

      const properties = await Property.findAll({ where });
      
      const results = {
        total: properties.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const property of properties) {
        try {
          await this.calculatePropertyTax(property.id, currentYear);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            propertyId: property.id,
            propertyNumber: property.propertyId,
            error: error.message
          });
          
          logger.error('Failed to calculate tax for property', {
            propertyId: property.id,
            error: error.message
          });
        }
      }

      logger.info('Bulk tax calculation completed', results);
      return results;
    } catch (error) {
      logger.error('Bulk tax calculation failed:', error);
      throw error;
    }
  }

  // Generate tax bill
  async generateTaxBill(assessmentId) {
    try {
      const assessment = await TaxAssessment.findByPk(assessmentId, {
        include: [{ association: 'property' }]
      });

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      if (assessment.assessmentStatus !== 'approved') {
        throw new Error('Assessment must be approved before generating bill');
      }

      // Check if bill already exists
      let bill = await TaxBill.findOne({
        where: { assessmentId: assessment.id }
      });

      if (bill) {
        return bill; // Return existing bill
      }

      // Generate bill number
      const billNumber = await this.generateBillNumber(assessment.financialYear);

      bill = await TaxBill.create({
        assessmentId: assessment.id,
        billNumber: billNumber,
        billDate: new Date(),
        dueDate: assessment.dueDate,
        totalAmount: assessment.finalAmount,
        paidAmount: 0,
        outstandingAmount: assessment.finalAmount,
        billStatus: 'generated',
        financialYear: assessment.financialYear
      });

      // Update assessment status
      await assessment.update({ assessmentStatus: 'billed' });

      logger.info('Tax bill generated', {
        billId: bill.id,
        billNumber: bill.billNumber,
        amount: bill.totalAmount
      });

      return bill;
    } catch (error) {
      logger.error('Bill generation failed:', error);
      throw error;
    }
  }

  // Generate unique bill number
  async generateBillNumber(financialYear) {
    const year = financialYear.split('-')[0];
    const count = await TaxBill.count({
      where: { financialYear }
    });

    return `TAX${year}${String(count + 1).padStart(8, '0')}`;
  }

  // Apply penalties for overdue payments
  async applyPenalties() {
    try {
      const overdueAssessments = await TaxAssessment.getOverdueAssessments();
      let updatedCount = 0;

      for (const assessment of overdueAssessments) {
        const originalAmount = assessment.finalAmount;
        assessment.applyPenalty();
        
        if (assessment.finalAmount !== originalAmount) {
          await assessment.save();
          updatedCount++;
          
          logger.info('Penalty applied', {
            assessmentId: assessment.id,
            originalAmount,
            newAmount: assessment.finalAmount,
            penaltyAmount: assessment.penaltyAmount
          });
        }
      }

      logger.info(`Applied penalties to ${updatedCount} assessments`);
      return updatedCount;
    } catch (error) {
      logger.error('Failed to apply penalties:', error);
      throw error;
    }
  }

  // Calculate property valuation
  async calculatePropertyValuation(propertyId, method = 'market_comparison') {
    try {
      const property = await Property.findByPk(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      let valuation;

      switch (method) {
        case 'market_comparison':
          valuation = await this.calculateMarketComparison(property);
          break;
        case 'cost_approach':
          valuation = await this.calculateCostApproach(property);
          break;
        case 'income_approach':
          valuation = await this.calculateIncomeApproach(property);
          break;
        default:
          throw new Error('Invalid valuation method');
      }

      // Update property with calculated valuation
      await property.update({
        marketValue: valuation.marketValue,
        annualRentalValue: valuation.annualRentalValue
      });

      return valuation;
    } catch (error) {
      logger.error('Property valuation failed:', error);
      throw error;
    }
  }

  // Market comparison valuation method
  async calculateMarketComparison(property) {
    // Find similar properties in the same zone
    const similarProperties = await Property.findAll({
      where: {
        zone: property.zone,
        propertyType: property.propertyType,
        usageType: property.usageType,
        marketValue: { [sequelize.Op.ne]: null },
        isActive: true
      },
      limit: 10,
      order: [['updatedAt', 'DESC']]
    });

    if (similarProperties.length === 0) {
      throw new Error('No comparable properties found');
    }

    // Calculate average market value per sq ft
    const totalValue = similarProperties.reduce((sum, prop) => {
      return sum.plus(new Decimal(prop.marketValue || 0)
        .dividedBy(new Decimal(prop.totalArea)));
    }, new Decimal(0));

    const avgValuePerSqFt = totalValue.dividedBy(new Decimal(similarProperties.length));
    const marketValue = avgValuePerSqFt.times(new Decimal(property.totalArea));
    
    // Calculate ARV as 10% of market value
    const annualRentalValue = marketValue.times(new Decimal(0.10));

    return {
      method: 'market_comparison',
      marketValue: marketValue.toNumber(),
      annualRentalValue: annualRentalValue.toNumber(),
      avgValuePerSqFt: avgValuePerSqFt.toNumber(),
      comparableProperties: similarProperties.length
    };
  }

  // Get tax collection statistics
  async getTaxCollectionStats(financialYear = null, filters = {}) {
    try {
      const currentYear = financialYear || process.env.CURRENT_FINANCIAL_YEAR;
      
      const whereClause = { financialYear: currentYear };
      
      if (filters.ward) {
        whereClause['$property.ward$'] = filters.ward;
      }
      
      if (filters.zone) {
        whereClause['$property.zone$'] = filters.zone;
      }

      const [
        totalAssessments,
        totalDemand,
        totalCollection,
        statusDistribution
      ] = await Promise.all([
        TaxAssessment.count({
          where: whereClause,
          include: [{ model: Property, as: 'property' }]
        }),
        
        TaxAssessment.sum('finalAmount', {
          where: whereClause,
          include: [{ model: Property, as: 'property' }]
        }),
        
        TaxBill.sum('paidAmount', {
          include: [{
            model: TaxAssessment,
            as: 'assessment',
            where: { financialYear: currentYear },
            include: [{ model: Property, as: 'property' }]
          }]
        }),
        
        TaxAssessment.findAll({
          attributes: [
            'assessmentStatus',
            [sequelize.fn('COUNT', sequelize.col('TaxAssessment.id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('finalAmount')), 'amount']
          ],
          where: whereClause,
          include: [{ model: Property, as: 'property' }],
          group: ['assessmentStatus']
        })
      ]);

      const collectionRate = totalDemand > 0 ? (totalCollection / totalDemand * 100) : 0;
      const outstanding = totalDemand - totalCollection;

      return {
        financialYear: currentYear,
        summary: {
          totalAssessments,
          totalDemand: totalDemand || 0,
          totalCollection: totalCollection || 0,
          outstanding,
          collectionRate: Math.round(collectionRate * 100) / 100
        },
        statusDistribution,
        filters
      };
    } catch (error) {
      logger.error('Failed to get tax collection stats:', error);
      throw error;
    }
  }
}

module.exports = new TaxCalculationService();
