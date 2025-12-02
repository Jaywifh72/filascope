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
  const lines = markdown.split('\n');
  let msrp_usd: number | null = null;
  let current_price_usd_store: number | null = null;

  // Pattern 1: Standard USD price ($XXX.XX or $X,XXX.XX)
  const usdPriceRegex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  const allPrices: number[] = [];
  
  for (const line of lines) {
    const matches = line.matchAll(usdPriceRegex);
    for (const match of matches) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price >= 50 && price <= 50000) { // Reasonable printer price range
        allPrices.push(price);
      }
    }
  }

  // Pattern 2: Look for MSRP/RRP specifically
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('msrp') || lowerLine.includes('rrp') || lowerLine.includes('retail')) {
      const match = line.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      if (match) {
        msrp_usd = parseFloat(match[1].replace(/,/g, ''));
      }
    }
  }

  // Pattern 3: Look for price with "price:", "cost:", etc.
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if ((lowerLine.includes('price:') || lowerLine.includes('cost:')) && 
        !lowerLine.includes('starting at')) {
      const match = line.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      if (match) {
        current_price_usd_store = parseFloat(match[1].replace(/,/g, ''));
      }
    }
  }

  // If we found prices but couldn't distinguish MSRP from current, use the first found price
  if (allPrices.length > 0) {
    if (!msrp_usd && !current_price_usd_store) {
      current_price_usd_store = allPrices[0];
    } else if (!current_price_usd_store && msrp_usd) {
      // If we have MSRP but no current price, look for a different price
      const otherPrices = allPrices.filter(p => p !== msrp_usd);
      if (otherPrices.length > 0) {
        current_price_usd_store = otherPrices[0];
      } else {
        current_price_usd_store = msrp_usd;
      }
    }
  }

  return { msrp_usd, current_price_usd_store };
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

        // Scrape the product page
        const scrapeResult = await firecrawlScrape(
          printer.official_product_url,
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
