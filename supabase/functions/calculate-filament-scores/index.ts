import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FilamentSpecs {
  id: string;
  material: string | null;
  vendor: string | null;
  // Thermal specs
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  drying_temp_c: number | null;
  drying_time_hours: number | null;
  tg_c: number | null;
  melt_temp_c: number | null;
  // Mechanical specs
  tensile_strength_xy_mpa: number | null;
  tensile_modulus_xy_mpa: number | null;
  elongation_break_xy_percent: number | null;
  flexural_strength_mpa: number | null;
  density_g_cm3: number | null;
  shore_hardness_d: number | null;
  // Printing specs
  print_speed_max_mms: number | null;
  high_speed_capable: boolean | null;
  is_nozzle_abrasive: boolean | null;
  // Price
  variant_price: number | null;
  net_weight_g: number | null;
}

interface ScoreResult {
  ease_of_printing_score: number | null;
  strength_index: number | null;
  printability_index: number | null;
  score_methodology: {
    ease: { factors: string[]; confidence: number };
    strength: { factors: string[]; confidence: number };
    printability: { factors: string[]; confidence: number };
  };
}

// Material baseline difficulties (1=easy, 10=hard)
const MATERIAL_DIFFICULTY: Record<string, number> = {
  'PLA': 1.5,
  'PLA+': 2,
  'PETG': 3.5,
  'TPU': 4.5,
  'ABS': 5.5,
  'ASA': 5,
  'PA': 7,
  'NYLON': 7,
  'PC': 7.5,
  'PP': 6,
  'PVA': 4,
  'HIPS': 4,
  'PEEK': 9,
  'PEI': 8.5,
  'PCTG': 3,
};

// Material baseline strengths (1-10)
const MATERIAL_STRENGTH: Record<string, number> = {
  'PLA': 4,
  'PLA+': 4.5,
  'PETG': 5.5,
  'TPU': 3,
  'ABS': 6,
  'ASA': 6.5,
  'PA': 8,
  'NYLON': 8,
  'PC': 8.5,
  'PP': 4.5,
  'PA-CF': 9,
  'PC-CF': 9,
  'PEEK': 9.5,
};

function getBaseMaterial(material: string | null): string {
  if (!material) return 'PLA';
  const normalized = material.toUpperCase()
    .replace(/[\s\-+]+/g, '-')
    .split('-')[0]
    .trim();
  return normalized || 'PLA';
}

function calculateEaseOfPrinting(filament: FilamentSpecs): { score: number | null; factors: string[]; confidence: number } {
  const factors: string[] = [];
  let confidence = 0;
  let score = 10; // Start with perfect and deduct

  const baseMaterial = getBaseMaterial(filament.material);
  const difficulty = MATERIAL_DIFFICULTY[baseMaterial] ?? 4;
  
  // Base material difficulty (30% weight)
  score -= difficulty * 0.3;
  factors.push(`Material: ${baseMaterial} (base difficulty ${difficulty.toFixed(1)}/10)`);
  confidence += 20;

  // Temperature range complexity
  if (filament.nozzle_temp_min_c && filament.nozzle_temp_max_c) {
    const range = filament.nozzle_temp_max_c - filament.nozzle_temp_min_c;
    if (range < 20) {
      score -= 1; // Narrow range = more precise temp needed
      factors.push('Narrow temp window (-1)');
    } else if (range > 40) {
      score += 0.5; // Wide range = forgiving
      factors.push('Wide temp window (+0.5)');
    }
    confidence += 15;
  }

  // High temp materials are harder
  if (filament.nozzle_temp_min_c && filament.nozzle_temp_min_c > 260) {
    score -= 1.5;
    factors.push('High temp required (-1.5)');
    confidence += 10;
  }

  // Bed temp requirements
  if (filament.bed_temp_min_c && filament.bed_temp_min_c > 80) {
    score -= 0.5;
    factors.push('High bed temp required (-0.5)');
    confidence += 10;
  }

  // Drying requirements
  if (filament.drying_time_hours) {
    if (filament.drying_time_hours > 6) {
      score -= 1;
      factors.push('Long drying time needed (-1)');
    } else if (filament.drying_time_hours > 0) {
      score -= 0.5;
      factors.push('Drying recommended (-0.5)');
    }
    confidence += 10;
  }

  // Abrasive materials
  if (filament.is_nozzle_abrasive) {
    score -= 0.5;
    factors.push('Requires hardened nozzle (-0.5)');
    confidence += 5;
  }

  // High speed capable is a plus
  if (filament.high_speed_capable) {
    score += 0.5;
    factors.push('High speed capable (+0.5)');
    confidence += 5;
  }

  // Clamp score
  const finalScore = Math.max(1, Math.min(10, score));
  
  if (confidence < 25) return { score: null, factors, confidence };
  
  return { 
    score: Math.round(finalScore * 10) / 10, 
    factors, 
    confidence: Math.min(100, confidence) 
  };
}

function calculateStrengthIndex(filament: FilamentSpecs): { score: number | null; factors: string[]; confidence: number } {
  const factors: string[] = [];
  let confidence = 0;
  let score = 5; // Start neutral

  const baseMaterial = getBaseMaterial(filament.material);
  const baseStrength = MATERIAL_STRENGTH[baseMaterial] ?? 5;
  
  score = baseStrength;
  factors.push(`Material: ${baseMaterial} (base strength ${baseStrength}/10)`);
  confidence += 25;

  // Tensile strength (most important)
  if (filament.tensile_strength_xy_mpa) {
    const tensile = filament.tensile_strength_xy_mpa;
    if (tensile > 60) {
      score += 1.5;
      factors.push(`High tensile: ${tensile} MPa (+1.5)`);
    } else if (tensile > 40) {
      score += 0.5;
      factors.push(`Good tensile: ${tensile} MPa (+0.5)`);
    } else if (tensile < 30) {
      score -= 0.5;
      factors.push(`Lower tensile: ${tensile} MPa (-0.5)`);
    }
    confidence += 25;
  }

  // Elongation (flexibility/impact)
  if (filament.elongation_break_xy_percent) {
    const elongation = filament.elongation_break_xy_percent;
    if (elongation > 100) {
      score += 0.5;
      factors.push(`High elongation: ${elongation}% (+0.5)`);
    } else if (elongation < 5) {
      score -= 0.3;
      factors.push(`Brittle: ${elongation}% elongation (-0.3)`);
    }
    confidence += 15;
  }

  // Flexural strength
  if (filament.flexural_strength_mpa) {
    const flexural = filament.flexural_strength_mpa;
    if (flexural > 90) {
      score += 0.5;
      factors.push(`High flexural: ${flexural} MPa (+0.5)`);
    }
    confidence += 15;
  }

  // Density (can indicate reinforcement)
  if (filament.density_g_cm3) {
    if (filament.density_g_cm3 > 1.4) {
      score += 0.3;
      factors.push(`Dense/reinforced material (+0.3)`);
    }
    confidence += 10;
  }

  const finalScore = Math.max(1, Math.min(10, score));
  
  if (confidence < 25) return { score: null, factors, confidence };
  
  return { 
    score: Math.round(finalScore * 10) / 10, 
    factors, 
    confidence: Math.min(100, confidence) 
  };
}

function calculatePrintabilityIndex(filament: FilamentSpecs, easeScore: number | null, strengthScore: number | null): { score: number | null; factors: string[]; confidence: number } {
  const factors: string[] = [];
  let confidence = 0;
  let score = 5;

  // Weighted average of ease and strength if available
  if (easeScore !== null && strengthScore !== null) {
    score = easeScore * 0.6 + strengthScore * 0.4;
    factors.push(`Ease (60%): ${easeScore.toFixed(1)}, Strength (40%): ${strengthScore.toFixed(1)}`);
    confidence += 50;
  } else if (easeScore !== null) {
    score = easeScore;
    factors.push(`Based on ease score: ${easeScore.toFixed(1)}`);
    confidence += 30;
  } else if (strengthScore !== null) {
    score = strengthScore;
    factors.push(`Based on strength score: ${strengthScore.toFixed(1)}`);
    confidence += 30;
  }

  // Print speed capability bonus
  if (filament.print_speed_max_mms) {
    if (filament.print_speed_max_mms >= 300) {
      score += 0.5;
      factors.push(`Ultra high speed: ${filament.print_speed_max_mms} mm/s (+0.5)`);
    } else if (filament.print_speed_max_mms >= 150) {
      score += 0.3;
      factors.push(`High speed: ${filament.print_speed_max_mms} mm/s (+0.3)`);
    }
    confidence += 15;
  }

  // High speed capable flag
  if (filament.high_speed_capable) {
    score += 0.3;
    factors.push('Optimized for high speed (+0.3)');
    confidence += 10;
  }

  const finalScore = Math.max(1, Math.min(10, score));
  
  if (confidence < 25) return { score: null, factors, confidence };
  
  return { 
    score: Math.round(finalScore * 10) / 10, 
    factors, 
    confidence: Math.min(100, confidence) 
  };
}

function calculateScores(filament: FilamentSpecs): ScoreResult {
  const ease = calculateEaseOfPrinting(filament);
  const strength = calculateStrengthIndex(filament);
  const printability = calculatePrintabilityIndex(filament, ease.score, strength.score);

  return {
    ease_of_printing_score: ease.score,
    strength_index: strength.score,
    printability_index: printability.score,
    score_methodology: {
      ease: { factors: ease.factors, confidence: ease.confidence },
      strength: { factors: strength.factors, confidence: strength.confidence },
      printability: { factors: printability.factors, confidence: printability.confidence },
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { mode = 'preview', limit = 100, filamentId } = await req.json().catch(() => ({}));

    console.log(`[calculate-scores] Mode: ${mode}, Limit: ${limit}, FilamentId: ${filamentId || 'all'}`);

    // Build query
    let query = supabase
      .from('filaments')
      .select(`
        id, material, vendor,
        nozzle_temp_min_c, nozzle_temp_max_c,
        bed_temp_min_c, bed_temp_max_c,
        drying_temp_c, drying_time_hours, tg_c, melt_temp_c,
        tensile_strength_xy_mpa, tensile_modulus_xy_mpa,
        elongation_break_xy_percent, flexural_strength_mpa,
        density_g_cm3, shore_hardness_d,
        print_speed_max_mms, high_speed_capable, is_nozzle_abrasive,
        variant_price, net_weight_g,
        ease_of_printing_score, strength_index, printability_index
      `);

    if (filamentId) {
      query = query.eq('id', filamentId);
    } else {
      // Prioritize filaments with specs but no scores
      query = query
        .or('nozzle_temp_min_c.not.is.null,tensile_strength_xy_mpa.not.is.null,material.not.is.null')
        .is('ease_of_printing_score', null)
        .limit(limit);
    }

    const { data: filaments, error } = await query;

    if (error) {
      console.error('[calculate-scores] Query error:', error);
      throw error;
    }

    console.log(`[calculate-scores] Found ${filaments?.length || 0} filaments to process`);

    const results: Array<{
      id: string;
      vendor: string | null;
      material: string | null;
      scores: ScoreResult;
      updated: boolean;
    }> = [];

    for (const filament of filaments || []) {
      const scores = calculateScores(filament as FilamentSpecs);
      
      let updated = false;
      
      if (mode === 'update' && (scores.ease_of_printing_score !== null || scores.strength_index !== null || scores.printability_index !== null)) {
        const updateData: Record<string, number | null> = {};
        
        if (scores.ease_of_printing_score !== null) {
          updateData.ease_of_printing_score = scores.ease_of_printing_score;
        }
        if (scores.strength_index !== null) {
          updateData.strength_index = scores.strength_index;
        }
        if (scores.printability_index !== null) {
          updateData.printability_index = scores.printability_index;
        }

        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[calculate-scores] Update error for ${filament.id}:`, updateError);
        } else {
          updated = true;
          console.log(`[calculate-scores] Updated ${filament.vendor} ${filament.material}: ease=${scores.ease_of_printing_score}, strength=${scores.strength_index}`);
        }
      }

      results.push({
        id: filament.id,
        vendor: filament.vendor,
        material: filament.material,
        scores,
        updated,
      });
    }

    const stats = {
      total: results.length,
      withEase: results.filter(r => r.scores.ease_of_printing_score !== null).length,
      withStrength: results.filter(r => r.scores.strength_index !== null).length,
      withPrintability: results.filter(r => r.scores.printability_index !== null).length,
      updated: results.filter(r => r.updated).length,
    };

    console.log(`[calculate-scores] Stats:`, stats);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        stats,
        results: mode === 'preview' ? results.slice(0, 20) : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error('[calculate-scores] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
