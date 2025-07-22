import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Assurez-vous que Tailwind est importé ici
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom'; // Importez BrowserRouter

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Router> {/* BrowserRouter doit envelopper AuthProvider et App */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
