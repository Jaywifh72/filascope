import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceData {
  filament_id: string;
  region: string;
  price: number;
  source: string;
}

interface WeightData {
  weight_g: number;
  source: string;
}

// Extract weight from HTML content (returns grams)
function extractWeight(html: string, url: string): number | null {
  console.log(`Extracting weight from ${url}`);
  
  const weightPatterns = [
    // Match patterns like "1kg", "1000g", "1.75 kg", "2.2 lbs"
    /(?:net\s+)?weight[:\s]+([0-9.]+)\s*(kg|g|lbs?|pounds?)/i,
    /([0-9.]+)\s*(kg|g|lbs?|pounds?)\s+(?:net\s+)?(?:weight|spool)/i,
    /"weight"[:\s"]+([0-9.]+)\s*(kg|g|lbs?|pounds?)/i,
    /data-weight[=:"]+([0-9.]+)\s*(kg|g|lbs?|pounds?)/i,
    /<span[^>]*weight[^>]*>.*?([0-9.]+)\s*(kg|g|lbs?|pounds?)/is,
  ];
  
  for (const pattern of weightPatterns) {
    const match = html.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      
      if (!isNaN(value) && value > 0) {
        let weightInGrams = value;
        
        // Convert to grams
        if (unit.startsWith('kg')) {
          weightInGrams = value * 1000;
        } else if (unit.startsWith('lb') || unit.startsWith('pound')) {
          weightInGrams = value * 453.592;
        }
        
        // Sanity check: filament spools are typically 250g-5000g
        if (weightInGrams >= 100 && weightInGrams <= 10000) {
          console.log(`Found weight: ${weightInGrams}g (original: ${value} ${unit})`);
          return Math.round(weightInGrams);
        }
      }
    }
  }
  
  console.log('No weight found in HTML');
  return null;
}

// Extract price from HTML content
function extractPrice(html: string, url: string): number | null {
  console.log(`Extracting price from ${url}`);
  
  // Amazon price patterns
  const amazonPatterns = [
    /<span class="a-price-whole">([0-9,]+)<\/span>/,
    /<span class="a-offscreen">\$([0-9,.]+)<\/span>/,
    /class="a-price"[^>]*>.*?\$([0-9,.]+)/s,
    /"price":\s*"([0-9,.]+)"/,
  ];
  
  // Shopify/brand store patterns
  const brandPatterns = [
    /<span class="money">.*?\$([0-9,.]+)<\/span>/,
    /class="price"[^>]*>.*?\$([0-9,.]+)/s,
    /"price":\s*"([0-9,.]+)"/,
    /data-product-price="([0-9,.]+)"/,
    /<meta property="product:price:amount" content="([0-9,.]+)"/,
    /class="product-price"[^>]*>.*?([0-9,.]+)/s,
  ];
  
  // Try Amazon patterns first if it's an Amazon URL
  if (url.includes('amazon.')) {
    for (const pattern of amazonPatterns) {
      const match = html.match(pattern);
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(price) && price > 0 && price < 10000) {
          console.log(`Found Amazon price: ${price}`);
          return price;
        }
      }
    }
  }
  
  // Try brand store patterns
  for (const pattern of brandPatterns) {
    const match = html.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(price) && price > 0 && price < 10000) {
        console.log(`Found brand store price: ${price}`);
        return price;
      }
    }
  }
  
  console.log('No price found in HTML');
  return null;
}

// Fetch price and weight from a URL
async function fetchDataFromUrl(url: string | null, region: string): Promise<{ price: number | null; weight: number | null }> {
  if (!url || url === 'null' || url.length < 10) {
    return { price: null, weight: null };
  }
  
  try {
    console.log(`Fetching ${region} data from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return { price: null, weight: null };
    }
    
    const html = await response.text();
    return {
      price: extractPrice(html, url),
      weight: extractWeight(html, url)
    };
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return { price: null, weight: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the JWT from the request (already validated by platform when verify_jwt = true)
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from JWT (JWT is already validated by platform)
    const jwt = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      console.error('No user ID in JWT payload');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Request from user: ${userId}`);

    // Check if user has admin role
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin, error: roleError } = await supabaseService.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status', details: roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.log(`User ${userId} is not an admin`);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${userId} authorized, proceeding with price fetch`);

    const { filament_ids } = await req.json();
    
    console.log(`Fetching prices for ${filament_ids?.length || 'ALL'} filaments`);

    // Fetch filaments that need price updates
    let query = supabaseService
      .from('filaments')
      .select('id, product_url, amazon_link_us, amazon_link_uk, amazon_link_de, variant_price, product_title');
    
    if (filament_ids && filament_ids.length > 0) {
      query = query.in('id', filament_ids);
    } else {
      // Fetch ALL filaments when no specific IDs provided
      query = query.limit(200); // Process in batches of 200
    }

    const { data: filaments, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Processing ${filaments?.length || 0} filaments`);

    const results = {
      processed: 0,
      updated: 0,
      failed: 0,
      prices: [] as PriceData[],
      weights_updated: 0,
    };

    for (const filament of filaments || []) {
      results.processed++;
      console.log(`Processing: ${filament.product_title}`);
      
      const prices: PriceData[] = [];
      let extractedWeight: number | null = null;
      
      // Fetch from all available sources
      const sources = [
        { url: filament.product_url, region: 'US', source: 'brand' },
        { url: filament.amazon_link_us, region: 'US', source: 'amazon' },
        { url: filament.amazon_link_uk, region: 'UK', source: 'amazon' },
        { url: filament.amazon_link_de, region: 'DE', source: 'amazon' },
      ];

      for (const { url, region, source } of sources) {
        if (url && url !== 'null') {
          const { price, weight } = await fetchDataFromUrl(url, region);
          
          if (price !== null) {
            prices.push({
              filament_id: filament.id,
              region,
              price,
              source,
            });
          }
          
          // Store weight from first source that has it (prioritize brand store)
          if (weight !== null && extractedWeight === null) {
            extractedWeight = weight;
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (prices.length > 0 || extractedWeight !== null) {
        let hasError = false;
        
        // Store prices in price_history
        if (prices.length > 0) {
          const { error: priceError } = await supabaseService
            .from('price_history')
            .insert(prices);

          if (priceError) {
            console.error(`Failed to insert prices for ${filament.id}:`, priceError);
            hasError = true;
          } else {
            results.prices.push(...prices);
            console.log(`Updated ${prices.length} prices for ${filament.product_title}`);
          }
        }
        
        // Update filament with price and/or weight
        const updates: { variant_price?: number; net_weight_g?: number } = {};
        
        if (prices.length > 0) {
          // Update variant_price with US price (prioritize brand store, then Amazon)
          const usPrice = prices.find(p => p.region === 'US' && p.source === 'brand')?.price ||
                         prices.find(p => p.region === 'US')?.price ||
                         prices[0]?.price;
          if (usPrice) {
            updates.variant_price = usPrice;
          }
        }
        
        if (extractedWeight !== null) {
          updates.net_weight_g = extractedWeight;
          console.log(`Found weight: ${extractedWeight}g for ${filament.product_title}`);
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabaseService
            .from('filaments')
            .update(updates)
            .eq('id', filament.id);
            
          if (updateError) {
            console.error(`Failed to update filament ${filament.id}:`, updateError);
            hasError = true;
          } else {
            if (extractedWeight !== null) {
              results.weights_updated++;
            }
          }
        }
        
        if (!hasError) {
          results.updated++;
        } else {
          results.failed++;
        }
      } else {
        results.failed++;
        console.log(`No data found for ${filament.product_title}`);
      }
    }

    console.log(`Complete: ${results.updated} updated, ${results.failed} failed`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-prices function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
