// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Complaints from "./pages/Complaints";
import Reports from "./pages/Reports";
import WasteManagement from "./pages/WasteManagement";
import UtilityManagement from "./pages/UtilityManagement";  
import TrafficManagement from "./pages/TrafficManagement";
import AIInsights from "./pages/AiInsights";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import ElectricityManagement from "./pages/ElectricityManagement";
import PaymentManagement from "./pages/PaymentManagement";
// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';

import Dashboard from './pages/Dashboard';

// Error Pages
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-gray-600">Page not found</p>
    </div>
  </div>
);


function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          {/* Toast Notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4aed88',
                },
              },
              error: {
                duration: 5000,
                theme: {
                  primary: '#ff4b4b',
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              {/* Dashboard Routes */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Add more protected routes here as needed */}
              <Route path="/complaints" element={<Complaints />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/waste-management" element={<WasteManagement />} />
            <Route path="/traffic" element={<TrafficManagement />} />
            <Route path="/utility-management" element={<UtilityManagement />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/electricity-management" element={<ElectricityManagement />} />
            <Route path="/payment-management" element={<PaymentManagement />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;