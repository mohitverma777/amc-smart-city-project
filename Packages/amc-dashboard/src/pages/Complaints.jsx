import React, { useState, useMemo } from "react";
import ComplaintTrendsChart from "../data/ComplaintTrendsChart";
import RecentComplaintsTable from "../data/RecentComplaintsTable";
import TopZones from "../data/TopZones";

const ComplaintsPage = () => {
  const [filters, setFilters] = useState({ zone: "", type: "", status: "" });

  const allComplaints = [
    { id: 1, name: "John Doe", area: "Zone A", type: "Plumbing", date: "2025-08-05", status: "Pending" },
    { id: 2, name: "Jane Smith", area: "Zone B", type: "Electrical", date: "2025-08-04", status: "Resolved" },
    { id: 3, name: "Mike Johnson", area: "Zone A", type: "Cleaning", date: "2025-08-03", status: "In Progress" },
    { id: 4, name: "Sarah Lee", area: "Zone C", type: "Plumbing", date: "2025-08-02", status: "Resolved" },
  ];

  // Unique filter options
  const zones = useMemo(() => [...new Set(allComplaints.map(c => c.area))], [allComplaints]);
  const types = useMemo(() => [...new Set(allComplaints.map(c => c.type))], [allComplaints]);
  const statuses = useMemo(() => [...new Set(allComplaints.map(c => c.status))], [allComplaints]);

  // Apply filters
  const filteredComplaints = useMemo(() => {
    return allComplaints.filter(c => {
      return (
        (filters.zone === "" || c.area === filters.zone) &&
        (filters.type === "" || c.type === filters.type) &&
        (filters.status === "" || c.status === filters.status)
      );
    });
  }, [filters, allComplaints]);

  // Calculate top zones dynamically from filtered complaints
  const topZonesData = useMemo(() => {
    const zoneMap = filteredComplaints.reduce((acc, complaint) => {
      if (!acc[complaint.area]) {
        acc[complaint.area] = { zone: complaint.area, complaints: 0, resolved: 0 };
      }
      acc[complaint.area].complaints++;
      if (complaint.status === "Resolved") {
        acc[complaint.area].resolved++;
      }
      return acc;
    }, {});

    // Convert to array and sort by highest resolved percentage
    return Object.values(zoneMap)
      .map(z => ({
        ...z,
        resolutionRate:
          z.complaints > 0 ? ((z.resolved / z.complaints) * 100).toFixed(1) : "0.0"
      }))
      .sort((a, b) => b.resolutionRate - a.resolutionRate);
  }, [filteredComplaints]);

  return (
    <div className="space-y-6 p-4 text-white bg-gray-900 min-h-screen">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        {/* Zone Filter */}
        <select
          value={filters.zone}
          onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
          className="bg-gray-800 text-white p-2 rounded-lg border border-gray-600"
        >
          <option value="">All Zones</option>
          {zones.map(zone => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="bg-gray-800 text-white p-2 rounded-lg border border-gray-600"
        >
          <option value="">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-gray-800 text-white p-2 rounded-lg border border-gray-600"
        >
          <option value="">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Complaint Trends */}
      <ComplaintTrendsChart complaints={filteredComplaints} />

      {/* Recent Complaints Table */}
      <RecentComplaintsTable complaints={filteredComplaints} />

      {/* Top Performing Zones */}
      <TopZones data={topZonesData} />
    </div>
  );
};

export default ComplaintsPage;
