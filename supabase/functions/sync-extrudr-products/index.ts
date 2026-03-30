import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EXTRUDR_PRODUCT_SEED, EXTRUDR_SEED_STATS } from '../_shared/extrudr-seed.ts';
import {
  enrichExtrudrProduct,
  EXTRUDR_STORE_INFO,
  generateExtrudrProductLineId,
  EXTRUDR_DEFAULT_PRICES,
} from '../_shared/extrudr-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = {
    discovered: EXTRUDR_SEED_STATS.totalProducts,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    // CSV-seeded brands REQUIRE clean slate for insert pattern to work
    const cleanSlate = body.cleanSlate !== false; // Default to true
    // Ignore limit for CSV-seeded brands - always process full catalog
    
    console.log(`[Extrudr Sync] Starting CSV-seeded sync. Clean slate: ${cleanSlate}`);
    console.log(`[Extrudr Sync] Seed stats: ${EXTRUDR_SEED_STATS.totalProducts} products, ${EXTRUDR_SEED_STATS.productLines} lines`);

    // =========================================================================
    // STEP 1: CLEAN SLATE DELETE (Required for insert pattern)
    // =========================================================================
    
    if (cleanSlate) {
      console.log('[Step 1] Clean slate mode - deleting existing Extrudr products');
      
      // Safety check: only delete if we have enough seed products
      const SAFE_DELETE_THRESHOLD = 50;
      if (EXTRUDR_SEED_STATS.totalProducts < SAFE_DELETE_THRESHOLD) {
        throw new Error(`Safety check failed: Only ${EXTRUDR_SEED_STATS.totalProducts} products in seed (need ${SAFE_DELETE_THRESHOLD}+)`);
      }
      
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'extrudr');
      
      if (deleteError) {
        console.error('[Step 1] Delete error:', deleteError);
        stats.errors.push(`Clean slate failed: ${deleteError.message}`);
        throw new Error(`Cannot proceed without clean slate: ${deleteError.message}`);
      } else {
        console.log(`[Step 1] Deleted ${count || 0} existing Extrudr products`);
      }
    } else {
      console.warn('[Step 1] WARNING: CSV-seeded brands work best with cleanSlate=true');
    }

    // =========================================================================
    // STEP 2: PROCESS SEED DATA
    // =========================================================================
    
    console.log('[Step 2] Processing seed data');
    
    const processedIds = new Set<string>();
    const productsToInsert: any[] = [];
    
    for (const seed of EXTRUDR_PRODUCT_SEED) {
      try {
        // Generate product ID from filament line + color
        const colorSlug = seed.color.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const lineSlug = seed.filament.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const productId = `extrudr-${lineSlug}-${colorSlug}`;
        
        // Skip duplicates within seed
        if (processedIds.has(productId)) {
          stats.skipped++;
          continue;
        }
        processedIds.add(productId);
        
        // Build title: "Extrudr {Filament} - {Color}"
        const productTitle = `Extrudr ${seed.filament} - ${seed.color.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
        
        // Get enrichment data
        const enrichment = enrichExtrudrProduct(productTitle, seed.color);
        
        // Generate product_line_id
        const productLineId = generateExtrudrProductLineId(seed.filament);
        
        // Get default price from mapping based on material
        const defaultPrice = EXTRUDR_DEFAULT_PRICES[enrichment.material] || 29.90;
        
        const filamentData = {
          product_id: productId,
          product_title: productTitle,
          vendor: EXTRUDR_STORE_INFO.vendor,
          product_url: seed.productUrl,
          featured_image: seed.imageUrl || null,
          variant_price: defaultPrice,
          price_eur: defaultPrice,
          variant_available: true,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: productLineId,
          // Use #FEFEFE for transparent to distinguish from white (#FFFFFF)
          color_hex: (() => {
            const colorLower = seed.color.toLowerCase().trim();
            if (colorLower === 'transparent') return '#FEFEFE';
            if (colorLower === 'white') return '#FFFFFF';
            return seed.colorHex || '#FFFFFF';
          })(),
          color_family: seed.color,
          tds_url: enrichment.tdsUrl,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          is_nozzle_abrasive: enrichment.isAbrasive,
          high_speed_capable: false,
          diameter_nominal_mm: EXTRUDR_STORE_INFO.defaultDiameter,
          net_weight_g: EXTRUDR_STORE_INFO.defaultWeight,
          spool_material: EXTRUDR_STORE_INFO.spoolMaterial,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };
        
        productsToInsert.push(filamentData);
        
      } catch (err) {
        console.error(`[Step 2] Error processing ${seed.filament} - ${seed.color}:`, err);
        stats.failed++;
        stats.errors.push(`Process error: ${seed.filament} - ${seed.color}`);
      }
    }
    
    console.log(`[Step 2] Prepared ${productsToInsert.length} products for insert`);

    // =========================================================================
    // STEP 3: BATCH INSERT (Not upsert - uses delete-then-insert pattern)
    // =========================================================================
    
    console.log('[Step 3] Inserting products to database');
    
    // Batch insert in chunks of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      
      // Use insert (not upsert) since we already deleted existing products
      // This avoids the "no unique constraint" error on product_id
      const { error: insertError } = await supabase
        .from('filaments')
        .insert(batch);
      
      if (insertError) {
        console.error(`[Step 3] Batch insert error (${i}-${i + batch.length}):`, insertError);
        stats.failed += batch.length;
        stats.errors.push(`Batch insert failed: ${insertError.message}`);
      } else {
        stats.created += batch.length;
        console.log(`[Step 3] Inserted batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} products`);
      }
    }

    // =========================================================================
    // STEP 3.1: FIX NULL COLOR_HEX FOR WHITE/TRANSPARENT VARIANTS
    // =========================================================================
    
    console.log('[Step 3.1] Fixing NULL color_hex for white/transparent variants');
    
    const { data: nullHexProducts } = await supabase
      .from('filaments')
      .select('id, product_id, color_family')
      .ilike('vendor', 'extrudr')
      .is('color_hex', null);
    
    if (nullHexProducts && nullHexProducts.length > 0) {
      console.log(`[Step 3.1] Found ${nullHexProducts.length} products with NULL color_hex`);
      
      for (const product of nullHexProducts) {
        const colorLower = (product.color_family || '').toLowerCase().trim();
        // Use #FEFEFE for transparent to distinguish from white (#FFFFFF)
        let fixedHex = '#CCCCCC';
        if (colorLower === 'transparent') fixedHex = '#FEFEFE';
        else if (['white', 'natural', 'nature'].includes(colorLower)) fixedHex = '#FFFFFF';
        
        await supabase
          .from('filaments')
          .update({ color_hex: fixedHex })
          .eq('id', product.id);
        
        console.log(`[Step 3.1] Fixed ${product.product_id}: ${colorLower} → ${fixedHex}`);
      }
    } else {
      console.log('[Step 3.1] No NULL color_hex products found');
    }

    // =========================================================================
    // STEP 3.5: CACHE IMAGES TO LOCAL STORAGE
    // Skip when triggered by orchestrator to avoid timeouts
    // =========================================================================
    
    const isOrchestratorTriggered = body.triggeredBy === 'orchestrator';
    const elapsedSoFar = Date.now() - startTime;
    const skipImageCache = isOrchestratorTriggered || elapsedSoFar > 60_000;
    
    if (skipImageCache) {
      console.log(`[Step 3.5] Skipping image caching (orchestrator: ${isOrchestratorTriggered}, elapsed: ${Math.round(elapsedSoFar/1000)}s)`);
    } else {
      console.log('[Step 3.5] Caching images to local storage');
    
    let imagesCached = 0;
    let imagesFailed = 0;
    let imagesPlaceholder = 0;
    const storageBaseUrl = `${supabaseUrl}/storage/v1/object/public/filament-images`;
    const EXTRUDR_PLACEHOLDER = `${storageBaseUrl}/extrudr/placeholder.jpg`;
    
    // Helper: Try downloading with retries and alternate URL patterns
    const downloadWithRetry = async (originalUrl: string): Promise<Response | null> => {
      const headers = { 'User-Agent': 'Filascope-Sync/1.0' };
      
      // Try original URL first
      try {
        const response = await fetch(originalUrl, { headers });
        if (response.ok) return response;
      } catch (e) {
        console.warn(`[Step 3.5] Original URL failed: ${originalUrl}`);
      }
      
      // Try alternate URL patterns (different year folders in S3)
      const altPatterns = [
        originalUrl.replace('/2019/11/', '/2022/09/'),
        originalUrl.replace('/2019/11/', '/2020/11/'),
        originalUrl.replace('/2019/11/', '/2021/'),
        originalUrl.replace('201905_', ''),
      ];
      
      for (const altUrl of altPatterns) {
        if (altUrl === originalUrl) continue;
        try {
          const response = await fetch(altUrl, { headers });
          if (response.ok) {
            console.log(`[Step 3.5] Alternate URL worked: ${altUrl}`);
            return response;
          }
        } catch (e) {
          continue;
        }
      }
      
      return null;
    };
    
    // Query products that still have external image URLs
    const { data: productsNeedingImageCache } = await supabase
      .from('filaments')
      .select('id, product_id, featured_image')
      .ilike('vendor', 'extrudr')
      .not('featured_image', 'is', null);
    
    for (const product of productsNeedingImageCache || []) {
      // Skip if already cached locally
      if (product.featured_image?.includes('supabase.co/storage') || 
          product.featured_image?.includes(storageBaseUrl)) {
        continue;
      }
      
      try {
        // Download image with retry logic
        const imageResponse = await downloadWithRetry(product.featured_image);
        
        if (!imageResponse) {
          // All download attempts failed - use placeholder
          console.warn(`[Step 3.5] All downloads failed for ${product.product_id}, using placeholder`);
          await supabase
            .from('filaments')
            .update({ featured_image: EXTRUDR_PLACEHOLDER })
            .eq('id', product.id);
          imagesPlaceholder++;
          continue;
        }
        
        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        
        // Generate storage path: extrudr/{product_id}.{ext}
        const urlPath = product.featured_image.split('?')[0]; // Remove query params
        const fileExt = urlPath.split('.').pop() || 'jpg';
        const filePath = `extrudr/${product.product_id}.${fileExt}`;
        
        // Upload to storage bucket
        const { error: uploadError } = await supabase.storage
          .from('filament-images')
          .upload(filePath, imageBuffer, {
            contentType: imageResponse.headers.get('content-type') || 'image/jpeg',
            upsert: true
          });
        
        if (uploadError) {
          console.warn(`[Step 3.5] Upload failed for ${product.product_id}:`, uploadError.message);
          // Use placeholder on upload failure
          await supabase
            .from('filaments')
            .update({ featured_image: EXTRUDR_PLACEHOLDER })
            .eq('id', product.id);
          imagesPlaceholder++;
          continue;
        }
        
        // Get public URL and update database
        const { data: publicUrlData } = supabase.storage
          .from('filament-images')
          .getPublicUrl(filePath);
        
        await supabase
          .from('filaments')
          .update({ featured_image: publicUrlData.publicUrl })
          .eq('id', product.id);
        
        imagesCached++;
        
        // Small delay to avoid rate limiting (100ms between uploads)
        await new Promise(r => setTimeout(r, 100));
        
      } catch (err) {
        console.warn(`[Step 3.5] Image cache error for ${product.product_id}:`, err);
        // Use placeholder on any error
        await supabase
          .from('filaments')
          .update({ featured_image: EXTRUDR_PLACEHOLDER })
          .eq('id', product.id);
        imagesPlaceholder++;
      }
    }
    
    console.log(`[Step 3.5] Image caching complete: ${imagesCached} cached, ${imagesPlaceholder} placeholders, ${imagesFailed} failed`);
    } // end of !skipImageCache

    // =========================================================================
    // STEP 4: FINALIZE
    // =========================================================================
    
    console.log('[Step 4] Finalizing sync');
    
    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'extrudr' });
    await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'extrudr' });
    
    // Check for duplicate hex codes
    const { data: dupes } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Extrudr' });
    if (dupes && dupes.length > 0) {
      console.log(`[Step 4] Found ${dupes.length} duplicate hex entries - fixing`);
      // Auto-fix duplicates by slightly adjusting hex values
      for (const dupe of dupes) {
        const adjustment = Math.floor(Math.random() * 10) + 1;
        const adjustedHex = dupe.color_hex ? 
          `#${(parseInt(dupe.color_hex.slice(1), 16) + adjustment).toString(16).padStart(6, '0').toUpperCase()}` : 
          null;
        if (adjustedHex) {
          await supabase
            .from('filaments')
            .update({ color_hex: adjustedHex })
            .eq('id', dupe.id);
        }
      }
    }
    
    // Mark brand as not actively scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'extrudr');
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`[Extrudr Sync] Complete in ${duration}s:`, stats);
    
    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration,
        seedStats: EXTRUDR_SEED_STATS,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Extrudr Sync] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stats,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
