// Packages/backend-services/grievance-service/src/models/StatusHistory.js
module.exports = (sequelize, DataTypes) => {
  const StatusHistory = sequelize.define('StatusHistory', {
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
    
    status: {
      type: DataTypes.ENUM(
        'submitted',
        'acknowledged',
        'in_progress', 
        'pending_info',
        'resolved',
        'closed',
        'rejected'
      ),
      allowNull: false
    },
    
    updatedBy: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    updatedByRole: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    
    isSystemGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'grievance_status_history',
    timestamps: true,
    indexes: [
      {
        fields: ['grievanceId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['updatedBy']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  return StatusHistory;
};
