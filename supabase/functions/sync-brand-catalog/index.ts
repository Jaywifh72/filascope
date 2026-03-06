/**
 * SYNC BRAND CATALOG — Edge Function
 *
 * Fetches ALL products from a brand's Shopify store, identifies filaments,
 * extracts complete filament data per color variant, diffs against existing
 * database, and stores categorized results for admin review.
 *
 * POST { brand_id, config_id }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ScrapingConfig,
  ExtractedFilament,
  guessColorHex,
  guessColorFamily,
  guessFinishType,
  stripMaterialPrefix,
  parseSpecsFromHtml,
  detectOptionPositions,
  cleanMaterial,
  FILAMENT_KEYWORDS,
  NON_FILAMENT_KEYWORDS,
} from "../_shared/filament-utils.ts";

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
// Filament Classification
// ============================================================

interface ClassifyResult {
  isFilament: boolean;
  reason: string;
}

function classifyProduct(product: any): ClassifyResult {
  const title = (product.title || "").toLowerCase();
  const productType = (product.product_type || "").toLowerCase();
  const tags = (product.tags || []).map((t: string) => t.toLowerCase());

  // Skip clearance/region-only bundle pages
  if (/^\[.+only\]/i.test(product.title || "")) {
    return { isFilament: false, reason: "clearance_duplicate" };
  }

  // Check exclusion keywords first
  for (const kw of NON_FILAMENT_KEYWORDS) {
    if (title.includes(kw)) {
      // But don't exclude if it also has filament keywords
      const hasFilamentKw = FILAMENT_KEYWORDS.some((fk) => title.includes(fk));
      if (!hasFilamentKw) {
        return { isFilament: false, reason: "non_filament" };
      }
    }
  }

  // Exclude by product_type
  if (["3d printers", "resin", "printer", "accessories"].includes(productType)) {
    const hasFilamentKw = FILAMENT_KEYWORDS.some((fk) => title.includes(fk));
    if (!hasFilamentKw) {
      return { isFilament: false, reason: "non_filament" };
    }
  }

  // Include by title keywords
  for (const kw of FILAMENT_KEYWORDS) {
    if (title.includes(kw)) {
      return { isFilament: true, reason: "title_keyword" };
    }
  }

  // Include if has Material/Color option names
  const optionNames = (product.options || []).map((o: any) => (o.name || "").toLowerCase());
  if (optionNames.some((n: string) => n.includes("material") || n.includes("color"))) {
    // Only if it also looks like a physical product with weight
    if (product.variants?.some((v: any) => v.grams > 500)) {
      return { isFilament: true, reason: "option_heuristic" };
    }
  }

  // Check tags
  for (const tag of tags) {
    if (FILAMENT_KEYWORDS.some((kw) => tag.includes(kw))) {
      return { isFilament: true, reason: "tag_keyword" };
    }
  }

  return { isFilament: false, reason: "non_filament" };
}

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

    // Small delay between pages
    await new Promise((r) => setTimeout(r, 100));
  }

  return { products: allProducts, totalFetched: allProducts.length };
}

// ============================================================
// Extract Filaments from a Single Product
// ============================================================

function extractFilamentsFromProduct(
  product: any,
  config: ScrapingConfig
): { filaments: ExtractedFilament[]; warnings: string[] } {
  const warnings: string[] = [];
  const filaments: ExtractedFilament[] = [];
  const productHandle = product.handle || "unknown";

  if (!product.variants?.length) {
    warnings.push(`Product '${productHandle}': no variants`);
    return { filaments, warnings };
  }

  // Detect option positions
  const detected = detectOptionPositions(product, config);
  warnings.push(
    `Product '${productHandle}': Region=${detected.regionKey}, Material=${detected.materialKey}, Color=${detected.colorKey}`
  );

  const regionMap: Record<string, string> = config.variant_mapping?.region_map || {};
  const regionalUrls = config.regional_url_pattern || {};
  const buildRegionalUrl = (region: string): string | null => {
    const base = regionalUrls[region];
    if (!base) return null;
    return `${base.replace(/\/$/, "")}/products/${productHandle}`;
  };

  // Parse specs from body_html
  const specs = parseSpecsFromHtml(product.body_html || "", config.spec_extraction || null);

  // Determine material from option or title
  function getMaterial(variant: any): string {
    if (detected.materialKey) {
      const raw = variant[detected.materialKey!];
      if (raw) return cleanMaterial(raw);
    }
    // Fallback: parse from product title
    const titleLower = (product.title || "").toLowerCase();
    const knownMaterials = ["petg", "pla+", "pla plus", "abs", "tpu", "asa", "nylon", "pa", "pc", "pva", "hips", "pla"];
    for (const m of knownMaterials) {
      if (titleLower.includes(m)) {
        return m === "pla+" || m === "pla plus" ? "PLA+" : m.toUpperCase();
      }
    }
    return (config.default_material_type || "PLA").toUpperCase();
  }

  // Group variants by color
  const colorGroups: Record<string, any[]> = {};
  for (const variant of product.variants) {
    const colorKey = detected.colorKey
      ? (variant[detected.colorKey] || variant.title || "Default")
      : (variant.title || "Default");
    if (!colorGroups[colorKey]) colorGroups[colorKey] = [];
    colorGroups[colorKey].push(variant);
  }

  for (const [rawColorName, variants] of Object.entries(colorGroups)) {
    const material = getMaterial(variants[0]);
    const colorName = stripMaterialPrefix(rawColorName, material);

    // Regional prices
    let priceUsd: number | null = null;
    let priceEur: number | null = null;
    let priceCad: number | null = null;
    let priceAud: number | null = null;
    let priceGbp: number | null = null;
    const availableRegions: string[] = [];
    let anyAvailable = false;

    const hasRegionOption = !!detected.regionKey;

    if (hasRegionOption) {
      for (const v of variants) {
        const regionLabel = v[detected.regionKey!] || "";
        const regionCode = regionMap[regionLabel] || null;
        const price = parseFloat(v.price);
        if (regionCode && !isNaN(price) && price > 0) {
          switch (regionCode) {
            case "US": priceUsd = price; break;
            case "EU": priceEur = price; break;
            case "CA": priceCad = price; break;
            case "AU": priceAud = price; break;
            case "UK": priceGbp = price; break;
          }
          if (v.available) {
            availableRegions.push(regionCode);
            anyAvailable = true;
          }
        }
      }
    } else {
      // No region option — single-region product
      const price = parseFloat(variants[0].price);
      if (!isNaN(price) && price > 0) {
        priceUsd = price;
        if (variants[0].available) {
          availableRegions.push("US");
          anyAvailable = true;
        }
      }
    }

    // Image
    const firstVariant = variants[0];
    const featuredImage =
      firstVariant?.featured_image?.src ||
      product.images?.find((img: any) => img.variant_ids?.includes(firstVariant.id))?.src ||
      product.images?.[0]?.src ||
      null;

    // SKU — prefer US variant
    const usVariant = variants.find((v: any) => {
      const rl = v[detected.regionKey!] || "";
      return regionMap[rl] === "US";
    });
    const variantSku = usVariant?.sku || firstVariant?.sku || null;

    const displayName = `${material} - ${colorName}`;
    const productTitle = `${config.brand_name} ${material} - ${colorName}`;
    const finishType = guessFinishType(material, rawColorName);

    const filament: ExtractedFilament = {
      brand_id: config.brand_id,
      material,
      product_title: productTitle,
      display_name: displayName,
      color_family: guessColorFamily(colorName),
      color_hex: guessColorHex(colorName),
      featured_image: featuredImage,
      variant_image: featuredImage,
      nozzle_temp_min_c: specs.nozzleTempMin,
      nozzle_temp_max_c: specs.nozzleTempMax,
      bed_temp_min_c: specs.bedTempMin,
      bed_temp_max_c: specs.bedTempMax,
      diameter_nominal_mm: specs.diameter || 1.75,
      net_weight_g: specs.netWeight,
      product_url: buildRegionalUrl("US") || `${config.base_url}/products/${productHandle}`,
      product_url_us: buildRegionalUrl("US"),
      product_url_eu: buildRegionalUrl("EU"),
      product_url_uk: buildRegionalUrl("UK"),
      product_url_ca: buildRegionalUrl("CA"),
      product_url_au: buildRegionalUrl("AU"),
      price_usd: priceUsd,
      price_eur: priceEur,
      price_gbp: priceGbp,
      price_cad: priceCad,
      price_aud: priceAud,
      product_handle: productHandle,
      variant_sku: variantSku,
      finish_type: finishType,
      spool_material: null,
      pack_quantity: 1,
      print_speed_max_mms: specs.printSpeedMax,
      high_speed_capable:
        material.includes("HIGH SPEED") ||
        material.includes("HS") ||
        (specs.printSpeedMax !== null && specs.printSpeedMax >= 300),
      drying_temp_c: specs.dryingTemp,
      drying_time_hours: specs.dryingTime,
      variant_available: anyAvailable,
      available_regions: availableRegions,
    };

    filaments.push(filament);
  }

  return { filaments, warnings };
}

// ============================================================
// Diff Against Existing Database
// ============================================================

interface DiffResult {
  filament: ExtractedFilament;
  status: "new" | "matched" | "price_changed" | "error";
  existingId: string | null;
  priceDiff: { field: string; old: number | null; new: number | null }[] | null;
}

async function diffAgainstDatabase(
  supabase: any,
  filaments: ExtractedFilament[],
  brandId: string
): Promise<DiffResult[]> {
  const results: DiffResult[] = [];

  // Batch-load existing filaments for this brand (up to 1000)
  const { data: existingFilaments } = await supabase
    .from("filaments")
    .select("id, variant_sku, material, display_name, product_title, variant_price, price_eur, price_gbp, price_cad, price_aud")
    .eq("brand_id", brandId)
    .limit(1000);

  const existing = existingFilaments || [];

  for (const filament of filaments) {
    let match: any = null;

    // Primary: SKU match
    if (filament.variant_sku) {
      match = existing.find(
        (e: any) => e.variant_sku && e.variant_sku === filament.variant_sku
      );
    }

    // Secondary: material + color name similarity
    if (!match) {
      const colorPart = (filament.display_name.split(" - ").pop() || "").toLowerCase();
      if (colorPart) {
        match = existing.find(
          (e: any) =>
            e.material?.toLowerCase() === filament.material.toLowerCase() &&
            (e.display_name?.toLowerCase().includes(colorPart) ||
             e.product_title?.toLowerCase().includes(colorPart))
        );
      }
    }

    if (match) {
      // Compare prices
      const priceDiffs: { field: string; old: number | null; new: number | null }[] = [];

      const comparisons: [string, number | null, number | null][] = [
        ["price_usd", match.variant_price, filament.price_usd],
        ["price_eur", match.price_eur, filament.price_eur],
        ["price_gbp", match.price_gbp, filament.price_gbp],
        ["price_cad", match.price_cad, filament.price_cad],
        ["price_aud", match.price_aud, filament.price_aud],
      ];

      for (const [field, oldVal, newVal] of comparisons) {
        if (newVal !== null && oldVal !== newVal) {
          priceDiffs.push({ field, old: oldVal, new: newVal });
        }
      }

      results.push({
        filament,
        status: priceDiffs.length > 0 ? "price_changed" : "matched",
        existingId: match.id,
        priceDiff: priceDiffs.length > 0 ? priceDiffs : null,
      });
    } else {
      results.push({
        filament,
        status: "new",
        existingId: null,
        priceDiff: null,
      });
    }
  }

  return results;
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
      const { data } = await userClient.auth.getClaims(token);
      if (data?.claims?.sub) {
        adminUserId = data.claims.sub;
        const { data: roleData } = await userClient
          .from("user_roles")
          .select("role")
          .eq("user_id", data.claims.sub)
          .eq("role", "admin")
          .maybeSingle();
        if (roleData) isAuthorized = true;
      }
    } catch (authErr: any) {
      console.warn("[sync-brand-catalog] Auth check failed:", authErr.message);
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Parse request body ──
  let brandId: string;
  let configId: string;

  try {
    const body = await req.json();
    brandId = body.brand_id;
    configId = body.config_id;
    if (!brandId || !configId) {
      throw new Error("Missing required fields: brand_id, config_id");
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Invalid request body" }), {
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

    // ── Step 3: Create job ──
    const { data: jobData, error: jobError } = await supabase
      .from("brand_sync_jobs")
      .insert({
        brand_id: brandId,
        brand_slug: brandData.brand_slug,
        status: "running",
        triggered_by: adminUserId,
      })
      .select("id")
      .single();

    if (jobError || !jobData) {
      throw new Error(`Failed to create sync job: ${jobError?.message}`);
    }
    jobId = jobData.id;

    console.log(`[sync-brand-catalog] Job ${jobId} started for ${brandData.brand_name}`);

    // ── Step 2: Fetch full catalog ──
    const { products: allProducts } = await fetchShopifyCatalog(config.base_url);

    if (allProducts.length === 0) {
      throw new Error(`No products found at ${config.base_url}/products.json`);
    }

    console.log(`[sync-brand-catalog] Fetched ${allProducts.length} products from store`);

    // ── Step 3: Filter filaments ──
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

    // ── Step 4+5: Extract filaments from each product ──
    const allFilaments: ExtractedFilament[] = [];
    const extractionErrors: { handle: string; error: string }[] = [];

    for (const product of filamentProducts) {
      try {
        // Time guard: 120s total
        if (Date.now() - startTime > 120_000) {
          warnings.push(`Time limit reached after ${allFilaments.length} filaments extracted`);
          break;
        }

        const result = extractFilamentsFromProduct(product, config);
        allFilaments.push(...result.filaments);
        warnings.push(...result.warnings);
      } catch (err: any) {
        const handle = product.handle || product.title || "unknown";
        extractionErrors.push({ handle, error: err.message });
        console.error(`[sync-brand-catalog] Error extracting '${handle}':`, err.message);
      }
    }

    console.log(`[sync-brand-catalog] Extracted ${allFilaments.length} filaments, ${extractionErrors.length} errors`);

    // ── Step 6: Diff against existing database ──
    const diffResults = await diffAgainstDatabase(supabase, allFilaments, brandId);

    const newFilaments = diffResults.filter((r) => r.status === "new");
    const priceChanged = diffResults.filter((r) => r.status === "price_changed");
    const matched = diffResults.filter((r) => r.status === "matched");

    // ── Step 7: Store items in brand_sync_items ──
    const itemsToInsert = diffResults.map((r) => ({
      job_id: jobId,
      status: r.status,
      extracted_data: r.filament,
      display_name: r.filament.display_name,
      color_name: r.filament.color_family || r.filament.display_name.split(" - ").pop() || null,
      material_type: r.filament.material,
      image_url: r.filament.featured_image,
      prices: {
        usd: r.filament.price_usd,
        eur: r.filament.price_eur,
        gbp: r.filament.price_gbp,
        cad: r.filament.price_cad,
        aud: r.filament.price_aud,
      },
      variant_sku: r.filament.variant_sku,
      is_new: r.status === "new",
      existing_filament_id: r.existingId,
      price_diff: r.priceDiff,
      error_message: null,
    }));

    // Also add extraction errors as items
    for (const err of extractionErrors) {
      itemsToInsert.push({
        job_id: jobId!,
        status: "error",
        extracted_data: { handle: err.handle } as any,
        display_name: err.handle,
        color_name: null,
        material_type: null,
        image_url: null,
        prices: null as any,
        variant_sku: null,
        is_new: false,
        existing_filament_id: null,
        price_diff: null,
        error_message: err.error,
      });
    }

    // Insert in batches of 100
    for (let i = 0; i < itemsToInsert.length; i += 100) {
      const batch = itemsToInsert.slice(i, i + 100);
      const { error: insertErr } = await supabase.from("brand_sync_items").insert(batch);
      if (insertErr) {
        console.error(`[sync-brand-catalog] Error inserting items batch ${i}:`, insertErr.message);
      }
    }

    // ── Step 8: Update job with summary ──
    const durationMs = Date.now() - startTime;
    const catalogStats = {
      total_store_products: allProducts.length,
      filament_products: filamentProducts.length,
      skipped_products: allProducts.length - filamentProducts.length,
      skip_reasons: skipReasons,
    };

    const syncResultsSummary = {
      new_count: newFilaments.length,
      changed_count: priceChanged.length,
      matched_count: matched.length,
      error_count: extractionErrors.length,
    };

    await supabase
      .from("brand_sync_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round(durationMs / 1000),
        catalog_stats: catalogStats,
        sync_results_summary: syncResultsSummary,
        warnings: warnings.length > 0 ? warnings : null,
      })
      .eq("id", jobId);

    // ── Step 9: Return response ──
    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        brand_name: brandData.brand_name,
        catalog_stats: catalogStats,
        sync_results: {
          new_filaments: newFilaments.map((r) => r.filament),
          price_changed: priceChanged.map((r) => ({
            ...r.filament,
            existing_id: r.existingId,
            price_diff: r.priceDiff,
          })),
          matched: matched.length, // Don't send full matched array to keep response small
          errors: extractionErrors,
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
  } catch (err: any) {
    console.error(`[sync-brand-catalog] Fatal error:`, err.message);

    // Update job as failed if we have a job ID
    if (jobId) {
      await supabase
        .from("brand_sync_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          warnings: [`Fatal error: ${err.message}`],
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
