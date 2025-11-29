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

// Fetch price from a URL
async function fetchPriceFromUrl(url: string | null, region: string): Promise<number | null> {
  if (!url || url === 'null' || url.length < 10) {
    return null;
  }
  
  try {
    console.log(`Fetching ${region} price from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    return extractPrice(html, url);
  } catch (error) {
    console.error(`Error fetching price from ${url}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client for auth check (with anon key + auth header)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } }
    });

    // Verify user is authenticated and is admin
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role using service client
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin, error: roleError } = await supabaseService.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { filament_ids } = await req.json();
    
    console.log(`Fetching prices for ${filament_ids?.length || 'all'} filaments`);

    // Fetch filaments that need price updates
    let query = supabaseService
      .from('filaments')
      .select('id, product_url, amazon_link_us, amazon_link_uk, amazon_link_de, variant_price, product_title');
    
    if (filament_ids && filament_ids.length > 0) {
      query = query.in('id', filament_ids);
    } else {
      query = query.limit(50);
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
    };

    for (const filament of filaments || []) {
      results.processed++;
      console.log(`Processing: ${filament.product_title}`);
      
      const prices: PriceData[] = [];
      
      // Fetch from all available sources
      const sources = [
        { url: filament.product_url, region: 'US', source: 'brand' },
        { url: filament.amazon_link_us, region: 'US', source: 'amazon' },
        { url: filament.amazon_link_uk, region: 'UK', source: 'amazon' },
        { url: filament.amazon_link_de, region: 'DE', source: 'amazon' },
      ];

      for (const { url, region, source } of sources) {
        if (url && url !== 'null') {
          const price = await fetchPriceFromUrl(url, region);
          if (price !== null) {
            prices.push({
              filament_id: filament.id,
              region,
              price,
              source,
            });
          }
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (prices.length > 0) {
        // Store prices in price_history
        const { error: priceError } = await supabaseService
          .from('price_history')
          .insert(prices);

        if (priceError) {
          console.error(`Failed to insert prices for ${filament.id}:`, priceError);
          results.failed++;
        } else {
          // Update variant_price with US price (prioritize brand store, then Amazon)
          const usPrice = prices.find(p => p.region === 'US' && p.source === 'brand')?.price ||
                         prices.find(p => p.region === 'US')?.price ||
                         prices[0]?.price;

          if (usPrice) {
            await supabaseService
              .from('filaments')
              .update({ variant_price: usPrice })
              .eq('id', filament.id);
          }

          results.updated++;
          results.prices.push(...prices);
          console.log(`Updated ${prices.length} prices for ${filament.product_title}`);
        }
      } else {
        results.failed++;
        console.log(`No prices found for ${filament.product_title}`);
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
