import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';
import './LoginPage.css'; // Importe le fichier CSS séparé

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { showNotification } = useNotification();

  // Rediriger si l'utilisateur est déjà connecté
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      showNotification('Connexion réussie ! Redirection...', 'success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Erreur de connexion (catch global):', error);

      let errorMessage = 'Une erreur inattendue est survenue lors de la connexion.';

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
    <div className="login-container">
      {/* Placeholder pour le logo */}
      <div className="login-logo">
        {/* Insérez votre SVG de logo ici ou une balise <img> */}
        {/* Exemple d'un SVG de logo générique (remplacez par le vôtre) */}
        <svg height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#333"/>
        </svg>
      </div>

      <h1 className="login-title">Connectez-vous à Amcloud</h1>

      <div className="login-card">
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Champ Nom d'utilisateur/E-mail */}
          <div>
            <label htmlFor="username-or-email" className="sr-only">Nom d'utilisateur ou E-mail</label>
            <input
              id="username-or-email"
              name="username-or-email"
              type="text"
              autoComplete="username"
              required
              className="input-field username"
              placeholder="Nom d'utilisateur ou E-mail"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {/* Champ Mot de passe */}
          <div>
            <label htmlFor="password" className="sr-only">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input-field password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Lien Mot de passe oublié */}
          <div className="forgot-password-link-container">
            <Link to="/forgot-password" className="forgot-password-link">
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Bouton de soumission */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>

      {/* Carte d'inscription séparée */}
      <div className="register-card">
        Nouveau sur Amcloud ?{' '}
        <Link to="/register" className="register-link">
          Créez un compte.
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

export default LoginPage;
