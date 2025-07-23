// src/pages/RoleManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import * as realmService from '../services/realm';
import * as realmRoleService from '../services/realmRole';
import * as realmPermissionService from '../services/realmPermission'; // Pour récupérer les permissions par Realm
import { RealmResponse, RoleResponse, RoleRequest, PermissionResponse } from '../services/realm'; // Importe les interfaces

import axios from 'axios';

const RoleManagementPage: React.FC = () => {
  const { showNotification } = useNotification();

  const [realms, setRealms] = useState<RealmResponse[]>([]);
  const [selectedRealmId, setSelectedRealmId] = useState<number | null>(null);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]); // Liste des permissions du Realm sélectionné

  const [loadingRealms, setLoadingRealms] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for create/edit role
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]); // Permissions sélectionnées pour le rôle

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Realms on component mount
  useEffect(() => {
    const fetchRealms = async () => {
      setLoadingRealms(true);
      try {
        const response = await realmService.getAllRealms();
        setRealms(response.data);
        if (response.data.length > 0) {
          setSelectedRealmId(response.data[0].id); // Sélectionne le premier Realm par défaut
        }
      } catch (err: any) {
        console.error('Erreur lors de la récupération des Realms:', err);
        setError(axios.isAxiosError(err) && err.response?.data?.message || 'Erreur lors du chargement des Realms.');
        showNotification(error || 'Erreur lors du chargement des Realms.', 'error');
      } finally {
        setLoadingRealms(false);
      }
    };
    fetchRealms();
  }, []);

  // Fetch Roles and Permissions when selectedRealmId changes
  useEffect(() => {
    const fetchRolesAndPermissions = async () => {
      if (selectedRealmId === null) return;

      setLoadingRoles(true);
      setLoadingPermissions(true);
      setError(null);

      try {
        // Fetch Roles
        const rolesResponse = await realmRoleService.getAllRolesByRealm(selectedRealmId);
        setRoles(rolesResponse.data);
      } catch (err: any) {
        console.error(`Erreur lors de la récupération des rôles pour Realm ${selectedRealmId}:`, err);
        setError(axios.isAxiosError(err) && err.response?.data?.message || 'Erreur lors du chargement des rôles.');
        showNotification(error || 'Erreur lors du chargement des rôles.', 'error');
        setRoles([]); // Clear roles on error
      } finally {
        setLoadingRoles(false);
      }

      try {
        // Fetch Permissions for the selected Realm
        const permissionsResponse = await realmPermissionService.getAllPermissionsByRealm(selectedRealmId);
        setPermissions(permissionsResponse.data);
      } catch (err: any) {
        console.error(`Erreur lors de la récupération des permissions pour Realm ${selectedRealmId}:`, err);
        setError(axios.isAxiosError(err) && err.response?.data?.message || 'Erreur lors du chargement des permissions.');
        showNotification(error || 'Erreur lors du chargement des permissions.', 'error');
        setPermissions([]); // Clear permissions on error
      } finally {
        setLoadingPermissions(false);
      }
    };
    fetchRolesAndPermissions();
  }, [selectedRealmId]); // Re-fetch when selectedRealmId changes

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
      showNotification('Veuillez sélectionner un Realm.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const roleData: RoleRequest = {
        name: roleName,
        description: roleDescription,
        permissionNames: selectedPermissions,
        realmId: selectedRealmId,
      };

      if (editingRole) {
        // Update Role
        await realmRoleService.updateRoleInRealm(selectedRealmId, editingRole.id, roleData);
        showNotification('Rôle mis à jour avec succès !', 'success');
      } else {
        // Create Role
        await realmRoleService.createRoleInRealm(selectedRealmId, roleData);
        showNotification('Rôle créé avec succès !', 'success');
      }
      resetForm();
      setShowRoleForm(false);
      fetchRolesAndPermissions(); // Re-fetch roles and permissions for the current realm
    } catch (err: any) {
      console.error('Erreur lors de la création/mise à jour du rôle:', err);
      let errorMessage = 'Une erreur inattendue est survenue.';
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      if (selectedRealmId === null) {
        showNotification('Aucun Realm sélectionné pour la suppression.', 'error');
        return;
      }
      try {
        await realmRoleService.deleteRoleInRealm(selectedRealmId, roleId);
        showNotification('Rôle supprimé avec succès !', 'success');
        fetchRolesAndPermissions(); // Re-fetch roles for the current realm
      } catch (err: any) {
        console.error('Erreur lors de la suppression du rôle:', err);
        let errorMessage = 'Une erreur inattendue est survenue lors de la suppression.';
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
    setSelectedPermissions(role.permissionNames); // Pré-sélectionne les permissions actuelles du rôle
    setShowRoleForm(true); // Ouvre le formulaire en mode édition
  };

  // Helper function to re-fetch both roles and permissions (used after CRUD operations)
  const fetchRolesAndPermissions = async () => {
    if (selectedRealmId === null) return;
    setLoadingRoles(true);
    setLoadingPermissions(true);
    setError(null);
    try {
      const rolesResponse = await realmRoleService.getAllRolesByRealm(selectedRealmId);
      setRoles(rolesResponse.data);
      const permissionsResponse = await realmPermissionService.getAllPermissionsByRealm(selectedRealmId);
      setPermissions(permissionsResponse.data);
    } catch (err: any) {
      console.error('Erreur lors du rechargement des rôles et permissions:', err);
      setError(axios.isAxiosError(err) && err.response?.data?.message || 'Erreur lors du rechargement des données.');
      showNotification(error || 'Erreur lors du rechargement des données.', 'error');
    } finally {
      setLoadingRoles(false);
      setLoadingPermissions(false);
    }
  };


  if (loadingRealms) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-gray-700">Chargement des Realms...</p>
      </div>
    );
  }

  if (realms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
          <h2 className="text-3xl font-extrabold text-red-600">Aucun Realm disponible</h2>
          <p className="text-gray-700">Veuillez créer un Realm d'abord via la page de gestion des Realms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Gestion des Rôles</h2>

        <div className="mb-6">
          <label htmlFor="realm-select" className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un Realm:</label>
          <select
            id="realm-select"
            value={selectedRealmId || ''}
            onChange={(e) => setSelectedRealmId(Number(e.target.value))}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {realms.map((realm) => (
              <option key={realm.id} value={realm.id}>
                {realm.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setShowRoleForm(!showRoleForm);
            resetForm(); // Reset form when toggling
          }}
          className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showRoleForm ? 'Masquer le formulaire de rôle' : 'Créer un nouveau rôle'}
        </button>

        {showRoleForm && (
          <form onSubmit={handleCreateOrUpdateRole} className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingRole ? `Modifier le rôle: ${editingRole.name}` : 'Nouveau Rôle'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700">Nom du rôle</label>
                <input
                  type="text"
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="roleDescription"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
              </div>
              {/* Sélection des permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                {loadingPermissions ? (
                  <p className="text-gray-500">Chargement des permissions...</p>
                ) : permissions.length > 0 ? (
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {permissions.map((perm) => (
                      <div key={perm.id} className="flex items-center">
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
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor={`perm-${perm.id}`} className="ml-2 block text-sm text-gray-900">
                          {perm.name} ({perm.scopeValue})
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucune permission disponible dans ce Realm.</p>
                )}
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isSubmitting ? 'Enregistrement...' : editingRole ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRoleForm(false);
                  resetForm();
                }}
                className="flex-1 justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </form>
        )}

        {loadingRoles ? (
          <p className="text-center text-gray-600">Chargement des rôles...</p>
        ) : roles.length === 0 && !error ? (
          <p className="text-center text-gray-600">Aucun rôle trouvé dans ce Realm. Créez-en un nouveau !</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {role.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role.permissionNames.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditRoleClick(role)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagementPage;
