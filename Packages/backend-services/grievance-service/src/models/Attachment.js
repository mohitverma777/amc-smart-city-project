// Packages/backend-services/grievance-service/src/models/Attachment.js
module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define('Attachment', {
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
    
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    
    fileType: {
      type: DataTypes.ENUM('image', 'document', 'video', 'audio'),
      allowNull: false
    },
    
    uploadedBy: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'grievance_attachments',
    timestamps: true,
    indexes: [
      {
        fields: ['grievanceId']
      },
      {
        fields: ['uploadedBy']
      },
      {
        fields: ['fileType']
      }
    ]
  });

  return Attachment;
};
