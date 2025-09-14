import React from "react";
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
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { aiData } from "../data/aiData";

// Marker helper
const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${color}`,
    iconSize: [21, 34],
    iconAnchor: [10, 34],
    popupAnchor: [0, -30],
  });

// Trend Arrow Component
const TrendArrow = ({ value }) => (
  <span className={`ml-1 text-${value > 70 ? "red" : "green"}-400 font-bold`}>
    {value > 70 ? "▲" : "▼"}
  </span>
);

const AIInsights = () => {
  return (
    <div className="space-y-6 text-white p-4">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Traffic */}
        <Card className="bg-[#1f1f23] border border-gray-700 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              🚦 Traffic Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiData.trafficForecast.map((t) => (
              <p key={t.zone} className="text-md font-semibold flex items-center justify-between">
                {t.zone}: <span>{t.density}% <TrendArrow value={t.density} /></span>
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Water */}
        <Card className="bg-[#1f1f23] border border-gray-700 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              💧 Water Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiData.waterForecast.map((w) => (
              <p key={w.zone} className="text-md font-semibold flex items-center justify-between">
                {w.zone}: <span>{w.level}% <TrendArrow value={w.level} /></span>
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Waste */}
        <Card className="bg-[#1f1f23] border border-gray-700 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              🗑 Waste Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiData.wasteForecast.map((w) => (
              <p key={w.zone} className="text-md font-semibold flex items-center justify-between">
                {w.zone}: <span>{w.fill}% <TrendArrow value={w.fill} /></span>
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Streetlights */}
        <Card className="bg-[#1f1f23] border border-gray-700 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              💡 Streetlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiData.streetlightForecast.map((s) => (
              <p key={s.zone} className="text-md font-semibold flex items-center justify-between">
                {s.zone}: {s.working}% working, Failures: {s.predictedFailures}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Bar Chart */}
      <Card className="bg-[#1f1f23] border border-gray-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>🚦 Traffic Congestion Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={aiData.trafficForecast}>
              <CartesianGrid stroke="#555" strokeDasharray="3 3" />
              <XAxis dataKey="zone" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="density" fill="#facc15" animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Water Line Chart */}
      <Card className="bg-[#1f1f23] border border-gray-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>💧 Water Demand Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={aiData.waterForecast}>
              <CartesianGrid stroke="#555" strokeDasharray="3 3" />
              <XAxis dataKey="zone" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={3} animationDuration={1500} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Leaflet Map - Traffic Hotspots */}
      <Card className="bg-[#1f1f23] border border-gray-700 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>🌍 Traffic Hotspots Map</CardTitle>
        </CardHeader>
        <CardContent>
          <MapContainer center={[23.0225, 72.5714]} zoom={12} className="h-96 w-full rounded-lg">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {aiData.trafficForecast.map((t, idx) => (
              <Marker
                key={t.zone}
                position={[23.02 + idx * 0.005, 72.57 + idx * 0.005]}
                icon={createIcon(t.density > 70 ? "FF0000" : "FFFF00")}
              >
                <Popup>{t.zone} predicted congestion: {t.density}%</Popup>
              </Marker>
            ))}
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
