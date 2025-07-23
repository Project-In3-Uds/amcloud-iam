// src/services/user.ts
import { protectedApi } from './api'; // Importe protectedApi

// Interface pour les données de réponse utilisateur (simplifiée)
interface UserResponse {
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

// Vous pouvez ajouter d'autres fonctions de service utilisateur ici si nécessaire
// export const createUser = (userData: any) => protectedApi.post('/v1/users', userData);
// export const updateUser = (id: number, userData: any) => protectedApi.put(`/v1/users/${id}`, userData);
// export const deleteUser = (id: number) => protectedApi.delete(`/v1/users/${id}`);
