import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import Reports from "./pages/Reports";
import WasteManagement from "./pages/WasteManagement";
import UtilityManagement from "./pages/UtilityManagement";  
import TrafficManagement from "./pages/TrafficManagement";
import AIInsights from "./pages/AiInsights";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";


// Components
import Sidebar from "./components/Sidebar";

const App = () => {
  return (
    <Router>
      <div className="flex bg-[#121212] min-h-screen text-white">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          <Routes>
            {/* Redirect root to /dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/waste-management" element={<WasteManagement />} />
            <Route path="/traffic" element={<TrafficManagement />} />
            <Route path="/utility-management" element={<UtilityManagement />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/user-management" element={<UserManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
