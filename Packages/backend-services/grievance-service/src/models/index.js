// Packages/backend-services/grievance-service/src/models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

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

// Import models
const Grievance = require('./Grievance')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const StatusHistory = require('./StatusHistory')(sequelize, DataTypes);
const Assignment = require('./Assignment')(sequelize, DataTypes);
const Attachment = require('./Attachment')(sequelize, DataTypes);

// Define associations
Grievance.hasMany(StatusHistory, { foreignKey: 'grievanceId', as: 'statusHistory' });
StatusHistory.belongsTo(Grievance, { foreignKey: 'grievanceId' });

Grievance.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Grievance, { foreignKey: 'categoryId' });

Grievance.hasMany(Assignment, { foreignKey: 'grievanceId', as: 'assignments' });
Assignment.belongsTo(Grievance, { foreignKey: 'grievanceId' });

Grievance.hasMany(Attachment, { foreignKey: 'grievanceId', as: 'attachments' });
Attachment.belongsTo(Grievance, { foreignKey: 'grievanceId' });

module.exports = {
  sequelize,
  Grievance,
  Category,
  StatusHistory,
  Assignment,
  Attachment
};
