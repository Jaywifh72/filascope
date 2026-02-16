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
    const groups = new Map<string, { info: ReturnType<typeof classifyError>; products: string[] }>();

    for (const f of failures) {
      const classification = classifyError(f.error || 'Unknown error');
      const productLabel = `${f.product} ${f.region}`;

      const existing = groups.get(classification.pattern);
      if (existing) {
        existing.products.push(productLabel);
      } else {
        groups.set(classification.pattern, { info: classification, products: [productLabel] });
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
