// Packages/backend-services/grievance-service/src/services/grievanceService.js
const { Grievance, Category, Assignment, sequelize } = require('../models');
const notificationService = require('./notificationService');
const logger = require('@amc/shared/utils/logger');

class GrievanceService {
  // Auto-assign grievance based on category and ward
  async autoAssignGrievance(grievanceId) {
    try {
      const grievance = await Grievance.findByPk(grievanceId, {
        include: [{ association: 'category' }]
      });

      if (!grievance) {
        throw new Error('Grievance not found');
      }

      // Get assignment rules based on category and ward
      const assignmentRule = await this.getAssignmentRule(
        grievance.categoryId,
        grievance.ward
      );

      if (assignmentRule) {
        await grievance.assignTo(
          assignmentRule.officerId,
          assignmentRule.department,
          'system'
        );

        logger.info('Grievance auto-assigned', {
          grievanceId,
          assignedTo: assignmentRule.officerId,
          department: assignmentRule.department
        });

        return assignmentRule;
      }

      logger.warn('No assignment rule found for grievance', {
        grievanceId,
        categoryId: grievance.categoryId,
        ward: grievance.ward
      });

      return null;
    } catch (error) {
      logger.error('Auto-assignment failed:', error);
      throw error;
    }
  }

  // Get assignment rule based on category and ward
  async getAssignmentRule(categoryId, ward) {
    // This would typically query an assignment_rules table
    // For now, implementing basic logic based on category
    
    const category = await Category.findByPk(categoryId);
    if (!category) return null;

    // Simple assignment logic - in production, this would be more sophisticated
    const departmentOfficers = {
      'Public Works': 'officer_public_works_001',
      'Water Department': 'officer_water_001',
      'Sanitation': 'officer_sanitation_001',
      'Electrical': 'officer_electrical_001'
    };

    const officerId = departmentOfficers[category.department];
    
    if (officerId) {
      return {
        officerId,
        department: category.department,
        reason: 'Auto-assigned based on category'
      };
    }

    return null;
  }

  // Escalate grievance if SLA is breached
  async checkAndEscalateGrievances() {
    try {
      const overduedGrievances = await Grievance.findAll({
        where: {
          status: ['submitted', 'acknowledged', 'in_progress'],
          expectedResolutionDate: {
            [sequelize.Op.lt]: new Date()
          }
        },
        include: [{ association: 'category' }]
      });

      for (const grievance of overduedGrievances) {
        await this.escalateGrievance(grievance);
      }

      logger.info(`Escalated ${overduedGrievances.length} overdue grievances`);
      return overduedGrievances.length;
    } catch (error) {
      logger.error('Escalation process failed:', error);
      throw error;
    }
  }

  // Escalate individual grievance
  async escalateGrievance(grievance) {
    try {
      // Mark as urgent if not already
      if (!grievance.isUrgent) {
        await grievance.update({ 
          isUrgent: true,
          priority: 'urgent'
        });
      }

      // Notify senior officials
      await notificationService.sendEscalationNotification(grievance);

      // Create escalation assignment
      await Assignment.create({
        grievanceId: grievance.id,
        assignedTo: 'senior_officer_' + grievance.ward,
        assignedBy: 'system',
        assignmentType: 'escalated',
        notes: 'Auto-escalated due to SLA breach'
      });

      logger.info('Grievance escalated', {
        grievanceId: grievance.id,
        grievanceNumber: grievance.grievanceNumber
      });
    } catch (error) {
      logger.error('Failed to escalate grievance:', error);
      throw error;
    }
  }

  // Get grievance analytics
  async getAnalytics(filters = {}) {
    try {
      const { ward, startDate, endDate, category } = filters;
      
      const where = {};
      if (ward) where.ward = ward;
      if (category) where.categoryId = category;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[sequelize.Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[sequelize.Op.lte] = new Date(endDate);
      }

      const [
        totalCount,
        resolvedCount,
        avgResolutionTime,
        statusDistribution,
        priorityDistribution,
        categoryDistribution
      ] = await Promise.all([
        Grievance.count({ where }),
        
        Grievance.count({ 
          where: { ...where, status: 'resolved' }
        }),
        
        Grievance.findAll({
          attributes: [
            [
              sequelize.fn('AVG', 
                sequelize.literal('EXTRACT(epoch FROM ("actualResolutionDate" - "createdAt")) / 3600')
              ), 
              'avgHours'
            ]
          ],
          where: { 
            ...where, 
            status: 'resolved',
            actualResolutionDate: { [sequelize.Op.ne]: null }
          }
        }),
        
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
        })
      ]);

      const resolutionRate = totalCount > 0 ? (resolvedCount / totalCount * 100) : 0;
      const avgResolutionHours = avgResolutionTime[0]?.get('avgHours') || 0;

      return {
        summary: {
          totalGrievances: totalCount,
          resolvedGrievances: resolvedCount,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          avgResolutionTimeHours: Math.round(avgResolutionHours * 100) / 100
        },
        distributions: {
          byStatus: statusDistribution,
          byPriority: priorityDistribution,
          byCategory: categoryDistribution
        }
      };
    } catch (error) {
      logger.error('Analytics generation failed:', error);
      throw error;
    }
  }

  // Generate reports
  async generateReport(type, filters = {}) {
    try {
      switch (type) {
        case 'daily':
          return await this.generateDailyReport(filters);
        case 'weekly':
          return await this.generateWeeklyReport(filters);
        case 'monthly':
          return await this.generateMonthlyReport(filters);
        default:
          throw new Error('Invalid report type');
      }
    } catch (error) {
      logger.error('Report generation failed:', error);
      throw error;
    }
  }

  // Generate daily report
  async generateDailyReport(filters) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reportFilters = {
      ...filters,
      startDate: today,
      endDate: tomorrow
    };

    const analytics = await this.getAnalytics(reportFilters);
    
    return {
      reportType: 'daily',
      reportDate: today.toISOString().split('T')[0],
      ...analytics
    };
  }

  // Bulk update grievances
  async bulkUpdateGrievances(grievanceIds, updateData, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const results = [];
      
      for (const grievanceId of grievanceIds) {
        const grievance = await Grievance.findByPk(grievanceId, { transaction });
        
        if (grievance) {
          await grievance.update(updateData, { 
            transaction,
            userId 
          });
          results.push({ id: grievanceId, status: 'updated' });
        } else {
          results.push({ id: grievanceId, status: 'not_found' });
        }
      }
      
      await transaction.commit();
      
      logger.info('Bulk update completed', {
        updatedCount: results.filter(r => r.status === 'updated').length,
        notFoundCount: results.filter(r => r.status === 'not_found').length,
        userId
      });
      
      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new GrievanceService();
