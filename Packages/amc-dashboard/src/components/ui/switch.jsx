import React from "react";

export const Switch = ({ checked, onCheckedChange }) => {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`w-12 h-6 rounded-full p-1 transition-colors ${
        checked ? "bg-green-500" : "bg-gray-600"
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
};
