const { Sequelize, DataTypes } = require('sequelize');
const mongoose = require('mongoose');
const config = require('../config/database');

console.log('í³Š Initializing databases...');

// PostgreSQL Connection
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: config.logging,
    pool: config.pool,
    define: config.define
  }
);

// MongoDB Connection
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => console.log('âœ… MongoDB connected successfully'))
  .catch(err => console.error('âŒ MongoDB connection error:', err));

// Import PostgreSQL Models
console.log('í³‹ Loading PostgreSQL models...');
const Complaint = require('./Complaint')(sequelize, DataTypes);
const ComplaintComment = require('./ComplaintComment')(sequelize, DataTypes);
const ComplaintAttachment = require('./ComplaintAttachment')(sequelize, DataTypes);
const ComplaintAssignment = require('./ComplaintAssignment')(sequelize, DataTypes);

// Import MongoDB Models
console.log('í³Š Loading MongoDB models...');
const ComplaintAnalytics = require('./ComplaintAnalytics');

// Define PostgreSQL Model Associations
console.log('í´— Setting up model associations...');

// Complaint -> Comments (One-to-Many)
Complaint.hasMany(ComplaintComment, {
  foreignKey: 'complaintId',
  as: 'comments',
  onDelete: 'CASCADE'
});
ComplaintComment.belongsTo(Complaint, {
  foreignKey: 'complaintId',
  as: 'complaint'
});

// Complaint -> Attachments (One-to-Many)
Complaint.hasMany(ComplaintAttachment, {
  foreignKey: 'complaintId',
  as: 'attachments',
  onDelete: 'CASCADE'
});
ComplaintAttachment.belongsTo(Complaint, {
  foreignKey: 'complaintId',
  as: 'complaint'
});

// Complaint -> Assignments (One-to-Many)
Complaint.hasMany(ComplaintAssignment, {
  foreignKey: 'complaintId',
  as: 'assignments',
  onDelete: 'CASCADE'
});
ComplaintAssignment.belongsTo(Complaint, {
  foreignKey: 'complaintId',
  as: 'complaint'
});

console.log('âœ… Database models loaded successfully');

// Export all models and connections
module.exports = {
  sequelize,
  mongoose,
  Sequelize,
  
  // PostgreSQL Models
  Complaint,
  ComplaintComment,
  ComplaintAttachment,
  ComplaintAssignment,
  
  // MongoDB Models
  ComplaintAnalytics
};
