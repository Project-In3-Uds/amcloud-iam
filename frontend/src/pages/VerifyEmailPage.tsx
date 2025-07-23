// src/pages/VerifyEmailPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as authService from '../services/auth';
import { useNotification } from '../contexts/NotificationContext'; // Importe le hook de notification
import axios from 'axios'; // Importe axios pour gérer les erreurs

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification(); // Utilise le hook de notification

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      showNotification('Token de vérification manquant dans l\'URL.', 'error');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token);
        const successMessage = response.data || 'Votre e-mail a été vérifié avec succès ! Vous pouvez maintenant vous connecter.';
        showNotification(successMessage, 'success');
      } catch (error: any) {
        console.error('Erreur de vérification d\'e-mail:', error);
        let errorMessage = 'Une erreur est survenue lors de la vérification de votre e-mail.';

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

    verify();
  }, [searchParams, showNotification]); // Ajout de showNotification aux dépendances

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Vérification d'e-mail
        </h2>
        {loading ? (
          <p className="text-center text-gray-600">Vérification de votre e-mail en cours...</p>
        ) : (
          <div className="text-sm text-center mt-4">
            {/* Le message est maintenant géré par le système de notification global */}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Retour à la page de connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
