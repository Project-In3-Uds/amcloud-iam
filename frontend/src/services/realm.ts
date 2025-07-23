// src/services/realm.ts
import { protectedApi } from './api'; // Importe protectedApi

// Interface pour les données de requête de création/mise à jour de Realm
export interface RealmRequest {
  name: string;
  description?: string;
}

// Interface pour les données de réponse de Realm
export interface RealmResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Interface pour les données de réponse de Rôle
export interface RoleResponse {
  id: number;
  name: string;
  description: string;
  permissionNames: string[];
  realmId: number;
  realmName: string;
}

// Interface pour les données de requête de Rôle
export interface RoleRequest {
  name: string;
  description?: string;
  permissionNames?: string[];
  realmId?: number;
}

// Interface pour les données de réponse de Permission <-- NOUVEAU
export interface PermissionResponse {
  id: number;
  name: string;
  scopeValue: string;
  description: string;
  realmId: number;
  realmName: string;
}

// Interface pour les données de requête de Permission <-- NOUVEAU
export interface PermissionRequest {
  name: string;
  scopeValue: string;
  description?: string;
  realmId?: number;
}


/**
 * Récupère tous les Realms.
 * @returns {Promise<RealmResponse[]>} Une liste des Realms.
 */
export const getAllRealms = (): Promise<{ data: RealmResponse[] }> => {
  console.log('RealmService: getAllRealms called');
  return protectedApi.get('/v1/admin/realms');
};

/**
 * Crée un nouveau Realm.
 * @param {RealmRequest} realmData Les données du Realm à créer.
 * @returns {Promise<RealmResponse>} Le Realm créé.
 */
export const createRealm = (realmData: RealmRequest): Promise<{ data: RealmResponse }> => {
  console.log('RealmService: createRealm called', realmData);
  return protectedApi.post('/v1/admin/realms', realmData);
};

/**
 * Met à jour un Realm existant.
 * @param {number} id L'ID du Realm à mettre à jour.
 * @param {RealmRequest} realmData Les données à mettre à jour.
 * @returns {Promise<RealmResponse>} Le Realm mis à jour.
 */
export const updateRealm = (id: number, realmData: RealmRequest): Promise<{ data: RealmResponse }> => {
  console.log(`RealmService: updateRealm called for ID: ${id}`, realmData);
  return protectedApi.put(`/v1/admin/realms/${id}`, realmData);
};

/**
 * Supprime un Realm.
 * @param {number} id L'ID du Realm à supprimer.
 * @returns {Promise<void>}
 */
export const deleteRealm = (id: number): Promise<void> => {
  console.log(`RealmService: deleteRealm called for ID: ${id}`);
  return protectedApi.delete(`/v1/admin/realms/${id}`);
};
