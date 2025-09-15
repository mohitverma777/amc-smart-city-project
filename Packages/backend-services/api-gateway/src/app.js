const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const axios = require('axios'); // Import axios for health checks

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import shared utilities
const { authenticate, optionalAuth } = require('../../shared/middleware/auth');
const errorHandler = require('../../shared/middleware/errorHandler');
const logger = require('../../shared/utils/logger');

class APIGateway {
  constructor() {
    this.app = express();
    this.server = null;
    this.wss = null;
    this.services = new Map();
    
    this.initializeMiddleware();
    this.registerServices();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health' || req.path === '/metrics',
    });
    this.app.use(limiter);

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
        logger.info(`${statusColor} ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, {
          service: 'api-gateway',
          ip: req.ip,
          userId: req.user?.id
        });
      });
      next();
    });

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID for tracing
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substring(2, 15);
      res.set('X-Request-ID', req.id);
      next();
    });
  }

  registerServices() {
    this.services.set('user-management', {
      name: 'User Management',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3001',
      healthPath: '/health',
      routes: ['/auth', '/users', '/profile']
    });

    this.services.set('grievance', {
      name: 'Grievance Service',
      url: process.env.GRIEVANCE_SERVICE_URL || 'http://localhost:3002',
      healthPath: '/health',
      routes: ['/grievances', '/categories', '/status']
    });
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {}
      };

      // Asynchronously check the health of each registered microservice
      const healthChecks = Array.from(this.services.entries()).map(async ([key, service]) => {
        try {
          const response = await axios.get(`${service.url}${service.healthPath}`, { timeout: 2000 });
          if (response.status === 200) {
            health.services[key] = { name: service.name, status: 'healthy', url: service.url };
          } else {
            health.services[key] = { name: service.name, status: 'unhealthy', url: service.url, error: `Status ${response.status}` };
          }
        } catch (error) {
          health.services[key] = { name: service.name, status: 'unhealthy', url: service.url, error: error.message };
        }
      });

      await Promise.all(healthChecks);

      const allServicesHealthy = Object.values(health.services).every(s => s.status === 'healthy');
      if (!allServicesHealthy) {
        health.status = 'degraded';
      }

      res.status(allServicesHealthy ? 200 : 503).json(health);
    });

    // Metrics and Version endpoints remain the same
    this.app.get('/metrics', (req, res) => res.json({ uptime: process.uptime(), memory: process.memoryUsage() }));
    this.app.get('/version', (req, res) => res.json({ version: '1.0.0' }));
    
    this.setupServiceProxies();
  }

  setupServiceProxies() {
    for (const [serviceKey, service] of this.services) {
      const proxyMiddleware = createProxyMiddleware({
        target: service.url,
        changeOrigin: true,
        pathRewrite: { [`^/api/${serviceKey}`]: '' },
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req, res) => {
          if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
          }
          proxyReq.setHeader('x-request-id', req.id);
          if (req.user) {
            proxyReq.setHeader('x-user-id', req.user.id);
            proxyReq.setHeader('x-user-role', req.user.role);
          }
        },
        onError: (err, req, res) => {
          logger.error(`Proxy error for ${service.name}:`, { error: err.message });
          if (!res.headersSent) {
            res.status(503).json({ status: 'error', message: `Service temporarily unavailable: ${service.name}` });
          }
        }
      });
      
      const publicRoutes = ['/auth/login', '/auth/register', '/auth/refresh-token', '/health'];
      service.routes.forEach(route => {
        const fullRoute = `/api/${serviceKey}${route}*`;
        const isPublic = publicRoutes.some(publicRoute => fullRoute.includes(`/api/${serviceKey}${publicRoute}`));
        
        if (isPublic) {
          this.app.use(fullRoute, optionalAuth, proxyMiddleware);
        } else {
          this.app.use(fullRoute, authenticate, proxyMiddleware);
        }
      });
    }

    this.app.all('/api/*', (req, res) => {
        res.status(404).json({ status: 'error', message: 'API endpoint not found' });
    });
  }

  initializeErrorHandling() {
    // Handle 404 for non-API routes
    this.app.use('*', (req, res) => {
      res.status(404).json({ status: 'error', message: `Route not found: ${req.originalUrl}` });
    });
    // Global error handler
    this.app.use(errorHandler.globalErrorHandler);
  }

  initializeWebSocket() {
    this.wss = new WebSocket.Server({ server: this.server, path: '/ws' });
    this.wss.on('connection', (ws, req) => {
      logger.info('WebSocket client connected');
      ws.on('message', (message) => this.handleWebSocketMessage(ws, message));
      ws.on('close', () => logger.info('WebSocket client disconnected'));
      ws.on('error', (error) => logger.error('WebSocket error:', error));
    });
    logger.info('WebSocket server initialized on /ws');
  }

  handleWebSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      logger.debug('WebSocket message received:', data);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (error) {
      logger.error('Invalid WebSocket message format:', error);
    }
  }

  async start() {
    try {
      // THE FIX: REMOVED ALL databaseManager.connect...() CALLS
      this.server = http.createServer(this.app);
      this.initializeWebSocket();

      const port = process.env.PORT || 3000;
      const host = process.env.HOST || 'localhost';
      
      this.server.listen(port, host, () => {
        logger.info(`🚀 AMC API Gateway running on http://${host}:${port}`);
        logger.info('📋 Registered Services:');
        for (const [key, service] of this.services) {
          logger.info(`   • ${service.name}: /api/${key}/* -> ${service.url}`);
        }
      });

      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start API Gateway:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      this.server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

if (require.main === module) {
  const gateway = new APIGateway();
  gateway.start();
}

module.exports = APIGateway;
