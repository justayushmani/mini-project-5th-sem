import { qdrantService } from './qdrant.service.js';
import { embedQuery, embedPassage, EMBEDDING_MODEL_ID } from './embedding.service.js';

export function chunkSchemeText(scheme, targetChunkSize = 1200) {
  const parts = [];

  if (scheme.description) {
    parts.push(scheme.description.trim());
  }
  if (scheme.category) {
    parts.push(`Category: ${scheme.category}.`);
  }
  if (scheme.ministry) {
    parts.push(`Ministry: ${scheme.ministry}.`);
  }
  if (scheme.state) {
    parts.push(`State: ${scheme.state}.`);
  }
  if (scheme.level) {
    parts.push(`Level: ${scheme.level}.`);
  }
  if (scheme.applicationProcess) {
    parts.push(`Application Process: ${scheme.applicationProcess.trim()}`);
  }

  if (scheme.benefits?.length) {
    const benefitStrs = scheme.benefits.map((b) => {
      return [b.benefitType, b.description, b.amount].filter(Boolean).join(' - ');
    });
    parts.push(`Benefits:\n${benefitStrs.map((b) => `- ${b}`).join('\n')}`);
  }

  if (scheme.eligibility?.length) {
    const eligStrs = scheme.eligibility
      .map((e) => e.description)
      .filter(Boolean);
    if (eligStrs.length) {
      parts.push(`Eligibility Criteria:\n${eligStrs.map((e) => `- ${e}`).join('\n')}`);
    }
  }

  if (scheme.documents?.length) {
    const docStrs = scheme.documents
      .map((d) => [d.documentName, d.description].filter(Boolean).join(': '))
      .filter(Boolean);
    if (docStrs.length) {
      parts.push(`Required Documents:\n${docStrs.map((d) => `- ${d}`).join('\n')}`);
    }
  }

  const fullText = parts.join('\n\n');
  const prefix = `${scheme.name}. `;

  if (!fullText || fullText.length <= targetChunkSize) {
    return [`${prefix}${fullText}`.trim()];
  }

  const paragraphs = fullText.split(/\n\n+/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if (current && (current.length + para.length + 2 > targetChunkSize)) {
      chunks.push(`${prefix}${current}`.trim());
      current = '';
    }

    if (para.length > targetChunkSize) {
      const sentences = para.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [para];
      for (const sent of sentences) {
        if (current && (current.length + sent.length + 1 > targetChunkSize)) {
          chunks.push(`${prefix}${current}`.trim());
          current = '';
        }
        current = current ? `${current} ${sent.trim()}` : sent.trim();
      }
    } else {
      current = current ? `${current}\n\n${para.trim()}` : para.trim();
    }
  }

  if (current.trim()) {
    chunks.push(`${prefix}${current}`.trim());
  }

  return chunks.length ? chunks : [`${prefix}${fullText}`.trim()];
}

export async function ingestSchemesToRAG(schemes = []) {
  await qdrantService.ensureCollection();

  let totalPoints = 0;

  for (const scheme of schemes) {
    // Delete older points for this scheme before upserting new ones
    await qdrantService.deletePointsBySchemeId(scheme.id);

    const chunks = chunkSchemeText(scheme);
    const points = [];

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const chunkText = chunks[chunkIndex];
      const vector = await embedPassage(chunkText);
      const pointId = qdrantService.generatePointId(scheme.id, chunkIndex);

      points.push({
        id: pointId,
        vector,
        payload: {
          schemeId: scheme.id,
          slug: scheme.slug,
          chunkIndex,
          embeddingModel: EMBEDDING_MODEL_ID,
          name: scheme.name,
          category: scheme.category,
          state: scheme.state || null,
          ministry: scheme.ministry || null,
          text: chunkText,
        },
      });
    }

    if (points.length > 0) {
      await qdrantService.upsertPoints(points);
      totalPoints += points.length;
    }
  }

  return totalPoints;
}

export async function searchRelevantSchemes(query, limit = 5) {
  const vector = await embedQuery(query);
  const searchLimit = Math.max(limit * 3, 10);
  const result = await qdrantService.searchPoints(vector, { limit: searchLimit, withPayload: true });

  const rawMatches = result?.result || [];
  const bestByScheme = new Map();

  for (const match of rawMatches) {
    const schemeId = match.payload?.schemeId;
    if (!schemeId) continue;

    if (!bestByScheme.has(schemeId) || match.score > bestByScheme.get(schemeId).score) {
      bestByScheme.set(schemeId, match);
    }
  }

  const uniqueMatches = Array.from(bestByScheme.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return uniqueMatches;
}

export const ragService = {
  chunkSchemeText,
  ingestSchemesToRAG,
  searchRelevantSchemes,
};

export default ragService;
