// src/App.tsx
import React, { ReactNode } from 'react'; // Import ReactNode for children type
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import RoleManagementPage from './pages/RoleManagementPage';
import PermissionManagementPage from './pages/PermissionManagementPage';
import RealmManagementPage from './pages/RealmManagementPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Define interface for ProtectedRoute props
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  allowedScopes?: string[];
}

// Composant pour les routes protégées
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, allowedScopes }) => {
  const { user, loading, hasRole, hasPermission } = useAuth();

  if (loading) {
    return <div>Chargement de l'authentification...</div>; // Ou un spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some((role: string) => hasRole(role))) {
    return <div>Accès refusé. Vous n'avez pas les rôles nécessaires.</div>;
  }

  if (allowedScopes && !allowedScopes.some((scope: string) => hasPermission(scope))) {
    return <div>Accès refusé. Vous n'avez pas les permissions nécessaires.</div>;
  }

  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <UserManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/roles" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <RoleManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/permissions" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <PermissionManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/realms" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <RealmManagementPage />
          </ProtectedRoute>
        } />
        
        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
