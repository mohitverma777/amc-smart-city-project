// In packages/backend-services/property-tax-service/src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import shared utilities and middleware
const { authenticate } = require('@amc/shared/middleware/auth');
const errorHandler = require('@amc/shared/middleware/errorHandler');
const logger = require('@amc/shared/utils/logger');
const config = require('@amc/shared/config/environment');

// Import local service modules
const { sequelize } = require('./models');
const propertyRoutes = require('./routes/properties');
const taxRoutes = require('./routes/taxes');

class PropertyTaxServiceApp {
  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
    // Standard security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));
    this.app.use(compression());

    // Request logging
    this.app.use(logger.requestLogger);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Add a simple request ID for tracing
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substring(2, 15);
      res.set('X-Request-ID', req.id);
      next();
    });
  }

  initializeRoutes() {
    // Health check endpoint for the service
    this.app.get('/health', async (req, res) => {
      try {
        await sequelize.authenticate(); // Check database connection
        res.status(200).json({
          status: 'healthy',
          service: 'property-tax-service',
          timestamp: new Date().toISOString(),
          database: 'connected'
        });
      } catch (error) {
        logger.error('Health check failed for Property Tax Service:', error);
        res.status(503).json({
          status: 'unhealthy',
          service: 'property-tax-service',
          error: 'Database connection failed'
        });
      }
    });

    // API routes
    // All routes will be authenticated
    this.app.use('/properties', authenticate, propertyRoutes);
    this.app.use('/taxes', authenticate, taxRoutes);
  }

  initializeErrorHandling() {
    // Handle routes that are not found
    this.app.use(errorHandler.handleUnhandledRoutes);
    
    // Global error handler
    this.app.use(errorHandler.globalErrorHandler);
  }

  async start() {
    try {
      // Connect to the database
      await sequelize.authenticate();
      logger.info('✅ PostgreSQL connected successfully for Property Tax Service.');

      // Sync all defined models to the DB.
      // Use { alter: true } in development if you want to sync schema changes.
      await sequelize.sync(); 
      logger.info('Database models synchronized successfully.');

      const port = process.env.PORT || 3003;
      const host = process.env.HOST || 'localhost';

      this.app.listen(port, host, () => {
        logger.info(`🚀 Property Tax Service running on http://${host}:${port}`);
        logger.info(`📊 Health check available at http://${host}:${port}/health`);
      });

    } catch (error) {
      logger.error('❌ Failed to start Property Tax Service:', error);
      process.exit(1);
    }
  }
}

// Entry point to start the application
if (require.main === module) {
  const serviceApp = new PropertyTaxServiceApp();
  serviceApp.start();
}

module.exports = PropertyTaxServiceApp;
