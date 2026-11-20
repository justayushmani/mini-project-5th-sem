import prisma from '../src/lib/prisma.js';
import { translateScheme } from '../src/services/ai/translation.service.js';

async function main() {
  console.log('🚀 Starting pre-translation of top schemes...');
  const limit = 25;
  const schemes = await prisma.scheme.findMany({
    where: { status: 'Active' },
    take: limit,
    include: { translations: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${schemes.length} schemes to check.`);

  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i];
    console.log(`[${i + 1}/${schemes.length}] Checking: ${s.name}`);

    // Check Hindi
    const hasHi = s.translations.some((t) => t.language === 'hi');
    if (!hasHi) {
      console.log(`  Translating to Hindi...`);
      try {
        const hi = await translateScheme(s, 'hi');
        if (hi) {
          await prisma.schemeTranslation.upsert({
            where: { schemeId_language: { schemeId: s.id, language: 'hi' } },
            update: { ...hi },
            create: { schemeId: s.id, language: 'hi', ...hi },
          });
          console.log(`  ✅ Hindi saved`);
        }
      } catch (err) {
        console.warn(`  ⚠️ Failed Hindi: ${err.message}`);
      }
      // Brief pause to stay well within TPM limit
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Check Bengali
    const hasBn = s.translations.some((t) => t.language === 'bn');
    if (!hasBn) {
      console.log(`  Translating to Bengali...`);
      try {
        const bn = await translateScheme(s, 'bn');
        if (bn) {
          await prisma.schemeTranslation.upsert({
            where: { schemeId_language: { schemeId: s.id, language: 'bn' } },
            update: { ...bn },
            create: { schemeId: s.id, language: 'bn', ...bn },
          });
          console.log(`  ✅ Bengali saved`);
        }
      } catch (err) {
        console.warn(`  ⚠️ Failed Bengali: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  console.log('🎉 Finished pre-translation of top schemes!');
  await prisma.$disconnect();
}

main().catch(console.error);
