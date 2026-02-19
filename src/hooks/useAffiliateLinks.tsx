import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AffiliateConfig {
  vendor_name: string;
  affiliate_id: string | null;
  affiliate_url_pattern: string | null;
  amazon_us_tag: string | null;
  amazon_uk_tag: string | null;
  amazon_de_tag: string | null;
  // Awin fields for eSUN/KingRoon/Bambu etc.
  awin_advertiser_id?: string | null;
  awin_affiliate_id?: string | null;
  affiliate_network?: string | null;
}

// In-memory cache for configs — include a version key so updates to affiliate_configs bust it
let cachedConfigs: AffiliateConfig[] | null = null;
let configsFetchPromise: Promise<AffiliateConfig[]> | null = null;
const CACHE_VERSION = "v3"; // bump when affiliate_configs data changes


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
        // e.g. ?ref=JEANJACQUESBOILEAU or ?sca_ref=432793.sgEubTAk&source=filascope
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
        // e.g. Elegoo: https://elegoo.sjv.io/QYPW6x — use the template as the full redirect URL
        // Store as a special pattern: "redirect:{{template}}"
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

  configsFetchPromise = (async () => {
    try {
      // Fetch base configs from edge function (affiliate_configs table)
      const { data, error } = await supabase.functions.invoke("get-affiliate-url", {
        body: { getConfigs: true },
      });

      if (error || !data?.configs) {
        console.error("Error fetching affiliate configs:", error);
        return [];
      }

      const baseConfigs: AffiliateConfig[] = data.configs;

      // Bridge: also fetch affiliate_programs for brands NOT in affiliate_configs
      const existingNames = baseConfigs.map((c) => c.vendor_name);
      const bridged = await fetchAffiliateProgramsBridge(existingNames);

      cachedConfigs = [...baseConfigs, ...bridged];
      return cachedConfigs;
    } catch (err) {
      console.error("Error calling affiliate function:", err);
      return [];
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

  // Convenience function for Amazon links specifically
  // Returns null if URL is invalid, missing, or not a valid Amazon product page
  const getAmazonUrl = useCallback((
    url: string | null | undefined, 
    region: "us" | "uk" | "de" = "us"
  ): string | null => {
    // Guard against null/empty URLs
    if (!url || url.trim() === '') return null;

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Validate this is actually an Amazon domain
      const isAmazonDomain = hostname.includes('amazon.com') || 
                             hostname.includes('amazon.co.') ||
                             hostname.includes('amazon.de') ||
                             hostname.includes('amazon.fr') ||
                             hostname.includes('amazon.it') ||
                             hostname.includes('amazon.es') ||
                             hostname.includes('amzn.');
      
      if (!isAmazonDomain) {
        console.warn('[getAmazonUrl] Not an Amazon domain:', hostname);
        return null;
      }
      
      // Validate this is a product page (must contain /dp/ or /gp/product/)
      const pathname = urlObj.pathname.toLowerCase();
      const isProductPage = pathname.includes('/dp/') || pathname.includes('/gp/product/');
      
      if (!isProductPage) {
        console.warn('[getAmazonUrl] Not a valid Amazon product URL (missing /dp/ or /gp/product/):', url);
        return null;
      }
      
      const amazonConfig = configs.find(c => c.vendor_name.toLowerCase() === "amazon");

      if (amazonConfig) {
        const tag = region === "us"
          ? amazonConfig.amazon_us_tag
          : region === "uk"
            ? amazonConfig.amazon_uk_tag
            : amazonConfig.amazon_de_tag;

        if (tag) {
          // Ensure tag doesn't already contain ?tag= prefix (prevent double-encoding)
          const cleanTag = tag.replace(/^\?tag=/i, '').replace(/^tag=/i, '');
          urlObj.searchParams.set("tag", cleanTag);
          return urlObj.toString();
        }
      }

      return url;
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