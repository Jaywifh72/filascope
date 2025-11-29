import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Filament {
  id: string;
  diameter_nominal_mm: number | null;
  material: string | null;
  net_weight_g: number | null;
}

const getMaterialDensity = (material: string | null): number => {
  const densities: { [key: string]: number } = {
    'PLA': 1.24,
    'PLA+': 1.24,
    'PETG': 1.27,
    'ABS': 1.04,
    'ASA': 1.07,
    'TPU': 1.21,
    'Nylon': 1.14,
    'PC': 1.20,
    'PVA': 1.23,
    'HIPS': 1.04,
    'PP': 0.90,
    'PVB': 1.08,
    'PCTG': 1.23,
    'Co-Polyester': 1.27,
    'PEEK': 1.32,
    'PPSU': 1.29,
    'PEI': 1.27,
    'PEBA': 1.01,
  };

  if (!material) return 1.24; // Default to PLA density
  
  // Check for composite materials
  if (material.includes('-CF') || material.includes('Carbon')) return 1.30;
  if (material.includes('-GF') || material.includes('Glass')) return 1.35;
  if (material.includes('Wood') || material.includes('Bamboo')) return 1.28;
  if (material.includes('Metal')) return 1.40;
  
  return densities[material] || 1.24;
};

const calculateEstimatedWeight = (diameter: number | null, material: string | null): number => {
  // If no diameter, use standard 1kg
  if (!diameter || diameter <= 0) return 1000;
  
  const density = getMaterialDensity(material);
  
  // Standard reference: 1.75mm PLA at 1kg = ~330 meters
  const referenceDiameter = 1.75;
  const referenceDensity = 1.24;
  const referenceWeight = 1000; // grams
  
  // Calculate cross-sectional area ratio
  const areaRatio = Math.pow(diameter / referenceDiameter, 2);
  
  // Calculate density ratio
  const densityRatio = density / referenceDensity;
  
  // Estimated weight for same length
  const estimatedWeight = referenceWeight * areaRatio * densityRatio;
  
  // Round to nearest 50g
  const rounded = Math.round(estimatedWeight / 50) * 50;
  
  // Ensure reasonable bounds (most spools are between 250g and 2000g)
  if (rounded < 250) return 250;
  if (rounded > 2000) return 1000;
  
  return rounded;
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting weight estimation process...');

    // Fetch all filaments with missing weight data
    const { data: filaments, error: fetchError } = await supabaseClient
      .from('filaments')
      .select('id, diameter_nominal_mm, material, net_weight_g')
      .or('net_weight_g.is.null,net_weight_g.eq.0');

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No filaments need weight estimation',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filaments.length} filaments needing weight estimation`);

    // Calculate estimated weights and prepare updates
    const updates = filaments.map((filament: Filament) => {
      const estimatedWeight = calculateEstimatedWeight(
        filament.diameter_nominal_mm,
        filament.material
      );

      return {
        id: filament.id,
        net_weight_g: estimatedWeight
      };
    });

    // Perform bulk update
    let successCount = 0;
    const errors: string[] = [];

    for (const update of updates) {
      const { error: updateError } = await supabaseClient
        .from('filaments')
        .update({ net_weight_g: update.net_weight_g })
        .eq('id', update.id);

      if (updateError) {
        errors.push(`Failed to update ${update.id}: ${updateError.message}`);
        console.error(`Update error for ${update.id}:`, updateError);
      } else {
        successCount++;
      }
    }

    console.log(`Successfully updated ${successCount} filaments`);
    if (errors.length > 0) {
      console.error(`Encountered ${errors.length} errors:`, errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Estimated weights for ${successCount} filaments`,
        updated: successCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in estimate-weights function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
