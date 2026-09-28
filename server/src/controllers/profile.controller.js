import prisma from '../lib/prisma.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// GET /api/profile
export async function getProfile(req, res, next) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      // Return null data, not a 404 — front-end can handle "no profile yet"
      return successResponse(res, { profile: null });
    }

    return successResponse(res, { profile });
  } catch (error) {
    next(error);
  }
}

// PUT /api/profile
export async function updateProfile(req, res, next) {
  try {
    const data = req.body; // Already validated by Zod middleware

    // Upsert — create if doesn't exist, update if it does
    const profile = await prisma.profile.upsert({
      where:  { userId: req.user.id },
      update: data,
      create: { userId: req.user.id, ...data },
    });

    return successResponse(res, { profile });
  } catch (error) {
    next(error);
  }
}
