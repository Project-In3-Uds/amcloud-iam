// src/App.tsx
import React, { useEffect, ReactNode } from 'react'; // Import ReactNode
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'; // Import Outlet
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { setupAxiosInterceptors } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardHomeContent from './pages/DashboardHomeContent'; // Renamed DashboardPage
import RealmManagementPage from './pages/RealmManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import RoleManagementPage from './pages/RoleManagementPage';
import PermissionManagementPage from './pages/PermissionManagementPage';
import DashboardLayout from './layouts/DashboardLayout'; // Import DashboardLayout

// Define interface for ProtectedRoute props
interface ProtectedRouteProps {
  children: ReactNode; // Can be any renderable React content
  allowedRoles?: string[];
  allowedScopes?: string[];
}

// Composant pour les routes protégées
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, allowedScopes }) => {
  const { user, loading, hasRole, hasPermission } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some((role: string) => hasRole(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800 text-xl font-bold">
        Access Denied. You do not have the necessary roles.
      </div>
    );
  }

  if (allowedScopes && !allowedScopes.some((scope: string) => hasPermission(scope))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800 text-xl font-bold">
        Access Denied. You do not have the necessary permissions.
      </div>
    );
  }

  return <>{children}</>; // Ensure children is wrapped if it could be a fragment
};

// New component for the loading overlay
const LoadingOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-50">
    <p className="text-lg font-semibold text-gray-700">Loading application...</p>
  </div>
);

function App() {
  const { user, loading, getAccessToken, logout, setAccessToken } = useAuth();

  useEffect(() => {
    if (!loading) {
      setupAxiosInterceptors(getAccessToken, logout, setAccessToken);
    }
  }, [loading, getAccessToken, logout, setAccessToken]);

  return (
    <div className="min-h-screen bg-gray-100">
      <NotificationProvider>
        {loading && <LoadingOverlay />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Default route: redirects to dashboard if logged in, otherwise to login page */}
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

          {/* Protected routes using DashboardLayout as the main layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout /> {/* DashboardLayout is now the parent route element */}
              </ProtectedRoute>
            }
          >
            {/* Nested routes for the content area of the dashboard */}
            <Route index element={<DashboardHomeContent />} /> {/* Default content for /dashboard */}

            {/* Admin management routes */}
            <Route path="realms" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <RealmManagementPage />
              </ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="roles" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <RoleManagementPage />
              </ProtectedRoute>
            } />
            <Route path="permissions" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <PermissionManagementPage />
              </ProtectedRoute>
            } />
            {/* Add other admin routes here (clients, groups, etc.) if necessary */}
            <Route path="clients" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Client Management (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="client-scopes" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Client Scopes Management (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="identity-providers" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Identity Providers Management (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="user-federation" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">User Federation (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="authentication" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Authentication Settings (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="groups" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Group Management (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="sessions" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Session Management (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="events" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Event Management (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="import" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Import (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="export" element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Export (Placeholder)</h2>
                  <p>This page is under development.</p>
                </div>
              </ProtectedRoute>
            } />
          </Route>

          {/* All other undefined routes redirect to the home page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </div>
  );
}

export default App;
