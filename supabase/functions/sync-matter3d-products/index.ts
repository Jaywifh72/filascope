import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichMatter3dProduct,
  cleanMatter3dTitle,
  isFilamentProduct,
  parseVariantTitle,
  getMatter3dColorHex,
  normalizeMatter3dMaterial,
  extractFinishType,
  generateMatter3dProductLineId,
} from '../_shared/matter3d-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncOptions {
  dryRun?: boolean;
  limit?: number;
  tasks?: string[];
  skipScrape?: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    discovered: number;
    created: number;
    updated: number;
    enriched: number;
    errors: number;
    duplicateHexesFixed: number;
  };
  errors: string[];
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string;
    available: boolean;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    image_id: number | null;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
  }>;
}

// Sync decision logging for AI Fix Prompt evolution
interface SyncDecision {
  type: 'skip' | 'color_extract' | 'product_line' | 'hex_lookup' | 'filter';
  product: string;
  variant: string;
  input: Record<string, string | null>;
  output: string | null;
  reason: string;
  success: boolean;
}

const syncDecisions: SyncDecision[] = [];

function logDecision(decision: SyncDecision) {
  syncDecisions.push(decision);
  const status = decision.success ? '✓' : '✗';
  console.log(`[Matter3D] [${decision.type}] ${status} ${decision.product}: ${decision.reason}`);
}

// Weight/size/spool type pattern check - excludes non-color values
// CRITICAL: This must catch spool types (Cardboard/Plastic) but ALLOW valid colors from option3
function isWeightOrSizeOrSpool(value: string | null): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  
  // Exact matches for known non-colors (Matter3D-specific)
  const exactNonColors = [
    'single', 'default', 'default title', 'quote', 'minimum',
    'prototyping', 'functional use', 'cardboard', 'plastic',
    'cardboard spool', 'plastic spool',
    '10% - prototyping', '15% - functional use'  // Matter3D percentage placeholders
  ];
  if (exactNonColors.includes(v)) return true;
  
  // Weight patterns (multiple formats)
  if (/^\d+(\.\d+)?\s*(kg|g|lb|oz)$/i.test(v)) return true;
  if (/^(0\.5|0\.75|1|2|3|5|10)\s*kg$/i.test(v)) return true;
  if (/^\d+\s*x\s*\d+\s*(kg|g)$/i.test(v)) return true;  // "10 x 1 kg"
  
  // Size/diameter patterns
  if (/^\d+(\.\d+)?\s*mm$/i.test(v)) return true;
  if (/^(1\.75|2\.85|3\.0)\s*mm$/i.test(v)) return true;
  
  // Spool type patterns (substring match for edge cases like "Cardboard Spool")
  if (/\bcardboard\b|\bplastic\b/i.test(v)) return true;
  
  // Industrial/bulk patterns
  if (/100\s*kg|minimum|quote|industrial/i.test(v)) return true;
  
  // Percentage patterns - REMOVED $ anchor to catch "15% - Functional Use"
  if (/^\d+\s*%/i.test(v)) return true;
  
  return false;
}

// Derive color family from color name for better categorization
function deriveColorFamily(colorName: string): string | null {
  const c = colorName.toLowerCase();
  if (/black|charcoal|jet|carbon/i.test(c)) return 'Black';
  if (/white|snow|cream|eggshell|bone/i.test(c)) return 'White';
  if (/grey|gray|silver|gunmetal|slate|steel/i.test(c)) return 'Grey';
  if (/blue|ocean|sky|navy|cobalt|teal|cayman|fighter|industrial|ice|royal|electric/i.test(c)) return 'Blue';
  if (/green|forest|olive|mint|lime|sage|hunter|grass|evergreen|neon/i.test(c)) return 'Green';
  if (/red|wine|brick|burgundy|crimson|maroon|rust|fire|clay/i.test(c)) return 'Red';
  if (/pink|fuchsia|magenta|rose|salmon|hot|coral|bubblegum/i.test(c)) return 'Pink';
  if (/orange|coral|tangerine|peach|burnt|safety|fire/i.test(c)) return 'Orange';
  if (/yellow|gold|sunshine|lemon|mustard|banana|caterpillar/i.test(c)) return 'Yellow';
  if (/purple|violet|lavender|plum|grape|royal/i.test(c)) return 'Purple';
  if (/brown|chocolate|mocha|tan|wood|natural|sandstone|khaki|desert|coffee|beige/i.test(c)) return 'Brown';
  if (/transparent|clear|translucent/i.test(c)) return 'Transparent';
  if (/aqua|turquoise|cyan|seafoam/i.test(c)) return 'Aqua';
  return null;
}

// Extract color from Shopify variant options
// CRITICAL FIX: Matter3D has INCONSISTENT option structures:
// - Matte products: option1=Size, option2=Color, option3=SpoolType
// - Performance products: option1=Diameter, option2=Size, option3=Color
// - Simple products: option1=Color or option1=Size only
// We MUST check ALL three options using isWeightOrSizeOrSpool() to filter non-colors
function extractColorFromShopifyVariant(variant: ShopifyProduct['variants'][0], productTitle: string = ''): string | null {
  // Check options in priority order, using isWeightOrSizeOrSpool() to filter
  const candidates = [
    { opt: variant.option2, name: 'option2' },
    { opt: variant.option1, name: 'option1' },
    { opt: variant.option3, name: 'option3' },
  ];
  
  for (const { opt, name } of candidates) {
    if (opt && !isWeightOrSizeOrSpool(opt)) {
      logDecision({
        type: 'color_extract',
        product: productTitle,
        variant: variant.title || '',
        input: { option1: variant.option1, option2: variant.option2, option3: variant.option3 },
        output: opt.trim(),
        reason: `Extracted color "${opt}" from ${name}`,
        success: true
      });
      return opt.trim();
    }
  }
  
  // Fallback: try to extract color from variant.title by parsing slash-separated parts
  if (variant.title) {
    const titleParts = variant.title.split(/[\/\-]/).map((p: string) => p.trim());
    for (const part of titleParts) {
      if (part && !isWeightOrSizeOrSpool(part)) {
        logDecision({
          type: 'color_extract',
          product: productTitle,
          variant: variant.title || '',
          input: { option1: variant.option1, option2: variant.option2, option3: variant.option3, variantTitle: variant.title },
          output: part,
          reason: `Extracted color "${part}" from variant.title fallback`,
          success: true
        });
        return part;
      }
    }
  }
  
  logDecision({
    type: 'color_extract',
    product: productTitle,
    variant: variant.title || '',
    input: { option1: variant.option1, option2: variant.option2, option3: variant.option3 },
    output: null,
    reason: `All options and title parts are weights/sizes/spool types`,
    success: false
  });
  
  console.log(`[Matter3D] No color found: o1=${variant.option1}, o2=${variant.option2}, o3=${variant.option3}, title=${variant.title}`);
  return null;
}

// Check if product should be filtered out
function shouldSkipMatter3dProduct(product: ShopifyProduct, variant: ShopifyProduct['variants'][0]): boolean {
  const title = product.title.toLowerCase();
  const variantTitle = (variant.title || '').toLowerCase();
  const price = parseFloat(variant.price);
  
  // Skip pellets (industrial format)
  if (/pellets?|granules?/i.test(title)) {
    console.log(`[Matter3D] SKIP pellets: ${product.title}`);
    return true;
  }
  
  // Skip large format industrial products
  if (/large.?format/i.test(title)) {
    console.log(`[Matter3D] SKIP large format: ${product.title}`);
    return true;
  }
  
  // Skip custom color orders
  if (/custom\s*colou?r/i.test(title)) {
    console.log(`[Matter3D] SKIP custom color: ${product.title}`);
    return true;
  }
  
  // Skip bundles, multi-packs, and bulk buy (including "10 packs")
  if (/bundle|cmyk|\d+\s*packs?|multi.?pack|bulk\s*buy|\d+\s*rolls/i.test(title)) {
    console.log(`[Matter3D] SKIP bundle/multi-pack: ${product.title}`);
    return true;
  }
  
  // Skip conductive/specialty materials
  if (/conductive|cnt|esd/i.test(title)) {
    console.log(`[Matter3D] SKIP specialty: ${product.title}`);
    return true;
  }
  
  // Skip variants with "Single" as the color (placeholder)
  const color = variant.option2 || variant.option1 || '';
  if (/^single$/i.test(color.trim())) {
    console.log(`[Matter3D] SKIP single placeholder: ${variant.title}`);
    return true;
  }
  
  // Skip Default Title variants (non-color products)
  if (variant.option1 === 'Default Title') {
    console.log(`[Matter3D] SKIP default title: ${product.title}`);
    return true;
  }
  
  // Skip very high price items (>$120 CAD for single unit - likely bulk/industrial)
  // Increased from $100 to $120 to accommodate Canadian pricing
  if (price > 120) {
    console.log(`[Matter3D] SKIP high price: ${product.title} ($${price})`);
    return true;
  }
  
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats = {
    discovered: 0,
    created: 0,
    updated: 0,
    enriched: 0,
    errors: 0,
    duplicateHexesFixed: 0,
  };
  const errors: string[] = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const options: SyncOptions = await req.json().catch(() => ({}));
    const { dryRun = false, limit, tasks = ['sync', 'scrape', 'enrich', 'hex-fix', 'tds'] } = options;

    console.log(`[Matter3D] Starting sync - dryRun: ${dryRun}, limit: ${limit}, tasks: ${tasks.join(', ')}`);

    // Safe delete threshold - only delete existing records if we have this many valid products
    const SAFE_DELETE_THRESHOLD = 50;

    // ========================================
    // STEP 1: BASE SYNC VIA SHOPIFY API
    // ========================================
    if (tasks.includes('sync')) {
      console.log('[Matter3D] Step 1: Base sync via Shopify API');

      try {
        const shopifyUrl = 'https://matter3d.com/products.json?limit=250';
        const response = await fetch(shopifyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FilaScopeBot/1.0)',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Shopify API returned ${response.status}`);
        }

        const data = await response.json();
        const products: ShopifyProduct[] = data.products || [];

        console.log(`[Matter3D] Found ${products.length} total products`);

        // Filter to filaments only
        const filamentProducts = products.filter(p => isFilamentProduct(p.title, p.product_type));
        console.log(`[Matter3D] Filtered to ${filamentProducts.length} filament products`);

        // Build image lookup map
        const buildImageMap = (product: ShopifyProduct): Map<number, string> => {
          const imageMap = new Map<number, string>();
          for (const img of product.images || []) {
            imageMap.set(img.id, img.src);
          }
          return imageMap;
        };

        // Check if product has ANY color option (not just pack sizes or bulk quantities)
        // This filters out Essentials PLA (bulk packs) and PETG CF HF (industrial)
        const hasColorVariants = (product: ShopifyProduct): boolean => {
          // Check if any option is named "Color" or similar
          const options = (product as any).options || [];
          const optionNames = options.map((o: any) => o.name?.toLowerCase() || '');
          if (optionNames.some((n: string) => ['color', 'colour'].includes(n))) {
            return true;
          }
          
          // Check if any variant has a non-weight/size option value
          for (const variant of product.variants) {
            const colorCandidate = extractColorFromShopifyVariant(variant, product.title);
            if (colorCandidate) return true;
          }
          
          return false;
        };

        // Filter out products with no color variants (bulk packs only)
        const colorProducts = filamentProducts.filter(p => {
          if (!hasColorVariants(p)) {
            console.log(`[Matter3D] SKIP no color variants (bulk pack): ${p.title}`);
            return false;
          }
          return true;
        });
        console.log(`[Matter3D] After color filter: ${colorProducts.length} products with colors`);

        // Process each product
        const productsToProcess = limit ? colorProducts.slice(0, limit) : colorProducts;

        // ========================================
        // PHASE 1: COLLECT ALL VALID FILAMENTS
        // ========================================
        interface FilamentRecord {
          product_id: string;
          product_title: string;
          vendor: string;
          material: string | null;
          color_hex: string | null;
          color_family: string | null;
          variant_price: number | null;
          variant_compare_at_price: number | null;
          variant_available: boolean;
          variant_sku: string | null;
          product_url: string;
          featured_image: string | null;
          product_line_id: string;
          finish_type: string | null;
          diameter_nominal_mm: number;
          auto_created: boolean;
          auto_updated: boolean;
          last_scraped_at: string;
          sync_status: string;
        }
        
        const validFilaments: FilamentRecord[] = [];
        const seenProductIds = new Set<string>();

        for (const product of productsToProcess) {
          try {
            const cleanedTitle = cleanMatter3dTitle(product.title);
            const material = normalizeMatter3dMaterial(product.title);
            const productUrl = `https://matter3d.com/products/${product.handle}`;
            const imageMap = buildImageMap(product);

            // Process each variant (color explosion)
            for (const variant of product.variants) {
              stats.discovered++;

              // Skip bulk/pellet/custom products
              if (shouldSkipMatter3dProduct(product, variant)) {
                console.log(`[Matter3D] Skipping: ${product.title} - ${variant.title} (filtered)`);
                continue;
              }

              // Extract color from Shopify option fields (checks ALL options with filter)
              const colorName = extractColorFromShopifyVariant(variant, product.title);
              
              // Skip duplicate spool types (keep first instance - cardboard preferred)
              const variantParts = variant.title.split('/').map(p => p.trim());
              const hasPlasticSpool = variantParts.some(p => /plastic/i.test(p));
              if (hasPlasticSpool) {
                // Skip plastic spool variant if cardboard exists for same color
                const cardboardExists = product.variants.some(v => {
                  const vc = extractColorFromShopifyVariant(v);
                  const vParts = v.title.split('/').map(p => p.trim());
                  return vc === colorName && vParts.some(p => /cardboard/i.test(p));
                });
                if (cardboardExists) continue;
              }

              // Find variant-specific image
              let featuredImage: string | null = null;
              if (variant.image_id && imageMap.has(variant.image_id)) {
                featuredImage = imageMap.get(variant.image_id)!;
              } else {
                // Fallback: find image with matching alt text or first image
                const altMatch = product.images?.find(img => 
                  img.alt?.toLowerCase().includes(colorName?.toLowerCase() || '')
                );
                featuredImage = altMatch?.src || product.images?.[0]?.src || null;
              }

              const productId = `${product.id}_${variant.id}`;
              
              // Dedupe by product_id
              if (seenProductIds.has(productId)) continue;
              seenProductIds.add(productId);
              
              // Build variant title - remove trailing dashes first, then append color
              let baseTitle = cleanedTitle.replace(/[\s-]+$/, '').trim();
              let variantTitle: string;
              // Skip variants with no extracted color (colorless pack sizes, bulk quantities)
              if (!colorName) {
                console.log(`[Matter3D] SKIP colorless variant: ${product.title} - ${variant.title}`);
                continue;
              }
              
              // Don't add color if it's already in the title
              if (!baseTitle.toLowerCase().includes(colorName.toLowerCase())) {
                variantTitle = `${baseTitle} - ${colorName}`;
              } else {
                variantTitle = baseTitle;
              }
              
              const colorHex = getMatter3dColorHex(colorName || '');
              const finishType = extractFinishType(product.title);
              const productLineId = generateMatter3dProductLineId(product.title, material);
              
              // Derive color family even if hex lookup fails
              const colorFamily = colorName ? deriveColorFamily(colorName) : null;
              
              // Log hex lookup decision
              logDecision({
                type: 'hex_lookup',
                product: product.title,
                variant: variant.title,
                input: { colorName: colorName || null },
                output: colorHex,
                reason: colorHex ? `Found hex #${colorHex} for "${colorName}"` : `No hex mapping for "${colorName}"`,
                success: !!colorHex
              });

              validFilaments.push({
                product_id: productId,
                product_title: variantTitle,
                vendor: 'Matter3D',
                material,
                color_hex: colorHex ? `#${colorHex}` : null,
                color_family: colorFamily,
                variant_price: parseFloat(variant.price) || null,
                variant_compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                variant_available: variant.available,
                variant_sku: variant.sku || null,
                product_url: productUrl,
                featured_image: featuredImage,
                product_line_id: productLineId,
                finish_type: finishType !== 'Standard' ? finishType : null,
                diameter_nominal_mm: 1.75,
                auto_created: true,
                auto_updated: true,
                last_scraped_at: new Date().toISOString(),
                sync_status: 'synced',
              });
            }
          } catch (productError) {
            console.error(`[Matter3D] Product error: ${productError}`);
            stats.errors++;
            errors.push(`Product ${product.id}: ${productError}`);
          }
        }

        console.log(`[Matter3D] Collected ${validFilaments.length} valid filaments for sync`);

        // ========================================
        // PHASE 2: SAFE DELETE THEN INSERT
        // ========================================
        if (!dryRun && validFilaments.length >= SAFE_DELETE_THRESHOLD) {
          console.log(`[Matter3D] Safe delete: ${validFilaments.length} products collected (threshold: ${SAFE_DELETE_THRESHOLD})`);
          
          // Delete all existing Matter3D records
          const { error: deleteError } = await supabase
            .from('filaments')
            .delete()
            .eq('vendor', 'Matter3D');
            
          if (deleteError) {
            throw new Error(`Delete failed: ${deleteError.message}`);
          }
          
          console.log(`[Matter3D] Deleted existing records, inserting ${validFilaments.length} fresh records`);
          
          // Batch insert in chunks of 100
          const BATCH_SIZE = 100;
          for (let i = 0; i < validFilaments.length; i += BATCH_SIZE) {
            const batch = validFilaments.slice(i, i + BATCH_SIZE);
            const { error: insertError } = await supabase
              .from('filaments')
              .insert(batch);
              
            if (insertError) {
              console.error(`[Matter3D] Batch insert error: ${insertError.message}`);
              stats.errors++;
              errors.push(`Batch insert: ${insertError.message}`);
            } else {
              stats.created += batch.length;
            }
          }
          
          console.log(`[Matter3D] Inserted ${stats.created} records`);
        } else if (!dryRun) {
          // Fallback to upsert pattern if below threshold (shouldn't happen normally)
          console.log(`[Matter3D] Below threshold (${validFilaments.length} < ${SAFE_DELETE_THRESHOLD}), using upsert pattern`);
          
          for (const filamentData of validFilaments) {
            const { data: existing } = await supabase
              .from('filaments')
              .select('id')
              .eq('product_id', filamentData.product_id)
              .eq('vendor', 'Matter3D')
              .maybeSingle();

            if (existing) {
              const { error } = await supabase
                .from('filaments')
                .update(filamentData)
                .eq('id', existing.id);

              if (error) {
                console.error(`[Matter3D] Update error: ${error.message}`);
                stats.errors++;
                errors.push(`Update ${filamentData.product_id}: ${error.message}`);
              } else {
                stats.updated++;
              }
            } else {
              const { error } = await supabase
                .from('filaments')
                .insert(filamentData);

              if (error) {
                console.error(`[Matter3D] Insert error: ${error.message}`);
                stats.errors++;
                errors.push(`Insert ${filamentData.product_id}: ${error.message}`);
              } else {
                stats.created++;
              }
            }
          }
        } else {
          // Dry run
          console.log(`[DRY RUN] Would insert ${validFilaments.length} filaments`);
          stats.created = validFilaments.length;
        }

        console.log(`[Matter3D] Step 1 complete - Created: ${stats.created}, Updated: ${stats.updated}`);
      } catch (syncError) {
        console.error(`[Matter3D] Sync error: ${syncError}`);
        errors.push(`Sync: ${syncError}`);
      }
    }

    // ========================================
    // STEP 2: FIRECRAWL PRODUCT DETAIL SCRAPING
    // ========================================
    if (tasks.includes('scrape') && !options.skipScrape) {
      console.log('[Matter3D] Step 2: Firecrawl product detail scraping');

      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!firecrawlKey) {
        console.log('[Matter3D] No FIRECRAWL_API_KEY, skipping detail scrape');
      } else {
        // Get products missing specs
        const { data: productsToScrape } = await supabase
          .from('filaments')
          .select('id, product_url, product_title')
          .eq('vendor', 'Matter3D')
          .is('nozzle_temp_min_c', null)
          .not('product_url', 'is', null)
          .limit(10);

        if (productsToScrape && productsToScrape.length > 0) {
          // Get unique URLs
          const uniqueUrls = [...new Set(productsToScrape.map(p => p.product_url))];
          console.log(`[Matter3D] Scraping ${uniqueUrls.length} unique product pages`);

          for (const url of uniqueUrls) {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit

              const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${firecrawlKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url,
                  formats: ['html'],
                  onlyMainContent: true,
                }),
              });

              if (scrapeResponse.ok) {
                const scrapeData = await scrapeResponse.json();
                const html = scrapeData.data?.html || '';

                // Extract specs from HTML
                const specs = extractSpecsFromHtml(html);

                if (specs && Object.keys(specs).length > 0) {
                  // Update all products with this URL
                  const productsWithUrl = productsToScrape.filter(p => p.product_url === url);

                  for (const product of productsWithUrl) {
                    if (!dryRun) {
                      const { error } = await supabase
                        .from('filaments')
                        .update({
                          nozzle_temp_min_c: specs.nozzleTempMin,
                          nozzle_temp_max_c: specs.nozzleTempMax,
                          bed_temp_min_c: specs.bedTempMin,
                          bed_temp_max_c: specs.bedTempMax,
                          density_g_cm3: specs.density,
                          tensile_strength_xy_mpa: specs.tensileStrength,
                          drying_temp_c: specs.dryingTempC,
                          drying_time_hours: specs.dryingTimeHours,
                        })
                        .eq('id', product.id);

                      if (!error) {
                        stats.enriched++;
                      }
                    }
                  }
                }
              }
            } catch (scrapeError) {
              console.error(`[Matter3D] Scrape error for ${url}: ${scrapeError}`);
            }
          }
        }

        console.log(`[Matter3D] Step 2 complete - Enriched: ${stats.enriched}`);
      }
    }

    // ========================================
    // STEP 3: BRAND-SPECIFIC ENRICHMENTS
    // ========================================
    if (tasks.includes('enrich')) {
      console.log('[Matter3D] Step 3: Brand-specific enrichments');

      // Get products needing enrichment
      const { data: productsToEnrich } = await supabase
        .from('filaments')
        .select('id, product_title, variant_sku, material, color_hex, product_line_id')
        .eq('vendor', 'Matter3D')
        .or('product_line_id.is.null,finish_type.is.null')
        .limit(500);

      if (productsToEnrich && productsToEnrich.length > 0) {
        console.log(`[Matter3D] Enriching ${productsToEnrich.length} products`);

        for (const product of productsToEnrich) {
          try {
            const enriched = enrichMatter3dProduct(
              product.product_title,
              product.variant_sku || '',
              product.material,
              product.color_hex
            );

            if (!dryRun) {
              const updateData: Record<string, unknown> = {};

              if (!product.product_line_id && enriched.productLineId) {
                updateData.product_line_id = enriched.productLineId;
              }
              if (!product.material && enriched.material) {
                updateData.material = enriched.material;
              }
              if (enriched.finishType !== 'Standard') {
                updateData.finish_type = enriched.finishType;
              }
              if (enriched.nozzleTempMin) {
                updateData.nozzle_temp_min_c = enriched.nozzleTempMin;
              }
              if (enriched.nozzleTempMax) {
                updateData.nozzle_temp_max_c = enriched.nozzleTempMax;
              }
              if (enriched.bedTempMin) {
                updateData.bed_temp_min_c = enriched.bedTempMin;
              }
              if (enriched.bedTempMax) {
                updateData.bed_temp_max_c = enriched.bedTempMax;
              }
              if (enriched.isAbrasive) {
                updateData.is_nozzle_abrasive = true;
              }
              if (enriched.highSpeedCapable) {
                updateData.high_speed_capable = true;
              }
              if (enriched.tdsUrl) {
                updateData.tds_url = enriched.tdsUrl;
              }
              if (enriched.netWeightG) {
                updateData.net_weight_g = enriched.netWeightG;
              }
              if (enriched.dryingTempC) {
                updateData.drying_temp_c = enriched.dryingTempC;
              }
              if (enriched.dryingTimeHours) {
                updateData.drying_time_hours = enriched.dryingTimeHours;
              }

              if (Object.keys(updateData).length > 0) {
                const { error } = await supabase
                  .from('filaments')
                  .update(updateData)
                  .eq('id', product.id);

                if (!error) {
                  stats.enriched++;
                }
              }
            } else {
              stats.enriched++;
            }
          } catch (enrichError) {
            console.error(`[Matter3D] Enrich error: ${enrichError}`);
            stats.errors++;
          }
        }

        console.log(`[Matter3D] Step 3 complete - Enriched: ${stats.enriched}`);
      }
    }

    // ========================================
    // STEP 4: DUPLICATE HEX FIX
    // ========================================
    if (tasks.includes('hex-fix')) {
      console.log('[Matter3D] Step 4: Duplicate hex fix');

      if (!dryRun) {
        const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', {
          p_vendor: 'Matter3D',
        });

        if (duplicates && duplicates.length > 0) {
          console.log(`[Matter3D] Found ${duplicates.length} duplicate hex entries`);

          // Group by product_line_id and color_hex
          const groups: Record<string, typeof duplicates> = {};
          for (const dup of duplicates) {
            const key = `${dup.product_line_id}_${dup.color_hex?.toLowerCase()}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(dup);
          }

          for (const [key, group] of Object.entries(groups)) {
            if (group.length > 1) {
              // Keep first, modify others
              for (let i = 1; i < group.length; i++) {
                const hex = group[i].color_hex?.replace('#', '') || 'FFFFFF';
                // Slightly modify the hex to make it unique
                const modified = modifyHex(hex, i);

                await supabase
                  .from('filaments')
                  .update({ color_hex: `#${modified}` })
                  .eq('id', group[i].id);

                stats.duplicateHexesFixed++;
              }
            }
          }

          console.log(`[Matter3D] Fixed ${stats.duplicateHexesFixed} duplicate hexes`);
        }
      }
    }

    // ========================================
    // STEP 5: TDS URL STANDARDIZATION
    // ========================================
    if (tasks.includes('tds')) {
      console.log('[Matter3D] Step 5: TDS URL standardization');

      if (!dryRun) {
        // Set TDS URL for all Matter3D products
        const { error } = await supabase
          .from('filaments')
          .update({ tds_url: 'https://matter3d.com/pages/downloads' })
          .eq('vendor', 'Matter3D')
          .is('tds_url', null);

        if (!error) {
          console.log('[Matter3D] TDS URLs updated to downloads page');
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Matter3D] Sync complete in ${duration}s`);

    const result: SyncResult = {
      success: true,
      message: `Matter3D sync completed in ${duration}s`,
      stats,
      errors,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Matter3D] Fatal error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Sync failed: ${error}`,
        stats,
        errors: [...errors, String(error)],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper: Extract specs from HTML
function extractSpecsFromHtml(html: string): {
  nozzleTempMin?: number;
  nozzleTempMax?: number;
  bedTempMin?: number;
  bedTempMax?: number;
  density?: number;
  tensileStrength?: number;
  dryingTempC?: number;
  dryingTimeHours?: number;
} | null {
  if (!html) return null;

  const specs: Record<string, number | undefined> = {};

  // Nozzle temperature
  const nozzleMatch = html.match(/nozzle[^:]*:\s*(\d+)\s*[-–]\s*(\d+)\s*[°]?c/i) ||
                      html.match(/printing\s*temp[^:]*:\s*(\d+)\s*[-–]\s*(\d+)/i);
  if (nozzleMatch) {
    specs.nozzleTempMin = parseInt(nozzleMatch[1]);
    specs.nozzleTempMax = parseInt(nozzleMatch[2]);
  }

  // Bed temperature
  const bedMatch = html.match(/bed[^:]*:\s*(\d+)\s*[-–]\s*(\d+)\s*[°]?c/i) ||
                   html.match(/heat\s*bed[^:]*:\s*(\d+)\s*[-–]\s*(\d+)/i);
  if (bedMatch) {
    specs.bedTempMin = parseInt(bedMatch[1]);
    specs.bedTempMax = parseInt(bedMatch[2]);
  }

  // Density
  const densityMatch = html.match(/density[^:]*:\s*([\d.]+)\s*g\/cm/i);
  if (densityMatch) {
    specs.density = parseFloat(densityMatch[1]);
  }

  // Tensile strength
  const tensileMatch = html.match(/tensile\s*strength[^:]*:\s*([\d.]+)\s*mpa/i);
  if (tensileMatch) {
    specs.tensileStrength = parseFloat(tensileMatch[1]);
  }

  // Drying conditions
  const dryingMatch = html.match(/dry(?:ing)?[^:]*:\s*(\d+)\s*[°]?c[^0-9]*(\d+)\s*h/i);
  if (dryingMatch) {
    specs.dryingTempC = parseInt(dryingMatch[1]);
    specs.dryingTimeHours = parseInt(dryingMatch[2]);
  }

  return Object.keys(specs).length > 0 ? specs : null;
}

// Helper: Modify hex to make unique
function modifyHex(hex: string, index: number): string {
  // Parse the hex
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Slightly adjust based on index
  const adjustment = index * 3;
  const newR = Math.min(255, Math.max(0, r + adjustment));
  const newG = Math.min(255, Math.max(0, g - adjustment));
  const newB = Math.min(255, Math.max(0, b + adjustment));

  return [newR, newG, newB]
    .map(c => c.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}
