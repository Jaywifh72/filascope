import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { get3DFuelTdsUrl, THREED_FUEL_TDS_URLS } from "../_shared/3dfuel-defaults.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateResult {
  id: string;
  productTitle: string;
  productLineId: string | null;
  tdsUrl: string | null;
  status: 'updated' | 'already_set' | 'no_match' | 'error';
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let dryRun = false;
    let forceOverwrite = false;
    try {
      const body = await req.json();
      dryRun = body.dryRun === true;
      forceOverwrite = body.forceOverwrite === true;
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log(`Starting 3D-Fuel TDS update. DryRun: ${dryRun}, ForceOverwrite: ${forceOverwrite}`);

    // Fetch all 3D-Fuel filaments
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_line_id, tds_url, product_handle')
      .or('vendor.ilike.%3D-Fuel%,vendor.ilike.%3D Fuel%,vendor.ilike.%3DFuel%');

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filaments?.length || 0} 3D-Fuel filaments`);

    const results: UpdateResult[] = [];
    let updatedCount = 0;
    let skippedCount = 0;
    let noMatchCount = 0;

    for (const filament of filaments || []) {
      const result: UpdateResult = {
        id: filament.id,
        productTitle: filament.product_title,
        productLineId: filament.product_line_id,
        tdsUrl: null,
        status: 'no_match',
      };

      // Skip if already has TDS and not forcing overwrite
      if (filament.tds_url && !forceOverwrite) {
        result.status = 'already_set';
        result.tdsUrl = filament.tds_url;
        skippedCount++;
        results.push(result);
        continue;
      }

      // Try to get TDS URL from product_line_id
      let tdsUrl = get3DFuelTdsUrl(filament.product_line_id);
      
      // Fallback: try product handle if available
      if (!tdsUrl && filament.product_handle) {
        const { buildTdsUrl } = await import("../_shared/3dfuel-defaults.ts");
        tdsUrl = buildTdsUrl(filament.product_handle);
      }

      if (!tdsUrl) {
        noMatchCount++;
        results.push(result);
        continue;
      }

      result.tdsUrl = tdsUrl;

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ tds_url: tdsUrl })
          .eq('id', filament.id);

        if (updateError) {
          result.status = 'error';
          result.error = updateError.message;
          console.error(`Error updating ${filament.product_title}:`, updateError);
        } else {
          result.status = 'updated';
          updatedCount++;
        }
      } else {
        result.status = 'updated';
        updatedCount++;
      }

      results.push(result);
    }

    const summary = {
      success: true,
      dryRun,
      forceOverwrite,
      totalFilaments: filaments?.length || 0,
      updated: updatedCount,
      skipped: skippedCount,
      noMatch: noMatchCount,
      availableTdsPatterns: Object.keys(THREED_FUEL_TDS_URLS),
      results,
    };

    console.log(`Update complete. Updated: ${updatedCount}, Skipped: ${skippedCount}, No match: ${noMatchCount}`);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-3dfuel-tds:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
