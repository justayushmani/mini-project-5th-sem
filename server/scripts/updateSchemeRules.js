import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { schemes } from '../prisma/schemeData.js';
import { validateSchemeRules } from '../src/validators/schemeRules.validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

const prisma = new PrismaClient();

export const DESCRIPTION_UPDATE_SLUGS = ['pm-vishwakarma-yojana'];

export function validateBackup(backupPath, schemeSlugs, maxAgeMs = 10 * 60 * 1000) {
  if (!fs.existsSync(backupPath)) {
    return { valid: false, error: 'Backup file does not exist.' };
  }

  const stat = fs.statSync(backupPath);
  if (Date.now() - stat.mtimeMs > maxAgeMs) {
    return { valid: false, error: 'Latest backup is older than 10 minutes. Run with --backup again.' };
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  } catch (e) {
    return { valid: false, error: 'Backup file is not valid JSON.' };
  }

  for (const slug of schemeSlugs) {
    const scheme = data.find(s => s.slug === slug);
    if (!scheme) {
      return { valid: false, error: `Backup is missing data for slug: ${slug}` };
    }
    if (!Array.isArray(scheme.eligibility)) {
      return { valid: false, error: `Backup for slug ${slug} is missing the eligibility array.` };
    }
  }

  return { valid: true };
}

export function diffRules(currentSchemes, newSchemes, descriptionSlugs = DESCRIPTION_UPDATE_SLUGS) {
  let diff = '';
  for (const newScheme of newSchemes) {
    const current = currentSchemes.find(s => s.slug === newScheme.slug);
    if (!current) continue;
    
    diff += `=== ${newScheme.name} ===\n`;
    
    if (descriptionSlugs.includes(newScheme.slug) && current.description !== newScheme.description) {
      diff += `DESCRIPTION CHANGE:\n- ${current.description}\n+ ${newScheme.description}\n\n`;
    }

    const currentRules = current.eligibility || [];
    const newRules = newScheme.eligibility.create || [];

    const stringifyRule = r => `${r.criteriaType} ${r.operator} ${r.value} (req: ${r.isRequired})`;

    const currentStrs = currentRules.map(stringifyRule);
    const newStrs = newRules.map(stringifyRule);

    const added = newRules.filter(r => !currentStrs.includes(stringifyRule(r)));
    const removed = currentRules.filter(r => !newStrs.includes(stringifyRule(r)));
    const unchanged = currentRules.filter(r => newStrs.includes(stringifyRule(r)));

    if (removed.length > 0) {
      diff += 'RULES TO REMOVE:\n';
      removed.forEach(r => diff += `  - ${stringifyRule(r)}\n`);
    }
    
    if (added.length > 0) {
      diff += 'RULES TO ADD:\n';
      added.forEach(r => diff += `  + ${stringifyRule(r)}\n`);
    }

    if (unchanged.length > 0) {
      diff += 'UNCHANGED RULES:\n';
      unchanged.forEach(r => diff += `    ${stringifyRule(r)}\n`);
    }
    
    diff += '\n';
  }
  return diff.trim();
}

async function main() {
  const args = process.argv.slice(2);
  const isBackup = args.includes('--backup');
  const isApply = args.includes('--apply');

  const slugs = schemes.map(s => s.slug);
  
  if (isBackup) {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const currentSchemes = await prisma.scheme.findMany({
      where: { slug: { in: slugs } },
      include: { eligibility: true },
    });
    
    const timestamp = Date.now();
    const backupPath = path.join(BACKUP_DIR, `scheme-rules-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(currentSchemes, null, 2));
    console.log(`✅ Backup created at: ${backupPath}`);
    process.exit(0);
  }

  const currentSchemes = await prisma.scheme.findMany({
    where: { slug: { in: slugs } },
    include: { eligibility: true },
  });

  const missingSlugs = slugs.filter(slug => !currentSchemes.find(s => s.slug === slug));
  if (missingSlugs.length > 0) {
    console.error(`❌ ABORT: The following schemes from schemeData are missing in the DB: ${missingSlugs.join(', ')}`);
    process.exit(1);
  }

  if (isApply) {
    // 1. Validate all new rules
    for (const scheme of schemes) {
      const errors = validateSchemeRules(scheme);
      if (errors.length > 0) {
        console.error(`❌ Validation failed for ${scheme.slug}:`, errors);
        process.exit(1);
      }
    }

    // 2. Check for recent backup
    if (!fs.existsSync(BACKUP_DIR)) {
      console.error('❌ No backup directory found. Run with --backup first.');
      process.exit(1);
    }
    
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('scheme-rules-') && f.endsWith('.json'));
    if (files.length === 0) {
      console.error('❌ No backup files found. Run with --backup first.');
      process.exit(1);
    }
    
    files.sort();
    const latestBackup = files[files.length - 1];
    const backupPath = path.join(BACKUP_DIR, latestBackup);
    
    const backupValidation = validateBackup(backupPath, slugs);
    if (!backupValidation.valid) {
      console.error(`❌ Backup validation failed: ${backupValidation.error}`);
      process.exit(1);
    }
    
    // 3. Apply inside transaction
    console.log('🔄 Applying new rules...');
    await prisma.$transaction(async (tx) => {
      for (const scheme of schemes) {
        const id = currentSchemes.find(s => s.slug === scheme.slug).id;
        
        await tx.schemeEligibility.deleteMany({
          where: { schemeId: id }
        });
        
        const updateData = {
          eligibility: {
            create: scheme.eligibility.create
          }
        };

        if (DESCRIPTION_UPDATE_SLUGS.includes(scheme.slug)) {
          updateData.description = scheme.description;
        }
        
        await tx.scheme.update({
          where: { id },
          data: updateData
        });
      }
    }, { maxWait: 10000, timeout: 30000 });
    
    console.log('✅ Rules successfully updated!');
    process.exit(0);
  }

  // DRY RUN
  console.log('--- DRY RUN (No writes) ---\n');
  const diffOutput = diffRules(currentSchemes, schemes, DESCRIPTION_UPDATE_SLUGS);
  console.log(diffOutput);
}

if (process.argv[1] && process.argv[1].endsWith('updateSchemeRules.js')) {
  main()
    .catch((e) => {
      console.error('❌ Script failed:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
