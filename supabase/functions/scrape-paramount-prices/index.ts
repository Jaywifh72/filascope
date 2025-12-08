import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedData {
  price: number | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
}

async function scrapeProductPage(url: string): Promise<ScrapedData> {
  const result: ScrapedData = {
    price: null,
    nozzle_temp_min_c: null,
    nozzle_temp_max_c: null,
    bed_temp_min_c: null,
    bed_temp_max_c: null,
  };

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return result;
    }

    const html = await response.text();

    // Extract price - look for pattern like "$21.99" or "$21.99Price"
    // Wix stores often have the price in a specific format
    const pricePatterns = [
      /\$(\d+\.?\d*)\s*Price/i,
      /data-hook="product-price"[^>]*>\s*\$(\d+\.?\d*)/i,
      /class="[^"]*price[^"]*"[^>]*>\s*\$(\d+\.?\d*)/i,
      /\$(\d+\.?\d*)\s*<\/span>/i,
      />\s*\$(\d+\.?\d*)\s*</i,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const price = parseFloat(match[1]);
        if (price > 0 && price < 500) { // Reasonable filament price range
          result.price = price;
          console.log(`Found price: $${price}`);
          break;
        }
      }
    }

    // Also check markdown-style content for price
    if (!result.price) {
      const saleMatch = html.match(/Sale\s*Price\s*\$(\d+\.?\d*)/i);
      const regularMatch = html.match(/Regular\s*Price\s*\$(\d+\.?\d*)/i);
      if (saleMatch && saleMatch[1]) {
        result.price = parseFloat(saleMatch[1]);
      } else if (regularMatch && regularMatch[1]) {
        result.price = parseFloat(regularMatch[1]);
      }
    }

    // Extract temperatures from pattern like "Bed / Print Temperature: 100 - 110 C (212 - 230 F) / 220 - 260 C"
    const tempPattern = /Bed\s*\/?\s*Print\s*Temperature[:\s]*(\d+)\s*[-–]\s*(\d+)\s*C[^\/]*\/\s*(\d+)\s*[-–]\s*(\d+)\s*C/i;
    const tempMatch = html.match(tempPattern);
    if (tempMatch) {
      result.bed_temp_min_c = parseInt(tempMatch[1]);
      result.bed_temp_max_c = parseInt(tempMatch[2]);
      result.nozzle_temp_min_c = parseInt(tempMatch[3]);
      result.nozzle_temp_max_c = parseInt(tempMatch[4]);
      console.log(`Found temps: Bed ${result.bed_temp_min_c}-${result.bed_temp_max_c}C, Nozzle ${result.nozzle_temp_min_c}-${result.nozzle_temp_max_c}C`);
    }

    return result;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return result;
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

    // Create auth client for user verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { limit = 50, force = false } = await req.json().catch(() => ({}));

    // Fetch Paramount 3D filaments missing prices
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, variant_price, nozzle_temp_min_c')
      .eq('vendor', 'Paramount 3D')
      .not('product_url', 'is', null);

    if (!force) {
      query = query.is('variant_price', null);
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Paramount 3D filaments to process`);

    const results: { id: string; title: string; price: number | null; temps: boolean; error?: string }[] = [];
    let updated = 0;
    let failed = 0;

    for (const filament of filaments || []) {
      if (!filament.product_url) {
        results.push({ id: filament.id, title: filament.product_title, price: null, temps: false, error: 'No product URL' });
        failed++;
        continue;
      }

      console.log(`Scraping: ${filament.product_title}`);
      
      const scraped = await scrapeProductPage(filament.product_url);

      if (scraped.price || scraped.nozzle_temp_min_c) {
        const updateData: Record<string, number | null> = {};
        
        if (scraped.price) {
          updateData.variant_price = scraped.price;
        }
        if (scraped.nozzle_temp_min_c) {
          updateData.nozzle_temp_min_c = scraped.nozzle_temp_min_c;
          updateData.nozzle_temp_max_c = scraped.nozzle_temp_max_c;
          updateData.bed_temp_min_c = scraped.bed_temp_min_c;
          updateData.bed_temp_max_c = scraped.bed_temp_max_c;
        }

        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`Failed to update ${filament.id}:`, updateError);
          results.push({ id: filament.id, title: filament.product_title, price: null, temps: false, error: updateError.message });
          failed++;
        } else {
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            price: scraped.price, 
            temps: scraped.nozzle_temp_min_c !== null 
          });
          updated++;
        }
      } else {
        results.push({ id: filament.id, title: filament.product_title, price: null, temps: false, error: 'No data found' });
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return new Response(JSON.stringify({
      success: true,
      total: filaments?.length || 0,
      updated,
      failed,
      results: results.slice(0, 20), // Return first 20 results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
