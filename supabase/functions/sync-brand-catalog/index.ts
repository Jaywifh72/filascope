/**
 * SYNC BRAND CATALOG — Phase 1: Fetch Products
 *
 * Fetches ALL products from a brand's Shopify store and returns them.
 * Products are then passed to process-brand-sync for classification,
 * extraction, and diffing.
 *
 * ZERO shared-file imports to keep bundle size minimal for Supabase deployment.
 *
 * POST { brand_id, config_id }
 * Returns { job_id, products, brand_slug, product_count }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUNLU_EXCLUDED_KEYWORDS = [
  "filadryer", "filament-dryer", "dry-box", "drybox", "3d-pen", "resin",
  "build-plate", "magnetic-bed", "nozzle", "hotend", "extruder", "enclosure",
  "storage-box", "vacuum-bag", "connector", "kidoodle", "minibox",
  "sl-300", "sl-600", "fc01", "sp2", "s1-pro", "s2-plus", "s4",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHROME_UA = "Mozilla/5.0 (compatible; FilaScope/1.0)";

// ── Fetch via /products.json pagination ──

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

    while (true) {
      response = await fetch(pageUrl, {
        headers: { "User-Agent": CHROME_UA, Accept: "application/json", "Accept-Language": "en-US,en;q=0.9" },
      });
      if (response.status === 429 && retries < 3) {
        retries++;
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, retries)));
        continue;
      }
      break;
    }

    if (!response.ok) {
      if (page === 1) throw new Error(`HTTP ${response.status} fetching ${pageUrl}`);
      break;
    }

    const data = await response.json();
    const products = data?.products;
    if (!products || !Array.isArray(products) || products.length === 0) break;

    allProducts.push(...products);
    console.log(`[sync] Page ${page}: ${products.length} products (total: ${allProducts.length})`);

    if (products.length < 250) break;
    page++;
    await new Promise((r) => setTimeout(r, 100));
  }

  return { products: allProducts, totalFetched: allProducts.length };
}

// ── Fetch via sitemap + individual /products/{handle}.json ──

async function fetchCatalogViaSitemap(
  baseUrl: string,
  brandSlug?: string
): Promise<{ products: any[]; totalFetched: number }> {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const sitemapUrl = `${cleanBase}/sitemap_products_1.xml`;

  console.log(`[sync] Fetching product sitemap: ${sitemapUrl}`);
  const sitemapRes = await fetch(sitemapUrl, {
    headers: { "User-Agent": CHROME_UA, Accept: "text/xml,application/xml" },
  });

  if (!sitemapRes.ok) throw new Error(`Sitemap fetch failed: HTTP ${sitemapRes.status}`);

  const xml = await sitemapRes.text();
  const handles: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    if (match[1].includes("/products/")) {
      const handle = match[1].split("/products/")[1]?.replace(/\/$/, "").split("?")[0];
      if (handle && !handle.includes("/")) handles.push(handle);
    }
  }

  console.log(`[sync] Discovered ${handles.length} handles from sitemap`);
  if (handles.length === 0) throw new Error(`No product handles found in sitemap`);

  const products: any[] = [];
  let fetchErrors = 0;

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    if (brandSlug === "sunlu" && SUNLU_EXCLUDED_KEYWORDS.some((kw) => handle.includes(kw))) continue;

    try {
      const prodRes = await fetch(`${cleanBase}/products/${handle}.json`, {
        headers: { "User-Agent": CHROME_UA, Accept: "application/json" },
      });

      if (prodRes.ok) {
        const data = await prodRes.json();
        if (data?.product) products.push(data.product);
      } else if (prodRes.status === 429) {
        await new Promise((r) => setTimeout(r, 3000));
        const retryRes = await fetch(`${cleanBase}/products/${handle}.json`, {
          headers: { "User-Agent": CHROME_UA, Accept: "application/json" },
        });
        if (retryRes.ok) {
          const d = await retryRes.json();
          if (d?.product) products.push(d.product);
        } else fetchErrors++;
      } else {
        fetchErrors++;
      }
    } catch {
      fetchErrors++;
    }

    if (i < handles.length - 1) await new Promise((r) => setTimeout(r, 300));
    if ((i + 1) % 10 === 0) console.log(`[sync] Fetched ${products.length}/${i + 1} (${fetchErrors} errors)`);
  }

  console.log(`[sync] Sitemap complete: ${products.length} products, ${fetchErrors} errors`);
  return { products, totalFetched: products.length };
}

// ── Slim down products for transfer (strip heavy body_html) ──

function slimProducts(products: any[]): any[] {
  return products.map((p) => ({
    ...p,
    body_html: (p.body_html || "").slice(0, 3000), // Keep first 3KB for spec extraction
  }));
}

// ── Main Handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // ── Auth ──
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  let isAuthorized = false;
  let adminUserId: string | null = null;

  if (token === serviceRoleKey) {
    isAuthorized = true;
  } else if (token) {
    try {
      const uc = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: ud } = await uc.auth.getUser(token);
      if (ud?.user?.id) {
        adminUserId = ud.user.id;
        const { data: rd } = await uc
          .from("user_roles").select("role")
          .eq("user_id", ud.user.id).eq("role", "admin").maybeSingle();
        if (rd) isAuthorized = true;
      }
    } catch { /* auth check failed */ }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let brandId: string;
  let configId: string;

  try {
    const body = await req.json();
    brandId = body.brand_id;
    configId = body.config_id;
    if (!brandId || !configId) throw new Error("Missing brand_id or config_id");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Invalid request";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let jobId: string | null = null;

  try {
    // Load config
    const { data: configData, error: configError } = await supabase
      .from("brand_scraping_configs").select("*").eq("id", configId).maybeSingle();

    if (configError || !configData) {
      return new Response(JSON.stringify({ error: `Config not found: ${configId}` }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load brand
    const { data: brandData, error: brandError } = await supabase
      .from("automated_brands").select("brand_name, brand_slug").eq("id", brandId).maybeSingle();

    if (brandError || !brandData) {
      return new Response(JSON.stringify({ error: `Brand not found: ${brandId}` }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create job
    const { data: jobData, error: jobError } = await supabase
      .from("brand_sync_jobs")
      .insert({
        brand_id: brandId, config_id: configId, status: "syncing",
        admin_user_id: adminUserId, started_at: new Date().toISOString(),
      })
      .select("id").single();

    if (jobError || !jobData) throw new Error(`Failed to create job: ${jobError?.message}`);
    jobId = jobData.id;

    console.log(`[sync] Job ${jobId} started for ${brandData.brand_name}`);

    // Fetch products
    const strategy = (configData as any).catalog_strategy || "products-json";
    const brandSlug = brandData.brand_slug || "";
    let allProducts: any[];

    if (strategy === "per-handle-sitemap") {
      console.log(`[sync] Using per-handle-sitemap for ${brandData.brand_name}`);
      const r = await fetchCatalogViaSitemap(configData.base_url, brandSlug);
      allProducts = r.products;
    } else {
      const r = await fetchShopifyCatalog(configData.base_url);
      allProducts = r.products;
    }

    if (allProducts.length === 0) throw new Error(`No products found (strategy: ${strategy})`);

    // Update job with product count
    await supabase.from("brand_sync_jobs").update({
      total_store_products: allProducts.length,
    }).eq("id", jobId);

    console.log(`[sync] Returning ${allProducts.length} products for processing`);

    return new Response(
      JSON.stringify({
        job_id: jobId,
        brand_slug: brandSlug,
        brand_name: brandData.brand_name,
        product_count: allProducts.length,
        products: slimProducts(allProducts),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[sync] Fatal:`, errMsg);

    if (jobId) {
      await supabase.from("brand_sync_jobs").update({
        status: "failed", completed_at: new Date().toISOString(),
        errors: { fatal: errMsg },
      }).eq("id", jobId);
    }

    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
