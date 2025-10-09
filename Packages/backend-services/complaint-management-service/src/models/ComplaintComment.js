module.exports = (sequelize, DataTypes) => {
  const ComplaintComment = sequelize.define('ComplaintComment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    complaintId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID of user who added comment'
    },
    userName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    userRole: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isInternal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Internal comments visible only to officers'
    },
    attachmentPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
    }
  }, {
    tableName: 'complaint_comments',
    timestamps: true,
    indexes: [
      { fields: ['complaintId'] },
      { fields: ['userId'] },
      { fields: ['createdAt'] }
    ]
  });

  return ComplaintComment;
};
