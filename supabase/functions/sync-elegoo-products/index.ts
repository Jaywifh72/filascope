import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Region to Catalog ID mapping
// NOTE: Only US catalog (25495) is currently active. Other regional catalogs were discontinued.
// When regional catalogs become available again, add them here.
const REGION_CATALOGS: Record<string, string> = {
  'US': '25495',  // Elegoo Filaments Datafeed for US (247 products - filaments only)
  // Regional catalogs currently not available:
  // 'AU': '19909', 'CA': '19910', 'EU': '19908', 'UK': '19907' - all return 404
};

// Region to currency mapping
const REGION_CURRENCIES: Record<string, string> = {
  'US': 'USD',
  'AU': 'AUD',
  'CA': 'CAD',
  'EU': 'EUR',
  'UK': 'GBP',
};

// Color name to HEX mapping
const COLOR_HEX_MAP: Record<string, string> = {
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'grey': '808080',
  'gray': '808080',
  'red': 'DC2626',
  'blue': '2563EB',
  'navy': '1E3A5F',
  'green': '16A34A',
  'yellow': 'EAB308',
  'orange': 'EA580C',
  'purple': '9333EA',
  'pink': 'EC4899',
  'brown': '92400E',
  'beige': 'D4C4A8',
  'silver': 'C0C0C0',
  'gold': 'D4AF37',
  'copper': 'B87333',
  'bronze': 'CD7F32',
  'transparent': 'FFFFFF',
  'clear': 'FFFFFF',
  'natural': 'F5F5DC',
  'ivory': 'FFFFF0',
  'cream': 'FFFDD0',
  'tan': 'D2B48C',
  'olive': '808000',
  'teal': '008080',
  'cyan': '00FFFF',
  'magenta': 'FF00FF',
  'lime': '00FF00',
  'mint': '98FF98',
  'coral': 'FF7F50',
  'salmon': 'FA8072',
  'maroon': '800000',
  'burgundy': '800020',
  'navy blue': '000080',
  'sky blue': '87CEEB',
  'royal blue': '4169E1',
  'forest green': '228B22',
  'olive green': '6B8E23',
  'neon green': '39FF14',
  'neon pink': 'FF6EC7',
  'neon orange': 'FF5F1F',
  'neon yellow': 'CCFF00',
  'hot pink': 'FF69B4',
  'light blue': 'ADD8E6',
  'dark blue': '00008B',
  'light green': '90EE90',
  'dark green': '006400',
  'light grey': 'D3D3D3',
  'dark grey': 'A9A9A9',
  'charcoal': '36454F',
  'midnight': '191970',
  'rose': 'FF007F',
  'lavender': 'E6E6FA',
  'violet': 'EE82EE',
  'indigo': '4B0082',
  'peach': 'FFCBA4',
  'aqua': '00FFFF',
  'turquoise': '40E0D0',
};

interface TechSpecs {
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  density_g_cm3: number | null;
}

interface ElegooProduct {
  productId: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  currency: string;
  url: string;
  imageUrl: string;
  manufacturer: string;
  mpn: string;
  upc: string;
  ean: string;
  inStock: boolean;
  stockQuantity: number;
  labels: string[];
  category: string;
  categoryId: string;
  tdsUrl: string | null;
  material: string | null;
  techSpecs: TechSpecs | null;
}

interface ProductFields {
  tds: boolean;
  image: boolean;
  price: boolean;
  salePrice: boolean;
  url: boolean;
  msrp: boolean;
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  products: {
    title: string;
    action: 'created' | 'updated' | 'skipped' | 'error';
    reason?: string;
    fields: ProductFields;
    currentPrice?: number;
    msrp?: number;
  }[];
}

interface RegionalData {
  price?: number;
  url?: string;
  currency?: string;
}

function extractMaterialFromTitle(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  // Check for specific materials in order of specificity
  if (titleLower.includes('pla-cf') || titleLower.includes('pla cf')) return 'PLA-CF';
  if (titleLower.includes('petg-cf') || titleLower.includes('petg cf')) return 'PETG-CF';
  if (titleLower.includes('pc-cf') || titleLower.includes('pc cf')) return 'PC-CF';
  if (titleLower.includes('petg')) return 'PETG';
  if (titleLower.includes('abs')) return 'ABS';
  if (titleLower.includes('tpu')) return 'TPU';
  if (titleLower.includes('pla+') || titleLower.includes('pla plus')) return 'PLA+';
  if (titleLower.includes('pla')) return 'PLA';
  if (titleLower.includes('asa')) return 'ASA';
  if (titleLower.includes('nylon') || titleLower.includes('pa')) return 'PA';
  // PC (Polycarbonate) - check for "PC - " or "PC-" at start to avoid false positives
  if (/^pc\s*[-–]/.test(titleLower) || titleLower.includes('polycarbonate')) return 'PC';
  
  return null;
}

function extractWeightFromTitle(title: string): number | null {
  // Look for weight patterns like "1kg", "1000g", "2.2lbs", etc.
  const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }
  
  const gMatch = title.match(/(\d+)\s*g\b/i);
  if (gMatch) {
    return parseInt(gMatch[1]);
  }
  
  // Default to 1000g for standard spools
  return 1000;
}

function extractDiameterFromTitle(title: string): number {
  // Look for diameter patterns
  if (title.includes('2.85') || title.includes('3mm') || title.includes('3.0mm')) {
    return 2.85;
  }
  // Default to 1.75mm
  return 1.75;
}

// Extract color name and HEX from product title
function extractColorAndHex(title: string): { colorName: string | null; colorHex: string | null } {
  // Common pattern: "Material - Color" or "Material Color"
  const titleLower = title.toLowerCase();
  
  // Try to find color after " - " separator
  const dashMatch = title.match(/\s-\s([^-]+)$/);
  if (dashMatch) {
    const colorPart = dashMatch[1].trim().toLowerCase();
    // Remove weight/size info
    const cleanColor = colorPart.replace(/\d+(?:\.\d+)?(?:kg|g|mm)/gi, '').trim();
    
    // Look up in color map
    for (const [colorName, hex] of Object.entries(COLOR_HEX_MAP)) {
      if (cleanColor.includes(colorName) || colorName.includes(cleanColor)) {
        return { colorName: cleanColor, colorHex: hex };
      }
    }
    return { colorName: cleanColor, colorHex: null };
  }
  
  // Try to find a color word anywhere in the title
  for (const [colorName, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (titleLower.includes(colorName)) {
      return { colorName, colorHex: hex };
    }
  }
  
  return { colorName: null, colorHex: null };
}

// Normalize product title for matching across regions
function normalizeProductTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { dryRun = true, materialFilter, regions = ['US'] } = await req.json();
    
    console.log(`Starting Elegoo sync - regions: ${regions.join(', ')}, dryRun: ${dryRun}, filter: ${materialFilter || 'all'}`);

    // Create a job log entry
    const jobId = crypto.randomUUID();
    if (!dryRun) {
      await supabase.from('scrape_job_logs').insert({
        id: jobId,
        job_type: 'elegoo_sync',
        status: 'running',
        details: { materialFilter, dryRun, regions },
      });
    }

    const result: SyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      products: [],
    };

    // Collect products from all regions
    const productsByNormalizedTitle: Map<string, { 
      baseProduct: ElegooProduct;
      regionalData: Record<string, RegionalData>;
    }> = new Map();

    // Fetch products from each region
    for (const region of regions) {
      const catalogId = REGION_CATALOGS[region];
      if (!catalogId) {
        console.log(`Unknown region: ${region}, skipping`);
        continue;
      }

      console.log(`Fetching region ${region} (catalog ${catalogId})...`);

      let page = 1;
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching ${region} page ${page}...`);
        
        const catalogResponse = await fetch(
          `${supabaseUrl}/functions/v1/fetch-elegoo-catalog`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              materialFilter, 
              page, 
              pageSize: 100,
              catalogId 
            }),
          }
        );

        if (!catalogResponse.ok) {
          const errorText = await catalogResponse.text();
          console.error(`Failed to fetch catalog for ${region}: ${errorText}`);
          break;
        }

        const catalogData = await catalogResponse.json();
        
        if (catalogData.error) {
          console.error(`Error for ${region}: ${catalogData.error}`);
          break;
        }

        // Process products from this region
        for (const product of catalogData.products as ElegooProduct[]) {
          const normalizedTitle = normalizeProductTitle(product.title);
          
          if (!productsByNormalizedTitle.has(normalizedTitle)) {
            // First time seeing this product
            productsByNormalizedTitle.set(normalizedTitle, {
              baseProduct: product,
              regionalData: {
                [region]: {
                  price: product.price,
                  url: product.url,
                  currency: REGION_CURRENCIES[region],
                }
              }
            });
          } else {
            // Add regional data to existing product
            const existing = productsByNormalizedTitle.get(normalizedTitle)!;
            existing.regionalData[region] = {
              price: product.price,
              url: product.url,
              currency: REGION_CURRENCIES[region],
            };
          }
        }

        hasMore = catalogData.pagination?.hasNextPage || false;
        page++;

        if (page > 50) {
          console.log(`Reached page limit for ${region}, stopping pagination`);
          break;
        }
      }
    }

    console.log(`Total unique products across regions: ${productsByNormalizedTitle.size}`);

    // Process each unique product
    for (const [normalizedTitle, { baseProduct, regionalData }] of productsByNormalizedTitle) {
      try {
        const product = baseProduct;
        const material = product.material || extractMaterialFromTitle(product.title);
        const weight = extractWeightFromTitle(product.title);
        const diameter = extractDiameterFromTitle(product.title);
        const techSpecs = product.techSpecs;
        const { colorName, colorHex } = extractColorAndHex(product.title);

        const hasTdsFromApi = Boolean(product.tdsUrl && product.tdsUrl.trim() !== '');
        const msrpValue = product.originalPrice ?? product.price ?? null;
        const hasMsrp = Boolean(msrpValue && msrpValue > 0);
        const isOnSale = Boolean(product.originalPrice && product.price < product.originalPrice);
        
        const fields: ProductFields = {
          tds: hasTdsFromApi,
          image: Boolean(product.imageUrl && product.imageUrl.trim() !== ''),
          price: Boolean(product.price && product.price > 0),
          salePrice: isOnSale,
          url: Boolean(product.url && product.url.trim() !== ''),
          msrp: hasMsrp,
        };
        
        const currentPrice = product.price;
        const msrp = msrpValue || undefined;
        
        if (hasTdsFromApi) {
          console.log(`TDS mapped for ${product.title}: ${product.tdsUrl}`);
        }
        if (colorHex) {
          console.log(`Color extracted for ${product.title}: ${colorName} -> #${colorHex}`);
        }

        if (!material) {
          result.skipped++;
          result.products.push({
            title: product.title,
            action: 'skipped',
            reason: 'Could not detect material type',
            fields,
            currentPrice,
            msrp,
          });
          continue;
        }

        // Check if product already exists
        const { data: existing } = await supabase
          .from('filaments')
          .select('id, variant_price, updated_at, tds_url, color_hex')
          .eq('product_id', product.productId)
          .eq('vendor', 'Elegoo')
          .maybeSingle();

        if (existing?.tds_url) {
          fields.tds = true;
        }

        // Build regional price and URL fields
        const regionalFields: Record<string, unknown> = {};
        
        if (regionalData['AU']) {
          regionalFields.price_aud = regionalData['AU'].price;
          regionalFields.product_url_au = regionalData['AU'].url;
        }
        if (regionalData['CA']) {
          regionalFields.price_cad = regionalData['CA'].price;
          regionalFields.product_url_ca = regionalData['CA'].url;
        }
        if (regionalData['EU']) {
          regionalFields.price_eur = regionalData['EU'].price;
          regionalFields.product_url_eu = regionalData['EU'].url;
        }
        if (regionalData['UK']) {
          regionalFields.price_gbp = regionalData['UK'].price;
          regionalFields.product_url_uk = regionalData['UK'].url;
        }

        const filamentData = {
          product_id: product.productId,
          product_title: product.title,
          vendor: 'Elegoo',
          material,
          variant_price: regionalData['US']?.price || product.price,
          variant_compare_at_price: product.compareAtPrice,
          variant_available: product.inStock,
          product_url: regionalData['US']?.url || product.url,
          featured_image: product.imageUrl,
          mpn: product.mpn || null,
          upc: product.upc || null,
          ean: product.ean || null,
          net_weight_g: weight,
          diameter_nominal_mm: diameter,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
          regional_prices_updated_at: new Date().toISOString(),
          // Include TDS URL if found
          ...(product.tdsUrl ? { tds_url: product.tdsUrl } : {}),
          // Include color HEX if extracted
          ...(colorHex ? { color_hex: colorHex } : {}),
          // Include tech specs
          ...(techSpecs?.nozzle_temp_min_c ? { nozzle_temp_min_c: techSpecs.nozzle_temp_min_c } : {}),
          ...(techSpecs?.nozzle_temp_max_c ? { nozzle_temp_max_c: techSpecs.nozzle_temp_max_c } : {}),
          ...(techSpecs?.bed_temp_min_c ? { bed_temp_min_c: techSpecs.bed_temp_min_c } : {}),
          ...(techSpecs?.bed_temp_max_c ? { bed_temp_max_c: techSpecs.bed_temp_max_c } : {}),
          ...(techSpecs?.density_g_cm3 ? { density_g_cm3: techSpecs.density_g_cm3 } : {}),
          // Include regional prices and URLs
          ...regionalFields,
        };

        if (dryRun) {
          if (existing) {
            result.updated++;
            result.products.push({
              title: product.title,
              action: 'updated',
              reason: `Price: $${existing.variant_price} → $${product.price}, Regions: ${Object.keys(regionalData).join(', ')}`,
              fields,
              currentPrice,
              msrp,
            });
          } else {
            result.created++;
            result.products.push({
              title: product.title,
              action: 'created',
              fields,
              currentPrice,
              msrp,
            });
          }
        } else {
          if (existing) {
            const { error } = await supabase
              .from('filaments')
              .update({
                ...filamentData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            if (error) throw error;
            
            result.updated++;
            result.products.push({
              title: product.title,
              action: 'updated',
              fields,
              currentPrice,
              msrp,
            });

            // Log price change if different
            if (existing.variant_price !== product.price) {
              await supabase.from('price_history').insert({
                filament_id: existing.id,
                price: product.price,
                region: 'US',
                source: 'elegoo_api',
              });
            }
          } else {
            const { error } = await supabase
              .from('filaments')
              .insert(filamentData);

            if (error) throw error;
            
            result.created++;
            result.products.push({
              title: product.title,
              action: 'created',
              fields,
              currentPrice,
              msrp,
            });
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error processing product ${baseProduct.title}:`, err);
        result.errors++;
        result.products.push({
          title: baseProduct.title,
          action: 'error',
          reason: errorMessage,
          fields: { tds: false, image: false, price: false, salePrice: false, url: false, msrp: false },
        });
      }
    }

    // Update job log
    if (!dryRun) {
      await supabase
        .from('scrape_job_logs')
        .update({
          status: result.errors > 0 ? 'completed_with_errors' : 'completed',
          completed_at: new Date().toISOString(),
          details: {
            materialFilter,
            dryRun,
            regions,
            ...result,
          },
        })
        .eq('id', jobId);
    }

    console.log(`Sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        jobId: dryRun ? null : jobId,
        summary: {
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors,
          total: productsByNormalizedTitle.size,
        },
        products: result.products,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing Elegoo products:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
