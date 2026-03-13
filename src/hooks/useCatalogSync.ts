import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  classifyProduct,
  extractFilamentsFromProduct,
  diffAgainstDatabase,
  type ScrapingConfig,
  type ExtractedFilament,
  type DiffResult,
} from '@/lib/catalog-sync-core';

// ============================================================
// Types
// ============================================================

export type Phase = 'select' | 'scanning' | 'processing' | 'delta' | 'importing' | 'complete';

export type SyncItem = {
  id: string;
  job_id: string;
  status: string;
  is_new: boolean;
  extracted_data: Record<string, unknown>;
  admin_override_data: Record<string, unknown> | null;
  display_name: string | null;
  color_name: string | null;
  color_hex: string | null;
  color_family: string | null;
  material_type: string | null;
  finish_type: string | null;
  image_url: string | null;
  variant_image_url: string | null;
  price_usd: number | null;
  price_eur: number | null;
  price_cad: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  variant_sku: string | null;
  product_handle: string | null;
  available_regions: string[] | null;
  existing_filament_id: string | null;
  inserted_filament_id: string | null;
  price_diff: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string | null;
};

export type SyncJob = {
  id: string;
  brand_id: string;
  config_id: string | null;
  status: string;
  total_store_products: number | null;
  filament_products_found: number | null;
  skipped_products: number | null;
  new_count: number | null;
  changed_count: number | null;
  matched_count: number | null;
  error_count: number | null;
  imported_count: number | null;
  post_import_results: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  warnings: string[] | null;
};

export interface DeltaStats {
  totalDiscovered: number;
  inDatabase: number;
  newCount: number;
  changedCount: number;
  matchedCount: number;
  errorCount: number;
}

export interface ImportResult {
  imported: number;
  updatedPrices: number;
  errors: number;
  priceHistoryCount: number;
  avgQualityScore: number;
  urlsBroken: string[];
}

// ============================================================
// Client-Side Shopify Fetch (CORS-enabled stores)
// ============================================================

/**
 * Fetch all products from a Shopify store via /products.json.
 * Works client-side because Shopify stores return `access-control-allow-origin: *`.
 * Paginates up to maxPages to handle large catalogs.
 */
async function fetchShopifyCatalog(
  baseUrl: string,
  maxPages = 10,
  onProgress?: (msg: string) => void,
): Promise<{ products: any[]; totalFetched: number }> {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const allProducts: any[] = [];
  let page = 1;

  while (page <= maxPages) {
    const pageUrl = `${cleanBase}/products.json?limit=250&page=${page}`;
    onProgress?.(`Fetching page ${page}...`);

    const response = await fetch(pageUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (page === 1) throw new Error(`Store returned HTTP ${response.status}`);
      break;
    }

    const data = await response.json();
    const products = data?.products;
    if (!products || !Array.isArray(products) || products.length === 0) break;

    allProducts.push(...products);

    if (products.length < 250) break;
    page++;
    // Small delay between pages
    await new Promise(r => setTimeout(r, 200));
  }

  return { products: allProducts, totalFetched: allProducts.length };
}

// ============================================================
// Per-Handle Whitelist Fetch (for stores without CORS)
// ============================================================

/**
 * CORS proxy URL template — uses allorigins.win /get endpoint which wraps response
 * in {contents: "...", status: {...}}. More reliable than /raw from browsers.
 */
const CORS_PROXY_GET = 'https://api.allorigins.win/get?url=';

/**
 * Anycubic product handle whitelist — 19 official filament product lines.
 * Each entry has the handle and the base URL (some products are CA-only).
 */
const ANYCUBIC_HANDLES: Array<{ handle: string; baseUrl: string; material: string }> = [
  // Core PLA
  { handle: 'pla-basic-refill', baseUrl: 'https://store.anycubic.com', material: 'PLA+' },
  { handle: 'pla-filament', baseUrl: 'https://store.anycubic.com', material: 'PLA+' },
  { handle: 'pla-plus-filament', baseUrl: 'https://store.anycubic.com', material: 'PLA+' },
  { handle: 'pla-plus-refill', baseUrl: 'https://store.anycubic.com', material: 'PLA+' },
  { handle: 'high-speed-pla-filament', baseUrl: 'https://store.anycubic.com', material: 'PLA+' },
  // Specialty PLA
  { handle: 'silk-pla-filament', baseUrl: 'https://store.anycubic.com', material: 'PLA' },
  { handle: 'pla-silk-dual-tri-color-filament', baseUrl: 'https://store.anycubic.com', material: 'PLA' },
  { handle: 'pla-basic-special-color-filament', baseUrl: 'https://store.anycubic.com', material: 'PLA+' },
  { handle: 'pla-glow', baseUrl: 'https://store.anycubic.com', material: 'PLA-Glow' },
  { handle: 'pla-marble', baseUrl: 'https://store.anycubic.com', material: 'PLA' },
  { handle: 'pla-galaxy', baseUrl: 'https://store.anycubic.com', material: 'PLA+' },
  { handle: 'matte-pla-filament', baseUrl: 'https://store.anycubic.com', material: 'PLA' },
  { handle: 'pla-metal-filament', baseUrl: 'https://store.anycubic.com', material: 'PLA' },
  // PETG
  { handle: 'petg-filament', baseUrl: 'https://store.anycubic.com', material: 'PETG' },
  { handle: 'petg-filament-translucent', baseUrl: 'https://store.anycubic.com', material: 'PETG' },
  // Engineering
  { handle: 'abs-filament', baseUrl: 'https://store.anycubic.com', material: 'ABS' },
  { handle: 'asa-filament', baseUrl: 'https://store.anycubic.com', material: 'ASA' },
  { handle: 'pc-filament', baseUrl: 'https://store.anycubic.com', material: 'PC' },
  { handle: 'tpu-filament', baseUrl: 'https://store.anycubic.com', material: 'TPU' },
];

/**
 * Fetch a single product via CORS proxy (/get endpoint) with retry.
 * The /get endpoint wraps the response as {contents: "...", status: {...}}.
 */
async function fetchProductViaProxy(
  baseUrl: string,
  handle: string,
  maxRetries = 2,
): Promise<any | null> {
  const productUrl = `${baseUrl}/products/${handle}.json`;
  const proxyUrl = `${CORS_PROXY_GET}${encodeURIComponent(productUrl)}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(proxyUrl, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        console.warn(`[proxy] ${handle}: HTTP ${res.status} (attempt ${attempt + 1})`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        return null;
      }

      const wrapper = await res.json();

      // /get endpoint wraps response in {contents: "...", status: {...}}
      if (wrapper?.contents) {
        const data = JSON.parse(wrapper.contents);
        if (data?.product) return data.product;
      }

      // Fallback: direct JSON (in case proxy returns raw)
      if (wrapper?.product) return wrapper.product;

      console.warn(`[proxy] ${handle}: no product in response`);
      return null;
    } catch (err) {
      console.warn(`[proxy] ${handle}: fetch error (attempt ${attempt + 1}):`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }

  return null;
}

/**
 * Fetch products using a curated whitelist of handles via CORS proxy.
 * Used for stores like Anycubic that don't have CORS on their Shopify endpoints.
 */
async function fetchViaHandleWhitelist(
  handles: Array<{ handle: string; baseUrl: string }>,
  onProgress?: (msg: string) => void,
): Promise<{ products: any[]; totalFetched: number; failed: string[] }> {
  const allProducts: any[] = [];
  const failed: string[] = [];

  for (let i = 0; i < handles.length; i++) {
    const { handle, baseUrl } = handles[i];
    onProgress?.(`Fetching ${handle} (${i + 1}/${handles.length})...`);

    const product = await fetchProductViaProxy(baseUrl, handle);
    if (product) {
      allProducts.push(product);
    } else {
      failed.push(handle);
    }

    // Rate limit: 500ms between requests to be respectful
    if (i < handles.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return { products: allProducts, totalFetched: allProducts.length, failed };
}

// ============================================================
// Auto-Config Creation for Known Brands
// ============================================================

/**
 * Built-in configs for brands that need special handling.
 * These are auto-created in brand_scraping_configs when the brand is selected.
 */
const KNOWN_BRAND_CONFIGS: Record<string, {
  brand_name: string;
  platform: string;
  base_url: string;
  scrape_method: string;
  adapter_key: string;
  catalog_strategy: string;
  regional_url_pattern: Record<string, string>;
  variant_mapping: Record<string, any>;
}> = {
  anycubic: {
    brand_name: 'Anycubic',
    platform: 'shopify',
    base_url: 'https://store.anycubic.com',
    scrape_method: 'per_handle_whitelist',
    adapter_key: 'anycubic',
    catalog_strategy: 'per-handle-whitelist',
    regional_url_pattern: {
      US: 'https://store.anycubic.com',
      CA: 'https://ca.anycubic.com',
      UK: 'https://uk.anycubic.com',
      EU: 'https://eu.anycubic.com',
      AU: 'https://www.anycubic.au',
    },
    variant_mapping: {
      region_option: 'option3',
      color_option: 'option1',
      size_option: 'option2',
      region_map: { US: 'US', EU: 'EU', UK: 'UK', Other: 'US' },
      price_currency_map: { US: 'USD', EU: 'EUR', UK: 'GBP', Other: 'USD' },
    },
  },
};

/**
 * Ensure a brand_scraping_configs entry exists for a known brand.
 * Returns the config ID (existing or newly created).
 */
async function ensureBrandConfig(
  supabaseClient: any,
  brandId: string,
  brandSlug: string,
): Promise<string | null> {
  // Check if config already exists
  const { data: existing } = await supabaseClient
    .from('brand_scraping_configs')
    .select('id')
    .eq('brand_id', brandId)
    .maybeSingle();

  if (existing) return existing.id;

  // Check if we have a built-in config for this brand
  const builtIn = KNOWN_BRAND_CONFIGS[brandSlug];
  if (!builtIn) return null;

  // Create the config
  const { data: created, error: createErr } = await supabaseClient
    .from('brand_scraping_configs')
    .insert({
      brand_id: brandId,
      brand_name: builtIn.brand_name,
      platform: builtIn.platform,
      base_url: builtIn.base_url,
      scrape_method: builtIn.scrape_method,
      adapter_key: builtIn.adapter_key,
      catalog_strategy: builtIn.catalog_strategy,
      regional_url_pattern: builtIn.regional_url_pattern,
      variant_mapping: builtIn.variant_mapping,
      is_active: true,
    })
    .select('id')
    .single();

  if (createErr) {
    console.error('[ensureBrandConfig] Failed to create config:', createErr.message);
    return null;
  }

  console.log(`[ensureBrandConfig] Created config for ${brandSlug}: ${created.id}`);
  return created.id;
}

/**
 * Slim down products by truncating body_html (saves memory).
 */
function slimProducts(products: any[]): any[] {
  return products.map(p => ({
    ...p,
    body_html: (p.body_html || '').slice(0, 3000),
  }));
}

// ============================================================
// Hook
// ============================================================

export function useCatalogSync() {
  const [phase, setPhase] = useState<Phase>('select');
  const [jobId, setJobId] = useState<string | null>(null);
  const [scanJob, setScanJob] = useState<SyncJob | null>(null);
  const [items, setItems] = useState<SyncItem[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Derived stats
  const deltaStats: DeltaStats = {
    totalDiscovered: items.length,
    inDatabase: items.filter(i => i.status === 'matched' || i.status === 'price_changed').length
      + (scanJob?.matched_count ?? 0) - items.filter(i => i.status === 'matched').length,
    newCount: items.filter(i => i.status === 'new').length,
    changedCount: items.filter(i => i.status === 'price_changed').length,
    matchedCount: items.filter(i => i.status === 'matched').length,
    errorCount: items.filter(i => i.status === 'error').length,
  };

  // Recalculate inDatabase from the job stats + matched items
  if (scanJob) {
    deltaStats.inDatabase = (scanJob.matched_count ?? 0) + (scanJob.changed_count ?? 0);
  }

  // ── Start Scan (Client-Side: Fetch → Classify → Extract → Diff → Store) ──
  //
  // This runs entirely in the browser, bypassing edge functions.
  // Shopify stores have CORS enabled on /products.json.
  // When Supabase edge function deployment is restored, this can switch back
  // to the edge function approach (sync-brand-catalog + process-brand-sync).

  const startScan = useCallback(async (brandId: string, configId: string) => {
    setError(null);
    setItems([]);
    setScanJob(null);
    setImportResult(null);
    setPhase('scanning');
    setScanStatusMessage('Loading configuration...');

    try {
      // ── Load brand ──
      const { data: brandData, error: brandErr } = await supabase
        .from('automated_brands')
        .select('brand_name, brand_slug')
        .eq('id', brandId)
        .maybeSingle();

      if (brandErr || !brandData) throw new Error(`Brand not found: ${brandId}`);

      // ── Ensure config exists (auto-create for known brands) ──
      let actualConfigId = configId;
      if (!actualConfigId || actualConfigId === 'auto') {
        const autoId = await ensureBrandConfig(supabase, brandId, brandData.brand_slug);
        if (!autoId) throw new Error(`No scraping config for brand: ${brandData.brand_name}`);
        actualConfigId = autoId;
      }

      // ── Load config ──
      const { data: configData, error: configErr } = await supabase
        .from('brand_scraping_configs')
        .select('*')
        .eq('id', actualConfigId)
        .maybeSingle();

      if (configErr || !configData) throw new Error(`Config not found: ${actualConfigId}`);

      const config = configData as unknown as ScrapingConfig;

      // ── Get current user ID ──
      const { data: { user } } = await supabase.auth.getUser();

      // ── Create job ──
      setScanStatusMessage('Creating sync job...');
      const { data: jobData, error: jobErr } = await supabase
        .from('brand_sync_jobs')
        .insert({
          brand_id: brandId,
          config_id: actualConfigId,
          status: 'syncing',
          admin_user_id: user?.id ?? null,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (jobErr || !jobData) throw new Error(`Failed to create job: ${jobErr?.message}`);
      const currentJobId = jobData.id;
      setJobId(currentJobId);

      // ── Fetch products from store (strategy-dependent) ──
      const catalogStrategy = config.catalog_strategy || config.scrape_method || 'products-json';
      let allProducts: any[];

      if (catalogStrategy === 'per-handle-whitelist' || catalogStrategy === 'per_handle_whitelist') {
        // Use curated whitelist with CORS proxy
        const brandSlug = brandData.brand_slug;
        const handles = brandSlug === 'anycubic' ? ANYCUBIC_HANDLES : [];

        if (handles.length === 0) {
          throw new Error(`No product whitelist defined for brand: ${brandData.brand_name}`);
        }

        setScanStatusMessage(`Fetching ${handles.length} products via proxy...`);
        const result = await fetchViaHandleWhitelist(
          handles,
          (msg) => setScanStatusMessage(msg),
        );

        if (result.failed.length > 0) {
          console.warn(`[scan] Failed to fetch ${result.failed.length} handles:`, result.failed);
        }

        allProducts = result.products;
      } else {
        // Default: standard Shopify /products.json
        setScanStatusMessage('Fetching products from store...');
        const result = await fetchShopifyCatalog(
          config.base_url,
          10,
          (msg) => setScanStatusMessage(msg),
        );
        allProducts = result.products;
      }

      if (allProducts.length === 0) throw new Error('No products found in store');

      // Update job with product count
      await supabase.from('brand_sync_jobs').update({
        total_store_products: allProducts.length,
      }).eq('id', currentJobId);

      setScanStatusMessage(`Fetched ${allProducts.length} products. Classifying...`);
      setPhase('processing');

      // ── Classify products ──
      const slimmed = slimProducts(allProducts);
      const filamentProducts: any[] = [];
      const skipReasons: Record<string, number> = {};

      for (const product of slimmed) {
        const cls = classifyProduct(product);
        if (cls.isFilament) {
          filamentProducts.push(product);
        } else {
          skipReasons[cls.reason] = (skipReasons[cls.reason] || 0) + 1;
        }
      }

      setScanStatusMessage(
        `Found ${filamentProducts.length} filament products. Extracting variants...`,
      );

      // ── Extract filaments ──
      const allFilaments: ExtractedFilament[] = [];
      const extractionErrors: { handle: string; error: string }[] = [];
      const warnings: string[] = [];

      for (const product of filamentProducts) {
        try {
          const result = extractFilamentsFromProduct(product, config);
          allFilaments.push(...result.filaments);
          warnings.push(...result.warnings);
        } catch (err: unknown) {
          const h = product.handle || product.title || 'unknown';
          extractionErrors.push({
            handle: h,
            error: err instanceof Error ? err.message : 'Unknown extraction error',
          });
        }
      }

      setScanStatusMessage(
        `Extracted ${allFilaments.length} filament variants. Comparing with database...`,
      );

      // ── Diff against database ──
      const diffResults = await diffAgainstDatabase(supabase, allFilaments, brandId, brandData.brand_name);
      const newCount = diffResults.filter(r => r.status === 'new').length;
      const changedCount = diffResults.filter(r => r.status === 'price_changed').length;
      const matchedCount = diffResults.filter(r => r.status === 'matched').length;

      // ── Store items in brand_sync_items ──
      setScanStatusMessage('Saving results...');

      const itemsToInsert = diffResults.map(r => ({
        job_id: currentJobId,
        status: r.status,
        extracted_data: r.filament as unknown as Record<string, unknown>,
        display_name: r.filament.display_name,
        color_name: r.filament.color_family || r.filament.display_name.split(' - ').pop() || null,
        material_type: r.filament.material,
        color_hex: r.filament.color_hex,
        color_family: r.filament.color_family,
        finish_type: r.filament.finish_type,
        image_url: r.filament.featured_image,
        variant_image_url: r.filament.variant_image,
        price_usd: r.filament.price_usd,
        price_eur: r.filament.price_eur,
        price_gbp: r.filament.price_gbp,
        price_cad: r.filament.price_cad,
        price_aud: r.filament.price_aud,
        variant_sku: r.filament.variant_sku,
        product_handle: r.filament.product_handle,
        available_regions: r.filament.available_regions,
        is_new: r.status === 'new',
        existing_filament_id: r.existingId,
        price_diff: r.priceDiff as unknown as Record<string, unknown> | null,
        error_message: null,
      }));

      // Add extraction errors
      for (const err of extractionErrors) {
        itemsToInsert.push({
          job_id: currentJobId,
          status: 'error',
          extracted_data: { handle: err.handle } as Record<string, unknown>,
          display_name: err.handle,
          color_name: null,
          material_type: null,
          color_hex: null,
          color_family: null,
          finish_type: null,
          image_url: null,
          variant_image_url: null,
          price_usd: null,
          price_eur: null,
          price_gbp: null,
          price_cad: null,
          price_aud: null,
          variant_sku: null,
          product_handle: null,
          available_regions: null,
          is_new: false,
          existing_filament_id: null,
          price_diff: null,
          error_message: err.error,
        });
      }

      // Batch insert (100 at a time)
      for (let i = 0; i < itemsToInsert.length; i += 100) {
        const batch = itemsToInsert.slice(i, i + 100);
        const { error: insertErr } = await supabase.from('brand_sync_items').insert(batch);
        if (insertErr) console.error(`Insert batch ${i} error:`, insertErr.message);
      }

      // ── Update job ──
      await supabase.from('brand_sync_jobs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        filament_products_found: filamentProducts.length,
        skipped_products: allProducts.length - filamentProducts.length,
        skip_reasons: skipReasons,
        new_count: newCount,
        changed_count: changedCount,
        matched_count: matchedCount,
        error_count: extractionErrors.length,
        warnings: warnings.length > 0 ? warnings : null,
        errors: extractionErrors.length > 0 ? extractionErrors : null,
      }).eq('id', currentJobId);

      // ── Build job summary ──
      setScanJob({
        id: currentJobId,
        brand_id: brandId,
        config_id: configId,
        status: 'completed',
        total_store_products: allProducts.length,
        filament_products_found: filamentProducts.length,
        skipped_products: allProducts.length - filamentProducts.length,
        new_count: newCount,
        changed_count: changedCount,
        matched_count: matchedCount,
        error_count: extractionErrors.length,
        imported_count: null,
        post_import_results: null,
        started_at: null,
        completed_at: new Date().toISOString(),
        created_at: null,
        warnings: warnings.length > 0 ? warnings : null,
      } as SyncJob);

      await loadItems(currentJobId);
      setPhase('delta');
    } catch (err: any) {
      const msg = err.message || 'Scan failed';
      console.error('[useCatalogSync] Scan error:', msg);
      setError(msg);
      setPhase('select');
    }
  }, []);

  // ── Load Items ──

  const loadItems = async (jId: string) => {
    const { data, error: loadErr } = await supabase
      .from('brand_sync_items')
      .select('*')
      .eq('job_id', jId)
      .order('status', { ascending: true })
      .order('display_name', { ascending: true });

    if (loadErr) {
      console.error('Failed to load sync items:', loadErr);
      return;
    }
    setItems((data || []) as SyncItem[]);
  };

  // ── Start Import (Client-Side) ──
  //
  // Runs the full import pipeline in-browser, bypassing the edge function.
  // Steps:
  //   1. Load eligible items from brand_sync_items
  //   2. INSERT new filaments / UPDATE prices on existing ones
  //   3. Record price history per region
  //   4. Compute data quality scores
  //   5. Update job with post-import results

  const startImport = useCallback(async (
    itemIds: string[],
    brandId: string,
    brandName: string,
    brandSlug: string
  ) => {
    if (!jobId || itemIds.length === 0) return;
    setError(null);
    setImporting(true);
    setPhase('importing');

    try {
      console.log(`[import] Starting client-side import: ${itemIds.length} items for ${brandName}`);

      // ── STEP 1: Load eligible items ──
      const eligibleItems: any[] = [];
      const BATCH_SIZE = 50;
      for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
        const batch = itemIds.slice(i, i + BATCH_SIZE);
        const { data, error: batchErr } = await supabase
          .from('brand_sync_items')
          .select('*')
          .eq('job_id', jobId)
          .in('id', batch)
          .in('status', ['new', 'price_changed']);

        if (batchErr) throw new Error(`Failed to load items batch ${i}: ${batchErr.message}`);
        if (data) eligibleItems.push(...data);
      }

      if (eligibleItems.length === 0) {
        setImportResult({
          imported: 0, updatedPrices: 0, errors: 0,
          priceHistoryCount: 0, avgQualityScore: 0, urlsBroken: [],
        });
        setPhase('complete');
        return;
      }

      console.log(`[import] Loaded ${eligibleItems.length} eligible items`);

      // ── STEP 2: Insert / Update Filaments ──
      let insertedCount = 0;
      let updatedPrices = 0;
      let errorCount = 0;
      const insertedFilaments: Array<{ id: string; itemId: string; data: Record<string, any> }> = [];
      const importErrors: string[] = [];

      for (const item of eligibleItems) {
        const extracted = (item.extracted_data || {}) as Record<string, any>;
        const overrides = (item.admin_override_data || {}) as Record<string, any>;
        const merged = { ...extracted, ...overrides };

        try {
          if (item.status === 'price_changed' && item.existing_filament_id) {
            // UPDATE existing filament prices
            const priceUpdate: Record<string, any> = {
              updated_at: new Date().toISOString(),
              last_scraped_at: new Date().toISOString(),
            };
            if (merged.price_usd != null) priceUpdate.variant_price = merged.price_usd;
            if (merged.price_eur != null) priceUpdate.price_eur = merged.price_eur;
            if (merged.price_gbp != null) priceUpdate.price_gbp = merged.price_gbp;
            if (merged.price_cad != null) priceUpdate.price_cad = merged.price_cad;
            if (merged.price_aud != null) priceUpdate.price_aud = merged.price_aud;
            if (merged.price_jpy != null) priceUpdate.price_jpy = merged.price_jpy;
            if (merged.price_cny != null) priceUpdate.price_cny = merged.price_cny;
            if (merged.variant_available != null) priceUpdate.variant_available = merged.variant_available;

            const { error: updateErr } = await supabase
              .from('filaments')
              .update(priceUpdate)
              .eq('id', item.existing_filament_id);

            if (updateErr) throw new Error(`Update failed: ${updateErr.message}`);

            // Mark sync item as imported
            await supabase
              .from('brand_sync_items')
              .update({ status: 'imported', inserted_filament_id: item.existing_filament_id })
              .eq('id', item.id);

            insertedFilaments.push({ id: item.existing_filament_id, itemId: item.id, data: merged });
            updatedPrices++;
            console.log(`[import] ✏️ Updated prices: ${item.display_name}`);
          } else {
            // INSERT new filament
            const { data: filament, error: insertErr } = await supabase
              .from('filaments')
              .insert({
                vendor: merged.vendor ?? brandName,
                brand_id: brandId,
                material: merged.material ?? item.material_type,
                product_title: merged.product_title ?? item.display_name,
                display_name: merged.display_name ?? item.display_name,
                color_family: merged.color_family ?? item.color_family,
                color_hex: merged.color_hex ?? item.color_hex,
                featured_image: merged.featured_image ?? item.image_url,
                variant_image: merged.variant_image ?? item.variant_image_url,
                nozzle_temp_min_c: merged.nozzle_temp_min_c,
                nozzle_temp_max_c: merged.nozzle_temp_max_c,
                bed_temp_min_c: merged.bed_temp_min_c,
                bed_temp_max_c: merged.bed_temp_max_c,
                diameter_nominal_mm: merged.diameter_nominal_mm ?? 1.75,
                diameter_is_assumed: merged.diameter_nominal_mm == null,
                net_weight_g: merged.net_weight_g,
                product_url: merged.product_url ?? merged.product_url_us,
                product_url_eu: merged.product_url_eu,
                product_url_uk: merged.product_url_uk,
                product_url_ca: merged.product_url_ca,
                product_url_au: merged.product_url_au,
                product_url_jp: merged.product_url_jp,
                variant_price: merged.price_usd,
                price_eur: merged.price_eur,
                price_gbp: merged.price_gbp,
                price_cad: merged.price_cad,
                price_aud: merged.price_aud,
                price_jpy: merged.price_jpy,
                price_cny: merged.price_cny,
                product_handle: merged.product_handle ?? item.product_handle,
                variant_sku: merged.variant_sku ?? item.variant_sku,
                finish_type: merged.finish_type ?? item.finish_type,
                spool_material: merged.spool_material,
                spool_outer_d_mm: merged.spool_outer_d_mm,
                spool_width_mm: merged.spool_width_mm,
                pack_quantity: merged.pack_quantity ?? 1,
                print_speed_max_mms: merged.print_speed_max_mms,
                high_speed_capable: merged.high_speed_capable,
                drying_temp_c: merged.drying_temp_c,
                drying_time_hours: merged.drying_time_hours,
                td: merged.td_value ?? merged.td,
                variant_available: merged.variant_available ?? true,
                available_regions: merged.available_regions ?? item.available_regions,
                sync_source: 'catalog-sync-client',
                auto_created: true,
              })
              .select('id')
              .single();

            if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

            // Mark sync item as imported
            await supabase
              .from('brand_sync_items')
              .update({ status: 'imported', inserted_filament_id: filament?.id })
              .eq('id', item.id);

            insertedFilaments.push({ id: filament!.id, itemId: item.id, data: merged });
            insertedCount++;
            console.log(`[import] ✅ Inserted: ${item.display_name} → ${filament!.id}`);
          }
        } catch (err: any) {
          errorCount++;
          const msg = `${item.display_name}: ${err.message}`;
          importErrors.push(msg);
          console.error(`[import] ❌ ${msg}`);

          await supabase
            .from('brand_sync_items')
            .update({ status: 'error', error_message: err.message })
            .eq('id', item.id);
        }
      }

      console.log(`[import] Done: ${insertedCount} inserted, ${updatedPrices} updated, ${errorCount} errors`);

      // ── STEP 3: Price History ──
      let priceHistoryCount = 0;
      const postErrors: string[] = [];

      try {
        const regionMap = [
          { field: 'price_usd', altField: 'variant_price', region: 'US' },
          { field: 'price_cad', region: 'CA' },
          { field: 'price_eur', region: 'EU' },
          { field: 'price_gbp', region: 'UK' },
          { field: 'price_aud', region: 'AU' },
          { field: 'price_jpy', region: 'JP' },
          { field: 'price_cny', region: 'CN' },
        ];

        const priceRows: Array<{ filament_id: string; price: number; region: string; source: string }> = [];

        for (const fil of insertedFilaments) {
          for (const { field, altField, region } of regionMap) {
            const price = fil.data[field] ?? (altField ? fil.data[altField] : null);
            if (price != null && price > 0) {
              priceRows.push({
                filament_id: fil.id,
                price,
                region,
                source: 'catalog_sync_import',
              });
            }
          }
        }

        if (priceRows.length > 0) {
          for (let i = 0; i < priceRows.length; i += 200) {
            const chunk = priceRows.slice(i, i + 200);
            const { error: phErr } = await supabase.from('price_history').insert(chunk);
            if (phErr) {
              postErrors.push(`Price history batch ${i}: ${phErr.message}`);
            } else {
              priceHistoryCount += chunk.length;
            }
          }
        }
        console.log(`[import] 📊 ${priceHistoryCount} price history records created`);
      } catch (e: any) {
        postErrors.push(`Price history: ${e.message}`);
      }

      // ── STEP 4: Data Quality Scores ──
      let totalQuality = 0;
      for (const fil of insertedFilaments) {
        let score = 0;
        const d = fil.data;
        if (d.display_name) score += 15;
        if (d.color_hex && d.color_hex !== '#808080') score += 15;
        if (d.color_family) score += 10;
        if (d.material) score += 10;
        if (d.price_usd || d.variant_price) score += 15;
        if (d.featured_image) score += 10;
        if (d.nozzle_temp_min_c || d.nozzle_temp_max_c) score += 10;
        if (d.variant_sku) score += 5;
        if (d.product_url || d.product_url_us) score += 5;
        if (d.net_weight_g) score += 5;
        totalQuality += Math.min(score, 100);
      }
      const avgQuality = insertedFilaments.length > 0
        ? Math.round(totalQuality / insertedFilaments.length)
        : 0;

      // ── STEP 5: Update Job ──
      const postImportResults = {
        price_history_count: priceHistoryCount,
        urls_validated: 0, // Skip URL validation client-side (CORS limitations)
        urls_broken: [] as string[],
        avg_quality_score: avgQuality,
        errors: postErrors,
        completed_at: new Date().toISOString(),
      };

      await supabase
        .from('brand_sync_jobs')
        .update({
          imported_count: insertedCount + updatedPrices,
          post_import_results: postImportResults,
        })
        .eq('id', jobId);

      console.log(`[import] ✅ Job ${jobId} updated with post-import results`);

      setImportResult({
        imported: insertedCount,
        updatedPrices,
        errors: errorCount,
        priceHistoryCount,
        avgQualityScore: avgQuality,
        urlsBroken: [],
      });

      setPhase('complete');
    } catch (err: any) {
      const msg = err.message || 'Import failed';
      console.error('[import] Fatal error:', msg);
      setError(msg);
      // Stay on importing phase so user can retry
    } finally {
      setImporting(false);
    }
  }, [jobId]);

  // ── Reset ──

  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPhase('select');
    setJobId(null);
    setScanJob(null);
    setItems([]);
    setImportResult(null);
    setError(null);
    setImporting(false);
  }, []);

  return {
    phase,
    jobId,
    scanJob,
    items,
    deltaStats,
    importResult,
    error,
    importing,
    scanStatusMessage,
    startScan,
    startImport,
    reset,
  };
}
