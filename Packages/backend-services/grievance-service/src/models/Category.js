// Packages/backend-services/grievance-service/src/models/Category.js
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    color: {
      type: DataTypes.STRING(7), // For hex color codes
      allowNull: true,
      validate: {
        is: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      }
    },
    
    parentCategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    slaHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 168, // 7 days default
      validate: {
        min: 1,
        max: 8760 // 1 year max
      }
    },
    
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'grievance_categories',
    timestamps: true,
    indexes: [
      {
        fields: ['name'],
        unique: true
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['parentCategoryId']
      },
      {
        fields: ['department']
      },
      {
        fields: ['sortOrder']
      }
    ]
  });

  // Self-referencing association for subcategories
  Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parentCategoryId' });
  Category.belongsTo(Category, { as: 'parentCategory', foreignKey: 'parentCategoryId' });

  // Instance methods
  Category.prototype.getFullPath = async function() {
    const path = [this.name];
    let current = this;
    
    while (current.parentCategoryId) {
      const parent = await Category.findByPk(current.parentCategoryId);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    
    return path.join(' > ');
  };

  // Class methods
  Category.getActiveCategories = function() {
    return this.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      include: [{
        model: Category,
        as: 'subcategories',
        where: { isActive: true },
        required: false,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      }]
    });
  };

  Category.getHierarchy = function() {
    return this.findAll({
      where: {
        isActive: true,
        parentCategoryId: null
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      include: [{
        model: Category,
        as: 'subcategories',
        where: { isActive: true },
        required: false,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      }]
    });
  };

  return Category;
};
