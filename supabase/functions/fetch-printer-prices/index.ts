import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced price extraction with multiple pattern matching
function extractPrices(markdown: string): {
  msrp_usd: number | null;
  current_price_usd_store: number | null;
} {
  let msrp_usd: number | null = null;
  let current_price_usd_store: number | null = null;

  // Extract ALL USD prices from the entire markdown (not just specific lines)
  const usdPriceRegex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD)?/gi;
  const allMatches = markdown.matchAll(usdPriceRegex);
  const allPrices: number[] = [];
  
  for (const match of allMatches) {
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (price >= 100 && price <= 50000) { // Reasonable printer price range
      allPrices.push(price);
    }
  }

  console.log(`Found ${allPrices.length} prices in range: ${allPrices.slice(0, 5).join(', ')}`);

  if (allPrices.length === 0) {
    return { msrp_usd: null, current_price_usd_store: null };
  }

  // Look for explicit MSRP/RRP mentions
  const msrpMatch = markdown.match(/(?:MSRP|RRP|Retail\s+Price)[:\s]*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (msrpMatch) {
    msrp_usd = parseFloat(msrpMatch[1].replace(/,/g, ''));
  }

  // Look for "from" prices (usually base/starting prices)
  const fromPriceMatch = markdown.match(/(?:from|starting\s+at)[:\s]*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (fromPriceMatch) {
    const fromPrice = parseFloat(fromPriceMatch[1].replace(/,/g, ''));
    if (!current_price_usd_store) {
      current_price_usd_store = fromPrice;
    }
  }

  // Strategy: Use the first significant price we find as the current store price
  if (!current_price_usd_store && allPrices.length > 0) {
    // Use the most common price (or first if all unique)
    const priceFrequency = new Map<number, number>();
    for (const price of allPrices) {
      priceFrequency.set(price, (priceFrequency.get(price) || 0) + 1);
    }
    
    // Get the price that appears most frequently
    let maxCount = 0;
    let mostCommonPrice = allPrices[0];
    for (const [price, count] of priceFrequency.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonPrice = price;
      }
    }
    
    current_price_usd_store = mostCommonPrice;
  }

  // If we found MSRP and it's the same as current price, clear MSRP
  if (msrp_usd && current_price_usd_store && msrp_usd === current_price_usd_store) {
    msrp_usd = null;
  }

  return { msrp_usd, current_price_usd_store };
}

// Intelligent URL correction: convert marketing pages to store pages
function correctUrlForPricing(url: string, brand: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // Bambu Lab: convert /products/ to /us/products/ (US store)
    if (hostname.includes('bambulab.com')) {
      if (pathname.startsWith('/products/') && !pathname.startsWith('/us/products/')) {
        return `https://us.store.bambulab.com${pathname}`;
      }
    }

    // Creality: convert /products/ to /collections/fdm-3d-printers/products/
    if (hostname.includes('creality.com') || hostname.includes('creality3d.shop')) {
      if (pathname.includes('/products/') && !pathname.includes('/collections/')) {
        const productSlug = pathname.split('/products/')[1];
        return `https://store.creality.com/collections/fdm-3d-printers/products/${productSlug}`;
      }
    }

    // Prusa Research: ensure it's the shop domain
    if (hostname.includes('prusa3d.com') && !hostname.includes('shop.prusa3d.com')) {
      return url.replace('www.prusa3d.com', 'shop.prusa3d.com').replace('prusa3d.com', 'shop.prusa3d.com');
    }

    // Anycubic: convert /products/ to store subdomain
    if (hostname.includes('anycubic.com') && !hostname.includes('store.anycubic.com')) {
      if (pathname.includes('/products/')) {
        return url.replace(/^https?:\/\/[^\/]+/, 'https://store.anycubic.com');
      }
    }

    // Elegoo: ensure store domain
    if (hostname.includes('elegoo.com') && !hostname.includes('www.elegoo.com')) {
      return url.replace(/^https?:\/\/[^\/]+/, 'https://www.elegoo.com');
    }

    // QIDI: convert to official store
    if (hostname.includes('qidi') && !hostname.includes('qidi3d.com')) {
      if (pathname.includes('/products/')) {
        const productSlug = pathname.split('/products/')[1]?.split('/')[0];
        return `https://qidi3d.com/products/${productSlug}`;
      }
    }

    return null; // No correction needed
  } catch (error) {
    console.error('URL correction error:', error);
    return null;
  }
}

// Direct Firecrawl API call
async function firecrawlScrape(url: string, apiKey: string) {
  console.log('Scraping price from:', url);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    console.error('Firecrawl error:', responseData);
    throw new Error(`Firecrawl API error: ${response.statusText}`);
  }

  return responseData;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { printerIds } = await req.json() as { printerIds?: string[] };

    console.log('Fetching prices for printers:', printerIds?.length || 'all without prices');

    // Get printers without prices
    let query = supabase
      .from('printers')
      .select('id, model_name, official_product_url, printer_brands!brand_id(brand)')
      .eq('status', 'active')
      .not('official_product_url', 'is', null);

    if (printerIds && printerIds.length > 0) {
      query = query.in('id', printerIds);
    } else {
      // Only fetch printers without any price data
      query = query
        .is('msrp_usd', null)
        .is('current_price_usd_store', null)
        .is('current_price_usd_amazon', null);
    }

    const { data: printers, error: fetchError } = await query.limit(20);

    if (fetchError) {
      throw fetchError;
    }

    if (!printers || printers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No printers found needing price updates',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${printers.length} printers`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const printer of printers) {
      try {
        const brand = (printer as any).printer_brands?.brand || 'Unknown';
        console.log(`\n=== Processing: ${brand} ${printer.model_name} ===`);

        // Skip DIY kit brands (Voron, etc.)
        if (brand.toLowerCase().includes('voron') || 
            brand.toLowerCase().includes('ldo motors')) {
          console.log(`Skipping - ${brand} is a DIY kit brand with no official pricing`);
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'DIY kit - no official pricing'
          });
          continue;
        }

        if (!printer.official_product_url || 
            !printer.official_product_url.startsWith('http')) {
          console.log(`Skipping - invalid URL: ${printer.official_product_url}`);
          failCount++;
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'Invalid URL'
          });
          continue;
        }

        // Try URL correction first
        const correctedUrl = correctUrlForPricing(printer.official_product_url, brand);
        const urlToScrape = correctedUrl || printer.official_product_url;
        
        if (correctedUrl) {
          console.log(`URL corrected: ${printer.official_product_url} → ${correctedUrl}`);
        }

        // Scrape the product page
        const scrapeResult = await firecrawlScrape(
          urlToScrape,
          firecrawlApiKey
        );

        if (!scrapeResult?.data?.markdown) {
          console.log('No markdown data returned');
          failCount++;
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'No data returned'
          });
          continue;
        }

        const markdown = scrapeResult.data.markdown;
        const prices = extractPrices(markdown);

        console.log('Extracted prices:', prices);

        if (prices.msrp_usd || prices.current_price_usd_store) {
          // Update the printer with found prices
          const updateData: any = {};
          if (prices.msrp_usd) updateData.msrp_usd = prices.msrp_usd;
          if (prices.current_price_usd_store) updateData.current_price_usd_store = prices.current_price_usd_store;

          const { error: updateError } = await supabase
            .from('printers')
            .update(updateData)
            .eq('id', printer.id);

          if (updateError) {
            console.error('Update error:', updateError);
            failCount++;
            results.push({
              printer_id: printer.id,
              model_name: printer.model_name,
              success: false,
              error: updateError.message
            });
          } else {
            console.log(`✓ Updated prices for ${printer.model_name}`);
            successCount++;
            results.push({
              printer_id: printer.id,
              model_name: printer.model_name,
              success: true,
              prices: prices
            });
          }
        } else {
          console.log('No prices found in content');
          failCount++;
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'No prices found'
          });
        }

        // Rate limiting - wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing ${printer.model_name}:`, error);
        failCount++;
        results.push({
          printer_id: printer.id,
          model_name: printer.model_name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`\nCompleted: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: `Price fetch completed`,
        total_processed: printers.length,
        successful: successCount,
        failed: failCount,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
