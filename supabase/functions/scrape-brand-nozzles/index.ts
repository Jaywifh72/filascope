import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NozzleData {
  name: string;
  brand: string;
  specs: {
    diameter_mm?: number;
    material?: string;
    max_temp_c?: number;
    hardened?: boolean;
    compatible_printers?: string[];
  };
  product_url: string;
  price?: number;
  currency?: string;
}

// Brand-specific nozzle scraping configurations
const BRAND_CONFIGS: Record<string, {
  collection_url?: string;
  compatibility_pattern?: RegExp;
}> = {
  'Bambu Lab': {
    collection_url: 'https://us.store.bambulab.com/collections/nozzle',
    compatibility_pattern: /X1|P1|A1|H2/i,
  },
  'Prusa Research': {
    collection_url: 'https://www.prusa3d.com/category/nozzles/',
    compatibility_pattern: /MK4|MK3|MINI|XL/i,
  },
  'Creality': {
    collection_url: 'https://store.creality.com/collections/nozzles',
    compatibility_pattern: /K1|Ender|CR-/i,
  },
  'Anycubic': {
    collection_url: 'https://www.anycubic.com/collections/nozzles',
    compatibility_pattern: /Kobra|Vyper/i,
  },
  'Voron Design': {
    collection_url: 'https://kb.vorondesign.com/build/startup/#hotend-nozzles',
    compatibility_pattern: /Voron/i,
  },
};

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<{ markdown?: string; links?: string[] } | null> {
  console.log(`Scraping URL: ${url}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('Firecrawl scrape failed:', data.error);
      return null;
    }

    return {
      markdown: data.data?.markdown,
      links: data.data?.links,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

function parseNozzlesFromMarkdown(markdown: string, brand: string, sourceUrl: string): NozzleData[] {
  const nozzles: NozzleData[] = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    // Look for nozzle-related content
    const lowerLine = line.toLowerCase();
    if (!lowerLine.includes('nozzle') && !lowerLine.includes('hotend')) continue;
    
    // Extract diameter
    const diameterMatch = line.match(/(0\.\d+)\s*mm/);
    const diameter = diameterMatch ? parseFloat(diameterMatch[1]) : undefined;
    
    if (!diameter) continue;
    
    // Extract material
    let material = 'brass';
    let hardened = false;
    if (lowerLine.includes('hardened') || lowerLine.includes('steel')) {
      material = 'hardened steel';
      hardened = true;
    } else if (lowerLine.includes('tungsten')) {
      material = 'tungsten carbide';
      hardened = true;
    } else if (lowerLine.includes('stainless')) {
      material = 'stainless steel';
      hardened = true;
    }
    
    // Extract price
    const priceMatch = line.match(/\$\s*([\d.]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;
    
    // Create nozzle name
    const name = `${diameter}mm ${material} nozzle`.replace(/\s+/g, ' ').trim();
    
    nozzles.push({
      name: line.trim().substring(0, 100) || name,
      brand,
      specs: {
        diameter_mm: diameter,
        material,
        hardened,
      },
      product_url: sourceUrl,
      price,
      currency: 'USD',
    });
  }
  
  return nozzles;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { brandId, brandName } = await req.json();

    if (!brandId || !brandName) {
      return new Response(
        JSON.stringify({ error: 'brandId and brandName required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Starting nozzle scraping for brand: ${brandName}`);

    const config = BRAND_CONFIGS[brandName];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `No scraping config for brand: ${brandName}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let allNozzles: NozzleData[] = [];

    // Scrape from collection URL
    if (config.collection_url) {
      const scraped = await scrapeWithFirecrawl(config.collection_url, firecrawlKey);
      if (scraped?.markdown) {
        const nozzles = parseNozzlesFromMarkdown(scraped.markdown, brandName, config.collection_url);
        allNozzles.push(...nozzles);
      }
    }

    console.log(`Found ${allNozzles.length} nozzles for ${brandName}`);

    // Get all printers for this brand
    const { data: printers, error: printersError } = await supabase
      .from('printers')
      .select('id, model_name')
      .eq('brand_id', brandId);

    if (printersError) {
      throw printersError;
    }

    // Insert nozzles as accessories for compatible printers
    let insertCount = 0;
    for (const nozzle of allNozzles) {
      for (const printer of printers || []) {
        // Check if nozzle is compatible with printer
        const isCompatible = config.compatibility_pattern?.test(printer.model_name) ?? true;

        if (isCompatible) {
          const { error: insertError } = await supabase
            .from('printer_accessories')
            .upsert({
              printer_id: printer.id,
              accessory_type: 'nozzle',
              name: nozzle.name,
              specs: nozzle.specs,
              product_url: nozzle.product_url,
              price: nozzle.price,
              currency: nozzle.currency || 'USD',
            }, {
              onConflict: 'printer_id,name',
              ignoreDuplicates: false,
            });

          if (!insertError) {
            insertCount++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        brand: brandName,
        nozzles_found: allNozzles.length,
        accessories_created: insertCount,
        printers_updated: printers?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
