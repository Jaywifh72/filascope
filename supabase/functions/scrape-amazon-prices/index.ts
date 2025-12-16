import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting for Amazon requests
const AMAZON_RATE_LIMIT_MS = 1100;
let lastAmazonRequestTime = 0;

async function respectRateLimit() {
  const now = Date.now();
  const elapsed = now - lastAmazonRequestTime;
  if (elapsed < AMAZON_RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, AMAZON_RATE_LIMIT_MS - elapsed));
  }
  lastAmazonRequestTime = Date.now();
}

function extractPriceFromHtml(html: string): number | null {
  // Multiple patterns for Amazon price extraction
  const patterns = [
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([0-9,]+)<\/span>/i,
    /<span[^>]*id="priceblock_ourprice"[^>]*>\$([0-9,.]+)<\/span>/i,
    /<span[^>]*id="priceblock_dealprice"[^>]*>\$([0-9,.]+)<\/span>/i,
    /class="a-price"[^>]*>.*?<span[^>]*>.*?\$([0-9,.]+)/is,
    /"price":\s*"?\$?([0-9,.]+)"?/i,
    /\$([0-9]+\.[0-9]{2})/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/,/g, "");
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0 && price < 1000) {
        return Math.round(price * 100) / 100;
      }
    }
  }

  return null;
}

function extractPriceFromMarkdown(markdown: string): number | null {
  // Look for price patterns in markdown content
  const patterns = [
    /\$([0-9]+\.[0-9]{2})/,
    /Price:\s*\$([0-9,.]+)/i,
    /\$([0-9]+)\s*\.\s*([0-9]{2})/,
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      let priceStr = match[1];
      if (match[2]) {
        priceStr = `${match[1]}.${match[2]}`;
      }
      const price = parseFloat(priceStr.replace(/,/g, ""));
      if (!isNaN(price) && price > 0 && price < 1000) {
        return Math.round(price * 100) / 100;
      }
    }
  }

  return null;
}

async function scrapeAmazonPrice(url: string, firecrawlApiKey: string): Promise<number | null> {
  await respectRateLimit();

  try {
    console.log(`[Amazon] Scraping price from: ${url}`);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["html", "markdown"],
        waitFor: 3000,
        timeout: 15000,
      }),
    });

    if (!response.ok) {
      console.error(`[Amazon] Firecrawl error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.success) {
      console.error(`[Amazon] Firecrawl failed:`, data.error);
      return null;
    }

    // Try extracting from HTML first
    let price = null;
    if (data.data?.html) {
      price = extractPriceFromHtml(data.data.html);
    }

    // Fall back to markdown if HTML extraction failed
    if (!price && data.data?.markdown) {
      price = extractPriceFromMarkdown(data.data.markdown);
    }

    // Try metadata
    if (!price && data.data?.metadata?.price) {
      const metaPrice = parseFloat(data.data.metadata.price.replace(/[^0-9.]/g, ""));
      if (!isNaN(metaPrice) && metaPrice > 0 && metaPrice < 1000) {
        price = Math.round(metaPrice * 100) / 100;
      }
    }

    console.log(`[Amazon] Extracted price: ${price}`);
    return price;
  } catch (error) {
    console.error(`[Amazon] Error scraping ${url}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendor, limit = 50 } = await req.json();

    if (!vendor) {
      return new Response(
        JSON.stringify({ success: false, error: "Vendor name required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[Amazon] Starting price scrape for vendor: ${vendor}, limit: ${limit}`);

    // Get filaments for this vendor that have Amazon links
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, amazon_link_us, amazon_price_usd")
      .ilike("vendor", vendor)
      .not("amazon_link_us", "is", null)
      .limit(limit);

    if (fetchError) {
      console.error(`[Amazon] Error fetching filaments:`, fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No filaments with Amazon links found",
          processed: 0,
          updated: 0,
          failed: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Amazon] Found ${filaments.length} filaments with Amazon links`);

    let processed = 0;
    let updated = 0;
    let failed = 0;
    const results: { title: string; oldPrice: number | null; newPrice: number | null; status: string }[] = [];

    for (const filament of filaments) {
      processed++;
      
      const price = await scrapeAmazonPrice(filament.amazon_link_us, firecrawlApiKey);

      if (price !== null) {
        const { error: updateError } = await supabase
          .from("filaments")
          .update({
            amazon_price_usd: price,
            amazon_prices_last_updated_at: new Date().toISOString(),
          })
          .eq("id", filament.id);

        if (updateError) {
          console.error(`[Amazon] Error updating ${filament.product_title}:`, updateError);
          failed++;
          results.push({
            title: filament.product_title,
            oldPrice: filament.amazon_price_usd,
            newPrice: null,
            status: "error",
          });
        } else {
          updated++;
          results.push({
            title: filament.product_title,
            oldPrice: filament.amazon_price_usd,
            newPrice: price,
            status: "updated",
          });
          console.log(`[Amazon] Updated ${filament.product_title}: $${price}`);
        }
      } else {
        failed++;
        results.push({
          title: filament.product_title,
          oldPrice: filament.amazon_price_usd,
          newPrice: null,
          status: "no_price",
        });
      }
    }

    // Update brand statistics
    const { data: priceCount } = await supabase
      .from("filaments")
      .select("id", { count: "exact" })
      .ilike("vendor", vendor)
      .not("amazon_price_usd", "is", null);

    await supabase
      .from("automated_brands")
      .update({
        products_with_amazon_prices: priceCount?.length || 0,
        amazon_last_scrape_at: new Date().toISOString(),
      })
      .ilike("brand_name", vendor);

    console.log(`[Amazon] Completed: processed=${processed}, updated=${updated}, failed=${failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        vendor,
        processed,
        updated,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Amazon] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
