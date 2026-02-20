import { useEffect } from 'react';

const AI_REFERRER_DOMAINS = [
  'chat.openai.com',
  'chatgpt.com',
  'claude.ai',
  'perplexity.ai',
  'copilot.microsoft.com',
  'gemini.google.com',
  'you.com',
  'phind.com',
];

/**
 * Detects traffic arriving from AI assistant referrers and fires a GA4 event.
 * Runs once per page load (not per route change).
 */
export function AIReferralTracker() {
  useEffect(() => {
    const referrer = document.referrer;
    if (!referrer) return;

    let referrerHostname: string;
    try {
      referrerHostname = new URL(referrer).hostname;
    } catch {
      return;
    }

    const matched = AI_REFERRER_DOMAINS.find(
      (domain) => referrerHostname === domain || referrerHostname.endsWith(`.${domain}`)
    );

    if (!matched) return;

    const gtag = (window as any).gtag;
    if (typeof gtag !== 'function') return;

    // Override campaign source/medium so GA4 attribution reflects AI referral
    gtag('set', {
      campaign_source: matched,
      campaign_medium: 'ai_referral',
    });

    // Fire the custom ai_referral event
    gtag('event', 'ai_referral', {
      ai_source: matched,
      landing_page: window.location.pathname,
    });
  }, []);

  return null;
}
