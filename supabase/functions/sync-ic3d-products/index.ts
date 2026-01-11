import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { IC3D_PRODUCT_SEED, getIC3DDefaultPrice } from '../_shared/ic3d-seed.ts';
import { enrichIC3DProduct, getIC3DColorHex, generateIC3DProductLineId } from '../_shared/ic3d-defaults.ts';

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
  deleted: number;
}

// Safe delete threshold - prevents accidental data loss
const SAFE_DELETE_THRESHOLD = 30;

/**
 * IC3D CSV-Seeded Sync Function
 * 
 * Premium USA-based manufacturer (Ohio) - 56 variants across 11 product lines
 * 
 * Architecture:
 * - CSV-seeded sync (ignores limit parameter)
 * - Delete-then-insert pattern with safe threshold
 * - One row per color variant
 * - WooCommerce platform (Avada theme)
 * 
 * Filtering constraints (enforced at CSV level):
 * - Only 1.75mm diameter
 * - Only 1kg spools
 * - No samples, bulk, or non-filament products
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = {
    discovered: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    deleted: 0,
  };

  try {
    // Parse options (limit is ignored for CSV-seeded syncs)
    const { cleanSlate = false } = await req.json().catch(() => ({}));
    
    console.log('[IC3D Sync] Starting CSV-seeded sync...', { cleanSlate, seedCount: IC3D_PRODUCT_SEED.length });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', 'ic3d-printers')
      .single();

    if (!brand) {
      throw new Error('IC3D brand not found in automated_brands (slug: ic3d-printers)');
    }

    console.log(`[IC3D Sync] Found brand: ${brand.brand_name} (${brand.id})`);

    // Mark as scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: true, 
        last_error: null 
      })
      .eq('id', brand.id);

    stats.discovered = IC3D_PRODUCT_SEED.length;

    // ========================================
    // STEP 1: SAFE DELETE (if clean slate requested)
    // ========================================
    if (cleanSlate && IC3D_PRODUCT_SEED.length >= SAFE_DELETE_THRESHOLD) {
      console.log('[IC3D Sync] Clean slate requested - deleting existing products...');
      
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', 'IC3D')
        .select('id');
      
      stats.deleted = deleted?.length || 0;
      console.log(`[IC3D Sync] Deleted ${stats.deleted} existing products`);
    } else if (cleanSlate) {
      console.log(`[IC3D Sync] Clean slate skipped - seed (${IC3D_PRODUCT_SEED.length}) below safe threshold (${SAFE_DELETE_THRESHOLD})`);
    }

    // ========================================
    // STEP 2: PROCESS CSV SEED
    // ========================================
    console.log('[IC3D Sync] Processing CSV seed data...');

    for (const seedProduct of IC3D_PRODUCT_SEED) {
      try {
        // Generate unique product ID from product line and color
        const colorSlug = seedProduct.color
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        const productLineSlug = seedProduct.productLine
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        const productId = `ic3d-${productLineSlug}-${colorSlug}`;

        // Get enrichment data
        const enriched = enrichIC3DProduct(
          seedProduct.filamentName,
          seedProduct.material,
          seedProduct.color,
          undefined
        );

        // Get color hex (prioritize enrichment, fallback to lookup)
        let colorHex = enriched.colorHex;
        if (!colorHex) {
          colorHex = getIC3DColorHex(seedProduct.color);
        }

        // Generate proper product line ID
        const productLineId = generateIC3DProductLineId(seedProduct.filamentName, seedProduct.material);

        // Build filament record
        const filamentRecord = {
          product_id: productId,
          product_title: seedProduct.productLine,  // Clean title (no color suffix for CSV-seeded)
          vendor: 'IC3D',
          brand_id: brand.id,
          product_url: seedProduct.url,
          featured_image: seedProduct.image,
          variant_price: seedProduct.priceUSD || getIC3DDefaultPrice(seedProduct.material),
          variant_available: true,
          material: seedProduct.material,
          finish_type: enriched.finishType,
          product_line_id: productLineId,
          color_hex: colorHex,
          color_family: extractColorFamily(seedProduct.color),
          tds_url: enriched.tdsUrl,
          diameter_nominal_mm: 1.75,
          net_weight_g: 1000,
          is_nozzle_abrasive: enriched.isNozzleAbrasive,
          nozzle_temp_min_c: enriched.printSettings?.nozzle_temp_min_c || null,
          nozzle_temp_max_c: enriched.printSettings?.nozzle_temp_max_c || null,
          bed_temp_min_c: enriched.printSettings?.bed_temp_min_c || null,
          bed_temp_max_c: enriched.printSettings?.bed_temp_max_c || null,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        // Upsert using composite key (vendor + product_id)
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .eq('vendor', 'IC3D')
          .eq('product_id', productId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('filaments')
            .update(filamentRecord)
            .eq('id', existing.id);
          
          if (error) {
            console.error(`[IC3D Sync] Failed to update ${productId}:`, error.message);
            stats.failed++;
          } else {
            stats.updated++;
          }
        } else {
          const { error } = await supabase
            .from('filaments')
            .insert(filamentRecord);
          
          if (error) {
            console.error(`[IC3D Sync] Failed to insert ${productId}:`, error.message);
            stats.failed++;
          } else {
            stats.created++;
          }
        }
      } catch (err) {
        console.error(`[IC3D Sync] Error processing ${seedProduct.productLine} - ${seedProduct.color}:`, err);
        stats.failed++;
      }
    }

    // ========================================
    // STEP 3: UPDATE BRAND COUNTS
    // ========================================
    console.log('[IC3D Sync] Updating brand product counts...');

    const { count: totalProducts } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', 'IC3D');

    const { count: productsWithHex } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', 'IC3D')
      .not('color_hex', 'is', null);

    const { count: productsWithTds } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', 'IC3D')
      .not('tds_url', 'is', null);

    const { count: productsWithImages } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', 'IC3D')
      .not('featured_image', 'is', null);

    const { count: productsWithPrices } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', 'IC3D')
      .not('variant_price', 'is', null);

    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
        product_count: totalProducts || 0,
        active_product_count: totalProducts || 0,
        products_with_color_hex: productsWithHex || 0,
        products_with_tds: productsWithTds || 0,
        products_with_images: productsWithImages || 0,
        products_with_prices: productsWithPrices || 0,
        products_created: stats.created,
        products_updated: stats.updated,
        last_error: null,
      })
      .eq('id', brand.id);

    // ========================================
    // STEP 4: FIX DUPLICATE HEX CODES
    // ========================================
    console.log('[IC3D Sync] Checking for duplicate hex codes...');
    
    try {
      const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'IC3D' });
      
      if (duplicates && duplicates.length > 0) {
        console.log(`[IC3D Sync] Found ${duplicates.length} duplicate hex codes, applying variations...`);
        
        // Group by product_line_id and hex
        const dupeGroups: Record<string, typeof duplicates> = {};
        for (const dupe of duplicates) {
          const key = `${dupe.product_line_id}|${dupe.color_hex?.toLowerCase()}`;
          if (!dupeGroups[key]) dupeGroups[key] = [];
          dupeGroups[key].push(dupe);
        }
        
        // Apply hex variations within each group
        for (const [key, group] of Object.entries(dupeGroups)) {
          for (let i = 1; i < group.length; i++) {
            const variant = group[i];
            const baseHex = variant.color_hex || '#808080';
            // Adjust brightness slightly for each duplicate
            const adjustment = i * 5;
            const adjustedHex = adjustHexBrightness(baseHex, adjustment);
            
            await supabase
              .from('filaments')
              .update({ color_hex: adjustedHex })
              .eq('id', variant.id);
          }
        }
      }
    } catch (err) {
      console.log('[IC3D Sync] Duplicate hex check skipped:', err);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('[IC3D Sync] Complete:', { 
      ...stats, 
      duration: `${duration}s`,
      totalInDb: totalProducts,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `IC3D sync complete: ${stats.created} created, ${stats.updated} updated, ${stats.failed} failed`,
        stats,
        duration: `${duration}s`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[IC3D Sync] Fatal error:', error);
    
    // Reset scraping status
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('automated_brands')
        .update({ 
          scraping_active: false,
          last_error: error instanceof Error ? error.message : 'Unknown error',
          last_error_at: new Date().toISOString(),
        })
        .eq('brand_slug', 'ic3d-printers');
    } catch (e) {
      console.error('[IC3D Sync] Error resetting status:', e);
    }

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

/**
 * Extract color family from color name
 */
function extractColorFamily(colorName: string): string | null {
  const colorLower = colorName.toLowerCase();
  
  // Handle compound colors
  if (colorLower.includes('matte')) {
    // Extract base color from matte variants
    if (colorLower.includes('black')) return 'Black';
    if (colorLower.includes('white')) return 'White';
    if (colorLower.includes('grey') || colorLower.includes('gray')) return 'Gray';
    if (colorLower.includes('green')) return 'Green';
    if (colorLower.includes('beige') || colorLower.includes('fog')) return 'Neutral';
  }
  
  // Handle translucent colors (IC3D fruit-inspired names)
  if (colorLower.includes('translucent')) {
    if (colorLower.includes('blue razz')) return 'Blue';
    if (colorLower.includes('cherry')) return 'Red';
    if (colorLower.includes('grape')) return 'Purple';
    if (colorLower.includes('honey')) return 'Yellow';
    if (colorLower.includes('watermelon')) return 'Pink';
  }
  
  // Standard color mapping
  const colorFamilyMap: Record<string, string> = {
    'black': 'Black',
    'white': 'White',
    'red': 'Red',
    'blue': 'Blue',
    'green': 'Green',
    'yellow': 'Yellow',
    'orange': 'Orange',
    'grey': 'Gray',
    'gray': 'Gray',
    'natural': 'Natural',
    'clear': 'Clear',
    'concrete': 'Gray',
    'charcoal': 'Gray',
    'bright green': 'Green',
    'moss': 'Green',
    'standard': 'Black',  // CF-PETG standard is black
  };
  
  for (const [keyword, family] of Object.entries(colorFamilyMap)) {
    if (colorLower.includes(keyword)) {
      return family;
    }
  }
  
  return null;
}

/**
 * Adjust hex color brightness for duplicate differentiation
 */
function adjustHexBrightness(hex: string, adjustment: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse RGB values
  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Adjust each channel
  r = Math.min(255, Math.max(0, r + adjustment));
  g = Math.min(255, Math.max(0, g + adjustment));
  b = Math.min(255, Math.max(0, b + adjustment));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}
