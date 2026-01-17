import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive validation ranges for all TDS spec types
const VALIDATION_RULES = {
  // Thermal properties
  nozzle_temp: { min: 160, max: 400, unit: '°C' },
  bed_temp: { min: 0, max: 150, unit: '°C' },
  drying_temp: { min: 30, max: 120, unit: '°C' },
  drying_time: { min: 1, max: 24, unit: 'hours' },
  tg: { min: 30, max: 250, unit: '°C' },
  melt_temp: { min: 100, max: 400, unit: '°C' },
  vicat_softening_temp: { min: 50, max: 250, unit: '°C' },
  hdt_045: { min: 40, max: 300, unit: '°C' },
  hdt_18: { min: 30, max: 250, unit: '°C' },
  
  // Physical properties
  density: { min: 0.8, max: 2.5, unit: 'g/cm³' },
  melt_index: { min: 1, max: 100, unit: 'g/10min' },
  water_absorption: { min: 0, max: 15, unit: '%' },
  
  // Mechanical XY properties
  tensile_strength: { min: 5, max: 200, unit: 'MPa' },
  tensile_modulus: { min: 100, max: 15000, unit: 'MPa' },
  elongation: { min: 0.5, max: 800, unit: '%' },
  flexural_strength: { min: 10, max: 200, unit: 'MPa' },
  bending_modulus: { min: 100, max: 15000, unit: 'MPa' },
  bending_strength: { min: 10, max: 200, unit: 'MPa' },
  
  // Mechanical Z properties (typically lower than XY)
  tensile_strength_z: { min: 3, max: 150, unit: 'MPa' },
  tensile_modulus_z: { min: 50, max: 12000, unit: 'MPa' },
  elongation_z: { min: 0.1, max: 500, unit: '%' },
  
  // Impact properties
  impact_strength: { min: 1, max: 100, unit: 'kJ/m²' },
  notched_izod: { min: 10, max: 1000, unit: 'J/m' },
  
  // Hardness
  shore_hardness: { min: 10, max: 100, unit: 'D' },
  shore_hardness_a: { min: 10, max: 100, unit: 'A' },
  
  // Advanced mechanical
  youngs_modulus: { min: 100, max: 15000, unit: 'MPa' },
  poissons_ratio: { min: 0.1, max: 0.5, unit: '' },
  
  // Print settings
  print_speed: { min: 10, max: 600, unit: 'mm/s' },
  transmission_distance: { min: 0.2, max: 15.0, unit: 'mm' },
  max_overhang_angle: { min: 20, max: 90, unit: '°' },
  max_bridging_length: { min: 5, max: 100, unit: 'mm' },
  
  // Optical properties
  light_transmission: { min: 0, max: 100, unit: '%' },
  haze: { min: 0, max: 100, unit: '%' },
  
  // Electrical properties
  surface_resistivity: { min: 1e2, max: 1e18, unit: 'Ω' },
  volume_resistivity: { min: 1e2, max: 1e18, unit: 'Ω·cm' },
};

// Material-specific expected ranges
const MATERIAL_RANGES: Record<string, Partial<typeof VALIDATION_RULES>> = {
  'PLA': {
    nozzle_temp: { min: 180, max: 230, unit: '°C' },
    bed_temp: { min: 0, max: 70, unit: '°C' },
    density: { min: 1.20, max: 1.30, unit: 'g/cm³' },
    tg: { min: 55, max: 65, unit: '°C' },
    tensile_strength: { min: 30, max: 70, unit: 'MPa' },
    elongation: { min: 2, max: 10, unit: '%' },
  },
  'ABS': {
    nozzle_temp: { min: 220, max: 270, unit: '°C' },
    bed_temp: { min: 80, max: 120, unit: '°C' },
    density: { min: 1.00, max: 1.10, unit: 'g/cm³' },
    tg: { min: 100, max: 110, unit: '°C' },
    impact_strength: { min: 15, max: 40, unit: 'kJ/m²' },
  },
  'PETG': {
    nozzle_temp: { min: 220, max: 260, unit: '°C' },
    bed_temp: { min: 60, max: 90, unit: '°C' },
    density: { min: 1.23, max: 1.38, unit: 'g/cm³' },
    tg: { min: 75, max: 85, unit: '°C' },
  },
  'TPU': {
    nozzle_temp: { min: 200, max: 240, unit: '°C' },
    bed_temp: { min: 20, max: 70, unit: '°C' },
    shore_hardness: { min: 60, max: 100, unit: 'A/D' },
    elongation: { min: 200, max: 800, unit: '%' },
    density: { min: 1.10, max: 1.25, unit: 'g/cm³' },
  },
  'Nylon': {
    nozzle_temp: { min: 240, max: 290, unit: '°C' },
    bed_temp: { min: 60, max: 100, unit: '°C' },
    drying_temp: { min: 70, max: 90, unit: '°C' },
    water_absorption: { min: 1, max: 10, unit: '%' },
  },
  'ASA': {
    nozzle_temp: { min: 230, max: 270, unit: '°C' },
    bed_temp: { min: 80, max: 110, unit: '°C' },
    tg: { min: 95, max: 110, unit: '°C' },
  },
  'PC': {
    nozzle_temp: { min: 260, max: 310, unit: '°C' },
    bed_temp: { min: 90, max: 130, unit: '°C' },
    tg: { min: 140, max: 150, unit: '°C' },
    impact_strength: { min: 30, max: 80, unit: 'kJ/m²' },
  },
  'PEEK': {
    nozzle_temp: { min: 360, max: 420, unit: '°C' },
    bed_temp: { min: 120, max: 160, unit: '°C' },
    tg: { min: 140, max: 145, unit: '°C' },
    tensile_strength: { min: 80, max: 120, unit: 'MPa' },
  },
  'PVA': {
    nozzle_temp: { min: 180, max: 220, unit: '°C' },
    bed_temp: { min: 40, max: 60, unit: '°C' },
    water_absorption: { min: 5, max: 15, unit: '%' },
  },
};

interface NormalizationIssue {
  filamentId: string;
  productTitle: string;
  field: string;
  currentValue: number | string | null;
  expectedRange: string;
  severity: 'warning' | 'error';
  suggestion?: string;
}

interface NormalizationResult {
  filamentId: string;
  productTitle: string;
  issuesFound: number;
  issues: NormalizationIssue[];
  correctionsMade: number;
}

function getMaterialType(material: string | null): string {
  if (!material) return 'UNKNOWN';
  const upper = material.toUpperCase();
  
  if (upper.includes('PEEK')) return 'PEEK';
  if (upper.includes('PVA')) return 'PVA';
  if (upper.includes('PLA')) return 'PLA';
  if (upper.includes('ABS')) return 'ABS';
  if (upper.includes('PETG') || upper.includes('PET-G')) return 'PETG';
  if (upper.includes('TPU') || upper.includes('TPE')) return 'TPU';
  if (upper.includes('NYLON') || upper.includes('PA')) return 'Nylon';
  if (upper.includes('ASA')) return 'ASA';
  if (upper.includes('PC') || upper.includes('POLYCARBONATE')) return 'PC';
  
  return 'UNKNOWN';
}

function validateValue(
  value: number | null,
  field: string,
  material: string
): { valid: boolean; severity?: 'warning' | 'error'; suggestion?: string } {
  if (value === null || value === undefined) {
    return { valid: true }; // Null values are valid (just missing)
  }

  const baseRules = VALIDATION_RULES[field as keyof typeof VALIDATION_RULES];
  const materialRanges = MATERIAL_RANGES[material];
  const materialRule = materialRanges?.[field as keyof typeof materialRanges];

  const rules = materialRule || baseRules;
  if (!rules) return { valid: true };

  // Check if value is way outside base range (error)
  if (baseRules && (value < baseRules.min * 0.5 || value > baseRules.max * 2)) {
    return {
      valid: false,
      severity: 'error',
      suggestion: `Value ${value} is far outside expected range ${baseRules.min}-${baseRules.max} ${baseRules.unit}`,
    };
  }

  // Check if value is outside material-specific range (warning)
  if (materialRule && (value < materialRule.min || value > materialRule.max)) {
    return {
      valid: false,
      severity: 'warning',
      suggestion: `Value ${value} is outside typical ${material} range ${materialRule.min}-${materialRule.max} ${materialRule.unit}`,
    };
  }

  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: isAdmin } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      mode = 'audit', // 'audit' | 'fix'
      brandSlug = null,
      limit = 1000,
    } = body;

    console.log(`Running specification normalization: mode=${mode}, brand=${brandSlug}`);

    // Build query for filaments - fetch ALL granular TDS fields
    let query = supabase
      .from('filaments')
      .select(`
        id, product_title, material, vendor,
        nozzle_temp_min_c, nozzle_temp_max_c, nozzle_temp_sweetspot_c,
        bed_temp_min_c, bed_temp_max_c,
        print_speed_max_mms,
        drying_temp_c, drying_time_hours,
        density_g_cm3,
        tensile_strength_xy_mpa, tensile_modulus_xy_mpa, elongation_break_xy_percent,
        tensile_strength_z_mpa, tensile_modulus_z_mpa, elongation_break_z_percent,
        flexural_strength_mpa, bending_modulus_mpa, bending_strength_mpa,
        impact_strength_kj_m2, notched_izod_j_m,
        shore_hardness_d, hardness_shore_a,
        youngs_modulus_mpa, poissons_ratio,
        tg_c, melt_temp_c, vicat_softening_temp_c, hdt_045_mpa_c, hdt_18_mpa_c,
        melt_index_g_10min, water_absorption_percent,
        max_overhang_angle_deg, max_bridging_length_mm,
        light_transmission_percent, haze_percent,
        surface_resistivity_ohm, volume_resistivity_ohm_cm,
        transmission_distance
      `)
      .limit(limit);

    if (brandSlug) {
      const { data: brand } = await supabase
        .from('automated_brands')
        .select('id')
        .eq('brand_slug', brandSlug)
        .single();
      
      if (brand) {
        query = query.eq('brand_id', brand.id);
      }
    }

    const { data: filaments, error: queryError } = await query;

    if (queryError || !filaments) {
      return new Response(JSON.stringify({ error: 'Failed to query filaments' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Analyzing ${filaments.length} filaments`);

    const results: NormalizationResult[] = [];
    const allIssues: NormalizationIssue[] = [];
    let totalIssues = 0;
    let errorCount = 0;
    let warningCount = 0;

    // Comprehensive field mapping - all 24+ TDS fields
    const fieldsToCheck = [
      // Thermal properties
      { field: 'nozzle_temp_min_c', ruleKey: 'nozzle_temp' },
      { field: 'nozzle_temp_max_c', ruleKey: 'nozzle_temp' },
      { field: 'bed_temp_min_c', ruleKey: 'bed_temp' },
      { field: 'bed_temp_max_c', ruleKey: 'bed_temp' },
      { field: 'drying_temp_c', ruleKey: 'drying_temp' },
      { field: 'drying_time_hours', ruleKey: 'drying_time' },
      { field: 'tg_c', ruleKey: 'tg' },
      { field: 'melt_temp_c', ruleKey: 'melt_temp' },
      { field: 'vicat_softening_temp_c', ruleKey: 'vicat_softening_temp' },
      { field: 'hdt_045_mpa_c', ruleKey: 'hdt_045' },
      { field: 'hdt_18_mpa_c', ruleKey: 'hdt_18' },
      
      // Physical properties
      { field: 'density_g_cm3', ruleKey: 'density' },
      { field: 'melt_index_g_10min', ruleKey: 'melt_index' },
      { field: 'water_absorption_percent', ruleKey: 'water_absorption' },
      
      // Mechanical XY properties
      { field: 'tensile_strength_xy_mpa', ruleKey: 'tensile_strength' },
      { field: 'tensile_modulus_xy_mpa', ruleKey: 'tensile_modulus' },
      { field: 'elongation_break_xy_percent', ruleKey: 'elongation' },
      { field: 'flexural_strength_mpa', ruleKey: 'flexural_strength' },
      { field: 'bending_modulus_mpa', ruleKey: 'bending_modulus' },
      { field: 'bending_strength_mpa', ruleKey: 'bending_strength' },
      
      // Mechanical Z properties
      { field: 'tensile_strength_z_mpa', ruleKey: 'tensile_strength_z' },
      { field: 'tensile_modulus_z_mpa', ruleKey: 'tensile_modulus_z' },
      { field: 'elongation_break_z_percent', ruleKey: 'elongation_z' },
      
      // Impact properties
      { field: 'impact_strength_kj_m2', ruleKey: 'impact_strength' },
      { field: 'notched_izod_j_m', ruleKey: 'notched_izod' },
      
      // Hardness
      { field: 'shore_hardness_d', ruleKey: 'shore_hardness' },
      { field: 'hardness_shore_a', ruleKey: 'shore_hardness_a' },
      
      // Advanced mechanical
      { field: 'youngs_modulus_mpa', ruleKey: 'youngs_modulus' },
      { field: 'poissons_ratio', ruleKey: 'poissons_ratio' },
      
      // Print settings
      { field: 'print_speed_max_mms', ruleKey: 'print_speed' },
      { field: 'transmission_distance', ruleKey: 'transmission_distance' },
      { field: 'max_overhang_angle_deg', ruleKey: 'max_overhang_angle' },
      { field: 'max_bridging_length_mm', ruleKey: 'max_bridging_length' },
      
      // Optical properties
      { field: 'light_transmission_percent', ruleKey: 'light_transmission' },
      { field: 'haze_percent', ruleKey: 'haze' },
      
      // Electrical properties
      { field: 'surface_resistivity_ohm', ruleKey: 'surface_resistivity' },
      { field: 'volume_resistivity_ohm_cm', ruleKey: 'volume_resistivity' },
    ];

    for (const filament of filaments) {
      const materialType = getMaterialType(filament.material);
      const issues: NormalizationIssue[] = [];

      for (const { field, ruleKey } of fieldsToCheck) {
        const value = (filament as any)[field];
        const validation = validateValue(value, ruleKey, materialType);

        if (!validation.valid) {
          const rule = VALIDATION_RULES[ruleKey as keyof typeof VALIDATION_RULES];
          issues.push({
            filamentId: filament.id,
            productTitle: filament.product_title,
            field,
            currentValue: value,
            expectedRange: rule ? `${rule.min}-${rule.max} ${rule.unit}` : 'unknown',
            severity: validation.severity || 'warning',
            suggestion: validation.suggestion,
          });

          if (validation.severity === 'error') errorCount++;
          else warningCount++;
        }
      }

      // Cross-validation: max should be >= min for temperatures
      if (filament.nozzle_temp_min_c && filament.nozzle_temp_max_c && 
          filament.nozzle_temp_max_c < filament.nozzle_temp_min_c) {
        issues.push({
          filamentId: filament.id,
          productTitle: filament.product_title,
          field: 'nozzle_temp_range',
          currentValue: `${filament.nozzle_temp_min_c}-${filament.nozzle_temp_max_c}`,
          expectedRange: 'max >= min',
          severity: 'error',
          suggestion: 'Min and max temperatures are swapped',
        });
        errorCount++;
      }

      if (filament.bed_temp_min_c && filament.bed_temp_max_c && 
          filament.bed_temp_max_c < filament.bed_temp_min_c) {
        issues.push({
          filamentId: filament.id,
          productTitle: filament.product_title,
          field: 'bed_temp_range',
          currentValue: `${filament.bed_temp_min_c}-${filament.bed_temp_max_c}`,
          expectedRange: 'max >= min',
          severity: 'error',
          suggestion: 'Min and max temperatures are swapped',
        });
        errorCount++;
      }

      // Cross-validation: XY properties should generally be >= Z properties
      if (filament.tensile_strength_xy_mpa && filament.tensile_strength_z_mpa &&
          filament.tensile_strength_z_mpa > filament.tensile_strength_xy_mpa * 1.5) {
        issues.push({
          filamentId: filament.id,
          productTitle: filament.product_title,
          field: 'tensile_strength_xy_vs_z',
          currentValue: `XY: ${filament.tensile_strength_xy_mpa}, Z: ${filament.tensile_strength_z_mpa}`,
          expectedRange: 'Z typically ≤ XY',
          severity: 'warning',
          suggestion: 'Z-direction strength unusually higher than XY - verify data',
        });
        warningCount++;
      }

      // HDT 0.45 should be >= HDT 1.8
      if (filament.hdt_045_mpa_c && filament.hdt_18_mpa_c &&
          filament.hdt_18_mpa_c > filament.hdt_045_mpa_c) {
        issues.push({
          filamentId: filament.id,
          productTitle: filament.product_title,
          field: 'hdt_comparison',
          currentValue: `HDT@0.45: ${filament.hdt_045_mpa_c}°C, HDT@1.8: ${filament.hdt_18_mpa_c}°C`,
          expectedRange: 'HDT@1.8 ≤ HDT@0.45',
          severity: 'warning',
          suggestion: 'HDT at higher load should be lower or equal',
        });
        warningCount++;
      }

      if (issues.length > 0) {
        results.push({
          filamentId: filament.id,
          productTitle: filament.product_title,
          issuesFound: issues.length,
          issues,
          correctionsMade: 0,
        });
        allIssues.push(...issues);
        totalIssues += issues.length;
      }
    }

    // Group issues by type for summary
    const issuesByField: Record<string, number> = {};
    for (const issue of allIssues) {
      issuesByField[issue.field] = (issuesByField[issue.field] || 0) + 1;
    }

    // Count filaments with specs in each category
    const specCoverage = {
      thermal: filaments.filter(f => f.nozzle_temp_min_c || f.tg_c || f.melt_temp_c).length,
      mechanical_xy: filaments.filter(f => f.tensile_strength_xy_mpa || f.flexural_strength_mpa).length,
      mechanical_z: filaments.filter(f => f.tensile_strength_z_mpa).length,
      impact: filaments.filter(f => f.impact_strength_kj_m2 || f.notched_izod_j_m).length,
      advanced_thermal: filaments.filter(f => f.vicat_softening_temp_c || f.hdt_045_mpa_c).length,
      physical: filaments.filter(f => f.density_g_cm3 || f.melt_index_g_10min).length,
      optical: filaments.filter(f => f.light_transmission_percent || f.haze_percent).length,
      electrical: filaments.filter(f => f.surface_resistivity_ohm || f.volume_resistivity_ohm_cm).length,
    };

    return new Response(JSON.stringify({
      success: true,
      mode,
      brandSlug,
      summary: {
        filamentsAnalyzed: filaments.length,
        filamentsWithIssues: results.length,
        totalIssues,
        errors: errorCount,
        warnings: warningCount,
        issuesByField,
        specCoverage,
      },
      results: results.slice(0, 100), // Limit detailed results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in normalize-filament-specs:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
