// src/data/RecentComplaintsTable.jsx
import React from 'react';
import { Eye, Edit, MessageSquare, MapPin, User, Calendar, Flag } from 'lucide-react';

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
  textSecondary: "#64748b"
};

const RecentComplaintsTable = ({ 
  complaints = [], 
  onViewComplaint, 
  onUpdateStatus, 
  onAddComment,
  pagination = {},
  onPageChange,
  loading = false
}) => {
  const getStatusColor = (status) => {
    const colors = {
      'Pending': THEME_COLORS.warning,
      'Acknowledged': THEME_COLORS.info,
      'In Progress': THEME_COLORS.secondary,
      'Under Review': THEME_COLORS.info,
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // ✅ Helper function to get citizen name
  const getCitizenName = (complaint) => {
    // If complaint is anonymous, show "Anonymous"
    if (complaint.isAnonymous) {
      return 'Anonymous';
    }
    
    // Try different name fields
    return complaint.citizenName || 
           complaint.name || 
           complaint.userName || 
           (complaint.citizenEmail ? complaint.citizenEmail.split('@')[0] : 'Unknown');
  };

  // ✅ Helper function to get area/ward name
  const getAreaName = (complaint) => {
    // Try different location fields in order of preference
    return complaint.ward || 
           complaint.zone || 
           complaint.area || 
           complaint.district ||
           (complaint.address ? complaint.address.split(',')[0] : 'Unknown');
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" 
             style={{ borderColor: THEME_COLORS.primary }}></div>
        <p style={{ color: THEME_COLORS.textSecondary }}>Loading complaints...</p>
      </div>
    );
  }

  if (!complaints || complaints.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: THEME_COLORS.textSecondary }} />
        <p className="text-lg font-medium mb-2" style={{ color: THEME_COLORS.textPrimary }}>
          No complaints found
        </p>
        <p style={{ color: THEME_COLORS.textSecondary }}>
          Try adjusting your filters or check back later for new complaints.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr style={{ backgroundColor: THEME_COLORS.background }}>
              <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                  style={{ color: THEME_COLORS.textSecondary }}>
                <User className="w-4 h-4 inline mr-2" />
                NAME
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                  style={{ color: THEME_COLORS.textSecondary }}>
                <MapPin className="w-4 h-4 inline mr-2" />
                AREA
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                  style={{ color: THEME_COLORS.textSecondary }}>
                TYPE
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                  style={{ color: THEME_COLORS.textSecondary }}>
                <Calendar className="w-4 h-4 inline mr-2" />
                DATE
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                  style={{ color: THEME_COLORS.textSecondary }}>
                <Flag className="w-4 h-4 inline mr-2" />
                STATUS
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                  style={{ color: THEME_COLORS.textSecondary }}>
                PRIORITY
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                  style={{ color: THEME_COLORS.textSecondary }}>
                ACTIONS
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y" style={{ backgroundColor: THEME_COLORS.cardBg, borderColor: THEME_COLORS.border }}>
            {complaints.map((complaint, index) => (
              <tr key={complaint.id || index} 
                  className="hover:bg-opacity-50 transition-colors duration-200"
                  style={{ backgroundColor: index % 2 === 0 ? THEME_COLORS.cardBg : `${THEME_COLORS.background}50` }}>
                
                {/* ✅ Name Column - Fixed */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
                      <User className="w-4 h-4" style={{ color: THEME_COLORS.primary }} />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                        {getCitizenName(complaint)}
                      </div>
                      {complaint.citizenEmail && !complaint.isAnonymous && (
                        <div className="text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                          {complaint.citizenEmail}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* ✅ Area Column - Fixed */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                    {getAreaName(complaint)}
                  </div>
                  {complaint.zone && complaint.ward && complaint.zone !== complaint.ward && (
                    <div className="text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                      Zone: {complaint.zone}
                    </div>
                  )}
                </td>

                {/* Type Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                    {complaint.category || 'General'}
                  </div>
                  {complaint.subCategory && (
                    <div className="text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                      {complaint.subCategory}
                    </div>
                  )}
                </td>

                {/* Date Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                    {formatDate(complaint.createdAt)}
                  </div>
                  {complaint.expectedResolutionDate && (
                    <div className="text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                      Due: {formatDate(complaint.expectedResolutionDate)}
                    </div>
                  )}
                </td>

                {/* Status Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${getStatusColor(complaint.status)}20`,
                          color: getStatusColor(complaint.status)
                        }}>
                    {complaint.status || 'Pending'}
                  </span>
                </td>

                {/* Priority Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${getPriorityColor(complaint.priority)}20`,
                          color: getPriorityColor(complaint.priority)
                        }}>
                    {complaint.priority || 'Medium'}
                  </span>
                </td>

                {/* Actions Column */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewComplaint && onViewComplaint(complaint.id)}
                      className="p-2 rounded-lg transition-colors duration-200 hover:scale-105"
                      style={{ 
                        backgroundColor: `${THEME_COLORS.primary}10`,
                        color: THEME_COLORS.primary
                      }}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onUpdateStatus && onUpdateStatus(complaint)}
                      className="p-2 rounded-lg transition-colors duration-200 hover:scale-105"
                      style={{ 
                        backgroundColor: `${THEME_COLORS.warning}10`,
                        color: THEME_COLORS.warning
                      }}
                      title="Update Status"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onAddComment && onAddComment(complaint.id, 'Quick update')}
                      className="p-2 rounded-lg transition-colors duration-200 hover:scale-105"
                      style={{ 
                        backgroundColor: `${THEME_COLORS.info}10`,
                        color: THEME_COLORS.info
                      }}
                      title="Add Comment"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4" 
             style={{ backgroundColor: THEME_COLORS.cardBg, borderTop: `1px solid ${THEME_COLORS.border}` }}>
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange && onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: THEME_COLORS.primary,
                color: 'white'
              }}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange && onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="ml-3 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: THEME_COLORS.primary,
                color: 'white'
              }}
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm" style={{ color: THEME_COLORS.textSecondary }}>
                Showing{' '}
                <span className="font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                  {((pagination.currentPage - 1) * pagination.limit) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                </span>{' '}
                of{' '}
                <span className="font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                  {pagination.totalCount}
                </span>{' '}
                results
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {/* Previous Button */}
                <button
                  onClick={() => onPageChange && onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-2 text-sm font-medium rounded-l-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-50"
                  style={{ 
                    backgroundColor: THEME_COLORS.cardBg,
                    borderColor: THEME_COLORS.border,
                    color: THEME_COLORS.textPrimary
                  }}
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const startPage = Math.max(1, pagination.currentPage - 2);
                  const pageNumber = startPage + i;
                  
                  if (pageNumber > pagination.totalPages) return null;
                  
                  const isActive = pageNumber === pagination.currentPage;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => onPageChange && onPageChange(pageNumber)}
                      className="px-3 py-2 text-sm font-medium border hover:bg-opacity-50"
                      style={{ 
                        backgroundColor: isActive ? THEME_COLORS.primary : THEME_COLORS.cardBg,
                        borderColor: THEME_COLORS.border,
                        color: isActive ? 'white' : THEME_COLORS.textPrimary
                      }}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                {/* Next Button */}
                <button
                  onClick={() => onPageChange && onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium rounded-r-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-50"
                  style={{ 
                    backgroundColor: THEME_COLORS.cardBg,
                    borderColor: THEME_COLORS.border,
                    color: THEME_COLORS.textPrimary
                  }}
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentComplaintsTable;
