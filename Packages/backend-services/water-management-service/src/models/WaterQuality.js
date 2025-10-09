const mongoose = require('mongoose');

const waterQualitySchema = new mongoose.Schema({
  // Location Information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  
  locationName: {
    type: String,
    required: true,
    trim: true
  },
  
  ward: {
    type: String,
    required: true,
    index: true
  },
  
  zone: {
    type: String,
    required: true,
    index: true
  },
  
  // Sampling Information
  sampleId: {
    type: String,
    unique: true,
    required: true
  },
  
  samplingDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  samplingTime: {
    type: String,
    required: true
  },
  
  sampleType: {
    type: String,
    enum: [
      'raw_water',
      'treated_water',
      'distribution_network',
      'consumer_tap',
      'overhead_tank',
      'ground_water'
    ],
    required: true
  },
  
  // Physical Parameters
  physicalParameters: {
    temperature: {
      value: Number,
      unit: { type: String, default: '°C' },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    turbidity: {
      value: Number,
      unit: { type: String, default: 'NTU' },
      limit: { type: Number, default: 1 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    color: {
      value: Number,
      unit: { type: String, default: 'Hazen Units' },
      limit: { type: Number, default: 15 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    odor: {
      value: String,
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    taste: {
      value: String,
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    }
  },
  
  // Chemical Parameters
  chemicalParameters: {
    pH: {
      value: Number,
      unit: { type: String, default: 'pH units' },
      minLimit: { type: Number, default: 6.5 },
      maxLimit: { type: Number, default: 8.5 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    totalDissolvedSolids: {
      value: Number,
      unit: { type: String, default: 'mg/L' },
      limit: { type: Number, default: 500 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    totalHardness: {
      value: Number,
      unit: { type: String, default: 'mg/L as CaCO3' },
      limit: { type: Number, default: 200 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    chloride: {
      value: Number,
      unit: { type: String, default: 'mg/L' },
      limit: { type: Number, default: 250 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    sulfate: {
      value: Number,
      unit: { type: String, default: 'mg/L' },
      limit: { type: Number, default: 200 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    fluoride: {
      value: Number,
      unit: { type: String, default: 'mg/L' },
      limit: { type: Number, default: 1.0 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    nitrate: {
      value: Number,
      unit: { type: String, default: 'mg/L' },
      limit: { type: Number, default: 45 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    residualChlorine: {
      value: Number,
      unit: { type: String, default: 'mg/L' },
      minLimit: { type: Number, default: 0.2 },
      maxLimit: { type: Number, default: 1.0 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    }
  },
  
  // Bacteriological Parameters
  bacteriologicalParameters: {
    totalColiformCount: {
      value: Number,
      unit: { type: String, default: 'CFU/100mL' },
      limit: { type: Number, default: 0 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    fecalColiformCount: {
      value: Number,
      unit: { type: String, default: 'CFU/100mL' },
      limit: { type: Number, default: 0 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    },
    
    eColi: {
      value: Number,
      unit: { type: String, default: 'CFU/100mL' },
      limit: { type: Number, default: 0 },
      status: { 
        type: String, 
        enum: ['acceptable', 'marginal', 'unacceptable'],
        default: 'acceptable'
      }
    }
  },
  
  // Overall Quality Assessment
  overallQuality: {
    type: String,
    enum: ['excellent', 'good', 'acceptable', 'poor', 'unacceptable'],
    default: 'acceptable',
    index: true
  },
  
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },
  
  // Laboratory Information
  laboratoryInfo: {
    labName: String,
    testingDate: Date,
    reportNumber: String,
    testedBy: String
  },
  
  // Quality Issues
  issues: [{
    parameter: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String,
    recommendation: String
  }],
  
  // Actions Taken
  actions: [{
    actionType: {
      type: String,
      enum: ['immediate', 'corrective', 'preventive']
    },
    description: String,
    takenBy: String,
    takenAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    }
  }],
  
  // IoT Sensor Data
  sensorData: {
    deviceId: String,
    batteryLevel: Number,
    signalStrength: Number,
    lastCalibration: Date,
    dataReliability: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'high'
    }
  },
  
  // Additional Information
  weatherConditions: {
    temperature: Number,
    humidity: Number,
    rainfall: Number
  },
  
  remarks: String,
  
  // Data Source
  dataSource: {
    type: String,
    enum: ['manual_testing', 'iot_sensor', 'laboratory', 'mobile_testing_unit'],
    default: 'laboratory'
  },
  
  // Validation
  isValidated: {
    type: Boolean,
    default: false
  },
  
  validatedBy: String,
  validatedAt: Date,
  
  // Alerts
  alertsSent: [{
    alertType: String,
    sentTo: [String],
    sentAt: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
waterQualitySchema.index({ samplingDate: -1 });
waterQualitySchema.index({ sampleType: 1, samplingDate: -1 });
waterQualitySchema.index({ overallQuality: 1, samplingDate: -1 });
waterQualitySchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for days since sampling
waterQualitySchema.virtual('daysSinceSampling').get(function() {
  return Math.floor((new Date() - this.samplingDate) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate quality score and status
waterQualitySchema.pre('save', function(next) {
  this.calculateQualityScore();
  this.assessParameterStatus();
  this.determineOverallQuality();
  next();
});

// Methods
waterQualitySchema.methods.calculateQualityScore = function() {
  let score = 100;
  let penalties = 0;
  
  // Check physical parameters
  if (this.physicalParameters.turbidity.value > 1) {
    penalties += 10;
  }
  
  // Check chemical parameters
  const ph = this.chemicalParameters.pH.value;
  if (ph < 6.5 || ph > 8.5) {
    penalties += 15;
  }
  
  if (this.chemicalParameters.totalDissolvedSolids.value > 500) {
    penalties += 10;
  }
  
  if (this.chemicalParameters.residualChlorine.value < 0.2) {
    penalties += 20;
  }
  
  // Check bacteriological parameters
  if (this.bacteriologicalParameters.totalColiformCount.value > 0) {
    penalties += 30;
  }
  
  if (this.bacteriologicalParameters.eColi.value > 0) {
    penalties += 40;
  }
  
  this.qualityScore = Math.max(0, score - penalties);
};

waterQualitySchema.methods.assessParameterStatus = function() {
  // Assess pH
  const ph = this.chemicalParameters.pH.value;
  if (ph >= 6.5 && ph <= 8.5) {
    this.chemicalParameters.pH.status = 'acceptable';
  } else if ((ph >= 6.0 && ph < 6.5) || (ph > 8.5 && ph <= 9.0)) {
    this.chemicalParameters.pH.status = 'marginal';
  } else {
    this.chemicalParameters.pH.status = 'unacceptable';
  }
  
  // Assess turbidity
  if (this.physicalParameters.turbidity.value <= 1) {
    this.physicalParameters.turbidity.status = 'acceptable';
  } else if (this.physicalParameters.turbidity.value <= 5) {
    this.physicalParameters.turbidity.status = 'marginal';
  } else {
    this.physicalParameters.turbidity.status = 'unacceptable';
  }
  
  // Assess bacterial contamination
  if (this.bacteriologicalParameters.totalColiformCount.value === 0) {
    this.bacteriologicalParameters.totalColiformCount.status = 'acceptable';
  } else {
    this.bacteriologicalParameters.totalColiformCount.status = 'unacceptable';
  }
  
  // Add more parameter assessments as needed
};

waterQualitySchema.methods.determineOverallQuality = function() {
  if (this.qualityScore >= 90) {
    this.overallQuality = 'excellent';
  } else if (this.qualityScore >= 75) {
    this.overallQuality = 'good';
  } else if (this.qualityScore >= 60) {
    this.overallQuality = 'acceptable';
  } else if (this.qualityScore >= 40) {
    this.overallQuality = 'poor';
  } else {
    this.overallQuality = 'unacceptable';
  }
};

waterQualitySchema.methods.identifyIssues = function() {
  this.issues = [];
  
  // Check for critical parameters
  if (this.bacteriologicalParameters.eColi.value > 0) {
    this.issues.push({
      parameter: 'E. Coli',
      severity: 'critical',
      description: 'E. Coli detected in water sample',
      recommendation: 'Immediate disinfection and source investigation required'
    });
  }
  
  if (this.chemicalParameters.pH.value < 6.5 || this.chemicalParameters.pH.value > 8.5) {
    this.issues.push({
      parameter: 'pH',
      severity: 'high',
      description: 'pH outside acceptable range',
      recommendation: 'Adjust pH treatment process'
    });
  }
  
  if (this.physicalParameters.turbidity.value > 5) {
    this.issues.push({
      parameter: 'Turbidity',
      severity: 'medium',
      description: 'High turbidity detected',
      recommendation: 'Check filtration system'
    });
  }
};

// Static methods
waterQualitySchema.statics.findByLocation = function(coordinates, radiusKm = 5) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: radiusKm * 1000 // Convert to meters
      }
    }
  }).sort({ samplingDate: -1 });
};

waterQualitySchema.statics.getQualityTrends = function(ward, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        ward: ward,
        samplingDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$samplingDate'
          }
        },
        avgQualityScore: { $avg: '$qualityScore' },
        sampleCount: { $sum: 1 },
        excellentCount: {
          $sum: { $cond: [{ $eq: ['$overallQuality', 'excellent'] }, 1, 0] }
        },
        poorCount: {
          $sum: { $cond: [{ $in: ['$overallQuality', ['poor', 'unacceptable']] }, 1, 0] }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('WaterQuality', waterQualitySchema);
