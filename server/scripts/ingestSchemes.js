import prisma from '../src/lib/prisma.js';
import { chunkSchemeText, ingestSchemesToRAG } from '../src/services/rag/rag.service.js';
import { embedPassage, EMBEDDING_DIM, EMBEDDING_MODEL_ID } from '../src/services/rag/embedding.service.js';
import { generatePointId } from '../src/services/rag/qdrant.service.js';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  const schemes = await prisma.scheme.findMany({
    where: { status: 'Active' },
    include: {
      benefits: true,
      eligibility: true,
      documents: true,
    },
    orderBy: { slug: 'asc' },
  });

  if (isDryRun) {
    console.log('--- RAG INGEST (DRY RUN - No Qdrant calls) ---');
    console.log(`Active schemes fetched: ${schemes.length}`);
    console.log(`Embedding model: ${EMBEDDING_MODEL_ID} (dimension: ${EMBEDDING_DIM})\n`);

    let totalChunks = 0;

    for (const scheme of schemes) {
      const chunks = chunkSchemeText(scheme);
      totalChunks += chunks.length;

      console.log(`=== Scheme: ${scheme.name} (slug: ${scheme.slug}) ===`);
      console.log(`Chunks count: ${chunks.length}`);

      for (let i = 0; i < chunks.length; i += 1) {
        const text = chunks[i];
        const pointId = generatePointId(scheme.id, i);
        const vector = await embedPassage(text);

        console.log(`  Chunk ${i}:`);
        console.log(`    Point ID: ${pointId}`);
        console.log(`    Text Length: ${text.length} chars`);
        console.log(`    Vector Dimension: ${vector.length}`);
        console.log(`    Snippet: "${text.slice(0, 100).replace(/\n/g, ' ')}..."`);
      }
      console.log('');
    }

    console.log('--- DRY RUN SUMMARY ---');
    console.log(`Total Schemes: ${schemes.length}`);
    console.log(`Total Chunks: ${totalChunks}`);
    console.log(`Vector Dimension: ${EMBEDDING_DIM}`);
    console.log('✅ Dry run completed successfully without writing to Qdrant.');
    return;
  }

  const count = await ingestSchemesToRAG(schemes);
  console.log(`✅ Ingested ${count} scheme chunks to Qdrant.`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to ingest schemes:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
