const { Sequelize, DataTypes } = require('sequelize');
const mongoose = require('mongoose');

// PostgreSQL Connection
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'amc_smart_city',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'password',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// MongoDB Connection (will be handled in app.js)
// No need to connect here, just export mongoose for use in models

// Import PostgreSQL Models (commented out for now - will be implemented later)
// const WasteCollectionSchedule = require('./WasteCollectionSchedule')(sequelize, DataTypes);
// const WasteVehicle = require('./WasteVehicle')(sequelize, DataTypes);
// const WasteBin = require('./WasteBin')(sequelize, DataTypes);

// Import MongoDB Models (commented out for now - will be implemented later)
// const VehicleTracking = require('./VehicleTracking');
// const WasteAnalytics = require('./WasteAnalytics');

// Test models for now
const TestModel = sequelize.define('TestModel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'test_models',
  timestamps: true
});

module.exports = {
  sequelize,
  mongoose,
  // PostgreSQL Models
  TestModel,
  // Add other models here as they are implemented
  
  // MongoDB Models will be imported separately
};
