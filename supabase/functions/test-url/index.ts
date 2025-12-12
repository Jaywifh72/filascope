import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Only allow HTTP(S) protocols
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

    const { url } = await req.json();

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

    // SSRF Protection: Block private/internal IP ranges
    if (isPrivateOrReservedHostname(parsedUrl.hostname)) {
      console.warn(`SSRF blocked: Attempted access to private/internal address: ${parsedUrl.hostname}`);
      return new Response(
        JSON.stringify({ ok: false, error: 'Private or internal addresses are not allowed', statusCode: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF Protection: Only allow HTTP(S) protocols
    if (!isAllowedProtocol(parsedUrl.protocol)) {
      console.warn(`SSRF blocked: Attempted use of disallowed protocol: ${parsedUrl.protocol}`);
      return new Response(
        JSON.stringify({ ok: false, error: 'Only HTTP and HTTPS protocols are allowed', statusCode: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Testing URL: ${url}`);

    // Make HEAD request first (faster), fallback to GET if HEAD fails
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual', // Don't follow redirects automatically
      });
    } catch (headError) {
      // If HEAD fails, try GET
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'manual',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      } catch (getError: any) {
        console.error(`Failed to fetch ${url}:`, getError.message);
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: getError.name === 'AbortError' ? 'Request timeout' : getError.message,
            statusCode: 0 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const statusCode = response.status;
    const isOk = statusCode >= 200 && statusCode < 300;
    const isRedirect = statusCode >= 300 && statusCode < 400;
    const location = response.headers.get('location');

    console.log(`URL ${url} returned status ${statusCode}`);

    return new Response(
      JSON.stringify({
        ok: isOk,
        statusCode,
        isRedirect,
        redirectLocation: location,
        error: isOk ? null : `HTTP ${statusCode}`,
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
