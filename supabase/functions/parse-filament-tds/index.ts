import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TDSData {
  // Print settings
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  nozzle_temp_sweetspot_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  print_speed_max_mms: number | null;
  print_speed_min_mms: number | null;
  fan_min_percent: number | null;
  fan_max_percent: number | null;
  retraction_length_mm: number | null;
  retraction_speed_mms: number | null;
  enclosure_required: boolean | null;
  
  // Drying
  drying_temp_c: number | null;
  drying_time_hours: number | null;
  
  // Physical properties
  density_g_cm3: number | null;
  water_absorption_percent: number | null;
  
  // Mechanical - XY plane
  tensile_strength_xy_mpa: number | null;
  tensile_modulus_xy_mpa: number | null;
  elongation_break_xy_percent: number | null;
  
  // Mechanical - Z direction
  tensile_strength_z_mpa: number | null;
  tensile_modulus_z_mpa: number | null;
  elongation_break_z_percent: number | null;
  
  // Flexural properties
  flexural_strength_mpa: number | null;
  bending_strength_mpa: number | null;
  bending_modulus_mpa: number | null;
  
  // Impact & hardness
  impact_strength_kj_m2: number | null;
  notched_izod_j_m: number | null;
  shore_hardness_d: number | null;
  hardness_shore_a: number | null;
  
  // Thermal properties
  tg_c: number | null;
  melt_temp_c: number | null;
  vicat_softening_temp_c: number | null;
  hdt_045_mpa_c: number | null;
  hdt_18_mpa_c: number | null;
  
  // Melt & flow
  melt_index_g_10min: number | null;
  
  // Print quality parameters
  max_overhang_angle_deg: number | null;
  max_bridging_length_mm: number | null;
  
  // Annealing
  annealing_temp_c: number | null;
  annealing_time_hours: number | null;
  
  // Optical properties
  transmission_distance: number | null;
  light_transmission_percent: number | null;
  haze_percent: number | null;
  
  // Electrical properties
  surface_resistivity_ohm: number | null;
  
  // Other
  moisture_sensitivity_level: string | null;
  is_nozzle_abrasive: boolean | null;
  chemical_resistance: Record<string, string> | null;
  extraction_confidence: number;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  cleanedData: Partial<TDSData>;
}

const TDS_EXTRACTION_PROMPT = `You are a technical data sheet (TDS) parser for 3D printing filaments. Extract ALL available specifications from the provided TDS content.

Return a JSON object with these fields (use null if not found):

PRINT SETTINGS:
- nozzle_temp_min_c: Minimum nozzle/hotend temperature in Celsius (number)
- nozzle_temp_max_c: Maximum nozzle/hotend temperature in Celsius (number)
- nozzle_temp_sweetspot_c: Recommended/optimal nozzle temperature in Celsius (number)
- bed_temp_min_c: Minimum bed/platform temperature in Celsius (number)
- bed_temp_max_c: Maximum bed/platform temperature in Celsius (number)
- print_speed_max_mms: Maximum print speed in mm/s (number)
- print_speed_min_mms: Minimum recommended print speed in mm/s (number)
- fan_min_percent: Minimum cooling fan percentage (number 0-100)
- fan_max_percent: Maximum cooling fan percentage (number 0-100)
- retraction_length_mm: Recommended retraction distance/length in mm (number)
- retraction_speed_mms: Recommended retraction speed in mm/s (number)
- enclosure_required: Whether an enclosure is required or strongly recommended (boolean)

DRYING:
- drying_temp_c: Recommended drying temperature in Celsius (number)
- drying_time_hours: Recommended drying time in hours (number)

PHYSICAL PROPERTIES:
- density_g_cm3: Density in g/cm³ (number, typically 1.0-2.0)
- water_absorption_percent: Saturated water absorption rate in percent (number)

MECHANICAL PROPERTIES - XY PLANE (horizontal):
- tensile_strength_xy_mpa: Tensile strength XY in MPa (number)
- tensile_modulus_xy_mpa: Tensile/Young's modulus XY in MPa (number)
- elongation_break_xy_percent: Elongation at break XY in percent (number)

MECHANICAL PROPERTIES - Z DIRECTION (vertical/layer adhesion):
- tensile_strength_z_mpa: Tensile strength Z in MPa (number)
- tensile_modulus_z_mpa: Tensile modulus Z in MPa (number)
- elongation_break_z_percent: Elongation at break Z in percent (number)

FLEXURAL PROPERTIES:
- flexural_strength_mpa: Flexural strength in MPa (number)
- bending_strength_mpa: Bending strength in MPa (same as flexural, use if labeled "bending")
- bending_modulus_mpa: Bending/flexural modulus in MPa (number)

IMPACT & HARDNESS:
- impact_strength_kj_m2: Impact strength (Charpy/Izod unnotched) in kJ/m² (number)
- notched_izod_j_m: Notched Izod impact strength in J/m (number)
- shore_hardness_d: Shore D hardness (number)
- hardness_shore_a: Shore A hardness for flexible materials (number)

THERMAL PROPERTIES:
- tg_c: Glass transition temperature (Tg) in Celsius (number)
- melt_temp_c: Melting temperature in Celsius (number)
- vicat_softening_temp_c: Vicat softening temperature in Celsius (number)
- hdt_045_mpa_c: Heat deflection temperature at 0.45 MPa in Celsius (number)
- hdt_18_mpa_c: Heat deflection temperature at 1.8 MPa in Celsius (number)

MELT & FLOW:
- melt_index_g_10min: Melt flow index/MFI in g/10min (number)

PRINT QUALITY PARAMETERS:
- max_overhang_angle_deg: Maximum overhang angle without supports in degrees (number)
- max_bridging_length_mm: Maximum bridging length in mm (number)

ANNEALING/POST-PROCESSING:
- annealing_temp_c: Annealing temperature in Celsius (number)
- annealing_time_hours: Annealing time in hours (number)

OPTICAL PROPERTIES (CRITICAL FOR HUEFORGE):
- transmission_distance: Light transmission distance (TD) in mm for HueForge (number, typically 0.5-8.0)
  Also look for: "TD", "TD value", "transmission", "light transmission", "optical distance"
- light_transmission_percent: Light transmission/transmittance in percent (number)
- haze_percent: Haze value in percent (number)

ELECTRICAL PROPERTIES:
- surface_resistivity_ohm: Surface resistivity in Ohm (number)

OTHER:
- moisture_sensitivity_level: "low", "medium", or "high"
- is_nozzle_abrasive: true if contains glass fiber, carbon fiber, metal, or other abrasive materials (boolean)
- chemical_resistance: Object with chemical names as keys and resistance ratings as values (e.g., {"Acetone": "Poor", "Ethanol": "Good"})
- extraction_confidence: Your confidence in the extraction accuracy from 0-100 (number)

IMPORTANT RULES:
1. Only extract values explicitly stated in the TDS
2. Convert all temperatures to Celsius (if Fahrenheit, convert)
3. For temperature ranges like "200-220°C", extract min and max separately
4. For single recommended temps, use that as the sweetspot
5. Return ONLY valid JSON, no additional text
6. Extract Z-direction properties separately from XY properties when available
7. Look for HDT values - they are often listed as "HDT/A" (0.45 MPa) and "HDT/B" (1.8 MPa)
8. Melt Index may be labeled as "MFI", "MFR", or "Melt Flow Rate"

TDS CONTENT:
`;

// Validation rules based on material type
const VALIDATION_RULES = {
  nozzle_temp: { min: 160, max: 400 },
  bed_temp: { min: 0, max: 150 },
  drying_temp: { min: 30, max: 120 },
  density: { min: 0.8, max: 2.5 },
  tensile_strength: { min: 5, max: 200 },
  tensile_modulus: { min: 100, max: 15000 },
  elongation: { min: 0.5, max: 800 },
  tg: { min: 30, max: 250 },
  melt_temp: { min: 100, max: 400 },
  transmission_distance: { min: 0.2, max: 15.0 },
};

function validateExtractedData(data: Partial<TDSData>, material?: string): ValidationResult {
  const warnings: string[] = [];
  const cleanedData: Partial<TDSData> = { ...data };

  // Validate nozzle temperatures
  if (data.nozzle_temp_min_c !== null && data.nozzle_temp_min_c !== undefined) {
    if (data.nozzle_temp_min_c < VALIDATION_RULES.nozzle_temp.min || 
        data.nozzle_temp_min_c > VALIDATION_RULES.nozzle_temp.max) {
      warnings.push(`Nozzle min temp ${data.nozzle_temp_min_c}°C out of range`);
      cleanedData.nozzle_temp_min_c = null;
    }
  }
  if (data.nozzle_temp_max_c !== null && data.nozzle_temp_max_c !== undefined) {
    if (data.nozzle_temp_max_c < VALIDATION_RULES.nozzle_temp.min || 
        data.nozzle_temp_max_c > VALIDATION_RULES.nozzle_temp.max) {
      warnings.push(`Nozzle max temp ${data.nozzle_temp_max_c}°C out of range`);
      cleanedData.nozzle_temp_max_c = null;
    }
  }

  // Cross-validate: max should be >= min
  if (cleanedData.nozzle_temp_min_c && cleanedData.nozzle_temp_max_c) {
    if (cleanedData.nozzle_temp_max_c < cleanedData.nozzle_temp_min_c) {
      warnings.push('Nozzle max temp < min temp, swapping');
      const temp = cleanedData.nozzle_temp_min_c;
      cleanedData.nozzle_temp_min_c = cleanedData.nozzle_temp_max_c;
      cleanedData.nozzle_temp_max_c = temp;
    }
  }

  // Validate bed temperatures
  if (data.bed_temp_min_c !== null && data.bed_temp_min_c !== undefined) {
    if (data.bed_temp_min_c < VALIDATION_RULES.bed_temp.min || 
        data.bed_temp_min_c > VALIDATION_RULES.bed_temp.max) {
      warnings.push(`Bed min temp ${data.bed_temp_min_c}°C out of range`);
      cleanedData.bed_temp_min_c = null;
    }
  }
  if (data.bed_temp_max_c !== null && data.bed_temp_max_c !== undefined) {
    if (data.bed_temp_max_c < VALIDATION_RULES.bed_temp.min || 
        data.bed_temp_max_c > VALIDATION_RULES.bed_temp.max) {
      warnings.push(`Bed max temp ${data.bed_temp_max_c}°C out of range`);
      cleanedData.bed_temp_max_c = null;
    }
  }

  // Validate density
  if (data.density_g_cm3 !== null && data.density_g_cm3 !== undefined) {
    if (data.density_g_cm3 < VALIDATION_RULES.density.min || 
        data.density_g_cm3 > VALIDATION_RULES.density.max) {
      warnings.push(`Density ${data.density_g_cm3} g/cm³ out of range`);
      cleanedData.density_g_cm3 = null;
    }
  }

  // Validate drying temp
  if (data.drying_temp_c !== null && data.drying_temp_c !== undefined) {
    if (data.drying_temp_c < VALIDATION_RULES.drying_temp.min || 
        data.drying_temp_c > VALIDATION_RULES.drying_temp.max) {
      warnings.push(`Drying temp ${data.drying_temp_c}°C out of range`);
      cleanedData.drying_temp_c = null;
    }
  }

  // Validate tensile strength
  if (data.tensile_strength_xy_mpa !== null && data.tensile_strength_xy_mpa !== undefined) {
    if (data.tensile_strength_xy_mpa < VALIDATION_RULES.tensile_strength.min || 
        data.tensile_strength_xy_mpa > VALIDATION_RULES.tensile_strength.max) {
      warnings.push(`Tensile strength ${data.tensile_strength_xy_mpa} MPa out of range`);
      cleanedData.tensile_strength_xy_mpa = null;
    }
  }

  // Material-specific validations
  if (material) {
    const lowerMaterial = material.toLowerCase();
    
    // TPU typically has lower nozzle temps
    if (lowerMaterial.includes('tpu') || lowerMaterial.includes('tpe')) {
      if (cleanedData.nozzle_temp_max_c && cleanedData.nozzle_temp_max_c > 260) {
        warnings.push('TPU nozzle temp unusually high');
      }
    }
    
    // PLA typically doesn't need high temps
    if (lowerMaterial === 'pla' && cleanedData.nozzle_temp_min_c && cleanedData.nozzle_temp_min_c > 240) {
      warnings.push('PLA nozzle temp unusually high');
    }
  }

  // Confidence threshold
  if (data.extraction_confidence !== undefined && data.extraction_confidence < 50) {
    warnings.push('Low extraction confidence');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    cleanedData,
  };
}

async function fetchTDSContent(tdsUrl: string, firecrawlApiKey: string): Promise<string | null> {
  console.log(`Fetching TDS from: ${tdsUrl}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tdsUrl,
        formats: ['markdown'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Firecrawl error:', await response.text());
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || '';
    
    if (markdown.length < 100) {
      console.log('TDS content too short, might be a download link');
      return null;
    }
    
    console.log(`Extracted ${markdown.length} characters from TDS`);
    return markdown;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('TDS fetch timeout');
    } else {
      console.error('Error fetching TDS:', error);
    }
    return null;
  }
}

async function extractTDSWithAI(tdsContent: string, lovableApiKey: string): Promise<TDSData | null> {
  console.log('Extracting TDS data with AI...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000); // 40 second timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: TDS_EXTRACTION_PROMPT + tdsContent.substring(0, 15000)
          }
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return null;
    }

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    jsonStr = jsonStr.trim();
    
    try {
      const extracted = JSON.parse(jsonStr);
      return {
        // Print settings
        nozzle_temp_min_c: extracted.nozzle_temp_min_c ?? null,
        nozzle_temp_max_c: extracted.nozzle_temp_max_c ?? null,
        nozzle_temp_sweetspot_c: extracted.nozzle_temp_sweetspot_c ?? null,
        bed_temp_min_c: extracted.bed_temp_min_c ?? null,
        bed_temp_max_c: extracted.bed_temp_max_c ?? null,
        print_speed_max_mms: extracted.print_speed_max_mms ?? null,
        print_speed_min_mms: extracted.print_speed_min_mms ?? null,
        fan_min_percent: extracted.fan_min_percent ?? null,
        fan_max_percent: extracted.fan_max_percent ?? null,
        retraction_length_mm: extracted.retraction_length_mm ?? null,
        retraction_speed_mms: extracted.retraction_speed_mms ?? null,
        enclosure_required: extracted.enclosure_required ?? null,
        
        // Drying
        drying_temp_c: extracted.drying_temp_c ?? null,
        drying_time_hours: extracted.drying_time_hours ?? null,
        
        // Physical properties
        density_g_cm3: extracted.density_g_cm3 ?? null,
        water_absorption_percent: extracted.water_absorption_percent ?? null,
        
        // Mechanical - XY plane
        tensile_strength_xy_mpa: extracted.tensile_strength_xy_mpa ?? null,
        tensile_modulus_xy_mpa: extracted.tensile_modulus_xy_mpa ?? null,
        elongation_break_xy_percent: extracted.elongation_break_xy_percent ?? null,
        
        // Mechanical - Z direction
        tensile_strength_z_mpa: extracted.tensile_strength_z_mpa ?? null,
        tensile_modulus_z_mpa: extracted.tensile_modulus_z_mpa ?? null,
        elongation_break_z_percent: extracted.elongation_break_z_percent ?? null,
        
        // Flexural properties
        flexural_strength_mpa: extracted.flexural_strength_mpa ?? null,
        bending_strength_mpa: extracted.bending_strength_mpa ?? null,
        bending_modulus_mpa: extracted.bending_modulus_mpa ?? null,
        
        // Impact & hardness
        impact_strength_kj_m2: extracted.impact_strength_kj_m2 ?? null,
        notched_izod_j_m: extracted.notched_izod_j_m ?? null,
        shore_hardness_d: extracted.shore_hardness_d ?? null,
        hardness_shore_a: extracted.hardness_shore_a ?? null,
        
        // Thermal properties
        tg_c: extracted.tg_c ?? null,
        melt_temp_c: extracted.melt_temp_c ?? null,
        vicat_softening_temp_c: extracted.vicat_softening_temp_c ?? null,
        hdt_045_mpa_c: extracted.hdt_045_mpa_c ?? null,
        hdt_18_mpa_c: extracted.hdt_18_mpa_c ?? null,
        
        // Melt & flow
        melt_index_g_10min: extracted.melt_index_g_10min ?? null,
        
        // Print quality parameters
        max_overhang_angle_deg: extracted.max_overhang_angle_deg ?? null,
        max_bridging_length_mm: extracted.max_bridging_length_mm ?? null,
        
        // Annealing
        annealing_temp_c: extracted.annealing_temp_c ?? null,
        annealing_time_hours: extracted.annealing_time_hours ?? null,
        
        // Optical properties
        transmission_distance: extracted.transmission_distance ?? null,
        light_transmission_percent: extracted.light_transmission_percent ?? null,
        haze_percent: extracted.haze_percent ?? null,
        
        // Electrical properties
        surface_resistivity_ohm: extracted.surface_resistivity_ohm ?? null,
        
        // Other
        moisture_sensitivity_level: extracted.moisture_sensitivity_level ?? null,
        is_nozzle_abrasive: extracted.is_nozzle_abrasive ?? null,
        chemical_resistance: extracted.chemical_resistance ?? null,
        extraction_confidence: extracted.extraction_confidence ?? 0,
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, jsonStr);
      return null;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('AI extraction timeout');
    } else {
      console.error('AI extraction error:', error);
    }
    return null;
  }
}

async function findTDSUrl(productUrl: string, firecrawlApiKey: string): Promise<string | null> {
  console.log(`Searching for TDS on product page: ${productUrl}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['html', 'links'],
        onlyMainContent: false,
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl error:', await response.text());
      return null;
    }

    const data = await response.json();
    const html = data.data?.html || '';
    const links = data.data?.links || [];
    
    const tdsPatterns = [
      /href=["']([^"']*(?:tds|technical[-_]?data[-_]?sheet|datasheet|spec[-_]?sheet)[^"']*\.pdf)["']/gi,
      /href=["']([^"']*\.pdf[^"']*)["'][^>]*>(?:[^<]*(?:TDS|Technical Data|Data Sheet|Specifications))/gi,
    ];
    
    for (const pattern of tdsPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let tdsUrl = match[1];
        if (!tdsUrl.startsWith('http')) {
          const baseUrl = new URL(productUrl);
          tdsUrl = new URL(tdsUrl, baseUrl.origin).href;
        }
        console.log(`Found TDS URL: ${tdsUrl}`);
        return tdsUrl;
      }
    }
    
    for (const link of links) {
      const lowerLink = link.toLowerCase();
      if (lowerLink.includes('.pdf') && 
          (lowerLink.includes('tds') || lowerLink.includes('data') || lowerLink.includes('spec'))) {
        console.log(`Found TDS URL from links: ${link}`);
        return link;
      }
    }
    
    console.log('No TDS URL found on product page');
    return null;
  } catch (error) {
    console.error('Error finding TDS:', error);
    return null;
  }
}

// Process filaments in background - this function runs after response is sent
async function processFilamentsInBackground(
  filaments: any[],
  syncLogId: string,
  brandSlug: string,
  brandId: string,
  firecrawlApiKey: string,
  lovableApiKey: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  dryRun: boolean
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  let successful = 0;
  let failed = 0;
  const results: any[] = [];
  
  console.log(`[BG] Starting background processing for ${brandSlug}: ${filaments.length} filaments`);

  for (let i = 0; i < filaments.length; i++) {
    const filament = filaments[i];
    const startTime = Date.now();
    
    console.log(`[BG] Processing ${i + 1}/${filaments.length}: ${filament.product_title}`);

    // Update progress in sync log
    await supabase
      .from('brand_sync_logs')
      .update({
        products_processed: {
          current: i + 1,
          total: filaments.length,
          successful,
          failed,
          current_product: filament.product_title,
        },
        notes: `Processing ${i + 1}/${filaments.length}: ${filament.product_title}`,
      })
      .eq('id', syncLogId);

    try {
      // Fetch TDS content
      const tdsContent = await fetchTDSContent(filament.tds_url!, firecrawlApiKey);
      
      if (!tdsContent) {
        results.push({
          filamentId: filament.id,
          productTitle: filament.product_title,
          success: false,
          fieldsExtracted: 0,
          error: 'Could not fetch TDS content',
          duration_ms: Date.now() - startTime,
        });
        failed++;
        continue;
      }

      // Extract with AI
      const extractedData = await extractTDSWithAI(tdsContent, lovableApiKey);
      
      if (!extractedData) {
        results.push({
          filamentId: filament.id,
          productTitle: filament.product_title,
          success: false,
          fieldsExtracted: 0,
          error: 'AI extraction failed',
          duration_ms: Date.now() - startTime,
        });
        failed++;
        continue;
      }

      // Validate
      const validation = validateExtractedData(extractedData, filament.material);
      const fieldsExtracted = Object.entries(validation.cleanedData)
        .filter(([k, v]) => v !== null && k !== 'extraction_confidence')
        .length;

      // Update database if not dry run
      if (!dryRun) {
        const updateData: Record<string, any> = {};
        
        const fields = [
          'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
          'bed_temp_min_c', 'bed_temp_max_c', 'print_speed_max_mms', 'print_speed_min_mms',
          'fan_min_percent', 'fan_max_percent', 'retraction_length_mm', 'retraction_speed_mms',
          'enclosure_required', 'drying_temp_c', 'drying_time_hours',
          'density_g_cm3', 'water_absorption_percent',
          'tensile_strength_xy_mpa', 'tensile_modulus_xy_mpa', 'elongation_break_xy_percent',
          'tensile_strength_z_mpa', 'tensile_modulus_z_mpa', 'elongation_break_z_percent',
          'flexural_strength_mpa', 'bending_strength_mpa', 'bending_modulus_mpa',
          'impact_strength_kj_m2', 'notched_izod_j_m', 'shore_hardness_d', 'hardness_shore_a',
          'tg_c', 'melt_temp_c', 'vicat_softening_temp_c', 'hdt_045_mpa_c', 'hdt_18_mpa_c',
          'melt_index_g_10min', 'max_overhang_angle_deg', 'max_bridging_length_mm',
          'annealing_temp_c', 'annealing_time_hours',
          'transmission_distance', 'light_transmission_percent', 'haze_percent',
          'surface_resistivity_ohm', 'moisture_sensitivity_level', 'is_nozzle_abrasive', 'chemical_resistance',
        ];

        for (const field of fields) {
          const value = (validation.cleanedData as any)[field];
          if (value !== null && value !== undefined) {
            updateData[field] = value;
          }
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(updateData)
            .eq('id', filament.id);

          if (updateError) {
            console.error('[BG] Update error:', updateError);
          }
        }
      }

      results.push({
        filamentId: filament.id,
        productTitle: filament.product_title,
        success: true,
        fieldsExtracted,
        confidence: extractedData.extraction_confidence,
        duration_ms: Date.now() - startTime,
      });
      successful++;
      console.log(`[BG] Completed ${filament.product_title} in ${Date.now() - startTime}ms`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[BG] Error processing ${filament.id}: ${errorMsg}`);
      results.push({
        filamentId: filament.id,
        productTitle: filament.product_title,
        success: false,
        fieldsExtracted: 0,
        error: errorMsg,
        duration_ms: Date.now() - startTime,
      });
      failed++;
    }

    // Small delay between filaments to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  // Complete the sync log
  console.log(`[BG] Background processing complete: ${successful} successful, ${failed} failed`);
  await supabase
    .from('brand_sync_logs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      products_updated: successful,
      products_failed: failed,
      success_details: { 
        filaments_count: filaments.length,
        results_summary: results.map(r => ({
          id: r.filamentId,
          success: r.success,
          fields: r.fieldsExtracted,
          duration_ms: r.duration_ms,
          error: r.error,
        }))
      },
    })
    .eq('id', syncLogId);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
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
    const { tds_url, product_url, filament_id, brand_slug, dry_run = false, force = false, limit = 1000, background = true } = body;

    // BATCH MODE: Process multiple filaments for a brand
    if (brand_slug) {
      console.log(`[parse-filament-tds] Starting batch for brand: ${brand_slug}, limit: ${limit}, force: ${force}, background: ${background}`);

      // Get brand ID
      const { data: brand } = await supabase
        .from('automated_brands')
        .select('id, display_name')
        .eq('brand_slug', brand_slug)
        .single();

      if (!brand) {
        console.error(`[parse-filament-tds] Brand not found: ${brand_slug}`);
        return new Response(JSON.stringify({ error: 'Brand not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // First, get the count of filaments needing parsing for accurate reporting
      let countQuery = supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', brand.id)
        .not('tds_url', 'is', null);
      
      if (!force) {
        countQuery = countQuery.or('nozzle_temp_min_c.is.null,drying_temp_c.is.null,density_g_cm3.is.null');
      }
      
      const { count: totalNeedsParsing } = await countQuery;
      console.log(`[parse-filament-tds] Brand ${brand_slug}: ${totalNeedsParsing || 0} filaments need parsing`);

      // Build query for filaments needing parsing - use the actual count or limit
      const effectiveLimit = Math.min(limit, totalNeedsParsing || 1000);
      let query = supabase
        .from('filaments')
        .select('id, product_title, tds_url, material')
        .eq('brand_id', brand.id)
        .not('tds_url', 'is', null)
        .limit(effectiveLimit);

      // If not forcing, only get unparsed filaments
      if (!force) {
        query = query.or('nozzle_temp_min_c.is.null,drying_temp_c.is.null,density_g_cm3.is.null');
      }

      const { data: filaments, error: queryError } = await query;

      if (queryError) {
        console.error('[parse-filament-tds] Query error:', queryError);
        return new Response(JSON.stringify({ error: 'Failed to query filaments' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!filaments || filaments.length === 0) {
        console.log(`[parse-filament-tds] Brand ${brand_slug}: No filaments need parsing`);
        return new Response(JSON.stringify({
          success: true,
          processed: 0,
          successful: 0,
          failed: 0,
          results: [],
          message: 'No filaments need parsing',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[parse-filament-tds] Brand ${brand_slug}: Processing ${filaments.length} filaments (of ${totalNeedsParsing} total needing parsing)`)

      // Create sync log entry for tracking
      const { data: logEntry, error: logError } = await supabase
        .from('brand_sync_logs')
        .insert({
          brand_slug,
          brand_id: brand.id,
          sync_type: 'tds_parsing',
          status: 'running',
          started_at: new Date().toISOString(),
          notes: `Processing ${filaments.length} filaments`,
          products_processed: {
            current: 0,
            total: filaments.length,
            successful: 0,
            failed: 0,
          },
        })
        .select('id')
        .single();

      if (logError || !logEntry) {
        console.error('Failed to create sync log:', logError);
        return new Response(JSON.stringify({ error: 'Failed to create sync log' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const syncLogId = logEntry.id;

      // BACKGROUND MODE: Return immediately and process in background
      if (background && typeof (globalThis as any).EdgeRuntime !== 'undefined') {
        console.log(`Starting background processing for ${brand_slug}, syncLogId: ${syncLogId}`);
        
        // Start background processing
        (globalThis as any).EdgeRuntime.waitUntil(
          processFilamentsInBackground(
            filaments,
            syncLogId,
            brand_slug,
            brand.id,
            firecrawlApiKey,
            lovableApiKey,
            supabaseUrl,
            supabaseServiceKey,
            dry_run
          )
        );

        // Return immediately with the sync log ID
        return new Response(JSON.stringify({
          success: true,
          background: true,
          syncLogId,
          message: `Background processing started for ${filaments.length} filaments`,
          processed: filaments.length,
          brand: brand_slug,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // FOREGROUND MODE: Process synchronously (for single filament or small batches)
      const results: any[] = [];
      let successful = 0;
      let failed = 0;

      for (const filament of filaments) {
        const startTime = Date.now();
        console.log(`Processing: ${filament.product_title}`);

        try {
          const tdsContent = await fetchTDSContent(filament.tds_url!, firecrawlApiKey);
          
          if (!tdsContent) {
            results.push({
              filamentId: filament.id,
              productTitle: filament.product_title,
              success: false,
              fieldsExtracted: 0,
              confidence: 0,
              error: 'Could not fetch TDS content',
              duration_ms: Date.now() - startTime,
            });
            failed++;
            continue;
          }

          const extractedData = await extractTDSWithAI(tdsContent, lovableApiKey);
          
          if (!extractedData) {
            results.push({
              filamentId: filament.id,
              productTitle: filament.product_title,
              success: false,
              fieldsExtracted: 0,
              confidence: 0,
              error: 'AI extraction failed',
              duration_ms: Date.now() - startTime,
            });
            failed++;
            continue;
          }

          const validation = validateExtractedData(extractedData, filament.material);
          const fieldsExtracted = Object.entries(validation.cleanedData)
            .filter(([k, v]) => v !== null && k !== 'extraction_confidence')
            .length;

          if (!dry_run) {
            const updateData: Record<string, any> = {};
            
            const fields = [
              'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
              'bed_temp_min_c', 'bed_temp_max_c', 'print_speed_max_mms', 'print_speed_min_mms',
              'fan_min_percent', 'fan_max_percent', 'retraction_length_mm', 'retraction_speed_mms',
              'enclosure_required', 'drying_temp_c', 'drying_time_hours',
              'density_g_cm3', 'water_absorption_percent',
              'tensile_strength_xy_mpa', 'tensile_modulus_xy_mpa', 'elongation_break_xy_percent',
              'tensile_strength_z_mpa', 'tensile_modulus_z_mpa', 'elongation_break_z_percent',
              'flexural_strength_mpa', 'bending_strength_mpa', 'bending_modulus_mpa',
              'impact_strength_kj_m2', 'notched_izod_j_m', 'shore_hardness_d', 'hardness_shore_a',
              'tg_c', 'melt_temp_c', 'vicat_softening_temp_c', 'hdt_045_mpa_c', 'hdt_18_mpa_c',
              'melt_index_g_10min', 'max_overhang_angle_deg', 'max_bridging_length_mm',
              'annealing_temp_c', 'annealing_time_hours',
              'transmission_distance', 'light_transmission_percent', 'haze_percent',
              'surface_resistivity_ohm', 'moisture_sensitivity_level', 'is_nozzle_abrasive', 'chemical_resistance',
            ];

            for (const field of fields) {
              const value = (validation.cleanedData as any)[field];
              if (value !== null && value !== undefined) {
                updateData[field] = value;
              }
            }

            if (Object.keys(updateData).length > 0) {
              const { error: updateError } = await supabase
                .from('filaments')
                .update(updateData)
                .eq('id', filament.id);

              if (updateError) {
                console.error('Update error:', updateError);
              }
            }
          }

          results.push({
            filamentId: filament.id,
            productTitle: filament.product_title,
            success: true,
            fieldsExtracted,
            confidence: extractedData.extraction_confidence,
            duration_ms: Date.now() - startTime,
          });
          successful++;
          console.log(`Completed ${filament.product_title} in ${Date.now() - startTime}ms`);

          await new Promise(r => setTimeout(r, 500));

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error processing ${filament.id}: ${errorMsg}`);
          results.push({
            filamentId: filament.id,
            productTitle: filament.product_title,
            success: false,
            fieldsExtracted: 0,
            confidence: 0,
            error: errorMsg,
            duration_ms: Date.now() - startTime,
          });
          failed++;
        }
      }

      // Update sync log
      await supabase
        .from('brand_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          products_updated: successful,
          products_failed: failed,
          success_details: { 
            filaments_count: filaments.length,
            results_summary: results.map(r => ({
              id: r.filamentId,
              success: r.success,
              fields: r.fieldsExtracted,
              duration_ms: r.duration_ms,
              error: r.error,
            }))
          },
        })
        .eq('id', syncLogId);

      console.log(`Brand ${brand_slug} complete: ${successful} successful, ${failed} failed`);

      return new Response(JSON.stringify({
        success: true,
        syncLogId,
        processed: filaments.length,
        successful,
        failed,
        results,
        dry_run,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SINGLE MODE: Process one filament (original behavior)
    let finalTdsUrl = tds_url;
    
    if (!finalTdsUrl && product_url) {
      finalTdsUrl = await findTDSUrl(product_url, firecrawlApiKey);
    }
    
    if (!finalTdsUrl) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No TDS URL found',
        data: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const tdsContent = await fetchTDSContent(finalTdsUrl, firecrawlApiKey);
    
    if (!tdsContent) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Could not fetch TDS content',
        tds_url: finalTdsUrl,
        data: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const extractedData = await extractTDSWithAI(tdsContent, lovableApiKey);
    
    if (!extractedData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI extraction failed',
        tds_url: finalTdsUrl,
        data: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const validation = validateExtractedData(extractedData);
    
    if (filament_id && !dry_run) {
      const updateData: Record<string, any> = { tds_url: finalTdsUrl };
      
      const fields = [
        'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
        'bed_temp_min_c', 'bed_temp_max_c', 'print_speed_max_mms', 'print_speed_min_mms',
        'fan_min_percent', 'fan_max_percent', 'retraction_length_mm', 'retraction_speed_mms',
        'enclosure_required', 'drying_temp_c', 'drying_time_hours',
        'density_g_cm3', 'water_absorption_percent',
        'tensile_strength_xy_mpa', 'tensile_modulus_xy_mpa', 'elongation_break_xy_percent',
        'tensile_strength_z_mpa', 'tensile_modulus_z_mpa', 'elongation_break_z_percent',
        'flexural_strength_mpa', 'bending_strength_mpa', 'bending_modulus_mpa',
        'impact_strength_kj_m2', 'notched_izod_j_m', 'shore_hardness_d', 'hardness_shore_a',
        'tg_c', 'melt_temp_c', 'vicat_softening_temp_c', 'hdt_045_mpa_c', 'hdt_18_mpa_c',
        'melt_index_g_10min', 'max_overhang_angle_deg', 'max_bridging_length_mm',
        'annealing_temp_c', 'annealing_time_hours',
        'transmission_distance', 'light_transmission_percent', 'haze_percent',
        'surface_resistivity_ohm', 'moisture_sensitivity_level', 'is_nozzle_abrasive', 'chemical_resistance',
      ];

      for (const field of fields) {
        const value = (validation.cleanedData as any)[field];
        if (value !== null && value !== undefined) {
          updateData[field] = value;
        }
      }
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update(updateData)
        .eq('id', filament_id);
      
      if (updateError) {
        console.error('Database update error:', updateError);
      } else {
        console.log(`Updated filament ${filament_id} with TDS data`);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      tds_url: finalTdsUrl,
      data: validation.cleanedData,
      validationWarnings: validation.warnings,
      fields_extracted: Object.entries(validation.cleanedData)
        .filter(([k, v]) => v !== null && k !== 'extraction_confidence')
        .length,
      dry_run,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in parse-filament-tds:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
