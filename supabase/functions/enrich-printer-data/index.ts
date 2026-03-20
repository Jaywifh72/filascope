import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PrinterSpecs {
  build_volume_x_mm?: number;
  build_volume_y_mm?: number;
  build_volume_z_mm?: number;
  bed_size_x_mm?: number;
  bed_size_y_mm?: number;
  max_nozzle_temp_c?: number;
  bed_max_temp_c?: number;
  max_print_speed_mms?: number;
  max_travel_speed_xy_mms?: number;
  max_acceleration_xy_mmss?: number;
  has_wifi?: boolean;
  has_ethernet?: boolean;
  has_enclosure?: boolean;
  enclosure_heated?: boolean;
  auto_bed_leveling?: boolean;
  filament_runout_detection?: boolean;
  power_loss_recovery?: boolean;
  msrp_usd?: number;
  release_date?: string;
  printer_technology?: string;
  extruder_type?: string;
  extruder_drive_type?: string;
  filament_diameter_mm?: number;
  stock_nozzle_diameter_mm?: number;
  screen_type?: string;
  screen_size_inch?: number;
  machine_weight_kg?: number;
  machine_width_mm?: number;
  machine_depth_mm?: number;
  machine_height_mm?: number;
  rated_power_w?: number;
  noise_level_printing_db?: number;
  max_flow_rate_mm3s?: number;
  input_shaping_supported?: boolean;
  pressure_advance_supported?: boolean;
  multi_material_supported?: boolean;
  native_multi_material_system?: boolean;
  ui_language_options?: string;
  firmware_family?: string;
  bed_type?: string;
  hotend_type?: string;
  nozzle_material?: string;
}

async function enrichPrinterWithAI(
  brandName: string,
  modelName: string,
  apiKey: string
): Promise<PrinterSpecs | null> {
  const systemPrompt = `You are a 3D printer specifications expert. Your task is to provide accurate, verified technical specifications for 3D printers.

IMPORTANT RULES:
1. Only provide data you are confident about from official sources or well-known specifications
2. If you're not sure about a value, omit it (don't guess)
3. Return ONLY a valid JSON object with no additional text
4. Use metric units (mm, °C, mm/s, kg, W, dB)
5. For boolean fields, use true/false
6. For dates, use YYYY-MM-DD format
7. For printer_technology, use: FDM, FFF, SLA, MSLA, DLP, or SLS
8. For extruder_type, use: Direct Drive, Bowden, or similar standard terms
9. For screen_type, use: LCD, TFT, IPS, Touchscreen, etc.`;

  const userPrompt = `Provide technical specifications for the ${brandName} ${modelName} 3D printer.

Return a JSON object with these fields (only include fields you're confident about):
{
  "build_volume_x_mm": number (X axis build volume in mm),
  "build_volume_y_mm": number (Y axis build volume in mm),
  "build_volume_z_mm": number (Z axis build volume in mm),
  "bed_size_x_mm": number (actual heated bed X dimension in mm - usually slightly larger than build volume),
  "bed_size_y_mm": number (actual heated bed Y dimension in mm - usually slightly larger than build volume),
  "max_nozzle_temp_c": number (maximum nozzle/hotend temperature in Celsius),
  "bed_max_temp_c": number (maximum heated bed temperature in Celsius),
  "max_print_speed_mms": number (maximum print speed in mm/s),
  "max_travel_speed_xy_mms": number (maximum travel speed in mm/s),
  "max_acceleration_xy_mmss": number (maximum acceleration in mm/s²),
  "has_wifi": boolean,
  "has_ethernet": boolean,
  "has_enclosure": boolean,
  "enclosure_heated": boolean,
  "auto_bed_leveling": boolean,
  "filament_runout_detection": boolean,
  "power_loss_recovery": boolean,
  "msrp_usd": number (original retail price in USD),
  "release_date": string (YYYY-MM-DD format),
  "printer_technology": string (FDM, FFF, SLA, etc.),
  "extruder_type": string (Direct Drive, Bowden, etc.),
  "extruder_drive_type": string (Direct, Bowden),
  "filament_diameter_mm": number (1.75 or 2.85),
  "stock_nozzle_diameter_mm": number (typically 0.4),
  "screen_type": string,
  "screen_size_inch": number,
  "machine_weight_kg": number,
  "machine_width_mm": number,
  "machine_depth_mm": number,
  "machine_height_mm": number,
  "rated_power_w": number,
  "noise_level_printing_db": number,
  "max_flow_rate_mm3s": number,
  "input_shaping_supported": boolean,
  "pressure_advance_supported": boolean,
  "multi_material_supported": boolean,
  "native_multi_material_system": boolean,
  "ui_language_options": string (comma-separated list of supported UI languages like "English, Chinese, German, French, Spanish"),
  "firmware_family": string (name of firmware like "Klipper", "Marlin", "RepRap", "Prusa Firmware", "Bambu Lab Firmware", etc.),
  "bed_type": string (build plate type like "PEI Spring Steel", "Glass Bed", "PEI", "Textured PEI", "Smooth PEI", "Segmented PEI", "Magnetic PEI"),
  "hotend_type": string (hotend type like "All-Metal", "PTFE-lined", "V6", "Volcano", "Quick-Release", "Nextruder"),
  "nozzle_material": string (stock nozzle material like "Brass", "Hardened Steel", "Stainless Steel", "Copper Alloy")
}

Return ONLY the JSON object, no explanation or markdown.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API error for ${brandName} ${modelName}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error(`No content in AI response for ${brandName} ${modelName}`);
      return null;
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const specs = JSON.parse(jsonStr) as PrinterSpecs;
    const fieldCount = Object.keys(specs).length;
    console.log(`Successfully enriched ${brandName} ${modelName}: ${fieldCount} fields`);
    console.log(`  AI extracted fields: ${Object.keys(specs).join(', ')}`);
    
    // Log each extracted value
    for (const [key, value] of Object.entries(specs)) {
      console.log(`    ${key}: ${JSON.stringify(value)}`);
    }
    
    return specs;
  } catch (error) {
    console.error(`Error enriching ${brandName} ${modelName}:`, error);
    return null;
  }
}

function isValidValue(value: any, fieldName: string): boolean {
  if (value === null || value === undefined) return false;
  
  // Check for obviously bad numeric values
  if (typeof value === 'number') {
    if (fieldName.includes('temp') && (value < 20 || value > 500)) return false;
    if (fieldName.includes('volume') && (value < 50 || value > 2000)) return false;
    if (fieldName.includes('bed_size') && (value < 50 || value > 1000)) return false;
    if (fieldName.includes('speed') && (value < 10 || value > 2000)) return false;
    if (fieldName === 'msrp_usd' && (value < 50 || value > 100000)) return false;
    if (fieldName === 'filament_diameter_mm' && value !== 1.75 && value !== 2.85) return false;
    if (fieldName === 'stock_nozzle_diameter_mm' && (value < 0.1 || value > 2)) return false;
  }
  
  // Validate string fields for garbage content
  if (typeof value === 'string') {
    const lowerVal = value.toLowerCase();
    // Reject scraped garbage patterns
    if (lowerVal.includes('skip to') || lowerVal.includes('http') || 
        lowerVal.includes('click') || lowerVal.includes('subscribe') ||
        lowerVal.includes('cookie') || lowerVal.includes('sale') ||
        lowerVal.includes('![') || lowerVal.includes('](') ||
        lowerVal.includes('bundle') || lowerVal.includes('order')) {
      return false;
    }
    // ui_language_options should be a reasonable list
    if (fieldName === 'ui_language_options' && value.length > 200) return false;
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client for auth check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '');

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: hasAdminRole, error: roleError } = await authClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !hasAdminRole) {
      console.log(`Access denied for user ${user.id} - not an admin`);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { printerIds, limit = 10, forceUpdate = false } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    console.log(`Admin ${user.id} starting printer enrichment process...`);

    // Fetch printers to enrich
    let query = supabase
      .from('printers')
      .select(`
        id,
        model_name,
        brand:printer_brands(brand),
        build_volume_x_mm,
        build_volume_y_mm,
        build_volume_z_mm,
        max_nozzle_temp_c,
        bed_max_temp_c,
        max_print_speed_mms,
        has_wifi,
        has_enclosure,
        auto_bed_leveling,
        msrp_usd,
        release_date,
        printer_technology,
        extruder_type,
        filament_diameter_mm
      `)
      .eq('status', 'active');

    if (printerIds && printerIds.length > 0) {
      query = query.in('id', printerIds);
    } else if (!forceUpdate) {
      // Find printers with missing critical data including hardware specs and bed size
      query = query.or(
        'build_volume_x_mm.is.null,build_volume_y_mm.is.null,build_volume_z_mm.is.null,' +
        'bed_size_x_mm.is.null,bed_size_y_mm.is.null,' +
        'max_nozzle_temp_c.is.null,bed_max_temp_c.is.null,max_print_speed_mms.is.null,' +
        'printer_technology.is.null,filament_diameter_mm.is.null,' +
        'bed_type.is.null,hotend_type.is.null,nozzle_material.is.null'
      );
    }

    const { data: printers, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch printers: ${fetchError.message}`);
    }

    if (!printers || printers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No printers need enrichment',
        enriched: 0,
        failed: 0,
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${printers.length} printers for enrichment`);

    const results: Array<{
      id: string;
      model_name: string;
      brand: string;
      status: string;
      fields_updated: number;
      fields_detail?: Record<string, { old: any; new: any }>;
      ai_extracted_fields?: string[];
      error?: string;
    }> = [];

    let enrichedCount = 0;
    let failedCount = 0;

    for (const printer of printers) {
      const brandObj = Array.isArray(printer.brand) ? printer.brand[0] : printer.brand;
      const brandName = brandObj?.brand || 'Unknown';
      const modelName = printer.model_name;

      console.log(`Enriching: ${brandName} ${modelName}`);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      const specs = await enrichPrinterWithAI(brandName, modelName, OPENAI_API_KEY);

      if (!specs) {
        failedCount++;
        results.push({
          id: printer.id,
          model_name: modelName,
          brand: brandName,
          status: 'failed',
          fields_updated: 0,
          error: 'AI enrichment failed'
        });
        continue;
      }

      // Build update object with only valid new values
      const updateData: Record<string, any> = {};
      const fieldsDetail: Record<string, { old: any; new: any }> = {};
      const aiExtractedFields = Object.keys(specs);
      let fieldsUpdated = 0;

      console.log(`  AI returned ${aiExtractedFields.length} fields for ${brandName} ${modelName}`);
      
      for (const [key, value] of Object.entries(specs)) {
        // Only update if:
        // 1. forceUpdate is true, OR
        // 2. Current value is null/invalid AND new value is valid
        const currentValue = (printer as any)[key];
        const currentIsInvalid = !isValidValue(currentValue, key);
        const newIsValid = isValidValue(value, key);

        if (newIsValid && (forceUpdate || currentIsInvalid)) {
          updateData[key] = value;
          fieldsDetail[key] = { old: currentValue ?? null, new: value };
          fieldsUpdated++;
          console.log(`    [UPDATE] ${key}: ${currentValue ?? 'null'} → ${value}`);
        } else if (!newIsValid) {
          console.log(`    [SKIP] ${key}: invalid value ${JSON.stringify(value)}`);
        } else {
          console.log(`    [KEEP] ${key}: existing value ${currentValue} (AI suggested: ${value})`);
        }
      }

      if (fieldsUpdated > 0) {
        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('printers')
          .update(updateData)
          .eq('id', printer.id);

        if (updateError) {
          console.error(`Failed to update ${modelName}:`, updateError);
          failedCount++;
          results.push({
            id: printer.id,
            model_name: modelName,
            brand: brandName,
            status: 'update_failed',
            fields_updated: 0,
            ai_extracted_fields: aiExtractedFields,
            error: updateError.message
          });
        } else {
          enrichedCount++;
          results.push({
            id: printer.id,
            model_name: modelName,
            brand: brandName,
            status: 'enriched',
            fields_updated: fieldsUpdated,
            fields_detail: fieldsDetail,
            ai_extracted_fields: aiExtractedFields
          });
          console.log(`Updated ${brandName} ${modelName}: ${fieldsUpdated} fields\n`);
        }
      } else {
        results.push({
          id: printer.id,
          model_name: modelName,
          brand: brandName,
          status: 'no_updates_needed',
          fields_updated: 0,
          ai_extracted_fields: aiExtractedFields
        });
        console.log(`  No updates needed for ${brandName} ${modelName}\n`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      enriched: enrichedCount,
      failed: failedCount,
      total_processed: printers.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enrichment error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
