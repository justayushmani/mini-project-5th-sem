import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { chatService } from '../services/chat/chat.service.js';

export async function sendMessage(req, res, next) {
  try {
    const { sessionId, message, schemeId } = req.body;
    const result = await chatService.sendChatMessage(req.user.id, { sessionId, message, schemeId });
    return successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

export async function getSessions(req, res, next) {
  try {
    const sessions = await chatService.getSessionsForUser(req.user.id);
    return successResponse(res, sessions, 200);
  } catch (error) {
    next(error);
  }
}

export async function getSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await chatService.getSessionForUser(sessionId, req.user.id);
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }
    return successResponse(res, session, 200);
  } catch (error) {
    next(error);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const result = await chatService.deleteSessionForUser(sessionId, req.user.id);
    if (result.count === 0) {
      return errorResponse(res, 'Chat session not found', 404);
    }
    return successResponse(res, { message: 'Chat session deleted' }, 200);
  } catch (error) {
    next(error);
  }
}
