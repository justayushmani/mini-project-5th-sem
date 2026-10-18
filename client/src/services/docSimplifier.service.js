import api from './api.js';

/**
 * Service to call the Doc Simplifier API.
 * Uses a dedicated 90s timeout and deletes default Content-Type so the browser
 * correctly sets multipart/form-data with boundary.
 */
export async function simplifyDocument(formData) {
  const response = await api.post('/doc-simplifier/simplify', formData, {
    timeout: 90000, // 90s timeout for vision AI processing
    headers: {
      'Content-Type': undefined,
    },
  });

  return response.data?.data;
}

export default {
  simplifyDocument,
};
