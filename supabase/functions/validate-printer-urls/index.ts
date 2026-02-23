import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchRegionalStore } from "../_shared/regional-fetch.ts";
import { extractPrice, type ExtractionResult } from "../_shared/printer-price-extraction.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REGION_MAP: Record<string, { urlCol: string; priceCol: string }> = {
  US: { urlCol: 'product_url', priceCol: 'current_price_usd_store' },
  CA: { urlCol: 'product_url_ca', priceCol: 'current_price_cad_store' },
  UK: { urlCol: 'product_url_uk', priceCol: 'current_price_gbp_store' },
  EU: { urlCol: 'product_url_eu', priceCol: 'current_price_eur_store' },
  AU: { urlCol: 'product_url_au', priceCol: 'current_price_aud_store' },
  JP: { urlCol: 'product_url_jp', priceCol: 'current_price_jpy_store' },
};

const REGIONS = Object.keys(REGION_MAP);

interface ValidationResult {
  printer_id: string;
  region: string;
  url: string;
  status_code: number | null;
  status: 'valid' | 'invalid' | 'redirect' | 'unknown';
  redirect_url: string | null;
  error_message: string | null;
  price_found: number | null;
  price_in_db: number | null;
  price_mismatch: boolean;
  extraction_method: string | null;
  validated_at: string;
}

async function validateSingleUrl(
  printerId: string,
  region: string,
  url: string,
  priceInDb: number | null
): Promise<ValidationResult> {
  const now = new Date().toISOString();
  
  try {
    // HEAD request for status check
    const result = await fetchRegionalStore(url, region, { method: 'HEAD', timeoutMs: 10000 });
    
    let statusCode = result.statusCode;
    let status: 'valid' | 'invalid' | 'redirect' | 'unknown' = 'unknown';
    let redirectUrl: string | null = result.redirectedTo || null;
    
    if (statusCode === 200 || statusCode === 204) {
      status = 'valid';
    } else if (statusCode === 301 || statusCode === 302 || statusCode === 308) {
      status = 'redirect';
    } else if (statusCode === 404 || statusCode === 410) {
      status = 'invalid';
    }
    
    // Extract price using shared 3-tier engine
    let priceFound: number | null = null;
    let extractionMethod: string | null = null;
    if (status === 'valid') {
      const extraction: ExtractionResult = await extractPrice(url, region, priceInDb);
      priceFound = extraction.current_price;
      extractionMethod = extraction.extraction_method;
    }
    
    // Check price mismatch (>5% difference)
    let priceMismatch = false;
    if (priceFound !== null && priceInDb !== null && priceInDb > 0) {
      const diff = Math.abs(priceFound - priceInDb) / priceInDb;
      priceMismatch = diff > 0.05;
    }
    
    return {
      printer_id: printerId,
      region,
      url,
      status_code: statusCode,
      status,
      redirect_url: redirectUrl,
      error_message: null,
      price_found: priceFound,
      price_in_db: priceInDb,
      price_mismatch: priceMismatch,
      extraction_method: extractionMethod,
      validated_at: now,
    };
  } catch (err) {
    return {
      printer_id: printerId,
      region,
      url,
      status_code: null,
      status: 'unknown',
      redirect_url: null,
      error_message: err instanceof Error ? err.message : 'Unknown error',
      price_found: null,
      price_in_db: priceInDb,
      price_mismatch: false,
      extraction_method: null,
      validated_at: now,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { printerId, region } = await req.json().catch(() => ({}));

    let query = supabase.from('printers').select(`
      id, model_name, brand_id, slug,
      product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp,
      current_price_usd_store, current_price_cad_store, current_price_gbp_store,
      current_price_eur_store, current_price_aud_store, current_price_jpy_store
    `);

    if (printerId && printerId !== 'all') {
      query = query.eq('id', printerId);
    }

    const { data: printers, error: printersError } = await query;
    if (printersError) throw printersError;
    if (!printers || printers.length === 0) {
      return new Response(JSON.stringify({ error: 'No printers found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: ValidationResult[] = [];
    const regionsToCheck = region ? [region] : REGIONS;

    // Process printers in batches of 3
    for (let i = 0; i < printers.length; i += 3) {
      const batch = printers.slice(i, i + 3);
      const batchPromises: Promise<ValidationResult>[] = [];

      for (const printer of batch) {
        for (const r of regionsToCheck) {
          const mapping = REGION_MAP[r];
          const url = printer[mapping.urlCol as keyof typeof printer] as string | null;
          if (!url) continue;

          const priceInDb = printer[mapping.priceCol as keyof typeof printer] as number | null;
          batchPromises.push(validateSingleUrl(printer.id, r, url, priceInDb));
        }
      }

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (i + 3 < printers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Upsert results
    if (results.length > 0) {
      const { error: upsertError } = await supabase
        .from('printer_url_validations')
        .upsert(results, { onConflict: 'printer_id,region' });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
      }
    }

    const summary = {
      total: results.length,
      valid: results.filter(r => r.status === 'valid').length,
      invalid: results.filter(r => r.status === 'invalid').length,
      redirect: results.filter(r => r.status === 'redirect').length,
      unknown: results.filter(r => r.status === 'unknown').length,
      priceMismatches: results.filter(r => r.price_mismatch).length,
    };

    return new Response(JSON.stringify({ summary, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in validate-printer-urls:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
