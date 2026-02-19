import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AffiliateConfig {
  vendor_name: string;
  affiliate_id: string | null;
  affiliate_url_pattern: string | null;
  amazon_us_tag: string | null;
  amazon_uk_tag: string | null;
  amazon_de_tag: string | null;
}

// In-memory cache for configs fetched from edge function
let cachedConfigs: AffiliateConfig[] | null = null;
let configsFetchPromise: Promise<AffiliateConfig[]> | null = null;

async function fetchConfigs(): Promise<AffiliateConfig[]> {
  if (cachedConfigs) return cachedConfigs;
  
  if (configsFetchPromise) return configsFetchPromise;

  configsFetchPromise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-affiliate-url", {
        body: { getConfigs: true },
      });

      if (error || !data?.configs) {
        console.error("Error fetching affiliate configs:", error);
        return [];
      }

      cachedConfigs = data.configs;
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