import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TdsSpecs {
  nozzle_temp_min_c?: number;
  nozzle_temp_max_c?: number;
  bed_temp_min_c?: number;
  bed_temp_max_c?: number;
  density_g_cm3?: number;
  tensile_strength_xy_mpa?: number;
  tensile_modulus_xy_mpa?: number;
  elongation_break_xy_percent?: number;
  flexural_strength_mpa?: number;
  print_speed_max_mms?: number;
  drying_temp_c?: number;
  drying_time_hours?: number;
}

// Specifications extracted from 3DXtech TDS PDFs
const TDS_SPECIFICATIONS: Record<string, TdsSpecs> = {
  // 3DXSTAT ESD-ABS
  'esd-abs': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 100,
    bed_temp_max_c: 110,
    density_g_cm3: 1.08,
    tensile_strength_xy_mpa: 33,
    tensile_modulus_xy_mpa: 1900,
    elongation_break_xy_percent: 4,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
  
  // 3DXSTAT ESD-PETG
  'esd-petg': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
    density_g_cm3: 1.30,
    tensile_strength_xy_mpa: 42,
    tensile_modulus_xy_mpa: 2100,
    elongation_break_xy_percent: 3,
    drying_temp_c: 65,
    drying_time_hours: 4,
  },
  
  // 3DXSTAT ESD-PLA
  'esd-pla': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    density_g_cm3: 1.28,
    tensile_strength_xy_mpa: 45,
    tensile_modulus_xy_mpa: 3200,
    elongation_break_xy_percent: 2,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  
  // 3DXSTAT ESD-PC
  'esd-pc': {
    nozzle_temp_min_c: 260,
    nozzle_temp_max_c: 290,
    bed_temp_min_c: 100,
    bed_temp_max_c: 120,
    density_g_cm3: 1.22,
    tensile_strength_xy_mpa: 52,
    tensile_modulus_xy_mpa: 2100,
    elongation_break_xy_percent: 4,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
  
  // 3DXSTAT ESD-Nylon 12
  'esd-nylon': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 270,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
    density_g_cm3: 1.06,
    tensile_strength_xy_mpa: 42,
    tensile_modulus_xy_mpa: 1400,
    elongation_break_xy_percent: 15,
    drying_temp_c: 80,
    drying_time_hours: 8,
  },
  
  // CarbonX ABS+CF
  'abs-cf': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 100,
    bed_temp_max_c: 110,
    density_g_cm3: 1.11,
    tensile_strength_xy_mpa: 48,
    tensile_modulus_xy_mpa: 4500,
    elongation_break_xy_percent: 2,
    flexural_strength_mpa: 75,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
  
  // CarbonX ASA+CF
  'asa-cf': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 270,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
    density_g_cm3: 1.14,
    tensile_strength_xy_mpa: 55,
    tensile_modulus_xy_mpa: 5200,
    elongation_break_xy_percent: 2,
    flexural_strength_mpa: 82,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
  
  // CarbonX PETG+CF
  'petg-cf': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
    density_g_cm3: 1.32,
    tensile_strength_xy_mpa: 52,
    tensile_modulus_xy_mpa: 5800,
    elongation_break_xy_percent: 1.5,
    flexural_strength_mpa: 78,
    drying_temp_c: 65,
    drying_time_hours: 4,
  },
  
  // CarbonX PLA+CF
  'pla-cf': {
    nozzle_temp_min_c: 205,
    nozzle_temp_max_c: 230,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    density_g_cm3: 1.29,
    tensile_strength_xy_mpa: 48,
    tensile_modulus_xy_mpa: 5500,
    elongation_break_xy_percent: 1.2,
    flexural_strength_mpa: 72,
    drying_temp_c: 55,
    drying_time_hours: 4,
  },
  
  // CarbonX PC+CF
  'pc-cf': {
    nozzle_temp_min_c: 270,
    nozzle_temp_max_c: 300,
    bed_temp_min_c: 100,
    bed_temp_max_c: 120,
    density_g_cm3: 1.23,
    tensile_strength_xy_mpa: 68,
    tensile_modulus_xy_mpa: 6200,
    elongation_break_xy_percent: 2,
    flexural_strength_mpa: 95,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
  
  // CarbonX Nylon 12+CF
  'nylon-cf': {
    nozzle_temp_min_c: 250,
    nozzle_temp_max_c: 280,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
    density_g_cm3: 1.10,
    tensile_strength_xy_mpa: 75,
    tensile_modulus_xy_mpa: 6800,
    elongation_break_xy_percent: 3,
    flexural_strength_mpa: 90,
    drying_temp_c: 80,
    drying_time_hours: 8,
  },
  
  // 3DXMAX ASA
  'asa': {
    nozzle_temp_min_c: 240,
    nozzle_temp_max_c: 270,
    bed_temp_min_c: 90,
    bed_temp_max_c: 110,
    density_g_cm3: 1.07,
    tensile_strength_xy_mpa: 42,
    tensile_modulus_xy_mpa: 1950,
    elongation_break_xy_percent: 25,
    drying_temp_c: 80,
    drying_time_hours: 4,
  },
  
  // MAX-G PETG
  'petg': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
    density_g_cm3: 1.27,
    tensile_strength_xy_mpa: 48,
    tensile_modulus_xy_mpa: 2020,
    elongation_break_xy_percent: 5,
    drying_temp_c: 65,
    drying_time_hours: 4,
  },
  
  // ThermaX PEEK
  'peek': {
    nozzle_temp_min_c: 360,
    nozzle_temp_max_c: 420,
    bed_temp_min_c: 120,
    bed_temp_max_c: 160,
    density_g_cm3: 1.30,
    tensile_strength_xy_mpa: 95,
    tensile_modulus_xy_mpa: 3800,
    elongation_break_xy_percent: 5,
    flexural_strength_mpa: 140,
    drying_temp_c: 150,
    drying_time_hours: 4,
  },
};

function getSpecsKey(material: string | null, productTitle: string | null): string | null {
  const normalizedMaterial = material?.toLowerCase().trim() || '';
  const normalizedTitle = productTitle?.toLowerCase() || '';
  
  // Check for ESD materials
  if (normalizedMaterial.includes('esd') || normalizedTitle.includes('3dxstat') || normalizedTitle.includes('esd')) {
    if (normalizedMaterial.includes('abs') || normalizedTitle.includes('abs')) return 'esd-abs';
    if (normalizedMaterial.includes('petg') || normalizedTitle.includes('petg')) return 'esd-petg';
    if (normalizedMaterial.includes('pla') || normalizedTitle.includes('pla')) return 'esd-pla';
    if ((normalizedMaterial.includes('pc') || normalizedTitle.includes('pc')) && 
        !normalizedMaterial.includes('petg') && !normalizedTitle.includes('petg')) return 'esd-pc';
    if (normalizedMaterial.includes('nylon') || normalizedMaterial.includes('pa12') ||
        normalizedTitle.includes('nylon') || normalizedTitle.includes('pa12')) return 'esd-nylon';
  }
  
  // Check for carbon fiber materials
  if (normalizedMaterial.includes('cf') || normalizedMaterial.includes('carbon') ||
      normalizedTitle.includes('carbonx') || normalizedTitle.includes('carbon')) {
    if (normalizedMaterial.includes('abs') || normalizedTitle.includes('abs')) return 'abs-cf';
    if (normalizedMaterial.includes('asa') || normalizedTitle.includes('asa')) return 'asa-cf';
    if (normalizedMaterial.includes('petg') || normalizedTitle.includes('petg')) return 'petg-cf';
    if (normalizedMaterial.includes('pla') || normalizedTitle.includes('pla')) return 'pla-cf';
    if ((normalizedMaterial.includes('pc') || normalizedTitle.includes('pc')) && 
        !normalizedMaterial.includes('petg') && !normalizedTitle.includes('petg')) return 'pc-cf';
    if (normalizedMaterial.includes('nylon') || normalizedMaterial.includes('pa12') ||
        normalizedTitle.includes('nylon') || normalizedTitle.includes('pa12')) return 'nylon-cf';
  }
  
  // Check for base materials
  if ((normalizedMaterial === 'asa' || normalizedTitle.includes('3dxmax')) && 
      (normalizedMaterial.includes('asa') || normalizedTitle.includes('asa'))) return 'asa';
  if ((normalizedMaterial === 'petg' || normalizedTitle.includes('max-g') || normalizedTitle.includes('maxg')) &&
      (normalizedMaterial.includes('petg') || normalizedTitle.includes('petg'))) return 'petg';
  if (normalizedMaterial === 'peek' || normalizedTitle.includes('thermax')) return 'peek';
  
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

    const { dryRun = false, forceOverwrite = false } = await req.json().catch(() => ({}));

    console.log(`Starting 3DXtech TDS specs parsing - dryRun: ${dryRun}, forceOverwrite: ${forceOverwrite}`);

    // Fetch all 3DXtech filaments
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_line_id, material, nozzle_temp_min_c, bed_temp_min_c, density_g_cm3')
      .eq('vendor', '3DXtech')
      .order('product_title');

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} 3DXtech filaments`);

    const results: Array<{
      id: string;
      product_title: string;
      specsKey: string | null;
      status: 'updated' | 'skipped' | 'no_specs';
      reason?: string;
    }> = [];
    
    let updatedCount = 0;
    let skippedCount = 0;
    let noSpecsCount = 0;

    for (const filament of filaments || []) {
      const specsKey = getSpecsKey(filament.material, filament.product_title);
      const specs = specsKey ? TDS_SPECIFICATIONS[specsKey] : null;

      if (!specs) {
        noSpecsCount++;
        results.push({
          id: filament.id,
          product_title: filament.product_title,
          specsKey: null,
          status: 'no_specs',
          reason: 'No specs mapping found',
        });
        continue;
      }

      // Skip if already has specs and not forcing overwrite
      const hasExistingSpecs = filament.nozzle_temp_min_c || filament.bed_temp_min_c || filament.density_g_cm3;
      if (hasExistingSpecs && !forceOverwrite) {
        skippedCount++;
        results.push({
          id: filament.id,
          product_title: filament.product_title,
          specsKey,
          status: 'skipped',
          reason: 'Already has specs',
        });
        continue;
      }

      // Update if not dry run
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ 
            ...specs,
            updated_at: new Date().toISOString() 
          })
          .eq('id', filament.id);

        if (updateError) {
          console.error(`Failed to update ${filament.product_title}: ${updateError.message}`);
          results.push({
            id: filament.id,
            product_title: filament.product_title,
            specsKey,
            status: 'skipped',
            reason: `Update failed: ${updateError.message}`,
          });
          continue;
        }
      }

      updatedCount++;
      results.push({
        id: filament.id,
        product_title: filament.product_title,
        specsKey,
        status: 'updated',
      });
    }

    const summary = {
      total: filaments?.length || 0,
      updated: updatedCount,
      skipped: skippedCount,
      noSpecs: noSpecsCount,
      dryRun,
      forceOverwrite,
    };

    console.log('Parse complete:', summary);

    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
