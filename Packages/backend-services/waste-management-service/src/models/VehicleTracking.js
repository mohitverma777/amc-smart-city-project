const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  speed: {
    type: Number,
    default: 0,
    min: 0
  },
  heading: {
    type: Number,
    default: 0,
    min: 0,
    max: 360
  },
  accuracy: {
    type: Number,
    default: 0
  },
  altitude: {
    type: Number,
    default: 0
  }
});

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'geofence_violation',
      'speed_limit_exceeded',
      'route_point_reached',
      'maintenance_alert',
      'fuel_low',
      'unauthorized_stop',
      'breakdown'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: locationSchema,
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: String,
  resolvedAt: Date,
  additionalData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

const vehicleTrackingSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    index: true
  },
  
  trackingSessionId: {
    type: String,
    required: true,
    unique: true
  },
  
  scheduleId: {
    type: String,
    index: true
  },
  
  // Tracking Session Info
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  
  endTime: {
    type: Date,
    index: true
  },
  
  duration: {
    type: Number, // in minutes
    min: 0
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'expired', 'error'],
    default: 'active',
    index: true
  },
  
  // Route Information
  route: [{
    latitude: Number,
    longitude: Number,
    address: String,
    pointType: {
      type: String,
      enum: ['collection_point', 'waypoint', 'depot', 'disposal_site']
    },
    estimatedArrival: Date,
    actualArrival: Date,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  currentRouteIndex: {
    type: Number,
    default: 0
  },
  
  // Location Tracking
  currentLocation: locationSchema,
  
  locationHistory: [locationSchema],
  
  // Performance Metrics
  totalDistance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  maxSpeed: {
    type: Number,
    default: 0,
    min: 0
  },
  
  averageSpeed: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalStops: {
    type: Number,
    default: 0
  },
  
  idleTime: {
    type: Number,
    default: 0,
    comment: 'Total idle time in minutes'
  },
  
  fuelConsumption: {
    type: Number,
    min: 0
  },
  
  // Route Efficiency
  routeDeviation: {
    type: Number,
    default: 0,
    comment: 'Percentage deviation from planned route'
  },
  
  onTimePerformance: {
    type: Number,
    min: 0,
    max: 100,
    comment: 'Percentage of on-time arrivals'
  },
  
  // Environmental Data
  co2Emissions: {
    type: Number,
    min: 0
  },
  
  // Alerts and Issues
  alerts: [alertSchema],
  
  issues: [{
    type: String,
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    reportedBy: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  // Driver Information
  driverId: String,
  driverName: String,
  
  // Weather Conditions
  weatherData: [{
    timestamp: Date,
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    precipitation: Number,
    condition: String
  }],
  
  // Additional Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  lastUpdate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
vehicleTrackingSchema.index({ vehicleId: 1, startTime: -1 });
vehicleTrackingSchema.index({ status: 1, startTime: -1 });
vehicleTrackingSchema.index({ scheduleId: 1 });
vehicleTrackingSchema.index({ 'currentLocation.timestamp': -1 });

// Virtual for tracking duration
vehicleTrackingSchema.virtual('trackingDuration').get(function() {
  if (this.endTime) {
    return (this.endTime - this.startTime) / (1000 * 60); // minutes
  } else if (this.status === 'active') {
    return (new Date() - this.startTime) / (1000 * 60); // minutes
  }
  return 0;
});

// Virtual for current speed
vehicleTrackingSchema.virtual('currentSpeed').get(function() {
  return this.currentLocation ? this.currentLocation.speed : 0;
});

// Virtual for route completion percentage
vehicleTrackingSchema.virtual('routeCompletionPercentage').get(function() {
  if (this.route.length === 0) return 0;
  const completedPoints = this.route.filter(point => point.completed).length;
  return (completedPoints / this.route.length) * 100;
});

// Methods
vehicleTrackingSchema.methods.addAlert = function(alertData) {
  this.alerts.push(alertData);
  return this.save();
};

vehicleTrackingSchema.methods.acknowledgeAlert = function(alertId, userId) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
  }
  return this.save();
};

vehicleTrackingSchema.methods.resolveAlert = function(alertId, userId) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.resolved = true;
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
  }
  return this.save();
};

vehicleTrackingSchema.methods.updateRouteProgress = function(pointIndex, arrivalTime = null) {
  if (pointIndex < this.route.length) {
    this.route[pointIndex].actualArrival = arrivalTime || new Date();
    this.route[pointIndex].completed = true;
    this.currentRouteIndex = Math.max(this.currentRouteIndex, pointIndex + 1);
  }
  return this.save();
};

vehicleTrackingSchema.methods.calculateEfficiencyMetrics = function() {
  const totalPoints = this.route.length;
  const completedPoints = this.route.filter(point => point.completed).length;
  const onTimePoints = this.route.filter(point => 
    point.completed && point.estimatedArrival && point.actualArrival &&
    point.actualArrival <= point.estimatedArrival
  ).length;

  return {
    routeCompletion: totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0,
    onTimePerformance: completedPoints > 0 ? (onTimePoints / completedPoints) * 100 : 0,
    averageSpeed: this.totalDistance > 0 && this.duration > 0 ? 
      (this.totalDistance / (this.duration / 60)) : 0, // km/h
    fuelEfficiency: this.fuelConsumption > 0 ? this.totalDistance / this.fuelConsumption : 0
  };
};

// Static methods
vehicleTrackingSchema.statics.getActiveTrackingSessions = function() {
  return this.find({ status: 'active' }).sort({ startTime: -1 });
};

vehicleTrackingSchema.statics.getVehicleHistory = function(vehicleId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    vehicleId,
    startTime: { $gte: startDate }
  }).sort({ startTime: -1 });
};

vehicleTrackingSchema.statics.getFleetPerformanceMetrics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: new Date(startDate) },
        endTime: { $lte: new Date(endDate) },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalDistance: { $sum: '$totalDistance' },
        totalDuration: { $sum: '$duration' },
        averageSpeed: { $avg: '$averageSpeed' },
        totalFuelConsumption: { $sum: '$fuelConsumption' },
        totalAlerts: { $sum: { $size: '$alerts' } }
      }
    }
  ]);
};

module.exports = mongoose.model('VehicleTracking', vehicleTrackingSchema);
