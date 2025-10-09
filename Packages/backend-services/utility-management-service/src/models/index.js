const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

console.log(`🔧 Initializing database connection for ${env} environment...`);

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions
  }
);

const db = {};

// Import models
db.WaterTank = require('./WaterTank')(sequelize, Sequelize.DataTypes);
db.WasteBin = require('./WasteBin')(sequelize, Sequelize.DataTypes);
db.StreetLight = require('./StreetLight')(sequelize, Sequelize.DataTypes);

// Add sequelize instances to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test connection function
db.testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    console.log(`📊 Connected to: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

module.exports = db;
