// src/pages/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../services/auth';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';
import './ForgotPasswordPage.css'; // Importe le fichier CSS séparé

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      const successMessage = response.data || 'Un e-mail de réinitialisation de mot de passe a été envoyé à votre adresse.';
      showNotification(successMessage, 'success');
      setEmail(''); // Efface l'e-mail après l'envoi
    } catch (error: any) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      let errorMessage = 'Une erreur inattendue est survenue lors de la demande de réinitialisation.';

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
    <div className="forgot-password-container">
      {/* Placeholder pour le logo */}
      <div className="forgot-password-logo">
        {/* Insérez votre SVG de logo ici ou une balise <img> */}
        {/* Exemple d'un SVG de logo générique (remplacez par le vôtre) */}
        <svg height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#333"/>
        </svg>
      </div>

      <h1 className="forgot-password-title">Mot de passe oublié ?</h1>

      <div className="forgot-password-card">
        <p style={{ fontSize: '0.875rem', color: '#586069', marginBottom: '1rem', textAlign: 'center' }}>
          Saisissez votre adresse e-mail pour réinitialiser votre mot de passe.
        </p>
        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="sr-only">Adresse e-mail</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input-field"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="forgot-password-button"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </div>
        </form>
      </div>

      {/* Carte de connexion séparée */}
      <div className="login-card-container">
        <Link to="/login" className="login-link">
          Retour à la connexion
        </Link>
      </div>

      {/* Liens de pied de page (simulés) */}
      <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#0366d6' }}>
        <Link to="#" style={{ marginRight: '1rem', textDecoration: 'none', color: 'inherit' }}>Termes</Link>
        <Link to="#" style={{ marginRight: '1rem', textDecoration: 'none', color: 'inherit' }}>Confidentialité</Link>
        <Link to="#" style={{ marginRight: '1rem', textDecoration: 'none', color: 'inherit' }}>Sécurité</Link>
        <Link to="#" style={{ textDecoration: 'none', color: 'inherit' }}>Contact Amcloud</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
