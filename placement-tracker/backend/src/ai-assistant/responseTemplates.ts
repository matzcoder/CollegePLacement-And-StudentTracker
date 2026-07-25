export const FALLBACK_RESPONSE = `I'm not sure I understood that. Here are some things you can ask me:
• "How many companies visited campus?"
• "Where did I apply?"
• "Was I shortlisted?"
• "Did I receive an offer?"
• "What is my package?"
• "Show my application status"`;

export function buildResponse(intent: string, data: Record<string, unknown>): string {
  switch (intent) {
    case 'company_count':
      return `${data.count} company(ies) have been registered for placement drives so far.`;

    case 'where_applied':
      if (!Array.isArray(data.applications) || data.applications.length === 0) {
        return "You haven't applied to any drives yet.";
      }
      const list = (data.applications as Array<{ company: string; stage: string }>)
        .map((a) => `• ${a.company} — Stage: ${a.stage}`)
        .join('\n');
      return `You have applied to the following companies:\n${list}`;

    case 'shortlist_status': {
      const shortlisted = (data.applications as Array<{ company: string; stage: string }>)?.filter(
        (a) => ['shortlisted', 'interview', 'offer'].includes(a.stage)
      );
      if (!shortlisted || shortlisted.length === 0) {
        return 'You have not been shortlisted in any drive yet. Keep applying!';
      }
      return `You are shortlisted / progressed in:\n${shortlisted.map((a) => `• ${a.company} (${a.stage})`).join('\n')}`;
    }

    case 'offer_status': {
      const offers = (data.applications as Array<{ company: string; offerStatus: string; package?: number }>)?.filter(
        (a) => ['selected', 'offer_accepted', 'offer_declined'].includes(a.offerStatus)
      );
      if (!offers || offers.length === 0) {
        return 'No offers yet. Stay positive and keep applying!';
      }
      return `Offer details:\n${offers.map((a) => `• ${a.company}: ${a.offerStatus}${a.package ? ` — ₹${(a.package / 100000).toFixed(1)}L CTC` : ''}`).join('\n')}`;
    }

    case 'package_query': {
      const pkgApps = (data.applications as Array<{ company: string; package?: number; offerStatus: string }>)?.filter(
        (a) => a.package && ['selected', 'offer_accepted'].includes(a.offerStatus)
      );
      if (!pkgApps || pkgApps.length === 0) {
        return 'No package information available yet. A package is shown once an offer is made.';
      }
      return pkgApps.map((a) => `• ${a.company}: ₹${(a.package! / 100000).toFixed(1)}L CTC`).join('\n');
    }

    case 'application_status': {
      const apps = data.applications as Array<{ company: string; stage: string; offerStatus: string }>;
      if (!apps || apps.length === 0) return "You haven't applied to any drives yet.";
      return `Your application pipeline:\n${apps.map((a) => `• ${a.company}: ${a.stage} / ${a.offerStatus}`).join('\n')}`;
    }

    default:
      return FALLBACK_RESPONSE;
  }
}
