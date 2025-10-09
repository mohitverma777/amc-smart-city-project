const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('cron');
require('dotenv').config();

// Import models and services
const { sequelize } = require('./models');
const wasteCollectionRoutes = require('./routes/wasteCollections');
const wasteBinRoutes = require('./routes/wasteBins');
const wasteVehicleRoutes = require('./routes/wasteVehicles');
const wasteAnalyticsRoutes = require('./routes/wasteAnalytics');
const vehicleTrackingService = require('./services/vehicleTrackingService');
const wasteCollectionService = require('./services/wasteCollectionService');

class WasteManagementApp {
  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.setupCronJobs();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: {
        status: 'error',
        message: 'Too many requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request ID
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substring(2, 15);
      res.set('X-Request-ID', req.id);
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`Ì∑ëÔ∏è [${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      const healthStatus = {
        status: 'healthy',
        service: 'waste-management-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        databases: {},
        tracking: {
          activeVehicles: vehicleTrackingService.activeTracking.size
        }
      };

      try {
        // Check PostgreSQL connection
        await sequelize.authenticate();
        healthStatus.databases.postgresql = 'connected';
      } catch (error) {
        healthStatus.databases.postgresql = 'disconnected';
        healthStatus.status = 'degraded';
      }

      try {
        // Check MongoDB connection
        if (mongoose.connection.readyState === 1) {
          healthStatus.databases.mongodb = 'connected';
        } else {
          healthStatus.databases.mongodb = 'disconnected';
          healthStatus.status = 'degraded';
        }
      } catch (error) {
        healthStatus.databases.mongodb = 'error';
        healthStatus.status = 'degraded';
      }

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    });

    // API routes
    this.app.use('/schedules', wasteCollectionRoutes);
    this.app.use('/bins', wasteBinRoutes);
    this.app.use('/vehicles', wasteVehicleRoutes);
    this.app.use('/analytics', wasteAnalyticsRoutes);
    
    // Service info
    this.app.get('/info', (req, res) => {
      res.json({
        service: 'AMC Waste Management Service',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 3009,
        features: [
          'collection_scheduling',
          'vehicle_tracking',
          'smart_bin_monitoring', 
          'route_optimization',
          'waste_analytics',
          'recycling_programs'
        ],
        endpoints: [
          '/health - Health check',
          '/info - Service information',
          '/schedules - Collection schedules',
          '/bins - Waste bin management',
          '/vehicles - Vehicle tracking',
          '/analytics - Waste analytics'
        ]
      });
    });
  }

  initializeErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        path: req.path,
        availableEndpoints: [
          '/health',
          '/info', 
          '/schedules',
          '/bins',
          '/vehicles',
          '/analytics'
        ]
      });
    });
    
    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error(`‚ùå Error in ${req.method} ${req.path}:`, err);
      
      res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_SERVER_ERROR',
        requestId: req.id,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }

  setupCronJobs() {
    console.log('‚è∞ Setting up cron jobs for Waste Management...');
    
    // Note: Cron jobs will be enabled once the services are fully implemented
    // For now, just log that they're set up
    console.log('‚úÖ Cron jobs configured (will be activated when services are implemented)');
  }

  async start() {
    try {
      console.log('Ì∫Ä Starting Waste Management Service...');

      // Try to connect to databases (non-blocking)
      await this.connectDatabases();

      // Initialize services
      await vehicleTrackingService.initialize();

      // Start server
      const port = process.env.PORT || 3009;
      const host = process.env.HOST || 'localhost';
      
      this.app.listen(port, host, () => {
        console.log('');
        console.log('Ì∑ëÔ∏è ========================================');
        console.log('Ì∑ëÔ∏è  AMC Waste Management Service Started');
        console.log('Ì∑ëÔ∏è ========================================');
        console.log(`Ìºê Server: http://${host}:${port}`);
        console.log(`Ì≥ä Health: http://${host}:${port}/health`);
        console.log(`‚ÑπÔ∏è  Info:   http://${host}:${port}/info`);
        console.log('Ì∑ëÔ∏è ========================================');
        console.log('');
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('‚ùå Failed to start Waste Management Service:', error);
      process.exit(1);
    }
  }

  async connectDatabases() {
    // PostgreSQL connection (non-blocking)
    try {
      await sequelize.authenticate();
      console.log('‚úÖ PostgreSQL connected successfully');
      
      // Sync models (create tables if they don't exist)
      await sequelize.sync({ alter: false });
      console.log('Ì≥ä Database models synchronized');
      
    } catch (error) {
      console.warn('‚ö†Ô∏è PostgreSQL connection failed:', error.message);
      console.warn('   Service will start without PostgreSQL functionality');
    }

    // MongoDB connection (non-blocking)
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/amc_smart_city';
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000 // 5 second timeout
      });
      console.log('‚úÖ MongoDB connected successfully');
      
    } catch (error) {
      console.warn('‚ö†Ô∏è MongoDB connection failed:', error.message);
      console.warn('   Service will start without MongoDB functionality');
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\nÌ≥® Received ${signal}, starting graceful shutdown...`);
      
      try {
        if (sequelize) {
          await sequelize.close();
          console.log('‚úÖ PostgreSQL connection closed');
        }
        
        if (mongoose.connection) {
          await mongoose.connection.close();
          console.log('‚úÖ MongoDB connection closed');
        }
        
        await vehicleTrackingService.shutdown();
        
        console.log('‚úÖ Waste Management Service shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('‚ùå Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}

// Start the service
if (require.main === module) {
  const app = new WasteManagementApp();
  app.start().catch(error => {
    console.error('‚ùå Failed to start Waste Management Service:', error);
    process.exit(1);
  });
}

module.exports = WasteManagementApp;
