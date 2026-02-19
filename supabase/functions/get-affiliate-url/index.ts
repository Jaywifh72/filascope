import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AffiliateConfig {
  vendor_name: string;
  brand_id: string | null;
  affiliate_network: string | null;
  affiliate_id: string | null;
  affiliate_url_pattern: string | null;
  amazon_us_tag: string | null;
  amazon_uk_tag: string | null;
  amazon_de_tag: string | null;
  amazon_ca_tag: string | null;
  amazon_au_tag: string | null;
  amazon_jp_tag: string | null;
  awin_advertiser_id: string | null;
  awin_affiliate_id: string | null;
  impact_program_id: string | null;
  impact_media_partner_id: string | null;
  tracking_url_template: string | null;
  is_active: boolean;
}

// Detect Amazon region from URL
function detectAmazonRegion(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes("amazon.com") && !hostname.includes(".co.")) return "us";
  if (hostname.includes("amazon.co.uk")) return "uk";
  if (hostname.includes("amazon.de")) return "de";
  if (hostname.includes("amazon.ca")) return "ca";
  if (hostname.includes("amazon.com.au")) return "au";
  if (hostname.includes("amazon.co.jp") || hostname.includes("amazon.jp")) return "jp";
  if (hostname.includes("amazon.fr")) return "fr";
  if (hostname.includes("amazon.it")) return "it";
  if (hostname.includes("amazon.es")) return "es";
  return "us"; // default
}

// Add Amazon affiliate tag
function addAmazonTag(url: string, config: AffiliateConfig, region: string): string {
  try {
    const urlObj = new URL(url);
    
    let tag: string | null = null;
    switch (region) {
      case "us": tag = config.amazon_us_tag; break;
      case "uk": tag = config.amazon_uk_tag; break;
      case "de": tag = config.amazon_de_tag; break;
      case "ca": tag = config.amazon_ca_tag; break;
      case "au": tag = config.amazon_au_tag; break;
      case "jp": tag = config.amazon_jp_tag; break;
      default: tag = config.amazon_us_tag;
    }
    
    if (tag) {
      urlObj.searchParams.set("tag", tag);
      return urlObj.toString();
    }
    
    return url;
  } catch {
    return url;
  }
}

// Wrap URL with Awin tracking
function wrapWithAwin(url: string, config: AffiliateConfig): string {
  if (!config.awin_affiliate_id || !config.awin_advertiser_id) {
    return url;
  }
  
  // Awin deep link format
  const encodedUrl = encodeURIComponent(url);
  return `https://www.awin1.com/cread.php?awinmid=${config.awin_advertiser_id}&awinaffid=${config.awin_affiliate_id}&ued=${encodedUrl}`;
}

// Wrap URL with Impact tracking
function wrapWithImpact(url: string, config: AffiliateConfig): string {
  if (!config.impact_media_partner_id || !config.impact_program_id) {
    return url;
  }
  
  // Impact.com deep link format
  const encodedUrl = encodeURIComponent(url);
  return `https://${config.impact_program_id}.pxf.io/c/${config.impact_media_partner_id}/${encodedUrl}`;
}

// Apply custom URL pattern
function applyPattern(url: string, pattern: string, affiliateId: string | null): string {
  if (!pattern) return url;
  
  try {
    // Strip any existing fragment from the URL before substitution to avoid double-fragments
    // (e.g. Prusa uses fragment-based tracking: {{raw_url}}#a_aid={{id}})
    const cleanUrl = url.split('#')[0];

    // Replace placeholders
    let result = pattern
      .replace(/\{\{url\}\}/gi, encodeURIComponent(cleanUrl))
      .replace(/\{\{id\}\}/gi, affiliateId || "")
      .replace(/\{\{raw_url\}\}/gi, cleanUrl);
    
    // If pattern is just parameters, append to URL
    if (pattern.startsWith("?") || pattern.startsWith("&")) {
      const urlObj = new URL(url);
      const params = pattern.substring(1).replace(/\{\{id\}\}/gi, affiliateId || "");
      const paramPairs = params.split("&");
      for (const pair of paramPairs) {
        const [key, value] = pair.split("=");
        if (key) {
          urlObj.searchParams.set(key, value || "");
        }
      }
      return urlObj.toString();
    }
    
    return result;
  } catch {
    return url;
  }
}

function transformUrl(
  url: string,
  vendor: string | null,
  configs: AffiliateConfig[]
): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if this is an Amazon link
    const isAmazonLink = hostname.includes("amazon.");
    
    if (isAmazonLink) {
      // Find Amazon config or global Amazon config
      const amazonConfig = configs.find(c => 
        c.vendor_name.toLowerCase() === "amazon" ||
        c.affiliate_network === "amazon"
      );
      
      if (amazonConfig && amazonConfig.is_active !== false) {
        const region = detectAmazonRegion(url);
        return addAmazonTag(url, amazonConfig, region);
      }
    }

    // Find config by vendor name or hostname
    let config: AffiliateConfig | undefined;

    if (vendor) {
      config = configs.find(c =>
        c.vendor_name.toLowerCase() === vendor.toLowerCase() &&
        c.is_active !== false
      );
    }

    if (!config) {
      config = configs.find(c => {
        if (c.is_active === false) return false;
        const vendorSlug = c.vendor_name.toLowerCase().replace(/\s+/g, "");
        return hostname.includes(vendorSlug) ||
          hostname.includes(c.vendor_name.toLowerCase().replace(/\s+/g, "-"));
      });
    }

    if (!config) {
      return url;
    }

    // Apply transformation based on network type
    switch (config.affiliate_network) {
      case "amazon":
        const region = detectAmazonRegion(url);
        return addAmazonTag(url, config, region);
        
      case "awin":
        return wrapWithAwin(url, config);
        
      case "impact":
        return wrapWithImpact(url, config);
        
      case "goaffpro":
      case "shareasale":
      case "direct":
        // Direct programs: Prusa uses fragment-based tracking (#a_aid=Jay) via affiliate_url_pattern
        // Other direct programs may use ?ref= style
        if (config.affiliate_url_pattern) {
          return applyPattern(url, config.affiliate_url_pattern, config.affiliate_id);
        } else if (config.affiliate_id) {
          // Default to adding ?ref=ID for GoAffPro
          const separator = url.includes("?") ? "&" : "?";
          return `${url}${separator}ref=${config.affiliate_id}`;
        }
        // No pattern or ID — UTM fallback
        return addUtmFallback(url);
        
      case "none":
        return url;
        
      default:
        // Legacy pattern support
        if (config.affiliate_url_pattern) {
          return applyPattern(url, config.affiliate_url_pattern, config.affiliate_id);
        }
        // UTM fallback: brand is configured but no pattern — at minimum tag with filascope UTMs
        try {
          const fallbackObj = new URL(url);
          fallbackObj.searchParams.set("utm_source", "filascope");
          fallbackObj.searchParams.set("utm_medium", "referral");
          return fallbackObj.toString();
        } catch {
          return url;
        }
    }
  } catch {
    return url;
  }
}

// Add UTM fallback to any recognized vendor with no affiliate transformation
function addUtmFallback(url: string): string {
  try {
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has("utm_source")) {
      urlObj.searchParams.set("utm_source", "filascope");
      urlObj.searchParams.set("utm_medium", "referral");
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Cache configs in memory for the function instance
let cachedConfigs: AffiliateConfig[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const now = Date.now();
    if (!cachedConfigs || now - cacheTime > CACHE_TTL) {
      const { data, error } = await supabase
        .from("affiliate_configs")
        .select(`
          vendor_name,
          brand_id,
          affiliate_network,
          affiliate_id,
          affiliate_url_pattern,
          amazon_us_tag,
          amazon_uk_tag,
          amazon_de_tag,
          amazon_ca_tag,
          amazon_au_tag,
          amazon_jp_tag,
          awin_advertiser_id,
          awin_affiliate_id,
          impact_program_id,
          impact_media_partner_id,
          tracking_url_template,
          is_active
        `);

      if (error) {
        console.error("Error fetching configs:", error);
        throw error;
      }

      cachedConfigs = data || [];
      cacheTime = now;
    }

    const body = await req.json();

    // Return configs for client-side caching
    if (body.getConfigs) {
      return new Response(JSON.stringify({ configs: cachedConfigs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Support both single URL and batch requests
    if (body.urls && Array.isArray(body.urls)) {
      // Batch mode: transform multiple URLs
      const results = body.urls.map((item: { url: string; vendor?: string }) => ({
        original: item.url,
        affiliate: transformUrl(item.url, item.vendor || null, cachedConfigs!),
      }));

      return new Response(JSON.stringify({ urls: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (body.url) {
      // Single URL mode
      const affiliateUrl = transformUrl(body.url, body.vendor || null, cachedConfigs!);

      return new Response(JSON.stringify({ url: affiliateUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Missing url, urls, or getConfigs parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});