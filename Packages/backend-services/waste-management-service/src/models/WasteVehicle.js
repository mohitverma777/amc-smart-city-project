module.exports = (sequelize, DataTypes) => {
  const WasteVehicle = sequelize.define('WasteVehicle', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Vehicle Identification
    vehicleId: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    
    registrationNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    
    vehicleType: {
      type: DataTypes.ENUM(
        'compactor_truck',
        'roll_off_truck', 
        'side_loader',
        'front_loader',
        'rear_loader',
        'recycling_truck',
        'hazardous_waste_truck',
        'mini_truck'
      ),
      allowNull: false
    },
    
    // Technical Specifications
    capacity: {
      type: DataTypes.DECIMAL(8, 2), // in cubic meters
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    maxLoad: {
      type: DataTypes.DECIMAL(8, 2), // in tons
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    fuelType: {
      type: DataTypes.ENUM('diesel', 'petrol', 'cng', 'electric', 'hybrid'),
      allowNull: false
    },
    
    fuelCapacity: {
      type: DataTypes.DECIMAL(6, 2), // in liters
      allowNull: false
    },
    
    // Vehicle Details
    make: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    model: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1990,
        max: new Date().getFullYear() + 1
      }
    },
    
    color: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    
    // Operational Status
    status: {
      type: DataTypes.ENUM(
        'active',
        'maintenance',
        'repair',
        'out_of_service',
        'retired'
      ),
      defaultValue: 'active'
    },
    
    currentLocation: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Current GPS coordinates and address'
    },
    
    homeBase: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Base depot or yard'
    },
    
    assignedZone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    
    assignedWards: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    
    // Crew Information
    driverId: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    driverName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    crewCapacity: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 10
      }
    },
    
    currentCrewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Tracking and Monitoring
    hasGPS: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    hasWeightSensor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    hasCompactionSensor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    hasCCTV: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Maintenance Information
    lastMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    nextMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    maintenanceInterval: {
      type: DataTypes.INTEGER, // in days
      defaultValue: 90
    },
    
    totalMileage: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    
    lastServiceMileage: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    
    // Performance Metrics
    averageFuelConsumption: {
      type: DataTypes.DECIMAL(6, 2), // km per liter
      allowNull: true
    },
    
    totalTrips: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    totalWasteCollected: {
      type: DataTypes.DECIMAL(10, 2), // in tons
      defaultValue: 0
    },
    
    // Insurance and Registration
    insuranceNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    insuranceExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    registrationExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    pollutionCertificateExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Additional Information
    specialFeatures: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Special equipment or features'
    },
    
    wasteTypesHandled: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['household'],
      comment: 'Types of waste this vehicle can handle'
    },
    
    operationalHours: {
      type: DataTypes.JSONB,
      defaultValue: {
        start: '06:00',
        end: '18:00'
      }
    },
    
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'waste_vehicles',
    timestamps: true,
    indexes: [
      {
        fields: ['vehicleId'],
        unique: true
      },
      {
        fields: ['registrationNumber'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['assignedZone']
      },
      {
        fields: ['vehicleType']
      },
      {
        fields: ['driverId']
      }
    ],
    hooks: {
      beforeCreate: async (vehicle) => {
        // Generate unique vehicle ID
        const year = new Date().getFullYear().toString().slice(-2);
        const typeCode = vehicle.vehicleType.substring(0, 3).toUpperCase();
        const zone = vehicle.assignedZone.replace(/[^A-Z0-9]/g, '');
        
        const count = await WasteVehicle.count({
          where: {
            vehicleType: vehicle.vehicleType,
            assignedZone: vehicle.assignedZone
          }
        });
        
        vehicle.vehicleId = `WV${year}${typeCode}${zone}${String(count + 1).padStart(3, '0')}`;
      },
      
      beforeUpdate: async (vehicle, options) => {
        // Update next maintenance date
        if (vehicle.changed('lastMaintenanceDate')) {
          const nextDate = new Date(vehicle.lastMaintenanceDate);
          nextDate.setDate(nextDate.getDate() + vehicle.maintenanceInterval);
          vehicle.nextMaintenanceDate = nextDate;
        }
      }
    }
  });

  // Instance methods
  WasteVehicle.prototype.updateLocation = async function(latitude, longitude, address = null) {
    this.currentLocation = {
      latitude,
      longitude,
      address,
      updatedAt: new Date()
    };
    
    await this.save();
    return this;
  };

  WasteVehicle.prototype.recordTrip = async function(distanceTraveled, wasteCollected, fuelUsed) {
    this.totalMileage = parseFloat(this.totalMileage) + distanceTraveled;
    this.totalTrips = this.totalTrips + 1;
    this.totalWasteCollected = parseFloat(this.totalWasteCollected) + wasteCollected;
    
    // Update fuel consumption average
    if (fuelUsed > 0) {
      const newConsumption = distanceTraveled / fuelUsed;
      if (this.averageFuelConsumption) {
        this.averageFuelConsumption = (
          (parseFloat(this.averageFuelConsumption) * (this.totalTrips - 1) + newConsumption) / this.totalTrips
        );
      } else {
        this.averageFuelConsumption = newConsumption;
      }
    }
    
    await this.save();
    return this;
  };

  WasteVehicle.prototype.scheduleMaintenance = async function(date, type = 'routine') {
    this.lastMaintenanceDate = date;
    this.lastServiceMileage = this.totalMileage;
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + this.maintenanceInterval);
    this.nextMaintenanceDate = nextDate;
    
    await this.save();
    return this;
  };

  WasteVehicle.prototype.isDueForMaintenance = function() {
    if (!this.nextMaintenanceDate) return false;
    return new Date() >= this.nextMaintenanceDate;
  };

  WasteVehicle.prototype.getEfficiencyRating = function() {
    if (!this.averageFuelConsumption || this.totalTrips === 0) return 0;
    
    // Calculate efficiency based on fuel consumption and waste collection
    const wastePerTrip = parseFloat(this.totalWasteCollected) / this.totalTrips;
    const fuelEfficiency = parseFloat(this.averageFuelConsumption);
    
    // Higher rating for more waste collected per unit fuel
    return Math.min(100, Math.max(0, (wastePerTrip * fuelEfficiency * 10)));
  };

  // Class methods
  WasteVehicle.findAvailableVehicles = function(zone = null, wasteType = null) {
    const where = {
      status: 'active',
      isActive: true
    };
    
    if (zone) {
      where[sequelize.Op.or] = [
        { assignedZone: zone },
        { assignedWards: { [sequelize.Op.contains]: [zone] } }
      ];
    }
    
    if (wasteType) {
      where.wasteTypesHandled = { [sequelize.Op.contains]: [wasteType] };
    }
    
    return this.findAll({
      where,
      order: [['totalTrips', 'ASC']] // Prefer less used vehicles
    });
  };

  WasteVehicle.getMaintenanceDue = function(daysAhead = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.findAll({
      where: {
        nextMaintenanceDate: {
          [sequelize.Op.lte]: futureDate
        },
        status: { [sequelize.Op.ne]: 'out_of_service' }
      },
      order: [['nextMaintenanceDate', 'ASC']]
    });
  };

  WasteVehicle.getFleetStatistics = function() {
    return this.findAll({
      attributes: [
        'status',
        'vehicleType',
        'assignedZone',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalWasteCollected')), 'totalWaste'],
        [sequelize.fn('AVG', sequelize.col('averageFuelConsumption')), 'avgFuelConsumption'],
        [sequelize.fn('SUM', sequelize.col('totalMileage')), 'totalMileage']
      ],
      where: { isActive: true },
      group: ['status', 'vehicleType', 'assignedZone']
    });
  };

  WasteVehicle.findNearbyVehicles = function(latitude, longitude, radiusKm = 5) {
    // This would typically use PostGIS for proper geospatial queries
    // For now, using a simplified approach
    return this.findAll({
      where: {
        status: 'active',
        currentLocation: { [sequelize.Op.ne]: null }
      },
      order: [['updatedAt', 'DESC']]
    });
  };

  return WasteVehicle;
};
