import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TDSData {
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  nozzle_temp_sweetspot_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  print_speed_max_mms: number | null;
  print_speed_min_mms: number | null;
  fan_min_percent: number | null;
  fan_max_percent: number | null;
  drying_temp_c: number | null;
  drying_time_hours: number | null;
  density_g_cm3: number | null;
  tensile_strength_xy_mpa: number | null;
  tensile_modulus_xy_mpa: number | null;
  elongation_break_xy_percent: number | null;
  flexural_strength_mpa: number | null;
  shore_hardness_d: number | null;
  tg_c: number | null;
  melt_temp_c: number | null;
  moisture_sensitivity_level: string | null;
  is_nozzle_abrasive: boolean | null;
  enclosure_required: boolean | null;
  retraction_distance_mm: number | null;
  annealing_temp_c: number | null;
  transmission_distance: number | null;
  extraction_confidence: number;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  cleanedData: Partial<TDSData>;
}

const TDS_EXTRACTION_PROMPT = `You are a technical data sheet (TDS) parser for 3D printing filaments. Extract all available specifications from the provided TDS content.

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
- retraction_distance_mm: Recommended retraction distance in mm (number)
- enclosure_required: Whether an enclosure is required or strongly recommended (boolean)

DRYING:
- drying_temp_c: Recommended drying temperature in Celsius (number)
- drying_time_hours: Recommended drying time in hours (number)

PHYSICAL PROPERTIES:
- density_g_cm3: Density in g/cm³ (number, typically 1.0-1.5)
- tensile_strength_xy_mpa: Tensile strength in MPa (number)
- tensile_modulus_xy_mpa: Tensile/Young's modulus in MPa (number)
- elongation_break_xy_percent: Elongation at break in percent (number)
- flexural_strength_mpa: Flexural strength in MPa (number)
- shore_hardness_d: Shore D hardness (number)
- tg_c: Glass transition temperature in Celsius (number)
- melt_temp_c: Melting temperature in Celsius (number)
- annealing_temp_c: Annealing temperature if applicable (number)

HUEFORGE/OPTICAL PROPERTIES (CRITICAL FOR LITHOPHANES):
- transmission_distance: Light transmission distance in mm for HueForge lithophanes (number, typically 0.5-8.0)
  Also look for: "TD", "TD value", "transmission", "light transmission", "optical distance", "light penetration"
  This is the most important value for HueForge lithophane printing.
  If multiple TD values given for different colors, extract the average or the "white" value.

OTHER:
- moisture_sensitivity_level: "low", "medium", or "high"
- is_nozzle_abrasive: true if contains glass fiber, carbon fiber, metal, or other abrasive materials (boolean)
- extraction_confidence: Your confidence in the extraction accuracy from 0-100 (number)

IMPORTANT RULES:
1. Only extract values explicitly stated in the TDS
2. Convert all temperatures to Celsius
3. For temperature ranges like "200-220°C", extract min and max separately
4. For single recommended temps, use that as the sweetspot
5. Return ONLY valid JSON, no additional text
6. For transmission_distance, look carefully for TD values - they are critical for HueForge users

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
    });

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
    console.error('Error fetching TDS:', error);
    return null;
  }
}

async function extractTDSWithAI(tdsContent: string, lovableApiKey: string): Promise<TDSData | null> {
  console.log('Extracting TDS data with AI...');
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: TDS_EXTRACTION_PROMPT + tdsContent.substring(0, 15000)
          }
        ],
      }),
    });

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
        nozzle_temp_min_c: extracted.nozzle_temp_min_c ?? null,
        nozzle_temp_max_c: extracted.nozzle_temp_max_c ?? null,
        nozzle_temp_sweetspot_c: extracted.nozzle_temp_sweetspot_c ?? null,
        bed_temp_min_c: extracted.bed_temp_min_c ?? null,
        bed_temp_max_c: extracted.bed_temp_max_c ?? null,
        print_speed_max_mms: extracted.print_speed_max_mms ?? null,
        print_speed_min_mms: extracted.print_speed_min_mms ?? null,
        fan_min_percent: extracted.fan_min_percent ?? null,
        fan_max_percent: extracted.fan_max_percent ?? null,
        drying_temp_c: extracted.drying_temp_c ?? null,
        drying_time_hours: extracted.drying_time_hours ?? null,
        density_g_cm3: extracted.density_g_cm3 ?? null,
        tensile_strength_xy_mpa: extracted.tensile_strength_xy_mpa ?? null,
        tensile_modulus_xy_mpa: extracted.tensile_modulus_xy_mpa ?? null,
        elongation_break_xy_percent: extracted.elongation_break_xy_percent ?? null,
        flexural_strength_mpa: extracted.flexural_strength_mpa ?? null,
        shore_hardness_d: extracted.shore_hardness_d ?? null,
        tg_c: extracted.tg_c ?? null,
        melt_temp_c: extracted.melt_temp_c ?? null,
        moisture_sensitivity_level: extracted.moisture_sensitivity_level ?? null,
        is_nozzle_abrasive: extracted.is_nozzle_abrasive ?? null,
        enclosure_required: extracted.enclosure_required ?? null,
        retraction_distance_mm: extracted.retraction_distance_mm ?? null,
        annealing_temp_c: extracted.annealing_temp_c ?? null,
        transmission_distance: extracted.transmission_distance ?? null,
        extraction_confidence: extracted.extraction_confidence ?? 0,
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, jsonStr);
      return null;
    }
  } catch (error) {
    console.error('AI extraction error:', error);
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
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
    const { tds_url, product_url, filament_id, brand_slug, dry_run = false, force = false, limit = 25 } = body;

    // BATCH MODE: Process multiple filaments for a brand
    if (brand_slug) {
      console.log(`Batch parsing TDS for brand: ${brand_slug}, limit: ${limit}, force: ${force}`);

      // Get brand ID
      const { data: brand } = await supabase
        .from('automated_brands')
        .select('id, display_name')
        .eq('brand_slug', brand_slug)
        .single();

      if (!brand) {
        return new Response(JSON.stringify({ error: 'Brand not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Build query for filaments needing parsing
      let query = supabase
        .from('filaments')
        .select('id, product_title, tds_url, material')
        .eq('brand_id', brand.id)
        .not('tds_url', 'is', null)
        .limit(limit);

      // If not forcing, only get unparsed filaments
      if (!force) {
        query = query.or('nozzle_temp_min_c.is.null,drying_temp_c.is.null,density_g_cm3.is.null');
      }

      const { data: filaments, error: queryError } = await query;

      if (queryError) {
        console.error('Query error:', queryError);
        return new Response(JSON.stringify({ error: 'Failed to query filaments' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!filaments || filaments.length === 0) {
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

      console.log(`Found ${filaments.length} filaments to parse`);

      const results: any[] = [];
      let successful = 0;
      let failed = 0;

      for (const filament of filaments) {
        console.log(`Processing: ${filament.product_title}`);

        try {
          // Fetch TDS content
          const tdsContent = await fetchTDSContent(filament.tds_url!, firecrawlApiKey);
          
          if (!tdsContent) {
            results.push({
              filamentId: filament.id,
              productTitle: filament.product_title,
              success: false,
              fieldsExtracted: 0,
              confidence: 0,
              error: 'Could not fetch TDS content',
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
              confidence: 0,
              error: 'AI extraction failed',
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
          if (!dry_run) {
            const updateData: Record<string, any> = {};
            
            const fields = [
              'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
              'bed_temp_min_c', 'bed_temp_max_c', 'print_speed_max_mms',
              'fan_min_percent', 'fan_max_percent', 'drying_temp_c', 'drying_time_hours',
              'density_g_cm3', 'tensile_strength_xy_mpa', 'tensile_modulus_xy_mpa',
              'elongation_break_xy_percent', 'flexural_strength_mpa', 'shore_hardness_d',
              'tg_c', 'melt_temp_c', 'moisture_sensitivity_level', 'is_nozzle_abrasive',
              'transmission_distance'
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
            data: validation.cleanedData,
            validationWarnings: validation.warnings,
          });
          successful++;

          // Rate limit between requests
          await new Promise(r => setTimeout(r, 1500));

        } catch (error) {
          console.error(`Error processing ${filament.id}:`, error);
          results.push({
            filamentId: filament.id,
            productTitle: filament.product_title,
            success: false,
            fieldsExtracted: 0,
            confidence: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failed++;
        }
      }

      // Log to brand_sync_logs
      if (!dry_run) {
        await supabase.from('brand_sync_logs').insert({
          brand_slug,
          brand_id: brand.id,
          sync_type: 'tds_parsing',
          status: 'completed',
          products_updated: successful,
          products_failed: failed,
          success_details: { results },
        });
      }

      return new Response(JSON.stringify({
        success: true,
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

    // Validate extracted data
    const validation = validateExtractedData(extractedData);
    
    if (filament_id && !dry_run) {
      const updateData: Record<string, any> = { tds_url: finalTdsUrl };
      
      const fields = [
        'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
        'bed_temp_min_c', 'bed_temp_max_c', 'print_speed_max_mms',
        'fan_min_percent', 'fan_max_percent', 'drying_temp_c', 'drying_time_hours',
        'density_g_cm3', 'tensile_strength_xy_mpa', 'tensile_modulus_xy_mpa',
        'elongation_break_xy_percent', 'flexural_strength_mpa', 'shore_hardness_d',
        'tg_c', 'melt_temp_c', 'moisture_sensitivity_level', 'is_nozzle_abrasive',
        'transmission_distance'
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
