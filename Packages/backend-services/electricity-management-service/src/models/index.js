const { Sequelize, DataTypes } = require('sequelize');
const mongoose = require('mongoose');
const config = require('../config/database');

// PostgreSQL Connection
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import PostgreSQL Models
const ElectricityConnection = require('./ElectricityConnection')(sequelize, DataTypes);
const ElectricityMeter = require('./ElectricityMeter')(sequelize, DataTypes);
const ElectricityBill = require('./ElectricityBill')(sequelize, DataTypes);
const MeterReading = require('./MeterReading')(sequelize, DataTypes);
const LoadManagement = require('./LoadManagement')(sequelize, DataTypes);
const TariffRate = require('./TariffRate')(sequelize, DataTypes);
const PowerOutage = require('./PowerOutage')(sequelize, DataTypes);

// Import MongoDB Models
const EnergyConsumption = require('./EnergyConsumption');
const GridAnalytics = require('./GridAnalytics');
const SmartMeterData = require('./SmartMeterData');

// Define PostgreSQL Associations
ElectricityConnection.hasOne(ElectricityMeter, {
  foreignKey: 'connectionId',
  as: 'meter'
});

ElectricityMeter.belongsTo(ElectricityConnection, {
  foreignKey: 'connectionId',
  as: 'connection'
});

ElectricityConnection.hasMany(ElectricityBill, {
  foreignKey: 'connectionId',
  as: 'bills'
});

ElectricityBill.belongsTo(ElectricityConnection, {
  foreignKey: 'connectionId',
  as: 'connection'
});

ElectricityMeter.hasMany(MeterReading, {
  foreignKey: 'meterId',
  as: 'readings'
});

MeterReading.belongsTo(ElectricityMeter, {
  foreignKey: 'meterId',
  as: 'meter'
});

ElectricityConnection.hasMany(LoadManagement, {
  foreignKey: 'connectionId',
  as: 'loadManagement'
});

LoadManagement.belongsTo(ElectricityConnection, {
  foreignKey: 'connectionId',
  as: 'connection'
});

module.exports = {
  sequelize,
  mongoose,
  // PostgreSQL Models
  ElectricityConnection,
  ElectricityMeter,
  ElectricityBill,
  MeterReading,
  LoadManagement,
  TariffRate,
  PowerOutage,
  // MongoDB Models
  EnergyConsumption,
  GridAnalytics,
  SmartMeterData
};
