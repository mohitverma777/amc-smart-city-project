// Packages/backend-services/grievance-service/src/controllers/categoryController.js
const { Category, Grievance, sequelize } = require('../models');
const { catchAsync } = require('@amc/shared/middleware/errorHandler');
const logger = require('@amc/shared/utils/logger');

class CategoryController {
  // Get all active categories
  getCategories = catchAsync(async (req, res) => {
    const categories = await Category.getActiveCategories();
    
    res.json({
      status: 'success',
      data: { categories }
    });
  });

  // Get category hierarchy
  getCategoryHierarchy = catchAsync(async (req, res) => {
    const hierarchy = await Category.getHierarchy();
    
    res.json({
      status: 'success',
      data: { hierarchy }
    });
  });

  // Create new category (admin only)
  createCategory = catchAsync(async (req, res) => {
    const {
      name,
      description,
      icon,
      color,
      parentCategoryId,
      department,
      slaHours,
      priority,
      sortOrder
    } = req.body;

    // Check if parent category exists (if provided)
    if (parentCategoryId) {
      const parentCategory = await Category.findByPk(parentCategoryId);
      if (!parentCategory) {
        return res.status(400).json({
          status: 'error',
          message: 'Parent category not found',
          code: 'PARENT_CATEGORY_NOT_FOUND'
        });
      }
    }

    const category = await Category.create({
      name,
      description,
      icon,
      color,
      parentCategoryId,
      department,
      slaHours,
      priority,
      sortOrder
    });

    logger.info('Category created', {
      categoryId: category.id,
      name: category.name,
      createdBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: { category }
    });
  });

  // Update category (admin only)
  updateCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Validate parent category if being updated
    if (updateData.parentCategoryId && updateData.parentCategoryId !== category.parentCategoryId) {
      const parentCategory = await Category.findByPk(updateData.parentCategoryId);
      if (!parentCategory) {
        return res.status(400).json({
          status: 'error',
          message: 'Parent category not found',
          code: 'PARENT_CATEGORY_NOT_FOUND'
        });
      }

      // Prevent circular reference
      if (updateData.parentCategoryId === category.id) {
        return res.status(400).json({
          status: 'error',
          message: 'Category cannot be its own parent',
          code: 'CIRCULAR_REFERENCE'
        });
      }
    }

    await category.update(updateData);

    logger.info('Category updated', {
      categoryId: category.id,
      name: category.name,
      updatedBy: req.user.id
    });

    res.json({
      status: 'success',
      message: 'Category updated successfully',
      data: { category }
    });
  });

  // Delete category (admin only)
  deleteCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Check if category has grievances
    const grievanceCount = await Grievance.count({
      where: { categoryId: id }
    });

    if (grievanceCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete category with existing grievances',
        code: 'CATEGORY_HAS_GRIEVANCES',
        data: { grievanceCount }
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.count({
      where: { parentCategoryId: id }
    });

    if (subcategoryCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete category with subcategories',
        code: 'CATEGORY_HAS_SUBCATEGORIES',
        data: { subcategoryCount }
      });
    }

    await category.destroy();

    logger.info('Category deleted', {
      categoryId: id,
      name: category.name,
      deletedBy: req.user.id
    });

    res.json({
      status: 'success',
      message: 'Category deleted successfully'
    });
  });

  // Get category statistics
  getCategoryStatistics = catchAsync(async (req, res) => {
    const stats = await Category.findAll({
      attributes: [
        'id',
        'name',
        [sequelize.fn('COUNT', sequelize.col('Grievances.id')), 'grievanceCount']
      ],
      include: [{
        model: Grievance,
        attributes: [],
        required: false
      }],
      group: ['Category.id', 'Category.name'],
      order: [[sequelize.literal('grievanceCount'), 'DESC']]
    });

    res.json({
      status: 'success',
      data: { statistics: stats }
    });
  });
}

module.exports = new CategoryController();
