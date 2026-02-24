import type { LinkStatus, DiagnosisItem } from './types';

// =============================================
// Region config
// =============================================

export const REGION_CONFIG: Record<string, { flag: string; currency: string; symbol: string; label: string }> = {
  US: { flag: '🇺🇸', currency: 'USD', symbol: '$', label: 'US' },
  CA: { flag: '🇨🇦', currency: 'CAD', symbol: 'C$', label: 'CA' },
  UK: { flag: '🇬🇧', currency: 'GBP', symbol: '£', label: 'UK' },
  EU: { flag: '🇪🇺', currency: 'EUR', symbol: '€', label: 'EU' },
  AU: { flag: '🇦🇺', currency: 'AUD', symbol: 'A$', label: 'AU' },
  JP: { flag: '🇯🇵', currency: 'JPY', symbol: '¥', label: 'JP' },
};

export const REGION_URL_COLUMN_MAP: Record<string, string> = {
  US: 'product_url', CA: 'product_url_ca', UK: 'product_url_uk',
  EU: 'product_url_eu', AU: 'product_url_au', JP: 'product_url_jp',
};

// =============================================
// Brand regional URL derivation configs
// =============================================

type SubdomainConfig = { pattern: 'subdomain'; baseDomain: string; regions: Record<string, { subdomain?: string; domain?: string }> };
type PathConfig = { pattern: 'path'; baseUrl: string; regions: Record<string, string> };
type SameUrlConfig = { pattern: 'same_url'; regions: string[] };
type BrandRegionalConfig = SubdomainConfig | PathConfig | SameUrlConfig;

export const BRAND_REGIONAL_CONFIGS: Record<string, BrandRegionalConfig> = {
  'Bambu Lab':    { pattern: 'subdomain', baseDomain: 'store.bambulab.com', regions: { CA: { subdomain: 'ca' }, UK: { subdomain: 'uk' }, EU: { subdomain: 'eu' }, AU: { subdomain: 'au' }, JP: { subdomain: 'jp' } } },
  'Polymaker':    { pattern: 'subdomain', baseDomain: 'polymaker.com', regions: { CA: { subdomain: 'ca' } } },
  'Elegoo':       { pattern: 'subdomain', baseDomain: 'elegoo.com', regions: { CA: { subdomain: 'ca' }, UK: { subdomain: 'uk' }, EU: { subdomain: 'eu' }, AU: { subdomain: 'au' } } },
  'Anycubic':     { pattern: 'subdomain', baseDomain: 'anycubic.com', regions: { CA: { subdomain: 'ca' }, UK: { subdomain: 'uk' }, EU: { subdomain: 'eu' }, AU: { domain: 'www.anycubic.au' } } },
  'Creality':     { pattern: 'path', baseUrl: 'https://store.creality.com', regions: { CA: 'ca', UK: 'uk', EU: 'eu', AU: 'au', JP: 'jp' } },
  // Single global-store brands: same product URL serves multiple regions with geo-localized currency.
  'Prusament':    { pattern: 'same_url', regions: ['EU', 'US'] },
  'Prusa Research': { pattern: 'same_url', regions: ['EU', 'US'] },
};

export function deriveRegionalUrl(usUrl: string, vendor: string, region: string): string | null {
  const config = BRAND_REGIONAL_CONFIGS[vendor];
  if (!config) return null;

  try {
    if (config.pattern === 'same_url') {
      if (!config.regions.includes(region)) return null;
      return usUrl.replace(/[?#].*$/, '');
    }

    if (config.pattern === 'path') {
      const regionPath = config.regions[region];
      if (!regionPath) return null;
      const urlObj = new URL(usUrl);
      if (!urlObj.hostname.includes('creality.com')) return null;
      const cleanPath = urlObj.pathname.replace(/^\/(ca|uk|eu|au|jp|us)\//, '/');
      return `${config.baseUrl}/${regionPath}${cleanPath}`.replace(/[?#].*$/, '');
    }

    if (!config.regions[region]) return null;
    const urlObj = new URL(usUrl);
    const regionConfig = config.regions[region];
    if (regionConfig.domain) {
      urlObj.hostname = regionConfig.domain;
    } else if (regionConfig.subdomain) {
      const parts = urlObj.hostname.split('.');
      if (parts.length >= 3) parts[0] = regionConfig.subdomain;
      else parts.unshift(regionConfig.subdomain);
      urlObj.hostname = parts.join('.');
    }
    return urlObj.toString().replace(/[?#].*$/, '');
  } catch { return null; }
}

// =============================================
// Helper: strip color suffix from product names
// =============================================

export const COLOR_SUFFIXES_RE = /\s*-\s*(Black|White|Red|Blue|Green|Yellow|Orange|Gray|Grey|Silver|Gold|Purple|Pink|Brown|Clear|Natural|Transparent|Matte|Silk|Rainbow|Multicolor|Jade White|Bambu Green|Arctic Blue|Charcoal|Ivory|Scarlet|Crimson|Navy|Olive|Beige|Burgundy|Teal|Coral|Lavender|Mint|Slate|Maroon|Indigo|Cyan|Magenta|Lime|Peach|Aqua|Tan|Khaki|Mauve|Fuchsia|Turquoise|Violet|Amber|Copper|Bronze|Champagne|Rose|Sand|Forest|Ocean|Sky|Midnight|Sunrise|Sunset|Neon|Pastel|Military|Camo|Chrome|Platinum|Titanium|Mercury|Pewter).*$/i;

export function cleanProductName(title: string): string {
  const cleaned = title.replace(COLOR_SUFFIXES_RE, '').trim();
  return cleaned || title;
}

// =============================================
// Utility functions
// =============================================

export function computeLinkStatus(
  url: string | null,
  priceChangePercent: number | null,
  urlCache: Map<string, { status: string; status_code: number | null; last_checked: string | null; consecutive_failures: number | null }> | undefined
): LinkStatus {
  if (priceChangePercent != null && Math.abs(priceChangePercent) > 10) return 'alert';
  if (!url || !urlCache) return 'unknown';
  const cached = urlCache.get(url);
  if (!cached) return 'unknown';
  if (cached.status === 'invalid' || (cached.status_code && cached.status_code >= 400)) return 'broken';
  if (cached.consecutive_failures && cached.consecutive_failures > 0 && cached.status === 'sync_failed') return 'failed';
  if (cached.last_checked) {
    const checkedAt = new Date(cached.last_checked);
    const hoursSince = (Date.now() - checkedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 168) return 'stale';
    return 'active';
  }
  return 'unknown';
}

export function formatCurrency(val: number | null, symbol: string, currency?: string) {
  if (val == null) return '—';
  const decimals = currency === 'JPY' ? 0 : 2;
  return `${symbol}${val.toFixed(decimals)}`;
}

/** Strip URL to base, preserving product-identity query params */
export function normalizeProductUrl(url: string): string {
  return (url.includes('?sku=') || url.includes('?id='))
    ? url.replace(/#.*$/, '')
    : url.replace(/[?#].*$/, '');
}

// =============================================
// Lovable prompt generation
// =============================================

export function generateLovablePrompt(d: DiagnosisItem): string {
  if (!d.contextualPromptParts) return d.suggestedPrompt;

  const details = d.contextualPromptParts.failureDetails;
  const affectedList = details
    .map(f => `- **${f.product}** (${f.region}): URL=\`${f.url}\`, Error="${f.error}", HTTP=${f.statusCode || 'N/A'}, Latency=${f.latencyMs || 'N/A'}ms`)
    .join('\n');

  const edgeFunction = d.contextualPromptParts.edgeFunctionName || 'get-current-price';

  return `## Fix: ${d.pattern} (${d.count} affected)

### Problem
The \`${edgeFunction}\` edge function is producing "${d.pattern}" errors for ${d.count} product(s).
**Severity:** ${d.severity}
**Error classification:** ${d.diagnosis}

### Affected Products
${affectedList}

### Current Behavior
${d.diagnosis}

### Expected Behavior
All affected products should sync successfully with valid price extraction.

### Suggested Fix Direction
${d.suggestedFix}

### Files Likely Involved
- \`supabase/functions/${edgeFunction}/index.ts\` — the edge function performing price sync
- \`supabase/functions/diagnose-sync-failures/index.ts\` — the diagnosis engine (may need new pattern)
- \`src/pages/admin/PricingData.tsx\` — the admin UI displaying results

Please investigate the root cause in the edge function and implement a fix. If this is a data issue (wrong URLs, discontinued products), suggest the appropriate data cleanup instead.`;
}
