import prisma from '../../lib/prisma.js';
import logger from '../../utils/logger.js';
import { VOCABULARY, normalizeValue } from '../../constants/schemeVocabulary.js';

/**
 * Recommendation Service
 *
 * Rule-based eligibility matching engine.
 * For each scheme, checks the user profile against SchemeEligibility rows.
 *
 * Status logic:
 *   ELIGIBLE          — All required criteria matched
 *   POSSIBLY_ELIGIBLE — No conflicts found, but missing information for required criteria
 *   NOT_ELIGIBLE      — At least one required criterion definitely fails
 *
 * This is the deterministic engine. Semantic/RAG relevance is layered on in Phase 9.
 */

function normalizeProfileSnapshot(profile) {
  const norm = { ...profile };
  if (norm.otherInfo && typeof norm.otherInfo === 'object') {
    for (const [k, v] of Object.entries(norm.otherInfo)) {
      norm[k] = v;
    }
  }
  // normalize according to vocabulary
  for (const k of Object.keys(norm)) {
    if (VOCABULARY[k]) {
      norm[k] = normalizeValue(k, norm[k]);
    }
  }
  return norm;
}

/**
 * Generate recommendations for a given profile snapshot.
 * Returns { id, schemes: [...] } after persisting to DB.
 */
export async function generateRecommendations(userId, profileSnapshot) {
  const normalizedProfile = normalizeProfileSnapshot(profileSnapshot);

  // 1. Fetch all active schemes with their eligibility rules
  const schemes = await prisma.scheme.findMany({
    where: { status: 'Active' },
    include: {
      eligibility: true,
      benefits: { take: 2 },
      source: { select: { sourceName: true, sourceUrl: true } },
    },
  });

  // 2. Evaluate each scheme against the profile
  const evaluatedSchemes = schemes.map((scheme) =>
    evaluateScheme(scheme, normalizedProfile)
  );

  // 3. Sort: ELIGIBLE first, then POSSIBLY_ELIGIBLE, then NOT_ELIGIBLE
  const STATUS_ORDER = { ELIGIBLE: 0, POSSIBLY_ELIGIBLE: 1, NOT_ELIGIBLE: 2 };
  evaluatedSchemes.sort((a, b) => {
    const orderDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (orderDiff !== 0) return orderDiff;
    return b.relevanceScore - a.relevanceScore; // Higher score first within same status
  });

  // 4. Persist recommendation + recommendation_schemes
  const recommendation = await prisma.recommendation.create({
    data: {
      userId,
      profileSnapshot, // Store original snapshot, not normalized
      schemes: {
        create: evaluatedSchemes.map((ev) => ({
          schemeId: ev.schemeId,
          status: ev.status,
          relevanceScore: ev.relevanceScore,
          matchedCriteria: ev.matchedCriteria,
          missingCriteria: ev.missingCriteria,
          explanation: ev.explanation,
        })),
      },
    },
    include: {
      schemes: {
        include: {
          scheme: {
            include: {
              benefits: { take: 2 },
              source: { select: { sourceName: true, sourceUrl: true } },
            },
          },
        },
        orderBy: { relevanceScore: 'desc' },
      },
    },
  });

  logger.info(`Generated recommendation ${recommendation.id} for user ${userId}: ${evaluatedSchemes.length} schemes evaluated`);

  return recommendation;
}

/**
 * Evaluate a single scheme against the user profile.
 * Returns { schemeId, status, relevanceScore, matchedCriteria, missingCriteria, explanation }
 */
export function evaluateScheme(scheme, profile) { // exported for testing
  const matched = [];
  const missing = [];
  const failed  = [];
  let score = 0;

  for (const rule of scheme.eligibility) {
    const result = evaluateRule(rule, profile);

    if (result === 'MATCH') {
      matched.push(rule.description);
      score += rule.isRequired ? 20 : 10;
    } else if (result === 'FAIL') {
      if (rule.isRequired) {
        failed.push(rule.description);
        score -= 50; // Heavy penalty for required-fail
      } else {
        // Optional rule failed
        score -= 5;
      }
    } else {
      // UNKNOWN — profile doesn't have this data
      if (rule.isRequired) {
        missing.push(rule.description);
      } else {
        score += 2; // Slight bonus for optional unknown
      }
    }
  }

  // Also check state match (separate from eligibility rows)
  if (scheme.state) {
    if (profile.state) {
      if (profile.state.toLowerCase() === scheme.state.toLowerCase()) {
        matched.push(`Your state (${profile.state}) matches this scheme`);
        score += 15;
      } else {
        failed.push(`This scheme is for ${scheme.state}, but you are in ${profile.state}`);
        score -= 30;
      }
    } else {
      missing.push(`State information needed (scheme is for ${scheme.state})`);
    }
  } else {
    // Central scheme — available everywhere
    matched.push('Central scheme — available in all states');
    score += 5;
  }

  // Determine status
  let status;
  if (failed.length > 0) {
    status = 'NOT_ELIGIBLE';
  } else if (missing.length > 0) {
    status = 'POSSIBLY_ELIGIBLE';
  } else {
    status = 'ELIGIBLE';
  }

  // Build explanation
  const explanation = buildExplanation(scheme.name, status, matched, missing, failed);

  return {
    schemeId: scheme.id,
    status,
    relevanceScore: Math.max(0, Math.min(100, score)),
    matchedCriteria: matched,
    missingCriteria: missing,
    explanation,
  };
}

/**
 * Evaluate a single eligibility rule against the profile.
 * Returns 'MATCH' | 'FAIL' | 'UNKNOWN'
 */
export function evaluateRule(rule, profile) { // exported for testing
  const { criteriaType, operator, value } = rule;

  const profileValue = getProfileValue(criteriaType, profile);

  if (profileValue === null || profileValue === undefined || profileValue === 'UNKNOWN') {
    return 'UNKNOWN';
  }

  const def = VOCABULARY[criteriaType];
  const targetVal = normalizeValue(criteriaType, value);

  switch (operator) {
    case 'eq':
      if (def && def.type === 'boolean') {
         return profileValue === targetVal ? 'MATCH' : 'FAIL';
      }
      return String(profileValue).toLowerCase() === String(targetVal).toLowerCase() ? 'MATCH' : 'FAIL';

    case 'gte':
      return Number(profileValue) >= Number(targetVal) ? 'MATCH' : 'FAIL';

    case 'lte':
      return Number(profileValue) <= Number(targetVal) ? 'MATCH' : 'FAIL';

    case 'between': {
      let min, max;
      if (Array.isArray(value)) {
        [min, max] = value.map(Number);
      } else {
        [min, max] = String(value).split(',').map(Number);
      }
      const num = Number(profileValue);
      return num >= min && num <= max ? 'MATCH' : 'FAIL';
    }

    case 'in': {
      let options = Array.isArray(value) ? value : String(value).split(',');
      options = options.map(v => {
        const n = normalizeValue(criteriaType, v);
        return def && def.type === 'boolean' ? n : String(n).toLowerCase();
      });
      const pv = def && def.type === 'boolean' ? profileValue : String(profileValue).toLowerCase();
      return options.includes(pv) ? 'MATCH' : 'FAIL';
    }

    case 'exclude': {
      let options = Array.isArray(value) ? value : String(value).split(',');
      options = options.map(v => {
        const n = normalizeValue(criteriaType, v);
        return def && def.type === 'boolean' ? n : String(n).toLowerCase();
      });
      const pv = def && def.type === 'boolean' ? profileValue : String(profileValue).toLowerCase();
      return options.includes(pv) ? 'FAIL' : 'MATCH';
    }

    default:
      return 'UNKNOWN';
  }
}

/**
 * Map a criteria type to the corresponding profile field value.
 */
function getProfileValue(criteriaType, profile) {
  if (criteriaType === 'officialCheck') {
    return 'UNKNOWN'; // A profile can never confirm officialCheck
  }
  if (!VOCABULARY[criteriaType]) {
    logger.warn(`Unknown criteriaType encountered: ${criteriaType}`);
    return 'UNKNOWN';
  }
  return profile[criteriaType];
}

/**
 * Build a human-readable explanation for why a scheme was recommended.
 */
function buildExplanation(schemeName, status, matched, missing, failed) {
  const parts = [];

  if (status === 'ELIGIBLE') {
    parts.push(`Based on your profile, you appear to meet all the known eligibility criteria for ${schemeName}.`);
  } else if (status === 'POSSIBLY_ELIGIBLE') {
    parts.push(`You may be eligible for ${schemeName}, but we need more information to confirm.`);
  } else {
    parts.push(`Based on your profile, you may not be eligible for ${schemeName}.`);
  }

  if (matched.length > 0) {
    parts.push('\nMatching criteria:');
    matched.forEach((m) => parts.push(`✓ ${m}`));
  }

  if (missing.length > 0) {
    parts.push('\nInformation still needed:');
    missing.forEach((m) => parts.push(`? ${m}`));
  }

  if (failed.length > 0) {
    parts.push('\nDoes not match:');
    failed.forEach((f) => parts.push(`✗ ${f}`));
  }

  return parts.join('\n');
}

/**
 * Get a specific recommendation by ID (with all scheme details).
 */
export async function getRecommendationById(recommendationId, userId) {
  return prisma.recommendation.findFirst({
    where: { id: recommendationId, userId },
    include: {
      schemes: {
        include: {
          scheme: {
            include: {
              benefits: { take: 2 },
              source: { select: { sourceName: true, sourceUrl: true } },
            },
          },
        },
        orderBy: { relevanceScore: 'desc' },
      },
    },
  });
}

/**
 * Get recommendation history for a user.
 */
export async function getRecommendationHistory(userId) {
  return prisma.recommendation.findMany({
    where: { userId },
    include: {
      schemes: {
        take: 3, // Preview: top 3 schemes per recommendation
        orderBy: { relevanceScore: 'desc' },
        include: {
          scheme: { select: { id: true, name: true, category: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}
