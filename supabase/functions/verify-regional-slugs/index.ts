/**
 * Edge Function: verify-regional-slugs
 * 
 * Background job to verify and populate regional slug mappings.
 * Tests product URLs across different regional stores and stores
 * working slugs in the database.
 * 
 * Can be triggered:
 * - Manually via HTTP POST
 * - Scheduled via cron job
 * - For specific filaments via request body
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Types
// ============================================================================

interface RegionalStore {
  id: string;
  brand_id: string;
  region_code: string;
  store_name: string;
  base_url: string;
  product_url_pattern: string | null;
}

interface Filament {
  id: string;
  product_handle: string | null;
  brand_id: string | null;
  vendor: string | null;
}

interface VerificationResult {
  filamentId: string;
  regionCode: string;
  slug: string;
  verified: boolean;
  httpStatus: number;
}

// ============================================================================
// Abbreviation Expansions (mirror of frontend utility)
// ============================================================================

const ABBREVIATION_EXPANSIONS: Record<string, string[]> = {
  'cf': ['carbon-fiber', 'carbon-fibre'],
  'gf': ['glass-fiber', 'glass-fibre', 'glass-filled'],
  'hf': ['high-flow', 'hyper-flow'],
  'hs': ['high-speed', 'hyper-speed'],
  'ht': ['high-temp', 'high-temperature'],
  'pro': ['professional'],
};

function generateSlugVariants(primarySlug: string): string[] {
  const variants = new Set<string>([primarySlug]);
  
  for (const [abbrev, expansions] of Object.entries(ABBREVIATION_EXPANSIONS)) {
    const abbrevPattern = new RegExp(`-${abbrev}(?:-|$)`, 'i');
    if (abbrevPattern.test(primarySlug)) {
      for (const expansion of expansions) {
        const variant = primarySlug.replace(abbrevPattern, `-${expansion}-`).replace(/-$/, '');
        variants.add(variant);
      }
    }
  }
  
  return Array.from(variants);
}

// ============================================================================
// URL Testing
// ============================================================================

function buildUrl(pattern: string | null, baseUrl: string, slug: string): string {
  if (!pattern) return baseUrl;
  
  let url = pattern
    .replace(/{slug}/gi, slug)
    .replace(/{sku}/gi, slug)
    .replace(/{product}/gi, slug);
  
  if (!url.startsWith('http')) {
    url = baseUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
  }
  
  return url;
}

async function testUrl(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'FilaScope URL Verifier/1.0',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    
    return {
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    console.error(`Error testing URL ${url}:`, error);
    return { ok: false, status: 0 };
  }
}

// ============================================================================
// Verification Logic
// ============================================================================

async function verifySlugForRegion(
  store: RegionalStore,
  primarySlug: string,
  rateLimitMs: number = 500
): Promise<{ slug: string; verified: boolean; httpStatus: number }> {
  // Try primary slug first
  const primaryUrl = buildUrl(store.product_url_pattern, store.base_url, primarySlug);
  const primaryResult = await testUrl(primaryUrl);
  
  if (primaryResult.ok) {
    return { slug: primarySlug, verified: true, httpStatus: primaryResult.status };
  }
  
  // Rate limit before trying variants
  await new Promise(resolve => setTimeout(resolve, rateLimitMs));
  
  // Try slug variants if primary fails
  const variants = generateSlugVariants(primarySlug);
  for (const variant of variants.slice(1)) { // Skip first (primary)
    const variantUrl = buildUrl(store.product_url_pattern, store.base_url, variant);
    const result = await testUrl(variantUrl);
    
    if (result.ok) {
      return { slug: variant, verified: true, httpStatus: result.status };
    }
    
    // Rate limit between attempts
    await new Promise(resolve => setTimeout(resolve, rateLimitMs));
  }
  
  // No working slug found
  return { slug: primarySlug, verified: false, httpStatus: primaryResult.status };
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let filamentIds: string[] = [];
    let batchSize = 10;
    let rateLimitMs = 500;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        filamentIds = body.filamentIds || [];
        batchSize = body.batchSize || 10;
        rateLimitMs = body.rateLimitMs || 500;
      } catch {
        // Empty body is OK
      }
    }

    // Fetch filaments to process
    let filamentsQuery = supabase
      .from('filaments')
      .select('id, product_handle, brand_id, vendor')
      .not('product_handle', 'is', null)
      .not('brand_id', 'is', null);

    if (filamentIds.length > 0) {
      filamentsQuery = filamentsQuery.in('id', filamentIds);
    } else {
      // Process filaments that don't have verified slugs yet
      // (limit to batch size for scheduled runs)
      filamentsQuery = filamentsQuery.limit(batchSize);
    }

    const { data: filaments, error: filamentsError } = await filamentsQuery;
    
    if (filamentsError) {
      throw new Error(`Failed to fetch filaments: ${filamentsError.message}`);
    }

    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No filaments to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique brand IDs
    const brandIds = [...new Set(filaments.map(f => f.brand_id).filter(Boolean))];

    // Fetch regional stores for these brands
    const { data: stores, error: storesError } = await supabase
      .from('brand_regional_stores')
      .select('id, brand_id, region_code, store_name, base_url, product_url_pattern')
      .in('brand_id', brandIds as string[])
      .eq('is_active', true)
      .not('product_url_pattern', 'is', null);

    if (storesError) {
      throw new Error(`Failed to fetch stores: ${storesError.message}`);
    }

    if (!stores || stores.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No regional stores configured', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group stores by brand
    const storesByBrand: Record<string, RegionalStore[]> = {};
    for (const store of stores) {
      if (!storesByBrand[store.brand_id]) {
        storesByBrand[store.brand_id] = [];
      }
      storesByBrand[store.brand_id].push(store);
    }

    // Process each filament
    const results: VerificationResult[] = [];
    let processed = 0;
    let verified = 0;
    let failed = 0;

    for (const filament of filaments) {
      const brandStores = storesByBrand[filament.brand_id!] || [];
      const primarySlug = filament.product_handle!;

      for (const store of brandStores) {
        // Check if we already have a verified slug for this combo
        const { data: existing } = await supabase
          .from('product_regional_slugs')
          .select('verified, verified_at')
          .eq('filament_id', filament.id)
          .eq('region_code', store.region_code)
          .maybeSingle();

        // Skip if already verified recently (within 7 days)
        if (existing?.verified && existing.verified_at) {
          const verifiedDate = new Date(existing.verified_at);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          if (verifiedDate > sevenDaysAgo) {
            continue;
          }
        }

        // Verify the slug
        const result = await verifySlugForRegion(store, primarySlug, rateLimitMs);

        // Upsert the result
        const { error: upsertError } = await supabase
          .from('product_regional_slugs')
          .upsert({
            filament_id: filament.id,
            region_code: store.region_code,
            slug: result.slug,
            verified: result.verified,
            http_status: result.httpStatus,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'filament_id,region_code',
          });

        if (upsertError) {
          console.error(`Failed to upsert slug for ${filament.id}/${store.region_code}:`, upsertError);
          failed++;
        } else {
          processed++;
          if (result.verified) verified++;
          
          results.push({
            filamentId: filament.id,
            regionCode: store.region_code,
            slug: result.slug,
            verified: result.verified,
            httpStatus: result.httpStatus,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${processed} regional slugs`,
        processed,
        verified,
        failed,
        results: results.slice(0, 100), // Limit response size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-regional-slugs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
