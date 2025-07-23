// src/pages/RealmManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import * as realmService from '../services/realm';
import { RealmResponse, RealmRequest } from '../services/realm';
import axios from 'axios';

const RealmManagementPage: React.FC = () => {
  const [realms, setRealms] = useState<RealmResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRealm, setEditingRealm] = useState<RealmResponse | null>(null);

  // Form states for create/edit
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showNotification } = useNotification();

  const fetchRealms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await realmService.getAllRealms();
      setRealms(response.data);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des Realms:', err);
      let errorMessage = 'Une erreur inattendue est survenue lors de la récupération des Realms.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data?.message || err.response.data || errorMessage;
      }
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealms();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const realmData: RealmRequest = { name, description };

    try {
      if (editingRealm) {
        await realmService.updateRealm(editingRealm.id, realmData);
        showNotification('Realm mis à jour avec succès !', 'success');
      } else {
        await realmService.createRealm(realmData);
        showNotification('Realm créé avec succès !', 'success');
      }
      resetForm();
      setShowCreateForm(false);
      setEditingRealm(null);
      fetchRealms(); // Re-fetch realms to update the list
    } catch (err: any) {
      console.error('Erreur lors de la création/mise à jour du Realm:', err);
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce Realm ?')) {
      try {
        await realmService.deleteRealm(id);
        showNotification('Realm supprimé avec succès !', 'success');
        fetchRealms(); // Re-fetch realms to update the list
      } catch (err: any) {
        console.error('Erreur lors de la suppression du Realm:', err);
        let errorMessage = 'Une erreur inattendue est survenue lors de la suppression du Realm.';
        if (axios.isAxiosError(err) && err.response) {
          errorMessage = err.response.data?.message || err.response.data || errorMessage;
        }
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleEditClick = (realm: RealmResponse) => {
    setEditingRealm(realm);
    setName(realm.name);
    setDescription(realm.description);
    setShowCreateForm(true); // Ouvre le formulaire en mode édition
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingRealm(null);
    setIsSubmitting(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-gray-700">Chargement des Realms...</p>
      </div>
    );
  }

  if (error && !realms.length) { // Show error only if no realms could be loaded initially
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
          <h2 className="text-3xl font-extrabold text-red-600">Erreur de chargement des Realms</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Gestion des Realms</h2>

        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            resetForm(); // Reset form when toggling
          }}
          className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showCreateForm ? 'Masquer le formulaire de création' : 'Créer un nouveau Realm'}
        </button>

        {showCreateForm && (
          <form onSubmit={handleCreateOrUpdate} className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingRealm ? `Modifier le Realm: ${editingRealm.name}` : 'Nouveau Realm'}
            </h3>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom du Realm</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isSubmitting ? 'Enregistrement...' : editingRealm ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
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

        {realms.length === 0 && !loading && !error && (
          <p className="text-center text-gray-600">Aucun Realm trouvé. Créez-en un nouveau !</p>
        )}

        {realms.length > 0 && (
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
                    Créé le
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mis à jour le
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {realms.map((realm) => (
                  <tr key={realm.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {realm.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {realm.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {realm.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(realm.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(realm.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditClick(realm)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(realm.id)}
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

export default RealmManagementPage;
