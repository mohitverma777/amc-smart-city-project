// Create application user
db = db.getSiblingDB('admin');
db.createUser({
  user: 'amc_app_user',
  pwd: 'amc_app_password',
  roles: [
    { role: 'readWrite', db: 'amc_smart_city' },
    { role: 'readWrite', db: 'user_management' },
    { role: 'readWrite', db: 'notifications' },
    { role: 'readWrite', db: 'chatbot' },
    { role: 'readWrite', db: 'analytics' }
  ]
});

// Switch to application database
db = db.getSiblingDB('amc_smart_city');

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'mobileNumber', 'citizenId', 'ward'],
      properties: {
        name: { bsonType: 'string', minLength: 2, maxLength: 100 },
        email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' },
        mobileNumber: { bsonType: 'string', pattern: '^[6-9][0-9]{9}$' },
        citizenId: { bsonType: 'string', minLength: 6, maxLength: 20 },
        ward: { bsonType: 'string', minLength: 1, maxLength: 50 },
        role: { 
          bsonType: 'string',
          enum: ['citizen', 'officer', 'admin']
        },
        isActive: { bsonType: 'bool' },
        verificationStatus: {
          bsonType: 'object',
          properties: {
            mobile: { bsonType: 'bool' },
            email: { bsonType: 'bool' }
          }
        }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ mobileNumber: 1 }, { unique: true });
db.users.createIndex({ citizenId: 1 }, { unique: true });
db.users.createIndex({ ward: 1 });
db.users.createIndex({ role: 1 });

// Create notifications collection
db.createCollection('notifications');
db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ createdAt: -1 });
db.notifications.createIndex({ status: 1 });

// Create chat sessions collection
db.createCollection('chat_sessions');
db.chat_sessions.createIndex({ userId: 1 });
db.chat_sessions.createIndex({ createdAt: -1 });

console.log('MongoDB initialization completed');