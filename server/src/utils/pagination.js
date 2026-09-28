/**
 * Pagination helper for list endpoints.
 * 
 * Usage in controllers:
 *   const { skip, take, page, limit } = parsePagination(req.query);
 *   const items = await prisma.scheme.findMany({ skip, take });
 *   return paginatedResponse(res, items, totalCount, page, limit);
 */

export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

export function paginatedResponse(res, data, totalCount, page, limit) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1,
    },
  });
}
