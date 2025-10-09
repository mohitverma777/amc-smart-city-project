const { Payment, Bill, sequelize } = require('../models');
const { Op } = require('sequelize'); // ✅ ADD THIS IMPORT
const crypto = require('crypto');

// Helper function to convert MongoDB ObjectId to UUID
const mongoIdToUuid = (mongoId) => {
  if (!mongoId) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(mongoId)) return mongoId;
  
  const hash = crypto.createHash('md5').update(mongoId.toString()).digest('hex');
  return `${hash.substr(0,8)}-${hash.substr(8,4)}-${hash.substr(12,4)}-${hash.substr(16,4)}-${hash.substr(20,12)}`;
};

const generatePaymentNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `PAY${year}${month}${day}${timestamp}`;
};

const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

class PaymentController {
  
  // Process payment
  async processPayment(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { billIds, totalAmount, paymentMethod = 'Online' } = req.body;
      
      // ✅ FIX: Better user data extraction with fallbacks
      const rawCitizenId = req.user?.citizenId || req.user?.id || req.user?.userId;
      const citizenId = mongoIdToUuid(rawCitizenId);
      
      // ✅ FIX: Provide default values if user data is missing
      const citizenName = req.user?.name || req.user?.username || 'Citizen';
      const citizenEmail = req.user?.email || null;

      console.log('👤 Processing payment for user:', {
        citizenId,
        citizenName,
        citizenEmail,
        rawUser: req.user
      });

      // Validate required fields
      if (!citizenId) {
        throw new Error('User ID is required');
      }

      if (!citizenName || citizenName === 'Citizen') {
        console.warn('⚠️ Warning: User name not found in token, using default');
      }

      // Validate bills
      const bills = await Bill.findAll({
        where: { 
          id: billIds, 
          citizenId, 
          status: ['Pending', 'Overdue'] 
        },
        transaction
      });

      if (bills.length !== billIds.length) {
        throw new Error('Some bills are invalid or already paid');
      }

      const calculatedTotal = bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
      if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
        throw new Error('Amount mismatch');
      }

      // Create payments for each bill
      const payments = [];
      for (const bill of bills) {
        const payment = await Payment.create({
          paymentNumber: generatePaymentNumber(),
          citizenId,
          citizenName, // ✅ Now this won't be null
          citizenEmail,
          billType: bill.billType,
          billId: bill.id,
          amount: bill.amount,
          status: 'Completed',
          paymentMethod,
          transactionId: generateTransactionId(),
          paidAt: new Date(),
          description: `Payment for ${bill.billType}`,
        }, { transaction });

        // Update bill status
        await bill.update({ status: 'Paid' }, { transaction });
        payments.push(payment);
      }

      await transaction.commit();

      console.log('✅ Payment processed successfully:', payments.length, 'payments');

      res.json({
        status: 'success',
        message: 'Payment processed successfully',
        data: { payments }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error processing payment:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to process payment'
      });
    }
  }

  // Get citizen's bills
  async getCitizenBills(req, res) {
    try {
      const rawCitizenId = req.user?.citizenId || req.user?.id || req.user?.userId;
      const citizenId = mongoIdToUuid(rawCitizenId);

      console.log('📋 Fetching bills for citizen:', citizenId);

      const bills = await Bill.findAll({
        where: { citizenId, status: ['Pending', 'Overdue'] },
        order: [['dueDate', 'ASC']],
      });

      console.log('✅ Found', bills.length, 'bills');

      res.json({
        status: 'success',
        data: { bills }
      });
    } catch (error) {
      console.error('❌ Error fetching bills:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch bills',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get payment history
  async getPaymentHistory(req, res) {
    try {
      const rawCitizenId = req.user?.citizenId || req.user?.id || req.user?.userId;
      const citizenId = mongoIdToUuid(rawCitizenId);
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: payments } = await Payment.findAndCountAll({
        where: { citizenId },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        status: 'success',
        data: {
          payments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalCount: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch payment history'
      });
    }
  }

  // Get pending payments
  async getPendingPayments(req, res) {
    try {
      const rawCitizenId = req.user?.citizenId || req.user?.id || req.user?.userId;
      const citizenId = mongoIdToUuid(rawCitizenId);

      const pendingPayments = await Payment.findAll({
        where: { citizenId, status: 'Pending' },
        order: [['createdAt', 'DESC']],
      });

      res.json({
        status: 'success',
        data: { payments: pendingPayments }
      });
    } catch (error) {
      console.error('❌ Error fetching pending payments:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch pending payments'
      });
    }
  }

  // Admin: Get all payments
  async getAllPayments(req, res) {
    try {
      console.log('📋 Admin: Fetching all payments');
      console.log('📊 Query params:', req.query);
      
      const { page = 1, limit = 10, status, billType, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;
      const where = {};

      if (status && status !== '') where.status = status;
      if (billType && billType !== '') where.billType = billType;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate); // ✅ Now Op is defined
        if (endDate) where.createdAt[Op.lte] = new Date(endDate); // ✅ Now Op is defined
      }

      console.log('🔍 Query where clause:', where);

      const { count, rows: payments } = await Payment.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      console.log('✅ Found', count, 'total payments,', payments.length, 'in current page');

      res.json({
        status: 'success',
        data: {
          payments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalCount: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Error fetching all payments:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch payments',
        error: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error'
      });
    }
  }

  // Generate sample bills for testing
  async generateSampleBills(req, res) {
    try {
      const rawCitizenId = req.user?.citizenId || req.user?.id || req.user?.userId;
      const citizenId = mongoIdToUuid(rawCitizenId);

      console.log('🔧 Generating sample bills for citizen:', citizenId);

      // Check if bills already exist
      const existingBills = await Bill.findAll({
        where: { citizenId, status: ['Pending', 'Overdue'] }
      });

      if (existingBills.length > 0) {
        return res.json({
          status: 'success',
          message: 'Bills already exist for this user',
          data: { bills: existingBills }
        });
      }

      const sampleBills = [
        {
          billNumber: `PROP${Date.now()}1`,
          citizenId,
          billType: 'Property Tax',
          amount: 15000,
          dueDate: new Date('2025-12-15'),
          description: 'Annual Property Tax for FY 2025-26',
          status: 'Pending'
        },
        {
          billNumber: `WATER${Date.now()}2`,
          citizenId,
          billType: 'Water Bill',
          amount: 1200,
          dueDate: new Date('2025-12-10'),
          description: 'Water consumption charges for November 2025',
          status: 'Pending'
        },
        {
          billNumber: `WASTE${Date.now()}3`,
          citizenId,
          billType: 'Waste Management',
          amount: 800,
          dueDate: new Date('2025-12-20'),
          description: 'Waste collection charges for November 2025',
          status: 'Pending'
        },
        {
          billNumber: `TRADE${Date.now()}4`,
          citizenId,
          billType: 'Trade License',
          amount: 5000,
          dueDate: new Date('2025-12-25'),
          description: 'Annual Trade License renewal fee',
          status: 'Pending'
        }
      ];

      const bills = await Bill.bulkCreate(sampleBills);

      console.log('✅ Generated', bills.length, 'sample bills');

      res.json({
        status: 'success',
        message: 'Sample bills generated successfully',
        data: { bills }
      });
    } catch (error) {
      console.error('❌ Error generating sample bills:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate sample bills',
        error: error.message
      });
    }
  }
}

module.exports = new PaymentController();
