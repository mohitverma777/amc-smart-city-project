module.exports = (sequelize, DataTypes) => {
  const ComplaintAttachment = sequelize.define('ComplaintAttachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    complaintId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uploadedByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    }
  }, {
    tableName: 'complaint_attachments',
    timestamps: true,
    indexes: [
      { fields: ['complaintId'] },
      { fields: ['uploadedBy'] },
      { fields: ['createdAt'] }
    ]
  });

  return ComplaintAttachment;
};
