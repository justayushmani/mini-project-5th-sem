import test from 'node:test';
import assert from 'node:assert';
import { normalizeValue } from '../src/constants/schemeVocabulary.js';
import { updateLanguageSchema } from '../src/validators/auth.validator.js';
import { getSchemeBySlug, getSchemes } from '../src/services/scheme/scheme.service.js';

test('Multilingual - Bengali & Hindi vocabulary normalization', () => {
  // Bengali occupation synonyms
  assert.strictEqual(normalizeValue('occupation', 'chashi'), 'Farmer');
  assert.strictEqual(normalizeValue('occupation', 'krishok'), 'Farmer');
  assert.strictEqual(normalizeValue('occupation', 'karigor'), 'Artisan / Craftsperson');
  assert.strictEqual(normalizeValue('occupation', 'shilpi'), 'Artisan / Craftsperson');
  assert.strictEqual(normalizeValue('occupation', 'grihini'), 'Homemaker');

  // Bengali state alias
  assert.strictEqual(normalizeValue('state', 'wb'), 'West Bengal');
  assert.strictEqual(normalizeValue('state', 'bengal'), 'West Bengal');
  assert.strictEqual(normalizeValue('state', 'paschim banga'), 'West Bengal');
  assert.strictEqual(normalizeValue('state', 'up'), 'Uttar Pradesh');
});

test('Multilingual - Language validator accepts en, hi, bn and rejects others', () => {
  assert.strictEqual(updateLanguageSchema.safeParse({ language: 'en' }).success, true);
  assert.strictEqual(updateLanguageSchema.safeParse({ language: 'hi' }).success, true);
  assert.strictEqual(updateLanguageSchema.safeParse({ language: 'bn' }).success, true);

  // Rejects invalid languages
  assert.strictEqual(updateLanguageSchema.safeParse({ language: 'hinglish' }).success, false);
  assert.strictEqual(updateLanguageSchema.safeParse({ language: 'fr' }).success, false);
  assert.strictEqual(updateLanguageSchema.safeParse({ language: '' }).success, false);
});

test('Multilingual - Scheme service returns translated content for hi and bn', async () => {
  // Test Hindi translation
  const hiScheme = await getSchemeBySlug('pm-kisan-samman-nidhi', 'hi');
  assert.ok(hiScheme, 'PM-KISAN should exist');
  assert.strictEqual(hiScheme.isTranslated, true);
  assert.strictEqual(hiScheme.translatedLanguage, 'hi');
  assert.match(hiScheme.name, /प्रधानमंत्री किसान सम्मान निधि/);

  // Test Bengali translation
  const bnScheme = await getSchemeBySlug('pm-kisan-samman-nidhi', 'bn');
  assert.ok(bnScheme, 'PM-KISAN should exist');
  assert.strictEqual(bnScheme.isTranslated, true);
  assert.strictEqual(bnScheme.translatedLanguage, 'bn');
  assert.match(bnScheme.name, /প্রধানমন্ত্রী কিষাণ সম্মান নিধি/);

  // Test English base content (no translation overlay)
  const enScheme = await getSchemeBySlug('pm-kisan-samman-nidhi', 'en');
  assert.ok(enScheme, 'PM-KISAN should exist');
  assert.strictEqual(enScheme.name, 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)');
});

test('Multilingual - getSchemes paginated list with Bengali translation', async () => {
  const result = await getSchemes({ page: 1, limit: 5, language: 'bn' });
  assert.ok(result.schemes.length > 0, 'Should return schemes');
  const translated = result.schemes.find((s) => s.slug === 'pm-kisan-samman-nidhi');
  assert.ok(translated, 'PM-KISAN should be present in results');
  assert.strictEqual(translated.isTranslated, true);
  assert.match(translated.name, /প্রধানমন্ত্রী কিষাণ/);
});
