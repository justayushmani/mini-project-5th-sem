import env from '../src/config/env.js';
import { warmUpEmbeddings, EMBEDDING_MODEL_ID } from '../src/services/rag/embedding.service.js';

async function main() {
  console.log('🚀 Prefetching embedding model for deployment readiness...');
  console.log(`Model: ${EMBEDDING_MODEL_ID}`);
  console.log(`Target Cache Directory: ${env.embeddingCacheDir}`);

  const result = await warmUpEmbeddings();
  console.log(`✅ Model ${result.model} successfully downloaded and cached in ${result.elapsedMs}ms`);
}

main().catch((err) => {
  console.error('❌ Failed to prefetch embedding model:', err);
  process.exit(1);
});
