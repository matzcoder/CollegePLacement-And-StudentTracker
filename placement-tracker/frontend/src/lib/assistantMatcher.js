import Fuse from 'fuse.js';

const INTENTS = [
  {
    id: 'MY_APPLICATIONS',
    patterns: [
      'where did i apply',
      'show my applications',
      'what companies did i apply to',
      'list my applied companies',
      'my applications',
      'where have i applied',
      'my applied drives',
      'show applications',
      'what did i apply for',
      'companies i applied to',
      'applied drives',
    ],
  },
  {
    id: 'SHORTLISTED_STATUS',
    patterns: [
      'was i shortlisted',
      'am i shortlisted anywhere',
      'show my shortlisted companies',
      'shortlist status',
      'shortlisted drives',
      'am i shortlisted',
      'did i get shortlisted',
      'which companies shortlisted me',
      'check my shortlist status',
      'shortlisted companies',
    ],
  },
  {
    id: 'OFFERS_RECEIVED',
    patterns: [
      'did i get an offer',
      'did i receive any offers',
      'have i received an offer',
      'what is my package',
      'show my offers',
      'offer letters',
      'am i placed',
      'what is my salary',
      'did i get selected',
      'my placement offer',
      'my package',
      'what package did i get',
      'any offers',
      'offer status',
    ],
  },
  {
    id: 'PENDING_STATUS',
    patterns: [
      'show my application status',
      'which applications are pending',
      'pending drives',
      'am i in interview round',
      'application status',
      'what is my status',
      'in progress applications',
      'pending status',
      'pending applications',
      'what is under review',
    ],
  },
  {
    id: 'CAMPUS_SUMMARY',
    patterns: [
      'how many companies visited campus',
      'total companies visited',
      'campus placement drives',
      'how many companies came',
      'placement summary',
      'companies on campus',
      'how many companies',
      'total drives on campus',
    ],
  },
];

const flattenedPatterns = INTENTS.flatMap((intent) =>
  intent.patterns.map((pattern) => ({
    intentId: intent.id,
    pattern,
  }))
);

const fuse = new Fuse(flattenedPatterns, {
  keys: ['pattern'],
  threshold: 0.45,
  ignoreLocation: true,
});

export function matchAssistantQuery(userInput) {
  if (!userInput || typeof userInput !== 'string') return null;

  const normalized = userInput
    .toLowerCase()
    .replace(/[?!.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return null;

  // 1. Direct Exact & Substring Checks for Target Queries
  for (const intent of INTENTS) {
    if (
      intent.patterns.some(
        (p) => p.toLowerCase().replace(/[?!.,]/g, '').trim() === normalized
      )
    ) {
      return intent.id;
    }
  }

  // 2. High-precision semantic heuristics for guaranteed non-fallback on common queries
  if (
    (normalized.includes('where') && (normalized.includes('apply') || normalized.includes('applied'))) ||
    normalized.includes('my application') ||
    normalized.includes('my applied') ||
    normalized.includes('applied to')
  ) {
    return 'MY_APPLICATIONS';
  }

  if (
    normalized.includes('shortlist') ||
    normalized.includes('shortlisted')
  ) {
    return 'SHORTLISTED_STATUS';
  }

  if (
    normalized.includes('package') ||
    normalized.includes('salary') ||
    normalized.includes('lpa') ||
    normalized.includes('offer') ||
    normalized.includes('placed') ||
    normalized.includes('selected')
  ) {
    return 'OFFERS_RECEIVED';
  }

  if (
    normalized.includes('pending') ||
    normalized.includes('under review') ||
    normalized.includes('interview round') ||
    normalized.includes('status')
  ) {
    return 'PENDING_STATUS';
  }

  if (
    normalized.includes('visited') ||
    (normalized.includes('how many') && normalized.includes('compan')) ||
    normalized.includes('campus')
  ) {
    return 'CAMPUS_SUMMARY';
  }

  // 3. Fuzzy Match via Fuse.js
  const results = fuse.search(normalized);
  if (results.length > 0 && results[0].score !== undefined && results[0].score <= 0.55) {
    return results[0].item.intentId;
  }

  return null;
}

export function generateAssistantResponse(intentId, studentApplications = [], campusStats = {}) {
  switch (intentId) {
    case 'MY_APPLICATIONS': {
      if (!studentApplications || studentApplications.length === 0) {
        return "You have not applied to any placement drives yet.";
      }
      const list = studentApplications
        .map((a) => `• ${a.company || a.drive?.company?.name || 'Company'} — Role: ${a.drive?.roleOffered || a.drive?.roleTitle || 'Graduate Trainee'} | Stage: ${a.stage?.toUpperCase() || 'APPLIED'}`)
        .join('\n');
      return `You have submitted ${studentApplications.length} application(s):\n${list}`;
    }

    case 'SHORTLISTED_STATUS': {
      const shortlisted = (studentApplications || []).filter((a) => {
        const stg = (a.stage || a.rawStage || '').toUpperCase();
        return ['SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'OFFERED', 'OFFER'].includes(stg);
      });
      if (shortlisted.length === 0) {
        return "You are not shortlisted for any company drives yet. Keep preparing for upcoming drives!";
      }
      const names = shortlisted.map((a) => a.company || a.drive?.company?.name || 'Company').join(', ');
      return `You are currently shortlisted for: ${names}.`;
    }

    case 'OFFERS_RECEIVED': {
      const offers = (studentApplications || []).filter((a) => {
        const stg = (a.stage || a.rawStage || '').toUpperCase();
        const ost = (a.offerStatus || a.rawOfferStatus || '').toUpperCase();
        return (
          stg === 'OFFERED' ||
          stg === 'OFFER' ||
          ost === 'OFFERED' ||
          ost === 'ACCEPTED' ||
          ost === 'SELECTED' ||
          ost === 'OFFER_ACCEPTED'
        );
      });
      if (offers.length === 0) {
        return "You haven't received any placement offers yet. Applications are actively progressing.";
      }
      const details = offers
        .map((a) => {
          const comp = a.company || a.drive?.company?.name || 'Company';
          const pkg = a.package || a.packageOffered
            ? `₹${((a.package || a.packageOffered) / 100000).toFixed(1)} LPA`
            : 'Package details pending';
          return `• ${comp}: ${pkg} (Status: ${a.offerStatus || 'Offered'})`;
        })
        .join('\n');
      return `🎉 Congratulations! You have received ${offers.length} offer(s):\n${details}`;
    }

    case 'PENDING_STATUS': {
      const pending = (studentApplications || []).filter((a) => {
        const stg = (a.stage || a.rawStage || '').toUpperCase();
        return ['APPLIED', 'UNDER_REVIEW', 'ASSESSMENT', 'INTERVIEW'].includes(stg);
      });
      if (pending.length === 0) {
        return "You have no applications pending review at this time.";
      }
      const list = pending
        .map((a) => `• ${a.company || a.drive?.company?.name || 'Company'} (${a.stage?.toUpperCase()})`)
        .join('\n');
      return `You have ${pending.length} in-progress application(s):\n${list}`;
    }

    case 'CAMPUS_SUMMARY': {
      const totalCompanies = campusStats?.totalCompanies || 10;
      const totalDrives = campusStats?.totalDrives || 10;
      return `A total of ${totalCompanies} companies and ${totalDrives} placement drives have visited campus for the 2026 placement season.`;
    }

    default:
      return `Sorry, I could not understand that question.\n\nYou can ask things like:\n• Where did I apply?\n• Am I shortlisted anywhere?\n• What is my package?\n• Which applications are pending?\n• How many companies visited campus?`;
  }
}
