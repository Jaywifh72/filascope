import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AffiliateConfig {
  vendor_name: string;
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
    
    // Creality URL fallback - redirect to search if URL doesn't match expected patterns
    // Creality uses inconsistent URL slugs that can't be predicted
    if (fixedUrl.includes('store.creality.com/products/')) {
      const productSlug = fixedUrl.split('/products/')[1]?.split('?')[0];
      
      // Known working slugs (short ones that don't need modification)
      const shortSlugs = ['hyper-pla-cf', 'hyper-abs'];
      
      // If the slug is very short and not in the known list, it's likely broken
      if (productSlug && !shortSlugs.includes(productSlug) && !productSlug.includes('-filament-')) {
        // Extract product name from slug for search
        const searchTerm = productSlug.replace(/-/g, ' ');
        fixedUrl = `https://store.creality.com/search?keyword=${encodeURIComponent(searchTerm)}&collection=all-1`;
      }
    }
    
    const urlObj = new URL(fixedUrl);
    const hostname = urlObj.hostname.toLowerCase();

    // Check Amazon links
    if (hostname.includes("amazon.com")) {
      const amazonConfig = configs.find(c => c.vendor_name.toLowerCase() === "amazon");
      if (amazonConfig?.amazon_us_tag) {
        urlObj.searchParams.set("tag", amazonConfig.amazon_us_tag);
        return urlObj.toString();
      }
    } else if (hostname.includes("amazon.co.uk")) {
      const amazonConfig = configs.find(c => c.vendor_name.toLowerCase() === "amazon");
      if (amazonConfig?.amazon_uk_tag) {
        urlObj.searchParams.set("tag", amazonConfig.amazon_uk_tag);
        return urlObj.toString();
      }
    } else if (hostname.includes("amazon.de")) {
      const amazonConfig = configs.find(c => c.vendor_name.toLowerCase() === "amazon");
      if (amazonConfig?.amazon_de_tag) {
        urlObj.searchParams.set("tag", amazonConfig.amazon_de_tag);
        return urlObj.toString();
      }
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

      if (pattern.includes("{{url}}")) {
        return pattern.replace("{{url}}", fixedUrl);
      }

      if (pattern.startsWith("?") || pattern.startsWith("&")) {
        const hasQuery = fixedUrl.includes("?");
        const separator = hasQuery ? "&" : "?";
        const params = pattern.substring(1);
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
  const getAmazonUrl = useCallback((
    url: string | null | undefined, 
    region: "us" | "uk" | "de" = "us"
  ): string | null => {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      const amazonConfig = configs.find(c => c.vendor_name.toLowerCase() === "amazon");

      if (amazonConfig) {
        const tag = region === "us"
          ? amazonConfig.amazon_us_tag
          : region === "uk"
            ? amazonConfig.amazon_uk_tag
            : amazonConfig.amazon_de_tag;

        if (tag) {
          urlObj.searchParams.set("tag", tag);
          return urlObj.toString();
        }
      }

      return url;
    } catch {
      return url;
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