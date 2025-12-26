import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { 
  AlertTriangle, 
  MapPin, 
 
  CheckCircle, 
  Filter,
  Maximize2,
 
  
  Activity,
  Search,
  
  Car,
  
  RefreshCw,
  Layers
} from "lucide-react";
import { MapContainer, TileLayer,  Tooltip, Polyline,  useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

// TomTom API Key
const TOMTOM_API_KEY = "your api key";

// Enhanced OpenStreetMap Road Data Fetcher with Zoom-based Filtering
class RoadGeometryFetcher {
  constructor() {
    this.overpassUrl = 'https://overpass-api.de/api/interpreter';
    this.cache = new Map(); // Simple caching to avoid repeated requests
  }

  // Get road types based on zoom level for performance optimization
  getRoadTypesForZoom(zoom) {
    if (zoom <= 10) {
      // Zoomed out: Only major roads
      return ['motorway', 'trunk', 'primary'];
    } else if (zoom <= 13) {
      // Medium zoom: Major + secondary roads
      return ['motorway', 'trunk', 'primary', 'secondary'];
    } else if (zoom <= 15) {
      // Closer zoom: Add tertiary roads
      return ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];
    } else {
      // Very close: All road types including residential
      return ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'unclassified'];
    }
  }

  // Fetch road geometry with zoom-based filtering
  async fetchRoadNetworkByZoom(bbox, zoom) {
    const cacheKey = `${bbox.join(',')}-${zoom}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const roadTypes = this.getRoadTypesForZoom(zoom);
    // const roadTypeFilter = roadTypes.map(type => `"${type}"`).join('|');
    
    // Limit the number of results based on zoom level
    const maxResults = zoom <= 12 ? 100 : zoom <= 14 ? 300 : 500;
    
    const query = `
      [out:json][timeout:20][maxsize:536870912];
      (
        way[highway~"^(${roadTypes.join('|')})$"](${bbox.join(',')});
      );
      out geom ${maxResults};
    `;

    try {
      const response = await fetch(this.overpassUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const processedData = this.processOverpassData(data, zoom);
      
      // Cache the result for 5 minutes
      this.cache.set(cacheKey, processedData);
      setTimeout(() => this.cache.delete(cacheKey), 300000);
      
      return processedData;
    } catch (error) {
      console.error('Error fetching road geometry:', error);
      return [];
    }
  }

  // Process Overpass API response with zoom-aware filtering
  processOverpassData(data, zoom) {
    const roads = [];
    
    data.elements.forEach(element => {
      if (element.type === 'way' && element.geometry && element.geometry.length > 1) {
        const coordinates = element.geometry.map(point => [point.lat, point.lon]);
        
        // Filter out very short road segments for performance
        const minLength = zoom <= 12 ? 5 : zoom <= 14 ? 3 : 2;
        if (coordinates.length < minLength) return;
        
        roads.push({
          id: element.id,
          name: element.tags?.name || element.tags?.ref || `${element.tags?.highway || 'Road'} ${element.id}`,
          highway: element.tags?.highway || 'unknown',
          coordinates: coordinates,
          maxSpeed: element.tags?.maxspeed || this.getDefaultSpeed(element.tags?.highway),
          lanes: parseInt(element.tags?.lanes) || this.getDefaultLanes(element.tags?.highway),
          priority: this.getRoadPriority(element.tags?.highway)
        });
      }
    });
    
    // Sort by priority to show most important roads first
    return roads.sort((a, b) => b.priority - a.priority);
  }

  // Get default speed based on road type
  getDefaultSpeed(highway) {
    const speedMap = {
      'motorway': '120',
      'trunk': '90',
      'primary': '70',
      'secondary': '50',
      'tertiary': '40',
      'residential': '30',
      'unclassified': '30'
    };
    return speedMap[highway] || '50';
  }

  // Get default lanes based on road type
  getDefaultLanes(highway) {
    const laneMap = {
      'motorway': 4,
      'trunk': 3,
      'primary': 2,
      'secondary': 2,
      'tertiary': 1,
      'residential': 1,
      'unclassified': 1
    };
    return laneMap[highway] || 2;
  }

  // Get road priority for sorting
  getRoadPriority(highway) {
    const priorityMap = {
      'motorway': 6,
      'trunk': 5,
      'primary': 4,
      'secondary': 3,
      'tertiary': 2,
      'residential': 1,
      'unclassified': 1
    };
    return priorityMap[highway] || 0;
  }
}

// Enhanced color system with 10 distinct traffic levels
const getTrafficColor = (intensity) => {
  const colors = [
    '#00C851', // 0-10% - Bright Green (Free flow)
    '#2BBBAD', // 10-20% - Teal (Very light)
    '#4CAF50', // 20-30% - Green (Light)
    '#8BC34A', // 30-40% - Light Green (Smooth)
    '#CDDC39', // 40-50% - Lime (Moderate-light)
    '#FFEB3B', // 50-60% - Yellow (Moderate)
    '#FFC107', // 60-70% - Amber (Moderate-heavy)
    '#FF9800', // 70-80% - Orange (Heavy)
    '#FF5722', // 80-90% - Deep Orange (Very heavy)
    '#F44336'  // 90-100% - Red (Standstill)
  ];
  
  const index = Math.min(Math.floor(intensity * 10), 9);
  return colors[index];
};

// Enhanced traffic intensity generator with more realistic distribution
const generateTrafficIntensity = (highway, timeOfDay = new Date().getHours()) => {
  const baseIntensity = {
    'motorway': 0.6,
    'trunk': 0.5,
    'primary': 0.4,
    'secondary': 0.3,
    'tertiary': 0.2,
    'residential': 0.15
  };
  
  const base = baseIntensity[highway] || 0.3;
  
  // Add time-based variation (rush hours)
  let timeMultiplier = 1;
  if ((timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19)) {
    timeMultiplier = 1.5; // Rush hour traffic
  } else if (timeOfDay >= 22 || timeOfDay <= 5) {
    timeMultiplier = 0.3; // Night time
  }
  
  const intensity = Math.min(base * timeMultiplier * (0.7 + Math.random() * 0.6), 1);
  return intensity;
};

// Map event handler for zoom-based data loading
const ZoomHandler = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom(), map.getBounds());
    },
    moveend: () => {
      onZoomChange(map.getZoom(), map.getBounds());
    }
  });
  return null;
};

// Professional light theme color palette for traffic management
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
  shadowLarge: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

const severityLevels = ["critical", "high", "medium", "low"];

const generateAlerts = (num = 30) => {
  const alerts = [];
  const now = new Date();
  const alertTypes = [
    "Heavy traffic congestion", "Minor accident", "Vehicle breakdown", "Road construction",
    "Weather impact", "Signal malfunction", "Lane closure", "Emergency response"
  ];
  
  for (let i = 0; i < num; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const level = severityLevels[Math.floor(Math.random() * severityLevels.length)];
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    alerts.push({
      id: i,
      msg: `${type} on Road Network`,
      level,
      timestamp: timestamp.toISOString(),
      area: "Ahmedabad",
      type,
      estimatedDelay: Math.round(Math.random() * 20 + 5),
      affectedLanes: Math.floor(Math.random() * 3) + 1
    });
  }
  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const TrafficManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [realRoads, setRealRoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(12);
  const [currentBounds, setCurrentBounds] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dataQuality, setDataQuality] = useState('balanced'); // 'fast', 'balanced', 'detailed'

  // Initialize services
  const roadFetcher = new RoadGeometryFetcher();

  useEffect(() => {
    setAlerts(generateAlerts(30));
  }, []);

  // Optimized road data loading with debouncing
  const loadRoadDataForZoom = useCallback(
    debounce(async (zoom, bounds) => {
      if (!bounds) return;
      
      setLoading(true);
      try {
        const bbox = [
          bounds.getSouth(),
          bounds.getWest(), 
          bounds.getNorth(),
          bounds.getEast()
        ];
        
        console.log(`Loading roads for zoom level ${zoom}`);
        const roadData = await roadFetcher.fetchRoadNetworkByZoom(bbox, zoom);
        
        // Add traffic intensity to each road
        const roadsWithTraffic = roadData.map(road => ({
          ...road,
          intensity: generateTrafficIntensity(road.highway),
          avgSpeed: Math.floor(Math.random() * 40) + 20,
          incidents: Math.floor(Math.random() * 2)
        }));

        setRealRoads(roadsWithTraffic);
        console.log(`Loaded ${roadsWithTraffic.length} roads for zoom ${zoom}`);
      } catch (error) {
        console.error('Error loading road data:', error);
      } finally {
        setLoading(false);
      }
    }, 1000),
    []
  );

  // Handle zoom and pan changes
  const handleZoomChange = useCallback((zoom, bounds) => {
    setCurrentZoom(zoom);
    setCurrentBounds(bounds);
    loadRoadDataForZoom(zoom, bounds);
  }, [loadRoadDataForZoom]);

  // Debounce function to limit API calls
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Hide attribution and apply CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-control-attribution {
        display: none !important;
      }
      .leaflet-tooltip {
        font-size: 10px !important;
        font-weight: 400 !important;
        opacity: 0.9 !important;
      }
      .leaflet-container {
        font-size: 11px !important;
      }
      .traffic-polyline {
        transition: opacity 0.3s ease;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const filteredRoads = realRoads.filter(road => 
    searchText === "" || road.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getAlertStyle = level => {
    const baseClasses = "relative overflow-hidden border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-lg";
    switch (level) {
      case "critical": 
        return `${baseClasses} bg-gradient-to-r from-red-50 to-red-100 border-red-500 text-red-900`;
      case "high": 
        return `${baseClasses} bg-gradient-to-r from-orange-50 to-orange-100 border-orange-500 text-orange-900`;
      case "medium": 
        return `${baseClasses} bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-500 text-yellow-900`;
      case "low": 
        return `${baseClasses} bg-gradient-to-r from-green-50 to-green-100 border-green-500 text-green-900`;
      default: 
        return `${baseClasses} bg-gradient-to-r from-gray-50 to-gray-100 border-gray-500 text-gray-900`;
    }
  };

  // Get road thickness based on highway type and zoom level
  const getRoadThickness = (highway, zoom) => {
    const baseThickness = {
      'motorway': 8,
      'trunk': 6,
      'primary': 5,
      'secondary': 4,
      'tertiary': 3,
      'residential': 2,
      'unclassified': 2
    };
    
    const thickness = baseThickness[highway] || 3;
    
    // Adjust thickness based on zoom level
    if (zoom <= 12) return Math.max(thickness - 1, 2);
    if (zoom <= 14) return thickness;
    return thickness + 1;
  };

  // Get road opacity based on zoom level and highway type
  const getRoadOpacity = (highway, zoom) => {
    if (zoom <= 12) {
      // Only show major roads clearly when zoomed out
      const majorRoads = ['motorway', 'trunk', 'primary'];
      return majorRoads.includes(highway) ? 0.9 : 0.3;
    }
    return 0.85;
  };

  const getTomTomUrl = () => {
    return `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`;
  };

  const displayedAlerts = alerts.filter(a => severityFilter === "all" || a.level === severityFilter);

  // Analytics
  const activeAlertsCount = alerts.filter(a => a.level === "critical" || a.level === "high").length;
  const avgSpeed = realRoads.length > 0 ? Math.round(realRoads.reduce((sum, road) => sum + road.avgSpeed, 0) / realRoads.length) : 30;
  const totalIncidents = realRoads.reduce((sum, road) => sum + road.incidents, 0);

  // Get zoom level description
  const getZoomDescription = (zoom) => {
    if (zoom <= 10) return "Major highways and arterials";
    if (zoom <= 13) return "Primary and secondary roads";
    if (zoom <= 15) return "All main roads and local streets";
    return "Detailed street-level view";
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: THEME_COLORS.background }}>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Smart Traffic Management
        </h1>
        <p className="text-lg" style={{ color: THEME_COLORS.textSecondary }}>
          Intelligent traffic visualization 
        </p>
        <div className="flex items-center gap-4 mt-3">
          {loading && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" style={{ color: THEME_COLORS.primary }} />
              <span className="text-sm" style={{ color: THEME_COLORS.primary }}>
                Loading roads for zoom level {currentZoom}...
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            {/* <Layers className="w-4 h-4" style={{ color: THEME_COLORS.info }} />
            <span style={{ color: THEME_COLORS.textSecondary }}>
              Zoom {currentZoom}: {getZoomDescription(currentZoom)}
            </span> */}
          </div>
        </div>
      </div>

      {/* Enhanced Controls Section */}
      <Card className="mb-8" style={{ 
        backgroundColor: THEME_COLORS.cardBg, 
        boxShadow: THEME_COLORS.shadow,
        border: `1px solid ${THEME_COLORS.border}`,
        borderRadius: '16px'
      }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: THEME_COLORS.textPrimary }}>
            <Filter className="w-5 h-5" style={{ color: THEME_COLORS.primary }} />
            Smart Controls & Performance Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Search Roads
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: THEME_COLORS.textSecondary }} />
                <input 
                  type="text" 
                  placeholder="Search road names..." 
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
                Data Quality
              </label>
              <select
                value={dataQuality}
                onChange={(e) => setDataQuality(e.target.value)}
                className="w-full px-3 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.cardBg,
                  borderColor: THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary 
                }}
              >
                <option value="fast">Fast (Major roads only)</option>
                <option value="balanced">Balanced (Recommended)</option>
                <option value="detailed">Detailed (All roads)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Performance Stats
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium" style={{ color: THEME_COLORS.textPrimary }}>
                  {realRoads.length} roads loaded
                </span>
                <span className="text-xs" style={{ color: THEME_COLORS.textSecondary }}>
                  Zoom: {currentZoom} | {getZoomDescription(currentZoom).split(' ')[0]} roads shown
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: THEME_COLORS.textSecondary }}>
                Actions
              </label>
              <button
                onClick={() => currentBounds && loadRoadDataForZoom(currentZoom, currentBounds)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.primary,
                  color: 'white'
                }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:scale-105 transition-all duration-300 overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${THEME_COLORS.cardBg}ee, ${THEME_COLORS.primary}08)`,
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}`,
          borderRadius: '16px'
        }}>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-2xl opacity-20"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  Active Alerts
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
                  {activeAlertsCount}
                </p>
                <p className="text-xs" style={{ color: activeAlertsCount > 5 ? THEME_COLORS.danger : THEME_COLORS.success }}>
                  {activeAlertsCount > 5 ? '⚠ High priority' : '✓ Under control'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
                <AlertTriangle className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${THEME_COLORS.cardBg}ee, ${THEME_COLORS.success}08)`,
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}`,
          borderRadius: '16px'
        }}>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full blur-2xl opacity-20"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  Avg Speed
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
                  {avgSpeed} <span className="text-lg">km/h</span>
                </p>
                <p className="text-xs" style={{ color: avgSpeed > 30 ? THEME_COLORS.success : THEME_COLORS.warning }}>
                  {avgSpeed > 30 ? '↗ Good flow' : '↘ Congested'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.success}20` }}>
                <Car className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${THEME_COLORS.cardBg}ee, ${THEME_COLORS.info}08)`,
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}`,
          borderRadius: '16px'
        }}>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-600 rounded-full blur-2xl opacity-20"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  Roads Loaded
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
                  {realRoads.length}
                </p>
                <p className="text-xs" style={{ color: THEME_COLORS.info }}>
                  Zoom level {currentZoom}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.info}20` }}>
                <Layers className="w-6 h-6" style={{ color: THEME_COLORS.info }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${THEME_COLORS.cardBg}ee, ${THEME_COLORS.warning}08)`,
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}`,
          borderRadius: '16px'
        }}>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full blur-2xl opacity-20"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.textSecondary }}>
                  Performance
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.textPrimary }}>
                  {loading ? '...' : '✓'}
                </p>
                <p className="text-xs" style={{ color: loading ? THEME_COLORS.warning : THEME_COLORS.success }}>
                  {loading ? 'Loading...' : 'Optimized'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${THEME_COLORS.warning}20` }}>
                <Activity className="w-6 h-6" style={{ color: THEME_COLORS.warning }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
        {/* Enhanced Smart Map Section */}
        <Card className="xl:col-span-3 overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${THEME_COLORS.cardBg}, ${THEME_COLORS.cardBg}f8)`,
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}`,
          borderRadius: '20px'
        }}>
          <CardHeader className="pb-4" style={{ 
            background: `linear-gradient(90deg, ${THEME_COLORS.primary}08, transparent)`
          }}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold" style={{ color: THEME_COLORS.textPrimary }}>
                <div className="p-2 rounded-lg" style={{ 
                  background: `linear-gradient(135deg, ${THEME_COLORS.primary}, ${THEME_COLORS.secondary})`
                }}>
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                Smart Traffic Map - Performance Optimized
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* Enhanced 10-Level Color Legend */}
                <div className="flex items-center gap-2 text-xs bg-white/50 backdrop-blur-sm rounded-lg px-4 py-2" style={{ 
                  border: `1px solid ${THEME_COLORS.border}`
                }}>
                  {[0, 2, 4, 6, 8].map(level => (
                    <div key={level} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ 
                        backgroundColor: getTrafficColor(level / 10)
                      }}></div>
                      <span style={{ color: THEME_COLORS.textSecondary }}>
                        {level === 0 ? 'Free' : level === 2 ? 'Light' : level === 4 ? 'Mod' : level === 6 ? 'Heavy' : 'Stop'}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="p-3 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{ 
                    background: `linear-gradient(135deg, ${THEME_COLORS.primary}, ${THEME_COLORS.secondary})`,
                    color: 'white',
                    boxShadow: THEME_COLORS.shadow
                  }}
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex-1">
                <MapContainer 
                  center={[23.0325,72.5614]} 
                  zoom={12}
                  attributionControl={false}
                  className={`rounded-2xl overflow-hidden border-2 transition-all duration-500 ${isMapExpanded ? 'h-[600px]' : 'h-96'}`}
                  style={{ 
                    width: "100%",
                    borderColor: `${THEME_COLORS.primary}30`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                  }}
                >
                  {/* TomTom Map Tiles */}
                  <TileLayer 
                    url={getTomTomUrl()}
                    maxZoom={22}
                    minZoom={1}
                    subdomains={['a', 'b', 'c', 'd']}
                    attribution=""
                  />
                  
                  {/* Zoom-based Road Network with Enhanced Colors */}
                  {filteredRoads.map((road, index) => (
                    <Polyline
                      key={`road-${road.id || index}`}
                      positions={road.coordinates}
                      pathOptions={{
                        color: getTrafficColor(road.intensity),
                        weight: getRoadThickness(road.highway, currentZoom),
                        opacity: getRoadOpacity(road.highway, currentZoom),
                        lineCap: 'round',
                        lineJoin: 'round'
                      }}
                      className="traffic-polyline"
                    >
                      <Tooltip>
                        <div style={{ fontSize: '11px', minWidth: '200px' }}>
                          <strong style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: getTrafficColor(road.intensity) }}>
                            {road.name}
                          </strong>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                            <div>
                              <span style={{ color: '#666', fontWeight: '500' }}>Type:</span> 
                              <span style={{ fontWeight: '600', textTransform: 'capitalize' }}> {road.highway}</span>
                            </div>
                            <div>
                              <span style={{ color: '#666', fontWeight: '500' }}>Lanes:</span> 
                              <span style={{ fontWeight: '600' }}> {road.lanes}</span>
                            </div>
                            <div>
                              <span style={{ color: '#666', fontWeight: '500' }}>Traffic:</span> 
                              <span style={{ color: getTrafficColor(road.intensity), fontWeight: 'bold' }}>
                                {(road.intensity * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#666', fontWeight: '500' }}>Speed:</span> 
                              <span style={{ fontWeight: '600', color: road.avgSpeed > 30 ? '#059669' : '#d97706' }}>
                                {road.avgSpeed} km/h
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#666', fontWeight: '500' }}>Max Speed:</span> 
                              <span style={{ fontWeight: '600' }}> {road.maxSpeed} km/h</span>
                            </div>
                            <div>
                              <span style={{ color: '#666', fontWeight: '500' }}>Priority:</span> 
                              <span style={{ fontWeight: '600' }}> {road.priority}/6</span>
                            </div>
                            {road.incidents > 0 && (
                              <div style={{ gridColumn: 'span 2', color: '#dc2626', fontWeight: '600' }}>
                                ⚠ {road.incidents} active incident{road.incidents > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </Tooltip>
                    </Polyline>
                  ))}
                  
                  {/* Zoom Handler */}
                  <ZoomHandler onZoomChange={handleZoomChange} />
                </MapContainer>
              </div>

              {/* Enhanced Road Statistics Panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg" style={{ 
                  backgroundColor: `${THEME_COLORS.success}10`,
                  border: `1px solid ${THEME_COLORS.success}30`
                }}>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: THEME_COLORS.success }}>
                      {filteredRoads.filter(r => r.intensity < 0.3).length}
                    </div>
                    <div className="text-sm font-medium" style={{ color: THEME_COLORS.textSecondary }}>
                      Free Flow
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg" style={{ 
                  backgroundColor: `${THEME_COLORS.warning}10`,
                  border: `1px solid ${THEME_COLORS.warning}30`
                }}>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: THEME_COLORS.warning }}>
                      {filteredRoads.filter(r => r.intensity >= 0.3 && r.intensity < 0.7).length}
                    </div>
                    <div className="text-sm font-medium" style={{ color: THEME_COLORS.textSecondary }}>
                      Moderate
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg" style={{ 
                  backgroundColor: `${THEME_COLORS.danger}10`,
                  border: `1px solid ${THEME_COLORS.danger}30`
                }}>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: THEME_COLORS.danger }}>
                      {filteredRoads.filter(r => r.intensity >= 0.7).length}
                    </div>
                    <div className="text-sm font-medium" style={{ color: THEME_COLORS.textSecondary }}>
                      Heavy Traffic
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ 
                  backgroundColor: `${THEME_COLORS.info}10`,
                  border: `1px solid ${THEME_COLORS.info}30`
                }}>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: THEME_COLORS.info }}>
                      {currentZoom}
                    </div>
                    <div className="text-sm font-medium" style={{ color: THEME_COLORS.textSecondary }}>
                      Zoom Level
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Alerts Section */}
        <Card style={{ 
          background: `linear-gradient(135deg, ${THEME_COLORS.cardBg}, ${THEME_COLORS.warning}03)`,
          boxShadow: THEME_COLORS.shadowMedium,
          border: `1px solid ${THEME_COLORS.border}`,
          borderRadius: '20px'
        }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME_COLORS.textPrimary }}>
              <AlertTriangle className="w-6 h-6" style={{ color: THEME_COLORS.warning }} />
              Live Traffic Alerts
            </CardTitle>
            <div className="text-sm mt-2" style={{ color: THEME_COLORS.textSecondary }}>
              Real-time incident monitoring
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {displayedAlerts.slice(0, 12).map((alert) => (
                <div key={alert.id} className={`${getAlertStyle(alert.level)} p-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1">{alert.msg}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="opacity-75">
                            {new Date(alert.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            alert.level === 'critical' ? 'bg-red-200 text-red-800' :
                            alert.level === 'high' ? 'bg-orange-200 text-orange-800' :
                            alert.level === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {alert.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs opacity-75">
                          <span>⏱ {alert.estimatedDelay}min delay</span>
                          <span>🛣 {alert.affectedLanes} lane{alert.affectedLanes > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                      className="p-2 rounded-lg transition-colors duration-200 flex-shrink-0 hover:bg-white/50"
                      title="Mark as resolved"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {displayedAlerts.length === 0 && (
                <div className="text-center py-8" style={{ color: THEME_COLORS.textSecondary }}>
                  <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: THEME_COLORS.success }} />
                  <p>No alerts match the selected filter</p>
                  <p className="text-sm mt-1">All traffic is flowing smoothly!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrafficManagement;
