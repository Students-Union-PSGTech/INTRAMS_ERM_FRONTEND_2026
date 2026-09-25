import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./components/login'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const Dashboard = lazy(() => import('./components/info'));
const EventsList = lazy(() => import('./components/events'));
const AssociationsList = lazy(() => import('./components/associations'));
const AssociationDetail = lazy(() => import('./components/associationDetail'));
const EventDetail = lazy(() => import('./components/info-deep'));
const Items = lazy(() => import('./components/items'));
const CustomItems = lazy(() => import('./components/customItems'));
const Inventory = lazy(() => import('./components/stocks'));
const LabConfirmation = lazy(() => import('./components/labConfirmation'));
const GrantItems = lazy(() => import('./components/grantItems'));
const GrantEventItems = lazy(() => import('./components/grantEventItems'));
const GrantLogs = lazy(() => import('./components/grantLogs'));
const EditAccess = lazy(() => import('./components/editaccess'));
const Procurements = lazy(() => import('./components/procurements'));
const RolePdf = lazy(() => import('./components/rolePdf/RolePdf'));

function PageLoader() {
  return <div className="min-h-screen bg-[var(--bg)]" />;
}

function Guard({ roles, children }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>;
}

function RedirectTo({ to }) {
  const params = useParams();
  const path = to.replace(/:([A-Za-z]+)/g, (_, key) => params[key]);
  return <Navigate to={path} replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={<Guard roles={['admin', 'member', 'procurement']}><Dashboard /></Guard>} />
        <Route path="/cards" element={<Navigate to="/dashboard" replace />} />

        <Route path="/events" element={<Guard roles={['admin', 'member', 'procurement']}><EventsList /></Guard>} />
        <Route path="/events/:id" element={<Guard roles={['admin', 'member', 'procurement']}><EventDetail /></Guard>} />
        <Route path="/info-deep/:id" element={<RedirectTo to="/events/:id" />} />

        <Route path="/associations" element={<Guard roles={['admin', 'member']}><AssociationsList /></Guard>} />
        <Route path="/associations/:id" element={<Guard roles={['admin', 'member']}><AssociationDetail /></Guard>} />
        <Route path="/add" element={<Navigate to="/associations" replace />} />

        <Route path="/items" element={<Guard roles={['admin', 'member', 'procurement']}><Items /></Guard>} />
        <Route path="/custom-items" element={<Guard roles={['admin', 'member', 'procurement']}><CustomItems /></Guard>} />
        <Route path="/custom-item-requests" element={<Navigate to="/custom-items" replace />} />
        <Route path="/inventory" element={<Guard roles={['admin', 'member', 'procurement']}><Inventory /></Guard>} />
        <Route path="/stocks" element={<Navigate to="/inventory" replace />} />
        <Route path="/stats" element={<Navigate to="/inventory" replace />} />
        <Route path="/statistics" element={<Navigate to="/inventory" replace />} />

        <Route path="/grant-allocation" element={<Guard roles={['admin', 'procurement']}><GrantItems /></Guard>} />
        <Route path="/grant-allocation/:id" element={<Guard roles={['admin', 'procurement']}><GrantEventItems /></Guard>} />
        <Route path="/grant-items" element={<Navigate to="/grant-allocation" replace />} />
        <Route path="/grant-event-items/:id" element={<RedirectTo to="/grant-allocation/:id" />} />
        <Route path="/grant-history" element={<Guard roles={['admin', 'procurement']}><GrantLogs /></Guard>} />
        <Route path="/grant-logs" element={<Navigate to="/grant-history" replace />} />

        <Route path="/procurement" element={<Guard roles={['admin', 'procurement']}><Procurements /></Guard>} />
        <Route path="/procurements" element={<Navigate to="/procurement" replace />} />

        <Route path="/role-reports" element={<Guard roles={['admin']}><RolePdf /></Guard>} />

        <Route path="/edit-access" element={<Guard roles={['admin', 'member']}><EditAccess /></Guard>} />
        <Route path="/lab-confirmation" element={<Guard roles={['admin', 'member']}><LabConfirmation /></Guard>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
