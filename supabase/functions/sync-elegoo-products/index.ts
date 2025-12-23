import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ElegooProduct {
  productId: string;
  title: string;
  description: string;
  price: number;
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

    const { dryRun = true, materialFilter } = await req.json();
    
    console.log(`Starting Elegoo sync - dryRun: ${dryRun}, filter: ${materialFilter || 'all'}`);

    // Create a job log entry
    const jobId = crypto.randomUUID();
    if (!dryRun) {
      await supabase.from('scrape_job_logs').insert({
        id: jobId,
        job_type: 'elegoo_sync',
        status: 'running',
        details: { materialFilter, dryRun },
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
            pageSize: 100 
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
        const material = extractMaterialFromTitle(product.title);
        const weight = extractWeightFromTitle(product.title);
        const diameter = extractDiameterFromTitle(product.title);

        // Skip non-filament products if we couldn't detect material
        if (!material) {
          result.skipped++;
          result.products.push({
            title: product.title,
            action: 'skipped',
            reason: 'Could not detect material type',
          });
          continue;
        }

        // Check if product already exists
        const { data: existing } = await supabase
          .from('filaments')
          .select('id, variant_price, updated_at')
          .eq('product_id', product.productId)
          .eq('vendor', 'Elegoo')
          .maybeSingle();

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
        };

        if (dryRun) {
          if (existing) {
            result.updated++;
            result.products.push({
              title: product.title,
              action: 'updated',
              reason: `Price: $${existing.variant_price} → $${product.price}`,
            });
          } else {
            result.created++;
            result.products.push({
              title: product.title,
              action: 'created',
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
