import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AffiliateConfig {
  vendor_name: string;
  affiliate_url_pattern: string | null;
  amazon_us_tag: string | null;
  amazon_uk_tag: string | null;
  amazon_de_tag: string | null;
}

function transformUrl(
  url: string,
  vendor: string | null,
  configs: AffiliateConfig[]
): string {
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
        .select("vendor_name, affiliate_url_pattern, amazon_us_tag, amazon_uk_tag, amazon_de_tag");

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
