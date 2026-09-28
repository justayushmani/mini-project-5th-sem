import { qdrantService } from './qdrant.service.js';
import { extractProfileWithGroq } from '../ai/groq.service.js';

function makeLocalEmbedding(text) {
  const normalized = String(text || '').toLowerCase().trim();
  const vector = Array.from({ length: 384 }, (_, index) => {
    const charCode = normalized.charCodeAt(index % normalized.length || 0) || 1;
    return ((charCode * (index + 1)) % 97) / 97;
  });

  if (!normalized) {
    return Array(384).fill(0);
  }

  return vector;
}

export async function embedText(text) {
  if (!text || !String(text).trim()) {
    return Array(384).fill(0);
  }
  return makeLocalEmbedding(text);
}

export async function ingestSchemesToRAG(schemes = []) {
  await qdrantService.ensureCollection();

  const points = [];
  for (let index = 0; index < schemes.length; index += 1) {
    const scheme = schemes[index];
    const vector = await embedText(`${scheme.name} ${scheme.description} ${scheme.category} ${scheme.ministry || ''}`);
    points.push({
      id: index + 1,
      vector,
      payload: {
        schemeId: scheme.id,
        name: scheme.name,
        category: scheme.category,
        state: scheme.state || null,
        ministry: scheme.ministry || null,
        description: scheme.description || '',
        officialUrl: scheme.officialUrl || '',
      },
    });
  }

  await qdrantService.upsertPoints(points);
  return points.length;
}

export async function searchRelevantSchemes(query, limit = 5) {
  const vector = await embedText(query);
  const result = await qdrantService.searchPoints(vector, { limit, withPayload: true });

  return result?.result || [];
}

export async function answerSchemeQuery({ query, schemeContext = [] }) {
  const text = `Answer as a helpful government-scheme assistant. Use only the provided scheme context.\n\nContext:\n${schemeContext.map((item) => `- ${item.payload?.name}: ${item.payload?.description || ''}`).join('\n')}\n\nUser question: ${query}`;

  return extractProfileWithGroq({ text, language: 'en' });
}

export const ragService = {
  embedText,
  ingestSchemesToRAG,
  searchRelevantSchemes,
  answerSchemeQuery,
};

export default ragService;
