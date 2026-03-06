/**
 * IMPORT SYNCED FILAMENTS — Edge Function
 *
 * Takes approved items from a brand_sync_jobs run and inserts/updates
 * them into the production `filaments` table, then performs post-import
 * setup (price history, URL validation, data quality scoring).
 *
 * POST { job_id, item_ids, brand_id, brand_name, brand_slug }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// Data Quality Score
// ============================================================

function calcDataQuality(d: Record<string, any>): number {
  let score = 0;
  if (d.display_name) score += 15;
  if (d.color_hex && d.color_hex !== "#808080") score += 15;
  if (d.color_family) score += 10;
  if (d.material) score += 10;
  if (d.price_usd || d.variant_price) score += 15;
  if (d.featured_image) score += 10;
  if (d.nozzle_temp_min_c || d.nozzle_temp_max_c) score += 10;
  if (d.variant_sku) score += 5;
  if (d.product_url || d.product_url_us) score += 5;
  if (d.net_weight_g) score += 5;
  return Math.min(score, 100);
}

// ============================================================
// URL Validation (HEAD request with timeout)
// ============================================================

async function validateUrl(url: string): Promise<{ url: string; ok: boolean; status: number | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FilaScope/1.0)" },
    });
    clearTimeout(timeout);
    return { url, ok: res.ok, status: res.status };
  } catch {
    return { url, ok: false, status: null };
  }
}

// ============================================================
// Main Handler
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

  // Verify admin via getUser
  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await anonClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const adminUserId = userData.user.id;

  // Verify admin role
  const { data: roleCheck } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", adminUserId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleCheck) {
    return new Response(JSON.stringify({ error: "Admin role required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { job_id, item_ids, brand_id, brand_name, brand_slug } = await req.json();

    if (!job_id || !item_ids?.length || !brand_id || !brand_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: job_id, item_ids, brand_id, brand_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[import-synced] Starting import: ${item_ids.length} items for ${brand_name}`);

    // ── STEP 1: Load Items (batched to avoid URL length limits) ──
    const items: any[] = [];
    const BATCH_SIZE = 50;
    for (let i = 0; i < item_ids.length; i += BATCH_SIZE) {
      const batch = item_ids.slice(i, i + BATCH_SIZE);
      const { data, error: batchErr } = await supabase
        .from("brand_sync_items")
        .select("*")
        .eq("job_id", job_id)
        .in("id", batch)
        .in("status", ["new", "price_changed"]);

      if (batchErr) throw new Error(`Failed to load items batch ${i}: ${batchErr.message}`);
      if (data) items.push(...data);
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ success: true, imported: 0, updated_prices: 0, errors: 0, message: "No eligible items found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[import-synced] Loaded ${items.length} eligible items (of ${item_ids.length} requested)`);

    // ── STEP 2: Insert / Update Filaments ──
    let insertedCount = 0;
    let updatedPrices = 0;
    let errorCount = 0;
    const insertedFilaments: Array<{ id: string; itemId: string; data: Record<string, any> }> = [];
    const importErrors: string[] = [];

    for (const item of items) {
      const extracted = (item.extracted_data || {}) as Record<string, any>;
      const overrides = (item.admin_override_data || {}) as Record<string, any>;
      const merged = { ...extracted, ...overrides };

      try {
        if (item.status === "price_changed" && item.existing_filament_id) {
          // UPDATE existing filament prices only
          const priceUpdate: Record<string, any> = {
            updated_at: new Date().toISOString(),
            last_scraped_at: new Date().toISOString(),
          };
          if (merged.price_usd != null) priceUpdate.variant_price = merged.price_usd;
          if (merged.price_eur != null) priceUpdate.price_eur = merged.price_eur;
          if (merged.price_gbp != null) priceUpdate.price_gbp = merged.price_gbp;
          if (merged.price_cad != null) priceUpdate.price_cad = merged.price_cad;
          if (merged.price_aud != null) priceUpdate.price_aud = merged.price_aud;
          if (merged.variant_available != null) priceUpdate.variant_available = merged.variant_available;

          const { error: updateErr } = await supabase
            .from("filaments")
            .update(priceUpdate)
            .eq("id", item.existing_filament_id);

          if (updateErr) throw new Error(`Update failed: ${updateErr.message}`);

          // Mark sync item as imported
          await supabase
            .from("brand_sync_items")
            .update({ status: "imported", inserted_filament_id: item.existing_filament_id })
            .eq("id", item.id);

          insertedFilaments.push({ id: item.existing_filament_id, itemId: item.id, data: merged });
          updatedPrices++;
          console.log(`[import-synced] ✏️ Updated prices for ${item.display_name} (${item.existing_filament_id})`);
        } else {
          // INSERT new filament
          const { data: filament, error: insertErr } = await supabase
            .from("filaments")
            .insert({
              vendor: merged.vendor ?? brand_name,
              brand_id: brand_id,
              material: merged.material ?? item.material_type,
              product_title: merged.product_title ?? item.display_name,
              display_name: merged.display_name ?? item.display_name,
              color_family: merged.color_family ?? item.color_family,
              color_hex: merged.color_hex ?? item.color_hex,
              featured_image: merged.featured_image ?? item.image_url,
              variant_image: merged.variant_image ?? item.variant_image_url,
              nozzle_temp_min_c: merged.nozzle_temp_min_c,
              nozzle_temp_max_c: merged.nozzle_temp_max_c,
              bed_temp_min_c: merged.bed_temp_min_c,
              bed_temp_max_c: merged.bed_temp_max_c,
              diameter_nominal_mm: merged.diameter_nominal_mm ?? 1.75,
              net_weight_g: merged.net_weight_g,
              product_url: merged.product_url,
              product_url_us: merged.product_url_us,
              product_url_eu: merged.product_url_eu,
              product_url_uk: merged.product_url_uk,
              product_url_ca: merged.product_url_ca,
              product_url_au: merged.product_url_au,
              variant_price: merged.price_usd,
              price_eur: merged.price_eur,
              price_gbp: merged.price_gbp,
              price_cad: merged.price_cad,
              price_aud: merged.price_aud,
              product_handle: merged.product_handle ?? item.product_handle,
              variant_sku: merged.variant_sku ?? item.variant_sku,
              finish_type: merged.finish_type ?? item.finish_type,
              spool_material: merged.spool_material,
              pack_quantity: merged.pack_quantity ?? 1,
              print_speed_max_mms: merged.print_speed_max_mms,
              high_speed_capable: merged.high_speed_capable,
              drying_temp_c: merged.drying_temp_c,
              drying_time_hours: merged.drying_time_hours,
              variant_available: merged.variant_available ?? true,
              available_regions: merged.available_regions ?? item.available_regions,
              auto_created: true,
            })
            .select("id")
            .single();

          if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

          // Mark sync item as imported
          await supabase
            .from("brand_sync_items")
            .update({ status: "imported", inserted_filament_id: filament?.id })
            .eq("id", item.id);

          insertedFilaments.push({ id: filament!.id, itemId: item.id, data: merged });
          insertedCount++;
          console.log(`[import-synced] ✅ Inserted ${item.display_name} → ${filament!.id}`);
        }
      } catch (err: any) {
        errorCount++;
        const msg = `${item.display_name}: ${err.message}`;
        importErrors.push(msg);
        console.error(`[import-synced] ❌ ${msg}`);

        await supabase
          .from("brand_sync_items")
          .update({ status: "error", error_message: err.message })
          .eq("id", item.id);
      }
    }

    console.log(`[import-synced] Import done: ${insertedCount} inserted, ${updatedPrices} updated, ${errorCount} errors`);

    // ── STEP 4: Post-Import Setup ──
    let priceHistoryCount = 0;
    let urlsValidated = 0;
    const urlsBroken: string[] = [];
    let totalQuality = 0;
    const postErrors: string[] = [];

    // 4a) Price History
    try {
      const regionMap = [
        { field: "price_usd", altField: "variant_price", region: "US" },
        { field: "price_cad", region: "CA" },
        { field: "price_eur", region: "EU" },
        { field: "price_gbp", region: "UK" },
        { field: "price_aud", region: "AU" },
      ];

      const priceRows: Array<{ filament_id: string; price: number; region: string; source: string }> = [];

      for (const fil of insertedFilaments) {
        for (const { field, altField, region } of regionMap) {
          const price = fil.data[field] ?? (altField ? fil.data[altField] : null);
          if (price != null && price > 0) {
            priceRows.push({
              filament_id: fil.id,
              price,
              region,
              source: "catalog_sync_import",
            });
          }
        }
      }

      if (priceRows.length > 0) {
        // Batch insert in chunks of 200
        for (let i = 0; i < priceRows.length; i += 200) {
          const chunk = priceRows.slice(i, i + 200);
          const { error: phErr } = await supabase.from("price_history").insert(chunk);
          if (phErr) {
            postErrors.push(`Price history batch ${i}: ${phErr.message}`);
          } else {
            priceHistoryCount += chunk.length;
          }
        }
      }
      console.log(`[import-synced] 📊 ${priceHistoryCount} price history records created`);
    } catch (e: any) {
      postErrors.push(`Price history: ${e.message}`);
    }

    // 4b) URL Validation (batch, max 50 concurrent)
    try {
      const urlFields = [
        "product_url", "product_url_us", "product_url_eu",
        "product_url_uk", "product_url_ca", "product_url_au",
      ];

      const urlsToCheck: string[] = [];
      for (const fil of insertedFilaments) {
        for (const field of urlFields) {
          const url = fil.data[field];
          if (url && typeof url === "string" && url.startsWith("http")) {
            urlsToCheck.push(url);
          }
        }
      }

      // Validate in batches of 10 to avoid overwhelming
      for (let i = 0; i < urlsToCheck.length; i += 10) {
        const batch = urlsToCheck.slice(i, i + 10);
        const results = await Promise.allSettled(batch.map(validateUrl));
        for (const r of results) {
          if (r.status === "fulfilled") {
            urlsValidated++;
            if (!r.value.ok) {
              urlsBroken.push(r.value.url);
            }
          }
        }
      }
      console.log(`[import-synced] 🔗 ${urlsValidated} URLs validated, ${urlsBroken.length} broken`);
    } catch (e: any) {
      postErrors.push(`URL validation: ${e.message}`);
    }

    // 4c) Data Quality Score
    for (const fil of insertedFilaments) {
      totalQuality += calcDataQuality(fil.data);
    }
    const avgQuality = insertedFilaments.length > 0
      ? Math.round(totalQuality / insertedFilaments.length)
      : 0;

    // ── STEP 5: Update Job ──
    const postImportResults = {
      price_history_count: priceHistoryCount,
      urls_validated: urlsValidated,
      urls_broken: urlsBroken,
      avg_quality_score: avgQuality,
      errors: postErrors,
      completed_at: new Date().toISOString(),
    };

    await supabase
      .from("brand_sync_jobs")
      .update({
        imported_count: insertedCount + updatedPrices,
        post_import_results: postImportResults,
      })
      .eq("id", job_id);

    console.log(`[import-synced] ✅ Job ${job_id} updated with post-import results`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedCount,
        updated_prices: updatedPrices,
        errors: errorCount,
        error_details: importErrors.length > 0 ? importErrors : undefined,
        post_import: {
          price_history_points: priceHistoryCount,
          urls_validated: urlsValidated,
          urls_broken: urlsBroken,
          avg_data_quality: avgQuality,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error(`[import-synced] Fatal error:`, err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
