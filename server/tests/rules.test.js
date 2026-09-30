import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { validateSchemeRules } from '../src/validators/schemeRules.validator.js';
import { evaluateScheme, evaluateRule, normalizeProfileSnapshot } from '../src/services/recommendation/recommendation.service.js';
import { schemes } from '../prisma/schemeData.js';
import { normalizeValue } from '../src/constants/schemeVocabulary.js';
import { diffRules, validateBackup } from '../scripts/updateSchemeRules.js';

test('Validator rejects each old bad rule', () => {
  const badCategory = {
    eligibility: [{ criteriaType: 'category', operator: 'in', value: 'SECC,BPL', description: 'Desc', isRequired: true }]
  };
  const err1 = validateSchemeRules(badCategory);
  assert.ok(err1.some(e => e.includes("value 'BPL' is invalid")));

  const badIncome = {
    eligibility: [{ criteriaType: 'annualIncome', operator: 'eq', value: 'BPL', description: 'Desc', isRequired: true }]
  };
  const err2 = validateSchemeRules(badIncome);
  assert.ok(err2.some(e => e.includes("value 'BPL' is invalid")));
  
  const badOldName = {
    eligibility: [{ criteriaType: 'income', operator: 'eq', value: '1000', description: 'Desc', isRequired: true }]
  };
  const err3 = validateSchemeRules(badOldName);
  assert.ok(err3.some(e => e.includes("is not in the allowed vocabulary")));
  
  const badOperator = {
    eligibility: [{ criteriaType: 'annualIncome', operator: 'magic', value: '1000', description: 'Desc', isRequired: true }]
  };
  const err4 = validateSchemeRules(badOperator);
  assert.ok(err4.some(e => e.includes("operator 'magic' is not allowed")));

  const badHousing = {
    eligibility: [{ criteriaType: 'housing', operator: 'eq', value: 'kutcha', description: 'Desc', isRequired: true }]
  };
  const err5 = validateSchemeRules(badHousing);
  assert.ok(err5.some(e => e.includes("is not in the allowed vocabulary")));

  const badArea = {
    eligibility: [{ criteriaType: 'area', operator: 'eq', value: 'rural', description: 'Desc', isRequired: true }]
  };
  // 'area' is valid now in vocabulary, so this doesn't fail on criteriaType. 
  // Let's add an invalid occupation instead for out-of-vocabulary enum:
  const badOccupation = {
    eligibility: [{ criteriaType: 'occupation', operator: 'eq', value: 'Software Engineer', description: 'Desc', isRequired: true }]
  };
  const err6 = validateSchemeRules(badOccupation);
  assert.ok(err6.some(e => e.includes("is invalid for field")));
});

test('Validator accepts all 5 rewritten schemes', () => {
  for (const scheme of schemes) {
    const err = validateSchemeRules(scheme);
    assert.deepEqual(err, [], `Failed for ${scheme.name}: ${err}`);
  }
});

test('Normalizer maps synonyms and nulls invalid enums', () => {
  assert.strictEqual(normalizeValue('occupation', 'kisan'), 'Farmer');
  assert.strictEqual(normalizeValue('gender', 'magic'), null); // invalid enum
  assert.strictEqual(normalizeValue('annualIncome', '1000'), 1000);
});

test('normalizeValue: numbers and state aliases', () => {
  assert.strictEqual(normalizeValue('annualIncome', '1,20,000'), 120000);
  assert.strictEqual(normalizeValue('annualIncome', '120000 rupees'), 120000);
  assert.strictEqual(normalizeValue('annualIncome', 'Rs. 60000'), 60000);
  assert.strictEqual(normalizeValue('annualIncome', 'abc'), null);
  
  assert.strictEqual(normalizeValue('state', 'up'), 'Uttar Pradesh');
  assert.strictEqual(normalizeValue('state', 'Delhi NCT'), 'Delhi');
  assert.strictEqual(normalizeValue('state', 'unknown state'), null);
});

test('normalizeProfileSnapshot: top-level wins, otherInfo fills, original state kept', () => {
  const profile = {
    state: 'Unknown Place',
    age: null,
    otherInfo: {
      age: 25,
      state: 'Delhi',
      annualIncome: '1,20,000'
    }
  };
  
  const norm = normalizeProfileSnapshot(profile);
  
  // top-level 'Unknown Place' wins over otherInfo.state ('Delhi')
  // state keepOriginal logic keeps 'Unknown Place' since it doesn't match enum
  assert.strictEqual(norm.state, 'Unknown Place');
  
  // otherInfo.age fills null top-level age
  assert.strictEqual(norm.age, 25);
  
  // otherInfo.annualIncome is applied and normalized
  assert.strictEqual(norm.annualIncome, 120000);
});

test('Matcher P1..P7 exact statuses', () => {
  const schemesWithId = schemes.map((s, i) => ({ ...s, id: i, eligibility: s.eligibility.create }));
  const getScheme = slug => schemesWithId.find(s => s.slug === slug);
  
  const pmKisan = getScheme('pm-kisan-samman-nidhi');
  const pmJay = getScheme('ayushman-bharat-pm-jay');
  const pmayG = getScheme('pmay-gramin');
  const pmuy = getScheme('pradhan-mantri-ujjwala-yojana');
  const pmVishwakarma = getScheme('pm-vishwakarma-yojana');
  
  const runProfile = (profile) => ({
    pmKisanStatus: evaluateScheme(pmKisan, profile).status,
    pmJayStatus: evaluateScheme(pmJay, profile).status,
    pmayGStatus: evaluateScheme(pmayG, profile).status,
    pmuyStatus: evaluateScheme(pmuy, profile).status,
    pmVishwakarmaStatus: evaluateScheme(pmVishwakarma, profile).status,
  });

  // P1
  const p1 = { age: 45, state: 'Uttar Pradesh', occupation: 'Farmer', annualIncome: 120000, gender: 'Male' };
  const r1 = runProfile(p1);
  assert.strictEqual(r1.pmKisanStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r1.pmJayStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r1.pmayGStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r1.pmuyStatus, 'NOT_ELIGIBLE');
  assert.strictEqual(r1.pmVishwakarmaStatus, 'NOT_ELIGIBLE');
  
  // P2
  const p2 = { age: 30, gender: 'Female', occupation: 'Homemaker', annualIncome: 60000, category: 'SC', area: 'rural' };
  const r2 = runProfile(p2);
  assert.strictEqual(r2.pmuyStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r2.pmJayStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r2.pmayGStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r2.pmKisanStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r2.pmVishwakarmaStatus, 'NOT_ELIGIBLE');

  // P3
  const p3 = { age: 35, gender: 'Male', occupation: 'Artisan / Craftsperson', annualIncome: 150000 };
  const r3 = runProfile(p3);
  assert.strictEqual(r3.pmVishwakarmaStatus, 'ELIGIBLE');
  assert.strictEqual(r3.pmKisanStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r3.pmuyStatus, 'NOT_ELIGIBLE');

  // P4
  const p4 = { age: 50, gender: 'Male', occupation: 'Farmer', annualIncome: 80000, landOwnership: false };
  assert.strictEqual(runProfile(p4).pmKisanStatus, 'NOT_ELIGIBLE');

  // P5
  const p5 = { age: 40, gender: 'Male', occupation: 'Farmer', landOwnership: true };
  assert.strictEqual(runProfile(p5).pmKisanStatus, 'ELIGIBLE');

  // P6
  const p6 = { age: 28, gender: 'Female', isBPL: true };
  assert.strictEqual(runProfile(p6).pmuyStatus, 'ELIGIBLE');

  // P7
  const p7 = { age: 50, gender: 'Male', area: 'rural', housingType: 'kutcha', isIncomeTaxPayer: false };
  assert.strictEqual(runProfile(p7).pmayGStatus, 'ELIGIBLE');
});

test('Optional failing rule does not cause NOT_ELIGIBLE', () => {
  const optionalFails = { id: 1, eligibility: [{ criteriaType: 'isBPL', operator: 'eq', value: 'true', isRequired: false }] };
  assert.strictEqual(evaluateScheme(optionalFails, { isBPL: false }).status, 'ELIGIBLE');
});

test('Optional unknown rule does not cause POSSIBLY_ELIGIBLE', () => {
  const optionalUnknown = { id: 1, eligibility: [{ criteriaType: 'isBPL', operator: 'eq', value: 'true', isRequired: false }] };
  assert.strictEqual(evaluateScheme(optionalUnknown, {}).status, 'ELIGIBLE');
});

test('PM-JAY is never ELIGIBLE for any profile', () => {
  const schemesWithId = schemes.map((s, i) => ({ ...s, id: i, eligibility: s.eligibility.create }));
  const pmJay = schemesWithId.find(s => s.slug === 'ayushman-bharat-pm-jay');
  const profile = { isBPL: true, age: 80, state: 'Delhi' };
  assert.notStrictEqual(evaluateScheme(pmJay, profile).status, 'ELIGIBLE');
  assert.strictEqual(evaluateScheme(pmJay, profile).status, 'POSSIBLY_ELIGIBLE');
});

test('updateSchemeRules backup validation and diff logic', () => {
  // test diffRules
  const current = [{ slug: 'pm-vishwakarma-yojana', name: 'Test', description: 'old', eligibility: [{ criteriaType: 'age', operator: 'gte', value: '18', isRequired: true }] }];
  const newS = [{ slug: 'pm-vishwakarma-yojana', name: 'Test', description: 'new', eligibility: { create: [{ criteriaType: 'age', operator: 'gte', value: '21', isRequired: true }] } }];
  
  const diff = diffRules(current, newS, ['pm-vishwakarma-yojana']);
  assert.ok(diff.includes('DESCRIPTION CHANGE'));
  assert.ok(diff.includes('RULES TO REMOVE'));
  assert.ok(diff.includes('age gte 18'));
  assert.ok(diff.includes('RULES TO ADD'));
  assert.ok(diff.includes('age gte 21'));

  // diffRules for non-allowed description slug
  const current2 = [{ slug: 'other-scheme', name: 'Test', description: 'old', eligibility: [] }];
  const newS2 = [{ slug: 'other-scheme', name: 'Test', description: 'new', eligibility: { create: [] } }];
  const diff2 = diffRules(current2, newS2, ['pm-vishwakarma-yojana']);
  assert.ok(!diff2.includes('DESCRIPTION CHANGE'));

  // test validateBackup
  const tmpDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  
  const file = path.join(tmpDir, 'test-backup.json');
  
  // too old
  fs.writeFileSync(file, JSON.stringify([]));
  const oldDate = new Date(Date.now() - 15 * 60 * 1000); // 15 min old
  fs.utimesSync(file, oldDate, oldDate);
  assert.strictEqual(validateBackup(file, ['test']).valid, false);

  // recent but missing slug
  fs.writeFileSync(file, JSON.stringify([{ slug: 'other' }]));
  assert.strictEqual(validateBackup(file, ['test']).valid, false);
  
  // recent but missing eligibility
  fs.writeFileSync(file, JSON.stringify([{ slug: 'test' }]));
  assert.strictEqual(validateBackup(file, ['test']).valid, false);

  // recent and valid
  fs.writeFileSync(file, JSON.stringify([{ slug: 'test', eligibility: [] }]));
  assert.strictEqual(validateBackup(file, ['test']).valid, true);
  
  // cleanup
  if (fs.existsSync(file)) fs.unlinkSync(file);
});
