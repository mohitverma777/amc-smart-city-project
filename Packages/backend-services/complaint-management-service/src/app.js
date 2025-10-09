require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { sequelize, mongoose } = require('./models');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();
const PORT = process.env.PORT || 3008;
const HOST = process.env.HOST || '0.0.0.0'; // ✅ Use 0.0.0.0 for network access

console.log('🚀 Starting AMC Smart City - Complaint Management Service...');

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS: allow any origin (for dev/test)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms - ${req.ip}`);
  });
  next();
});

// Create upload/log directories if missing
const uploadDir = process.env.UPLOAD_PATH || './uploads/complaints';
if (!fs.existsSync(uploadDir)) { 
  fs.mkdirSync(uploadDir, { recursive: true }); 
}
const logsDir = './logs';
if (!fs.existsSync(logsDir)) { 
  fs.mkdirSync(logsDir, { recursive: true }); 
}

// ================================
// ✅ ROUTES (Specific before Generic)
// ================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'complaint-management-service',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      postgres: sequelize.connectionManager.pool ? 'connected' : 'disconnected',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AMC Smart City - Complaint Management Service',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      complaints: '/api/complaint-management/complaints',
      categories: '/api/complaint-management/complaints/categories',
      fileComplaint: 'POST /api/complaint-management/complaints/',
      myComplaints: 'GET /api/complaint-management/complaints/my',
      allComplaints: 'GET /api/complaint-management/complaints/ (admin)',
    }
  });
});

// Static files
app.use('/uploads', express.static(uploadDir));

// ✅ Mount complaint routes at BOTH paths (for backward compatibility)
// This makes it work for BOTH React admin AND Flutter app
app.use('/api/complaint-management/complaints', complaintRoutes);
app.use('/complaints', complaintRoutes); // ✅ Also mount at /complaints for Flutter

// ================================
// ✅ ERROR HANDLERS (MUST BE LAST!)
// ================================

// 404 handler (AFTER all routes)
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl} not found`);
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    timestamp: new Date().toISOString(),
    hint: 'Available: /health, /api/complaint-management/complaints, /complaints'
  });
});

// Error handling middleware (MUST BE LAST)
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File size too large. Maximum size is 10MB.',
        code: 'FILE_SIZE_LIMIT'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files. Maximum is 5 files.',
        code: 'FILE_COUNT_LIMIT'
      });
    }
  }
  
  if (err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ================================
// ✅ SERVER STARTUP
// ================================

const startServer = async () => {
  try {
    console.log('🔍 Testing database connections...');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Synchronizing database models...');
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized');
    }
    
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connection established successfully');
    } else {
      console.log('⏳ Waiting for MongoDB connection...');
      await mongoose.connection.asPromise();
      console.log('✅ MongoDB connection established successfully');
    }
    
    const server = app.listen(PORT, HOST, () => {
      console.log('🎉 Server started successfully!');
      console.log(`🌐 Complaint Management Service running on http://localhost:${PORT}`);
      console.log(`📱 Network access available at http://${HOST}:${PORT}`);
      console.log(`\n✅ Available Endpoints:`);
      console.log(`   GET  /health`);
      console.log(`   GET  /`);
      console.log(`   POST /api/complaint-management/complaints/`);
      console.log(`   POST /complaints/ (Flutter)`);
      console.log(`   GET  /api/complaint-management/complaints/ (React Admin)`);
      console.log(`   GET  /complaints/my (Flutter)`);
      console.log(`   GET  /api/complaint-management/complaints/my (React Admin)\n`);
    });
    
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received, starting graceful shutdown...`);
      server.close(async () => {
        console.log('📴 HTTP server closed');
        try {
          await sequelize.close();
          await mongoose.connection.close();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) { 
  startServer(); 
}

module.exports = { app, startServer };
