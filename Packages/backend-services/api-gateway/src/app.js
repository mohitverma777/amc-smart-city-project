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
console.log("Loaded ENV:", process.env.HOST, process.env.PORT);

// Trust first proxy (important for obtaining correct IP in headers)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
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
        // Allow any localhost port in development
        const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
        if (localhostRegex.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'Platform',
      'User-Agent',
      'Accept',
      'Origin',
    ],
  })
);

// Compression middleware
app.use(compression());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // max requests per window per IP
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip;
  },
});
app.use(limiter);

// Unique request ID for traceability
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(2, 15);
  res.set('X-Request-ID', req.id);
  next();
});

// Logging incoming requests and response status
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
    memory: process.memoryUsage(),
  });
});

// Version endpoint
app.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'AMC Smart City API Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Service proxies configuration
const services = {
  'user-management': {
    name: 'User Management',
    url: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    routes: ['/auth', '/users', '/profile'],
    stripPrefix: true, // Remove /api/user-management prefix
  },
  'grievance': {
    name: 'Grievance Service',
    url: process.env.GRIEVANCE_SERVICE_URL || 'http://localhost:3002',
    routes: ['/grievances', '/categories', '/status'],
    stripPrefix: true,
  },
  'property-tax': {
    name: 'Property Tax Service',
    url: process.env.PROPERTY_TAX_SERVICE_URL || 'http://localhost:3003',
    routes: ['/properties', '/assessments', '/bills'],
    stripPrefix: true,
  },
  'water-management': {
    name: 'Water Management',
    url: process.env.WATER_SERVICE_URL || 'http://localhost:3004',
    routes: ['/connections', '/readings', '/bills', '/quality', '/leaks', '/pressure', '/analytics'],
    stripPrefix: true,
  },
  // ✅ CHANGED: Port 3005 is now Utility Management Service (water tanks, waste bins, street lights)
  'utility-management': {
    name: 'Utility Management Service',
    url: process.env.UTILITY_MANAGEMENT_SERVICE_URL || 'http://localhost:3005',
    routes: [
      '/utilities',
      '/utilities/overview',
      '/utilities/water',
      '/utilities/waste',
      '/utilities/streetlights',
      '/utilities/statistics',
      '/health'
    ],
    stripPrefix: false, // ✅ Keep the /api/utility-management prefix
  },
  'payment-management': {
    name: 'Payment Management',
    url: process.env.PAYMENT_MANAGEMENT_SERVICE_URL || 'http://localhost:3006',
    routes: ['/payments', '/bills', '/transactions', '/history'],
    stripPrefix: false, // ✅ Keep the /api/payment-management prefix
  },
  'notification': {
    name: 'Notification Service',
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
    routes: ['/notifications', '/templates', '/subscriptions'],
    stripPrefix: true,
  },
  'complaint-management': {
    name: 'Complaint Management',
    url: process.env.COMPLAINT_MANAGEMENT_SERVICE_URL || 'http://localhost:3008',
    routes: ['/complaints', '/categories', '/comments', '/statistics', '/analytics', '/export', '/attachments'],
    stripPrefix: false, // ✅ Keep the /api/complaint-management prefix
  },
  'analytics': {
    name: 'Analytics Service',
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
    routes: ['/analytics', '/reports', '/dashboard', '/metrics'],
    stripPrefix: true,
  },
  'electricity': {
    name: 'Electricity Service',
    url: process.env.ELECTRICITY_SERVICE_URL || 'http://localhost:3010',
    routes: ['/connections', '/bills', '/readings', '/outages'],
    stripPrefix: true,
  },
};

// Register proxies for each service
Object.keys(services).forEach((key) => {
  const service = services[key];
  
  // Configure pathRewrite based on stripPrefix flag
  const pathRewriteConfig = service.stripPrefix 
    ? { [`^/api/${key}`]: '' }  // Strip prefix for services that don't need it
    : { [`^/api/${key}`]: `/api/${key}` }; // Keep prefix for services that need it
  
  const proxyMiddleware = createProxyMiddleware({
    target: service.url,
    changeOrigin: true,
    pathRewrite: pathRewriteConfig,
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req) => {
      if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
      }
      proxyReq.setHeader('x-request-id', req.id);
      proxyReq.setHeader('x-forwarded-for', req.ip);
      proxyReq.setHeader('x-forwarded-proto', req.protocol);
      proxyReq.setHeader('x-forwarded-by', 'amc-api-gateway');

      // Log with actual target path
      const targetPath = req.url.replace(new RegExp(`^/api/${key}`), pathRewriteConfig[`^/api/${key}`]);
      console.log(`📡 Proxying ${req.method} ${req.url} → ${service.url}${targetPath}`);
    },
    onProxyRes: (proxyRes, req) => {
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
          service: key,
          hint: `Check if ${service.name} is running on ${service.url}`,
        });
      }
    },
  });
  
  app.use(`/api/${key}`, proxyMiddleware);
  console.log(`✅ Registered proxy route /api/${key} → ${service.url} (stripPrefix: ${service.stripPrefix})`);
});

// Catch all for unregistered API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.path,
    availableServices: Object.keys(services).map(key => `/api/${key}`),
  });
});

// Catch all for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Gateway Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack }),
  });
});

// Create HTTP server and attach Express app
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const server = http.createServer(app);

// WebSocket setup for real-time connections
const wss = new WebSocket.Server({
  server,
  path: '/ws',
});

wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket client connected');
  ws.send(
    JSON.stringify({
      type: 'connection',
      status: 'connected',
      message: 'Connected to AMC real-time service',
      timestamp: new Date().toISOString(),
    })
  );

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
  });
});

// Start HTTP server
server.listen(PORT, HOST, () => {
  console.log('🚀 AMC API Gateway started successfully!');
  console.log(`🌐 Gateway running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🚪 WebSocket listening on ws://${HOST}:${PORT}/ws`);
  console.log('\n📋 Registered microservices:');
  Object.keys(services).forEach((key) => {
    const prefixInfo = services[key].stripPrefix ? '(strips prefix)' : '(keeps prefix)';
    console.log(`  - /api/${key} → ${services[key].url} ${prefixInfo}`);
  });
  console.log('\n✅ Gateway is ready to proxy requests\n');
});

module.exports = app;
