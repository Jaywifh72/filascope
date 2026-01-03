/**
 * ANYCUBIC WHITELIST-BASED SYNC
 * 
 * A curated sync function for Anycubic that:
 * 1. Iterates through the 19 official product whitelist
 * 2. Fetches each product directly from Shopify JSON API
 * 3. Extracts all color variants with prices
 * 4. Applies Anycubic-specific enrichments (TDS, settings, colors)
 * 5. Upserts to filaments table
 * 
 * This ensures a clean catalog with only official product lines.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  ANYCUBIC_PRODUCT_WHITELIST,
  enrichAnycubicProduct,
  getAnycubicColorHex,
  generateAnycubicProductLineId,
  ANYCUBIC_PRINT_SETTINGS,
} from '../_shared/anycubic-defaults.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANYCUBIC_STORE_URL = 'https://store.anycubic.com';
const VENDOR_NAME = 'Anycubic';

interface SyncRequest {
  dryRun?: boolean;
  cleanSlate?: boolean;
  limit?: number;
}

interface VariantResult {
  productId: string;
  variantId: string;
  title: string;
  colorName: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  imageUrl: string | null;
  productUrl: string;
  productLineId: string;
  material: string;
  finishType: string;
  colorHex: string | null;
  colorFamily: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[ANYCUBIC-SYNC] 🚀 ANYCUBIC WHITELIST-BASED SYNC STARTED');
  console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    let body: SyncRequest = {};
    try {
      body = await req.json();
    } catch {
      // Use defaults
    }

    const { dryRun = false, cleanSlate = false, limit } = body;
    
    // Stats
    let productsProcessed = 0;
    let variantsFound = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const allVariants: VariantResult[] = [];

    // =========================================================================
    // STEP 0: Clean Slate (if requested)
    // =========================================================================
    if (cleanSlate && !dryRun) {
      console.log('[ANYCUBIC-SYNC] Step 0: Clean slate - deleting existing Anycubic products...');
      const { error: deleteError, count } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', '%anycubic%');
      
      if (deleteError) {
        console.error('[ANYCUBIC-SYNC] Delete error:', deleteError.message);
      } else {
        console.log(`[ANYCUBIC-SYNC] Deleted ${count} existing Anycubic products`);
      }
    }

    // =========================================================================
    // STEP 1: Fetch products from whitelist
    // =========================================================================
    console.log(`[ANYCUBIC-SYNC] Step 1: Processing ${ANYCUBIC_PRODUCT_WHITELIST.length} whitelisted products...`);

    const productLimit = limit || ANYCUBIC_PRODUCT_WHITELIST.length;
    
    for (const whitelistProduct of ANYCUBIC_PRODUCT_WHITELIST.slice(0, productLimit)) {
      try {
        const productJsonUrl = `${ANYCUBIC_STORE_URL}/products/${whitelistProduct.handle}.json`;
        console.log(`[ANYCUBIC-SYNC] Fetching: ${whitelistProduct.name} (${whitelistProduct.handle})`);
        
        const response = await fetch(productJsonUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FilaScopeBot/1.0)',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`[ANYCUBIC-SYNC] Failed to fetch ${whitelistProduct.handle}: ${response.status}`);
          errors++;
          continue;
        }

        const data = await response.json();
        const product = data.product;
        
        if (!product) {
          console.error(`[ANYCUBIC-SYNC] No product data for ${whitelistProduct.handle}`);
          errors++;
          continue;
        }

        productsProcessed++;
        
        // Get product image (first one or variant-specific)
        const defaultImage = product.images?.[0]?.src || product.image?.src || null;
        
        // Generate product_line_id using whitelist data
        const productLineId = `anycubic__${whitelistProduct.material.toLowerCase().replace(/[^a-z0-9]/g, '')}__${whitelistProduct.finishType.toLowerCase().replace(/\s+/g, '')}`;
        
        // Process each variant (color)
        for (const variant of product.variants || []) {
          variantsFound++;
          
          // Extract color from variant title
          // Variant title formats: "Black", "Black / 1kg", "1kg / Black"
          let colorName = extractColorFromVariantTitle(variant.title);
          
          // Get color hex
          let colorHex = getAnycubicColorHex(colorName);
          if (!colorHex) {
            colorHex = getColorHex(colorName);
          }
          
          // Get color family
          const colorFamily = getColorFamily(colorName) || null;
          
          // Get variant-specific image or fall back to product image
          let imageUrl = defaultImage;
          if (variant.featured_image?.src) {
            imageUrl = variant.featured_image.src;
          }
          
          // Get print settings for this material
          const printSettings = ANYCUBIC_PRINT_SETTINGS[whitelistProduct.material] || 
                               ANYCUBIC_PRINT_SETTINGS['PLA'] || null;
          
          // Build product URL with variant ID
          const productUrl = `${ANYCUBIC_STORE_URL}/products/${whitelistProduct.handle}?variant=${variant.id}`;
          
          const variantResult: VariantResult = {
            productId: String(product.id),
            variantId: String(variant.id),
            title: product.title, // Use base product title (no color)
            colorName,
            price: parseFloat(variant.price) || 0,
            compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
            available: variant.available ?? true,
            imageUrl,
            productUrl,
            productLineId,
            material: whitelistProduct.material,
            finishType: whitelistProduct.finishType,
            colorHex: colorHex ? (colorHex.startsWith('#') ? colorHex : `#${colorHex}`) : null,
            colorFamily,
          };
          
          allVariants.push(variantResult);
          
          // =========================================================================
          // STEP 2: Upsert to database
          // =========================================================================
          if (!dryRun) {
            // Check if variant already exists
            const { data: existing } = await supabase
              .from('filaments')
              .select('id, variant_price')
              .eq('product_id', variantResult.variantId)
              .ilike('vendor', '%anycubic%')
              .maybeSingle();
            
            const filamentData = {
              product_id: variantResult.variantId,
              product_title: variantResult.title,
              vendor: VENDOR_NAME,
              product_line_id: variantResult.productLineId,
              material: variantResult.material,
              finish_type: variantResult.finishType,
              color_family: variantResult.colorFamily,
              color_hex: variantResult.colorHex,
              variant_price: variantResult.price,
              variant_compare_at_price: variantResult.compareAtPrice,
              variant_available: variantResult.available,
              product_url: variantResult.productUrl,
              featured_image: variantResult.imageUrl,
              diameter_nominal_mm: 1.75,
              net_weight_g: 1000, // Default 1kg
              auto_created: true,
              auto_updated: true,
              last_scraped_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: 'synced',
              // Apply print settings
              nozzle_temp_min_c: printSettings?.nozzleTempMin || null,
              nozzle_temp_max_c: printSettings?.nozzleTempMax || null,
              bed_temp_min_c: printSettings?.bedTempMin || null,
              bed_temp_max_c: printSettings?.bedTempMax || null,
              high_speed_capable: whitelistProduct.handle.includes('high-speed'),
            };
            
            if (existing) {
              // Update existing
              const { error: updateError } = await supabase
                .from('filaments')
                .update(filamentData)
                .eq('id', existing.id);
              
              if (updateError) {
                console.error(`[ANYCUBIC-SYNC] Update error for ${variantResult.colorName}:`, updateError.message);
                errors++;
              } else {
                updated++;
              }
            } else {
              // Insert new
              const { error: insertError } = await supabase
                .from('filaments')
                .insert(filamentData);
              
              if (insertError) {
                console.error(`[ANYCUBIC-SYNC] Insert error for ${variantResult.colorName}:`, insertError.message);
                errors++;
              } else {
                created++;
              }
            }
          }
        }
        
        // Rate limit between product fetches
        await new Promise(r => setTimeout(r, 500));
        
      } catch (err) {
        console.error(`[ANYCUBIC-SYNC] Error processing ${whitelistProduct.handle}:`, err);
        errors++;
      }
    }

    // =========================================================================
    // STEP 3: Update brand statistics
    // =========================================================================
    if (!dryRun) {
      console.log('[ANYCUBIC-SYNC] Step 3: Updating brand statistics...');
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'anycubic' });
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[ANYCUBIC-SYNC] ✅ COMPLETED in ${duration}s`);
    console.log(`[ANYCUBIC-SYNC] Products: ${productsProcessed}, Variants: ${variantsFound}`);
    console.log(`[ANYCUBIC-SYNC] Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
    console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      duration,
      summary: {
        productsProcessed,
        variantsFound,
        created,
        updated,
        skipped,
        errors,
      },
      // Include sample variants in response (limited for size)
      variants: allVariants.slice(0, 50).map(v => ({
        title: v.title,
        color: v.colorName,
        price: v.price,
        productLineId: v.productLineId,
        colorHex: v.colorHex,
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ANYCUBIC-SYNC] ❌ Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract color name from Shopify variant title
 * Handles formats like: "Black", "Black / 1kg", "1kg / Black", "White / 1.75mm / 1kg"
 */
function extractColorFromVariantTitle(variantTitle: string): string {
  if (!variantTitle) return 'Unknown';
  
  // Split by common delimiters
  const parts = variantTitle.split(/\s*[\/|]\s*/).map(p => p.trim());
  
  // Filter out weight, diameter, and quantity parts
  const colorParts = parts.filter(part => {
    const lower = part.toLowerCase();
    // Skip if it's a weight (1kg, 500g, etc.)
    if (/^\d+(\.\d+)?\s*(kg|g|gram|kilogram)s?$/i.test(part)) return false;
    // Skip if it's a diameter (1.75mm, 2.85mm)
    if (/^\d+(\.\d+)?\s*mm$/i.test(part)) return false;
    // Skip if it's just a number
    if (/^\d+$/.test(part)) return false;
    // Skip common non-color terms
    if (['default', 'standard', 'regular', 'title'].includes(lower)) return false;
    return true;
  });
  
  // Return the first color-like part, or the original if nothing matches
  return colorParts.length > 0 ? colorParts[0] : variantTitle;
}
