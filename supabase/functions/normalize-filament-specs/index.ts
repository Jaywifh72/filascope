import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation ranges for different spec types
const VALIDATION_RULES = {
  nozzle_temp: { min: 160, max: 400, unit: '°C' },
  bed_temp: { min: 0, max: 150, unit: '°C' },
  drying_temp: { min: 30, max: 120, unit: '°C' },
  drying_time: { min: 1, max: 24, unit: 'hours' },
  density: { min: 0.8, max: 2.5, unit: 'g/cm³' },
  tensile_strength: { min: 5, max: 200, unit: 'MPa' },
  tensile_modulus: { min: 100, max: 15000, unit: 'MPa' },
  elongation: { min: 0.5, max: 800, unit: '%' },
  flexural_strength: { min: 10, max: 200, unit: 'MPa' },
  shore_hardness: { min: 10, max: 100, unit: 'D' },
  tg: { min: 30, max: 250, unit: '°C' },
  melt_temp: { min: 100, max: 400, unit: '°C' },
  print_speed: { min: 10, max: 600, unit: 'mm/s' },
  transmission_distance: { min: 0.2, max: 15.0, unit: 'mm' },
};

// Material-specific expected ranges
const MATERIAL_RANGES: Record<string, Partial<typeof VALIDATION_RULES>> = {
  'PLA': {
    nozzle_temp: { min: 180, max: 230, unit: '°C' },
    bed_temp: { min: 0, max: 70, unit: '°C' },
    density: { min: 1.20, max: 1.30, unit: 'g/cm³' },
  },
  'ABS': {
    nozzle_temp: { min: 220, max: 270, unit: '°C' },
    bed_temp: { min: 80, max: 120, unit: '°C' },
    density: { min: 1.00, max: 1.10, unit: 'g/cm³' },
  },
  'PETG': {
    nozzle_temp: { min: 220, max: 260, unit: '°C' },
    bed_temp: { min: 60, max: 90, unit: '°C' },
    density: { min: 1.23, max: 1.38, unit: 'g/cm³' },
  },
  'TPU': {
    nozzle_temp: { min: 200, max: 240, unit: '°C' },
    bed_temp: { min: 20, max: 70, unit: '°C' },
    shore_hardness: { min: 60, max: 100, unit: 'A/D' },
    elongation: { min: 200, max: 800, unit: '%' },
  },
  'Nylon': {
    nozzle_temp: { min: 240, max: 290, unit: '°C' },
    bed_temp: { min: 60, max: 100, unit: '°C' },
    drying_temp: { min: 70, max: 90, unit: '°C' },
  },
  'ASA': {
    nozzle_temp: { min: 230, max: 270, unit: '°C' },
    bed_temp: { min: 80, max: 110, unit: '°C' },
  },
  'PC': {
    nozzle_temp: { min: 260, max: 310, unit: '°C' },
    bed_temp: { min: 90, max: 130, unit: '°C' },
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
      limit = 500,
    } = body;

    console.log(`Running specification normalization: mode=${mode}, brand=${brandSlug}`);

    // Build query for filaments with specs
    let query = supabase
      .from('filaments')
      .select(`
        id, product_title, material, vendor,
        nozzle_temp_min_c, nozzle_temp_max_c, nozzle_temp_sweetspot_c,
        bed_temp_min_c, bed_temp_max_c,
        print_speed_max_mms,
        drying_temp_c, drying_time_hours,
        density_g_cm3, tensile_strength_xy_mpa, tensile_modulus_xy_mpa,
        elongation_break_xy_percent, flexural_strength_mpa,
        shore_hardness_d, tg_c, melt_temp_c,
        transmission_distance
      `)
      .or('nozzle_temp_min_c.not.is.null,density_g_cm3.not.is.null,tensile_strength_xy_mpa.not.is.null')
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

    const fieldsToCheck = [
      { field: 'nozzle_temp_min_c', ruleKey: 'nozzle_temp' },
      { field: 'nozzle_temp_max_c', ruleKey: 'nozzle_temp' },
      { field: 'bed_temp_min_c', ruleKey: 'bed_temp' },
      { field: 'bed_temp_max_c', ruleKey: 'bed_temp' },
      { field: 'print_speed_max_mms', ruleKey: 'print_speed' },
      { field: 'drying_temp_c', ruleKey: 'drying_temp' },
      { field: 'drying_time_hours', ruleKey: 'drying_time' },
      { field: 'density_g_cm3', ruleKey: 'density' },
      { field: 'tensile_strength_xy_mpa', ruleKey: 'tensile_strength' },
      { field: 'tensile_modulus_xy_mpa', ruleKey: 'tensile_modulus' },
      { field: 'elongation_break_xy_percent', ruleKey: 'elongation' },
      { field: 'flexural_strength_mpa', ruleKey: 'flexural_strength' },
      { field: 'shore_hardness_d', ruleKey: 'shore_hardness' },
      { field: 'tg_c', ruleKey: 'tg' },
      { field: 'melt_temp_c', ruleKey: 'melt_temp' },
      { field: 'transmission_distance', ruleKey: 'transmission_distance' },
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

      // Cross-validation: max should be >= min
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
      },
      results: results.slice(0, 50), // Limit detailed results
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
