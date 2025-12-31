/**
 * NINJATEK FULL SYNC PIPELINE
 * 
 * 5-step sync for NinjaTek premium TPU filaments:
 * 1. Discover products via shop page (WooCommerce)
 * 2. Scrape product pages with Firecrawl
 * 3. Apply brand-specific enrichments
 * 4. Fix duplicate hex codes
 * 5. Populate TDS URLs
 * 
 * Platform: WooCommerce (WordPress) - requires HTML scraping
 * Currency: USD
 * Specialty: Premium TPU in various Shore hardness grades
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  enrichNinjatekProduct,
  cleanNinjatekTitle,
  extractProductLine,
  getNinjatekColorHex,
  NINJATEK_TDS_URLS,
  type ProductLine,
} from '../_shared/ninjatek-defaults.ts';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductVariant {
  productId: string;
  title: string;
  productLine: ProductLine | null;
  color: string;
  colorHex: string | null;
  price: number | null;
  weightKg: number;
  diameterMm: number;
  url: string;
  imageUrl: string | null;
  available: boolean;
}

interface SyncResult {
  success: boolean;
  step: string;
  created: number;
  updated: number;
  errors: number;
  details?: any;
}

// ============================================================================
// STEP 1: DISCOVER PRODUCTS FROM SHOP PAGE
// ============================================================================

const NINJATEK_PRODUCT_URLS: Record<ProductLine, string> = {
  ninjaflex: 'https://ninjatek.com/shop/ninjaflex/',
  edge: 'https://ninjatek.com/shop/edge/',
  chinchilla: 'https://ninjatek.com/shop/chinchilla/',
  cheetah: 'https://ninjatek.com/shop/cheetah/',
  armadillo: 'https://ninjatek.com/shop/armadillo/',
  eel: 'https://ninjatek.com/shop/eel/',
};

async function discoverProducts(firecrawlKey: string): Promise<{ productLine: ProductLine; url: string; html: string }[]> {
  console.log('[NINJATEK-SYNC] Step 1: Discovering products from shop pages...');
  const results: { productLine: ProductLine; url: string; html: string }[] = [];
  
  for (const [productLine, url] of Object.entries(NINJATEK_PRODUCT_URLS)) {
    try {
      console.log(`[NINJATEK-SYNC] Scraping ${productLine}: ${url}`);
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ['html', 'markdown'],
          onlyMainContent: false,
          waitFor: 3000,
        }),
      });
      
      if (!response.ok) {
        console.error(`[NINJATEK-SYNC] Failed to scrape ${productLine}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      if (data.success && data.data?.html) {
        results.push({
          productLine: productLine as ProductLine,
          url,
          html: data.data.html,
        });
        console.log(`[NINJATEK-SYNC] ✓ Got HTML for ${productLine}`);
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 1500));
    } catch (error) {
      console.error(`[NINJATEK-SYNC] Error scraping ${productLine}:`, error);
    }
  }
  
  return results;
}

// ============================================================================
// STEP 2: PARSE COLOR VARIANTS FROM HTML
// ============================================================================

function parseColorVariants(html: string, productLine: ProductLine, baseUrl: string): ProductVariant[] {
  const variants: ProductVariant[] = [];
  
  // Extract product title
  const titleMatch = html.match(/<h1[^>]*class="[^"]*product[_-]title[^"]*"[^>]*>([^<]+)</i) ||
                     html.match(/<h1[^>]*>([^<]+NinjaTek[^<]+)</i) ||
                     html.match(/<h1[^>]*>([^<]+)</i);
  const baseTitle = titleMatch ? titleMatch[1].trim() : `NinjaTek ${productLine.charAt(0).toUpperCase() + productLine.slice(1)}`;
  
  // Extract price
  const priceMatch = html.match(/\$(\d+(?:\.\d{2})?)/);
  const price = priceMatch ? parseFloat(priceMatch[1]) : null;
  
  // Extract product image
  const imageMatch = html.match(/src="([^"]+ninjatek[^"]+(?:jpg|png|webp))"/i) ||
                     html.match(/src="([^"]+wp-content\/uploads[^"]+(?:jpg|png|webp))"/i);
  const baseImageUrl = imageMatch ? imageMatch[1] : null;
  
  // Try to extract color swatches from WooCommerce variation data
  // WooCommerce often has data-attribute-pa_color or similar
  const colorMatches = html.matchAll(/data-value="([^"]+)"[^>]*title="([^"]+)"/gi);
  const swatchMatches = html.matchAll(/class="[^"]*swatch[^"]*"[^>]*style="[^"]*background(?:-color)?:\s*#?([A-Fa-f0-9]{6})[^"]*"[^>]*(?:title|data-title)="([^"]+)"/gi);
  
  const colorsFound: Set<string> = new Set();
  
  // Parse swatch data
  for (const match of swatchMatches) {
    const hex = match[1];
    const colorName = match[2];
    if (colorName && !colorsFound.has(colorName.toLowerCase())) {
      colorsFound.add(colorName.toLowerCase());
      variants.push({
        productId: `ninjatek-${productLine}-${colorName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${baseTitle} - ${colorName}`,
        productLine,
        color: colorName,
        colorHex: hex ? `#${hex.toUpperCase()}` : getNinjatekColorHex(colorName),
        price,
        weightKg: 1.0,
        diameterMm: 1.75,
        url: baseUrl,
        imageUrl: baseImageUrl,
        available: true,
      });
    }
  }
  
  // Also look for select options
  const optionMatches = html.matchAll(/<option[^>]*value="([^"]+)"[^>]*>([^<]+)</gi);
  for (const match of optionMatches) {
    const value = match[1];
    const label = match[2].trim();
    
    // Skip non-color options (sizes, etc.)
    if (/\d+\s*(kg|g|mm)/i.test(label)) continue;
    if (label.toLowerCase() === 'choose an option') continue;
    
    const colorName = label;
    if (colorName && !colorsFound.has(colorName.toLowerCase())) {
      colorsFound.add(colorName.toLowerCase());
      variants.push({
        productId: `ninjatek-${productLine}-${colorName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${baseTitle} - ${colorName}`,
        productLine,
        color: colorName,
        colorHex: getNinjatekColorHex(colorName),
        price,
        weightKg: 1.0,
        diameterMm: 1.75,
        url: baseUrl,
        imageUrl: baseImageUrl,
        available: true,
      });
    }
  }
  
  // If no variants found, try parsing from markdown/text
  if (variants.length === 0) {
    // Known NinjaTek colors to look for
    const knownColors = [
      'Midnight', 'Snow', 'Steel', 'Fire', 'Lava', 'Sun', 
      'Grass', 'Sapphire', 'Flamingo', 'Neon', 'Water', 'Sky',
      'Carbon', 'Bone', 'Silver'
    ];
    
    for (const color of knownColors) {
      if (html.toLowerCase().includes(color.toLowerCase())) {
        if (!colorsFound.has(color.toLowerCase())) {
          colorsFound.add(color.toLowerCase());
          variants.push({
            productId: `ninjatek-${productLine}-${color.toLowerCase()}`,
            title: `${baseTitle} - ${color}`,
            productLine,
            color,
            colorHex: getNinjatekColorHex(color),
            price,
            weightKg: 1.0,
            diameterMm: 1.75,
            url: baseUrl,
            imageUrl: baseImageUrl,
            available: true,
          });
        }
      }
    }
  }
  
  console.log(`[NINJATEK-SYNC] Parsed ${variants.length} color variants for ${productLine}`);
  return variants;
}

// ============================================================================
// STEP 3: UPSERT TO DATABASE WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any, 
  variants: ProductVariant[], 
  brandId: string | null
): Promise<SyncResult> {
  console.log(`[NINJATEK-SYNC] Step 3: Upserting ${variants.length} variants with enrichments...`);
  
  let created = 0, updated = 0, errors = 0;
  
  for (const variant of variants) {
    try {
      // Apply enrichments
      const enriched = enrichNinjatekProduct(variant.title);
      const cleanedTitle = cleanNinjatekTitle(variant.title);
      
      // Check if exists
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .ilike('vendor', 'ninjatek')
        .maybeSingle();
      
      const filamentData = {
        product_id: variant.productId,
        product_title: cleanedTitle || variant.title,
        vendor: 'NinjaTek',
        brand_id: brandId,
        material: enriched.material,
        product_line_id: enriched.productLineId,
        finish_type: enriched.finishType,
        color_hex: variant.colorHex || (enriched.colorHex ? `#${enriched.colorHex}` : null),
        color_family: variant.color,
        variant_price: variant.price,
        variant_available: variant.available,
        product_url: variant.url,
        featured_image: variant.imageUrl,
        tds_url: enriched.tdsUrl,
        nozzle_temp_min_c: enriched.nozzleTempMin,
        nozzle_temp_max_c: enriched.nozzleTempMax,
        bed_temp_min_c: enriched.bedTempMin,
        bed_temp_max_c: enriched.bedTempMax,
        print_speed_max_mms: enriched.printSpeedMax,
        net_weight_g: enriched.weightKg * 1000,
        diameter_nominal_mm: enriched.diameterMm,
        shore_hardness_d: enriched.shoreHardness ? parseInt(enriched.shoreHardness.replace(/[AD]/i, ''), 10) : null,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
        auto_created: !existing,
        auto_updated: !!existing,
      };
      
      if (existing) {
        const { error } = await supabase
          .from('filaments')
          .update(filamentData)
          .eq('id', existing.id);
        
        if (error) throw error;
        updated++;
      } else {
        const { error } = await supabase
          .from('filaments')
          .insert(filamentData);
        
        if (error) throw error;
        created++;
      }
    } catch (error) {
      console.error(`[NINJATEK-SYNC] Error upserting ${variant.productId}:`, error);
      errors++;
    }
  }
  
  return { success: errors === 0, step: 'upsert', created, updated, errors };
}

// ============================================================================
// STEP 4: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<SyncResult> {
  console.log('[NINJATEK-SYNC] Step 4: Fixing duplicate hex codes...');
  
  try {
    const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: 'ninjatek'
    });
    
    if (error) throw error;
    
    if (!duplicates || duplicates.length === 0) {
      console.log('[NINJATEK-SYNC] No duplicate hex codes found');
      return { success: true, step: 'fix_hexes', created: 0, updated: 0, errors: 0 };
    }
    
    console.log(`[NINJATEK-SYNC] Found ${duplicates.length} products with duplicate hexes`);
    
    // Group by product_line_id and hex
    const groups: Record<string, typeof duplicates> = {};
    for (const dup of duplicates) {
      const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(dup);
    }
    
    let updated = 0;
    for (const [, items] of Object.entries(groups)) {
      // Skip first item (keep original), adjust others
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const originalHex = item.color_hex?.replace('#', '') || 'FFFFFF';
        
        // Modify hex slightly
        const hexNum = parseInt(originalHex, 16);
        const newHexNum = (hexNum + i * 17) % 0xFFFFFF; // Small variation
        const newHex = `#${newHexNum.toString(16).padStart(6, '0').toUpperCase()}`;
        
        const { error } = await supabase
          .from('filaments')
          .update({ color_hex: newHex })
          .eq('id', item.id);
        
        if (!error) updated++;
      }
    }
    
    return { success: true, step: 'fix_hexes', created: 0, updated, errors: 0 };
  } catch (error) {
    console.error('[NINJATEK-SYNC] Error fixing hex codes:', error);
    return { success: false, step: 'fix_hexes', created: 0, updated: 0, errors: 1, details: error };
  }
}

// ============================================================================
// STEP 5: POPULATE TDS URLs
// ============================================================================

async function populateTdsUrls(supabase: any): Promise<SyncResult> {
  console.log('[NINJATEK-SYNC] Step 5: Populating TDS URLs...');
  
  try {
    // Get NinjaTek filaments without TDS
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_line_id')
      .ilike('vendor', 'ninjatek')
      .is('tds_url', null);
    
    if (fetchError) throw fetchError;
    
    let updated = 0;
    for (const filament of filaments || []) {
      // Extract product line from product_line_id (e.g., "ninjatek__tpu-85a__ninjaflex" -> "ninjaflex")
      const productLine = filament.product_line_id?.split('__').pop() as ProductLine;
      const tdsUrl = NINJATEK_TDS_URLS[productLine];
      
      if (tdsUrl) {
        const { error } = await supabase
          .from('filaments')
          .update({ tds_url: tdsUrl })
          .eq('id', filament.id);
        
        if (!error) updated++;
      }
    }
    
    console.log(`[NINJATEK-SYNC] Updated ${updated} filaments with TDS URLs`);
    return { success: true, step: 'tds_urls', created: 0, updated, errors: 0 };
  } catch (error) {
    console.error('[NINJATEK-SYNC] Error populating TDS URLs:', error);
    return { success: false, step: 'tds_urls', created: 0, updated: 0, errors: 1, details: error };
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
  console.log('[NINJATEK-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[NINJATEK-SYNC] 🚀 NINJATEK FULL SYNC STARTED');
  console.log('[NINJATEK-SYNC] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY is required');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    let options = { 
      skipDiscovery: false, 
      skipEnrichment: false,
      skipHexFix: false,
      skipTds: false,
      limit: 100 
    };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {}

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'ninjatek')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    const results: SyncResult[] = [];

    // Step 1 & 2: Discover and parse products
    if (!options.skipDiscovery) {
      const pages = await discoverProducts(firecrawlKey);
      console.log(`[NINJATEK-SYNC] Discovered ${pages.length} product pages`);
      
      const allVariants: ProductVariant[] = [];
      for (const page of pages) {
        const variants = parseColorVariants(page.html, page.productLine, page.url);
        allVariants.push(...variants);
      }
      
      console.log(`[NINJATEK-SYNC] Total variants parsed: ${allVariants.length}`);
      
      // Step 3: Upsert with enrichments
      if (!options.skipEnrichment && allVariants.length > 0) {
        const upsertResult = await upsertVariants(supabase, allVariants, brandId);
        results.push(upsertResult);
      }
    }

    // Step 4: Fix duplicate hex codes
    if (!options.skipHexFix) {
      const hexResult = await fixDuplicateHexCodes(supabase);
      results.push(hexResult);
    }

    // Step 5: Populate TDS URLs
    if (!options.skipTds) {
      const tdsResult = await populateTdsUrls(supabase);
      results.push(tdsResult);
    }

    // Update brand counts
    if (brandId) {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'ninjatek' });
      await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'ninjatek' });
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    console.log('[NINJATEK-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[NINJATEK-SYNC] ✅ SYNC COMPLETED in ${duration}s`);
    console.log(`[NINJATEK-SYNC] Created: ${totalCreated}, Updated: ${totalUpdated}, Errors: ${totalErrors}`);
    console.log('[NINJATEK-SYNC] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify({
      success: totalErrors === 0,
      duration,
      created: totalCreated,
      updated: totalUpdated,
      errors: totalErrors,
      steps: results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NINJATEK-SYNC] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Math.round((Date.now() - startTime) / 1000),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
