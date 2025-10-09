const axios = require('axios');

class NotificationService {
  constructor() {
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007';
    this.isEnabled = process.env.NODE_ENV !== 'test';
  }

  // Send notification when complaint is filed
  async notifyComplaintFiled(complaint) {
    if (!this.isEnabled) return;

    try {
      console.log(`í³¬ Sending complaint filed notification for: ${complaint.complaintNumber}`);

      const notificationData = {
        type: 'complaint_filed',
        recipients: [
          {
            type: 'citizen',
            identifier: complaint.citizenId,
            email: complaint.citizenEmail,
            mobile: complaint.citizenMobile
          }
        ],
        data: {
          complaintNumber: complaint.complaintNumber,
          title: complaint.title,
          category: complaint.category,
          priority: complaint.priority,
          expectedResolutionDate: complaint.expectedResolutionDate
        },
        templates: {
          sms: 'complaint_filed_sms',
          email: 'complaint_filed_email',
          push: 'complaint_filed_push'
        }
      };

      await this.sendNotification(notificationData);
      console.log(`âœ… Complaint filed notification sent for ${complaint.complaintNumber}`);

    } catch (error) {
      console.error('âŒ Failed to send complaint filed notification:', error);
    }
  }

  // Send notification when complaint status is updated
  async notifyStatusUpdate(complaint, updatedBy) {
    if (!this.isEnabled) return;

    try {
      console.log(`í³¬ Sending status update notification for: ${complaint.complaintNumber}`);

      const notificationData = {
        type: 'complaint_status_update',
        recipients: [
          {
            type: 'citizen',
            identifier: complaint.citizenId,
            email: complaint.citizenEmail,
            mobile: complaint.citizenMobile
          }
        ],
        data: {
          complaintNumber: complaint.complaintNumber,
          title: complaint.title,
          newStatus: complaint.status,
          statusReason: complaint.statusReason,
          updatedBy: updatedBy.name || 'System',
          updatedAt: new Date().toISOString()
        },
        templates: {
          sms: 'complaint_status_update_sms',
          email: 'complaint_status_update_email',
          push: 'complaint_status_update_push'
        }
      };

      await this.sendNotification(notificationData);
      console.log(`âœ… Status update notification sent for ${complaint.complaintNumber}`);

    } catch (error) {
      console.error('âŒ Failed to send status update notification:', error);
    }
  }

  // Send notification to external service
  async sendNotification(notificationData) {
    if (!this.isEnabled) return;

    try {
      const response = await axios.post(
        `${this.notificationServiceUrl}/api/notifications/send`,
        notificationData,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Name': 'complaint-management-service'
          }
        }
      );

      if (response.status >= 200 && response.status < 300) {
        console.log('í³§ Notification sent successfully');
      } else {
        throw new Error(`Notification service responded with ${response.status}`);
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('âš ï¸ Notification service is not available');
      } else if (error.code === 'ECONNABORTED') {
        console.warn('âš ï¸ Notification service request timed out');
      } else {
        console.error('âŒ Error sending notification:', error);
      }
      throw error;
    }
  }
}

module.exports = new NotificationService();
