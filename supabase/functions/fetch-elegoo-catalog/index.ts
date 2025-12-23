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
  CatalogItemUrl: string;
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

    // Transform items to match our expected format
    const products = (data.Items || []).map((item) => ({
      productId: item.Id,
      title: item.Name,
      description: item.Description,
      price: item.CurrentPrice,
      compareAtPrice: item.OriginalPrice > item.CurrentPrice ? item.OriginalPrice : null,
      currency: item.Currency || 'USD',
      url: item.CatalogItemUrl,
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
    }));

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
