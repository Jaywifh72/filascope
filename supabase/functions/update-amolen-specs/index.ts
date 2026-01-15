import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { getAmolenSpecPageUrl, getAmolenPrintSettings, normalizeAmolenMaterial } from '../_shared/amolen-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateResult {
  id: string;
  product_title: string;
  product_line_id: string | null;
  material: string | null;
  tds_url: string | null;
  status: 'updated' | 'skipped' | 'no_match';
  reason?: string;
}

// Hardcoded specifications extracted from Amolen product pages
// These are fallback values when AI extraction isn't available
const AMOLEN_SPECS: Record<string, {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  print_speed_max_mms?: number;
  high_speed_capable?: boolean;
  drying_temp_c?: number;
  drying_time_hours?: number;
}> = {
  // PLA High Speed
  'high-speed': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 0,
    bed_temp_max_c: 60,
    print_speed_max_mms: 600,
    high_speed_capable: true,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // PLA+ High Speed
  'pla-plus-high-speed': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    print_speed_max_mms: 600,
    high_speed_capable: true,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Silk Basic
  'silk-basic': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Silk Dual
  'silk-dual': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Silk Triple
  'silk-tri': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Silk Rainbow
  'silk-rainbow': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Silk S-Series
  'silk-s-series': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Shimmer/Shiny
  'shimmer': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Matte Basic
  'matte-basic': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Matte Dual
  'matte-dual': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Matte Rainbow
  'matte-rainbow': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Matte Triple
  'matte-triple': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Matte Rainbow Bulk
  'matte-rainbow-bulk': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Galaxy
  'galaxy': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Silk Galaxy
  'silk-galaxy': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Silk Variety Pack
  'silk-variety-pack': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Silk Rainbow Bulk
  'silk-rainbow-bulk': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Glow Variety Pack
  'glow-variety-pack': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // All in One Sample
  'all-in-one-sample': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Marble
  'marble': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Crystal
  'crystal': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Standard PLA
  'standard': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Variety Pack
  'variety-pack': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Silk Basic Glow
  'silk-basic-glow': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // High Speed Dual
  'high-speed-dual': {
    nozzle_temp_min_c: 190,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 0,
    bed_temp_max_c: 60,
    print_speed_max_mms: 600,
    high_speed_capable: true,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Wood
  'wood': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Carbon Fiber
  'pla-cf-standard': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // Glow in Dark
  'glow-in-dark': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 50,
    bed_temp_max_c: 60,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  // PETG Basic
  'petg-standard': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 80,
    drying_temp_c: 65,
    drying_time_hours: 4,
  },
  // PETG Transparent
  'petg-transparent': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 70,
    bed_temp_max_c: 80,
    drying_temp_c: 65,
    drying_time_hours: 4,
  },
  // TPU Basic
  'tpu-standard': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 30,
    bed_temp_max_c: 60,
    drying_temp_c: 50,
    drying_time_hours: 4,
  },
  // TPU Transparent
  'tpu-transparent': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 30,
    bed_temp_max_c: 60,
    drying_temp_c: 50,
    drying_time_hours: 4,
  },
  // TPU Glow
  'tpu-glow': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 30,
    bed_temp_max_c: 60,
    drying_temp_c: 50,
    drying_time_hours: 4,
  },
  // TPU Rainbow
  'tpu-rainbow': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 30,
    bed_temp_max_c: 60,
    drying_temp_c: 50,
    drying_time_hours: 4,
  },
  // PEBA
  'peba-standard': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 40,
    bed_temp_max_c: 60,
    drying_temp_c: 60,
    drying_time_hours: 4,
  },
};

function getSpecsForProductLine(productLineId: string | null): typeof AMOLEN_SPECS[string] | null {
  if (!productLineId) return null;
  
  const parts = productLineId.split('__');
  const lineSegment = parts[parts.length - 1];
  const materialSegment = parts.length > 1 ? parts[1] : null;
  
  // Direct match
  if (AMOLEN_SPECS[lineSegment]) {
    return AMOLEN_SPECS[lineSegment];
  }
  
  // Try material + line combo
  if (materialSegment) {
    // For TPU specifically
    if (materialSegment === 'tpu-95a') {
      if (lineSegment === 'standard') return AMOLEN_SPECS['tpu-standard'];
      if (lineSegment === 'transparent') return AMOLEN_SPECS['tpu-transparent'];
      if (lineSegment === 'glow') return AMOLEN_SPECS['tpu-glow'];
      if (lineSegment === 'rainbow') return AMOLEN_SPECS['tpu-rainbow'];
    }
    
    // For PETG
    if (materialSegment === 'petg') {
      if (lineSegment === 'standard') return AMOLEN_SPECS['petg-standard'];
      if (lineSegment === 'transparent') return AMOLEN_SPECS['petg-transparent'];
    }
    
    // For PEBA
    if (materialSegment === 'peba') {
      return AMOLEN_SPECS['peba-standard'];
    }
    
    // For PLA-CF
    if (materialSegment === 'pla-cf') {
      return AMOLEN_SPECS['pla-cf-standard'];
    }
    
    // For PLA+ High Speed
    if (materialSegment === 'pla-plus' && lineSegment === 'high-speed') {
      return AMOLEN_SPECS['pla-plus-high-speed'];
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dryRun = true, forceOverwrite = false } = await req.json().catch(() => ({}));

    console.log(`[update-amolen-specs] Starting... dryRun=${dryRun}, forceOverwrite=${forceOverwrite}`);

    // Fetch all Amolen filaments
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_line_id, material, tds_url, nozzle_temp_min_c, high_speed_capable')
      .ilike('vendor', 'amolen');

    if (fetchError) throw fetchError;

    console.log(`[update-amolen-specs] Found ${filaments?.length || 0} Amolen filaments`);

    const results: UpdateResult[] = [];
    let updated = 0;
    let skipped = 0;
    let noMatch = 0;

    for (const filament of filaments || []) {
      const specs = getSpecsForProductLine(filament.product_line_id);
      const specPageUrl = getAmolenSpecPageUrl(filament.product_line_id);
      
      if (!specs) {
        results.push({
          id: filament.id,
          product_title: filament.product_title,
          product_line_id: filament.product_line_id,
          material: filament.material,
          tds_url: null,
          status: 'no_match',
          reason: 'No specs found for product line',
        });
        noMatch++;
        continue;
      }
      
      // Check if we should skip (already has specs and not forcing)
      const hasExistingSpecs = filament.nozzle_temp_min_c !== null;
      if (hasExistingSpecs && !forceOverwrite) {
        results.push({
          id: filament.id,
          product_title: filament.product_title,
          product_line_id: filament.product_line_id,
          material: filament.material,
          tds_url: filament.tds_url,
          status: 'skipped',
          reason: 'Already has specs, use forceOverwrite to update',
        });
        skipped++;
        continue;
      }
      
      // Build update object
      const updateData: Record<string, unknown> = {
        nozzle_temp_min_c: specs.nozzle_temp_min_c,
        nozzle_temp_max_c: specs.nozzle_temp_max_c,
        bed_temp_min_c: specs.bed_temp_min_c,
        bed_temp_max_c: specs.bed_temp_max_c,
      };
      
      if (specs.print_speed_max_mms) {
        updateData.print_speed_max_mms = specs.print_speed_max_mms;
      }
      if (specs.high_speed_capable !== undefined) {
        updateData.high_speed_capable = specs.high_speed_capable;
      }
      if (specs.drying_temp_c) {
        updateData.drying_temp_c = specs.drying_temp_c;
      }
      if (specs.drying_time_hours) {
        updateData.drying_time_hours = specs.drying_time_hours;
      }
      
      // Set product page URL as TDS reference
      if (specPageUrl && (!filament.tds_url || forceOverwrite)) {
        updateData.tds_url = specPageUrl;
      }

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[update-amolen-specs] Error updating ${filament.id}:`, updateError);
          results.push({
            id: filament.id,
            product_title: filament.product_title,
            product_line_id: filament.product_line_id,
            material: filament.material,
            tds_url: specPageUrl,
            status: 'skipped',
            reason: `Update error: ${updateError.message}`,
          });
          skipped++;
          continue;
        }
      }

      results.push({
        id: filament.id,
        product_title: filament.product_title,
        product_line_id: filament.product_line_id,
        material: filament.material,
        tds_url: specPageUrl,
        status: 'updated',
      });
      updated++;
    }

    const summary = {
      dryRun,
      forceOverwrite,
      total: filaments?.length || 0,
      updated,
      skipped,
      noMatch,
      results: results.slice(0, 50), // Limit results in response
    };

    console.log(`[update-amolen-specs] Complete: ${updated} updated, ${skipped} skipped, ${noMatch} no match`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[update-amolen-specs] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
