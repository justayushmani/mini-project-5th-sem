import api from './api.js';

const chatService = {
  sendMessage: async (sessionId, message, schemeId = null) => {
    const res = await api.post('/chat', { sessionId, message, schemeId });
    return res.data.data;
  },

  getSessions: async () => {
    const res = await api.get('/chat/sessions');
    return res.data.data;
  },

  getSession: async (sessionId) => {
    const res = await api.get(`/chat/sessions/${sessionId}`);
    return res.data.data;
  },

  deleteSession: async (sessionId) => {
    await api.delete(`/chat/sessions/${sessionId}`);
  },
};

export default chatService;
