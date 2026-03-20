import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  regionCode?: string;     // Specific region or all
  brandSlug?: string;      // Specific brand or all
  limit?: number;
  markBroken?: boolean;    // Update is_verified status on failures
}

interface ValidationResult {
  id: string;
  productId: string;
  regionCode: string;
  storeUrl: string;
  status: 'valid' | 'redirect' | '404' | 'error';
  httpStatus?: number;
  redirectUrl?: string;
  error?: string;
  suggestedUrl?: string;
}

// Common slug variations to try for 404s
function generateSlugVariations(slug: string): string[] {
  const variations: string[] = [];
  
  // Original
  variations.push(slug);
  
  // Remove common suffixes
  variations.push(slug.replace(/-3d-printing-filament(-1kg)?$/, ''));
  variations.push(slug.replace(/-1kg$/, ''));
  variations.push(slug.replace(/-filament$/, ''));
  
  // Add common suffixes
  variations.push(`${slug}-1kg`);
  variations.push(`${slug}-filament`);
  variations.push(`${slug}-3d-printing-filament-1kg`);
  
  // Handle Creality-specific patterns
  if (slug.includes('hyper-series-')) {
    variations.push(slug.replace('hyper-series-', 'hyper-'));
  }
  if (slug.includes('hyper-') && !slug.includes('hyper-series-')) {
    variations.push(slug.replace('hyper-', 'hyper-series-'));
  }
  
  // Dedupe
  return [...new Set(variations)];
}

// Extract slug from URL
function extractSlug(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/products\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Rebuild URL with new slug
function rebuildUrl(originalUrl: string, newSlug: string): string {
  try {
    const urlObj = new URL(originalUrl);
    urlObj.pathname = `/products/${newSlug}`;
    return urlObj.toString();
  } catch {
    return originalUrl;
  }
}

// Validate a single URL with retry logic
async function validateUrl(url: string): Promise<{
  valid: boolean;
  status: number;
  redirectUrl?: string;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FilaScope/1.0; +https://filascope.com)',
      },
      redirect: 'manual',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return { valid: true, status: response.status };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      
      // Check if redirect is to a valid product page
      if (location) {
        // Bad redirects: homepage, collections, search
        const isBadRedirect = 
          location.endsWith('/') ||
          location.includes('/collections') ||
          location.includes('/search') ||
          !location.includes('/products/');
        
        return {
          valid: !isBadRedirect,
          status: response.status,
          redirectUrl: location,
        };
      }
    }

    return { valid: false, status: response.status };
  } catch (error) {
    return {
      valid: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Try to find a working URL variation
async function findWorkingUrl(
  baseUrl: string,
  originalSlug: string
): Promise<{ url: string; valid: boolean } | null> {
  const variations = generateSlugVariations(originalSlug);
  
  for (const variation of variations) {
    if (variation === originalSlug) continue; // Skip original, already failed
    
    const newUrl = rebuildUrl(baseUrl, variation);
    const result = await validateUrl(newUrl);
    
    if (result.valid) {
      return { url: newUrl, valid: true };
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: ValidationRequest = await req.json();
    const {
      regionCode,
      brandSlug,
      limit = 100,
      markBroken = true,
    } = body;

    const startTime = Date.now();
    console.log(`[validate-regional-urls] Starting validation`, { regionCode, brandSlug, limit });

    // Fetch regional URLs to validate
    let query = supabase
      .from('product_regional_urls')
      .select(`
        id,
        product_id,
        product_type,
        region_code,
        store_url,
        currency_code,
        is_verified,
        last_validated_at
      `)
      .limit(limit);

    if (regionCode) {
      query = query.eq('region_code', regionCode);
    }

    // Prioritize URLs that haven't been validated recently
    query = query.or('last_validated_at.is.null,last_validated_at.lt.now() - interval \'7 days\'');

    const { data: urls, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    if (!urls || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No URLs to validate', stats: { total: 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[validate-regional-urls] Found ${urls.length} URLs to validate`);

    const results: ValidationResult[] = [];
    const stats = {
      total: urls.length,
      valid: 0,
      redirect: 0,
      notFound: 0,
      error: 0,
      repaired: 0,
    };

    for (const urlRecord of urls) {
      const validation = await validateUrl(urlRecord.store_url);
      
      const result: ValidationResult = {
        id: urlRecord.id,
        productId: urlRecord.product_id,
        regionCode: urlRecord.region_code,
        storeUrl: urlRecord.store_url,
        status: 'valid',
        httpStatus: validation.status,
      };

      if (validation.valid) {
        result.status = 'valid';
        stats.valid++;
      } else if (validation.status === 404) {
        result.status = '404';
        stats.notFound++;
        
        // Try to find a working URL variation
        const slug = extractSlug(urlRecord.store_url);
        if (slug) {
          const repair = await findWorkingUrl(urlRecord.store_url, slug);
          if (repair) {
            result.suggestedUrl = repair.url;
            stats.repaired++;
          }
        }
      } else if (validation.status >= 300 && validation.status < 400) {
        result.status = 'redirect';
        result.redirectUrl = validation.redirectUrl;
        stats.redirect++;
        
        // If redirect is to a valid product page, suggest it
        if (validation.redirectUrl && validation.redirectUrl.includes('/products/')) {
          result.suggestedUrl = validation.redirectUrl;
        }
      } else {
        result.status = 'error';
        result.error = validation.error;
        stats.error++;
      }

      results.push(result);

      // Update the record in database
      if (markBroken) {
        const updateData: Record<string, unknown> = {
          last_validated_at: new Date().toISOString(),
          is_verified: result.status === 'valid',
        };

        // Store suggested URL if found
        if (result.suggestedUrl) {
          updateData.suggested_url = result.suggestedUrl;
        }

        await supabase
          .from('product_regional_urls')
          .update(updateData)
          .eq('id', urlRecord.id);
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 300));
    }

    const duration = Date.now() - startTime;

    // Log validation run
    await supabase.from('admin_activity_log').insert({
      action_type: 'validate_regional_urls',
      entity_type: 'product_regional_urls',
      details: {
        regionCode: regionCode || 'all',
        brandSlug: brandSlug || 'all',
        stats,
        duration_ms: duration,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        brokenUrls: results.filter(r => r.status !== 'valid'),
        sampleValid: results.filter(r => r.status === 'valid').slice(0, 5),
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[validate-regional-urls] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
