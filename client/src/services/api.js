import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Helper for backend health check
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Backend health check error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Backend server is unreachable'
    };
  }
};

export default api;
