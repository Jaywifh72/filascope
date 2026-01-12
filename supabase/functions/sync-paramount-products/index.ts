/**
 * Paramount 3D CSV-Seeded Sync Pipeline
 * 
 * US-based industrial filament supplier (est. 1994)
 * Platform: Wix (custom website)
 * Currency: USD
 * 
 * This is a CSV-SEEDED sync - products come from PARAMOUNT_SEED_DATA.
 * We use delete-then-insert pattern with safe threshold for clean data.
 * 
 * 5-Step Pipeline:
 * 1. Load CSV seed data and filter exclusions
 * 2. Apply brand-specific enrichments (colors, product_line_id)
 * 3. Safe delete existing products (if threshold met)
 * 4. Batch insert new products
 * 5. Update brand statistics and fix duplicates
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  PARAMOUNT_SEED_DATA,
  shouldExcludeParamountProduct,
  generateParamountProductLineIdFromSeed,
  getParamountColorHexFromSeed,
  getParamountDefaultPrice,
} from '../_shared/paramount-seed.ts';
import {
  normalizeParamountMaterial,
  getParamountPrintSettings,
  getParamountTdsUrl,
  extractParamountFinishType,
  PARAMOUNT_STORE_INFO,
} from '../_shared/paramount-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  deleted: number;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('='.repeat(60));
  console.log('PARAMOUNT 3D CSV-SEEDED SYNC');
  console.log('='.repeat(60));

  const startTime = Date.now();
  const stats: SyncStats = {
    discovered: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    deleted: 0,
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request options
    let cleanSlate = false;
    try {
      const body = await req.json();
      cleanSlate = body?.cleanSlate === true;
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log(`[Paramount] Clean slate mode: ${cleanSlate}`);

    // ========================================================================
    // STEP 1: LOAD AND FILTER SEED DATA
    // ========================================================================
    console.log('[Paramount] Step 1: Loading and filtering seed data...');

    // Get brand info
    const { data: brandData } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', 'paramount-3d')
      .single();

    if (!brandData) {
      throw new Error('Paramount 3D brand not found in automated_brands');
    }

    const brandId = brandData.id;
    const vendorName = 'Paramount 3D';

    // Mark brand as syncing
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true })
      .eq('id', brandId);

    // Filter seed data
    const filteredProducts = PARAMOUNT_SEED_DATA.filter(entry => {
      if (shouldExcludeParamountProduct(entry.filamentLine, entry.color)) {
        console.log(`[Paramount] Excluded: ${entry.filamentLine} - ${entry.color}`);
        stats.skipped++;
        return false;
      }
      return true;
    });

    stats.discovered = filteredProducts.length;
    console.log(`[Paramount] Filtered: ${filteredProducts.length} products from ${PARAMOUNT_SEED_DATA.length} total`);

    // ========================================================================
    // STEP 2: SAFE DELETE (if threshold met)
    // ========================================================================
    const SAFE_DELETE_THRESHOLD = 50;

    if (filteredProducts.length >= SAFE_DELETE_THRESHOLD) {
      console.log(`[Paramount] Step 2: Safe delete (${filteredProducts.length} >= ${SAFE_DELETE_THRESHOLD} threshold)...`);

      const { data: existingProducts, error: countError } = await supabase
        .from('filaments')
        .select('id')
        .ilike('vendor', vendorName);

      if (!countError && existingProducts) {
        const existingCount = existingProducts.length;
        console.log(`[Paramount] Deleting ${existingCount} existing products...`);

        const { error: deleteError } = await supabase
          .from('filaments')
          .delete()
          .ilike('vendor', vendorName);

        if (deleteError) {
          console.error('[Paramount] Delete error:', deleteError.message);
        } else {
          stats.deleted = existingCount;
          console.log(`[Paramount] Deleted ${existingCount} products successfully`);
        }
      }
    } else {
      console.log(`[Paramount] Step 2: Skipping delete (${filteredProducts.length} < ${SAFE_DELETE_THRESHOLD} threshold)`);
    }

    // ========================================================================
    // STEP 3: TRANSFORM AND PREPARE PRODUCTS
    // ========================================================================
    console.log('[Paramount] Step 3: Transforming products...');

    const productsToInsert = [];

    for (const entry of filteredProducts) {
      try {
        // Normalize material
        const { material, isAbrasive, requiresEnclosure } = normalizeParamountMaterial(entry.filamentLine);
        const finalMaterial = entry.material || material;

        // Get print settings
        const printSettings = getParamountPrintSettings(finalMaterial);

        // Get TDS URL
        const tdsUrl = getParamountTdsUrl(finalMaterial);

        // Get finish type
        const finishType = extractParamountFinishType(entry.filamentLine);

        // Generate product line ID
        const productLineId = generateParamountProductLineIdFromSeed(finalMaterial, entry.color);

        // Get color hex
        const colorHex = entry.colorHex && entry.colorHex !== 'N/A' 
          ? entry.colorHex 
          : getParamountColorHexFromSeed(entry.color);

        // Generate unique product ID
        const productId = `paramount-${finalMaterial.toLowerCase()}-${entry.color.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        // Build product title
        const productTitle = `${finalMaterial} - ${entry.color}`;

        // Get default price
        const price = getParamountDefaultPrice(finalMaterial);

        const product = {
          product_id: productId,
          product_title: productTitle,
          vendor: vendorName,
          brand_id: brandId,
          material: finalMaterial,
          product_line_id: productLineId,
          finish_type: finishType,
          color_family: entry.color,
          color_hex: colorHex,
          product_url: entry.productUrl,
          featured_image: entry.imageUrl || null,
          tds_url: tdsUrl,
          variant_price: price,
          variant_available: true,
          diameter_nominal_mm: PARAMOUNT_STORE_INFO.default_diameter,
          net_weight_g: PARAMOUNT_STORE_INFO.default_weight,
          nozzle_temp_min_c: printSettings?.nozzle_temp_min_c || null,
          nozzle_temp_max_c: printSettings?.nozzle_temp_max_c || null,
          bed_temp_min_c: printSettings?.bed_temp_min_c || null,
          bed_temp_max_c: printSettings?.bed_temp_max_c || null,
          is_nozzle_abrasive: isAbrasive,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        productsToInsert.push(product);
      } catch (error) {
        console.error(`[Paramount] Error transforming ${entry.color}:`, error);
        stats.errors++;
      }
    }

    console.log(`[Paramount] Prepared ${productsToInsert.length} products for insert`);

    // ========================================================================
    // STEP 4: BATCH INSERT
    // ========================================================================
    console.log('[Paramount] Step 4: Batch inserting products...');

    const BATCH_SIZE = 50;
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      
      const { error: insertError } = await supabase
        .from('filaments')
        .insert(batch);

      if (insertError) {
        console.error(`[Paramount] Batch ${Math.floor(i / BATCH_SIZE) + 1} insert error:`, insertError.message);
        stats.errors += batch.length;
      } else {
        stats.created += batch.length;
        console.log(`[Paramount] Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} products`);
      }
    }

    // ========================================================================
    // STEP 5: FIX DUPLICATE HEX CODES
    // ========================================================================
    console.log('[Paramount] Step 5: Checking for duplicate hex codes...');

    try {
      const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', {
        p_vendor: vendorName,
      });

      if (duplicates && duplicates.length > 0) {
        console.log(`[Paramount] Found ${duplicates.length} products with duplicate hex codes`);
        
        // Group by product_line_id and color_hex
        const groups = new Map<string, typeof duplicates>();
        for (const dup of duplicates) {
          const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(dup);
        }

        let fixed = 0;
        for (const [, group] of groups) {
          if (group.length <= 1) continue;
          
          // Keep first one as-is, adjust others
          for (let j = 1; j < group.length; j++) {
            const product = group[j];
            if (!product.color_hex) continue;
            
            // Adjust brightness slightly
            const originalHex = product.color_hex.replace('#', '');
            let r = parseInt(originalHex.substring(0, 2), 16);
            let g = parseInt(originalHex.substring(2, 4), 16);
            let b = parseInt(originalHex.substring(4, 6), 16);
            
            const adjustment = j * 2;
            r = Math.min(255, Math.max(0, r + (j % 2 === 0 ? adjustment : -adjustment)));
            g = Math.min(255, Math.max(0, g + (j % 2 === 0 ? adjustment : -adjustment)));
            b = Math.min(255, Math.max(0, b + (j % 2 === 0 ? adjustment : -adjustment)));
            
            const adjustedHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
            
            await supabase
              .from('filaments')
              .update({ color_hex: adjustedHex })
              .eq('id', product.id);
            
            fixed++;
          }
        }
        
        console.log(`[Paramount] Fixed ${fixed} duplicate hex codes`);
      } else {
        console.log('[Paramount] No duplicate hex codes found');
      }
    } catch (error) {
      console.error('[Paramount] Error fixing duplicates:', error);
    }

    // ========================================================================
    // STEP 6: UPDATE BRAND STATISTICS
    // ========================================================================
    console.log('[Paramount] Step 6: Updating brand statistics...');

    // Get counts
    const { count: totalCount } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', vendorName);

    const { count: withPrices } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', vendorName)
      .not('variant_price', 'is', null);

    const { count: withImages } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', vendorName)
      .not('featured_image', 'is', null);

    const { count: withTds } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', vendorName)
      .not('tds_url', 'is', null);

    const { count: withColorHex } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', vendorName)
      .not('color_hex', 'is', null);

    const { count: withProductLineId } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', vendorName)
      .not('product_line_id', 'is', null);

    // Update brand
    await supabase
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
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', brandId);

    const duration = (Date.now() - startTime) / 1000;

    console.log('='.repeat(60));
    console.log('PARAMOUNT 3D SYNC COMPLETE');
    console.log(`Duration: ${duration.toFixed(1)}s`);
    console.log(`Discovered: ${stats.discovered}`);
    console.log(`Created: ${stats.created}`);
    console.log(`Deleted: ${stats.deleted}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Product Lines: ${withProductLineId || 0}`);
    console.log('='.repeat(60));

    return new Response(
      JSON.stringify({
        success: stats.errors === 0,
        message: `Paramount 3D sync complete: ${stats.created} products created`,
        stats,
        counts: {
          total: totalCount,
          withPrices,
          withImages,
          withTds,
          withColorHex,
          withProductLineId,
        },
        duration_seconds: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Paramount] Fatal error:', error);

    // Try to clear scraping flag
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('automated_brands')
        .update({ scraping_active: false })
        .eq('brand_slug', 'paramount-3d');
    } catch {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: String(error),
        stats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
