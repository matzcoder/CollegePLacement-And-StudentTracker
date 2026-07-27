export const keywordMap: Record<string, string[]> = {
  company_count: [
    'how many companies',
    'companies visited',
    'total companies',
    'number of companies',
    'how many firms',
    'companies came',
    'companies visited campus',
  ],
  where_applied: [
    'where did i apply',
    'which companies did i apply',
    'list my applications',
    'show my applications',
    'where have i applied',
    'applied companies',
    'my applications',
  ],
  shortlist_status: [
    'shortlisted',
    'was i shortlisted',
    'am i shortlisted',
    'shortlist status',
    'did i get shortlisted',
    'got shortlisted',
  ],
  offer_status: [
    'offer',
    'did i get an offer',
    'do i have an offer',
    'got selected',
    'selected',
    'did i get selected',
    'placement result',
  ],
  package_query: [
    'package',
    'salary',
    'ctc',
    'how much salary',
    'what is my package',
    'my offer package',
    'compensation',
    'stipend',
  ],
  application_status: [
    'application status',
    'status of my application',
    'where am i',
    'pipeline',
    'current stage',
    'interview stage',
    'applied status',
    'show status',
  ],
};

export const CONFIDENCE_THRESHOLD = 0.3;

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

export const FALLBACK_RESPONSE = `Hmm, I didn't quite catch that. Here are the questions I can help you with — just tap one below or type your own:

• "Where did I apply?"
• "Was I shortlisted?"
• "Did I get an offer?"
• "What is my package?"
• "How many companies visited campus?"
• "Show my application status"`;

const STAGE_LABEL: Record<string, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted ✅',
  interview: 'Interview Round 🎯',
  offer: 'Offer Stage 🏆',
  rejected: 'Not Selected ❌',
};

const OFFER_LABEL: Record<string, string> = {
  pending: 'Pending',
  selected: 'Selected 🎉',
  offer_accepted: 'Offer Accepted ✅',
  offer_declined: 'Offer Declined',
  rejected: 'Rejected ❌',
};

function stageLabel(s: string) { return STAGE_LABEL[s] ?? s; }
function offerLabel(o: string) { return OFFER_LABEL[o] ?? o; }

export function buildResponse(intent: string, data: Record<string, unknown>): string {
  switch (intent) {

    case 'company_count': {
      const count = data.count as number;
      if (count === 0) return '🏢 No companies have been registered for placement drives yet. Check back soon!';
      return `🏢 ${count} ${count === 1 ? 'company has' : 'companies have'} been registered for placement drives so far. Stay prepared!`;
    }

    case 'where_applied': {
      const apps = data.applications as Array<{ company: string; stage: string }> | undefined;
      if (!Array.isArray(apps) || apps.length === 0)
        return "📋 You haven't applied to any drives yet.\n\nContact your placement officer to get enrolled in upcoming drives.";
      const list = apps.map((a) => `• ${a.company}  —  ${stageLabel(a.stage)}`).join('\n');
      return `📋 You have applied to ${apps.length} ${apps.length === 1 ? 'company' : 'companies'}:\n\n${list}`;
    }

    case 'shortlist_status': {
      const apps = data.applications as Array<{ company: string; stage: string }> | undefined;
      const shortlisted = apps?.filter((a) => ['shortlisted', 'interview', 'offer'].includes(a.stage));
      if (!shortlisted || shortlisted.length === 0)
        return "⏳ You haven't been shortlisted in any drive yet.\n\nKeep applying and stay confident — opportunities are coming!";
      const list = shortlisted.map((a) => `• ${a.company}  —  ${stageLabel(a.stage)}`).join('\n');
      return `⚡ Great news! You are shortlisted / progressing in ${shortlisted.length} ${shortlisted.length === 1 ? 'drive' : 'drives'}:\n\n${list}`;
    }

    case 'offer_status': {
      const apps = data.applications as Array<{ company: string; offerStatus: string; package?: number }> | undefined;
      const offers = apps?.filter((a) => ['selected', 'offer_accepted', 'offer_declined'].includes(a.offerStatus));
      if (!offers || offers.length === 0)
        return "🕐 No offers received yet.\n\nStay positive — your hard work will pay off soon!";
      const list = offers
        .map((a) => {
          const pkg = a.package ? `  💰 ₹${(a.package / 100000).toFixed(1)}L CTC` : '';
          return `• ${a.company}  —  ${offerLabel(a.offerStatus)}${pkg}`;
        })
        .join('\n');
      return `🏆 Offer update for you:\n\n${list}`;
    }

    case 'package_query': {
      const apps = data.applications as Array<{ company: string; package?: number; offerStatus: string }> | undefined;
      const pkgApps = apps?.filter((a) => a.package && ['selected', 'offer_accepted'].includes(a.offerStatus));
      if (!pkgApps || pkgApps.length === 0)
        return "💰 No package details available yet.\n\nPackage information appears once an offer is confirmed.";
      const list = pkgApps.map((a) => `• ${a.company}:  ₹${(a.package! / 100000).toFixed(1)}L CTC`).join('\n');
      const best = Math.max(...pkgApps.map((a) => a.package!));
      return `💰 Your confirmed package${pkgApps.length > 1 ? 's' : ''}:\n\n${list}\n\n🌟 Best offer: ₹${(best / 100000).toFixed(1)}L CTC`;
    }

    case 'application_status': {
      const apps = data.applications as Array<{ company: string; stage: string; offerStatus: string }> | undefined;
      if (!apps || apps.length === 0)
        return "📊 You haven't applied to any drives yet.\n\nContact your placement officer to get started.";
      const list = apps
        .map((a) => `• ${a.company}\n   Stage: ${stageLabel(a.stage)}  |  Status: ${offerLabel(a.offerStatus)}`)
        .join('\n');
      return `📊 Your full placement pipeline:\n\n${list}`;
    }

    default:
      return FALLBACK_RESPONSE;
  }
}
