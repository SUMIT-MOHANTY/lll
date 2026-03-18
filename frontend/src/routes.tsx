import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/admin/Dashboard';
import SlotManagement from './pages/admin/SlotManagement';
import Analytics from './pages/admin/Analytics';
import Login from './components/Login';
import Register from './components/Register';
import AppointmentBooking from './pages/AppointmentBooking';
import UserDashboard from './pages/UserDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User routes */}
      <Route
        path="/appointments"
        element={<ProtectedRoute element={<AppointmentBooking />} />}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute element={<UserDashboard />} />}
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={<AdminRoute element={<Dashboard />} />}
      />
      <Route
        path="/admin/slots"
        element={<AdminRoute element={<SlotManagement />} />}
      />
      <Route
        path="/admin/analytics"
        element={<AdminRoute element={<Analytics />} />}
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;
