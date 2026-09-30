import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { schemes } from '../prisma/seed.js';
import { validateSchemeRules } from '../src/validators/schemeRules.validator.js';

const prisma = new PrismaClient();

const BACKUP_DIR = path.join(process.cwd(), 'backups');

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

  if (isApply) {
    // 1. Validate all new rules
    for (const scheme of schemes) {
      const errors = validateSchemeRules(scheme);
      if (errors.length > 0) {
        console.error(`❌ Validation failed for ${scheme.slug}:`, errors);
        process.exit(1);
      }
    }

    // 2. Check for recent backup (last 10 minutes)
    if (!fs.existsSync(BACKUP_DIR)) {
      console.error('❌ No backup directory found. Run with --backup first.');
      process.exit(1);
    }
    
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('scheme-rules-') && f.endsWith('.json'));
    if (files.length === 0) {
      console.error('❌ No backup files found. Run with --backup first.');
      process.exit(1);
    }
    
    // Get most recent backup
    files.sort();
    const latestBackup = files[files.length - 1];
    const timestampStr = latestBackup.match(/scheme-rules-(\d+)\.json/)[1];
    const backupTime = parseInt(timestampStr, 10);
    
    if (Date.now() - backupTime > 10 * 60 * 1000) {
      console.error('❌ Latest backup is older than 10 minutes. Run with --backup again.');
      process.exit(1);
    }
    
    // 3. Apply inside transaction
    console.log('🔄 Applying new rules...');
    await prisma.$transaction(async (tx) => {
      const existingSchemes = await tx.scheme.findMany({
        where: { slug: { in: slugs } },
      });
      
      const schemeIdMap = {};
      for (const s of existingSchemes) {
        schemeIdMap[s.slug] = s.id;
      }
      
      for (const scheme of schemes) {
        const id = schemeIdMap[scheme.slug];
        if (!id) continue;
        
        await tx.schemeEligibility.deleteMany({
          where: { schemeId: id }
        });
        
        await tx.scheme.update({
          where: { id },
          data: {
            description: scheme.description,
            eligibility: {
              create: scheme.eligibility.create
            }
          }
        });
      }
    });
    
    console.log('✅ Rules successfully updated!');
    process.exit(0);
  }

  // DRY RUN
  console.log('--- DRY RUN (No writes) ---\n');
  const currentSchemes = await prisma.scheme.findMany({
    where: { slug: { in: slugs } },
    include: { eligibility: true },
  });

  for (const newScheme of schemes) {
    const current = currentSchemes.find(s => s.slug === newScheme.slug);
    if (!current) {
      console.log(`⚠️ Scheme not found in DB: ${newScheme.slug}`);
      continue;
    }
    
    console.log(`=== ${newScheme.name} ===`);
    console.log('CURRENT RULES:');
    current.eligibility.forEach(r => {
      console.log(`  - ${r.criteriaType} ${r.operator} ${r.value} (req: ${r.isRequired})`);
    });
    
    console.log('NEW RULES:');
    newScheme.eligibility.create.forEach(r => {
      console.log(`  - ${r.criteriaType} ${r.operator} ${r.value} (req: ${r.isRequired})`);
    });
    console.log('\n');
  }
}

// Allow importing without running main
export function diffRules(currentSchemes, newSchemes) {
  let diff = '';
  for (const newScheme of newSchemes) {
    const current = currentSchemes.find(s => s.slug === newScheme.slug);
    if (!current) continue;
    
    diff += `=== ${newScheme.name} ===\n`;
    diff += 'CURRENT RULES:\n';
    current.eligibility.forEach(r => {
      diff += `  - ${r.criteriaType} ${r.operator} ${r.value} (req: ${r.isRequired})\n`;
    });
    
    diff += 'NEW RULES:\n';
    newScheme.eligibility.create.forEach(r => {
      diff += `  - ${r.criteriaType} ${r.operator} ${r.value} (req: ${r.isRequired})\n`;
    });
    diff += '\n';
  }
  return diff;
}

if (process.argv[1] && process.argv[1].endsWith('updateSchemeRules.js')) {
  main()
    .catch((e) => {
      console.error('❌ Script failed:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
