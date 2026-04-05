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

// Parse Text1 JSON for technical specs - enhanced to handle various field names
interface TechSpecs {
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  density_g_cm3: number | null;
  print_speed_max_mms: number | null;
  drying_temp_c: number | null;
  drying_time_hours: number | null;
}

function parseTechSpecs(text1: string | null, text2?: string | null, text3?: string | null, bullets?: string[]): TechSpecs {
  const specs: TechSpecs = {
    nozzle_temp_min_c: null,
    nozzle_temp_max_c: null,
    bed_temp_min_c: null,
    bed_temp_max_c: null,
    density_g_cm3: null,
    print_speed_max_mms: null,
    drying_temp_c: null,
    drying_time_hours: null,
  };
  
  // Helper to parse number from various formats
  const parseNum = (val: unknown): number | null => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    }
    return null;
  };

  // Try parsing JSON from Text1
  if (text1) {
    try {
      const data = JSON.parse(text1);
      
      // Nozzle temperature - various possible field names
      const nozzleMinKeys = ['temp_min', 'nozzle_temp_min', 'nozzle_min', 'hotend_temp_min', 'print_temp_min', 'printing_temp_min'];
      const nozzleMaxKeys = ['temp_max', 'nozzle_temp_max', 'nozzle_max', 'hotend_temp_max', 'print_temp_max', 'printing_temp_max'];
      
      for (const key of nozzleMinKeys) {
        const val = parseNum(data[key]);
        if (val !== null && val >= 150 && val <= 350) {
          specs.nozzle_temp_min_c = val;
          break;
        }
      }
      
      for (const key of nozzleMaxKeys) {
        const val = parseNum(data[key]);
        if (val !== null && val >= 150 && val <= 350) {
          specs.nozzle_temp_max_c = val;
          break;
        }
      }
      
      // Bed temperature - various possible field names
      const bedMinKeys = ['bed_temp_min', 'bed_min', 'platform_temp_min', 'heated_bed_min'];
      const bedMaxKeys = ['bed_temp_max', 'bed_max', 'platform_temp_max', 'heated_bed_max'];
      
      for (const key of bedMinKeys) {
        const val = parseNum(data[key]);
        if (val !== null && val >= 0 && val <= 150) {
          specs.bed_temp_min_c = val;
          break;
        }
      }
      
      for (const key of bedMaxKeys) {
        const val = parseNum(data[key]);
        if (val !== null && val >= 0 && val <= 150) {
          specs.bed_temp_max_c = val;
          break;
        }
      }
      
      // Density - handle both kg/m³ and g/cm³
      const densityKeys = ['density', 'material_density', 'filament_density'];
      for (const key of densityKeys) {
        const val = parseNum(data[key]);
        if (val !== null) {
          // If value > 100, assume kg/m³ and convert
          specs.density_g_cm3 = val > 100 ? val / 1000 : val;
          break;
        }
      }
      
      // Print speed
      const speedKeys = ['print_speed', 'max_speed', 'speed_max', 'printing_speed'];
      for (const key of speedKeys) {
        const val = parseNum(data[key]);
        if (val !== null && val >= 10 && val <= 1000) {
          specs.print_speed_max_mms = val;
          break;
        }
      }
      
      // Drying temperature
      const dryTempKeys = ['drying_temp', 'dry_temp', 'dehydration_temp'];
      for (const key of dryTempKeys) {
        const val = parseNum(data[key]);
        if (val !== null && val >= 30 && val <= 120) {
          specs.drying_temp_c = val;
          break;
        }
      }
      
      // Drying time
      const dryTimeKeys = ['drying_time', 'dry_time', 'dehydration_time'];
      for (const key of dryTimeKeys) {
        const val = parseNum(data[key]);
        if (val !== null && val >= 1 && val <= 48) {
          specs.drying_time_hours = val;
          break;
        }
      }
    } catch (e) {
      // Not JSON, try regex parsing on the raw text
      const tempRangeMatch = text1.match(/(\d{3})\s*[-–~]\s*(\d{3})\s*(?:°?C|celsius)/i);
      if (tempRangeMatch) {
        const min = parseInt(tempRangeMatch[1]);
        const max = parseInt(tempRangeMatch[2]);
        if (min >= 150 && min <= 350 && max >= 150 && max <= 350) {
          specs.nozzle_temp_min_c = min;
          specs.nozzle_temp_max_c = max;
        }
      }
    }
  }
  
  // Also try parsing Text2 and Text3 for additional specs
  for (const text of [text2, text3]) {
    if (!text) continue;
    try {
      const data = JSON.parse(text);
      // Apply same parsing logic for any missing fields
      if (specs.nozzle_temp_min_c === null && data.temp_min) specs.nozzle_temp_min_c = parseNum(data.temp_min);
      if (specs.nozzle_temp_max_c === null && data.temp_max) specs.nozzle_temp_max_c = parseNum(data.temp_max);
      if (specs.bed_temp_min_c === null && data.bed_temp_min) specs.bed_temp_min_c = parseNum(data.bed_temp_min);
      if (specs.bed_temp_max_c === null && data.bed_temp_max) specs.bed_temp_max_c = parseNum(data.bed_temp_max);
    } catch {
      // Not JSON, skip
    }
  }
  
  // Parse bullets for additional specs
  if (bullets && Array.isArray(bullets)) {
    const allText = bullets.join(' ');
    
    // Temperature range patterns in bullets
    if (specs.nozzle_temp_min_c === null || specs.nozzle_temp_max_c === null) {
      const nozzleMatch = allText.match(/(?:nozzle|hotend|printing?)[\s:]*(\d{3})\s*[-–~]\s*(\d{3})\s*(?:°?C)?/i);
      if (nozzleMatch) {
        if (specs.nozzle_temp_min_c === null) specs.nozzle_temp_min_c = parseInt(nozzleMatch[1]);
        if (specs.nozzle_temp_max_c === null) specs.nozzle_temp_max_c = parseInt(nozzleMatch[2]);
      }
    }
    
    if (specs.bed_temp_min_c === null || specs.bed_temp_max_c === null) {
      const bedMatch = allText.match(/(?:bed|platform|heated[\s-]?bed)[\s:]*(\d{1,3})\s*[-–~]\s*(\d{1,3})\s*(?:°?C)?/i);
      if (bedMatch) {
        if (specs.bed_temp_min_c === null) specs.bed_temp_min_c = parseInt(bedMatch[1]);
        if (specs.bed_temp_max_c === null) specs.bed_temp_max_c = parseInt(bedMatch[2]);
      }
    }
    
    // Speed pattern
    if (specs.print_speed_max_mms === null) {
      const speedMatch = allText.match(/(?:speed|high[\s-]?speed)[\s:]*(?:up\s+to\s+)?(\d+)\s*(?:mm\/s|mms)/i);
      if (speedMatch) {
        specs.print_speed_max_mms = parseInt(speedMatch[1]);
      }
    }
    
    // Drying info
    if (specs.drying_temp_c === null || specs.drying_time_hours === null) {
      const dryMatch = allText.match(/dry(?:ing)?[\s:]*(\d+)\s*(?:°?C)?[\s,]*(?:for\s+)?(\d+)\s*(?:h(?:ours?)?)/i);
      if (dryMatch) {
        if (specs.drying_temp_c === null) specs.drying_temp_c = parseInt(dryMatch[1]);
        if (specs.drying_time_hours === null) specs.drying_time_hours = parseInt(dryMatch[2]);
      }
    }
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
      const techSpecs = parseTechSpecs(item.Text1, item.Text2, item.Text3, item.Bullets);
      const material = extractMaterialFromName(item.Name);
      
      return {
        productId: item.Id,
        title: item.Name,
        description: item.Description,
        price: item.CurrentPrice,
        originalPrice: item.OriginalPrice || item.CurrentPrice,  // MSRP: fallback to CurrentPrice if missing
        compareAtPrice: item.OriginalPrice > item.CurrentPrice ? item.OriginalPrice : null,
        currency: item.Currency || 'USD',
        url: item.Url?.replace(/(?<!:)\/{2,}/g, '/'),
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
