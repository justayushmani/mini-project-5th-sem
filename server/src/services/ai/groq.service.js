import groq from '../../lib/groq.js';
import env from '../../config/env.js';

const PROFILE_FIELDS = [
  'age',
  'state',
  'occupation',
  'annualIncome',
  'gender',
  'category',
  'education',
  'employmentStatus',
  'landOwnership',
  'disability',
  'maritalStatus',
];

function sanitizeJson(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.replace(/[^0-9.]/g, '');
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['yes', 'true', 'y', '1'].includes(normalized)) return true;
    if (['no', 'false', 'n', '0'].includes(normalized)) return false;
  }
  return null;
}

function normalizeProfile(raw = {}) {
  const profile = {};

  for (const field of PROFILE_FIELDS) {
    const value = raw[field];

    if (field === 'age') {
      profile.age = parseNumber(value);
      continue;
    }

    if (field === 'annualIncome') {
      profile.annualIncome = parseNumber(value);
      continue;
    }

    if (field === 'landOwnership' || field === 'disability') {
      profile[field] = parseBoolean(value);
      continue;
    }

    if (value === null || value === undefined || value === '') {
      profile[field] = null;
      continue;
    }

    profile[field] = typeof value === 'string' ? value.trim() : value;
  }

  return profile;
}

export async function extractProfileWithGroq({ text, language = 'en' }) {
  if (!text || !text.trim()) {
    throw new Error('Profile text is required.');
  }

  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured. Please add it to server/.env.');
  }

  const prompt = `Extract user profile from this text. Return ONLY valid JSON.
Never guess missing information — use null for unknown fields.
Text: "${text.replace(/"/g, '\\"')}"
Language hint: ${language}
Return JSON with these fields:
{ age, state, occupation, annualIncome, gender, category, education, employmentStatus, landOwnership, disability, maritalStatus }`;

  const response = await groq.chat.completions.create({
    model: env.groqModel,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Groq returned an empty response.');
  }

  const jsonText = sanitizeJson(content);
  if (!jsonText) {
    throw new Error('Groq response could not be parsed as JSON.');
  }

  const parsed = JSON.parse(jsonText);
  return normalizeProfile(parsed);
}
