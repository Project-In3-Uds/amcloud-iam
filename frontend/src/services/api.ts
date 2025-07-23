// src/services/api.ts
import axios from 'axios';
import * as authService from './auth'; // Importe le service d'authentification

// URL de base pour TOUTES les requêtes API (via la passerelle)
const API_BASE_URL = 'http://localhost:8080'; // <-- TOUTES les requêtes passent par la passerelle

// Instance Axios pour les requêtes publiques (login, register, forgot-password, reset-password, verify-email, refresh-token, logout)
// Cette instance n'aura pas l'intercepteur JWT par défaut, mais elle pointera vers la passerelle.
export const publicApi = axios.create({
  baseURL: API_BASE_URL, // <-- Pointe vers la passerelle
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important pour envoyer et recevoir des cookies (y compris HttpOnly)
});

// Instance Axios pour les requêtes protégées (via la passerelle, nécessitent un JWT)
// Cette instance aura l'intercepteur JWT.
export const protectedApi = axios.create({
  baseURL: API_BASE_URL, // <-- Pointe vers la passerelle
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important pour envoyer et recevoir des cookies (y compris HttpOnly)
});

let getAccessTokenFn: () => string | null = () => null; // Fonction pour récupérer l'Access Token (initialisée à null)
let logoutFn: () => void = () => {}; // Fonction pour déclencher la déconnexion (initialisée à une fonction vide)
let setAccessTokenFn: (token: string | null) => void = () => {}; // Fonction pour définir l'Access Token (initialisée à une fonction vide)

/**
 * Configure les intercepteurs Axios pour l'ajout du JWT et la gestion du renouvellement.
 * Cette fonction configure spécifiquement l'instance `protectedApi`.
 * Elle doit être appelée une fois au démarrage de l'application,
 * après que le AuthContext soit disponible.
 *
 * @param {() => string | null} tokenGetter Fonction qui retourne l'Access Token actuel.
 * @param {() => void} logoutHandler Fonction qui déclenche le processus de déconnexion.
 * @param {(token: string | null) => void} accessTokenSetter Fonction qui met à jour l'Access Token en mémoire.
 */
export const setupAxiosInterceptors = (tokenGetter: () => string | null, logoutHandler: () => void, accessTokenSetter: (token: string | null) => void) => {
  getAccessTokenFn = tokenGetter;
  logoutFn = logoutHandler;
  setAccessTokenFn = accessTokenSetter;

  // Intercepteur de requêtes: Ajoute l'Access Token à CHAQUE requête de protectedApi
  protectedApi.interceptors.request.use(
    (config) => {
      const token = getAccessTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponses: Gère les erreurs 401 pour le renouvellement du token sur protectedApi
  protectedApi.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Si l'erreur est 401 et que ce n'est pas la requête de renouvellement elle-même
      // et que l'originalRequest n'a pas déjà été retentée
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Marque la requête comme ayant été retentée

        console.warn('Access Token expiré ou invalide, tentative de renouvellement...');
        
        try {
          // La requête de rafraîchissement va directement au service IAM (publicApi)
          // MAIS publicApi pointe maintenant vers la passerelle, donc c'est correct.
          const refreshResponse = await publicApi.post('/v1/auth/refresh-token');
          const newAccessToken = refreshResponse.data.accessToken;

          setAccessTokenFn(newAccessToken); // Met à jour l'Access Token en mémoire

          // Re-tente la requête originale avec le nouvel Access Token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return protectedApi(originalRequest); // Utilise protectedApi pour re-tenter

        } catch (refreshError) {
          console.error('Échec du renouvellement du token, déconnexion de l\'utilisateur.', refreshError);
          logoutFn(); // Déconnecte l'utilisateur si le renouvellement échoue
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
};

// Pas d'export default pour l'instance 'api' générique, car nous avons maintenant publicApi et protectedApi
