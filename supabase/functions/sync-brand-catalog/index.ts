/**
 * SYNC BRAND CATALOG — Edge Function
 *
 * Fetches ALL products from a brand's Shopify store, identifies filaments,
 * extracts complete filament data per color variant, diffs against existing
 * database, and stores categorized results for admin review.
 *
 * Classification, extraction, and diff logic live in _shared/catalog-sync-helpers.ts
 * to keep this function's bundle size under Supabase edge function limits.
 *
 * POST { brand_id, config_id }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ScrapingConfig,
  ExtractedFilament,
  classifyProduct,
  extractFilamentsFromProduct,
  diffAgainstDatabase,
} from "../_shared/catalog-sync-helpers.ts";

// Inline lightweight excluded-product keywords for sitemap pre-filtering
const SUNLU_EXCLUDED_KEYWORDS = [
  "filadryer", "filament-dryer", "dry-box", "drybox", "3d-pen", "resin",
  "build-plate", "magnetic-bed", "nozzle", "hotend", "extruder", "enclosure",
  "storage-box", "vacuum-bag", "connector", "kidoodle", "minibox",
  "sl-300", "sl-600", "fc01", "sp2", "s1-pro", "s2-plus", "s4",
];

// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHROME_UA = "Mozilla/5.0 (compatible; FilaScope/1.0)";

// ============================================================
// Fetch Full Shopify Catalog with Pagination
// ============================================================

async function fetchShopifyCatalog(
  baseUrl: string,
  maxPages = 10
): Promise<{ products: any[]; totalFetched: number }> {
  const allProducts: any[] = [];
  let page = 1;

  while (page <= maxPages) {
    const pageUrl = `${baseUrl.replace(/\/$/, "")}/products.json?limit=250&page=${page}`;

    let response: Response;
    let retries = 0;
    const maxRetries = 3;

    while (true) {
      response = await fetch(pageUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (response.status === 429 && retries < maxRetries) {
        retries++;
        const delay = 1000 * Math.pow(2, retries);
        console.warn(`[sync-brand-catalog] Rate limited on page ${page}, retrying in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }

    if (!response.ok) {
      if (page === 1) {
        throw new Error(`HTTP ${response.status} fetching ${pageUrl}`);
      }
      break;
    }

    const data = await response.json();
    const products = data?.products;
    if (!products || !Array.isArray(products) || products.length === 0) break;

    allProducts.push(...products);
    console.log(`[sync-brand-catalog] Page ${page}: ${products.length} products (total: ${allProducts.length})`);

    if (products.length < 250) break;
    page++;

    await new Promise((r) => setTimeout(r, 100));
  }

  return { products: allProducts, totalFetched: allProducts.length };
}

// ============================================================
// Fetch Catalog via Sitemap (per-handle strategy)
// ============================================================

async function fetchCatalogViaSitemap(
  baseUrl: string,
  brandSlug?: string
): Promise<{ products: any[]; totalFetched: number }> {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const sitemapUrl = `${cleanBase}/sitemap_products_1.xml`;

  console.log(`[sync-brand-catalog] Fetching product sitemap: ${sitemapUrl}`);

  const sitemapRes = await fetch(sitemapUrl, {
    headers: { "User-Agent": CHROME_UA, Accept: "text/xml,application/xml" },
  });

  if (!sitemapRes.ok) {
    throw new Error(`Sitemap fetch failed: HTTP ${sitemapRes.status} from ${sitemapUrl}`);
  }

  const xml = await sitemapRes.text();

  const handles: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1];
    if (url.includes("/products/")) {
      const handle = url.split("/products/")[1]?.replace(/\/$/, "").split("?")[0];
      if (handle && !handle.includes("/")) {
        handles.push(handle);
      }
    }
  }

  console.log(`[sync-brand-catalog] Discovered ${handles.length} product handles from sitemap`);

  if (handles.length === 0) {
    throw new Error(`No product handles found in sitemap at ${sitemapUrl}`);
  }

  const products: any[] = [];
  let fetchErrors = 0;

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];

    if (brandSlug === "sunlu" && SUNLU_EXCLUDED_KEYWORDS.some((kw) => handle.includes(kw))) {
      console.log(`[sync-brand-catalog] Skipped excluded handle: ${handle}`);
      continue;
    }

    try {
      const prodUrl = `${cleanBase}/products/${handle}.json`;
      const prodRes = await fetch(prodUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (prodRes.ok) {
        const data = await prodRes.json();
        if (data?.product) {
          products.push(data.product);
        }
      } else if (prodRes.status === 429) {
        console.warn(`[sync-brand-catalog] Rate limited on ${handle}, waiting 3s`);
        await new Promise((r) => setTimeout(r, 3000));
        const retryRes = await fetch(`${cleanBase}/products/${handle}.json`, {
          headers: { "User-Agent": CHROME_UA, Accept: "application/json" },
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          if (retryData?.product) products.push(retryData.product);
        } else {
          fetchErrors++;
        }
      } else {
        fetchErrors++;
        console.warn(`[sync-brand-catalog] HTTP ${prodRes.status} for ${handle}`);
      }
    } catch (err: unknown) {
      fetchErrors++;
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.warn(`[sync-brand-catalog] Failed to fetch ${handle}: ${msg}`);
    }

    if (i < handles.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }

    if ((i + 1) % 10 === 0) {
      console.log(`[sync-brand-catalog] Fetched ${products.length}/${i + 1} products (${fetchErrors} errors)`);
    }
  }

  console.log(
    `[sync-brand-catalog] Sitemap fetch complete: ${products.length} products fetched, ${fetchErrors} errors`
  );

  return { products, totalFetched: products.length };
}

// ============================================================
// Main Handler
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // ── Auth: admin JWT or service_role key ──
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  let isAuthorized = false;
  let adminUserId: string | null = null;

  if (token === serviceRoleKey) {
    isAuthorized = true;
  } else if (token) {
    try {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser(token);
      if (userData?.user?.id) {
        adminUserId = userData.user.id;
        const { data: roleData } = await userClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roleData) isAuthorized = true;
      }
    } catch (authErr: unknown) {
      const msg = authErr instanceof Error ? authErr.message : "Unknown auth error";
      console.warn("[sync-brand-catalog] Auth check failed:", msg);
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let brandId: string;
  let configId: string;

  try {
    const body = await req.json();
    brandId = body.brand_id;
    configId = body.config_id;
    if (!brandId || !configId) {
      throw new Error("Missing required fields: brand_id, config_id");
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Invalid request body";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let jobId: string | null = null;

  try {
    // ── Step 1: Load config ──
    const { data: configData, error: configError } = await supabase
      .from("brand_scraping_configs")
      .select("*")
      .eq("id", configId)
      .maybeSingle();

    if (configError || !configData) {
      return new Response(
        JSON.stringify({ error: `Config not found: ${configId}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = configData as ScrapingConfig;

    const { data: brandData, error: brandError } = await supabase
      .from("automated_brands")
      .select("brand_name, brand_slug")
      .eq("id", brandId)
      .maybeSingle();

    if (brandError || !brandData) {
      return new Response(
        JSON.stringify({ error: `Brand not found: ${brandId}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Create job ──
    const { data: jobData, error: jobError } = await supabase
      .from("brand_sync_jobs")
      .insert({
        brand_id: brandId,
        config_id: configId,
        status: "syncing",
        admin_user_id: adminUserId,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobError || !jobData) {
      throw new Error(`Failed to create sync job: ${jobError?.message}`);
    }
    jobId = jobData.id;

    console.log(`[sync-brand-catalog] Job ${jobId} started for ${brandData.brand_name}`);

    const brandSlug = brandData.brand_slug || "";

    // ── Fetch full catalog ──
    const catalogStrategy = (configData as any).catalog_strategy || "products-json";
    let allProducts: any[];

    if (catalogStrategy === "per-handle-sitemap") {
      console.log(`[sync-brand-catalog] Using per-handle-sitemap strategy for ${brandData.brand_name}`);
      const result = await fetchCatalogViaSitemap(config.base_url, brandSlug);
      allProducts = result.products;
    } else {
      const result = await fetchShopifyCatalog(config.base_url);
      allProducts = result.products;
    }

    if (allProducts.length === 0) {
      throw new Error(`No products found from ${config.base_url} (strategy: ${catalogStrategy})`);
    }

    console.log(`[sync-brand-catalog] Fetched ${allProducts.length} products from store`);

    // ── Filter filaments ──
    const filamentProducts: any[] = [];
    const skipReasons: Record<string, number> = {};
    const warnings: string[] = [];

    for (const product of allProducts) {
      const classification = classifyProduct(product);
      if (classification.isFilament) {
        filamentProducts.push(product);
      } else {
        skipReasons[classification.reason] = (skipReasons[classification.reason] || 0) + 1;
      }
    }

    console.log(`[sync-brand-catalog] Filament products: ${filamentProducts.length}, skipped: ${allProducts.length - filamentProducts.length}`);

    // ── Extract filaments from each product ──
    const allFilaments: ExtractedFilament[] = [];
    const extractionErrors: { handle: string; error: string }[] = [];

    for (const product of filamentProducts) {
      try {
        if (Date.now() - startTime > 120_000) {
          warnings.push(`Time limit reached after ${allFilaments.length} filaments extracted`);
          break;
        }

        const result = extractFilamentsFromProduct(product, config);
        allFilaments.push(...result.filaments);
        warnings.push(...result.warnings);
      } catch (err: unknown) {
        const handle = product.handle || product.title || "unknown";
        const msg = err instanceof Error ? err.message : "Unknown error";
        extractionErrors.push({ handle, error: msg });
        console.error(`[sync-brand-catalog] Error extracting '${handle}':`, msg);
      }
    }

    console.log(`[sync-brand-catalog] Extracted ${allFilaments.length} filaments, ${extractionErrors.length} errors`);

    // ── Diff against existing database ──
    const diffResults = await diffAgainstDatabase(supabase, allFilaments, brandId);

    const newFilaments = diffResults.filter((r) => r.status === "new");
    const priceChanged = diffResults.filter((r) => r.status === "price_changed");
    const matched = diffResults.filter((r) => r.status === "matched");

    // ── Store items in brand_sync_items ──
    const itemsToInsert: any[] = diffResults.map((r) => ({
      job_id: jobId,
      status: r.status,
      extracted_data: r.filament,
      display_name: r.filament.display_name,
      color_name: r.filament.color_family || r.filament.display_name.split(" - ").pop() || null,
      material_type: r.filament.material,
      color_hex: r.filament.color_hex,
      color_family: r.filament.color_family,
      finish_type: r.filament.finish_type,
      image_url: r.filament.featured_image,
      variant_image_url: r.filament.variant_image,
      price_usd: r.filament.price_usd,
      price_eur: r.filament.price_eur,
      price_gbp: r.filament.price_gbp,
      price_cad: r.filament.price_cad,
      price_aud: r.filament.price_aud,
      variant_sku: r.filament.variant_sku,
      product_handle: r.filament.product_handle,
      available_regions: r.filament.available_regions,
      is_new: r.status === "new",
      existing_filament_id: r.existingId,
      price_diff: r.priceDiff,
      error_message: null,
    }));

    for (const err of extractionErrors) {
      itemsToInsert.push({
        job_id: jobId,
        status: "error",
        extracted_data: { handle: err.handle },
        display_name: err.handle,
        color_name: null,
        material_type: null,
        color_hex: null,
        color_family: null,
        finish_type: null,
        image_url: null,
        variant_image_url: null,
        price_usd: null,
        price_eur: null,
        price_gbp: null,
        price_cad: null,
        price_aud: null,
        variant_sku: null,
        product_handle: null,
        available_regions: null,
        is_new: false,
        existing_filament_id: null,
        price_diff: null,
        error_message: err.error,
      });
    }

    for (let i = 0; i < itemsToInsert.length; i += 100) {
      const batch = itemsToInsert.slice(i, i + 100);
      const { error: insertErr } = await supabase.from("brand_sync_items").insert(batch);
      if (insertErr) {
        console.error(`[sync-brand-catalog] Error inserting items batch ${i}:`, insertErr.message);
      }
    }

    // ── Update job with summary ──
    const durationMs = Date.now() - startTime;

    await supabase
      .from("brand_sync_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_store_products: allProducts.length,
        filament_products_found: filamentProducts.length,
        skipped_products: allProducts.length - filamentProducts.length,
        skip_reasons: skipReasons,
        new_count: newFilaments.length,
        changed_count: priceChanged.length,
        matched_count: matched.length,
        error_count: extractionErrors.length,
        warnings: warnings.length > 0 ? warnings : null,
        errors: extractionErrors.length > 0 ? extractionErrors : null,
      })
      .eq("id", jobId);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        brand_name: brandData.brand_name,
        catalog_stats: {
          total_store_products: allProducts.length,
          filament_products_found: filamentProducts.length,
          skipped_products: allProducts.length - filamentProducts.length,
          skip_reasons: skipReasons,
        },
        new_count: newFilaments.length,
        changed_count: priceChanged.length,
        matched_count: matched.length,
        error_count: extractionErrors.length,
        warnings,
        duration_ms: durationMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[sync-brand-catalog] Fatal error:`, errMsg);

    if (jobId) {
      await supabase
        .from("brand_sync_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          errors: { fatal: errMsg },
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
