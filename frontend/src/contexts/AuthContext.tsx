// src/contexts/AuthContext.ts
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import * as authService from '../services/auth'; // Votre service d'authentification
import { setupAxiosInterceptors } from '../services/api'; // Importe la fonction de setup des intercepteurs Axios
import { useNotification } from './NotificationContext'; // Importe le hook de notification

// Définition des types pour le contexte d'authentification
interface UserInfo {
  id: number; // Nouveau champ pour l'ID de l'utilisateur
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
  const { showNotification } = useNotification(); // Utilise le hook de notification

  // Déclaration de la fonction logout avant son utilisation dans useEffect
  const logout = useCallback(async () => {
    setLoading(true); // Peut être utilisé pour montrer un spinner de déconnexion
    try {
      // Appelle le service de déconnexion backend qui invalidera le Refresh Token via HttpOnly cookie
      await authService.logout(); // Pas de paramètre refreshToken car il est dans le cookie
      showNotification('Déconnexion réussie !', 'success'); // Affiche une notification de succès
    } catch (error) {
      console.error('Échec de la déconnexion backend:', error);
      showNotification('Erreur lors de la déconnexion. Veuillez réessayer.', 'error'); // Affiche une notification d'erreur
    } finally {
      setAccessToken(null); // Nettoie l'Access Token en mémoire
      setUser(null); // Réinitialise l'état de l'utilisateur
      setLoading(false);
      // Rediriger vers la page de login après déconnexion
      // Utilise un petit délai pour permettre à la notification de s'afficher
      setTimeout(() => {
        window.location.href = '/login'; // Rechargera la page pour effacer tout état
      }, 500); // Délai de 500ms
    }
  }, [showNotification]); // Dépend de showNotification

  // Fonction pour obtenir l'Access Token actuel, également déclarée tôt
  const getAccessToken = useCallback(() => {
    return accessToken;
  }, [accessToken]); // Dépend d'accessToken

  // Initialisation des intercepteurs Axios une seule fois
  useEffect(() => {
    // Passe les fonctions de récupération de token et de déconnexion à Axios
    // S'assure que ces fonctions ne sont configurées qu'une fois que l'état de chargement initial est terminé
    if (!loading) { 
      setupAxiosInterceptors(getAccessToken, logout, setAccessToken); // Utilise les fonctions déclarées ci-dessus
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
      const { accessToken: newAccessToken, userId } = response.data; // Récupère userId

      setAccessToken(newAccessToken); // Stocke l'Access Token en mémoire

      const decodedToken: any = jwtDecode(newAccessToken);
      const roles = Array.isArray(decodedToken.roles) ? decodedToken.roles : []; 
      setUser({
        id: userId, // Stocke l'ID de l'utilisateur
        username: decodedToken.sub,
        roles: roles,
        scopes: roles.flatMap((role: string) => {
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
