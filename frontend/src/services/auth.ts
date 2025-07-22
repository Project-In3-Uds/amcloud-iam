// src/services/auth.js
import api from './api';

export const register = (userData: { username: string; email: string; password: string; }) => {
  console.log('AuthService: register called', userData);
  return api.post('/v1/auth/register', userData);
};
