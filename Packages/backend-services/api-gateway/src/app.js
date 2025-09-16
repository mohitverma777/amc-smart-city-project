const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID for tracing
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(2, 15);
  res.set('X-Request-ID', req.id);
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`🔵 ${req.method} ${req.url}`);
  
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
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Version endpoint
app.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'AMC Smart City API Gateway',
    timestamp: new Date().toISOString()
  });
});

// Service proxy configurations
const services = {
  'user-management': {
    name: 'User Management',
    url: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    routes: ['/auth', '/users', '/profile']
  },
  'grievance': {
    name: 'Grievance Service',
    url: process.env.GRIEVANCE_SERVICE_URL || 'http://localhost:3002',
    routes: ['/grievances', '/categories', '/status']
  }
};

// Setup service proxies
Object.keys(services).forEach(serviceKey => {
  const service = services[serviceKey];
  
  // Create proxy middleware
  const proxyMiddleware = createProxyMiddleware({
    target: service.url,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${serviceKey}`]: '' // This is the key fix!
    },
    timeout: 30000,
    proxyTimeout: 30000,
    
    onProxyReq: (proxyReq, req, res) => {
      // Forward original headers
      if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
      }
      
      // Add request ID for tracing
      proxyReq.setHeader('x-request-id', req.id);
      proxyReq.setHeader('x-forwarded-by', 'amc-api-gateway');
      
      console.log(`📡 Proxying to ${service.name}: ${req.method} ${req.url} -> ${service.url}${proxyReq.path}`);
    },

    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['x-powered-by'] = 'AMC Smart City API Gateway';
      console.log(`📨 Response from ${service.name}: ${proxyRes.statusCode}`);
    },

    onError: (err, req, res) => {
      console.error(`❌ Proxy error for ${service.name}:`, err.message);

      if (!res.headersSent) {
        res.status(503).json({
          status: 'error',
          message: `Service temporarily unavailable: ${service.name}`,
          code: 'SERVICE_UNAVAILABLE',
          service: serviceKey
        });
      }
    }
  });

  // Register the proxy route
  app.use(`/api/${serviceKey}`, proxyMiddleware);
  console.log(`✅ Registered proxy route: /api/${serviceKey}/* -> ${service.url}`);
});

// Catch-all for unregistered API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.path
  });
});

// Handle 404 for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const server = http.createServer(app);

// WebSocket setup
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');
  
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'connected',
    message: 'Connected to AMC Smart City real-time service',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 AMC API Gateway running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);
  console.log(`🔌 WebSocket available at ws://${HOST}:${PORT}/ws`);
  
  console.log('📋 Registered Services:');
  Object.keys(services).forEach(key => {
    console.log(`   • ${services[key].name}: /api/${key}/* -> ${services[key].url}`);
  });
});

module.exports = app;