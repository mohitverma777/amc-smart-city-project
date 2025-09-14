import React from "react";

const zones = ["All Zones", "Navrangpura", "Maninagar", "Vastrapur", "Satellite"];
const types = ["All Types", "Garbage", "Water Leakage", "Road Damage", "Streetlight", "Others"];
const statuses = ["All Statuses", "Resolved", "Pending", "In Progress"];

const ComplaintFilters = ({ zone, setZone, type, setType, status, setStatus, date, setDate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Zone Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Zone</label>
        <select
          className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          {zones.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
      </div>

      {/* Type Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Complaint Type</label>
        <select
          className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Date Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
        />
      </div>
    </div>
  );
};

export default ComplaintFilters;
