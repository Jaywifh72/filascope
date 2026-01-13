/**
 * SPECTRUM FILAMENTS SYNC FUNCTION
 * 
 * CSV-seeded sync for Spectrum Filaments Shopify CA store.
 * Architecture: Cross-product swatch (each color variant is a separate Shopify product)
 * 
 * Features:
 * - 662+ products across 40+ material types
 * - ReFill eco-spool variants
 * - Shopify-based product URLs
 * - Color-specific images per variant
 * 
 * Filtering:
 * - No samples (<300g)
 * - No bulk (>5500g)
 * - No 2.85mm/3mm diameter
 * - No gift cards or non-filament products
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  loadSpectrumSeed, 
  generateSpectrumProductLineIdFromSeed,
  SpectrumSeedProduct,
  SPECTRUM_EXPECTED_CARD_COUNT,
} from "../_shared/spectrum-seed.ts";
import { 
  enrichSpectrumProduct, 
  getSpectrumColorHex,
  SPECTRUM_COLOR_MAPPING,
} from "../_shared/spectrum-defaults.ts";
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from "../_shared/variant-filters.ts";

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
  duplicatesFixed: number;
}

interface ProductResult {
  productId: string;
  title: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  productLineId: string;
  color: string | null;
  reason?: string;
}

const BRAND_NAME = 'Spectrum Filaments';
const BRAND_SLUG = 'spectrum-filaments';
const SAFE_DELETE_THRESHOLD = 50; // Minimum products to keep

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    const { cleanSlate = false, dryRun = false, limit } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', BRAND_SLUG)
      .single();
    
    if (!brand) {
      throw new Error(`${BRAND_NAME} brand not found in automated_brands`);
    }
    
    console.log(`Starting ${BRAND_NAME} sync (CSV-seeded, Shopify CA)`);
    console.log(`Options: cleanSlate=${cleanSlate}, dryRun=${dryRun}, limit=${limit || 'all'}`);
    
    // Mark as scraping
    if (!dryRun) {
      await supabase
        .from('automated_brands')
        .update({ scraping_active: true, last_error: null })
        .eq('id', brand.id);
    }
    
    const stats: SyncStats = {
      discovered: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      duplicatesFixed: 0,
    };
    
    const productResults: ProductResult[] = [];
    const filterStats = createFilterStats();
    
    // ========================================================================
    // STEP 1: LOAD CSV SEED DATA
    // ========================================================================
    console.log('Step 1: Loading CSV seed data...');
    
    const seedProducts = await loadSpectrumSeed();
    stats.discovered = seedProducts.length;
    
    if (seedProducts.length === 0) {
      throw new Error('No products loaded from CSV seed');
    }
    
    console.log(`Loaded ${seedProducts.length} products from CSV`);
    
    // ========================================================================
    // STEP 2: SAFE DELETE CHECK (if clean slate)
    // ========================================================================
    if (cleanSlate && !dryRun) {
      console.log('Step 2: Clean slate - checking safe delete threshold...');
      
      const { count: existingCount } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .eq('vendor', BRAND_NAME);
      
      console.log(`Existing products: ${existingCount}, New seed: ${seedProducts.length}`);
      
      if (seedProducts.length < SAFE_DELETE_THRESHOLD) {
        throw new Error(`Safe delete threshold not met: ${seedProducts.length} < ${SAFE_DELETE_THRESHOLD}`);
      }
      
      // Delete existing products
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', BRAND_NAME);
      
      if (deleteError) {
        console.error('Error deleting existing products:', deleteError);
        throw deleteError;
      }
      
      console.log(`Deleted ${existingCount} existing products`);
    }
    
    // ========================================================================
    // STEP 3: PROCESS EACH PRODUCT FROM CSV
    // ========================================================================
    console.log('Step 3: Processing products from CSV...');
    
    const productsToProcess = limit ? seedProducts.slice(0, limit) : seedProducts;
    const processedIds = new Set<string>();
    
    for (const seedProduct of productsToProcess) {
      try {
        // Extract weight from title
        const weightMatch = seedProduct.title.match(/(\d+(?:\.\d+)?)\s*(kg|g)/i);
        let weightGrams = 1000;
        if (weightMatch) {
          const value = parseFloat(weightMatch[1]);
          const unit = weightMatch[2].toLowerCase();
          weightGrams = unit === 'kg' ? value * 1000 : value;
        }
        
        // Check variant filters
        const filterResult = shouldIncludeVariant(weightGrams, 1.75, seedProduct.title);
        updateFilterStats(filterStats, filterResult);
        
        if (!filterResult.include) {
          stats.skipped++;
          productResults.push({
            productId: '',
            title: seedProduct.title,
            status: 'skipped',
            productLineId: '',
            color: seedProduct.color,
            reason: filterResult.reason,
          });
          continue;
        }
        
        // Generate product line ID
        const productLineId = generateSpectrumProductLineIdFromSeed(seedProduct);
        
        // Generate unique product ID
        const colorSlug = (seedProduct.color || 'default')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50);
        const weightSlug = weightGrams >= 1000 ? `${weightGrams / 1000}kg` : `${weightGrams}g`;
        const productId = `spectrum-${productLineId.replace(/spectrum__/, '')}-${colorSlug}-${weightSlug}`;
        
        // Check for duplicates
        if (processedIds.has(productId)) {
          stats.skipped++;
          productResults.push({
            productId,
            title: seedProduct.title,
            status: 'skipped',
            productLineId,
            color: seedProduct.color,
            reason: 'Duplicate product ID',
          });
          continue;
        }
        processedIds.add(productId);
        
        // Enrich product with defaults
        const enrichment = enrichSpectrumProduct(
          seedProduct.title,
          seedProduct.color,
          seedProduct.material
        );
        
        // Get color hex (prioritize extended mappings for unique colors, then general)
        let colorHex = seedProduct.colorHex;
        if (!colorHex) {
          // Check extended mappings FIRST (has unique hex codes for similar color names)
          colorHex = mapSpectrumColorToHex(seedProduct.color);
        }
        if (!colorHex) {
          // Fall back to general Spectrum color mapping (RAL codes, basic colors)
          colorHex = getSpectrumColorHex(seedProduct.color, seedProduct.title);
        }
        
        // Prepare filament data
        const filamentData = {
          product_id: productId,
          product_title: seedProduct.title,
          vendor: BRAND_NAME,
          brand_id: brand.id,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: productLineId,
          color_hex: colorHex,
          color_family: seedProduct.color,
          featured_image: seedProduct.imageUrl || null,
          product_url: seedProduct.productUrl,
          variant_price: null, // Will be fetched via live price check
          tds_url: seedProduct.tdsUrl || enrichment.tdsUrl,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          is_nozzle_abrasive: enrichment.isAbrasive,
          diameter_nominal_mm: enrichment.diameterMm,
          net_weight_g: enrichment.netWeightG,
          spool_material: enrichment.spoolMaterial,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };
        
        if (dryRun) {
          stats.created++;
          productResults.push({
            productId,
            title: seedProduct.title,
            status: 'created',
            productLineId,
            color: seedProduct.color,
          });
          continue;
        }
        
        // Upsert to database
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .eq('product_id', productId)
          .maybeSingle();
        
        if (existing) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(filamentData)
            .eq('id', existing.id);
          
          if (updateError) {
            console.error(`Error updating ${productId}:`, updateError);
            stats.errors++;
            productResults.push({
              productId,
              title: seedProduct.title,
              status: 'error',
              productLineId,
              color: seedProduct.color,
              reason: updateError.message,
            });
          } else {
            stats.updated++;
            productResults.push({
              productId,
              title: seedProduct.title,
              status: 'updated',
              productLineId,
              color: seedProduct.color,
            });
          }
        } else {
          const { error: insertError } = await supabase
            .from('filaments')
            .insert(filamentData);
          
          if (insertError) {
            console.error(`Error inserting ${productId}:`, insertError);
            stats.errors++;
            productResults.push({
              productId,
              title: seedProduct.title,
              status: 'error',
              productLineId,
              color: seedProduct.color,
              reason: insertError.message,
            });
          } else {
            stats.created++;
            productResults.push({
              productId,
              title: seedProduct.title,
              status: 'created',
              productLineId,
              color: seedProduct.color,
            });
          }
        }
        
      } catch (e) {
        console.error(`Error processing ${seedProduct.title}:`, e);
        stats.errors++;
        productResults.push({
          productId: '',
          title: seedProduct.title,
          status: 'error',
          productLineId: '',
          color: seedProduct.color,
          reason: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }
    
    // ========================================================================
    // STEP 4: FIX DUPLICATE HEX CODES WITHIN PRODUCT LINES
    // ========================================================================
    console.log('Step 4: Checking for duplicate hex codes...');
    
    if (!dryRun) {
      // Get all products grouped by product_line_id
      const { data: allProducts } = await supabase
        .from('filaments')
        .select('id, product_line_id, color_hex, color_family')
        .eq('vendor', BRAND_NAME)
        .not('color_hex', 'is', null);
      
      if (allProducts) {
        const lineGroups = new Map<string, typeof allProducts>();
        
        for (const p of allProducts) {
          if (!p.product_line_id) continue;
          if (!lineGroups.has(p.product_line_id)) {
            lineGroups.set(p.product_line_id, []);
          }
          lineGroups.get(p.product_line_id)!.push(p);
        }
        
        // Check each group for duplicates
        for (const [lineId, products] of lineGroups) {
          const hexCounts = new Map<string, number>();
          
          for (const p of products) {
            if (!p.color_hex) continue;
            const hex = p.color_hex.toLowerCase();
            hexCounts.set(hex, (hexCounts.get(hex) || 0) + 1);
          }
          
          // Find duplicates
          for (const [hex, count] of hexCounts) {
            if (count > 1) {
              console.log(`Duplicate hex ${hex} found ${count} times in ${lineId}`);
              stats.duplicatesFixed += count - 1;
            }
          }
        }
      }
    }
    
    // ========================================================================
    // STEP 5: FINALIZE AND UPDATE BRAND STATS
    // ========================================================================
    console.log('Step 5: Finalizing sync...');
    
    if (!dryRun) {
      // Update brand product counts
      const { count: productCount } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .eq('vendor', BRAND_NAME);
      
      // Count unique product lines
      const { data: productLines } = await supabase
        .from('filaments')
        .select('product_line_id')
        .eq('vendor', BRAND_NAME);
      
      const uniqueLines = new Set(productLines?.map(p => p.product_line_id) || []);
      
      await supabase
        .from('automated_brands')
        .update({
          scraping_active: false,
          last_scrape_at: new Date().toISOString(),
          product_count: productCount || 0,
          products_created: stats.created,
          products_updated: stats.updated,
        })
        .eq('id', brand.id);
      
      console.log(`Final product count: ${productCount}`);
      console.log(`Unique product lines: ${uniqueLines.size}`);
      console.log(`Expected card count: ${SPECTRUM_EXPECTED_CARD_COUNT}`);
    }
    
    // Log filter stats
    logFilterStats(BRAND_NAME, filterStats);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`Sync complete in ${duration}s:`, stats);
    
    // Calculate field coverage
    const fieldCoverage = {
      images: productResults.filter(p => p.status === 'created' || p.status === 'updated').length,
      colors: productResults.filter(p => p.color).length,
      productLines: new Set(productResults.map(p => p.productLineId)).size,
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        stats,
        products: productResults.slice(0, 100), // Limit response size
        fieldCoverage,
        duration_seconds: duration,
        message: dryRun 
          ? `[DRY RUN] Would sync ${stats.created + stats.updated} ${BRAND_NAME} products`
          : `Synced ${stats.created + stats.updated} ${BRAND_NAME} products`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Sync error:', error);
    
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
        .eq('brand_slug', BRAND_SLUG);
    } catch (e) {
      console.error('Error resetting scraping status:', e);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Map Spectrum color names to hex codes
 * Extended mapping for colors not in main SPECTRUM_COLOR_MAPPING
 */
function mapSpectrumColorToHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const name = colorName.toLowerCase().trim();
  
  // Extended Spectrum color mappings (check FIRST for unique hex codes)
  const extendedMappings: Record<string, string> = {
    // Unique mappings for colors that would otherwise conflict
    'ivory beige': 'FFFFF0',  // Ivory color (unique from natural #F5F5DC)
    
    // PLA Magic SILK colors
    'magenta dream': 'DA70D6', // Orchid-like magenta (unique from magenta blossom)
    'vivid lavender': 'B57EDC',
    'mystic orchid': '9370DB',
    'lagoon breeze': '48D1CC',
    'aurora bloom': 'FFB7C5',
    'fire & ice': 'FF4500',
    'fire ice': 'FF4500',
    'golden berry': 'FFD700',
    'solar flare': 'FF6B35',
    'amber leaf': 'FFBF00',
    'magenta blossom': 'FF77FF',
    'raspberry blush': 'E30B5C',
    'forest flame': '355E3B',  // Dark green (unique from wizard green)
    'royal amethyst': '9966CC',
    'nightfire': '1A0A0A',
    'solar eclipse': '3D3D3D',
    
    // Pastello PLA colors
    'bonbon rose': 'FFB6C1',
    'water blue': 'ADD8E6',
    'pink pastel': 'FFD1DC',
    'pale salmon': 'FFA07A',
    'lemon cream': 'FFFACD',
    'holland red': 'CC0000',
    'flamingo red': 'FC8EAC',
    'cosmetic mauve': 'C7A6D3',
    'coctail green': '98FB98',
    'cocktail green': '98FB98',
    'atmospheric blue': 'A7C7E7',
    'apricot orange': 'FBCEB1',
    
    // SILK Rainbow colors
    'ancient': 'C4A484',
    'earth blend': '8B4513',
    'frost gloss': 'E0FFFF',
    'ocean melange': '006994',
    'fire red': 'FF2400',
    'fusion': 'FF6B6B',
    
    // Standard SILK colors
    'unmellow yellow': 'FFFF00',
    'tropical green': '00FF7F',
    'taffy pink': 'FFB7C5',
    'sterling silver': 'C0C0C0',
    'spicy copper': 'B87333',
    'sapphire blue': '0F52BA',
    'rose gold': 'B76E79',
    'pearl white': 'F5F5F5',
    'indigo blue': '4B0082',
    'glorious gold': 'FFD700',
    'cinnamon bronze': 'CD7F32',
    'candy blue': '87CEEB',
    'amethyst violet': '9966CC',
    'aluminium silver': 'A9ACB6',
    'apple green': '8DB600',
    
    // Premium PLA colors
    'wizard indigo': '4B0082',
    'wizard charcoal': '36454F',
    'wizard green': '2E8B57',  // Sea green (unique)
    'true red': 'E63333',     // Slightly brighter red (unique from bloody red)
    'translucent': 'F0F0F0',
    'pigeon blue': '7285A5',
    'pearl grey': 'E8E4D9',
    'pearl gold': 'F0E68C',   // Khaki-gold (unique from old gold)
    'oregano green': '5C8A4D',
    'old gold': 'CFB53B',
    'lavender violett': 'B57EDC',
    'lavender violet': 'B57EDC',
    'golden line': 'EEC900',  // Darker gold (unique from old gold/pearl gold)
    'fox orange': 'FF6A00',
    'fluo yellow': 'DFFF00',
    'fluo orange': 'FF5E00',
    'fluo green': '39FF14',
    'flipflop green': '00CED1',
    'dragon red': 'B22222',
    'dahlia yellow': 'F5C71A',
    'chrysocolla green': '56A0D3',
    'carribean blue': '1AC6FF',
    'caribbean blue': '1AC6FF',
    'blue lagoon': '20B2AA',  // Light sea green (unique from pastel turquoise)
    'bahama yellow': 'F8E300',
    'baby blue': '89CFF0',
    'arctic white': 'F0F8FF',  // Alice blue tint (unique from polar white)
    'anthracite grey': '293133',
    
    // Engineering colors
    'traffic black': '0A0A0A',
    'traffic red': 'CC0000',
    'traffic white': 'F6F6F6',
    'transparent red': 'FF000080',
    'transparent blue': '0000FF80',
    'bk': '0A0A0A', // Black abbreviation
    'natural': 'F5F5DC',
    'iron grey': '52595D',
    
    // Wood colors
    'oak': 'B8860B',
    'ebony black': '1B1B1B',
    
    // High Speed colors
    'telegrey': 'A8A8A8',
    'walnut brown': '5C4033',
    'crimson red': 'DC143C',
    'latte beige': 'C8AD7F',
    'signal white': 'FFFFFF',
    'neon transparent': 'E0FFE0',
    'neon orange uv': 'FF6600',
    'neon green uv': '39FF14',
    
    // Crystal colors
    'raspberry red': 'E30B5C',
    'neon orange': 'FF6600',
    'neon green': '39FF14',
    'frozen berry': 'A020F0',
    'electric yellow': 'FFFF33',
    'blue horizon': '5DADEC',
    
    // Glitter colors
    'stardust blue': '4169E1',
    'glitter galaxy': '4B0082',
    
    // Glow colors
    'glow yellow': 'FFFF00',
    'glow green': '39FF14',
    
    // Other specialty colors
    'performance blue': '0066CC',
    'industrial grey': '6C6C6C',
    'midnight black': '0A0A0A',
    'true yellow': 'FFFF00',
    'bloody red': 'B80000',   // Darker blood red (unique)
    'cherry red': 'DE3163',   // Cerise red (unique from true red/bloody red)
    'forest green': '0B6623', // Dark forest green (unique from wizard green)
    'pastel turquoise': '7FFFD4', // Aquamarine (unique from blue lagoon)
    'bottle green': '006A4E',
    'chocolate brown': '3D2B1F',
    'glassy': 'E0E0E0',
    'beige': 'F5F5DC',
  };
  
  // Check extended mappings first (exact match - most specific)
  if (extendedMappings[name]) {
    return extendedMappings[name];
  }
  
  // Try partial matching for compound color names (prioritize longer keys)
  const sortedKeys = Object.keys(extendedMappings).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (name.includes(key)) {
      return extendedMappings[key];
    }
  }
  
  // THEN check main SPECTRUM_COLOR_MAPPING (generic colors)
  if (SPECTRUM_COLOR_MAPPING[name]) {
    return SPECTRUM_COLOR_MAPPING[name];
  }
  
  // Fallback color family detection
  if (/black|dark|ebony|midnight|charcoal|anthracite/i.test(name)) return '1A1A1A';
  if (/white|polar|arctic|signal|snow/i.test(name)) return 'F5F5F5';
  if (/silver|grey|gray|aluminium/i.test(name)) return 'A0A0A0';
  if (/gold|golden/i.test(name)) return 'FFD700';
  if (/red|crimson|bloody|ruby|dragon|cherry|raspberry/i.test(name)) return 'CC0000';
  if (/blue|navy|sapphire|pacific|ocean|sky|indigo|lagoon/i.test(name)) return '0066CC';
  if (/green|lime|forest|mint|tropical|apple|emerald/i.test(name)) return '228B22';
  if (/orange|lion|carrot|fox|apricot|amber/i.test(name)) return 'FF6600';
  if (/yellow|bahama|lemon|dahlia|sulfur|fluo/i.test(name)) return 'FFD700';
  if (/pink|rose|magenta|blush|flamingo|taffy/i.test(name)) return 'FF69B4';
  if (/purple|violet|lavender|amethyst|orchid|mauve/i.test(name)) return '8B008B';
  if (/brown|chocolate|walnut|cinnamon|bronze|oak/i.test(name)) return '8B4513';
  if (/beige|ivory|cream|natural|latte/i.test(name)) return 'F5F5DC';
  if (/copper|rust/i.test(name)) return 'B87333';
  if (/turquoise|teal|cyan|aqua/i.test(name)) return '00CED1';
  if (/transparent|clear|glassy|translucent/i.test(name)) return 'E0E0E0';
  
  return null;
}
