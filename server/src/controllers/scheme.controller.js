import * as schemeService from '../services/scheme/scheme.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// GET /api/schemes
export async function getSchemes(req, res, next) {
  try {
    const { page, limit, category, state, level, search } = req.query;
    const result = await schemeService.getSchemes({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      category,
      state,
      level,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.schemes,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/schemes/categories
export async function getCategories(req, res, next) {
  try {
    const categories = await schemeService.getCategories();
    return successResponse(res, { categories });
  } catch (error) {
    next(error);
  }
}

// GET /api/schemes/states
export async function getStates(req, res, next) {
  try {
    const states = await schemeService.getStates();
    return successResponse(res, { states });
  } catch (error) {
    next(error);
  }
}

// GET /api/schemes/:id
export async function getScheme(req, res, next) {
  try {
    const { id } = req.params;
    const scheme = await schemeService.getSchemeById(id);

    if (!scheme) {
      return errorResponse(res, 'Scheme not found', 404);
    }

    return successResponse(res, { scheme });
  } catch (error) {
    next(error);
  }
}
