import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

// Dummy user data
const usersData = [
  {
    id: 1,
    name: "Ravi Sharma",
    email: "ravi.sharma@example.com",
    role: "Admin",
    status: "Active",
    complaints: 5,
  },
  {
    id: 2,
    name: "Priya Patel",
    email: "priya.patel@example.com",
    role: "Staff",
    status: "Active",
    complaints: 12,
  },
  {
    id: 3,
    name: "Amit Singh",
    email: "amit.singh@example.com",
    role: "Viewer",
    status: "Suspended",
    complaints: 0,
  },
  {
    id: 4,
    name: "Neha Verma",
    email: "neha.verma@example.com",
    role: "Staff",
    status: "Active",
    complaints: 8,
  },
];

const UserManagement = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Filtered users
  const filteredUsers = usersData.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    const matchesStatus = statusFilter === "All" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 text-white">
      <Card className="bg-[#1f1f23] border border-gray-700">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <input
              type="text"
              placeholder="🔍 Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-1/3 px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none"
            />

            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Viewer">Viewer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-700">
              <thead>
                <tr className="bg-gray-800 text-left">
                  <th className="p-3 border border-gray-700">Name</th>
                  <th className="p-3 border border-gray-700">Email</th>
                  <th className="p-3 border border-gray-700">Role</th>
                  <th className="p-3 border border-gray-700">Status</th>
                  <th className="p-3 border border-gray-700">Complaints</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800">
                      <td className="p-3 border border-gray-700">{user.name}</td>
                      <td className="p-3 border border-gray-700">{user.email}</td>
                      <td className="p-3 border border-gray-700">{user.role}</td>
                      <td className="p-3 border border-gray-700">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.status === "Active"
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3 border border-gray-700 text-center">
                        {user.complaints}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
