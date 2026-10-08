import crypto from 'crypto';
import env from '../../config/env.js';
import { EMBEDDING_DIM } from './embedding.service.js';

const QDRANT_URL = (env.qdrantUrl || '').replace(/\/+$/, '');
const QDRANT_API_KEY = env.qdrantApiKey || '';
const COLLECTION_NAME = env.qdrantCollection || 'yojana_schemes';

export function generatePointId(schemeId, chunkIndex) {
  const hash = crypto.createHash('sha1').update(`${schemeId}:${chunkIndex}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '5' + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join('-');
}

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

export async function getCollectionInfo(collectionName = COLLECTION_NAME) {
  if (!QDRANT_URL) {
    throw new Error('QDRANT_URL is not configured.');
  }

  const name = normalizeCollectionName(collectionName);
  const response = await fetch(`${QDRANT_URL}/collections/${name}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Qdrant collection check failed: ${response.status} ${payload}`);
  }

  return response.json();
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

  let created = false;
  if (!response.ok) {
    if (response.status !== 404) {
      const payload = await response.text();
      throw new Error(`Qdrant collection check failed: ${response.status} ${payload}`);
    }

    const createResponse = await fetch(`${QDRANT_URL}/collections/${name}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify({
        vectors: {
          size: EMBEDDING_DIM,
          distance: 'Cosine',
        },
      }),
    });

    if (!createResponse.ok) {
      const payload = await createResponse.text();
      throw new Error(`Qdrant collection creation failed: ${createResponse.status} ${payload}`);
    }
    created = true;
  }

  const indexResponse = await fetch(`${QDRANT_URL}/collections/${name}/index?wait=true`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify({
      field_name: 'schemeId',
      field_schema: 'keyword',
    }),
  });

  if (!indexResponse.ok) {
    const payload = await indexResponse.text();
    throw new Error(`Qdrant payload index creation failed: ${indexResponse.status} ${payload}`);
  }

  return created ? { ok: true, created: true, name } : { ok: true, name };
}

export async function deletePointsBySchemeId(schemeId, collectionName = COLLECTION_NAME) {
  if (!QDRANT_URL) {
    throw new Error('QDRANT_URL is not configured.');
  }

  const name = normalizeCollectionName(collectionName);
  const response = await fetch(`${QDRANT_URL}/collections/${name}/points/delete?wait=true`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      filter: {
        must: [
          {
            key: 'schemeId',
            match: { value: schemeId },
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Qdrant delete points failed: ${response.status} ${payload}`);
  }

  return response.json();
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

// Module-level cache for collections whose vector size has been verified to match EMBEDDING_DIM
const validatedCollections = new Set();

export async function searchPoints(queryVector, options = {}, collectionName = COLLECTION_NAME) {
  if (!QDRANT_URL) {
    throw new Error('QDRANT_URL is not configured.');
  }

  const name = normalizeCollectionName(collectionName);

  // If collection exists, verify its vector dimension matches EMBEDDING_DIM (at most once per collection)
  if (!validatedCollections.has(name)) {
    const info = await getCollectionInfo(name);
    if (info?.result?.config?.params?.vectors) {
      const vectorsConfig = info.result.config.params.vectors;
      const remoteSize = typeof vectorsConfig.size === 'number'
        ? vectorsConfig.size
        : Object.values(vectorsConfig)[0]?.size;
      if (remoteSize && remoteSize !== EMBEDDING_DIM) {
        throw new Error(`Qdrant collection '${name}' vector size (${remoteSize}) does not match EMBEDDING_DIM (${EMBEDDING_DIM}). Re-indexing required.`);
      }
      validatedCollections.add(name);
    }
  }

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
  getCollectionInfo,
  deletePointsBySchemeId,
  upsertPoints,
  searchPoints,
  getCollectionName,
  generatePointId,
};

export default qdrantService;
