import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { BRAND_CONFIGS, type BrandConfig } from "./config.ts";
import { ShopifyScraper } from "./scrapers/shopify.ts";
import { WooCommerceScraper } from "./scrapers/woocommerce.ts";
import { BigCommerceScraper } from "./scrapers/bigcommerce.ts";
import { AmazonScraper } from "./scrapers/amazon.ts";
import { FirecrawlScraper } from "./scrapers/firecrawl.ts";
import type { BaseScraper, ScrapedProduct } from "./scrapers/base.ts";
import { calculateHash, detectMaterial, extractColor, extractWeight, extractDiameter } from "./utils.ts";

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
  created: number;
  updated: number;
  unchanged: number;
  errors: number;
  priceChanges: number;
  availabilityChanges: number;
  priceHistoryLogged: number;
  errorDetails: string[];
}

interface SyncLog {
  id: string;
  sync_type: string;
  data_source: string;
  status: string;
  started_at: string;
}

interface AutomatedBrandConfig {
  id: string;
  brand_name: string;
  brand_slug: string;
  auto_create_products: boolean;
  scraping_enabled: boolean;
  default_currency: string;
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
    case "firecrawl":
      return new FirecrawlScraper(config);
    default:
      throw new Error(`Unknown platform: ${config.platform}`);
  }
}

// Get brand config from database for auto-creation settings
async function getBrandConfig(supabase: SupabaseClient, vendor: string): Promise<AutomatedBrandConfig | null> {
  const { data, error } = await supabase
    .from("automated_brands")
    .select("id, brand_name, brand_slug, auto_create_products, scraping_enabled, default_currency")
    .or(`brand_name.ilike.%${vendor}%,brand_slug.eq.${vendor.toLowerCase().replace(/\s+/g, '-')}`)
    .maybeSingle();
  
  if (error) {
    console.error(`Error fetching brand config for ${vendor}:`, error);
    return null;
  }
  
  return data;
}

// Create a new filament from scraped product data
async function createFilamentFromScrapedProduct(
  supabase: SupabaseClient,
  vendor: string,
  brandConfig: AutomatedBrandConfig | null,
  product: ScrapedProduct,
  staticConfig: BrandConfig
): Promise<boolean> {
  const material = detectMaterial(product.title);
  const colorInfo = extractColor(product.title);
  const weight = extractWeight(product.title);
  const diameter = extractDiameter(product.title);
  
  // Extract handle from URL
  const urlParts = product.url.split('/');
  const handle = urlParts[urlParts.length - 1] || product.productId;
  
  const filamentData = {
    product_id: product.productId,
    product_title: product.title,
    product_handle: handle,
    product_url: product.url,
    vendor: vendor,
    brand_id: brandConfig?.id || null,
    material: material,
    color_family: colorInfo?.family || null,
    color_hex: colorInfo?.hex || null,
    net_weight_g: weight,
    diameter_nominal_mm: diameter || 1.75,
    variant_price: product.price,
    variant_compare_at_price: product.compareAtPrice,
    variant_available: product.available,
    variant_sku: product.sku || null,
    auto_created: true,
    auto_updated: true,
    last_scraped_at: new Date().toISOString(),
    sync_status: "synced",
  };
  
  const { error } = await supabase.from("filaments").insert(filamentData);
  
  if (error) {
    console.error(`❌ Failed to create filament ${product.title}:`, error);
    throw error;
  }
  
  console.log(`✨ Created: ${product.title} [${material || 'Unknown'}]`);
  return true;
}

async function createSyncLog(
  supabase: SupabaseClient,
  dataSource: string
): Promise<SyncLog | null> {
  const { data, error } = await supabase
    .from("sync_logs")
    .insert({
      sync_type: "filaments",
      data_source: dataSource,
      status: "running",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create sync log:", error);
    return null;
  }
  return data;
}

async function updateSyncLog(
  supabase: SupabaseClient,
  logId: string,
  stats: ScrapeStats,
  duration: number,
  error?: string
): Promise<void> {
  const status = error ? "failed" : stats.errors > 0 ? "partial" : "completed";
  
  await supabase
    .from("sync_logs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      records_fetched: stats.processed,
      records_updated: stats.updated + stats.created,
      records_failed: stats.errors,
      duration_seconds: duration,
      success_details: {
        created: stats.created,
        updated: stats.updated,
        priceChanges: stats.priceChanges,
        availabilityChanges: stats.availabilityChanges,
        unchanged: stats.unchanged,
        errorDetails: stats.errorDetails.slice(0, 50),
      },
      error_message: error || null,
    })
    .eq("id", logId);
}

async function processScrapedProducts(
  supabase: SupabaseClient,
  products: ScrapedProduct[],
  vendor: string,
  dryRun: boolean,
  force: boolean,
  staticConfig: BrandConfig
): Promise<{ stats: ScrapeStats; results: unknown[] }> {
  const stats: ScrapeStats = {
    processed: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    priceChanges: 0,
    availabilityChanges: 0,
    priceHistoryLogged: 0,
    errorDetails: [],
  };
  const results: unknown[] = [];

  // Get brand config from database for auto-creation settings
  const brandConfig = await getBrandConfig(supabase, vendor);
  const canAutoCreate = brandConfig?.auto_create_products ?? false;
  
  if (canAutoCreate) {
    console.log(`🔧 Auto-creation enabled for ${vendor}`);
  }

  for (const product of products) {
    stats.processed++;

    try {
      // Find matching filament in database using flexible vendor matching
      const { data: filament, error: findError } = await supabase
        .from("filaments")
        .select("id, variant_price, variant_available, product_title, external_data_hash, user_override_fields")
        .ilike("vendor", `%${vendor}%`)
        .or(`product_id.eq.${product.productId},variant_sku.eq.${product.sku || ""}`)
        .maybeSingle();

      if (findError) {
        console.error(`Error finding filament for ${product.title}:`, findError);
        stats.errors++;
        stats.errorDetails.push(`${product.productId}: DB lookup failed`);
        continue;
      }

      // AUTO-CREATE: If no matching filament found and auto-creation is enabled
      if (!filament) {
        if (canAutoCreate && !dryRun) {
          try {
            await createFilamentFromScrapedProduct(supabase, vendor, brandConfig, product, staticConfig);
            stats.created++;
            results.push({
              productId: product.productId,
              title: product.title,
              status: "created",
            });
            continue;
          } catch (createError) {
            console.error(`Failed to create filament ${product.title}:`, createError);
            stats.errors++;
            stats.errorDetails.push(`${product.productId}: Creation failed`);
            continue;
          }
        } else if (canAutoCreate && dryRun) {
          stats.created++;
          results.push({
            productId: product.productId,
            title: product.title,
            status: "would_create",
          });
          continue;
        }
        
        // No auto-create - log as not found
        console.log(`No matching filament found for: ${product.title} (${product.productId})`);
        stats.errors++;
        results.push({
          productId: product.productId,
          title: product.title,
          status: "not_found",
        });
        continue;
      }

      // Calculate hash for change detection
      const newHash = calculateHash(JSON.stringify({
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        available: product.available,
      }));

      // Skip if unchanged (unless force is set)
      if (newHash === filament.external_data_hash && !force) {
        stats.unchanged++;
        results.push({
          id: filament.id,
          title: product.title,
          status: "unchanged",
        });
        continue;
      }

      const oldPrice = filament.variant_price;
      const newPrice = product.price;
      const priceChanged = oldPrice !== newPrice && newPrice !== null;
      const availabilityChanged = filament.variant_available !== product.available;

      if (priceChanged) stats.priceChanges++;
      if (availabilityChanged) stats.availabilityChanges++;

      if (priceChanged) {
        console.log(`💰 ${product.title}: $${oldPrice || 'null'} → $${newPrice}`);
      }

      if (dryRun) {
        stats.updated++;
        results.push({
          id: filament.id,
          title: product.title,
          oldPrice,
          newPrice,
          priceChanged,
          availabilityChanged,
          status: "would_update",
        });
        continue;
      }

      // Build update object, respecting user overrides
      const overrides = filament.user_override_fields || [];
      const updates: Record<string, unknown> = {
        external_data_hash: newHash,
        last_external_sync_at: new Date().toISOString(),
        sync_status: "synced",
        updated_at: new Date().toISOString(),
      };

      // Only update fields not overridden by user
      if (!overrides.includes("variant_price") && newPrice !== null) {
        updates.variant_price = newPrice;
      }

      if (!overrides.includes("variant_available")) {
        updates.variant_available = product.available;
      }

      if (!overrides.includes("variant_compare_at_price") && product.compareAtPrice !== null) {
        updates.variant_compare_at_price = product.compareAtPrice;
      }

      // Update filament (trigger will log to price_history if price changed)
      const { error: updateError } = await supabase
        .from("filaments")
        .update(updates)
        .eq("id", filament.id);

      if (updateError) {
        console.error(`Error updating filament ${filament.id}:`, updateError);
        stats.errors++;
        stats.errorDetails.push(`${filament.id}: Update failed - ${updateError.message}`);
        results.push({
          id: filament.id,
          title: product.title,
          status: "error",
          error: updateError.message,
        });
        continue;
      }

      stats.updated++;
      if (priceChanged && !overrides.includes("variant_price")) {
        stats.priceHistoryLogged++;
      }

      results.push({
        id: filament.id,
        title: product.title,
        oldPrice,
        newPrice,
        priceChanged,
        availabilityChanged,
        status: "updated",
      });

      console.log(`✅ Updated ${product.title}`);
    } catch (err) {
      console.error(`Error processing ${product.title}:`, err);
      stats.errors++;
      stats.errorDetails.push(`${product.productId}: ${err instanceof Error ? err.message : "Unknown error"}`);
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

    console.log(`🚀 Scrape request: vendor=${vendor}, all=${all}, limit=${limit}, force=${force}, dryRun=${dryRun}`);

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

    // Create sync log
    const syncLog = await createSyncLog(
      supabase,
      vendor || "multi-brand-scrape"
    );

    const allResults: Record<string, { stats: ScrapeStats; results: unknown[] }> = {};
    const totalStats: ScrapeStats = {
      processed: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      errors: 0,
      priceChanges: 0,
      availabilityChanges: 0,
      priceHistoryLogged: 0,
      errorDetails: [],
    };

    for (const v of vendorsToScrape) {
      console.log(`\n=== Scraping ${v} ===`);
      const config = BRAND_CONFIGS[v];
      const scraper = getScraper(config);

      try {
        const products = await scraper.scrapeAllProducts(limit);
        console.log(`📦 Scraped ${products.length} products from ${v}`);

        const { stats, results } = await processScrapedProducts(
          supabase,
          products,
          v,
          dryRun,
          force,
          config
        );

        allResults[v] = { stats, results };

        // Aggregate stats
        totalStats.processed += stats.processed;
        totalStats.created += stats.created;
        totalStats.updated += stats.updated;
        totalStats.unchanged += stats.unchanged;
        totalStats.errors += stats.errors;
        totalStats.priceChanges += stats.priceChanges;
        totalStats.availabilityChanges += stats.availabilityChanges;
        totalStats.priceHistoryLogged += stats.priceHistoryLogged;
        totalStats.errorDetails.push(...stats.errorDetails);
      } catch (err) {
        console.error(`❌ Error scraping ${v}:`, err);
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        allResults[v] = {
          stats: {
            processed: 0,
            created: 0,
            updated: 0,
            unchanged: 0,
            errors: 1,
            priceChanges: 0,
            availabilityChanges: 0,
            priceHistoryLogged: 0,
            errorDetails: [errorMsg],
          },
          results: [{ status: "error", error: errorMsg }],
        };
        totalStats.errors++;
        totalStats.errorDetails.push(`${v}: ${errorMsg}`);
      }
    }

    const executionTime = (Date.now() - startTime) / 1000;

    // Update sync log
    if (syncLog) {
      await updateSyncLog(supabase, syncLog.id, totalStats, executionTime);
    }

    console.log(`\n✅ Completed in ${executionTime.toFixed(1)}s: ${totalStats.processed} processed, ${totalStats.created} created, ${totalStats.updated} updated, ${totalStats.priceChanges} price changes`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        vendors: vendorsToScrape,
        totalStats,
        vendorResults: allResults,
        executionTime: `${executionTime.toFixed(1)}s`,
        syncLogId: syncLog?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Scrape error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
