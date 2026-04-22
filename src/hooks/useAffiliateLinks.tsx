import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AffiliateConfig {
  vendor_name: string;
  affiliate_id: string | null;
  affiliate_url_pattern: string | null;
  amazon_us_tag: string | null;
  amazon_uk_tag: string | null;
  amazon_de_tag: string | null;
  amazon_ca_tag?: string | null;
  amazon_au_tag?: string | null;
  amazon_jp_tag?: string | null;
  // Awin fields for eSUN/KingRoon/Bambu etc.
  awin_advertiser_id?: string | null;
  awin_affiliate_id?: string | null;
  affiliate_network?: string | null;
}

// Hardcoded fallback configs — used when the Edge Function is unreachable (CORS, cold start, outage).
// Sourced from affiliate_configs + affiliate_programs tables. Last synced: 2026-03-14.
const FALLBACK_CONFIGS: AffiliateConfig[] = [
  // Amazon — all regions
  // Per-marketplace Amazon Associates tags (MEMORY.md canonical):
  //   -20  US/CA    (amazon.com, amazon.ca)
  //   -21  UK/DE/FR/IT/ES  (amazon.co.uk, amazon.de, amazon.fr, amazon.it, amazon.es)
  //   -22  AU/JP    (amazon.com.au, amazon.co.jp)
  { vendor_name: "Amazon", affiliate_id: null, affiliate_url_pattern: null, amazon_us_tag: "filascope-20", amazon_ca_tag: "filascope-20", amazon_uk_tag: "filascope-21", amazon_de_tag: "filascope-21", amazon_au_tag: "filascope-22", amazon_jp_tag: "filascope-22", affiliate_network: "amazon" },
  // Anycubic — GoAffPro ref
  { vendor_name: "Anycubic", affiliate_id: "JEANJACQUESBOILEAU", affiliate_url_pattern: "?ref=JEANJACQUESBOILEAU", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // Creality — UpPromote sca_ref
  { vendor_name: "Creality", affiliate_id: "432793.sgEubTAk", affiliate_url_pattern: "?sca_ref=432793.sgEubTAk&source=filascope", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "goaffpro" },
  // eSUN — Awin
  { vendor_name: "eSUN", affiliate_id: null, affiliate_url_pattern: null, amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, awin_advertiser_id: "99267", awin_affiliate_id: "2703056", affiliate_network: "awin" },
  { vendor_name: "eSun", affiliate_id: null, affiliate_url_pattern: null, amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, awin_advertiser_id: "99267", awin_affiliate_id: "2703056", affiliate_network: "awin" },
  // KingRoon — Awin
  { vendor_name: "KingRoon", affiliate_id: null, affiliate_url_pattern: null, amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, awin_advertiser_id: "101327", awin_affiliate_id: "2703056", affiliate_network: "awin" },
  // Elegoo — Impact redirect
  { vendor_name: "Elegoo", affiliate_id: null, affiliate_url_pattern: "redirect:https://elegoo.sjv.io/QYPW6x", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "redirect_link" },
  // Overture — direct aff param
  { vendor_name: "Overture", affiliate_id: "126", affiliate_url_pattern: "?aff=126", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // Proto-Pasta — direct aff param
  { vendor_name: "Proto-Pasta", affiliate_id: "247", affiliate_url_pattern: "?aff=247", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // Amolen — direct ref param
  { vendor_name: "Amolen", affiliate_id: "qzaelowj", affiliate_url_pattern: "?ref=qzaelowj", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // Eryone — direct ref param
  { vendor_name: "Eryone", affiliate_id: "wpzqtfek", affiliate_url_pattern: "?ref=wpzqtfek", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // Polymaker — aff param
  { vendor_name: "Polymaker", affiliate_id: "99", affiliate_url_pattern: "?aff=99", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // Prusa — fragment-based
  { vendor_name: "Prusa", affiliate_id: "Jay", affiliate_url_pattern: "{{raw_url}}#a_aid=Jay", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  { vendor_name: "Prusament", affiliate_id: "Jay", affiliate_url_pattern: "{{raw_url}}#a_aid=Jay", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // Sunlu — direct ref
  { vendor_name: "Sunlu", affiliate_id: null, affiliate_url_pattern: null, amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // Bambu Lab — Awin (no IDs in affiliate_configs but row exists)
  { vendor_name: "Bambu Lab", affiliate_id: null, affiliate_url_pattern: null, amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "awin" },
  // Geeetech — direct
  { vendor_name: "Geeetech", affiliate_id: null, affiliate_url_pattern: null, amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // FormFutura — direct
  { vendor_name: "FormFutura", affiliate_id: null, affiliate_url_pattern: null, amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // 3D-Fuel — direct
  { vendor_name: "3D-Fuel", affiliate_id: null, affiliate_url_pattern: null, amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
  // Siraya Tech — UpPromote (updated 2026-03-14 to match affiliate_programs DB)
  { vendor_name: "Siraya Tech", affiliate_id: "10634572.rHWsw5PvJi", affiliate_url_pattern: "?sca_ref=10634572.rHWsw5PvJi", amazon_us_tag: null, amazon_uk_tag: null, amazon_de_tag: null, affiliate_network: "direct" },
];

// In-memory cache for configs
let cachedConfigs: AffiliateConfig[] | null = null;
let configsFetchPromise: Promise<AffiliateConfig[]> | null = null;

const CACHE_KEY = "filascope_affiliate_configs";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function readLocalCache(): AffiliateConfig[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: AffiliateConfig[] };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLocalCache(data: AffiliateConfig[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota exceeded — ignore */ }
}

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 1000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(3, attempt); // 1s, 3s
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}


/**
 * Fetch affiliate_programs rows and convert them into AffiliateConfig shape
 * so they can be merged with the affiliate_configs data.
 * Only returns brands NOT already covered by affiliate_configs.
 */
async function fetchAffiliateProgramsBridge(
  existingVendorNames: string[]
): Promise<AffiliateConfig[]> {
  try {
    const existing = new Set(existingVendorNames.map((v) => v.toLowerCase()));

    const { data, error } = await supabase
      .from("affiliate_programs")
      .select(
        "brand_name, link_generation_method, link_template, tracking_parameter, tracking_value, source_parameter, source_value, awin_merchant_id, awin_publisher_id, is_active"
      )
      .eq("is_active", true);

    if (error || !data) return [];

    // De-duplicate by brand_name (take first active row per brand)
    const seen = new Set<string>();
    const bridged: AffiliateConfig[] = [];

    for (const prog of data) {
      const key = prog.brand_name.toLowerCase();
      // Skip if already in affiliate_configs OR already seen
      if (existing.has(key) || seen.has(key)) continue;
      seen.add(key);

      // Build a synthetic AffiliateConfig from affiliate_programs data
      let url_pattern: string | null = null;
      let awin_advertiser: string | null = null;
      let awin_affiliate: string | null = null;
      let network: string | null = null;

      if (prog.link_generation_method === "url_parameter" && prog.tracking_parameter && prog.tracking_value) {
        let params = `?${prog.tracking_parameter}=${prog.tracking_value}`;
        if (prog.source_parameter && prog.source_value) {
          params += `&${prog.source_parameter}=${prog.source_value}`;
        }
        url_pattern = params;
        network = "direct";
      } else if (prog.link_generation_method === "awin_redirect" && prog.awin_merchant_id && prog.awin_publisher_id) {
        awin_advertiser = prog.awin_merchant_id;
        awin_affiliate = prog.awin_publisher_id;
        network = "awin";
      } else if (prog.link_generation_method === "redirect_link" && prog.link_template) {
        url_pattern = `redirect:${prog.link_template}`;
        network = "redirect_link";
      }

      bridged.push({
        vendor_name: prog.brand_name,
        affiliate_id: prog.tracking_value || null,
        affiliate_url_pattern: url_pattern,
        amazon_us_tag: null,
        amazon_uk_tag: null,
        amazon_de_tag: null,
        awin_advertiser_id: awin_advertiser,
        awin_affiliate_id: awin_affiliate,
        affiliate_network: network,
      });
    }

    return bridged;
  } catch {
    return [];
  }
}

async function fetchConfigs(): Promise<AffiliateConfig[]> {
  if (cachedConfigs) return cachedConfigs;
  
  if (configsFetchPromise) return configsFetchPromise;

  // Immediately use localStorage cache if available
  const localCached = readLocalCache();
  if (localCached) {
    cachedConfigs = localCached;
  }

  configsFetchPromise = (async () => {
    try {
      const data = await fetchWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke("get-affiliate-url", {
          body: { getConfigs: true },
        });
        if (error) throw error;
        if (!data?.configs) throw new Error("Unexpected response format");
        return data;
      });

      const baseConfigs: AffiliateConfig[] = data.configs;

      // Bridge: also fetch affiliate_programs for brands NOT in affiliate_configs
      const existingNames = baseConfigs.map((c) => c.vendor_name);
      const bridged = await fetchAffiliateProgramsBridge(existingNames);

      cachedConfigs = [...baseConfigs, ...bridged];
      writeLocalCache(cachedConfigs);
      return cachedConfigs;
    } catch (err) {
      console.warn("[AffiliateLinks] Edge Function unreachable after retries — using fallback", err);
      // Use localStorage cache if available, else hardcoded fallbacks
      const localFallback = readLocalCache();
      cachedConfigs = localFallback || FALLBACK_CONFIGS;
      return cachedConfigs;
    }
  })();

  return configsFetchPromise;
}


function transformUrlSync(
  url: string,
  vendor: string | null,
  configs: AffiliateConfig[]
): string {
  try {
    // Fix known broken domains before processing
    let fixedUrl = url;
    
    // eSUN domain fix: esun3d.com is broken, correct domain is esun3dstore.com
    if (fixedUrl.includes('esun3d.com') && !fixedUrl.includes('esun3dstore.com')) {
      // Remove www prefix if present, then replace domain
      fixedUrl = fixedUrl
        .replace(/^(https?:\/\/)www\.esun3d\.com/i, '$1esun3dstore.com')
        .replace(/^(https?:\/\/)esun3d\.com/i, '$1esun3dstore.com');
    }
    
    // Fix FormFutura URL: /products/{slug} -> /{slug}
    // FormFutura uses root-level product slugs, not /products/ path
    if (fixedUrl.includes('formfutura.com/products/')) {
      fixedUrl = fixedUrl.replace('/products/', '/');
    }
    
    const urlObj = new URL(fixedUrl);
    const hostname = urlObj.hostname.toLowerCase();

    // Check Amazon links - only process valid product URLs
    const isAmazonDomain = hostname.includes("amazon.com") || 
                           hostname.includes("amazon.co.") ||
                           hostname.includes("amazon.de") ||
                           hostname.includes("amzn.");
    
    if (isAmazonDomain) {
      const pathname = urlObj.pathname.toLowerCase();
      const isProductPage = pathname.includes('/dp/') || pathname.includes('/gp/product/');
      
      // Only add affiliate tag to valid product pages
      if (!isProductPage) {
        console.warn('[transformUrlSync] Invalid Amazon URL (not a product page):', fixedUrl);
        return fixedUrl; // Return as-is without modification
      }
      
      const amazonConfig = configs.find(c => c.vendor_name.toLowerCase() === "amazon");
      if (amazonConfig) {
        let tag: string | null = null;
        if (hostname.includes("amazon.com") && !hostname.includes(".co.")) {
          tag = amazonConfig.amazon_us_tag;
        } else if (hostname.includes("amazon.co.uk")) {
          tag = amazonConfig.amazon_uk_tag;
        } else if (hostname.includes("amazon.de")) {
          tag = amazonConfig.amazon_de_tag;
        } else {
          // Default to US tag for other Amazon domains
          tag = amazonConfig.amazon_us_tag;
        }
        
        if (tag) {
          // Clean the tag to prevent double-encoding issues
          const cleanTag = tag.replace(/^\?tag=/i, '').replace(/^tag=/i, '');
          urlObj.searchParams.set("tag", cleanTag);
          return urlObj.toString();
        }
      }
      return fixedUrl;
    }

    // Find config by vendor or hostname
    let config: AffiliateConfig | undefined;

    if (vendor) {
      config = configs.find(c =>
        c.vendor_name.toLowerCase() === vendor.toLowerCase()
      );
    }

    if (!config) {
      config = configs.find(c => {
        const vendorSlug = c.vendor_name.toLowerCase().replace(/\s+/g, "");
        return hostname.includes(vendorSlug) ||
          hostname.includes(c.vendor_name.toLowerCase().replace(/\s+/g, "-"));
      });
    }

    // Handle Awin redirect — wrap with awin1.com deep link
    if (
      config?.affiliate_network === "awin" &&
      config?.awin_advertiser_id &&
      config?.awin_affiliate_id
    ) {
      const encodedUrl = encodeURIComponent(fixedUrl);
      return `https://www.awin1.com/cread.php?awinmid=${config.awin_advertiser_id}&awinaffid=${config.awin_affiliate_id}&clickref=filascope&ued=${encodedUrl}`;
    }

    // Handle redirect_link — use the template URL directly (e.g. Elegoo Impact/SJ links)
    if (config?.affiliate_network === "redirect_link" && config?.affiliate_url_pattern?.startsWith("redirect:")) {
      return config.affiliate_url_pattern.slice("redirect:".length);
    }

    if (config?.affiliate_url_pattern) {
      const pattern = config.affiliate_url_pattern;
      // Resolve affiliate_id placeholder ({{id}})
      const affiliateId = config.affiliate_id || "";

      // {{raw_url}} pattern: Prusa-style fragment-based tracking e.g. "{{raw_url}}#a_aid={{id}}"
      // Strip any existing fragment first to avoid double-fragments
      if (pattern.includes("{{raw_url}}")) {
        const cleanUrl = fixedUrl.split("#")[0];
        return pattern
          .replace(/\{\{raw_url\}\}/gi, cleanUrl)
          .replace(/\{\{id\}\}/gi, affiliateId);
      }

      if (pattern.includes("{{url}}")) {
        return pattern
          .replace(/\{\{url\}\}/gi, encodeURIComponent(fixedUrl))
          .replace(/\{\{id\}\}/gi, affiliateId);
      }

      if (pattern.startsWith("?") || pattern.startsWith("&")) {
        const hasQuery = fixedUrl.includes("?");
        const separator = hasQuery ? "&" : "?";
        const params = pattern.substring(1).replace(/\{\{id\}\}/gi, affiliateId);
        return `${fixedUrl}${separator}${params}`;
      }
    }

    // UTM fallback: brand found but no affiliate pattern — minimum tracking
    if (config) {
      try {
        const fallbackObj = new URL(fixedUrl);
        if (!fallbackObj.searchParams.has("utm_source")) {
          fallbackObj.searchParams.set("utm_source", "filascope");
          fallbackObj.searchParams.set("utm_medium", "referral");
        }
        return fallbackObj.toString();
      } catch {
        // ignore
      }
    }

    return fixedUrl;
  } catch {
    // Even on error, try to fix the URL
    if (url.includes('esun3d.com') && !url.includes('esun3dstore.com')) {
      return url
        .replace(/^(https?:\/\/)www\.esun3d\.com/i, '$1esun3dstore.com')
        .replace(/^(https?:\/\/)esun3d\.com/i, '$1esun3dstore.com');
    }
    return url;
  }
}

export const useAffiliateLinks = () => {
  const [configs, setConfigs] = useState<AffiliateConfig[]>(cachedConfigs || []);
  const [isLoaded, setIsLoaded] = useState(!!cachedConfigs);

  useEffect(() => {
    if (cachedConfigs) {
      setConfigs(cachedConfigs);
      setIsLoaded(true);
      return;
    }

    fetchConfigs().then((data) => {
      setConfigs(data);
      setIsLoaded(true);
    });
  }, []);

  const getAffiliateUrl = useCallback((
    url: string | null | undefined, 
    vendor?: string | null
  ): string | null => {
    if (!url) return null;
    return transformUrlSync(url, vendor || null, configs);
  }, [configs]);

  // Convenience function for Amazon links specifically.
  // Accepts product pages (/dp/, /gp/product/) AND search pages (/s?k=) —
  // both are legitimate Amazon Associates "Program Links" per the Operating
  // Agreement. Auto-applies the correct per-marketplace tag based on domain.
  // Returns null only if the URL isn't an Amazon URL at all.
  const getAmazonUrl = useCallback((
    url: string | null | undefined,
    // Back-compat arg: ignored when URL already carries a tag; used as hint
    // for product-page URLs without an explicit tag.
    _region: "us" | "uk" | "de" = "us"
  ): string | null => {
    if (!url || url.trim() === '') return null;

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      const AMAZON_DOMAINS = [
        'amazon.com', 'amazon.ca', 'amazon.co.uk', 'amazon.de', 'amazon.fr',
        'amazon.it', 'amazon.es', 'amazon.com.au', 'amazon.co.jp', 'amazon.in',
        'amazon.nl', 'amazon.se', 'amazon.pl', 'amzn.to', 'amzn.com',
      ];
      const isAmazonDomain = AMAZON_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d) || hostname.endsWith(d));
      if (!isAmazonDomain) {
        return null;
      }

      const pathname = urlObj.pathname.toLowerCase();
      const isProductPage = pathname.includes('/dp/') || pathname.includes('/gp/product/');
      const isSearchPage  = pathname === '/s' || pathname.startsWith('/s/') || pathname.endsWith('/s');
      if (!isProductPage && !isSearchPage) {
        // Home page or category page — not monetizable reliably, reject.
        return null;
      }

      // Tag-per-marketplace. Honor any tag already on the URL (search-URL
      // backfill sets the correct tag already). Only override when missing.
      if (!urlObj.searchParams.get('tag')) {
        const amazonConfig = configs.find(c => c.vendor_name.toLowerCase() === 'amazon');
        if (amazonConfig) {
          const tagForDomain =
            hostname.endsWith('amazon.com')    ? amazonConfig.amazon_us_tag
          : hostname.endsWith('amazon.ca')     ? (amazonConfig.amazon_ca_tag || amazonConfig.amazon_us_tag)
          : hostname.endsWith('amazon.co.uk')  ? amazonConfig.amazon_uk_tag
          : hostname.endsWith('amazon.de')     ? amazonConfig.amazon_de_tag
          : hostname.endsWith('amazon.fr')     ? amazonConfig.amazon_de_tag
          : hostname.endsWith('amazon.it')     ? amazonConfig.amazon_de_tag
          : hostname.endsWith('amazon.es')     ? amazonConfig.amazon_de_tag
          : hostname.endsWith('amazon.com.au') ? (amazonConfig.amazon_au_tag || amazonConfig.amazon_us_tag)
          : hostname.endsWith('amazon.co.jp')  ? (amazonConfig.amazon_jp_tag || amazonConfig.amazon_us_tag)
          : amazonConfig.amazon_us_tag;
          if (tagForDomain) {
            const cleanTag = tagForDomain.replace(/^\?tag=/i, '').replace(/^tag=/i, '');
            urlObj.searchParams.set('tag', cleanTag);
          }
        }
      }
      return urlObj.toString();
    } catch (err) {
      console.warn('[getAmazonUrl] Failed to parse URL:', url, err);
      return null;
    }
  }, [configs]);

  return {
    getAffiliateUrl,
    getAmazonUrl,
    isLoaded,
    configs,
  };
};

// Standalone function for use outside of React components
export const transformAffiliateUrl = (
  url: string | null | undefined,
  vendor: string | null | undefined,
  configs: AffiliateConfig[]
): string | null => {
  if (!url) return null;
  return transformUrlSync(url, vendor || null, configs);
};