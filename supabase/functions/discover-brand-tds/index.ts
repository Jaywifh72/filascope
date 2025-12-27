import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TdsDiscoveryResult {
  filamentId: string;
  productTitle: string;
  productUrl: string | null;
  tdsUrl: string | null;
  source: string;
  success: boolean;
  error?: string;
}

// Common TDS URL patterns across manufacturers
const TDS_PATTERNS = [
  // Direct PDF links
  /href="([^"]+(?:tds|technical[-_]?data|datasheet|spec(?:ification)?[-_]?sheet)[^"]*\.pdf)"/gi,
  /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical|Datasheet|Specification|Spec\s*Sheet))/gi,
  // CDN-hosted PDFs
  /href="([^"]+cdn[^"]+\.pdf)"/gi,
  // Google Drive/Docs links
  /href="(https:\/\/drive\.google\.com\/[^"]+)"/gi,
  // Dropbox links
  /href="(https:\/\/(?:www\.)?dropbox\.com\/[^"]+\.pdf[^"]*)"/gi,
];

// Known TDS URL patterns by brand
const BRAND_TDS_PATTERNS: Record<string, RegExp[]> = {
  'azurefilm': [
    /href="([^"]+azurefilm[^"]+\.pdf)"/gi,
    /href="([^"]+TDS[^"]+\.pdf)"/gi,
  ],
  'sainsmart': [
    /href="([^"]+sainsmart[^"]+\.pdf)"/gi,
    /href="([^"]+datasheet[^"]+\.pdf)"/gi,
  ],
  'anycubic': [
    /href="([^"]+anycubic[^"]+\.pdf)"/gi,
    /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical|Download))/gi,
  ],
  'filaments-ca': [
    /href="([^"]+filaments\.ca[^"]+\.pdf)"/gi,
  ],
  'geeetech': [
    /href="([^"]+geeetech[^"]+\.pdf)"/gi,
  ],
  'kingroon': [
    /href="([^"]+kingroon[^"]+\.pdf)"/gi,
  ],
  'fusion-filaments': [
    /href="([^"]+fusion[^"]+\.pdf)"/gi,
  ],
  'recycling-fabrik': [
    /href="([^"]+recycling[^"]+\.pdf)"/gi,
    /href="([^"]+datenblatt[^"]+\.pdf)"/gi, // German for datasheet
  ],
  'iiidmax': [
    /href="([^"]+iiidmax[^"]+\.pdf)"/gi,
    /href="([^"]+3dmax[^"]+\.pdf)"/gi,
  ],
  'gst3d': [
    /href="([^"]+gst3d[^"]+\.pdf)"/gi,
  ],
  'recreus': [
    /href="([^"]+recreus[^"]+\.pdf)"/gi,
    /href="([^"]+filaflex[^"]+\.pdf)"/gi,
  ],
  'elegoo': [
    /href="([^"]+elegoo[^"]+\.pdf)"/gi,
    /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical|Datasheet|下载))/gi,
    /data-url="([^"]+\.pdf)"/gi,
  ],
  'push-plastic': [
    /href="([^"]+pushplastic[^"]+\.pdf)"/gi,
    /href="([^"]+\.pdf)"[^>]*>(?:[^<]*TDS)/gi,
  ],
  'creality': [
    /href="([^"]+creality[^"]+\.pdf)"/gi,
    /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical|Download))/gi,
  ],
  'ninjatek': [
    /href="([^"]+ninjatek[^"]+\.pdf)"/gi,
    /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical|Safety))/gi,
  ],
  'protopasta': [
    /href="([^"]+protopasta[^"]+\.pdf)"/gi,
    /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:Technical|Safety|Material))/gi,
  ],
  'eryone': [
    /href="([^"]+eryone[^"]+\.pdf)"/gi,
  ],
  'sovol': [
    /href="([^"]+sovol[^"]+\.pdf)"/gi,
  ],
  'sunlu': [
    /href="([^"]+sunlu[^"]+\.pdf)"/gi,
    /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:TDS|技术|下载))/gi,
  ],
};

// Extract TDS URL from HTML content
function extractTdsUrl(html: string, brandSlug: string, baseUrl: string): string | null {
  // First try brand-specific patterns
  const brandPatterns = BRAND_TDS_PATTERNS[brandSlug] || [];
  for (const pattern of brandPatterns) {
    const matches = html.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      let url = match[1];
      if (url && !url.startsWith('http')) {
        try {
          url = new URL(url, baseUrl).href;
        } catch {
          continue;
        }
      }
      if (url && isValidTdsUrl(url)) {
        return url;
      }
    }
  }

  // Then try generic patterns
  for (const pattern of TDS_PATTERNS) {
    const matches = html.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      let url = match[1];
      if (url && !url.startsWith('http')) {
        try {
          url = new URL(url, baseUrl).href;
        } catch {
          continue;
        }
      }
      if (url && isValidTdsUrl(url)) {
        return url;
      }
    }
  }

  // Look for JSON-LD structured data with document links
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(jsonContent);
        // Look for document URLs in various places
        const documentUrl = findDocumentInJsonLd(data);
        if (documentUrl) return documentUrl;
      } catch {}
    }
  }

  return null;
}

// Check if URL looks like a valid TDS PDF
function isValidTdsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  
  // Must be a PDF or document link
  if (!lower.includes('.pdf') && !lower.includes('drive.google') && !lower.includes('dropbox')) {
    return false;
  }
  
  // Exclude common non-TDS PDFs
  const excludePatterns = [
    'invoice', 'order', 'receipt', 'manual', 'guide', 'instruction',
    'warranty', 'terms', 'privacy', 'cookie', 'return'
  ];
  
  for (const exclude of excludePatterns) {
    if (lower.includes(exclude)) {
      return false;
    }
  }
  
  return true;
}

// Find document URL in JSON-LD data
function findDocumentInJsonLd(data: any): string | null {
  if (!data) return null;
  
  if (typeof data === 'string' && data.includes('.pdf')) {
    return data;
  }
  
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findDocumentInJsonLd(item);
      if (result) return result;
    }
  }
  
  if (typeof data === 'object') {
    // Check common document fields
    for (const key of ['document', 'datasheet', 'technicalDocument', 'specification', 'pdf', 'url']) {
      if (data[key] && typeof data[key] === 'string' && data[key].includes('.pdf')) {
        return data[key];
      }
    }
    // Recurse into nested objects
    for (const value of Object.values(data)) {
      const result = findDocumentInJsonLd(value);
      if (result) return result;
    }
  }
  
  return null;
}

// Validate TDS URL is accessible
async function validateTdsUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { brandSlug, limit = 50, dryRun = true, validateUrls = false } = await req.json();

    if (!brandSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'brandSlug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[discover-brand-tds] Starting TDS discovery for ${brandSlug}, limit: ${limit}, dryRun: ${dryRun}`);

    // Get brand configuration
    const { data: brand, error: brandError } = await supabase
      .from('automated_brands')
      .select('brand_name, base_url')
      .eq('brand_slug', brandSlug)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ success: false, error: `Brand not found: ${brandSlug}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get filaments missing TDS URLs
    const { data: filaments, error: filamentsError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url')
      .ilike('vendor', brand.brand_name)
      .is('tds_url', null)
      .not('product_url', 'is', null)
      .limit(limit);

    if (filamentsError) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch filaments: ${filamentsError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[discover-brand-tds] Found ${filaments?.length || 0} filaments missing TDS`);

    const results: TdsDiscoveryResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const filament of filaments || []) {
      const result: TdsDiscoveryResult = {
        filamentId: filament.id,
        productTitle: filament.product_title,
        productUrl: filament.product_url,
        tdsUrl: null,
        source: 'none',
        success: false,
      };

      if (!filament.product_url) {
        result.error = 'No product URL';
        results.push(result);
        failCount++;
        continue;
      }

      try {
        // Scrape the product page
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: filament.product_url,
            formats: ['html'],
            onlyMainContent: false, // Get full page to find PDF links
          }),
        });

        if (!scrapeResponse.ok) {
          result.error = `Scrape failed: ${scrapeResponse.status}`;
          results.push(result);
          failCount++;
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || '';

        // Extract TDS URL
        const tdsUrl = extractTdsUrl(html, brandSlug, brand.base_url);

        if (tdsUrl) {
          result.tdsUrl = tdsUrl;
          result.source = 'product_page';
          
          // Optionally validate the URL
          if (validateUrls) {
            const isValid = await validateTdsUrl(tdsUrl);
            if (!isValid) {
              result.error = 'TDS URL validation failed';
              result.tdsUrl = null;
            }
          }
        }

        if (result.tdsUrl) {
          result.success = true;
          successCount++;

          // Update database if not dry run
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('filaments')
              .update({ tds_url: result.tdsUrl })
              .eq('id', filament.id);

            if (updateError) {
              console.error(`[discover-brand-tds] Failed to update filament ${filament.id}:`, updateError);
            }
          }
        } else {
          result.error = result.error || 'No TDS URL found';
          failCount++;
        }

        results.push(result);

        // Rate limiting
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        result.error = err instanceof Error ? err.message : 'Unknown error';
        results.push(result);
        failCount++;
      }
    }

    console.log(`[discover-brand-tds] Complete: ${successCount} found, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        brandSlug,
        totalProcessed: results.length,
        tdsFound: successCount,
        tdsFailed: failCount,
        dryRun,
        results: results.slice(0, 100), // Limit response size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[discover-brand-tds] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
