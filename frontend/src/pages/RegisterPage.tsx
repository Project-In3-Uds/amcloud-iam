import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../services/auth'; // Votre service d'authentification
import { useAuth } from '../contexts/AuthContext'; // Si vous voulez gérer l'état global après l'inscription

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth(); // Pour vérifier si l'utilisateur est déjà connecté

  // Rediriger si l'utilisateur est déjà connecté
  if (user) {
    navigate('/dashboard'); // Ou une page de succès d'inscription si elle existe
    return null; // Empêche le rendu du formulaire si redirigé
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null); // Réinitialise les messages précédents
    setLoading(true);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      setLoading(false);
      return;
    }

    try {
      const response = await authService.register({ username, email, password });
      // Utilise le message de succès de la réponse API si disponible, sinon un message par défaut
      const successMessage = response.data || 'Inscription réussie ! Veuillez vérifier votre e-mail pour activer votre compte.';
      setMessage({
        type: 'success',
        text: successMessage,
      });
      // Optionnel: Rediriger après un court délai
      setTimeout(() => {
        navigate('/login'); // Rediriger vers la page de login après inscription réussie
      }, 3000);
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      // Capture le message d'erreur de la réponse API, ou un message générique
      const errorMessage = error.response?.data || 'Une erreur inattendue est survenue lors de l\'inscription.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un nouveau compte
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Nom d'utilisateur</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Connectez-vous ici
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
