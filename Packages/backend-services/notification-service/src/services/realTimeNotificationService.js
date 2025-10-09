const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const logger = require('@amc/shared/utils/logger');

class RealTimeNotificationService {
  constructor() {
    this.io = null;
    this.redisClient = null;
    this.connectedUsers = new Map();
  }

  // Initialize Socket.IO server
  initialize(httpServer) {
    this.io = socketIo(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Initialize Redis for scaling across multiple instances
    this.initializeRedis();

    // Setup middleware and event handlers
    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Real-time notification service initialized');
  }

  // Initialize Redis for pub/sub
  async initializeRedis() {
    try {
      this.redisClient = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
      });

      await this.redisClient.connect();

      // Subscribe to notification events
      await this.redisClient.subscribe('notifications', (message) => {
        try {
          const notificationData = JSON.parse(message);
          this.broadcastNotification(notificationData);
        } catch (error) {
          logger.error('Failed to parse Redis notification:', error);
        }
      });

      logger.info('Redis pub/sub initialized for real-time notifications');
    } catch (error) {
      logger.error('Failed to initialize Redis for real-time notifications:', error);
    }
  }

  // Setup Socket.IO middleware
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.citizenId = decoded.citizenId;

        logger.debug('Socket authenticated', {
          socketId: socket.id,
          userId: decoded.id,
          role: decoded.role
        });

        next();
      } catch (error) {
        logger.warn('Socket authentication failed:', error);
        next(new Error('Invalid token'));
      }
    });
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  // Handle new socket connection
  handleConnection(socket) {
    const userId = socket.userId;
    
    // Store user connection
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      socket: socket,
      connectedAt: new Date(),
      role: socket.userRole,
      citizenId: socket.citizenId
    });

    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);
    
    // Join citizen-specific room if applicable
    if (socket.citizenId) {
      socket.join(`citizen:${socket.citizenId}`);
    }

    logger.info('User connected to real-time service', {
      userId,
      socketId: socket.id,
      role: socket.userRole
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle notification acknowledgment
    socket.on('notification:ack', (data) => {
      this.handleNotificationAck(socket, data);
    });

    // Handle subscription to specific channels
    socket.on('subscribe', (data) => {
      this.handleSubscription(socket, data);
    });

    // Handle unsubscription
    socket.on('unsubscribe', (data) => {
      this.handleUnsubscription(socket, data);
    });

    // Send connection confirmation
    socket.emit('connected', {
      status: 'connected',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle socket disconnection
  handleDisconnection(socket) {
    const userId = socket.userId;
    
    this.connectedUsers.delete(userId);
    
    logger.info('User disconnected from real-time service', {
      userId,
      socketId: socket.id
    });
  }

  // Handle notification acknowledgment
  handleNotificationAck(socket, data) {
    const { notificationId } = data;
    
    logger.debug('Notification acknowledged', {
      userId: socket.userId,
      notificationId
    });

    // Update notification status in database
    // This would be handled by the main notification service
    socket.emit('notification:ack:confirmed', { notificationId });
  }

  // Handle channel subscription
  handleSubscription(socket, data) {
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        if (this.isValidChannel(channel, socket)) {
          socket.join(channel);
          logger.debug('User subscribed to channel', {
            userId: socket.userId,
            channel
          });
        }
      });
    }

    socket.emit('subscribed', { channels });
  }

  // Handle channel unsubscription
  handleUnsubscription(socket, data) {
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        socket.leave(channel);
        logger.debug('User unsubscribed from channel', {
          userId: socket.userId,
          channel
        });
      });
    }

    socket.emit('unsubscribed', { channels });
  }

  // Validate channel subscription
  isValidChannel(channel, socket) {
    // Implement channel access control based on user role and permissions
    const allowedChannels = {
      citizen: ['grievance_updates', 'payment_notifications', 'general_announcements'],
      officer: ['grievance_updates', 'assignment_notifications', 'system_alerts'],
      admin: ['all_notifications', 'system_alerts', 'admin_announcements']
    };

    const userRole = socket.userRole;
    const userAllowedChannels = allowedChannels[userRole] || [];
    
    return userAllowedChannels.includes(channel) || userAllowedChannels.includes('all_notifications');
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    const userConnection = this.connectedUsers.get(userId);
    
    if (userConnection) {
      userConnection.socket.emit('notification', notification);
      
      logger.debug('Notification sent to user', {
        userId,
        notificationId: notification.id,
        type: notification.type
      });
      
      return true;
    }
    
    return false;
  }

  // Send notification to multiple users
  sendToUsers(userIds, notification) {
    const deliveredCount = userIds.reduce((count, userId) => {
      return this.sendToUser(userId, notification) ? count + 1 : count;
    }, 0);

    logger.info('Notification sent to multiple users', {
      totalUsers: userIds.length,
      delivered: deliveredCount,
      notificationId: notification.id
    });

    return deliveredCount;
  }

  // Broadcast to all users in a role
  sendToRole(role, notification) {
    this.io.to(`role:${role}`).emit('notification', notification);
    
    logger.info('Notification broadcast to role', {
      role,
      notificationId: notification.id
    });
  }

  // Broadcast to channel
  sendToChannel(channel, notification) {
    this.io.to(channel).emit('notification', notification);
    
    logger.info('Notification broadcast to channel', {
      channel,
      notificationId: notification.id
    });
  }

  // Broadcast notification from Redis
  broadcastNotification(notificationData) {
    const { recipients, notification, type } = notificationData;

    switch (type) {
      case 'user':
        if (Array.isArray(recipients)) {
          this.sendToUsers(recipients, notification);
        } else {
          this.sendToUser(recipients, notification);
        }
        break;
      
      case 'role':
        this.sendToRole(recipients, notification);
        break;
      
      case 'channel':
        this.sendToChannel(recipients, notification);
        break;
      
      case 'broadcast':
        this.io.emit('notification', notification);
        break;
      
      default:
        logger.warn('Unknown notification broadcast type:', type);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users by role
  getConnectedUsersByRole() {
    const roleCount = {};
    
    this.connectedUsers.forEach(connection => {
      const role = connection.role;
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    return roleCount;
  }

  // Send system announcement
  sendSystemAnnouncement(message, priority = 'medium') {
    const announcement = {
      id: `announcement_${Date.now()}`,
      type: 'system_announcement',
      title: 'System Announcement',
      message,
      priority,
      timestamp: new Date().toISOString()
    };

    this.io.emit('announcement', announcement);
    
    logger.info('System announcement sent', {
      message,
      priority,
      connectedUsers: this.getConnectedUsersCount()
    });
  }

  // Publish notification to Redis for scaling
  async publishNotification(notificationData) {
    if (this.redisClient) {
      try {
        await this.redisClient.publish('notifications', JSON.stringify(notificationData));
        
        logger.debug('Notification published to Redis', {
          type: notificationData.type,
          recipients: notificationData.recipients
        });
      } catch (error) {
        logger.error('Failed to publish notification to Redis:', error);
      }
    }
  }
}

module.exports = new RealTimeNotificationService();
EOFcat > src/services/realTimeNotificationService.js << 'EOF'
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const logger = require('@amc/shared/utils/logger');

class RealTimeNotificationService {
  constructor() {
    this.io = null;
    this.redisClient = null;
    this.connectedUsers = new Map();
  }

  // Initialize Socket.IO server
  initialize(httpServer) {
    this.io = socketIo(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Initialize Redis for scaling across multiple instances
    this.initializeRedis();

    // Setup middleware and event handlers
    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Real-time notification service initialized');
  }

  // Initialize Redis for pub/sub
  async initializeRedis() {
    try {
      this.redisClient = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
      });

      await this.redisClient.connect();

      // Subscribe to notification events
      await this.redisClient.subscribe('notifications', (message) => {
        try {
          const notificationData = JSON.parse(message);
          this.broadcastNotification(notificationData);
        } catch (error) {
          logger.error('Failed to parse Redis notification:', error);
        }
      });

      logger.info('Redis pub/sub initialized for real-time notifications');
    } catch (error) {
      logger.error('Failed to initialize Redis for real-time notifications:', error);
    }
  }

  // Setup Socket.IO middleware
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.citizenId = decoded.citizenId;

        logger.debug('Socket authenticated', {
          socketId: socket.id,
          userId: decoded.id,
          role: decoded.role
        });

        next();
      } catch (error) {
        logger.warn('Socket authentication failed:', error);
        next(new Error('Invalid token'));
      }
    });
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  // Handle new socket connection
  handleConnection(socket) {
    const userId = socket.userId;
    
    // Store user connection
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      socket: socket,
      connectedAt: new Date(),
      role: socket.userRole,
      citizenId: socket.citizenId
    });

    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);
    
    // Join citizen-specific room if applicable
    if (socket.citizenId) {
      socket.join(`citizen:${socket.citizenId}`);
    }

    logger.info('User connected to real-time service', {
      userId,
      socketId: socket.id,
      role: socket.userRole
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle notification acknowledgment
    socket.on('notification:ack', (data) => {
      this.handleNotificationAck(socket, data);
    });

    // Handle subscription to specific channels
    socket.on('subscribe', (data) => {
      this.handleSubscription(socket, data);
    });

    // Handle unsubscription
    socket.on('unsubscribe', (data) => {
      this.handleUnsubscription(socket, data);
    });

    // Send connection confirmation
    socket.emit('connected', {
      status: 'connected',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle socket disconnection
  handleDisconnection(socket) {
    const userId = socket.userId;
    
    this.connectedUsers.delete(userId);
    
    logger.info('User disconnected from real-time service', {
      userId,
      socketId: socket.id
    });
  }

  // Handle notification acknowledgment
  handleNotificationAck(socket, data) {
    const { notificationId } = data;
    
    logger.debug('Notification acknowledged', {
      userId: socket.userId,
      notificationId
    });

    // Update notification status in database
    // This would be handled by the main notification service
    socket.emit('notification:ack:confirmed', { notificationId });
  }

  // Handle channel subscription
  handleSubscription(socket, data) {
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        if (this.isValidChannel(channel, socket)) {
          socket.join(channel);
          logger.debug('User subscribed to channel', {
            userId: socket.userId,
            channel
          });
        }
      });
    }

    socket.emit('subscribed', { channels });
  }

  // Handle channel unsubscription
  handleUnsubscription(socket, data) {
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        socket.leave(channel);
        logger.debug('User unsubscribed from channel', {
          userId: socket.userId,
          channel
        });
      });
    }

    socket.emit('unsubscribed', { channels });
  }

  // Validate channel subscription
  isValidChannel(channel, socket) {
    // Implement channel access control based on user role and permissions
    const allowedChannels = {
      citizen: ['grievance_updates', 'payment_notifications', 'general_announcements'],
      officer: ['grievance_updates', 'assignment_notifications', 'system_alerts'],
      admin: ['all_notifications', 'system_alerts', 'admin_announcements']
    };

    const userRole = socket.userRole;
    const userAllowedChannels = allowedChannels[userRole] || [];
    
    return userAllowedChannels.includes(channel) || userAllowedChannels.includes('all_notifications');
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    const userConnection = this.connectedUsers.get(userId);
    
    if (userConnection) {
      userConnection.socket.emit('notification', notification);
      
      logger.debug('Notification sent to user', {
        userId,
        notificationId: notification.id,
        type: notification.type
      });
      
      return true;
    }
    
    return false;
  }

  // Send notification to multiple users
  sendToUsers(userIds, notification) {
    const deliveredCount = userIds.reduce((count, userId) => {
      return this.sendToUser(userId, notification) ? count + 1 : count;
    }, 0);

    logger.info('Notification sent to multiple users', {
      totalUsers: userIds.length,
      delivered: deliveredCount,
      notificationId: notification.id
    });

    return deliveredCount;
  }

  // Broadcast to all users in a role
  sendToRole(role, notification) {
    this.io.to(`role:${role}`).emit('notification', notification);
    
    logger.info('Notification broadcast to role', {
      role,
      notificationId: notification.id
    });
  }

  // Broadcast to channel
  sendToChannel(channel, notification) {
    this.io.to(channel).emit('notification', notification);
    
    logger.info('Notification broadcast to channel', {
      channel,
      notificationId: notification.id
    });
  }

  // Broadcast notification from Redis
  broadcastNotification(notificationData) {
    const { recipients, notification, type } = notificationData;

    switch (type) {
      case 'user':
        if (Array.isArray(recipients)) {
          this.sendToUsers(recipients, notification);
        } else {
          this.sendToUser(recipients, notification);
        }
        break;
      
      case 'role':
        this.sendToRole(recipients, notification);
        break;
      
      case 'channel':
        this.sendToChannel(recipients, notification);
        break;
      
      case 'broadcast':
        this.io.emit('notification', notification);
        break;
      
      default:
        logger.warn('Unknown notification broadcast type:', type);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users by role
  getConnectedUsersByRole() {
    const roleCount = {};
    
    this.connectedUsers.forEach(connection => {
      const role = connection.role;
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    return roleCount;
  }

  // Send system announcement
  sendSystemAnnouncement(message, priority = 'medium') {
    const announcement = {
      id: `announcement_${Date.now()}`,
      type: 'system_announcement',
      title: 'System Announcement',
      message,
      priority,
      timestamp: new Date().toISOString()
    };

    this.io.emit('announcement', announcement);
    
    logger.info('System announcement sent', {
      message,
      priority,
      connectedUsers: this.getConnectedUsersCount()
    });
  }

  // Publish notification to Redis for scaling
  async publishNotification(notificationData) {
    if (this.redisClient) {
      try {
        await this.redisClient.publish('notifications', JSON.stringify(notificationData));
        
        logger.debug('Notification published to Redis', {
          type: notificationData.type,
          recipients: notificationData.recipients
        });
      } catch (error) {
        logger.error('Failed to publish notification to Redis:', error);
      }
    }
  }
}

module.exports = new RealTimeNotificationService();
