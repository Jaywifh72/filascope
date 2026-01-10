/**
 * FUSION FILAMENTS CSV-SEEDED SYNC FUNCTION
 * 
 * CSV-seeded sync pipeline for Odoo 16 platform
 * Science-themed colors, AMS compatibility, cardboard spools
 * CRITICAL: HT-PET+ normalized to PETG, HTPLA+ to PLA
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichFusionProduct,
  getFusionColorHex,
} from '../_shared/fusion-filaments-defaults.ts';
import {
  FUSION_FILAMENTS_PRODUCT_SEED,
  normalizeMaterialFromSeed,
  getProductLineFromMaterial,
  shouldExcludeProduct,
} from '../_shared/fusion-filaments-seed.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  seedTotal: number;
  filtered: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = { seedTotal: 0, filtered: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    const { cleanSlate = false } = await req.json().catch(() => ({}));

    console.log('🧪 Starting Fusion Filaments CSV-seeded sync...', { cleanSlate });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', 'fusion-filaments')
      .single();

    const brandId = brand?.id || null;
    const vendorName = 'Fusion Filaments';

    // =========================================================================
    // STEP 1: Filter and prepare products from seed
    // =========================================================================
    console.log('📋 Step 1: Processing CSV seed data...');
    
    stats.seedTotal = FUSION_FILAMENTS_PRODUCT_SEED.length;
    console.log(`   Total products in seed: ${stats.seedTotal}`);
    
    // Filter out Gift Cards, Mystery, Purge products
    const validProducts = FUSION_FILAMENTS_PRODUCT_SEED.filter(p => {
      if (shouldExcludeProduct(p)) {
        stats.filtered++;
        return false;
      }
      return true;
    });
    
    console.log(`   Valid filament products: ${validProducts.length}`);
    console.log(`   Filtered out: ${stats.filtered} (Gift Cards, Mystery, Purge)`);

    // Safe delete threshold - must have at least 100 products before deleting
    const SAFE_DELETE_THRESHOLD = 100;
    
    if (validProducts.length < SAFE_DELETE_THRESHOLD) {
      throw new Error(`Safe delete threshold not met: ${validProducts.length} < ${SAFE_DELETE_THRESHOLD}`);
    }

    // =========================================================================
    // STEP 2: Clean slate delete (if requested)
    // =========================================================================
    if (cleanSlate) {
      console.log('🧹 Step 2: Clean slate - deleting existing products...');
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', '%fusion%filament%')
        .select('id');
      console.log(`   Deleted ${deleted?.length || 0} existing products`);
    }

    // =========================================================================
    // STEP 3: Process and upsert products
    // =========================================================================
    console.log('✨ Step 3: Upserting products from seed...');

    for (const product of validProducts) {
      try {
        // Generate product ID from URL
        const urlParts = product.productUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        const productId = lastPart.replace(/-\d+$/, '').toLowerCase();
        
        // Normalize material
        const normalizedMaterial = normalizeMaterialFromSeed(product.material);
        const productLine = getProductLineFromMaterial(product.material);
        
        // Get color hex
        const colorHex = getFusionColorHex(product.color);
        
        // Apply enrichments
        const enrichment = enrichFusionProduct(
          product.filamentName,
          normalizedMaterial,
          undefined,
          undefined,
          undefined,
          product.color
        );

        // Check for existing product
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .eq('product_url', product.productUrl)
          .maybeSingle();

        // Build filament record
        const filamentRecord: Record<string, unknown> = {
          product_id: productId,
          product_title: product.filamentName,
          vendor: vendorName,
          brand_id: brandId,
          product_url: product.productUrl,
          featured_image: product.imageUrl,
          material: normalizedMaterial,
          finish_type: enrichment.finishType,
          product_line_id: `fusionfilaments__${normalizedMaterial.toLowerCase()}__${productLine}`,
          color_family: product.color,
          color_hex: colorHex || enrichment.colorHex,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          diameter_nominal_mm: 1.75,
          net_weight_g: 1000,
          spool_material: 'Cardboard',
          spool_ams_fit: true,
          high_speed_capable: enrichment.highSpeedCapable,
          auto_created: !existing,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        // Remove null values
        for (const key of Object.keys(filamentRecord)) {
          if (filamentRecord[key] === null || filamentRecord[key] === undefined) {
            delete filamentRecord[key];
          }
        }

        if (existing) {
          const { error } = await supabase
            .from('filaments')
            .update(filamentRecord)
            .eq('id', existing.id);
          if (error) {
            console.error(`   Failed to update ${productId}:`, error.message);
            stats.failed++;
          } else {
            stats.updated++;
          }
        } else {
          const { error } = await supabase
            .from('filaments')
            .insert(filamentRecord);
          if (error) {
            console.error(`   Failed to insert ${productId}:`, error.message);
            stats.failed++;
          } else {
            stats.created++;
          }
        }
      } catch (err) {
        console.error(`   Error processing product:`, err);
        stats.failed++;
      }
    }

    // =========================================================================
    // STEP 4: Finalize
    // =========================================================================
    console.log('🏁 Step 4: Finalizing sync...');

    if (brandId) {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'fusion-filaments' });
      await supabase
        .from('automated_brands')
        .update({ 
          scraping_active: false,
          last_scrape_at: new Date().toISOString(),
        })
        .eq('id', brandId);
    }

    // Check for duplicate hex codes
    try {
      await supabase.rpc('find_duplicate_hexes', { p_vendor: vendorName });
    } catch (err) {
      console.warn('   Warning: Could not check for duplicate hex codes:', err);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('✅ Fusion Filaments sync complete!');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Seed Total: ${stats.seedTotal}`);
    console.log(`   Filtered: ${stats.filtered}`);
    console.log(`   Created: ${stats.created}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Failed: ${stats.failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration: `${duration}s`,
        message: `Synced ${stats.created + stats.updated} products from CSV seed`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fusion Filaments sync failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
