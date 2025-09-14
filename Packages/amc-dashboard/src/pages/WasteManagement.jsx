import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Circle } from "react-leaflet";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import L from "leaflet";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import "leaflet/dist/leaflet.css";
import "@changey/react-leaflet-markercluster/dist/styles.min.css";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Dummy Data
const dummyRecords = [
  { date: "2025-08-10", zone: "Zone 3", collected: 113, status: "Completed", lat: 23.0305, lng: 72.5695, street: "MG Road", complaints: 0, lastComplaintDate: null },
  { date: "2025-08-11", zone: "Zone 5", collected: 342, status: "Pending", lat: 23.035, lng: 72.58, street: "Ring Road", complaints: 2, lastComplaintDate: "2025-08-11" },
  { date: "2025-08-12", zone: "Zone 5", collected: 198, status: "Completed", lat: 23.035, lng: 72.58, street: "Ring Road", complaints: 0, lastComplaintDate: null },
  { date: "2025-08-13", zone: "Zone 2", collected: 279, status: "Completed", lat: 23.05, lng: 72.59, street: "Central Ave", complaints: 1, lastComplaintDate: "2025-08-12" },
  { date: "2025-08-14", zone: "Zone 3", collected: 344, status: "Pending", lat: 23.0305, lng: 72.5695, street: "MG Road", complaints: 0, lastComplaintDate: null },
  { date: "2025-08-15", zone: "Zone 4", collected: 231, status: "Completed", lat: 23.06, lng: 72.57, street: "Lake Street", complaints: 0, lastComplaintDate: null },
  { date: "2025-08-16", zone: "Zone 1", collected: 335, status: "Completed", lat: 23.07, lng: 72.55, street: "Park Lane", complaints: 0, lastComplaintDate: null },
  { date: "2025-08-17", zone: "Zone 5", collected: 144, status: "Completed", lat: 23.035, lng: 72.58, street: "Ring Road", complaints: 0, lastComplaintDate: null },
];

const trucks = [
  { id: "T-101", zone: "Zone 3", lat: 23.031, lng: 72.57, status: "Collecting" },
  { id: "T-102", zone: "Zone 5", lat: 23.036, lng: 72.582, status: "Idle" },
];

const plants = [
  { name: "City Landfill", lat: 23.05, lng: 72.60, capacity: 65 },
  { name: "Recycling Plant", lat: 23.045, lng: 72.575, capacity: 40 },
];

// Dummy waste type data
const wasteTypeData = [
  { type: "Organic", amount: 1200 },
  { type: "Recyclable", amount: 800 },
  { type: "Hazardous", amount: 150 },
  { type: "Others", amount: 100 },
];
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

// Icons
const binIcons = {
  Pending: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [30, 45], iconAnchor: [15, 45],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), shadowSize: [41, 41],
  }),
  Completed: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconSize: [30, 45], iconAnchor: [15, 45],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), shadowSize: [41, 41],
  }),
};

const truckIcons = {
  Collecting: new L.Icon({ iconUrl: "https://img.icons8.com/color/48/000000/dump-truck.png", iconSize: [35, 35], iconAnchor: [17, 35] }),
  Idle: new L.Icon({ iconUrl: "https://img.icons8.com/color/48/000000/dump-truck.png", iconSize: [35, 35], iconAnchor: [17, 35] }),
};

const plantIcon = new L.Icon({
  iconUrl: "https://img.icons8.com/color/48/000000/factory.png", iconSize: [35, 35], iconAnchor: [17, 35],
});

const WasteManagement = () => {
  const [selectedZone, setSelectedZone] = useState("All Zones");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [searchText, setSearchText] = useState("");
  const [selectedRange, setSelectedRange] = useState("Last 7 Days");

  const filteredRecords = useMemo(() => {
    let records = dummyRecords;
    if (selectedZone !== "All Zones") records = records.filter(r => r.zone === selectedZone);
    if (selectedStatus !== "All Status") records = records.filter(r => r.status === selectedStatus);
    if (searchText) records = records.filter(r => r.street.toLowerCase().includes(searchText.toLowerCase()));
    const days = selectedRange === "Last 7 Days" ? 7 : 30;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    records = records.filter(r => new Date(r.date) >= cutoff);
    return records;
  }, [selectedZone, selectedStatus, searchText, selectedRange]);

  const totalWaste = filteredRecords.reduce((sum, r) => sum + r.collected, 0);
  const pendingPickups = filteredRecords.filter(r => r.status === "Pending").length;
  const avgCollectionTime = 1.2;
  const delayedZones = [...new Set(filteredRecords.filter(r => r.status === "Pending").map(r => r.zone))];
  const alertZones = delayedZones.filter(zone =>
    filteredRecords.filter(r => r.zone === zone && r.status === "Pending").length >= 2
  );

  // Chart Data
  const aggregatedWaste = {};
  filteredRecords.forEach(r => { aggregatedWaste[r.date] = (aggregatedWaste[r.date] || 0) + r.collected; });
  const chartData = Object.keys(aggregatedWaste).map(date => ({ date, waste: aggregatedWaste[date] }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex space-x-4 items-center flex-wrap">
        <select className="bg-gray-800 text-white p-2 rounded" value={selectedRange} onChange={e => setSelectedRange(e.target.value)}>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
        <select className="bg-gray-800 text-white p-2 rounded" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
          <option>All Zones</option>
          {[...new Set(dummyRecords.map(r => r.zone))].map(zone => <option key={zone}>{zone}</option>)}
        </select>
        <select className="bg-gray-800 text-white p-2 rounded" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
          <option>All Status</option><option>Completed</option><option>Pending</option>
        </select>
        <input type="text" placeholder="Search street / area..." className="bg-gray-800 text-white p-2 rounded flex-1 min-w-[200px]" value={searchText} onChange={e => setSearchText(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition">
          <CardHeader><CardTitle>Total Waste Collected</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalWaste} kg</p></CardContent>
        </Card>
        <Card className="hover:shadow-lg transition">
          <CardHeader><CardTitle>Pending Pickups</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{pendingPickups}</p></CardContent>
        </Card>
        <Card className="hover:shadow-lg transition">
          <CardHeader><CardTitle>Avg. Collection Time</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{avgCollectionTime} hrs</p></CardContent>
        </Card>
        <Card className="hover:shadow-lg transition">
          <CardHeader><CardTitle>Zones with Delays</CardTitle></CardHeader>
          <CardContent>
            <ul>{delayedZones.length ? delayedZones.map(zone => <li key={zone}>{zone}</li>) : <li>None</li>}</ul>
          </CardContent>
        </Card>
        {alertZones.length > 0 && (
          <Card className="bg-red-600 text-white hover:shadow-lg transition">
            <CardHeader><CardTitle>⚠ Alert</CardTitle></CardHeader>
            <CardContent>
              <ul>{alertZones.map(zone => <li key={zone}>Multiple pending pickups in {zone}</li>)}</ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Map + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Collection Map View</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div style={{ height: "500px", width: "100%" }}>
              <MapContainer center={[23.035, 72.58]} zoom={12} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                <LayersControl position="topright">
                  {/* Bins */}
                  <LayersControl.Overlay name="Bins" checked>
                    <LayerGroup>
                      <MarkerClusterGroup chunkedLoading>
                        {filteredRecords.map((r, i) => (
                          <Marker key={`bin-${i}`} position={[r.lat, r.lng]} icon={binIcons[r.status]}>
                            <Popup>
                              <div className="bg-gray-800 text-white p-2 rounded shadow-md">
                                <strong>{r.zone}</strong><br/>
                                Street: {r.street}<br/>
                                Collected: {r.collected} kg<br/>
                                Status: <span className={r.status === "Pending" ? "text-red-400" : "text-green-400"}>{r.status}</span><br/>
                                {r.complaints > 0 && <span className="text-yellow-400">⚠ <a href={`/complaints?zone=${r.zone}`} className="underline">{r.complaints} Complaints</a></span>}
                                {r.lastComplaintDate && <div>Last complaint: {r.lastComplaintDate}</div>}
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MarkerClusterGroup>
                      {/* Pending heatmap */}
                      {filteredRecords.map((r, i) => r.status === "Pending" && (
                        <Circle key={`heat-${i}`} center={[r.lat, r.lng]} radius={120} pathOptions={{ color: "red", fillOpacity: 0.2 }} />
                      ))}
                      {/* Complaint heatmap */}
                      {filteredRecords.map((r, i) => r.complaints > 0 && (
                        <Circle key={`complaint-${i}`} center={[r.lat, r.lng]} radius={120} pathOptions={{ color: "yellow", fillOpacity: 0.2 }} />
                      ))}
                    </LayerGroup>
                  </LayersControl.Overlay>

                  {/* Trucks */}
                  <LayersControl.Overlay name="Trucks" checked>
                    <LayerGroup>
                      <MarkerClusterGroup chunkedLoading>
                        {trucks.map((t, i) => (
                          <Marker key={`truck-${i}`} position={[t.lat, t.lng]} icon={truckIcons[t.status]}>
                            <Popup>
                              <div className="bg-gray-800 text-white p-2 rounded shadow-md">
                                <strong>Truck ID: {t.id}</strong><br/>
                                Zone: {t.zone}<br/>
                                Status: <span className={t.status === "Collecting" ? "text-green-400" : "text-yellow-400"}>{t.status}</span>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MarkerClusterGroup>
                    </LayerGroup>
                  </LayersControl.Overlay>

                  {/* Plants */}
                  <LayersControl.Overlay name="Plants" checked>
                    <LayerGroup>
                      <MarkerClusterGroup chunkedLoading>
                        {plants.map((p, i) => (
                          <Marker key={`plant-${i}`} position={[p.lat, p.lng]} icon={plantIcon}>
                            <Popup>
                              <div className="bg-gray-800 text-white p-2 rounded shadow-md w-48">
                                <strong>{p.name}</strong><br/>
                                Capacity Used: {p.capacity}%
                                <div className="bg-gray-600 h-2 rounded mt-1">
                                  <div className="bg-green-500 h-2 rounded" style={{ width: `${p.capacity}%` }}></div>
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

        {/* Charts */}
        <div className="space-y-4">
          {/* Waste Trend */}
          <Card>
            <CardHeader><CardTitle>Waste Collected Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="waste" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Waste Type Breakdown */}
          <Card>
            <CardHeader><CardTitle>Waste Type Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={wasteTypeData} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={80} label>
                    {wasteTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WasteManagement;
