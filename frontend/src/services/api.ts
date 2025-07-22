// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081'; // Ou l'URL de votre passerelle

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Placeholder pour les intercepteurs (sera implémenté plus tard)
// api.interceptors.request.use(...)
// api.interceptors.response.use(...)

export default api;
