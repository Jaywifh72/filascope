import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 3D-Fuel TDS URLs are not directly accessible via static patterns
// We need to scrape each product page to find the TDS PDF link
// The TDS PDFs are typically hosted on their CDN with patterns like:
// https://cdn.shopify.com/s/files/1/0027/5339/6848/files/...

async function findTdsUrlOnPage(productUrl: string, firecrawlKey: string): Promise<string | null> {
  try {
    console.log(`Scraping ${productUrl} for TDS link...`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['html'],
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.log(`Firecrawl error for ${productUrl}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const html = data?.data?.html || '';
    
    // Look for PDF links that match TDS patterns
    // Pattern 1: Direct PDF links to cdn.shopify.com with TDS in filename
    const tdsPatterns = [
      /https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\s]+TDS[^"'\s]*\.pdf/gi,
      /https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\s]+technical[^"'\s]*data[^"'\s]*\.pdf/gi,
      /https:\/\/www\.dropbox\.com\/[^"'\s]+TDS[^"'\s]*\.pdf[^"'\s]*/gi,
    ];
    
    for (const pattern of tdsPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out SDS (safety data sheets)
        const tdsMatch = matches.find((m: string) => 
          !m.toLowerCase().includes('sds') && 
          !m.toLowerCase().includes('safety')
        );
        if (tdsMatch) {
          // Clean up the URL (remove trailing quotes, etc.)
          const cleanUrl = tdsMatch.replace(/['">\s].*/g, '').replace(/&amp;/g, '&');
          console.log(`Found TDS URL: ${cleanUrl}`);
          return cleanUrl;
        }
      }
    }
    
    console.log(`No TDS link found on ${productUrl}`);
    return null;
  } catch (error) {
    console.error(`Error scraping ${productUrl}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body for optional limit
    let limit = 10; // Default to 10 to avoid timeout
    try {
      const body = await req.json();
      if (body.limit) limit = body.limit;
    } catch {
      // No body, use defaults
    }

    // Get 3D-Fuel filaments missing TDS URLs that have product URLs
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url')
      .eq('vendor', '3D-Fuel')
      .is('tds_url', null)
      .not('product_url', 'is', null)
      .order('product_title')
      .limit(limit);

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch filaments', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filaments?.length || 0} 3D-Fuel filaments to process (limit: ${limit})`);

    const results = {
      updated: 0,
      skipped: 0,
      failed: 0,
      details: [] as { title: string; status: string; tds_url?: string }[]
    };

    for (const filament of filaments || []) {
      if (!filament.product_url) {
        results.skipped++;
        results.details.push({ title: filament.product_title, status: 'no_product_url' });
        continue;
      }

      // Rate limit to avoid overwhelming the API
      await new Promise(r => setTimeout(r, 1500));

      const tdsUrl = await findTdsUrlOnPage(filament.product_url, firecrawlKey);
      
      if (!tdsUrl) {
        console.log(`[SKIP] No TDS found for: ${filament.product_title}`);
        results.skipped++;
        results.details.push({ title: filament.product_title, status: 'no_tds_found' });
        continue;
      }

      // Update filament with TDS URL
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ tds_url: tdsUrl })
        .eq('id', filament.id);

      if (updateError) {
        console.error(`[ERROR] Failed to update ${filament.product_title}:`, updateError);
        results.failed++;
        results.details.push({ title: filament.product_title, status: 'update_failed' });
      } else {
        console.log(`[UPDATE] ${filament.product_title} -> ${tdsUrl}`);
        results.updated++;
        results.details.push({ title: filament.product_title, status: 'updated', tds_url: tdsUrl });
      }
    }

    console.log(`Completed: ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${results.updated} filaments, skipped ${results.skipped}, failed ${results.failed}`,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-3dfuel-tds:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
