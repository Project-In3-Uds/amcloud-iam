// src/contexts/AuthContext.ts
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import * as authService from '../services/auth'; // Votre service d'authentification
import { setupAxiosInterceptors } from '../services/api'; // Importe la fonction de setup des intercepteurs Axios

// Définition des types pour le contexte d'authentification
interface UserInfo {
  username: string;
  roles: string[];
  scopes: string[];
  iat?: number;
  exp?: number;
  iss?: string;
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (scope: string) => boolean;
  getAccessToken: () => string | null; // Fonction pour obtenir l'Access Token
  setAccessToken: (token: string | null) => void; // Nouvelle fonction pour définir l'Access Token
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null); // Access Token en mémoire

  // Déclaration de la fonction logout avant son utilisation dans useEffect
  const logout = useCallback(async () => {
    setLoading(true); // Peut être utilisé pour montrer un spinner de déconnexion
    try {
      // Appelle le service de déconnexion backend qui invalidera le Refresh Token via HttpOnly cookie
      await authService.logout(); // Pas de paramètre refreshToken car il est dans le cookie
    } catch (error) {
      console.error('Échec de la déconnexion backend:', error);
    } finally {
      setAccessToken(null); // Nettoie l'Access Token en mémoire
      setUser(null); // Réinitialise l'état de l'utilisateur
      setLoading(false);
      // Rediriger vers la page de login après déconnexion
      window.location.href = '/login'; // Rechargera la page pour effacer tout état
    }
  }, []);

  // Fonction pour obtenir l'Access Token actuel, également déclarée tôt
  const getAccessToken = useCallback(() => {
    return accessToken;
  }, [accessToken]); // Dépend d'accessToken

  // Initialisation des intercepteurs Axios une seule fois
  useEffect(() => {
    // Passe les fonctions de récupération de token et de déconnexion à Axios
    // S'assure que ces fonctions ne sont configurées qu'une fois que l'état de chargement initial est terminé
    if (!loading) { 
      setupAxiosInterceptors(getAccessToken, logout, setAccessToken); // Passe setAccessToken
    }
  }, [loading, getAccessToken, logout, setAccessToken]); // Dépendances pour re-exécuter si ces fonctions/état changent

  // Charge l'utilisateur au démarrage (si un Access Token est déjà en mémoire ou si on le récupère d'une autre source)
  useEffect(() => {
    // Au démarrage, si un Access Token est en mémoire (ex: après une connexion réussie sans rechargement complet),
    // ou si on peut en obtenir un via un Refresh Token HttpOnly, on le charge.
    // Pour l'instant, on simule un chargement rapide car l'Access Token n'est pas persistant au rechargement.
    // La persistance viendra avec le renouvellement via Refresh Token.
    setLoading(false);
  }, []);

  // Implémentation de la fonction de connexion
  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);
      // Le backend ne doit plus renvoyer refreshToken dans le corps ici, il doit le définir comme HttpOnly cookie
      const { accessToken: newAccessToken } = response.data; 

      setAccessToken(newAccessToken); // Stocke l'Access Token en mémoire

      const decodedToken: any = jwtDecode(newAccessToken);
      setUser({
        username: decodedToken.sub,
        roles: decodedToken.roles || [],
        scopes: decodedToken.roles.flatMap((role: string) => {
          // Ceci est un placeholder. En réalité, les scopes devraient venir du token ou d'un service.
          // Pour l'exemple, on associe des scopes basiques aux rôles.
          if (role === 'ROLE_ADMIN') return ['read', 'write', 'delete', 'admin'];
          if (role === 'ROLE_USER') return ['read'];
          return [];
        }),
        iat: decodedToken.iat,
        exp: decodedToken.exp,
        iss: decodedToken.iss,
      });
      return true;
    } catch (error) {
      console.error('Échec de la connexion dans AuthContext:', error);
      setAccessToken(null);
      setUser(null);
      throw error;
    }
  };

  // Fonctions de vérification des rôles et permissions
  const hasRole = (role: string) => {
    return user?.roles.includes(role) || false;
  };

  const hasPermission = (scope: string) => {
    return user?.scopes.includes(scope) || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasPermission, getAccessToken, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context as AuthContextType;
};
