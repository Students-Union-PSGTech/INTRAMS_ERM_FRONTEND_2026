import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import HomePage from './components/HomePage';
import ViewEvents from './components/ViewEvents';
import EventDetails from './components/EventDetails';
import CreateEventLayout from './components/CreateEventLayout';
import UpdateEventController from './components/UpdateEventController';
import EditRequestsPage from './components/EditRequestsPage';
import LabConfirmationPage from './components/LabConfirmationPage';
import NotFound from './components/NotFound';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen" aria-busy="true" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/view-events" element={<ProtectedRoute><ViewEvents /></ProtectedRoute>} />
      <Route path="/event/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
      <Route path="/create-event" element={<ProtectedRoute><CreateEventLayout /></ProtectedRoute>} />
      <Route path="/update-event/:id" element={<ProtectedRoute><UpdateEventController /></ProtectedRoute>} />
      <Route path="/edit" element={<ProtectedRoute><EditRequestsPage /></ProtectedRoute>} />
      <Route path="/lab-confirmation" element={<ProtectedRoute><LabConfirmationPage /></ProtectedRoute>} />
      <Route path="/edit-access" element={<Navigate to="/edit" replace />} />
      <Route path="/edit-requests" element={<Navigate to="/edit" replace />} />
      <Route path="/lab-confirmations" element={<Navigate to="/lab-confirmation" replace />} />
      <Route path="/my-events" element={<Navigate to="/view-events" replace />} />
      <Route path="/attendance" element={<Navigate to="/view-events" replace />} />
      <Route path="/items" element={<Navigate to="/create-event" replace />} />
      <Route path="/rounds" element={<Navigate to="/create-event" replace />} />
      <Route path="/review" element={<Navigate to="/create-event" replace />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return <AuthProvider><Router><AppRoutes /></Router></AuthProvider>;
}

export default App;
