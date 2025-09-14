import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { AlertTriangle, Camera, MapPin } from "lucide-react";
import { MapContainer, TileLayer } from "react-leaflet";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import "leaflet/dist/leaflet.css";

// Dummy alerts
const alertsData = [
  "🚧 Roadblock reported near Ring Road",
  "🚗 Heavy congestion at City Center",
  "⚠️ Accident reported on SG Highway",
  "🛑 Signal failure at Nehru Bridge",
  "🚙 Slow traffic near Airport Circle",
];

// Heatmap dummy points (Ahmedabad)
const heatmapPoints = [
  { lat: 23.0225, lng: 72.5714, intensity: 0.9 }, // CG Road
  { lat: 23.0300, lng: 72.5800, intensity: 0.7 }, // Ashram Road
  { lat: 23.0500, lng: 72.5300, intensity: 0.6 }, // SG Highway
  { lat: 23.0000, lng: 72.6000, intensity: 0.4 }, // Maninagar
  { lat: 23.0600, lng: 72.6500, intensity: 0.5 }, // Naroda
];

const TrafficManagement = () => {
  const [alerts, setAlerts] = useState([]);

  // Refresh alerts every 30s
  useEffect(() => {
    const loadAlerts = () => {
      const shuffled = alertsData.sort(() => 0.5 - Math.random());
      setAlerts(shuffled.slice(0, 3));
    };
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 text-white">
      {/* Live Alerts */}
      <Card className="bg-[#1f1f23] border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="text-yellow-400" /> Live Traffic Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {alerts.map((alert, i) => (
              <li
                key={i}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                {alert}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CCTV Snapshots */}
      <Card className="bg-[#1f1f23] border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="text-green-400" /> CCTV Traffic Snapshots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((id) => (
              <div
                key={id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
              >
                <img
                  src={`https://picsum.photos/seed/traffic${id}/400/200`}
                  alt={`Traffic Camera ${id}`}
                  className="w-full h-32 object-cover"
                />
                <p className="p-2 text-xs text-gray-400">Camera {id}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap for Ahmedabad */}
      <Card className="bg-[#1f1f23] border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="text-blue-400" /> Traffic Heatmap (Ahmedabad)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MapContainer
            center={[23.0225, 72.5714]} // Ahmedabad center
            zoom={12}
            className="h-64 w-full rounded-lg"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <HeatmapLayer
              fitBoundsOnLoad
              fitBoundsOnUpdate
              points={heatmapPoints}
              longitudeExtractor={(p) => p.lng}
              latitudeExtractor={(p) => p.lat}
              intensityExtractor={(p) => p.intensity}
            />
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficManagement;
