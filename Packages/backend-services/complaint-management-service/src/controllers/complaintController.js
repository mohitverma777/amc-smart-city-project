// packages/backend-services/complaint-management-service/src/controllers/complaintController.js
const {
  Complaint,
  ComplaintComment,
  ComplaintAttachment,
  ComplaintAssignment,
  sequelize
} = require('../models');
const path = require('path');
const fs = require('fs').promises;
const { Op } = require('sequelize');
const crypto = require('crypto');

// ✅ Helper function to convert MongoDB ObjectId to UUID
const mongoIdToUuid = (mongoId) => {
  if (!mongoId) return null;
  
  // Check if it's already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(mongoId)) {
    return mongoId;
  }
  
  // Convert MongoDB ObjectId to deterministic UUID
  const hash = crypto.createHash('md5').update(mongoId.toString()).digest('hex');
  return `${hash.substr(0,8)}-${hash.substr(8,4)}-${hash.substr(12,4)}-${hash.substr(16,4)}-${hash.substr(20,12)}`;
};

// Helper function to generate complaint number
const generateComplaintNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `CMP${year}${month}${day}${timestamp}`;
};

// Helper function to calculate expected resolution date
const calculateExpectedResolutionDate = (priority) => {
  const days = {
    'Critical': 1,
    'High': 3,
    'Medium': 7,
    'Low': 15
  };
  const resolutionDate = new Date();
  resolutionDate.setDate(resolutionDate.getDate() + (days[priority] || 7));
  return resolutionDate;
};

class ComplaintController {
  // File a new complaint
  async fileComplaint(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const {
        title,
        description,
        category,
        subCategory,
        priority = 'Medium',
        address,
        ward,
        landmark,
        coordinates,
        isAnonymous = false,
        tags = []
      } = req.body;

      // ✅ Get user ID and convert if it's MongoDB ObjectId
      const rawCitizenId = req.user?.citizenId || req.user?.id;
      const citizenId = mongoIdToUuid(rawCitizenId);
      const citizenName = req.user?.name || 'Anonymous';
      const citizenEmail = req.user?.email;
      const citizenMobile = req.user?.mobile;

      console.log(`✅ Converted citizenId: ${rawCitizenId} -> ${citizenId}`);

      // Generate complaint number explicitly
      const complaintNumber = generateComplaintNumber();
      const expectedResolutionDate = calculateExpectedResolutionDate(priority);

      const complaint = await Complaint.create({
        complaintNumber,
        expectedResolutionDate,
        citizenId,
        citizenName: isAnonymous ? null : citizenName,
        citizenEmail: isAnonymous ? null : citizenEmail,
        citizenMobile: isAnonymous ? null : citizenMobile,
        title,
        description,
        category,
        subCategory,
        priority,
        address,
        ward,
        landmark,
        coordinates: coordinates ? JSON.parse(coordinates) : null,
        isAnonymous,
        tags: Array.isArray(tags) ? tags : (tags ? [tags] : [])
      }, { transaction });

      if (req.files && req.files.length > 0) {
        await Promise.all(
          req.files.map(file =>
            ComplaintAttachment.create({
              complaintId: complaint.id,
              fileName: file.filename,
              originalName: file.originalname,
              filePath: file.path,
              fileSize: file.size,
              mimeType: file.mimetype,
              uploadedBy: citizenId,
              uploadedByName: citizenName
            }, { transaction })
          )
        );
      }

      await transaction.commit();

      const completeComplaint = await Complaint.findByPk(complaint.id, {
        include: [
          { model: ComplaintComment, as: 'comments' },
          { model: ComplaintAttachment, as: 'attachments' },
          { model: ComplaintAssignment, as: 'assignments' }
        ]
      });

      res.status(201).json({
        status: 'success',
        message: 'Complaint filed successfully',
        data: { complaint: completeComplaint }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error filing complaint:', error);
      
      if (req.files) {
        for (const file of req.files) {
          try { await fs.unlink(file.path); } catch (_) { }
        }
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to file complaint',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get my complaints (citizen)
  async getMyComplaints(req, res) {
    try {
      const rawCitizenId = req.user?.citizenId || req.user?.id;
      const citizenId = mongoIdToUuid(rawCitizenId);
      
      const { page = 1, limit = 10, status, category, priority } = req.query;
      const offset = (page - 1) * limit;
      const where = { citizenId };
      
      if (status) where.status = status;
      if (category) where.category = category;
      if (priority) where.priority = priority;

      const { count, rows: complaints } = await Complaint.findAndCountAll({
        where,
        include: [
          { 
            model: ComplaintComment, 
            as: 'comments', 
            where: { isInternal: false }, 
            required: false 
          },
          { model: ComplaintAttachment, as: 'attachments' }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        status: 'success',
        data: {
          complaints,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalCount: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Error fetching my complaints:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch complaints',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get all complaints (admin/officer)
  async getAllComplaints(req, res) {
    try {
      const {
        page = 1, 
        limit = 10,
        status, 
        category, 
        priority, 
        department, 
        ward, 
        zone, 
        assignedTo, 
        search, 
        startDate, 
        endDate
      } = req.query;
      
      const offset = (page - 1) * limit;
      const where = {};
      
      if (status) where.status = status;
      if (category) where.category = category;
      if (priority) where.priority = priority;
      if (department) where.department = department;
      if (ward) where.ward = ward;
      if (zone) where.zone = zone;
      if (assignedTo) where.assignedTo = mongoIdToUuid(assignedTo);
      
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { complaintNumber: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      const { count, rows: complaints } = await Complaint.findAndCountAll({
        where,
        include: [
          { model: ComplaintComment, as: 'comments' },
          { model: ComplaintAttachment, as: 'attachments' },
          { model: ComplaintAssignment, as: 'assignments' }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        status: 'success',
        data: {
          complaints,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalCount: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Error fetching all complaints:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch complaints',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // ✅ Get single complaint by ID or complaint number (FIXED)
  async getComplaint(req, res) {
    try {
      const { identifier } = req.params;
      let complaint = null;

      const includeOptions = [
        { 
          model: ComplaintComment, 
          as: 'comments', 
          order: [['createdAt', 'ASC']] 
        },
        { model: ComplaintAttachment, as: 'attachments' },
        { model: ComplaintAssignment, as: 'assignments' }
      ];

      // ✅ If identifier starts with 'CMP', search by complaintNumber FIRST
      if (identifier.startsWith('CMP')) {
        complaint = await Complaint.findOne({
          where: { complaintNumber: identifier },
          include: includeOptions
        });
      } else {
        // Otherwise treat as UUID
        complaint = await Complaint.findByPk(identifier, {
          include: includeOptions
        });
      }
      
      if (!complaint) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Complaint not found' 
        });
      }
      
      // Check access permissions for citizens
      const userRole = req.user?.role;
      const rawCitizenId = req.user?.citizenId || req.user?.id;
      const citizenId = mongoIdToUuid(rawCitizenId);
      
      if (userRole === 'citizen' && complaint.citizenId !== citizenId) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'Access denied' 
        });
      }
      
      res.json({ 
        status: 'success', 
        data: { complaint } 
      });
    } catch (error) {
      console.error('❌ Error fetching complaint:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch complaint',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update complaint status
  async updateComplaintStatus(req, res) {
    try {
      const { id } = req.params;
      const { 
        status, 
        statusReason, 
        resolutionSummary, 
        resolutionCost 
      } = req.body;
      
      const rawUpdatedBy = req.user?.employeeId || req.user?.id;
      const updatedBy = mongoIdToUuid(rawUpdatedBy);
      const updatedByName = req.user?.name;
      
      const complaint = await Complaint.findByPk(id);
      if (!complaint) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Complaint not found' 
        });
      }
      
      const updateData = { 
        status, 
        statusReason, 
        resolutionSummary, 
        resolutionCost 
      };
      const now = new Date();
      
      switch (status) {
        case 'Acknowledged': 
          updateData.acknowledgedAt = now; 
          break;
        case 'In Progress': 
          updateData.inProgressAt = now; 
          break;
        case 'Resolved': 
          updateData.resolvedAt = now; 
          updateData.actualResolutionDate = now; 
          break;
        case 'Closed': 
          updateData.closedAt = now; 
          if (!complaint.actualResolutionDate) {
            updateData.actualResolutionDate = now;
          }
          break;
      }
      
      await complaint.update(updateData);
      
      // Add status change comment
      await ComplaintComment.create({
        complaintId: id,
        userId: updatedBy,
        userName: updatedByName || 'System',
        userRole: req.user?.role || 'officer',
        comment: `Status updated to: ${status}${statusReason ? '. Reason: ' + statusReason : ''}`,
        isInternal: false
      });
      
      res.json({
        status: 'success',
        message: 'Complaint status updated successfully',
        data: {
          complaint: await Complaint.findByPk(id, {
            include: [
              { model: ComplaintComment, as: 'comments' },
              { model: ComplaintAttachment, as: 'attachments' },
              { model: ComplaintAssignment, as: 'assignments' }
            ]
          })
        }
      });
    } catch (error) {
      console.error('❌ Error updating complaint status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update complaint status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Add comment to complaint
  async addComment(req, res) {
    try {
      const { id } = req.params;
      const { comment, isInternal = false } = req.body;
      
      const rawUserId = req.user?.employeeId || req.user?.citizenId || req.user?.id;
      const userId = mongoIdToUuid(rawUserId);
      const userName = req.user?.name || 'User';
      const userRole = req.user?.role || 'citizen';
      
      const complaint = await Complaint.findByPk(id);
      if (!complaint) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Complaint not found' 
        });
      }
      
      if (isInternal && userRole === 'citizen') {
        return res.status(403).json({ 
          status: 'error', 
          message: 'Citizens cannot add internal comments' 
        });
      }
      
      const newComment = await ComplaintComment.create({ 
        complaintId: id, 
        userId, 
        userName, 
        userRole, 
        comment, 
        isInternal 
      });
      
      await complaint.update({ 
        lastContactDate: new Date(), 
        contactCount: complaint.contactCount + 1 
      });
      
      res.status(201).json({ 
        status: 'success', 
        message: 'Comment added successfully', 
        data: { comment: newComment } 
      });
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to add comment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get complaint statistics
  async getComplaintStatistics(req, res) {
    try {
      const [
        totalComplaints, 
        pendingComplaints, 
        inProgressComplaints, 
        resolvedComplaints, 
        overdueComplaints, 
        categoryStats, 
        priorityStats
      ] = await Promise.all([
        Complaint.count(),
        Complaint.count({ where: { status: 'Pending' } }),
        Complaint.count({ where: { status: 'In Progress' } }),
        Complaint.count({ where: { status: 'Resolved' } }),
        Complaint.count({
          where: {
            status: { [Op.notIn]: ['Resolved', 'Closed'] },
            expectedResolutionDate: { [Op.lt]: new Date() }
          }
        }),
        Complaint.findAll({ 
          attributes: [
            'category', 
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ], 
          group: 'category' 
        }),
        Complaint.findAll({ 
          attributes: [
            'priority', 
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ], 
          group: 'priority' 
        })
      ]);
      
      res.json({
        status: 'success',
        data: {
          overview: {
            total: totalComplaints,
            pending: pendingComplaints,
            inProgress: inProgressComplaints,
            resolved: resolvedComplaints,
            overdue: overdueComplaints,
            resolutionRate: totalComplaints > 0 
              ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) 
              : 0
          },
          categoryBreakdown: categoryStats.map(stat => ({ 
            category: stat.category, 
            count: parseInt(stat.dataValues.count) 
          })),
          priorityBreakdown: priorityStats.map(stat => ({ 
            priority: stat.priority, 
            count: parseInt(stat.dataValues.count) 
          }))
        }
      });
    } catch (error) {
      console.error('❌ Error generating statistics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get complaint categories
  async getComplaintCategories(req, res) {
    try {
      const categories = [
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
      ];
      
      res.json({ 
        status: 'success', 
        data: { categories } 
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch categories',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Download attachment
  async downloadAttachment(req, res) {
    try {
      const { attachmentId } = req.params;
      const attachment = await ComplaintAttachment.findByPk(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Attachment not found' 
        });
      }
      
      const filePath = path.resolve(attachment.filePath);
      
      try { 
        await fs.access(filePath); 
      } catch { 
        return res.status(404).json({ 
          status: 'error', 
          message: 'File not found on server' 
        }); 
      }
      
      res.download(filePath, attachment.originalName);
    } catch (error) {
      console.error('❌ Error downloading attachment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to download attachment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new ComplaintController();
