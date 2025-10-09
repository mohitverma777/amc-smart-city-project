const mqtt = require('mqtt');
const Redis = require('ioredis');
const { ElectricityMeter, MeterReading } = require('../models');
const SmartMeterData = require('../models/SmartMeterData');
const logger = require('@amc/shared/utils/logger');
const Decimal = require('decimal.js');

class SmartMeterService {
  constructor() {
    this.mqttClient = null;
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB
    });
    
    this.isConnected = false;
    this.activeMeterSessions = new Map();
    this.realtimeData = new Map();
  }

  // Initialize MQTT connection for smart meters
  async initialize() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
      
      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId: `electricity-service-${Date.now()}`,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        keepalive: 60,
        reconnectPeriod: 5000,
        clean: true
      });

      this.mqttClient.on('connect', () => {
        logger.info('Connected to MQTT broker for smart meters');
        this.isConnected = true;
        this.subscribeToTopics();
      });

      this.mqttClient.on('error', (error) => {
        logger.error('MQTT connection error:', error);
        this.isConnected = false;
      });

      this.mqttClient.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.mqttClient.on('close', () => {
        logger.warn('MQTT connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('Failed to initialize MQTT connection:', error);
      throw error;
    }
  }

  // Subscribe to smart meter MQTT topics
  subscribeToTopics() {
    const topics = [
      'amc/electricity/meters/+/reading',        // Regular meter readings
      'amc/electricity/meters/+/demand',         // Demand readings
      'amc/electricity/meters/+/power_quality',  // Power quality data
      'amc/electricity/meters/+/events',         // Meter events (tamper, power failure)
      'amc/electricity/meters/+/load_profile',   // Load profile data
      'amc/electricity/meters/+/status',         // Meter status updates
      'amc/electricity/meters/+/alert'           // Critical alerts
    ];

    topics.forEach(topic => {
      this.mqttClient.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to topic ${topic}:`, err);
        } else {
          logger.info(`Subscribed to MQTT topic: ${topic}`);
        }
      });
    });
  }

  // Handle incoming MQTT messages from smart meters
  async handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      const deviceId = topicParts;
      const dataType = topicParts;
      
      switch (dataType) {
        case 'reading':
          await this.processMeterReading(deviceId, data);
          break;
        case 'demand':
          await this.processDemandReading(deviceId, data);
          break;
        case 'power_quality':
          await this.processPowerQualityData(deviceId, data);
          break;
        case 'events':
          await this.processMeterEvent(deviceId, data);
          break;
        case 'load_profile':
          await this.processLoadProfile(deviceId, data);
          break;
        case 'status':
          await this.processMeterStatus(deviceId, data);
          break;
        case 'alert':
          await this.processAlert(deviceId, data);
          break;
        default:
          logger.warn(`Unknown smart meter data type: ${dataType}`);
      }

    } catch (error) {
      logger.error('Error processing smart meter message:', {
        topic,
        message: message.toString(),
        error: error.message
      });
    }
  }

  // Process regular meter readings
  async processMeterReading(deviceId, data) {
    try {
      const {
        energyReading,
        timestamp,
        voltage,
        current,
        powerFactor,
        frequency,
        temperature
      } = data;

      // Find meter by device ID
      const meter = await ElectricityMeter.findOne({
        where: { deviceId },
        include: [{ association: 'connection' }]
      });

      if (!meter) {
        logger.warn(`No meter found for device: ${deviceId}`);
        return;
      }

      // Validate reading
      if (!this.validateReading(meter, energyReading, timestamp)) {
        logger.warn(`Invalid reading from device: ${deviceId}`, data);
        return;
      }

      // Create meter reading record
      const meterReading = await MeterReading.create({
        meterId: meter.id,
        connectionId: meter.connectionId,
        energyReading,
        readingDate: new Date(timestamp),
        readingType: 'smart_meter',
        voltageR: voltage?.r || voltage?.single || null,
        voltageY: voltage?.y || null,
        voltageB: voltage?.b || null,
        currentR: current?.r || current?.single || null,
        currentY: current?.y || null,
        currentB: current?.b || null,
        powerFactor: powerFactor,
        frequency: frequency,
        isValidated: true,
        validatedBy: 'smart_meter_system',
        validatedAt: new Date(),
        status: 'validated',
        metadata: {
          deviceId,
          temperature,
          dataSource: 'smart_meter'
        }
      });

      // Update meter's current reading
      await meter.updateReading(energyReading, new Date(timestamp));

      // Store in Redis for real-time access
      const realtimeData = {
        deviceId,
        energyReading,
        voltage,
        current,
        powerFactor,
        frequency,
        timestamp: new Date(timestamp),
        lastUpdate: new Date()
      };

      await this.redis.setex(
        `smart_meter:${deviceId}:current`,
        300, // 5 minutes TTL
        JSON.stringify(realtimeData)
      );

      // Store in MongoDB for analytics
      await this.storeSmartMeterData(deviceId, {
        type: 'reading',
        data: realtimeData,
        meterId: meter.id,
        connectionId: meter.connectionId
      });

      logger.info('Smart meter reading processed', {
        deviceId,
        meterId: meter.id,
        energyReading,
        consumption: meterReading.consumption
      });

    } catch (error) {
      logger.error('Error processing smart meter reading:', error);
    }
  }

  // Process demand readings (maximum demand)
  async processDemandReading(deviceId, data) {
    try {
      const { maxDemand, avgDemand, timestamp, demandPeriod } = data;

      const meter = await ElectricityMeter.findOne({
        where: { deviceId },
        include: [{ association: 'connection' }]
      });

      if (!meter) return;

      // Update connection's demand information
      if (meter.connection && maxDemand > meter.connection.maxDemandRecorded) {
        await meter.connection.update({
          maxDemandRecorded: maxDemand,
          currentLoad: maxDemand
        });
      }

      // Store demand data in Redis
      await this.redis.setex(
        `smart_meter:${deviceId}:demand`,
        300,
        JSON.stringify({
          deviceId,
          maxDemand,
          avgDemand,
          demandPeriod,
          timestamp: new Date(timestamp)
        })
      );

      // Store in MongoDB
      await this.storeSmartMeterData(deviceId, {
        type: 'demand',
        data: {
          maxDemand,
          avgDemand,
          demandPeriod,
          timestamp: new Date(timestamp)
        },
        meterId: meter.id,
        connectionId: meter.connectionId
      });

    } catch (error) {
      logger.error('Error processing demand reading:', error);
    }
  }

  // Process power quality data
  async processPowerQualityData(deviceId, data) {
    try {
      const {
        voltage,
        current,
        powerFactor,
        frequency,
        thd,
        unbalance,
        timestamp
      } = data;

      // Check for power quality issues
      const qualityIssues = this.analyzePowerQuality(data);

      // Store in Redis
      await this.redis.setex(
        `smart_meter:${deviceId}:power_quality`,
        600, // 10 minutes TTL
        JSON.stringify({
          deviceId,
          voltage,
          current,
          powerFactor,
          frequency,
          thd,
          unbalance,
          qualityIssues,
          timestamp: new Date(timestamp)
        })
      );

      // Store in MongoDB
      await this.storeSmartMeterData(deviceId, {
        type: 'power_quality',
        data: {
          voltage,
          current,
          powerFactor,
          frequency,
          thd,
          unbalance,
          qualityIssues,
          timestamp: new Date(timestamp)
        }
      });

      // Send alerts for critical power quality issues
      if (qualityIssues.length > 0) {
        await this.sendPowerQualityAlerts(deviceId, qualityIssues);
      }

    } catch (error) {
      logger.error('Error processing power quality data:', error);
    }
  }

  // Process meter events (tamper, power failure, etc.)
  async processMeterEvent(deviceId, data) {
    try {
      const { eventType, eventCode, timestamp, severity, description } = data;

      const meter = await ElectricityMeter.findOne({
        where: { deviceId }
      });

      if (!meter) return;

      // Handle specific events
      switch (eventType) {
        case 'tamper':
          await meter.recordTamperEvent(eventCode, description);
          break;
        case 'power_failure':
          await this.processPowerFailure(deviceId, data);
          break;
        case 'meter_error':
          await this.processMeterError(deviceId, data);
          break;
        case 'communication_failure':
          await this.processCommunicationFailure(deviceId, data);
          break;
      }

      // Store event in MongoDB
      await this.storeSmartMeterData(deviceId, {
        type: 'event',
        data: {
          eventType,
          eventCode,
          severity,
          description,
          timestamp: new Date(timestamp)
        },
        meterId: meter.id
      });

      // Send critical event alerts
      if (severity === 'critical' || severity === 'high') {
        await this.sendEventAlert(deviceId, data);
      }

    } catch (error) {
      logger.error('Error processing meter event:', error);
    }
  }

  // Process load profile data
  async processLoadProfile(deviceId, data) {
    try {
      const { profileData, interval, timestamp } = data;

      // Store load profile in MongoDB for analytics
      await this.storeSmartMeterData(deviceId, {
        type: 'load_profile',
        data: {
          profileData,
          interval,
          timestamp: new Date(timestamp)
        }
      });

      // Update Redis with latest profile
      await this.redis.setex(
        `smart_meter:${deviceId}:load_profile`,
        3600, // 1 hour TTL
        JSON.stringify({
          deviceId,
          profileData,
          interval,
          timestamp: new Date(timestamp)
        })
      );

    } catch (error) {
      logger.error('Error processing load profile:', error);
    }
  }

  // Process meter status updates
  async processMeterStatus(deviceId, data) {
    try {
      const {
        status,
        batteryLevel,
        signalStrength,
        temperature,
        uptime,
        timestamp
      } = data;

      const meter = await ElectricityMeter.findOne({
        where: { deviceId }
      });

      if (!meter) return;

      // Update communication success rate
      const currentRate = meter.communicationSuccessRate || 0;
      const newRate = status === 'online' ? 
        Math.min(100, currentRate + 0.1) : 
        Math.max(0, currentRate - 0.5);

      await meter.update({
        communicationSuccessRate: newRate,
        lastCommunication: new Date(timestamp)
      });

      // Store status in Redis
      await this.redis.setex(
        `smart_meter:${deviceId}:status`,
        300,
        JSON.stringify({
          deviceId,
          status,
          batteryLevel,
          signalStrength,
          temperature,
          uptime,
          timestamp: new Date(timestamp)
        })
      );

    } catch (error) {
      logger.error('Error processing meter status:', error);
    }
  }

  // Process critical alerts
  async processAlert(deviceId, data) {
    try {
      const { alertType, severity, message, timestamp } = data;

      // Store alert
      await this.storeSmartMeterData(deviceId, {
        type: 'alert',
        data: {
          alertType,
          severity,
          message,
          timestamp: new Date(timestamp)
        }
      });

      // Send immediate notification for critical alerts
      if (severity === 'critical') {
        await this.sendCriticalAlert(deviceId, data);
      }

    } catch (error) {
      logger.error('Error processing smart meter alert:', error);
    }
  }

  // Initialize smart meter
  async initializeSmartMeter(deviceId, config) {
    try {
      this.activeMeterSessions.set(deviceId, {
        connectionId: config.connectionId,
        meterId: config.meterId,
        tariffCategory: config.tariffCategory,
        initialized: true,
        initTime: new Date()
      });

      // Send configuration to meter via MQTT
      const configMessage = {
        deviceId,
        config: {
          readingInterval: parseInt(process.env.METER_READING_INTERVAL) || 15,
          demandInterval: parseInt(process.env.DEMAND_CALCULATION_WINDOW) || 30,
          powerQualityMonitoring: process.env.POWER_QUALITY_MONITORING === 'true',
          tariffCategory: config.tariffCategory
        },
        timestamp: new Date()
      };

      this.mqttClient.publish(
        `amc/electricity/meters/${deviceId}/config`,
        JSON.stringify(configMessage)
      );

      logger.info('Smart meter initialized', { deviceId, config });

    } catch (error) {
      logger.error('Failed to initialize smart meter:', error);
      throw error;
    }
  }

  // Get real-time meter data
  async getRealtimeData(deviceId) {
    try {
      const [current, demand, powerQuality, status] = await Promise.all([
        this.redis.get(`smart_meter:${deviceId}:current`),
        this.redis.get(`smart_meter:${deviceId}:demand`),
        this.redis.get(`smart_meter:${deviceId}:power_quality`),
        this.redis.get(`smart_meter:${deviceId}:status`)
      ]);

      return {
        current: current ? JSON.parse(current) : null,
        demand: demand ? JSON.parse(demand) : null,
        powerQuality: powerQuality ? JSON.parse(powerQuality) : null,
        status: status ? JSON.parse(status) : null
      };

    } catch (error) {
      logger.error('Failed to get realtime data:', error);
      return null;
    }
  }

  // Get power quality data
  async getPowerQuality(deviceId, hours = 24) {
    try {
      const powerQualityData = await this.redis.get(`smart_meter:${deviceId}:power_quality`);
      return powerQualityData ? JSON.parse(powerQualityData) : null;
    } catch (error) {
      logger.error('Failed to get power quality data:', error);
      return null;
    }
  }

  // Get load profile
  async getLoadProfile(deviceId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const loadProfiles = await SmartMeterData.find({
        deviceId,
        type: 'load_profile',
        timestamp: { $gte: startDate }
      }).sort({ timestamp: -1 });

      return loadProfiles.map(profile => profile.data);

    } catch (error) {
      logger.error('Failed to get load profile:', error);
      return [];
    }
  }

  // Helper methods
  validateReading(meter, reading, timestamp) {
    // Basic validation
    if (reading < 0 || reading > 999999999) return false;
    if (reading < meter.currentReading) return false;
    
    const readingTime = new Date(timestamp);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (readingTime < oneHourAgo || readingTime > now) return false;
    
    return true;
  }

  analyzePowerQuality(data) {
    const issues = [];
    const { voltage, frequency, powerFactor, thd } = data;

    // Voltage analysis
    if (voltage) {
      const minVoltage = parseFloat(process.env.VOLTAGE_THRESHOLD_MIN) || 200;
      const maxVoltage = parseFloat(process.env.VOLTAGE_THRESHOLD_MAX) || 250;
      
      Object.keys(voltage).forEach(phase => {
        const v = voltage[phase];
        if (v < minVoltage) {
          issues.push({ type: 'low_voltage', phase, value: v, threshold: minVoltage });
        } else if (v > maxVoltage) {
          issues.push({ type: 'high_voltage', phase, value: v, threshold: maxVoltage });
        }
      });
    }

    // Frequency analysis
    if (frequency && (frequency < 49.5 || frequency > 50.5)) {
      issues.push({ type: 'frequency_deviation', value: frequency });
    }

    // Power factor analysis
    if (powerFactor && powerFactor < 0.8) {
      issues.push({ type: 'poor_power_factor', value: powerFactor });
    }

    // THD analysis
    if (thd && thd > 5) {
      issues.push({ type: 'high_thd', value: thd });
    }

    return issues;
  }

  async storeSmartMeterData(deviceId, dataObj) {
    try {
      const smartMeterDoc = new SmartMeterData({
        deviceId,
        type: dataObj.type,
        data: dataObj.data,
        meterId: dataObj.meterId,
        connectionId: dataObj.connectionId,
        timestamp: dataObj.data.timestamp || new Date()
      });

      await smartMeterDoc.save();
    } catch (error) {
      logger.error('Failed to store smart meter data:', error);
    }
  }

  async sendPowerQualityAlerts(deviceId, issues) {
    // Implementation would send notifications
    logger.warn('Power quality issues detected', { deviceId, issues });
  }

  async sendEventAlert(deviceId, eventData) {
    // Implementation would send notifications
    logger.error('Critical meter event', { deviceId, eventData });
  }

  async sendCriticalAlert(deviceId, alertData) {
    // Implementation would send notifications
    logger.error('Critical smart meter alert', { deviceId, alertData });
  }

  async shutdown() {
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    await this.redis.disconnect();
  }
}

module.exports = new SmartMeterService();
