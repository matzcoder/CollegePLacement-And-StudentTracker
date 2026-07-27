export const keywordMap: Record<string, string[]> = {
  company_count: [
    'how many companies',
    'companies visited',
    'total companies',
    'number of companies',
    'how many firms',
    'companies came',
    'companies visited campus',
    'count of companies',
    'list of companies',
    'companies recruiting',
    'how many drives',
    'total drives',
    'companies coming',
    'firms recruiting',
    'number of drives',
    'drives scheduled',
    'firms visiting',
    'recruiting',
  ],
  where_applied: [
    'where did i apply',
    'which companies did i apply',
    'list my applications',
    'show my applications',
    'where have i applied',
    'applied companies',
    'my applications',
    'what did i apply for',
    'companies i applied to',
    'tell me my applications',
    'drives i applied to',
    'applications i submitted',
    'drives i submitted',
    'which companies have i applied',
  ],
  shortlist_status: [
    'shortlisted',
    'was i shortlisted',
    'am i shortlisted',
    'shortlist status',
    'did i get shortlisted',
    'got shortlisted',
    'have i been shortlisted',
    'show shortlist',
    'where am i shortlisted',
    'shortlisted drives',
    'made it to shortlist',
    'made it to the shortlist',
  ],
  offer_status: [
    'did i get an offer',
    'do i have an offer',
    'did i get selected',
    'got selected',
    'did i receive an offer',
    'have i received an offer',
    'placement result',
    'am i selected',
    'was i selected',
    'offer received',
    'any offers',
    'show my offers',
    'did any company select me',
    'offer details',
  ],
  package_query: [
    'package',
    'salary',
    'ctc',
    'how much salary',
    'what is my package',
    'my salary',
    'compensation',
    'stipend',
    'how much ctc',
    'what ctc',
    'lpa',
    'lakh',
    'what is my ctc',
    'how much will i earn',
    'package details',
    'pay details',
    'my earnings',
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
    'track my application',
    'application progress',
    'where do i stand',
    'my drive status',
  ],
  placement_outcome: [
    'am i placed',
    'have i been placed',
    'did i get placed',
    'am i a placed student',
    'placement outcome',
    'am i finally placed',
    'got placed',
    'placement confirmed',
    'have i got placed',
    'tell me if i am placed',
    'am i through',
    'placement done',
    'placed or not',
    'did i secure placement',
    'final placement status',
    'secure a placement',
    'secured placement',
  ],
};

export const CONFIDENCE_THRESHOLD = 0.05;

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
    // Score = proportion matched, but any single match is enough to qualify
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

    // Change 1: new intent handler
    case 'placement_outcome': {
      const apps = data.applications as Array<{ company: string; stage: string; offerStatus: string }> | undefined;
      if (!apps || apps.length === 0)
        return "🎓 You haven't applied to any drives yet, so placement status is not available.\n\nContact your placement officer to get enrolled.";
      const placed = apps.filter((a) => ['offer_accepted', 'selected'].includes(a.offerStatus));
      if (placed.length > 0) {
        const list = placed.map((a) => `• ${a.company}  —  ${offerLabel(a.offerStatus)}`).join('\n');
        return `🎉 Yes! You are placed!\n\n${list}\n\nCongratulations — your hard work paid off!`;
      }
      const inProgress = apps.filter((a) => ['shortlisted', 'interview', 'offer'].includes(a.stage));
      if (inProgress.length > 0) {
        const list = inProgress.map((a) => `• ${a.company}  —  ${stageLabel(a.stage)}`).join('\n');
        return `⏳ Not placed yet, but you're actively progressing in ${inProgress.length} ${inProgress.length === 1 ? 'drive' : 'drives'}:\n\n${list}\n\nKeep going — you're close!`;
      }
      return "⏳ Not placed yet. You have applications in progress but haven't reached the offer stage.\n\nStay focused and keep applying!";
    }

    default:
      return FALLBACK_RESPONSE;
  }
}
