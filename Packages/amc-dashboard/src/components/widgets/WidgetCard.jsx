// src/components/widgets/WidgetCard.jsx
import React from 'react';

const WidgetCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className={`bg-[#1f1f23] rounded-2xl p-5 flex items-center shadow-md`}>
      <div className={`p-3 rounded-full mr-4`} style={{ backgroundColor: color }}>
        <Icon size={24} color="#fff" />
      </div>
      <div>
        <h4 className="text-gray-400 text-sm">{title}</h4>
        <h2 className="text-2xl font-semibold">{value}</h2>
      </div>
    </div>
  );
};

export default WidgetCard;
