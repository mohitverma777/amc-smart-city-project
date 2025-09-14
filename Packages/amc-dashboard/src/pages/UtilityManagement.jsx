import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cityData } from "../data/dummyData";

// Custom marker colors
const getWaterColor = (level) =>
  level > 70 ? "blue" : level > 40 ? "cyan" : "red";
const getWasteColor = (fill) =>
  fill < 50 ? "green" : fill < 80 ? "orange" : "red";
const getStreetlightColor = (s) =>
  s.working / s.total > 0.9 ? "green" : s.working / s.total > 0.6 ? "orange" : "red";

// Marker icon generator
const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${color}`,
    iconSize: [21, 34],
    iconAnchor: [10, 34],
    popupAnchor: [0, -30],
  });

const UtilityManagement = () => {
  const [water, setWater] = useState(cityData.utilities.water);
  const [waste, setWaste] = useState(cityData.utilities.waste);
  const [streetlights, setStreetlights] = useState(cityData.utilities.streetlights);

  // Simulate live updates every 25s
  useEffect(() => {
    const interval = setInterval(() => {
      setWater((prev) =>
        prev.map((t) => ({ ...t, level: Math.floor(Math.random() * 100) }))
      );
      setWaste((prev) =>
        prev.map((b) => ({ ...b, fill: Math.floor(Math.random() * 100) }))
      );
      setStreetlights((prev) =>
        prev.map((s) => ({
          ...s,
          working: Math.floor(Math.random() * (s.total + 1)),
        }))
      );
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 text-white p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water Supply */}
        <Card className="bg-[#1f1f23] border border-gray-700">
          <CardHeader>
            <CardTitle>💧 Water Supply Levels</CardTitle>
          </CardHeader>
          <CardContent>
            {water.map((tank) => (
              <div key={tank.zone} className="mb-3">
                <p className="text-sm mb-1">{tank.zone}: {tank.level}%</p>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full`}
                    style={{ width: `${tank.level}%`, backgroundColor: getWaterColor(tank.level) }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Waste Collection */}
        <Card className="bg-[#1f1f23] border border-gray-700">
          <CardHeader>
            <CardTitle>🗑 Waste Collection</CardTitle>
          </CardHeader>
          <CardContent>
            {waste.map((b) => (
              <div key={b.zone} className="mb-3">
                <p className="text-sm mb-1">{b.zone}: {b.fill}% full</p>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full`}
                    style={{ width: `${b.fill}%`, backgroundColor: getWasteColor(b.fill) }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Streetlights */}
        <Card className="bg-[#1f1f23] border border-gray-700">
          <CardHeader>
            <CardTitle>💡 Streetlights</CardTitle>
          </CardHeader>
          <CardContent>
            {streetlights.map((s) => (
              <p key={s.zone} className="mb-2">
                {s.zone}: {s.working}/{s.total} working
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="bg-[#1f1f23] border border-gray-700">
        <CardHeader>
          <CardTitle>🌍 Utility Map (Ahmedabad)</CardTitle>
        </CardHeader>
        <CardContent>
          <MapContainer center={[23.0225, 72.5714]} zoom={12} className="h-96 w-full rounded-lg">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {/* Water Markers */}
            {water.map((t, idx) => (
              <Marker
                key={`water-${idx}`}
                position={[23.02 + idx * 0.005, 72.57 + idx * 0.005]}
                icon={createIcon(getWaterColor(t.level).replace("#", ""))}
              >
                <Popup>{t.zone} Water Level: {t.level}%</Popup>
              </Marker>
            ))}
            {/* Waste Markers */}
            {waste.map((b, idx) => (
              <Marker
                key={`waste-${idx}`}
                position={[23.03 + idx * 0.005, 72.58 + idx * 0.005]}
                icon={createIcon(getWasteColor(b.fill).replace("#", ""))}
              >
                <Popup>{b.zone} Waste Fill: {b.fill}%</Popup>
              </Marker>
            ))}
            {/* Streetlight Markers */}
            {streetlights.map((s, idx) => (
              <Marker
                key={`lights-${idx}`}
                position={[23.04 + idx * 0.005, 72.56 + idx * 0.005]}
                icon={createIcon(getStreetlightColor(s).replace("#", ""))}
              >
                <Popup>{s.zone} Streetlights: {s.working}/{s.total}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilityManagement;
