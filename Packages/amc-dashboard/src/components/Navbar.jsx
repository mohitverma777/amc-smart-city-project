// Packages/amc-dashboard/src/components/Navbar.jsx
import React from 'react';

const Navbar = () => {
  return (
    <div className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="flex items-center gap-4">
        <span className="text-gray-600">Welcome, Admin</span>
        <img
          src="https://via.placeholder.com/40"
          alt="User"
          className="rounded-full w-10 h-10"
        />
      </div>
    </div>
  );
};

export default Navbar;
