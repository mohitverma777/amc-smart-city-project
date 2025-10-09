const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  
  recipientType: {
    type: String,
    enum: ['citizen', 'officer', 'admin', 'department'],
    required: true
  },
  
  // Notification Content
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  description: {
    type: String,
    maxlength: 2000
  },
  
  // Notification Type and Category
  type: {
    type: String,
    enum: [
      'grievance_update',
      'payment_success',
      'payment_failed',
      'tax_due',
      'bill_generated',
      'service_update',
      'emergency_alert',
      'system_maintenance',
      'reminder',
      'welcome',
      'verification'
    ],
    required: true,
    index: true
  },
  
  category: {
    type: String,
    enum: ['info', 'warning', 'error', 'success', 'urgent'],
    default: 'info'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Delivery Channels
  channels: {
    push: {
      enabled: { type: Boolean, default: true },
      sent: { type: Boolean, default: false },
      sentAt: Date,
      messageId: String,
      error: String
    },
    email: {
      enabled: { type: Boolean, default: false },
      sent: { type: Boolean, default: false },
      sentAt: Date,
      messageId: String,
      error: String
    },
    sms: {
      enabled: { type: Boolean, default: false },
      sent: { type: Boolean, default: false },
      sentAt: Date,
      messageId: String,
      error: String
    },
    websocket: {
      enabled: { type: Boolean, default: true },
      sent: { type: Boolean, default: false },
      sentAt: Date
    }
  },
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['pending', 'sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending',
    index: true
  },
  
  readAt: Date,
  
  deliveredAt: Date,
  
  // Source Information
  sourceService: {
    type: String,
    required: true
  },
  
  sourceReferenceId: String,
  
  // Action Information
  actionUrl: String,
  
  actionLabel: String,
  
  // Rich Content
  imageUrl: String,
  
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  
  // Scheduling
  scheduledFor: Date,
  
  expiresAt: Date,
  
  // Template Information
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NotificationTemplate'
  },
  
  templateData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Additional Data
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ status: 1, priority: 1 });
notificationSchema.index({ scheduledFor: 1 }, { sparse: true });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for overall delivery status
notificationSchema.virtual('deliveryStatus').get(function() {
  const channels = this.channels;
  const enabledChannels = Object.keys(channels).filter(channel => channels[channel].enabled);
  const sentChannels = enabledChannels.filter(channel => channels[channel].sent);
  
  if (sentChannels.length === 0) return 'pending';
  if (sentChannels.length === enabledChannels.length) return 'sent';
  return 'partial';
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markChannelAsSent = function(channel, messageId = null, error = null) {
  if (this.channels[channel]) {
    this.channels[channel].sent = !error;
    this.channels[channel].sentAt = new Date();
    if (messageId) this.channels[channel].messageId = messageId;
    if (error) this.channels[channel].error = error;
    
    // Update overall status
    const allChannelsSent = Object.keys(this.channels)
      .filter(ch => this.channels[ch].enabled)
      .every(ch => this.channels[ch].sent);
    
    if (allChannelsSent) {
      this.status = 'sent';
    }
  }
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function(recipientId) {
  return this.countDocuments({
    recipientId,
    status: { $in: ['pending', 'sending', 'sent', 'delivered'] }
  });
};

notificationSchema.statics.markMultipleAsRead = function(recipientId, notificationIds) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipientId
    },
    {
      status: 'read',
      readAt: new Date()
    }
  );
};

notificationSchema.statics.getNotificationStats = function(filters = {}) {
  const pipeline = [];
  
  // Match filters
  if (Object.keys(filters).length > 0) {
    pipeline.push({ $match: filters });
  }
  
  // Group by status and type
  pipeline.push({
    $group: {
      _id: {
        status: '$status',
        type: '$type',
        category: '$category'
      },
      count: { $sum: 1 },
      avgDeliveryTime: {
        $avg: {
          $subtract: ['$deliveredAt', '$createdAt']
        }
      }
    }
  });
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Notification', notificationSchema);
