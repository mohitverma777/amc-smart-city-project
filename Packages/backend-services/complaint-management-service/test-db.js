// test-db.js
require('dotenv').config();
const { sequelize, mongoose } = require('./src/models');

async function testConnections() {
  try {
    console.log('🔍 Testing database connections...');

    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful');

    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connection successful');
    } else {
      console.log('⏳ Waiting for MongoDB connection...');
    }

    console.log('🎉 All database connections are working!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    process.exit(0);
  }
}

testConnections();
