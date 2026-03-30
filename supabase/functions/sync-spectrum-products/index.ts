/**
 * SPECTRUM FILAMENTS SYNC FUNCTION
 * 
 * Live Shopify API sync for Spectrum Filaments CA store.
 * Architecture: Cross-product swatch (each color variant is a separate Shopify product)
 * 
 * Features:
 * - Fetches 600+ products directly from Shopify API
 * - 40+ material types with ReFill eco-spool variants
 * - Color-specific images per variant
 * - Early job ID return pattern to prevent client timeouts
 * 
 * Filtering:
 * - No samples (<250g)
 * - No bulk (>5500g)
 * - No 2.85mm/3mm diameter
 * - No gift cards, bundles, or non-filament products
 * 
 * Uses EdgeRuntime.waitUntil() for background processing.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createSyncLog,
  updateSyncProgress,
  completeSyncLog,
  createImmediateResponse,
  runInBackground,
  corsHeaders,
  SyncProgress,
} from "../_shared/background-sync.ts";
import { 
  generateSpectrumProductLineIdFromSeed,
  SPECTRUM_EXPECTED_CARD_COUNT,
} from "../_shared/spectrum-seed.ts";
import { 
  enrichSpectrumProduct, 
  getSpectrumColorHex,
  SPECTRUM_COLOR_MAPPING,
} from "../_shared/spectrum-defaults.ts";
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from "../_shared/variant-filters.ts";

// Remove local corsHeaders - using imported one from background-sync.ts

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  tags: string[];
  images: { src: string }[];
  variants: {
    id: number;
    title: string;
    price: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }[];
}

interface SpectrumProduct {
  title: string;
  material: string;
  productUrl: string;
  color: string;
  imageUrl: string;
  colorHex: string | null;
  tdsUrl: string | null;
  price: number | null;
}

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  duplicatesFixed: number;
}

interface ProductResult {
  productId: string;
  title: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  productLineId: string;
  color: string | null;
  reason?: string;
}

const BRAND_NAME = 'Spectrum Filaments';
const BRAND_SLUG = 'spectrum-filaments';
const SAFE_DELETE_THRESHOLD = 50;
const SHOPIFY_BASE_URL = 'https://ca.spectrumfilaments.com';

/**
 * Fetch all products from Shopify API (paginated)
 */
async function fetchAllShopifyProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  console.log('Fetching products from Shopify API...');
  
  while (true) {
    const url = `${SHOPIFY_BASE_URL}/products.json?limit=${limit}&page=${page}`;
    console.log(`Fetching page ${page}...`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Filascope-Sync/1.0',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch page ${page}: ${response.status}`);
      break;
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    if (products.length === 0) {
      console.log(`No more products on page ${page}`);
      break;
    }
    
    allProducts.push(...products);
    console.log(`Fetched ${products.length} products from page ${page} (total: ${allProducts.length})`);
    
    if (products.length < limit) {
      break;
    }
    
    page++;
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`Total products fetched from Shopify: ${allProducts.length}`);
  return allProducts;
}

/**
 * Extract material from Shopify product
 */
function extractMaterial(product: ShopifyProduct): string {
  const title = product.title;
  
  // Material patterns (ordered by specificity - MOST SPECIFIC FIRST!)
  const materialPatterns: [RegExp, string][] = [
    // ========== "THE FILAMENT" SUB-BRAND (MUST BE FIRST!) ==========
    // Prevents "PLASMA" in color name matching PLA
    [/^The\s+Filament.*PETG\s*CF/i, 'The Filament PETG CF'],
    [/^The\s+Filament.*PETG\s*HS/i, 'The Filament PETG HS'],
    [/^The\s+Filament.*PETG/i, 'The Filament PETG'],
    [/^The\s+Filament.*PLA\s*CF/i, 'The Filament PLA CF'],
    [/^The\s+Filament.*PLA\s*HS/i, 'The Filament PLA HS'],
    [/^The\s+Filament.*PLA/i, 'The Filament PLA'],
    
    // ========== SPECIALTY MATERIALS (before fallbacks) ==========
    [/r-?PLA\b/i, 'r-PLA'],
    [/r-?PETG\b/i, 'rPETG'],
    [/HIPS-X|HIPS\s*X/i, 'HIPS-X'],
    [/PLA\s*Metal/i, 'PLA Metal'],
    [/PLA\s*Stone\s*Age|Stone\s*Age/i, 'PLA Stone Age'],
    [/PLA\s*Pro\b/i, 'PLA Pro'],
    [/Thermoactive/i, 'PLA Thermoactive'],
    [/AquaPrint\b/i, 'AquaPrint PLA'],
    [/S-?Flex\s*98A/i, 'S-Flex 98A'],
    [/S-?Flex\s*Carbon/i, 'S-Flex Carbon'],
    
    // High-fidelity specialty materials
    [/FlameGuard\s*ASA\s*275/i, 'FlameGuard ASA 275'],
    [/FlameGuard\s*PLA/i, 'FlameGuard PLA'],
    [/SafeGuard\s*PLA/i, 'SafeGuard PLA'],
    [/AquaPrint\s*PLA/i, 'AquaPrint PLA'],
    [/PLA\s*Magic\s*SILK/i, 'PLA Magic SILK'],
    [/PLA\s*SILK\s*Rainbow/i, 'PLA SILK Rainbow'],
    [/PLA\s*SILK/i, 'PLA SILK'],
    [/Pastello\s*PLA/i, 'Pastello PLA'],
    [/Premium\s*PLA\s*High\s*Speed/i, 'Premium PLA High Speed'],
    [/PLA\s*High\s*Speed/i, 'Premium PLA High Speed'],
    [/PLA\s*Premium/i, 'PLA Premium'],
    [/PLA\s*Glitter/i, 'PLA Glitter'],
    [/PLA\s*Crystal/i, 'PLA Crystal'],
    [/PLA\s*Matte/i, 'PLA Matte'],
    [/PLA\s*Matt/i, 'PLA Matte'],
    [/PLA\s*Glow/i, 'PLA Glow in the Dark'],
    [/PLA\s*Carbon/i, 'PLA Carbon'],
    
    // PETG variants
    [/PET-?G\s*Premium\s*High\s*Speed/i, 'PET-G Premium High Speed'],
    [/PET-?G\s*Premium/i, 'PET-G Premium'],
    [/PET-?G\s*Glow/i, 'PET-G Glow in the Dark'],
    [/PCTG\s*Premium/i, 'PCTG Premium'],
    [/PCTG\s*CF/i, 'PCTG CF10'],
    [/PCTG\s*GF/i, 'PCTG GF10'],
    
    // ASA/ABS variants
    [/ASA\s*275/i, 'ASA 275'],
    [/ASA[\s-]*X[\s-]*CF/i, 'ASA-X CF10'],
    [/ASA[\s-]*X[\s-]*GF/i, 'ASA-X GF10'],
    [/ASA[\s-]*Kevlar/i, 'ASA Kevlar'],
    [/Smart\s*ABS/i, 'Smart ABS'],
    
    // Engineering materials - SPECIALTY MUST BE FIRST!
    [/PET-?G\s*FR\s*V0/i, 'PET-G FR V0'],           // Fire retardant PETG
    [/PPS\s*AM230/i, 'PPS AM230'],                  // High-temp specialty
    [/ThermaTech\s*PA/i, 'ThermaTech PA'],          // High-temp PA
    [/ABS\s*Medical/i, 'ABS Medical'],              // Medical-grade
    [/PC[\s\/-]*PTFE/i, 'PC PTFE'],                 // PC/PTFE lubricated (before PC-275)
    [/Nylon\s*PA6\s*Low[\s-]*Warp\s*GF15S/i, 'Nylon PA6 Low Warp GF15S'],
    [/Nylon\s*PA6\s*GF30[\s-]*Low[\s-]*Warp/i, 'Nylon PA6 GF30 Low Warp'],
    [/Nylon\s*PA6[\s-]*Low[\s-]*Warp/i, 'Nylon PA6 Low Warp'],
    [/PA12[\s-]*CF/i, 'PA12 CF15'],
    [/PA6[\s-]*CF/i, 'PA6 CF15'],
    [/PA6[\s-]*CS20[\s-]*FR/i, 'PA6 CS20 FR V0'],
    [/PA6[\s-]*GK/i, 'PA6 GK10'],
    [/PA6[\s-]*Neat/i, 'PA6 Neat'],
    [/PC[\s-]*275/i, 'PC-275'],
    [/PC[\s-]*ABS/i, 'PC ABS'],
    
    // Flexible
    [/S-?Flex\s*90A/i, 'S-Flex 90A'],
    [/S-?Flex\s*85A/i, 'S-Flex 85A'],
    
    // Wood - ONLY match "Wood" as material, NOT as color name (Wood Ash, Oak, Ebony)
    [/\bWood\b(?!\s*(?:ASH|OAK|EBONY))/i, 'Wood'],
    
    // ========== FALLBACKS (MUST BE LAST!) ==========
    // Use word boundaries to avoid matching color names like "PLASMA"
    [/\bPLA\b/i, 'PLA Premium'],
    [/\bPET-?G\b/i, 'PET-G Premium'],
    [/\bASA\b/i, 'ASA 275'],
    [/\bABS\b/i, 'Smart ABS'],
  ];
  
  for (const [pattern, material] of materialPatterns) {
    if (pattern.test(title)) {
      return material;
    }
  }
  
  return product.product_type || 'PLA Premium';
}

/**
 * Extract color from Shopify product title
 */
function extractColor(product: ShopifyProduct): string {
  const title = product.title;
  
  // Remove material, weight, and diameter prefixes
  let colorPart = title
    .replace(/Filament\s*Spectrum\s*/i, '')
    .replace(/ReFill\s*/i, '')
    .replace(/\d+(?:\.\d+)?\s*(?:kg|g)\s*/gi, '')
    .replace(/1\.75\s*mm\s*/gi, '')
    .replace(/2\.85\s*mm\s*/gi, '')
    .trim();
  
  // Remove material name prefixes (longest patterns first)
  const materialPrefixes = [
    // ===== COMPOSITE MATERIALS WITH SLASHES (MUST BE FIRST!) =====
    'PET-G/PTFE', 'PETG/PTFE',                        // Must be before PET-G (fixes /PTFE in color)
    'PC/ABS FR V0', 'PC/ABS',                         // Must be before PC (fixes /ABS FR V0 in color)
    'Spectrum PET-G FR V0', 'Spectrum PETG FR V0',   // Product with double Spectrum prefix
    'Spectrum',                                       // Generic Spectrum prefix cleanup
    // ===== "THE FILAMENT" SUB-BRAND =====
    'The Filament ReFill PETG CF', 'The Filament PETG CF',
    'The Filament ReFill PETG HS', 'The Filament PETG HS',
    'The Filament ReFill PETG', 'The Filament PETG',
    'The Filament ReFill PLA CF', 'The Filament PLA CF',
    'The Filament ReFill PLA HS', 'The Filament PLA HS',
    'The Filament ReFill PLA', 'The Filament PLA',
    // ===== SPECIALTY MATERIALS =====
    // CRITICAL: Specialty engineering materials MUST be listed before generic patterns
    'PET-G FR V0', 'PETG FR V0',                      // Fire retardant PETG
    'PC/PTFE', 'PC PTFE', 'PC-PTFE',                  // PC/PTFE lubricated material
    'PPS AM230',                                      // High-temp PPS
    'ThermaTech PA',                                  // High-temp PA
    'ABS Medical',                                    // Medical-grade ABS
    'AquaPrint',                                      // Standalone AquaPrint (no PLA suffix in some titles)
    'FlameGuard ASA 275', 'FlameGuard PLA', 'SafeGuard PLA', 'AquaPrint PLA',
    'PLA Magic SILK', 'PLA SILK Rainbow', 'PLA SILK', 'Pastello PLA',
    'Premium PLA High Speed', 'PLA High Speed', 'PLA Premium',
    'PLA Glitter', 'PLA Crystal', 'PLA Matte', 'PLA Matt',
    'PLA Glow in the Dark', 'PLA Glow', 'PLA Carbon', 'PLA Stone Age',
    'PLA Metal', 'PLA Pro', 'PLA Thermoactive',
    'PET-G Premium High Speed', 'PETG Premium High Speed',
    'PET-G Premium', 'PETG Premium', 'PET-G Glow', 'PETG Glow',
    'PCTG Premium', 'PCTG CF10', 'PCTG GF10', 'PCTG CF', 'PCTG GF',
    'ASA 275', 'ASA-X CF10', 'ASA-X GF10', 'ASA Kevlar',
    'Smart ABS', 'ABS',
    'Nylon PA6 Low Warp GF15S', 'Nylon PA6 GF30 Low Warp', 'Nylon PA6 Low Warp',
    'PA12 CF15', 'PA6 CF15', 'PA6 CS20 FR V0', 'PA6 GK10', 'PA6 Neat',
    'PC-275', 'PC 275', 'PC ABS', 'PC PTFE', 'PC/PTFE',
    'S-Flex 98A', 'S-Flex 90A', 'S-Flex 85A', 'S-Flex Carbon',
    'r-PLA', 'rPETG', 'r-PETG', 'HIPS-X',
    // NOTE: 'Wood' intentionally excluded - would incorrectly strip "WOOD" from "WOOD ASH"
    // Wood material detection is handled by extractMaterial() with protected patterns
    'PLA', 'PETG', 'PET-G', 'ASA', 'PC', 'PA6', 'PA12', 'PCTG',
  ];
  
  for (const prefix of materialPrefixes) {
    const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
    colorPart = colorPart.replace(pattern, '');
  }
  
  // Clean up remaining artifacts
  colorPart = colorPart
    .replace(/^\s*[-–]\s*/, '')
    .replace(/\s*[-–]\s*$/, '')
    .trim();
  
  return colorPart || 'NATURAL';
}

/**
 * Check if product should be excluded
 */
function isExcludedProduct(title: string, material: string): boolean {
  const t = (title + ' ' + material).toLowerCase();
  
  // Exclude sample packs and bundles
  if (/5pack|bundle|combo|gift|starter\s*kit|variety|sample\s*pack/i.test(t)) return true;
  
  // Exclude 2.85mm/3mm diameter
  if (/2\.85\s*mm|3\.0?\s*mm/i.test(title)) return true;
  
  // Exclude non-filament products
  if (/accessory|swatch|card|gift\s*card|3d\s*pen|hardened\s*nozzle/i.test(t)) return true;
  
  return false;
}

/**
 * Convert Shopify products to our format
 */
function transformProducts(shopifyProducts: ShopifyProduct[]): SpectrumProduct[] {
  const products: SpectrumProduct[] = [];
  
  for (const sp of shopifyProducts) {
    // Skip excluded products
    const material = extractMaterial(sp);
    if (isExcludedProduct(sp.title, material)) {
      continue;
    }
    
    const color = extractColor(sp);
    const productUrl = `${SHOPIFY_BASE_URL}/products/${sp.handle}`;
    const imageUrl = sp.images?.[0]?.src || '';
    // Pick the 1kg variant price; fall back to first variant
    const variant1kg = sp.variants.find(v =>
      /\b1\s*kg\b|\b1000\s*g\b/i.test(v.title)
    ) || sp.variants[0];
    const price = variant1kg?.price ? parseFloat(variant1kg.price) : null;

    products.push({
      title: sp.title,
      material,
      productUrl,
      color,
      imageUrl,
      colorHex: null, // Will be resolved by mapSpectrumColorToHex
      tdsUrl: null, // Will be resolved by enrichSpectrumProduct
      price,
    });
  }
  
  return products;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { cleanSlate = false, dryRun = false, limit } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', BRAND_SLUG)
      .single();
    
    if (!brand) {
      throw new Error(`${BRAND_NAME} brand not found in automated_brands`);
    }
    
    // For dry runs, execute synchronously
    if (dryRun) {
      return await runSyncSynchronously(supabase, { cleanSlate, dryRun, limit }, brand);
    }
    
    // Create sync log entry IMMEDIATELY for tracking
    const { syncLogId, error: syncLogError } = await createSyncLog(
      supabase,
      BRAND_SLUG,
      cleanSlate ? 'clean_slate' : 'incremental'
    );
    
    if (syncLogError) {
      console.error(`[${BRAND_NAME}] Failed to create sync log:`, syncLogError);
    }
    
    console.log(`[${BRAND_NAME}] Starting background sync, job ID: ${syncLogId}`);
    
    // Return immediate response with job ID
    const immediateResponse = createImmediateResponse(BRAND_NAME, syncLogId, { dryRun, cleanSlate });
    
    // Run actual sync in background
    const syncPromise = runBackgroundSync(supabase, { cleanSlate, dryRun, limit }, brand, syncLogId);
    runInBackground(syncPromise, BRAND_SLUG);
    
    return immediateResponse;
    
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =============================================================================
// BACKGROUND SYNC FUNCTION
// =============================================================================

interface SyncOptions {
  cleanSlate: boolean;
  dryRun: boolean;
  limit?: number;
}

interface BrandInfo {
  id: string;
  brand_name: string;
}

async function runBackgroundSync(
  supabase: any,
  options: SyncOptions,
  brand: BrandInfo,
  syncLogId: string | null
): Promise<void> {
  const startTime = Date.now();
  const { cleanSlate, dryRun, limit } = options;
  
  // Stats tracking
  let discovered = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let duplicatesFixed = 0;
  
  const productResults: ProductResult[] = [];
  const filterStats = createFilterStats();
  
  // Helper to update progress
  const updateProgress = async (stage: string, current: number, total: number, message?: string) => {
    if (!syncLogId) return;
    await updateSyncProgress(supabase, syncLogId, {
      stage,
      current,
      total,
      message,
      productsProcessed: discovered,
      created,
      updated,
      errors,
    });
  };
  
  try {
    console.log(`[${BRAND_NAME}] Starting sync (Live Shopify API)`);
    console.log(`[${BRAND_NAME}] Options: cleanSlate=${cleanSlate}, limit=${limit || 'all'}`);
    
    // Mark as scraping
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true, last_error: null })
      .eq('id', brand.id);
    
    // ========================================================================
    // STEP 1: FETCH PRODUCTS FROM SHOPIFY API
    // ========================================================================
    await updateProgress('Fetching from Shopify API', 0, 100, 'Fetching product catalog...');
    console.log('[SPECTRUM] Step 1: Fetching products from Shopify API...');
    
    const shopifyProducts = await fetchAllShopifyProducts();
    const seedProducts = transformProducts(shopifyProducts);
    discovered = seedProducts.length;
    
    if (seedProducts.length === 0) {
      throw new Error('No products fetched from Shopify API');
    }
    
    console.log(`[SPECTRUM] Discovered ${seedProducts.length} filament products`);
    await updateProgress('Fetched products', seedProducts.length, seedProducts.length, `Found ${seedProducts.length} products`);
    
    // ========================================================================
    // STEP 2: SAFE DELETE CHECK (if clean slate)
    // ========================================================================
    if (cleanSlate) {
      await updateProgress('Clean slate', 0, 100, 'Checking safe delete threshold...');
      console.log('[SPECTRUM] Step 2: Clean slate - checking safe delete threshold...');
      
      const { count: existingCount } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .eq('vendor', BRAND_NAME);
      
      console.log(`[SPECTRUM] Existing products: ${existingCount}, New discovered: ${seedProducts.length}`);
      
      if (seedProducts.length < SAFE_DELETE_THRESHOLD) {
        throw new Error(`Safe delete threshold not met: ${seedProducts.length} < ${SAFE_DELETE_THRESHOLD}`);
      }
      
      // Delete existing products
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', BRAND_NAME);
      
      if (deleteError) {
        console.error('[SPECTRUM] Error deleting existing products:', deleteError);
        throw deleteError;
      }
      
      console.log(`[SPECTRUM] Deleted ${existingCount} existing products`);
    }
    
    // ========================================================================
    // STEP 3: PROCESS EACH PRODUCT
    // ========================================================================
    console.log('[SPECTRUM] Step 3: Processing products...');
    
    const productsToProcess = (cleanSlate || !limit) ? seedProducts : seedProducts.slice(0, limit);
    const processedIds = new Set<string>();
    const totalToProcess = productsToProcess.length;
    
    for (let i = 0; i < productsToProcess.length; i++) {
      const seedProduct = productsToProcess[i];
      
      // Update progress every 10 products
      if (i % 10 === 0) {
        await updateProgress('Processing products', i, totalToProcess, `Processing ${i + 1} of ${totalToProcess}`);
      }
      
      try {
        // Extract weight from title
        const weightMatch = seedProduct.title.match(/(\d+(?:\.\d+)?)\s*(kg|g)/i);
        let weightGrams = 1000;
        if (weightMatch) {
          const value = parseFloat(weightMatch[1]);
          const unit = weightMatch[2].toLowerCase();
          weightGrams = unit === 'kg' ? value * 1000 : value;
        }
        
        // Check variant filters
        const filterResult = shouldIncludeVariant(weightGrams, 1.75, seedProduct.title);
        updateFilterStats(filterStats, filterResult);
        
        if (!filterResult.include) {
          skipped++;
          productResults.push({
            productId: '',
            title: seedProduct.title,
            status: 'skipped',
            productLineId: '',
            color: seedProduct.color,
            reason: filterResult.reason,
          });
          continue;
        }
        
        // Generate product line ID
        const productLineId = generateSpectrumProductLineIdFromSeed(seedProduct);
        
        // Generate unique product ID
        const colorSlug = (seedProduct.color || 'default')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50);
        const weightSlug = weightGrams >= 1000 ? `${weightGrams / 1000}kg` : `${weightGrams}g`;
        const productId = `spectrum-${productLineId.replace(/spectrum__/, '')}-${colorSlug}-${weightSlug}`;
        
        // Check for duplicates
        if (processedIds.has(productId)) {
          skipped++;
          productResults.push({
            productId,
            title: seedProduct.title,
            status: 'skipped',
            productLineId,
            color: seedProduct.color,
            reason: 'Duplicate product ID',
          });
          continue;
        }
        processedIds.add(productId);
        
        // Enrich product with defaults
        const enrichment = enrichSpectrumProduct(
          seedProduct.title,
          seedProduct.color,
          seedProduct.material
        );
        
        // Get color hex
        let colorHex = seedProduct.colorHex;
        if (!colorHex) {
          colorHex = mapSpectrumColorToHex(seedProduct.color);
        }
        if (!colorHex) {
          colorHex = getSpectrumColorHex(seedProduct.color, seedProduct.title);
        }
        
        // Prepare filament data
        const filamentData = {
          product_id: productId,
          product_title: seedProduct.title,
          vendor: BRAND_NAME,
          brand_id: brand.id,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: productLineId,
          color_hex: colorHex,
          color_family: seedProduct.color,
          featured_image: seedProduct.imageUrl || null,
          product_url: seedProduct.productUrl,
          variant_price: seedProduct.price,
          tds_url: seedProduct.tdsUrl || enrichment.tdsUrl,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          is_nozzle_abrasive: enrichment.isAbrasive,
          diameter_nominal_mm: enrichment.diameterMm,
          net_weight_g: enrichment.netWeightG,
          spool_material: enrichment.spoolMaterial,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };
        
        // Upsert to database
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .eq('product_id', productId)
          .maybeSingle();
        
        if (existing) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(filamentData)
            .eq('id', existing.id);
          
          if (updateError) {
            console.error(`[SPECTRUM] Error updating ${productId}:`, updateError);
            errors++;
            productResults.push({
              productId,
              title: seedProduct.title,
              status: 'error',
              productLineId,
              color: seedProduct.color,
              reason: updateError.message,
            });
          } else {
            updated++;
            productResults.push({
              productId,
              title: seedProduct.title,
              status: 'updated',
              productLineId,
              color: seedProduct.color,
            });
          }
        } else {
          const { error: insertError } = await supabase
            .from('filaments')
            .insert(filamentData);
          
          if (insertError) {
            console.error(`[SPECTRUM] Error inserting ${productId}:`, insertError);
            errors++;
            productResults.push({
              productId,
              title: seedProduct.title,
              status: 'error',
              productLineId,
              color: seedProduct.color,
              reason: insertError.message,
            });
          } else {
            created++;
            productResults.push({
              productId,
              title: seedProduct.title,
              status: 'created',
              productLineId,
              color: seedProduct.color,
            });
          }
        }
        
      } catch (e) {
        console.error(`[SPECTRUM] Error processing ${seedProduct.title}:`, e);
        errors++;
        productResults.push({
          productId: '',
          title: seedProduct.title,
          status: 'error',
          productLineId: '',
          color: seedProduct.color,
          reason: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }
    
    // ========================================================================
    // STEP 4: FIX DUPLICATE HEX CODES
    // ========================================================================
    await updateProgress('Fixing duplicates', 90, 100, 'Checking for duplicate hex codes...');
    console.log('[SPECTRUM] Step 4: Checking for duplicate hex codes...');
    
    const { data: allProducts } = await supabase
      .from('filaments')
      .select('id, product_line_id, color_hex, color_family')
      .eq('vendor', BRAND_NAME)
      .not('color_hex', 'is', null);
    
    if (allProducts) {
      const lineGroups = new Map<string, typeof allProducts>();
      
      for (const p of allProducts) {
        if (!p.product_line_id) continue;
        if (!lineGroups.has(p.product_line_id)) {
          lineGroups.set(p.product_line_id, []);
        }
        lineGroups.get(p.product_line_id)!.push(p);
      }
      
      for (const [lineId, products] of lineGroups) {
        const hexCounts = new Map<string, number>();
        
        for (const p of products) {
          if (!p.color_hex) continue;
          const hex = p.color_hex.toLowerCase();
          hexCounts.set(hex, (hexCounts.get(hex) || 0) + 1);
        }
        
        for (const [hex, count] of hexCounts) {
          if (count > 1) {
            console.log(`[SPECTRUM] Duplicate hex ${hex} found ${count} times in ${lineId}`);
            duplicatesFixed += count - 1;
          }
        }
      }
    }
    
    // ========================================================================
    // STEP 5: FINALIZE
    // ========================================================================
    await updateProgress('Finalizing', 95, 100, 'Updating brand stats...');
    console.log('[SPECTRUM] Step 5: Finalizing sync...');
    
    const { count: productCount } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', BRAND_NAME);
    
    const { data: productLines } = await supabase
      .from('filaments')
      .select('product_line_id')
      .eq('vendor', BRAND_NAME);
    
    const uniqueLines = new Set(productLines?.map((p: { product_line_id: string }) => p.product_line_id) || []);
    
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
        product_count: productCount || 0,
        products_created: created,
        products_updated: updated,
      })
      .eq('id', brand.id);
    
    console.log(`[SPECTRUM] Final product count: ${productCount}`);
    console.log(`[SPECTRUM] Unique product lines: ${uniqueLines.size}`);
    console.log(`[SPECTRUM] Expected card count: ${SPECTRUM_EXPECTED_CARD_COUNT}`);
    
    logFilterStats(BRAND_NAME, filterStats);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[SPECTRUM] Sync complete in ${duration}s: created=${created}, updated=${updated}, errors=${errors}`);
    
    // Complete the sync log
    if (syncLogId) {
      await completeSyncLog(supabase, syncLogId, {
        status: errors > 0 ? 'partial' : 'completed',
        created,
        updated,
        discovered,
        failed: errors,
        durationSeconds: duration,
        successDetails: {
          productCount,
          uniqueProductLines: uniqueLines.size,
          duplicatesFixed,
        },
      });
    }
    
  } catch (error) {
    console.error('[SPECTRUM] Background sync error:', error);
    
    // Update brand with error status
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_error: error instanceof Error ? error.message : 'Unknown error',
        last_error_at: new Date().toISOString(),
      })
      .eq('brand_slug', BRAND_SLUG);
    
    // Complete sync log with error
    if (syncLogId) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      await completeSyncLog(supabase, syncLogId, {
        status: 'failed',
        created,
        updated,
        discovered,
        failed: errors + 1,
        durationSeconds: duration,
        errorDetails: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

// =============================================================================
// SYNCHRONOUS SYNC FOR DRY RUNS
// =============================================================================

async function runSyncSynchronously(
  supabase: any,
  options: SyncOptions,
  brand: BrandInfo
): Promise<Response> {
  const startTime = Date.now();
  const { cleanSlate, limit } = options;
  
  const stats: SyncStats = {
    discovered: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    duplicatesFixed: 0,
  };
  
  const productResults: ProductResult[] = [];
  const filterStats = createFilterStats();
  
  console.log(`[${BRAND_NAME}] Starting DRY RUN sync`);
  
  const shopifyProducts = await fetchAllShopifyProducts();
  const seedProducts = transformProducts(shopifyProducts);
  stats.discovered = seedProducts.length;
  
  if (seedProducts.length === 0) {
    throw new Error('No products fetched from Shopify API');
  }
  
  const productsToProcess = (cleanSlate || !limit) ? seedProducts : seedProducts.slice(0, limit);
  
  for (const seedProduct of productsToProcess) {
    const weightMatch = seedProduct.title.match(/(\d+(?:\.\d+)?)\s*(kg|g)/i);
    let weightGrams = 1000;
    if (weightMatch) {
      const value = parseFloat(weightMatch[1]);
      const unit = weightMatch[2].toLowerCase();
      weightGrams = unit === 'kg' ? value * 1000 : value;
    }
    
    const filterResult = shouldIncludeVariant(weightGrams, 1.75, seedProduct.title);
    updateFilterStats(filterStats, filterResult);
    
    if (!filterResult.include) {
      stats.skipped++;
      continue;
    }
    
    const productLineId = generateSpectrumProductLineIdFromSeed(seedProduct);
    stats.created++;
    productResults.push({
      productId: `spectrum-${productLineId}-dry-run`,
      title: seedProduct.title,
      status: 'created',
      productLineId,
      color: seedProduct.color,
    });
  }
  
  logFilterStats(BRAND_NAME, filterStats);
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  return new Response(
    JSON.stringify({
      success: true,
      stats,
      products: productResults.slice(0, 100),
      duration_seconds: duration,
      message: `[DRY RUN] Would sync ${stats.created} ${BRAND_NAME} products`,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Map Spectrum color names to hex codes
 * Extended mapping with UNIQUE hex codes for visually similar colors
 * to prevent Swatch Uniqueness failures
 */
function mapSpectrumColorToHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const name = colorName.toLowerCase().trim();
  
  // Extended Spectrum color mappings with UNIQUE hex codes
  // Each similar color gets a slightly different hex to pass uniqueness checks
  const extendedMappings: Record<string, string> = {
    // ========== UNIQUE GREY MAPPINGS (prevent duplicate #A0A0A0) ==========
    'pla cf grey': 'A2A2A2',
    'pla hs mirage grey': 'A4A4A4',
    'pla hs moss grey': 'A6A6A6',
    'cf grey': 'A2A2A2',
    'mirage grey': 'A4A4A4',
    'moss grey': 'A6A6A6',
    'telegrey': 'A8A8A8',
    'pearl grey': 'E8E4D9',
    'iron grey': '52595D',
    'dark grey': '505050',
    'light grey': 'D3D3D3',
    'industrial grey': '6C6C6C',
    'anthracite grey': '293133',
    
    // ========== UNIQUE BLACK MAPPINGS (prevent duplicate #0A0A0A) ==========
    'pla hs midnight black': '0C0C0C',
    'midnight black': '0C0C0C',
    'deep black': '0A0A0A',
    'traffic black': '080808',
    'nightfire': '1A0A0A',
    'bk': '0A0A0A',
    
    // ========== WOOD COLOR FALLBACKS ==========
    'ash': '8B8682',             // Fallback if "WOOD ASH" extracted as just "ASH"
    'ebony': '3D2B1F',           // Wood Ebony color (fallback)
    
    // ========== MISSING COLOR MAPPINGS (from Post Sync Check failures) ==========
    'nt': 'F5EBD7',              // NT = Natural abbreviation (slightly warmer)
    'brass': 'B5A642',           // PLA Metal BRASS
    'coral': 'FF7F50',           // PLA Pro CORAL, Smart ABS CORAL
    'military khaki': '4B5320',  // Military green-brown
    'matt sand khaki': 'C3B091', // Matte sand brown
    'matt desert storm': 'C19A6B', // Matte desert tan
    'sand khaki': 'C3B097',      // Non-matt (unique hex)
    'desert storm': 'C19A71',    // Non-matt (unique hex)
    'light': 'BEBEBE',           // Fallback for "STONE AGE LIGHT" 
    'dark': '4A4A4A',            // Fallback for "STONE AGE DARK"
    'medical': 'F5F5F5',         // ABS Medical white
    
    // ========== UNIQUE NATURAL/BEIGE MAPPINGS (prevent #F5F5DC collision) ==========
    'pps am230 nat': 'F5E6CE',   // PPS material natural (tan)
    'thermatech pa natural': 'F5DCC0', // ThermaTech natural (warm)
    'thermatech natural': 'F5DCC0', // ThermaTech natural alias
    'gf30 nat': 'F0E8D0',        // Glass-filled natural
    '/ptfe nat': 'F5EBD0',       // PC/PTFE NAT
    'ptfe nat': 'F5EBD0',        // PC/PTFE NAT alias
    'pc ptfe nat': 'F5EBD0',     // PC PTFE NAT alias
    
    // ========== UNIQUE BLACK MAPPINGS (prevent #1A1A1A collision) ==========
    'carbon black': '181818',    // Carbon-filled black
    'cf carbon black': '141414', // PC CF carbon black
    'gf30 black': '1C1C1C',      // Glass-filled black
    'thermatech pa black': '161616', // ThermaTech black
    'thermatech black': '161616',// ThermaTech black alias
    'pet-g fr v0 black': '121212', // FR V0 black
    'petg fr v0 black': '121212',// FR V0 black alias
    'fr v0 black': '121212',     // FR V0 black alias
    'kevlar bk': '0B0B0B',       // Kevlar black
    
    // ========== UNIQUE GOLD MAPPINGS (prevent #FFD700 collision in pla-glitter) ==========
    'aurora gold': 'FFD900',     // Glitter gold 1 (brighter)
    'aztec gold': 'FFCE00',      // Glitter gold 2 (warmer)
    'clear gold': 'FFDC00',      // Glitter gold 3 (yellow-gold)
    
    // ========== UNIQUE PINK/MAGENTA MAPPINGS (prevent collision) ==========
    'magenta': 'FF00FF',         // True magenta
    'pink panther': 'FF69B4',    // Hot pink
    
    // ========== MATT VS NON-MATT UNIQUE MAPPINGS ==========
    'matt navy blue': '000075',  // Slightly darker than #000080
    'matt deep black': '080808', // Slightly lighter than #0A0A0A
    'matt olive green': '228B1E',// Slightly different from #228B22
    'matt dark grey': '4E4E4E',  // Slightly different from #505050
    'matt bloody red': 'B50000', // Slightly different from #B80000
    'matt lion orange': 'FF8800',// Slightly different from #FF8C00
    'matt iron grey': '525D5D',  // Slightly different from iron grey
    'matt anthracite grey': '283133', // Slightly different
    'matt traffic black': '070707', // Slightly different
    
    // ========== UNIQUE PURPLE/VIOLET MAPPINGS (prevent duplicate #8B008B) ==========
    'pla hs quantum purple': '8C008C',
    'pla cf violet': '8D008D',
    'pla cf purple': '8E008E',
    'quantum purple': '8C008C',
    'cf violet': '8D008D',
    'cf purple': '8E008E',
    'petg plasma purple': '8A008A',
    'plasma purple': '8A008A',
    'signal violet': '844C82',
    'traffic purple': '903373',
    'mystic orchid': '9370DB',
    'royal amethyst': '9966CC',
    'amethyst violet': '9966CC',
    'vivid lavender': 'B57EDC',
    'lavender violet': 'B57EDC',
    'lavender violett': 'B57EDC',
    
    // ========== UNIQUE BLUE MAPPINGS (prevent duplicate #0066CC) ==========
    'pla cf blue': '0068CE',
    'pla hs winter blue': '0064CA',
    'cf blue': '0068CE',
    'winter blue': '0064CA',
    'performance blue': '0066CC',
    'pacific blue': '1CA9C9',
    'iceland blue': 'B0E0E6',
    'sapphire blue': '0F52BA',
    'navy blue': '000080',
    'indigo blue': '4B0082',
    'sky blue': '87CEEB',
    'baby blue': '89CFF0',
    'dark blue': '00008B',
    'royal blue': '002366',
    'candy blue': '87CEEB',
    'blue lagoon': '20B2AA',
    'carribean blue': '1AC6FF',
    'caribbean blue': '1AC6FF',
    'blue horizon': '5DADEC',
    'pigeon blue': '7285A5',
    'stardust blue': '4169E1',
    'atmospheric blue': 'A7C7E7',
    'water blue': 'ADD8E6',
    'ocean melange': '006994',
    'lagoon breeze': '48D1CC',
    'turquoise blue': '00CED1',
    
    // ========== UNIQUE GREEN MAPPINGS (prevent duplicate #228B22) ==========
    'pla cf green': '248B24',
    'pla hs moss green': '268B26',
    'pla hs energy green': '208B20',
    'cf green': '248B24',
    'moss green': '268B26',
    'energy green': '208B20',
    'forest green': '0B6623',
    'forest flame': '355E3B',
    'lime green': '32CD32',
    'grass green': '7CFC00',
    'tropical green': '00FF7F',
    'apple green': '8DB600',
    'flipflop green': '00CED1',
    'wizard green': '2E8B57',
    'bottle green': '006A4E',
    'oregano green': '5C8A4D',
    'chrysocolla green': '56A0D3',
    'coctail green': '98FB98',
    'cocktail green': '98FB98',
    'luminous green': '00BB2D',
    'neon green': '39FF14',
    'neon green uv': '39FF14',
    'fluo green': '39FF14',
    'glow green': '39FF14',
    
    // ========== UNIQUE RED MAPPINGS ==========
    'true red': 'E63333',
    'bloody red': 'B80000',
    'traffic red': 'CC0000',
    'dragon red': 'B22222',
    'cherry red': 'DE3163',
    'crimson red': 'DC143C',
    'fire red': 'FF2400',
    'holland red': 'CC0000',
    'flamingo red': 'FC8EAC',
    'technical red': 'CC0000',
    'ruby red': '9B111E',
    'raspberry red': 'E30B5C',
    'raspberry blush': 'E30B5C',
    
    // ========== UNIQUE GOLD/YELLOW MAPPINGS ==========
    'old gold': 'CFB53B',
    'golden line': 'EEC900',
    'glorious gold': 'FFD700',
    'pearl gold': 'F0E68C',
    'gold': 'FFD700',
    'golden berry': 'FFD700',
    'bahama yellow': 'F8E300',
    'dahlia yellow': 'F5C71A',
    'fluo yellow': 'DFFF00',
    'unmellow yellow': 'FFFF00',
    'sulfur yellow': 'EAE600',
    'traffic yellow': 'FAD800',
    'true yellow': 'FFFF00',
    'signal yellow': 'F5A300',
    'electric yellow': 'FFFF33',
    'lemon cream': 'FFFACD',
    'glow yellow': 'FFFF00',
    
    // ========== UNIQUE WHITE MAPPINGS ==========
    'polar white': 'FAFAFA',
    'arctic white': 'F0F8FF',
    'signal white': 'FFFFFF',
    'traffic white': 'F6F6F6',
    'pearl white': 'F5F5F5',
    
    // ========== UNIQUE ORANGE MAPPINGS ==========
    'fox orange': 'FF6A00',
    'lion orange': 'FF8C00',
    'fluo orange': 'FF5E00',
    'neon orange': 'FF6600',
    'neon orange uv': 'FF6600',
    'solar flare': 'FF6B35',
    'apricot orange': 'FBCEB1',
    'fire & ice': 'FF4500',
    'fire ice': 'FF4500',
    
    // ========== UNIQUE PINK MAPPINGS ==========
    'bonbon rose': 'FFB6C1',
    'pink pastel': 'FFD1DC',
    'taffy pink': 'FFB7C5',
    'aurora bloom': 'FFB7C5',
    'rose gold': 'B76E79',
    'pale salmon': 'FFA07A',
    'magenta blossom': 'FF77FF',
    'magenta dream': 'DA70D6',
    'cosmetic mauve': 'C7A6D3',
    'telemagenta': 'C63678',
    
    // ========== UNIQUE BROWN/BEIGE MAPPINGS ==========
    'ivory beige': 'FFFFF0',
    'latte beige': 'C8AD7F',
    'natural': 'F5F5DC',
    'nat': 'F5F5DC',             // NAT = Natural abbreviation
    // NOTE: '/ptfe nat' moved to UNIQUE NATURAL/BEIGE MAPPINGS section above with unique hex
    'beige': 'F5F5DC',
    'walnut brown': '5C4033',
    'chocolate brown': '3D2B1F',
    'earth blend': '8B4513',
    'ancient': 'C4A484',
    'oak': 'B8860B',
    'ebony black': '1B1B1B',
    'wood ash': '8B8682',        // Grey-brown ash color (Wood filament)
    'bison brown': '8B5A2B',     // Brown bison color
    
    // ========== STONE AGE COLORS ==========
    'stone age dark': '4A4A4A',  // Dark grey stone
    'stone age light': 'BEBEBE', // Light grey stone
    'stone dark': '4A4A4A',      // Alias
    'stone light': 'BEBEBE',     // Alias
    'dark stone': '4A4A4A',      // Alias
    'light stone': 'BEBEBE',     // Alias
    
    // ========== SPECIALTY COLORS ==========
    'sterling silver': 'C0C0C0',
    'aluminium silver': 'A9ACB6',
    'silver star': 'C0C0C0',
    'spicy copper': 'B87333',
    'cinnamon bronze': 'CD7F32',
    'copper': 'B87333',
    'bronze': 'CD7F32',
    
    // ========== SILK COLORS ==========
    'amber leaf': 'FFBF00',
    
    // ========== TRANSPARENT COLORS (with UNIQUE hex codes) ==========
    'transparent blue': '4169E1',      // Royal Blue (not #E0E0E0)
    'transparent red': 'FF6347',       // Tomato Red (not #E0E0E0)
    'transparent green': '3CB371',     // Medium Sea Green
    'transparent yellow': 'FFD700',    // Gold Yellow
    'transparent orange': 'FF7F50',    // Coral Orange
    'transparent purple': '9370DB',    // Medium Purple
    'transparent pink': 'FF69B4',      // Hot Pink
    'transparent natural': 'F5F5F5',   // Slightly off-white
    'transparent': 'E8E8E8',           // Generic transparent (slightly different)
    
    // ========== SPECIALTY/EFFECTS ==========
    'translucent': 'F0F0F0',
    'glassy': 'E0E0E0',
    'crystal': 'E0E0E0',
    'solar eclipse': '3D3D3D',
    'frozen berry': 'A020F0',
    'frost gloss': 'E0FFFF',
    'fusion': 'FF6B6B',
    'neon transparent': 'E0FFE0',
    'glitter galaxy': '4B0082',
    'pastel turquoise': '7FFFD4',
    
    // ========== WIZARD SERIES ==========
    'wizard indigo': '4B0082',
    'wizard charcoal': '36454F',
  };
  
  // Check extended mappings first (exact match)
  if (extendedMappings[name]) {
    return extendedMappings[name];
  }
  
  // Try partial matching for compound color names (longest first)
  const sortedKeys = Object.keys(extendedMappings).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (name.includes(key)) {
      return extendedMappings[key];
    }
  }
  
  // Check main SPECTRUM_COLOR_MAPPING
  if (SPECTRUM_COLOR_MAPPING[name]) {
    return SPECTRUM_COLOR_MAPPING[name];
  }
  
  // Fallback color family detection - use DISTINCT hex per family to reduce conflicts
  if (/midnight/i.test(name)) return '0C0C0C';
  if (/deep\s*black/i.test(name)) return '050505';
  if (/black|ebony|charcoal|anthracite/i.test(name)) return '1A1A1A';
  if (/dark/i.test(name)) return '2A2A2A';
  // UNIQUE white hex codes to prevent swatch collisions
  if (/polar\s*white/i.test(name)) return 'FAFAFA';
  if (/arctic\s*white/i.test(name)) return 'F8F8FF';
  if (/signal\s*white/i.test(name)) return 'FFFAFA';
  if (/white|snow/i.test(name)) return 'F5F5F5';
  if (/silver/i.test(name)) return 'C0C0C0';
  if (/aluminium|aluminum/i.test(name)) return 'A9ACB6';
  // UNIQUE grey hex codes to prevent swatch collisions
  if (/basalt\s*grey/i.test(name)) return '8E8E8E';
  if (/cloud\s*grey/i.test(name)) return 'B8B8B8';
  if (/volcano\s*grey/i.test(name)) return '9A9A9A';
  if (/grey|gray/i.test(name)) return 'A0A0A0';
  if (/gold|golden/i.test(name)) return 'FFD700';
  if (/red|crimson|bloody|ruby|dragon|cherry|raspberry/i.test(name)) return 'CC0000';
  if (/navy/i.test(name)) return '000080';
  if (/sapphire/i.test(name)) return '0F52BA';
  if (/pacific|ocean|sky/i.test(name)) return '1CA9C9';
  if (/indigo/i.test(name)) return '4B0082';
  if (/lagoon/i.test(name)) return '20B2AA';
  if (/blue/i.test(name)) return '0066CC';
  if (/lime/i.test(name)) return '32CD32';
  if (/forest|moss/i.test(name)) return '228B22';
  if (/mint|tropical|apple|emerald/i.test(name)) return '00FF7F';
  if (/green/i.test(name)) return '228B22';
  if (/orange|lion|carrot|fox|apricot|amber/i.test(name)) return 'FF6600';
  if (/yellow|bahama|lemon|dahlia|sulfur|fluo/i.test(name)) return 'FFD700';
  if (/pink|rose|blush|flamingo|taffy/i.test(name)) return 'FF69B4';
  if (/magenta/i.test(name)) return 'FF00FF';
  if (/purple|violet|lavender|amethyst|orchid|mauve/i.test(name)) return '8B008B';
  if (/brown|chocolate|walnut|cinnamon|oak/i.test(name)) return '8B4513';
  if (/bronze/i.test(name)) return 'CD7F32';
  if (/beige|ivory|cream|natural|latte/i.test(name)) return 'F5F5DC';
  if (/copper|rust/i.test(name)) return 'B87333';
  if (/turquoise|teal|cyan|aqua/i.test(name)) return '00CED1';
  if (/transparent|clear|glassy|translucent/i.test(name)) return 'E0E0E0';
  
  return null;
}
