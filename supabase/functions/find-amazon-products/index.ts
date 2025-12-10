import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmazonResult {
  title: string;
  link: string;
  price?: string;
  thumbnail?: string;
}

interface RegionResults {
  region: string;
  results: AmazonResult[];
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Admin authorization check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await authClient.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { product_name, country_codes } = await req.json();
    
    if (!product_name || !country_codes || !Array.isArray(country_codes)) {
      return new Response(
        JSON.stringify({ error: 'Missing product_name or country_codes array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY');
    if (!SERPAPI_KEY) {
      return new Response(
        JSON.stringify({ error: 'SERPAPI_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map country codes to Amazon domains
    const amazonDomains: Record<string, string> = {
      'US': 'amazon.com',
      'UK': 'amazon.co.uk',
      'DE': 'amazon.de',
      'CA': 'amazon.ca',
      'FR': 'amazon.fr',
      'IT': 'amazon.it',
      'ES': 'amazon.es',
      'JP': 'amazon.co.jp',
      'AU': 'amazon.com.au',
    };

    const results: RegionResults[] = [];

    for (const code of country_codes) {
      const domain = amazonDomains[code.toUpperCase()];
      if (!domain) {
        results.push({
          region: code,
          results: [],
          error: `Unsupported region: ${code}`
        });
        continue;
      }

      try {
        const searchQuery = encodeURIComponent(product_name);
        const url = `https://serpapi.com/search.json?engine=amazon&amazon_domain=${domain}&k=${searchQuery}&api_key=${SERPAPI_KEY}`;
        
        console.log(`Searching Amazon ${domain} for: ${product_name}`);
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          console.error(`SerpApi error for ${code}:`, data.error);
          results.push({
            region: code,
            results: [],
            error: data.error
          });
          continue;
        }

        const organicResults = data.organic_results || [];
        const topResults: AmazonResult[] = organicResults.slice(0, 3).map((result: any) => ({
          title: result.title || 'No title',
          link: result.link || '',
          price: result.price?.raw || result.price_string || '',
          thumbnail: result.thumbnail || ''
        }));

        results.push({
          region: code,
          results: topResults
        });

        console.log(`Found ${topResults.length} results for ${code}`);
      } catch (error) {
        console.error(`Error searching ${code}:`, error);
        results.push({
          region: code,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in find-amazon-products:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
