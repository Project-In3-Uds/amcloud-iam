// src/services/realmUser.ts
import { protectedApi } from './api';
import { UserResponse } from './user'; // Importe UserResponse depuis user.ts
// UserUpdateRequest est déjà exporté depuis user.ts, donc pas besoin de le redéfinir ici
import { UserUpdateRequest } from './user';


// Interface pour les données de requête de création d'utilisateur dans un Realm
export interface RealmUserCreateRequest {
  username: string;
  email: string;
  password?: string; // Optionnel pour la création par admin si un mot de passe temporaire est généré
  status?: string; // ACTIVE, PENDING_VERIFICATION, DISABLED
  roles?: string[]; // Noms des rôles à assigner
  realmId: number; // L'ID du Realm est maintenant requis pour la création
}

// Interface pour les données de requête de mise à jour d'utilisateur dans un Realm
// Réutilise UserUpdateRequest mais assure que realmId n'est pas modifiable via cette API
export interface RealmUserUpdateRequest extends UserUpdateRequest {
  // realmId ne devrait pas être modifiable via cette API, il est implicite par le chemin
}

/**
 * Récupère tous les utilisateurs d'un Realm spécifique.
 * @param {number} realmId L'ID du Realm.
 * @returns {Promise<{ data: UserResponse[] }>} Une liste des utilisateurs.
 */
export const getAllUsersByRealm = (realmId: number): Promise<{ data: UserResponse[] }> => {
  console.log(`RealmUserService: getAllUsersByRealm called for Realm ID: ${realmId}`);
  return protectedApi.get(`/v1/admin/realms/${realmId}/users`);
};

/**
 * Crée un nouvel utilisateur dans un Realm spécifique.
 * @param {number} realmId L'ID du Realm où créer l'utilisateur.
 * @param {RealmUserCreateRequest} userData Les données de l'utilisateur à créer.
 * @returns {Promise<{ data: UserResponse }>} L'utilisateur créé.
 */
export const createUserInRealm = (realmId: number, userData: RealmUserCreateRequest): Promise<{ data: UserResponse }> => {
  console.log(`RealmUserService: createUserInRealm called for Realm ID: ${realmId}`, userData);
  return protectedApi.post(`/v1/admin/realms/${realmId}/users`, { ...userData, realmId }); // Assure que realmId est dans le body
};

/**
 * Met à jour un utilisateur existant dans un Realm spécifique.
 * @param {number} realmId L'ID du Realm de l'utilisateur.
 * @param {number} userId L'ID de l'utilisateur à mettre à jour.
 * @param {RealmUserUpdateRequest} userData Les données à mettre à jour.
 * @returns {Promise<{ data: UserResponse }>} L'utilisateur mis à jour.
 */
export const updateUserInRealm = (realmId: number, userId: number, userData: RealmUserUpdateRequest): Promise<{ data: UserResponse }> => {
  console.log(`RealmUserService: updateUserInRealm called for Realm ID: ${realmId}, User ID: ${userId}`, userData);
  return protectedApi.put(`/v1/admin/realms/${realmId}/users/${userId}`, { ...userData, realmId }); // Assure que realmId est dans le body
};

/**
 * Supprime un utilisateur d'un Realm spécifique.
 * @param {number} realmId L'ID du Realm de l'utilisateur.
 * @param {number} userId L'ID de l'utilisateur à supprimer.
 * @returns {Promise<void>}
 */
export const deleteUserInRealm = (realmId: number, userId: number): Promise<void> => {
  console.log(`RealmUserService: deleteUserInRealm called for Realm ID: ${realmId}, User ID: ${userId}`);
  return protectedApi.delete(`/v1/admin/realms/${realmId}/users/${userId}`);
};

/**
 * Récupère un utilisateur spécifique dans un Realm.
 * @param {number} realmId L'ID du Realm de l'utilisateur.
 * @param {number} userId L'ID de l'utilisateur.
 * @returns {Promise<{ data: UserResponse }>} L'utilisateur trouvé.
 */
export const getUserInRealmById = (realmId: number, userId: number): Promise<{ data: UserResponse }> => {
  console.log(`RealmUserService: getUserInRealmById called for Realm ID: ${realmId}, User ID: ${userId}`);
  return protectedApi.get(`/v1/admin/realms/${realmId}/users/${userId}`);
};

/**
 * Attribue des rôles à un utilisateur dans un Realm spécifique.
 * @param {number} realmId L'ID du Realm de l'utilisateur.
 * @param {number} userId L'ID de l'utilisateur.
 * @param {string[]} roleNames Les noms des rôles à attribuer.
 * @returns {Promise<{ data: UserResponse }>} L'utilisateur mis à jour avec les nouveaux rôles.
 */
export const assignRolesToUserInRealm = (realmId: number, userId: number, roleNames: string[]): Promise<{ data: UserResponse }> => {
  console.log(`RealmUserService: assignRolesToUserInRealm called for Realm ID: ${realmId}, User ID: ${userId}`, roleNames);
  return protectedApi.post(`/v1/admin/realms/${realmId}/users/${userId}/assign-roles`, { roleNames });
};
