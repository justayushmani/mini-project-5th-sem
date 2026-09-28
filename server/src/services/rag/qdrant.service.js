import env from '../../config/env.js';

const QDRANT_URL = (env.qdrantUrl || '').replace(/\/+$/, '');
const QDRANT_API_KEY = env.qdrantApiKey || '';
const COLLECTION_NAME = env.qdrantCollection || 'yojana_schemes';
const VECTOR_SIZE = 384;

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (QDRANT_API_KEY) {
    headers['api-key'] = QDRANT_API_KEY;
  }

  return headers;
}

function normalizeCollectionName(name) {
  return String(name || COLLECTION_NAME).trim();
}

export async function ensureCollection(collectionName = COLLECTION_NAME) {
  if (!QDRANT_URL) {
    throw new Error('QDRANT_URL is not configured.');
  }

  const name = normalizeCollectionName(collectionName);
  const response = await fetch(`${QDRANT_URL}/collections/${name}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (response.ok) {
    return { ok: true, name };
  }

  if (response.status !== 404) {
    const payload = await response.text();
    throw new Error(`Qdrant collection check failed: ${response.status} ${payload}`);
  }

  const createResponse = await fetch(`${QDRANT_URL}/collections/${name}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify({
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    }),
  });

  if (!createResponse.ok) {
    const payload = await createResponse.text();
    throw new Error(`Qdrant collection creation failed: ${createResponse.status} ${payload}`);
  }

  return { ok: true, created: true, name };
}

export async function upsertPoints(points, collectionName = COLLECTION_NAME) {
  if (!QDRANT_URL) {
    throw new Error('QDRANT_URL is not configured.');
  }

  const name = normalizeCollectionName(collectionName);
  const response = await fetch(`${QDRANT_URL}/collections/${name}/points?wait=true`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify({ points }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Qdrant upsert failed: ${response.status} ${payload}`);
  }

  return response.json();
}

export async function searchPoints(queryVector, options = {}, collectionName = COLLECTION_NAME) {
  if (!QDRANT_URL) {
    throw new Error('QDRANT_URL is not configured.');
  }

  const name = normalizeCollectionName(collectionName);
  const payload = {
    vector: queryVector,
    limit: options.limit || 5,
    with_payload: options.withPayload ?? true,
    with_vectors: options.withVectors ?? false,
    filter: options.filter || undefined,
  };

  const response = await fetch(`${QDRANT_URL}/collections/${name}/points/search`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qdrant search failed: ${response.status} ${text}`);
  }

  return response.json();
}

export function getCollectionName() {
  return normalizeCollectionName();
}

export const qdrantService = {
  ensureCollection,
  upsertPoints,
  searchPoints,
  getCollectionName,
};

export default qdrantService;
