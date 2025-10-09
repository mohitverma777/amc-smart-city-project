import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Circle } from "react-leaflet";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import L from "leaflet";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { 
  MapPin, 
  Truck, 
  Recycle, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Filter,
  Search,
  TrendingUp,
  Package,
  Factory,
  Activity,
  Maximize2,
  Navigation,
  BarChart3,
  RefreshCw,
  Loader
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "@changey/react-leaflet-markercluster/dist/styles.min.css";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004/api/v1';
const WASTE_API_URL = process.env.REACT_APP_WASTE_API_URL || 'http://localhost:3009/api/v1';

// Professional theme colors
const THEME_COLORS = {
  primary: "#16a34a",
  secondary: "#0891b2", 
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#7c3aed",
  background: "#f8fafc",
  cardBg: "#ffffff",
  border: "#e2e8f0",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  shadowMedium: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
};

// Enhanced icons with better styling
const binIcons = {
  scheduled: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), shadowSize: [41, 41],
  }),
  in_progress: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), shadowSize: [41, 41],
  }),
  completed: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), shadowSize: [41, 41],
  }),
  overdue: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), shadowSize: [41, 41],
  }),
};

const vehicleIcons = {
  active: new L.Icon({ 
    iconUrl: "https://img.icons8.com/color/48/000000/dump-truck.png", 
    iconSize: [32, 32], 
    iconAnchor: [16, 32] 
  }),
  maintenance: new L.Icon({ 
    iconUrl: "https://img.icons8.com/color/48/000000/maintenance.png", 
    iconSize: [32, 32], 
    iconAnchor: [16, 32] 
  }),
  out_of_service: new L.Icon({ 
    iconUrl: "https://img.icons8.com/color/48/000000/cancel.png", 
    iconSize: [32, 32], 
    iconAnchor: [16, 32] 
  }),
};

const binIcon = new L.Icon({
  iconUrl: "https://img.icons8.com/color/48/000000/waste.png", 
  iconSize: [28, 28], 
  iconAnchor: [14, 28]
});

// API Service Functions
class WasteManagementAPI {
  static async fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken'); // Adjust based on your auth implementation
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  // Collection Schedule APIs
  static async getCollectionSchedules(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.fetchWithAuth(`${WASTE_API_URL}/collection-schedules?${searchParams}`);
  }

  static async getActiveCollections() {
    return this.fetchWithAuth(`${WASTE_API_URL}/collection-schedules/active`);
  }

  static async getCollectionStatistics(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.fetchWithAuth(`${WASTE_API_URL}/collection-schedules/statistics?${searchParams}`);
  }

  // Vehicle APIs
  static async getVehicles(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.fetchWithAuth(`${WASTE_API_URL}/vehicles?${searchParams}`);
  }

  static async getVehicleTracking(vehicleId) {
    return this.fetchWithAuth(`${WASTE_API_URL}/vehicles/${vehicleId}/tracking`);
  }

  // Bin APIs
  static async getBins(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.fetchWithAuth(`${WASTE_API_URL}/bins?${searchParams}`);
  }

  static async getBinsNeedingCollection() {
    return this.fetchWithAuth(`${WASTE_API_URL}/bins/needs-collection`);
  }

  // Analytics APIs
  static async getWasteAnalytics(period = 'week') {
    return this.fetchWithAuth(`${WASTE_API_URL}/analytics/waste-statistics?period=${period}`);
  }

  static async getCollectionTrends(period = 'week') {
    return this.fetchWithAuth(`${WASTE_API_URL}/analytics/collection-trends?period=${period}`);
  }

  // Collection Records API
  static async getCollectionRecords(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.fetchWithAuth(`${WASTE_API_URL}/collection-records?${searchParams}`);
  }
}

// Enhanced Hook for API Data Management
const useWasteManagementData = (filters) => {
  const [data, setData] = useState({
    schedules: [],
    vehicles: [],
    bins: [],
    collectionRecords: [],
    analytics: null,
    trends: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        schedulesRes,
        vehiclesRes,
        binsRes,
        recordsRes,
        analyticsRes,
        trendsRes
      ] = await Promise.all([
        WasteManagementAPI.getCollectionSchedules(filters).catch(() => ({ data: { schedules: [] } })),
        WasteManagementAPI.getVehicles().catch(() => ({ data: { vehicles: [] } })),
        WasteManagementAPI.getBins(filters).catch(() => ({ data: { bins: [] } })),
        WasteManagementAPI.getCollectionRecords(filters).catch(() => ({ data: { records: [] } })),
        WasteManagementAPI.getWasteAnalytics().catch(() => ({ data: null })),
        WasteManagementAPI.getCollectionTrends().catch(() => ({ data: [] }))
      ]);

      setData({
        schedules: schedulesRes.data?.schedules || [],
        vehicles: vehiclesRes.data?.vehicles || [],
        bins: binsRes.data?.bins || [],
        collectionRecords: recordsRes.data?.records || [],
        analytics: analyticsRes.data,
        trends: trendsRes.data || [],
      });

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching waste management data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(filters)]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: fetchData, lastUpdate };
};

const WasteManagement = () => {
  const [selectedZone, setSelectedZone] = useState("All Zones");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [searchText, setSearchText] = useState("");
  const [selectedRange, setSelectedRange] = useState("Last 7 Days");
  const [selectedWasteType, setSelectedWasteType] = useState("All Types");
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Create filters object
  const filters = useMemo(() => ({
    ...(selectedZone !== "All Zones" && { zone: selectedZone }),
    ...(selectedStatus !== "All Status" && { status: selectedStatus }),
    ...(selectedWasteType !== "All Types" && { wasteType: selectedWasteType }),
    ...(searchText && { search: searchText }),
    period: selectedRange === "Last 7 Days" ? "week" : "month",
  }), [selectedZone, selectedStatus, selectedWasteType, searchText, selectedRange]);

  const { data, loading, error, refetch, lastUpdate } = useWasteManagementData(filters);

  // Process data for display
  const processedData = useMemo(() => {
    if (!data.schedules.length && !data.collectionRecords.length) return null;

    // Calculate statistics
    const totalWaste = data.collectionRecords.reduce((sum, record) => sum + (record.actualWeight || 0), 0);
    const pendingSchedules = data.schedules.filter(s => s.status === 'scheduled' || s.status === 'in_progress').length;
    const completedSchedules = data.schedules.filter(s => s.status === 'completed').length;
    const completionRate = data.schedules.length > 0 ? 
      Math.round((completedSchedules / data.schedules.length) * 100) : 0;

    // Active vehicles
    const activeVehicles = data.vehicles.filter(v => v.status === 'active').length;

    // Bins needing attention
    const binsNeedingCollection = data.bins.filter(b => 
      b.currentFillLevel >= 85 || 
      (b.nextScheduledCollection && new Date(b.nextScheduledCollection) <= new Date())
    ).length;

    // Process trends data
    const trendsData = data.trends.map(trend => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      waste: trend.totalWeight || 0,
      collections: trend.totalCollections || 0
    }));

    // Waste type distribution
    const wasteTypeData = data.analytics?.wasteStats ? 
      Object.entries(data.analytics.wasteStats).map(([type, amount]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        amount,
        color: getWasteTypeColor(type)
      })) : [];

    return {
      totalWaste,
      pendingSchedules,
      completedSchedules,
      completionRate,
      activeVehicles,
      binsNeedingCollection,
      trendsData,
      wasteTypeData,
    };
  }, [data]);

  const getWasteTypeColor = (type) => {
    const colors = {
      organic: "#22c55e",
      recyclable: "#3b82f6", 
      hazardous: "#ef4444",
      mixed: "#f59e0b",
      electronic: "#8b5cf6",
      construction: "#6b7280"
    };
    return colors[type.toLowerCase()] || "#64748b";
  };

  // Get unique zones from data
  const availableZones = useMemo(() => {
    const zones = new Set();
    data.schedules.forEach(s => zones.add(s.zone));
    data.bins.forEach(b => zones.add(b.zone));
    return Array.from(zones).sort();
  }, [data]);

  // Error boundary
  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.background }}>
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: THEME_COLORS.danger }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
              Connection Error
            </h2>
            <p className="mb-4" style={{ color: THEME_COLORS.textSecondary }}>
              Unable to connect to waste management service: {error}
            </p>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              Try Again
            </button>
          </div>
        </Card>
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
              Waste Management Control Center
            </h1>
            <p className="text-lg" style={{ color: THEME_COLORS.textSecondary }}>
              Real-time monitoring and analytics for smart waste collection operations
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <p className="text-sm" style={{ color: THEME_COLORS.textSecondary }}>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
              style={{ 
                backgroundColor: loading ? THEME_COLORS.border : `${THEME_COLORS.primary}20`,
                color: THEME_COLORS.primary,
                border: `1px solid ${THEME_COLORS.primary}30`
              }}
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>
        </div>
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
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Time Range
              </label>
              <select 
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200" 
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary
                }}
                value={selectedRange} 
                onChange={e => setSelectedRange(e.target.value)}
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Zone
              </label>
              <select 
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200" 
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
                value={selectedZone} 
                onChange={e => setSelectedZone(e.target.value)}
              >
                <option>All Zones</option>
                {availableZones.map(zone => 
                  <option key={zone}>{zone}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Status
              </label>
              <select 
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200" 
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
                value={selectedStatus} 
                onChange={e => setSelectedStatus(e.target.value)}
              >
                <option>All Status</option>
                <option>scheduled</option>
                <option>in_progress</option>
                <option>completed</option>
                <option>overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Waste Type
              </label>
              <select 
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200" 
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
                value={selectedWasteType} 
                onChange={e => setSelectedWasteType(e.target.value)}
              >
                <option>All Types</option>
                <option>household</option>
                <option>organic</option>
                <option>recyclable</option>
                <option>hazardous</option>
                <option>electronic</option>
                <option>mixed</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Search Location
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: THEME_COLORS.textSecondary }} />
                <input 
                  type="text" 
                  placeholder="Search area or route..." 
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
          </div>
        </CardContent>
      </Card>

      {loading && !data.schedules.length ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin" style={{ color: THEME_COLORS.primary }} />
        </div>
      ) : (
        <>
          {/* Enhanced Stats Cards */}
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
                      Total Collected
                    </p>
                    <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                      {processedData ? (processedData.totalWaste / 1000).toFixed(1) : 0}t
                    </p>
                    <p className="text-xs mt-1" style={{ color: THEME_COLORS.success }}>
                      Live data
                    </p>
                  </div>
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.success}20` }}>
                    <Package className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
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
                      Pending Collections
                    </p>
                    <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                      {processedData?.pendingSchedules || 0}
                    </p>
                    <p className="text-xs mt-1" style={{ 
                      color: (processedData?.pendingSchedules || 0) > 3 ? THEME_COLORS.danger : THEME_COLORS.success 
                    }}>
                      {(processedData?.pendingSchedules || 0) > 3 ? 'High priority' : 'Normal level'}
                    </p>
                  </div>
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.warning}20` }}>
                    <Clock className="w-6 h-6" style={{ color: THEME_COLORS.warning }} />
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
                      Completion Rate
                    </p>
                    <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                      {processedData?.completionRate || 0}%
                    </p>
                    <p className="text-xs mt-1" style={{ 
                      color: (processedData?.completionRate || 0) >= 80 ? THEME_COLORS.success : THEME_COLORS.warning 
                    }}>
                      {(processedData?.completionRate || 0) >= 80 ? 'Excellent' : 'Needs improvement'}
                    </p>
                  </div>
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
                    <CheckCircle className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
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
                      Active Vehicles
                    </p>
                    <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                      {processedData?.activeVehicles || 0}/{data.vehicles.length}
                    </p>
                    <p className="text-xs mt-1" style={{ color: THEME_COLORS.secondary }}>
                      {data.vehicles.length > 0 ? Math.round(((processedData?.activeVehicles || 0)/data.vehicles.length)*100) : 0}% utilization
                    </p>
                  </div>
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}>
                    <Truck className="w-6 h-6" style={{ color: THEME_COLORS.secondary }} />
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
                      Bins Need Service
                    </p>
                    <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                      {processedData?.binsNeedingCollection || 0}
                    </p>
                    <p className="text-xs mt-1" style={{ 
                      color: (processedData?.binsNeedingCollection || 0) === 0 ? THEME_COLORS.success : THEME_COLORS.warning 
                    }}>
                      {(processedData?.binsNeedingCollection || 0) === 0 ? 'All serviced' : 'Requires attention'}
                    </p>
                  </div>
                  <div className="p-3 rounded-full" style={{ 
                    backgroundColor: `${(processedData?.binsNeedingCollection || 0) === 0 ? THEME_COLORS.success : THEME_COLORS.warning}20` 
                  }}>
                    <AlertTriangle className="w-6 h-6" style={{ 
                      color: (processedData?.binsNeedingCollection || 0) === 0 ? THEME_COLORS.success : THEME_COLORS.warning 
                    }} />
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
                      System Status
                    </p>
                    <p className="text-2xl font-bold" style={{ color: THEME_COLORS.success }}>
                      Live
                    </p>
                    <p className="text-xs mt-1" style={{ color: THEME_COLORS.success }}>
                      Connected to backend
                    </p>
                  </div>
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.success}20` }}>
                    <Activity className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
            {/* Enhanced Map Section */}
            <Card className="xl:col-span-3" style={{ 
              backgroundColor: THEME_COLORS.cardBg, 
              boxShadow: THEME_COLORS.shadowMedium,
              border: `1px solid ${THEME_COLORS.border}` 
            }}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
                    <MapPin className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
                    Live Operations Map
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.success }}></div>
                        <span style={{ color: THEME_COLORS.textSecondary }}>
                          Completed ({data.schedules.filter(s => s.status === 'completed').length})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.warning }}></div>
                        <span style={{ color: THEME_COLORS.textSecondary }}>
                          In Progress ({data.schedules.filter(s => s.status === 'in_progress').length})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.secondary }}></div>
                        <span style={{ color: THEME_COLORS.textSecondary }}>
                          Fleet ({data.vehicles.length})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMapExpanded(!isMapExpanded)}
                      className="p-2 rounded-lg transition-colors duration-200"
                      style={{ 
                        backgroundColor: `${THEME_COLORS.primary}10`,
                        color: THEME_COLORS.primary,
                        border: `1px solid ${THEME_COLORS.primary}30`
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ height: "400px", width: "100%" }}>
                  <MapContainer 
                    center={[23.0225, 72.5714]} // Ahmedabad coordinates
                    zoom={12} 
                    className="rounded-xl overflow-hidden border"
                    style={{ 
                      height: "100%", 
                      width: "100%",
                      backgroundColor: '#f1f5f9',
                      border: `1px solid ${THEME_COLORS.border}`
                    }}
                  >
                    <TileLayer 
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                      attribution='&copy; OpenStreetMap contributors' 
                    />
                    <LayersControl position="topright">
                      {/* Collection Schedules Layer */}
                      <LayersControl.Overlay name="Collection Points" checked>
                        <LayerGroup>
                          <MarkerClusterGroup chunkedLoading>
                            {data.schedules.map((schedule, i) => (
                              schedule.collectionPoints && schedule.collectionPoints.map((point, j) => (
                                <Marker 
                                  key={`schedule-${schedule.id}-point-${j}`} 
                                  position={[point.latitude || 23.0225 + (Math.random()-0.5)*0.1, point.longitude || 72.5714 + (Math.random()-0.5)*0.1]} 
                                  icon={binIcons[schedule.status] || binIcons.scheduled}
                                >
                                  <Popup>
                                    <div className="p-4 min-w-[280px]" style={{ 
                                      backgroundColor: THEME_COLORS.cardBg,
                                      color: THEME_COLORS.textPrimary,
                                      borderRadius: '8px',
                                      boxShadow: THEME_COLORS.shadow
                                    }}>
                                      <div className="flex items-center gap-2 mb-3">
                                        <Package className="w-4 h-4" style={{ color: THEME_COLORS.primary }} />
                                        <strong className="text-lg">{schedule.routeName}</strong>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          schedule.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                                          schedule.status === "in_progress" ? "bg-orange-100 text-orange-700" :
                                          schedule.status === "completed" ? "bg-green-100 text-green-700" :
                                          "bg-red-100 text-red-700"
                                        }`}>
                                          {schedule.status.replace('_', ' ')}
                                        </span>
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        <div><strong>Zone:</strong> {schedule.zone}</div>
                                        <div><strong>Ward:</strong> {schedule.ward}</div>
                                        <div><strong>Waste Type:</strong> {schedule.wasteType}</div>
                                        <div><strong>Vehicle:</strong> {schedule.vehicleId}</div>
                                        <div><strong>Scheduled:</strong> {new Date(schedule.scheduledDate).toLocaleDateString()}</div>
                                        {schedule.estimatedWasteQuantity && (
                                          <div><strong>Est. Waste:</strong> {schedule.estimatedWasteQuantity} kg</div>
                                        )}
                                        {schedule.actualStartTime && (
                                          <div><strong>Started:</strong> {new Date(schedule.actualStartTime).toLocaleTimeString()}</div>
                                        )}
                                      </div>
                                    </div>
                                  </Popup>
                                </Marker>
                              ))
                            ))}
                          </MarkerClusterGroup>
                        </LayerGroup>
                      </LayersControl.Overlay>

                      {/* Waste Bins Layer */}
                      <LayersControl.Overlay name="Smart Bins" checked>
                        <LayerGroup>
                          <MarkerClusterGroup chunkedLoading>
                            {data.bins.map((bin, i) => (
                              <Marker 
                                key={`bin-${bin.id}`} 
                                position={[
                                  bin.location?.latitude || 23.0225 + (Math.random()-0.5)*0.1, 
                                  bin.location?.longitude || 72.5714 + (Math.random()-0.5)*0.1
                                ]} 
                                icon={binIcon}
                              >
                                <Popup>
                                  <div className="p-4 min-w-[250px]" style={{ 
                                    backgroundColor: THEME_COLORS.cardBg,
                                    color: THEME_COLORS.textPrimary,
                                    borderRadius: '8px',
                                    boxShadow: THEME_COLORS.shadow
                                  }}>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Recycle className="w-4 h-4" style={{ color: THEME_COLORS.primary }} />
                                      <strong className="text-lg">Bin {bin.binId}</strong>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        bin.status === "active" ? "bg-green-100 text-green-700" :
                                        bin.status === "full" ? "bg-red-100 text-red-700" :
                                        bin.status === "maintenance" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-gray-100 text-gray-700"
                                      }`}>
                                        {bin.status}
                                      </span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>Location:</strong> {bin.address}</div>
                                      <div><strong>Type:</strong> {bin.binType} - {bin.wasteCategory}</div>
                                      <div><strong>Capacity:</strong> {bin.capacity}L</div>
                                      <div className="flex items-center gap-2">
                                        <strong>Fill Level:</strong>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="h-2 rounded-full transition-all duration-300" 
                                            style={{ 
                                              width: `${bin.currentFillLevel}%`, 
                                              backgroundColor: bin.currentFillLevel >= 90 ? THEME_COLORS.danger : 
                                                             bin.currentFillLevel >= 70 ? THEME_COLORS.warning : 
                                                             THEME_COLORS.success
                                            }}
                                          ></div>
                                        </div>
                                        <span className="text-xs">{bin.currentFillLevel}%</span>
                                      </div>
                                      {bin.lastCollectionDate && (
                                        <div><strong>Last Collected:</strong> {new Date(bin.lastCollectionDate).toLocaleDateString()}</div>
                                      )}
                                      {bin.nextScheduledCollection && (
                                        <div><strong>Next Collection:</strong> {new Date(bin.nextScheduledCollection).toLocaleDateString()}</div>
                                      )}
                                      {bin.hasIoTSensor && (
                                        <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#ecfdf5' }}>
                                          <Activity className="w-4 h-4 text-green-600" />
                                          <span className="text-green-700 text-xs">Smart Sensor Active</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Popup>
                              </Marker>
                            ))}
                          </MarkerClusterGroup>
                        </LayerGroup>
                      </LayersControl.Overlay>

                      {/* Fleet Vehicles Layer */}
                      <LayersControl.Overlay name="Fleet Vehicles" checked>
                        <LayerGroup>
                          <MarkerClusterGroup chunkedLoading>
                            {data.vehicles.map((vehicle, i) => (
                              <Marker 
                                key={`vehicle-${vehicle.id}`} 
                                position={[
                                  vehicle.currentLocation?.latitude || 23.0225 + (Math.random()-0.5)*0.1, 
                                  vehicle.currentLocation?.longitude || 72.5714 + (Math.random()-0.5)*0.1
                                ]} 
                                icon={vehicleIcons[vehicle.status] || vehicleIcons.active}
                              >
                                <Popup>
                                  <div className="p-4 min-w-[280px]" style={{ 
                                    backgroundColor: THEME_COLORS.cardBg,
                                    color: THEME_COLORS.textPrimary,
                                    borderRadius: '8px',
                                    boxShadow: THEME_COLORS.shadow
                                  }}>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Truck className="w-4 h-4" style={{ color: THEME_COLORS.secondary }} />
                                      <strong className="text-lg">{vehicle.vehicleId}</strong>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        vehicle.status === "active" ? "bg-green-100 text-green-700" :
                                        vehicle.status === "maintenance" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-red-100 text-red-700"
                                      }`}>
                                        {vehicle.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>Registration:</strong> {vehicle.registrationNumber}</div>
                                      <div><strong>Type:</strong> {vehicle.vehicleType}</div>
                                      <div><strong>Zone:</strong> {vehicle.assignedZone}</div>
                                      <div><strong>Driver:</strong> {vehicle.driverName || 'Unassigned'}</div>
                                      <div><strong>Capacity:</strong> {vehicle.capacity} m³</div>
                                      {vehicle.totalWasteCollected && (
                                        <div><strong>Total Collected:</strong> {vehicle.totalWasteCollected} kg</div>
                                      )}
                                      {vehicle.averageFuelConsumption && (
                                        <div><strong>Fuel Efficiency:</strong> {vehicle.averageFuelConsumption} km/L</div>
                                      )}
                                      {vehicle.hasGPS && (
                                        <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#ecfdf5' }}>
                                          <Navigation className="w-4 h-4 text-green-600" />
                                          <span className="text-green-700 text-xs">GPS Tracking Active</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Popup>
                              </Marker>
                            ))}
                          </MarkerClusterGroup>
                        </LayerGroup>
                      </LayersControl.Overlay>
                    </LayersControl>
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Sidebar */}
            <div className="space-y-6">
              {/* Collection Trends Chart */}
              <Card style={{ 
                backgroundColor: THEME_COLORS.cardBg, 
                boxShadow: THEME_COLORS.shadow,
                border: `1px solid ${THEME_COLORS.border}` 
              }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
                    <TrendingUp className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
                    Collection Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={processedData?.trendsData || []}>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: THEME_COLORS.textSecondary }}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: THEME_COLORS.cardBg,
                          border: `1px solid ${THEME_COLORS.border}`,
                          borderRadius: '8px',
                          boxShadow: THEME_COLORS.shadow
                        }}
                      />
                      <Bar 
                        dataKey="waste" 
                        fill={THEME_COLORS.success}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Waste Type Distribution */}
              <Card style={{ 
                backgroundColor: THEME_COLORS.cardBg, 
                boxShadow: THEME_COLORS.shadow,
                border: `1px solid ${THEME_COLORS.border}` 
              }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
                    <Recycle className="w-5 h-5" style={{ color: THEME_COLORS.primary }} />
                    Waste Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie 
                        data={processedData?.wasteTypeData || []} 
                        dataKey="amount" 
                        nameKey="type" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={50}
                        innerRadius={20}
                      >
                        {(processedData?.wasteTypeData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: THEME_COLORS.cardBg,
                          border: `1px solid ${THEME_COLORS.border}`,
                          borderRadius: '8px',
                          boxShadow: THEME_COLORS.shadow
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {(processedData?.wasteTypeData || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span style={{ color: THEME_COLORS.textSecondary }}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card style={{ 
                backgroundColor: THEME_COLORS.cardBg, 
                boxShadow: THEME_COLORS.shadow,
                border: `1px solid ${THEME_COLORS.border}` 
              }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg" style={{ color: THEME_COLORS.textPrimary }}>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button 
                    onClick={() => window.open(`${WASTE_API_URL}/vehicles`, '_blank')}
                    className="w-full p-3 rounded-lg text-left hover:scale-105 transition-all duration-200"
                    style={{ 
                      backgroundColor: `${THEME_COLORS.primary}10`,
                      color: THEME_COLORS.primary,
                      border: `1px solid ${THEME_COLORS.primary}30`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">Manage Fleet</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => window.open(`${WASTE_API_URL}/collection-schedules/create`, '_blank')}
                    className="w-full p-3 rounded-lg text-left hover:scale-105 transition-all duration-200"
                    style={{ 
                      backgroundColor: `${THEME_COLORS.warning}10`,
                      color: THEME_COLORS.warning,
                      border: `1px solid ${THEME_COLORS.warning}30`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Schedule Collection</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => window.open(`${WASTE_API_URL}/analytics/reports`, '_blank')}
                    className="w-full p-3 rounded-lg text-left hover:scale-105 transition-all duration-200"
                    style={{ 
                      backgroundColor: `${THEME_COLORS.secondary}10`,
                      color: THEME_COLORS.secondary,
                      border: `1px solid ${THEME_COLORS.secondary}30`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4" />
                      <span className="font-medium">Analytics Report</span>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WasteManagement;
