// Packages/backend-services/grievance-service/src/controllers/grievanceController.js
const { Grievance, Category, StatusHistory, Attachment, sequelize } = require('../models');
const grievanceService = require('../services/grievanceService');
const fileUploadService = require('../services/fileUploadService');
const notificationService = require('../services/notificationService');
const logger = require('@amc/shared/utils/logger');
const { catchAsync } = require('@amc/shared/middleware/errorHandler');
const { Op } = require('sequelize');

class GrievanceController {
  // Create new grievance
  createGrievance = catchAsync(async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        title,
        description,
        categoryId,
        subCategory,
        priority,
        location,
        address,
        contactEmail,
        contactPhone,
        isPublic
      } = req.body;

      // Validate category exists
      const category = await Category.findByPk(categoryId);
      if (!category || !category.isActive) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or inactive category',
          code: 'INVALID_CATEGORY'
        });
      }

      // Create grievance
      const grievanceData = {
        citizenId: req.user.citizenId,
        title,
        description,
        categoryId,
        subCategory,
        priority: priority || category.priority,
        location,
        address,
        ward: req.user.ward, // From authenticated user
        contactEmail: contactEmail || req.user.email,
        contactPhone: contactPhone || req.user.mobileNumber,
        isPublic: isPublic !== undefined ? isPublic : true
      };

      const grievance = await Grievance.create(grievanceData, { transaction });

      // Handle file uploads
      if (req.files && req.files.length > 0) {
        const attachments = await fileUploadService.uploadGrievanceFiles(
          req.files,
          grievance.id,
          req.user.id
        );

        for (const attachment of attachments) {
          await Attachment.create({
            grievanceId: grievance.id,
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            filePath: attachment.filePath,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
            fileType: attachment.fileType,
            uploadedBy: req.user.id
          }, { transaction });
        }
      }

      // Create initial status history
      await StatusHistory.create({
        grievanceId: grievance.id,
        status: 'submitted',
        updatedBy: req.user.id,
        comment: 'Grievance submitted by citizen',
        isSystemGenerated: true
      }, { transaction });

      await transaction.commit();

      // Load complete grievance with associations
      const completeGrievance = await Grievance.findByPk(grievance.id, {
        include: [
          { association: 'category' },
          { association: 'statusHistory' },
          { association: 'attachments' }
        ]
      });

      // Send notifications
      try {
        await notificationService.sendGrievanceSubmissionNotification(
          req.user.id,
          completeGrievance
        );
        
        // Notify relevant department
        await notificationService.notifyDepartmentNewGrievance(
          category.department,
          completeGrievance
        );
      } catch (notificationError) {
        logger.error('Failed to send notifications:', notificationError);
      }

      // Auto-assign based on category and ward
      try {
        await grievanceService.autoAssignGrievance(grievance.id);
      } catch (assignmentError) {
        logger.error('Auto-assignment failed:', assignmentError);
      }

      res.status(201).json({
        status: 'success',
        message: 'Grievance submitted successfully',
        data: {
          grievance: completeGrievance,
          grievanceNumber: grievance.grievanceNumber
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Get grievances for authenticated user
  getMyGrievances = catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { citizenId: req.user.citizenId };

    // Apply filters
    if (status) {
      where.status = status;
    }
    
    if (category) {
      where.categoryId = category;
    }
    
    if (priority) {
      where.priority = priority;
    }

    const { count, rows } = await Grievance.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [
        { association: 'category' },
        { 
          association: 'statusHistory',
          limit: 1,
          order: [['createdAt', 'DESC']]
        },
        { association: 'attachments' }
      ]
    });

    res.json({
      status: 'success',
      data: {
        grievances: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalCount: count,
          limit: parseInt(limit)
        }
      }
    });
  });

  // Get single grievance by ID or grievance number
  getGrievance = catchAsync(async (req, res) => {
    const { identifier } = req.params;
    
    let grievance;
    
    // Check if identifier is UUID or grievance number
    if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      grievance = await Grievance.findByPk(identifier, {
        include: [
          { association: 'category' },
          { 
            association: 'statusHistory',
            order: [['createdAt', 'DESC']]
          },
          { association: 'attachments' },
          { association: 'assignments' }
        ]
      });
    } else {
      grievance = await Grievance.findByGrievanceNumber(identifier);
    }

    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found',
        code: 'GRIEVANCE_NOT_FOUND'
      });
    }

    // Check access permissions
    const isOwner = grievance.citizenId === req.user.citizenId;
    const isOfficer = ['officer', 'admin'].includes(req.user.role);
    const isPublic = grievance.isPublic;

    if (!isOwner && !isOfficer && !isPublic) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this grievance',
        code: 'ACCESS_DENIED'
      });
    }

    // Increment view count
    await grievance.increment('viewCount');

    res.json({
      status: 'success',
      data: { grievance }
    });
  });

  // Update grievance (only by owner or officer)
  updateGrievance = catchAsync(async (req, res) => {
    const { id } = req.params;
    const {
      title,
      description,
      categoryId,
      subCategory,
      priority,
      location,
      address,
      contactEmail,
      contactPhone
    } = req.body;

    const grievance = await Grievance.findByPk(id);
    
    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found',
        code: 'GRIEVANCE_NOT_FOUND'
      });
    }

    // Check permissions
    const isOwner = grievance.citizenId === req.user.citizenId;
    const isOfficer = ['officer', 'admin'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Citizens can only update if status is 'submitted' or 'pending_info'
    if (isOwner && !['submitted', 'pending_info'].includes(grievance.status)) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot update grievance in current status',
        code: 'UPDATE_NOT_ALLOWED'
      });
    }

    // Validate category if being updated
    if (categoryId && categoryId !== grievance.categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category || !category.isActive) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid category',
          code: 'INVALID_CATEGORY'
        });
      }
    }

    // Update grievance
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (subCategory !== undefined) updateData.subCategory = subCategory;
    if (priority !== undefined) updateData.priority = priority;
    if (location !== undefined) updateData.location = location;
    if (address !== undefined) updateData.address = address;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;

    await grievance.update(updateData);

    // Create status history entry for the update
    await StatusHistory.create({
      grievanceId: grievance.id,
      status: grievance.status,
      updatedBy: req.user.id,
      comment: 'Grievance updated',
      isSystemGenerated: false
    });

    const updatedGrievance = await Grievance.findByPk(grievance.id, {
      include: [
        { association: 'category' },
        { association: 'statusHistory' },
        { association: 'attachments' }
      ]
    });

    res.json({
      status: 'success',
      message: 'Grievance updated successfully',
      data: { grievance: updatedGrievance }
    });
  });

  // Update grievance status (officers only)
  updateStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, comment, assignTo, department } = req.body;

    // Check officer permissions
    if (!['officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only officers can update grievance status',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const grievance = await Grievance.findByPk(id, {
      include: [{ association: 'category' }]
    });

    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found',
        code: 'GRIEVANCE_NOT_FOUND'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Update status
      const statusUpdate = await grievance.updateStatus(status, req.user.id, comment);

      // Handle assignment if provided
      if (assignTo) {
        await grievance.assignTo(assignTo, department, req.user.id);
      }

      await transaction.commit();

      // Send notifications
      try {
        await notificationService.sendStatusUpdateNotification(
          grievance.citizenId,
          grievance,
          statusUpdate
        );
      } catch (notificationError) {
        logger.error('Failed to send status update notification:', notificationError);
      }

      const updatedGrievance = await Grievance.findByPk(grievance.id, {
        include: [
          { association: 'category' },
          { association: 'statusHistory' },
          { association: 'assignments' }
        ]
      });

      res.json({
        status: 'success',
        message: 'Grievance status updated successfully',
        data: { grievance: updatedGrievance }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  // Get grievances for officers (with filtering)
  getGrievancesForOfficers = catchAsync(async (req, res) => {
    // Check officer permissions
    if (!['officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const {
      page = 1,
      limit = 20,
      status,
      category,
      priority,
      ward,
      assignedTo,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (priority) where.priority = priority;
    if (ward) where.ward = ward;
    if (assignedTo) where.assignedTo = assignedTo;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    const { count, rows } = await Grievance.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [
        { association: 'category' },
        { 
          association: 'statusHistory',
          limit: 1,
          order: [['createdAt', 'DESC']]
        },
        { association: 'attachments' }
      ]
    });

    res.json({
      status: 'success',
      data: {
        grievances: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalCount: count,
          limit: parseInt(limit)
        }
      }
    });
  });

  // Get grievance statistics
  getStatistics = catchAsync(async (req, res) => {
    const { ward, dateFrom, dateTo } = req.query;
    
    const where = {};
    if (ward) where.ward = ward;
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    const [
      totalCount,
      statusStats,
      priorityStats,
      categoryStats,
      wardStats
    ] = await Promise.all([
      Grievance.count({ where }),
      
      Grievance.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['status']
      }),
      
      Grievance.findAll({
        attributes: [
          'priority',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['priority']
      }),
      
      Grievance.findAll({
        attributes: [
          [sequelize.col('category.name'), 'categoryName'],
          [sequelize.fn('COUNT', sequelize.col('Grievance.id')), 'count']
        ],
        where,
        include: [{ association: 'category', attributes: [] }],
        group: ['category.id', 'category.name']
      }),
      
      Grievance.findAll({
        attributes: [
          'ward',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['ward']
      })
    ]);

    res.json({
      status: 'success',
      data: {
        totalCount,
        byStatus: statusStats,
        byPriority: priorityStats,
        byCategory: categoryStats,
        byWard: wardStats
      }
    });
  });

  // Add citizen feedback
  addFeedback = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const grievance = await Grievance.findByPk(id);
    
    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found',
        code: 'GRIEVANCE_NOT_FOUND'
      });
    }

    // Check if user is the owner
    if (grievance.citizenId !== req.user.citizenId) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only provide feedback for your own grievances',
        code: 'ACCESS_DENIED'
      });
    }

    // Check if grievance is resolved
    if (!['resolved', 'closed'].includes(grievance.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Feedback can only be provided for resolved or closed grievances',
        code: 'INVALID_STATUS_FOR_FEEDBACK'
      });
    }

    const feedback = {
      rating: parseInt(rating),
      comment,
      submittedAt: new Date(),
      submittedBy: req.user.id
    };

    await grievance.update({
      citizenFeedback: feedback
    });

    res.json({
      status: 'success',
      message: 'Feedback submitted successfully',
      data: { feedback }
    });
  });
}

module.exports = new GrievanceController();
