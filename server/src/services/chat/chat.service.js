import prisma from '../../lib/prisma.js';
import groq from '../../lib/groq.js';
import env from '../../config/env.js';
import { searchRelevantSchemes } from '../rag/rag.service.js';

function sanitizeMessage(message) {
  return String(message || '').trim();
}

function buildSessionTitle(message) {
  const text = sanitizeMessage(message).replace(/\s+/g, ' ');
  if (!text) return 'New Chat';
  return text.length > 40 ? `${text.slice(0, 37)}...` : text;
}

async function getRelevantSchemes(query, schemeId = null) {
  if (schemeId) {
    const scheme = await prisma.scheme.findUnique({
      where: { id: schemeId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        ministry: true,
        state: true,
        level: true,
      },
    });

    return scheme ? [scheme] : [];
  }

  const result = await searchRelevantSchemes(query, 5);
  const schemeIds = [...new Set(result.map((item) => item.payload?.schemeId).filter(Boolean))];

  if (!schemeIds.length) {
    return [];
  }

  return prisma.scheme.findMany({
    where: { id: { in: schemeIds }, status: 'Active' },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      ministry: true,
      state: true,
      level: true,
    },
  });
}

function buildPrompt({ userMessage, history = [], relevantSchemes = [] }) {
  const schemeContext = relevantSchemes.length
    ? relevantSchemes.map((scheme) => (
        `- ${scheme.name} (${scheme.category || 'General'}) | State: ${scheme.state || 'All India'} | Level: ${scheme.level || 'Central'} | ${scheme.description || ''}`
      )).join('\n')
    : 'No direct scheme matches were found in the vector index.';

  const recentHistory = history.length
    ? history
        .slice(-6)
        .map((entry) => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.content}`)
        .join('\n')
    : 'No previous chat yet.';

  return `You are Yojana Saathi, a helpful government-scheme assistant for India.
Use only the scheme information in the context below.
Do not invent schemes, benefits, or eligibility rules.
If no relevant scheme is found, say clearly that you do not have enough information and ask one clarifying question.

Recent chat history:
${recentHistory}

Relevant scheme context:
${schemeContext}

User question: ${userMessage}

Answer in a concise, friendly way in English. Provide practical next steps and mention relevant scheme names when they fit.`;
}

async function generateAssistantReply({ userMessage, history, relevantSchemes }) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured. Please add it to server/.env.');
  }

  const response = await groq.chat.completions.create({
    model: env.groqModel,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: 'You are Yojana Saathi, an expert assistant for Indian government schemes. Be helpful, concise, and grounded in the provided scheme data.',
      },
      {
        role: 'user',
        content: buildPrompt({ userMessage, history, relevantSchemes }),
      },
    ],
  });

  return response?.choices?.[0]?.message?.content?.trim() || 'I could not generate a response right now. Please try again.';
}

export async function getSessionsForUser(userId) {
  return prisma.chatSession.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getSessionForUser(sessionId, userId) {
  return prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      scheme: {
        select: { id: true, name: true, category: true },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function deleteSessionForUser(sessionId, userId) {
  return prisma.chatSession.deleteMany({
    where: { id: sessionId, userId },
  });
}

export async function sendChatMessage(userId, { sessionId, message, schemeId = null }) {
  const text = sanitizeMessage(message);
  if (!text) {
    throw new Error('Message is required.');
  }

  let session = null;

  if (sessionId) {
    session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
  }

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        userId,
        title: buildSessionTitle(text),
        schemeId,
      },
      include: {
        scheme: { select: { id: true, name: true, category: true } },
      },
    });
  }

  const userMessage = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: text,
    },
  });

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const relevantSchemes = await getRelevantSchemes(text, schemeId);
  const assistantContent = await generateAssistantReply({
    userMessage: text,
    history,
    relevantSchemes,
  });

  const assistantMessage = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: assistantContent,
    },
  });

  const updatedSession = await prisma.chatSession.update({
    where: { id: session.id },
    data: {
      title: session.title === 'New Chat' ? buildSessionTitle(text) : session.title,
      updatedAt: new Date(),
    },
    include: {
      scheme: { select: { id: true, name: true, category: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return {
    sessionId: updatedSession.id,
    session: updatedSession,
    userMessage,
    assistantMessage,
    messages: updatedSession.messages,
  };
}

export const chatService = {
  getSessionsForUser,
  getSessionForUser,
  deleteSessionForUser,
  sendChatMessage,
};

export default chatService;
