import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Circle } from "react-leaflet";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import L from "leaflet";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { 
  Zap, 
  Activity, 
  TrendingUp,
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Filter,
  Search,
  Package,
  Settings,
  MapPin,
  Maximize2,
  BarChart3,
  Users,
  Battery,
  Gauge,
  Power,
  PieChart as PieChartIcon,
  Calendar,
  DollarSign
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

// Enhanced dummy data for electricity management
const electricityConnections = [
  { id: "ELE001", customerName: "Amit Patel", connectionType: "domestic", address: "Park Lane", zone: "Zone 1", lat: 23.07, lng: 72.55, status: "Active", consumption: 245, lastReading: "2025-09-28", bill: 1850, connectionCategory: "apl", smartMeter: true },
  { id: "ELE002", customerName: "Priya Shah", connectionType: "commercial", address: "MG Road", zone: "Zone 3", lat: 23.0305, lng: 72.5695, status: "Active", consumption: 1243, lastReading: "2025-09-28", bill: 15420, connectionCategory: "commercial", smartMeter: true },
  { id: "ELE003", customerName: "Ravi Industries", connectionType: "industrial", address: "Ring Road", zone: "Zone 5", lat: 23.035, lng: 72.58, status: "Pending", consumption: 5420, lastReading: "2025-09-27", bill: 89500, connectionCategory: "industrial_large", smartMeter: false },
  { id: "ELE004", customerName: "Sita Devi", connectionType: "domestic", address: "Central Ave", zone: "Zone 2", lat: 23.05, lng: 72.59, status: "Active", consumption: 98, lastReading: "2025-09-26", bill: 485, connectionCategory: "bpl", smartMeter: false },
  { id: "ELE005", customerName: "Green Hospital", connectionType: "institutional", address: "Lake Street", zone: "Zone 4", lat: 23.06, lng: 72.57, status: "Active", consumption: 2150, lastReading: "2025-09-25", bill: 28900, connectionCategory: "institutional", smartMeter: true },
  { id: "ELE006", customerName: "Tech Mall", connectionType: "commercial", address: "IT Park", zone: "Zone 1", lat: 23.072, lng: 72.552, status: "Disconnected", consumption: 0, lastReading: "2025-09-20", bill: 0, connectionCategory: "commercial", smartMeter: true },
  { id: "ELE007", customerName: "Kumar Family", connectionType: "domestic", address: "Rose Garden", zone: "Zone 3", lat: 23.032, lng: 72.571, status: "Active", consumption: 180, lastReading: "2025-09-28", bill: 1240, connectionCategory: "apl", smartMeter: false },
  { id: "ELE008", customerName: "Steel Works Ltd", connectionType: "industrial", address: "Industrial Area", zone: "Zone 5", lat: 23.038, lng: 72.582, status: "Active", consumption: 8950, lastReading: "2025-09-27", bill: 145200, connectionCategory: "industrial_large", smartMeter: true },
];

const transformers = [
  { id: "TF001", name: "Central Transformer", lat: 23.05, lng: 72.60, capacity: "2500 kVA", currentLoad: 65, status: "Operational", connectedConsumers: 1250 },
  { id: "TF002", name: "Industrial Transformer", lat: 23.045, lng: 72.575, capacity: "5000 kVA", currentLoad: 82, status: "Operational", connectedConsumers: 850 },
  { id: "TF003", name: "Residential Transformer", lat: 23.038, lng: 72.565, capacity: "1000 kVA", currentLoad: 45, status: "Maintenance", connectedConsumers: 680 },
  { id: "TF004", name: "Commercial Transformer", lat: 23.055, lng: 72.568, capacity: "3000 kVA", currentLoad: 70, status: "Operational", connectedConsumers: 420 },
];

const smartMeterData = [
  { meterId: "SM001", connectionId: "ELE001", voltage: 220.5, current: 12.3, powerFactor: 0.92, lastUpdate: "2025-09-28 10:00", status: "Online" },
  { meterId: "SM002", connectionId: "ELE002", voltage: 415.2, current: 45.8, powerFactor: 0.85, lastUpdate: "2025-09-28 09:58", status: "Online" },
  { meterId: "SM003", connectionId: "ELE005", voltage: 230.1, current: 28.4, powerFactor: 0.89, lastUpdate: "2025-09-28 09:55", status: "Offline" },
  { meterId: "SM004", connectionId: "ELE008", voltage: 418.9, current: 125.6, powerFactor: 0.78, lastUpdate: "2025-09-28 09:59", status: "Online" },
];

// Enhanced connection type data with energy colors
const connectionTypeData = [
  { type: "Domestic", count: 3254, consumption: 485000, color: "#22c55e" },
  { type: "Commercial", count: 892, consumption: 1250000, color: "#3b82f6" },
  { type: "Industrial", count: 156, consumption: 2150000, color: "#f59e0b" },
  { type: "Institutional", count: 89, consumption: 325000, color: "#8b5cf6" },
];

const consumptionTrends = [
  { month: "Jan", domestic: 480, commercial: 1200, industrial: 2100 },
  { month: "Feb", domestic: 465, commercial: 1180, industrial: 2050 },
  { month: "Mar", domestic: 425, commercial: 1250, industrial: 2200 },
  { month: "Apr", domestic: 520, commercial: 1320, industrial: 2350 },
  { month: "May", domestic: 680, commercial: 1480, industrial: 2500 },
  { month: "Jun", domestic: 720, commercial: 1520, industrial: 2600 },
  { month: "Jul", domestic: 758, commercial: 1580, industrial: 2680 },
];

// Professional light theme color palette for electricity management
const THEME_COLORS = {
  primary: "#2563eb", // Blue-600 (electricity theme)
  secondary: "#0891b2", // Cyan-600  
  success: "#16a34a", // Green-600
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

// Enhanced icons with better styling
const connectionIcons = {
  Active: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), shadowSize: [41, 41],
  }),
  Pending: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), shadowSize: [41, 41],
  }),
  Disconnected: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), shadowSize: [41, 41],
  }),
};

const transformerIcons = {
  Operational: new L.Icon({ iconUrl: "https://img.icons8.com/color/48/000000/electrical-transformer.png", iconSize: [32, 32], iconAnchor: [16, 32] }),
  Maintenance: new L.Icon({ iconUrl: "https://img.icons8.com/color/48/000000/electrical-transformer.png", iconSize: [32, 32], iconAnchor: [16, 32] }),
  Offline: new L.Icon({ iconUrl: "https://img.icons8.com/color/48/000000/electrical-transformer.png", iconSize: [32, 32], iconAnchor: [16, 32] }),
};

const ElectricityManagement = () => {
  const [selectedZone, setSelectedZone] = useState("All Zones");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [searchText, setSearchText] = useState("");
  const [selectedRange, setSelectedRange] = useState("Last 7 Days");
  const [selectedConnectionType, setSelectedConnectionType] = useState("All Types");
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const filteredConnections = useMemo(() => {
    let connections = electricityConnections;
    if (selectedZone !== "All Zones") connections = connections.filter(c => c.zone === selectedZone);
    if (selectedStatus !== "All Status") connections = connections.filter(c => c.status === selectedStatus);
    if (selectedConnectionType !== "All Types") connections = connections.filter(c => c.connectionType === selectedConnectionType);
    if (searchText) connections = connections.filter(c => 
      c.customerName.toLowerCase().includes(searchText.toLowerCase()) || 
      c.address.toLowerCase().includes(searchText.toLowerCase())
    );
    return connections;
  }, [selectedZone, selectedStatus, searchText, selectedConnectionType]);

  // Enhanced analytics
  const totalConnections = filteredConnections.length;
  const activeConnections = filteredConnections.filter(c => c.status === "Active").length;
  const totalConsumption = filteredConnections.reduce((sum, c) => sum + c.consumption, 0);
  const totalRevenue = filteredConnections.reduce((sum, c) => sum + c.bill, 0);
  const smartMeterCount = filteredConnections.filter(c => c.smartMeter).length;
  const pendingConnections = filteredConnections.filter(c => c.status === "Pending").length;
  const disconnectedConnections = filteredConnections.filter(c => c.status === "Disconnected").length;
  
  const avgLoadFactor = Math.round(transformers.reduce((sum, t) => sum + t.currentLoad, 0) / transformers.length);
  const criticalTransformers = transformers.filter(t => t.currentLoad > 80).length;
  const offlineSmartMeters = smartMeterData.filter(m => m.status === "Offline").length;

  // Power quality analysis
  const avgPowerFactor = (smartMeterData.reduce((sum, m) => sum + m.powerFactor, 0) / smartMeterData.length).toFixed(2);
  const voltageVariations = smartMeterData.filter(m => m.voltage < 210 || m.voltage > 250).length;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: THEME_COLORS.background }}>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
          Electricity Management Control Center
        </h1>
        <p className="text-lg" style={{ color: THEME_COLORS.textSecondary }}>
          Real-time monitoring and analytics for smart electricity distribution operations
        </p>
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
                <option>Last 3 Months</option>
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
                {[...new Set(electricityConnections.map(c => c.zone))].map(zone => 
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
                <option>Active</option>
                <option>Pending</option>
                <option>Disconnected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Connection Type
              </label>
              <select 
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200" 
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
                value={selectedConnectionType} 
                onChange={e => setSelectedConnectionType(e.target.value)}
              >
                <option>All Types</option>
                <option>domestic</option>
                <option>commercial</option>
                <option>industrial</option>
                <option>institutional</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Search Customer/Location
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: THEME_COLORS.textSecondary }} />
                <input 
                  type="text" 
                  placeholder="Search customer name or address..." 
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
                  Total Connections
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {totalConnections.toLocaleString()}
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.success }}>
                  +5.2% from last month
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
                <Users className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
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
                  Active Connections
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {activeConnections.toLocaleString()}
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.success }}>
                  {Math.round((activeConnections/totalConnections)*100)}% active rate
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
                  Total Consumption
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {(totalConsumption / 1000).toFixed(1)}K kWh
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.info }}>
                  Monthly average
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.info}20` }}>
                <Activity className="w-6 h-6" style={{ color: THEME_COLORS.info }} />
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
                  Smart Meters
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {smartMeterCount}/{totalConnections}
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.secondary }}>
                  {Math.round((smartMeterCount/totalConnections)*100)}% coverage
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}>
                <Gauge className="w-6 h-6" style={{ color: THEME_COLORS.secondary }} />
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
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  ₹{(totalRevenue / 100000).toFixed(1)}L
                </p>
                <p className="text-xs mt-1" style={{ color: THEME_COLORS.success }}>
                  +12.8% from last month
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.success}20` }}>
                <DollarSign className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
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
                  Grid Load Factor
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {avgLoadFactor}%
                </p>
                <p className="text-xs mt-1" style={{ 
                  color: avgLoadFactor > 85 ? THEME_COLORS.danger : 
                        avgLoadFactor > 70 ? THEME_COLORS.warning : 
                        THEME_COLORS.success 
                }}>
                  {avgLoadFactor > 85 ? 'High load' : 
                   avgLoadFactor > 70 ? 'Moderate load' : 
                   'Normal load'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ 
                backgroundColor: `${avgLoadFactor > 85 ? THEME_COLORS.danger : 
                                avgLoadFactor > 70 ? THEME_COLORS.warning : 
                                THEME_COLORS.success}20` 
              }}>
                <Power className="w-6 h-6" style={{ 
                  color: avgLoadFactor > 85 ? THEME_COLORS.danger : 
                         avgLoadFactor > 70 ? THEME_COLORS.warning : 
                         THEME_COLORS.success 
                }} />
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
                Electricity Distribution Network
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.success }}></div>
                    <span style={{ color: THEME_COLORS.textSecondary }}>Active ({activeConnections})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.warning }}></div>
                    <span style={{ color: THEME_COLORS.textSecondary }}>Pending ({pendingConnections})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.danger }}></div>
                    <span style={{ color: THEME_COLORS.textSecondary }}>Disconnected ({disconnectedConnections})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.secondary }}></div>
                    <span style={{ color: THEME_COLORS.textSecondary }}>Transformers ({transformers.length})</span>
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
                center={[23.035, 72.58]} 
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
                  {/* Electricity Connections Layer */}
                  <LayersControl.Overlay name="Electricity Connections" checked>
                    <LayerGroup>
                      <MarkerClusterGroup chunkedLoading>
                        {filteredConnections.map((connection, i) => (
                          <Marker key={`connection-${i}`} position={[connection.lat, connection.lng]} icon={connectionIcons[connection.status]}>
                            <Popup>
                              <div className="p-4 min-w-[280px]" style={{ 
                                backgroundColor: THEME_COLORS.cardBg,
                                color: THEME_COLORS.textPrimary,
                                borderRadius: '8px',
                                boxShadow: THEME_COLORS.shadow
                              }}>
                                <div className="flex items-center gap-2 mb-3">
                                  <Zap className="w-4 h-4" style={{ color: THEME_COLORS.primary }} />
                                  <strong className="text-lg">{connection.id}</strong>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    connection.status === "Disconnected" ? `bg-red-100 text-red-700` : 
                                    connection.status === "Pending" ? `bg-orange-100 text-orange-700` :
                                    `bg-green-100 text-green-700`
                                  }`}>
                                    {connection.status}
                                  </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div><strong>Customer:</strong> {connection.customerName}</div>
                                  <div><strong>Address:</strong> {connection.address}</div>
                                  <div><strong>Type:</strong> {connection.connectionType}</div>
                                  <div><strong>Category:</strong> {connection.connectionCategory}</div>
                                  <div><strong>Consumption:</strong> {connection.consumption} kWh</div>
                                  <div><strong>Monthly Bill:</strong> ₹{connection.bill.toLocaleString()}</div>
                                  <div><strong>Last Reading:</strong> {connection.lastReading}</div>
                                  {connection.smartMeter && (
                                    <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#dbeafe' }}>
                                      <Gauge className="w-4 h-4 text-blue-600" />
                                      <span className="text-blue-700 text-xs">Smart Meter Enabled</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MarkerClusterGroup>
                      
                      {/* Load-based heatmap circles for high consumption areas */}
                      {filteredConnections.map((connection, i) => connection.consumption > 1000 && (
                        <Circle 
                          key={`heat-high-${i}`} 
                          center={[connection.lat, connection.lng]} 
                          radius={200} 
                          pathOptions={{ 
                            color: THEME_COLORS.warning, 
                            fillColor: THEME_COLORS.warning,
                            fillOpacity: 0.1,
                            weight: 1
                          }} 
                        />
                      ))}
                    </LayerGroup>
                  </LayersControl.Overlay>

                  {/* Transformers Layer */}
                  <LayersControl.Overlay name="Transformers" checked>
                    <LayerGroup>
                      <MarkerClusterGroup chunkedLoading>
                        {transformers.map((transformer, i) => (
                          <Marker key={`transformer-${i}`} position={[transformer.lat, transformer.lng]} icon={transformerIcons[transformer.status]}>
                            <Popup>
                              <div className="p-4 min-w-[280px]" style={{ 
                                backgroundColor: THEME_COLORS.cardBg,
                                color: THEME_COLORS.textPrimary,
                                borderRadius: '8px',
                                boxShadow: THEME_COLORS.shadow
                              }}>
                                <div className="flex items-center gap-2 mb-3">
                                  <Settings className="w-4 h-4" style={{ color: THEME_COLORS.secondary }} />
                                  <strong className="text-lg">{transformer.name}</strong>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    transformer.status === "Maintenance" ? `bg-orange-100 text-orange-700` :
                                    transformer.status === "Offline" ? `bg-red-100 text-red-700` :
                                    `bg-green-100 text-green-700`
                                  }`}>
                                    {transformer.status}
                                  </span>
                                </div>
                                <div className="space-y-3 text-sm">
                                  <div><strong>ID:</strong> {transformer.id}</div>
                                  <div><strong>Capacity:</strong> {transformer.capacity}</div>
                                  <div><strong>Connected Consumers:</strong> {transformer.connectedConsumers}</div>
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <strong>Current Load:</strong>
                                      <span className="font-medium">{transformer.currentLoad}%</span>
                                    </div>
                                    <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                                      <div 
                                        className="h-3 rounded-full transition-all duration-300" 
                                        style={{ 
                                          width: `${transformer.currentLoad}%`,
                                          backgroundColor: transformer.currentLoad > 80 ? THEME_COLORS.danger :
                                                         transformer.currentLoad > 60 ? THEME_COLORS.warning :
                                                         THEME_COLORS.success
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className={`p-2 rounded text-xs ${
                                    transformer.currentLoad > 80 ? 'bg-red-50 text-red-700' :
                                    transformer.currentLoad > 60 ? 'bg-yellow-50 text-yellow-700' :
                                    'bg-green-50 text-green-700'
                                  }`}>
                                    {transformer.currentLoad > 80 ? '⚠ High load - Monitor closely' :
                                     transformer.currentLoad > 60 ? '⚡ Moderate load' :
                                     '✅ Operating normally'}
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MarkerClusterGroup>
                      
                      {/* Transformer coverage circles */}
                      {transformers.map((transformer, i) => (
                        <Circle 
                          key={`coverage-${i}`} 
                          center={[transformer.lat, transformer.lng]} 
                          radius={1000} 
                          pathOptions={{ 
                            color: THEME_COLORS.secondary, 
                            fillColor: THEME_COLORS.secondary,
                            fillOpacity: 0.05,
                            weight: 2,
                            dashArray: '5, 10'
                          }} 
                        />
                      ))}
                    </LayerGroup>
                  </LayersControl.Overlay>
                </LayersControl>
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Sidebar */}
        <div className="space-y-6">
          {/* Consumption Trends Chart */}
          <Card style={{ 
            backgroundColor: THEME_COLORS.cardBg, 
            boxShadow: THEME_COLORS.shadow,
            border: `1px solid ${THEME_COLORS.border}` 
          }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
                <TrendingUp className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
                Consumption Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={consumptionTrends}>
                  <XAxis 
                    dataKey="month" 
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
                  <Line 
                    type="monotone" 
                    dataKey="domestic" 
                    stroke={THEME_COLORS.success} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Domestic"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="commercial" 
                    stroke={THEME_COLORS.primary} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Commercial"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="industrial" 
                    stroke={THEME_COLORS.warning} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Industrial"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Connection Type Distribution */}
          <Card style={{ 
            backgroundColor: THEME_COLORS.cardBg, 
            boxShadow: THEME_COLORS.shadow,
            border: `1px solid ${THEME_COLORS.border}` 
          }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
                <PieChartIcon className="w-5 h-5" style={{ color: THEME_COLORS.primary }} />
                Connection Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie 
                    data={connectionTypeData} 
                    dataKey="count" 
                    nameKey="type" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={50}
                    innerRadius={20}
                  >
                    {connectionTypeData.map((entry, index) => (
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
                {connectionTypeData.map((item, index) => (
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

          {/* System Health Monitor */}
          <Card style={{ 
            backgroundColor: THEME_COLORS.cardBg, 
            boxShadow: THEME_COLORS.shadow,
            border: `1px solid ${THEME_COLORS.border}` 
          }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
                <Activity className="w-5 h-5" style={{ color: THEME_COLORS.info }} />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: THEME_COLORS.textSecondary }}>Grid Stability</span>
                  <span className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                    {criticalTransformers === 0 ? 'Stable' : 'Critical'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: criticalTransformers === 0 ? '100%' : '30%',
                      backgroundColor: criticalTransformers === 0 ? THEME_COLORS.success : THEME_COLORS.danger
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: THEME_COLORS.textSecondary }}>Smart Meter Health</span>
                  <span className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                    {Math.round(((smartMeterData.length - offlineSmartMeters) / smartMeterData.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.round(((smartMeterData.length - offlineSmartMeters) / smartMeterData.length) * 100)}%`,
                      backgroundColor: offlineSmartMeters === 0 ? THEME_COLORS.success : 
                                     offlineSmartMeters <= 1 ? THEME_COLORS.warning : THEME_COLORS.danger
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: THEME_COLORS.textSecondary }}>Power Quality</span>
                  <span className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                    PF: {avgPowerFactor}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${parseFloat(avgPowerFactor) * 100}%`,
                      backgroundColor: parseFloat(avgPowerFactor) >= 0.9 ? THEME_COLORS.success : 
                                     parseFloat(avgPowerFactor) >= 0.8 ? THEME_COLORS.warning : THEME_COLORS.danger
                    }}
                  ></div>
                </div>
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
                className="w-full p-3 rounded-lg text-left hover:scale-105 transition-all duration-200"
                style={{ 
                  backgroundColor: `${THEME_COLORS.primary}10`,
                  color: THEME_COLORS.primary,
                  border: `1px solid ${THEME_COLORS.primary}30`
                }}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">New Connection</span>
                </div>
              </button>
              <button 
                className="w-full p-3 rounded-lg text-left hover:scale-105 transition-all duration-200"
                style={{ 
                  backgroundColor: `${THEME_COLORS.warning}10`,
                  color: THEME_COLORS.warning,
                  border: `1px solid ${THEME_COLORS.warning}30`
                }}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">System Alerts</span>
                </div>
              </button>
              <button 
                className="w-full p-3 rounded-lg text-left hover:scale-105 transition-all duration-200"
                style={{ 
                  backgroundColor: `${THEME_COLORS.secondary}10`,
                  color: THEME_COLORS.secondary,
                  border: `1px solid ${THEME_COLORS.secondary}30`
                }}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-medium">Generate Report</span>
                </div>
              </button>
              <button 
                className="w-full p-3 rounded-lg text-left hover:scale-105 transition-all duration-200"
                style={{ 
                  backgroundColor: `${THEME_COLORS.info}10`,
                  color: THEME_COLORS.info,
                  border: `1px solid ${THEME_COLORS.info}30`
                }}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Grid Management</span>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ElectricityManagement;