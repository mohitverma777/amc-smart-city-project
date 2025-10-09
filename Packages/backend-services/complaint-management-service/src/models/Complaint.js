module.exports = (sequelize, DataTypes) => {
  const Complaint = sequelize.define('Complaint', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    complaintNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    citizenId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to citizen who filed complaint'
    },
    citizenName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    citizenEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    citizenMobile: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        'Water Supply',
        'Electricity',
        'Waste Management',
        'Road & Infrastructure',
        'Street Lighting',
        'Drainage',
        'Public Health',
        'Traffic Management',
        'Property Tax',
        'Birth Certificate',
        'Death Certificate',
        'Other'
      ),
      allowNull: false,
    },
    subCategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      defaultValue: 'Medium',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ward: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    zone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    landmark: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    coordinates: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Latitude and longitude coordinates'
    },
    status: {
      type: DataTypes.ENUM(
        'Pending',
        'Acknowledged',
        'In Progress',
        'Under Review',
        'Resolved',
        'Closed',
        'Rejected',
        'Reopened'
      ),
      defaultValue: 'Pending',
    },
    statusReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assignedTo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Employee ID of assigned officer'
    },
    assignedBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Employee ID who assigned the complaint'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    inProgressAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expectedResolutionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualResolutionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    citizenRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    citizenFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    feedbackDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolutionSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolutionCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isUrgent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    publicVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    escalationLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    escalatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastContactDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contactCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    }
  }, {
    tableName: 'complaints',
    timestamps: true,
    indexes: [
      { fields: ['complaintNumber'] },
      { fields: ['citizenId'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['priority'] },
      { fields: ['assignedTo'] },
      { fields: ['createdAt'] },
      { fields: ['ward'] },
      { fields: ['zone'] }
    ]
  });

  // Static method to generate complaint number
  Complaint.generateComplaintNumber = function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `CMP${year}${month}${day}${timestamp}`;
  };

  // Hook to auto-generate complaintNumber before creating
  Complaint.beforeCreate(async (complaint, options) => {
    if (!complaint.complaintNumber) {
      complaint.complaintNumber = Complaint.generateComplaintNumber();
    }
    if (!complaint.expectedResolutionDate) {
      const days = {
        'Critical': 1,
        'High': 3,
        'Medium': 7,
        'Low': 15
      };
      const resolutionDate = new Date();
      resolutionDate.setDate(resolutionDate.getDate() + (days[complaint.priority] || 7));
      complaint.expectedResolutionDate = resolutionDate;
    }
  });

  return Complaint;
};
