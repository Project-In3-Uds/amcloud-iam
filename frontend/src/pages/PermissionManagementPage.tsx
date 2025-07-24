// src/pages/PermissionManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import * as realmService from '../services/realm'; // For RealmResponse
import * as realmPermissionService from '../services/realmPermission'; // For PermissionResponse, PermissionRequest
import { RealmResponse } from '../services/realm';
import { PermissionResponse, PermissionRequest } from '../services/realmPermission';

import axios from 'axios';
import './PermissionManagementPage.css'; // Import the custom CSS file

const PermissionManagementPage: React.FC = () => {
  const { showNotification } = useNotification();

  const [realms, setRealms] = useState<RealmResponse[]>([]);
  const [selectedRealmId, setSelectedRealmId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);

  const [loadingRealms, setLoadingRealms] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for create/edit permission
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionResponse | null>(null);
  const [permissionName, setPermissionName] = useState('');
  const [permissionDescription, setPermissionDescription] = useState('');
  const [permissionScopeValue, setPermissionScopeValue] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to re-fetch permissions (used after CRUD operations)
  const fetchPermissions = useCallback(async () => {
    if (selectedRealmId === null) return;

    setLoadingPermissions(true);
    setError(null);

    try {
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
  }, [selectedRealmId, showNotification]);

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
  }, [showNotification]);

  // Fetch Permissions when selectedRealmId changes
  useEffect(() => {
    fetchPermissions();
  }, [selectedRealmId, fetchPermissions]);

  const resetForm = () => {
    setPermissionName('');
    setPermissionDescription('');
    setPermissionScopeValue('');
    setEditingPermission(null);
    setIsSubmitting(false);
    setError(null);
  };

  const handleCreateOrUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (selectedRealmId === null) {
      showNotification('Please select a Realm.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const permissionData: PermissionRequest = {
        name: permissionName,
        description: permissionDescription,
        scopeValue: permissionScopeValue,
        realmId: selectedRealmId, // Ensure realmId is included in the request
      };

      if (editingPermission) {
        // Update Permission
        await realmPermissionService.updatePermissionInRealm(selectedRealmId, editingPermission.id, permissionData);
        showNotification('Permission updated successfully!', 'success');
      } else {
        // Create Permission
        await realmPermissionService.createPermissionInRealm(selectedRealmId, permissionData);
        showNotification('Permission created successfully!', 'success');
      }
      resetForm();
      setShowPermissionForm(false);
      fetchPermissions(); // Re-fetch permissions for the current realm
    } catch (err: any) {
      console.error('Error creating/updating permission:', err);
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

  const handleDeletePermission = async (permissionId: number) => {
    // IMPORTANT: Replaced window.confirm with a custom modal for better UX and consistency
    // For now, keeping window.confirm as per the original code, but note this is not ideal for Canvas.
    if (window.confirm('Are you sure you want to delete this permission?')) {
      if (selectedRealmId === null) {
        showNotification('No Realm selected for deletion.', 'error');
        return;
      }
      try {
        await realmPermissionService.deletePermissionInRealm(selectedRealmId, permissionId);
        showNotification('Permission deleted successfully!', 'success');
        fetchPermissions(); // Re-fetch permissions for the current realm
      } catch (err: any) {
        console.error('Error deleting permission:', err);
        let errorMessage = 'An unexpected error occurred during deletion.';
        if (axios.isAxiosError(err) && err.response) {
          errorMessage = err.response.data?.message || err.response.data || errorMessage;
        }
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleEditPermissionClick = (permission: PermissionResponse) => {
    setEditingPermission(permission);
    setPermissionName(permission.name);
    setPermissionDescription(permission.description);
    setPermissionScopeValue(permission.scopeValue);
    setShowPermissionForm(true); // Open form in edit mode
  };

  if (loadingRealms) {
    return (
      <div className="permission-management-container" style={{ textAlign: 'center', padding: '50px' }}>
        Loading Realms...
      </div>
    );
  }

  if (realms.length === 0) {
    return (
      <div className="permission-management-container" style={{ textAlign: 'center', padding: '50px' }}>
        <div className="no-realms-found">
          <h2 className="text-3xl font-extrabold text-red-600 mb-4">No Realms available</h2>
          <p className="text-gray-700">Please create a Realm first via the Realm Management page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="permission-management-container">
      <div className="permission-header-section">
        <h1 className="permission-main-title">Permission Management</h1>
        <div className="permission-header-actions">
          {/* Create Permission Button */}
          <button
            onClick={() => {
              setShowPermissionForm(!showPermissionForm);
              resetForm(); // Reset form when toggling
            }}
            className="form-button save"
          >
            {showPermissionForm ? 'Hide Permission Form' : 'Create New Permission'}
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

      {showPermissionForm && (
        <form onSubmit={handleCreateOrUpdatePermission} className="form-section">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {editingPermission ? `Edit Permission: ${editingPermission.name}` : 'New Permission'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="permissionName" className="form-label">Permission Name</label>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  id="permissionName"
                  value={permissionName}
                  onChange={(e) => setPermissionName(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="permissionDescription" className="form-label">Description</label>
              <div className="form-input-wrapper">
                <textarea
                  id="permissionDescription"
                  value={permissionDescription}
                  onChange={(e) => setPermissionDescription(e.target.value)}
                  rows={3}
                  className="form-input"
                ></textarea>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="permissionScopeValue" className="form-label">Scope Value</label>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  id="permissionScopeValue"
                  value={permissionScopeValue}
                  onChange={(e) => setPermissionScopeValue(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              disabled={isSubmitting}
              className="form-button save"
            >
              {isSubmitting ? 'Saving...' : editingPermission ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPermissionForm(false);
                resetForm();
              }}
              className="form-button cancel"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </form>
      )}

      {loadingPermissions ? (
        <p className="text-center text-gray-600">Loading permissions...</p>
      ) : permissions.length === 0 && !error ? (
        <p className="text-center text-gray-600">No permissions found in this Realm. Create a new one!</p>
      ) : (
        <div className="permission-list-section">
          <div className="overflow-x-auto">
            <table className="permission-table">
              <thead>
                <tr>
                  <th className="table-header">ID</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Scope Value</th>
                  <th className="table-header sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission.id} className="table-row">
                    <td className="table-data">{permission.id}</td>
                    <td className="table-data">{permission.name}</td>
                    <td className="table-data">{permission.description}</td>
                    <td className="table-data">{permission.scopeValue}</td>
                    <td className="table-data actions-cell">
                      <button
                        onClick={() => handleEditPermissionClick(permission)}
                        className="action-button edit-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePermission(permission.id)}
                        className="action-button delete-button"
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

export default PermissionManagementPage;
