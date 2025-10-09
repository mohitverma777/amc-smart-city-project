module.exports = (sequelize, DataTypes) => {
  const ComplaintAssignment = sequelize.define('ComplaintAssignment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    complaintId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    assignedTo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Employee ID of assigned officer'
    },
    assignedToName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    assignedBy: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Employee ID of assigning officer'
    },
    assignedByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    assignmentReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Transferred', 'Completed', 'Cancelled'),
      defaultValue: 'Active',
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    transferredTo: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: 'complaint_assignments',
    timestamps: true,
    indexes: [
      { fields: ['complaintId'] },
      { fields: ['assignedTo'] },
      { fields: ['assignedBy'] },
      { fields: ['status'] },
      { fields: ['assignedAt'] }
    ]
  });

  return ComplaintAssignment;
};
