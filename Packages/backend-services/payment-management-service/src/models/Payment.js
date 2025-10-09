const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    paymentNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    citizenId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    citizenName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    citizenEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    billType: {
      type: DataTypes.ENUM('Property Tax', 'Water Bill', 'Waste Management', 'Trade License', 'Street Lighting', 'Birth Certificate', 'Death Certificate', 'Other'),
      allowNull: false,
    },
    billId: {
      type: DataTypes.UUID, // ✅ Changed from STRING to UUID
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Processing', 'Completed', 'Failed', 'Refunded'),
      defaultValue: 'Pending',
    },
    paymentMethod: {
      type: DataTypes.ENUM('Cash', 'Online', 'Card', 'UPI', 'Net Banking'),
      defaultValue: 'Online',
    },
    transactionId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'payments',
    timestamps: true,
  });

  return Payment;
};
