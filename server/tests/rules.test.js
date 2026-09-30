import test from 'node:test';
import assert from 'node:assert';
import { validateSchemeRules } from '../src/validators/schemeRules.validator.js';
import { evaluateScheme, evaluateRule } from '../src/services/recommendation/recommendation.service.js';
import { schemes } from '../prisma/seed.js';
import { normalizeValue } from '../src/constants/schemeVocabulary.js';
import { diffRules } from '../scripts/updateSchemeRules.js';

test('Validator rejects bad rules', () => {
  const badCategory = {
    eligibility: [{ criteriaType: 'category', operator: 'in', value: 'SECC,BPL', description: 'Desc', isRequired: true }]
  };
  const err1 = validateSchemeRules(badCategory);
  assert.ok(err1.length > 0);

  const badIncome = {
    eligibility: [{ criteriaType: 'annualIncome', operator: 'eq', value: 'BPL', description: 'Desc', isRequired: true }]
  };
  const err2 = validateSchemeRules(badIncome);
  assert.ok(err2.length > 0);
  
  const badOldName = {
    eligibility: [{ criteriaType: 'income', operator: 'eq', value: '1000', description: 'Desc', isRequired: true }]
  };
  const err3 = validateSchemeRules(badOldName);
  assert.ok(err3.length > 0);
  
  const badOperator = {
    eligibility: [{ criteriaType: 'annualIncome', operator: 'magic', value: '1000', description: 'Desc', isRequired: true }]
  };
  const err4 = validateSchemeRules(badOperator);
  assert.ok(err4.length > 0);
});

test('Validator accepts all 5 rewritten schemes', () => {
  for (const scheme of schemes) {
    const err = validateSchemeRules(scheme);
    assert.deepEqual(err, [], `Failed for ${scheme.name}: ${err}`);
  }
});

test('Normalizer logic', () => {
  assert.strictEqual(normalizeValue('occupation', 'kisan'), 'Farmer');
  assert.strictEqual(normalizeValue('gender', 'magic'), null);
  assert.strictEqual(normalizeValue('annualIncome', '1000'), 1000);
});

test('Matcher tests', () => {
  const schemesWithId = schemes.map((s, i) => ({ ...s, id: i, eligibility: s.eligibility.create }));
  const getScheme = slug => schemesWithId.find(s => s.slug === slug);
  
  const pmKisan = getScheme('pm-kisan-samman-nidhi');
  const pmJay = getScheme('ayushman-bharat-pm-jay');
  const pmayG = getScheme('pmay-gramin');
  const pmuy = getScheme('pradhan-mantri-ujjwala-yojana');
  const pmVishwakarma = getScheme('pm-vishwakarma-yojana');
  
  // Helper to run
  const runProfile = (profile) => ({
    pmKisanStatus: evaluateScheme(pmKisan, profile).status,
    pmJayStatus: evaluateScheme(pmJay, profile).status,
    pmayGStatus: evaluateScheme(pmayG, profile).status,
    pmuyStatus: evaluateScheme(pmuy, profile).status,
    pmVishwakarmaStatus: evaluateScheme(pmVishwakarma, profile).status,
  });

  const p1 = { age: 45, state: 'Uttar Pradesh', occupation: 'Farmer', annualIncome: 120000, gender: 'Male' };
  const r1 = runProfile(p1);
  assert.strictEqual(r1.pmKisanStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r1.pmJayStatus, 'ELIGIBLE'); // because optional unknown does not make it possibly_eligible
  assert.strictEqual(r1.pmayGStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r1.pmuyStatus, 'NOT_ELIGIBLE');
  assert.strictEqual(r1.pmVishwakarmaStatus, 'NOT_ELIGIBLE');
  
  const p2 = { age: 30, gender: 'Female', occupation: 'Homemaker', annualIncome: 60000, category: 'SC', area: 'rural' };
  const r2 = runProfile(p2);
  assert.strictEqual(r2.pmuyStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r2.pmJayStatus, 'ELIGIBLE');
  assert.strictEqual(r2.pmayGStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r2.pmKisanStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r2.pmVishwakarmaStatus, 'NOT_ELIGIBLE');

  const p3 = { age: 35, gender: 'Male', occupation: 'Artisan / Craftsperson', annualIncome: 150000 };
  const r3 = runProfile(p3);
  assert.strictEqual(r3.pmVishwakarmaStatus, 'ELIGIBLE');
  assert.strictEqual(r3.pmKisanStatus, 'POSSIBLY_ELIGIBLE');
  assert.strictEqual(r3.pmuyStatus, 'NOT_ELIGIBLE');

  const p4 = { age: 50, gender: 'Male', occupation: 'Farmer', annualIncome: 80000, landOwnership: false };
  assert.strictEqual(runProfile(p4).pmKisanStatus, 'NOT_ELIGIBLE');

  const p5 = { age: 40, gender: 'Male', occupation: 'Farmer', landOwnership: true };
  assert.strictEqual(runProfile(p5).pmKisanStatus, 'ELIGIBLE');

  const p6 = { age: 28, gender: 'Female', isBPL: true };
  assert.strictEqual(runProfile(p6).pmuyStatus, 'ELIGIBLE');

  const p7 = { age: 50, gender: 'Male', area: 'rural', housingType: 'kutcha', isIncomeTaxPayer: false };
  assert.strictEqual(runProfile(p7).pmayGStatus, 'ELIGIBLE');
  
  // Optional rule that fails must NOT make a scheme NOT_ELIGIBLE.
  const optionalFails = { id: 1, eligibility: [{ criteriaType: 'isBPL', operator: 'eq', value: 'true', isRequired: false }] };
  assert.strictEqual(evaluateScheme(optionalFails, { isBPL: false }).status, 'ELIGIBLE');
});

test('Dry run script test', () => {
  const current = [{ slug: 'test', name: 'Test', eligibility: [{ criteriaType: 'age', operator: 'gte', value: '18', isRequired: true }] }];
  const newS = [{ slug: 'test', name: 'Test', eligibility: { create: [{ criteriaType: 'age', operator: 'gte', value: '21', isRequired: true }] } }];
  
  const diff = diffRules(current, newS);
  assert.ok(diff.includes('=== Test ==='));
  assert.ok(diff.includes('age gte 18'));
  assert.ok(diff.includes('age gte 21'));
});
