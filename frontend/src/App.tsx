// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { setupAxiosInterceptors } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/ProfilePage';
import RealmManagementPage from './pages/RealmManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import RoleManagementPage from './pages/RoleManagementPage'; // Nouvelle importation
import PermissionManagementPage from './pages/PermissionManagementPage'; // Nouvelle importation

// Composant pour les routes protégées
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[]; allowedScopes?: string[] }> = ({ children, allowedRoles, allowedScopes }) => {
  const { user, loading, hasRole, hasPermission } = useAuth();

  if (loading) {
    return <div>Chargement de l'authentification...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800 text-xl font-bold">
        Accès refusé. Vous n'avez pas les rôles nécessaires.
      </div>
    );
  }

  if (allowedScopes && !allowedScopes.some(scope => hasPermission(scope))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800 text-xl font-bold">
        Accès refusé. Vous n'avez pas les permissions nécessaires.
      </div>
    );
  }

  return <>{children}</>;
};

// Nouveau composant pour l'overlay de chargement
const LoadingOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-50">
    <p className="text-lg font-semibold text-gray-700">Chargement de l'application...</p>
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

          {/* Routes protégées */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/admin/realms" element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <RealmManagementPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          } />

          {/* NOUVELLE ROUTE */}
          <Route path="/admin/roles" element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <RoleManagementPage />
            </ProtectedRoute>
          } />

          {/* NOUVELLE ROUTE */}
          <Route path="/admin/permissions" element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <PermissionManagementPage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
                  <h2 className="text-3xl font-extrabold text-gray-900">Tableau de Bord (Placeholder)</h2>
                  <p>Bienvenue, {user?.username} !</p>
                  <div className="mt-4 flex flex-col space-y-2">
                    <Link to="/profile" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Voir mon profil</Link>
                    {user?.roles.includes('ROLE_ADMIN') && (
                      <>
                        <Link to="/admin/realms" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">Gérer les Realms</Link>
                        <Link to="/admin/users" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Gérer les Utilisateurs</Link>
                        <Link to="/admin/roles" className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Gérer les Rôles</Link> {/* <-- NOUVEAU LIEN */}
                        <Link to="/admin/permissions" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">Gérer les Permissions</Link> {/* <-- NOUVEAU LIEN */}
                      </>
                    )}
                    <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Déconnexion</button>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } />

          <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </NotificationProvider>
    </div>
  );
}

export default App;
