import api from './api.js';

const schemeService = {
  getSchemes: async (filters = {}) => {
    const res = await api.get('/schemes', { params: filters });
    return res.data;
  },

  getScheme: async (id, language) => {
    const res = await api.get(`/schemes/${id}`, {
      params: language ? { language } : {},
    });
    return res.data.data;
  },
};

export default schemeService;
