import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import ComplaintTrendsChart from "../data/ComplaintTrendsChart";
import { Doughnut } from "react-chartjs-2";
import { 
  Filter, 
  Search, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  MapPin
} from "lucide-react";
import "chart.js/auto";

// Professional light theme color palette for complaints management [92]
const THEME_COLORS = {
  primary: "#1d4ed8", // Blue-700 (government/public services theme)
  secondary: "#0891b2", // Cyan-600  
  success: "#059669", // Emerald-600
  warning: "#d97706", // Amber-600
  danger: "#dc2626", // Red-600
  info: "#7c3aed", // Violet-600
  background: "#f8fafc", // Slate-50
  cardBg: "#ffffff", // Pure white
  border: "#e2e8f0", // Slate-200
  textPrimary: "#1e293b", // Slate-800
  textSecondary: "#64748b", // Slate-500
  shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)", // Soft shadow
  shadowMedium: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", // Medium shadow
};

const ComplaintsPage = () => {
  const [filters, setFilters] = useState({ zone: "", type: "", status: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const complaintsPerPage = 8; // Increased for better data display

  // Enhanced Complaints Data with more realistic information
  const allComplaints = [
    { id: 1, name: "John Doe", area: "Zone A", type: "Water Supply", date: "2025-09-28", status: "Pending", priority: "High", description: "Water shortage in residential area" },
    { id: 2, name: "Jane Smith", area: "Zone B", type: "Electricity", date: "2025-09-27", status: "Resolved", priority: "Medium", description: "Street light not working" },
    { id: 3, name: "Mike Johnson", area: "Zone A", type: "Waste Management", date: "2025-09-27", status: "In Progress", priority: "Low", description: "Garbage collection delayed" },
    { id: 4, name: "Sarah Lee", area: "Zone C", type: "Road & Infrastructure", date: "2025-09-26", status: "Resolved", priority: "High", description: "Pothole repair needed" },
    { id: 5, name: "David Kim", area: "Zone D", type: "Drainage", date: "2025-09-26", status: "Pending", priority: "High", description: "Waterlogging during rain" },
    { id: 6, name: "Linda Park", area: "Zone B", type: "Water Supply", date: "2025-09-25", status: "Resolved", priority: "Medium", description: "Low water pressure" },
    { id: 7, name: "James Brown", area: "Zone C", type: "Electricity", date: "2025-09-25", status: "In Progress", priority: "High", description: "Power outage in sector 5" },
    { id: 8, name: "Emily Davis", area: "Zone A", type: "Waste Management", date: "2025-09-24", status: "Pending", priority: "Low", description: "Bin overflow issue" },
    { id: 9, name: "Robert Wilson", area: "Zone D", type: "Road & Infrastructure", date: "2025-09-24", status: "Resolved", priority: "Medium", description: "Traffic signal malfunction" },
    { id: 10, name: "Sophia Lee", area: "Zone B", type: "Drainage", date: "2025-09-23", status: "In Progress", priority: "Medium", description: "Blocked storm drain" },
    { id: 11, name: "Daniel Green", area: "Zone C", type: "Others", date: "2025-09-23", status: "Pending", priority: "Low", description: "Park maintenance required" },
    { id: 12, name: "Olivia White", area: "Zone A", type: "Electricity", date: "2025-09-22", status: "Resolved", priority: "High", description: "Transformer issue resolved" },
    { id: 13, name: "Chris Evans", area: "Zone E", type: "Waste Management", date: "2025-09-22", status: "Pending", priority: "Medium", description: "Recycling bin missing" },
    { id: 14, name: "Emma Watson", area: "Zone E", type: "Water Supply", date: "2025-09-21", status: "Resolved", priority: "High", description: "Pipe burst repair completed" },
    { id: 15, name: "Mark Taylor", area: "Zone F", type: "Drainage", date: "2025-09-21", status: "In Progress", priority: "High", description: "Manhole cover damaged" },
    { id: 16, name: "Sophia Carter", area: "Zone F", type: "Others", date: "2025-09-20", status: "Resolved", priority: "Low", description: "Public toilet cleaning" },
    { id: 17, name: "Liam Johnson", area: "Zone G", type: "Road & Infrastructure", date: "2025-09-20", status: "Pending", priority: "High", description: "Road construction complaint" },
    { id: 18, name: "Mia Brown", area: "Zone H", type: "Electricity", date: "2025-09-19", status: "In Progress", priority: "Medium", description: "Meter reading issue" },
    { id: 19, name: "Noah Smith", area: "Zone H", type: "Waste Management", date: "2025-09-19", status: "Resolved", priority: "Low", description: "Composting program query" },
    { id: 20, name: "Isabella Johnson", area: "Zone G", type: "Water Supply", date: "2025-09-18", status: "Pending", priority: "Medium", description: "Water quality concern" },
  ];

  const types = ["Water Supply", "Electricity", "Waste Management", "Road & Infrastructure", "Drainage", "Others"];
  const zones = useMemo(() => [...new Set(allComplaints.map(c => c.area))], [allComplaints]);
  const statuses = useMemo(() => [...new Set(allComplaints.map(c => c.status))], [allComplaints]);

  // Enhanced filtering with search
  const filteredComplaints = useMemo(() => {
    return allComplaints.filter(c =>
      (filters.zone === "" || c.area === filters.zone) &&
      (filters.type === "" || c.type === filters.type) &&
      (filters.status === "" || c.status === filters.status) &&
      (searchText === "" || 
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.description.toLowerCase().includes(searchText.toLowerCase()) ||
        c.area.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [filters, allComplaints, searchText]);

  // Enhanced pagination logic
  const totalPages = Math.ceil(filteredComplaints.length / complaintsPerPage);
  const indexOfLast = currentPage * complaintsPerPage;
  const indexOfFirst = indexOfLast - complaintsPerPage;
  const currentComplaints = filteredComplaints.slice(indexOfFirst, indexOfLast);

  // Enhanced complaint types data with professional colors
  const complaintTypesData = useMemo(() => {
    const typeCounts = types.map(type =>
      filteredComplaints.filter(c => c.type === type).length
    );
    return {
      labels: types,
      datasets: [
        {
          data: typeCounts,
          backgroundColor: [
            THEME_COLORS.primary,
            THEME_COLORS.warning,
            THEME_COLORS.success,
            THEME_COLORS.info,
            THEME_COLORS.secondary,
            THEME_COLORS.danger
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [filteredComplaints]);

  // Enhanced top zones data
  const topZonesData = useMemo(() => {
    const zoneMap = filteredComplaints.reduce((acc, c) => {
      if (!acc[c.area]) acc[c.area] = { zone: c.area, complaints: 0, resolved: 0, pending: 0, inProgress: 0 };
      acc[c.area].complaints++;
      if (c.status === "Resolved") acc[c.area].resolved++;
      else if (c.status === "Pending") acc[c.area].pending++;
      else if (c.status === "In Progress") acc[c.area].inProgress++;
      return acc;
    }, {});
    return Object.values(zoneMap)
      .map(z => ({
        ...z,
        resolutionRate: z.complaints > 0 ? ((z.resolved / z.complaints) * 100).toFixed(1) : "0.0"
      }))
      .sort((a, b) => b.resolutionRate - a.resolutionRate);
  }, [filteredComplaints]);

  // Stats calculations
  const stats = {
    total: filteredComplaints.length,
    pending: filteredComplaints.filter(c => c.status === "Pending").length,
    inProgress: filteredComplaints.filter(c => c.status === "In Progress").length,
    resolved: filteredComplaints.filter(c => c.status === "Resolved").length,
    highPriority: filteredComplaints.filter(c => c.priority === "High").length,
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Resolved":
        return { backgroundColor: `${THEME_COLORS.success}20`, color: THEME_COLORS.success };
      case "Pending":
        return { backgroundColor: `${THEME_COLORS.danger}20`, color: THEME_COLORS.danger };
      case "In Progress":
        return { backgroundColor: `${THEME_COLORS.warning}20`, color: THEME_COLORS.warning };
      default:
        return { backgroundColor: `${THEME_COLORS.info}20`, color: THEME_COLORS.info };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return { backgroundColor: `${THEME_COLORS.danger}20`, color: THEME_COLORS.danger };
      case "Medium":
        return { backgroundColor: `${THEME_COLORS.warning}20`, color: THEME_COLORS.warning };
      case "Low":
        return { backgroundColor: `${THEME_COLORS.success}20`, color: THEME_COLORS.success };
      default:
        return { backgroundColor: `${THEME_COLORS.info}20`, color: THEME_COLORS.info };
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: THEME_COLORS.background }}>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
          Complaints Management System
        </h1>
        <p className="text-lg" style={{ color: THEME_COLORS.textSecondary }}>
          Comprehensive tracking and resolution of citizen complaints and service requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                  {stats.total}
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.info }}>
                  All time record
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
                  {stats.pending}
                </p>
                <p className="text-xs mt-1" style={{ color: stats.pending > 10 ? THEME_COLORS.danger : THEME_COLORS.success }}>
                  {stats.pending > 10 ? 'Needs attention' : 'Under control'}
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
                  {stats.inProgress}
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
                  {stats.resolved}
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.success }}>
                  {Math.round((stats.resolved/stats.total)*100)}% resolution rate
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
                  {stats.highPriority}
                </p>
                <p className="text-xs mt-1" style={{ color: stats.highPriority > 5 ? THEME_COLORS.danger : THEME_COLORS.info }}>
                  {stats.highPriority > 5 ? 'Critical attention' : 'Manageable'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.info}20` }}>
                <Users className="w-6 h-6" style={{ color: THEME_COLORS.info }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Section */}
      <Card className="mb-8" style={{ 
        backgroundColor: THEME_COLORS.cardBg, 
        boxShadow: THEME_COLORS.shadow,
        border: `1px solid ${THEME_COLORS.border}` 
      }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
            <Filter className="w-5 h-5" style={{ color: THEME_COLORS.primary }} />
            Search & Filter Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: THEME_COLORS.textSecondary }} />
                <input 
                  type="text" 
                  placeholder="Search complaints..." 
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200" 
                  style={{ 
                    backgroundColor: THEME_COLORS.cardBg,
                    borderColor: THEME_COLORS.border,
                    color: THEME_COLORS.textPrimary 
                  }}
                  value={searchText} 
                  onChange={e => setSearchText(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Zone
              </label>
              <select
                value={filters.zone}
                onChange={(e) => { setFilters({ ...filters, zone: e.target.value }); setCurrentPage(1); }}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              >
                <option value="">All Zones</option>
                {zones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setCurrentPage(1); }}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              >
                <option value="">All Types</option>
                {types.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              >
                <option value="">All Statuses</option>
                {statuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Actions
              </label>
              <button 
                onClick={() => {
                  setFilters({ zone: "", type: "", status: "" });
                  setSearchText("");
                  setCurrentPage(1);
                }}
                className="w-full p-3 rounded-lg transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: `${THEME_COLORS.secondary}10`,
                  color: THEME_COLORS.secondary,
                  border: `1px solid ${THEME_COLORS.secondary}30`
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
        {/* Enhanced Complaints Table */}
        <Card className="xl:col-span-3" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
                <FileText className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
                Recent Complaints
              </CardTitle>
              <div className="flex items-center gap-2 text-sm" style={{ color: THEME_COLORS.textSecondary }}>
                Showing {currentComplaints.length} of {filteredComplaints.length} complaints
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ backgroundColor: `${THEME_COLORS.primary}10` }}>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
                      Complainant
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
                      Zone
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentComplaints.map((complaint, index) => (
                    <tr 
                      key={complaint.id} 
                      className="border-t hover:bg-gray-50 transition-colors duration-200"
                      style={{ borderColor: THEME_COLORS.border }}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm" style={{ color: THEME_COLORS.textPrimary }}>
                            {complaint.name}
                          </p>
                          <p className="text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                            ID: #{complaint.id}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" style={{ color: THEME_COLORS.textSecondary }} />
                          <span className="text-sm" style={{ color: THEME_COLORS.textPrimary }}>
                            {complaint.area}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: THEME_COLORS.textPrimary }}>
                          {complaint.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" style={{ color: THEME_COLORS.textSecondary }} />
                          <span className="text-sm" style={{ color: THEME_COLORS.textPrimary }}>
                            {new Date(complaint.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={getPriorityStyle(complaint.priority)}
                        >
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={getStatusStyle(complaint.status)}
                        >
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          className="p-2 rounded-lg transition-colors duration-200"
                          style={{ 
                            backgroundColor: `${THEME_COLORS.primary}10`,
                            color: THEME_COLORS.primary
                          }}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: `1px solid ${THEME_COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors duration-200 disabled:opacity-50"
                  style={{ 
                    backgroundColor: currentPage === 1 ? THEME_COLORS.background : THEME_COLORS.cardBg,
                    borderColor: THEME_COLORS.border,
                    color: THEME_COLORS.textPrimary
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm" style={{ color: THEME_COLORS.textSecondary }}>
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors duration-200 disabled:opacity-50"
                  style={{ 
                    backgroundColor: currentPage === totalPages ? THEME_COLORS.background : THEME_COLORS.cardBg,
                    borderColor: THEME_COLORS.border,
                    color: THEME_COLORS.textPrimary
                  }}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm" style={{ color: THEME_COLORS.textSecondary }}>
                Showing {indexOfFirst + 1}-{Math.min(indexOfLast, filteredComplaints.length)} of {filteredComplaints.length} results
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar with Chart */}
        <div className="space-y-6">
          <Card style={{ 
            backgroundColor: THEME_COLORS.cardBg, 
            boxShadow: THEME_COLORS.shadow,
            border: `1px solid ${THEME_COLORS.border}` 
          }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
                <BarChart3 className="w-5 h-5" style={{ color: THEME_COLORS.info }} />
                Complaint Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <Doughnut 
                  data={complaintTypesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          font: { size: 10 }
                        }
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <TrendingUp className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
              Complaint Trends
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Historical complaint patterns and trends
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ComplaintTrendsChart complaints={filteredComplaints} />
            </div>
          </CardContent>
        </Card>

        {/* Top Zones Performance */}
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <Users className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
              Zone Performance
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Resolution rates by service zones
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {topZonesData.map((zone, index) => (
                <div 
                  key={zone.zone} 
                  className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: index < 3 ? `${THEME_COLORS.success}05` : `${THEME_COLORS.border}30`,
                    borderColor: THEME_COLORS.border
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg" style={{ color: THEME_COLORS.textPrimary }}>
                      {zone.zone}
                      {index < 3 && <span className="ml-2 text-sm">🏆</span>}
                    </h3>
                    <span 
                      className="px-2 py-1 rounded-full text-sm font-bold"
                      style={{ 
                        backgroundColor: parseFloat(zone.resolutionRate) >= 70 ? `${THEME_COLORS.success}20` : `${THEME_COLORS.warning}20`,
                        color: parseFloat(zone.resolutionRate) >= 70 ? THEME_COLORS.success : THEME_COLORS.warning
                      }}
                    >
                      {zone.resolutionRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p style={{ color: THEME_COLORS.textSecondary }}>Total</p>
                      <p className="font-medium" style={{ color: THEME_COLORS.textPrimary }}>{zone.complaints}</p>
                    </div>
                    <div>
                      <p style={{ color: THEME_COLORS.textSecondary }}>Resolved</p>
                      <p className="font-medium" style={{ color: THEME_COLORS.success }}>{zone.resolved}</p>
                    </div>
                    <div>
                      <p style={{ color: THEME_COLORS.textSecondary }}>Pending</p>
                      <p className="font-medium" style={{ color: THEME_COLORS.danger }}>{zone.pending}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${zone.resolutionRate}%`,
                          backgroundColor: parseFloat(zone.resolutionRate) >= 70 ? THEME_COLORS.success : THEME_COLORS.warning
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComplaintsPage;
