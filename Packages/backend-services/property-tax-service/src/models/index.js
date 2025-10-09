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
const Property = require('./Property')(sequelize, DataTypes);
const PropertyOwner = require('./PropertyOwner')(sequelize, DataTypes);
const TaxAssessment = require('./TaxAssessment')(sequelize, DataTypes);
const TaxPayment = require('./TaxPayment')(sequelize, DataTypes);
const TaxRate = require('./TaxRate')(sequelize, DataTypes);
const PropertyDocument = require('./PropertyDocument')(sequelize, DataTypes);
const TaxBill = require('./TaxBill')(sequelize, DataTypes);

// Define associations
Property.hasMany(PropertyOwner, { foreignKey: 'propertyId', as: 'owners' });
PropertyOwner.belongsTo(Property, { foreignKey: 'propertyId' });

Property.hasMany(TaxAssessment, { foreignKey: 'propertyId', as: 'assessments' });
TaxAssessment.belongsTo(Property, { foreignKey: 'propertyId' });

Property.hasMany(PropertyDocument, { foreignKey: 'propertyId', as: 'documents' });
PropertyDocument.belongsTo(Property, { foreignKey: 'propertyId' });

TaxAssessment.hasMany(TaxBill, { foreignKey: 'assessmentId', as: 'bills' });
TaxBill.belongsTo(TaxAssessment, { foreignKey: 'assessmentId' });

TaxBill.hasMany(TaxPayment, { foreignKey: 'billId', as: 'payments' });
TaxPayment.belongsTo(TaxBill, { foreignKey: 'billId' });

TaxAssessment.belongsTo(TaxRate, { foreignKey: 'taxRateId', as: 'taxRate' });
TaxRate.hasMany(TaxAssessment, { foreignKey: 'taxRateId' });

module.exports = {
  sequelize,
  Property,
  PropertyOwner,
  TaxAssessment,
  TaxPayment,
  TaxRate,
  PropertyDocument,
  TaxBill
};
