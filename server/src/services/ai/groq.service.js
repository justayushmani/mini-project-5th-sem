import groq from '../../lib/groq.js';
import env from '../../config/env.js';
import { VOCABULARY, normalizeValue } from '../../constants/schemeVocabulary.js';

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

function normalizeProfile(raw = {}) {
  const profile = {};

  // For fields defined in VOCABULARY, use its normalizer
  for (const field of PROFILE_FIELDS) {
    let value = raw[field];
    if (value === undefined || value === null || value === '') {
      profile[field] = null;
      continue;
    }
    if (VOCABULARY[field]) {
      const normVal = normalizeValue(field, value);
      profile[field] = normVal;
    } else {
      // For string fields without vocabulary, keep string
      profile[field] = typeof value === 'string' ? value.trim() : value;
    }
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
Never guess missing information — use null for anything not explicitly stated. NEVER infer gender, category, income or land ownership.
If annualIncome is stated in Hindi words like "ek lakh bees hazaar", convert it to numeric 120000. Keep annualIncome numeric.

Allowed enum values:
- gender: ${VOCABULARY.gender.values.join(', ')}
- category: ${VOCABULARY.category.values.join(', ')}
- employmentStatus: ${VOCABULARY.employmentStatus.values.join(', ')}
- maritalStatus: ${VOCABULARY.maritalStatus.values.join(', ')}
- state: (Standard Indian States)
- occupation: ${VOCABULARY.occupation.values.join(', ')} (or synonyms like kisan, artisan, homemaker)

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
