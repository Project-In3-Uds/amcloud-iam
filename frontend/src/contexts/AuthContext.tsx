// src/contexts/AuthContext.ts
import React, { createContext, useContext, useState, useEffect } from 'react';
// import { jwtDecode } from 'jwt-decode'; // Non nécessaire pour la tâche actuelle d'inscription

// Définition des types pour le contexte d'authentification
// Ces propriétés sont nécessaires pour satisfaire les types utilisés par RegisterPage et App.tsx
interface AuthContextType {
  user: { username: string; roles: string[]; scopes: string[] } | null;
  loading: boolean;
  // Fonctions de placeholder minimales pour éviter les erreurs de type
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (scope: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // L'état 'user' est nécessaire car RegisterPage l'utilise pour la redirection
  const [user, setUser] = useState<{ username: string; roles: string[]; scopes: string[] } | null>(null);
  // L'état 'loading' est également utilisé pour la logique de chargement
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pour l'instant, simule un chargement rapide et un utilisateur non connecté
    // La logique réelle de chargement de l'utilisateur sera implémentée plus tard
    setLoading(false);
    setUser(null); // S'assurer que l'utilisateur est null par défaut pour l'inscription
  }, []);

  // Fonctions de placeholder minimales pour satisfaire l'interface AuthContextType
  const login = async (username: string, password: string) => {
    console.log('AuthContext: login non implémenté pour cette tâche.');
    return false;
  };

  const logout = async () => {
    console.log('AuthContext: logout non implémenté pour cette tâche.');
  };

  const hasRole = (role: string) => {
    console.log('AuthContext: hasRole non implémenté pour cette tâche.');
    return false;
  };

  const hasPermission = (scope: string) => {
    console.log('AuthContext: hasPermission non implémenté pour cette tâche.');
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
