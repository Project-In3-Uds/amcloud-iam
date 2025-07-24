// src/services/user.ts
import { protectedApi } from './api'; // Importe protectedApi

// Interface pour les données de réponse utilisateur
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  status: string;
  enabled: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

// Interface pour les données de requête de création utilisateur
export interface UserCreateRequest {
  username: string;
  email: string;
  password?: string; // Le mot de passe peut être optionnel si défini plus tard ou par l'administrateur
  status?: string;
  roles?: string[];
  permissions?: string[];
}

// Interface pour les données de requête de mise à jour utilisateur
export interface UserUpdateRequest {
  username?: string;
  email?: string;
  password?: string;
  status?: string;
  roles?: string[];
  permissions?: string[];
}

/**
 * Récupère tous les utilisateurs depuis le backend.
 * @returns {Promise<{ data: UserResponse[] }>} Les données de tous les utilisateurs.
 */
export const getAllUsers = (): Promise<{ data: UserResponse[] }> => {
  console.log('UserService: getAllUsers called');
  return protectedApi.get('/v1/users');
};

/**
 * Récupère les informations d'un utilisateur par son ID.
 * @param {number} id L'ID de l'utilisateur.
 * @returns {Promise<{ data: UserResponse }>} Les données de l'utilisateur.
 */
export const getUserById = (id: number): Promise<{ data: UserResponse }> => {
  console.log(`UserService: getUserById called for ID: ${id}`);
  return protectedApi.get(`/v1/users/${id}`);
};

/**
 * Crée un nouvel utilisateur.
 * @param {UserCreateRequest} userData Les données du nouvel utilisateur.
 * @returns {Promise<{ data: UserResponse }>} Les données de l'utilisateur créé.
 */
export const createUser = (userData: UserCreateRequest): Promise<{ data: UserResponse }> => {
  console.log('UserService: createUser called', userData);
  return protectedApi.post('/v1/users', userData);
};

/**
 * Met à jour les informations d'un utilisateur par son ID.
 * @param {number} id L'ID de l'utilisateur à mettre à jour.
 * @param {UserUpdateRequest} userData Les données à mettre à jour.
 * @returns {Promise<{ data: UserResponse }>} Les données de l'utilisateur mises à jour.
 */
export const updateUser = (id: number, userData: UserUpdateRequest): Promise<{ data: UserResponse }> => {
  console.log(`UserService: updateUser called for ID: ${id}`, userData);
  return protectedApi.put(`/v1/users/${id}`, userData);
};

/**
 * Supprime un utilisateur par son ID.
 * @param {number} id L'ID de l'utilisateur à supprimer.
 * @returns {Promise<any>} Une promesse qui se résout lorsque la suppression est réussie.
 */
export const deleteUser = (id: number): Promise<any> => {
  console.log(`UserService: deleteUser called for ID: ${id}`);
  return protectedApi.delete(`/v1/users/${id}`);
};
