import api from './api.js';

const profileService = {
  get: async () => {
    const res = await api.get('/profile');
    return res.data.data;
  },

  update: async (profileData) => {
    const res = await api.put('/profile', profileData);
    return res.data.data;
  },
};

export default profileService;
