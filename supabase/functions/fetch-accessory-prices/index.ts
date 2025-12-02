import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple price extraction from HTML/markdown
function extractPriceFromContent(content: string): number | null {
  // Look for common price patterns
  const patterns = [
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,  // $99.99, $1,299.00
    /USD\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // USD 99.99
    /Price:\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // Price: $99.99
  ];

  for (const pattern of patterns) {
    const matches = Array.from(content.matchAll(pattern));
    if (matches.length > 0) {
      // Get the first price found
      const priceStr = matches[0][1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (price > 0 && price < 10000) { // Sanity check
        return price;
      }
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get accessories that need price checks (older than 24 hours or never checked)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: accessories, error: fetchError } = await supabase
      .from('printer_accessories')
      .select('*')
      .not('product_url', 'is', null)
      .or(`last_price_check.is.null,last_price_check.lt.${twentyFourHoursAgo}`)
      .limit(50); // Process 50 at a time

    if (fetchError) {
      console.error('Error fetching accessories:', fetchError);
      throw fetchError;
    }

    if (!accessories || accessories.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No accessories need price updates',
          checked: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking prices for ${accessories.length} accessories`);

    let updated = 0;
    let errors = 0;

    for (const accessory of accessories) {
      try {
        console.log(`Fetching price for: ${accessory.name}`);
        
        let price: number | null = null;

        if (firecrawlApiKey && accessory.product_url) {
          // Try to scrape the price using Firecrawl
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: accessory.product_url,
              formats: ['markdown'],
              onlyMainContent: true,
            }),
          });

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const markdown = scrapeData.data?.markdown || '';
            price = extractPriceFromContent(markdown);
            console.log(`Extracted price for ${accessory.name}: $${price}`);
          }
        }

        const oldPrice = accessory.price;
        const priceChangePercent = price && oldPrice 
          ? ((price - oldPrice) / oldPrice) * 100 
          : null;

        // Update accessory with new price and last check time
        await supabase
          .from('printer_accessories')
          .update({
            price: price,
            last_price_check: new Date().toISOString(),
            price_change_percent: priceChangePercent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', accessory.id);

        // Record price in history if we got a valid price
        if (price !== null) {
          await supabase
            .from('accessory_price_history')
            .insert({
              accessory_id: accessory.id,
              price: price,
              currency: accessory.currency || 'USD',
              source: 'automated_scrape',
            });
        }

        updated++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error checking price for ${accessory.name}:`, error);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Price check complete`,
        checked: accessories.length,
        updated,
        errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fetch accessory prices error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
