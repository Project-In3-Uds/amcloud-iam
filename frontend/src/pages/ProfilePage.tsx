// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import * as userService from '../services/user'; // Importe le service utilisateur
import axios from 'axios';
import { Link } from 'react-router-dom'; // Importe Link

// Interface pour les données de profil utilisateur
interface UserProfile {
  id: number;
  username: string;
  email: string;
  status: string;
  enabled: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading || !user) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setError(null);

      try {
        // Assurez-vous que user.id est un nombre valide
        if (user.id) {
          const response = await userService.getUserById(user.id);
          setProfile(response.data);
        } else {
          showNotification('ID utilisateur non disponible pour le profil.', 'error');
          setError('ID utilisateur non disponible.');
        }
      } catch (err: any) {
        console.error('Erreur lors de la récupération du profil:', err);
        let errorMessage = 'Une erreur inattendue est survenue lors de la récupération du profil.';

        if (axios.isAxiosError(err) && err.response) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
            errorMessage = (err.response.data as { message: string }).message;
          } else if (err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data) {
            errorMessage = (err.response.data as { error: string }).error;
          } else if (err.response.status) {
            errorMessage = `Erreur ${err.response.status}: ${err.response.statusText || 'Réponse du serveur non gérée.'}`;
          }
        } else if (axios.isAxiosError(err) && err.request) {
          errorMessage = 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion ou réessayer plus tard.';
        } else {
          errorMessage = 'Une erreur s\'est produite avant l\'envoi de la requête.';
        }
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, showNotification]); // Dépend de l'objet user et authLoading

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-gray-700">Chargement du profil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
          <h2 className="text-3xl font-extrabold text-red-600">Erreur de chargement du profil</h2>
          <p className="text-gray-700">{error}</p>
          <Link to="/dashboard" className="font-medium text-indigo-600 hover:text-indigo-500">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Profil introuvable
          </h2>
          <p className="text-gray-600">Veuillez vous connecter pour voir votre profil.</p>
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Aller à la page de connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Mon Profil
          </h2>
        </div>
        <div className="mt-8 space-y-4 text-gray-700">
          <p><strong>ID:</strong> {profile.id}</p>
          <p><strong>Nom d'utilisateur:</strong> {profile.username}</p>
          <p><strong>E-mail:</strong> {profile.email}</p>
          <p><strong>Statut:</strong> {profile.status}</p>
          <p><strong>Activé:</strong> {profile.enabled ? 'Oui' : 'Non'}</p>
          <p><strong>Rôles:</strong> {profile.roles.join(', ')}</p>
          <p><strong>Permissions:</strong> {profile.permissions.join(', ')}</p>
          <p><strong>Créé le:</strong> {new Date(profile.createdAt).toLocaleString()}</p>
          <p><strong>Dernière mise à jour:</strong> {new Date(profile.updatedAt).toLocaleString()}</p>
          {profile.lastLoginAt && <p><strong>Dernière connexion:</strong> {new Date(profile.lastLoginAt).toLocaleString()}</p>}
        </div>
        <div className="text-sm text-center mt-6">
          <Link to="/dashboard" className="font-medium text-indigo-600 hover:text-indigo-500">
            Retour au Tableau de Bord
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
