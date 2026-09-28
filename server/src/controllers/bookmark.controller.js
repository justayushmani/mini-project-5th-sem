import prisma from '../lib/prisma.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// POST /api/bookmarks
export async function addBookmark(req, res, next) {
  try {
    const { schemeId } = req.body;
    if (!schemeId) {
      return errorResponse(res, 'schemeId is required', 400);
    }

    // Verify scheme exists
    const scheme = await prisma.scheme.findUnique({ where: { id: schemeId } });
    if (!scheme) {
      return errorResponse(res, 'Scheme not found', 404);
    }

    // Upsert prevents the unique constraint violation — idempotent
    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_schemeId: {
          userId: req.user.id,
          schemeId,
        },
      },
      update: {}, // Already exists — do nothing
      create: {
        userId: req.user.id,
        schemeId,
      },
      include: {
        scheme: {
          select: { id: true, name: true, slug: true, category: true },
        },
      },
    });

    return successResponse(res, { bookmark }, 201);
  } catch (error) {
    next(error);
  }
}

// GET /api/bookmarks
export async function getBookmarks(req, res, next) {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        scheme: {
          include: {
            benefits: { take: 1 },
            source: { select: { sourceName: true, sourceUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, { bookmarks });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/bookmarks/:schemeId
export async function removeBookmark(req, res, next) {
  try {
    const { schemeId } = req.params;

    // deleteMany doesn't throw if nothing exists
    await prisma.bookmark.deleteMany({
      where: {
        userId: req.user.id,
        schemeId,
      },
    });

    return successResponse(res, { message: 'Bookmark removed' });
  } catch (error) {
    next(error);
  }
}
