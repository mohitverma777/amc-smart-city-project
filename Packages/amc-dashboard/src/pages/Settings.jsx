import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { User, Lock, LogOut, Save } from "lucide-react";

const Settings = () => {
  const [adminName, setAdminName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    const savedName = localStorage.getItem("adminName") || "AMC Admin";
    const savedPassword = localStorage.getItem("adminPassword") || "admin123";
    setAdminName(savedName);
    setStoredPassword(savedPassword);
  }, []);

  const saveProfile = () => {
    if (currentPassword || newPassword || confirmPassword) {
      if (currentPassword !== storedPassword) {
        setMessageType("error");
        setMessage("❌ Current password is incorrect.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessageType("error");
        setMessage("❌ New passwords do not match.");
        return;
      }
      if (newPassword.length < 6) {
        setMessageType("error");
        setMessage("❌ Password must be at least 6 characters.");
        return;
      }
      localStorage.setItem("adminPassword", newPassword);
      setStoredPassword(newPassword);
      setMessageType("success");
      setMessage("✅ Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    localStorage.setItem("adminName", adminName);
    setMessageType("success");
    setMessage("✅ Profile updated successfully!");
  };

  const logout = () => {
    setMessageType("success");
    setMessage("🚪 Logged out successfully!");
    // Later: redirect to login page
  };

  return (
    <div className="p-8 space-y-8 text-white max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-400">⚙️ Settings</h1>
      <p className="text-gray-400 mb-4">Manage your profile and security preferences.</p>

      {/* Feedback */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm font-medium shadow-md ${
            messageType === "success"
              ? "bg-green-900/30 border border-green-500 text-green-300"
              : "bg-red-900/30 border border-red-500 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Profile & Password Card */}
      <Card className="bg-[#1e1e2e] border border-gray-700 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-blue-300">
            <User className="w-5 h-5" /> Admin Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Admin Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Admin Name</label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Current Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={saveProfile}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition shadow-md"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </CardContent>
      </Card>

      {/* Logout Card */}
      <Card className="bg-[#1e1e2e] border border-gray-700 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-300">
            <LogOut className="w-5 h-5" /> Logout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition shadow-md"
          >
            <Lock className="w-4 h-4" /> Logout
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
