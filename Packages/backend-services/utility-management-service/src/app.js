require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const db = require('./models');
const utilityService = require('./services/utilityService');

const app = express();
const PORT = process.env.PORT || 3005;
const HOST = process.env.HOST || 'localhost';
const SERVICE_NAME = process.env.SERVICE_NAME || 'utility-management-service';

// Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Allow all origins in development
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Morgan logging configuration
const morganFormat = process.env.LOG_LEVEL === 'debug' ? 'dev' : 'combined';
app.use(morgan(morganFormat));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔵 ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const dbStatus = db.sequelize.connectionManager.pool ? 'connected' : 'disconnected';
  
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: {
      status: dbStatus,
      type: 'PostgreSQL',
      name: process.env.POSTGRES_DB
    },
    port: PORT,
    version: '1.0.0'
  });
});

// API routes
const utilityRoutes = require('./routes/utilityRoutes');
app.use('/api/utility-management', utilityRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AMC Smart City - Utility Management Service',
    service: SERVICE_NAME,
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    endpoints: {
      health: '/health',
      api: '/api/utility-management',
      utilities: '/api/utility-management/utilities/overview',
      water: '/api/utility-management/utilities/water',
      waste: '/api/utility-management/utilities/waste',
      streetlights: '/api/utility-management/utilities/streetlights',
      statistics: '/api/utility-management/utilities/statistics'
    },
    documentation: '/api/utility-management/docs'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`⚠️ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    service: SERVICE_NAME,
    availableRoutes: [
      'GET /health',
      'GET /api/utility-management/utilities/overview',
      'GET /api/utility-management/utilities/water',
      'GET /api/utility-management/utilities/waste',
      'GET /api/utility-management/utilities/streetlights',
      'GET /api/utility-management/utilities/statistics'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Internal server error',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = err.message;
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  await gracefulShutdown();
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  await gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    console.log('📊 Closing database connections...');
    await db.sequelize.close();
    console.log('✅ Database connections closed');
    
    console.log('👋 Service shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    console.log('========================================');
    console.log(`🚀 Starting ${SERVICE_NAME}...`);
    console.log('========================================');
    console.log(`📦 Service: ${SERVICE_NAME}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Database: ${process.env.POSTGRES_DB}`);
    console.log(`🔌 Host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`);
    console.log('========================================\n');
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    const isConnected = await db.testConnection();
    
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Sync models (in development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Synchronizing database models...');
      await db.sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized\n');
    }

    // Start listening
    const server = app.listen(PORT, HOST, () => {
      console.log('========================================');
      console.log('🎉 Server started successfully!');
      console.log('========================================');
      console.log(`🌐 Service: http://${HOST}:${PORT}`);
      console.log(`📊 Health: http://${HOST}:${PORT}/health`);
      console.log(`🔧 API Base: http://${HOST}:${PORT}/api/utility-management`);
      console.log('========================================\n');
      
      console.log('📋 Available Endpoints:');
      console.log(`  ✓ GET  /api/utility-management/utilities/overview`);
      console.log(`  ✓ GET  /api/utility-management/utilities/water`);
      console.log(`  ✓ GET  /api/utility-management/utilities/waste`);
      console.log(`  ✓ GET  /api/utility-management/utilities/streetlights`);
      console.log(`  ✓ GET  /api/utility-management/utilities/statistics`);
      console.log('\n========================================');
      console.log('✅ Service is ready to handle requests');
      console.log('========================================\n');
    });

    // Simulate data updates (if enabled)
    if (process.env.ENABLE_SIMULATION === 'true') {
      const updateInterval = parseInt(process.env.UPDATE_INTERVAL || '30000');
      console.log(`🔄 Data simulation enabled (interval: ${updateInterval}ms)\n`);
      
      setInterval(async () => {
        try {
          await utilityService.updateUtilityData();
          console.log(`[${new Date().toISOString()}] 🔄 Utility data updated (simulation)`);
        } catch (error) {
          console.error('❌ Error updating utility data:', error.message);
        }
      }, updateInterval);
    }

    return server;
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Failed to start server');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================\n');
    
    // Close database connection if open
    try {
      await db.sequelize.close();
    } catch (closeError) {
      console.error('Error closing database:', closeError.message);
    }
    
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
