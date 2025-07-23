// src/services/auth.ts
import { publicApi } from './api'; // Importe publicApi

// Interface pour les données d'inscription, basée sur votre DTO RegisterRequest Java
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Interface pour la requête de réinitialisation de mot de passe
interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const login = (username: string, password: string) => {
  console.log('AuthService: login called', { username, password });
  // Utilise publicApi pour la connexion directe à l'IAM
  return publicApi.post('/v1/auth/login', { username, password });
};

export const register = (userData: RegisterRequest) => {
  console.log('AuthService: register called', userData);
  // Utilise publicApi pour l'inscription directe à l'IAM
  return publicApi.post('/v1/auth/register', userData);
};

/**
 * Appelle l'API de renouvellement de token. Le Refresh Token est envoyé automatiquement via le cookie HttpOnly.
 * @returns {Promise<any>} La réponse de l'API contenant le nouvel Access Token.
 */
export const refreshToken = () => {
  console.log('AuthService: refreshToken called (relying on HttpOnly cookie)');
  // Utilise publicApi pour le renouvellement direct à l'IAM
  return publicApi.post('/v1/auth/refresh-token');
};

/**
 * Déconnecte l'utilisateur en demandant au backend d'invalider le Refresh Token.
 * Le Refresh Token est envoyé automatiquement via le cookie HttpOnly.
 * @returns {Promise<any>} La réponse de l'API de déconnexion.
 */
export const logout = () => {
  console.log('AuthService: logout called (relying on HttpOnly cookie)');
  // Utilise publicApi pour la déconnexion directe à l'IAM
  return publicApi.post('/v1/auth/logout');
};

/**
 * Demande un token de réinitialisation de mot de passe pour l'e-mail donné.
 * @param {string} email L'adresse e-mail de l'utilisateur.
 * @returns {Promise<any>} La réponse de l'API.
 */
export const forgotPassword = (email: string) => {
  console.log('AuthService: forgotPassword called', { email });
  // Utilise publicApi pour la demande de mot de passe oublié directe à l'IAM
  return publicApi.post('/v1/auth/forgot-password', { email });
};

/**
 * Réinitialise le mot de passe de l'utilisateur avec le token et le nouveau mot de passe.
 * @param {string} token Le token de réinitialisation de mot de passe.
 * @param {string} newPassword Le nouveau mot de passe.
 * @param {string} confirmNewPassword La confirmation du nouveau mot de passe.
 * @returns {Promise<any>} La réponse de l'API.
 */
export const resetPassword = (token: string, newPassword: string, confirmNewPassword: string) => {
  console.log('AuthService: resetPassword called', { token, newPassword, confirmNewPassword });
  const requestBody: ResetPasswordRequest = { token, newPassword, confirmNewPassword };
  // Utilise publicApi pour la réinitialisation de mot de passe directe à l'IAM
  return publicApi.post('/v1/auth/reset-password', requestBody);
};

/**
 * Vérifie l'e-mail de l'utilisateur avec un token.
 * @param {string} token Le token de vérification d'e-mail.
 * @returns {Promise<any>} La réponse de l'API.
 */
export const verifyEmail = (token: string) => {
  console.log('AuthService: verifyEmail called', { token });
  // Utilise publicApi pour la vérification d'e-mail directe à l'IAM
  return publicApi.get(`/v1/auth/verify-email?token=${token}`);
};
