import api from './api.js';

const bookmarkService = {
  add: async (schemeId) => {
    const res = await api.post('/bookmarks', { schemeId });
    return res.data.data;
  },

  getAll: async () => {
    const res = await api.get('/bookmarks');
    return res.data.data;
  },

  remove: async (schemeId) => {
    await api.delete(`/bookmarks/${schemeId}`);
  },
};

export default bookmarkService;
