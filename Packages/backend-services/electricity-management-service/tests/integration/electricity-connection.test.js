const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const { 
  sequelize, 
  ElectricityConnection, 
  ElectricityMeter, 
  ElectricityBill,
  MeterReading 
} = require('../../src/models');
const ElectricityManagementApp = require('../../src/app');
const smartMeterService = require('../../src/services/smartMeterService');
const loadManagementService = require('../../src/services/loadManagementService');

describe('Electricity Management Service Integration Tests', () => {
  let app;
  let citizenToken, officerToken;
  let testConnection, testMeter, testBill;

  beforeAll(async () => {
    // Initialize app
    const electricityApp = new ElectricityManagementApp();
    app = electricityApp.app;

    // Setup test database
    await sequelize.sync({ force: true });

    // Get auth tokens
    citizenToken = await getAuthToken('citizen');
    officerToken = await getAuthToken('officer');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /connections/apply', () => {
    it('should create a new electricity connection application', async () => {
      const applicationData = {
        premiseAddress: {
          street: '456 Electric Avenue',
          area: 'Power Grid Area',
          ward: 'Ward-2',
          zone: 'Zone-B',
          pincode: '380002'
        },
        connectionType: 'domestic',
        connectionCategory: 'apl',
        sanctionedLoad: 5.0,
        voltage: '220V',
        phases: 'single',
        supplyType: 'overhead',
        contactNumber: '9876543211'
      };

      const response = await request(app)
        .post('/connections/apply')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.status).to.equal('success');
      expect(response.body.data.connection.connectionType).to.equal('domestic');
      expect(response.body.data.applicationNumber).to.match(/^ELEAPP\d{12}$/);
      expect(response.body.data.estimatedCharges.securityDeposit).to.be.a('number');
      expect(response.body.data.estimatedCharges.securityDeposit).to.be.greaterThan(0);

      testConnection = response.body.data.connection;
    });

    it('should check load availability before creating connection', async () => {
      const spy = sinon.spy(loadManagementService, 'checkLoadAvailability');

      const applicationData = {
        premiseAddress: {
          street: '789 High Load Street',
          area: 'Industrial Area',
          ward: 'Ward-3',
          zone: 'Zone-C',
          pincode: '380003'
        },
        connectionType: 'industrial',
        connectionCategory: 'industrial_large',
        sanctionedLoad: 1000.0, // Very high load
        voltage: '11KV',
        phases: 'three',
        supplyType: 'underground'
      };

      const response = await request(app)
        .post('/connections/apply')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(applicationData);

      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith('Ward-3', 'Zone-C', 1000.0)).to.be.true;

      spy.restore();
    });

    it('should reject duplicate connection for same address', async () => {
      const applicationData = {
        premiseAddress: {
          street: '456 Electric Avenue',
          area: 'Power Grid Area',
          ward: 'Ward-2',
          zone: 'Zone-B',
          pincode: '380002'
        },
        connectionType: 'commercial',
        connectionCategory: 'commercial',
        sanctionedLoad: 10.0
      };

      const response = await request(app)
        .post('/connections/apply')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(applicationData)
        .expect(400);

      expect(response.body.status).to.equal('error');
      expect(response.body.code).to.equal('DUPLICATE_CONNECTION');
    });
  });

  describe('GET /connections/my-connections', () => {
    it('should return user connections with consumption data', async () => {
      const response = await request(app)
        .get('/connections/my-connections')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.status).to.equal('success');
      expect(Array.isArray(response.body.data.connections)).to.be.true;
      expect(response.body.data.connections).to.have.length.greaterThan(0);
      
      const connection = response.body.data.connections;
      expect(connection.currentConsumption).to.exist;
      expect(connection.outstandingAmount).to.be.a('number');
    });

    it('should support filtering by connection type', async () => {
      const response = await request(app)
        .get('/connections/my-connections?connectionType=domestic')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.status).to.equal('success');
      response.body.data.connections.forEach(connection => {
        expect(connection.connectionType).to.equal('domestic');
      });
    });
  });

  describe('PATCH /connections/:id/status', () => {
    it('should update connection status with meter installation (officers only)', async () => {
      const meterData = {
        meterNumber: 'ELE2025MTR000001',
        serialNumber: 'SN2025001',
        meterType: 'smart_meter_ami',
        make: 'L&T',
        model: 'EM6400',
        manufacturingYear: 2024,
        accuracy: 0.5,
        ratedVoltage: '220V',
        ratedCurrent: 40,
        maxCurrent: 60,
        phases: 'single',
        isSmartMeter: true,
        communicationType: 'rf',
        deviceId: 'SM001',
        initialReading: 0
      };

      const response = await request(app)
        .patch(`/connections/${testConnection.id}/status`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          status: 'connected',
          remarks: 'Connection completed and meter installed',
          meterDetails: meterData
        })
        .expect(200);

      expect(response.body.status).to.equal('success');
      expect(response.body.data.connection.status).to.equal('connected');

      // Verify meter was created
      const meter = await ElectricityMeter.findOne({
        where: { connectionId: testConnection.id }
      });
      
      expect(meter).to.not.be.null;
      expect(meter.isSmartMeter).to.be.true;
      expect(meter.deviceId).to.equal('SM001');
      
      testMeter = meter;
    });

    it('should deny status update for citizens', async () => {
      const response = await request(app)
        .patch(`/connections/${testConnection.id}/status`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ status: 'active' })
        .expect(403);

      expect(response.body.code).to.equal('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /connections/:connectionId/readings', () => {
    beforeEach(async () => {
      // Ensure connection is active for readings
      await ElectricityConnection.update(
        { status: 'active' },
        { where: { id: testConnection.id } }
      );
    });

    it('should add meter reading with power quality data', async () => {
      const readingData = {
        energyReading: 150.75,
        maxDemand: 3.2,
        powerFactor: 0.92,
        readingDate: new Date().toISOString(),
        voltageData: {
          r: 220.5,
          currentR: 12.3
        },
        remarks: 'Monthly reading with power quality check'
      };

      const response = await request(app)
        .post(`/connections/${testConnection.id}/readings`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(readingData)
        .expect(201);

      expect(response.body.status).to.equal('success');
      expect(response.body.data.meterReading.energyReading).to.equal('150.75');
      expect(response.body.data.demand).to.equal(3.2);
      expect(response.body.data.powerFactor).to.equal(0.92);
      expect(response.body.data.consumption).to.be.a('number');
    });

    it('should reject readings with invalid values', async () => {
      const readingData = {
        energyReading: -50, // Invalid negative reading
        readingDate: new Date().toISOString()
      };

      const response = await request(app)
        .post(`/connections/${testConnection.id}/readings`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(readingData)
        .expect(400);

      expect(response.body.code).to.equal('INVALID_READING_VALUE');
    });
  });

  describe('POST /connections/:connectionId/generate-bill', () => {
    beforeEach(async () => {
      // Create validated meter reading for billing
      await MeterReading.create({
        meterId: testMeter.id,
        connectionId: testConnection.id,
        energyReading: 200.50,
        readingDate: new Date(),
        readingType: 'regular',
        isValidated: true,
        validatedBy: 'test-officer',
        status: 'validated'
      });
    });

    it('should generate electricity bill with tiered pricing', async () => {
      const response = await request(app)
        .post(`/connections/${testConnection.id}/generate-bill`)
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(201);

      expect(response.body.status).to.equal('success');
      expect(response.body.data.bill.billNumber).to.match(/^ELE\d{14}$/);
      expect(response.body.data.bill.totalAmount).to.be.greaterThan(0);
      expect(response.body.data.bill.unitsConsumed).to.be.a('number');
      expect(response.body.data.bill.energyCharges).to.be.greaterThan(0);

      testBill = response.body.data.bill;
    });

    it('should apply subsidy for eligible BPL connections', async () => {
      // Create BPL connection
      const bplConnection = await ElectricityConnection.create({
        customerCitizenId: 'test-citizen-bpl',
        premiseAddress: {
          street: 'BPL Street',
          area: 'Subsidized Area',
          ward: 'Ward-5',
          zone: 'Zone-A',
          pincode: '380005'
        },
        connectionType: 'domestic',
        connectionCategory: 'bpl',
        sanctionedLoad: 2.0,
        voltage: '220V',
        phases: 'single',
        supplyType: 'overhead',
        status: 'active',
        subsidyEligible: true,
        subsidyPercentage: 50,
        freeUnitsPerMonth: 50
      });

      // Create meter for BPL connection
      const bplMeter = await ElectricityMeter.create({
        connectionId: bplConnection.id,
        meterNumber: 'BPL001',
        serialNumber: 'BPLSN001',
        meterType: 'electronic_single_phase',
        make: 'Generic',
        model: 'BPL-1',
        manufacturingYear: 2023,
        accuracy: 1.0,
        ratedVoltage: '220V',
        ratedCurrent: 10,
        maxCurrent: 15,
        phases: 'single',
        initialReading: 0
      });

      // Create reading
      await MeterReading.create({
        meterId: bplMeter.id,
        connectionId: bplConnection.id,
        energyReading: 75, // 75 units (25 paid units after 50 free)
        readingDate: new Date(),
        isValidated: true,
        status: 'validated'
      });

      const response = await request(app)
        .post(`/connections/${bplConnection.id}/generate-bill`)
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(201);

      const bill = response.body.data.bill;
      expect(bill.freeUnits).to.equal(50);
      expect(bill.subsidyAmount).to.be.greaterThan(0);
      expect(bill.unitsConsumed).to.equal(75);
    });

    it('should deny bill generation for citizens', async () => {
      const response = await request(app)
        .post(`/connections/${testConnection.id}/generate-bill`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(403);

      expect(response.body.code).to.equal('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Smart Meter Integration', () => {
    beforeEach(async () => {
      sinon.stub(smartMeterService, 'getRealtimeData').resolves({
        current: {
          energyReading: 205.75,
          voltage: { single: 220.2 },
          current: { single: 15.5 },
          powerFactor: 0.95,
          frequency: 50.1,
          timestamp: new Date()
        },
        demand: {
          maxDemand: 3.8,
          avgDemand: 2.1,
          timestamp: new Date()
        },
        powerQuality: {
          voltage: { single: 220.2 },
          frequency: 50.1,
          powerFactor: 0.95,
          qualityIssues: [],
          timestamp: new Date()
        }
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should get real-time smart meter data', async () => {
      const response = await request(app)
        .get(`/smart-meters/${testMeter.deviceId}/realtime`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.status).to.equal('success');
      expect(response.body.data.current.energyReading).to.be.a('number');
      expect(response.body.data.demand.maxDemand).to.be.a('number');
      expect(response.body.data.powerQuality.voltage).to.exist;
    });

    it('should get power quality analysis', async () => {
      sinon.stub(smartMeterService, 'getPowerQuality').resolves({
        voltage: { single: 220.2 },
        frequency: 50.1,
        powerFactor: 0.95,
        thd: 3.2,
        qualityIssues: [],
        timestamp: new Date()
      });

      const response = await request(app)
        .get(`/smart-meters/${testMeter.deviceId}/power-quality`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.status).to.equal('success');
      expect(response.body.data.thd).to.be.a('number');
      expect(Array.isArray(response.body.data.qualityIssues)).to.be.true;
    });
  });

  describe('Load Management', () => {
    it('should get grid load distribution', async () => {
      const response = await request(app)
        .get('/load-management/distribution')
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(200);

      expect(response.body.status).to.equal('success');
      expect(Array.isArray(response.body.data.distribution)).to.be.true;
    });

    it('should get demand forecast for zone', async () => {
      sinon.stub(loadManagementService, 'forecastDemand').resolves({
        forecast: 8500,
        confidence: 85,
        trend: 'increasing',
        trendPercentage: 12.5
      });

      const response = await request(app)
        .get('/load-management/forecast/Zone-A')
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(200);

      expect(response.body.status).to.equal('success');
      expect(response.body.data.forecast).to.be.a('number');
      expect(response.body.data.confidence).to.be.a('number');
      expect(response.body.data.trend).to.be.a('string');
    });

    it('should monitor grid stability', async () => {
      sinon.stub(loadManagementService, 'monitorGridStability').resolves([
        {
          zone: 'Zone-A',
          capacity: 10000,
          currentLoad: 7500,
          utilizationPercentage: 75,
          status: 'monitor',
          availableCapacity: 2500
        }
      ]);

      const response = await request(app)
        .get('/load-management/stability')
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(200);

      expect(response.body.status).to.equal('success');
      expect(Array.isArray(response.body.data.zones)).to.be.true;
      expect(response.body.data.zones.status).to.be.a('string');
    });
  });

  describe('Analytics and Reporting', () => {
    it('should get consumption trends', async () => {
      const response = await request(app)
        .get('/analytics/consumption-trends?period=month')
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(200);

      expect(response.body.status).to.equal('success');
      expect(response.body.data.period).to.equal('month');
    });

    it('should get revenue report', async () => {
      const response = await request(app)
        .get('/analytics/revenue-report?startDate=2025-01-01&endDate=2025-12-31')
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(200);

      expect(response.body.status).to.equal('success');
      expect(response.body.data.totalRevenue).to.be.a('number');
    });

    it('should deny analytics access for citizens', async () => {
      const response = await request(app)
        .get('/analytics/consumption-trends')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(403);

      expect(response.body.code).to.equal('INSUFFICIENT_PERMISSIONS');
    });
  });
});

describe('Smart Meter Service Unit Tests', () => {
  const smartMeterService = require('../../src/services/smartMeterService');
  
  beforeEach(() => {
    sinon.restore();
  });

  describe('processMeterReading', () => {
    it('should process valid smart meter reading', async () => {
      const mockMeter = {
        id: 'test-meter-id',
        connectionId: 'test-connection-id',
        deviceId: 'SM001',
        initialReading: 0,
        updateReading: sinon.stub().resolves()
      };

      sinon.stub(ElectricityMeter, 'findOne').resolves(mockMeter);
      sinon.stub(MeterReading, 'create').resolves({
        id: 'test-reading-id',
        consumption: 25.5,
        energyReading: 225.5
      });

      const testData = {
        energyReading: 225.5,
        timestamp: Date.now(),
        voltage: { single: 220.2 },
        current: { single: 15.3 },
        powerFactor: 0.94,
        frequency: 50.0
      };

      await smartMeterService.processMeterReading('SM001', testData);

      expect(ElectricityMeter.findOne.calledOnce).to.be.true;
      expect(MeterReading.create.calledOnce).to.be.true;
      expect(MeterReading.create.firstCall.args).to.include({
        energyReading: 225.5,
        readingType: 'smart_meter'
      });
    });

    it('should handle unknown device ID gracefully', async () => {
      sinon.stub(ElectricityMeter, 'findOne').resolves(null);
      const logSpy = sinon.spy(console, 'warn');

      const testData = {
        energyReading: 250.0,
        timestamp: Date.now()
      };

      await smartMeterService.processMeterReading('UNKNOWN_DEVICE', testData);
      expect(logSpy.called).to.be.true;
    });
  });

  describe('analyzePowerQuality', () => {
    it('should detect voltage issues', () => {
      const testData = {
        voltage: { single: 180 }, // Low voltage
        frequency: 50.0,
        powerFactor: 0.95,
        thd: 3.0
      };

      const issues = smartMeterService.analyzePowerQuality(testData);
      
      expect(issues).to.have.length.greaterThan(0);
      expect(issues.type).to.equal('low_voltage');
      expect(issues.value).to.equal(180);
    });

    it('should detect power factor issues', () => {
      const testData = {
        voltage: { single: 220 },
        frequency: 50.0,
        powerFactor: 0.7, // Poor power factor
        thd: 3.0
      };

      const issues = smartMeterService.analyzePowerQuality(testData);
      
      expect(issues).to.have.length.greaterThan(0);
      expect(issues.type).to.equal('poor_power_factor');
      expect(issues.value).to.equal(0.7);
    });
  });
});

// Helper function for authentication tokens
async function getAuthToken(role) {
  // Mock implementation - would integrate with actual auth service
  return `test-jwt-token-${role}-electricity`;
}
