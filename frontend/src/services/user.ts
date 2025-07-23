// src/services/user.ts
import { protectedApi } from './api'; // Importe protectedApi

// Interface pour les données de réponse utilisateur (simplifiée)
export interface UserResponse { // Exportée pour être utilisée dans ProfilePage et RealmUser
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

// Interface pour les données de requête de mise à jour utilisateur
export interface UserUpdateRequest { // Exportée
  username?: string;
  email?: string;
  password?: string;
  status?: string; // <-- AJOUTÉ
  roles?: string[]; // <-- AJOUTÉ
}

/**
 * Récupère les informations d'un utilisateur par son ID.
 * @param {number} id L'ID de l'utilisateur.
 * @returns {Promise<UserResponse>} Les données de l'utilisateur.
 */
export const getUserById = (id: number): Promise<{ data: UserResponse }> => {
  console.log(`UserService: getUserById called for ID: ${id}`);
  // Utilise protectedApi pour les requêtes via la passerelle
  return protectedApi.get(`/v1/users/${id}`);
};

/**
 * Met à jour les informations d'un utilisateur par son ID.
 * @param {number} id L'ID de l'utilisateur à mettre à jour.
 * @param {UserUpdateRequest} userData Les données à mettre à jour.
 * @returns {Promise<UserResponse>} Les données de l'utilisateur mises à jour.
 */
export const updateUser = (id: number, userData: UserUpdateRequest): Promise<{ data: UserResponse }> => {
  console.log(`UserService: updateUser called for ID: ${id}`, userData);
  // Utilise protectedApi pour les requêtes via la passerelle
  return protectedApi.put(`/v1/users/${id}`, userData);
};

// Vous pouvez ajouter d'autres fonctions de service utilisateur ici si nécessaire
// export const createUser = (userData: any) => protectedApi.post('/v1/users', userData);
// export const deleteUser = (id: number) => protectedApi.delete(`/v1/users/${id}`);
