import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@4.7.0';

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
    [key: string]: any;
  };
  product_url: string;
  price?: number;
  currency?: string;
}

// Brand-specific nozzle scraping configurations
const BRAND_CONFIGS: Record<string, {
  collection_url?: string;
  product_urls?: string[];
  search_keywords?: string[];
  compatibility_pattern?: RegExp;
}> = {
  'Bambu Lab': {
    collection_url: 'https://us.store.bambulab.com/collections/nozzle',
    search_keywords: ['nozzle', 'hotend'],
    compatibility_pattern: /X1|P1|A1|H2/i,
  },
  'Prusa Research': {
    collection_url: 'https://www.prusa3d.com/category/nozzles/',
    search_keywords: ['nozzle'],
    compatibility_pattern: /MK4|MK3|MINI|XL/i,
  },
  'Creality': {
    collection_url: 'https://store.creality.com/collections/nozzles',
    search_keywords: ['nozzle'],
    compatibility_pattern: /K1|Ender|CR-/i,
  },
  'Anycubic': {
    collection_url: 'https://www.anycubic.com/collections/nozzles',
    search_keywords: ['nozzle'],
    compatibility_pattern: /Kobra|Vyper|Photon/i,
  },
  'Voron Design': {
    product_urls: [
      'https://kb.vorondesign.com/build/startup/#hotend-nozzles',
    ],
    compatibility_pattern: /Voron/i,
  },
};

async function extractNozzlesFromPage(
  firecrawl: FirecrawlApp,
  url: string,
  brand: string
): Promise<NozzleData[]> {
  console.log(`Scraping nozzles from: ${url}`);
  
  try {
    const response = await firecrawl.scrape(url, {
      formats: ['markdown', 'links'],
      onlyMainContent: true,
      waitFor: 2000,
    });

    if (!response || !response.markdown) {
      console.error(`Failed to scrape ${url}`);
      return [];
    }

    const markdown = response.markdown || '';
    const links = (response.links as string[]) || [];
    const nozzles: NozzleData[] = [];

    // Extract product links that contain nozzle keywords
    const nozzleLinks = links.filter((link: string) =>
      link.toLowerCase().includes('nozzle') || 
      link.toLowerCase().includes('hotend')
    );

    // Parse markdown for nozzle information
    const lines = markdown.split('\n');
    let currentNozzle: Partial<NozzleData> | null = null;

    for (const line of lines) {
      // Look for nozzle product names
      const nozzleMatch = line.match(/(?:^|\s)([\d.]+\s*mm|brass|steel|hardened|nozzle)/i);
      if (nozzleMatch) {
        // Extract diameter
        const diameterMatch = line.match(/(0\.\d+)\s*mm/);
        const diameter = diameterMatch ? parseFloat(diameterMatch[1]) : undefined;

        // Extract material
        let material = 'brass';
        if (line.toLowerCase().includes('hardened') || line.toLowerCase().includes('steel')) {
          material = 'hardened steel';
        } else if (line.toLowerCase().includes('tungsten')) {
          material = 'tungsten carbide';
        }

        // Extract price
        const priceMatch = line.match(/\$\s*([\d.]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;

        if (diameter) {
          currentNozzle = {
            name: line.trim().substring(0, 100),
            brand,
            specs: {
              diameter_mm: diameter,
              material,
              hardened: material.includes('hardened') || material.includes('steel'),
            },
            product_url: url,
            price,
            currency: 'USD',
          };
        }
      }
    }

    // Scrape individual nozzle product pages
    for (const link of nozzleLinks.slice(0, 20)) {
      try {
        const productResponse = await firecrawl.scrape(link, {
          formats: ['markdown'],
          onlyMainContent: true,
        });

        if (productResponse && productResponse.markdown) {
          const productData = parseNozzleProduct(productResponse.markdown, link, brand);
          if (productData) {
            nozzles.push(productData);
          }
        }
      } catch (error) {
        console.error(`Error scraping nozzle product ${link}:`, error);
      }
    }

    return nozzles;
  } catch (error) {
    console.error(`Error extracting nozzles from ${url}:`, error);
    return [];
  }
}

function parseNozzleProduct(markdown: string, url: string, brand: string): NozzleData | null {
  // Extract diameter
  const diameterMatch = markdown.match(/(0\.\d+)\s*mm/);
  const diameter = diameterMatch ? parseFloat(diameterMatch[1]) : undefined;

  if (!diameter) return null;

  // Extract material
  let material = 'brass';
  let hardened = false;
  if (markdown.toLowerCase().includes('hardened steel')) {
    material = 'hardened steel';
    hardened = true;
  } else if (markdown.toLowerCase().includes('stainless')) {
    material = 'stainless steel';
    hardened = true;
  } else if (markdown.toLowerCase().includes('tungsten')) {
    material = 'tungsten carbide';
    hardened = true;
  }

  // Extract max temp
  const tempMatch = markdown.match(/(\d+)\s*°?C/);
  const max_temp_c = tempMatch ? parseInt(tempMatch[1]) : undefined;

  // Extract price
  const priceMatch = markdown.match(/\$\s*([\d.]+)/);
  const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;

  // Extract title/name
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const name = titleMatch ? titleMatch[1].trim() : `${diameter}mm ${material} nozzle`;

  return {
    name,
    brand,
    specs: {
      diameter_mm: diameter,
      material,
      max_temp_c,
      hardened,
    },
    product_url: url,
    price,
    currency: 'USD',
  };
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
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });

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
      const nozzles = await extractNozzlesFromPage(firecrawl, config.collection_url, brandName);
      allNozzles.push(...nozzles);
    }

    // Scrape from specific product URLs
    if (config.product_urls) {
      for (const url of config.product_urls) {
        const nozzles = await extractNozzlesFromPage(firecrawl, url, brandName);
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
