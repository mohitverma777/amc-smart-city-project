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
  ChevronUp,
  ShieldCheck,
  LogOut,
  CreditCard,
  Zap,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const SidebarItem = ({ icon, text, path, collapsed }) => (
  <NavLink
    to={path}
    className={({ isActive }) =>
      `flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2.5 my-0.5 rounded-lg transition-all duration-200 group relative ${
        isActive
          ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/30"
          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
      }`
    }
    title={collapsed ? text : ""}
  >
    {({ isActive }) => (
      <>
        {isActive && !collapsed && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
        )}
        <span className={`${collapsed ? '' : 'mr-3'} transition-transform duration-200 ${
          collapsed ? 'group-hover:scale-110' : ''
        }`}>
          {icon}
        </span>
        {!collapsed && <span className="text-sm font-medium truncate">{text}</span>}
      </>
    )}
  </NavLink>
);

const CollapsibleSection = ({ title, collapsed, items }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="my-3">
      {!collapsed && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex justify-between items-center w-full text-gray-500 hover:text-gray-300 mb-2 px-3 py-1 transition-colors duration-200 rounded-md hover:bg-gray-800/30"
        >
          <span className="uppercase text-[10px] tracking-widest font-bold opacity-70">
            {title}
          </span>
          <div className={`transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}>
            <ChevronUp size={14} />
          </div>
        </button>
      )}
      
      {(isOpen || collapsed) && (
        <div className="space-y-0.5">
          {items.map((item, index) => (
            <SidebarItem
              key={index}
              path={item.path}
              icon={<item.icon size={20} />}
              text={item.name}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ onLogout, collapsed, setCollapsed }) => {
  const cityOpsItems = [
    { name: "Payment Management", path: "/payment-management", icon: CreditCard },
    // { name: "Waste Management", path: "/waste-management", icon: Trash2 },
    { name: "Electricity Management", path: "/electricity-management", icon: Zap },
    { name: "Traffic Management", path: "/traffic", icon: TrafficCone },
    { name: "Utility Management", path: "/utility-management", icon: Wrench },
    { name: "AI Insights", path: "/ai-insights", icon: Brain },
  ];

  const adminItems = [
    { name: "User Management", path: "/user-management", icon: Users },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={`bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-gray-300 flex flex-col fixed h-screen top-0 left-0 z-50 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      } shadow-2xl`}
    >
      {/* Header with Logo */}
      <div className={`p-4 flex items-center shrink-0 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500 blur-sm rounded-lg" />
              <div className="relative p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg">
                <ShieldCheck className="text-white" size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">SmartCity</h1>
              <p className="text-[10px] text-teal-400 uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500 blur-sm rounded-lg" />
            <div className="relative p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg">
              <ShieldCheck className="text-white" size={20} strokeWidth={2.5} />
            </div>
          </div>
        )}
        
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-all duration-200"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Collapsed Toggle Button */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto my-2 p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-all duration-200"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Divider */}
      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        <SidebarItem
          path="/dashboard"
          icon={<LayoutDashboard size={20} />}
          text="Dashboard"
          collapsed={collapsed}
        />
        <SidebarItem
          path="/complaints"
          icon={<FileText size={20} />}
          text="Complaints"
          collapsed={collapsed}
        />
        <SidebarItem
          path="/reports"
          icon={<BarChart3 size={20} />}
          text="Reports"
          collapsed={collapsed}
        />

        <div className="my-3 mx-2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

        <CollapsibleSection
          title="City Operations"
          collapsed={collapsed}
          items={cityOpsItems}
        />

        <div className="my-3 mx-2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

        <CollapsibleSection
          title="Admin Panel"
          collapsed={collapsed}
          items={adminItems}
        />
      </nav>

      {/* Divider */}
      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

      {/* Footer / Logout */}
      <div className="p-3 shrink-0">
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group border border-transparent hover:border-red-500/30`}
          title={collapsed ? "Logout" : ""}
        >
          <span className={`${collapsed ? '' : 'mr-3'} transition-transform duration-200 ${
            collapsed ? 'group-hover:scale-110 group-hover:rotate-12' : ''
          }`}>
            <LogOut size={20} />
          </span>
          {!collapsed && <span className="text-sm font-semibold">Logout</span>}
        </button>
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
