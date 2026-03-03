import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- Types ----------

interface RequestBody {
  job_id: string;
  item_ids: string[];
}

interface ExtractedData {
  product_title?: string;
  display_name?: string;
  material?: string;
  color_name?: string;
  color_hex?: string;
  color_family?: string;
  featured_image?: string;
  variant_sku?: string;
  variant_price?: number;
  variant_compare_at_price?: number;
  price_cad?: number;
  price_eur?: number;
  price_gbp?: number;
  price_aud?: number;
  price_jpy?: number;
  product_url?: string;
  product_url_ca?: string;
  product_url_uk?: string;
  product_url_eu?: string;
  product_url_au?: string;
  product_url_jp?: string;
  nozzle_temp_min_c?: number;
  nozzle_temp_max_c?: number;
  bed_temp_min_c?: number;
  bed_temp_max_c?: number;
  diameter_nominal_mm?: number;
  net_weight_g?: number;
  density_g_cm3?: number;
  finish_type?: string;
  product_line_id?: string;
  [key: string]: unknown;
}

interface InsertResult {
  item_id: string;
  status: "inserted" | "duplicate" | "skipped" | "error";
  filament_id?: string;
  error?: string;
}

// ---------- Helpers ----------

/** Generate a URL-safe slug: "sunlu-pla-white" */
function generateSlug(vendor: string, material: string, colorName: string): string {
  const parts = [vendor, material, colorName]
    .filter(Boolean)
    .map((p) =>
      p
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  return parts.join("-");
}

// ---------- Main handler ----------

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: verify JWT via getClaims ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller's JWT
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Use service-role client for all DB operations (bypasses RLS)
    const db = createClient(supabaseUrl, serviceRoleKey);

    // Admin role check
    const { data: roleRow } = await db
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse request body ---
    const body: RequestBody = await req.json();
    const { job_id, item_ids } = body;

    if (!job_id || !Array.isArray(item_ids) || item_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "job_id and non-empty item_ids array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Fetch the job to get brand info ---
    const { data: job, error: jobErr } = await db
      .from("filament_onboarding_jobs")
      .select("id, brand_id, brand_name, status")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return new Response(
        JSON.stringify({ error: `Job not found: ${job_id}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update job status to "inserting"
    await db
      .from("filament_onboarding_jobs")
      .update({ status: "inserting" })
      .eq("id", job_id);

    // --- Fetch items eligible for insert ---
    const { data: items, error: itemsErr } = await db
      .from("filament_onboarding_items")
      .select("*")
      .eq("job_id", job_id)
      .in("id", item_ids)
      .in("status", ["selected", "pending", "extracted"]); // accept these statuses

    if (itemsErr) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch items: ${itemsErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency: items already inserted are silently skipped
    const alreadyInsertedIds = item_ids.filter(
      (id) => !items?.find((i: any) => i.id === id)
    );

    const results: InsertResult[] = [];
    let insertedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const skippedCount = alreadyInsertedIds.length;

    // Mark already-inserted IDs as skipped in results
    for (const id of alreadyInsertedIds) {
      results.push({ item_id: id, status: "skipped" });
    }

    // --- Process each eligible item ---
    for (const item of items ?? []) {
      try {
        // Merge extracted_data with admin overrides (overrides win)
        const extracted: ExtractedData = (item.extracted_data as ExtractedData) ?? {};
        const overrides: Partial<ExtractedData> =
          (item.admin_override_data as Partial<ExtractedData>) ?? {};
        const merged: ExtractedData = { ...extracted, ...overrides };

        const vendor = job.brand_name ?? "Unknown";
        const material = merged.material ?? "PLA";
        const colorName = merged.color_name ?? merged.display_name ?? "Unknown";

        // --- Duplicate check: brand_id + variant_sku ---
        if (merged.variant_sku) {
          const { data: dup } = await db
            .from("filaments")
            .select("id")
            .eq("brand_id", job.brand_id)
            .eq("variant_sku", merged.variant_sku)
            .maybeSingle();

          if (dup) {
            // Mark item as duplicate
            await db
              .from("filament_onboarding_items")
              .update({
                status: "duplicate",
                existing_filament_id: dup.id,
              })
              .eq("id", item.id);

            duplicateCount++;
            results.push({
              item_id: item.id,
              status: "duplicate",
              filament_id: dup.id,
            });
            continue;
          }
        }

        // --- Build the filament row ---
        const slug = generateSlug(vendor, material, colorName);
        const newProductId = crypto.randomUUID();

        const filamentRow = {
          product_id: newProductId,
          product_title: merged.product_title ?? `${vendor} ${material} ${colorName}`,
          display_name: merged.display_name ?? colorName,
          vendor,
          brand_id: job.brand_id,
          material: merged.material ?? null,
          color_family: merged.color_family ?? null,
          color_hex: merged.color_hex ?? null,
          featured_image: merged.featured_image ?? null,
          variant_sku: merged.variant_sku ?? null,
          variant_price: merged.variant_price ?? null,
          variant_compare_at_price: merged.variant_compare_at_price ?? null,
          variant_available: true,
          price_cad: merged.price_cad ?? null,
          price_eur: merged.price_eur ?? null,
          price_gbp: merged.price_gbp ?? null,
          price_aud: merged.price_aud ?? null,
          price_jpy: merged.price_jpy ?? null,
          product_url: merged.product_url ?? null,
          product_url_ca: merged.product_url_ca ?? null,
          product_url_uk: merged.product_url_uk ?? null,
          product_url_eu: merged.product_url_eu ?? null,
          product_url_au: merged.product_url_au ?? null,
          product_url_jp: merged.product_url_jp ?? null,
          product_handle: slug,
          nozzle_temp_min_c: merged.nozzle_temp_min_c ?? null,
          nozzle_temp_max_c: merged.nozzle_temp_max_c ?? null,
          bed_temp_min_c: merged.bed_temp_min_c ?? null,
          bed_temp_max_c: merged.bed_temp_max_c ?? null,
          diameter_nominal_mm: merged.diameter_nominal_mm ?? 1.75,
          net_weight_g: merged.net_weight_g ?? null,
          density_g_cm3: merged.density_g_cm3 ?? null,
          finish_type: merged.finish_type ?? null,
          product_line_id: merged.product_line_id ?? null,
          sync_enabled: false,
          auto_created: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // --- Insert into filaments ---
        const { data: inserted, error: insertErr } = await db
          .from("filaments")
          .insert(filamentRow)
          .select("id")
          .single();

        if (insertErr) {
          // Handle unique-constraint violations as duplicates
          if (insertErr.code === "23505") {
            await db
              .from("filament_onboarding_items")
              .update({ status: "duplicate" })
              .eq("id", item.id);
            duplicateCount++;
            results.push({ item_id: item.id, status: "duplicate", error: insertErr.message });
          } else {
            await db
              .from("filament_onboarding_items")
              .update({ status: "error", error_message: insertErr.message })
              .eq("id", item.id);
            errorCount++;
            results.push({ item_id: item.id, status: "error", error: insertErr.message });
          }
          continue;
        }

        // --- Mark item as inserted ---
        await db
          .from("filament_onboarding_items")
          .update({
            status: "inserted",
            inserted_filament_id: inserted.id,
          })
          .eq("id", item.id);

        insertedCount++;
        results.push({
          item_id: item.id,
          status: "inserted",
          filament_id: inserted.id,
        });
      } catch (err) {
        // Catch unexpected errors for this item
        const msg = err instanceof Error ? err.message : String(err);
        await db
          .from("filament_onboarding_items")
          .update({ status: "error", error_message: msg })
          .eq("id", item.id);
        errorCount++;
        results.push({ item_id: item.id, status: "error", error: msg });
      }
    }

    // --- Update job with final counts ---
    await db
      .from("filament_onboarding_jobs")
      .update({
        status: "completed",
        inserted_count: insertedCount,
        skipped_count: skippedCount,
        duplicate_count: duplicateCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    // --- Return summary ---
    return new Response(
      JSON.stringify({
        success: true,
        inserted: insertedCount,
        duplicates: duplicateCount,
        skipped: skippedCount,
        errors: errorCount,
        details: results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("insert-onboarded-filaments error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
