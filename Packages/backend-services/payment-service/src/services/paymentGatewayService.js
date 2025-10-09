const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');
const logger = require('@amc/shared/utils/logger');
const { Payment } = require('../models');

class PaymentGatewayService {
  constructor() {
    this.gateways = {
      razorpay: this.initializeRazorpay(),
      stripe: this.initializeStripe(),
      upi: this.initializeUPI()
    };
  }

  // Initialize Razorpay
  initializeRazorpay() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      logger.warn('Razorpay credentials not configured');
      return null;
    }

    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  // Initialize Stripe (placeholder)
  initializeStripe() {
    // Stripe initialization would go here
    return null;
  }

  // Initialize UPI (placeholder)
  initializeUPI() {
    // UPI gateway initialization would go here
    return null;
  }

  // Create payment order
  async createPaymentOrder(paymentData) {
    try {
      const { gateway, amount, currency, receipt, notes } = paymentData;
      
      switch (gateway) {
        case 'razorpay':
          return await this.createRazorpayOrder(amount, currency, receipt, notes);
        case 'stripe':
          return await this.createStripeOrder(amount, currency, receipt, notes);
        case 'upi':
          return await this.createUPIOrder(amount, currency, receipt, notes);
        default:
          throw new Error(`Unsupported payment gateway: ${gateway}`);
      }
    } catch (error) {
      logger.error('Failed to create payment order:', error);
      throw error;
    }
  }

  // Create Razorpay order
  async createRazorpayOrder(amount, currency = 'INR', receipt, notes = {}) {
    if (!this.gateways.razorpay) {
      throw new Error('Razorpay not configured');
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
      notes
    };

    const order = await this.gateways.razorpay.orders.create(options);
    
    logger.info('Razorpay order created', {
      orderId: order.id,
      amount: order.amount,
      receipt: order.receipt
    });

    return {
      gatewayOrderId: order.id,
      amount: order.amount / 100, // Convert back to rupees
      currency: order.currency,
      status: order.status,
      gatewayResponse: order
    };
  }

  // Verify payment signature
  async verifyPaymentSignature(paymentData) {
    try {
      const { gateway } = paymentData;
      
      switch (gateway) {
        case 'razorpay':
          return this.verifyRazorpaySignature(paymentData);
        case 'stripe':
          return this.verifyStripeSignature(paymentData);
        default:
          throw new Error(`Signature verification not supported for: ${gateway}`);
      }
    } catch (error) {
      logger.error('Payment signature verification failed:', error);
      throw error;
    }
  }

  // Verify Razorpay signature
  verifyRazorpaySignature(paymentData) {
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature 
    } = paymentData;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isValid = expectedSignature === razorpaySignature;
    
    logger.info('Razorpay signature verification', {
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      isValid
    });

    return isValid;
  }

  // Process successful payment
  async processSuccessfulPayment(paymentId, gatewayData) {
    try {
      const payment = await Payment.findByPk(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify payment with gateway
      const isVerified = await this.verifyPaymentSignature({
        gateway: payment.gatewayProvider,
        ...gatewayData
      });

      if (!isVerified) {
        await payment.markAsFailed('Signature verification failed', gatewayData);
        throw new Error('Payment signature verification failed');
      }

      // Update payment details
      payment.gatewayPaymentId = gatewayData.razorpayPaymentId || gatewayData.paymentId;
      payment.gatewayOrderId = gatewayData.razorpayOrderId || gatewayData.orderId;
      
      await payment.markAsCompleted(gatewayData);

      // Notify the originating service
      await this.notifyService(payment);

      logger.info('Payment processed successfully', {
        paymentId: payment.paymentId,
        amount: payment.amount,
        serviceType: payment.serviceType
      });

      return payment;
    } catch (error) {
      logger.error('Failed to process successful payment:', error);
      throw error;
    }
  }

  // Process failed payment
  async processFailedPayment(paymentId, gatewayData, reason) {
    try {
      const payment = await Payment.findByPk(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      await payment.markAsFailed(reason, gatewayData);

      // Notify the originating service
      await this.notifyService(payment);

      logger.info('Payment marked as failed', {
        paymentId: payment.paymentId,
        reason
      });

      return payment;
    } catch (error) {
      logger.error('Failed to process failed payment:', error);
      throw error;
    }
  }

  // Notify originating service
  async notifyService(payment) {
    try {
      const serviceUrls = {
        property_tax: process.env.PROPERTY_TAX_SERVICE_URL,
        grievance_fee: process.env.GRIEVANCE_SERVICE_URL,
        water_bill: process.env.WATER_SERVICE_URL
      };

      const serviceUrl = serviceUrls[payment.serviceType];
      if (!serviceUrl) {
        logger.warn('No service URL configured for payment type', {
          serviceType: payment.serviceType
        });
        return;
      }

      const notificationData = {
        paymentId: payment.paymentId,
        serviceReferenceId: payment.serviceReferenceId,
        amount: payment.amount,
        status: payment.status,
        completedAt: payment.completedAt,
        receiptNumber: payment.receiptNumber
      };

      const response = await axios.post(
        `${serviceUrl}/payment-webhook`,
        notificationData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Payment-Signature': this.generateWebhookSignature(notificationData)
          },
          timeout: 10000
        }
      );

      logger.info('Service notified of payment status', {
        paymentId: payment.paymentId,
        serviceType: payment.serviceType,
        responseStatus: response.status
      });
    } catch (error) {
      logger.error('Failed to notify service:', error);
      // Don't throw error - payment processing should still complete
    }
  }

  // Generate webhook signature
  generateWebhookSignature(data) {
    const secret = process.env.WEBHOOK_SECRET || 'default-webhook-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // Process refund
  async processRefund(paymentId, refundAmount, reason) {
    try {
      const payment = await Payment.findByPk(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Can only refund completed payments');
      }

      // Process refund with gateway
      let refundResponse;
      switch (payment.gatewayProvider) {
        case 'razorpay':
          refundResponse = await this.processRazorpayRefund(payment, refundAmount);
          break;
        default:
          throw new Error(`Refund not supported for gateway: ${payment.gatewayProvider}`);
      }

      // Update payment record
      await payment.processRefund(refundAmount, reason);

      logger.info('Refund processed', {
        paymentId: payment.paymentId,
        refundAmount,
        totalRefunded: payment.refundAmount
      });

      return {
        payment,
        refundResponse
      };
    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw error;
    }
  }

  // Process Razorpay refund
  async processRazorpayRefund(payment, refundAmount) {
    if (!this.gateways.razorpay) {
      throw new Error('Razorpay not configured');
    }

    const refundData = {
      amount: Math.round(refundAmount * 100), // Convert to paise
      notes: {
        reason: payment.refundReason,
        original_payment_id: payment.paymentId
      }
    };

    const refund = await this.gateways.razorpay.payments.refund(
      payment.gatewayPaymentId,
      refundData
    );

    return refund;
  }

  // Get payment status from gateway
  async getPaymentStatus(payment) {
    try {
      switch (payment.gatewayProvider) {
        case 'razorpay':
          return await this.getRazorpayPaymentStatus(payment);
        default:
          throw new Error(`Status check not supported for: ${payment.gatewayProvider}`);
      }
    } catch (error) {
      logger.error('Failed to get payment status:', error);
      throw error;
    }
  }

  // Get Razorpay payment status
  async getRazorpayPaymentStatus(payment) {
    if (!this.gateways.razorpay || !payment.gatewayPaymentId) {
      throw new Error('Razorpay not configured or payment ID missing');
    }

    const paymentDetails = await this.gateways.razorpay.payments.fetch(
      payment.gatewayPaymentId
    );

    return {
      status: paymentDetails.status,
      amount: paymentDetails.amount / 100,
      method: paymentDetails.method,
      captured: paymentDetails.captured,
      gatewayResponse: paymentDetails
    };
  }
}

module.exports = new PaymentGatewayService();
