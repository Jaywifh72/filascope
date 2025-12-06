import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegionalStore {
  region: string;
  currency: string;
  urlField: string;
  priceField: string;
  amazonUrlField: string;
  amazonPriceField: string;
  firecrawlCountry: string;
}

const REGIONAL_CONFIG: RegionalStore[] = [
  { region: 'US', currency: 'USD', urlField: 'official_store_url', priceField: 'current_price_usd_store', amazonUrlField: 'amazon_url_us', amazonPriceField: 'current_price_usd_amazon', firecrawlCountry: 'US' },
  { region: 'CA', currency: 'CAD', urlField: 'official_store_url_ca', priceField: 'current_price_cad_store', amazonUrlField: 'amazon_url_ca', amazonPriceField: 'current_price_cad_amazon', firecrawlCountry: 'CA' },
  { region: 'UK', currency: 'GBP', urlField: 'official_store_url_uk', priceField: 'current_price_gbp_store', amazonUrlField: 'amazon_url_uk', amazonPriceField: 'current_price_gbp_amazon', firecrawlCountry: 'GB' },
  { region: 'EU', currency: 'EUR', urlField: 'official_store_url_eu', priceField: 'current_price_eur_store', amazonUrlField: 'amazon_url_de', amazonPriceField: 'current_price_eur_amazon', firecrawlCountry: 'DE' },
  { region: 'AU', currency: 'AUD', urlField: 'official_store_url_au', priceField: 'current_price_aud_store', amazonUrlField: 'amazon_url_au', amazonPriceField: 'current_price_aud_amazon', firecrawlCountry: 'AU' },
  { region: 'JP', currency: 'JPY', urlField: 'official_store_url_jp', priceField: 'current_price_jpy_store', amazonUrlField: 'amazon_url_jp', amazonPriceField: 'current_price_jpy_amazon', firecrawlCountry: 'JP' },
];

function isValidPrinterPrice(price: number | null | undefined): boolean {
  if (price === null || price === undefined || isNaN(price)) return false;
  if (price < 50) return false; // Most printers cost more than $50
  if (price > 100000) return false; // Sanity check for very high prices
  return true;
}

function extractPriceFromMarkdown(markdown: string, currency: string): number | null {
  // Currency-specific patterns
  const currencySymbols: Record<string, string> = {
    'USD': '\\$',
    'CAD': '(?:C\\$|CAD\\s*\\$?|\\$)',
    'GBP': '£',
    'EUR': '€',
    'AUD': '(?:A\\$|AUD\\s*\\$?|\\$)',
    'JPY': '(?:¥|￥)',
  };

  const symbol = currencySymbols[currency] || '\\$';
  
  // Try to find prices with the currency symbol
  const pricePatterns = [
    new RegExp(`${symbol}\\s*([\\d,]+(?:\\.\\d{2})?)`, 'gi'),
    new RegExp(`([\\d,]+(?:\\.\\d{2})?)\\s*${symbol}`, 'gi'),
    new RegExp(`(?:price|cost|buy|now|sale)[:\\s]*${symbol}?\\s*([\\d,]+(?:\\.\\d{2})?)`, 'gi'),
  ];

  const prices: number[] = [];

  for (const pattern of pricePatterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (isValidPrinterPrice(price)) {
        prices.push(price);
      }
    }
  }

  if (prices.length === 0) return null;

  // For JPY, prices are typically higher (no decimal places)
  if (currency === 'JPY') {
    const jpy = prices.find(p => p > 10000);
    return jpy || prices[0];
  }

  // Return the most common reasonable price (likely the main product price)
  prices.sort((a, b) => a - b);
  return prices[0]; // Return the lowest valid price (likely current/sale price)
}

async function scrapePrice(url: string, region: RegionalStore, firecrawlApiKey: string): Promise<number | null> {
  if (!url || !url.startsWith('http')) return null;

  try {
    console.log(`  Scraping ${region.region} store: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
        location: { country: region.firecrawlCountry },
      }),
    });

    if (!response.ok) {
      console.warn(`  Firecrawl error for ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.data?.markdown) {
      console.warn(`  No markdown content from ${url}`);
      return null;
    }

    const price = extractPriceFromMarkdown(data.data.markdown, region.currency);
    if (price) {
      console.log(`  ✓ Found ${region.currency} ${price} at ${url}`);
    } else {
      console.log(`  ✗ No valid price found at ${url}`);
    }
    return price;
  } catch (error) {
    console.error(`  Error scraping ${url}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { brand, regions, limit = 5 } = await req.json();
    
    const selectedRegions = regions && regions.length > 0 
      ? REGIONAL_CONFIG.filter(r => regions.includes(r.region))
      : REGIONAL_CONFIG;

    console.log(`Starting global price update for ${brand || 'all brands'}, regions: ${selectedRegions.map(r => r.region).join(', ')}`);

    // Fetch printers to update
    let query = supabase
      .from('printers')
      .select('id, printer_id, model_name, brand_id, official_store_url, official_store_url_ca, official_store_url_uk, official_store_url_eu, official_store_url_au, official_store_url_jp, amazon_url_us, amazon_url_ca, amazon_url_uk, amazon_url_de, amazon_url_au, amazon_url_jp, printer_brands!inner(brand)')
      .eq('status', 'active')
      .limit(limit);

    if (brand) {
      query = query.eq('printer_brands.brand', brand);
    }

    const { data: printers, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch printers: ${fetchError.message}`);
    }

    if (!printers || printers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No printers to update',
        results: [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Processing ${printers.length} printers...`);

    const results = [];
    let totalUpdated = 0;
    let totalFailed = 0;

    for (const printer of printers) {
      const brandName = (printer.printer_brands as any)?.brand || 'Unknown';
      console.log(`\nProcessing: ${brandName} ${printer.model_name}`);

      const printerResult: any = {
        printer_id: printer.printer_id,
        model_name: printer.model_name,
        brand: brandName,
        prices: {},
      };

      const updateData: any = {
        prices_last_updated_at: new Date().toISOString(),
      };

      let pricesFound = 0;

      for (const region of selectedRegions) {
        // Get URLs for this region
        const storeUrl = (printer as any)[region.urlField] || (region.region === 'US' ? printer.official_store_url : null);
        const amazonUrl = (printer as any)[region.amazonUrlField];

        // Scrape store price
        if (storeUrl) {
          const storePrice = await scrapePrice(storeUrl, region, firecrawlApiKey);
          if (storePrice) {
            updateData[region.priceField] = storePrice;
            printerResult.prices[`${region.region}_store`] = { price: storePrice, currency: region.currency };
            pricesFound++;
          }
          await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        }

        // Scrape Amazon price
        if (amazonUrl) {
          const amazonPrice = await scrapePrice(amazonUrl, region, firecrawlApiKey);
          if (amazonPrice) {
            updateData[region.amazonPriceField] = amazonPrice;
            printerResult.prices[`${region.region}_amazon`] = { price: amazonPrice, currency: region.currency };
            pricesFound++;
          }
          await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        }
      }

      // Update the printer record
      if (pricesFound > 0) {
        const { error: updateError } = await supabase
          .from('printers')
          .update(updateData)
          .eq('id', printer.id);

        if (updateError) {
          console.error(`  Failed to update ${printer.model_name}:`, updateError);
          printerResult.success = false;
          printerResult.error = updateError.message;
          totalFailed++;
        } else {
          console.log(`  ✓ Updated ${printer.model_name} with ${pricesFound} prices`);
          printerResult.success = true;
          printerResult.prices_found = pricesFound;
          totalUpdated++;
        }
      } else {
        printerResult.success = false;
        printerResult.error = 'No prices found';
        totalFailed++;
      }

      results.push(printerResult);
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total processed: ${printers.length}`);
    console.log(`Successfully updated: ${totalUpdated}`);
    console.log(`Failed: ${totalFailed}`);

    return new Response(JSON.stringify({
      success: true,
      total_processed: printers.length,
      updated: totalUpdated,
      failed: totalFailed,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in update-global-prices:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
