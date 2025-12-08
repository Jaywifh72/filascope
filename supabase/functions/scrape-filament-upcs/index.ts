import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brand-specific Shopify store URLs
const BRAND_SHOPIFY_URLS: Record<string, string> = {
  '3D-Fuel': 'https://www.3dfuel.com',
  'Polymaker': 'https://us.polymaker.com',
  'Overture': 'https://overture3d.com',
  'eSUN': 'https://www.esun3d.com',
  'Hatchbox': 'https://www.hatchbox3d.com',
  'SUNLU': 'https://www.sunlu.com',
  'Amolen': 'https://amolen.com',
  'Eryone': 'https://eryone3d.com',
  'Atomic Filament': 'https://atomicfilament.com',
  'MatterHackers': 'https://www.matterhackers.com',
  'Proto-pasta': 'https://www.proto-pasta.com',
  'ColorFabb': 'https://colorfabb.com',
  'Fillamentum': 'https://fillamentum.com',
  'Prusament': 'https://www.prusa3d.com',
  'NinjaTek': 'https://ninjatek.com',
  'Taulman3D': 'https://taulman3d.com',
  '3DXTech': 'https://www.3dxtech.com',
  'Fiberlogy': 'https://fiberlogy.com',
  'FormFutura': 'https://formfutura.com',
};

// Helper function to process a single filament
async function processFilament(
  filament: any, 
  productMap: Map<string, any>, 
  shopifyUrl: string | undefined,
  supabase: any
): Promise<{ id: string; title: string; status: 'updated' | 'no_upc_found' | 'error'; upc?: string; error?: string }> {
  try {
    let upc: string | null = null;
    let productHandle = filament.product_handle;

    if (!productHandle && filament.product_url) {
      const urlMatch = filament.product_url.match(/\/products\/([^?/]+)/);
      if (urlMatch) productHandle = urlMatch[1];
    }

    console.log(`Processing: ${filament.product_title} (handle: ${productHandle})`);

    if (productHandle) {
      const cachedProduct = productMap.get(productHandle.toLowerCase());
      if (cachedProduct) {
        for (const variant of cachedProduct.variants || []) {
          if (variant.barcode) {
            upc = variant.barcode;
            console.log(`Found UPC from cache: ${upc}`);
            break;
          }
        }
      }
    }

    if (!upc && productHandle && shopifyUrl) {
      const productJsonUrl = `${shopifyUrl}/products/${productHandle}.json`;
      try {
        const response = await fetch(productJsonUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });
        if (response.ok) {
          const productData = await response.json();
          for (const variant of productData.product?.variants || []) {
            if (variant.barcode) {
              upc = variant.barcode;
              console.log(`Found UPC from individual JSON: ${upc}`);
              break;
            }
          }
        }
      } catch (e) {
        console.log(`Error fetching individual product JSON: ${e}`);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (upc) {
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ upc })
        .eq('id', filament.id);

      if (updateError) {
        return { id: filament.id, title: filament.product_title, status: 'error', error: updateError.message };
      }
      return { id: filament.id, title: filament.product_title, status: 'updated', upc };
    }
    
    return { id: filament.id, title: filament.product_title, status: 'no_upc_found' };
  } catch (e) {
    return { id: filament.id, title: filament.product_title, status: 'error', error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: isAdmin } = await authClient.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { brands = [], filamentIds = [], limit = 100, forceUpdate = false } = await req.json().catch(() => ({}));

    console.log(`Starting UPC scrape - brands: ${brands.join(', ')}, filamentIds: ${filamentIds.length}, limit=${limit}, forceUpdate=${forceUpdate}`);

    // Must have either brands or filamentIds
    if ((!brands || brands.length === 0) && (!filamentIds || filamentIds.length === 0)) {
      return new Response(JSON.stringify({ error: 'No brands or filament IDs specified' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = {
      total: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      brandResults: {} as Record<string, { updated: number; skipped: number; failed: number }>,
      details: [] as any[]
    };

    // If filamentIds provided, process those directly
    if (filamentIds && filamentIds.length > 0) {
      console.log(`\n=== Processing ${filamentIds.length} specific filaments ===`);
      
      let query = supabase
        .from('filaments')
        .select('id, product_title, product_url, product_handle, vendor')
        .in('id', filamentIds)
        .not('product_url', 'is', null);

      if (!forceUpdate) {
        query = query.is('upc', null);
      }

      const { data: filaments, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching filaments by ID:', fetchError);
        return new Response(JSON.stringify({ error: fetchError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Found ${filaments?.length || 0} filaments to process`);
      results.total = filaments?.length || 0;

      // Group by vendor for efficient Shopify API calls
      const byVendor = new Map<string, any[]>();
      for (const f of filaments || []) {
        const vendor = f.vendor || 'Unknown';
        if (!byVendor.has(vendor)) byVendor.set(vendor, []);
        byVendor.get(vendor)!.push(f);
      }

      for (const [vendor, vendorFilaments] of byVendor) {
        results.brandResults[vendor] = { updated: 0, skipped: 0, failed: 0 };
        const shopifyUrl = BRAND_SHOPIFY_URLS[vendor];
        const productMap = new Map<string, any>();

        if (shopifyUrl) {
          try {
            const resp = await fetch(`${shopifyUrl}/products.json?limit=250`, {
              headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
            });
            if (resp.ok) {
              const data = await resp.json();
              for (const p of data.products || []) {
                if (p.handle) productMap.set(p.handle.toLowerCase(), p);
              }
            }
          } catch (e) {
            console.error(`Error fetching products.json for ${vendor}:`, e);
          }
        }

        for (const filament of vendorFilaments) {
          const result = await processFilament(filament, productMap, shopifyUrl, supabase);
          results[result.status === 'updated' ? 'updated' : result.status === 'error' ? 'failed' : 'skipped']++;
          results.brandResults[vendor][result.status === 'updated' ? 'updated' : result.status === 'error' ? 'failed' : 'skipped']++;
          results.details.push({ ...result, brand: vendor });
        }
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Otherwise process by brands
    for (const brand of brands) {
      console.log(`\n=== Processing brand: ${brand} ===`);
      
      results.brandResults[brand] = { updated: 0, skipped: 0, failed: 0 };

      let query = supabase
        .from('filaments')
        .select('id, product_title, product_url, product_handle, vendor')
        .eq('vendor', brand)
        .not('product_url', 'is', null);

      if (!forceUpdate) {
        query = query.is('upc', null);
      }

      const { data: filaments, error: fetchError } = await query.limit(limit);

      if (fetchError) {
        console.error(`Error fetching ${brand} filaments:`, fetchError);
        continue;
      }

      console.log(`Found ${filaments?.length || 0} ${brand} filaments to process`);
      results.total += filaments?.length || 0;

      // Get Shopify base URL for this brand
      const shopifyUrl = BRAND_SHOPIFY_URLS[brand];
      let allProducts: any[] = [];
      const productMap = new Map<string, any>();

      // Try to fetch all products from Shopify JSON API
      if (shopifyUrl) {
        try {
          console.log(`Fetching all products from ${shopifyUrl}/products.json...`);
          const allProductsResponse = await fetch(`${shopifyUrl}/products.json?limit=250`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json'
            }
          });

          if (allProductsResponse.ok) {
            const data = await allProductsResponse.json();
            allProducts = data.products || [];
            console.log(`Fetched ${allProducts.length} products from ${brand} Shopify`);

            for (const product of allProducts) {
              if (product.handle) {
                productMap.set(product.handle.toLowerCase(), product);
              }
            }
          } else {
            console.log(`Failed to fetch products.json: ${allProductsResponse.status}`);
          }
        } catch (e) {
          console.error(`Error fetching products.json for ${brand}:`, e);
        }
      }

      // Process each filament
      for (const filament of filaments || []) {
        try {
          let upc: string | null = null;
          let productHandle = filament.product_handle;

          // Extract handle from product_url if not available
          if (!productHandle && filament.product_url) {
            const urlMatch = filament.product_url.match(/\/products\/([^?/]+)/);
            if (urlMatch) {
              productHandle = urlMatch[1];
            }
          }

          console.log(`Processing: ${filament.product_title} (handle: ${productHandle})`);

          // Try to find in cached products first
          if (productHandle) {
            const cachedProduct = productMap.get(productHandle.toLowerCase());
            if (cachedProduct) {
              const variants = cachedProduct.variants || [];
              for (const variant of variants) {
                if (variant.barcode) {
                  upc = variant.barcode;
                  console.log(`Found UPC from cache: ${upc}`);
                  break;
                }
              }
            }
          }

          // If not found in cache, try individual product JSON
          if (!upc && productHandle && shopifyUrl) {
            const productJsonUrl = `${shopifyUrl}/products/${productHandle}.json`;
            console.log(`Trying individual product JSON: ${productJsonUrl}`);
            
            try {
              const response = await fetch(productJsonUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'application/json'
                }
              });

              if (response.ok) {
                const productData = await response.json();
                const product = productData.product;
                
                if (product && product.variants) {
                  for (const variant of product.variants) {
                    if (variant.barcode) {
                      upc = variant.barcode;
                      console.log(`Found UPC from individual JSON: ${upc}`);
                      break;
                    }
                  }
                }
              } else {
                console.log(`Individual product JSON returned ${response.status}`);
              }
            } catch (e) {
              console.log(`Error fetching individual product JSON: ${e}`);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
          }

          if (upc) {
            const { error: updateError } = await supabase
              .from('filaments')
              .update({ upc })
              .eq('id', filament.id);

            if (updateError) {
              console.error(`Error updating filament ${filament.id}:`, updateError);
              results.failed++;
              results.brandResults[brand].failed++;
              results.details.push({
                id: filament.id,
                title: filament.product_title,
                brand,
                status: 'error',
                error: updateError.message
              });
            } else {
              console.log(`Updated ${filament.product_title} with UPC: ${upc}`);
              results.updated++;
              results.brandResults[brand].updated++;
              results.details.push({
                id: filament.id,
                title: filament.product_title,
                brand,
                status: 'updated',
                upc
              });
            }
          } else {
            console.log(`No UPC found for ${filament.product_title}`);
            results.skipped++;
            results.brandResults[brand].skipped++;
            results.details.push({
              id: filament.id,
              title: filament.product_title,
              brand,
              status: 'no_upc_found'
            });
          }
        } catch (e) {
          console.error(`Error processing filament ${filament.id}:`, e);
          results.failed++;
          results.brandResults[brand].failed++;
          results.details.push({
            id: filament.id,
            title: filament.product_title,
            brand,
            status: 'error',
            error: e instanceof Error ? e.message : 'Unknown error'
          });
        }
      }

      // Add small delay between brands
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\nScrape complete: ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in scrape-filament-upcs:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
