import { keywordMap, CONFIDENCE_THRESHOLD } from './keywordMap';

export interface IntentResult {
  intent: string | null;
  confidence: number;
}

function cleanText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectIntent(rawInput: string): IntentResult {
  const cleaned = cleanText(rawInput);

  let bestIntent: string | null = null;
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(keywordMap)) {
    let matches = 0;
    for (const kw of keywords) {
      if (cleaned.includes(kw)) matches++;
    }
    // Any single keyword match qualifies; more matches = higher confidence
    const score = matches > 0 ? matches / keywords.length + 0.1 : 0;
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  if (bestScore < CONFIDENCE_THRESHOLD || bestIntent === null) {
    return { intent: null, confidence: bestScore };
  }

  return { intent: bestIntent, confidence: bestScore };
}
