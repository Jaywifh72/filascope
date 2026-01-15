import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  extractFinishType,
  normalizeFinishType,
  isHighSpeedCapable,
  isAbrasive,
  hasCarbonFiber,
  hasGlassFiber,
  hasWoodFill,
  type FinishType,
} from "../_shared/tag-extraction.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NormalizeOptions {
  dryRun?: boolean;
  limit?: number;
  forceOverwrite?: boolean;
}

interface NormalizeResult {
  success: boolean;
  stats: {
    totalProcessed: number;
    normalized: number;
    extracted: number;
    unchanged: number;
  };
  normalizations: Record<string, number>;
  sampleUpdates: Array<{
    id: string;
    title: string;
    oldFinishType: string | null;
    newFinishType: string;
    reason: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const options: NormalizeOptions = await req.json().catch(() => ({}));
    const { dryRun = true, limit, forceOverwrite = false } = options;

    console.log(`[normalize-filament-tags] Starting with dryRun=${dryRun}, limit=${limit || 'all'}, forceOverwrite=${forceOverwrite}`);

    // Fetch all filaments
    let query = supabase
      .from("filaments")
      .select("id, product_title, material, finish_type, high_speed_capable, is_nozzle_abrasive, carbon_fiber_percentage, glass_fiber_percentage, wood_powder_percentage");

    if (limit) {
      query = query.limit(limit);
    }

    const { data: filaments, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch filaments: ${error.message}`);
    }

    console.log(`[normalize-filament-tags] Fetched ${filaments?.length || 0} filaments`);

    const stats = {
      totalProcessed: 0,
      normalized: 0,
      extracted: 0,
      unchanged: 0,
    };

    const normalizations: Record<string, number> = {};
    const sampleUpdates: NormalizeResult["sampleUpdates"] = [];
    const updates: Array<{ id: string; updates: Record<string, unknown> }> = [];

    for (const filament of filaments || []) {
      stats.totalProcessed++;

      const title = filament.product_title || "";
      const material = filament.material || "";
      const existingFinish = filament.finish_type;

      // Step 1: Extract fresh from title/material
      const extractedFinish = extractFinishType(title, material);
      
      // Step 2: Determine new finish_type based on mode
      let newFinishType: FinishType;
      let reason = "";

      if (forceOverwrite) {
        // Force mode: Prioritize extraction, then normalize existing
        // This ensures we catch CF patterns in title even if existing value is wrong
        if (extractedFinish !== "Standard") {
          newFinishType = extractedFinish;
          reason = "force-extracted from title/material";
          stats.extracted++;
        } else if (existingFinish && existingFinish !== "Standard") {
          // Normalize the existing value if extraction returned Standard
          newFinishType = normalizeFinishType(existingFinish);
          reason = `force-normalized from '${existingFinish}'`;
          stats.normalized++;
        } else {
          newFinishType = "Standard";
        }
      } else {
        // Normal mode: only update if needed
        // First try extraction (catches more patterns), then normalize existing
        if (extractedFinish !== "Standard") {
          // Extraction found something specific
          if (existingFinish !== extractedFinish) {
            newFinishType = extractedFinish;
            reason = "extracted from title/material";
            stats.extracted++;
          } else {
            newFinishType = extractedFinish;
          }
        } else if (existingFinish && existingFinish !== "Standard") {
          // Normalize the existing value
          newFinishType = normalizeFinishType(existingFinish);
          if (newFinishType !== existingFinish) {
            reason = `normalized from '${existingFinish}'`;
            stats.normalized++;
          }
        } else {
          newFinishType = "Standard";
        }
      }

      // Check other fields
      const newHighSpeed = isHighSpeedCapable(title, material);
      const newAbrasive = isAbrasive(title, material);
      const hasCF = hasCarbonFiber(title, material);
      const hasGF = hasGlassFiber(title, material);
      const hasWood = hasWoodFill(title, material);

      // Build update object only for changed fields
      const updateFields: Record<string, unknown> = {};

      // For forceOverwrite, always update finish_type if we have a reason
      if (forceOverwrite && reason) {
        updateFields.finish_type = newFinishType;
        normalizations[newFinishType] = (normalizations[newFinishType] || 0) + 1;
      } else if (newFinishType !== existingFinish && (reason || newFinishType !== "Standard")) {
        updateFields.finish_type = newFinishType;
        normalizations[newFinishType] = (normalizations[newFinishType] || 0) + 1;
      }

      if (newHighSpeed !== filament.high_speed_capable && newHighSpeed) {
        updateFields.high_speed_capable = true;
      }

      if (newAbrasive !== filament.is_nozzle_abrasive && newAbrasive) {
        updateFields.is_nozzle_abrasive = true;
      }

      if (hasCF && !filament.carbon_fiber_percentage) {
        updateFields.carbon_fiber_percentage = 15;
      }

      if (hasGF && !filament.glass_fiber_percentage) {
        updateFields.glass_fiber_percentage = 15;
      }

      if (hasWood && !filament.wood_powder_percentage) {
        updateFields.wood_powder_percentage = 20;
      }

      if (Object.keys(updateFields).length > 0) {
        updates.push({ id: filament.id, updates: updateFields });

        if (sampleUpdates.length < 20) {
          sampleUpdates.push({
            id: filament.id,
            title: title.substring(0, 60),
            oldFinishType: existingFinish,
            newFinishType: updateFields.finish_type as string || existingFinish || "Standard",
            reason: reason || Object.keys(updateFields).join(", "),
          });
        }
      } else {
        stats.unchanged++;
      }
    }

    console.log(`[normalize-filament-tags] Found ${updates.length} filaments to update`);

    // Apply updates if not dry run
    if (!dryRun && updates.length > 0) {
      const batchSize = 50;
      let successCount = 0;

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        for (const { id, updates: fields } of batch) {
          const { error: updateError } = await supabase
            .from("filaments")
            .update(fields)
            .eq("id", id);

          if (updateError) {
            console.error(`Failed to update ${id}: ${updateError.message}`);
          } else {
            successCount++;
          }
        }

        console.log(`[normalize-filament-tags] Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(updates.length / batchSize)}`);
      }

      console.log(`[normalize-filament-tags] Successfully updated ${successCount}/${updates.length} filaments`);
    }

    const result: NormalizeResult = {
      success: true,
      stats,
      normalizations,
      sampleUpdates,
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[normalize-filament-tags] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
