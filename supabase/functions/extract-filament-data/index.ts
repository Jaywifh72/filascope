/**
 * EXTRACT FILAMENT DATA — Edge Function
 *
 * Receives a product URL + adapter key, fetches product data from the store,
 * normalizes it into filament records, checks for duplicates, and stores
 * results in the onboarding tables.
 *
 * POST { job_id, source_url, adapter_key }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  COLOR_HEX_MAP,
  COLOR_FAMILY_MAP,
  ScrapingConfig,
  ExtractedFilament,
  guessColorHex,
  guessColorFamily,
  guessFinishType,
  stripMaterialPrefix,
  parseSpecsFromHtml,
  extractWeightFromText,
  detectOptionPositions,
  REGION_KEYWORDS,
  MATERIAL_KEYWORDS,
  COLOR_KEYWORDS,
} from "../_shared/filament-utils.ts";

// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// Helpers
// ============================================================

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function extractHandle(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/\/products\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function toShopifyJsonUrl(productUrl: string): string {
  const url = new URL(productUrl);
  const match = url.pathname.match(/\/products\/([^/?#]+)/);
  if (match) {
    url.pathname = url.pathname.replace(
      `/products/${match[1]}`,
      `/products/${match[1]}.json`
    );
  }
  return url.toString();
}

// ============================================================
// SUNLU Adapter
// ============================================================

function adaptSunlu(
  rawProduct: any,
  config: ScrapingConfig,
  productHandle: string
): { filaments: ExtractedFilament[]; warnings: string[] } {
  const product = rawProduct.product;
  const warnings: string[] = [];
  const filaments: ExtractedFilament[] = [];

  if (!product?.variants?.length) {
    warnings.push("No variants found in product data");
    return { filaments, warnings };
  }

  const detected = detectOptionPositions(product, config);
  const regionMap: Record<string, string> = config.variant_mapping?.region_map || {};
  const regionOption = detected.regionKey;
  const materialOption = detected.materialKey;
  const colorOption = detected.colorKey;

  // Parse specs from body_html
  const specs = parseSpecsFromHtml(product.body_html || "", config.spec_extraction || null);

  // Fallback weight extraction from variant/product titles
  if (specs.netWeight == null) {
    // Try first variant title
    const firstVariantTitle = product.variants?.[0]?.title || "";
    const variantWeight = extractWeightFromText(firstVariantTitle);
    if (variantWeight != null) {
      specs.netWeight = variantWeight;
      specs.weightSource = "variant_title";
    } else {
      // Try product title
      const titleWeight = extractWeightFromText(product.title || "");
      if (titleWeight != null) {
        specs.netWeight = titleWeight;
        specs.weightSource = "product_title";
      }
    }
  }

  // Build regional URLs from config
  const regionalUrls = config.regional_url_pattern || {};
  const buildRegionalUrl = (region: string): string | null => {
    const base = regionalUrls[region];
    if (!base) return null;
    return `${base.replace(/\/$/, "")}/products/${productHandle}`;
  };

  // Group variants by color (option3)
  const colorGroups: Record<string, any[]> = {};
  for (const variant of product.variants) {
    const colorKey = (colorOption ? variant[colorOption] : null) || variant.title;
    if (!colorGroups[colorKey]) colorGroups[colorKey] = [];
    colorGroups[colorKey].push(variant);
  }

  for (const [rawColorName, variants] of Object.entries(colorGroups)) {
    // Determine material from first variant's option2
    const materialRaw = (materialOption ? variants[0]?.[materialOption] : null) || config.default_material_type || "PLA";
    const material = materialRaw.toUpperCase();

    // Strip material prefix from color name
    const colorName = stripMaterialPrefix(rawColorName, materialRaw);

    // Extract per-region prices
    let priceUsd: number | null = null;
    let priceEur: number | null = null;
    let priceCad: number | null = null;
    let priceAud: number | null = null;
    let priceGbp: number | null = null;
    const availableRegions: string[] = [];
    let anyAvailable = false;

    for (const v of variants) {
      const regionLabel = v[regionOption] || "";
      const regionCode = regionMap[regionLabel] || null;
      const price = parseFloat(v.price);

      if (regionCode && !isNaN(price)) {
        if (price <= 0 || price > 500) {
          warnings.push(`Price warning for ${colorName} (${regionCode}): $${price}`);
        }
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

    // Use the first variant's image and SKU
    const firstVariant = variants[0];
    const featuredImage = firstVariant?.featured_image?.src ||
      product.images?.find((img: any) => img.variant_ids?.includes(firstVariant.id))?.src ||
      product.images?.[0]?.src || null;
    const variantSku = firstVariant?.sku || null;

    const productTitle = `${config.brand_name} ${material} 1KG - ${colorName}`;
    const displayName = `${material} - ${colorName}`;
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
      weight_source: specs.weightSource,
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
      spool_material: specs.spoolMaterial,
      spool_outer_d_mm: specs.spoolOuterDiameterMm,
      spool_width_mm: specs.spoolWidthMm,
      print_speed_max_mms: specs.printSpeedMax,
      high_speed_capable: material.includes("HIGH SPEED") || material.includes("HS") || (specs.printSpeedMax !== null && specs.printSpeedMax >= 300),
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
// Generic Shopify Adapter
// ============================================================

function adaptGenericShopify(
  rawProduct: any,
  config: ScrapingConfig,
  productHandle: string
): { filaments: ExtractedFilament[]; warnings: string[] } {
  const product = rawProduct.product;
  const warnings: string[] = [];
  const filaments: ExtractedFilament[] = [];

  if (!product?.variants?.length) {
    warnings.push("No variants found in product data");
    return { filaments, warnings };
  }

  const specs = parseSpecsFromHtml(product.body_html || "", config.spec_extraction || null);

  // Fallback weight extraction from variant/product titles
  if (specs.netWeight == null) {
    const firstVariantTitle = product.variants?.[0]?.title || "";
    const variantWeight = extractWeightFromText(firstVariantTitle);
    if (variantWeight != null) {
      specs.netWeight = variantWeight;
      specs.weightSource = "variant_title";
    } else {
      const titleWeight = extractWeightFromText(product.title || "");
      if (titleWeight != null) {
        specs.netWeight = titleWeight;
        specs.weightSource = "product_title";
      }
    }
  }
  const mapping = config.variant_mapping || {};
  const colorOption = mapping.color_option || "option1";
  const regionalUrls = config.regional_url_pattern || {};
  const buildRegionalUrl = (region: string): string | null => {
    const base = regionalUrls[region];
    if (!base) return null;
    return `${base.replace(/\/$/, "")}/products/${productHandle}`;
  };

  // Determine material from product title, tags, or config default
  let material = config.default_material_type || "PLA";
  const titleLower = (product.title || "").toLowerCase();
  const knownMaterials = ["petg", "pla+", "pla plus", "abs", "tpu", "asa", "nylon", "pc", "pva", "hips", "pla"];
  for (const m of knownMaterials) {
    if (titleLower.includes(m)) {
      material = m === "pla+" || m === "pla plus" ? "PLA+" : m.toUpperCase();
      break;
    }
  }

  // Group by color option
  const seenColors = new Set<string>();

  for (const variant of product.variants) {
    const colorName = variant[colorOption] || variant.title || "Default";
    if (seenColors.has(colorName)) continue;
    seenColors.add(colorName);

    const price = parseFloat(variant.price);
    if (!isNaN(price) && (price <= 0 || price > 500)) {
      warnings.push(`Price warning for ${colorName}: $${price}`);
    }

    const featuredImage = variant.featured_image?.src ||
      product.images?.find((img: any) => img.variant_ids?.includes(variant.id))?.src ||
      product.images?.[0]?.src || null;

    const productTitle = `${config.brand_name} ${material} - ${colorName}`;
    const displayName = `${material} - ${colorName}`;
    const finishType = guessFinishType(material, colorName);

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
      weight_source: specs.weightSource,
      product_url: buildRegionalUrl("US") || `${config.base_url}/products/${productHandle}`,
      product_url_us: buildRegionalUrl("US"),
      product_url_eu: buildRegionalUrl("EU"),
      product_url_uk: buildRegionalUrl("UK"),
      product_url_ca: buildRegionalUrl("CA"),
      product_url_au: buildRegionalUrl("AU"),
      price_usd: !isNaN(price) ? price : null,
      price_eur: null,
      price_gbp: null,
      price_cad: null,
      price_aud: null,
      product_handle: productHandle,
      variant_sku: variant.sku || null,
      finish_type: finishType,
      spool_material: specs.spoolMaterial,
      spool_outer_d_mm: specs.spoolOuterDiameterMm,
      spool_width_mm: specs.spoolWidthMm,
      print_speed_max_mms: specs.printSpeedMax,
      high_speed_capable: material.includes("HIGH SPEED") || material.includes("HS") || (specs.printSpeedMax !== null && specs.printSpeedMax >= 300),
      drying_temp_c: specs.dryingTemp,
      drying_time_hours: specs.dryingTime,
      variant_available: variant.available ?? true,
      available_regions: ["US"],
    };

    filaments.push(filament);
  }

  return { filaments, warnings };
}

// ============================================================
// Duplicate Detection
// ============================================================

async function checkDuplicates(
  supabase: any,
  filaments: ExtractedFilament[]
): Promise<{ filament: ExtractedFilament; isDuplicate: boolean; existingId: string | null }[]> {
  const results: { filament: ExtractedFilament; isDuplicate: boolean; existingId: string | null }[] = [];

  for (const filament of filaments) {
    let existingId: string | null = null;

    // Check by variant_sku first (most precise)
    if (filament.variant_sku) {
      const { data } = await supabase
        .from("filaments")
        .select("id")
        .eq("brand_id", filament.brand_id)
        .eq("variant_sku", filament.variant_sku)
        .maybeSingle();
      if (data) existingId = data.id;
    }

    // Fallback: check by brand_id + material + similar product_title
    if (!existingId) {
      const { data } = await supabase
        .from("filaments")
        .select("id, product_title")
        .eq("brand_id", filament.brand_id)
        .eq("material", filament.material)
        .ilike("product_title", `%${filament.display_name.split(" - ").pop() || ""}%`)
        .limit(1);
      if (data?.length) existingId = data[0].id;
    }

    results.push({
      filament,
      isDuplicate: !!existingId,
      existingId,
    });
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
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Service-role client for DB operations (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Parse request body ──
  let jobId: string;
  let sourceUrl: string;
  let adapterKey: string;

  try {
    const body = await req.json();
    jobId = body.job_id;
    sourceUrl = body.source_url;
    adapterKey = body.adapter_key;
    if (!jobId || !sourceUrl || !adapterKey) {
      throw new Error("Missing required fields: job_id, source_url, adapter_key");
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Helper to fail the job
  const failJob = async (error: string) => {
    console.error(`[extract-filament-data] Job ${jobId} failed: ${error}`);
    await supabase
      .from("filament_onboarding_jobs")
      .update({
        status: "failed",
        extraction_errors: { error },
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
    // ── Update job status to 'extracting' ──
    await supabase
      .from("filament_onboarding_jobs")
      .update({
        status: "extracting",
        started_at: new Date().toISOString(),
        admin_user_id: adminUserId,
      })
      .eq("id", jobId);

    // ── Load config by adapter_key ──
    const { data: configData, error: configError } = await supabase
      .from("brand_scraping_configs")
      .select("*")
      .eq("adapter_key", adapterKey)
      .eq("is_active", true)
      .maybeSingle();

    if (configError || !configData) {
      return failJob(`No active config found for adapter_key: ${adapterKey}`);
    }

    const config = configData as ScrapingConfig;
    const productHandle = extractHandle(sourceUrl);
    const isCollectionUrl = !productHandle; // homepage, /collections/, etc.

    // ── Fetch product data ──
    let rawProduct: any;
    let allProducts: any[] | null = null; // populated for collection URLs

    if (config.platform === "shopify" || config.scrape_method === "json_endpoint") {
      if (isCollectionUrl) {
        // Shopify store/collection URL — fetch all products via /products.json
        const baseUrl = new URL(sourceUrl);
        const allFetched: any[] = [];
        let page = 1;
        const maxPages = 10; // safety limit: 250 * 10 = 2500 products max

        console.log(`[extract-filament-data] Collection URL detected — fetching all products from ${baseUrl.origin}/products.json`);

        while (page <= maxPages) {
          const pageUrl = `${baseUrl.origin}/products.json?limit=250&page=${page}`;
          const response = await fetch(pageUrl, {
            headers: {
              "User-Agent": CHROME_UA,
              Accept: "application/json",
              "Accept-Language": "en-US,en;q=0.9",
            },
          });

          if (!response.ok) {
            if (page === 1) {
              return failJob(`HTTP ${response.status} fetching ${pageUrl}. Make sure this is a Shopify store.`);
            }
            break;
          }

          const data = await response.json();
          const products = data?.products;
          if (!products || !Array.isArray(products) || products.length === 0) break;

          allFetched.push(...products);
          console.log(`[extract-filament-data] Page ${page}: fetched ${products.length} products (total: ${allFetched.length})`);

          if (products.length < 250) break;
          page++;
        }

        if (allFetched.length === 0) {
          return failJob(`No products found at ${baseUrl.origin}/products.json — is this a Shopify store?`);
        }

        allProducts = allFetched;
        // Set rawProduct to first product for compatibility, actual processing uses allProducts below
        rawProduct = { product: allFetched[0] };
      } else {
        // Single Shopify product JSON endpoint
        const jsonUrl = toShopifyJsonUrl(sourceUrl);
        console.log(`[extract-filament-data] Fetching Shopify JSON: ${jsonUrl}`);

        const response = await fetch(jsonUrl, {
          headers: {
            "User-Agent": CHROME_UA,
            Accept: "application/json",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        if (!response.ok) {
          return failJob(`HTTP ${response.status} fetching ${jsonUrl}`);
        }

        rawProduct = await response.json();

        if (!rawProduct?.product) {
          return failJob("Invalid Shopify JSON response — no product object");
        }
      }
    } else {
      // Non-Shopify platforms require a product URL
      if (isCollectionUrl) {
        return failJob(
          `This URL doesn't point to a specific product page. ` +
          `For ${config.platform} stores, please provide a direct product URL ` +
          `(e.g. containing /products/ or /product/ in the path).`
        );
      }

      // Non-Shopify: fetch HTML, try JSON-LD extraction
      console.log(`[extract-filament-data] Fetching HTML: ${sourceUrl}`);
      const response = await fetch(sourceUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "text/html",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!response.ok) {
        return failJob(`HTTP ${response.status} fetching ${sourceUrl}`);
      }

      const html = await response.text();
      // Wrap HTML in a pseudo-product for adapters
      rawProduct = {
        product: {
          title: config.brand_name + " Product",
          body_html: html,
          handle: productHandle,
          variants: [],
          images: [],
        },
        _html: html,
      };
    }

    // ── Route to adapter ──
    let adapterResult: { filaments: ExtractedFilament[]; warnings: string[] };

    if (allProducts) {
      // Collection mode: process each product through the adapter
      const allFilaments: ExtractedFilament[] = [];
      const allWarnings: string[] = [];
      
      for (const product of allProducts) {
        const handle = product.handle || product.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unknown';
        const wrappedProduct = { product };
        
        let result: { filaments: ExtractedFilament[]; warnings: string[] };
        switch (adapterKey) {
          case "sunlu":
            result = adaptSunlu(wrappedProduct, config, handle);
            break;
          default:
            result = adaptGenericShopify(wrappedProduct, config, handle);
            break;
        }
        
        allFilaments.push(...result.filaments);
        allWarnings.push(...result.warnings);
      }
      
      adapterResult = { filaments: allFilaments, warnings: allWarnings };
      console.log(`[extract-filament-data] Collection mode: processed ${allProducts.length} products → ${allFilaments.length} filaments`);
    } else {
      switch (adapterKey) {
        case "sunlu":
          adapterResult = adaptSunlu(rawProduct, config, productHandle!);
          break;
        default:
          adapterResult = adaptGenericShopify(rawProduct, config, productHandle!);
          break;
      }
    }

    const { filaments, warnings } = adapterResult;

    if (filaments.length === 0) {
      return failJob("No filaments could be extracted from the product data");
    }

    console.log(`[extract-filament-data] Extracted ${filaments.length} filaments, ${warnings.length} warnings`);

    // ── Duplicate detection ──
    const duplicateResults = await checkDuplicates(supabase, filaments);
    const duplicateCount = duplicateResults.filter((r) => r.isDuplicate).length;

    // ── Affiliate program check ──
    interface AffiliateStatus {
      has_program: boolean;
      covered_regions: string[];
      missing_regions: string[];
      program_name?: string;
    }

    let affiliateStatus: AffiliateStatus = {
      has_program: false,
      covered_regions: [],
      missing_regions: [],
    };

    try {
      const { data: programs } = await supabase
        .from("affiliate_programs")
        .select("brand_name, region_code, is_active")
        .eq("brand_name", config.brand_name)
        .eq("is_active", true);

      if (programs && programs.length > 0) {
        const coveredRegions = programs.map((p: any) => p.region_code as string);
        const isGlobal = coveredRegions.includes("GLOBAL");

        // Collect all regions the extracted filaments cover
        const filamentRegions = new Set<string>();
        for (const f of filaments) {
          if (f.available_regions) {
            for (const r of f.available_regions) filamentRegions.add(r);
          }
          if (f.product_url_us) filamentRegions.add("US");
          if (f.product_url_eu) filamentRegions.add("EU");
          if (f.product_url_uk) filamentRegions.add("UK");
          if (f.product_url_ca) filamentRegions.add("CA");
          if (f.product_url_au) filamentRegions.add("AU");
        }

        const missingRegions = isGlobal
          ? []
          : [...filamentRegions].filter((r) => !coveredRegions.includes(r));

        affiliateStatus = {
          has_program: true,
          covered_regions: coveredRegions,
          missing_regions: missingRegions,
          program_name: programs[0].brand_name,
        };

        if (missingRegions.length > 0) {
          warnings.push(`Affiliate missing for regions: ${missingRegions.join(", ")}`);
        }
      } else {
        warnings.push("No affiliate program found for this brand");

        // Determine all filament regions for the gap report
        const filamentRegions = new Set<string>();
        for (const f of filaments) {
          if (f.available_regions) {
            for (const r of f.available_regions) filamentRegions.add(r);
          }
        }
        affiliateStatus.missing_regions = [...filamentRegions];
      }
    } catch (affErr: any) {
      console.warn("[extract-filament-data] Affiliate check failed (non-blocking):", affErr.message);
      warnings.push("Affiliate check failed — could not query programs");
    }

    // Tag each filament with affiliate gaps
    for (const f of filaments) {
      (f as any).affiliate_gaps = affiliateStatus.missing_regions.length > 0
        ? affiliateStatus.missing_regions.filter((r) =>
            (f.available_regions || []).includes(r) ||
            (r === "US" && f.product_url_us) ||
            (r === "EU" && f.product_url_eu) ||
            (r === "UK" && f.product_url_uk) ||
            (r === "CA" && f.product_url_ca) ||
            (r === "AU" && f.product_url_au)
          )
        : [];
    }

    // ── Store results ──
    const extractionErrors = warnings.length > 0 ? { warnings } : null;

    await supabase
      .from("filament_onboarding_jobs")
      .update({
        status: "extracted",
        raw_data: rawProduct,
        extracted_filaments: filaments,
        extraction_errors: extractionErrors,
        duplicate_count: duplicateCount,
        affiliate_status: affiliateStatus,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // ── Insert onboarding items ──
    const items = duplicateResults.map((r) => ({
      job_id: jobId,
      status: r.isDuplicate ? "duplicate" : "pending",
      extracted_data: r.filament,
      display_name: r.filament.display_name,
      color_name: r.filament.color_family || r.filament.display_name.split(" - ").pop() || null,
      material_type: r.filament.material,
      image_url: r.filament.featured_image,
      price_usd: r.filament.price_usd,
      price_eur: r.filament.price_eur,
      price_cad: r.filament.price_cad,
      price_gbp: r.filament.price_gbp,
      price_aud: r.filament.price_aud,
      variant_sku: r.filament.variant_sku,
      is_duplicate: r.isDuplicate,
      existing_filament_id: r.existingId,
    }));

    const { error: insertError } = await supabase
      .from("filament_onboarding_items")
      .insert(items);

    if (insertError) {
      console.error("[extract-filament-data] Error inserting items:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        extracted_count: filaments.length,
        duplicate_count: duplicateCount,
        warnings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return failJob(err.message || "Unknown extraction error");
  }
});
