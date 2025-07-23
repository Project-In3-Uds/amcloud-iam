// src/services/api.js
import axios from 'axios';
import * as authService from './auth'; // Importe le service d'authentification

const API_BASE_URL = 'http://localhost:8081'; // URL de base de votre backend IAM

const api = axios.create({
  baseURL: API_BASE_URL,
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
 * Cette fonction doit être appelée une fois au démarrage de l'application,
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

  // Intercepteur de requêtes: Ajoute l'Access Token à chaque requête
  api.interceptors.request.use(
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

  // Intercepteur de réponses: Gère les erreurs 401 pour le renouvellement du token
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Si l'erreur est 401 et que ce n'est pas la requête de renouvellement elle-même
      // et que l'originalRequest n'a pas déjà été retentée
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Marque la requête comme ayant été retentée

        console.warn('Access Token expiré ou invalide, tentative de renouvellement...');
        
        try {
          // Appelle l'API de renouvellement de token.
          // Le Refresh Token est envoyé automatiquement via le cookie HttpOnly.
          const refreshResponse = await authService.refreshToken();
          const newAccessToken = refreshResponse.data.accessToken;

          setAccessTokenFn(newAccessToken); // Met à jour l'Access Token en mémoire

          // Re-tente la requête originale avec le nouvel Access Token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);

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

export default api; // Exporte l'instance Axios configurée
