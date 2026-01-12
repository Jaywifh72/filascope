/**
 * NUMAKERS CSV-SEEDED SYNC PIPELINE
 * 
 * Architecture: CSV-seeded sync (like Eryone, NinjaTek, Kingroon)
 * 
 * Steps:
 * 1. Load products from NUMAKERS_SEED_DATA constant
 * 2. Filter excluded products (NuBox Surplus, Hueforge Packs, Warehouse Clearance)
 * 3. Apply brand-specific enrichments
 * 4. Safe delete existing products (if threshold met)
 * 5. Batch insert all products
 * 6. Fix duplicate hex codes
 * 
 * Platform: Shopify (numakers.com)
 * Currency: USD
 * Region: US
 * 
 * Key Features:
 * - 125+ products across 13 product lines
 * - Creative color names (Thanos Purple, Ryobix Green)
 * - High-speed PETG (PETG-HS)
 * - PLA Specialty lines (Silk, Matte, Starlight, Glow, Wood, CF, Marble)
 * - No TDS PDFs - uses Cheat Sheet blog posts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  NUMAKERS_SEED_DATA,
  enrichNumakersProduct,
  shouldExcludeNumakersProduct,
  getNumakersDefaultPrice,
  cleanNumakersTitle,
} from '../_shared/numakers-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  excluded: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[NUMAKERS-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[NUMAKERS-SYNC] 🚀 NUMAKERS CSV-SEEDED SYNC STARTED');
  console.log('[NUMAKERS-SYNC] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options (limit is ignored for CSV-seeded brands)
    let cleanSlate = false;
    try {
      const body = await req.json();
      cleanSlate = body.cleanSlate || false;
    } catch {}

    const stats: SyncStats = {
      discovered: NUMAKERS_SEED_DATA.length,
      excluded: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    console.log(`[NUMAKERS-SYNC] CSV Seed contains ${stats.discovered} products`);

    // ============================================================================
    // STEP 1: GET BRAND ID
    // ============================================================================
    
    console.log('[NUMAKERS-SYNC] Step 1: Getting brand ID...');
    
    const { data: brand, error: brandError } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'numakers')
      .maybeSingle();
    
    if (brandError) {
      console.error('[NUMAKERS-SYNC] Error fetching brand:', brandError);
    }
    
    const brandId = brand?.id || null;
    console.log(`[NUMAKERS-SYNC] Brand ID: ${brandId || 'not found'}`);
    
    // Mark brand as actively scraping
    if (brandId) {
      await supabase
        .from('automated_brands')
        .update({ 
          scraping_active: true,
          last_scrape_at: new Date().toISOString()
        })
        .eq('id', brandId);
    }

    // ============================================================================
    // STEP 2: FILTER AND PROCESS PRODUCTS
    // ============================================================================
    
    console.log('[NUMAKERS-SYNC] Step 2: Processing CSV seed data...');
    
    const productsToInsert: any[] = [];
    const productLineCount: Record<string, number> = {};
    const materialBreakdown: Record<string, number> = {};
    
    for (const seed of NUMAKERS_SEED_DATA) {
      // Check for exclusions
      if (shouldExcludeNumakersProduct(seed.filamentLine) || shouldExcludeNumakersProduct(seed.color)) {
        stats.excluded++;
        console.log(`[NUMAKERS-SYNC] Excluded: ${seed.filamentLine} - ${seed.color}`);
        continue;
      }
      
      // Apply enrichments
      const enriched = enrichNumakersProduct(seed);
      
      // Generate product ID
      const colorSlug = seed.color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const productId = `numakers-${enriched.productLineId.replace('numakers__', '').replace(/_/g, '-')}-${colorSlug}`;
      
      // Clean title for display
      const displayTitle = `${cleanNumakersTitle(seed.filamentLine)} - ${seed.color}`;
      
      // Get default price
      const price = getNumakersDefaultPrice(seed.filamentLine);
      
      // Ensure hex has # prefix
      const colorHex = enriched.colorHex ? 
        (enriched.colorHex.startsWith('#') ? enriched.colorHex : `#${enriched.colorHex}`) : 
        null;
      
      const filamentData = {
        product_id: productId,
        product_title: displayTitle,
        vendor: 'Numakers',
        brand_id: brandId,
        material: enriched.material,
        product_line_id: enriched.productLineId,
        finish_type: enriched.finishType,
        color_hex: colorHex,
        color_family: seed.color,
        variant_price: price,
        variant_available: true,
        product_url: seed.productUrl,
        featured_image: seed.imageUrl,
        tds_url: enriched.cheatSheetUrl,
        nozzle_temp_min_c: enriched.nozzleTempMin,
        nozzle_temp_max_c: enriched.nozzleTempMax,
        bed_temp_min_c: enriched.bedTempMin,
        bed_temp_max_c: enriched.bedTempMax,
        print_speed_max_mms: enriched.printSpeedMax,
        net_weight_g: enriched.weightKg * 1000,
        diameter_nominal_mm: 1.75,
        is_nozzle_abrasive: enriched.isAbrasive,
        high_speed_capable: enriched.highSpeedCapable,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
        auto_created: true,
        auto_updated: false,
      };
      
      productsToInsert.push(filamentData);
      
      // Track stats
      productLineCount[enriched.productLineId] = (productLineCount[enriched.productLineId] || 0) + 1;
      materialBreakdown[enriched.material] = (materialBreakdown[enriched.material] || 0) + 1;
    }
    
    console.log(`[NUMAKERS-SYNC] Prepared ${productsToInsert.length} products for insert`);
    console.log(`[NUMAKERS-SYNC] Excluded ${stats.excluded} products (NuBox/Hueforge/Clearance)`);
    console.log(`[NUMAKERS-SYNC] Product lines: ${Object.keys(productLineCount).length}`);
    console.log('[NUMAKERS-SYNC] Material breakdown:', materialBreakdown);

    // ============================================================================
    // STEP 3: SAFE DELETE EXISTING PRODUCTS
    // ============================================================================
    
    const SAFE_DELETE_THRESHOLD = 50;
    
    if (productsToInsert.length >= SAFE_DELETE_THRESHOLD) {
      console.log(`[NUMAKERS-SYNC] Step 3: Safe delete (${productsToInsert.length} >= ${SAFE_DELETE_THRESHOLD} threshold)...`);
      
      const { error: deleteError, count: deleteCount } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'numakers');
      
      if (deleteError) {
        console.error('[NUMAKERS-SYNC] Delete error:', deleteError);
        stats.errors++;
      } else {
        console.log(`[NUMAKERS-SYNC] Deleted ${deleteCount || 'unknown'} existing Numakers products`);
      }
    } else {
      console.log(`[NUMAKERS-SYNC] Step 3: Skipping delete (${productsToInsert.length} < ${SAFE_DELETE_THRESHOLD} threshold)`);
    }

    // ============================================================================
    // STEP 4: BATCH INSERT PRODUCTS
    // ============================================================================
    
    console.log('[NUMAKERS-SYNC] Step 4: Batch inserting products...');
    
    const BATCH_SIZE = 50;
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      
      const { error: insertError } = await supabase
        .from('filaments')
        .insert(batch);
      
      if (insertError) {
        console.error(`[NUMAKERS-SYNC] Batch ${Math.floor(i / BATCH_SIZE) + 1} insert error:`, insertError);
        stats.errors += batch.length;
      } else {
        stats.created += batch.length;
        console.log(`[NUMAKERS-SYNC] Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} products`);
      }
    }

    // ============================================================================
    // STEP 5: FIX DUPLICATE HEX CODES
    // ============================================================================
    
    console.log('[NUMAKERS-SYNC] Step 5: Fixing duplicate hex codes...');
    
    try {
      const { data: duplicates, error: dupError } = await supabase.rpc('find_duplicate_hexes', {
        p_vendor: 'numakers'
      });
      
      if (dupError) {
        console.log('[NUMAKERS-SYNC] Note: find_duplicate_hexes RPC not available');
      } else if (duplicates && duplicates.length > 0) {
        console.log(`[NUMAKERS-SYNC] Found ${duplicates.length} duplicate hex codes, fixing...`);
        
        // Group by product_line_id and hex
        const groups: Record<string, typeof duplicates> = {};
        for (const dup of duplicates) {
          const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(dup);
        }
        
        let fixed = 0;
        for (const [, items] of Object.entries(groups)) {
          // Skip first item (keep original), adjust others
          for (let i = 1; i < items.length; i++) {
            const item = items[i];
            const originalHex = item.color_hex?.replace('#', '') || 'FFFFFF';
            
            // Modify hex slightly
            const hexNum = parseInt(originalHex, 16);
            const newHexNum = (hexNum + i * 17) % 0xFFFFFF;
            const newHex = `#${newHexNum.toString(16).padStart(6, '0').toUpperCase()}`;
            
            const { error } = await supabase
              .from('filaments')
              .update({ color_hex: newHex })
              .eq('id', item.id);
            
            if (!error) fixed++;
          }
        }
        console.log(`[NUMAKERS-SYNC] Fixed ${fixed} duplicate hex codes`);
      } else {
        console.log('[NUMAKERS-SYNC] No duplicate hex codes found');
      }
    } catch (error) {
      console.log('[NUMAKERS-SYNC] Hex fix skipped:', error);
    }

    // ============================================================================
    // STEP 6: UPDATE BRAND STATS
    // ============================================================================
    
    console.log('[NUMAKERS-SYNC] Step 6: Updating brand statistics...');
    
    if (brandId) {
      // Get final counts
      const { count: totalProducts } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .ilike('vendor', 'numakers');
      
      const { count: productsWithImages } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .ilike('vendor', 'numakers')
        .not('featured_image', 'is', null);
      
      const { count: productsWithPrices } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .ilike('vendor', 'numakers')
        .not('variant_price', 'is', null);
      
      const { count: productsWithHex } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .ilike('vendor', 'numakers')
        .not('color_hex', 'is', null);
      
      await supabase
        .from('automated_brands')
        .update({
          scraping_active: false,
          product_count: totalProducts || 0,
          active_product_count: totalProducts || 0,
          products_created: stats.created,
          products_updated: stats.updated,
          products_with_images: productsWithImages || 0,
          products_with_prices: productsWithPrices || 0,
          products_with_color_hex: productsWithHex || 0,
          last_error: stats.errors > 0 ? `${stats.errors} errors during sync` : null,
          last_error_at: stats.errors > 0 ? new Date().toISOString() : null,
        })
        .eq('id', brandId);
      
      console.log(`[NUMAKERS-SYNC] Updated brand stats: ${totalProducts} products, ${productsWithHex} with hex, ${productsWithImages} with images`);
    }

    // ============================================================================
    // DONE
    // ============================================================================
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('[NUMAKERS-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[NUMAKERS-SYNC] ✅ SYNC COMPLETED in ${duration}s`);
    console.log(`[NUMAKERS-SYNC] Discovered: ${stats.discovered}, Excluded: ${stats.excluded}`);
    console.log(`[NUMAKERS-SYNC] Created: ${stats.created}, Errors: ${stats.errors}`);
    console.log(`[NUMAKERS-SYNC] Product Lines: ${Object.keys(productLineCount).length}`);
    console.log('[NUMAKERS-SYNC] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify({
      success: stats.errors === 0,
      duration,
      stats: {
        discovered: stats.discovered,
        excluded: stats.excluded,
        created: stats.created,
        updated: stats.updated,
        errors: stats.errors,
        productLines: Object.keys(productLineCount).length,
      },
      productLineBreakdown: productLineCount,
      materialBreakdown,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NUMAKERS-SYNC] ❌ Fatal error:', error);
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
