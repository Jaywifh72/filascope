import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchRegionalStore, detectRegionFromUrl, type FetchMethod } from '../_shared/regional-fetch.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SSRF Protection: Check if hostname resolves to private/internal IP ranges
function isPrivateOrReservedHostname(hostname: string): boolean {
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^224\./,
    /^240\./,
    /^255\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
    /^fd[0-9a-f]{2}:/i,
    /\.local$/i,
    /\.internal$/i,
    /\.localhost$/i,
  ];
  return privatePatterns.some(pattern => pattern.test(hostname));
}

function isAllowedProtocol(protocol: string): boolean {
  return protocol === 'http:' || protocol === 'https:';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Admin authorization check
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

    const { url, region } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ ok: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid URL format', statusCode: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF Protection
    if (isPrivateOrReservedHostname(parsedUrl.hostname)) {
      console.warn(`SSRF blocked: ${parsedUrl.hostname}`);
      return new Response(
        JSON.stringify({ ok: false, error: 'Private or internal addresses are not allowed', statusCode: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAllowedProtocol(parsedUrl.protocol)) {
      console.warn(`SSRF blocked: protocol ${parsedUrl.protocol}`);
      return new Response(
        JSON.stringify({ ok: false, error: 'Only HTTP and HTTPS protocols are allowed', statusCode: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine target region from explicit param, URL subdomain, or default US
    const targetRegion = region || detectRegionFromUrl(url) || 'US';
    console.log(`Testing URL: ${url} (region: ${targetRegion})`);

    // Use the shared regional fetch with geo-redirect bypass
    const result = await fetchRegionalStore(url, targetRegion, {
      method: 'HEAD',
      timeoutMs: 10000,
    });

    const statusCode = result.statusCode ?? 0;
    const isOk = statusCode >= 200 && statusCode < 300;
    const isRedirect = statusCode >= 300 && statusCode < 400;
    const isGeoRedirected = result.method === 'redirected' && !!result.warning;

    console.log(`URL ${url} → status ${statusCode}, method: ${result.method}${isGeoRedirected ? ' (geo-redirected)' : ''}`);

    return new Response(
      JSON.stringify({
        ok: isOk,
        statusCode,
        isRedirect: isRedirect && !isOk,
        redirectLocation: result.redirectedTo || null,
        error: isOk ? null : `HTTP ${statusCode}`,
        fetchMethod: result.method,
        isGeoRedirected,
        warning: result.warning || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error testing URL:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message, statusCode: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
