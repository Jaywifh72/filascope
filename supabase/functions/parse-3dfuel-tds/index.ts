import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { THREED_FUEL_TDS_URLS } from "../_shared/3dfuel-defaults.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TdsSpecs {
  nozzle_temp_min_c?: number;
  nozzle_temp_max_c?: number;
  bed_temp_min_c?: number;
  bed_temp_max_c?: number;
  print_speed_max_mms?: number;
  density_g_cm3?: number;
  tensile_strength_xy_mpa?: number;
  tensile_modulus_xy_mpa?: number;
  elongation_break_xy_percent?: number;
  flexural_strength_mpa?: number;
  tg_c?: number;
  drying_temp_c?: number;
  drying_time_hours?: number;
  moisture_sensitivity_level?: string;
}

// Known specifications from 3D-Fuel TDS documents
// These are extracted from the provided TDS PDFs
const TDS_SPECIFICATIONS: Record<string, TdsSpecs> = {
  'pro-pctg': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 70,
    bed_temp_max_c: 80,
    print_speed_max_mms: 80,
    density_g_cm3: 1.22,
    tensile_strength_xy_mpa: 55,
    tensile_modulus_xy_mpa: 2050,
    elongation_break_xy_percent: 120,
    tg_c: 85,
    drying_temp_c: 65,
    drying_time_hours: 4,
    moisture_sensitivity_level: 'Medium',
  },
  'tough-pro-pla': {
    nozzle_temp_min_c: 195,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    print_speed_max_mms: 100,
    density_g_cm3: 1.24,
    tensile_strength_xy_mpa: 60,
    tensile_modulus_xy_mpa: 3500,
    elongation_break_xy_percent: 6,
    flexural_strength_mpa: 97,
    tg_c: 60,
    drying_temp_c: 50,
    drying_time_hours: 4,
    moisture_sensitivity_level: 'Low',
  },
  'standard-pla': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 40,
    bed_temp_max_c: 60,
    print_speed_max_mms: 100,
    density_g_cm3: 1.24,
    tensile_strength_xy_mpa: 55,
    tensile_modulus_xy_mpa: 3200,
    elongation_break_xy_percent: 5,
    tg_c: 60,
    drying_temp_c: 50,
    drying_time_hours: 4,
    moisture_sensitivity_level: 'Low',
  },
  'pro-abs': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 95,
    bed_temp_max_c: 110,
    print_speed_max_mms: 60,
    density_g_cm3: 1.04,
    tensile_strength_xy_mpa: 43,
    tensile_modulus_xy_mpa: 2300,
    elongation_break_xy_percent: 25,
    tg_c: 105,
    drying_temp_c: 80,
    drying_time_hours: 4,
    moisture_sensitivity_level: 'Medium',
  },
  'pro-asa': {
    nozzle_temp_min_c: 235,
    nozzle_temp_max_c: 255,
    bed_temp_min_c: 90,
    bed_temp_max_c: 100,
    print_speed_max_mms: 60,
    density_g_cm3: 1.07,
    tensile_strength_xy_mpa: 44,
    tensile_modulus_xy_mpa: 2100,
    elongation_break_xy_percent: 30,
    tg_c: 100,
    drying_temp_c: 80,
    drying_time_hours: 4,
    moisture_sensitivity_level: 'Medium',
  },
  'pro-petg': {
    nozzle_temp_min_c: 225,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 80,
    print_speed_max_mms: 80,
    density_g_cm3: 1.27,
    tensile_strength_xy_mpa: 50,
    tensile_modulus_xy_mpa: 2000,
    elongation_break_xy_percent: 100,
    tg_c: 80,
    drying_temp_c: 65,
    drying_time_hours: 4,
    moisture_sensitivity_level: 'Medium',
  },
  'pet-cf': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 270,
    bed_temp_min_c: 75,
    bed_temp_max_c: 85,
    print_speed_max_mms: 60,
    density_g_cm3: 1.30,
    tensile_strength_xy_mpa: 65,
    tensile_modulus_xy_mpa: 5500,
    elongation_break_xy_percent: 3,
    tg_c: 85,
    drying_temp_c: 70,
    drying_time_hours: 6,
    moisture_sensitivity_level: 'High',
  },
  // Silk PLA variants use Standard PLA specs
  'silk-pla': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 40,
    bed_temp_max_c: 60,
    print_speed_max_mms: 80,
    density_g_cm3: 1.24,
    drying_temp_c: 50,
    drying_time_hours: 4,
    moisture_sensitivity_level: 'Low',
  },
  'dual-color-silk-pla': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 40,
    bed_temp_max_c: 60,
    print_speed_max_mms: 80,
    density_g_cm3: 1.24,
    drying_temp_c: 50,
    drying_time_hours: 4,
    moisture_sensitivity_level: 'Low',
  },
};

function getSpecsForProductLine(productLineId: string | null): TdsSpecs | null {
  if (!productLineId) return null;
  
  // Remove vendor prefix if present
  const normalizedId = productLineId.replace(/^3dfuel__/i, '').toLowerCase();
  
  // Try exact match
  if (TDS_SPECIFICATIONS[normalizedId]) {
    return TDS_SPECIFICATIONS[normalizedId];
  }
  
  // Try partial match
  for (const [key, specs] of Object.entries(TDS_SPECIFICATIONS)) {
    if (normalizedId.includes(key) || key.includes(normalizedId)) {
      return specs;
    }
  }
  
  return null;
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

    console.log(`Starting 3D-Fuel TDS specs update. DryRun: ${dryRun}, ForceOverwrite: ${forceOverwrite}`);

    // Fetch all 3D-Fuel filaments
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_line_id, nozzle_temp_min_c, nozzle_temp_max_c')
      .or('vendor.ilike.%3D-Fuel%,vendor.ilike.%3D Fuel%,vendor.ilike.%3DFuel%');

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filaments?.length || 0} 3D-Fuel filaments`);

    const results: Array<{
      id: string;
      productTitle: string;
      productLineId: string | null;
      status: 'updated' | 'already_set' | 'no_specs' | 'error';
      specsApplied?: string[];
      error?: string;
    }> = [];

    let updatedCount = 0;
    let skippedCount = 0;
    let noSpecsCount = 0;

    for (const filament of filaments || []) {
      const result: typeof results[0] = {
        id: filament.id,
        productTitle: filament.product_title,
        productLineId: filament.product_line_id,
        status: 'no_specs',
      };

      // Skip if already has specs and not forcing overwrite
      if (filament.nozzle_temp_min_c && filament.nozzle_temp_max_c && !forceOverwrite) {
        result.status = 'already_set';
        skippedCount++;
        results.push(result);
        continue;
      }

      const specs = getSpecsForProductLine(filament.product_line_id);
      
      if (!specs) {
        noSpecsCount++;
        results.push(result);
        continue;
      }

      const updatePayload: Record<string, any> = {};
      const specsApplied: string[] = [];

      // Only add fields that have values
      for (const [key, value] of Object.entries(specs)) {
        if (value !== undefined && value !== null) {
          updatePayload[key] = value;
          specsApplied.push(key);
        }
      }

      result.specsApplied = specsApplied;

      if (!dryRun && Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updatePayload)
          .eq('id', filament.id);

        if (updateError) {
          result.status = 'error';
          result.error = updateError.message;
          console.error(`Error updating ${filament.product_title}:`, updateError);
        } else {
          result.status = 'updated';
          updatedCount++;
        }
      } else if (Object.keys(updatePayload).length > 0) {
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
      noSpecs: noSpecsCount,
      availableProductLines: Object.keys(TDS_SPECIFICATIONS),
      results,
    };

    console.log(`Specs update complete. Updated: ${updatedCount}, Skipped: ${skippedCount}, No specs: ${noSpecsCount}`);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in parse-3dfuel-tds:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
