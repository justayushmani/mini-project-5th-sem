import prisma from '../../lib/prisma.js';
import logger from '../../utils/logger.js';

/**
 * Recommendation Service
 *
 * Rule-based eligibility matching engine.
 * For each scheme, checks the user profile against SchemeEligibility rows.
 *
 * Status logic:
 *   ELIGIBLE          — All required criteria matched
 *   POSSIBLY_ELIGIBLE — No conflicts found, but missing information
 *   NOT_ELIGIBLE      — At least one required criterion definitely fails
 *
 * This is the deterministic engine. Semantic/RAG relevance is layered on in Phase 9.
 */

/**
 * Generate recommendations for a given profile snapshot.
 * Returns { id, schemes: [...] } after persisting to DB.
 */
export async function generateRecommendations(userId, profileSnapshot) {
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
    evaluateScheme(scheme, profileSnapshot)
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
      profileSnapshot,
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
function evaluateScheme(scheme, profile) {
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
      failed.push(rule.description);
      if (rule.isRequired) score -= 50; // Heavy penalty for required-fail
    } else {
      // UNKNOWN — profile doesn't have this data
      missing.push(rule.description);
      if (!rule.isRequired) score += 2; // Slight bonus: not disqualified
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
function evaluateRule(rule, profile) {
  const { criteriaType, operator, value } = rule;

  // Map criteria type → profile field
  const profileValue = getProfileValue(criteriaType, profile);

  // If we don't have the data, we can't evaluate
  if (profileValue === null || profileValue === undefined) {
    return 'UNKNOWN';
  }

  switch (operator) {
    case 'eq':
      return normalizeStr(String(profileValue)) === normalizeStr(value) ? 'MATCH' : 'FAIL';

    case 'gte':
      return Number(profileValue) >= Number(value) ? 'MATCH' : 'FAIL';

    case 'lte':
      return Number(profileValue) <= Number(value) ? 'MATCH' : 'FAIL';

    case 'between': {
      const [min, max] = value.split(',').map(Number);
      const num = Number(profileValue);
      return num >= min && num <= max ? 'MATCH' : 'FAIL';
    }

    case 'in': {
      const options = value.split(',').map(normalizeStr);
      return options.includes(normalizeStr(String(profileValue))) ? 'MATCH' : 'FAIL';
    }

    case 'exclude':
      // "exclude" means the user should NOT match this value
      // For categories like "income_tax_payer" or "institutional", these are disqualifiers
      // If user doesn't match, they pass; if they do match, they fail
      return normalizeStr(String(profileValue)) === normalizeStr(value) ? 'FAIL' : 'MATCH';

    default:
      // Unknown operator — can't evaluate, treat as unknown
      return 'UNKNOWN';
  }
}

/**
 * Map a criteria type to the corresponding profile field value.
 */
function getProfileValue(criteriaType, profile) {
  const CRITERIA_MAP = {
    age:              profile.age,
    gender:           profile.gender,
    occupation:       profile.occupation,
    income:           profile.annualIncome,
    annualIncome:     profile.annualIncome,
    state:            profile.state,
    district:         profile.district,
    category:         profile.category,
    education:        profile.education,
    employmentStatus: profile.employmentStatus,
    landOwnership:    profile.landOwnership,
    disability:       profile.disability,
    maritalStatus:    profile.maritalStatus,
  };

  return CRITERIA_MAP[criteriaType] ?? null;
}

function normalizeStr(s) {
  return s?.toLowerCase().trim() ?? '';
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
