import { extractProfileWithGroq } from './groq.service.js';

export async function extractProfile({ text, language = 'en' }) {
  return extractProfileWithGroq({ text, language });
}
