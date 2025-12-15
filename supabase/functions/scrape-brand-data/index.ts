import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { BRAND_CONFIGS, type BrandConfig } from "./config.ts";
import { ShopifyScraper } from "./scrapers/shopify.ts";
import { WooCommerceScraper } from "./scrapers/woocommerce.ts";
import { BigCommerceScraper } from "./scrapers/bigcommerce.ts";
import { AmazonScraper } from "./scrapers/amazon.ts";
import type { BaseScraper, ScrapedProduct } from "./scrapers/base.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapeRequest {
  vendor?: string;
  all?: boolean;
  limit?: number;
  force?: boolean;
  dryRun?: boolean;
}

interface ScrapeStats {
  processed: number;
  updated: number;
  unchanged: number;
  errors: number;
  priceHistoryLogged: number;
}

function getScraper(config: BrandConfig): BaseScraper {
  switch (config.platform) {
    case "shopify":
      return new ShopifyScraper(config);
    case "woocommerce":
      return new WooCommerceScraper(config);
    case "bigcommerce":
      return new BigCommerceScraper(config);
    case "amazon":
      return new AmazonScraper(config);
    default:
      throw new Error(`Unknown platform: ${config.platform}`);
  }
}

async function processScrapedProducts(
  supabase: SupabaseClient,
  products: ScrapedProduct[],
  vendor: string,
  dryRun: boolean,
  force: boolean
): Promise<{ stats: ScrapeStats; results: unknown[] }> {
  const stats: ScrapeStats = {
    processed: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    priceHistoryLogged: 0,
  };
  const results: unknown[] = [];

  for (const product of products) {
    stats.processed++;

    try {
      // Find matching filament in database
      const { data: filament, error: findError } = await supabase
        .from("filaments")
        .select("id, variant_price, product_title")
        .eq("vendor", vendor)
        .or(`product_id.eq.${product.productId},variant_sku.eq.${product.sku || ""}`)
        .maybeSingle();

      if (findError) {
        console.error(`Error finding filament for ${product.title}:`, findError);
        stats.errors++;
        continue;
      }

      if (!filament) {
        console.log(`No matching filament found for: ${product.title} (${product.productId})`);
        stats.errors++;
        results.push({
          productId: product.productId,
          title: product.title,
          status: "not_found",
        });
        continue;
      }

      const oldPrice = filament.variant_price;
      const newPrice = product.price;
      const priceChanged = oldPrice !== newPrice && newPrice !== null;

      if (!priceChanged && !force) {
        stats.unchanged++;
        results.push({
          id: filament.id,
          title: product.title,
          price: newPrice,
          status: "unchanged",
        });
        continue;
      }

      if (dryRun) {
        stats.updated++;
        results.push({
          id: filament.id,
          title: product.title,
          oldPrice,
          newPrice,
          status: "would_update",
        });
        continue;
      }

      // Update filament price (trigger will log to price_history)
      const { error: updateError } = await supabase
        .from("filaments")
        .update({
          variant_price: newPrice,
          variant_available: product.available,
          updated_at: new Date().toISOString(),
        })
        .eq("id", filament.id);

      if (updateError) {
        console.error(`Error updating filament ${filament.id}:`, updateError);
        stats.errors++;
        results.push({
          id: filament.id,
          title: product.title,
          status: "error",
          error: updateError.message,
        });
        continue;
      }

      stats.updated++;
      if (priceChanged) {
        stats.priceHistoryLogged++;
      }

      results.push({
        id: filament.id,
        title: product.title,
        oldPrice,
        newPrice,
        status: "updated",
      });

      console.log(`Updated ${product.title}: $${oldPrice} → $${newPrice}`);
    } catch (err) {
      console.error(`Error processing ${product.title}:`, err);
      stats.errors++;
      results.push({
        productId: product.productId,
        title: product.title,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { stats, results };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ScrapeRequest = req.method === "POST" ? await req.json() : {};
    const { vendor, all = false, limit = 100, force = false, dryRun = false } = body;

    console.log(`Scrape request: vendor=${vendor}, all=${all}, limit=${limit}, force=${force}, dryRun=${dryRun}`);

    // Determine which vendors to scrape
    const vendorsToScrape: string[] = [];
    if (all) {
      vendorsToScrape.push(...Object.keys(BRAND_CONFIGS));
    } else if (vendor) {
      if (!BRAND_CONFIGS[vendor]) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown vendor: ${vendor}. Available: ${Object.keys(BRAND_CONFIGS).join(", ")}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      vendorsToScrape.push(vendor);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Provide 'vendor' or set 'all: true'",
          availableVendors: Object.keys(BRAND_CONFIGS),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allResults: Record<string, { stats: ScrapeStats; results: any[] }> = {};

    for (const v of vendorsToScrape) {
      console.log(`\n=== Scraping ${v} ===`);
      const config = BRAND_CONFIGS[v];
      const scraper = getScraper(config);

      try {
        const products = await scraper.scrapeAllProducts(limit);
        console.log(`Scraped ${products.length} products from ${v}`);

        const { stats, results } = await processScrapedProducts(
          supabase,
          products,
          v,
          dryRun,
          force
        );

        allResults[v] = { stats, results };
      } catch (err) {
        console.error(`Error scraping ${v}:`, err);
        allResults[v] = {
          stats: { processed: 0, updated: 0, unchanged: 0, errors: 1, priceHistoryLogged: 0 },
          results: [{ status: "error", error: err instanceof Error ? err.message : "Unknown error" }],
        };
      }
    }

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

    // Aggregate stats
    const totalStats: ScrapeStats = {
      processed: 0,
      updated: 0,
      unchanged: 0,
      errors: 0,
      priceHistoryLogged: 0,
    };

    for (const v of vendorsToScrape) {
      const { stats } = allResults[v];
      totalStats.processed += stats.processed;
      totalStats.updated += stats.updated;
      totalStats.unchanged += stats.unchanged;
      totalStats.errors += stats.errors;
      totalStats.priceHistoryLogged += stats.priceHistoryLogged;
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        vendors: vendorsToScrape,
        totalStats,
        vendorResults: allResults,
        executionTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
