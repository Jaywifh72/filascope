const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
