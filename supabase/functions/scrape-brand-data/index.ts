import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { BRAND_CONFIGS, type BrandConfig } from "./config.ts";
import { ShopifyScraper } from "./scrapers/shopify.ts";
import { WooCommerceScraper } from "./scrapers/woocommerce.ts";
import { BigCommerceScraper } from "./scrapers/bigcommerce.ts";
import { AmazonScraper } from "./scrapers/amazon.ts";
import { FirecrawlScraper } from "./scrapers/firecrawl.ts";
import type { BaseScraper, ScrapedProduct } from "./scrapers/base.ts";
import { calculateHash, detectMaterial, extractColor, extractWeight, extractDiameter, parseBarcodeFields } from "./utils.ts";

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

// Convert vendor name to brand_slug format - lookup from database for accuracy
async function getBrandSlugFromDB(supabase: SupabaseClient, vendor: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("automated_brands")
    .select("brand_slug")
    .or(`brand_name.ilike.${vendor},brand_name.ilike.%${vendor}%`)
    .maybeSingle();
  
  if (error || !data) {
    console.warn(`Could not find brand_slug for vendor: ${vendor}, using fallback`);
    return null;
  }
  return data.brand_slug;
}

// Fallback slug generation if database lookup fails
function toBrandSlugFallback(vendor: string): string {
  return vendor.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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
    // Enhanced fields from scrapers
    featured_image: product.imageUrl || null,
    ...parseBarcodeFields(product.barcode),
  };
  
  const { error } = await supabase.from("filaments").insert(filamentData);
  
  if (error) {
    console.error(`❌ Failed to create filament ${product.title}:`, error);
    throw error;
  }
  
  console.log(`✨ Created: ${product.title} [${material || 'Unknown'}]`);
  return true;
}

// Create sync log using proper RPC function that writes to brand_sync_logs
async function createBrandSyncLog(
  supabase: SupabaseClient,
  brandSlug: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_brand_sync_log', {
    p_brand_slug: brandSlug,
    p_sync_type: 'full_scrape',
    p_triggered_by: 'manual'
  });

  if (error) {
    console.error(`Failed to create brand sync log for ${brandSlug}:`, error);
    return null;
  }
  return data;
}

// Complete sync log using proper RPC function that updates brand_sync_logs AND automated_brands
async function completeBrandSyncLog(
  supabase: SupabaseClient,
  syncLogId: string,
  stats: ScrapeStats
): Promise<void> {
  const { error } = await supabase.rpc('complete_brand_scrape', {
    p_sync_log_id: syncLogId,
    p_success: stats.errors === 0,
    p_products_discovered: stats.processed,
    p_products_created: stats.created,
    p_products_updated: stats.updated,
    p_products_failed: stats.errors,
    p_price_changes: stats.priceChanges,
    p_error_message: stats.errors > 0 ? stats.errorDetails.slice(0, 5).join('; ') : null
  });

  if (error) {
    console.error(`Failed to complete brand sync log ${syncLogId}:`, error);
  }
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
      // Use limit(1) to handle duplicate SKUs gracefully, prioritize by product_id
      const { data: filaments, error: findError } = await supabase
        .from("filaments")
        .select("id, variant_price, variant_available, product_title, external_data_hash, user_override_fields, product_id, featured_image, upc, ean, gtin")
        .ilike("vendor", `%${vendor}%`)
        .or(`product_id.eq.${product.productId},variant_sku.eq.${product.sku || "___NONE___"}`)
        .order('product_id', { ascending: false, nullsFirst: false })
        .limit(1);

      if (findError) {
        console.error(`Error finding filament for ${product.title}:`, findError);
        stats.errors++;
        stats.errorDetails.push(`${product.productId}: DB lookup failed`);
        continue;
      }
      
      // Get first match (or null if no results)
      const filament = filaments && filaments.length > 0 ? filaments[0] : null;

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

      // Update image if scraped and not already set or overridden
      if (product.imageUrl && !overrides.includes("featured_image") && !filament.featured_image) {
        updates.featured_image = product.imageUrl;
        console.log(`📸 Adding image for ${product.title}: ${product.imageUrl.substring(0, 50)}...`);
      }

      // Update barcode fields if scraped and not overridden
      if (product.barcode) {
        const barcodeFields = parseBarcodeFields(product.barcode);
        if (barcodeFields.upc && !overrides.includes("upc")) {
          updates.upc = barcodeFields.upc;
        }
        if (barcodeFields.ean && !overrides.includes("ean")) {
          updates.ean = barcodeFields.ean;
        }
        if (barcodeFields.gtin && !overrides.includes("gtin")) {
          updates.gtin = barcodeFields.gtin;
        }
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

    const allResults: Record<string, { stats: ScrapeStats; results: unknown[]; syncLogId?: string }> = {};
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
      
      // Get brand_slug from database (accurate) or fallback to generated slug
      const brandSlug = await getBrandSlugFromDB(supabase, v) || toBrandSlugFallback(v);
      console.log(`📝 Creating sync log for brand_slug: ${brandSlug}`);
      const syncLogId = await createBrandSyncLog(supabase, brandSlug);

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

        allResults[v] = { stats, results, syncLogId: syncLogId || undefined };

        // Complete the sync log for this vendor (updates brand_sync_logs AND automated_brands)
        if (syncLogId) {
          await completeBrandSyncLog(supabase, syncLogId, stats);
          console.log(`✅ Completed sync log for ${v}: ${stats.created} created, ${stats.updated} updated`);
        }

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
        
        const errorStats: ScrapeStats = {
          processed: 0,
          created: 0,
          updated: 0,
          unchanged: 0,
          errors: 1,
          priceChanges: 0,
          availabilityChanges: 0,
          priceHistoryLogged: 0,
          errorDetails: [errorMsg],
        };
        
        allResults[v] = {
          stats: errorStats,
          results: [{ status: "error", error: errorMsg }],
          syncLogId: syncLogId || undefined,
        };
        
        // Complete sync log with error status
        if (syncLogId) {
          await completeBrandSyncLog(supabase, syncLogId, errorStats);
        }
        
        totalStats.errors++;
        totalStats.errorDetails.push(`${v}: ${errorMsg}`);
      }
    }

    const executionTime = (Date.now() - startTime) / 1000;

    console.log(`\n✅ Completed in ${executionTime.toFixed(1)}s: ${totalStats.processed} processed, ${totalStats.created} created, ${totalStats.updated} updated, ${totalStats.priceChanges} price changes`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        vendors: vendorsToScrape,
        totalStats,
        vendorResults: allResults,
        executionTime: `${executionTime.toFixed(1)}s`,
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
