import api from './api.js';

const authService = {
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data.data;
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
};

export default authService;
