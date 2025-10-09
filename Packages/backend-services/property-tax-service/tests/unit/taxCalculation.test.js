// In property-tax-service/tests/unit/taxCalculation.test.js

const taxCalculationService = require('../../src/services/taxCalculationService');
const { Property, TaxRate } = require('../../src/models');
const Decimal = require('decimal.js');

// Mock the Sequelize models
jest.mock('../../src/models', () => ({
  Property: {
    findByPk: jest.fn(),
  },
  TaxRate: {
    findApplicableRate: jest.fn(),
  },
  TaxAssessment: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

describe('Unit Tests for TaxCalculationService', () => {
  it('should correctly calculate the base tax for a residential property', async () => {
    // 1. Arrange: Setup mock data and functions
    const mockProperty = {
      id: 'prop-uuid-1',
      propertyType: 'residential',
      usageType: 'self_occupied',
      zone: 'Zone-A',
      annualRentalValue: '50000.00',
      calculateAnnualRentalValue: () => 50000,
      update: jest.fn(),
    };

    const mockTaxRate = {
      id: 'rate-uuid-1',
      rate: '0.08', // 8%
      educationCessRate: '0.02', // 2%
      healthCessRate: '0.01', // 1%
    };
    
    const mockAssessment = {
      id: 'assess-uuid-1',
      propertyId: 'prop-uuid-1',
      financialYear: '2025-2026',
      annualRentalValue: '50000.00',
      assessedValue: '50000.00',
      taxRateId: 'rate-uuid-1',
      taxRate: '0.08',
      calculateTax: jest.fn().mockImplementation(function() {
        const assessedValue = new Decimal(this.assessedValue);
        const rate = new Decimal(this.taxRate);
        this.baseTax = assessedValue.times(rate).toNumber();
        this.educationCess = new Decimal(this.baseTax).times(new Decimal(mockTaxRate.educationCessRate)).toNumber();
        this.healthCess = new Decimal(this.baseTax).times(new Decimal(mockTaxRate.healthCessRate)).toNumber();
      }),
      save: jest.fn(),
    };

    Property.findByPk.mockResolvedValue(mockProperty);
    TaxRate.findApplicableRate.mockResolvedValue(mockTaxRate);
    TaxAssessment.findOne.mockResolvedValue(null); // Simulate creating a new assessment
    TaxAssessment.create.mockResolvedValue(mockAssessment);

    // 2. Act: Call the service method
    const assessment = await taxCalculationService.calculatePropertyTax('prop-uuid-1');
    
    // 3. Assert: Verify the results
    expect(assessment.calculateTax).toHaveBeenCalled();
    
    // baseTax = 50000 * 0.08 = 4000
    expect(assessment.baseTax).toBe(4000); 
    
    // educationCess = 4000 * 0.02 = 80
    expect(assessment.educationCess).toBe(80);
    
    // healthCess = 4000 * 0.01 = 40
    expect(assessment.healthCess).toBe(40);
  });
});
