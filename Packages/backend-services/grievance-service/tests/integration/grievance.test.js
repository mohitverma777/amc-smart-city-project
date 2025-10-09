const request = require('supertest');
const { sequelize, Grievance, Category } = require('../../src/models');
const GrievanceServiceApp = require('../../src/app');

describe('Grievance Service Integration Tests', () => {
  let app;
  let authToken;
  let testCategory;

  beforeAll(async () => {
    // Initialize app
    const grievanceApp = new GrievanceServiceApp();
    app = grievanceApp.app;

    // Setup test database
    await sequelize.sync({ force: true });

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      description: 'Category for testing',
      department: 'Test Department',
      slaHours: 24
    });

    // Get auth token (mock for testing)
    authToken = 'test-jwt-token';
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /grievances', () => {
    it('should create a new grievance', async () => {
      const grievanceData = {
        title: 'Test Grievance',
        description: 'This is a test grievance for integration testing',
        categoryId: testCategory.id,
        priority: 'medium',
        location: {
          latitude: 23.0225,
          longitude: 72.5714,
          address: 'Test Location, Ahmedabad'
        },
        ward: 'Ward-Test'
      };

      const response = await request(app)
        .post('/grievances')
        .set('Authorization', `Bearer ${authToken}`)
        .send(grievanceData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.grievance.title).toBe(grievanceData.title);
      expect(response.body.data.grievanceNumber).toMatch(/^GRV\d{10}$/);
    });

    it('should reject grievance with invalid category', async () => {
      const grievanceData = {
        title: 'Test Grievance',
        description: 'This is a test grievance',
        categoryId: '00000000-0000-0000-0000-000000000000',
        ward: 'Ward-Test'
      };

      const response = await request(app)
        .post('/grievances')
        .set('Authorization', `Bearer ${authToken}`)
        .send(grievanceData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.code).toBe('INVALID_CATEGORY');
    });
  });

  describe('GET /grievances/my-grievances', () => {
    beforeEach(async () => {
      // Create test grievances
      await Grievance.create({
        citizenId: 'test-citizen-001',
        title: 'Test Grievance 1',
        description: 'First test grievance',
        categoryId: testCategory.id,
        ward: 'Ward-Test'
      });
    });

    it('should return user grievances', async () => {
      const response = await request(app)
        .get('/grievances/my-grievances')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.grievances)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/grievances/my-grievances?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });

  describe('GET /grievances/:identifier', () => {
    let testGrievance;

    beforeEach(async () => {
      testGrievance = await Grievance.create({
        citizenId: 'test-citizen-001',
        title: 'Test Grievance for GET',
        description: 'Test grievance for GET endpoint',
        categoryId: testCategory.id,
        ward: 'Ward-Test'
      });
    });

    it('should return grievance by ID', async () => {
      const response = await request(app)
        .get(`/grievances/${testGrievance.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.grievance.id).toBe(testGrievance.id);
    });

    it('should return 404 for non-existent grievance', async () => {
      const response = await request(app)
        .get('/grievances/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.code).toBe('GRIEVANCE_NOT_FOUND');
    });
  });
});
