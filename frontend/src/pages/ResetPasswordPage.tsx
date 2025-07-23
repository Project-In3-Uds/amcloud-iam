// src/pages/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import * as authService from '../services/auth';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    // Récupère le token de l'URL
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      showNotification('Token de réinitialisation manquant dans l\'URL.', 'error');
      // Optionnel: rediriger si le token est manquant
      // setTimeout(() => navigate('/forgot-password'), 3000);
    }
  }, [searchParams, showNotification, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!token) {
      showNotification('Token de réinitialisation invalide ou manquant.', 'error');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showNotification('Les mots de passe ne correspondent pas.', 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.resetPassword(token, newPassword, confirmNewPassword);
      const successMessage = response.data || 'Votre mot de passe a été réinitialisé avec succès.';
      showNotification(successMessage, 'success');
      setNewPassword('');
      setConfirmNewPassword('');
      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      let errorMessage = 'Une erreur inattendue est survenue lors de la réinitialisation du mot de passe.';

      if (axios.isAxiosError(error) && error.response) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
          errorMessage = (error.response.data as { message: string }).message;
        } else if (error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
          errorMessage = (error.response.data as { error: string }).error;
        } else if (error.response.status) {
          errorMessage = `Erreur ${error.response.status}: ${error.response.statusText || 'Réponse du serveur non gérée.'}`;
        }
      } else if (axios.isAxiosError(error) && error.request) {
        errorMessage = 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion ou réessayer plus tard.';
      } else {
        errorMessage = 'Une erreur s\'est produite avant l\'envoi de la requête.';
      }
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Réinitialiser votre mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Saisissez votre nouveau mot de passe.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!token && (
            <div className="p-3 rounded-md text-sm bg-red-100 text-red-800">
              Le token de réinitialisation est manquant ou invalide. Veuillez utiliser le lien complet de l'e-mail.
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="new-password" className="sr-only">Nouveau mot de passe</label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="sr-only">Confirmer le nouveau mot de passe</label>
              <input
                id="confirm-new-password"
                name="confirm-new-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirmer le nouveau mot de passe"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !token}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
