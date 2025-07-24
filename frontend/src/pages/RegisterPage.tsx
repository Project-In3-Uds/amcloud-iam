import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext'; // Importe le hook de notification
import axios from 'axios'; // Importe axios pour gérer les erreurs
import './RegisterPage.css'; // Importe le fichier CSS séparé

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth(); // Pour vérifier si l'utilisateur est déjà connecté
  const { showNotification } = useNotification(); // Utilise le hook de notification

  // Rediriger si l'utilisateur est déjà connecté
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showNotification('', 'info', 1); // Efface les messages précédents avec une durée très courte
    setLoading(true);

    if (password !== confirmPassword) {
      showNotification('Les mots de passe ne correspondent pas.', 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.register({ username, email, password });
      // Utilise le message de succès de la réponse API si disponible, sinon un message par défaut
      const successMessage = response.data || 'Inscription réussie ! Veuillez vérifier votre e-mail pour activer votre compte.';
      showNotification(successMessage, 'success');
      // Optionnel: Rediriger après un court délai
      setTimeout(() => {
        navigate('/login'); // Rediriger vers la page de login après inscription réussie
      }, 3000);
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      let errorMessage = 'Une erreur inattendue est survenue lors de l\'inscription.';

      if (axios.isAxiosError(error) && error.response) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (Array.isArray(error.response.data) && typeof error.response.data[0] === 'string') {
          errorMessage = error.response.data[0];
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
    <div className="register-container">
      {/* Placeholder pour le logo */}
      <div className="register-logo">
        {/* Insérez votre SVG de logo ici ou une balise <img> */}
        {/* Exemple d'un SVG de logo générique (remplacez par le vôtre) */}
        <svg height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#333"/>
        </svg>
      </div>

      <h1 className="register-title">Créez votre compte Amcloud</h1>

      <div className="register-card">
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <div>
              <label htmlFor="username" className="sr-only">Nom d'utilisateur</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="input-field username"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Adresse e-mail</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field email"
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input-field password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirmer le mot de passe</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="input-field confirm-password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="register-button"
            >
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </div>
        </form>
      </div>

      {/* Carte de connexion séparée */}
      <div className="login-card-container">
        Vous avez déjà un compte ?{' '}
        <Link to="/login" className="login-link">
          Connectez-vous.
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

export default RegisterPage;
