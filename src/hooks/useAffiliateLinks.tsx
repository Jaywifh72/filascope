import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AffiliateConfig {
  vendor_name: string;
  affiliate_url_pattern: string | null;
  amazon_us_tag: string | null;
  amazon_uk_tag: string | null;
  amazon_de_tag: string | null;
}

let cachedConfigs: AffiliateConfig[] | null = null;

export const useAffiliateLinks = () => {
  const [configs, setConfigs] = useState<AffiliateConfig[]>(cachedConfigs || []);
  const [isLoaded, setIsLoaded] = useState(!!cachedConfigs);

  useEffect(() => {
    if (cachedConfigs) {
      setConfigs(cachedConfigs);
      setIsLoaded(true);
      return;
    }

    const fetchConfigs = async () => {
      const { data } = await supabase
        .from("affiliate_configs")
        .select("vendor_name, affiliate_url_pattern, amazon_us_tag, amazon_uk_tag, amazon_de_tag");
      
      if (data) {
        cachedConfigs = data;
        setConfigs(data);
      }
      setIsLoaded(true);
    };

    fetchConfigs();
  }, []);

  const getAffiliateUrl = useCallback((url: string | null | undefined, vendor?: string | null): string | null => {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Check if it's an Amazon link
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

      // Try to find config by vendor name first
      let config: AffiliateConfig | undefined;
      
      if (vendor) {
        config = configs.find(c => 
          c.vendor_name.toLowerCase() === vendor.toLowerCase()
        );
      }

      // If no vendor match, try to match by URL hostname
      if (!config) {
        config = configs.find(c => {
          const vendorSlug = c.vendor_name.toLowerCase().replace(/\s+/g, "").replace(/3d$/i, "3d");
          return hostname.includes(vendorSlug) || 
                 hostname.includes(c.vendor_name.toLowerCase().replace(/\s+/g, "-"));
        });
      }

      // Apply affiliate pattern if found
      if (config?.affiliate_url_pattern) {
        const pattern = config.affiliate_url_pattern;
        
        // Pattern contains {{url}} placeholder - replace it
        if (pattern.includes("{{url}}")) {
          return pattern.replace("{{url}}", url);
        }
        
        // Pattern is just params to append (e.g., "?aff=99" or "&aff=99")
        if (pattern.startsWith("?") || pattern.startsWith("&")) {
          const hasQuery = url.includes("?");
          const separator = hasQuery ? "&" : "?";
          const params = pattern.startsWith("?") || pattern.startsWith("&") 
            ? pattern.substring(1) 
            : pattern;
          return `${url}${separator}${params}`;
        }
      }

      return url;
    } catch {
      // Invalid URL, return as-is
      return url;
    }
  }, [configs]);

  // Convenience function for Amazon links specifically
  const getAmazonUrl = useCallback((url: string | null | undefined, region: "us" | "uk" | "de" = "us"): string | null => {
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

  try {
    const urlObj = new URL(url);
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
        return pattern.replace("{{url}}", url);
      }
      
      if (pattern.startsWith("?") || pattern.startsWith("&")) {
        const hasQuery = url.includes("?");
        const separator = hasQuery ? "&" : "?";
        const params = pattern.substring(1);
        return `${url}${separator}${params}`;
      }
    }

    return url;
  } catch {
    return url;
  }
};
