import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CatalogItem {
  Id: string;
  Name: string;
  Description: string;
  CurrentPrice: number;
  OriginalPrice: number;
  Currency: string;
  Url: string;
  ImageUrl: string;
  Manufacturer: string;
  ManufacturerPartNumber: string;
  Upc: string;
  Ean: string;
  InStock: boolean;
  StockQuantity: number;
  Labels: string[];
  ItemSubCategory: string;
  ItemSubCategoryId: string;
  // Additional fields for TDS extraction
  Bullets: string[];
  Text1: string;
  Text2: string;
  Text3: string;
}

// Extract material type from product name
function extractMaterialFromName(name: string): string | null {
  const upperName = name.toUpperCase();
  
  // Order matters - check more specific patterns first
  const patterns = [
    'RAPID PLA+', 'RAPID PLA', 'PLA-PRO', 'PLA PRO', 'PLA+', 'PLA',
    'RAPID PETG+', 'RAPID PETG', 'PETG-CF', 'PETG CF', 'PETG-PRO', 'PETG PRO', 'PETG',
    'PC-CF', 'PC CF', 'PC',
    'ASA', 'TPU', 'ABS'
  ];
  
  for (const pattern of patterns) {
    if (upperName.includes(pattern)) {
      return pattern;
    }
  }
  return null;
}

// Parse Text1 JSON for technical specs
interface TechSpecs {
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  density_g_cm3: number | null;
}

function parseTechSpecs(text1: string | null): TechSpecs {
  const specs: TechSpecs = {
    nozzle_temp_min_c: null,
    nozzle_temp_max_c: null,
    bed_temp_min_c: null,
    bed_temp_max_c: null,
    density_g_cm3: null,
  };
  
  if (!text1) return specs;
  
  try {
    const data = JSON.parse(text1);
    if (data.temp_min) specs.nozzle_temp_min_c = data.temp_min;
    if (data.temp_max) specs.nozzle_temp_max_c = data.temp_max;
    if (data.bed_temp_min) specs.bed_temp_min_c = data.bed_temp_min;
    if (data.bed_temp_max) specs.bed_temp_max_c = data.bed_temp_max;
    if (data.density) specs.density_g_cm3 = data.density / 1000; // Convert kg/m³ to g/cm³
  } catch (e) {
    console.log('Failed to parse Text1 JSON:', text1);
  }
  
  return specs;
}

interface CatalogResponse {
  '@nextpageuri': string | null;
  '@previouspageuri': string | null;
  Page: number;
  TotalPages: number;
  TotalRecords: number;
  Items: CatalogItem[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accountSid = Deno.env.get('IMPACT_ELEGOO_ACCOUNT_SID');
    const authToken = Deno.env.get('IMPACT_ELEGOO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      console.error('Missing Impact API credentials');
      return new Response(
        JSON.stringify({ error: 'Impact API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { materialFilter, page = 1, pageSize = 100, catalogId } = await req.json();
    
    // Default catalog ID: 25495 = "Elegoo Filaments Datafeed for US" (247 products)
    // Campaign ID: 19663
    const DEFAULT_CATALOG_ID = '25495';
    const effectiveCatalogId = catalogId || Deno.env.get('IMPACT_ELEGOO_CATALOG_ID') || DEFAULT_CATALOG_ID;
    
    console.log(`Fetching Elegoo catalog ${effectiveCatalogId} - page ${page}, pageSize ${pageSize}, filter: ${materialFilter || 'all'}`);

    const baseUrl = `https://api.impact.com/Mediapartners/${accountSid}/Catalogs/${effectiveCatalogId}/Items`;
    
    // Build query parameters
    const params = new URLSearchParams({
      Page: page.toString(),
      PageSize: pageSize.toString(),
    });

    // Only add material filter if specified
    // Note: Catalog 25495 is already a filaments-only feed, so no default filter needed
    if (materialFilter) {
      // Use simpler query format for Impact API
      params.append('Query', `Name CONTAINS '${materialFilter}'`);
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log(`Fetching: ${url}`);

    // Create Basic Auth header
    const authString = btoa(`${accountSid}:${authToken}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Impact API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `Impact API error: ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: CatalogResponse = await response.json();
    
    console.log(`Fetched ${data.Items?.length || 0} items (page ${data.Page} of ${data.TotalPages}, total: ${data.TotalRecords})`);

    // Log first item's raw data for debugging
    if (data.Items?.length > 0) {
      const sample = data.Items[0];
      console.log('Sample item fields for debugging:', {
        Name: sample.Name,
        CurrentPrice: sample.CurrentPrice,
        OriginalPrice: sample.OriginalPrice,
        Text1: sample.Text1,
        hasDescription: !!sample.Description,
      });
    }

    // Transform items to match our expected format
    // TDS URLs will be discovered during sync by scraping product pages
    const products = (data.Items || []).map((item) => {
      const techSpecs = parseTechSpecs(item.Text1);
      const material = extractMaterialFromName(item.Name);
      
      return {
        productId: item.Id,
        title: item.Name,
        description: item.Description,
        price: item.CurrentPrice,
        originalPrice: item.OriginalPrice || item.CurrentPrice,  // MSRP: fallback to CurrentPrice if missing
        compareAtPrice: item.OriginalPrice > item.CurrentPrice ? item.OriginalPrice : null,
        currency: item.Currency || 'USD',
        url: item.Url,
        imageUrl: item.ImageUrl,
        manufacturer: item.Manufacturer,
        mpn: item.ManufacturerPartNumber,
        upc: item.Upc,
        ean: item.Ean,
        inStock: item.InStock,
        stockQuantity: item.StockQuantity,
        labels: item.Labels,
        category: item.ItemSubCategory,
        categoryId: item.ItemSubCategoryId,
        tdsUrl: null,  // Will be discovered by scraping product pages
        material: material,
        techSpecs: techSpecs,
      };
    });

    return new Response(
      JSON.stringify({
        products,
        pagination: {
          page: data.Page,
          totalPages: data.TotalPages,
          totalRecords: data.TotalRecords,
          hasNextPage: !!data['@nextpageuri'],
          hasPrevPage: !!data['@previouspageuri'],
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Elegoo catalog:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
