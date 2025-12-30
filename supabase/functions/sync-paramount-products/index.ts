/**
 * Paramount 3D Enrichment Sync Pipeline
 * 
 * This is an ENRICHMENT sync - products already exist in the database.
 * We update finish_type, product_line_id, and fix TDS URLs.
 * 
 * 5-Step Pipeline:
 * 1. Fetch existing Paramount 3D products from database
 * 2. Apply brand-specific enrichments (finish_type, product_line_id)
 * 3. Fix TDS URLs with material-specific PDFs
 * 4. Update automated_brands to correct platform (wix)
 * 5. Fix duplicate hex codes
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichParamountProduct,
  PARAMOUNT_STORE_INFO,
  PARAMOUNT_TDS_URLS,
} from '../_shared/paramount-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  step: string;
  success: boolean;
  message: string;
  count?: number;
  details?: Record<string, unknown>;
}

interface FilamentRecord {
  id: string;
  product_title: string;
  material: string | null;
  finish_type: string | null;
  product_line_id: string | null;
  tds_url: string | null;
  color_hex: string | null;
  color_family: string | null;
}

interface DuplicateHexRecord {
  id: string;
  product_line_id: string;
  product_title: string;
  color_hex: string;
  duplicate_count: number;
}

// ============================================================================
// STEP 1: FETCH EXISTING PRODUCTS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchExistingProducts(supabase: SupabaseClient<any>): Promise<SyncResult & { products?: FilamentRecord[] }> {
  console.log('Step 1: Fetching existing Paramount 3D products...');
  
  try {
    const { data: products, error } = await supabase
      .from('filaments')
      .select('id, product_title, material, finish_type, product_line_id, tds_url, color_hex, color_family')
      .ilike('vendor', 'Paramount 3D');
    
    if (error) {
      console.error('Error fetching products:', error);
      return { step: 'fetch', success: false, message: error.message };
    }
    
    const withFinish = products?.filter(p => p.finish_type).length || 0;
    const withLineId = products?.filter(p => p.product_line_id).length || 0;
    const withTds = products?.filter(p => p.tds_url).length || 0;
    
    console.log(`Found ${products?.length || 0} products`);
    console.log(`- With finish_type: ${withFinish}`);
    console.log(`- With product_line_id: ${withLineId}`);
    console.log(`- With tds_url: ${withTds}`);
    
    return {
      step: 'fetch',
      success: true,
      message: `Found ${products?.length || 0} existing Paramount 3D products`,
      count: products?.length || 0,
      products: products as FilamentRecord[],
      details: {
        withFinish,
        withLineId,
        withTds,
        needsEnrichment: (products?.length || 0) - withFinish,
      },
    };
  } catch (error) {
    console.error('Fetch error:', error);
    return { step: 'fetch', success: false, message: String(error) };
  }
}

// ============================================================================
// STEP 2: APPLY BRAND-SPECIFIC ENRICHMENTS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyEnrichments(
  supabase: SupabaseClient<any>,
  products: FilamentRecord[]
): Promise<SyncResult> {
  console.log('Step 2: Applying brand-specific enrichments...');
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const product of products) {
    try {
      // Skip if already fully enriched
      if (product.finish_type && product.product_line_id) {
        skipped++;
        continue;
      }
      
      // Extract color name from title for hex lookup
      const colorName = extractColorFromTitle(product.product_title);
      
      // Apply enrichments
      const enrichment = enrichParamountProduct(
        product.product_title,
        product.material,
        colorName
      );
      
      // Build update object - only update missing fields
      const updateData: Record<string, unknown> = {};
      
      if (!product.finish_type) {
        updateData.finish_type = enrichment.finish_type;
      }
      
      if (!product.product_line_id) {
        updateData.product_line_id = enrichment.product_line_id;
      }
      
      // Update color_hex if we found a better match
      if (enrichment.color_hex && !product.color_hex) {
        updateData.color_hex = enrichment.color_hex;
      }
      
      // Update material if normalized differently
      if (enrichment.material && enrichment.material !== product.material) {
        updateData.material = enrichment.material;
      }
      
      // Set abrasive/enclosure flags
      if (enrichment.is_nozzle_abrasive) {
        updateData.is_nozzle_abrasive = true;
      }
      
      if (Object.keys(updateData).length === 0) {
        skipped++;
        continue;
      }
      
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('filaments')
        .update(updateData)
        .eq('id', product.id);
      
      if (error) {
        console.error(`Error updating ${product.id}:`, error.message);
        errors++;
      } else {
        updated++;
      }
    } catch (error) {
      console.error(`Error enriching ${product.id}:`, error);
      errors++;
    }
  }
  
  console.log(`Enrichment complete: ${updated} updated, ${skipped} skipped, ${errors} errors`);
  
  return {
    step: 'enrich',
    success: errors === 0,
    message: `Enriched ${updated} products, skipped ${skipped}, ${errors} errors`,
    count: updated,
    details: { updated, skipped, errors },
  };
}

function extractColorFromTitle(title: string): string | null {
  // Remove common prefixes/suffixes
  let cleaned = title
    .replace(/paramount\s*3d/gi, '')
    .replace(/\bpla\b|\bpetg\b|\babs\b|\btpu\b|\bpva\b|\basa\b|\bflexpla\b/gi, '')
    .replace(/1\.75\s*mm|2\.85\s*mm/gi, '')
    .replace(/1\s*kg|500\s*g|750\s*g/gi, '')
    .replace(/filament/gi, '')
    .replace(/3d\s*printer/gi, '')
    .replace(/master\s*spool/gi, '')
    .trim();
  
  // Remove leading/trailing dashes, commas
  cleaned = cleaned.replace(/^[-,\s]+|[-,\s]+$/g, '').trim();
  
  return cleaned || null;
}

// ============================================================================
// STEP 3: FIX TDS URLS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fixTdsUrls(
  supabase: SupabaseClient<any>,
  products: FilamentRecord[]
): Promise<SyncResult> {
  console.log('Step 3: Fixing TDS URLs...');
  
  let updated = 0;
  let alreadyCorrect = 0;
  let noTdsAvailable = 0;
  
  for (const product of products) {
    const material = product.material || 'PLA';
    const correctTdsUrl = PARAMOUNT_TDS_URLS[material];
    
    if (!correctTdsUrl) {
      noTdsAvailable++;
      continue;
    }
    
    // Check if already correct
    if (product.tds_url === correctTdsUrl) {
      alreadyCorrect++;
      continue;
    }
    
    // Update to correct TDS URL
    const { error } = await supabase
      .from('filaments')
      .update({ 
        tds_url: correctTdsUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id);
    
    if (!error) {
      updated++;
    }
  }
  
  console.log(`TDS URLs: ${updated} updated, ${alreadyCorrect} already correct, ${noTdsAvailable} no TDS available`);
  
  return {
    step: 'tds',
    success: true,
    message: `Updated ${updated} TDS URLs, ${alreadyCorrect} already correct`,
    count: updated,
    details: { updated, alreadyCorrect, noTdsAvailable },
  };
}

// ============================================================================
// STEP 4: UPDATE BRAND RECORD
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateBrandRecord(supabase: SupabaseClient<any>): Promise<SyncResult> {
  console.log('Step 4: Updating automated_brands record...');
  
  try {
    // Get current product counts
    const { count: totalCount } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', 'Paramount 3D');
    
    const { count: withPrices } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', 'Paramount 3D')
      .not('variant_price', 'is', null);
    
    const { count: withImages } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', 'Paramount 3D')
      .not('featured_image', 'is', null);
    
    const { count: withTds } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', 'Paramount 3D')
      .not('tds_url', 'is', null);
    
    const { count: withColorHex } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', 'Paramount 3D')
      .not('color_hex', 'is', null);
    
    // Update brand record
    const { error } = await supabase
      .from('automated_brands')
      .update({
        platform_type: PARAMOUNT_STORE_INFO.platform_type,
        base_url: PARAMOUNT_STORE_INFO.base_url,
        products_url: PARAMOUNT_STORE_INFO.products_url,
        product_count: totalCount || 0,
        active_product_count: totalCount || 0,
        products_with_prices: withPrices || 0,
        products_with_images: withImages || 0,
        products_with_tds: withTds || 0,
        products_with_color_hex: withColorHex || 0,
        last_scrape_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .ilike('brand_name', 'Paramount 3D');
    
    if (error) {
      console.error('Error updating brand:', error);
      return { step: 'brand', success: false, message: error.message };
    }
    
    console.log(`Brand updated: ${totalCount} products, platform: wix`);
    
    return {
      step: 'brand',
      success: true,
      message: `Updated brand to wix platform with ${totalCount} products`,
      count: totalCount || 0,
      details: {
        totalCount,
        withPrices,
        withImages,
        withTds,
        withColorHex,
      },
    };
  } catch (error) {
    console.error('Brand update error:', error);
    return { step: 'brand', success: false, message: String(error) };
  }
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fixDuplicateHexCodes(supabase: SupabaseClient<any>): Promise<SyncResult> {
  console.log('Step 5: Fixing duplicate hex codes...');
  
  try {
    // Find duplicates using RPC
    const { data, error } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: 'Paramount 3D',
    });
    
    if (error) {
      console.error('Error finding duplicates:', error);
      return { step: 'hex', success: false, message: error.message };
    }
    
    const duplicates = data as DuplicateHexRecord[] | null;
    
    if (!duplicates || duplicates.length === 0) {
      console.log('No duplicate hex codes found');
      return {
        step: 'hex',
        success: true,
        message: 'No duplicate hex codes found',
        count: 0,
      };
    }
    
    console.log(`Found ${duplicates.length} products with duplicate hex codes`);
    
    // Group by product_line_id and color_hex
    const groups = new Map<string, DuplicateHexRecord[]>();
    for (const dup of duplicates) {
      const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(dup);
    }
    
    let fixed = 0;
    
    // Fix each group by slightly adjusting hex values
    for (const [key, group] of groups) {
      if (group.length <= 1) continue;
      
      // Keep first one as-is, adjust others
      for (let i = 1; i < group.length; i++) {
        const product = group[i];
        const originalHex = product.color_hex;
        
        if (!originalHex) continue;
        
        // Generate unique hex by adjusting brightness
        const adjustedHex = adjustHexBrightness(originalHex, i * 2);
        
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ color_hex: adjustedHex })
          .eq('id', product.id);
        
        if (!updateError) {
          fixed++;
        }
      }
    }
    
    console.log(`Fixed ${fixed} duplicate hex codes`);
    
    return {
      step: 'hex',
      success: true,
      message: `Fixed ${fixed} duplicate hex codes across ${groups.size} groups`,
      count: fixed,
      details: { groups: groups.size, fixed },
    };
  } catch (error) {
    console.error('Hex fix error:', error);
    return { step: 'hex', success: false, message: String(error) };
  }
}

function adjustHexBrightness(hex: string, amount: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse RGB
  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Adjust brightness (alternate between lighter and darker)
  const adjustment = amount % 2 === 0 ? amount : -amount;
  r = Math.min(255, Math.max(0, r + adjustment));
  g = Math.min(255, Math.max(0, g + adjustment));
  b = Math.min(255, Math.max(0, b + adjustment));
  
  // Return hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log('='.repeat(60));
  console.log('PARAMOUNT 3D ENRICHMENT SYNC');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  const results: SyncResult[] = [];
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Fetch existing products
    const fetchResult = await fetchExistingProducts(supabase);
    results.push(fetchResult);
    
    if (!fetchResult.success || !fetchResult.products?.length) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No Paramount 3D products found in database',
          results,
          duration_seconds: (Date.now() - startTime) / 1000,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const products = fetchResult.products;
    
    // Step 2: Apply enrichments
    const enrichResult = await applyEnrichments(supabase, products);
    results.push(enrichResult);
    
    // Step 3: Fix TDS URLs
    const tdsResult = await fixTdsUrls(supabase, products);
    results.push(tdsResult);
    
    // Step 4: Update brand record
    const brandResult = await updateBrandRecord(supabase);
    results.push(brandResult);
    
    // Step 5: Fix duplicate hex codes
    const hexResult = await fixDuplicateHexCodes(supabase);
    results.push(hexResult);
    
    const duration = (Date.now() - startTime) / 1000;
    const allSuccess = results.every(r => r.success);
    
    console.log('='.repeat(60));
    console.log(`SYNC COMPLETE: ${allSuccess ? 'SUCCESS' : 'PARTIAL'} in ${duration.toFixed(1)}s`);
    console.log('='.repeat(60));
    
    return new Response(
      JSON.stringify({
        success: allSuccess,
        message: `Paramount 3D enrichment sync completed in ${duration.toFixed(1)}s`,
        results,
        summary: {
          products_enriched: enrichResult.count || 0,
          tds_urls_fixed: tdsResult.count || 0,
          hex_codes_fixed: hexResult.count || 0,
          duration_seconds: duration,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Sync failed: ${error}`,
        results,
        duration_seconds: (Date.now() - startTime) / 1000,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
