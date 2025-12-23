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

    const { materialFilter, page = 1, pageSize = 100 } = await req.json();
    
    console.log(`Fetching Elegoo catalog - page ${page}, pageSize ${pageSize}, filter: ${materialFilter || 'all'}`);

    // Impact.com API credentials for Elegoo
    const catalogId = '49631'; // Elegoo's catalog ID from the spreadsheet
    const baseUrl = `https://api.impact.com/Mediapartners/${accountSid}/Catalogs/${catalogId}/Items`;
    
    // Build query parameters
    const params = new URLSearchParams({
      Page: page.toString(),
      PageSize: pageSize.toString(),
    });

    // Add filters for filament products
    // According to the spreadsheet, we should filter by ItemSubCategory or Labels
    if (materialFilter) {
      params.append('Query', `Name CONTAINS '${materialFilter}' OR Labels CONTAINS '${materialFilter}'`);
    } else {
      // Filter for filament products
      params.append('Query', "Name CONTAINS 'filament' OR Labels CONTAINS 'filament' OR ItemSubCategory CONTAINS 'filament'");
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
