/**
 * NINJATEK CSV-SEEDED SYNC PIPELINE
 * 
 * Uses a curated CSV seed for NinjaTek TPU filaments:
 * - NinjaFlex 85A, Edge 83A, Chinchilla 75A, Cheetah 95A, Armadillo 75D, Eel 90A
 * - Plus ColorFabb filaments sold via NinjaTek store
 * 
 * Filtering (per requirements):
 * - No 2.85mm/3mm diameter products
 * - No bulk products (>5.5kg)
 * - No sample products (<300g)
 * - No gift cards or non-filament products
 * 
 * Platform: WooCommerce (WordPress) - uses curated CSV seed
 * Currency: USD
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  enrichNinjatekProduct,
  cleanNinjatekTitle,
  extractProductLine,
  getNinjatekColorHex,
  getNinjatekProductImage,
  NINJATEK_TDS_URLS,
  shouldIncludeNinjatekVariant,
  type NinjatekProductLine,
} from '../_shared/ninjatek-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncDecision {
  type: 'color_extraction' | 'product_line' | 'filter' | 'hex_lookup' | 'material_separation';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  reason: string;
}

interface ProductVariant {
  productId: string;
  title: string;
  productLine: NinjatekProductLine | null;
  material: string;
  color: string;
  colorHex: string | null;
  price: number | null;
  weightKg: number;
  diameterMm: number;
  url: string;
  imageUrl: string | null;
  available: boolean;
}

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  products: Array<{ id: string; title: string; action: string; reason?: string }>;
  fieldCoverage: Record<string, number>;
  decisions: SyncDecision[];
}

// ============================================================================
// CSV SEED DATA (from ninjatek_filaments.csv)
// ============================================================================

const NINJATEK_SEED_DATA = `Material,Filament Name,Filament URL,Filament Color,Product Image,Hex Code
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Fire Red,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Flamingo Pink,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Grass Green,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Lava Orange,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Midnight Black,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Neon Glow,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Sapphire Blue,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Snow White,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Steel Gray,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Sun Yellow,,N/A
NinjaFlex 85A TPU,NinjaFlex 3D Printer Filament (85A),https://ninjatek.com/shop/ninjaflex/,Water Translucent,,N/A
Edge 83A TPU,NinjaFlex Edge 3D Printer Filament (83A),https://ninjatek.com/shop/edge/,Midnight Black,,N/A
Edge 83A TPU,NinjaFlex Edge 3D Printer Filament (83A),https://ninjatek.com/shop/edge/,Snow White,,N/A
Chinchilla 75A TPU,Chinchilla 3D Printer Filament (75A),https://ninjatek.com/shop/chinchilla/,Midnight Black,,N/A
Chinchilla 75A TPU,Chinchilla 3D Printer Filament (75A),https://ninjatek.com/shop/chinchilla/,Sky Blue,,N/A
Chinchilla 75A TPU,Chinchilla 3D Printer Filament (75A),https://ninjatek.com/shop/chinchilla/,Snow White,,N/A
Chinchilla 75A TPU,Chinchilla 3D Printer Filament (75A),https://ninjatek.com/shop/chinchilla/,Steel Gray,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Fire Red,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Flamingo Pink,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Grass Green,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Lava Orange,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Midnight Black,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Neon Glow,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Sapphire Blue,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Snow White,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Steel Gray,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Sun Yellow,,N/A
Cheetah 95A TPU,Cheetah 3D Printer Filament (95A),https://ninjatek.com/shop/cheetah/,Water Translucent,,N/A
Armadillo 75D TPU,Armadillo 3D Printer Filament (75D),https://ninjatek.com/shop/armadillo/,Fire Red,,N/A
Armadillo 75D TPU,Armadillo 3D Printer Filament (75D),https://ninjatek.com/shop/armadillo/,Grass Green,,N/A
Armadillo 75D TPU,Armadillo 3D Printer Filament (75D),https://ninjatek.com/shop/armadillo/,Lava Orange,,N/A
Armadillo 75D TPU,Armadillo 3D Printer Filament (75D),https://ninjatek.com/shop/armadillo/,Midnight Black,,N/A
Armadillo 75D TPU,Armadillo 3D Printer Filament (75D),https://ninjatek.com/shop/armadillo/,Sapphire Blue,,N/A
Armadillo 75D TPU,Armadillo 3D Printer Filament (75D),https://ninjatek.com/shop/armadillo/,Snow White,,N/A
Armadillo 75D TPU,Armadillo 3D Printer Filament (75D),https://ninjatek.com/shop/armadillo/,Steel Gray,,N/A
Armadillo 75D TPU,Armadillo 3D Printer Filament (75D),https://ninjatek.com/shop/armadillo/,Sun Yellow,,N/A
Armadillo 75D TPU,Armadillo 3D Printer Filament (75D),https://ninjatek.com/shop/armadillo/,Water Translucent,,N/A
colorFabb ASA,colorFabb ASA 3D Printer Filaments,https://ninjatek.com/shop/colorfabb-asa/,Black,,N/A
colorFabb ASA,colorFabb ASA 3D Printer Filaments,https://ninjatek.com/shop/colorfabb-asa/,Natural,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Black,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Dutch Orange,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Gray Silver,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Green,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Leaf Green,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Natural,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Red,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Shining Silver,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Signal Yellow,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Silver,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,White,,N/A
colorFabb PLA,colorFabb PLA 3D Printer Filament,https://ninjatek.com/shop/colorfabb-pla/,Yellow,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Black,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Carbon Gray,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Clear,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Dark Blue,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Dark Gray,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Dark Green,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Gold Metalic,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Gray Metalic,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Light Blue,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Light Green,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Orange,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Red,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,Silver,,N/A
colorFabb Co-Polyester,colorFabb Co-Polyesters 3D Printer Filament,https://ninjatek.com/shop/colorfabb-co-polyesters/,White,,N/A
colorFabb Specials,colorFabb Specials 3D Printer Filaments,https://ninjatek.com/shop/colorfabb-specials/,Black,,N/A
colorFabb Specials,colorFabb Specials 3D Printer Filaments,https://ninjatek.com/shop/colorfabb-specials/,Natural,,N/A
colorFabb Specials,colorFabb Specials 3D Printer Filaments,https://ninjatek.com/shop/colorfabb-specials/,bronzeFill,,N/A
colorFabb Specials,colorFabb Specials 3D Printer Filaments,https://ninjatek.com/shop/colorfabb-specials/,copperFill,,N/A
colorFabb Specials,colorFabb Specials 3D Printer Filaments,https://ninjatek.com/shop/colorfabb-specials/,glowFill,,N/A
colorFabb Specials,colorFabb Specials 3D Printer Filaments,https://ninjatek.com/shop/colorfabb-specials/,steelFill,,N/A
colorFabb Specials,colorFabb Specials 3D Printer Filaments,https://ninjatek.com/shop/colorfabb-specials/,woodFill,,N/A`;

// Excluded rows (per requirements: no 2.85mm/3mm, no Eel with only diameter options)
const EXCLUDED_ENTRIES = [
  'Eel 90A (Conductive TPU)', // Has only diameter variants (1.75mm, 3mm) not colors
  'colorFabb PA (Nylon)',     // Has only diameter variants (1.75mm, 2.85mm) not colors
];

function parseCsvSeed(): ProductVariant[] {
  const variants: ProductVariant[] = [];
  const lines = NINJATEK_SEED_DATA.split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV (handles quoted fields with commas)
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    
    const [material, filamentName, filamentUrl, filamentColor] = fields;
    
    // Skip excluded entries
    if (EXCLUDED_ENTRIES.some(e => material?.includes(e))) {
      console.log(`[NINJATEK-SYNC] SKIP excluded entry: ${material} - ${filamentColor}`);
      continue;
    }
    
    // Skip non-color entries (diameter values like "1.75mm", "3mm", "2.85mm")
    if (/^\d+\.?\d*\s*mm$/i.test(filamentColor)) {
      console.log(`[NINJATEK-SYNC] SKIP diameter variant: ${material} - ${filamentColor}`);
      continue;
    }
    
    const cleanedName = cleanNinjatekTitle(filamentName);
    const productLine = extractProductLine(filamentName);
    const enriched = enrichNinjatekProduct(filamentName, filamentColor);
    
    // Generate unique product ID - include material to avoid duplicates between Edge and NinjaFlex
    const colorSlug = filamentColor.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const productId = `ninjatek-${productLine || 'generic'}-${enriched.material.toLowerCase()}-${colorSlug}`;
    
    // Get product-level image for this product line
    const productImage = getNinjatekProductImage(productLine);
    
    variants.push({
      productId,
      title: `${cleanedName} - ${filamentColor}`,
      productLine,
      material: enriched.material,
      color: filamentColor,
      colorHex: enriched.colorHex,
      price: null, // Will be scraped or set manually
      weightKg: 0.5, // Default NinjaTek spool
      diameterMm: 1.75, // Default (we filter out 3mm)
      url: filamentUrl,
      imageUrl: productImage, // Use product-line level image
      available: true,
    });
  }
  
  console.log(`[NINJATEK-SYNC] Parsed ${variants.length} variants from CSV seed`);
  return variants;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function deleteExistingProducts(supabase: any): Promise<number> {
  console.log('[NINJATEK-SYNC] Deleting existing NinjaTek products for clean slate...');
  
  const { data: existing, error: countError } = await supabase
    .from('filaments')
    .select('id')
    .ilike('vendor', 'ninjatek');
  
  const existingCount = existing?.length || 0;
  console.log(`[NINJATEK-SYNC] Found ${existingCount} existing products`);
  
  if (existingCount > 0) {
    const { error: deleteError } = await supabase
      .from('filaments')
      .delete()
      .ilike('vendor', 'ninjatek');
    
    if (deleteError) {
      console.error('[NINJATEK-SYNC] Delete error:', deleteError);
      throw deleteError;
    }
    console.log(`[NINJATEK-SYNC] Deleted ${existingCount} existing products`);
  }
  
  return existingCount;
}

async function upsertVariants(
  supabase: any,
  variants: ProductVariant[],
  brandId: string | null,
  decisions: SyncDecision[]
): Promise<{ created: number; updated: number; skipped: number; errors: number; products: Array<{ id: string; title: string; action: string; reason?: string }> }> {
  console.log(`[NINJATEK-SYNC] Upserting ${variants.length} variants...`);
  
  let created = 0, updated = 0, skipped = 0, errors = 0;
  const products: Array<{ id: string; title: string; action: string; reason?: string }> = [];
  
  for (const variant of variants) {
    try {
      const enriched = enrichNinjatekProduct(variant.title, variant.color);
      
      // Log decision for color extraction
      decisions.push({
        type: 'color_extraction',
        input: { title: variant.title, color: variant.color },
        output: { colorHex: enriched.colorHex, colorName: enriched.colorName },
        reason: enriched.colorHex ? 'Matched color in mapping' : 'No hex mapping found',
      });
      
      // Log decision for product line
      decisions.push({
        type: 'product_line',
        input: { title: variant.title },
        output: { productLineId: enriched.productLineId, productLine: enriched.productLine },
        reason: `Extracted product line: ${enriched.productLine || 'generic'}`,
      });
      
      const filamentData = {
        product_id: variant.productId,
        product_title: variant.title,
        vendor: 'NinjaTek',
        brand_id: brandId,
        material: enriched.material,
        product_line_id: enriched.productLineId,
        finish_type: enriched.finishType,
        color_hex: variant.colorHex || enriched.colorHex,
        color_family: variant.color,
        variant_price: variant.price,
        variant_available: variant.available,
        product_url: variant.url,
        featured_image: variant.imageUrl,
        tds_url: enriched.tdsUrl,
        nozzle_temp_min_c: enriched.nozzleTempMin,
        nozzle_temp_max_c: enriched.nozzleTempMax,
        bed_temp_min_c: enriched.bedTempMin,
        bed_temp_max_c: enriched.bedTempMax,
        print_speed_max_mms: enriched.printSpeedMax,
        net_weight_g: enriched.weightKg * 1000,
        diameter_nominal_mm: enriched.diameterMm,
        shore_hardness_d: enriched.shoreHardness ? parseInt(enriched.shoreHardness.replace(/[AD]/i, ''), 10) : null,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
        auto_created: true,
        auto_updated: false,
      };
      
      const { error } = await supabase
        .from('filaments')
        .insert(filamentData);
      
      if (error) throw error;
      
      created++;
      products.push({ id: variant.productId, title: variant.title, action: 'created' });
      
    } catch (error) {
      console.error(`[NINJATEK-SYNC] Error upserting ${variant.productId}:`, error);
      errors++;
      products.push({ 
        id: variant.productId, 
        title: variant.title, 
        action: 'error',
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return { created, updated, skipped, errors, products };
}

// ============================================================================
// FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<number> {
  console.log('[NINJATEK-SYNC] Fixing duplicate hex codes within product lines...');
  
  try {
    // Find duplicates within same product_line_id
    const { data: allFilaments } = await supabase
      .from('filaments')
      .select('id, product_line_id, color_hex, color_family')
      .ilike('vendor', 'ninjatek')
      .not('color_hex', 'is', null);
    
    if (!allFilaments || allFilaments.length === 0) return 0;
    
    // Group by product_line_id + color_hex
    const groups: Record<string, typeof allFilaments> = {};
    for (const f of allFilaments) {
      const key = `${f.product_line_id}:${f.color_hex?.toLowerCase()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    
    let fixed = 0;
    for (const [key, items] of Object.entries(groups)) {
      if (items.length <= 1) continue;
      
      // Skip first, adjust others
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const originalHex = item.color_hex?.replace('#', '') || 'FFFFFF';
        const hexNum = parseInt(originalHex, 16);
        const newHexNum = (hexNum + i * 17) % 0xFFFFFF;
        const newHex = `#${newHexNum.toString(16).padStart(6, '0').toUpperCase()}`;
        
        const { error } = await supabase
          .from('filaments')
          .update({ color_hex: newHex })
          .eq('id', item.id);
        
        if (!error) {
          console.log(`[NINJATEK-SYNC] Fixed duplicate hex: ${item.color_family} ${item.color_hex} -> ${newHex}`);
          fixed++;
        }
      }
    }
    
    return fixed;
  } catch (error) {
    console.error('[NINJATEK-SYNC] Error fixing hex codes:', error);
    return 0;
  }
}

// ============================================================================
// CALCULATE FIELD COVERAGE
// ============================================================================

async function calculateFieldCoverage(supabase: any): Promise<Record<string, number>> {
  const { data: filaments } = await supabase
    .from('filaments')
    .select('color_hex, featured_image, tds_url, variant_price, product_url')
    .ilike('vendor', 'ninjatek');
  
  if (!filaments || filaments.length === 0) {
    return { color_hex: 0, featured_image: 0, tds_url: 0, variant_price: 0, product_url: 0 };
  }
  
  const total = filaments.length;
  return {
    color_hex: Math.round((filaments.filter((f: any) => f.color_hex).length / total) * 100),
    featured_image: Math.round((filaments.filter((f: any) => f.featured_image).length / total) * 100),
    tds_url: Math.round((filaments.filter((f: any) => f.tds_url).length / total) * 100),
    variant_price: Math.round((filaments.filter((f: any) => f.variant_price).length / total) * 100),
    product_url: Math.round((filaments.filter((f: any) => f.product_url).length / total) * 100),
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[NINJATEK-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[NINJATEK-SYNC] 🚀 NINJATEK CSV-SEEDED SYNC STARTED');
  console.log('[NINJATEK-SYNC] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options (limit is ignored for CSV-seeded brands)
    let options: { dryRun?: boolean; cleanSlate?: boolean } = {};
    try {
      const body = await req.json();
      options = body;
    } catch {}

    const decisions: SyncDecision[] = [];

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'ninjatek')
      .maybeSingle();
    
    const brandId = brand?.id || null;

    // Step 1: Parse CSV seed
    const variants = parseCsvSeed();
    console.log(`[NINJATEK-SYNC] Step 1: Parsed ${variants.length} variants from CSV`);
    
    // Log filter decisions
    decisions.push({
      type: 'filter',
      input: { totalCsvRows: 76 },
      output: { includedVariants: variants.length, excludedEntries: EXCLUDED_ENTRIES },
      reason: 'Filtered out Eel (diameter-only) and colorFabb PA (diameter-only)',
    });

    let created = 0, updated = 0, skipped = 0, errors = 0;
    let products: Array<{ id: string; title: string; action: string; reason?: string }> = [];

    if (!options.dryRun) {
      // Step 2: Delete existing products (clean slate for CSV-seeded sync)
      const deleted = await deleteExistingProducts(supabase);
      console.log(`[NINJATEK-SYNC] Step 2: Deleted ${deleted} existing products`);

      // Step 3: Upsert all variants
      const result = await upsertVariants(supabase, variants, brandId, decisions);
      created = result.created;
      updated = result.updated;
      skipped = result.skipped;
      errors = result.errors;
      products = result.products;
      console.log(`[NINJATEK-SYNC] Step 3: Created ${created}, Updated ${updated}, Errors ${errors}`);

      // Step 4: Fix duplicate hex codes
      const hexFixed = await fixDuplicateHexCodes(supabase);
      console.log(`[NINJATEK-SYNC] Step 4: Fixed ${hexFixed} duplicate hex codes`);

      // Step 5: Update brand counts
      if (brandId) {
        try {
          await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'ninjatek' });
          await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'ninjatek' });
        } catch (e) {
          console.warn('[NINJATEK-SYNC] Warning: Could not update brand counts:', e);
        }
      }
    } else {
      console.log('[NINJATEK-SYNC] DRY RUN - No database changes made');
      products = variants.map(v => ({ id: v.productId, title: v.title, action: 'would_create' }));
    }

    // Calculate field coverage
    const fieldCoverage = options.dryRun ? {} : await calculateFieldCoverage(supabase);

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('[NINJATEK-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[NINJATEK-SYNC] ✅ SYNC COMPLETED in ${duration}s`);
    console.log(`[NINJATEK-SYNC] Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log('[NINJATEK-SYNC] ═══════════════════════════════════════════════════════');

    const result: SyncResult = {
      success: errors === 0,
      created,
      updated,
      skipped,
      errors,
      products,
      fieldCoverage,
      decisions,
    };

    return new Response(JSON.stringify({
      success: result.success,
      duration,
      summary: {
        totalDiscovered: variants.length,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      },
      products: result.products,
      fieldCoverage: result.fieldCoverage,
      scrapeDecisionLogs: result.decisions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NINJATEK-SYNC] ❌ Fatal error:', error);
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
