import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Dummy 7-day data
const data = [
  { date: "Aug 1", complaints: 34 },
  { date: "Aug 2", complaints: 27 },
  { date: "Aug 3", complaints: 45 },
  { date: "Aug 4", complaints: 20 },
  { date: "Aug 5", complaints: 38 },
  { date: "Aug 6", complaints: 29 },
  { date: "Aug 7", complaints: 41 },
];

const ComplaintTrendsChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="complaints" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ComplaintTrendsChart;
