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
    const score = matches / keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  if (bestScore < CONFIDENCE_THRESHOLD) {
    return { intent: null, confidence: bestScore };
  }

  return { intent: bestIntent, confidence: bestScore };
}
