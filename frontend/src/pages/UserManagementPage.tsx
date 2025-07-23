// src/pages/UserManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import * as realmService from '../services/realm'; // Pour récupérer la liste des Realms
import * as realmUserService from '../services/realmUser'; // Pour la gestion des utilisateurs par Realm
import * as realmRoleService from '../services/realmRole'; // Pour récupérer les rôles par Realm
import { RealmResponse, RoleResponse, RoleRequest } from '../services/realm'; // Importe RealmResponse, RoleResponse et RoleRequest depuis realm.ts
import { UserResponse, UserUpdateRequest } from '../services/user'; // Réutilise les interfaces UserResponse et UserUpdateRequest
import { RealmUserCreateRequest, RealmUserUpdateRequest } from '../services/realmUser'; // Importe RealmUserCreateRequest et RealmUserUpdateRequest
import axios from 'axios';

const UserManagementPage: React.FC = () => {
  const { showNotification } = useNotification();

  const [realms, setRealms] = useState<RealmResponse[]>([]);
  const [selectedRealmId, setSelectedRealmId] = useState<number | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]); // Liste des rôles du Realm sélectionné

  const [loadingRealms, setLoadingRealms] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for create/edit user
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]); // Rôles sélectionnés pour l'utilisateur

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

  // Fetch Users and Roles when selectedRealmId changes
  useEffect(() => {
    const fetchUsersAndRoles = async () => {
      if (selectedRealmId === null) return;

      setLoadingUsers(true);
      setLoadingRoles(true);
      setError(null);

      try {
        // Fetch Users
        const usersResponse = await realmUserService.getAllUsersByRealm(selectedRealmId);
        setUsers(usersResponse.data);
      } catch (err: any) {
        console.error(`Erreur lors de la récupération des utilisateurs pour Realm ${selectedRealmId}:`, err);
        setError(axios.isAxiosError(err) && err.response?.data?.message || 'Erreur lors du chargement des utilisateurs.');
        showNotification(error || 'Erreur lors du chargement des utilisateurs.', 'error');
        setUsers([]); // Clear users on error
      } finally {
        setLoadingUsers(false);
      }

      try {
        // Fetch Roles for the selected Realm
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
    };
    fetchUsersAndRoles();
  }, [selectedRealmId]); // Re-fetch when selectedRealmId changes

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setStatus('ACTIVE');
    setSelectedRoles([]);
    setEditingUser(null);
    setIsSubmitting(false);
    setError(null);
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password && password !== confirmPassword) {
      showNotification('Les mots de passe ne correspondent pas.', 'error');
      setIsSubmitting(false);
      return;
    }

    if (selectedRealmId === null) {
      showNotification('Veuillez sélectionner un Realm.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingUser) {
        // Update User
        const updateData: RealmUserUpdateRequest = {
          username: username,
          email: email,
          status: status,
          roles: selectedRoles,
        };
        if (password) {
          updateData.password = password;
        }
        await realmUserService.updateUserInRealm(selectedRealmId, editingUser.id, updateData);
        showNotification('Utilisateur mis à jour avec succès !', 'success');
      } else {
        // Create User
        const createData: RealmUserCreateRequest = {
          username,
          email,
          password,
          status,
          roles: selectedRoles,
          realmId: selectedRealmId,
        };
        await realmUserService.createUserInRealm(selectedRealmId, createData);
        showNotification('Utilisateur créé avec succès !', 'success');
      }
      resetForm();
      setShowUserForm(false);
      fetchUsersAndRoles(); // Re-fetch users and roles for the current realm
    } catch (err: any) {
      console.error('Erreur lors de la création/mise à jour de l\'utilisateur:', err);
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

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      if (selectedRealmId === null) {
        showNotification('Aucun Realm sélectionné pour la suppression.', 'error');
        return;
      }
      try {
        await realmUserService.deleteUserInRealm(selectedRealmId, userId);
        showNotification('Utilisateur supprimé avec succès !', 'success');
        fetchUsersAndRoles(); // Re-fetch users for the current realm
      } catch (err: any) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', err);
        let errorMessage = 'Une erreur inattendue est survenue lors de la suppression.';
        if (axios.isAxiosError(err) && err.response) {
          errorMessage = err.response.data?.message || err.response.data || errorMessage;
        }
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleEditUserClick = (user: UserResponse) => {
    setEditingUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setStatus(user.status);
    setSelectedRoles(user.roles); // Pré-sélectionne les rôles actuels de l'utilisateur
    setPassword(''); // Ne pré-remplit pas le mot de passe pour la sécurité
    setConfirmPassword('');
    setShowUserForm(true); // Ouvre le formulaire en mode édition
  };

  // Helper function to re-fetch both users and roles (used after CRUD operations)
  const fetchUsersAndRoles = async () => {
    if (selectedRealmId === null) return;
    setLoadingUsers(true);
    setLoadingRoles(true); // Also reload roles as they might be needed for user creation/update
    setError(null);
    try {
      const usersResponse = await realmUserService.getAllUsersByRealm(selectedRealmId);
      setUsers(usersResponse.data);
      const rolesResponse = await realmRoleService.getAllRolesByRealm(selectedRealmId);
      setRoles(rolesResponse.data);
    } catch (err: any) {
      console.error('Erreur lors du rechargement des utilisateurs et rôles:', err);
      setError(axios.isAxiosError(err) && err.response?.data?.message || 'Erreur lors du rechargement des données.');
      showNotification(error || 'Erreur lors du rechargement des données.', 'error');
    } finally {
      setLoadingUsers(false);
      setLoadingRoles(false);
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
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Gestion des Utilisateurs</h2>

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
            setShowUserForm(!showUserForm);
            resetForm(); // Reset form when toggling
          }}
          className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showUserForm ? 'Masquer le formulaire utilisateur' : 'Créer un nouvel utilisateur'}
        </button>

        {showUserForm && (
          <form onSubmit={handleCreateOrUpdateUser} className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingUser ? `Modifier l'utilisateur: ${editingUser.username}` : 'Nouvel Utilisateur'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe {editingUser ? '(laisser vide si inchangé)' : ''}</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingUser} // Requis seulement pour la création
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!editingUser && !!password} // Requis si nouveau mot de passe ou en création
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </div>
              {/* Sélection des rôles */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Rôles</label>
                {loadingRoles ? (
                  <p className="text-gray-500">Chargement des rôles...</p>
                ) : roles.length > 0 ? (
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center">
                        <input
                          id={`role-${role.id}`}
                          type="checkbox"
                          value={role.name}
                          checked={selectedRoles.includes(role.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles([...selectedRoles, role.name]);
                            } else {
                              setSelectedRoles(selectedRoles.filter((r) => r !== role.name));
                            }
                          }}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor={`role-${role.id}`} className="ml-2 block text-sm text-gray-900">
                          {role.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun rôle disponible dans ce Realm.</p>
                )}
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isSubmitting ? 'Enregistrement...' : editingUser ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserForm(false);
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

        {loadingUsers ? (
          <p className="text-center text-gray-600">Chargement des utilisateurs...</p>
        ) : users.length === 0 && !error ? (
          <p className="text-center text-gray-600">Aucun utilisateur trouvé dans ce Realm. Créez-en un nouveau !</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom d'utilisateur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-mail
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activé
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôles
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.enabled ? 'Oui' : 'Non'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.roles.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditUserClick(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
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

export default UserManagementPage;
