const mqtt = require('mqtt');
const { MeterReading, WaterConnection } = require('../models');
const WaterQuality = require('../models/WaterQuality');
const logger = require('@amc/shared/utils/logger');

class IoTService {
  constructor() {
    this.mqttClient = null;
    this.isConnected = false;
    this.deviceRegistry = new Map();
    this.lastProcessedReadings = new Map();
  }

  // Initialize MQTT connection
  async initialize() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
      
      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId: `water-service-${Date.now()}`,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        keepalive: 60,
        reconnectPeriod: 5000,
        clean: true
      });

      this.mqttClient.on('connect', () => {
        logger.info('Connected to MQTT broker');
        this.isConnected = true;
        this.subscribeToTopics();
      });

      this.mqttClient.on('error', (error) => {
        logger.error('MQTT connection error:', error);
        this.isConnected = false;
      });

      this.mqttClient.on('reconnect', () => {
        logger.info('Reconnecting to MQTT broker...');
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

  // Subscribe to relevant MQTT topics
  subscribeToTopics() {
    const topics = [
      'amc/water/meters/+/reading',     // Individual meter readings
      'amc/water/quality/+/data',       // Water quality sensor data
      'amc/water/pressure/+/data',      // Water pressure sensors
      'amc/water/flow/+/data',          // Flow rate sensors
      'amc/water/pumps/+/status',       // Pump status updates
      'amc/water/tanks/+/level',        // Tank level sensors
      'amc/water/pipes/+/leak'          // Leak detection sensors
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

  // Handle incoming MQTT messages
  async handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      
      switch (topicParts) { // amc/water/[type]/...
        case 'meters':
          await this.processMeterReading(topicParts, data);
          break;
        case 'quality':
          await this.processWaterQuality(topicParts, data);
          break;
        case 'pressure':
          await this.processPressureData(topicParts, data);
          break;
        case 'flow':
          await this.processFlowData(topicParts, data);
          break;
        case 'pumps':
          await this.processPumpStatus(topicParts, data);
          break;
        case 'tanks':
          await this.processTankLevel(topicParts, data);
          break;
        case 'pipes':
          await this.processLeakDetection(topicParts, data);
          break;
        default:
          logger.warn(`Unknown topic type: ${topicParts}`);
      }

    } catch (error) {
      logger.error('Error processing MQTT message:', {
        topic,
        message: message.toString(),
        error: error.message
      });
    }
  }

  // Process meter reading from IoT device
  async processMeterReading(deviceId, data) {
    try {
      const { reading, timestamp, batteryLevel, signalStrength } = data;

      // Find connection by meter/device ID
      const connection = await WaterConnection.findOne({
        where: { meterNumber: deviceId }
      });

      if (!connection) {
        logger.warn(`No connection found for meter device: ${deviceId}`);
        return;
      }

      // Check for duplicate readings
      const lastProcessedKey = `${deviceId}-${reading}-${timestamp}`;
      if (this.lastProcessedReadings.has(lastProcessedKey)) {
        logger.debug(`Duplicate reading ignored for device: ${deviceId}`);
        return;
      }

      // Validate reading data
      if (!this.validateMeterReading(connection, reading, timestamp)) {
        logger.warn(`Invalid meter reading for device: ${deviceId}`, data);
        return;
      }

      // Create meter reading record
      const meterReading = await MeterReading.create({
        connectionId: connection.id,
        currentReading: reading,
        readingDate: new Date(timestamp),
        readingType: 'regular',
        readingSource: 'iot_sensor',
        isValidated: true, // IoT readings are auto-validated
        validatedBy: 'iot_system',
        validatedAt: new Date(),
        status: 'validated',
        metadata: {
          deviceId,
          batteryLevel,
          signalStrength,
          dataReliability: this.assessDataReliability(batteryLevel, signalStrength)
        }
      });

      // Cache processed reading
      this.lastProcessedReadings.set(lastProcessedKey, Date.now());

      // Check for anomalies and send alerts if needed
      if (meterReading.hasAnomaly) {
        await this.sendAnomalyAlert(connection, meterReading);
      }

      logger.info('IoT meter reading processed', {
        deviceId,
        connectionId: connection.id,
        reading,
        consumption: meterReading.consumption
      });

    } catch (error) {
      logger.error('Error processing meter reading:', error);
    }
  }

  // Process water quality data from IoT sensors
  async processWaterQuality(sensorId, data) {
    try {
      const {
        location,
        locationName,
        ward,
        zone,
        timestamp,
        pH,
        turbidity,
        tds,
        chlorine,
        temperature,
        batteryLevel,
        signalStrength
      } = data;

      // Create water quality record
      const qualityRecord = new WaterQuality({
        sampleId: `IOT-${sensorId}-${Date.now()}`,
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        locationName,
        ward,
        zone,
        samplingDate: new Date(timestamp),
        samplingTime: new Date(timestamp).toTimeString(),
        sampleType: 'distribution_network',
        
        physicalParameters: {
          temperature: { value: temperature },
          turbidity: { value: turbidity }
        },
        
        chemicalParameters: {
          pH: { value: pH },
          totalDissolvedSolids: { value: tds },
          residualChlorine: { value: chlorine }
        },
        
        bacteriologicalParameters: {
          totalColiformCount: { value: 0 }, // IoT sensors typically don't measure bacteria
          fecalColiformCount: { value: 0 },
          eColi: { value: 0 }
        },
        
        sensorData: {
          deviceId: sensorId,
          batteryLevel,
          signalStrength,
          dataReliability: this.assessDataReliability(batteryLevel, signalStrength)
        },
        
        dataSource: 'iot_sensor',
        isValidated: true,
        validatedBy: 'iot_system',
        validatedAt: new Date()
      });

      await qualityRecord.save();

      // Check for quality issues and send alerts
      if (qualityRecord.overallQuality === 'poor' || qualityRecord.overallQuality === 'unacceptable') {
        await this.sendWaterQualityAlert(qualityRecord);
      }

      logger.info('IoT water quality data processed', {
        sensorId,
        location: locationName,
        qualityScore: qualityRecord.qualityScore
      });

    } catch (error) {
      logger.error('Error processing water quality data:', error);
    }
  }

  // Process water pressure data
  async processPressureData(sensorId, data) {
    try {
      const { pressure, location, timestamp, batteryLevel } = data;

      // Store pressure data in time-series format (Redis or InfluxDB would be ideal)
      await this.storePressureData({
        sensorId,
        pressure,
        location,
        timestamp: new Date(timestamp),
        batteryLevel
      });

      // Check for pressure anomalies
      if (pressure < 1.5 || pressure > 6.0) { // Typical range: 1.5-6.0 bar
        await this.sendPressureAlert(sensorId, pressure, location);
      }

      logger.debug('Pressure data processed', { sensorId, pressure });

    } catch (error) {
      logger.error('Error processing pressure data:', error);
    }
  }

  // Process flow rate data
  async processFlowData(sensorId, data) {
    try {
      const { flowRate, totalFlow, location, timestamp } = data;

      await this.storeFlowData({
        sensorId,
        flowRate,
        totalFlow,
        location,
        timestamp: new Date(timestamp)
      });

      logger.debug('Flow data processed', { sensorId, flowRate });

    } catch (error) {
      logger.error('Error processing flow data:', error);
    }
  }

  // Process pump status updates
  async processPumpStatus(pumpId, data) {
    try {
      const { status, powerConsumption, temperature, vibration, timestamp } = data;

      await this.storePumpData({
        pumpId,
        status,
        powerConsumption,
        temperature,
        vibration,
        timestamp: new Date(timestamp)
      });

      // Check for pump issues
      if (status === 'error' || temperature > 80 || vibration > 10) {
        await this.sendPumpAlert(pumpId, data);
      }

      logger.debug('Pump status processed', { pumpId, status });

    } catch (error) {
      logger.error('Error processing pump status:', error);
    }
  }

  // Process tank level data
  async processTankLevel(tankId, data) {
    try {
      const { level, capacity, location, timestamp } = data;
      const percentage = (level / capacity) * 100;

      await this.storeTankData({
        tankId,
        level,
        capacity,
        percentage,
        location,
        timestamp: new Date(timestamp)
      });

      // Send alerts for low or overflow conditions
      if (percentage < 10) {
        await this.sendTankAlert(tankId, 'low_level', percentage);
      } else if (percentage > 95) {
        await this.sendTankAlert(tankId, 'overflow_risk', percentage);
      }

      logger.debug('Tank level processed', { tankId, percentage: `${percentage}%` });

    } catch (error) {
      logger.error('Error processing tank level:', error);
    }
  }

  // Process leak detection alerts
  async processLeakDetection(sensorId, data) {
    try {
      const { leakDetected, intensity, location, timestamp } = data;

      await this.storeLeakData({
        sensorId,
        leakDetected,
        intensity,
        location,
        timestamp: new Date(timestamp)
      });

      if (leakDetected) {
        await this.sendLeakAlert(sensorId, intensity, location);
      }

      logger.info('Leak detection processed', { sensorId, leakDetected, intensity });

    } catch (error) {
      logger.error('Error processing leak detection:', error);
    }
  }

  // Validate meter reading data
  validateMeterReading(connection, reading, timestamp) {
    // Check if reading is reasonable
    if (reading < 0 || reading > 999999) {
      return false;
    }

    // Check timestamp (shouldn't be too old or in the future)
    const readingTime = new Date(timestamp);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (readingTime < oneWeekAgo || readingTime > now) {
      return false;
    }

    return true;
  }

  // Assess data reliability based on device conditions
  assessDataReliability(batteryLevel, signalStrength) {
    if (batteryLevel > 70 && signalStrength > 80) {
      return 'high';
    } else if (batteryLevel > 30 && signalStrength > 50) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Send anomaly alert
  async sendAnomalyAlert(connection, meterReading) {
    try {
      const notificationData = {
        recipientId: connection.customerCitizenId,
        type: 'water_consumption_anomaly',
        title: 'Unusual Water Consumption Detected',
        message: `Unusual consumption pattern detected for connection ${connection.connectionNumber}. ${meterReading.anomalyDescription}`,
        priority: 'high',
        metadata: {
          connectionId: connection.id,
          readingId: meterReading.id,
          anomalyType: meterReading.anomalyType
        }
      };

      // Send notification via notification service
      // Implementation would call notification service API

    } catch (error) {
      logger.error('Failed to send anomaly alert:', error);
    }
  }

  // Store various sensor data (these would typically go to a time-series database)
  async storePressureData(data) {
    // Implementation for storing pressure data
    logger.debug('Storing pressure data:', data);
  }

  async storeFlowData(data) {
    // Implementation for storing flow data
    logger.debug('Storing flow data:', data);
  }

  async storePumpData(data) {
    // Implementation for storing pump data
    logger.debug('Storing pump data:', data);
  }

  async storeTankData(data) {
    // Implementation for storing tank data
    logger.debug('Storing tank data:', data);
  }

  async storeLeakData(data) {
    // Implementation for storing leak data
    logger.debug('Storing leak data:', data);
  }

  // Send various alerts
  async sendWaterQualityAlert(qualityRecord) {
    logger.info('Water quality alert:', {
      location: qualityRecord.locationName,
      quality: qualityRecord.overallQuality,
      issues: qualityRecord.issues
    });
  }

  async sendPressureAlert(sensorId, pressure, location) {
    logger.warn('Water pressure alert:', { sensorId, pressure, location });
  }

  async sendPumpAlert(pumpId, data) {
    logger.warn('Pump alert:', { pumpId, data });
  }

  async sendTankAlert(tankId, alertType, percentage) {
    logger.warn('Tank alert:', { tankId, alertType, percentage });
  }

  async sendLeakAlert(sensorId, intensity, location) {
    logger.error('Leak detection alert:', { sensorId, intensity, location });
  }

  // Cleanup old processed readings cache
  cleanupCache() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [key, timestamp] of this.lastProcessedReadings.entries()) {
      if (timestamp < oneHourAgo) {
        this.lastProcessedReadings.delete(key);
      }
    }
  }

  // Graceful shutdown
  async shutdown() {
    if (this.mqttClient) {
      this.mqttClient.end();
      logger.info('MQTT connection closed');
    }
  }
}

module.exports = new IoTService();
