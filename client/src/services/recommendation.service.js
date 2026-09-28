import api from './api.js';

const recommendationService = {
  generate: async (profileData) => {
    const res = await api.post('/recommendations', { profile: profileData });
    return res.data.data;
  },

  getById: async (id) => {
    const res = await api.get(`/recommendations/${id}`);
    return res.data.data;
  },

  getHistory: async () => {
    const res = await api.get('/recommendations/history');
    return res.data.data;
  },
};

export default recommendationService;
