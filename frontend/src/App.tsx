// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom'; // Importe Routes, Route, Navigate, Link
import { useAuth } from './contexts/AuthContext'; // Importe useAuth
import { setupAxiosInterceptors } from './services/api'; // Importe la fonction de setup des intercepteurs Axios

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/ProfilePage'; // Nouvelle importation
// Les autres pages sont temporairement non importées pour se concentrer sur la tâche actuelle
// import DashboardPage from './pages/DashboardPage';
// import UserManagementPage from './pages/UserManagementPage';
// import RoleManagementPage from './pages/RoleManagementPage';
// import PermissionManagementPage from './pages/PermissionManagementPage';
// import RealmManagementPage from './pages/RealmManagementPage';


// Composant pour les routes protégées (simplifié pour cette tâche, sera développé plus tard)
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[]; allowedScopes?: string[] }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement de l'authentification...</div>; 
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
  // Récupère getAccessToken, logout ET setAccessToken de useAuth
  const { user, loading, getAccessToken, logout, setAccessToken } = useAuth(); 

  // Configure les intercepteurs Axios une fois que le AuthContext est prêt
  useEffect(() => {
    if (!loading) { // S'assure que AuthContext a terminé son chargement initial
      setupAxiosInterceptors(getAccessToken, logout, setAccessToken); // Passe setAccessToken
    }
  }, [loading, getAccessToken, logout, setAccessToken]); // Dépendances pour re-exécuter si ces fonctions/état changent

  return (
    <div className="min-h-screen bg-gray-100">
      {loading && <LoadingOverlay />} 
      <Routes> {/* Les Routes sont maintenant directement dans App, car Router est dans index.tsx */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={
          <RegisterPage />
        } />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        
        {/* Nouvelle route pour la page de profil */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Tableau de Bord (Placeholder)</h2>
                <p>Bienvenue, {user?.username} !</p>
                <Link to="/profile" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Voir mon profil</Link> {/* Ajout d'un lien vers le profil */}
                <button onClick={() => {
                  logout(); // Utilise la fonction de déconnexion du contexte
                }} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Déconnexion</button>
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
