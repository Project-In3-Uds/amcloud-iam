// src/services/realmPermission.ts
import { protectedApi } from './api';
import { PermissionResponse, PermissionRequest } from './realm'; // Importe les interfaces depuis realm.ts

/**
 * Récupère toutes les permissions d'un Realm spécifique.
 * @param {number} realmId L'ID du Realm.
 * @returns {Promise<{ data: PermissionResponse[] }>} Une liste des permissions.
 */
export const getAllPermissionsByRealm = (realmId: number): Promise<{ data: PermissionResponse[] }> => {
  console.log(`RealmPermissionService: getAllPermissionsByRealm called for Realm ID: ${realmId}`);
  return protectedApi.get(`/v1/admin/realms/${realmId}/permissions`);
};

/**
 * Crée une nouvelle permission dans un Realm spécifique.
 * @param {number} realmId L'ID du Realm où créer la permission.
 * @param {PermissionRequest} permissionData Les données de la permission à créer.
 * @returns {Promise<{ data: PermissionResponse }>} La permission créée.
 */
export const createPermissionInRealm = (realmId: number, permissionData: PermissionRequest): Promise<{ data: PermissionResponse }> => {
  console.log(`RealmPermissionService: createPermissionInRealm called for Realm ID: ${realmId}`, permissionData);
  return protectedApi.post(`/v1/admin/realms/${realmId}/permissions`, { ...permissionData, realmId });
};

/**
 * Met à jour une permission existante dans un Realm spécifique.
 * @param {number} realmId L'ID du Realm de la permission.
 * @param {number} permissionId L'ID de la permission à mettre à jour.
 * @param {PermissionRequest} permissionData Les données à mettre à jour.
 * @returns {Promise<{ data: PermissionResponse }>} La permission mise à jour.
 */
export const updatePermissionInRealm = (realmId: number, permissionId: number, permissionData: PermissionRequest): Promise<{ data: PermissionResponse }> => {
  console.log(`RealmPermissionService: updatePermissionInRealm called for Realm ID: ${realmId}, Permission ID: ${permissionId}`, permissionData);
  return protectedApi.put(`/v1/admin/realms/${realmId}/permissions/${permissionId}`, { ...permissionData, realmId });
};

/**
 * Supprime une permission d'un Realm spécifique.
 * @param {number} realmId L'ID du Realm de la permission.
 * @param {number} permissionId L'ID de la permission à supprimer.
 * @returns {Promise<void>}
 */
export const deletePermissionInRealm = (realmId: number, permissionId: number): Promise<void> => {
  console.log(`RealmPermissionService: deletePermissionInRealm called for Realm ID: ${realmId}, Permission ID: ${permissionId}`);
  return protectedApi.delete(`/v1/admin/realms/${realmId}/permissions/${permissionId}`);
};

/**
 * Récupère une permission spécifique dans un Realm.
 * @param {number} realmId L'ID du Realm de la permission.
 * @param {number} permissionId L'ID de la permission.
 * @returns {Promise<{ data: PermissionResponse }>} La permission trouvée.
 */
export const getPermissionInRealmById = (realmId: number, permissionId: number): Promise<{ data: PermissionResponse }> => {
  console.log(`RealmPermissionService: getPermissionInRealmById called for Realm ID: ${realmId}, Permission ID: ${permissionId}`);
  return protectedApi.get(`/v1/admin/realms/${realmId}/permissions/${permissionId}`);
};
