import * as aiService from '../services/ai/ai.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function extractProfile(req, res, next) {
  try {
    const { text, language } = req.body;
    const profile = await aiService.extractProfile({ text, language });
    return successResponse(res, profile, 200);
  } catch (error) {
    next(error);
  }
}
