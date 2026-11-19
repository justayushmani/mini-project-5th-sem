import prisma from '../../lib/prisma.js';

/**
 * Scheme Service
 * 
 * Handles all scheme-related database operations.
 * Controllers call this service — never access Prisma directly from controllers.
 */

// Standard include for full scheme details
const SCHEME_FULL_INCLUDE = {
  eligibility: true,
  benefits: true,
  documents: true,
  source: true,
};

// Lighter include for list views
const SCHEME_LIST_INCLUDE = {
  benefits: { take: 1 },  // Just the first benefit for preview
  source: { select: { sourceName: true, sourceUrl: true } },
};

/**
 * Helper to overlay translated fields if available
 */
function applyTranslation(scheme, language) {
  if (!scheme) return scheme;
  if (!language || language === 'en') {
    const { translations, ...rest } = scheme;
    return rest;
  }
  const translation = scheme.translations?.[0];
  if (!translation) {
    const { translations, ...rest } = scheme;
    return rest;
  }
  const { translations, ...rest } = scheme;
  return {
    ...rest,
    name: translation.name || rest.name,
    description: translation.description || rest.description,
    applicationProcess: translation.applicationProcess || rest.applicationProcess,
    isTranslated: true,
    translatedLanguage: translation.language,
  };
}

/**
 * Get paginated list of schemes with optional filters.
 */
export async function getSchemes({ page = 1, limit = 10, category, state, level, search, status = 'Active', language = 'en' }) {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 50);

  // Build dynamic where clause from filters
  const where = { status };
  if (category) where.category = category;
  if (state)    where.OR = [{ state }, { state: null }]; // Include Central (state=null) schemes too
  if (level)    where.level = level;
  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { ministry: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const include = {
    ...SCHEME_LIST_INCLUDE,
    ...(language && language !== 'en' ? { translations: { where: { language } } } : {}),
  };

  const [schemes, totalCount] = await Promise.all([
    prisma.scheme.findMany({
      where,
      include,
      skip,
      take,
      orderBy: { name: 'asc' },
    }),
    prisma.scheme.count({ where }),
  ]);

  return {
    schemes: schemes.map((s) => applyTranslation(s, language)),
    pagination: {
      page,
      limit: take,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
      hasNext: page * take < totalCount,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get a single scheme by ID with full details.
 */
export async function getSchemeById(id, language = 'en') {
  const scheme = await prisma.scheme.findUnique({
    where: { id },
    include: {
      ...SCHEME_FULL_INCLUDE,
      ...(language && language !== 'en' ? { translations: { where: { language } } } : {}),
    },
  });
  return applyTranslation(scheme, language);
}

/**
 * Get a single scheme by slug with full details.
 */
export async function getSchemeBySlug(slug, language = 'en') {
  const scheme = await prisma.scheme.findUnique({
    where: { slug },
    include: {
      ...SCHEME_FULL_INCLUDE,
      ...(language && language !== 'en' ? { translations: { where: { language } } } : {}),
    },
  });
  return applyTranslation(scheme, language);
}

/**
 * Get all distinct categories (for filter dropdowns).
 */
export async function getCategories() {
  const results = await prisma.scheme.findMany({
    where: { status: 'Active' },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return results.map((r) => r.category);
}

/**
 * Get all distinct states that have schemes.
 */
export async function getStates() {
  const results = await prisma.scheme.findMany({
    where: { status: 'Active', state: { not: null } },
    select: { state: true },
    distinct: ['state'],
    orderBy: { state: 'asc' },
  });
  return results.map((r) => r.state);
}
