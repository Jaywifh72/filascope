import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { BRAND_CONFIGS, type BrandConfig } from "./config.ts";
import { ShopifyScraper } from "./scrapers/shopify.ts";
import { WooCommerceScraper } from "./scrapers/woocommerce.ts";
import { BigCommerceScraper } from "./scrapers/bigcommerce.ts";
import { AmazonScraper } from "./scrapers/amazon.ts";
import { FirecrawlScraper } from "./scrapers/firecrawl.ts";
import type { BaseScraper, ScrapedProduct } from "./scrapers/base.ts";
import { calculateHash, detectMaterial, extractColor, extractWeight, extractDiameter, parseBarcodeFields, intelligentTitleClean, extractDataFromTitle } from "./utils.ts";
import { validateScrapedProduct, sanitizeScrapedProduct, type ValidationResult } from "./validation.ts";
// Import shared modules for consistent field handling
import { buildAvailableRegions } from "../_shared/filament-schema.ts";

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
  parseTds?: boolean; // Auto-parse TDS after scraping for filaments missing specs
  tdsLimit?: number;  // Limit TDS parsing to prevent timeouts
  useBatchRpc?: boolean; // Use atomic batch RPC for database writes
}

interface ScrapeStats {
  processed: number;
  matched: number;   // filaments found in DB (updated or unchanged) — FIX: separate from processed
  created: number;   // new filaments auto-created
  updated: number;
  unchanged: number;
  notFound: number;  // FIX: not-found is NOT an error — expected when auto_create=false
  errors: number;    // FIX: only real I/O failures count as errors
  priceChanges: number;
  availabilityChanges: number;
  priceHistoryLogged: number;
  tdsFound: number;
  tdsParsed: number;
  validationErrors: number; // NEW: Track validation failures
  lockSkipped: number; // NEW: Track skipped due to lock
  // Enhanced tracking fields
  imagesAdded: number;
  mpnsExtracted: number;
  barcodesAdded: number;
  colorHexCaptured: number;
  tempSpecsExtracted: number;
  productsCreated: string[];
  productsUpdated: string[];
  productsFailed: string[];
  errorDetails: string[];
}

// Acquire scrape lock with timeout-based auto-release
async function acquireScrapeLock(supabase: SupabaseClient, brandSlug: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('start_brand_scrape', {
    p_brand_slug: brandSlug
  });
  
  if (error) {
    console.error(`❌ Failed to acquire lock for ${brandSlug}:`, error.message);
    return false;
  }
  
  return data === true;
}

// Release scrape lock (called in finally block)
async function releaseScrapeLock(supabase: SupabaseClient, brandSlug: string): Promise<void> {
  try {
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false,
        scrape_timeout_at: null 
      })
      .eq('brand_slug', brandSlug);
  } catch (err) {
    console.error(`⚠️ Failed to release lock for ${brandSlug}:`, err);
  }
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
  amazon_store_url?: string | null;
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
    .select("id, brand_name, brand_slug, auto_create_products, scraping_enabled, default_currency, amazon_store_url")
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
  // Step 1: Extract data from title before cleaning (MOQ, weight patterns)
  const extractedData = extractDataFromTitle(product.title);
  
  // Step 2: Clean the title intelligently
  const cleanedTitle = intelligentTitleClean(extractedData.cleanedTitle, vendor);
  console.log(`📝 Cleaning title: "${product.title.substring(0, 50)}..." → "${cleanedTitle}"`);
  
  // Step 3: Detect material and color from ORIGINAL title (before cleaning)
  const material = detectMaterial(product.title);
  const colorInfo = extractColor(product.title);
  
  // Step 4: Use extracted weight from title (MOQ-aware) with priority over scraper weight
  // Title extraction handles MOQ patterns correctly, scraper might get confused by MOQ totals
  const weight = extractedData.netWeightG || product.netWeightG || extractWeight(product.title);
  const diameter = extractDiameter(product.title);
  
  // Extract handle from URL
  const urlParts = (product.url || '').split('/');
  const handle = urlParts[urlParts.length - 1] || product.productId;
  
  const filamentData = {
    product_id: product.productId,
    product_title: cleanedTitle, // Use cleaned title
    product_handle: handle,
    product_url: product.url,
    vendor: vendor,
    brand_id: brandConfig?.id || null,
    material: material,
    color_family: colorInfo?.family || product.colorName || null,
    color_hex: product.colorHex || colorInfo?.hex || null,
    net_weight_g: weight, // Use title-extracted weight (MOQ-aware) as priority
    diameter_nominal_mm: product.diameterMm || diameter || 1.75,
    variant_price: product.price,
    variant_compare_at_price: product.compareAtPrice,
    variant_available: product.available,
    variant_sku: product.sku || null,
    pack_quantity: extractedData.packQuantity || null,
    auto_created: true,
    auto_updated: true,
    last_scraped_at: new Date().toISOString(),
    sync_status: "synced",
    // Enhanced fields from scrapers
    featured_image: product.imageUrl || null,
    mpn: product.mpn || null,
    tds_url: product.tdsUrl || null,
    nozzle_temp_min_c: product.nozzleTempMin || null,
    nozzle_temp_max_c: product.nozzleTempMax || null,
    bed_temp_min_c: product.bedTempMin || null,
    bed_temp_max_c: product.bedTempMax || null,
    spool_material: product.spoolMaterial || null,
    spool_outer_d_mm: product.spoolOuterDiameterMm || null,
    spool_width_mm: product.spoolWidthMm || null,
    ...parseBarcodeFields(product.barcode ?? null),
  };
  
  // Add available_regions based on which regional data exists
  const filamentDataWithRegions = {
    ...filamentData,
    available_regions: buildAvailableRegions(filamentData),
  };
  
  const { error } = await supabase.from("filaments").insert(filamentDataWithRegions);
  
  if (error) {
    console.error(`❌ Failed to create filament ${product.title}:`, error);
    throw error;
  }
  
  console.log(`✨ Created: ${cleanedTitle} [${material || 'Unknown'}]${extractedData.netWeightG ? ` (${extractedData.netWeightG}g extracted from title)` : ''}`);
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
  stats: ScrapeStats,
  brandSlug: string
): Promise<void> {
  // First update via RPC for automated_brands stats
  const { error } = await supabase.rpc('complete_brand_scrape', {
    p_sync_log_id: syncLogId,
    p_success: stats.errors === 0,
    // FIX: products_discovered = filaments matched to DB + new creations
    // previously used stats.processed which counted ALL scraped items including not_found
    p_products_discovered: stats.matched + stats.created,
    p_products_created: stats.created,
    p_products_updated: stats.updated,
    p_products_failed: stats.errors,
    p_price_changes: stats.priceChanges,
    p_error_message: stats.errors > 0 ? stats.errorDetails.slice(0, 5).join('; ') : null
  });

  if (error) {
    console.error(`Failed to complete brand sync log ${syncLogId}:`, error);
  }

  // Update enrichment counts for this brand
  const { error: enrichError } = await supabase.rpc('update_brand_enrichment_counts', {
    p_brand_slug: brandSlug
  });

  if (enrichError) {
    console.error(`Failed to update enrichment counts for ${brandSlug}:`, enrichError);
  } else {
    console.log(`📊 Updated enrichment counts for ${brandSlug}`);
  }

  // Save detailed success_details and products_processed to brand_sync_logs
  const successDetails = {
    imagesAdded: stats.imagesAdded,
    tdsUrlsFound: stats.tdsFound,
    tdsParsed: stats.tdsParsed,
    mpnsExtracted: stats.mpnsExtracted,
    barcodesAdded: stats.barcodesAdded,
    colorHexCaptured: stats.colorHexCaptured,
    tempSpecsExtracted: stats.tempSpecsExtracted,
    priceHistoryLogged: stats.priceHistoryLogged,
    availabilityChanges: stats.availabilityChanges,
  };

  const productsProcessed = {
    created: stats.productsCreated.slice(0, 50), // Limit to 50 for DB size
    updated: stats.productsUpdated.slice(0, 50),
    failed: stats.productsFailed.slice(0, 20),
  };

  const { error: detailsError } = await supabase
    .from('brand_sync_logs')
    .update({
      success_details: successDetails,
      products_processed: productsProcessed,
    })
    .eq('id', syncLogId);

  if (detailsError) {
    console.error(`Failed to save detailed sync log for ${syncLogId}:`, detailsError);
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
    matched: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    notFound: 0,
    errors: 0,
    priceChanges: 0,
    availabilityChanges: 0,
    priceHistoryLogged: 0,
    tdsFound: 0,
    tdsParsed: 0,
    validationErrors: 0,
    lockSkipped: 0,
    imagesAdded: 0,
    mpnsExtracted: 0,
    barcodesAdded: 0,
    colorHexCaptured: 0,
    tempSpecsExtracted: 0,
    productsCreated: [],
    productsUpdated: [],
    productsFailed: [],
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
        .select("id, variant_price, variant_available, product_title, external_data_hash, user_override_fields, product_id, featured_image, upc, ean, gtin, mpn, tds_url, color_hex, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c")
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
            stats.productsCreated.push(product.title);
            // Track enrichment for newly created products
            if (product.imageUrl) stats.imagesAdded++;
            if (product.mpn) stats.mpnsExtracted++;
            if (product.barcode) stats.barcodesAdded++;
            if (product.colorHex) stats.colorHexCaptured++;
            if (product.nozzleTempMin || product.bedTempMin) stats.tempSpecsExtracted++;
            results.push({
              productId: product.productId,
              title: product.title,
              status: "created",
            });
            continue;
          } catch (createError) {
            console.error(`Failed to create filament ${product.title}:`, createError);
            stats.errors++;
            stats.productsFailed.push(product.title);
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
        
        // FIX: not_found is expected behavior when auto_create=false — not an error
        console.log(`Not found (auto-create disabled): ${product.title} (${product.productId})`);
        stats.notFound++;
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

      // FIX: track matched filaments (DB hits — updated OR unchanged)
      stats.matched++;

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
        stats.imagesAdded++;
        console.log(`📸 Adding image for ${product.title}: ${product.imageUrl.substring(0, 50)}...`);
      }

      // Update barcode fields if scraped and not overridden
      if (product.barcode) {
        const barcodeFields = parseBarcodeFields(product.barcode);
        let barcodeAdded = false;
        if (barcodeFields.upc && !overrides.includes("upc")) {
          updates.upc = barcodeFields.upc;
          barcodeAdded = true;
        }
        if (barcodeFields.ean && !overrides.includes("ean")) {
          updates.ean = barcodeFields.ean;
          barcodeAdded = true;
        }
        if (barcodeFields.gtin && !overrides.includes("gtin")) {
          updates.gtin = barcodeFields.gtin;
          barcodeAdded = true;
        }
        if (barcodeAdded) stats.barcodesAdded++;
      }

      // Update enhanced fields if scraped and not overridden
      // Track whether we're actually adding temp specs (for counter accuracy)
      let tempSpecsAdded = false;
      
      if (product.mpn && !overrides.includes("mpn") && !filament.mpn) {
        updates.mpn = product.mpn;
        stats.mpnsExtracted++;
      }
      if (product.tdsUrl && !overrides.includes("tds_url") && !filament.tds_url) {
        updates.tds_url = product.tdsUrl;
        stats.tdsFound++;
        console.log(`📄 Adding TDS for ${product.title}: ${product.tdsUrl}`);
      }
      if (product.colorHex && !overrides.includes("color_hex") && !filament.color_hex) {
        updates.color_hex = product.colorHex;
        stats.colorHexCaptured++;
      }
      
      // FIX: Only count tempSpecsExtracted when we actually save the data
      if (product.nozzleTempMin && !overrides.includes("nozzle_temp_min_c") && !filament.nozzle_temp_min_c) {
        updates.nozzle_temp_min_c = product.nozzleTempMin;
        updates.nozzle_temp_max_c = product.nozzleTempMax;
        tempSpecsAdded = true;
        console.log(`🌡️ Adding nozzle temps for ${product.title}: ${product.nozzleTempMin}-${product.nozzleTempMax}°C`);
      }
      if (product.bedTempMin && !overrides.includes("bed_temp_min_c") && !filament.bed_temp_min_c) {
        updates.bed_temp_min_c = product.bedTempMin;
        updates.bed_temp_max_c = product.bedTempMax;
        tempSpecsAdded = true;
        console.log(`🛏️ Adding bed temps for ${product.title}: ${product.bedTempMin}-${product.bedTempMax}°C`);
      }
      
      // Only increment counter once per product if any temp specs were added
      if (tempSpecsAdded) {
        stats.tempSpecsExtracted++;
      }

      // Recalculate available_regions based on updated data
      // Merge existing filament data with updates to get accurate regions
      const mergedData = { ...filament, ...updates };
      updates.available_regions = buildAvailableRegions(mergedData);

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
      stats.productsUpdated.push(product.title);
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
      stats.productsFailed.push(product.title);
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

// Parse TDS for filaments that have TDS URLs but missing temperature data
async function parseTdsForVendor(
  supabase: SupabaseClient,
  vendor: string,
  limit: number = 10
): Promise<{ parsed: number; failed: number; details: string[] }> {
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!firecrawlApiKey || !lovableApiKey) {
    console.log("⚠️ Missing API keys for TDS parsing");
    return { parsed: 0, failed: 0, details: ["Missing FIRECRAWL_API_KEY or OPENAI_API_KEY"] };
  }
  
  // Find filaments with TDS URLs but missing print settings
  const { data: filaments, error } = await supabase
    .from("filaments")
    .select("id, product_title, tds_url, nozzle_temp_min_c, bed_temp_min_c")
    .ilike("vendor", `%${vendor}%`)
    .not("tds_url", "is", null)
    .or("nozzle_temp_min_c.is.null,bed_temp_min_c.is.null")
    .limit(limit);
  
  if (error || !filaments?.length) {
    console.log(`📄 No filaments need TDS parsing for ${vendor}`);
    return { parsed: 0, failed: 0, details: [] };
  }
  
  console.log(`📄 Parsing TDS for ${filaments.length} filaments from ${vendor}`);
  
  const result = { parsed: 0, failed: 0, details: [] as string[] };
  
  for (const filament of filaments) {
    try {
      console.log(`  → Parsing TDS: ${filament.product_title}`);
      
      // Fetch TDS content
      const tdsResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: filament.tds_url,
          formats: ['markdown'],
          onlyMainContent: false,
          waitFor: 3000,
        }),
      });
      
      if (!tdsResponse.ok) {
        console.log(`    ✗ Failed to fetch TDS`);
        result.failed++;
        result.details.push(`${filament.product_title}: Fetch failed`);
        continue;
      }
      
      const tdsData = await tdsResponse.json();
      const markdown = tdsData.data?.markdown || '';
      
      if (markdown.length < 100) {
        console.log(`    ✗ TDS content too short`);
        result.failed++;
        continue;
      }
      
      // Extract with AI
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `Extract 3D filament specs from this TDS. Return JSON with these fields (use null if not found):
nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, 
drying_temp_c, drying_time_hours, density_g_cm3, tensile_strength_xy_mpa,
tensile_modulus_xy_mpa, elongation_break_xy_percent, tg_c, melt_temp_c.
Return ONLY valid JSON.

TDS Content:
${markdown.substring(0, 12000)}`
          }],
        }),
      });
      
      if (!aiResponse.ok) {
        console.log(`    ✗ AI extraction failed`);
        result.failed++;
        continue;
      }
      
      const aiData = await aiResponse.json();
      let content = aiData.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) content = jsonMatch[1];
      
      const extracted = JSON.parse(content.trim());
      
      // Build update object
      const updates: Record<string, unknown> = {};
      if (extracted.nozzle_temp_min_c) updates.nozzle_temp_min_c = extracted.nozzle_temp_min_c;
      if (extracted.nozzle_temp_max_c) updates.nozzle_temp_max_c = extracted.nozzle_temp_max_c;
      if (extracted.bed_temp_min_c) updates.bed_temp_min_c = extracted.bed_temp_min_c;
      if (extracted.bed_temp_max_c) updates.bed_temp_max_c = extracted.bed_temp_max_c;
      if (extracted.drying_temp_c) updates.drying_temp_c = extracted.drying_temp_c;
      if (extracted.drying_time_hours) updates.drying_time_hours = extracted.drying_time_hours;
      if (extracted.density_g_cm3) updates.density_g_cm3 = extracted.density_g_cm3;
      if (extracted.tensile_strength_xy_mpa) updates.tensile_strength_xy_mpa = extracted.tensile_strength_xy_mpa;
      if (extracted.tensile_modulus_xy_mpa) updates.tensile_modulus_xy_mpa = extracted.tensile_modulus_xy_mpa;
      if (extracted.elongation_break_xy_percent) updates.elongation_break_xy_percent = extracted.elongation_break_xy_percent;
      if (extracted.tg_c) updates.tg_c = extracted.tg_c;
      if (extracted.melt_temp_c) updates.melt_temp_c = extracted.melt_temp_c;
      
      if (Object.keys(updates).length > 0) {
        await supabase.from("filaments").update(updates).eq("id", filament.id);
        result.parsed++;
        result.details.push(`${filament.product_title}: Extracted ${Object.keys(updates).length} fields`);
        console.log(`    ✓ Extracted ${Object.keys(updates).length} fields`);
      } else {
        result.failed++;
        console.log(`    ✗ No data extracted`);
      }
      
    } catch (err) {
      console.log(`    ✗ Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      result.failed++;
    }
  }
  
  return result;
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
    const { vendor, all = false, limit = 100, force = false, dryRun = false, parseTds = false, tdsLimit = 10 } = body;

    console.log(`🚀 Scrape request: vendor=${vendor}, all=${all}, limit=${limit}, force=${force}, dryRun=${dryRun}, parseTds=${parseTds}`);

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
      matched: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      notFound: 0,
      errors: 0,
      priceChanges: 0,
      availabilityChanges: 0,
      priceHistoryLogged: 0,
      tdsFound: 0,
      tdsParsed: 0,
      validationErrors: 0,
      lockSkipped: 0,
      imagesAdded: 0,
      mpnsExtracted: 0,
      barcodesAdded: 0,
      colorHexCaptured: 0,
      tempSpecsExtracted: 0,
      productsCreated: [],
      productsUpdated: [],
      productsFailed: [],
      errorDetails: [],
    };

    for (const v of vendorsToScrape) {
      console.log(`\n=== Scraping ${v} ===`);
      const staticConfig = BRAND_CONFIGS[v];
      
      // Get brand config from database including amazon_store_url
      const dbBrandConfig = await getBrandConfig(supabase, v);
      
      // Get brand_slug from database (accurate) or fallback to generated slug
      const brandSlug = await getBrandSlugFromDB(supabase, v) || toBrandSlugFallback(v);
      
      // PILLAR 1: CONCURRENCY LOCKING - Check and acquire lock
      const lockAcquired = await acquireScrapeLock(supabase, brandSlug);
      if (!lockAcquired) {
        console.log(`⏳ Skipping ${v} - already being scraped by another process`);
        totalStats.lockSkipped++;
        totalStats.errorDetails.push(`${v}: Skipped - lock already held`);
        continue;
      }
      
      console.log(`🔒 Lock acquired for ${brandSlug}`);
      
      // Merge static config with database config (amazon_store_url)
      const config: BrandConfig = {
        ...staticConfig,
        amazonStoreUrl: dbBrandConfig?.amazon_store_url || undefined,
      };
      
      const scraper = getScraper(config);
      
      console.log(`📝 Creating sync log for brand_slug: ${brandSlug}`);
      const syncLogId = await createBrandSyncLog(supabase, brandSlug);

      try {
        const products = await scraper.scrapeAllProducts(limit);
        console.log(`📦 Scraped ${products.length} products from ${v}`);
        
        // PILLAR 3: VALIDATE scraped products before processing
        let validProducts = products;
        let validationErrors = 0;
        
        if (products.length > 0) {
          validProducts = [];
          for (const product of products) {
            // Sanitize first to fix common issues
            const sanitized = sanitizeScrapedProduct(product as unknown as Record<string, unknown>);
            const validation = validateScrapedProduct(sanitized as unknown as ScrapedProduct);
            
            if (validation.valid) {
              validProducts.push(product); // Use original product (typed correctly)
            } else {
              validationErrors++;
              console.warn(`⚠️ Validation failed for "${product.title?.substring(0, 40)}...": ${validation.errors?.join(', ')}`);
            }
          }
          
          if (validationErrors > 0) {
            console.log(`🔍 Validation: ${validProducts.length} passed, ${validationErrors} failed`);
          }
        }

        const { stats, results } = await processScrapedProducts(
          supabase,
          validProducts,
          v,
          dryRun,
          force,
          staticConfig
        );
        
        // Track validation errors in stats
        stats.validationErrors = validationErrors;

        allResults[v] = { stats, results, syncLogId: syncLogId || undefined };

        // Complete the sync log for this vendor (updates brand_sync_logs AND automated_brands)
        if (syncLogId) {
          await completeBrandSyncLog(supabase, syncLogId, stats, brandSlug);
          console.log(`✅ Completed sync log for ${v}: ${stats.created} created, ${stats.updated} updated`);
        }

        // Aggregate stats
        totalStats.processed += stats.processed;
        totalStats.matched += stats.matched;
        totalStats.created += stats.created;
        totalStats.updated += stats.updated;
        totalStats.unchanged += stats.unchanged;
        totalStats.notFound += stats.notFound;
        totalStats.errors += stats.errors;
        totalStats.validationErrors += stats.validationErrors;
        totalStats.priceChanges += stats.priceChanges;
        totalStats.availabilityChanges += stats.availabilityChanges;
        totalStats.priceHistoryLogged += stats.priceHistoryLogged;
        totalStats.tdsFound += stats.tdsFound;
        totalStats.imagesAdded += stats.imagesAdded;
        totalStats.mpnsExtracted += stats.mpnsExtracted;
        totalStats.barcodesAdded += stats.barcodesAdded;
        totalStats.colorHexCaptured += stats.colorHexCaptured;
        totalStats.tempSpecsExtracted += stats.tempSpecsExtracted;
        totalStats.productsCreated.push(...stats.productsCreated);
        totalStats.productsUpdated.push(...stats.productsUpdated);
        totalStats.productsFailed.push(...stats.productsFailed);
        totalStats.errorDetails.push(...stats.errorDetails);

        // Parse TDS if requested
        if (parseTds && !dryRun) {
          console.log(`\n📄 Parsing TDS for ${v}...`);
          const tdsResult = await parseTdsForVendor(supabase, v, tdsLimit);
          totalStats.tdsParsed += tdsResult.parsed;
          if (tdsResult.details.length > 0) {
            totalStats.errorDetails.push(...tdsResult.details);
          }
          console.log(`📄 TDS parsed: ${tdsResult.parsed} success, ${tdsResult.failed} failed`);
        }
      } catch (err) {
        console.error(`❌ Error scraping ${v}:`, err);
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        
        const errorStats: ScrapeStats = {
          processed: 0,
          matched: 0,
          created: 0,
          updated: 0,
          unchanged: 0,
          notFound: 0,
          errors: 1,
          priceChanges: 0,
          availabilityChanges: 0,
          priceHistoryLogged: 0,
          tdsFound: 0,
          tdsParsed: 0,
          validationErrors: 0,
          lockSkipped: 0,
          imagesAdded: 0,
          mpnsExtracted: 0,
          barcodesAdded: 0,
          colorHexCaptured: 0,
          tempSpecsExtracted: 0,
          productsCreated: [],
          productsUpdated: [],
          productsFailed: [v],
          errorDetails: [errorMsg],
        };
        
        allResults[v] = {
          stats: errorStats,
          results: [{ status: "error", error: errorMsg }],
          syncLogId: syncLogId || undefined,
        };
        
        // Complete sync log with error status
        if (syncLogId) {
          await completeBrandSyncLog(supabase, syncLogId, errorStats, brandSlug);
        }
        
        totalStats.errors++;
        totalStats.errorDetails.push(`${v}: ${errorMsg}`);
      } finally {
        // PILLAR 1: Always release lock when done (success or failure)
        await releaseScrapeLock(supabase, brandSlug);
        console.log(`🔓 Lock released for ${brandSlug}`);
      }
    }

    const executionTime = (Date.now() - startTime) / 1000;

    console.log(`\n✅ Completed in ${executionTime.toFixed(1)}s: ${totalStats.processed} processed, ${totalStats.matched} matched, ${totalStats.created} created, ${totalStats.updated} updated, ${totalStats.notFound} not_found (expected), ${totalStats.errors} errors, ${totalStats.priceChanges} price changes`);

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
