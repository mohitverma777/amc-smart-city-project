module.exports = (sequelize, DataTypes) => {
  const WasteBin = sequelize.define('WasteBin', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    zone: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Capacity in kilograms'
    },
    currentFill: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Current fill in kilograms'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    lastCollection: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('empty', 'normal', 'full', 'overflow'),
      defaultValue: 'empty'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'waste_bins',
    timestamps: true
  });

  return WasteBin;
};
