import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UrlValidationResult {
  url: string;
  status: 'valid' | 'invalid' | 'redirect' | 'unknown';
  statusCode: number | null;
  redirectUrl: string | null;
  lastChecked: string;
}

async function validateUrl(url: string): Promise<UrlValidationResult> {
  const now = new Date().toISOString();
  
  try {
    // Use HEAD request to check URL without downloading content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, { 
      method: 'HEAD', 
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'FilaScope URL Validator/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 200 || response.status === 204) {
      return { url, status: 'valid', statusCode: response.status, redirectUrl: null, lastChecked: now };
    } else if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location');
      return { 
        url, 
        status: 'redirect', 
        statusCode: response.status,
        redirectUrl,
        lastChecked: now
      };
    } else if (response.status === 404 || response.status === 410) {
      return { url, status: 'invalid', statusCode: response.status, redirectUrl: null, lastChecked: now };
    }
    
    return { url, status: 'unknown', statusCode: response.status, redirectUrl: null, lastChecked: now };
  } catch (error) {
    console.error(`Error validating URL ${url}:`, error);
    return { url, status: 'unknown', statusCode: null, redirectUrl: null, lastChecked: now };
  }
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

    const { url, urls, forceRecheck = false } = await req.json();
    
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
      
      // Validate the URL
      const result = await validateUrl(url);
      
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
    
    // Handle batch URLs
    if (urls && Array.isArray(urls)) {
      const results: UrlValidationResult[] = [];
      
      // Process in batches of 5 to avoid overwhelming
      for (let i = 0; i < urls.length; i += 5) {
        const batch = urls.slice(i, i + 5);
        const batchResults = await Promise.all(batch.map(validateUrl));
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
