import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FilamentIdentifiers {
  id: string;
  product_title: string;
  vendor: string;
  variant_sku: string | null;
  mpn: string | null;
  upc: string | null;
  ean: string | null;
  gtin: string | null;
}

interface LookupResult {
  filament_id: string;
  product_title: string;
  found: boolean;
  upc?: string | null;
  ean?: string | null;
  gtin?: string | null;
  source?: string;
  error?: string;
}

// Extract barcode from search results using patterns
function extractBarcodeFromText(text: string): { upc?: string; ean?: string; gtin?: string } {
  const result: { upc?: string; ean?: string; gtin?: string } = {};
  
  // Look for 12-digit UPC
  const upc12Match = text.match(/\b(\d{12})\b/);
  if (upc12Match) {
    result.upc = upc12Match[1];
  }
  
  // Look for 13-digit EAN
  const ean13Match = text.match(/\b(\d{13})\b/);
  if (ean13Match) {
    result.ean = ean13Match[1];
  }
  
  // Look for 14-digit GTIN
  const gtin14Match = text.match(/\b(\d{14})\b/);
  if (gtin14Match) {
    result.gtin = gtin14Match[1];
  }
  
  // Also look for labeled barcodes
  const upcLabelMatch = text.match(/UPC[:\s]*(\d{12,13})/i);
  if (upcLabelMatch) {
    const code = upcLabelMatch[1];
    if (code.length === 12) result.upc = code;
    if (code.length === 13) result.ean = code;
  }
  
  const eanLabelMatch = text.match(/EAN[:\s]*(\d{13})/i);
  if (eanLabelMatch) {
    result.ean = eanLabelMatch[1];
  }
  
  const gtinLabelMatch = text.match(/GTIN[:\s]*(\d{14})/i);
  if (gtinLabelMatch) {
    result.gtin = gtinLabelMatch[1];
  }
  
  return result;
}

// Search using SerpAPI
async function searchWithSerpApi(query: string, serpApiKey: string): Promise<{ upc?: string; ean?: string; gtin?: string } | null> {
  try {
    const searchQuery = encodeURIComponent(`${query} UPC barcode`);
    const url = `https://serpapi.com/search.json?q=${searchQuery}&api_key=${serpApiKey}&num=5`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`SerpAPI error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check organic results
    if (data.organic_results) {
      for (const result of data.organic_results) {
        const textToSearch = `${result.title || ''} ${result.snippet || ''}`;
        const barcodes = extractBarcodeFromText(textToSearch);
        if (barcodes.upc || barcodes.ean || barcodes.gtin) {
          return barcodes;
        }
      }
    }
    
    // Check shopping results if available
    if (data.shopping_results) {
      for (const result of data.shopping_results) {
        const textToSearch = `${result.title || ''} ${result.snippet || ''}`;
        const barcodes = extractBarcodeFromText(textToSearch);
        if (barcodes.upc || barcodes.ean || barcodes.gtin) {
          return barcodes;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return null;
  }
}

// Try UPCitemdb.com free lookup (limited but no API key needed)
async function searchUpcItemDb(query: string): Promise<{ upc?: string; ean?: string; gtin?: string } | null> {
  try {
    // UPCitemdb has a free search endpoint
    const searchUrl = `https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(query)}&type=product`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.log(`UPCitemdb error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        upc: item.upc || null,
        ean: item.ean || null,
        gtin: item.gtin || null,
      };
    }
    
    return null;
  } catch (error) {
    console.error('UPCitemdb search error:', error);
    return null;
  }
}

async function lookupBarcode(
  filament: FilamentIdentifiers,
  serpApiKey: string
): Promise<LookupResult> {
  const result: LookupResult = {
    filament_id: filament.id,
    product_title: filament.product_title,
    found: false,
  };
  
  // Build search query using available identifiers
  const searchTerms: string[] = [];
  
  if (filament.vendor) searchTerms.push(filament.vendor);
  if (filament.product_title) searchTerms.push(filament.product_title);
  
  // Add SKU/MPN for more specific search
  const identifier = filament.mpn || filament.variant_sku;
  if (identifier) {
    searchTerms.push(identifier);
  }
  
  if (searchTerms.length === 0) {
    result.error = 'No search terms available';
    return result;
  }
  
  const query = searchTerms.join(' ');
  console.log(`Searching for: ${query}`);
  
  // Try UPCitemdb first (free, no API key)
  let barcodes = await searchUpcItemDb(query);
  
  if (barcodes && (barcodes.upc || barcodes.ean || barcodes.gtin)) {
    result.found = true;
    result.upc = barcodes.upc;
    result.ean = barcodes.ean;
    result.gtin = barcodes.gtin;
    result.source = 'upcitemdb';
    console.log(`  Found via UPCitemdb: UPC=${barcodes.upc}, EAN=${barcodes.ean}, GTIN=${barcodes.gtin}`);
    return result;
  }
  
  // Try with just SKU/MPN if available
  if (identifier) {
    barcodes = await searchUpcItemDb(identifier);
    if (barcodes && (barcodes.upc || barcodes.ean || barcodes.gtin)) {
      result.found = true;
      result.upc = barcodes.upc;
      result.ean = barcodes.ean;
      result.gtin = barcodes.gtin;
      result.source = 'upcitemdb';
      console.log(`  Found via UPCitemdb (SKU): UPC=${barcodes.upc}, EAN=${barcodes.ean}, GTIN=${barcodes.gtin}`);
      return result;
    }
  }
  
  // Fall back to SerpAPI web search
  if (serpApiKey) {
    barcodes = await searchWithSerpApi(query, serpApiKey);
    if (barcodes && (barcodes.upc || barcodes.ean || barcodes.gtin)) {
      result.found = true;
      result.upc = barcodes.upc;
      result.ean = barcodes.ean;
      result.gtin = barcodes.gtin;
      result.source = 'serpapi';
      console.log(`  Found via SerpAPI: UPC=${barcodes.upc}, EAN=${barcodes.ean}, GTIN=${barcodes.gtin}`);
      return result;
    }
  }
  
  console.log(`  No barcodes found for: ${filament.product_title}`);
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serpApiKey = Deno.env.get('SERPAPI_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { filamentIds, vendor, limit = 10, forceUpdate = false } = await req.json();
    
    console.log(`Barcode lookup request: vendor=${vendor}, limit=${limit}, filamentIds=${filamentIds?.length || 0}`);
    
    // Build query for filaments that need barcode lookup
    let query = supabase
      .from('filaments')
      .select('id, product_title, vendor, variant_sku, mpn, upc, ean, gtin')
      .not('variant_sku', 'is', null); // Must have SKU to search
    
    if (filamentIds && filamentIds.length > 0) {
      query = query.in('id', filamentIds);
    } else if (vendor) {
      query = query.ilike('vendor', vendor);
    }
    
    // Only get filaments missing barcodes unless force update
    if (!forceUpdate) {
      query = query.or('upc.is.null,ean.is.null,gtin.is.null');
    }
    
    query = query.limit(limit);
    
    const { data: filaments, error: fetchError } = await query;
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No filaments need barcode lookup',
          results: [],
          stats: { processed: 0, found: 0, updated: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${filaments.length} filaments for barcode lookup`);
    
    const results: LookupResult[] = [];
    let found = 0;
    let updated = 0;
    
    for (const filament of filaments) {
      const result = await lookupBarcode(filament as FilamentIdentifiers, serpApiKey);
      results.push(result);
      
      if (result.found) {
        found++;
        
        // Update database with found barcodes
        const updates: { upc?: string; ean?: string; gtin?: string } = {};
        
        if (result.upc && (!filament.upc || forceUpdate)) {
          updates.upc = result.upc;
        }
        if (result.ean && (!filament.ean || forceUpdate)) {
          updates.ean = result.ean;
        }
        if (result.gtin && (!filament.gtin || forceUpdate)) {
          updates.gtin = result.gtin;
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(updates)
            .eq('id', filament.id);
          
          if (!updateError) {
            updated++;
            console.log(`  Updated ${filament.product_title}: ${JSON.stringify(updates)}`);
          } else {
            console.error(`  Update failed for ${filament.id}:`, updateError);
          }
        }
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Barcode lookup complete: processed=${filaments.length}, found=${found}, updated=${updated}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        results,
        stats: {
          processed: filaments.length,
          found,
          updated,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Barcode lookup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
