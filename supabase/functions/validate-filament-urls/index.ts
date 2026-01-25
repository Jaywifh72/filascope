import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate URL and check if it returns a valid product page
async function validateProductUrl(url: string): Promise<{
  status: 'valid' | 'invalid' | 'redirect' | 'not_found' | 'timeout';
  finalUrl?: string;
  productFound: boolean;
  message: string;
  /** Suggested replacement URL if redirect points to valid product page */
  suggestedUrl?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    clearTimeout(timeoutId);

    const finalUrl = response.url;
    const wasRedirected = finalUrl !== url;

    if (response.status === 404) {
      return {
        status: 'not_found',
        finalUrl,
        productFound: false,
        message: 'Product page not found (404)',
      };
    }

    if (!response.ok) {
      return {
        status: 'invalid',
        finalUrl,
        productFound: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Check if redirected to homepage or collection page instead of product
    if (wasRedirected) {
      const finalUrlLower = finalUrl.toLowerCase();
      const isHomepage = finalUrlLower.endsWith('/') || finalUrlLower.match(/\.(com|net|org|co|io)$/);
      const isCollection = finalUrlLower.includes('/collections/') && !finalUrlLower.includes('/products/');
      
      if (isHomepage || isCollection) {
        return {
          status: 'redirect',
          finalUrl,
          productFound: false,
          message: `Redirected to ${isHomepage ? 'homepage' : 'collection'} instead of product page`,
          suggestedUrl: undefined, // No suggestion for bad redirects
        };
      }
    }
    
    // If redirected to a valid product page, suggest it as replacement
    const isValidProductRedirect = wasRedirected && 
      (finalUrl.includes('/products/') || finalUrl.includes('/product/')) &&
      !finalUrl.includes('/collections/');
    const suggestedUrl = isValidProductRedirect ? finalUrl : undefined;

    // Try to verify product exists in page content
    const text = await response.text();
    const productIndicators = [
      'add-to-cart',
      'AddToCart',
      'product-price',
      'product__price',
      'shopify-section-product',
      '"@type":"Product"',
      'itemprop="price"',
      'data-product-id',
    ];

    const hasProductContent = productIndicators.some(indicator => text.includes(indicator));

    if (!hasProductContent) {
      // Check if it looks like a 404 or "not found" page
      const notFoundIndicators = ['page not found', '404', 'product not found', 'no longer available', 'discontinued'];
      const isNotFoundPage = notFoundIndicators.some(indicator => text.toLowerCase().includes(indicator));

      if (isNotFoundPage) {
        return {
          status: 'not_found',
          finalUrl,
          productFound: false,
          message: 'Page indicates product not found or discontinued',
        };
      }
    }

    return {
      status: wasRedirected ? 'redirect' : 'valid',
      finalUrl,
      productFound: hasProductContent,
      message: hasProductContent ? 'Valid product page' : 'Page found but product content not detected',
      suggestedUrl,
    };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'timeout',
        productFound: false,
        message: 'Request timed out after 10 seconds',
      };
    }
    return {
      status: 'invalid',
      productFound: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { filamentId, brand, limit = 50, onlyInvalid = false, forceRevalidate = false } = await req.json();

    console.log('Validation params:', { filamentId, brand, limit, onlyInvalid, forceRevalidate });

    // Build query
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor, url_validation_status, url_validated_at');

    if (filamentId) {
      query = query.eq('id', filamentId);
    } else if (brand) {
      query = query.ilike('vendor', brand);
    }

    // Filter to filaments with product URLs
    query = query.not('product_url', 'is', null);

    // Filter based on validation status
    if (onlyInvalid) {
      query = query.in('url_validation_status', ['invalid', 'not_found', 'redirect']);
    } else if (!forceRevalidate) {
      // Only validate URLs not recently checked (7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.or(`url_validated_at.is.null,url_validated_at.lt.${sevenDaysAgo}`);
    }

    query = query.order('url_validated_at', { ascending: true, nullsFirst: true }).limit(limit);

    const { data: filaments, error } = await query;

    if (error) throw error;

    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No URLs to validate', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating ${filaments.length} URLs`);

    const results: {
      id: string;
      vendor: string;
      product_title: string;
      url: string;
      status: string;
      productFound: boolean;
      message: string;
      finalUrl?: string;
      suggestedUrl?: string;
    }[] = [];

    let validCount = 0;
    let invalidCount = 0;
    let notFoundCount = 0;
    let redirectCount = 0;

    for (const filament of filaments) {
      if (!filament.product_url) continue;

      console.log(`Validating: ${filament.product_title}`);

      const validation = await validateProductUrl(filament.product_url);

      // Update database - also store suggested URL in url_validation_results if available
      const { error: updateError } = await supabase
        .from('filaments')
        .update({
          url_validation_status: validation.status,
          url_validated_at: new Date().toISOString(),
        })
        .eq('id', filament.id);

      if (updateError) {
        console.error('Update error:', updateError);
      }
      
      // Upsert to url_validation_results with suggested URL
      if (validation.suggestedUrl) {
        await supabase
          .from('url_validation_results')
          .upsert({
            entity_type: 'filament',
            entity_id: filament.id,
            url_field: 'product_url',
            url: filament.product_url,
            status: validation.status,
            status_code: validation.status === 'valid' ? 200 : validation.status === 'not_found' ? 404 : null,
            redirect_url: validation.suggestedUrl,
            checked_at: new Date().toISOString(),
          }, {
            onConflict: 'entity_type,entity_id,url_field',
          });
      }

      results.push({
        id: filament.id,
        vendor: filament.vendor || 'Unknown',
        product_title: filament.product_title,
        url: filament.product_url,
        status: validation.status,
        productFound: validation.productFound,
        message: validation.message,
        finalUrl: validation.finalUrl,
        suggestedUrl: validation.suggestedUrl,
      });

      // Count results
      switch (validation.status) {
        case 'valid': validCount++; break;
        case 'invalid': invalidCount++; break;
        case 'not_found': notFoundCount++; break;
        case 'redirect': redirectCount++; break;
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Validated ${results.length} URLs. Valid: ${validCount}, Invalid: ${invalidCount}, Not Found: ${notFoundCount}, Redirects: ${redirectCount}`,
        processed: results.length,
        summary: {
          valid: validCount,
          invalid: invalidCount,
          notFound: notFoundCount,
          redirect: redirectCount,
        },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});