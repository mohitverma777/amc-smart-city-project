import React, { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import ComplaintTrendsChart from "../data/ComplaintTrendsChart";
import RecentComplaintsTable from "../data/RecentComplaintsTable";
import TopZones from "../data/TopZones";
import {
  Filter,
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  MapPin,
  RefreshCw,
  Download,
  Eye,
  Edit,
  MessageSquare
} from "lucide-react";

// Import services
import complaintService from "../services/complaintService";
import { toast } from "react-hot-toast";

// Professional light theme color palette
const THEME_COLORS = {
  primary: "#1d4ed8",
  secondary: "#0891b2",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#7c3aed",
  background: "#f8fafc",
  cardBg: "#ffffff",
  border: "#e2e8f0",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  shadowMedium: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
};

const ComplaintsPage = () => {
  // State management
  const [filters, setFilters] = useState({ 
    zone: "", 
    category: "", 
    status: "",
    priority: "",
    startDate: "",
    endDate: ""
  });

  const [complaints, setComplaints] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  });
  
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);

  // Filter options (will be populated from API)
  const [filterOptions, setFilterOptions] = useState({
    zones: [],
    categories: [],
    statuses: ['Pending', 'Acknowledged', 'In Progress', 'Under Review', 'Resolved', 'Closed', 'Rejected'],
    priorities: ['Low', 'Medium', 'High', 'Critical']
  });

  // Fetch complaints data
  const fetchComplaints = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        )
      };

      console.log('📋 Fetching complaints with params:', params);

      const response = await complaintService.getAllComplaints(params);
      
      if (response.status === 'success') {
        setComplaints(response.data.complaints || []);
        setPagination(response.data.pagination || {});
        
        // Extract unique values for filter options
        const complaints = response.data.complaints || [];
        setFilterOptions(prev => ({
          ...prev,
          zones: [...new Set(complaints.map(c => c.zone).filter(Boolean))],
          categories: [...new Set(complaints.map(c => c.category).filter(Boolean))]
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch complaints');
      }
    } catch (err) {
      console.error('❌ Error fetching complaints:', err);
      setError(err.message);
      toast.error('Failed to fetch complaints: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      console.log('📊 Fetching complaint statistics...');
      
      const statsParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );

      const response = await complaintService.getComplaintStatistics(statsParams);
      
      if (response.status === 'success') {
        setStatistics(response.data || {});
      } else {
        console.warn('⚠️ Failed to fetch statistics:', response.message);
      }
    } catch (err) {
      console.error('❌ Error fetching statistics:', err);
      // Don't show error toast for statistics as it's secondary data
    }
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    fetchComplaints(1);
  }, [filters]);

  useEffect(() => {
    fetchStatistics();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ 
      zone: "", 
      category: "", 
      status: "",
      priority: "",
      startDate: "",
      endDate: ""
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchComplaints(newPage);
  };

  // Handle complaint actions
  const handleViewComplaint = async (complaintId) => {
    try {
      console.log('👁️ Viewing complaint:', complaintId);
      const response = await complaintService.getComplaint(complaintId);
      
      if (response.status === 'success') {
        setSelectedComplaint(response.data.complaint);
        setShowComplaintModal(true);
      } else {
        toast.error('Failed to load complaint details');
      }
    } catch (err) {
      console.error('❌ Error loading complaint:', err);
      toast.error('Failed to load complaint details');
    }
  };

  const handleUpdateStatus = async (statusData) => {
    try {
      console.log('📝 Updating complaint status:', statusData);
      
      const response = await complaintService.updateComplaintStatus(
        selectedComplaint.id,
        statusData
      );
      
      if (response.status === 'success') {
        toast.success('Complaint status updated successfully');
        setShowStatusUpdateModal(false);
        setSelectedComplaint(null);
        await fetchComplaints(pagination.currentPage);
        await fetchStatistics();
      } else {
        toast.error(response.message || 'Failed to update complaint status');
      }
    } catch (err) {
      console.error('❌ Error updating complaint:', err);
      toast.error('Failed to update complaint status');
    }
  };

  const handleAddComment = async (complaintId, comment) => {
    try {
      console.log('💬 Adding comment to complaint:', complaintId);
      
      const response = await complaintService.addComment(complaintId, {
        comment,
        isInternal: true
      });
      
      if (response.status === 'success') {
        toast.success('Comment added successfully');
        // Refresh complaint details if modal is open
        if (selectedComplaint && selectedComplaint.id === complaintId) {
          handleViewComplaint(complaintId);
        }
      } else {
        toast.error(response.message || 'Failed to add comment');
      }
    } catch (err) {
      console.error('❌ Error adding comment:', err);
      toast.error('Failed to add comment');
    }
  };

  // Calculate statistics from current data
  const calculatedStats = useMemo(() => {
    if (!complaints || complaints.length === 0) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        highPriority: 0,
        overdue: 0
      };
    }

    const now = new Date();
    
    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === "Pending").length,
      inProgress: complaints.filter(c => c.status === "In Progress").length,
      resolved: complaints.filter(c => c.status === "Resolved").length,
      highPriority: complaints.filter(c => ['High', 'Critical'].includes(c.priority)).length,
      overdue: complaints.filter(c => {
        if (!c.expectedResolutionDate) return false;
        return new Date(c.expectedResolutionDate) < now && !['Resolved', 'Closed'].includes(c.status);
      }).length
    };
  }, [complaints]);

  // Use backend statistics if available, otherwise use calculated stats
  const displayStats = statistics.totalStats || calculatedStats;

  // Calculate top zones dynamically from filtered complaints
  const topZonesData = useMemo(() => {
    if (!complaints || complaints.length === 0) return [];

    const zoneMap = complaints.reduce((acc, complaint) => {
      const zone = complaint.zone || 'Unknown';
      if (!acc[zone]) {
        acc[zone] = { zone, complaints: 0, resolved: 0 };
      }
      acc[zone].complaints++;
      if (complaint.status === "Resolved") {
        acc[zone].resolved++;
      }
      return acc;
    }, {});

    return Object.values(zoneMap)
      .map(z => ({
        ...z,
        resolutionRate: z.complaints > 0 ? ((z.resolved / z.complaints) * 100).toFixed(1) : "0.0"
      }))
      .sort((a, b) => parseFloat(b.resolutionRate) - parseFloat(a.resolutionRate));
  }, [complaints]);

  // Loading state
  if (loading && complaints.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.background }}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: THEME_COLORS.primary }} />
          <p className="text-lg" style={{ color: THEME_COLORS.textPrimary }}>Loading complaints...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && complaints.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.background }}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4" style={{ color: THEME_COLORS.danger }} />
          <p className="text-lg mb-4" style={{ color: THEME_COLORS.textPrimary }}>Error loading complaints</p>
          <p className="text-sm mb-4" style={{ color: THEME_COLORS.textSecondary }}>{error}</p>
          <button 
            onClick={() => fetchComplaints(1)}
            className="px-4 py-2 rounded-lg transition-colors duration-200"
            style={{ 
              backgroundColor: THEME_COLORS.primary,
              color: 'white'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: THEME_COLORS.background }}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
              Service Complaints Management
            </h1>
            <p className="text-lg" style={{ color: THEME_COLORS.textSecondary }}>
              Track and manage citizen complaints and service requests efficiently
            </p>
          </div>
          <div className="flex items-center gap-4">
            {loading && (
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: THEME_COLORS.primary }} />
            )}
            <button
              onClick={() => fetchComplaints(pagination.currentPage)}
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ 
                backgroundColor: `${THEME_COLORS.primary}10`,
                color: THEME_COLORS.primary,
                border: `1px solid ${THEME_COLORS.primary}30`
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <Card className="hover:scale-105 transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  Total Complaints
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {displayStats.total || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.info }}>
                  Active records
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
                <FileText className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  Pending
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {displayStats.pending || 0}
                </p>
                <p className="text-xs mt-1" style={{ 
                  color: (displayStats.pending || 0) > 3 ? THEME_COLORS.danger : THEME_COLORS.success 
                }}>
                  {(displayStats.pending || 0) > 3 ? 'Needs attention' : 'Under control'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.danger}20` }}>
                <Clock className="w-6 h-6" style={{ color: THEME_COLORS.danger }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  In Progress
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {displayStats.inProgress || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.warning }}>
                  Being resolved
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.warning}20` }}>
                <AlertTriangle className="w-6 h-6" style={{ color: THEME_COLORS.warning }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  Resolved
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {displayStats.resolved || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.success }}>
                  {displayStats.total > 0 ? Math.round(((displayStats.resolved || 0) / displayStats.total) * 100) : 0}% completion
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.success}20` }}>
                <CheckCircle className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  High Priority
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {displayStats.highPriority || 0}
                </p>
                <p className="text-xs mt-1" style={{ 
                  color: (displayStats.highPriority || 0) > 2 ? THEME_COLORS.danger : THEME_COLORS.info 
                }}>
                  {(displayStats.highPriority || 0) > 2 ? 'Critical attention' : 'Manageable'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.info}20` }}>
                <Users className="w-6 h-6" style={{ color: THEME_COLORS.info }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  Overdue
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {displayStats.overdue || 0}
                </p>
                <p className="text-xs mt-1" style={{ 
                  color: (displayStats.overdue || 0) > 0 ? THEME_COLORS.danger : THEME_COLORS.success 
                }}>
                  {(displayStats.overdue || 0) > 0 ? 'Immediate action needed' : 'All on track'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ 
                backgroundColor: `${(displayStats.overdue || 0) > 0 ? THEME_COLORS.danger : THEME_COLORS.success}20` 
              }}>
                <Clock className="w-6 h-6" style={{ 
                  color: (displayStats.overdue || 0) > 0 ? THEME_COLORS.danger : THEME_COLORS.success 
                }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters Section */}
      <Card className="mb-8" style={{ 
        backgroundColor: THEME_COLORS.cardBg, 
        boxShadow: THEME_COLORS.shadow,
        border: `1px solid ${THEME_COLORS.border}` 
      }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
            <Filter className="w-5 h-5" style={{ color: THEME_COLORS.primary }} />
            Filter Complaints
          </CardTitle>
          <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
            Filter complaints by zone, category, status, and date range to focus on specific areas
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Zone Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                <MapPin className="w-4 h-4 inline mr-1" />
                Zone
              </label>
              <select
                value={filters.zone}
                onChange={(e) => handleFilterChange('zone', e.target.value)}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              >
                <option value="">All Zones</option>
                {filterOptions.zones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              >
                <option value="">All Statuses</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              >
                <option value="">All Priorities</option>
                {filterOptions.priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              />
            </div>

            {/* Clear Filters Button */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Actions
              </label>
              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="flex-1 p-3 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: `${THEME_COLORS.secondary}10`,
                    color: THEME_COLORS.secondary,
                    border: `1px solid ${THEME_COLORS.secondary}30`
                  }}
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => window.location.href = '/reports'}
                  className="flex-1 p-3 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: `${THEME_COLORS.info}10`,
                    color: THEME_COLORS.info,
                    border: `1px solid ${THEME_COLORS.info}30`
                  }}
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${THEME_COLORS.border}` }}>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: THEME_COLORS.textSecondary }}>
                Showing {complaints.length} of {pagination.totalCount || 0} complaints
              </span>
              {Object.values(filters).some(f => f !== "") && (
                <div className="flex items-center gap-2">
                  <span style={{ color: THEME_COLORS.textSecondary }}>Active filters:</span>
                  {filters.zone && (
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${THEME_COLORS.primary}20`, color: THEME_COLORS.primary }}
                    >
                      Zone: {filters.zone}
                    </span>
                  )}
                  {filters.category && (
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${THEME_COLORS.success}20`, color: THEME_COLORS.success }}
                    >
                      Category: {filters.category}
                    </span>
                  )}
                  {filters.status && (
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${THEME_COLORS.warning}20`, color: THEME_COLORS.warning }}
                    >
                      Status: {filters.status}
                    </span>
                  )}
                  {filters.priority && (
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${THEME_COLORS.info}20`, color: THEME_COLORS.info }}
                    >
                      Priority: {filters.priority}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Charts and Data Section */}
      <div className="space-y-8">
        {/* Complaint Trends */}
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <TrendingUp className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
              Complaint Trends Analysis
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Historical complaint patterns and trending data over time
            </p>
          </CardHeader>
          <CardContent>
            <ComplaintTrendsChart 
              complaints={complaints} 
              statistics={statistics}
            />
          </CardContent>
        </Card>

        {/* Recent Complaints Table */}
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <FileText className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
              Recent Complaints
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Latest service requests and their current status
            </p>
          </CardHeader>
          <CardContent>
            <RecentComplaintsTable 
              complaints={complaints}
              onViewComplaint={handleViewComplaint}
              onUpdateStatus={(complaint) => {
                setSelectedComplaint(complaint);
                setShowStatusUpdateModal(true);
              }}
              onAddComment={handleAddComment}
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Top Performing Zones */}
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <Users className="w-6 h-6" style={{ color: THEME_COLORS.info }} />
              Zone Performance Rankings
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Service zones ranked by complaint resolution efficiency
            </p>
          </CardHeader>
          <CardContent>
            <TopZones data={topZonesData} />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showComplaintModal && selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          onClose={() => {
            setShowComplaintModal(false);
            setSelectedComplaint(null);
          }}
          onUpdateStatus={() => {
            setShowComplaintModal(false);
            setShowStatusUpdateModal(true);
          }}
          onAddComment={handleAddComment}
        />
      )}

      {showStatusUpdateModal && selectedComplaint && (
        <StatusUpdateModal
          complaint={selectedComplaint}
          onClose={() => {
            setShowStatusUpdateModal(false);
            setSelectedComplaint(null);
          }}
          onSubmit={handleUpdateStatus}
        />
      )}
    </div>
  );
};

// Complaint Details Modal Component
const ComplaintDetailsModal = ({ complaint, onClose, onUpdateStatus, onAddComment }) => {
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    setSubmittingComment(true);
    try {
      await onAddComment(complaint.id, comment);
      setComment('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': THEME_COLORS.warning,
      'Acknowledged': THEME_COLORS.info,
      'In Progress': THEME_COLORS.secondary,
      'Resolved': THEME_COLORS.success,
      'Closed': THEME_COLORS.textSecondary,
      'Rejected': THEME_COLORS.danger
    };
    return colors[status] || THEME_COLORS.textSecondary;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': THEME_COLORS.success,
      'Medium': THEME_COLORS.warning,
      'High': THEME_COLORS.danger,
      'Critical': THEME_COLORS.danger
    };
    return colors[priority] || THEME_COLORS.textSecondary;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: THEME_COLORS.cardBg }}
      >
        <div className="p-6 border-b" style={{ borderColor: THEME_COLORS.border }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                {complaint.title}
              </h2>
              <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
                Complaint #{complaint.complaintNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
              style={{ color: THEME_COLORS.textSecondary }}
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: THEME_COLORS.textPrimary }}>
                Basic Information
              </h3>
              <div className="space-y-2">
                <p><strong>Category:</strong> {complaint.category}</p>
                <p><strong>Priority:</strong> 
                  <span 
                    className="ml-2 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${getPriorityColor(complaint.priority)}20`,
                      color: getPriorityColor(complaint.priority)
                    }}
                  >
                    {complaint.priority}
                  </span>
                </p>
                <p><strong>Status:</strong>
                  <span 
                    className="ml-2 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${getStatusColor(complaint.status)}20`,
                      color: getStatusColor(complaint.status)
                    }}
                  >
                    {complaint.status}
                  </span>
                </p>
                <p><strong>Filed Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                {complaint.expectedResolutionDate && (
                  <p><strong>Expected Resolution:</strong> {new Date(complaint.expectedResolutionDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: THEME_COLORS.textPrimary }}>
                Citizen Information
              </h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {complaint.citizenName}</p>
                {complaint.citizenEmail && <p><strong>Email:</strong> {complaint.citizenEmail}</p>}
                {complaint.citizenMobile && <p><strong>Mobile:</strong> {complaint.citizenMobile}</p>}
                <p><strong>Ward:</strong> {complaint.ward}</p>
                <p><strong>Zone:</strong> {complaint.zone}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: THEME_COLORS.textPrimary }}>
              Description
            </h3>
            <p className="p-4 rounded-lg" style={{ 
              backgroundColor: THEME_COLORS.background,
              color: THEME_COLORS.textPrimary 
            }}>
              {complaint.description}
            </p>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: THEME_COLORS.textPrimary }}>
              Address
            </h3>
            <p className="p-4 rounded-lg" style={{ 
              backgroundColor: THEME_COLORS.background,
              color: THEME_COLORS.textPrimary 
            }}>
              {complaint.address}
              {complaint.landmark && (
                <span className="block mt-1 text-sm" style={{ color: THEME_COLORS.textSecondary }}>
                  Landmark: {complaint.landmark}
                </span>
              )}
            </p>
          </div>

          {/* Comments */}
          {complaint.comments && complaint.comments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: THEME_COLORS.textPrimary }}>
                Comments & Updates
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {complaint.comments.map((comment, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg"
                    style={{ 
                      backgroundColor: comment.isInternal ? `${THEME_COLORS.warning}10` : THEME_COLORS.background,
                      borderLeft: `4px solid ${comment.isInternal ? THEME_COLORS.warning : THEME_COLORS.primary}`
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                        {comment.userName || 'System'}
                      </span>
                      <span className="text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ color: THEME_COLORS.textPrimary }}>
                      {comment.comment}
                    </p>
                    {comment.isInternal && (
                      <span 
                        className="inline-block mt-1 px-2 py-1 rounded-full text-xs"
                        style={{ 
                          backgroundColor: `${THEME_COLORS.warning}20`,
                          color: THEME_COLORS.warning
                        }}
                      >
                        Internal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Comment */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: THEME_COLORS.textPrimary }}>
              Add Comment
            </h3>
            <div className="space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment or update..."
                rows={3}
                className="w-full p-3 rounded-lg border"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!comment.trim() || submittingComment}
                className="px-4 py-2 rounded-lg transition-colors duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.primary,
                  color: 'white'
                }}
              >
                {submittingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4" style={{ borderTop: `1px solid ${THEME_COLORS.border}` }}>
            <button
              onClick={onUpdateStatus}
              className="px-4 py-2 rounded-lg transition-colors duration-200"
              style={{ 
                backgroundColor: THEME_COLORS.primary,
                color: 'white'
              }}
            >
              <Edit className="w-4 h-4 inline mr-2" />
              Update Status
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition-colors duration-200"
              style={{ 
                backgroundColor: THEME_COLORS.textSecondary,
                color: 'white'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Update Modal Component
const StatusUpdateModal = ({ complaint, onClose, onSubmit }) => {
  const [status, setStatus] = useState(complaint.status);
  const [statusReason, setStatusReason] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState(complaint.resolutionSummary || '');
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    'Pending',
    'Acknowledged',
    'In Progress',
    'Under Review',
    'Resolved',
    'Closed',
    'Rejected'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit({
        status,
        statusReason: statusReason || null,
        resolutionSummary: resolutionSummary || null
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg max-w-2xl w-full"
        style={{ backgroundColor: THEME_COLORS.cardBg }}
      >
        <div className="p-6 border-b" style={{ borderColor: THEME_COLORS.border }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
              Update Complaint Status
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
              style={{ color: THEME_COLORS.textSecondary }}
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
              Complaint Number
            </label>
            <input
              type="text"
              value={complaint.complaintNumber}
              disabled
              className="w-full p-3 rounded-lg border bg-gray-50"
              style={{ 
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.textSecondary 
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
              Current Status: {complaint.status}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 rounded-lg border"
              style={{ 
                backgroundColor: THEME_COLORS.cardBg,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.textPrimary 
              }}
              required
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
              Status Change Reason
            </label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Explain why the status is being changed..."
              rows={3}
              className="w-full p-3 rounded-lg border"
              style={{ 
                backgroundColor: THEME_COLORS.cardBg,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.textPrimary 
              }}
            />
          </div>

          {(status === 'Resolved' || status === 'Closed') && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Resolution Summary
              </label>
              <textarea
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                placeholder="Describe how the complaint was resolved..."
                rows={4}
                className="w-full p-3 rounded-lg border"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
                required
              />
            </div>
          )}

          <div className="flex gap-4 pt-4" style={{ borderTop: `1px solid ${THEME_COLORS.border}` }}>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg transition-colors duration-200"
              style={{ 
                backgroundColor: THEME_COLORS.primary,
                color: 'white'
              }}
            >
              {submitting ? 'Updating...' : 'Update Status'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition-colors duration-200"
              style={{ 
                backgroundColor: THEME_COLORS.textSecondary,
                color: 'white'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintsPage;