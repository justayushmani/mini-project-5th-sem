import groq from '../../lib/groq.js';
import env from '../../config/env.js';

/**
 * Clean raw text by stripping repetitive scraped sections and verification boilerplate
 */
function cleanOverviewExcerpt(text, maxChars = 750) {
  if (!text) return '';
  // Remove boilerplate verification note
  let cleaned = text.replace(/Verification note:[\s\S]*$/i, '').trim();

  // Strip duplicate scraped sections (these already have dedicated sections in SchemeDetails)
  cleaned = cleaned.split(/(?:Eligibility criteria from source:|Benefits from source:|Application process from source:|Frequently asked questions from source:|Documents listed by source:)/i)[0].trim();

  if (cleaned.length > maxChars) {
    // Cut at sentence boundary if possible
    const cut = cleaned.slice(0, maxChars);
    const lastPunct = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'));
    if (lastPunct > 200) {
      cleaned = cut.slice(0, lastPunct + 1);
    } else {
      cleaned = cut.trim() + '...';
    }
  }

  return cleaned;
}

function cleanProcessExcerpt(text, maxChars = 750) {
  if (!text) return '';
  let cleaned = text.replace(/Verification note:[\s\S]*$/i, '').trim();
  if (cleaned.length > maxChars) {
    const cut = cleaned.slice(0, maxChars);
    const lastPunct = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'));
    if (lastPunct > 200) {
      cleaned = cut.slice(0, lastPunct + 1);
    } else {
      cleaned = cut.trim() + '...';
    }
  }
  return cleaned;
}

/**
 * Fallback translation helper if Groq fails or times out
 */
function fallbackTranslate(scheme, targetLanguage) {
  const isHi = targetLanguage === 'hi';
  const isBn = targetLanguage === 'bn';

  // Format overview into bullet points
  const rawDesc = cleanOverviewExcerpt(scheme.description, 500);
  const sentences = rawDesc.split(/(?<=[.!?])\s+/).filter(s => s.length > 10);
  const bulletDesc = (sentences.length > 0 ? sentences : [rawDesc])
    .map(s => `• ${s}`)
    .join('\n');

  // Format application process into steps
  const rawProcess = cleanProcessExcerpt(scheme.applicationProcess, 500);
  let processFormatted = rawProcess;
  if (/step/i.test(rawProcess)) {
    const steps = rawProcess.split(/(?=(?:Step\s*[-0-9]+):?)/i).filter(Boolean);
    processFormatted = steps.map(s => `• ${s.trim()}`).join('\n');
  } else {
    processFormatted = `• ${rawProcess}`;
  }

  return {
    name: scheme.name,
    description: bulletDesc,
    applicationProcess: processFormatted,
  };
}

/**
 * Translate scheme into Hindi or Bengali using Groq LLM with timeout & bullet formatting.
 */
export async function translateScheme(scheme, targetLanguage) {
  if (!targetLanguage || targetLanguage === 'en') {
    return null;
  }

  if (targetLanguage !== 'hi' && targetLanguage !== 'bn') {
    return null;
  }

  const targetLangName = targetLanguage === 'hi' ? 'Hindi (हिन्दी)' : 'Bengali (বাংলা)';
  const langRules = targetLanguage === 'hi'
    ? 'Use Hindi script (Devanagari). Use "मोड: ऑनलाइन / ऑफलाइन" and "चरण 1:", "चरण 2:" for steps.'
    : 'Use Bengali script (বাংলা). Use "মোড: অনলাইন / অফলাইন" and "ধাপ ১:", "ধাপ ২:" for steps.';

  const excerptDesc = cleanOverviewExcerpt(scheme.description);
  const excerptProcess = cleanProcessExcerpt(scheme.applicationProcess);

  const prompt = `You are an expert translator specializing in Indian government welfare schemes.
Translate the scheme name, description, and application process into ${targetLangName}.

Rules:
1. Translate accurately into natural, respectful ${targetLangName}.
2. Format the description as structured bullet points where each bullet starts with "• ".
3. Format the application process with application mode and numbered steps ("• चरण 1: ...", "• चरण 2: ..." for Hindi; "• ধাপ ১: ...", "• ধাপ ২: ..." for Bengali).
4. ${langRules}
5. Keep official URLs, portal names, and currency amounts intact.
6. Return ONLY a valid JSON object with keys: "name", "description", "applicationProcess". No code fences, no extra text.`;

  const inputPayload = {
    name: scheme.name,
    description: excerptDesc,
    applicationProcess: excerptProcess || 'Visit official website or nearest Common Service Centre to apply.',
  };

  try {
    if (!groq) {
      return fallbackTranslate(scheme, targetLanguage);
    }

    // Wrap in 8-second timeout
    const completionPromise = groq.chat.completions.create({
      model: env.groqModel || 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: JSON.stringify(inputPayload) },
      ],
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Groq translation timed out')), 8000)
    );

    const response = await Promise.race([completionPromise, timeoutPromise]);
    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    const parsed = JSON.parse(content);
    return {
      name: parsed.name?.trim() || scheme.name,
      description: parsed.description?.trim() || excerptDesc,
      applicationProcess: parsed.applicationProcess?.trim() || excerptProcess,
    };
  } catch (error) {
    console.warn(`[translateScheme] Translation to ${targetLanguage} failed (${error.message}). Using fallback formatting.`);
    return fallbackTranslate(scheme, targetLanguage);
  }
}
