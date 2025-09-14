// src/data/TopZones.jsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const TopZones = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-900 text-white border-gray-700">
        <CardHeader>
          <CardTitle>Top Performing Zones</CardTitle>
        </CardHeader>
        <CardContent>No data available</CardContent>
      </Card>
    );
  }

  // Sort zones by fewest complaints
  const sortedZones = [...data].sort((a, b) => a.complaints - b.complaints);

  return (
    <Card className="bg-gray-900 text-white border-gray-700">
      <CardHeader>
        <CardTitle>Top Performing Zones</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">Zone</th>
              <th className="p-2">Complaints</th>
              <th className="p-2">Avg Resolution Time</th>
            </tr>
          </thead>
          <tbody>
            {sortedZones.map((zone, index) => (
              <tr key={index} className="border-b border-gray-800">
                <td className="p-2">{zone.name}</td>
                <td className="p-2">{zone.complaints}</td>
                <td className="p-2">{zone.avgResolutionTime} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default TopZones;
