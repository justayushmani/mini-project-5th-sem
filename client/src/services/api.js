import axios from 'axios';

const apiHost = window.location.hostname || '127.0.0.1';
const defaultApiUrl = `http://${apiHost}:5000/api`;

/**
 * Central Axios instance.
 * All API calls go through this — no scattered axios.get() throughout the app.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  withCredentials: true, // Send cookies (HTTP-only JWT)
  timeout: 30000,        // 30s — AI calls can be slow
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — standardize error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired / unauthorized → redirect to login
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
    // Always reject with the error so callers can handle it
    return Promise.reject(error);
  }
);

export default api;
