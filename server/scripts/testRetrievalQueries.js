import { searchRelevantSchemes } from '../src/services/rag/rag.service.js';
import prisma from '../src/lib/prisma.js';

const TEST_QUERIES = [
  {
    topic: '1. A farmer looking for income support',
    query: 'I am a farmer looking for income support and financial assistance',
  },
  {
    topic: '2. A student looking for scholarships',
    query: 'I am a student looking for scholarships and higher education financial support',
  },
  {
    topic: '3. An economically vulnerable family looking for health coverage',
    query: 'Economically vulnerable poor family looking for health insurance and hospital coverage',
  },
  {
    topic: '4. A user asking about a state-specific scheme',
    query: 'Government welfare schemes and financial assistance for residents of Assam',
  },
];

async function main() {
  console.log('═'.repeat(70));
  console.log('🔍 TESTING RAG RETRIEVAL ACROSS 500+ GOVERNMENT SCHEMES');
  console.log('═'.repeat(70));

  let passed = true;

  for (const item of TEST_QUERIES) {
    console.log(`\n📌 Query Topic: ${item.topic}`);
    console.log(`   User Prompt: "${item.query}"`);
    console.log('─'.repeat(70));

    const results = await searchRelevantSchemes(item.query, 3);

    if (!results || results.length === 0) {
      console.error('   ❌ No results retrieved!');
      passed = false;
      continue;
    }

    console.log(`   Retrieved ${results.length} relevant schemes:`);
    for (let i = 0; i < results.length; i++) {
      const match = results[i];
      const payload = match.payload || {};
      console.log(`   [#${i + 1}] Score: ${(match.score * 100).toFixed(1)}%`);
      console.log(`       Name:        ${payload.name}`);
      console.log(`       Slug:        ${payload.slug}`);
      console.log(`       Category:    ${payload.category}`);
      console.log(`       Ministry:    ${payload.ministry || 'N/A'}`);
      console.log(`       State:       ${payload.state || 'Central'}`);
      console.log(`       Status:      ${payload.status}`);
      console.log(`       OfficialUrl: ${payload.officialUrl || 'N/A'}`);
      console.log(`       SourceUrl:   ${payload.sourceUrl || 'N/A'}`);

      // Verify metadata presence
      if (!payload.name || !payload.slug || !payload.category) {
        console.error('       ⚠️ Missing core metadata fields!');
        passed = false;
      }
    }
  }

  console.log('\n' + '═'.repeat(70));
  if (passed) {
    console.log('✅ ALL RETRIEVAL TEST QUERIES RETURNED VALID RESULTS & SOURCE METADATA');
  } else {
    console.log('❌ SOME RETRIEVAL TEST QUERIES FAILED');
  }
  console.log('═'.repeat(70));
}

main()
  .catch((e) => {
    console.error('Fatal retrieval test error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
