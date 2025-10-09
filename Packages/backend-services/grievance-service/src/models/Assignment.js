// Packages/backend-services/grievance-service/src/models/Assignment.js
module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    grievanceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Grievances',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    assignedTo: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    assignedBy: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    assignmentType: {
      type: DataTypes.ENUM('primary', 'secondary', 'escalated'),
      defaultValue: 'primary'
    },
    
    status: {
      type: DataTypes.ENUM('active', 'completed', 'transferred', 'cancelled'),
      defaultValue: 'active'
    },
    
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'grievance_assignments',
    timestamps: true,
    indexes: [
      {
        fields: ['grievanceId']
      },
      {
        fields: ['assignedTo']
      },
      {
        fields: ['status']
      },
      {
        fields: ['assignedAt']
      }
    ]
  });

  return Assignment;
};
