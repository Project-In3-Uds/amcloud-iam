// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // Gardons AuthProvider pour l'enveloppement
import RegisterPage from './pages/RegisterPage'; // Seule page importée pour cette tâche

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AuthProvider> {/* Gardons le AuthProvider pour la cohérence future */}
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          {/* Redirection par défaut vers la page d'inscription pour cette tâche */}
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
