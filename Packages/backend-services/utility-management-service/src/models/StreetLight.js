module.exports = (sequelize, DataTypes) => {
  const StreetLight = sequelize.define('StreetLight', {
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
    totalLights: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    workingLights: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    lastMaintenance: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('operational', 'partial', 'failed'),
      defaultValue: 'operational'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'street_lights',
    timestamps: true
  });

  return StreetLight;
};
