/**
 * 3D-FUEL Product Sync Edge Function
 * 
 * High-fidelity 5-step sync pipeline:
 * 1. Discovery - Fetch products from Shopify JSON API
 * 2. Variant Explosion - Expand color/diameter variants
 * 3. Enrichment - Apply brand-specific material/color/finish rules
 * 4. Upsert - Insert/update products with proper product_id
 * 5. Field Coverage - Return rich sync results
 * 
 * Enhanced with verbose decision logging for AI-powered debugging.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  BRAND_CONFIG, 
  extractMaterial, 
  extractFinish, 
  extractColorName, 
  extractDiameter,
  extractWeight,
  getColorHex,
  generateProductLineId,
  extractProductLine,
  getColorFamily,
  enrichVariant,
  isNonFilament,
} from '../_shared/3dfuel-defaults.ts';
import { 
  buildFieldCoverage, 
  buildSyncResponse, 
  createProductResult,
  type SyncProductResult,
} from '../_shared/sync-response-builder.ts';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
  is285mmDiameter,
} from '../_shared/variant-filters.ts';
import { createDecisionLogger, type DecisionLogger } from '../_shared/decision-logger.ts';
import { loadBrandProfile, getColorOptionField } from '../_shared/profile-loader.ts';
import { aiExtractColor, aiExtractHexColor, type BrandProfile } from '../_shared/ai-extraction.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global decision logger instance (set during main handler)
let decisionLogger: DecisionLogger;

// ============================================================================
// INTERFACES
// ============================================================================

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  tags: string[];
  images: Array<{ src: string }>;
  variants: ShopifyVariant[];
}

interface ShopifyVariant {
  id: number;
  title: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  grams: number;
}

interface ProcessedVariant {
  productId: string;
  title: string;
  handle: string;
  variantId: number;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  imageUrl: string | null;
  productUrl: string;
  colorName: string;
  material: string;
  finishType: string;
  diameter: number;
  weight: number;
  colorHex: string | null;
  productLineId: string;
}

// ============================================================================
// STEP 1: DISCOVERY - Fetch from Shopify
// ============================================================================

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  console.log('[Step 1] Fetching products from 3D-Fuel Shopify...');
  
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;
  
  while (true) {
    const url = `${BRAND_CONFIG.shopifyApiUrl}?limit=${limit}&page=${page}`;
    console.log(`[Discovery] Fetching page ${page}: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    if (products.length === 0) {
      break;
    }
    
    // Filter to filament products only
    const filamentProducts = products.filter((p: ShopifyProduct) => {
      const titleLower = p.title.toLowerCase();
      const typeLower = (p.product_type || '').toLowerCase();
      
      // Include filament products
      const isFilament = 
        typeLower.includes('filament') ||
        titleLower.includes('pla') ||
        titleLower.includes('petg') ||
        titleLower.includes('abs') ||
        titleLower.includes('tpu') ||
        titleLower.includes('pctg') ||
        titleLower.includes('nylon');
      
      // Exclude accessories, apparel, and samples
      const isAccessory = 
        // Accessories
        titleLower.includes('spool holder') ||
        titleLower.includes('nozzle') ||
        titleLower.includes('sheet') ||
        // Apparel
        titleLower.includes('t-shirt') ||
        titleLower.includes('hoodie') ||
        titleLower.includes('beanie') ||
        titleLower.includes('hat') ||
        titleLower.includes('backpack') ||
        // Samples and kits
        titleLower.includes('sample coil') ||
        titleLower.includes('sample coils') ||
        titleLower.includes('sample pack') ||
        titleLower.includes('diy assembly kit') ||
        titleLower.includes('50g') ||
        (titleLower.includes('coil') && !titleLower.includes('spool'));
      
      return isFilament && !isAccessory;
    });
    
    allProducts.push(...filamentProducts);
    console.log(`[Discovery] Page ${page}: ${filamentProducts.length} filament products (${products.length} total)`);
    
    if (products.length < limit) {
      break;
    }
    
    page++;
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[Step 1] Complete: ${allProducts.length} filament products discovered`);
  return allProducts;
}

// ============================================================================
// STEP 2: VARIANT EXPLOSION
// ============================================================================

function explodeVariants(products: ShopifyProduct[]): ProcessedVariant[] {
  console.log('[Step 2] Exploding variants...');
  
  const variants: ProcessedVariant[] = [];
  const seenIds = new Set<string>();
  const filterStats = createFilterStats();
  
  // CRITICAL: Track unique variants by hash to prevent duplicates
  // Hash = productLineId|colorName|weight to catch same color appearing twice
  const processedHashes = new Set<string>();
  
  for (const product of products) {
    // Skip non-filament products (3D Clean, etc.)
    if (isNonFilament(product.title, product.handle)) {
      console.log(`[3D-Fuel] Skipping non-filament: ${product.title} (handle: ${product.handle})`);
      continue;
    }
    
    // CRITICAL FIX: Detect TRUE multi-material products (ReFuel ONLY)
    // ReFuel products have option1 = Material Type (e.g., "Standard PLA+", "Tough Pro PLA+")
    // and option3 = Color Name (e.g., "Natural")
    // IMPORTANT: Only trigger for actual ReFuel products containing "recycled" or with multiple 
    // materials in the same Shopify product. Do NOT trigger for regular products!
    const titleLower = product.title.toLowerCase();
    const isReFuelProduct = titleLower.includes('refuel') && 
                            (titleLower.includes('recycled') || titleLower.includes('re-fuel'));
    
    // Check if this product has variant.option1 containing different material types
    const hasMultipleMaterialsInOption1 = product.variants.some(v => {
      const opt = v.option1?.toLowerCase() || '';
      return opt.includes('standard pla') || opt.includes('tough pro') || 
             opt.includes('pro pctg') || opt.includes('pro petg');
    });
    
    const isMultiMaterialProduct = isReFuelProduct && hasMultipleMaterialsInOption1;
    
    if (isMultiMaterialProduct) {
      console.log(`[3D-Fuel] TRUE multi-material ReFuel product detected: ${product.title}`);
    }
    
    for (const variant of product.variants) {
      // CRITICAL: For multi-material products, extract material from option1
      // and color from option3 instead of the normal flow
      let material: string;
      let colorName: string;
      let productLineId: string;
      
      if (isMultiMaterialProduct && variant.option1) {
        // Multi-material handling: option1 = material, option3 = color
        material = extractMaterialFromOption(variant.option1, product.title);
        colorName = variant.option3?.trim() || extractColorName(variant, product.title, product.handle);
        
        // Generate material-specific product line ID - pass option1 for accurate material detection
        productLineId = generateProductLineIdForMultiMaterial(product.title, material, variant.option1, product.handle);
        
        console.log(`[3D-Fuel] Multi-material: option1="${variant.option1}" -> material="${material}", option3="${variant.option3}" -> color="${colorName}"`);
      } else {
        // Normal single-material product handling
        material = extractMaterial(product.title);
        colorName = extractColorName(variant, product.title, product.handle);
        productLineId = generateProductLineId(product.title, product.handle, colorName);
      }
      
      const finishType = extractFinish(product.title);
      const diameter = extractDiameter(variant);
      const weight = extractWeight(variant, product.title);
      
      const productId = `3dfuel-${product.id}-${variant.id}`;
      
      // Log color extraction decision
      decisionLogger?.logColorExtraction(
        productId,
        product.title,
        { variantTitle: variant.title, productHandle: product.handle, options: [variant.option1, variant.option2, variant.option3].filter(Boolean) as string[] },
        { colorName, method: isMultiMaterialProduct ? 'multi-material (option3)' : (colorName === 'Default' ? 'fallback' : 'extracted') },
        colorName !== 'Default'
      );
      
      // Log product line decision
      decisionLogger?.logProductLine(
        productId,
        product.title,
        { title: product.title, handle: product.handle, colorName },
        { productLineId, matchedPattern: isMultiMaterialProduct ? `multi-material: ${material}` : 'title/handle pattern' }
      );
      
      // Debug logging for color extraction issues
      console.log(`[Color] Product: "${product.title}" Handle: "${product.handle}" Variant: "${variant.title}" -> Material: "${material}" Color: "${colorName}" -> ProductLine: "${productLineId}"`);
      
      // Apply standard filtering (samples, bulk, 2.85mm)
      const filterResult = shouldIncludeVariant(weight, diameter);
      updateFilterStats(filterStats, filterResult);
      
      // Log filter decision
      decisionLogger?.logFilter(
        productId,
        product.title,
        { weight, diameter },
        { included: filterResult.include, reason: filterResult.reason || 'passed all filters' }
      );
      
      if (!filterResult.include) {
        console.log(`[3D-Fuel] Skipping: ${product.title} - ${colorName} (${filterResult.reason})`);
        continue;
      }
      
      // CRITICAL: Deduplication by hash to prevent duplicate color entries
      // This catches cases where the same color appears multiple times under different SKUs
      const variantHash = `${productLineId}|${colorName.toLowerCase()}|${weight}`;
      if (processedHashes.has(variantHash)) {
        console.log(`[3D-Fuel] Skipping duplicate: ${variantHash}`);
        decisionLogger?.log({
          productId,
          productTitle: product.title,
          decisionType: 'filter',
          input: { variantHash, colorName, productLineId, weight },
          output: { included: false },
          reason: 'Duplicate variant hash (same color/weight/line)',
          success: false,
        });
        continue;
      }
      processedHashes.add(variantHash);
      
      // Skip duplicates by product ID (older check)
      if (seenIds.has(productId)) {
        continue;
      }
      seenIds.add(productId);
      
      // Find matching image (by color name if possible)
      let imageUrl = product.images[0]?.src || null;
      
      // Get color hex - pass variant.title for embedded hex extraction (e.g., "Bone White - #F3E2C7")
      const colorHex = getColorHex(colorName, variant.title);
      
      // Log hex lookup decision
      decisionLogger?.logHexLookup(
        productId,
        product.title,
        { colorName, variantTitle: variant.title },
        { colorHex, source: colorHex ? (variant.title.includes('#') ? 'embedded in title' : 'COLOR_HEX_MAP') : 'not found' }
      );
      
      // CRITICAL FIX: Use ACTUAL Shopify product title instead of reconstructing
      // This ensures DB title matches what the user sees on the product page
      // For 3D-Fuel: Shopify titles are already in format "Product Line, Color, 1.75mm"
      let displayTitle: string;
      
      // Check if Shopify title is already well-formatted (contains comma and color)
      const shopifyTitle = product.title;
      const hasCommaFormat = shopifyTitle.includes(',');
      
      if (hasCommaFormat && shopifyTitle.toLowerCase().includes(colorName.toLowerCase().split(' ')[0])) {
        // Use Shopify title directly - it's already the correct format
        displayTitle = shopifyTitle;
        decisionLogger?.log({
          productId,
          productTitle: product.title,
          decisionType: 'title_source',
          input: { shopifyTitle, colorName },
          output: { displayTitle, source: 'shopify_direct' },
          reason: 'Used Shopify title directly (already well-formatted)',
          success: true,
        });
      } else {
        // Construct title from product line + color (fallback)
        let productLine = extractProductLine(product.title);
        
        // For ReFuel/multi-material products, show specific material in title
        if (isMultiMaterialProduct) {
          if (variant.option1?.toLowerCase().includes('tough pro')) {
            productLine = 'ReFuel Tough Pro PLA+';
          } else if (variant.option1?.toLowerCase().includes('standard')) {
            productLine = 'ReFuel Standard PLA+';
          } else if (material === 'PCTG') {
            productLine = 'ReFuel Pro PCTG';
          } else if (material === 'PETG') {
            productLine = 'ReFuel PETG';
          } else {
            productLine = `ReFuel ${material}`;
          }
        }
        
        displayTitle = `${productLine}, ${colorName}, 1.75mm`;
        decisionLogger?.log({
          productId,
          productTitle: product.title,
          decisionType: 'title_source',
          input: { shopifyTitle, productLine, colorName },
          output: { displayTitle, source: 'constructed' },
          reason: `Constructed title from productLine + colorName (Shopify title not in expected format)`,
          success: true,
        });
      }
      
      // Log title format decision - extract productLine from displayTitle or use extracted
      const extractedProductLine = extractProductLine(product.title);
      decisionLogger?.logTitleFormat(
        productId,
        { originalTitle: product.title, productLine: extractedProductLine, colorName },
        { formattedTitle: displayTitle }
      );
      
      variants.push({
        productId,
        title: displayTitle,
        handle: product.handle,
        variantId: variant.id,
        sku: variant.sku || '',
        price: parseFloat(variant.price) || 0,  // Use actual variant price
        compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
        available: variant.available,
        imageUrl,
        productUrl: `https://${BRAND_CONFIG.shopifyDomain}/products/${product.handle}`,
        colorName,
        material,
        finishType,
        diameter,
        weight,
        colorHex,
        productLineId,
      });
    }
  }
  
  logFilterStats('3D-Fuel', filterStats);
  console.log(`[Step 2] Complete: ${variants.length} variants exploded`);
  console.log(`[Step 2] Product lines created: ${new Set(variants.map(v => v.productLineId)).size}`);
  console.log(`[Step 2] Deduplication: ${processedHashes.size} unique hashes processed`);
  
  // Log decision summary
  if (decisionLogger) {
    const summary = decisionLogger.getSummary();
    console.log('[DecisionLogger] Summary:', JSON.stringify(summary));
  }
  
  return variants;
}

/**
 * Extract material from variant option1 (for multi-material products like ReFuel)
 */
function extractMaterialFromOption(option1: string, productTitle: string): string {
  const opt = option1.toLowerCase();
  
  if (opt.includes('tough pro pla') || opt.includes('tough pro pla+')) return 'PLA+';
  if (opt.includes('standard pla') || opt.includes('standard pla+')) return 'PLA+';
  if (opt.includes('pctg') || opt.includes('pro pctg')) return 'PCTG';
  if (opt.includes('petg') || opt.includes('pro petg')) return 'PETG';
  if (opt.includes('pla+')) return 'PLA+';
  if (opt.includes('pla')) return 'PLA';
  if (opt.includes('abs')) return 'ABS';
  if (opt.includes('asa')) return 'ASA';
  
  // Fallback to product title extraction
  return extractMaterial(productTitle);
}

/**
 * Generate product line ID for multi-material products
 * These products need material-specific grouping to prevent cross-contamination
 */
/**
 * Generate product line ID for multi-material products
 * These products need material-specific grouping to prevent cross-contamination
 * 
 * CRITICAL: For ReFuel products, variantOption1 contains the ACTUAL material selection
 * e.g., "Standard PLA+" or "Tough Pro PLA+" - we MUST use this, not the title
 */
function generateProductLineIdForMultiMaterial(
  productTitle: string, 
  material: string, 
  variantOption1: string | null,
  productHandle?: string
): string {
  const titleLower = productTitle.toLowerCase();
  const option1Lower = (variantOption1 || '').toLowerCase();
  
  // ReFuel products - use option1 to determine EXACT material variant
  if (titleLower.includes('refuel')) {
    // CRITICAL: Check option1 FIRST as it contains the specific material choice
    if (option1Lower.includes('tough pro')) {
      return '3dfuel__refuel-tough-pro-pla';
    } else if (option1Lower.includes('standard pla') || option1Lower.includes('standard')) {
      return '3dfuel__refuel-standard-pla';
    } else if (option1Lower.includes('pctg') || material === 'PCTG') {
      return '3dfuel__refuel-pctg';
    } else if (option1Lower.includes('petg') || material === 'PETG') {
      return '3dfuel__refuel-petg';
    }
    
    // Fallback for unknown ReFuel materials
    const materialSlug = material.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `3dfuel__refuel-${materialSlug}`;
  }
  
  // For other multi-material products, fall back to standard logic
  return generateProductLineId(productTitle, productHandle);
}

// ============================================================================
// STEP 3 & 4: ENRICHMENT & UPSERT
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProcessedVariant[],
  brandId: string | null
): Promise<{ created: number; updated: number; errors: number; results: SyncProductResult[] }> {
  console.log(`[Step 3-4] Upserting ${variants.length} variants...`);
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  const results: SyncProductResult[] = [];
  
  for (const variant of variants) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .maybeSingle();
      
      const filamentData = {
        product_id: variant.productId,
        product_title: variant.title,
        product_handle: variant.handle,
        vendor: BRAND_CONFIG.vendorName,
        brand_id: brandId,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        variant_sku: variant.sku || null,
        product_url: variant.productUrl,
        featured_image: variant.imageUrl,
        material: variant.material,
        finish_type: variant.finishType,
        color_family: getColorFamily(variant.colorName),  // Use proper color family, not raw color name
        color_hex: variant.colorHex,
        diameter_nominal_mm: variant.diameter,
        net_weight_g: variant.weight,
        product_line_id: variant.productLineId,
        auto_created: !existing,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('filaments')
          .update(filamentData)
          .eq('id', existing.id);
        
        if (error) throw error;
        updated++;
        results.push(createProductResult(variant.productId, variant.title, 'updated', filamentData));
      } else {
        // Insert
        const { error } = await supabase
          .from('filaments')
          .insert(filamentData);
        
        if (error) throw error;
        created++;
        results.push(createProductResult(variant.productId, variant.title, 'created', filamentData));
      }
    } catch (err: any) {
      console.error(`[Upsert] Error for ${variant.productId}:`, err.message);
      errors++;
      results.push(createProductResult(variant.productId, variant.title, 'error', {}, err.message));
    }
  }
  
  console.log(`[Step 3-4] Complete: ${created} created, ${updated} updated, ${errors} errors`);
  return { created, updated, errors, results };
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<number> {
  console.log('[Step 5] Fixing duplicate hex codes...');
  
  try {
    const { data: duplicates, error } = await supabase
      .rpc('find_duplicate_hexes', { p_vendor: BRAND_CONFIG.vendorName });
    
    if (error) {
      console.error('[Step 5] Error finding duplicates:', error.message);
      return 0;
    }
    
    if (!duplicates || duplicates.length === 0) {
      console.log('[Step 5] No duplicate hex codes found');
      return 0;
    }
    
    // Adjust hex codes for duplicates by slightly modifying the value
    let fixed = 0;
    const grouped = new Map<string, any[]>();
    
    for (const dup of duplicates) {
      const key = `${dup.product_line_id}-${dup.color_hex?.toLowerCase()}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(dup);
    }
    
    for (const [, items] of grouped) {
      if (items.length <= 1) continue;
      
      // Keep first one as-is, adjust others
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const originalHex = item.color_hex;
        
        // Slightly adjust the hex value
        const r = parseInt(originalHex.slice(1, 3), 16);
        const g = parseInt(originalHex.slice(3, 5), 16);
        const b = parseInt(originalHex.slice(5, 7), 16);
        
        const newR = Math.min(255, r + i);
        const newHex = `#${newR.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        
        await supabase
          .from('filaments')
          .update({ color_hex: newHex })
          .eq('id', item.id);
        
        fixed++;
      }
    }
    
    console.log(`[Step 5] Fixed ${fixed} duplicate hex codes`);
    return fixed;
  } catch (err: any) {
    console.error('[Step 5] Error:', err.message);
    return 0;
  }
}

// ============================================================================
// UPDATE BRAND STATS
// ============================================================================

async function updateBrandStats(supabase: any): Promise<void> {
  console.log('[Stats] Updating brand statistics...');
  
  try {
    await supabase
      .from('automated_brands')
      .update({
        platform_type: 'Shopify',
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', BRAND_CONFIG.brandSlug);
    
    await supabase.rpc('update_brand_product_counts', { 
      p_brand_slug: BRAND_CONFIG.brandSlug 
    });
    
    await supabase.rpc('update_brand_enrichment_counts', { 
      p_brand_slug: BRAND_CONFIG.brandSlug 
    });
    
    console.log('[Stats] Brand statistics updated');
  } catch (err: any) {
    console.error('[Stats] Error updating stats:', err.message);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    console.log('='.repeat(60));
    console.log('3D-FUEL PRODUCT SYNC STARTING');
    console.log('='.repeat(60));
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize decision logger for verbose sync logging
    decisionLogger = createDecisionLogger({
      brandSlug: BRAND_CONFIG.brandSlug,
    });
    
    // Parse options
    let cleanSlate = false;
    try {
      const body = await req.json();
      cleanSlate = body?.cleanSlate === true;
    } catch {
      // No body or invalid JSON
    }
    
    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', BRAND_CONFIG.brandSlug)
      .maybeSingle();
    
    const brandId = brand?.id || null;
    
    // Create sync log entry for decision logging
    const { data: syncLogData } = await supabase
      .from('brand_sync_logs')
      .insert({
        brand_id: brandId,
        brand_slug: BRAND_CONFIG.brandSlug,
        sync_type: cleanSlate ? 'clean_slate' : 'incremental',
        status: 'running',
        triggered_by: 'edge_function',
      })
      .select('id')
      .single();
    
    if (syncLogData?.id) {
      decisionLogger.setSyncLogId(syncLogData.id);
    }
    
    // Clean slate if requested
    if (cleanSlate) {
      console.log('[Clean Slate] Deleting existing 3D-Fuel products...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', BRAND_CONFIG.vendorName);
      if (deleteError) {
        console.error('[Clean Slate] Delete error:', deleteError.message);
      } else {
        console.log('[Clean Slate] Existing products deleted');
      }
    }
    
    // Load AI-generated brand profile for intelligent extraction
    console.log('[AI Profile] Loading brand profile for 3d-fuel...');
    const brandProfile = await loadBrandProfile('3d-fuel');
    if (brandProfile) {
      console.log(`[AI Profile] Loaded profile with ${Object.keys(brandProfile.color_hex_mappings || {}).length} color mappings`);
      console.log(`[AI Profile] Product structure: ${brandProfile.product_structure}, Swatch type: ${brandProfile.swatch_type}`);
    } else {
      console.log('[AI Profile] No profile found, using hardcoded defaults');
    }
    
    // Step 1: Discovery
    const products = await fetchShopifyProducts();
    
    // Step 2: Variant Explosion (now with AI profile context)
    const variants = explodeVariants(products);
    
    // Step 3-4: Enrichment & Upsert
    const { created, updated, errors, results } = await upsertVariants(supabase, variants, brandId);
    
    // Step 5: Fix Duplicate Hex Codes
    await fixDuplicateHexCodes(supabase);
    
    // Update brand stats
    await updateBrandStats(supabase);
    
    // Calculate field coverage
    const fieldCoverage = await buildFieldCoverage(supabase, BRAND_CONFIG.vendorName);
    
    const durationMs = Date.now() - startTime;
    
    console.log('='.repeat(60));
    console.log(`3D-FUEL SYNC COMPLETE in ${durationMs}ms`);
    console.log(`Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
    console.log('='.repeat(60));
    
    // Save decision logs to database for AI analysis
    const { saved: logsSaved, errors: logErrors } = await decisionLogger.saveToDatabase(supabase);
    console.log(`[DecisionLogger] Saved ${logsSaved} decision logs (${logErrors} errors)`);
    
    // Update sync log with completion status
    if (decisionLogger['syncLogId']) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(durationMs / 1000),
          products_discovered: variants.length,
          products_created: created,
          products_updated: updated,
          products_failed: errors,
        })
        .eq('id', decisionLogger['syncLogId']);
    }
    
    const response = buildSyncResponse(
      true,
      durationMs,
      {
        totalDiscovered: variants.length,
        created,
        updated,
        skipped: 0,
        errors,
      },
      results,
      fieldCoverage
    );
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (err: any) {
    console.error('[FATAL]', err);
    
    const durationMs = Date.now() - startTime;
    
    // Update sync log with failure status
    if (decisionLogger?.['syncLogId']) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(durationMs / 1000),
          error_details: { error: err.message },
        })
        .eq('id', decisionLogger['syncLogId']);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      duration_ms: durationMs,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
