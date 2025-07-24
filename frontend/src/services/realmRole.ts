// src/services/realmRole.ts
import { protectedApi } from './api';

// Interface for Role data received in responses
export interface RoleResponse {
  id: number;
  name: string;
  description: string;
  realmId: number; // Ensure realmId is part of the response
  permissionNames: string[]; // List of permission names associated with the role
  createdAt: string;
  updatedAt: string;
}

// Interface for Role data used in requests (create/update)
export interface RoleRequest {
  name: string;
  description: string;
  permissionNames: string[];
  realmId: number; // Realm ID is required for creation/update within a specific realm
}

/**
 * Retrieves all roles for a specific realm.
 * @param realmId The ID of the realm.
 * @returns A Promise resolving to an array of RoleResponse.
 */
export const getAllRolesByRealm = (realmId: number) => {
  console.log(`RealmRoleService: getAllRolesByRealm called for realm ID: ${realmId}`);
  return protectedApi.get<RoleResponse[]>(`/v1/admin/realms/${realmId}/roles`);
};

/**
 * Creates a new role within a specific realm.
 * @param realmId The ID of the realm where the role will be created.
 * @param roleData The data for the new role.
 * @returns A Promise resolving to the created RoleResponse.
 */
export const createRoleInRealm = (realmId: number, roleData: RoleRequest) => {
  console.log(`RealmRoleService: createRoleInRealm called for realm ID: ${realmId}`, roleData);
  return protectedApi.post<RoleResponse>(`/v1/admin/realms/${realmId}/roles`, roleData);
};

/**
 * Updates an existing role within a specific realm.
 * @param realmId The ID of the realm where the role exists.
 * @param roleId The ID of the role to update.
 * @param roleData The updated data for the role.
 * @returns A Promise resolving to the updated RoleResponse.
 */
export const updateRoleInRealm = (realmId: number, roleId: number, roleData: RoleRequest) => {
  console.log(`RealmRoleService: updateRoleInRealm called for realm ID: ${realmId}, role ID: ${roleId}`, roleData);
  return protectedApi.put<RoleResponse>(`/v1/admin/realms/${realmId}/roles/${roleId}`, roleData);
};

/**
 * Deletes a role from a specific realm.
 * @param realmId The ID of the realm where the role exists.
 * @param roleId The ID of the role to delete.
 * @returns A Promise resolving when the deletion is successful.
 */
export const deleteRoleInRealm = (realmId: number, roleId: number) => {
  console.log(`RealmRoleService: deleteRoleInRealm called for realm ID: ${realmId}, role ID: ${roleId}`);
  return protectedApi.delete(`/v1/admin/realms/${realmId}/roles/${roleId}`);
};
