const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Failure {
  product: string;
  region: string;
  currency: string;
  url: string;
  error: string;
  brand: string;
  extractedPrice?: number;
  source?: string;
  statusCode?: number;
  latencyMs?: number;
  storeKey?: string;
}

interface FailureDetail {
  product: string;
  region: string;
  url: string;
  error: string;
  statusCode?: number;
  latencyMs?: number;
  brand: string;
}

interface Diagnosis {
  pattern: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  diagnosis: string;
  suggestedFix: string;
  suggestedPrompt: string;
  affectedProducts: string[];
  isTransient: boolean;
  contextualPromptParts?: {
    errorPattern: string;
    edgeFunctionName: string;
    failureDetails: FailureDetail[];
  };
}

function classifyError(error: string): {
  pattern: string;
  severity: 'high' | 'medium' | 'low';
  diagnosis: string;
  suggestedFix: string;
  suggestedPrompt: string;
  isTransient: boolean;
} {
  const e = error.toLowerCase();

  if (e.includes('check constraint') && e.includes('price')) {
    return {
      pattern: 'Price constraint violation',
      severity: 'high',
      diagnosis: 'Price constraint violation — the extracted price exceeds the database limit. Likely a multi-currency issue where JPY/other high-denomination prices exceed the USD-designed constraint.',
      suggestedFix: 'Update the price check constraint to support multi-currency values (raise limit from 10,000 to 100,000).',
      suggestedPrompt: 'Create a new migration to update the chk_price_history_price_positive constraint to allow prices up to 100,000 to support JPY and other high-denomination currencies. Also update the chk_filaments_price_positive and chk_filaments_compare_price_positive constraints similarly.',
      isTransient: false,
    };
  }

  if (e.includes('firecrawl network error') || e.includes('tcp con') || e.includes('error sending request') || e.includes('connection reset')) {
    return {
      pattern: 'Firecrawl network/connection error',
      severity: 'medium',
      diagnosis: 'TCP connection to Firecrawl failed — likely a transient network issue between the edge function and Firecrawl servers.',
      suggestedFix: 'Retry the sync. These are transient network errors that resolve on their own.',
      suggestedPrompt: 'Some price syncs failed due to transient TCP connection errors to the Firecrawl API. Please retry the affected products.',
      isTransient: true,
    };
  }

  if (e.includes('firecrawl error: 500') || e.includes('firecrawl error: 502') || e.includes('firecrawl error: 503')) {
    return {
      pattern: 'Firecrawl server error',
      severity: 'medium',
      diagnosis: 'Firecrawl service returned a server error. This is typically transient.',
      suggestedFix: 'Retry the sync for these products. If persistent, check if the product URL is valid by visiting it manually.',
      suggestedPrompt: 'The Firecrawl scraping service returned 5xx errors for some products. Please retry the affected syncs. If the issue persists, investigate whether these product URLs are still valid.',
      isTransient: true,
    };
  }

  if (e.includes('firecrawl error: 402')) {
    return {
      pattern: 'Firecrawl credits exhausted',
      severity: 'high',
      diagnosis: 'Firecrawl API credits exhausted.',
      suggestedFix: 'Check your Firecrawl billing and add credits.',
      suggestedPrompt: 'The Firecrawl API returned 402 (payment required). Check the Firecrawl account billing status and add credits to continue price scraping.',
      isTransient: false,
    };
  }

  if (e.includes('product_page_not_found') || e.includes('product page not found')) {
    return {
      pattern: 'Product page not found (404)',
      severity: 'medium',
      diagnosis: 'The product page returned a 404 or soft-404. The product may have been discontinued, renamed, or the URL slug changed.',
      suggestedFix: 'Check if the product still exists on the store. If the URL changed, update it in the database. If discontinued, mark the filament accordingly.',
      suggestedPrompt: 'Some product URLs are returning 404. Check the affected URLs manually — the products may have been discontinued or their slugs changed. Update or remove broken URLs from the filaments table.',
      isTransient: false,
    };
  }

  if (e.includes('could not extract price')) {
    return {
      pattern: 'Price extraction failed',
      severity: 'medium',
      diagnosis: 'The page was fetched but no price could be found in the expected format.',
      suggestedFix: 'Check if the product exists on this regional store. The brand\'s price extraction patterns may need updating for this currency/language.',
      suggestedPrompt: 'Price extraction failed for some products. Review the get-current-price edge function\'s extraction logic for these brands/regions. The page HTML structure may have changed or the product may not exist in this regional store.',
      isTransient: false,
    };
  }

  if (e.includes('rate limited') || e.includes('rate limit')) {
    return {
      pattern: 'Rate limited',
      severity: 'low',
      diagnosis: 'Too many requests in quick succession.',
      suggestedFix: 'Wait 1 minute and retry.',
      suggestedPrompt: 'Rate limiting was encountered during price sync. Consider increasing the delay between batch requests or reducing the batch size in the sync logic.',
      isTransient: true,
    };
  }

  if (e.includes('no product url')) {
    return {
      pattern: 'No product URL',
      severity: 'medium',
      diagnosis: 'No URL configured for this region.',
      suggestedFix: 'Run "Populate URLs" to derive regional URLs from the US URL.',
      suggestedPrompt: 'Some products are missing regional URLs. Use the "Populate URLs" feature on the Pricing Data page to auto-derive regional store URLs from existing US URLs.',
      isTransient: false,
    };
  }

  if (e.includes('unauthorized') || e.includes('admin role')) {
    return {
      pattern: 'Authentication issue',
      severity: 'high',
      diagnosis: 'Authentication issue — your session may have expired.',
      suggestedFix: 'Sign out and sign back in to refresh your admin session.',
      suggestedPrompt: 'Admin authentication errors are occurring during price sync. Check that the user_roles table has the correct admin role for the current user, and that the update_filament_price_after_refresh RPC properly checks admin permissions.',
      isTransient: false,
    };
  }

  if (e.includes('timeout')) {
    return {
      pattern: 'Request timeout',
      severity: 'medium',
      diagnosis: 'Request timed out — the target site may have been slow.',
      suggestedFix: 'Retry — the target site may have been temporarily slow.',
      suggestedPrompt: 'Some price sync requests timed out. This is usually transient. Retry the affected products. If persistent for specific brands, consider increasing the timeout in the get-current-price edge function.',
      isTransient: true,
    };
  }

  // === Link Test Errors ===
  if (e.includes('[link_test]') && (e.includes('404') || e.includes('not found'))) {
    return {
      pattern: 'Broken link (404)',
      severity: 'high',
      diagnosis: 'The product URL returned a 404 error during link testing. The page may have been removed, renamed, or the URL slug changed.',
      suggestedFix: 'Check if the product still exists on the store. If renamed, update the URL in the database. If discontinued, mark the store entry as inactive.',
      suggestedPrompt: 'Link testing found 404 broken links for some products. Check the affected URLs — the products may have been discontinued or their URL slugs changed on the store. Update or remove the affected store_url entries in the database.',
      isTransient: false,
    };
  }

  if (e.includes('[link_test]') && e.includes('timeout')) {
    return {
      pattern: 'Link timeout',
      severity: 'medium',
      diagnosis: 'The product URL timed out during link testing. The store may be temporarily slow or unreachable.',
      suggestedFix: 'Retry the test. If persistent, the store may be blocking automated requests or experiencing downtime.',
      suggestedPrompt: 'Some product links timed out during testing. This is usually transient. Retry the test for the affected products. If the timeouts persist for a specific store/region, investigate whether the store is blocking requests or if the URL pattern needs updating.',
      isTransient: true,
    };
  }

  if (e.includes('[link_test]') && (e.includes('301') || e.includes('302') || e.includes('redirect'))) {
    return {
      pattern: 'Link redirect',
      severity: 'medium',
      diagnosis: 'The product URL is redirecting to a different page. This may indicate a URL change, geo-redirect, or the product was moved.',
      suggestedFix: 'Check the redirect destination. If it\'s a geo-redirect, this may be expected. If the product moved, update the URL.',
      suggestedPrompt: 'Link testing found redirects for some product URLs. Check if these are expected geo-redirects (e.g., US URL redirecting to regional store) or if the product URL has changed. Update the store URLs for any that have permanently moved.',
      isTransient: false,
    };
  }

  if (e.includes('[link_test]') && (e.includes('geo') || e.includes('geo_restricted'))) {
    return {
      pattern: 'Geo-restricted link',
      severity: 'low',
      diagnosis: 'The product URL is geo-restricted and redirects based on the requester\'s location. This is expected behavior for regional stores.',
      suggestedFix: 'This is usually expected. Verify the regional URL mappings are correct for each store.',
      suggestedPrompt: 'Some product links are geo-restricted (redirecting based on location). This is usually expected behavior for brands with regional stores (e.g., Bambu Lab). Verify the regional URL mappings are correct and the isKnownGeoRedirect flag is set properly for these stores.',
      isTransient: false,
    };
  }

  if (e.includes('[link_test]') && (e.includes('500') || e.includes('502') || e.includes('503'))) {
    return {
      pattern: 'Store server error',
      severity: 'medium',
      diagnosis: 'The store is returning a server error (5xx). This is typically a temporary issue with the store itself.',
      suggestedFix: 'Retry the test later. If persistent, the store may be having extended issues.',
      suggestedPrompt: 'Link testing found server errors (5xx) from some stores. This is usually a transient issue with the store itself. Retry testing later. If it persists for a specific store, investigate whether the store is down or if our request pattern triggers rate limiting.',
      isTransient: true,
    };
  }

  // Generic link test failure (catch-all for [LINK_TEST] errors)
  if (e.includes('[link_test]')) {
    return {
      pattern: 'Link test failure',
      severity: 'medium',
      diagnosis: `Link test failed: ${error.substring(12, 200)}`,
      suggestedFix: 'Review the specific error and check if the URL is accessible manually.',
      suggestedPrompt: `Link testing failed for some products: "${error.substring(12, 150)}". Check the affected URLs manually and update any that have changed.`,
      isTransient: false,
    };
  }

  // Default catch-all
  return {
    pattern: 'Unknown error',
    severity: 'medium',
    diagnosis: `Unrecognized error: ${error.substring(0, 200)}`,
    suggestedFix: 'Review the error message and check the edge function logs for more details.',
    suggestedPrompt: `An unrecognized error occurred during price sync: "${error.substring(0, 100)}". Investigate the get-current-price edge function logs for this specific error pattern.`,
    isTransient: false,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { failures } = await req.json() as { failures: Failure[] };

    if (!failures || !Array.isArray(failures) || failures.length === 0) {
      return new Response(
        JSON.stringify({ summary: 'No failures to analyze', diagnoses: [], overallHealth: 'good' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Classify and group failures
    const groups = new Map<string, { info: ReturnType<typeof classifyError>; products: string[]; failureDetails: FailureDetail[] }>();

    for (const f of failures) {
      const classification = classifyError(f.error || 'Unknown error');
      const productLabel = `${f.product} ${f.region}`;

      const detail: FailureDetail = {
        product: f.product,
        region: f.region,
        url: f.url,
        error: f.error || 'Unknown error',
        statusCode: f.statusCode,
        latencyMs: f.latencyMs,
        brand: f.brand,
      };

      const existing = groups.get(classification.pattern);
      if (existing) {
        existing.products.push(productLabel);
        if (existing.failureDetails.length < 20) {
          existing.failureDetails.push(detail);
        }
      } else {
        groups.set(classification.pattern, { info: classification, products: [productLabel], failureDetails: [detail] });
      }
    }

    // Build diagnoses array
    const diagnoses: Diagnosis[] = [];
    for (const [, group] of groups) {
      diagnoses.push({
        pattern: group.info.pattern,
        count: group.products.length,
        severity: group.info.severity,
        diagnosis: group.info.diagnosis,
        suggestedFix: group.info.suggestedFix,
        suggestedPrompt: group.info.suggestedPrompt,
        affectedProducts: group.products,
        isTransient: group.info.isTransient,
        contextualPromptParts: {
          errorPattern: group.info.pattern,
          edgeFunctionName: 'get-current-price',
          failureDetails: group.failureDetails,
        },
      });
    }

    // Sort by severity (high first), then count
    const severityOrder = { high: 0, medium: 1, low: 2 };
    diagnoses.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count);

    // Build summary
    const summaryParts = diagnoses.map(d => `${d.count} ${d.pattern.toLowerCase()}`);
    const summary = `${failures.length} failures analyzed: ${summaryParts.join(', ')}`;

    // Overall health
    const hasHigh = diagnoses.some(d => d.severity === 'high');
    const hasMedium = diagnoses.some(d => d.severity === 'medium');
    const overallHealth = hasHigh ? 'poor' : hasMedium ? 'fair' : 'good';

    return new Response(
      JSON.stringify({ summary, diagnoses, overallHealth }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Diagnosis error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to diagnose' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
