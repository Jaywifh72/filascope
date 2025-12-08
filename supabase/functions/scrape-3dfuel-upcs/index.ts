import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT and check admin role
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

    // Auth client to verify user
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

    // Check admin role
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

    // Service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { limit = 100, forceUpdate = false } = await req.json().catch(() => ({}));

    console.log(`Starting 3D-Fuel UPC scrape with limit=${limit}, forceUpdate=${forceUpdate}`);

    // Fetch 3D-Fuel filaments
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, product_handle')
      .eq('vendor', '3D-Fuel')
      .not('product_url', 'is', null);

    if (!forceUpdate) {
      query = query.is('upc', null);
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${filaments?.length || 0} 3D-Fuel filaments to process`);

    const results = {
      total: filaments?.length || 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    };

    // Try to fetch the main products.json first to get all UPCs at once
    const allProductsUrl = 'https://www.3dfuel.com/products.json?limit=250';
    let allProducts: any[] = [];
    
    try {
      console.log('Fetching all products from Shopify JSON API...');
      const allProductsResponse = await fetch(allProductsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      if (allProductsResponse.ok) {
        const data = await allProductsResponse.json();
        allProducts = data.products || [];
        console.log(`Fetched ${allProducts.length} products from Shopify`);
      } else {
        console.log(`Failed to fetch products.json: ${allProductsResponse.status}`);
      }
    } catch (e) {
      console.error('Error fetching products.json:', e);
    }

    // Build a map of handle -> product for quick lookup
    const productMap = new Map<string, any>();
    for (const product of allProducts) {
      if (product.handle) {
        productMap.set(product.handle.toLowerCase(), product);
      }
    }

    console.log(`Built product map with ${productMap.size} entries`);

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

        // Try to find in our cached products first
        if (productHandle) {
          const cachedProduct = productMap.get(productHandle.toLowerCase());
          if (cachedProduct) {
            // Look for UPC/barcode in variants
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
        if (!upc && productHandle) {
          const productJsonUrl = `https://www.3dfuel.com/products/${productHandle}.json`;
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

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (upc) {
          // Update the filament with UPC
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ upc })
            .eq('id', filament.id);

          if (updateError) {
            console.error(`Error updating filament ${filament.id}:`, updateError);
            results.failed++;
            results.details.push({
              id: filament.id,
              title: filament.product_title,
              status: 'error',
              error: updateError.message
            });
          } else {
            console.log(`Updated ${filament.product_title} with UPC: ${upc}`);
            results.updated++;
            results.details.push({
              id: filament.id,
              title: filament.product_title,
              status: 'updated',
              upc
            });
          }
        } else {
          console.log(`No UPC found for ${filament.product_title}`);
          results.skipped++;
          results.details.push({
            id: filament.id,
            title: filament.product_title,
            status: 'no_upc_found'
          });
        }
      } catch (e) {
        console.error(`Error processing filament ${filament.id}:`, e);
        results.failed++;
        results.details.push({
          id: filament.id,
          title: filament.product_title,
          status: 'error',
          error: e instanceof Error ? e.message : 'Unknown error'
        });
      }
    }

    console.log(`Scrape complete: ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in scrape-3dfuel-upcs:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
