/**
 * Push Plastic CSV-Seeded Sync Pipeline
 * 
 * High-fidelity 5-step sync process:
 * 1. Load curated products from CSV seed (consumer-focused 1.75mm, 1kg only)
 * 2. Apply brand-specific enrichments (material, finish, hex, TDS)
 * 3. Safe delete existing products (with threshold)
 * 4. Batch insert enriched products
 * 5. Fix duplicate hex codes within product lines
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  PUSHPLASTIC_PRODUCT_SEED,
  PUSHPLASTIC_PRODUCT_LINE_IMAGES,
  shouldExcludePushPlasticProduct,
  deduplicatePushPlasticEntries,
  extractMaterialFromTitle,
  generatePushPlasticProductLineId,
  getPushPlasticSeedHex,
  getPushPlasticDefaultPrice,
  type PushPlasticSeedEntry
} from '../_shared/pushplastic-seed.ts';
import {
  enrichPushPlasticProduct,
  PUSHPLASTIC_PRINT_SETTINGS,
} from '../_shared/pushplastic-defaults.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

const VENDOR_NAME = 'Push Plastic';
const BRAND_SLUG = 'push-plastic';
const SAFE_DELETE_THRESHOLD = 30; // Lower threshold for curated CSV seed (~155 products)

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

interface StepResult {
  step: string;
  success: boolean;
  count?: number;
  message?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractFinishType(material: string, color: string): string | null {
  const materialLower = material.toLowerCase();
  const colorLower = color.toLowerCase();
  
  // Check material name for finish indicators
  if (materialLower.includes('metallic')) return 'Metallic';
  if (materialLower.includes('translucent')) return 'Translucent';
  if (materialLower.includes('fluorescent')) return 'Fluorescent';
  
  // Check color name for finish indicators
  if (colorLower.includes('metallic')) return 'Metallic';
  if (colorLower.includes('translucent')) return 'Translucent';
  if (colorLower.includes('fluorescent')) return 'Fluorescent';
  if (colorLower.includes('clear')) return 'Translucent';
  if (colorLower.includes('natural')) return 'Standard';
  
  return 'Standard';
}

function isAbrasiveMaterial(material: string): boolean {
  const materialLower = material.toLowerCase();
  return materialLower.includes('-cf') || 
         materialLower.includes('carbon') ||
         materialLower.includes('glass') ||
         materialLower.includes('-gf');
}

function extractWeightFromTitle(title: string): number {
  // Extract weight from title patterns like "1kg", "750g", "500g"
  const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) return parseFloat(kgMatch[1]) * 1000;
  
  const gMatch = title.match(/(\d+)\s*g(?:ram)?s?/i);
  if (gMatch) return parseInt(gMatch[1], 10);
  
  // Default to 1kg for standard filament
  return 1000;
}

function getTdsUrl(material: string): string | null {
  const materialNormalized = material.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Push Plastic TDS URLs follow this pattern
  const tdsPatterns: Record<string, string> = {
    'pla': 'https://www.pushplastic.com/pages/pla-technical-data-sheet',
    'petg': 'https://www.pushplastic.com/pages/petg-technical-data-sheet',
    'pctg': 'https://www.pushplastic.com/pages/pctg-technical-data-sheet',
    'abs': 'https://www.pushplastic.com/pages/abs-technical-data-sheet',
    'asa': 'https://www.pushplastic.com/pages/asa-technical-data-sheet',
    'pc-pbt': 'https://www.pushplastic.com/pages/pc-pbt-technical-data-sheet',
    'tpu': 'https://www.pushplastic.com/pages/tpu-technical-data-sheet',
    'tpu-98a': 'https://www.pushplastic.com/pages/tpu-technical-data-sheet',
    'hips': 'https://www.pushplastic.com/pages/hips-technical-data-sheet',
    'pei': 'https://www.pushplastic.com/pages/pei-technical-data-sheet',
    'pmma': 'https://www.pushplastic.com/pages/pmma-technical-data-sheet',
    'abs-cf': 'https://www.pushplastic.com/pages/abs-cf-technical-data-sheet',
    'petg-cf': 'https://www.pushplastic.com/pages/petg-cf-technical-data-sheet',
    'pa-cf': 'https://www.pushplastic.com/pages/pa-cf-technical-data-sheet',
    'pc-cf': 'https://www.pushplastic.com/pages/pc-cf-technical-data-sheet',
    'nylon': 'https://www.pushplastic.com/pages/nylon-technical-data-sheet',
  };
  
  // Try to match material
  for (const [key, url] of Object.entries(tdsPatterns)) {
    if (materialNormalized.includes(key)) {
      return url;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stepResults: StepResult[] = [];
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

    // Parse options - ignore limit for CSV-seeded brands
    let options: { cleanSlate?: boolean; limit?: number } = {};
    try {
      options = await req.json();
    } catch {
      options = {};
    }

    console.log('='.repeat(60));
    console.log('=== PUSH PLASTIC CSV-SEEDED SYNC - NOT SHOPIFY LIVE ===');
    console.log('This sync uses curated CSV seed data, not Shopify API');
    console.log('='.repeat(60));
    console.log('PUSH PLASTIC CSV-SEEDED SYNC PIPELINE');
    console.log('Options:', JSON.stringify(options));
    console.log('='.repeat(60));

    // =========================================================================
    // STEP 1: Get brand ID and mark as actively syncing
    // =========================================================================
    
    const { data: brand, error: brandError } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', BRAND_SLUG)
      .single();

    if (brandError || !brand) {
      throw new Error(`Brand not found: ${BRAND_SLUG}`);
    }

    const brandId = brand.id;
    console.log(`Brand ID: ${brandId} (${brand.brand_name})`);

    // Mark brand as actively syncing
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: true,
        last_scrape_at: new Date().toISOString()
      })
      .eq('id', brandId);

    stepResults.push({
      step: 'Brand Setup',
      success: true,
      message: `Found brand: ${brand.brand_name}`,
    });

    // =========================================================================
    // STEP 2: Load and filter CSV seed data
    // =========================================================================
    
    console.log(`Loading CSV seed data: ${PUSHPLASTIC_PRODUCT_SEED.length} total entries`);
    
    // Filter out excluded products (bulk, 2.85mm, samples, etc.)
    const filteredProducts = PUSHPLASTIC_PRODUCT_SEED.filter(entry => {
      const shouldExclude = shouldExcludePushPlasticProduct(entry);
      if (shouldExclude) {
        console.log(`[Filter] Excluding: ${entry.filamentName} - ${entry.color}`);
        stats.skipped++;
      }
      return !shouldExclude;
    });
    
    // Deduplicate entries (remove AMS vs Standard duplicates)
    const validProducts = deduplicatePushPlasticEntries(filteredProducts);
    
    stats.discovered = validProducts.length;
    console.log(`Filtered to ${validProducts.length} consumer-focused products`);

    stepResults.push({
      step: 'Load CSV Seed',
      success: true,
      count: validProducts.length,
      message: `Loaded ${validProducts.length} products from CSV seed (${stats.skipped} excluded)`,
    });

    // =========================================================================
    // STEP 3: Safe Delete (if cleanSlate and threshold met)
    // =========================================================================
    
    if (options.cleanSlate && validProducts.length >= SAFE_DELETE_THRESHOLD) {
      console.log(`Clean slate mode: deleting existing ${VENDOR_NAME} products...`);
      
      const { data: deleted, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', VENDOR_NAME)
        .select('id');
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
        stepResults.push({
          step: 'Safe Delete',
          success: false,
          message: `Delete failed: ${deleteError.message}`,
        });
      } else {
        stats.deleted = deleted?.length || 0;
        console.log(`Deleted ${stats.deleted} existing products`);
        stepResults.push({
          step: 'Safe Delete',
          success: true,
          count: stats.deleted,
          message: `Deleted ${stats.deleted} existing products`,
        });
      }
    } else if (options.cleanSlate) {
      console.log(`Clean slate BLOCKED: only ${validProducts.length} products, threshold is ${SAFE_DELETE_THRESHOLD}`);
      stepResults.push({
        step: 'Safe Delete',
        success: false,
        message: `Blocked: ${validProducts.length} products below threshold of ${SAFE_DELETE_THRESHOLD}`,
      });
    }

    // =========================================================================
    // STEP 3.5: Fetch live prices from Shopify API
    // =========================================================================
    const variantPriceMap = new Map<string, number>();
    try {
      let page = 1;
      while (true) {
        const res = await fetch(
          `https://www.pushplastic.com/products.json?limit=250&page=${page}`,
          { headers: { 'User-Agent': 'FilaScope-Sync/1.0' } }
        );
        if (!res.ok) { console.warn(`[PushPlastic] Shopify returned ${res.status}`); break; }
        const data = await res.json();
        const products: any[] = data.products || [];
        if (products.length === 0) break;
        for (const p of products) {
          for (const v of p.variants || []) {
            if (v.price) variantPriceMap.set(String(v.id), parseFloat(v.price));
          }
        }
        if (products.length < 250) break;
        page++;
        await new Promise(r => setTimeout(r, 500));
      }
      console.log(`[PushPlastic] Fetched prices for ${variantPriceMap.size} variants`);
    } catch (err) {
      console.warn('[PushPlastic] Price fetch failed — using defaults:', err);
    }

    // =========================================================================
    // STEP 4: Batch insert enriched products
    // =========================================================================

    console.log(`Processing ${validProducts.length} products for insert...`);
    
    const batchSize = 50;
    const productResults: Array<{ title: string; color: string; status: string }> = [];
    
    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);
      
      const records = batch.map(entry => {
        // Extract material from title using enhanced extraction logic
        const material = extractMaterialFromTitle(entry.filamentName);
        // Generate product line ID with proper material categorization
        const productLineId = generatePushPlasticProductLineId(material, entry.filamentName);
        const finishType = extractFinishType(material, entry.color);
        const isAbrasive = isAbrasiveMaterial(material);
        const weight = extractWeightFromTitle(entry.filamentName);
        const tdsUrl = getTdsUrl(material);
        
        console.log(`[Process] ${entry.filamentName} - ${entry.color} → Material: ${material}, Line: ${productLineId}`);
        
        // Get hex from CSV or fallback to mapping
        const colorHex = entry.colorHex || getPushPlasticSeedHex(entry.colorHex, entry.color);
        
        // Get enriched data from defaults module
        const enriched = enrichPushPlasticProduct(entry.filamentName, material, entry.color);
        const settings = enriched.printSettings;
        
        // Generate product ID
        const productId = `pushplastic-${productLineId}-${entry.color.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        
        // Clean title - use filament name without color (color is separate)
        const cleanTitle = `${entry.filamentName.replace(/1\.75mm/gi, '').replace(/1kg/gi, '').trim()} - ${entry.color}`;
        
        return {
          product_id: productId,
          product_title: cleanTitle,
          vendor: VENDOR_NAME,
          brand_id: brandId,
          material: enriched.material || material,
          finish_type: finishType,
          product_line_id: productLineId,
          color_hex: colorHex || enriched.colorHex,  // Seed hex takes PRIORITY over enrichment
          color_family: null, // Will be derived from hex
          tds_url: enriched.tdsUrl || tdsUrl,
          product_url: entry.colorLink || entry.productLink,
          featured_image: PUSHPLASTIC_PRODUCT_LINE_IMAGES[productLineId] || null,
          variant_price: (() => {
            const varId = (entry.colorLink || '').match(/variant=(\d+)/)?.[1];
            return (varId && variantPriceMap.get(varId)) || getPushPlasticDefaultPrice(material);
          })(),
          variant_compare_at_price: null,
          variant_sku: null,
          variant_available: true,
          net_weight_g: weight,
          diameter_nominal_mm: 1.75,
          nozzle_temp_min_c: settings?.nozzle_temp_min_c || null,
          nozzle_temp_max_c: settings?.nozzle_temp_max_c || null,
          bed_temp_min_c: settings?.bed_temp_min_c || null,
          bed_temp_max_c: settings?.bed_temp_max_c || null,
          fan_min_percent: settings?.fan_min_percent || null,
          fan_max_percent: settings?.fan_max_percent || null,
          drying_temp_c: settings?.drying_temp_c || null,
          drying_time_hours: settings?.drying_time_hours || null,
          is_nozzle_abrasive: isAbrasive,
          high_speed_capable: false,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };
      });
      
      // Use upsert on composite key (vendor, product_id)
      const { error: insertError } = await supabase
        .from('filaments')
        .upsert(records, { 
          onConflict: 'vendor,product_id',
          ignoreDuplicates: false 
        });
      
      if (insertError) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} insert error:`, insertError);
        stats.errors += batch.length;
        batch.forEach(entry => {
          productResults.push({ 
            title: entry.filamentName, 
            color: entry.color, 
            status: 'error' 
          });
        });
      } else {
        stats.created += batch.length;
        batch.forEach(entry => {
          productResults.push({ 
            title: entry.filamentName, 
            color: entry.color, 
            status: 'created' 
          });
        });
      }
      
      // Rate limit between batches
      if (i + batchSize < validProducts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Insert complete: ${stats.created} created, ${stats.errors} errors`);
    
    stepResults.push({
      step: 'Batch Insert',
      success: stats.errors === 0,
      count: stats.created,
      message: `Inserted ${stats.created} products (${stats.errors} errors)`,
    });

    // =========================================================================
    // STEP 5: Fix duplicate hex codes within product lines
    // =========================================================================
    
    console.log('Fixing duplicate hex codes...');
    
    try {
      const { data: duplicates, error: rpcError } = await supabase.rpc('find_duplicate_hexes', {
        p_vendor: VENDOR_NAME
      });
      
      if (rpcError) {
        console.error('RPC error:', rpcError);
        stepResults.push({
          step: 'Fix Duplicate Hex',
          success: false,
          message: `RPC error: ${rpcError.message}`,
        });
      } else {
        const dupeCount = duplicates?.length || 0;
        let fixed = 0;
        
        for (const dup of (duplicates || [])) {
          const { color_hex, ids } = dup;
          if (!ids || ids.length < 2) continue;
          
          // Adjust hex for duplicates (skip first)
          for (let j = 1; j < ids.length; j++) {
            const originalHex = color_hex || '#808080';
            const adjustment = j * 2;
            const r = Math.min(255, parseInt(originalHex.slice(1, 3), 16) + adjustment);
            const newHex = `#${r.toString(16).padStart(2, '0')}${originalHex.slice(3)}`;
            
            await supabase
              .from('filaments')
              .update({ color_hex: newHex })
              .eq('id', ids[j]);
            
            fixed++;
          }
        }
        
        console.log(`Fixed ${fixed} duplicate hex codes`);
        stepResults.push({
          step: 'Fix Duplicate Hex',
          success: true,
          count: fixed,
          message: `Fixed ${fixed} duplicate hex codes in ${dupeCount} groups`,
        });
      }
    } catch (error) {
      console.error('Duplicate hex fix error:', error);
      stepResults.push({
        step: 'Fix Duplicate Hex',
        success: false,
        message: `Error: ${String(error)}`,
      });
    }

    // =========================================================================
    // STEP 6: Update brand statistics
    // =========================================================================
    
    // Get final product count
    const { count: productCount } = await supabase
      .from('filaments')
      .select('id', { count: 'exact', head: true })
      .eq('vendor', VENDOR_NAME);
    
    // Update brand stats
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        product_count: productCount || 0,
        products_created: stats.created,
        products_updated: stats.updated,
        last_scrape_at: new Date().toISOString(),
        last_error: null,
        last_error_at: null,
      })
      .eq('id', brandId);
    
    stepResults.push({
      step: 'Update Brand Stats',
      success: true,
      count: productCount || 0,
      message: `Brand stats updated: ${productCount} total products`,
    });

    // =========================================================================
    // FINAL RESPONSE
    // =========================================================================
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    const response = {
      success: true,
      brand: VENDOR_NAME,
      brandSlug: BRAND_SLUG,
      duration: `${duration}s`,
      stats: {
        discovered: stats.discovered,
        created: stats.created,
        updated: stats.updated,
        skipped: stats.skipped,
        errors: stats.errors,
        deleted: stats.deleted,
        total: productCount || 0,
      },
      stepResults,
      productResults: productResults.slice(0, 20), // First 20 for debugging
    };

    console.log('='.repeat(60));
    console.log('SYNC COMPLETE');
    console.log(JSON.stringify(response.stats, null, 2));
    console.log('='.repeat(60));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error);
    
    // Try to reset scraping_active flag
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('automated_brands')
        .update({ 
          scraping_active: false,
          last_error: String(error),
          last_error_at: new Date().toISOString(),
        })
        .eq('brand_slug', BRAND_SLUG);
    } catch (resetError) {
      console.error('Failed to reset scraping_active:', resetError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: String(error),
      stats,
      stepResults,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
