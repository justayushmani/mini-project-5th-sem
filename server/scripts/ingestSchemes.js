import prisma from '../src/lib/prisma.js';
import { ingestSchemesToRAG } from '../src/services/rag/rag.service.js';

async function main() {
  const schemes = await prisma.scheme.findMany({
    where: { status: 'Active' },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      state: true,
      ministry: true,
      officialUrl: true,
    },
  });

  const count = await ingestSchemesToRAG(schemes);
  console.log(`✅ Ingested ${count} schemes to Qdrant.`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to ingest schemes:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
