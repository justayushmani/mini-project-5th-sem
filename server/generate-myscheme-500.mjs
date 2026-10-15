/**
 * Generate 500 MyScheme records in the nested shape used by the Yojana Saathi seed.
 *
 * Run from your project root with Node 22+:
 *   node /path/to/generate-myscheme-500.mjs
 *
 * Output:
 *   ./src/data/schemes.generated.js
 *
 * Source dataset (third-party structured extract derived from MyScheme):
 * https://github.com/Aryan-Pardeshi/gov-myscheme-dataset
 *
 * Important:
 * - Records are marked NeedsVerification; this script does not verify scheme status.
 * - `lastVerifiedAt` is null because the import date is not the same as an official
 *   verification date. If your Prisma schema requires a non-null date, make the
 *   field optional for imported records or add a separate importedAt field.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SOURCE_URL = 'https://raw.githubusercontent.com/Aryan-Pardeshi/gov-myscheme-dataset/main/gov_myscheme_data.json';
const COUNT = Number(process.argv[2] ?? 500);
const OUTPUT = path.resolve(process.argv[3] ?? './src/data/schemes.generated.js');

const STATE_NAMES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

function cleanText(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    if ('question' in value || 'answer' in value) {
      return [value.question ? `Q: ${cleanText(value.question)}` : '',
        value.answer ? `A: ${cleanText(value.answer)}` : ''].filter(Boolean).join('\n');
    }
    return Object.values(value).map(cleanText).filter(Boolean).join('\n');
  }
  let text = String(value).trim();
  if (!text) return '';
  // Some exports store arrays/objects as JSON strings.
  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) return cleanText(parsed);
    } catch { /* Keep original text when it is not valid JSON. */ }
  }
  return text
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function get(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
}

function cleanUrl(value) {
  let url = cleanText(value).trim();
  const markdown = url.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/i);
  if (markdown) url = markdown[1];
  const raw = url.match(/https?:\/\/[^\s)<>"']+/i);
  if (!raw) return '';
  return raw[0].replace(/[.,;]+$/, '');
}

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 110) || 'scheme';
}

function parseItems(raw) {
  const text = cleanText(raw);
  if (!text) return [];
  let rows = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  if (rows.length === 1 && rows[0].includes(';')) {
    rows = rows[0].split(/\s*;\s*/).map(s => s.trim()).filter(Boolean);
  }
  return rows.map(s => s
    .replace(/^(?:[-•*▪◦]+\s*|\(?\d{1,3}[.)]\s*|[a-zA-Z][.)]\s*)/, '')
    .trim()
  ).filter(Boolean);
}

function isCentral(row) {
  const level = get(row, 'Level', 'level').toLowerCase();
  return level.includes('central') || level.includes('union government');
}

function getState(row, scopeText) {
  if (isCentral(row)) return null;
  const text = `${scopeText} ${get(row, 'MyScheme URL', 'MyScheme URL ')} ${get(row, 'Scheme Name')}`.toLowerCase();
  return STATE_NAMES.find(name => text.includes(name.toLowerCase())) ?? null;
}

function categoryFrom(row) {
  const source = `${get(row, 'Tags / Categories', 'Category', 'category')} ${get(row, 'Scheme Name')}`.toLowerCase();
  const rules = [
    [/agricultur|farmer|crop|fisher|livestock|horticultur|dairy/, 'Agriculture'],
    [/health|medical|hospital|insurance|ayush|maternal|nutrition/, 'Health'],
    [/housing|awas|home|house construction|shelter/, 'Housing'],
    [/education|student|school|college|scholarship|fellowship|learning/, 'Education'],
    [/women|girl child|maternity|widow|anganwadi|child development/, 'Women and Child Development'],
    [/skill|training|apprentice|employment|job|livelihood|worker/, 'Skill Development'],
    [/pension|old age|disability|divyang|social security/, 'Social Welfare'],
    [/business|entrepreneur|msme|startup|industry|self.employ|loan|credit/, 'Business & Self-employed'],
    [/bank|financial inclusion|insurance|savings|microfinance/, 'Financial Services'],
    [/water|sanitation|toilet|cleanliness|jal jeevan/, 'Sanitation and Utilities'],
    [/energy|solar|electric|renewable|power/, 'Energy'],
    [/tribal|scheduled tribe|scheduled caste|sc\/st|minority|backward class/, 'Social Welfare'],
    [/sports|athlete|culture|art|tourism/, 'Sports and Culture'],
    [/transport|road|rail|vehicle|infrastructure/, 'Transport and Infrastructure'],
    [/digital|technology|science|innovation|internet/, 'Science and Technology'],
  ];
  for (const [regex, label] of rules) if (regex.test(source)) return label;
  const first = get(row, 'Tags / Categories', 'Category', 'category').split(/[,|;]/)[0].trim();
  return first || 'General Welfare';
}

function benefitType(text) {
  const t = text.toLowerCase();
  if (/insurance|health cover|hospitali[sz]ation/.test(t)) return 'Insurance';
  if (/training|course|upskill|stipend/.test(t)) return 'Training';
  if (/toolkit|equipment|machine|appliance/.test(t)) return 'Equipment';
  if (/subsid|rebate|discount/.test(t)) return 'Subsidy';
  if (/scholarship|fellowship|tuition|education/.test(t)) return 'Education';
  if (/pension|annuity/.test(t)) return 'Pension';
  if (/loan|credit|interest/.test(t)) return 'Credit';
  if (/cash|financial|income|grant|assistance|₹|rs\.?\s*\d/.test(t)) return 'Financial';
  return 'Other';
}

function extractAmount(text) {
  const patterns = [
    /(?:₹|Rs\.?\s*)(?:\s*)[\d,]+(?:\.\d+)?(?:\s*(?:lakh|lakhs|crore|crores|per\s+(?:month|year|annum|day)|\/\s*(?:month|year|annum|day)))?/i,
    /\b\d[\d,]*(?:\.\d+)?\s*(?:lakh|lakhs|crore|crores|per\s+(?:month|year|annum|day))\b/i,
    /\b\d+%\b/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return 'Not specified in source text';
}

function makeBenefitItems(raw) {
  const items = parseItems(raw);
  return items.map(item => ({
    benefitType: benefitType(item),
    description: item,
    amount: extractAmount(item),
  }));
}

function makeDocumentItems(raw) {
  return parseItems(raw).map(item => ({
    documentName: item,
    // MyScheme's extracted field is labelled "Documents Required". Optionality
    // is not consistently represented in the source export, so verify before use.
    isRequired: true,
  }));
}

function pickBalanced(rows, count) {
  const groups = new Map();
  for (const row of rows) {
    const key = categoryFrom(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  for (const group of groups.values()) group.sort((a, b) => get(a, 'Scheme Name').localeCompare(get(b, 'Scheme Name')));
  const keys = [...groups.keys()].sort((a, b) => groups.get(b).length - groups.get(a).length || a.localeCompare(b));
  const result = [];
  let cursor = 0;
  while (result.length < count) {
    let added = false;
    for (const key of keys) {
      const group = groups.get(key);
      if (cursor < group.length) {
        result.push(group[cursor]);
        added = true;
        if (result.length >= count) break;
      }
    }
    if (!added) break;
    cursor++;
  }
  return result;
}

function mapScheme(row, usedSlugs) {
  const name = get(row, 'Scheme Name', 'name', 'title');
  const datasetSlug = get(row, 'Scheme Slug', 'slug');
  let slug = slugify(datasetSlug || name);
  if (usedSlugs.has(slug)) slug = `${slug}-${slugify(get(row, 'State / UT / Ministry', 'Level') || 'scheme')}`;
  let suffix = 2;
  const base = slug;
  while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`;
  usedSlugs.add(slug);

  const level = isCentral(row) ? 'Central' : 'State';
  const scope = get(row, 'State / UT / Ministry', 'Ministry', 'Department');
  const ministry = scope || (level === 'Central' ? 'Central Government — department not specified in source' : 'State Government — department not specified in source');
  const state = getState(row, scope);
  const tags = get(row, 'Tags / Categories', 'Category', 'category');
  const category = categoryFrom(row);
  const sourceDescription = get(row, 'Description', 'description', 'Overview');
  const eligibility = get(row, 'Eligibility (General)', 'Eligibility Criteria', 'Eligibility Criteria ', 'Eligibility', 'eligibility');
  const exclusions = get(row, 'Exclusions / Ineligibility', 'Exclusions', 'Ineligibility');
  const benefitsText = get(row, 'Benefits', 'Benefit', 'benefits');
  const applicationProcess = get(row, 'Application Process', 'Application Mode', 'How to Apply') || 'Check the official scheme listing for the current application process and availability.';
  const docsRaw = get(row, 'Documents Required', 'Required Documents', 'Documents');
  const mySchemeUrl = cleanUrl(get(row, 'MyScheme URL', 'mySchemeUrl', 'Scheme URL'));
  const officialLink = cleanUrl(get(row, 'Official Link', 'Official URL', 'officialUrl'));
  const officialUrl = officialLink || mySchemeUrl || 'https://www.myscheme.gov.in/';
  const faqText = get(row, 'Frequently Asked Questions (FAQs)', 'FAQs', 'FAQ');
  const ragSections = [
    sourceDescription,
    eligibility ? `Eligibility criteria from source:\n${eligibility}` : '',
    exclusions ? `Exclusions / ineligibility from source:\n${exclusions}` : '',
    benefitsText ? `Benefits from source:\n${benefitsText}` : '',
    `Application process from source:\n${applicationProcess}`,
    docsRaw ? `Documents listed by source:\n${docsRaw}` : '',
    faqText ? `Frequently asked questions from source:\n${faqText}` : '',
    'Verification note: this record came from a third-party structured extract. Confirm eligibility, benefit amounts, documents, application steps, and current status on the linked official page before advising a citizen.'
  ].filter(Boolean);
  const description = ragSections.join('\n\n');

  return {
    name,
    slug,
    description,
    ministry,
    category,
    state,
    level,
    applicationProcess,
    officialUrl,
    status: 'NeedsVerification',
    lastVerifiedAt: null,
    eligibility: {
      create: eligibility ? [{
        // The source has free-text eligibility rather than consistently normalized
        // fields. Keep the exact text rather than inventing age/income rules.
        criteriaType: 'officialCheck',
        operator: 'eq',
        value: 'verify-on-official-source',
        description: eligibility + (exclusions ? ` Exclusions: ${exclusions}` : ''),
        isRequired: true,
      }] : [],
    },
    benefits: {
      create: makeBenefitItems(benefitsText),
    },
    documents: {
      create: makeDocumentItems(docsRaw),
    },
    source: {
      create: {
        sourceName: 'myScheme listing (third-party structured extract; verify before use)',
        sourceUrl: mySchemeUrl || officialUrl,
        lastVerifiedAt: null,
      },
    },
  };
}

async function main() {
  if (!Number.isInteger(COUNT) || COUNT < 1) throw new Error('COUNT must be a positive integer.');
  let data;
  if (process.env.MYSCHEME_JSON_PATH) {
    const localPath = path.resolve(process.env.MYSCHEME_JSON_PATH);
    console.log(`Reading local source dataset from ${localPath}`);
    data = JSON.parse(await readFile(localPath, 'utf8'));
  } else {
    console.log(`Downloading source dataset from ${SOURCE_URL}`);
    const response = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'YojanaSaathi-Scheme-Seed-Generator/1.0' } });
    if (!response.ok) throw new Error(`Source download failed: HTTP ${response.status}. Download gov_myscheme_data.json manually from the linked repository, then set MYSCHEME_JSON_PATH to its local path.`);
    data = await response.json();
  }
  const rows = Array.isArray(data) ? data : (Array.isArray(data?.schemes) ? data.schemes : []);
  if (!rows.length) throw new Error('The downloaded JSON did not contain a scheme array. Check the source file schema before importing.');

  const valid = rows.filter(row => get(row, 'Scheme Name', 'name', 'title'));
  const central = valid.filter(isCentral);
  const state = valid.filter(row => !isCentral(row));
  const centralCount = Math.min(Math.round(COUNT / 2), central.length);
  const stateCount = Math.min(COUNT - centralCount, state.length);
  let selected = [
    ...pickBalanced(central, centralCount),
    ...pickBalanced(state, stateCount),
  ];
  if (selected.length < COUNT) {
    const seen = new Set(selected.map(row => `${get(row, 'Scheme Name').toLowerCase()}|${get(row, 'State / UT / Ministry').toLowerCase()}`));
    for (const row of pickBalanced(valid, valid.length)) {
      const key = `${get(row, 'Scheme Name').toLowerCase()}|${get(row, 'State / UT / Ministry').toLowerCase()}`;
      if (!seen.has(key)) {
        selected.push(row);
        seen.add(key);
      }
      if (selected.length >= COUNT) break;
    }
  }
  selected = selected.slice(0, COUNT);
  if (selected.length < COUNT) throw new Error(`Only ${selected.length} usable unique-ish records found; requested ${COUNT}.`);

  const usedSlugs = new Set();
  const schemes = selected.map(row => mapScheme(row, usedSlugs));
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  const sourceHeader = `// GENERATED FILE — ${schemes.length} records mapped from a third-party structured extract of MyScheme listings.\n// Status and lastVerifiedAt are deliberately marked NeedsVerification/null.\n// Review current eligibility, benefits, documents and status on official pages before production use.\n\n`;
  const body = `export const schemes = ${JSON.stringify(schemes, null, 2)};\n\nexport default schemes;\n`;
  await writeFile(OUTPUT, sourceHeader + body, 'utf8');
  console.log(`Wrote ${schemes.length} records to ${OUTPUT}`);
  console.log(`Central: ${schemes.filter(s => s.level === 'Central').length}; State/UT: ${schemes.filter(s => s.level === 'State').length}`);
  console.log('Note: lastVerifiedAt is null. If Prisma rejects this, make that field nullable rather than pretending the import date is an official verification date.');
}

main().catch(error => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
