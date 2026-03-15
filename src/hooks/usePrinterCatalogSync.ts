import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  classifyProductAsPrinter,
  extractPrinterFromProduct,
  computePrinterQualityScore,
  normalizeForMatching,
  cleanModelName,
} from '@/lib/printer-sync-core';
import { generatePrinterSlug } from '@/lib/printerSlugUtils';
import type { PrinterSyncItem, PrinterSyncJob, ExtractedPrinter } from '@/types/printer-sync';
import type { Phase, DeltaStats, ImportResult, ImportError } from '@/hooks/useCatalogSync';

// ============================================================
// Known Printer Brand Configs
// ============================================================

/**
 * Printer brands with known Shopify stores where we can fetch products.
 * These map brand slugs to their store URLs and settings.
 *
 * platform values:
 *   - 'shopify'       — standard /products.json API works
 *   - 'shopify-collections' — use collections_path instead of root products.json
 *   - 'pre-fetch'     — API is blocked; load from a local JSON file in /public/data/
 */
const KNOWN_PRINTER_BRAND_SLUGS: Record<string, {
  brand_name: string;
  base_url: string;
  platform: 'shopify' | 'shopify-collections' | 'pre-fetch';
  collections_path?: string;
  pre_fetch_path?: string;
  regional_url_pattern: Record<string, string>;
}> = {
  'bambu-lab': {
    brand_name: 'Bambu Lab',
    base_url: 'https://us.store.bambulab.com',
    platform: 'pre-fetch',
    pre_fetch_path: '/data/bambu-lab-printers.json',
    regional_url_pattern: {
      US: 'https://us.store.bambulab.com',
      CA: 'https://ca.store.bambulab.com',
      EU: 'https://eu.store.bambulab.com',
      UK: 'https://uk.store.bambulab.com',
      AU: 'https://au.store.bambulab.com',
    },
  },
  'creality': {
    brand_name: 'Creality',
    base_url: 'https://store.creality.com',
    platform: 'pre-fetch',
    pre_fetch_path: '/data/creality-printers.json',
    regional_url_pattern: { US: 'https://store.creality.com' },
  },
  'elegoo': {
    brand_name: 'Elegoo',
    base_url: 'https://us.elegoo.com',
    platform: 'shopify-collections',
    collections_path: '/collections/3d-printers/products.json',
    regional_url_pattern: { US: 'https://us.elegoo.com' },
  },
  'anycubic': {
    brand_name: 'Anycubic',
    base_url: 'https://store.anycubic.com',
    platform: 'shopify-collections',
    collections_path: '/collections/3d-printers/products.json',
    regional_url_pattern: {
      US: 'https://store.anycubic.com',
      CA: 'https://ca.anycubic.com',
      EU: 'https://eu.anycubic.com',
      UK: 'https://uk.anycubic.com',
    },
  },
  'qidi': {
    brand_name: 'QIDI',
    base_url: 'https://us.qidi3d.com',
    platform: 'shopify-collections',
    collections_path: '/collections/3d-printers/products.json',
    regional_url_pattern: { US: 'https://us.qidi3d.com' },
  },
  // Alias: DB stores brand as "QIDI Tech" → slug "qidi-tech"
  'qidi-tech': {
    brand_name: 'QIDI Tech',
    base_url: 'https://us.qidi3d.com',
    platform: 'shopify-collections',
    collections_path: '/collections/3d-printers/products.json',
    regional_url_pattern: { US: 'https://us.qidi3d.com' },
  },
  'sovol': {
    brand_name: 'Sovol',
    base_url: 'https://www.sovol3d.com',
    platform: 'shopify-collections',
    collections_path: '/collections/3d-printer/products.json',
    regional_url_pattern: { US: 'https://www.sovol3d.com' },
  },
  'kingroon': {
    brand_name: 'Kingroon',
    base_url: 'https://kingroon.com',
    platform: 'shopify-collections',
    collections_path: '/collections/fdm-3d-printer/products.json',
    regional_url_pattern: { US: 'https://kingroon.com' },
  },
  'flsun': {
    brand_name: 'FLSUN',
    base_url: 'https://us.store.flsun3d.com',
    platform: 'shopify-collections',
    collections_path: '/collections/3d-printers/products.json',
    regional_url_pattern: { US: 'https://us.store.flsun3d.com' },
  },
  'flashforge': {
    brand_name: 'FlashForge',
    base_url: 'https://www.flashforge.com',
    platform: 'shopify-collections',
    collections_path: '/collections/3d-printers/products.json',
    regional_url_pattern: { US: 'https://www.flashforge.com' },
  },
  'snapmaker': {
    brand_name: 'Snapmaker',
    base_url: 'https://us.snapmaker.com',
    platform: 'shopify',
    regional_url_pattern: {
      US: 'https://us.snapmaker.com',
      EU: 'https://eu.snapmaker.com',
    },
  },
  'ratrig': {
    brand_name: 'RatRig',
    base_url: 'https://www.ratrig.com',
    platform: 'shopify-collections',
    collections_path: '/collections/3d-printers/products.json',
    regional_url_pattern: { US: 'https://www.ratrig.com' },
  },
  'ankermake': {
    brand_name: 'AnkerMake',
    base_url: 'https://www.eufymake.com',
    platform: 'pre-fetch',
    pre_fetch_path: '/data/ankermake-printers.json',
    regional_url_pattern: { US: 'https://www.eufymake.com' },
  },
  'ldo-motors': {
    brand_name: 'LDO Motors',
    base_url: 'https://www.fabreeko.com',
    platform: 'pre-fetch',
    pre_fetch_path: '/data/ldo-motors-printers.json',
    regional_url_pattern: { US: 'https://www.fabreeko.com' },
  },
  'markforged': {
    brand_name: 'Markforged',
    base_url: 'https://markforged.com',
    platform: 'pre-fetch',
    pre_fetch_path: '/data/markforged-printers.json',
    regional_url_pattern: { US: 'https://markforged.com' },
  },
  'prusa-research': {
    brand_name: 'Prusa Research',
    base_url: 'https://www.prusa3d.com',
    platform: 'pre-fetch',
    pre_fetch_path: '/data/prusa-research-printers.json',
    regional_url_pattern: {
      US: 'https://www.prusa3d.com',
      EU: 'https://www.prusa3d.com',
    },
  },
  'raise3d': {
    brand_name: 'Raise3D',
    base_url: 'https://shop.raise3d.com',
    platform: 'shopify-collections',
    collections_path: '/collections/3d-printer/products.json',
    regional_url_pattern: { US: 'https://shop.raise3d.com' },
  },
  'ultimaker': {
    brand_name: 'UltiMaker',
    base_url: 'https://store.ultimaker.com',
    platform: 'pre-fetch',
    pre_fetch_path: '/data/ultimaker-printers.json',
    regional_url_pattern: { US: 'https://store.ultimaker.com' },
  },
  'voron-design': {
    brand_name: 'Voron Design',
    base_url: 'https://vorondesign.com',
    platform: 'pre-fetch',
    pre_fetch_path: '/data/voron-design-printers.json',
    regional_url_pattern: { US: 'https://vorondesign.com' },
  },
};

// ============================================================
// Shopify Fetch (reused from useCatalogSync pattern)
// ============================================================

async function fetchShopifyCatalog(
  baseUrl: string,
  maxPages = 10,
  onProgress?: (msg: string) => void,
  customPath?: string,
): Promise<{ products: any[]; totalFetched: number }> {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const allProducts: any[] = [];
  let page = 1;

  while (page <= maxPages) {
    const path = customPath
      ? `${customPath}${customPath.includes('?') ? '&' : '?'}limit=250&page=${page}`
      : `/products.json?limit=250&page=${page}`;
    const pageUrl = `${cleanBase}${path}`;
    onProgress?.(`Fetching page ${page}...`);

    const response = await fetch(pageUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (page === 1) throw new Error(`Store returned HTTP ${response.status}. The Shopify API may be blocked — consider using a pre-fetched JSON file.`);
      break;
    }

    const data = await response.json();
    const products = data?.products;
    if (!products || !Array.isArray(products) || products.length === 0) break;

    allProducts.push(...products);
    if (products.length < 250) break;
    page++;
    await new Promise(r => setTimeout(r, 200));
  }

  return { products: allProducts, totalFetched: allProducts.length };
}

async function fetchFromPrefetchedJson(
  jsonPath: string,
  onProgress?: (msg: string) => void,
): Promise<{ products: any[]; totalFetched: number }> {
  onProgress?.('Loading pre-fetched product data...');
  const response = await fetch(jsonPath);
  if (!response.ok) {
    throw new Error(`Failed to load pre-fetched data: HTTP ${response.status}. Run the brand's pre-fetch script first.`);
  }
  const data = await response.json();
  const products = data?.products || [];
  onProgress?.(`Loaded ${products.length} products from pre-fetched data`);
  return { products, totalFetched: products.length };
}

// ============================================================
// Diff Against Database
// ============================================================

/**
 * Compare extracted printers against the `printers` table.
 * Uses multiple matching strategies: slug, exact name, normalized, and model-name-based.
 */
async function diffPrintersAgainstDatabase(
  extractedPrinters: ExtractedPrinter[],
  brandId: string,
  brandName?: string,
): Promise<Array<{
  printer: ExtractedPrinter;
  status: 'new' | 'matched' | 'price_changed';
  existingId: string | null;
  priceDiff: Array<{ field: string; old: number | null; new: number | null }> | null;
}>> {
  // Load existing printers for this brand — include printer_id for slug-based matching
  const { data: existing } = await supabase
    .from('printers')
    .select('id, printer_id, display_name, model_name, current_price_usd_store, current_price_eur_store, current_price_gbp_store, current_price_cad_store, current_price_aud_store')
    .eq('brand_id', brandId);

  // Build multiple lookup maps for flexible matching
  const slugMap = new Map<string, any>();
  const exactMap = new Map<string, any>();
  const normalizedMap = new Map<string, any>();
  const modelNameMap = new Map<string, any>();

  for (const p of existing || []) {
    // Slug key — most reliable since it matches the UNIQUE constraint
    const slugKey = (p.printer_id || '').toLowerCase().trim();
    if (slugKey) slugMap.set(slugKey, p);

    // Exact key (lowercased)
    const displayKey = (p.display_name || '').toLowerCase().trim();
    const modelKey = (p.model_name || '').toLowerCase().trim();
    if (displayKey) exactMap.set(displayKey, p);
    if (modelKey) exactMap.set(modelKey, p);

    // Normalized key (stripped of noise)
    const normDisplay = normalizeForMatching(p.display_name || '');
    const normModel = normalizeForMatching(p.model_name || '');
    if (normDisplay) normalizedMap.set(normDisplay, p);
    if (normModel) normalizedMap.set(normModel, p);

    // Brand-stripped model name key
    if (brandName) {
      const cleanedDisplay = normalizeForMatching(cleanModelName(p.display_name || '', brandName));
      const cleanedModel = normalizeForMatching(cleanModelName(p.model_name || '', brandName));
      if (cleanedDisplay) modelNameMap.set(cleanedDisplay, p);
      if (cleanedModel) modelNameMap.set(cleanedModel, p);
    }
  }

  const results: Array<{
    printer: ExtractedPrinter;
    status: 'new' | 'matched' | 'price_changed';
    existingId: string | null;
    priceDiff: Array<{ field: string; old: number | null; new: number | null }> | null;
  }> = [];

  for (const printer of extractedPrinters) {
    // Generate the slug that would be used for INSERT — match against it first
    const resolvedModel = printer.model_name || printer.display_name;
    const candidateSlug = generatePrinterSlug(brandName || '', resolvedModel || '');

    // Try multiple matching strategies, slug first (most reliable)
    const displayKey = (printer.display_name || '').toLowerCase().trim();
    const modelKey = (printer.model_name || '').toLowerCase().trim();
    const normDisplay = normalizeForMatching(printer.display_name || '');
    const normModel = normalizeForMatching(printer.model_name || '');
    const cleanedDisplay = brandName
      ? normalizeForMatching(cleanModelName(printer.display_name || '', brandName))
      : '';
    const cleanedModel = brandName
      ? normalizeForMatching(cleanModelName(printer.model_name || '', brandName))
      : '';

    const match =
      slugMap.get(candidateSlug) ||
      exactMap.get(displayKey) ||
      exactMap.get(modelKey) ||
      normalizedMap.get(normDisplay) ||
      normalizedMap.get(normModel) ||
      (cleanedDisplay ? modelNameMap.get(cleanedDisplay) : undefined) ||
      (cleanedModel ? modelNameMap.get(cleanedModel) : undefined) ||
      null;

    if (!match) {
      results.push({ printer, status: 'new', existingId: null, priceDiff: null });
      continue;
    }

    // Check price changes
    const diffs: Array<{ field: string; old: number | null; new: number | null }> = [];
    const priceFields = [
      { field: 'price_usd', dbField: 'current_price_usd_store' },
      { field: 'price_eur', dbField: 'current_price_eur_store' },
      { field: 'price_gbp', dbField: 'current_price_gbp_store' },
      { field: 'price_cad', dbField: 'current_price_cad_store' },
      { field: 'price_aud', dbField: 'current_price_aud_store' },
    ] as const;

    for (const { field, dbField } of priceFields) {
      const oldPrice = match[dbField] != null ? parseFloat(match[dbField]) : null;
      const newPrice = (printer as any)[field] as number | null;
      if (newPrice != null && oldPrice != null && Math.abs(newPrice - oldPrice) > 0.01) {
        diffs.push({ field, old: oldPrice, new: newPrice });
      }
    }

    if (diffs.length > 0) {
      results.push({ printer, status: 'price_changed', existingId: match.id, priceDiff: diffs });
    } else {
      results.push({ printer, status: 'matched', existingId: match.id, priceDiff: null });
    }
  }

  return results;
}

// ============================================================
// Hook
// ============================================================

export function usePrinterCatalogSync() {
  const [phase, setPhase] = useState<Phase>('select');
  const [jobId, setJobId] = useState<string | null>(null);
  const [scanJob, setScanJob] = useState<PrinterSyncJob | null>(null);
  const [items, setItems] = useState<PrinterSyncItem[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('');

  // Derived stats — computed from in-memory items (single source of truth)
  const deltaStats: DeltaStats = {
    totalDiscovered: items.length,
    inDatabase: items.filter(i => i.status === 'matched' || i.status === 'price_changed').length,
    newCount: items.filter(i => i.status === 'new').length,
    changedCount: items.filter(i => i.status === 'price_changed').length,
    matchedCount: items.filter(i => i.status === 'matched').length,
    errorCount: items.filter(i => i.status === 'error').length,
  };

  // ── Start Scan ──
  const startScan = useCallback(async (brandId: string, _configId: string) => {
    setError(null);
    setItems([]);
    setScanJob(null);
    setImportResult(null);
    setPhase('scanning');
    setScanStatusMessage('Loading printer brand...');

    try {
      // Load brand info — printer_brands table has `brand` (not brand_name/brand_slug)
      const { data: brandData, error: brandErr } = await supabase
        .from('printer_brands')
        .select('brand')
        .eq('id', brandId)
        .maybeSingle();

      if (brandErr || !brandData) throw new Error(`Printer brand not found: ${brandId}`);

      // Derive slug from brand name (e.g. "Bambu Lab" → "bambu-lab")
      const brandSlug = brandData.brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const knownConfig = KNOWN_PRINTER_BRAND_SLUGS[brandSlug];

      // Printer sync runs fully in-memory (no brand_sync_jobs/brand_sync_items DB writes).
      // The brand_sync_* tables have FK constraints to automated_brands and filaments that
      // are incompatible with printer_brands and printers. Rather than requiring a DB migration,
      // we keep everything in React state. Scan results persist for the session only.
      const currentJobId = crypto.randomUUID();
      setJobId(currentJobId);

      // Fetch products from store
      let allProducts: any[];
      let sourceCurrency = 'USD'; // Default currency — will be overridden by pre-fetched data or store config
      const fallbackPrefetchPath = `/data/${brandSlug}-printers.json`;

      if (knownConfig?.platform === 'pre-fetch') {
        // Brand API is blocked — load from pre-fetched JSON
        const prefetchPath = knownConfig.pre_fetch_path || fallbackPrefetchPath;
        setScanStatusMessage('Loading pre-fetched product data...');
        const result = await fetchFromPrefetchedJson(prefetchPath, (msg) => setScanStatusMessage(msg));
        allProducts = result.products;
        // Pre-fetched data includes a top-level currency field
        // Each product also has _currency, but the top-level tells us the store's native currency
      } else if (knownConfig?.platform === 'shopify-collections' && knownConfig.collections_path) {
        // Use Shopify collections endpoint (scoped to printers)
        setScanStatusMessage('Fetching printers from store collection...');
        const result = await fetchShopifyCatalog(
          knownConfig.base_url, 10,
          (msg) => setScanStatusMessage(msg),
          knownConfig.collections_path,
        );
        allProducts = result.products;
      } else if (knownConfig?.platform === 'shopify') {
        // Standard Shopify /products.json
        setScanStatusMessage('Fetching products from store...');
        const result = await fetchShopifyCatalog(knownConfig.base_url, 10, (msg) => setScanStatusMessage(msg));
        allProducts = result.products;
      } else {
        // Unknown brand — try pre-fetched JSON as fallback
        setScanStatusMessage(`Looking for pre-fetched data for ${brandData.brand}...`);
        try {
          const result = await fetchFromPrefetchedJson(fallbackPrefetchPath, (msg) => setScanStatusMessage(msg));
          allProducts = result.products;
        } catch {
          throw new Error(
            `"${brandData.brand}" doesn't have automatic store scanning yet. ` +
            `To scan this brand, run its pre-fetch script first:\n` +
            `  node scripts/fetch-${brandSlug}-printers.cjs\n\n` +
            `If no script exists yet, one needs to be created for this brand's store.`
          );
        }
      }

      if (allProducts.length === 0) throw new Error('No products found in store');

      setScanStatusMessage(`Fetched ${allProducts.length} products. Classifying printers...`);
      setPhase('processing');

      // Classify products
      const printerProducts: any[] = [];
      for (const product of allProducts) {
        if (classifyProductAsPrinter(product)) {
          printerProducts.push(product);
        }
      }

      setScanStatusMessage(`Found ${printerProducts.length} printers. Extracting specs...`);

      // Extract printer data
      const extractedPrinters: ExtractedPrinter[] = [];
      const extractionErrors: { handle: string; error: string }[] = [];

      const resolvedBrandName = knownConfig?.brand_name || brandData.brand;

      for (const product of printerProducts) {
        try {
          // Each product may carry its own _currency (from pre-fetch scripts).
          // For live Shopify fetches, sourceCurrency defaults to 'USD'.
          const productCurrency = product._currency || sourceCurrency;
          const printer = extractPrinterFromProduct(
            product,
            brandId,
            knownConfig?.regional_url_pattern || null,
            resolvedBrandName,
            productCurrency,
          );
          extractedPrinters.push(printer);
        } catch (err: unknown) {
          extractionErrors.push({
            handle: product.handle || product.title || 'unknown',
            error: err instanceof Error ? err.message : 'Unknown extraction error',
          });
        }
      }

      setScanStatusMessage(`Extracted ${extractedPrinters.length} printers. Comparing with database...`);

      // Diff against database
      const diffResults = await diffPrintersAgainstDatabase(extractedPrinters, brandId, resolvedBrandName);
      const newCount = diffResults.filter(r => r.status === 'new').length;
      const changedCount = diffResults.filter(r => r.status === 'price_changed').length;
      const matchedCount = diffResults.filter(r => r.status === 'matched').length;

      // Build in-memory items directly from diff results (no DB writes needed)
      setScanStatusMessage('Building results...');

      const mappedItems: PrinterSyncItem[] = diffResults.map(r => {
        const ext = r.printer as Record<string, any>;
        return {
          id: crypto.randomUUID(),
          job_id: currentJobId,
          status: r.status,
          is_new: r.status === 'new',
          extracted_data: ext,
          admin_override_data: null,
          display_name: r.printer.display_name,
          model_name: ext.model_name || r.printer.display_name,
          printer_technology: ext.printer_technology,
          image_url: r.printer.featured_image,
          build_volume_x_mm: ext.build_volume_x_mm,
          build_volume_y_mm: ext.build_volume_y_mm,
          build_volume_z_mm: ext.build_volume_z_mm,
          max_print_speed_mms: ext.max_print_speed_mms,
          max_nozzle_temp_c: ext.max_nozzle_temp_c,
          bed_max_temp_c: ext.bed_max_temp_c,
          has_enclosure: ext.has_enclosure,
          has_wifi: ext.has_wifi,
          multi_material_supported: ext.multi_material_supported,
          multi_material_max_spools: ext.multi_material_max_spools,
          auto_bed_leveling: ext.auto_bed_leveling,
          extruder_type: ext.extruder_type,
          extruder_count: ext.extruder_count,
          filament_diameter_mm: ext.filament_diameter_mm,
          price_usd: r.printer.price_usd,
          price_eur: r.printer.price_eur,
          price_cad: r.printer.price_cad,
          price_gbp: r.printer.price_gbp,
          price_aud: r.printer.price_aud,
          existing_printer_id: r.existingId,
          inserted_printer_id: null,
          price_diff: r.priceDiff as any,
          error_message: null,
          variant_sku: r.printer.variant_sku,
          product_handle: r.printer.product_handle,
          available_regions: r.printer.available_regions,
          discontinued: ext.discontinued ?? null,
          created_at: new Date().toISOString(),
        };
      });

      // Add extraction errors as items
      for (const err of extractionErrors) {
        mappedItems.push({
          id: crypto.randomUUID(),
          job_id: currentJobId,
          status: 'error',
          is_new: false,
          extracted_data: { handle: err.handle } as Record<string, unknown>,
          admin_override_data: null,
          display_name: err.handle,
          model_name: null,
          printer_technology: null,
          image_url: null,
          build_volume_x_mm: null,
          build_volume_y_mm: null,
          build_volume_z_mm: null,
          max_print_speed_mms: null,
          max_nozzle_temp_c: null,
          bed_max_temp_c: null,
          has_enclosure: null,
          has_wifi: null,
          multi_material_supported: null,
          multi_material_max_spools: null,
          auto_bed_leveling: null,
          extruder_type: null,
          extruder_count: null,
          filament_diameter_mm: null,
          price_usd: null,
          price_eur: null,
          price_cad: null,
          price_gbp: null,
          price_aud: null,
          existing_printer_id: null,
          inserted_printer_id: null,
          price_diff: null,
          error_message: err.error,
          variant_sku: null,
          product_handle: null,
          available_regions: null,
          discontinued: null,
          created_at: new Date().toISOString(),
        });
      }

      setItems(mappedItems);

      // Build scan job summary (in-memory only)
      setScanJob({
        id: currentJobId,
        brand_id: brandId,
        config_id: null,
        status: 'completed',
        total_store_products: allProducts.length,
        printer_products_found: printerProducts.length,
        skipped_products: allProducts.length - printerProducts.length,
        new_count: newCount,
        changed_count: changedCount,
        matched_count: matchedCount,
        error_count: extractionErrors.length,
        imported_count: null,
        post_import_results: null,
        started_at: null,
        completed_at: new Date().toISOString(),
        created_at: null,
        warnings: null,
      });

      setPhase('delta');
    } catch (err: any) {
      console.error('[usePrinterCatalogSync] Scan error:', err.message);
      setError(err.message || 'Scan failed');
      setPhase('select');
    }
  }, []);

  // Items are managed in-memory — no loadItems from DB needed.

  // ── Start Import ──
  const startImport = useCallback(async (
    itemIds: string[],
    brandId: string,
    brandName: string,
    _brandSlug: string,
  ) => {
    if (!jobId || itemIds.length === 0) return;
    setError(null);
    setImporting(true);
    setPhase('importing');

    try {
      // Use in-memory items (no DB read needed)
      const selectedItems = items.filter(i => itemIds.includes(i.id));

      const errorDetails: ImportError[] = [];
      let imported = 0;
      let updatedPrices = 0;

      for (const row of selectedItems) {
        const ext = (row.extracted_data || {}) as Record<string, any>;
        const merged = { ...ext, ...(row.admin_override_data || {}) };

        if (row.status === 'new') {
          // Insert new printer
          const resolvedModelName = merged.model_name || merged.display_name || row.display_name;
          const printerId = generatePrinterSlug(brandName, resolvedModelName);
          const { error: insertErr } = await supabase.from('printers').insert({
            printer_id: printerId,
            brand_id: brandId,
            display_name: merged.display_name || row.display_name,
            model_name: resolvedModelName,
            printer_technology: merged.printer_technology || 'FDM',
            build_volume_x_mm: merged.build_volume_x_mm,
            build_volume_y_mm: merged.build_volume_y_mm,
            build_volume_z_mm: merged.build_volume_z_mm,
            max_nozzle_temp_c: merged.max_nozzle_temp_c,
            bed_max_temp_c: merged.bed_max_temp_c,
            max_print_speed_mms: merged.max_print_speed_mms,
            has_enclosure: merged.has_enclosure,
            has_wifi: merged.has_wifi,
            multi_material_supported: merged.multi_material_supported,
            multi_material_max_spools: merged.multi_material_max_spools,
            auto_bed_leveling: merged.auto_bed_leveling,
            extruder_type: merged.extruder_type,
            extruder_count: merged.extruder_count ?? 1,
            filament_diameter_mm: merged.filament_diameter_mm ?? 1.75,
            current_price_usd_store: merged.price_usd ?? row.price_usd,
            current_price_eur_store: merged.price_eur ?? row.price_eur,
            current_price_gbp_store: merged.price_gbp ?? row.price_gbp,
            current_price_cad_store: merged.price_cad ?? row.price_cad,
            current_price_aud_store: merged.price_aud ?? row.price_aud,
            image_url: merged.featured_image ?? row.image_url,
            official_product_url: merged.product_url,
            official_store_url: merged.product_url,
            official_store_url_au: merged.product_url_au,
            official_store_url_ca: merged.product_url_ca,
            official_store_url_eu: merged.product_url_eu,
            official_store_url_uk: merged.product_url_uk,
            product_url: merged.product_url,
            product_url_au: merged.product_url_au,
            product_url_ca: merged.product_url_ca,
            product_url_eu: merged.product_url_eu,
            product_url_uk: merged.product_url_uk,
            sku: merged.variant_sku ?? merged.sku,
            discontinued: merged.discontinued,
            machine_weight_kg: merged.machine_weight_kg,
            machine_width_mm: merged.machine_footprint_x_mm,
            machine_depth_mm: merged.machine_footprint_y_mm,
            machine_height_mm: merged.machine_footprint_z_mm,
            stock_nozzle_diameter_mm: merged.stock_nozzle_diameter_mm,
            bed_heated: merged.bed_heated,
            has_usb_a_port: merged.has_usb,
            input_shaping_supported: merged.input_shaping_supported,
            filament_runout_detection: merged.filament_runout_detection,
            layer_height_min_um: merged.layer_height_min_um,
            layer_height_max_um: merged.layer_height_max_um,
            has_ethernet: merged.has_ethernet,
            has_sd_card: merged.has_sd_card,
            rated_power_w: merged.rated_power_w,
            power_input_voltage: merged.power_input_voltage,
            frame_material: merged.frame_material,
            auto_bed_leveling_method: merged.auto_bed_leveling_method,
            enclosure_type: merged.enclosure_type,
            firmware_family: merged.firmware_family,
          });

          if (insertErr) {
            // If unique constraint violation on printer_id, fall back to UPDATE
            const isDuplicateKey = insertErr.message?.includes('duplicate key') ||
              insertErr.message?.includes('unique constraint') ||
              insertErr.message?.includes('already exists') ||
              insertErr.code === '23505';

            if (isDuplicateKey) {
              console.warn(`[Import] Duplicate printer_id "${printerId}" — falling back to UPDATE`);
              // Find the existing printer by printer_id and update it
              const { data: existingBySlug } = await supabase
                .from('printers')
                .select('id')
                .eq('printer_id', printerId)
                .maybeSingle();

              if (existingBySlug) {
                const { error: upsertErr } = await supabase.from('printers').update({
                  brand_id: brandId,
                  display_name: merged.display_name || row.display_name,
                  model_name: resolvedModelName,
                  printer_technology: merged.printer_technology || 'FDM',
                  build_volume_x_mm: merged.build_volume_x_mm,
                  build_volume_y_mm: merged.build_volume_y_mm,
                  build_volume_z_mm: merged.build_volume_z_mm,
                  max_nozzle_temp_c: merged.max_nozzle_temp_c,
                  bed_max_temp_c: merged.bed_max_temp_c,
                  max_print_speed_mms: merged.max_print_speed_mms,
                  has_enclosure: merged.has_enclosure,
                  has_wifi: merged.has_wifi,
                  multi_material_supported: merged.multi_material_supported,
                  multi_material_max_spools: merged.multi_material_max_spools,
                  auto_bed_leveling: merged.auto_bed_leveling,
                  extruder_type: merged.extruder_type,
                  extruder_count: merged.extruder_count ?? 1,
                  filament_diameter_mm: merged.filament_diameter_mm ?? 1.75,
                  current_price_usd_store: merged.price_usd ?? row.price_usd,
                  current_price_eur_store: merged.price_eur ?? row.price_eur,
                  current_price_gbp_store: merged.price_gbp ?? row.price_gbp,
                  current_price_cad_store: merged.price_cad ?? row.price_cad,
                  current_price_aud_store: merged.price_aud ?? row.price_aud,
                  image_url: merged.featured_image ?? row.image_url,
                  official_product_url: merged.product_url,
                  official_store_url: merged.product_url,
                  official_store_url_au: merged.product_url_au,
                  official_store_url_ca: merged.product_url_ca,
                  official_store_url_eu: merged.product_url_eu,
                  official_store_url_uk: merged.product_url_uk,
                  product_url: merged.product_url,
                  product_url_au: merged.product_url_au,
                  product_url_ca: merged.product_url_ca,
                  product_url_eu: merged.product_url_eu,
                  product_url_uk: merged.product_url_uk,
                  sku: merged.variant_sku ?? merged.sku,
                  discontinued: merged.discontinued,
                  machine_weight_kg: merged.machine_weight_kg,
                  machine_width_mm: merged.machine_footprint_x_mm,
                  machine_depth_mm: merged.machine_footprint_y_mm,
                  machine_height_mm: merged.machine_footprint_z_mm,
                  stock_nozzle_diameter_mm: merged.stock_nozzle_diameter_mm,
                  bed_heated: merged.bed_heated,
                  has_usb_a_port: merged.has_usb,
                  input_shaping_supported: merged.input_shaping_supported,
                  filament_runout_detection: merged.filament_runout_detection,
                  layer_height_min_um: merged.layer_height_min_um,
                  layer_height_max_um: merged.layer_height_max_um,
                  has_ethernet: merged.has_ethernet,
                  has_sd_card: merged.has_sd_card,
                  rated_power_w: merged.rated_power_w,
                  power_input_voltage: merged.power_input_voltage,
                  frame_material: merged.frame_material,
                  auto_bed_leveling_method: merged.auto_bed_leveling_method,
                  enclosure_type: merged.enclosure_type,
                  firmware_family: merged.firmware_family,
                }).eq('id', existingBySlug.id);

                if (upsertErr) {
                  errorDetails.push({
                    itemId: row.id,
                    displayName: row.display_name || 'Unknown',
                    severity: 'critical',
                    message: upsertErr.message,
                    explanation: `Duplicate printer_id "${printerId}" found, but UPDATE also failed.`,
                    resolution: 'Manual intervention required.',
                    resolutionType: 'manual',
                    syncItemId: row.id,
                  });
                } else {
                  // Successfully updated existing printer via fallback
                  updatedPrices++;
                }
              } else {
                // Very rare: constraint violation but couldn't find the existing row
                errorDetails.push({
                  itemId: row.id,
                  displayName: row.display_name || 'Unknown',
                  severity: 'critical',
                  message: insertErr.message,
                  explanation: `Duplicate printer_id "${printerId}" but existing row not found.`,
                  resolution: 'Check for concurrent imports or data inconsistency.',
                  resolutionType: 'manual',
                  syncItemId: row.id,
                });
              }
            } else {
              // Non-duplicate-key error — record as-is
              errorDetails.push({
                itemId: row.id,
                displayName: row.display_name || 'Unknown',
                severity: 'critical',
                message: insertErr.message,
                explanation: 'Failed to insert printer into the database.',
                resolution: 'Check the extracted data for missing required fields.',
                resolutionType: 'manual',
                syncItemId: row.id,
              });
            }
          } else {
            imported++;
          }
        } else if (row.status === 'price_changed') {
          // Update prices on existing printer
          const existingId = row.existing_printer_id;
          if (existingId) {
            const updates: Record<string, any> = {};
            if ((merged.price_usd ?? row.price_usd) != null) updates.current_price_usd_store = merged.price_usd ?? row.price_usd;
            if ((merged.price_eur ?? row.price_eur) != null) updates.current_price_eur_store = merged.price_eur ?? row.price_eur;
            if ((merged.price_gbp ?? row.price_gbp) != null) updates.current_price_gbp_store = merged.price_gbp ?? row.price_gbp;
            if ((merged.price_cad ?? row.price_cad) != null) updates.current_price_cad_store = merged.price_cad ?? row.price_cad;
            if ((merged.price_aud ?? row.price_aud) != null) updates.current_price_aud_store = merged.price_aud ?? row.price_aud;

            const { error: updateErr } = await supabase
              .from('printers')
              .update(updates)
              .eq('id', existingId);

            if (updateErr) {
              errorDetails.push({
                itemId: row.id,
                displayName: row.display_name || 'Unknown',
                severity: 'warning',
                message: updateErr.message,
                explanation: 'Failed to update prices for this printer.',
                resolution: 'Retry the price update.',
                resolutionType: 'auto-retry-update',
                existingFilamentId: existingId, // Reuses filament field to hold printer ID for retry
                syncItemId: row.id,
              });
            } else {
              updatedPrices++;
            }
          }
        }
      }

      // Calculate avg quality
      const qualityScores = selectedItems.map((row) => {
        const ext = (row.extracted_data || {}) as Record<string, any>;
        return computePrinterQualityScore({ ...ext, image_url: row.image_url });
      });
      const avgQualityScore = qualityScores.length > 0
        ? Math.round(qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length)
        : 0;

      const result: ImportResult = {
        imported,
        updatedPrices,
        errors: errorDetails.length,
        errorDetails,
        priceHistoryCount: 0,
        avgQualityScore,
        urlsBroken: [],
      };

      setImportResult(result);
      setImporting(false);
      setPhase('complete');
    } catch (err: any) {
      console.error('[usePrinterCatalogSync] Import error:', err.message);
      setError(err.message || 'Import failed');
      setImporting(false);
    }
  }, [jobId, items]);

  // ── Update Item (in-memory override from preview dialog) ──
  const updateItem = useCallback((itemId: string, overrides: Record<string, unknown>) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, admin_override_data: overrides };
    }));
  }, []);

  // ── Skip Item (in-memory status change) ──
  const skipItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // ── Retry Failed Item ──
  const retryFailedItem = useCallback(async (_error: ImportError): Promise<boolean> => {
    // Simplified retry — just return false for now
    return false;
  }, []);

  // ── Reset ──
  const reset = useCallback(() => {
    setPhase('select');
    setJobId(null);
    setScanJob(null);
    setItems([]);
    setImportResult(null);
    setError(null);
    setImporting(false);
    setScanStatusMessage('');
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
    updateItem,
    skipItem,
    retryFailedItem,
    reset,
  };
}
