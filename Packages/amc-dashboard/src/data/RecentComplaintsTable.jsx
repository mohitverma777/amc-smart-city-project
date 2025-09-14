import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const statusColors = {
  Pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Resolved: "bg-green-500/20 text-green-400 border border-green-500/30",
  InProgress: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
};

const RecentComplaintsTable = ({ complaints = [] }) => {
  return (
    <Card className="bg-gray-900 border border-gray-800 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-gray-800 px-6 py-4">
        <CardTitle className="text-lg font-semibold text-gray-100">
          Recent Complaints
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="bg-gray-800 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Area</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length > 0 ? (
                complaints.map((complaint, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-800/60 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-medium text-gray-100">
                      {complaint.name}
                    </td>
                    <td className="px-6 py-4">{complaint.area}</td>
                    <td className="px-6 py-4">{complaint.type}</td>
                    <td className="px-6 py-4">{complaint.date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[complaint.status] ||
                          "bg-gray-600/20 text-gray-300 border border-gray-500/30"
                        }`}
                      >
                        {complaint.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-6 text-center text-gray-500 italic"
                  >
                    No complaints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentComplaintsTable;
