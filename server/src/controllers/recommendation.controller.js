import * as recommendationService from '../services/recommendation/recommendation.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// POST /api/recommendations
export async function createRecommendation(req, res, next) {
  try {
    const { profile } = req.body;

    if (!profile || typeof profile !== 'object') {
      return errorResponse(res, 'Profile data is required', 400);
    }

    const recommendation = await recommendationService.generateRecommendations(
      req.user.id,
      profile
    );

    return successResponse(res, recommendation, 201);
  } catch (error) {
    next(error);
  }
}

// GET /api/recommendations/:id
export async function getRecommendation(req, res, next) {
  try {
    const { id } = req.params;
    const recommendation = await recommendationService.getRecommendationById(id, req.user.id);

    if (!recommendation) {
      return errorResponse(res, 'Recommendation not found', 404);
    }

    return successResponse(res, recommendation);
  } catch (error) {
    next(error);
  }
}

// GET /api/recommendations/history
export async function getHistory(req, res, next) {
  try {
    const history = await recommendationService.getRecommendationHistory(req.user.id);
    return successResponse(res, history);
  } catch (error) {
    next(error);
  }
}
