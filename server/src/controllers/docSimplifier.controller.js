import { simplifyDocument } from '../services/ai/gemini.service.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Controller to handle document simplification requests.
 * Receives uploaded file via memoryStorage and passes buffer directly to Gemini.
 */
export async function simplify(req, res, next) {
  try {
    const { language } = req.body;
    const { buffer, detectedMimeType } = req.file;

    const result = await simplifyDocument({
      buffer,
      mimeType: detectedMimeType,
      language,
    });

    return successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

export default {
  simplify,
};
