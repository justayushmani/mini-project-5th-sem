/**
 * Bullet points and structured text parser for Scheme Details.
 * Breaks walls of text into clean, accessible bullet points,
 * numbered application steps, and structured criteria.
 */

export function cleanBoilerplate(text) {
  if (!text) return '';
  return text.replace(/Verification note:[\s\S]*$/i, '').trim();
}

/**
 * Parse scheme overview text into structured bullet points and optional FAQs.
 */
export function parseOverview(text) {
  if (!text) return { bullets: [], faqs: [] };
  const cleaned = cleanBoilerplate(text);

  let mainText = cleaned;
  const faqs = [];

  // Extract FAQs if embedded in text
  const faqMatch = cleaned.match(/Frequently asked questions from source:\s*([\s\S]*)/i);
  if (faqMatch) {
    mainText = cleaned.slice(0, faqMatch.index).trim();
    const rawFaq = faqMatch[1];
    const qas = rawFaq.split(/(?=Q:\s*)/i).filter(Boolean);
    for (const qa of qas) {
      const qMatch = qa.match(/Q:\s*(.*?)(?=A:|$)/is);
      const aMatch = qa.match(/A:\s*([\s\S]*)/is);
      if (qMatch && aMatch) {
        faqs.push({
          q: qMatch[1].trim(),
          a: aMatch[1].trim().replace(/\s+/g, ' '),
        });
      }
    }
  }

  // Strip duplicate scraped sections (these have their own dedicated UI blocks)
  mainText = mainText.split(
    /(?:Eligibility criteria from source:|Benefits from source:|Application process from source:|Documents listed by source:)/i
  )[0].trim();

  // Split into bullet points
  const rawBullets = [];
  if (mainText.includes('•')) {
    const parts = mainText.split(/•\s*/).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.length > 220 && !part.includes('\n')) {
        const sents = part.split(/(?<=[.!?।])\s+/).map((s) => s.trim()).filter((s) => s.length > 15);
        if (sents.length > 1) {
          rawBullets.push(...sents);
          continue;
        }
      }
      rawBullets.push(part);
    }
  } else if (mainText.includes('\n')) {
    const lines = mainText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length > 140) {
        const sents = line.split(/(?<=[.!?।])\s+/).map((s) => s.trim()).filter((s) => s.length > 15);
        if (sents.length > 1) {
          rawBullets.push(...sents);
          continue;
        }
      }
      rawBullets.push(line);
    }
  } else {
    // Single continuous block of text - split into readable bullet sentences
    const sents = mainText.split(/(?<=[.!?।])\s+/).map((s) => s.trim()).filter((s) => s.length > 15);
    rawBullets.push(...(sents.length > 0 ? sents : [mainText]));
  }

  // Format bullets: clean leading dashes/bullets and separate prefix highlights
  const bullets = rawBullets
    .map((b) => b.replace(/^[-*•\s]+/, '').trim())
    .filter((b) => b.length > 5)
    .map((b) => {
      // Check if bullet starts with a label like "Sub-Component I:", "Objective:", "Eligibility:", "घटक 1:", etc.
      const labelMatch = b.match(/^([^:\n]{3,35}:)\s*(.*)/s);
      if (labelMatch) {
        return {
          prefix: labelMatch[1].trim(),
          text: labelMatch[2].trim(),
        };
      }
      return { prefix: null, text: b };
    });

  return { bullets, faqs };
}

/**
 * Parse application process into application mode and step cards.
 */
export function parseApplicationProcess(text) {
  if (!text) return { mode: null, steps: [] };
  const cleaned = cleanBoilerplate(text);

  let mode = null;
  // Match application mode like Mode: Online, Mode: Offline, मोड: ऑनलाइन, মোড: অনলাইন
  const modeMatch = cleaned.match(
    /^(?:Mode|मोड|মোড):\s*(Online\s*(?:&|and)?\s*Offline|Online|Offline|ऑनलाइन\s*(?:एवं|और)?\s*ऑफ़लाइन|ऑनलाइन|ऑफ़लाइन|অনলাইন\s*(?:ও|এবং)?\s*অফলাইন|অনলাইন|অফলাইন|[^.\n,]+?)(?=(?:Step|चरण|ধাপ|\d+\.|\n|[A-Z][a-z]|$))/i
  );

  let processText = cleaned;
  if (modeMatch) {
    mode = modeMatch[1].trim();
    processText = cleaned.slice(modeMatch[0].length).trim();
  }

  const steps = [];

  // Match explicit steps like Step 01:, Step 1:, चरण 1:, ধাপ ১:
  const stepRegex = /(?:Step\s*[-0-9]+|चरण\s*[-०-९0-9]+|ধাপ\s*[-০-৯0-9]+):?/gi;
  if (stepRegex.test(processText)) {
    const parts = processText
      .split(/(?=(?:Step\s*[-0-9]+|चरण\s*[-०-९0-9]+|ধাপ\s*[-০-৯0-9]+):?)/i)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const part of parts) {
      const match = part.match(/^((?:Step\s*[-0-9]+|चरण\s*[-०-९0-9]+|ধাপ\s*[-০-৯0-9]+):?)\s*([\s\S]*)/i);
      if (match) {
        steps.push({
          stepLabel: match[1].replace(/:$/, '').trim(),
          text: match[2].trim(),
        });
      } else {
        steps.push({ stepLabel: null, text: part.trim() });
      }
    }
  } else if (/^\s*(?:[0-9]+|[०-९]+|[০-৯]+)[.)]\s*/m.test(processText)) {
    // Match numbered points: 1. or 1) or ১. or १.
    const parts = processText.split(/(?=\b(?:[0-9]+|[०-९]+|[০-৯]+)[.)]\s*)/).filter(Boolean);
    for (const part of parts) {
      const cleanedPart = part.replace(/^\s*(?:[0-9]+|[०-९]+|[০-৯]+)[.)]\s*/, '').trim();
      if (cleanedPart) {
        steps.push({ stepLabel: null, text: cleanedPart });
      }
    }
  } else {
    // Split by bullet markers or distinct sentences
    const items = processText
      .split(/(?:•|\n-|\n\*|(?<=[.!?।])\s+)/)
      .map((s) => s.replace(/^[-*•\s]+/, '').trim())
      .filter((s) => s.length > 10);

    for (const item of items) {
      steps.push({ stepLabel: null, text: item });
    }
  }

  return { mode, steps: steps.filter((s) => s.text) };
}

/**
 * Break long, unformatted eligibility criteria into clean sub-bullets
 */
export function parseEligibilityCriteria(eligibilityItems = []) {
  if (!eligibilityItems || !Array.isArray(eligibilityItems)) return [];

  const result = [];
  for (const item of eligibilityItems) {
    const desc = cleanBoilerplate(item.description || '');
    if (!desc) continue;

    // Check if description has multiple bullet points or multiple numbered points
    if (desc.includes('•') || /(?:[1-9]\)|\b[1-9]\.)\s+/.test(desc)) {
      const subItems = desc
        .split(/(?:•|(?=\b[1-9][.)]\s+))/)
        .map((s) => s.replace(/^[-*•\s]+/, '').replace(/^[1-9][.)]\s*/, '').trim())
        .filter((s) => s.length > 5);

      if (subItems.length > 1) {
        for (const sub of subItems) {
          result.push({
            id: `${item.id}-${Math.random().toString(36).substring(2, 7)}`,
            description: sub,
            isRequired: item.isRequired,
          });
        }
        continue;
      }
    }

    // Single item
    result.push({
      id: item.id,
      description: desc,
      isRequired: item.isRequired,
    });
  }

  return result;
}
