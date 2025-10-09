// Packages/backend-services/grievance-service/src/models/Grievance.js
module.exports = (sequelize, DataTypes) => {
  const Grievance = sequelize.define('Grievance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Basic Information
    grievanceNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    
    citizenId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'users', // This references the User model from user-management service
        key: 'citizenId'
      }
    },
    
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [5, 200],
        notEmpty: true
      }
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 5000],
        notEmpty: true
      }
    },
    
    // Classification
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    
    subCategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      allowNull: false
    },
    
    status: {
      type: DataTypes.ENUM(
        'submitted',
        'acknowledged', 
        'in_progress',
        'pending_info',
        'resolved',
        'closed',
        'rejected'
      ),
      defaultValue: 'submitted',
      allowNull: false
    },
    
    // Location Information
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidLocation(value) {
          if (value && (!value.latitude || !value.longitude)) {
            throw new Error('Location must include both latitude and longitude');
          }
        }
      }
    },
    
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    ward: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    zone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    
    // Assignment Information
    assignedTo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    assignedDepartment: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Timeline
    expectedResolutionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    actualResolutionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Contact Information
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    
    contactPhone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: /^[6-9]\d{9}$/
      }
    },
    
    // Feedback
    citizenFeedback: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    
    // Additional Data
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    isUrgent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Analytics
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'grievances',
    timestamps: true,
    indexes: [
      {
        fields: ['citizenId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['categoryId']
      },
      {
        fields: ['ward']
      },
      {
        fields: ['assignedTo']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['grievanceNumber'],
        unique: true
      }
    ],
    hooks: {
      beforeCreate: async (grievance) => {
        // Generate unique grievance number
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await Grievance.count({
          where: sequelize.where(
            sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "createdAt"')),
            year
          )
        });
        
        grievance.grievanceNumber = `GRV${year}${month}${String(count + 1).padStart(6, '0')}`;
        
        // Set expected resolution date based on priority
        const days = {
          'urgent': 1,
          'high': 3,
          'medium': 7,
          'low': 15
        };
        
        const resolutionDate = new Date();
        resolutionDate.setDate(resolutionDate.getDate() + days[grievance.priority]);
        grievance.expectedResolutionDate = resolutionDate;
      },
      
      afterUpdate: async (grievance, options) => {
        // If status changed, create status history entry
        if (grievance.changed('status')) {
          const StatusHistory = require('./StatusHistory')(sequelize, DataTypes);
          await StatusHistory.create({
            grievanceId: grievance.id,
            status: grievance.status,
            updatedBy: options.userId || 'system',
            comment: options.statusComment || ''
          });
        }
      }
    }
  });

  // Instance methods
  Grievance.prototype.updateStatus = async function(newStatus, userId, comment) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    if (newStatus === 'resolved') {
      this.actualResolutionDate = new Date();
    }
    
    await this.save({ userId, statusComment: comment });
    
    return {
      oldStatus,
      newStatus,
      grievanceNumber: this.grievanceNumber
    };
  };

  Grievance.prototype.assignTo = async function(assigneeId, departmentId, userId) {
    this.assignedTo = assigneeId;
    this.assignedDepartment = departmentId;
    
    if (this.status === 'submitted') {
      this.status = 'acknowledged';
    }
    
    await this.save({ userId });
    
    // Create assignment record
    const Assignment = require('./Assignment')(sequelize, DataTypes);
    await Assignment.create({
      grievanceId: this.id,
      assignedTo: assigneeId,
      assignedBy: userId,
      department: departmentId
    });
  };

  // Class methods
  Grievance.findByGrievanceNumber = function(grievanceNumber) {
    return this.findOne({
      where: { grievanceNumber },
      include: [
        { association: 'category' },
        { association: 'statusHistory', order: [['createdAt', 'DESC']] },
        { association: 'attachments' },
        { association: 'assignments' }
      ]
    });
  };

  Grievance.getStatsByWard = function(ward, startDate, endDate) {
    return this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        ward,
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      group: ['status']
    });
  };

  return Grievance;
};
