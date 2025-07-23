// src/services/realmRole.ts
import { protectedApi } from './api';
import { RoleResponse, RoleRequest } from './realm'; // Importe RoleResponse et RoleRequest depuis realm.ts

/**
 * Récupère tous les rôles d'un Realm spécifique.
 * @param {number} realmId L'ID du Realm.
 * @returns {Promise<{ data: RoleResponse[] }>} Une liste des rôles.
 */
export const getAllRolesByRealm = (realmId: number): Promise<{ data: RoleResponse[] }> => {
  console.log(`RealmRoleService: getAllRolesByRealm called for Realm ID: ${realmId}`);
  return protectedApi.get(`/v1/admin/realms/${realmId}/roles`);
};

/**
 * Crée un nouveau rôle dans un Realm spécifique.
 * @param {number} realmId L'ID du Realm où créer le rôle.
 * @param {RoleRequest} roleData Les données du rôle à créer.
 * @returns {Promise<{ data: RoleResponse }>} Le rôle créé.
 */
export const createRoleInRealm = (realmId: number, roleData: RoleRequest): Promise<{ data: RoleResponse }> => {
  console.log(`RealmRoleService: createRoleInRealm called for Realm ID: ${realmId}`, roleData);
  return protectedApi.post(`/v1/admin/realms/${realmId}/roles`, { ...roleData, realmId });
};

/**
 * Met à jour un rôle existant dans un Realm spécifique.
 * @param {number} realmId L'ID du Realm du rôle.
 * @param {number} roleId L'ID du rôle à mettre à jour.
 * @param {RoleRequest} roleData Les données à mettre à jour.
 * @returns {Promise<{ data: RoleResponse }>} Le rôle mis à jour.
 */
export const updateRoleInRealm = (realmId: number, roleId: number, roleData: RoleRequest): Promise<{ data: RoleResponse }> => {
  console.log(`RealmRoleService: updateRoleInRealm called for Realm ID: ${realmId}, Role ID: ${roleId}`, roleData);
  return protectedApi.put(`/v1/admin/realms/${realmId}/roles/${roleId}`, { ...roleData, realmId });
};

/**
 * Supprime un rôle d'un Realm spécifique.
 * @param {number} realmId L'ID du Realm du rôle.
 * @param {number} roleId L'ID du rôle à supprimer.
 * @returns {Promise<void>}
 */
export const deleteRoleInRealm = (realmId: number, roleId: number): Promise<void> => {
  console.log(`RealmRoleService: deleteRoleInRealm called for Realm ID: ${realmId}, Role ID: ${roleId}`);
  return protectedApi.delete(`/v1/admin/realms/${realmId}/roles/${roleId}`);
};

/**
 * Récupère un rôle spécifique dans un Realm.
 * @param {number} realmId L'ID du Realm du rôle.
 * @param {number} roleId L'ID du rôle.
 * @returns {Promise<{ data: RoleResponse }>} Le rôle trouvé.
 */
export const getRoleInRealmById = (realmId: number, roleId: number): Promise<{ data: RoleResponse }> => {
  console.log(`RealmRoleService: getRoleInRealmById called for Realm ID: ${realmId}, Role ID: ${roleId}`);
  return protectedApi.get(`/v1/admin/realms/${realmId}/roles/${roleId}`);
};

/**
 * Attribue des permissions à un rôle dans un Realm spécifique.
 * @param {number} realmId L'ID du Realm du rôle.
 * @param {number} roleId L'ID du rôle.
 * @param {string[]} permissionNames Les noms des permissions à attribuer.
 * @returns {Promise<{ data: RoleResponse }>} Le rôle mis à jour avec les nouvelles permissions.
 */
export const assignPermissionsToRoleInRealm = (realmId: number, roleId: number, permissionNames: string[]): Promise<{ data: RoleResponse }> => {
  console.log(`RealmRoleService: assignPermissionsToRoleInRealm called for Realm ID: ${realmId}, Role ID: ${roleId}`, permissionNames);
  return protectedApi.post(`/v1/admin/realms/${realmId}/roles/${roleId}/assign-permissions`, { permissionNames });
};
