import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { AlertTriangle, Trash2, FileWarning, Activity } from "lucide-react";
import ComplaintTrendsChart from '../data/ComplaintTrendsChart';
import RecentComplaintsTable from "../data/RecentComplaintsTable";
import TopZones from "../data/TopZones";


// Dummy Data (can later replace with API state)
const topStats = [
  {
    title: "Garbage Collection",
    value: "143",
    sub: "Updated 15 mins ago",
    color: "green",
    icon: <Trash2 className="h-5 w-5 text-green-700" />,
  },
  {
    title: "Total Complaints",
    value: "86",
    sub: "5 new today",
    color: "yellow",
    icon: <FileWarning className="h-5 w-5 text-yellow-700" />,
  },
  {
    title: "Traffic",
    value: "Medium",
    sub: "Across 4 major areas",
    color: "red",
    icon: <Activity className="h-5 w-5 text-red-700" />,
  },
];

const highAlerts = [
  { text: "🔥 Fire detected in zone 3 — Immediate action required.", type: "red" },
  { text: "🚨 Waterlogging near Navrangpura — Level: Moderate.", type: "yellow" },
  { text: "🚗 Traffic congestion reported in CG Road — Estimated delay: 20 min.", type: "red" },
];

const sensorStatus = [
  { name: "Bin 1 (Maninagar)", status: "Normal", color: "green" },
  { name: "Bin 4 (Usmanpura)", status: "Overflow", color: "red" },
  { name: "Signal Sensor 2", status: "Unstable", color: "yellow" },
  { name: "Sensor 7 (Ambawadi)", status: "Normal", color: "green" },
];

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topStats.map((item, index) => (
          <Card
            key={index}
            className={`bg-${item.color}-50 border-${item.color}-200 shadow-sm`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-md font-medium text-${item.color}-700`}>
                {item.title}
              </CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold text-${item.color}-900`}>{item.value}</div>
              <p className={`text-xs text-${item.color}-600`}>{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Alerts */}
        <Card className="lg:col-span-2 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              High Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {highAlerts.map((alert, i) => (
                <li
                  key={i}
                  className={`border p-3 rounded-md bg-${alert.type}-50 text-sm text-${alert.type}-700`}
                >
                  {alert.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Sensor Behavior */}
        <Card className="bg-slate-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-md text-slate-700">Sensor Behavior</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {sensorStatus.map((sensor, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{sensor.name}</span>
                  <span className={`text-${sensor.color}-600`}>{sensor.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <ComplaintTrendsChart />
      {/* Recent Complaints Table */}
<div className="mt-8 bg-white shadow rounded-xl p-6">
  <RecentComplaintsTable />
</div>

<TopZones />
    </div>
  );
};

export default Dashboard;
