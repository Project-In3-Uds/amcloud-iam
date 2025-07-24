// src/pages/RoleManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import * as realmService from '../services/realm'; // For RealmResponse
import * as realmRoleService from '../services/realmRole'; // For RoleResponse, RoleRequest
import * as realmPermissionService from '../services/realmPermission'; // For PermissionResponse
import { RealmResponse } from '../services/realm'; // Import RealmResponse
import { RoleResponse, RoleRequest } from '../services/realmRole'; // Import from realmRole
import { PermissionResponse } from '../services/realmPermission'; // Import from realmPermission

import axios from 'axios';
import './RoleManagementPage.css'; // Import the custom CSS file

const RoleManagementPage: React.FC = () => {
  const { showNotification } = useNotification();

  const [realms, setRealms] = useState<RealmResponse[]>([]);
  const [selectedRealmId, setSelectedRealmId] = useState<number | null>(null);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]); // List of permissions for the selected Realm

  const [loadingRealms, setLoadingRealms] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for create/edit role
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]); // Selected permissions for the role

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to re-fetch both roles and permissions (used after CRUD operations)
  const fetchRolesAndPermissions = useCallback(async () => {
    if (selectedRealmId === null) return;

    setLoadingRoles(true);
    setLoadingPermissions(true);
    setError(null);

    try {
      // Fetch Roles
      const rolesResponse = await realmRoleService.getAllRolesByRealm(selectedRealmId);
      setRoles(rolesResponse.data);
    } catch (err: any) {
      console.error(`Error fetching roles for Realm ${selectedRealmId}:`, err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.message || 'Error loading roles.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      setRoles([]); // Clear roles on error
    } finally {
      setLoadingRoles(false);
    }

    try {
      // Fetch Permissions for the selected Realm
      const permissionsResponse = await realmPermissionService.getAllPermissionsByRealm(selectedRealmId);
      setPermissions(permissionsResponse.data);
    } catch (err: any) {
      console.error(`Error fetching permissions for Realm ${selectedRealmId}:`, err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.message || 'Error loading permissions.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      setPermissions([]); // Clear permissions on error
    } finally {
      setLoadingPermissions(false);
    }
  }, [selectedRealmId, showNotification]); // Dependencies for useCallback

  // Fetch Realms on component mount
  useEffect(() => {
    const fetchRealmsData = async () => {
      setLoadingRealms(true);
      try {
        const response = await realmService.getAllRealms();
        setRealms(response.data);
        if (response.data.length > 0) {
          setSelectedRealmId(response.data[0].id); // Select the first Realm by default
        }
      } catch (err: any) {
        console.error('Error fetching Realms:', err);
        const errorMessage = axios.isAxiosError(err) && err.response?.data?.message || 'Error loading Realms.';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      } finally {
        setLoadingRealms(false);
      }
    };
    fetchRealmsData();
  }, [showNotification]); // No dependencies, runs once on mount

  // Fetch Roles and Permissions when selectedRealmId changes
  useEffect(() => {
    fetchRolesAndPermissions();
  }, [selectedRealmId, fetchRolesAndPermissions]); // Re-fetch when selectedRealmId changes or fetchRolesAndPermissions changes

  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setEditingRole(null);
    setIsSubmitting(false);
    setError(null);
  };

  const handleCreateOrUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (selectedRealmId === null) {
      showNotification('Please select a Realm.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const roleData: RoleRequest = {
        name: roleName,
        description: roleDescription,
        permissionNames: selectedPermissions,
        realmId: selectedRealmId, // Ensure realmId is included in the request
      };

      if (editingRole) {
        // Update Role
        await realmRoleService.updateRoleInRealm(selectedRealmId, editingRole.id, roleData);
        showNotification('Role updated successfully!', 'success');
      } else {
        // Create Role
        await realmRoleService.createRoleInRealm(selectedRealmId, roleData);
        showNotification('Role created successfully!', 'success');
      }
      resetForm();
      setShowRoleForm(false);
      fetchRolesAndPermissions(); // Re-fetch roles and permissions for the current realm
    } catch (err: any) {
      console.error('Error creating/updating role:', err);
      let errorMessage = 'An unexpected error occurred.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data?.message || err.response.data || errorMessage;
      }
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    // IMPORTANT: Replaced window.confirm with a custom modal for better UX and consistency
    // For now, keeping window.confirm as per the original code, but note this is not ideal for Canvas.
    if (window.confirm('Are you sure you want to delete this role?')) {
      if (selectedRealmId === null) {
        showNotification('No Realm selected for deletion.', 'error');
        return;
      }
      try {
        await realmRoleService.deleteRoleInRealm(selectedRealmId, roleId);
        showNotification('Role deleted successfully!', 'success');
        fetchRolesAndPermissions(); // Re-fetch roles for the current realm
      } catch (err: any) {
        console.error('Error deleting role:', err);
        let errorMessage = 'An unexpected error occurred during deletion.';
        if (axios.isAxiosError(err) && err.response) {
          errorMessage = err.response.data?.message || err.response.data || errorMessage;
        }
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleEditRoleClick = (role: RoleResponse) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setSelectedPermissions(role.permissionNames); // Pre-select current role permissions
    setShowRoleForm(true); // Open form in edit mode
  };

  if (loadingRealms) {
    return (
      <div className="role-management-container" style={{ textAlign: 'center', padding: '50px' }}>
        Loading Realms...
      </div>
    );
  }

  if (realms.length === 0) {
    return (
      <div className="role-management-container" style={{ textAlign: 'center', padding: '50px' }}>
        <div className="no-realms-found">
          <h2 className="text-3xl font-extrabold text-red-600 mb-4">No Realms available</h2>
          <p className="text-gray-700">Please create a Realm first via the Realm Management page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-management-container">
      <div className="role-header-section">
        <h1 className="role-main-title">Role Management</h1>
        <div className="role-header-actions">
          {/* Create Role Button */}
          <button
            onClick={() => {
              setShowRoleForm(!showRoleForm);
              resetForm(); // Reset form when toggling
            }}
            className="form-button save"
          >
            {showRoleForm ? 'Hide Role Form' : 'Create New Role'}
          </button>
        </div>
      </div>

      <div className="realm-selection-section">
        <label htmlFor="realm-select" className="form-label">Select a Realm:</label>
        <select
          id="realm-select"
          value={selectedRealmId || ''}
          onChange={(e) => setSelectedRealmId(Number(e.target.value))}
          className="form-input small" // Using custom form-input class
        >
          {realms.map((realm) => (
            <option key={realm.id} value={realm.id}>
              {realm.name}
            </option>
          ))}
        </select>
      </div>

      {showRoleForm && (
        <form onSubmit={handleCreateOrUpdateRole} className="form-section">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {editingRole ? `Edit Role: ${editingRole.name}` : 'New Role'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="roleName" className="form-label">Role Name</label>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                  className="form-input" // Using custom form-input class
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="roleDescription" className="form-label">Description</label>
              <div className="form-input-wrapper">
                <textarea
                  id="roleDescription"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  rows={3}
                  className="form-input" // Using custom form-input class
                ></textarea>
              </div>
            </div>
            {/* Permission Selection */}
            <div className="form-group">
              <label className="form-label">Permissions</label>
              <div className="form-input-wrapper">
                {loadingPermissions ? (
                  <p className="text-gray-500">Loading permissions...</p>
                ) : permissions.length > 0 ? (
                  <div className="permissions-grid"> {/* Custom class for grid layout */}
                    {permissions.map((perm) => (
                      <div key={perm.id} className="permission-item"> {/* Custom class for item */}
                        <input
                          id={`perm-${perm.id}`}
                          type="checkbox"
                          value={perm.name}
                          checked={selectedPermissions.includes(perm.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, perm.name]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter((p) => p !== perm.name));
                            }
                          }}
                          className="checkbox-input" // Custom class for checkbox
                        />
                        <label htmlFor={`perm-${perm.id}`} className="checkbox-label"> {/* Custom class for label */}
                          {perm.name} ({perm.scopeValue})
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No permissions available in this Realm.</p>
                )}
              </div>
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              disabled={isSubmitting}
              className="form-button save" // Using custom form-button class
            >
              {isSubmitting ? 'Saving...' : editingRole ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRoleForm(false);
                resetForm();
              }}
              className="form-button cancel" // Using custom form-button class
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </form>
      )}

      {loadingRoles ? (
        <p className="text-center text-gray-600">Loading roles...</p>
      ) : roles.length === 0 && !error ? (
        <p className="text-center text-gray-600">No roles found in this Realm. Create a new one!</p>
      ) : (
        <div className="role-list-section">
          <div className="overflow-x-auto">
            <table className="role-table"> {/* Custom class for table */}
              <thead>
                <tr>
                  <th className="table-header">ID</th> {/* Custom class for table header */}
                  <th className="table-header">Name</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Permissions</th>
                  <th className="table-header sr-only">Actions</th> {/* sr-only for screen readers */}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="table-row"> {/* Custom class for table row */}
                    <td className="table-data">{role.id}</td> {/* Custom class for table data */}
                    <td className="table-data">{role.name}</td>
                    <td className="table-data">{role.description}</td>
                    <td className="table-data">{role.permissionNames.join(', ')}</td>
                    <td className="table-data actions-cell"> {/* Custom class for actions cell */}
                      <button
                        onClick={() => handleEditRoleClick(role)}
                        className="action-button edit-button" // Custom classes for action buttons
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="action-button delete-button" // Custom classes for action buttons
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementPage;
