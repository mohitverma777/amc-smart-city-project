import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { 
  AlertTriangle, 
  Trash2, 
  FileWarning, 
  Activity, 
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  MapPin,
  Settings,
  Filter,
  Search,
  BarChart3,
  Eye,
  Zap
} from "lucide-react";
import ComplaintTrendsChart from '../data/ComplaintTrendsChart';
import RecentComplaintsTable from "../data/RecentComplaintsTable";
import TopZones from "../data/TopZones";

// Professional light theme color palette for public services [92]
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

// Enhanced dummy data with more realistic public services information
const topStats = [
  {
    title: "Waste Collection",
    value: "143",
    sub: "Updated 15 mins ago",
    trend: "+12%",
    colorTheme: THEME_COLORS.success,
    bgColor: `${THEME_COLORS.success}10`,
    icon: <Trash2 className="h-6 w-6" />,
    status: "operational"
  },
  {
    title: "Active Complaints",
    value: "86",
    sub: "5 new today",
    trend: "-8%",
    colorTheme: THEME_COLORS.warning,
    bgColor: `${THEME_COLORS.warning}10`,
    icon: <FileWarning className="h-6 w-6" />,
    status: "attention"
  },
  {
    title: "Traffic Flow",
    value: "Medium",
    sub: "Across 4 major areas",
    trend: "Stable",
    colorTheme: THEME_COLORS.info,
    bgColor: `${THEME_COLORS.info}10`,
    icon: <Activity className="h-6 w-6" />,
    status: "monitoring"
  },
  {
    title: "Electricity Uptime",
    value: "99.2%",
    sub: "Last 30 days",
    trend: "+0.3%",
    colorTheme: THEME_COLORS.primary,
    bgColor: `${THEME_COLORS.primary}10`,
    icon: <Zap className="h-6 w-6" />,
    status: "excellent"
  },
  {
    title: "Response Time",
    value: "12m",
    sub: "Average resolution",
    trend: "-15%",
    colorTheme: THEME_COLORS.secondary,
    bgColor: `${THEME_COLORS.secondary}10`,
    icon: <Clock className="h-6 w-6" />,
    status: "improving"
  },
  {
    title: "Resolved Issues",
    value: "234",
    sub: "This week",
    trend: "+18%",
    colorTheme: THEME_COLORS.success,
    bgColor: `${THEME_COLORS.success}10`,
    icon: <CheckCircle className="h-6 w-6" />,
    status: "excellent"
  },
];

const highAlerts = [
  { 
    id: 1,
    text: "Fire detected in Zone 3 — Immediate action required", 
    type: "critical", 
    icon: "🔥",
    time: "2 mins ago",
    zone: "Zone 3",
    priority: "high"
  },
  { 
    id: 2,
    text: "Waterlogging near Navrangpura — Level: Moderate", 
    type: "warning", 
    icon: "🚨",
    time: "15 mins ago",
    zone: "Navrangpura",
    priority: "medium"
  },
  { 
    id: 3,
    text: "Traffic congestion on CG Road — Estimated delay: 20 min", 
    type: "info", 
    icon: "🚗",
    time: "8 mins ago",
    zone: "CG Road",
    priority: "low"
  },
  { 
    id: 4,
    text: "Waste collection delayed in Satellite area", 
    type: "warning", 
    icon: "🗑️",
    time: "25 mins ago",
    zone: "Satellite",
    priority: "medium"
  },
];

const sensorStatus = [
  { name: "Bin Sensor 1", location: "Maninagar", status: "Normal", color: THEME_COLORS.success, percentage: 85 },
  { name: "Bin Sensor 4", location: "Usmanpura", status: "Overflow", color: THEME_COLORS.danger, percentage: 95 },
  { name: "Traffic Signal 2", location: "Ellis Bridge", status: "Unstable", color: THEME_COLORS.warning, percentage: 65 },
  { name: "Water Level Sensor", location: "Ambawadi", status: "Normal", color: THEME_COLORS.success, percentage: 78 },
  { name: "Air Quality Monitor", location: "Bopal", status: "Good", color: THEME_COLORS.primary, percentage: 88 },
];

const Dashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const getAlertStyle = (type) => {
    switch (type) {
      case "critical": 
        return `bg-gradient-to-r from-red-50 to-red-100 border-red-500 text-red-900`;
      case "warning": 
        return `bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-500 text-yellow-900`;
      case "info": 
        return `bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500 text-blue-900`;
      default: 
        return `bg-gradient-to-r from-gray-50 to-gray-100 border-gray-500 text-gray-900`;
    }
  };

  const filteredAlerts = highAlerts.filter(alert => 
    selectedFilter === "all" || alert.priority === selectedFilter
  );

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: THEME_COLORS.background }}>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
          Public Services Dashboard
        </h1>
        <p className="text-lg" style={{ color: THEME_COLORS.textSecondary }}>
          Real-time monitoring and management of municipal services and operations
        </p>
      </div>

      
      {/* Enhanced Top Cards with Professional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {topStats.map((item, index) => (
          <Card
            key={index}
            className="hover:scale-105 transition-all duration-300"
            style={{
              backgroundColor: THEME_COLORS.cardBg,
              boxShadow: THEME_COLORS.shadow,
              border: `1px solid ${THEME_COLORS.border}`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                    {item.value}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                      {item.sub}
                    </p>
                    <span 
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: item.bgColor,
                        color: item.colorTheme
                      }}
                    >
                      {item.trend}
                    </span>
                  </div>
                </div>
                <div 
                  className="p-3 rounded-full"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <div style={{ color: item.colorTheme }}>
                    {item.icon}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
{/* Search and Filter Section */}
      <Card className="mb-8" style={{ 
        backgroundColor: THEME_COLORS.cardBg, 
        boxShadow: THEME_COLORS.shadow,
        border: `1px solid ${THEME_COLORS.border}` 
      }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
            <Filter className="w-5 h-5" style={{ color: THEME_COLORS.primary }} />
            Quick Actions & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Search Services
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: THEME_COLORS.textSecondary }} />
                <input 
                  type="text" 
                  placeholder="Search zones, services, alerts..." 
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
                Priority Filter
              </label>
              <select 
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200" 
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
                value={selectedFilter} 
                onChange={e => setSelectedFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Quick Actions
              </label>
              <button 
                className="w-full p-3 rounded-lg transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: THEME_COLORS.primary,
                  color: 'white'
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">View All</span>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
        {/* Enhanced High Alerts Section */}
        <Card className="xl:col-span-3" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
                <AlertTriangle className="h-6 w-6" style={{ color: THEME_COLORS.danger }} />
                High Priority Alerts
              </CardTitle>
              <div className="flex items-center gap-2 text-sm" style={{ color: THEME_COLORS.textSecondary }}>
                <Activity className="w-4 h-4" />
                Live Updates
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.danger }}></div>
                <span style={{ color: THEME_COLORS.textSecondary }}>Critical ({filteredAlerts.filter(a => a.type === 'critical').length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.warning }}></div>
                <span style={{ color: THEME_COLORS.textSecondary }}>Warning ({filteredAlerts.filter(a => a.type === 'warning').length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.primary }}></div>
                <span style={{ color: THEME_COLORS.textSecondary }}>Info ({filteredAlerts.filter(a => a.type === 'info').length})</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border-l-4 p-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${getAlertStyle(alert.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{alert.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1">{alert.text}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{alert.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{alert.zone}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            alert.priority === 'high' ? 'bg-red-200 text-red-800' :
                            alert.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {alert.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="p-2 rounded-lg transition-colors duration-200 hover:bg-white/50"
                      title="Mark as handled"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredAlerts.length === 0 && (
                <div className="text-center py-8" style={{ color: THEME_COLORS.textSecondary }}>
                  <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: THEME_COLORS.success }} />
                  <p>No alerts match the selected filter</p>
                  <p className="text-sm mt-1">All systems operating normally!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Sensor Status Sidebar */}
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
              <Settings className="w-5 h-5" style={{ color: THEME_COLORS.secondary }} />
              Sensor Status
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Real-time monitoring systems
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sensorStatus.map((sensor, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: `${sensor.color}05`,
                    borderColor: `${sensor.color}30`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
                        {sensor.name}
                      </p>
                      <p className="text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                        {sensor.location}
                      </p>
                    </div>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${sensor.color}20`,
                        color: sensor.color
                      }}
                    >
                      {sensor.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${sensor.percentage}%`,
                          backgroundColor: sensor.color
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium" style={{ color: THEME_COLORS.textSecondary }}>
                      {sensor.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <div className="space-y-8">
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <TrendingUp className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
              Complaint Trends Analysis
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Historical data and trending patterns
            </p>
          </CardHeader>
          <CardContent>
            <ComplaintTrendsChart />
          </CardContent>
        </Card>

        {/* <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <FileWarning className="w-6 w-6" style={{ color: THEME_COLORS.warning }} />
              Recent Complaints
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Latest service requests and their status
            </p>
          </CardHeader>
          <CardContent>
            <RecentComplaintsTable />
          </CardContent>
        </Card> */}

        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <BarChart3 className="w-6 h-6" style={{ color: THEME_COLORS.info }} />
              Top Service Zones
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Areas with highest service activity
            </p>
          </CardHeader>
          <CardContent>
            <TopZones />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
