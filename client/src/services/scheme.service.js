import api from './api.js';

const schemeService = {
  getSchemes: async (filters = {}) => {
    const res = await api.get('/schemes', { params: filters });
    return res.data;
  },

  getScheme: async (id) => {
    const res = await api.get(`/schemes/${id}`);
    return res.data.data;
  },
};

export default schemeService;
