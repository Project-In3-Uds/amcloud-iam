// src/pages/PermissionManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import * as realmService from '../services/realm';
import * as realmPermissionService from '../services/realmPermission';
import { RealmResponse, PermissionResponse, PermissionRequest } from '../services/realm'; // Importe les interfaces

import axios from 'axios';

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
  const [scopeValue, setScopeValue] = useState('');
  const [permissionDescription, setPermissionDescription] = useState('');

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

  // Fetch Permissions when selectedRealmId changes
  useEffect(() => {
    const fetchPermissions = async () => {
      if (selectedRealmId === null) return;

      setLoadingPermissions(true);
      setError(null);

      try {
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
    fetchPermissions();
  }, [selectedRealmId]); // Re-fetch when selectedRealmId changes

  const resetForm = () => {
    setPermissionName('');
    setScopeValue('');
    setPermissionDescription('');
    setEditingPermission(null);
    setIsSubmitting(false);
    setError(null);
  };

  const handleCreateOrUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (selectedRealmId === null) {
      showNotification('Veuillez sélectionner un Realm.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const permissionData: PermissionRequest = {
        name: permissionName,
        scopeValue: scopeValue,
        description: permissionDescription,
        realmId: selectedRealmId,
      };

      if (editingPermission) {
        // Update Permission
        await realmPermissionService.updatePermissionInRealm(selectedRealmId, editingPermission.id, permissionData);
        showNotification('Permission mise à jour avec succès !', 'success');
      } else {
        // Create Permission
        await realmPermissionService.createPermissionInRealm(selectedRealmId, permissionData);
        showNotification('Permission créée avec succès !', 'success');
      }
      resetForm();
      setShowPermissionForm(false);
      fetchPermissions(); // Re-fetch permissions for the current realm
    } catch (err: any) {
      console.error('Erreur lors de la création/mise à jour de la permission:', err);
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

  const handleDeletePermission = async (permissionId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      if (selectedRealmId === null) {
        showNotification('Aucun Realm sélectionné pour la suppression.', 'error');
        return;
      }
      try {
        await realmPermissionService.deletePermissionInRealm(selectedRealmId, permissionId);
        showNotification('Permission supprimée avec succès !', 'success');
        fetchPermissions(); // Re-fetch permissions for the current realm
      } catch (err: any) {
        console.error('Erreur lors de la suppression de la permission:', err);
        let errorMessage = 'Une erreur inattendue est survenue lors de la suppression.';
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
    setScopeValue(permission.scopeValue);
    setPermissionDescription(permission.description);
    setShowPermissionForm(true); // Ouvre le formulaire en mode édition
  };

  // Helper function to re-fetch permissions (used after CRUD operations)
  const fetchPermissions = async () => {
    if (selectedRealmId === null) return;
    setLoadingPermissions(true);
    setError(null);
    try {
      const permissionsResponse = await realmPermissionService.getAllPermissionsByRealm(selectedRealmId);
      setPermissions(permissionsResponse.data);
    } catch (err: any) {
      console.error('Erreur lors du rechargement des permissions:', err);
      setError(axios.isAxiosError(err) && err.response?.data?.message || 'Erreur lors du rechargement des données.');
      showNotification(error || 'Erreur lors du rechargement des données.', 'error');
    } finally {
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
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Gestion des Permissions</h2>

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
            setShowPermissionForm(!showPermissionForm);
            resetForm(); // Reset form when toggling
          }}
          className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showPermissionForm ? 'Masquer le formulaire de permission' : 'Créer une nouvelle permission'}
        </button>

        {showPermissionForm && (
          <form onSubmit={handleCreateOrUpdatePermission} className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingPermission ? `Modifier la permission: ${editingPermission.name}` : 'Nouvelle Permission'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="permissionName" className="block text-sm font-medium text-gray-700">Nom de la permission</label>
                <input
                  type="text"
                  id="permissionName"
                  value={permissionName}
                  onChange={(e) => setPermissionName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="scopeValue" className="block text-sm font-medium text-gray-700">Valeur du Scope</label>
                <input
                  type="text"
                  id="scopeValue"
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="permissionDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="permissionDescription"
                  value={permissionDescription}
                  onChange={(e) => setPermissionDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isSubmitting ? 'Enregistrement...' : editingPermission ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPermissionForm(false);
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

        {loadingPermissions ? (
          <p className="text-center text-gray-600">Chargement des permissions...</p>
        ) : permissions.length === 0 && !error ? (
          <p className="text-center text-gray-600">Aucune permission trouvée dans ce Realm. Créez-en une nouvelle !</p>
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
                    Scope
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissions.map((perm) => (
                  <tr key={perm.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {perm.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {perm.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {perm.scopeValue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {perm.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditPermissionClick(perm)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeletePermission(perm.id)}
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

export default PermissionManagementPage;
