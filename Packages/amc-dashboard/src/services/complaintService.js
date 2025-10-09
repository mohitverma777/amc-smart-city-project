import api from './api';

class ComplaintService {
  // Get all complaints (admin/officer view)
  async getAllComplaints(params = {}) {
    try {
      console.log('📋 ComplaintService: Fetching all complaints with params:', params);
      
      const queryParams = new URLSearchParams();
      
      // Add pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add filters
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.department) queryParams.append('department', params.department);
      if (params.ward) queryParams.append('ward', params.ward);
      if (params.zone) queryParams.append('zone', params.zone);
      if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
      if (params.search) queryParams.append('search', params.search);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      // ✅ FIX: Convert URLSearchParams to string
      const queryString = queryParams.toString();
      const url = `/api/complaint-management/complaints${queryString ? `?${queryString}` : ''}`;
      
      console.log('🌐 Fetching from URL:', url);
      const response = await api.get(url);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ ComplaintService: Complaints fetched successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ ComplaintService: Failed to fetch complaints:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Insufficient permissions.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to fetch complaints. Please try again.');
      }
    }
  }

  // Get single complaint details
  async getComplaint(identifier) {
    try {
      console.log('👁️ ComplaintService: Fetching complaint:', identifier);
      
      const response = await api.get(`/api/complaint-management/complaints/${identifier}`);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ ComplaintService: Complaint fetched successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ ComplaintService: Failed to fetch complaint:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Complaint not found');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied to this complaint');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to fetch complaint details');
      }
    }
  }

  // Update complaint status (admin/officer only)
  async updateComplaintStatus(complaintId, statusData) {
    try {
      console.log('📝 ComplaintService: Updating complaint status:', complaintId, statusData);
      
      const response = await api.patch(
        `/api/complaint-management/complaints/${complaintId}/status`,
        statusData
      );
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ ComplaintService: Status updated successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ ComplaintService: Failed to update status:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Only officers can update complaint status');
      } else if (error.response?.status === 404) {
        throw new Error('Complaint not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to update complaint status');
      }
    }
  }

  // Add comment to complaint
  async addComment(complaintId, commentData) {
    try {
      console.log('💬 ComplaintService: Adding comment to complaint:', complaintId);
      
      const response = await api.post(
        `/api/complaint-management/complaints/${complaintId}/comments`,
        commentData
      );
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ ComplaintService: Comment added successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ ComplaintService: Failed to add comment:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Access denied');
      } else if (error.response?.status === 404) {
        throw new Error('Complaint not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to add comment');
      }
    }
  }

  // Get complaint statistics (admin/officer only)
  async getComplaintStatistics(filters = {}) {
    try {
      console.log('📊 ComplaintService: Fetching complaint statistics with filters:', filters);
      
      const queryParams = new URLSearchParams();
      
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.ward) queryParams.append('ward', filters.ward);
      if (filters.zone) queryParams.append('zone', filters.zone);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      // ✅ FIX: Convert to string
      const queryString = queryParams.toString();
      const url = `/api/complaint-management/complaints/admin/statistics${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ ComplaintService: Statistics fetched successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ ComplaintService: Failed to fetch statistics:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Access denied');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to fetch complaint statistics');
      }
    }
  }

  // File new complaint (citizen app will use this)
  async fileComplaint(complaintData, attachments = null) {
    try {
      console.log('📝 ComplaintService: Filing new complaint');
      
      const formData = new FormData();
      
      // Add text fields
      Object.keys(complaintData).forEach(key => {
        if (complaintData[key] !== null && complaintData[key] !== undefined) {
          if (typeof complaintData[key] === 'object') {
            formData.append(key, JSON.stringify(complaintData[key]));
          } else {
            formData.append(key, complaintData[key]);
          }
        }
      });

      // Add file attachments
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      const response = await api.post('/api/complaint-management/complaints/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ ComplaintService: Complaint filed successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ ComplaintService: Failed to file complaint:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Only citizens can file complaints');
      } else if (error.response?.data?.errors) {
        const errorMessage = error.response.data.errors.join(', ');
        throw new Error(errorMessage);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to file complaint. Please try again.');
      }
    }
  }

  // Get citizen's complaints (for citizen app)
  async getMyComplaints(params = {}) {
    try {
      console.log('📋 ComplaintService: Fetching citizen complaints with params:', params);
      
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.priority) queryParams.append('priority', params.priority);

      // ✅ FIX: Convert to string
      const queryString = queryParams.toString();
      const url = `/api/complaint-management/complaints/my${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ ComplaintService: Citizen complaints fetched successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ ComplaintService: Failed to fetch citizen complaints:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to fetch your complaints');
      }
    }
  }

  // Search complaints
  async searchComplaints(searchTerm, filters = {}) {
    try {
      console.log('🔍 ComplaintService: Searching complaints:', searchTerm);
      
      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      // ✅ FIX: Convert to string
      const queryString = queryParams.toString();
      const url = `/api/complaint-management/complaints${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ ComplaintService: Search completed successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ ComplaintService: Search failed:', error);
      throw new Error('Search failed. Please try again.');
    }
  }

  // Export complaints data
  async exportComplaintData(format = 'csv', filters = {}) {
    try {
      console.log('📤 ComplaintService: Exporting complaint data:', format);
      
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      // ✅ FIX: Convert to string
      const queryString = queryParams.toString();
      const url = `/api/complaint-management/complaints/export${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        responseType: 'blob'
      });

      // Create blob link to download
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `complaints-export-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      console.error('❌ ComplaintService: Export failed:', error);
      throw new Error('Export failed. Please try again.');
    }
  }

  // Get complaint categories (for dropdowns)
  async getComplaintCategories() {
    try {
      console.log('📋 ComplaintService: Fetching complaint categories');
      
      const response = await api.get('/api/complaint-management/complaints/categories');
      
      if (response.data && response.data.status === 'success') {
        return response.data;
      } else {
        // Return default categories if API fails
        return {
          status: 'success',
          data: {
            categories: [
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
            ]
          }
        };
      }
    } catch (error) {
      console.error('❌ ComplaintService: Failed to fetch categories:', error);
      // Return default categories on error
      return {
        status: 'success',
        data: {
          categories: [
            'Water Supply',
            'Electricity',
            'Waste Management',
            'Road & Infrastructure',
            'Street Lighting',
            'Drainage',
            'Public Health',
            'Other'
          ]
        }
      };
    }
  }

  // Validate complaint data before submission
  validateComplaintData(complaintData) {
    const errors = [];
    
    if (!complaintData.title || complaintData.title.length < 5) {
      errors.push('Title must be at least 5 characters long');
    }
    
    if (!complaintData.description || complaintData.description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }
    
    if (!complaintData.category) {
      errors.push('Category is required');
    }
    
    if (!complaintData.address || complaintData.address.length < 10) {
      errors.push('Complete address is required');
    }
    
    return errors;
  }
}

const complaintService = new ComplaintService();
export default complaintService;
