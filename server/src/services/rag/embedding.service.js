import env from '../../config/env.js';
import logger from '../../utils/logger.js';

export const EMBEDDING_DIM = 384;
export const EMBEDDING_MODEL_ID = env.embeddingModel || 'Xenova/multilingual-e5-small';

let pipelinePromise = null;

export function getEmbeddingPipeline() {
  if (!pipelinePromise) {
    // Lazily load @huggingface/transformers and initialize the pipeline inside a cached promise.
    // If either the dynamic import or model loading fails, clear pipelinePromise so subsequent calls retry.
    pipelinePromise = (async () => {
      const { pipeline, env: hfEnv } = await import('@huggingface/transformers');
      if (env.embeddingCacheDir) {
        hfEnv.cacheDir = env.embeddingCacheDir;
      }
      return await pipeline('feature-extraction', EMBEDDING_MODEL_ID, {
        dtype: 'q8',
      });
    })().catch((err) => {
      pipelinePromise = null;
      throw err;
    });
  }
  return pipelinePromise;
}

export async function warmUpEmbeddings() {
  const startTime = performance.now();
  await getEmbeddingPipeline();
  const elapsed = (performance.now() - startTime).toFixed(1);
  logger.info(`Embedding model ${EMBEDDING_MODEL_ID} warmed up in ${elapsed}ms`);
  return { model: EMBEDDING_MODEL_ID, elapsedMs: Number(elapsed) };
}

export async function embedQuery(text) {
  const pipe = await getEmbeddingPipeline();
  const input = `query: ${String(text ?? '').trim()}`;
  const output = await pipe(input, {
    pooling: 'mean',
    normalize: true,
    truncation: true,
    max_length: 512,
  });
  return Array.from(output.data);
}

export async function embedPassage(text) {
  const pipe = await getEmbeddingPipeline();
  const input = `passage: ${String(text ?? '').trim()}`;
  const output = await pipe(input, {
    pooling: 'mean',
    normalize: true,
    truncation: true,
    max_length: 512,
  });
  return Array.from(output.data);
}

export async function embedPassages(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }
  const pipe = await getEmbeddingPipeline();
  const results = [];
  for (const text of texts) {
    const input = `passage: ${String(text ?? '').trim()}`;
    const output = await pipe(input, {
      pooling: 'mean',
      normalize: true,
      truncation: true,
      max_length: 512,
    });
    results.push(Array.from(output.data));
  }
  return results;
}

export const embeddingService = {
  embedQuery,
  embedPassage,
  embedPassages,
  warmUpEmbeddings,
  EMBEDDING_DIM,
  EMBEDDING_MODEL_ID,
};

export default embeddingService;
