import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateRegionalUrl, type FetchMethod } from "../_shared/regional-fetch.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UrlValidationResult {
  url: string;
  status: 'valid' | 'invalid' | 'redirect' | 'geo_restricted' | 'unknown';
  statusCode: number | null;
  redirectUrl: string | null;
  lastChecked: string;
  fetchMethod?: FetchMethod;
  isGeoRedirected?: boolean;
}

async function validateUrl(url: string, region?: string): Promise<UrlValidationResult> {
  const result = await validateRegionalUrl(url, region);
  
  return {
    url,
    status: result.status,
    statusCode: result.statusCode,
    redirectUrl: result.redirectUrl,
    lastChecked: result.lastChecked,
    fetchMethod: result.method,
    isGeoRedirected: result.isGeoRedirected,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { url, urls, region, forceRecheck = false } = await req.json();
    
    // Handle single URL
    if (url) {
      // Check cache first (if not forcing recheck)
      if (!forceRecheck) {
        const { data: cached } = await supabase
          .from('url_validation_cache')
          .select('*')
          .eq('url', url)
          .single();
        
        // Return cached result if less than 24 hours old
        if (cached) {
          const lastChecked = new Date(cached.last_checked);
          const hoursAgo = (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60);
          
          if (hoursAgo < 24) {
            return new Response(JSON.stringify({
              ...cached,
              fromCache: true
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      }
      
      // Validate the URL with region-aware geo-bypass
      const result = await validateUrl(url, region);
      
      // Upsert to cache
      const { error: upsertError } = await supabase
        .from('url_validation_cache')
        .upsert({
          url: result.url,
          status: result.status,
          status_code: result.statusCode,
          redirect_url: result.redirectUrl,
          last_checked: result.lastChecked,
          check_count: 1,
          consecutive_failures: result.status === 'invalid' ? 1 : 0
        }, {
          onConflict: 'url'
        });
      
      if (upsertError) {
        console.error('Error upserting to cache:', upsertError);
      }
      
      return new Response(JSON.stringify({
        ...result,
        fromCache: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Handle batch URLs (each entry can be a string or { url, region })
    if (urls && Array.isArray(urls)) {
      const results: UrlValidationResult[] = [];
      
      // Process in batches of 5 to avoid overwhelming
      for (let i = 0; i < urls.length; i += 5) {
        const batch = urls.slice(i, i + 5);
        const batchResults = await Promise.all(
          batch.map((entry: string | { url: string; region?: string }) => {
            const entryUrl = typeof entry === 'string' ? entry : entry.url;
            const entryRegion = typeof entry === 'string' ? region : (entry.region || region);
            return validateUrl(entryUrl, entryRegion);
          })
        );
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + 5 < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Upsert all results to cache
      const upsertData = results.map(r => ({
        url: r.url,
        status: r.status,
        status_code: r.statusCode,
        redirect_url: r.redirectUrl,
        last_checked: r.lastChecked,
        check_count: 1,
        consecutive_failures: r.status === 'invalid' ? 1 : 0
      }));
      
      const { error: upsertError } = await supabase
        .from('url_validation_cache')
        .upsert(upsertData, { onConflict: 'url' });
      
      if (upsertError) {
        console.error('Error upserting batch to cache:', upsertError);
      }
      
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Missing url or urls parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in validate-url function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
