/**
 * POST-IMPORT FILAMENT SETUP — Edge Function
 *
 * Called after filaments are imported via the onboarding tool.
 * Performs 5 setup steps: price history, URL validation, TD queuing,
 * data quality scoring, and job result storage.
 *
 * POST { filament_ids: string[], brand_id: string, job_id: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PostImportResults {
  price_history_initialized: number;
  urls_validated: number;
  urls_broken: string[];
  td_status: "queued" | "not_available" | "brand_has_td";
  avg_data_quality: number;
  quality_warnings: string[];
  completed_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const errors: string[] = [];

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate caller is authenticated
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse input ──
    const { filament_ids, brand_id, job_id } = await req.json();
    if (!filament_ids?.length || !brand_id || !job_id) {
      return new Response(
        JSON.stringify({ error: "Missing filament_ids, brand_id, or job_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📦 Post-import setup for ${filament_ids.length} filaments, job ${job_id}`);

    // ── Fetch all filaments ──
    const { data: filaments, error: fetchErr } = await supabase
      .from("filaments")
      .select("*")
      .in("id", filament_ids);

    if (fetchErr || !filaments?.length) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch filaments", detail: fetchErr?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Get brand info ──
    const { data: brand } = await supabase
      .from("automated_brands")
      .select("brand_name")
      .eq("id", brand_id)
      .single();
    const brandName = brand?.brand_name ?? "Unknown";

    const results: PostImportResults = {
      price_history_initialized: 0,
      urls_validated: 0,
      urls_broken: [],
      td_status: "not_available",
      avg_data_quality: 0,
      quality_warnings: [],
      completed_at: "",
    };

    // ================================================================
    // STEP 1 — Initialize Price History
    // ================================================================
    try {
      console.log("📊 Step 1: Initializing price history...");
      const priceRows: Array<{
        filament_id: string;
        price: number;
        region: string;
        source: string;
      }> = [];

      const regionMap: Array<{ field: string; region: string }> = [
        { field: "variant_price", region: "US" },
        { field: "price_cad", region: "CA" },
        { field: "price_eur", region: "EU" },
        { field: "price_gbp", region: "UK" },
        { field: "price_aud", region: "AU" },
      ];

      for (const fil of filaments) {
        for (const { field, region } of regionMap) {
          const price = (fil as any)[field];
          if (price != null && price > 0) {
            priceRows.push({
              filament_id: fil.id,
              price,
              region,
              source: "onboarding_import",
            });
          }
        }
      }

      if (priceRows.length > 0) {
        const { error: phErr } = await supabase.from("price_history").insert(priceRows);
        if (phErr) {
          errors.push(`Step 1: price_history insert failed: ${phErr.message}`);
        } else {
          results.price_history_initialized = priceRows.length;
        }
      }
      console.log(`  ✅ ${results.price_history_initialized} price history rows created`);
    } catch (e: any) {
      errors.push(`Step 1 failed: ${e.message}`);
    }

    // ================================================================
    // STEP 2 — Validate Product URLs
    // ================================================================
    try {
      console.log("🔗 Step 2: Validating product URLs...");
      const urlFields = [
        "product_url",
        "product_url_ca",
        "product_url_eu",
        "product_url_uk",
        "product_url_au",
      ] as const;

      const urlChecks: Array<{ filamentId: string; url: string; field: string }> = [];
      for (const fil of filaments) {
        for (const field of urlFields) {
          const url = (fil as any)[field];
          if (url) {
            urlChecks.push({ filamentId: fil.id, url, field });
          }
        }
      }

      results.urls_validated = urlChecks.length;

      // Process in batches of 5
      for (let i = 0; i < urlChecks.length; i += 5) {
        const batch = urlChecks.slice(i, i + 5);
        const batchResults = await Promise.allSettled(
          batch.map(async ({ url, filamentId, field }) => {
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 5000);
              const resp = await fetch(url, {
                method: "HEAD",
                headers: { "User-Agent": "FilaScope-LinkCheck/1.0" },
                signal: controller.signal,
                redirect: "follow",
              });
              clearTimeout(timeout);
              if (!resp.ok) {
                return { broken: true, url, reason: `HTTP ${resp.status}` };
              }
              return { broken: false };
            } catch (e: any) {
              return { broken: true, url, reason: e.name === "AbortError" ? "timeout" : e.message };
            }
          })
        );

        for (const r of batchResults) {
          if (r.status === "fulfilled" && r.value.broken) {
            results.urls_broken.push(r.value.url!);
          }
        }
      }

      if (results.urls_broken.length > 0) {
        results.quality_warnings.push(
          `${results.urls_broken.length} broken URL(s) detected`
        );
      }
      console.log(`  ✅ ${results.urls_validated} URLs checked, ${results.urls_broken.length} broken`);
    } catch (e: any) {
      errors.push(`Step 2 failed: ${e.message}`);
    }

    // ================================================================
    // STEP 3 — Queue TD Discovery
    // ================================================================
    try {
      console.log("🔬 Step 3: Checking TD reference data...");
      const { data: tdRefs } = await supabase
        .from("td_reference_values")
        .select("id")
        .ilike("brand_name", brandName)
        .limit(1);

      if (tdRefs && tdRefs.length > 0) {
        // Brand has TD references — queue new filaments for matching
        const tdLogs = filament_ids.map((fid: string) => ({
          filament_id: fid,
          td_value: null as any,
          source: "onboarding_auto",
          confidence: "pending",
          status: "pending",
          notes: "Queued by post-import setup for TD matching",
        }));

        const { error: tdErr } = await supabase.from("td_population_log").insert(tdLogs);
        if (tdErr) {
          errors.push(`Step 3: td_population_log insert failed: ${tdErr.message}`);
          results.td_status = "brand_has_td";
        } else {
          results.td_status = "queued";
        }
        console.log(`  ✅ ${filament_ids.length} filaments queued for TD matching`);
      } else {
        results.td_status = "not_available";
        console.log("  ℹ️ TD data not available for this brand");
      }
    } catch (e: any) {
      errors.push(`Step 3 failed: ${e.message}`);
    }

    // ================================================================
    // STEP 4 — Calculate Data Quality Score
    // ================================================================
    try {
      console.log("📋 Step 4: Calculating data quality scores...");
      let totalScore = 0;

      for (const fil of filaments) {
        const f = fil as any;
        let filled = 0;
        const totalFields = 9;
        const warnings: string[] = [];
        const name = f.display_name || f.product_title || "Unknown";

        if (f.display_name) filled++;
        else warnings.push(`${name}: missing display_name`);

        if (f.color_family) filled++;
        else warnings.push(`${name}: missing color_family`);

        if (f.color_hex && f.color_hex !== "#808080") filled++;
        else warnings.push(`${name}: missing or default color_hex`);

        if (f.material) filled++;
        else warnings.push(`${name}: missing material`);

        // Any price
        if (f.variant_price || f.price_cad || f.price_eur || f.price_gbp || f.price_aud) filled++;
        else warnings.push(`${name}: no prices`);

        // Any regional URL
        if (f.product_url || f.product_url_ca || f.product_url_eu || f.product_url_uk || f.product_url_au) filled++;
        else warnings.push(`${name}: no product URLs`);

        if (f.featured_image) filled++;
        else warnings.push(`${name}: missing featured_image`);

        if (f.nozzle_temp_min_c || f.nozzle_temp_max_c) filled++;
        else warnings.push(`${name}: missing nozzle temps`);

        if (f.bed_temp_min_c || f.bed_temp_max_c) filled++;
        else warnings.push(`${name}: missing bed temps`);

        const score = Math.round((filled / totalFields) * 100);
        totalScore += score;
        results.quality_warnings.push(...warnings);
      }

      results.avg_data_quality = Math.round(totalScore / filaments.length);
      console.log(`  ✅ Average data quality: ${results.avg_data_quality}%`);
    } catch (e: any) {
      errors.push(`Step 4 failed: ${e.message}`);
    }

    // ================================================================
    // STEP 5 — Update Job Record
    // ================================================================
    try {
      console.log("💾 Step 5: Storing post-import results...");
      results.completed_at = new Date().toISOString();

      const { error: updateErr } = await supabase
        .from("filament_onboarding_jobs")
        .update({ post_import_results: results })
        .eq("id", job_id);

      if (updateErr) {
        errors.push(`Step 5: job update failed: ${updateErr.message}`);
      }
      console.log("  ✅ Job record updated");
    } catch (e: any) {
      errors.push(`Step 5 failed: ${e.message}`);
    }

    // ── Response ──
    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Fatal error in post-import-filament-setup:", e);
    return new Response(
      JSON.stringify({ success: false, error: e.message, errors }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
