import prisma from '../../lib/prisma.js';
import groq from '../../lib/groq.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';
import { searchRelevantSchemes, chunkSchemeText } from '../rag/rag.service.js';

const SCHEME_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  category: true,
  ministry: true,
  state: true,
  level: true,
  applicationProcess: true,
  officialUrl: true,
  benefits: {
    select: {
      benefitType: true,
      description: true,
      amount: true,
    },
  },
  eligibility: {
    select: {
      description: true,
    },
  },
  documents: {
    select: {
      documentName: true,
      description: true,
    },
  },
};

function sanitizeMessage(message) {
  return String(message || '').trim();
}

function buildSessionTitle(message) {
  const text = sanitizeMessage(message).replace(/\s+/g, ' ');
  if (!text) return 'New Chat';
  return text.length > 40 ? `${text.slice(0, 37)}...` : text;
}

function formatAndCapSchemes(schemes, maxPerScheme = 1500, maxTotal = 6000) {
  const result = [];
  let totalLength = 0;

  for (const scheme of schemes) {
    const rawText = chunkSchemeText(scheme).join('\n\n');
    const contextText = rawText.length > maxPerScheme
      ? rawText.slice(0, maxPerScheme).trim()
      : rawText;

    if (result.length > 0 && totalLength + contextText.length > maxTotal) {
      break;
    }

    scheme.contextText = contextText;
    totalLength += contextText.length;
    result.push(scheme);
  }

  return result;
}

function countMatchedWords(scheme, words) {
  const combinedText = [
    scheme.name,
    scheme.description,
    scheme.category,
    scheme.ministry,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return words.reduce((count, word) => {
    return combinedText.includes(word) ? count + 1 : count;
  }, 0);
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'any', 'can', 'you', 'are',
  'how', 'what', 'which', 'does', 'have', 'has', 'from',
  'that', 'this', 'need', 'get',
]);

async function fallbackKeywordSearch(query) {
  const rawWords = String(query || '').toLowerCase().match(/[a-z]{3,}|[\p{Script=Devanagari}\p{M}]{2,}/gu) || [];
  const words = [...new Set(rawWords.filter((w) => !STOPWORDS.has(w)))].slice(0, 8);
  if (!words.length) {
    return [];
  }

  const orConditions = words.flatMap((word) => [
    { name: { contains: word, mode: 'insensitive' } },
    { description: { contains: word, mode: 'insensitive' } },
    { category: { contains: word, mode: 'insensitive' } },
    { ministry: { contains: word, mode: 'insensitive' } },
  ]);

  const schemes = await prisma.scheme.findMany({
    where: {
      status: 'Active',
      OR: orConditions,
    },
    take: 20,
    select: SCHEME_SELECT,
  });

  schemes.sort((a, b) => {
    const diff = countMatchedWords(b, words) - countMatchedWords(a, words);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  return formatAndCapSchemes(schemes.slice(0, 5));
}

export async function getRelevantSchemes(query, schemeId = null) {
  if (schemeId) {
    const scheme = await prisma.scheme.findUnique({
      where: { id: schemeId },
      select: SCHEME_SELECT,
    });

    return scheme ? formatAndCapSchemes([scheme]) : [];
  }

  let schemeIds = [];

  try {
    const result = await searchRelevantSchemes(query, 5);
    schemeIds = [...new Set(result.map((item) => item.payload?.schemeId).filter(Boolean))];
  } catch (error) {
    logger.warn(`Qdrant search failed, falling back to keyword search: ${error.message}`);
  }

  if (schemeIds.length > 0) {
    const schemes = await prisma.scheme.findMany({
      where: { id: { in: schemeIds }, status: 'Active' },
      select: SCHEME_SELECT,
    });

    if (schemes.length > 0) {
      const schemeMap = new Map(schemes.map((s) => [s.id, s]));
      const orderedSchemes = schemeIds
        .map((id) => schemeMap.get(id))
        .filter(Boolean);

      return formatAndCapSchemes(orderedSchemes);
    }
  }

  return fallbackKeywordSearch(query);
}

export function buildPrompt({ userMessage, history = [], relevantSchemes = [] }) {
  const schemeContext = relevantSchemes.length
    ? relevantSchemes
        .map((scheme) => {
          const text = scheme.contextText || `${scheme.name}. ${scheme.description || ''}`;
          return scheme.officialUrl
            ? `${text}\nOfficial website: ${scheme.officialUrl}`
            : text;
        })
        .join('\n\n')
    : 'No direct scheme matches were found in the scheme database.';

  const recentHistory = history.length
    ? history
        .slice(-6)
        .map((entry) => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.content}`)
        .join('\n')
    : 'No previous chat yet.';

  return `You are Yojana Saathi, a helpful government-scheme assistant for India.
Follow these strict grounding rules:
1. Use ONLY facts written in the scheme information in the context below. Do not add outside knowledge, unwritten steps, website features, form fields, OTP or verification steps, helpline or help-desk details, deadlines, or amounts that are not written there.
2. When asked how to apply, restate ONLY the Application Process text from the context and give the official website, without elaborating or adding procedural steps beyond it.
3. Only mention or recommend schemes that appear in the scheme information below. If none fits, or if asked about a scheme/category not present in the context, say that you do not have a matching scheme in your database. Do NOT name or recommend any schemes outside the provided context.
4. If the context has no detail relevant to the question (such as an unstated income limit, rule, or requirement), say plainly in the user's language that you don't have that detail and suggest checking the official portal.
5. Always mention the relevant scheme name when discussing a scheme.
6. Reply in the same language as the user's message if it is English or Hindi, otherwise reply in English.

Recent chat history:
${recentHistory}

Relevant scheme context:
${schemeContext}

User question: ${userMessage}

Answer concisely, strictly following the rules above. State only what is directly supported by the scheme context.`;
}

export async function generateAssistantReply({ userMessage, history, relevantSchemes }) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured. Please add it to server/.env.');
  }

  const response = await groq.chat.completions.create({
    model: env.groqModel,
    temperature: 0.1,
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
  getRelevantSchemes,
  buildPrompt,
  generateAssistantReply,
};

export default chatService;
