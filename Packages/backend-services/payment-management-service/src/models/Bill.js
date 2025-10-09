const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bill = sequelize.define('Bill', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    billNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    citizenId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    billType: {
      type: DataTypes.ENUM('Property Tax', 'Water Bill', 'Waste Management', 'Trade License', 'Street Lighting', 'Birth Certificate', 'Death Certificate', 'Other'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Paid', 'Overdue', 'Cancelled'),
      defaultValue: 'Pending',
    },
    generatedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    tableName: 'bills',
    timestamps: true,
  });

  return Bill;
};
