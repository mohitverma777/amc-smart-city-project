import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Trash2,
  TrafficCone,
  Wrench,
  Brain,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openCityOps, setOpenCityOps] = useState(true);
  const [openAdmin, setOpenAdmin] = useState(true);

  const cityOpsItems = [
    { name: "Waste Management", path: "/waste-management", icon: Trash2 },
    { name: "Traffic Management", path: "/traffic", icon: TrafficCone }, // ✅ updated
    { name: "Utility Management", path: "/utility-management", icon: Wrench },
    { name: "AI Insights", path: "/ai-insights", icon: Brain },
  ];

  const adminItems = [
    { name: "User Management", path: "/user-management", icon: Users },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-[#1f1f23] min-h-screen p-4 flex flex-col transition-all duration-300`}
    >
      {/* Toggle sidebar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="self-end text-gray-400 hover:text-white mb-6"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <nav className="space-y-4 flex-1">
        {/* Main menu */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg transition ${
              isActive
                ? "bg-blue-500/20 text-blue-400 font-semibold"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <LayoutDashboard size={20} />
          {!collapsed && <span className="ml-3">Dashboard</span>}
        </NavLink>

        <NavLink
          to="/complaints"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg transition ${
              isActive
                ? "bg-blue-500/20 text-blue-400 font-semibold"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <FileText size={20} />
          {!collapsed && <span className="ml-3">Complaints</span>}
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg transition ${
              isActive
                ? "bg-blue-500/20 text-blue-400 font-semibold"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <BarChart3 size={20} />
          {!collapsed && <span className="ml-3">Reports</span>}
        </NavLink>

        {/* City Operations */}
        <div>
          {!collapsed && (
            <button
              onClick={() => setOpenCityOps(!openCityOps)}
              className="flex justify-between items-center w-full text-gray-400 hover:text-white mb-1"
            >
              <span className="uppercase text-xs tracking-wider">City Operations</span>
              {openCityOps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          {openCityOps &&
            cityOpsItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition ${
                      isActive
                        ? "bg-blue-500/20 text-blue-400 font-semibold"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <Icon size={20} />
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </NavLink>
              );
            })}
        </div>

        {/* Admin Panel */}
        <div>
          {!collapsed && (
            <button
              onClick={() => setOpenAdmin(!openAdmin)}
              className="flex justify-between items-center w-full text-gray-400 hover:text-white mb-1"
            >
              <span className="uppercase text-xs tracking-wider">Admin Panel</span>
              {openAdmin ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          {openAdmin &&
            adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition ${
                      isActive
                        ? "bg-blue-500/20 text-blue-400 font-semibold"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <Icon size={20} />
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </NavLink>
              );
            })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
