// Packages/backend-services/grievance-service/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'grievance-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    port: process.env.PORT || 3002,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Service info route
app.get('/info', (req, res) => {
  res.json({
    service: 'AMC Grievance Management Service',
    version: '1.0.0',
    description: 'Handles citizen grievances and complaints',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Mock grievances route for testing
app.get('/grievances', (req, res) => {
  res.json({
    status: 'success',
    message: 'Grievance service is running (mock data)',
    data: {
      grievances: [
        {
          id: '1',
          title: 'Sample Grievance 1',
          description: 'This is a sample grievance for testing',
          status: 'submitted',
          createdAt: new Date().toISOString()
        },
        {
          id: '2', 
          title: 'Sample Grievance 2',
          description: 'Another sample grievance',
          status: 'in_progress',
          createdAt: new Date().toISOString()
        }
      ],
      total: 2,
      note: 'This is mock data - database integration pending'
    }
  });
});

// Create grievance route (mock)
app.post('/grievances', (req, res) => {
  const { title, description, category } = req.body;
  
  // Basic validation
  if (!title || !description) {
    return res.status(400).json({
      status: 'error',
      message: 'Title and description are required',
      code: 'VALIDATION_ERROR'
    });
  }

  // Mock response
  res.status(201).json({
    status: 'success',
    message: 'Grievance created successfully (mock)',
    data: {
      grievance: {
        id: Math.random().toString(36).substring(7),
        title,
        description,
        category: category || 'general',
        status: 'submitted',
        grievanceNumber: `GRV${Date.now()}`,
        createdAt: new Date().toISOString()
      }
    }
  });
});

// Categories route (mock)
app.get('/categories', (req, res) => {
  res.json({
    status: 'success',
    data: {
      categories: [
        { id: '1', name: 'Roads', description: 'Road related issues' },
        { id: '2', name: 'Water', description: 'Water supply issues' },
        { id: '3', name: 'Sanitation', description: 'Cleanliness and waste issues' },
        { id: '4', name: 'Electricity', description: 'Power and lighting issues' },
        { id: '5', name: 'Other', description: 'Other civic issues' }
      ]
    }
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({
    message: 'Grievance service test endpoint working!',
    timestamp: new Date().toISOString(),
    service: 'grievance-service'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

// Start server
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`
🚀 AMC Grievance Service Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: http://${HOST}:${PORT}
📊 Health: http://${HOST}:${PORT}/health
ℹ️  Info:   http://${HOST}:${PORT}/info
🧪 Test:   http://${HOST}:${PORT}/test
🌍 Environment: ${process.env.NODE_ENV || 'development'}
⏰ Started: ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT signal, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
