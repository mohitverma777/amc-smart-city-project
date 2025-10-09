import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { aiData } from "../data/aiData";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MapPin,
  BarChart3,
  Activity,
  Zap,
  Eye,
  Target,
  Maximize2
} from "lucide-react";

// Professional light theme color palette [92]
const THEME_COLORS = {
  primary: "#1d4ed8", // Blue-700 (AI/technology theme)
  secondary: "#0891b2", // Cyan-600  
  success: "#059669", // Emerald-600
  warning: "#d97706", // Amber-600
  danger: "#dc2626", // Red-600
  info: "#7c3aed", // Violet-600
  ai: "#8b5cf6", // Violet-500 (AI theme)
  traffic: "#f59e0b", // Amber-500 (traffic theme)
  water: "#0ea5e9", // Sky-500 (water theme)
  waste: "#16a34a", // Green-600 (waste theme)
  lights: "#f97316", // Orange-500 (lights theme)
  background: "#f8fafc", // Slate-50
  cardBg: "#ffffff", // Pure white
  border: "#e2e8f0", // Slate-200
  textPrimary: "#1e293b", // Slate-800
  textSecondary: "#64748b", // Slate-500
  shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)", // Soft shadow
  shadowMedium: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", // Medium shadow
};

// Professional marker helper
const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${color.replace('#', '')}`,
    iconSize: [25, 40],
    iconAnchor: [12, 40],
    popupAnchor: [0, -35],
  });

// Enhanced Trend Component
const TrendIndicator = ({ value, threshold = 70, type = "density" }) => {
  const isHigh = value > threshold;
  const color = isHigh ? THEME_COLORS.danger : THEME_COLORS.success;
  const Icon = isHigh ? TrendingUp : TrendingDown;
  
  return (
    <div className="flex items-center gap-1">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
};

// Prediction Confidence Badge
const ConfidenceBadge = ({ confidence }) => {
  const color = confidence > 85 ? THEME_COLORS.success : 
                confidence > 70 ? THEME_COLORS.warning : THEME_COLORS.danger;
  
  return (
    <span 
      className="px-2 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {confidence}% confidence
    </span>
  );
};

const AIInsights = () => {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [lastPredictionUpdate, setLastPredictionUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate AI model updates every 30 seconds
    const interval = setInterval(() => {
      setLastPredictionUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate overall AI insights
  const overallStats = {
    avgTrafficCongestion: Math.round(aiData.trafficForecast.reduce((sum, t) => sum + t.density, 0) / aiData.trafficForecast.length),
    avgWaterDemand: Math.round(aiData.waterForecast.reduce((sum, w) => sum + w.level, 0) / aiData.waterForecast.length),
    avgWasteFill: Math.round(aiData.wasteForecast.reduce((sum, w) => sum + w.fill, 0) / aiData.wasteForecast.length),
    totalPredictedFailures: aiData.streetlightForecast.reduce((sum, s) => sum + s.predictedFailures, 0),
    highRiskZones: aiData.trafficForecast.filter(t => t.density > 75).length,
  };

  // Enhanced chart data
  const enhancedTrafficData = aiData.trafficForecast.map(item => ({
    ...item,
    riskLevel: item.density > 75 ? 'High' : item.density > 50 ? 'Medium' : 'Low'
  }));

  const enhancedWaterData = aiData.waterForecast.map(item => ({
    ...item,
    demandCategory: item.level > 80 ? 'Peak' : item.level > 50 ? 'Normal' : 'Low'
  }));

  // AI prediction summary data
  const predictionSummary = [
    { category: 'Traffic', value: overallStats.avgTrafficCongestion, color: THEME_COLORS.traffic },
    { category: 'Water', value: overallStats.avgWaterDemand, color: THEME_COLORS.water },
    { category: 'Waste', value: overallStats.avgWasteFill, color: THEME_COLORS.waste },
    { category: 'Efficiency', value: 100 - (overallStats.totalPredictedFailures * 10), color: THEME_COLORS.lights }
  ];

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: THEME_COLORS.background }}>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
          AI Insights & Predictive Analytics
        </h1>
        <p className="text-lg mb-4" style={{ color: THEME_COLORS.textSecondary }}>
          Machine learning powered predictions and intelligent recommendations for smart city operations
        </p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2" style={{ color: THEME_COLORS.textSecondary }}>
            <Brain className="w-4 h-4" style={{ color: THEME_COLORS.ai }} />
            <span>AI Models Active</span>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME_COLORS.success }}></div>
          </div>
          <div className="flex items-center gap-2" style={{ color: THEME_COLORS.textSecondary }}>
            <Activity className="w-4 h-4" style={{ color: THEME_COLORS.primary }} />
            <span>Last updated: {lastPredictionUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
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
                  Avg Traffic Density
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {overallStats.avgTrafficCongestion}%
                </p>
                <p className="text-xs mt-1" style={{ color: overallStats.avgTrafficCongestion > 70 ? THEME_COLORS.danger : THEME_COLORS.success }}>
                  {overallStats.avgTrafficCongestion > 70 ? 'High congestion predicted' : 'Normal flow expected'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.traffic}20` }}>
                <Target className="w-6 h-6" style={{ color: THEME_COLORS.traffic }} />
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
                  Water Demand
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {overallStats.avgWaterDemand}%
                </p>
                <p className="text-xs mt-1" style={{ color: overallStats.avgWaterDemand > 80 ? THEME_COLORS.warning : THEME_COLORS.info }}>
                  {overallStats.avgWaterDemand > 80 ? 'Peak demand predicted' : 'Stable demand forecast'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.water}20` }}>
                <Activity className="w-6 h-6" style={{ color: THEME_COLORS.water }} />
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
                  Waste Fill Level
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {overallStats.avgWasteFill}%
                </p>
                <p className="text-xs mt-1" style={{ color: overallStats.avgWasteFill > 75 ? THEME_COLORS.danger : THEME_COLORS.success }}>
                  {overallStats.avgWasteFill > 75 ? 'Collection needed soon' : 'Optimal levels predicted'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.waste}20` }}>
                <BarChart3 className="w-6 h-6" style={{ color: THEME_COLORS.waste }} />
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
                  Predicted Failures
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {overallStats.totalPredictedFailures}
                </p>
                <p className="text-xs mt-1" style={{ color: overallStats.totalPredictedFailures > 5 ? THEME_COLORS.warning : THEME_COLORS.success }}>
                  {overallStats.totalPredictedFailures > 5 ? 'Maintenance required' : 'Systems stable'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.lights}20` }}>
                <Zap className="w-6 h-6" style={{ color: THEME_COLORS.lights }} />
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
                  High Risk Zones
                </p>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                  {overallStats.highRiskZones}
                </p>
                <p className="text-xs mt-1" style={{ color: overallStats.highRiskZones > 2 ? THEME_COLORS.danger : THEME_COLORS.info }}>
                  {overallStats.highRiskZones > 2 ? 'Multiple alerts' : 'Manageable risk level'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.ai}20` }}>
                <AlertTriangle className="w-6 h-6" style={{ color: THEME_COLORS.ai }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Forecasting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Traffic Forecast */}
        <Card className="hover:shadow-lg transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
              <Target className="w-5 h-5" style={{ color: THEME_COLORS.traffic }} />
              Traffic Forecast
            </CardTitle>
            <ConfidenceBadge confidence={87} />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiData.trafficForecast.map((t) => (
                <div key={t.zone} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `${THEME_COLORS.traffic}05` }}>
                  <span className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                    {t.zone}
                  </span>
                  <TrendIndicator value={t.density} threshold={70} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Water Demand */}
        <Card className="hover:shadow-lg transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
              <Activity className="w-5 h-5" style={{ color: THEME_COLORS.water }} />
              Water Demand
            </CardTitle>
            <ConfidenceBadge confidence={92} />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiData.waterForecast.map((w) => (
                <div key={w.zone} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `${THEME_COLORS.water}05` }}>
                  <span className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                    {w.zone}
                  </span>
                  <TrendIndicator value={w.level} threshold={80} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Waste Forecast */}
        <Card className="hover:shadow-lg transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
              <BarChart3 className="w-5 h-5" style={{ color: THEME_COLORS.waste }} />
              Waste Forecast
            </CardTitle>
            <ConfidenceBadge confidence={89} />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiData.wasteForecast.map((w) => (
                <div key={w.zone} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `${THEME_COLORS.waste}05` }}>
                  <span className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                    {w.zone}
                  </span>
                  <TrendIndicator value={w.fill} threshold={75} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Streetlights Prediction */}
        <Card className="hover:shadow-lg transition-all duration-300" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
              <Zap className="w-5 h-5" style={{ color: THEME_COLORS.lights }} />
              Infrastructure
            </CardTitle>
            <ConfidenceBadge confidence={85} />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiData.streetlightForecast.map((s) => (
                <div key={s.zone} className="p-2 rounded-lg" style={{ backgroundColor: `${THEME_COLORS.lights}05` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                      {s.zone}
                    </span>
                    <span className="text-sm font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                      {s.working}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: THEME_COLORS.textSecondary }}>Failures predicted:</span>
                    <span 
                      className="px-2 py-0.5 rounded-full font-medium"
                      style={{ 
                        backgroundColor: s.predictedFailures > 2 ? `${THEME_COLORS.danger}20` : `${THEME_COLORS.success}20`,
                        color: s.predictedFailures > 2 ? THEME_COLORS.danger : THEME_COLORS.success
                      }}
                    >
                      {s.predictedFailures}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
        {/* Enhanced Map */}
        <Card className="xl:col-span-3" style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
                <MapPin className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
                AI Prediction Hotspots
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.danger }}></div>
                    <span style={{ color: THEME_COLORS.textSecondary }}>High Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.warning }}></div>
                    <span style={{ color: THEME_COLORS.textSecondary }}>Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.success }}></div>
                    <span style={{ color: THEME_COLORS.textSecondary }}>Low Risk</span>
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
            <MapContainer 
              center={[23.0225, 72.5714]} 
              zoom={12} 
              className={`rounded-xl overflow-hidden border transition-all duration-500 ${isMapExpanded ? 'h-96' : 'h-80'}`}
              style={{ 
                width: "100%",
                backgroundColor: '#f1f5f9',
                border: `1px solid ${THEME_COLORS.border}`
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {aiData.trafficForecast.map((t, idx) => (
                <Marker
                  key={t.zone}
                  position={[23.02 + idx * 0.008, 72.57 + idx * 0.008]}
                  icon={createIcon(t.density > 75 ? THEME_COLORS.danger : t.density > 50 ? THEME_COLORS.warning : THEME_COLORS.success)}
                >
                  <Popup>
                    <div className="p-3 min-w-[220px]" style={{ 
                      backgroundColor: THEME_COLORS.cardBg,
                      color: THEME_COLORS.textPrimary
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4" style={{ color: THEME_COLORS.ai }} />
                        <strong>{t.zone} AI Prediction</strong>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Congestion Forecast:</span>
                          <span className="font-medium" style={{ color: t.density > 75 ? THEME_COLORS.danger : THEME_COLORS.success }}>
                            {t.density}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risk Level:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            t.density > 75 ? 'bg-red-100 text-red-700' :
                            t.density > 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {t.density > 75 ? 'High' : t.density > 50 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${t.density}%`,
                              backgroundColor: t.density > 75 ? THEME_COLORS.danger : t.density > 50 ? THEME_COLORS.warning : THEME_COLORS.success
                            }}
                          ></div>
                        </div>
                        <div className="mt-2 text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                          🤖 AI Confidence: 87%
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>

        {/* AI Prediction Summary */}
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadow,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
              <Brain className="w-5 h-5" style={{ color: THEME_COLORS.ai }} />
              AI Model Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={predictionSummary}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={25}
                  >
                    {predictionSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: THEME_COLORS.cardBg,
                      border: `1px solid ${THEME_COLORS.border}`,
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {predictionSummary.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span style={{ color: THEME_COLORS.textPrimary }}>{item.category}</span>
                  </div>
                  <span className="font-medium" style={{ color: THEME_COLORS.textSecondary }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Traffic Congestion Forecast */}
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <BarChart3 className="w-6 h-6" style={{ color: THEME_COLORS.traffic }} />
              Traffic Congestion Forecast
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              AI-powered traffic density predictions by zone
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enhancedTrafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME_COLORS.border} />
                <XAxis 
                  dataKey="zone" 
                  tick={{ fill: THEME_COLORS.textSecondary, fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: THEME_COLORS.textSecondary, fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: THEME_COLORS.cardBg,
                    border: `1px solid ${THEME_COLORS.border}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="density" 
                  fill={THEME_COLORS.traffic}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Water Demand Trend */}
        <Card style={{ 
          backgroundColor: THEME_COLORS.cardBg, 
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}` 
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <Activity className="w-6 h-6" style={{ color: THEME_COLORS.water }} />
              Water Demand Prediction
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: THEME_COLORS.textSecondary }}>
              Machine learning based water consumption forecasting
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enhancedWaterData}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME_COLORS.border} />
                <XAxis 
                  dataKey="zone" 
                  tick={{ fill: THEME_COLORS.textSecondary, fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: THEME_COLORS.textSecondary, fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: THEME_COLORS.cardBg,
                    border: `1px solid ${THEME_COLORS.border}`,
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="level" 
                  stroke={THEME_COLORS.water}
                  strokeWidth={3}
                  dot={{ fill: THEME_COLORS.water, strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIInsights;
