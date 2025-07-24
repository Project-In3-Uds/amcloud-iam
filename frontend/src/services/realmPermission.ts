// src/services/realmPermission.ts
import { protectedApi } from './api';

// Interface for Permission data received in responses
export interface PermissionResponse {
  id: number;
  name: string;
  description: string;
  scopeValue: string; // e.g., "profile", "email"
  realmId: number; // Added based on updated backend entities/schema
  createdAt: string;
  updatedAt: string;
}

// Interface for Permission data used in requests (create/update)
export interface PermissionRequest {
  name: string;
  description: string;
  scopeValue: string;
  realmId: number; // Realm ID is required for creation/update within a specific realm
}

/**
 * Retrieves all permissions for a specific realm.
 * @param realmId The ID of the realm.
 * @returns A Promise resolving to an array of PermissionResponse.
 */
export const getAllPermissionsByRealm = (realmId: number) => {
  console.log(`RealmPermissionService: getAllPermissionsByRealm called for realm ID: ${realmId}`);
  return protectedApi.get<PermissionResponse[]>(`/v1/admin/realms/${realmId}/permissions`);
};

/**
 * Creates a new permission within a specific realm.
 * @param realmId The ID of the realm where the permission will be created.
 * @param permissionData The data for the new permission.
 * @returns A Promise resolving to the created PermissionResponse.
 */
export const createPermissionInRealm = (realmId: number, permissionData: PermissionRequest) => {
  console.log(`RealmPermissionService: createPermissionInRealm called for realm ID: ${realmId}`, permissionData);
  return protectedApi.post<PermissionResponse>(`/v1/admin/realms/${realmId}/permissions`, permissionData);
};

/**
 * Updates an existing permission within a specific realm.
 * @param realmId The ID of the realm where the permission exists.
 * @param permissionId The ID of the permission to update.
 * @param permissionData The updated data for the permission.
 * @returns A Promise resolving to the updated PermissionResponse.
 */
export const updatePermissionInRealm = (realmId: number, permissionId: number, permissionData: PermissionRequest) => {
  console.log(`RealmPermissionService: updatePermissionInRealm called for realm ID: ${realmId}, permission ID: ${permissionId}`, permissionData);
  return protectedApi.put<PermissionResponse>(`/v1/admin/realms/${realmId}/permissions/${permissionId}`, permissionData);
};

/**
 * Deletes a permission from a specific realm.
 * @param realmId The ID of the realm where the permission exists.
 * @param permissionId The ID of the permission to delete.
 * @returns A Promise resolving when the deletion is successful.
 */
export const deletePermissionInRealm = (realmId: number, permissionId: number) => {
  console.log(`RealmPermissionService: deletePermissionInRealm called for realm ID: ${realmId}, permission ID: ${permissionId}`);
  return protectedApi.delete(`/v1/admin/realms/${realmId}/permissions/${permissionId}`);
};
