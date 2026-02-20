import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const AI_REFERRER_DOMAINS: { domain: string; name: string; pathPrefix?: string }[] = [
  { domain: 'chat.openai.com', name: 'chatgpt' },
  { domain: 'chatgpt.com', name: 'chatgpt' },
  { domain: 'claude.ai', name: 'claude' },
  { domain: 'perplexity.ai', name: 'perplexity' },
  { domain: 'copilot.microsoft.com', name: 'copilot' },
  { domain: 'bing.com', name: 'copilot', pathPrefix: '/chat' },
  { domain: 'gemini.google.com', name: 'gemini' },
  { domain: 'you.com', name: 'you' },
  { domain: 'phind.com', name: 'phind' },
  { domain: 'kagi.com', name: 'kagi' },
];

/** Maps common utm_source values from AI platforms to a canonical platform name. */
const AI_UTM_SOURCES: Record<string, string> = {
  chatgpt: 'chatgpt',
  openai: 'chatgpt',
  perplexity: 'perplexity',
  claude: 'claude',
  anthropic: 'claude',
  copilot: 'copilot',
  gemini: 'gemini',
  you: 'you',
  phind: 'phind',
  kagi: 'kagi',
};

/**
 * Detects traffic arriving from AI assistant referrers and fires a GA4 event.
 * Checks both document.referrer and utm_source query param.
 * Runs once per page load (not per route change).
 */
export function AIReferralTracker() {
  useEffect(() => {
    let aiSource: string | null = null;

    // 1. Check utm_source parameter first (explicit tagging takes priority)
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source')?.toLowerCase() ?? '';
    if (utmSource) {
      const utmMatch = Object.keys(AI_UTM_SOURCES).find((key) => utmSource.includes(key));
      if (utmMatch) {
        aiSource = AI_UTM_SOURCES[utmMatch];
      }
    }

    // 2. Fall back to referrer detection
    if (!aiSource) {
      const referrer = document.referrer;
      if (referrer) {
        try {
          const { hostname, pathname } = new URL(referrer);
          const entry = AI_REFERRER_DOMAINS.find((r) => {
            const hostMatch = hostname === r.domain || hostname.endsWith(`.${r.domain}`);
            if (!hostMatch) return false;
            if (r.pathPrefix) return pathname.startsWith(r.pathPrefix);
            return true;
          });
          if (entry) {
            aiSource = entry.name;
          }
        } catch {
          // invalid URL — ignore
        }
      }
    }

    if (!aiSource) return;

    const gtag = (window as any).gtag;
    if (typeof gtag !== 'function') return;

    // Override campaign source/medium so GA4 attribution reflects AI referral
    gtag('set', {
      campaign_source: aiSource,
      campaign_medium: 'ai_referral',
    });

    // Fire the custom ai_referral event
    gtag('event', 'ai_referral', {
      ai_source: aiSource,
      landing_page: window.location.pathname,
      ai_channel: 'AI Answer Engine',
    });
  }, []);

  return (
    <Helmet>
      <meta
        name="ai-referral-sources"
        content="chatgpt,perplexity,claude,copilot,gemini,you,phind,kagi"
      />
    </Helmet>
  );
}

