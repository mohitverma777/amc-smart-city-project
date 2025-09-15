const { Pool } = require('pg');
const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.pgPool = null;
    this.mongoConnection = null;
    this.redisClient = null;
  }

  // PostgreSQL connection - FIXED to handle undefined config
  async connectPostgreSQL(config = {}) {
    try {
      this.pgPool = new Pool({
        host: config.host || process.env.POSTGRES_HOST || 'localhost',
        port: config.port || process.env.POSTGRES_PORT || 5432,
        database: config.database || process.env.POSTGRES_DB || 'amc_smart_city',
        user: config.user || process.env.POSTGRES_USER || 'postgres',
        password: config.password || process.env.POSTGRES_PASSWORD,
        max: config.max || 20,
        idleTimeoutMillis: config.idleTimeout || 30000,
        connectionTimeoutMillis: config.connectionTimeout || 5000,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      await this.pgPool.query('SELECT NOW()');
      logger.info('✅ PostgreSQL connected successfully');
      
      return this.pgPool;
    } catch (error) {
      logger.error('❌ PostgreSQL connection failed:', error);
      throw error;
    }
  }

  // MongoDB connection
  async connectMongoDB(connectionString) {
    try {
      const mongoUri = connectionString || process.env.MONGODB_URI || 'mongodb://localhost:27017/amc_smart_city';
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      });

      this.mongoConnection = mongoose.connection;
      
      this.mongoConnection.on('connected', () => {
        logger.info('✅ MongoDB connected successfully');
      });

      this.mongoConnection.on('error', (err) => {
        logger.error('❌ MongoDB connection error:', err);
      });

      this.mongoConnection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB disconnected');
      });

      return this.mongoConnection;
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  // Redis connection - FIXED to handle undefined config
  async connectRedis(config = {}) {
    try {
      this.redisClient = redis.createClient({
        socket: {
          host: config.host || process.env.REDIS_HOST || 'localhost',
          port: config.port || process.env.REDIS_PORT || 6379
        },
        password: config.password || process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });

      this.redisClient.on('connect', () => {
        logger.info('✅ Redis connected successfully');
      });

      this.redisClient.on('error', (err) => {
        logger.error('❌ Redis connection error:', err);
      });

      this.redisClient.on('end', () => {
        logger.warn('⚠️ Redis connection ended');
      });

      await this.redisClient.connect();
      return this.redisClient;
    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  // Health check for all databases
  async healthCheck() {
    const health = {
      postgresql: false,
      mongodb: false,
      redis: false,
      timestamp: new Date().toISOString()
    };

    // Check PostgreSQL
    if (this.pgPool) {
      try {
        await this.pgPool.query('SELECT 1');
        health.postgresql = true;
      } catch (error) {
        logger.error('PostgreSQL health check failed:', error);
      }
    }

    // Check MongoDB
    if (this.mongoConnection && this.mongoConnection.readyState === 1) {
      health.mongodb = true;
    }

    // Check Redis
    if (this.redisClient && this.redisClient.isOpen) {
      try {
        await this.redisClient.ping();
        health.redis = true;
      } catch (error) {
        logger.error('Redis health check failed:', error);
      }
    }

    return health;
  }

  // Graceful shutdown
  async disconnect() {
    try {
      if (this.pgPool) {
        await this.pgPool.end();
        logger.info('PostgreSQL connection closed');
      }

      if (this.mongoConnection) {
        await mongoose.disconnect();
        logger.info('MongoDB connection closed');
      }

      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error during database disconnect:', error);
    }
  }
}

module.exports = new DatabaseManager();
