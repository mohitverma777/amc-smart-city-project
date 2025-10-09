const mongoose = require('mongoose');

const complaintAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Overall Statistics
  totalComplaints: {
    type: Number,
    default: 0
  },
  newComplaints: {
    type: Number,
    default: 0
  },
  resolvedComplaints: {
    type: Number,
    default: 0
  },
  pendingComplaints: {
    type: Number,
    default: 0
  },
  overdueComplaints: {
    type: Number,
    default: 0
  },
  
  // Category Breakdown
  categoryBreakdown: [{
    category: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    },
    resolved: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    }
  }],
  
  // Priority Breakdown
  priorityBreakdown: [{
    priority: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    count: {
      type: Number,
      default: 0
    },
    avgResolutionTime: {
      type: Number,
      default: 0
    }
  }],
  
  // Department Performance
  departmentBreakdown: [{
    department: {
      type: String,
      required: true
    },
    assigned: {
      type: Number,
      default: 0
    },
    resolved: {
      type: Number,
      default: 0
    },
    avgResolutionTime: {
      type: Number,
      default: 0
    },
    satisfactionRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  }],
  
  // Geographic Distribution
  wardBreakdown: [{
    ward: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    },
    resolved: {
      type: Number,
      default: 0
    }
  }],
  
  zoneBreakdown: [{
    zone: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    },
    resolved: {
      type: Number,
      default: 0
    }
  }],
  
  // Performance Metrics
  averageResolutionTime: {
    type: Number,
    default: 0,
    comment: 'Average resolution time in hours'
  },
  
  citizenSatisfactionRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  slaComplianceRate: {
    type: Number,
    default: 0,
    comment: 'Percentage of complaints resolved within SLA'
  },
  
  // Trend Data
  trends: {
    dailyGrowth: {
      type: Number,
      default: 0
    },
    resolutionRate: {
      type: Number,
      default: 0
    },
    escalationRate: {
      type: Number,
      default: 0
    }
  },
  
  // Additional Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'complaint_analytics'
});

// Indexes for better query performance
complaintAnalyticsSchema.index({ date: 1 });
complaintAnalyticsSchema.index({ 'categoryBreakdown.category': 1 });
complaintAnalyticsSchema.index({ 'departmentBreakdown.department': 1 });
complaintAnalyticsSchema.index({ 'wardBreakdown.ward': 1 });
complaintAnalyticsSchema.index({ createdAt: -1 });

// Static methods
complaintAnalyticsSchema.statics.getLatestAnalytics = function() {
  return this.findOne().sort({ date: -1 });
};

complaintAnalyticsSchema.statics.getAnalyticsByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });
};

module.exports = mongoose.model('ComplaintAnalytics', complaintAnalyticsSchema);
