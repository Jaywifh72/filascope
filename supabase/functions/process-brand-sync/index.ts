/**
 * PROCESS BRAND SYNC — Phase 2: Classify, Extract, Diff, Store
 *
 * Receives fetched products from sync-brand-catalog (via frontend),
 * classifies them as filaments, extracts variant data, diffs against
 * the existing database, and stores results in brand_sync_items.
 *
 * POST { job_id, products: [...], brand_id, config_id }
 * Returns { success, new_count, changed_count, matched_count, error_count }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ScrapingConfig,
  ExtractedFilament,
  classifyProduct,
  extractFilamentsFromProduct,
  diffAgainstDatabase,
} from "../_shared/catalog-sync-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  if (token === serviceRoleKey) {
    isAuthorized = true;
  } else if (token) {
    try {
      const uc = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: ud } = await uc.auth.getUser(token);
      if (ud?.user?.id) {
        const { data: rd } = await uc
          .from("user_roles").select("role")
          .eq("user_id", ud.user.id).eq("role", "admin").maybeSingle();
        if (rd) isAuthorized = true;
      }
    } catch { /* auth failed */ }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const { job_id, products, brand_id, config_id } = body;

    if (!job_id || !products || !brand_id || !config_id) {
      return new Response(
        JSON.stringify({ error: "Missing required: job_id, products, brand_id, config_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startTime = Date.now();
    console.log(`[process] Job ${job_id}: processing ${products.length} products`);

    // Load config
    const { data: configData } = await supabase
      .from("brand_scraping_configs").select("*").eq("id", config_id).maybeSingle();
    if (!configData) {
      return new Response(JSON.stringify({ error: "Config not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const config = configData as ScrapingConfig;

    // Classify products
    const filamentProducts: any[] = [];
    const skipReasons: Record<string, number> = {};

    for (const product of products) {
      const cls = classifyProduct(product);
      if (cls.isFilament) filamentProducts.push(product);
      else skipReasons[cls.reason] = (skipReasons[cls.reason] || 0) + 1;
    }

    console.log(`[process] Filaments: ${filamentProducts.length}, skipped: ${products.length - filamentProducts.length}`);

    // Extract filaments
    const allFilaments: ExtractedFilament[] = [];
    const extractionErrors: { handle: string; error: string }[] = [];
    const warnings: string[] = [];

    for (const product of filamentProducts) {
      try {
        if (Date.now() - startTime > 50_000) {
          warnings.push(`Time limit after ${allFilaments.length} filaments`);
          break;
        }
        const result = extractFilamentsFromProduct(product, config);
        allFilaments.push(...result.filaments);
        warnings.push(...result.warnings);
      } catch (err: unknown) {
        const h = product.handle || product.title || "unknown";
        extractionErrors.push({ handle: h, error: err instanceof Error ? err.message : "Unknown" });
      }
    }

    console.log(`[process] Extracted ${allFilaments.length} filaments, ${extractionErrors.length} errors`);

    // Diff against database
    const diffResults = await diffAgainstDatabase(supabase, allFilaments, brand_id);
    const newCount = diffResults.filter((r) => r.status === "new").length;
    const changedCount = diffResults.filter((r) => r.status === "price_changed").length;
    const matchedCount = diffResults.filter((r) => r.status === "matched").length;

    // Store items in brand_sync_items
    const itemsToInsert = diffResults.map((r) => ({
      job_id,
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

    // Add extraction errors
    for (const err of extractionErrors) {
      itemsToInsert.push({
        job_id, status: "error",
        extracted_data: { handle: err.handle } as any,
        display_name: err.handle,
        color_name: null, material_type: null, color_hex: null, color_family: null,
        finish_type: null, image_url: null, variant_image_url: null,
        price_usd: null, price_eur: null, price_gbp: null, price_cad: null, price_aud: null,
        variant_sku: null, product_handle: null, available_regions: null,
        is_new: false, existing_filament_id: null, price_diff: null,
        error_message: err.error,
      });
    }

    // Batch insert
    for (let i = 0; i < itemsToInsert.length; i += 100) {
      const batch = itemsToInsert.slice(i, i + 100);
      const { error: insertErr } = await supabase.from("brand_sync_items").insert(batch);
      if (insertErr) console.error(`[process] Insert batch ${i} error:`, insertErr.message);
    }

    // Update job
    await supabase.from("brand_sync_jobs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      filament_products_found: filamentProducts.length,
      skipped_products: products.length - filamentProducts.length,
      skip_reasons: skipReasons,
      new_count: newCount,
      changed_count: changedCount,
      matched_count: matchedCount,
      error_count: extractionErrors.length,
      warnings: warnings.length > 0 ? warnings : null,
      errors: extractionErrors.length > 0 ? extractionErrors : null,
    }).eq("id", job_id);

    const durationMs = Date.now() - startTime;
    console.log(`[process] Complete in ${durationMs}ms: ${newCount} new, ${changedCount} changed, ${matchedCount} matched`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id,
        new_count: newCount,
        changed_count: changedCount,
        matched_count: matchedCount,
        error_count: extractionErrors.length,
        filament_products_found: filamentProducts.length,
        skipped_products: products.length - filamentProducts.length,
        warnings,
        duration_ms: durationMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[process] Fatal:`, msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
