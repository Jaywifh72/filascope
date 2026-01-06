// ELEGOO CA STORE SYNC (CSV-SEEDED)
// Platform: Shopify (ca.elegoo.com)
// Sync Type: CSV seed from elegoo-defaults.ts (~130 products)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichElegooProduct,
  ELEGOO_STORE_INFO,
  ELEGOO_PRODUCT_SEED,
  shouldExcludeProduct,
  cleanColorName,
} from '../_shared/elegoo-defaults.ts';

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
  filtered: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stats: SyncStats = {
    discovered: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    filtered: 0,
  };

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request options
    let cleanSlate = false;
    let limit: number | null = null;
    
    try {
      const body = await req.json();
      cleanSlate = body.cleanSlate === true;
      limit = body.limit ? parseInt(body.limit) : null;
    } catch {
      // No body or invalid JSON - use defaults
    }

    console.log(`Starting Elegoo CA sync - cleanSlate: ${cleanSlate}, limit: ${limit}`);

    // STEP 1: Optional clean slate - delete existing Elegoo products
    if (cleanSlate) {
      console.log('Clean slate mode: Deleting existing Elegoo products...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', 'Elegoo');
      
      if (deleteError) {
        console.error('Error deleting existing products:', deleteError);
      } else {
        console.log('Deleted existing Elegoo products');
      }
    }

    // STEP 2: Fetch existing products for deduplication
    const { data: existingProducts } = await supabase
      .from('filaments')
      .select('product_id')
      .eq('vendor', 'Elegoo');
    
    const existingIds = new Set(existingProducts?.map(p => p.product_id) || []);
    console.log(`Found ${existingIds.size} existing Elegoo products`);

    // STEP 3: Process CSV seed data
    const productsToInsert: any[] = [];
    let processedCount = 0;

    for (const seed of ELEGOO_PRODUCT_SEED) {
      if (limit && processedCount >= limit) break;
      
      stats.discovered++;
      
      // Check exclusion (bundles, defaults)
      if (shouldExcludeProduct(seed.color, seed.filamentLine)) {
        stats.filtered++;
        continue;
      }
      
      // Clean color name
      const cleanedColor = cleanColorName(seed.color);
      
      // Enrich product data
      const enriched = enrichElegooProduct(seed.material, seed.filamentLine, cleanedColor);
      
      // Generate unique product ID
      const productId = `elegoo-ca-${seed.filamentLine.toLowerCase().replace(/\s+/g, '-')}-${cleanedColor.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Skip if already exists (unless clean slate)
      if (!cleanSlate && existingIds.has(productId)) {
        stats.skipped++;
        continue;
      }
      
      // Build product title
      const productTitle = `${seed.filamentLine} ${cleanedColor}`;
      
      // Get print settings
      const settings = enriched.printSettings;
      
      const filamentData = {
        product_id: productId,
        product_title: productTitle,
        vendor: ELEGOO_STORE_INFO.vendor,
        product_url: seed.productUrl,
        featured_image: seed.imageUrl,
        material: enriched.material,
        finish_type: enriched.finishType,
        product_line_id: enriched.productLineId,
        color_hex: enriched.colorHex,
        color_family: cleanedColor,
        diameter_nominal_mm: ELEGOO_STORE_INFO.defaultDiameter,
        net_weight_g: ELEGOO_STORE_INFO.defaultWeight,
        nozzle_temp_min_c: settings?.nozzleTempMin || null,
        nozzle_temp_max_c: settings?.nozzleTempMax || null,
        bed_temp_min_c: settings?.bedTempMin || null,
        bed_temp_max_c: settings?.bedTempMax || null,
        is_nozzle_abrasive: enriched.isAbrasive,
        high_speed_capable: enriched.isHighSpeed,
        auto_created: true,
        auto_updated: true,
        sync_status: 'synced',
        last_scraped_at: new Date().toISOString(),
      };
      
      productsToInsert.push(filamentData);
      processedCount++;
    }

    console.log(`Prepared ${productsToInsert.length} products for insertion`);

    // STEP 4: Batch insert products
    if (productsToInsert.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batch = productsToInsert.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('filaments')
          .insert(batch);
        
        if (insertError) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
          stats.errors += batch.length;
        } else {
          stats.created += batch.length;
          console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} products`);
        }
      }
    }

    // STEP 5: Update automated_brands table
    const { error: brandUpdateError } = await supabase
      .from('automated_brands')
      .update({
        last_scrape_at: new Date().toISOString(),
        product_count: stats.created,
      })
      .eq('brand_slug', 'elegoo');

    if (brandUpdateError) {
      console.error('Error updating brand stats:', brandUpdateError);
    }

    // STEP 6: Update product counts via RPC
    try {
      await supabase.rpc('update_brand_product_counts');
    } catch (rpcError) {
      console.error('Error updating product counts:', rpcError);
    }

    // STEP 7: Fix duplicate hex codes
    try {
      const { data: duplicates } = await supabase
        .from('filaments')
        .select('id, color_hex')
        .eq('vendor', 'Elegoo')
        .not('color_hex', 'is', null);
      
      if (duplicates && duplicates.length > 0) {
        const hexCounts: Record<string, string[]> = {};
        for (const prod of duplicates) {
          const hex = prod.color_hex?.toUpperCase();
          if (hex) {
            if (!hexCounts[hex]) hexCounts[hex] = [];
            hexCounts[hex].push(prod.id);
          }
        }
        
        // Adjust duplicates with slight variation
        for (const [hex, ids] of Object.entries(hexCounts)) {
          if (ids.length > 1) {
            for (let i = 1; i < ids.length; i++) {
              const variation = Math.min(i * 2, 15);
              const r = parseInt(hex.slice(0, 2), 16);
              const g = parseInt(hex.slice(2, 4), 16);
              const b = parseInt(hex.slice(4, 6), 16);
              const newR = Math.min(255, r + variation).toString(16).padStart(2, '0');
              const newG = Math.min(255, g + variation).toString(16).padStart(2, '0');
              const newB = Math.min(255, b + variation).toString(16).padStart(2, '0');
              const newHex = `${newR}${newG}${newB}`.toUpperCase();
              
              await supabase
                .from('filaments')
                .update({ color_hex: newHex })
                .eq('id', ids[i]);
            }
          }
        }
      }
    } catch (hexError) {
      console.error('Error fixing hex codes:', hexError);
    }

    const summary = {
      success: true,
      brand: 'Elegoo',
      source: 'CSV Seed (ca.elegoo.com)',
      stats,
      message: `Synced ${stats.created} Elegoo products from CSV seed`,
    };

    console.log('Sync complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        stats,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
