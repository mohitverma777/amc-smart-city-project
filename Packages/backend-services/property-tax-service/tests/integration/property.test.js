// In property-tax-service/tests/integration/property.test.js

const request = require('supertest');
const { sequelize } = require('../../src/models');
const PropertyTaxServiceApp = require('../../src/app');

describe('Integration Tests for Property API Endpoints', () => {
  let app;
  let authToken; // Mock JWT for testing

  beforeAll(async () => {
    const serviceApp = new PropertyTaxServiceApp();
    app = serviceApp.app;
    await sequelize.sync({ force: true }); // Use a clean test database
    authToken = 'mock-jwt-token-for-testing';
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a new property via POST /properties', async () => {
    // 1. Arrange: Define the property data
    const newPropertyData = {
      propertyType: 'commercial',
      usageType: 'rented',
      totalArea: 2500,
      builtUpArea: 2200,
      address: {
        street: '456 Business Ave',
        area: 'Navrangpura',
        pincode: '380009',
      },
      ward: 'Ward-9',
      zone: 'Zone-A',
      constructionYear: 2020,
    };

    // 2. Act: Send the API request
    const response = await request(app)
      .post('/properties')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newPropertyData);

    // 3. Assert: Check the HTTP response and database state
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.property.propertyType).toBe('commercial');
    expect(response.body.data.property.propertyId).toMatch(/^PROP/);

    // Verify the property was actually saved in the database
    const dbProperty = await sequelize.models.Property.findOne({
      where: { id: response.body.data.property.id },
    });
    expect(dbProperty).not.toBeNull();
    expect(dbProperty.totalArea).toBe('2500.00');
  });
});
