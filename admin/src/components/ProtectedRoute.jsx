import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from './layout/AdminLayout';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-[var(--bg)]" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role || 'member';
  if (allowedRoles?.length && !allowedRoles.includes(userRole)) {
    const defaultHome = userRole === 'procurement' ? '/grant-allocation' : '/dashboard';
    return <Navigate to={defaultHome} replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
