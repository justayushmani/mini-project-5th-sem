import test from 'node:test';
import assert from 'node:assert';
import { schemes } from '../prisma/schemeData.js';
import { embedPassage, embedQuery } from '../src/services/rag/embedding.service.js';

function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

test('Retrieval accuracy with Xenova/multilingual-e5-small across 5 seeded schemes', async () => {
  // 1. Embed the 5 seeded schemes in memory (passage text = name + description)
  const schemeEmbeddings = [];
  for (const scheme of schemes) {
    const text = `${scheme.name}. ${scheme.description}`;
    const vector = await embedPassage(text);
    schemeEmbeddings.push({ slug: scheme.slug, name: scheme.name, vector });
  }

  // 2. Define test queries and expected top-1 scheme slugs
  const testCases = [
    {
      query: 'I am a farmer, is there any income support scheme?',
      expectedSlug: 'pm-kisan-samman-nidhi', // PM-KISAN
    },
    {
      query: 'किसान के लिए पैसे की मदद',
      expectedSlug: 'pm-kisan-samman-nidhi', // PM-KISAN
    },
    {
      query: 'cooking gas connection for poor women',
      expectedSlug: 'pradhan-mantri-ujjwala-yojana', // Ujjwala
    },
    {
      query: 'free hospital treatment for my family',
      expectedSlug: 'ayushman-bharat-pm-jay', // PM-JAY
    },
    {
      query: 'I want financial help to build a house in my village',
      expectedSlug: 'pmay-gramin', // PMAY-G
    },
  ];

  for (const { query, expectedSlug } of testCases) {
    const queryVector = await embedQuery(query);

    const scored = schemeEmbeddings.map((s) => ({
      slug: s.slug,
      name: s.name,
      score: dotProduct(queryVector, s.vector),
    }));

    scored.sort((a, b) => b.score - a.score);
    const topMatch = scored[0];

    assert.strictEqual(
      topMatch.slug,
      expectedSlug,
      `Expected top-1 for query "${query}" to be ${expectedSlug}, but got ${topMatch.slug} (score: ${topMatch.score})`
    );
  }
});
