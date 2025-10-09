import api from './api';

class PaymentService {
  // Get all payments (admin)
  async getAllPayments(params = {}) {
    try {
      console.log('📋 PaymentService: Fetching all payments with params:', params);
      
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/payment-management/payments/admin/all${queryString ? `?${queryString}` : ''}`;
      
      console.log('🌐 Fetching from URL:', url);
      
      const response = await api.get(url);
      
      console.log('✅ PaymentService: Success:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ PaymentService: Failed to fetch payments:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch payments',
        error: error
      };
    }
  }

  // Get payment statistics
  async getPaymentStatistics(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/payment-management/payments/admin/statistics${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ PaymentService: Failed to fetch statistics:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch statistics',
        error: error
      };
    }
  }

  // Get payment by ID
  async getPaymentById(id) {
    try {
      const response = await api.get(`/api/payment-management/payments/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ PaymentService: Failed to fetch payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch payment',
        error: error
      };
    }
  }

  // Update payment status (admin)
  async updatePaymentStatus(id, statusData) {
    try {
      const response = await api.patch(`/api/payment-management/payments/${id}/status`, statusData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ PaymentService: Failed to update payment status:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update payment status',
        error: error
      };
    }
  }

  // Generate payment report
  async generatePaymentReport(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/payment-management/payments/admin/report${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      return {
        success: true,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      console.error('❌ PaymentService: Failed to generate report:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to generate report',
        error: error
      };
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(dateRange = {}) {
    try {
      const queryString = new URLSearchParams(dateRange).toString();
      const url = `/api/payment-management/payments/admin/analytics${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ PaymentService: Failed to fetch analytics:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch analytics',
        error: error
      };
    }
  }
}

export default new PaymentService();
