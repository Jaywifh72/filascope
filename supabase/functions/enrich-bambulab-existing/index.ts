import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enrichBambuLabProduct, generateBambuLabProductLineId, extractBambuLabFinishType } from "../_shared/bambulab-defaults.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * One-time migration function to backfill finish_type and product_line_id
 * for existing Bambu Lab products.
 * 
 * Usage:
 * POST /enrich-bambulab-existing
 * Body: { "dryRun": true, "limit": 50 }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun ?? false;
    const limit = body.limit ?? 500;

    console.log(`[BAMBU-ENRICH] Starting enrichment (dryRun: ${dryRun}, limit: ${limit})`);

    // Fetch all Bambu Lab filaments that need enrichment
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, product_id, product_line_id, finish_type, material, is_nozzle_abrasive, high_speed_capable")
      .eq("vendor", "Bambu Lab")
      .or("product_line_id.is.null,finish_type.is.null")
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[BAMBU-ENRICH] Found ${filaments?.length || 0} filaments needing enrichment`);

    const results: Array<{
      id: string;
      title: string;
      productLineId: string;
      finishType: string;
      isAbrasive: boolean | null;
      highSpeed: boolean | null;
      action: "updated" | "skipped" | "error";
      error?: string;
    }> = [];

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const filament of filaments || []) {
      try {
        // Extract slug from product_id if available, otherwise use title
        let slugOrTitle = filament.product_title;
        if (filament.product_id) {
          // product_id format: "bambu-{slug}-{color}"
          const match = filament.product_id.match(/^bambu-(.+?)-[^-]+$/);
          if (match) {
            slugOrTitle = match[1];
          }
        }

        // Get enrichment data
        const enrichment = enrichBambuLabProduct(
          slugOrTitle,
          filament.product_line_id,
          filament.finish_type
        );

        // Skip if already has both values
        if (filament.product_line_id && filament.finish_type) {
          skipped++;
          results.push({
            id: filament.id,
            title: filament.product_title,
            productLineId: filament.product_line_id,
            finishType: filament.finish_type,
            isAbrasive: filament.is_nozzle_abrasive,
            highSpeed: filament.high_speed_capable,
            action: "skipped",
          });
          continue;
        }

        console.log(`[BAMBU-ENRICH] Processing: ${filament.product_title}`);
        console.log(`  -> product_line_id: ${enrichment.productLineId}`);
        console.log(`  -> finish_type: ${enrichment.finishType}`);
        console.log(`  -> is_nozzle_abrasive: ${enrichment.isNozzleAbrasive}`);
        console.log(`  -> high_speed_capable: ${enrichment.highSpeedCapable}`);

        if (!dryRun) {
          const updateData: Record<string, unknown> = {};
          
          if (!filament.product_line_id) {
            updateData.product_line_id = enrichment.productLineId;
          }
          if (!filament.finish_type) {
            updateData.finish_type = enrichment.finishType;
          }
          if (enrichment.isNozzleAbrasive !== null && filament.is_nozzle_abrasive === null) {
            updateData.is_nozzle_abrasive = enrichment.isNozzleAbrasive;
          }
          if (enrichment.highSpeedCapable !== null && filament.high_speed_capable === null) {
            updateData.high_speed_capable = enrichment.highSpeedCapable;
          }

          const { error: updateError } = await supabase
            .from("filaments")
            .update(updateData)
            .eq("id", filament.id);

          if (updateError) {
            console.error(`  Failed to update: ${updateError.message}`);
            errors++;
            results.push({
              id: filament.id,
              title: filament.product_title,
              productLineId: enrichment.productLineId,
              finishType: enrichment.finishType,
              isAbrasive: enrichment.isNozzleAbrasive,
              highSpeed: enrichment.highSpeedCapable,
              action: "error",
              error: updateError.message,
            });
            continue;
          }
        }

        updated++;
        results.push({
          id: filament.id,
          title: filament.product_title,
          productLineId: enrichment.productLineId,
          finishType: enrichment.finishType,
          isAbrasive: enrichment.isNozzleAbrasive,
          highSpeed: enrichment.highSpeedCapable,
          action: "updated",
        });

      } catch (err) {
        console.error(`Error processing ${filament.product_title}:`, err);
        errors++;
        results.push({
          id: filament.id,
          title: filament.product_title,
          productLineId: "error",
          finishType: "error",
          isAbrasive: null,
          highSpeed: null,
          action: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Calculate coverage stats after enrichment
    const { data: statsAfter } = await supabase
      .from("filaments")
      .select("id, product_line_id, finish_type")
      .eq("vendor", "Bambu Lab");

    const totalBambu = statsAfter?.length || 0;
    const withProductLineId = statsAfter?.filter(f => f.product_line_id)?.length || 0;
    const withFinishType = statsAfter?.filter(f => f.finish_type)?.length || 0;

    const summary = {
      success: true,
      dryRun,
      totalProcessed: filaments?.length || 0,
      updated,
      skipped,
      errors,
      coverage: {
        total: totalBambu,
        withProductLineId,
        withFinishType,
        productLineIdPercent: totalBambu > 0 ? Math.round((withProductLineId / totalBambu) * 100) : 0,
        finishTypePercent: totalBambu > 0 ? Math.round((withFinishType / totalBambu) * 100) : 0,
      },
      results: results.slice(0, 50), // Limit results in response
    };

    console.log(`[BAMBU-ENRICH] Complete: ${updated} updated, ${skipped} skipped, ${errors} errors`);
    console.log(`[BAMBU-ENRICH] Coverage: ${summary.coverage.productLineIdPercent}% product_line_id, ${summary.coverage.finishTypePercent}% finish_type`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[BAMBU-ENRICH] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
