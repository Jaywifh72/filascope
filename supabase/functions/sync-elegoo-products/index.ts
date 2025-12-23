import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  originalPrice: number | null;  // MSRP - always included
  compareAtPrice: number | null; // Only set when on sale
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

function extractMaterialFromTitle(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  // Check for specific materials in order of specificity
  if (titleLower.includes('pla-cf') || titleLower.includes('pla cf')) return 'PLA-CF';
  if (titleLower.includes('petg-cf') || titleLower.includes('petg cf')) return 'PETG-CF';
  if (titleLower.includes('petg')) return 'PETG';
  if (titleLower.includes('abs')) return 'ABS';
  if (titleLower.includes('tpu')) return 'TPU';
  if (titleLower.includes('pla+') || titleLower.includes('pla plus')) return 'PLA+';
  if (titleLower.includes('pla')) return 'PLA';
  if (titleLower.includes('asa')) return 'ASA';
  if (titleLower.includes('nylon') || titleLower.includes('pa')) return 'PA';
  
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { dryRun = true, materialFilter, catalogId } = await req.json();
    
    // Default catalog ID: 25495 = "Elegoo Filaments Datafeed for US" (247 products)
    // Campaign ID: 19663
    const DEFAULT_CATALOG_ID = '25495';
    const effectiveCatalogId = catalogId || Deno.env.get('IMPACT_ELEGOO_CATALOG_ID') || DEFAULT_CATALOG_ID;
    
    console.log(`Starting Elegoo sync - catalogId: ${effectiveCatalogId}, dryRun: ${dryRun}, filter: ${materialFilter || 'all'}`);

    // Create a job log entry
    const jobId = crypto.randomUUID();
    if (!dryRun) {
      await supabase.from('scrape_job_logs').insert({
        id: jobId,
        job_type: 'elegoo_sync',
        status: 'running',
        details: { materialFilter, dryRun, catalogId: effectiveCatalogId },
      });
    }

    const result: SyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      products: [],
    };

    // Fetch all pages from the catalog
    let page = 1;
    let hasMore = true;
    const allProducts: ElegooProduct[] = [];

    while (hasMore) {
      console.log(`Fetching page ${page}...`);
      
      // Call our fetch-elegoo-catalog function
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
            catalogId: effectiveCatalogId 
          }),
        }
      );

      if (!catalogResponse.ok) {
        const errorText = await catalogResponse.text();
        throw new Error(`Failed to fetch catalog: ${errorText}`);
      }

      const catalogData = await catalogResponse.json();
      
      if (catalogData.error) {
        throw new Error(catalogData.error);
      }

      allProducts.push(...catalogData.products);
      hasMore = catalogData.pagination?.hasNextPage || false;
      page++;

      // Safety limit
      if (page > 50) {
        console.log('Reached page limit, stopping pagination');
        break;
      }
    }

    console.log(`Total products fetched: ${allProducts.length}`);

    // Process each product
    for (const product of allProducts) {
      try {
        // Use material from API if available, otherwise extract from title
        const material = product.material || extractMaterialFromTitle(product.title);
        const weight = extractWeightFromTitle(product.title);
        const diameter = extractDiameterFromTitle(product.title);
        const techSpecs = product.techSpecs;

        // Build fields availability object - check TDS from API response
        const hasTdsFromApi = Boolean(product.tdsUrl && product.tdsUrl.trim() !== '');
        
        // MSRP: use originalPrice (always present with fallback), or price as last resort
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
        
        // Price data for display
        const currentPrice = product.price;
        const msrp = msrpValue || undefined;
        
        if (hasTdsFromApi) {
          console.log(`TDS mapped for ${product.title}: ${product.tdsUrl}`);
        }
        if (techSpecs && (techSpecs.nozzle_temp_min_c || techSpecs.bed_temp_min_c)) {
          console.log(`Tech specs found for ${product.title}:`, techSpecs);
        }

        // Skip non-filament products if we couldn't detect material
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
          .select('id, variant_price, updated_at, tds_url')
          .eq('product_id', product.productId)
          .eq('vendor', 'Elegoo')
          .maybeSingle();

        // Update TDS field if we have it in database
        if (existing?.tds_url) {
          fields.tds = true;
        }

        const filamentData = {
          product_id: product.productId,
          product_title: product.title,
          vendor: 'Elegoo',
          material,
          variant_price: product.price,
          variant_compare_at_price: product.compareAtPrice,
          variant_available: product.inStock,
          product_url: product.url,
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
          // Include TDS URL if found from mapping
          ...(product.tdsUrl ? { tds_url: product.tdsUrl } : {}),
          // Include tech specs from parsed Text1 JSON
          ...(techSpecs?.nozzle_temp_min_c ? { nozzle_temp_min_c: techSpecs.nozzle_temp_min_c } : {}),
          ...(techSpecs?.nozzle_temp_max_c ? { nozzle_temp_max_c: techSpecs.nozzle_temp_max_c } : {}),
          ...(techSpecs?.bed_temp_min_c ? { bed_temp_min_c: techSpecs.bed_temp_min_c } : {}),
          ...(techSpecs?.bed_temp_max_c ? { bed_temp_max_c: techSpecs.bed_temp_max_c } : {}),
          ...(techSpecs?.density_g_cm3 ? { density_g_cm3: techSpecs.density_g_cm3 } : {}),
        };

        if (dryRun) {
          if (existing) {
            result.updated++;
            result.products.push({
              title: product.title,
              action: 'updated',
              reason: `Price: $${existing.variant_price} → $${product.price}`,
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
        console.error(`Error processing product ${product.title}:`, err);
        result.errors++;
        result.products.push({
          title: product.title,
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
          total: allProducts.length,
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
