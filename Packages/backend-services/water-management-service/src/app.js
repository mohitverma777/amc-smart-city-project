const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Trust proxy for correct IP handling
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-production-domain.com'];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'), false);
      }
    } else {
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
      if (localhostRegex.test(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'), false);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'Platform', 'User-Agent', 'Accept', 'Origin']
}));

// Compression
app.use(compression());

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID for tracing
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(2, 15);
  res.set('X-Request-ID', req.id);
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`🌊 ${req.method} ${req.url}`);

  res.on('finish', () => {
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
    console.log(`${statusColor} ${req.method} ${req.url} - ${res.statusCode}`);
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'water-management-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Version endpoint
app.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'AMC Smart City Water Management Service',
    timestamp: new Date().toISOString()
  });
});

// Basic routes for testing
app.get('/', (req, res) => {
  res.json({
    service: 'AMC Water Management Service',
    version: '1.0.0',
    status: 'running',
    message: 'Water Management Service is operational',
    endpoints: [
      'GET /health - Health check',
      'GET /version - Service version',
      'GET /connections - Water connections (coming soon)',
      'GET /bills - Water bills (coming soon)',
      'GET /quality - Water quality data (coming soon)'
    ]
  });
});

// Basic connection routes (placeholder)
app.get('/connections', (req, res) => {
  res.json({
    message: 'Water connections endpoint - under development',
    status: 'coming_soon'
  });
});

app.get('/bills', (req, res) => {
  res.json({
    message: 'Water bills endpoint - under development',
    status: 'coming_soon'
  });
});

app.get('/quality', (req, res) => {
  res.json({
    message: 'Water quality endpoint - under development',
    status: 'coming_soon'
  });
});

// Catch-all for unhandled routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    service: 'water-management-service'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

const PORT = process.env.PORT || 3004;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`🌊 Water Management Service running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔍 API Info: http://${HOST}:${PORT}/`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('\n🚰 Ready to serve water management requests!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Water Management Service shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Water Management Service shut down complete');
    process.exit(0);
  });
});

module.exports = app;
