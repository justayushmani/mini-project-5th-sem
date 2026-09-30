import { z } from 'zod';
import { VOCABULARY, ALLOWED_OPERATORS, normalizeValue } from '../constants/schemeVocabulary.js';

export function validateSchemeRules(schemeObject) {
  const errors = [];
  
  let rules = schemeObject?.eligibility;
  if (rules && typeof rules === 'object' && Array.isArray(rules.create)) {
    rules = rules.create;
  }

  if (!Array.isArray(rules)) {
    return ["Scheme object must contain an 'eligibility' array."];
  }

  rules.forEach((rule, index) => {
    const context = `Rule ${index + 1} (${rule.criteriaType})`;

    if (!rule.criteriaType) {
      errors.push(`${context}: criteriaType is required.`);
      return;
    }

    if (!VOCABULARY[rule.criteriaType]) {
      errors.push(`${context}: criteriaType '${rule.criteriaType}' is not in the allowed vocabulary.`);
      return;
    }

    if (!ALLOWED_OPERATORS.includes(rule.operator)) {
      errors.push(`${context}: operator '${rule.operator}' is not allowed.`);
    }

    if (rule.criteriaType === 'officialCheck') {
      if (rule.operator !== 'eq' || rule.value !== 'confirmed') {
        errors.push(`${context}: officialCheck must have operator 'eq' and value 'confirmed'.`);
      }
      if (rule.isRequired !== true) {
        errors.push(`${context}: officialCheck must be required (isRequired: true).`);
      }
    }

    if (typeof rule.description !== 'string' || rule.description.trim() === '') {
      errors.push(`${context}: description must be a non-empty string.`);
    }

    if (typeof rule.isRequired !== 'boolean') {
      errors.push(`${context}: isRequired must be a boolean.`);
    }

    const fieldDef = VOCABULARY[rule.criteriaType];

    // Validate operator against field type
    if (fieldDef.type === 'enum' || fieldDef.type === 'boolean' || fieldDef.type === 'string') {
      if (['gte', 'lte', 'between'].includes(rule.operator)) {
        errors.push(`${context}: operator '${rule.operator}' is not allowed for field type '${fieldDef.type}'.`);
      }
    }

    // Validate values
    if (rule.operator === 'between') {
      if (!Array.isArray(rule.value) || rule.value.length !== 2) {
        errors.push(`${context}: 'between' operator requires an array of 2 values.`);
      } else {
        if (fieldDef.type === 'number') {
          if (isNaN(Number(rule.value[0])) || isNaN(Number(rule.value[1]))) {
            errors.push(`${context}: values for 'between' must be numbers.`);
          }
        }
      }
    } else if (rule.operator === 'in' || rule.operator === 'exclude') {
      const options = Array.isArray(rule.value) ? rule.value : (typeof rule.value === 'string' ? rule.value.split(',') : null);
      if (!options) {
        errors.push(`${context}: '${rule.operator}' operator requires an array or comma-separated string.`);
      } else {
        options.forEach(v => {
          const norm = normalizeValue(rule.criteriaType, v);
          if (norm === null && v !== null && v !== '') {
            errors.push(`${context}: value '${v}' is invalid for field '${rule.criteriaType}'.`);
          }
        });
      }
    } else { // eq, gte, lte
      const norm = normalizeValue(rule.criteriaType, rule.value);
      if (norm === null && rule.value !== null) {
        errors.push(`${context}: value '${rule.value}' is invalid for field '${rule.criteriaType}'.`);
      }
    }
  });

  return errors;
}
