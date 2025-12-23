import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Catalog {
  Id: string;
  Name: string;
  Description: string;
  ItemCount: number;
  DateCreated: string;
  DateLastUpdated: string;
  Status: string;
  AdvertiserLocation: string;
  Currency: string;
  ServiceAreas: string[];
}

interface CatalogsResponse {
  '@nextpageuri': string | null;
  '@previouspageuri': string | null;
  Page: number;
  TotalPages: number;
  TotalRecords: number;
  Catalogs: Catalog[];
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

    console.log(`Fetching available catalogs for account: ${accountSid}`);

    // Impact.com API endpoint for listing catalogs
    const baseUrl = `https://api.impact.com/Mediapartners/${accountSid}/Catalogs`;
    
    // Create Basic Auth header
    const authString = btoa(`${accountSid}:${authToken}`);
    
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
      },
    });

    console.log(`Impact API response status: ${response.status}`);

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

    const data = await response.json();
    
    // Log the raw response structure to debug field names
    console.log(`Raw API response keys: ${Object.keys(data).join(', ')}`);
    
    // Impact API may return Catalogs in different structures
    const rawCatalogs = data.Catalogs || data.catalogs || [];
    
    console.log(`Found ${rawCatalogs.length} catalogs (total: ${data.TotalRecords || data.totalRecords || 'N/A'})`);
    
    // Log first catalog to see field structure
    if (rawCatalogs.length > 0) {
      console.log(`First catalog fields: ${Object.keys(rawCatalogs[0]).join(', ')}`);
      console.log(`First catalog Status value: "${rawCatalogs[0].Status || rawCatalogs[0].status || 'NOT_FOUND'}"`);
    }

    // Transform catalogs to a simpler format with regional information
    // Handle both PascalCase and camelCase field names from API
    const catalogs = rawCatalogs.map((catalog: any) => ({
      id: catalog.Id || catalog.id,
      name: catalog.Name || catalog.name,
      description: catalog.Description || catalog.description,
      itemCount: catalog.ItemCount || catalog.itemCount || 0,
      dateCreated: catalog.DateCreated || catalog.dateCreated,
      dateLastUpdated: catalog.DateLastUpdated || catalog.dateLastUpdated,
      status: catalog.Status || catalog.status || 'Active', // Default to Active if not specified
      location: catalog.AdvertiserLocation || catalog.advertiserLocation || null,
      currency: catalog.Currency || catalog.currency || null,
      serviceAreas: catalog.ServiceAreas || catalog.serviceAreas || [],
    }));

    return new Response(
      JSON.stringify({
        catalogs,
        pagination: {
          page: data.Page,
          totalPages: data.TotalPages,
          totalRecords: data.TotalRecords,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error listing Impact catalogs:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
