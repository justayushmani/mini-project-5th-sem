/**
 * Fix specific malformed URLs found during validation.
 * - URLs with trailing "]" characters
 * - URLs with "]" followed by text
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FILE = path.resolve('./src/data/schemes.generated.js');

async function main() {
  const mod = await import(`file://${FILE.replace(/\\/g, '/')}`);
  const schemes = mod.schemes;
  let fixCount = 0;

  for (const scheme of schemes) {
    // Fix officialUrl
    if (scheme.officialUrl && (scheme.officialUrl.includes('[') || scheme.officialUrl.includes(']'))) {
      const cleaned = scheme.officialUrl.replace(/[\[\]].*/g, '').replace(/[\[\]]$/g, '');
      console.log(`Fixed officialUrl for ${scheme.slug}: "${scheme.officialUrl}" -> "${cleaned}"`);
      scheme.officialUrl = cleaned;
      fixCount++;
    }
    // Fix sourceUrl
    if (scheme.source?.create?.sourceUrl) {
      const su = scheme.source.create.sourceUrl;
      if (su.includes('[') || su.includes(']')) {
        const cleaned = su.replace(/[\[\]].*/g, '').replace(/[\[\]]$/g, '');
        console.log(`Fixed sourceUrl for ${scheme.slug}: "${su}" -> "${cleaned}"`);
        scheme.source.create.sourceUrl = cleaned;
        fixCount++;
      }
    }
  }

  // Rewrite the file
  const sourceHeader = `// GENERATED FILE — ${schemes.length} records mapped from a third-party structured extract of MyScheme listings.\n// Status and lastVerifiedAt are deliberately marked NeedsVerification/null.\n// Review current eligibility, benefits, documents and status on official pages before production use.\n\n`;
  const body = `export const schemes = ${JSON.stringify(schemes, null, 2)};\n\nexport default schemes;\n`;
  await writeFile(FILE, sourceHeader + body, 'utf8');
  console.log(`\nFixed ${fixCount} URL(s). File rewritten.`);
}

main().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
