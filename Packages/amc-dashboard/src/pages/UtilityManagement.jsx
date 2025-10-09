import React, { useState, useEffect, useRef } from "react";
import utilityService from "../services/utilityService";
import { 
  RefreshCw, 
  Loader2, 
  AlertTriangle, 
  Droplets, 
  Trash2, 
  Lightbulb,
  MapPin,
  TrendingUp,
  Activity,
  Maximize2,
  Minimize2
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Enhanced custom marker icons with better visual design
const createCustomIcon = (color, IconComponent) => {
  const iconSvg = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 13 16 26 16 26s16-13 16-26C32 7.163 24.837 0 16 0z" 
            fill="${color}" 
            stroke="white" 
            stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/>
    </svg>
  `;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">${iconSvg}</div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

const waterIcon = createCustomIcon('#3B82F6');
const wasteIcon = createCustomIcon('#10B981');
const lightIcon = createCustomIcon('#F59E0B');

export default function UtilityManagement() {
  const [water, setWater] = useState([]);
  const [waste, setWaste] = useState([]);
  const [streetlights, setStreetlights] = useState([]);
  const [stats, setStats] = useState({
    water: { avgLevel: 75, critical: 2, normal: 8 },
    waste: { avgFill: 45, needsCollection: 3, normal: 12 },
    lights: { efficiency: 92, workingLights: 1450, totalLights: 1575 }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Generate mock data for demonstration
  const generateMockData = () => {
    const mockWater = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      zone: `Zone-${String.fromCharCode(65 + i)}`,
      location: `Water Tank ${i + 1}`,
      level: Math.floor(Math.random() * 100),
      status: Math.random() > 0.8 ? 'critical' : 'normal',
      latitude: 23.0225 + (Math.random() - 0.5) * 0.1,
      longitude: 72.5714 + (Math.random() - 0.5) * 0.1
    }));

    const mockWaste = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      zone: `Zone-${String.fromCharCode(65 + (i % 10))}`,
      location: `Bin Location ${i + 1}`,
      fill: Math.floor(Math.random() * 100),
      status: Math.random() > 0.7 ? 'full' : 'normal',
      latitude: 23.0225 + (Math.random() - 0.5) * 0.1,
      longitude: 72.5714 + (Math.random() - 0.5) * 0.1
    }));

    const mockLights = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      zone: `Zone-${String.fromCharCode(65 + (i % 10))}`,
      location: `Street Light ${i + 1}`,
      efficiency: Math.floor(Math.random() * 40) + 60,
      status: Math.random() > 0.9 ? 'fault' : 'working',
      latitude: 23.0225 + (Math.random() - 0.5) * 0.1,
      longitude: 72.5714 + (Math.random() - 0.5) * 0.1
    }));

    return { water: mockWater, waste: mockWaste, streetlights: mockLights };
  };

  // Fetch data function
  const fetchData = async (isRefresh = false) => {
    try {
      setError("");
      isRefresh ? setRefreshing(true) : setLoading(true);

      try {
        const [overviewRes, statsRes] = await Promise.all([
          utilityService.getUtilitiesOverview(),
          utilityService.getStatistics()
        ]);

        if (overviewRes.success) {
          setWater(overviewRes.data.water || []);
          setWaste(overviewRes.data.waste || []);
          setStreetlights(overviewRes.data.streetlights || []);
        } else {
          throw new Error("API returned unsuccessful response");
        }

        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } catch (apiError) {
        console.warn("API not available, using mock data:", apiError.message);
        
        const mockData = generateMockData();
        setWater(mockData.water);
        setWaste(mockData.waste);
        setStreetlights(mockData.streetlights);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load data");
      
      const mockData = generateMockData();
      setWater(mockData.water);
      setWaste(mockData.waste);
      setStreetlights(mockData.streetlights);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
            <Activity className="w-6 h-6 text-blue-400 absolute top-5 left-1/2 transform -translate-x-1/2" />
          </div>
          <p className="text-slate-600 font-medium text-lg">Loading utility data...</p>
          <p className="text-slate-400 text-sm mt-2">Initializing dashboard</p>
        </div>
      </div>
    );
  }

  if (error && !water.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Connection Issue</h2>
          <p className="mb-6 text-slate-600">{error}</p>
          <button 
            onClick={() => fetchData(true)} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all hover:shadow-lg"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Custom CSS for map styling and animations */}
      <style jsx>{`
        .stat-card {
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
        }
        .progress-bar {
          transition: width 0.5s ease-in-out;
        }
        .leaflet-container {
          border-radius: 0 0 16px 16px;
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 16px;
          font-family: inherit;
        }
        .custom-marker {
          background: none;
          border: none;
        }
        .map-expanded {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          background: white;
        }
      `}</style>

      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1920px] mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Utility Management
              </h1>
            </div>
            <p className="text-slate-600 ml-14">Real-time monitoring & analytics dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">Live</span>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow font-medium"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Water Card */}
          <div className="stat-card bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200">
                  <Droplets className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Water Supply</div>
                  <div className="text-3xl font-bold text-slate-800 mt-1">
                    {stats.water?.avgLevel || 0}%
                  </div>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Average Level</span>
                <div className="flex gap-2">
                  <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium border border-red-100">
                    {stats.water?.critical || 0} critical
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
                    {stats.water?.normal || 0} normal
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="progress-bar h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" 
                  style={{ width: `${stats.water?.avgLevel || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Waste Card */}
          <div className="stat-card bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
                  <Trash2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Waste Collection</div>
                  <div className="text-3xl font-bold text-slate-800 mt-1">
                    {stats.waste?.avgFill || 0}%
                  </div>
                </div>
              </div>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Average Fill</span>
                <div className="flex gap-2">
                  <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium border border-amber-100">
                    {stats.waste?.needsCollection || 0} urgent
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
                    {stats.waste?.normal || 0} normal
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="progress-bar h-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" 
                  style={{ width: `${stats.waste?.avgFill || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Lights Card */}
          <div className="stat-card bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-200">
                  <Lightbulb className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Street Lights</div>
                  <div className="text-3xl font-bold text-slate-800 mt-1">
                    {stats.lights?.efficiency || 0}%
                  </div>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">System Efficiency</span>
                <span className="text-xs text-slate-600 font-medium">
                  {stats.lights?.workingLights || 0} / {stats.lights?.totalLights || 0} active
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="progress-bar h-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" 
                  style={{ width: `${stats.lights?.efficiency || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Map Container */}
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 ${isMapExpanded ? 'map-expanded' : ''}`}>
          <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Interactive Utility Map</h2>
                <p className="text-sm text-slate-600">Click markers for detailed information</p>
              </div>
            </div>
            <button
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              aria-label={isMapExpanded ? "Minimize map" : "Maximize map"}
            >
              {isMapExpanded ? (
                <Minimize2 className="w-5 h-5 text-slate-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
          
          <div className={`${isMapExpanded ? 'h-screen' : 'h-[600px]'} relative`}>
            {/* Legend */}
            <div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl shadow-lg p-4 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Map Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  <span className="text-xs text-slate-600">Water ({water.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-600 rounded-full"></div>
                  <span className="text-xs text-slate-600">Waste ({waste.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-600 rounded-full"></div>
                  <span className="text-xs text-slate-600">Lights ({streetlights.length})</span>
                </div>
              </div>
            </div>

            <MapContainer
              center={[23.0225, 72.5714]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              attributionControl={true}
              zoomControl={false}
            >
              <ZoomControl position="bottomright" />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Water markers */}
              {water.map(item => (
                <Marker
                  key={`water-${item.id}`}
                  position={[item.latitude, item.longitude]}
                  icon={waterIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                        <Droplets className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-blue-600 text-base">Water Supply</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Zone:</span>
                          <span className="font-semibold text-slate-700">{item.zone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Location:</span>
                          <span className="font-semibold text-slate-700">{item.location}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Level:</span>
                          <span className="font-bold text-blue-600">{item.level}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-2 bg-blue-600 rounded-full" 
                            style={{ width: `${item.level}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-500">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'critical' 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Waste markers */}
              {waste.map(item => (
                <Marker
                  key={`waste-${item.id}`}
                  position={[item.latitude, item.longitude]}
                  icon={wasteIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                        <Trash2 className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-emerald-600 text-base">Waste Collection</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Zone:</span>
                          <span className="font-semibold text-slate-700">{item.zone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Location:</span>
                          <span className="font-semibold text-slate-700">{item.location}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Fill Level:</span>
                          <span className="font-bold text-emerald-600">{item.fill}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-2 bg-emerald-600 rounded-full" 
                            style={{ width: `${item.fill}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-500">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'full' 
                              ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Street light markers */}
              {streetlights.map(item => (
                <Marker
                  key={`light-${item.id}`}
                  position={[item.latitude, item.longitude]}
                  icon={lightIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                        <h3 className="font-bold text-amber-600 text-base">Street Light</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Zone:</span>
                          <span className="font-semibold text-slate-700">{item.zone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Location:</span>
                          <span className="font-semibold text-slate-700">{item.location}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Efficiency:</span>
                          <span className="font-bold text-amber-600">{item.efficiency}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-2 bg-amber-600 rounded-full" 
                            style={{ width: `${item.efficiency}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-500">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'fault' 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Enhanced Data Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { title: "Water Tanks", data: water, color: "blue", icon: Droplets, key: "level" },
            { title: "Waste Bins", data: waste, color: "emerald", icon: Trash2, key: "fill" },
            { title: "Street Lights", data: streetlights, color: "amber", icon: Lightbulb, key: "efficiency" },
          ].map(({ title, data, color, icon: Icon, key }) => (
            <div key={title} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${color}-50 rounded-lg border border-${color}-100`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <span className="text-sm text-slate-500">{data.length} locations</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4 max-h-96 overflow-auto pr-2 custom-scrollbar">
                {data.map(item => {
                  const percent = item[key];
                  const getStatusColor = (p, itemColor) => {
                    if (p < 30) return "red";
                    if (p < 70) return "amber";
                    return itemColor;
                  };
                  const statusColor = getStatusColor(percent, color);
                  
                  return (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 bg-${statusColor}-500 rounded-full`}></div>
                          <span className="font-semibold text-slate-700">{item.zone}</span>
                        </div>
                        <span className={`font-bold text-${statusColor}-600 text-lg`}>{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`progress-bar h-2.5 rounded-full bg-gradient-to-r from-${statusColor}-500 to-${statusColor}-600 shadow-sm`} 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">{item.location}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          percent < 30 
                            ? 'bg-red-100 text-red-700' 
                            : percent < 70 
                            ? 'bg-amber-100 text-amber-700' 
                            : `bg-${color}-100 text-${color}-700`
                        }`}>
                          {item.status || (percent < 30 ? 'Critical' : percent < 70 ? 'Warning' : 'Normal')}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {data.length === 0 && (
                  <div className="text-center py-12">
                    <Icon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-400 text-sm">No data available</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Footer */}
        <div className="flex justify-between items-center py-4 px-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="w-4 h-4" />
            <span>Last updated: {lastUpdate.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{water.length + waste.length + streetlights.length} total assets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
