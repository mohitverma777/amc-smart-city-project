import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-md ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return (
    <div className="mb-2 border-b pb-2">
      {children}
    </div>
  );
}

export function CardTitle({ children }) {
  return (
    <h3 className="text-lg font-semibold text-gray-800">{children}</h3>
  );
}

export function CardContent({ children }) {
  return (
    <div className="text-sm text-gray-600">
      {children}
    </div>
  );
}