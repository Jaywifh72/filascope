/**
 * GLOBAL BRAND SYNC
 *
 * Master orchestrator for syncing all 55 filament brands + printer catalog.
 * Supports gap-filling, price-only, and full sync modes.
 *
 * POST body: GlobalSyncRequest
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  normalizeTemp,
  normalizeTempRange,
  normalizeWeightToGrams,
  normalizeSpeedToMms,
  normalizeDiameter,
  normalizeToMpa,
  normalizeMaterial,
  normalizeColorHex,
  normalizePrice,
  normalizeDimensionToMm,
  sanitizeRecord,
} from '../_shared/normalization-engine.ts';
import { getColorHex } from '../_shared/color-mapping.ts';

// ============================================================================
// CORS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface GlobalSyncRequest {
  mode?: 'filaments' | 'printers' | 'both';
  brands?: string[];
  scope: 'full' | 'gaps_only' | 'prices_only';
  limit?: number;
  dryRun?: boolean;
}

interface BrandSyncResult {
  brand: string;
  productsFound: number;
  productsInDb: number;
  productsNew: number;
  productsUpdated: number;
  fieldsBefore: Record<string, number>;
  fieldsAfter: Record<string, number>;
  fieldsGained: Record<string, number>;
  durationMs: number;
  errors: string[];
}

interface GlobalSyncResult {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  scope: string;
  mode: string;
  filaments: {
    brandsProcessed: number;
    productsScanned: number;
    productsUpdated: number;
    productsCreated: number;
    fieldsFilledTotal: number;
    errors: Array<{ brand: string; error: string }>;
    byBrand: Record<string, BrandSyncResult>;
  };
  printers: {
    brandsProcessed: number;
    printersScanned: number;
    printersUpdated: number;
    printersCreated: number;
    errors: Array<{ brand: string; error: string }>;
  };
}

interface BrandConfig {
  id: string;
  brand_slug: string;
  brand_name: string;
  platform_type: string;
  base_url: string;
  has_api: boolean;
  scraping_enabled: boolean;
  currency?: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  images: Array<{ src: string }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string;
    weight: number;
    weight_unit: string;
  }>;
  tags: string;
  product_type: string;
}

// ============================================================================
// SHOPIFY FETCHER
// ============================================================================

async function fetchShopifyProducts(
  baseUrl: string,
  limit = 250,
): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;

  while (true) {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/products.json?limit=250&page=${page}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FilaScope-GlobalSync/1.0' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.warn(`[shopify] ${baseUrl} returned ${res.status} on page ${page}`);
        break;
      }

      const data = await res.json() as { products: ShopifyProduct[] };
      const products = data.products || [];
      if (products.length === 0) break;

      allProducts.push(...products);
      if (products.length < 250) break;
      if (limit && allProducts.length >= limit) break;

      page++;
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.warn(`[shopify] Fetch error page ${page}:`, err);
      break;
    }
  }

  return allProducts;
}

// ============================================================================
// VARIANT SELECTOR (priority order per spec)
// ============================================================================

function selectBestVariant(variants: ShopifyProduct['variants']): ShopifyProduct['variants'][0] | null {
  if (!variants || variants.length === 0) return null;

  // Priority 1: 1 kg or 1000g variant
  const kg = variants.find(v => /\b1\s*kg\b|\b1000\s*g\b/i.test(v.title));
  if (kg) return kg;

  // Priority 2: 1.75mm variant
  const d175 = variants.find(v => /1\.75\s*mm/i.test(v.title));
  if (d175) return d175;

  // Priority 3: first with price > 0
  const withPrice = variants.find(v => parseFloat(v.price) > 0);
  if (withPrice) return withPrice;

  // Priority 4: first variant
  return variants[0];
}

// ============================================================================
// EXTRACT FROM SHOPIFY PRODUCT
// ============================================================================

function extractFromShopifyProduct(
  p: ShopifyProduct,
  baseUrl: string,
): Record<string, unknown> {
  const variant = selectBestVariant(p.variants);
  const variantPrice = variant ? normalizePrice(variant.price) : null;

  // Extract weight from variant title
  let net_weight_g: number | null = null;
  if (variant) {
    net_weight_g = normalizeWeightToGrams(variant.title);
    // Fallback: Shopify weight field (in variant.weight_unit)
    if (!net_weight_g && variant.weight > 0) {
      if (variant.weight_unit === 'kg') net_weight_g = Math.round(variant.weight * 1000);
      else if (variant.weight_unit === 'g') net_weight_g = Math.round(variant.weight);
      else if (variant.weight_unit === 'lb') net_weight_g = Math.round(variant.weight * 453.592);
    }
  }

  // Diameter from variant title
  let diameter_nominal_mm: 1.75 | 2.85 | null = null;
  if (variant) diameter_nominal_mm = normalizeDiameter(variant.title);
  if (!diameter_nominal_mm) {
    // Try all variant titles
    for (const v of p.variants) {
      const d = normalizeDiameter(v.title);
      if (d) { diameter_nominal_mm = d; break; }
    }
  }

  // Material from product type and title
  const rawMaterial = p.product_type || p.title;
  const material = normalizeMaterial(rawMaterial);

  // Color from title
  const titleForColor = p.title;
  const colorHex = normalizeColorHex(getColorHex(titleForColor) || null);

  // Finish type from title
  let finish_type: string | null = null;
  const finishPatterns: [RegExp, string][] = [
    [/\bsilk\b/i, 'Silk'],
    [/\bmatte\b/i, 'Matte'],
    [/\bgalaxy\b|sparkle\b|glitter\b/i, 'Galaxy'],
    [/\bglow\b|luminous\b/i, 'Glow'],
    [/\bwood\b/i, 'Wood'],
    [/\bmarble\b/i, 'Marble'],
    [/\bmetal\b|metallic\b/i, 'Metallic'],
    [/\bsatin\b/i, 'Satin'],
    [/\bgloss\b|shiny\b/i, 'Glossy'],
  ];
  for (const [rx, label] of finishPatterns) {
    if (rx.test(p.title)) { finish_type = label; break; }
  }

  return {
    product_id: `${baseUrl.replace(/https?:\/\//, '').replace(/\//g, '-')}-${p.handle}`,
    product_title: p.title,
    product_handle: p.handle,
    product_url: `${baseUrl.replace(/\/$/, '')}/products/${p.handle}`,
    featured_image: p.images?.[0]?.src || null,
    mpn: variant?.sku || null,
    material,
    color_hex: colorHex,
    finish_type,
    net_weight_g,
    diameter_nominal_mm,
    variant_price: variantPrice,
    last_scraped_at: new Date().toISOString(),
    sync_status: 'synced',
    auto_updated: true,
  };
}

// ============================================================================
// GAP DETECTION
// ============================================================================

const PRICE_FIELDS = ['variant_price'];
const CORE_FIELDS = [
  'product_title', 'material', 'color_hex', 'featured_image',
  'net_weight_g', 'diameter_nominal_mm', 'variant_price', 'product_url', 'mpn',
];
const ALL_ENRICHABLE_FIELDS = [
  ...CORE_FIELDS,
  'nozzle_temp_min_c', 'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c',
  'print_speed_max_mms', 'drying_temp_c', 'drying_time_hours',
  'tensile_strength_xy_mpa', 'finish_type',
];

function identifyGaps(record: Record<string, unknown>, scope: string): string[] {
  const fieldsToCheck = scope === 'prices_only' ? PRICE_FIELDS
    : scope === 'full' ? ALL_ENRICHABLE_FIELDS
    : ALL_ENRICHABLE_FIELDS; // gaps_only: fill any missing

  return fieldsToCheck.filter(f => record[f] === null || record[f] === undefined);
}

function buildUpdateFromExtracted(
  extracted: Record<string, unknown>,
  gaps: string[],
): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  for (const field of gaps) {
    if (extracted[field] !== null && extracted[field] !== undefined) {
      update[field] = extracted[field];
    }
  }
  // Always update price and last_scraped_at
  if (extracted.variant_price !== null && extracted.variant_price !== undefined) {
    update.variant_price = extracted.variant_price;
  }
  update.last_scraped_at = extracted.last_scraped_at;
  update.auto_updated = true;
  return update;
}

// ============================================================================
// COUNT FIELD FILL RATES
// ============================================================================

function countFilledFields(record: Record<string, unknown>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of ALL_ENRICHABLE_FIELDS) {
    counts[f] = (record[f] !== null && record[f] !== undefined) ? 1 : 0;
  }
  return counts;
}

function sumFieldCounts(records: Record<string, unknown>[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const f of ALL_ENRICHABLE_FIELDS) totals[f] = 0;
  for (const rec of records) {
    for (const f of ALL_ENRICHABLE_FIELDS) {
      if (rec[f] !== null && rec[f] !== undefined) totals[f]++;
    }
  }
  return totals;
}

// ============================================================================
// SYNC A SINGLE BRAND
// ============================================================================

async function syncBrand(
  supabase: SupabaseClient,
  brandConfig: BrandConfig,
  scope: string,
  limit: number | undefined,
  dryRun: boolean,
): Promise<BrandSyncResult> {
  const startMs = Date.now();
  const result: BrandSyncResult = {
    brand: brandConfig.brand_slug,
    productsFound: 0,
    productsInDb: 0,
    productsNew: 0,
    productsUpdated: 0,
    fieldsBefore: {},
    fieldsAfter: {},
    fieldsGained: {},
    durationMs: 0,
    errors: [],
  };

  // Step 1: Fetch from store
  let storeProducts: ShopifyProduct[] = [];
  try {
    if (brandConfig.platform_type === 'shopify' && brandConfig.base_url) {
      storeProducts = await fetchShopifyProducts(brandConfig.base_url, limit);
    }
  } catch (err) {
    result.errors.push(`Store fetch failed: ${err}`);
    result.durationMs = Date.now() - startMs;
    return result;
  }

  result.productsFound = storeProducts.length;
  if (storeProducts.length === 0) {
    result.durationMs = Date.now() - startMs;
    return result;
  }

  // Step 2: Get DB records for this brand
  const { data: dbRecords, error: dbErr } = await supabase
    .from('filaments')
    .select('*')
    .eq('brand_id', brandConfig.id);

  if (dbErr) {
    result.errors.push(`DB fetch failed: ${dbErr.message}`);
    result.durationMs = Date.now() - startMs;
    return result;
  }

  const dbMap = new Map<string, Record<string, unknown>>();
  for (const rec of (dbRecords || [])) {
    if (rec.product_handle) dbMap.set(rec.product_handle, rec);
  }

  result.productsInDb = dbMap.size;
  result.fieldsBefore = sumFieldCounts(Array.from(dbMap.values()));

  // Step 3: Process each store product
  for (const storeProduct of storeProducts) {
    try {
      const extracted = extractFromShopifyProduct(storeProduct, brandConfig.base_url);
      const normalized = extracted; // already normalized by extractor

      // Sanity check
      sanitizeRecord(normalized as Record<string, unknown>, `brand=${brandConfig.brand_slug}`);

      const existing = dbMap.get(storeProduct.handle);

      if (existing) {
        // Gap filling: identify what's missing and fill it
        const gaps = identifyGaps(existing, scope);
        const update = buildUpdateFromExtracted(normalized, gaps);

        if (Object.keys(update).length > 1 && !dryRun) { // >1 because last_scraped_at always present
          const { error } = await supabase
            .from('filaments')
            .update(update)
            .eq('id', existing.id);

          if (error) {
            result.errors.push(`Update ${storeProduct.handle}: ${error.message}`);
          } else {
            result.productsUpdated++;
            // Update in-place for after-count
            Object.assign(existing, update);
          }
        }
      } else {
        // New product — insert
        if (!dryRun) {
          const insertData = {
            ...normalized,
            brand_id: brandConfig.id,
            vendor: brandConfig.brand_name,
            auto_created: true,
          };

          const { error } = await supabase
            .from('filaments')
            .insert(insertData);

          if (error) {
            result.errors.push(`Insert ${storeProduct.handle}: ${error.message}`);
          } else {
            result.productsNew++;
            dbMap.set(storeProduct.handle, insertData);
          }
        } else {
          result.productsNew++;
        }
      }
    } catch (err) {
      result.errors.push(`Product ${storeProduct.handle}: ${err}`);
    }
  }

  // Compute after counts
  result.fieldsAfter = sumFieldCounts(Array.from(dbMap.values()));

  // Compute gains
  for (const f of ALL_ENRICHABLE_FIELDS) {
    result.fieldsGained[f] = (result.fieldsAfter[f] || 0) - (result.fieldsBefore[f] || 0);
  }

  result.durationMs = Date.now() - startMs;
  return result;
}

// ============================================================================
// SYNC PRINTERS (stub — brands are fetched via their dedicated edge functions)
// ============================================================================

async function syncPrinters(
  supabase: SupabaseClient,
  _scope: string,
  _limit: number | undefined,
  _dryRun: boolean,
): Promise<GlobalSyncResult['printers']> {
  const result: GlobalSyncResult['printers'] = {
    brandsProcessed: 0,
    printersScanned: 0,
    printersUpdated: 0,
    printersCreated: 0,
    errors: [],
  };

  // Printer sync via dedicated brand functions is handled by daily-price-orchestrator.
  // Here we can do a lightweight count to show coverage.
  try {
    const { count } = await supabase
      .from('printers')
      .select('id', { count: 'exact', head: true });

    result.printersScanned = count || 0;
  } catch (err) {
    result.errors.push(`Printer count failed: ${err}`);
  }

  return result;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();
  const globalStart = Date.now();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: GlobalSyncRequest = { scope: 'gaps_only', mode: 'filaments' };
  try {
    body = await req.json() as GlobalSyncRequest;
  } catch { /* use defaults */ }

  const {
    mode = 'filaments',
    brands: brandFilter,
    scope = 'gaps_only',
    limit,
    dryRun = false,
  } = body;

  console.log(`[global-sync] mode=${mode} scope=${scope} dryRun=${dryRun} brands=${brandFilter?.join(',') || 'all'}`);

  // Record run start
  const { data: runRow } = await supabase
    .from('global_sync_runs')
    .insert({
      started_at: startedAt,
      status: 'running',
      mode,
      scope,
    })
    .select('id')
    .maybeSingle();
  const runId = runRow?.id;

  const globalResult: GlobalSyncResult = {
    startedAt,
    completedAt: '',
    durationMs: 0,
    scope,
    mode,
    filaments: {
      brandsProcessed: 0,
      productsScanned: 0,
      productsUpdated: 0,
      productsCreated: 0,
      fieldsFilledTotal: 0,
      errors: [],
      byBrand: {},
    },
    printers: {
      brandsProcessed: 0,
      printersScanned: 0,
      printersUpdated: 0,
      printersCreated: 0,
      errors: [],
    },
  };

  try {
    // ── Filament sync ──────────────────────────────────────────────────────
    if (mode === 'filaments' || mode === 'both') {
      // Fetch brand configs from DB
      let query = supabase
        .from('automated_brands')
        .select('id, brand_slug, brand_name, platform_type, base_url, has_api, scraping_enabled, currency')
        .eq('scraping_enabled', true);

      if (brandFilter && brandFilter.length > 0) {
        query = query.in('brand_slug', brandFilter);
      }

      const { data: brands, error: brandsErr } = await query;

      if (brandsErr) throw new Error(`Failed to fetch brands: ${brandsErr.message}`);

      const filamentBrands = (brands || []).filter(
        b => b.platform_type === 'shopify' && b.base_url
      );

      console.log(`[global-sync] Processing ${filamentBrands.length} Shopify brands`);

      for (const brand of filamentBrands) {
        // Update run progress
        if (runId) {
          await supabase
            .from('global_sync_runs')
            .update({
              current_brand: brand.brand_slug,
              current_phase: 'syncing',
              progress_done: globalResult.filaments.brandsProcessed,
              progress_total: filamentBrands.length,
            })
            .eq('id', runId);
        }

        try {
          const brandResult = await syncBrand(supabase, brand as BrandConfig, scope, limit, dryRun);

          globalResult.filaments.byBrand[brand.brand_slug] = brandResult;
          globalResult.filaments.brandsProcessed++;
          globalResult.filaments.productsScanned += brandResult.productsFound;
          globalResult.filaments.productsUpdated += brandResult.productsUpdated;
          globalResult.filaments.productsCreated += brandResult.productsNew;
          globalResult.filaments.fieldsFilledTotal += Object.values(brandResult.fieldsGained)
            .filter(v => v > 0).reduce((a, b) => a + b, 0);

          if (brandResult.errors.length > 0) {
            for (const e of brandResult.errors) {
              globalResult.filaments.errors.push({ brand: brand.brand_slug, error: e });
            }
          }

          console.log(`[global-sync] ${brand.brand_slug}: found=${brandResult.productsFound} new=${brandResult.productsNew} updated=${brandResult.productsUpdated} (${brandResult.durationMs}ms)`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          globalResult.filaments.errors.push({ brand: brand.brand_slug, error: msg });
          console.error(`[global-sync] ${brand.brand_slug} failed:`, msg);
        }

        // Throttle between brands
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // ── Printer sync ───────────────────────────────────────────────────────
    if (mode === 'printers' || mode === 'both') {
      globalResult.printers = await syncPrinters(supabase, scope, limit, dryRun);
    }

    globalResult.completedAt = new Date().toISOString();
    globalResult.durationMs = Date.now() - globalStart;

    // Mark run as completed
    if (runId) {
      await supabase
        .from('global_sync_runs')
        .update({
          completed_at: globalResult.completedAt,
          status: 'completed',
          result: globalResult,
          current_brand: null,
          current_phase: null,
          progress_done: globalResult.filaments.brandsProcessed,
          progress_total: globalResult.filaments.brandsProcessed,
        })
        .eq('id', runId);
    }

    return new Response(
      JSON.stringify({ success: true, runId, result: globalResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[global-sync] Fatal error:', error);

    if (runId) {
      await supabase
        .from('global_sync_runs')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          error,
        })
        .eq('id', runId);
    }

    return new Response(
      JSON.stringify({ success: false, error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
