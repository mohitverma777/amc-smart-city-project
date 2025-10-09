const { Sequelize } = require('sequelize');
require('dotenv').config();

// ✅ Use environment variables from .env file
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'amc_smart_city',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'amc_postgres_password',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: (msg) => console.log(`[Sequelize] ${msg}`),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test connection
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ PostgreSQL connection established successfully');
  })
  .catch((err) => {
    console.error('❌ Unable to connect to PostgreSQL database:', err.message);
    console.error('Check your database credentials in .env file');
  });

// Import models
const Payment = require('./Payment')(sequelize);
const Bill = require('./Bill')(sequelize);

// Define associations
Payment.belongsTo(Bill, { foreignKey: 'billId', as: 'bill' });
Bill.hasMany(Payment, { foreignKey: 'billId', as: 'payments' });

module.exports = {
  sequelize,
  Payment,
  Bill,
};
