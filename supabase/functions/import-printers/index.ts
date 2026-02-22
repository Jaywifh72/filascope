import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge function to import/update printers from CSV data.
 * 
 * Usage:
 * POST /import-printers
 * Body: { csvData: string }
 * 
 * This function:
 * 1. Parses CSV data
 * 2. Validates required fields (printer_id, brand, model_name)
 * 3. Upserts brands and series
 * 4. Upserts printer records based on printer_id
 * 5. Returns summary of operations
 */

interface CSVRow {
  [key: string]: string;
}

// Parse CSV string to array of objects with proper quote handling
function parseCSV(csvData: string): CSVRow[] {
  const lines = csvData.trim().split("\n");
  const headers = parseCSVLine(lines[0]);
  
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });
    rows.push(row);
  }
  
  return rows;
}

// Properly parse a CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  
  // Push the last field
  result.push(current);
  
  return result;
}

// Convert string values to appropriate types
function convertValue(value: string, type: "boolean" | "number" | "date" | "text"): any {
  if (!value || value === "") return null;
  
  switch (type) {
    case "boolean":
      return value.toLowerCase() === "true" || value.toLowerCase() === "yes";
    case "number":
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    case "date":
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
    case "text":
    default:
      return value;
  }
}

/**
 * Convert and round integer fields
 * Auto-handles decimal values that should be integers
 */
function convertInteger(value: string): number | null {
  if (!value || value.trim() === "") return null;
  const num = parseFloat(value.trim());
  if (isNaN(num)) return null;
  return Math.round(num);
}

/**
 * Safely convert all printer data fields with proper type handling
 */
function generateSlug(brand: string, model: string): string {
  return `${brand}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function convertPrinterData(row: CSVRow): any {
  const msrp = convertValue(row.msrp_usd, "number");
  const storePrice = convertValue(row.current_price_usd_store, "number");
  const officialUrl = convertValue(row.official_product_url, "text");
  const productPageUrl = convertValue(row.product_page_url, "text");
  const officialStoreUrl = convertValue(row.official_store_url, "text");

  // Pricing Data reads variant_price — populate from best available price
  const variantPrice = storePrice ?? msrp ?? null;

  // Pricing Data reads product_url — populate from best available URL
  const productUrl = officialStoreUrl ?? officialUrl ?? productPageUrl ?? null;

  // Auto-generate slug from brand + model
  const slug = row.brand && row.model_name
    ? generateSlug(row.brand, row.model_name)
    : null;

  return {
    printer_id: row.printer_id,
    brand_id: null, // Will be set later
    series_id: null, // Will be set later
    model_name: row.model_name,
    variant_or_bundle_name: convertValue(row.variant_or_bundle_name, "text"),
    printer_technology: convertValue(row.printer_technology, "text"),
    sku: convertValue(row.sku, "text"),
    ean_upc: convertValue(row.ean_upc, "text"),
    release_date: convertValue(row.release_date, "date"),
    discontinued: convertValue(row.discontinued, "boolean"),
    discontinued_date: convertValue(row.discontinued_date, "date"),
    firmware_family: convertValue(row.firmware_family, "text"),
    firmware_open_source: convertValue(row.firmware_open_source, "boolean"),
    official_product_url: officialUrl,
    official_store_url: officialStoreUrl,
    amazon_url_us: convertValue(row.amazon_url_us, "text"),
    amazon_url_ca: convertValue(row.amazon_url_ca, "text"),
    amazon_url_uk: convertValue(row.amazon_url_uk, "text"),
    other_retailer_urls: convertValue(row.other_retailer_urls, "text"),
    build_volume_x_mm: convertValue(row.build_volume_x_mm, "number"),
    build_volume_y_mm: convertValue(row.build_volume_y_mm, "number"),
    build_volume_z_mm: convertValue(row.build_volume_z_mm, "number"),
    build_volume_shape: convertValue(row.build_volume_shape, "text"),
    max_build_height_with_ams_mm: convertValue(row.max_build_height_with_ams_mm, "number"),
    machine_width_mm: convertValue(row.machine_width_mm, "number"),
    machine_depth_mm: convertValue(row.machine_depth_mm, "number"),
    machine_height_mm: convertValue(row.machine_height_mm, "number"),
    machine_weight_kg: convertValue(row.machine_weight_kg, "number"),
    machine_style: convertValue(row.machine_style, "text"),
    frame_material: convertValue(row.frame_material, "text"),
    has_enclosure: convertValue(row.has_enclosure, "boolean"),
    enclosure_type: convertValue(row.enclosure_type, "text"),
    enclosure_heated: convertValue(row.enclosure_heated, "boolean"),
    enclosure_max_temp_c: convertValue(row.enclosure_max_temp_c, "number"),
    max_travel_speed_xy_mms: convertValue(row.max_travel_speed_xy_mms, "number"),
    max_print_speed_mms: convertValue(row.max_print_speed_mms, "number"),
    recommended_quality_speed_mms: convertValue(row.recommended_quality_speed_mms, "number"),
    max_acceleration_xy_mmss: convertValue(row.max_acceleration_xy_mmss, "number"),
    max_acceleration_z_mmss: convertValue(row.max_acceleration_z_mmss, "number"),
    input_shaping_supported: convertValue(row.input_shaping_supported, "boolean"),
    linear_rails_on_axes: convertValue(row.linear_rails_on_axes, "text"),
    motion_system_notes: convertValue(row.motion_system_notes, "text"),
    extruder_count: convertInteger(row.extruder_count),
    extruder_type: convertValue(row.extruder_type, "text"),
    extruder_drive_type: convertValue(row.extruder_drive_type, "text"),
    filament_diameter_mm: convertValue(row.filament_diameter_mm, "number"),
    max_nozzle_temp_c: convertValue(row.max_nozzle_temp_c, "number"),
    sustained_nozzle_temp_c: convertValue(row.sustained_nozzle_temp_c, "number"),
    hotend_type: convertValue(row.hotend_type, "text"),
    hotend_brand_model: convertValue(row.hotend_brand_model, "text"),
    stock_nozzle_diameter_mm: convertValue(row.stock_nozzle_diameter_mm, "number"),
    supported_nozzle_diameters_mm: convertValue(row.supported_nozzle_diameters_mm, "text"),
    nozzle_material: convertValue(row.nozzle_material, "text"),
    max_flow_rate_mm3s: convertValue(row.max_flow_rate_mm3s, "number"),
    abrasive_filament_support: convertValue(row.abrasive_filament_support, "boolean"),
    extruder_notes: convertValue(row.extruder_notes, "text"),
    bed_size_x_mm: convertValue(row.bed_size_x_mm, "number"),
    bed_size_y_mm: convertValue(row.bed_size_y_mm, "number"),
    bed_type: convertValue(row.bed_type, "text"),
    bed_heated: convertValue(row.bed_heated, "boolean"),
    bed_max_temp_c: convertValue(row.bed_max_temp_c, "number"),
    bed_heater_power_w: convertValue(row.bed_heater_power_w, "number"),
    stock_plate_types: convertValue(row.stock_plate_types, "text"),
    supported_plate_types: convertValue(row.supported_plate_types, "text"),
    auto_bed_leveling: convertValue(row.auto_bed_leveling, "boolean"),
    abl_technique: convertValue(row.abl_technique, "text"),
    auto_bed_leveling_method: convertValue(row.auto_bed_leveling_method, "text"),
    first_layer_assist_features: convertValue(row.first_layer_assist_features, "text"),
    filter_type: convertValue(row.filter_type, "text"),
    internal_lighting: convertValue(row.internal_lighting, "boolean"),
    door_sensor: convertValue(row.door_sensor, "boolean"),
    smoke_sensor: convertValue(row.smoke_sensor, "boolean"),
    temperature_sensors: convertValue(row.temperature_sensors, "text"),
    official_supported_materials: convertValue(row.official_supported_materials, "text"),
    recommended_materials: convertValue(row.recommended_materials, "text"),
    abrasive_materials_supported: convertValue(row.abrasive_materials_supported, "boolean"),
    max_recommended_material_temp_c: convertValue(row.max_recommended_material_temp_c, "number"),
    materials_notes: convertValue(row.materials_notes, "text"),
    multi_material_supported: convertValue(row.multi_material_supported, "boolean"),
    native_multi_material_system: convertValue(row.native_multi_material_system, "boolean"),
    compatible_multi_material_systems: convertValue(row.compatible_multi_material_systems, "text"),
    multi_material_max_spools: convertInteger(row.multi_material_max_spools),
    multi_material_spool_chamber_max_temp_c: convertValue(row.multi_material_spool_chamber_max_temp_c, "number"),
    multi_material_drying_capability: convertValue(row.multi_material_drying_capability, "boolean"),
    multi_material_limitations_notes: convertValue(row.multi_material_limitations_notes, "text"),
    has_wifi: convertValue(row.has_wifi, "boolean"),
    has_ethernet: convertValue(row.has_ethernet, "boolean"),
    has_bluetooth: convertValue(row.has_bluetooth, "boolean"),
    has_usb_a_port: convertValue(row.has_usb_a_port, "boolean"),
    has_usb_c_port: convertValue(row.has_usb_c_port, "boolean"),
    has_sd_card: convertValue(row.has_sd_card, "boolean"),
    has_micro_sd_card: convertValue(row.has_micro_sd_card, "boolean"),
    onboard_storage_gb: convertInteger(row.onboard_storage_gb),
    cloud_platforms: convertValue(row.cloud_platforms, "text"),
    remote_monitoring_supported: convertValue(row.remote_monitoring_supported, "boolean"),
    remote_control_supported: convertValue(row.remote_control_supported, "boolean"),
    screen_type: convertValue(row.screen_type, "text"),
    screen_size_inch: convertValue(row.screen_size_inch, "number"),
    screen_resolution: convertValue(row.screen_resolution, "text"),
    control_knob: convertValue(row.control_knob, "boolean"),
    ui_language_options: convertValue(row.ui_language_options, "text"),
    assembly_required: convertValue(row.assembly_required, "boolean"),
    average_assembly_time_min: convertValue(row.average_assembly_time_min, "number"),
    maintenance_interval_hours: convertValue(row.maintenance_interval_hours, "number"),
    nozzle_change_ease: convertValue(row.nozzle_change_ease, "text"),
    belt_tensioning_method: convertValue(row.belt_tensioning_method, "text"),
    common_failure_points: convertValue(row.common_failure_points, "text"),
    recommended_upgrades: convertValue(row.recommended_upgrades, "text"),
    noise_level_printing_db: convertValue(row.noise_level_printing_db, "number"),
    noise_level_idle_db: convertValue(row.noise_level_idle_db, "number"),
    power_input_voltage: convertValue(row.power_input_voltage, "text"),
    rated_power_w: convertValue(row.rated_power_w, "number"),
    typical_power_pla_w: convertValue(row.typical_power_pla_w, "number"),
    typical_power_abs_w: convertValue(row.typical_power_abs_w, "number"),
    power_supply_type: convertValue(row.power_supply_type, "text"),
    thermal_runaway_protection: convertValue(row.thermal_runaway_protection, "boolean"),
    power_loss_recovery: convertValue(row.power_loss_recovery, "boolean"),
    safety_certifications: convertValue(row.safety_certifications, "text"),
    safety_notes: convertValue(row.safety_notes, "text"),
    msrp_usd: msrp,
    msrp_cad: convertValue(row.msrp_cad, "number"),
    msrp_eur: convertValue(row.msrp_eur, "number"),
    current_price_usd_store: storePrice,
    current_price_usd_amazon: convertValue(row.current_price_usd_amazon, "number"),
    price_tier: convertValue(row.price_tier, "text"),
    target_user_segment: convertValue(row.target_user_segment, "text"),
    marketing_tags: convertValue(row.marketing_tags, "text"),
    rating_community_overall: convertValue(row.rating_community_overall, "number"),
    rating_ease_of_use: convertValue(row.rating_ease_of_use, "number"),
    rating_print_quality: convertValue(row.rating_print_quality, "number"),
    rating_reliability: convertValue(row.rating_reliability, "number"),
    rating_value_for_money: convertValue(row.rating_value_for_money, "number"),
    review_count_aggregated: convertInteger(row.review_count_aggregated),
    community_popularity_score: convertValue(row.community_popularity_score, "number"),
    common_mods_tags: convertValue(row.common_mods_tags, "text"),
    compatible_plate_types: convertValue(row.compatible_plate_types, "text"),
    default_plate_type: convertValue(row.default_plate_type, "text"),
    printer_profile_slug_in_slicers: convertValue(row.printer_profile_slug_in_slicers, "text"),
    data_source_urls: convertValue(row.data_source_urls, "text"),
    data_source_priority: convertValue(row.data_source_priority, "text"),
    data_quality_notes: convertValue(row.data_quality_notes, "text"),
    last_verified_utc: convertValue(row.last_verified_utc, "date"),
    // === Pricing Data compatibility fields ===
    slug: slug,
    variant_price: variantPrice,
    product_url: productUrl,
    product_page_url: productPageUrl,
    image_url: convertValue(row.image_url, "text"),
    series_name: convertValue(row.series_name, "text"),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[import-printers] Function invoked");

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check admin role
    const { data: hasAdminRole } = await supabaseClient
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (!hasAdminRole) {
      throw new Error("Admin access required");
    }

    const { csvData } = await req.json();
    
    if (!csvData) {
      throw new Error("CSV data is required");
    }

    console.log("Starting CSV import...");
    const rows = parseCSV(csvData);
    console.log(`Parsed ${rows.length} rows from CSV`);

    const stats = {
      brands_created: 0,
      brands_updated: 0,
      series_created: 0,
      series_updated: 0,
      printers_created: 0,
      printers_updated: 0,
      errors: [] as string[],
    };

    // Process each row
    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.printer_id || !row.brand || !row.model_name) {
          stats.errors.push(`Missing required fields for row: ${JSON.stringify(row).substring(0, 100)}`);
          continue;
        }

        // Upsert brand
        const { data: brandData, error: brandError } = await supabaseClient
          .from("printer_brands")
          .upsert(
            { brand: row.brand },
            { onConflict: "brand" }
          )
          .select()
          .single();

        if (brandError) {
          stats.errors.push(`Brand error for ${row.brand}: ${brandError.message}`);
          continue;
        }

        const brandId = brandData.id;
        const isNewBrand = brandData.created_at === brandData.updated_at;
        if (isNewBrand) stats.brands_created++;
        else stats.brands_updated++;

        // Upsert series if exists
        let seriesId = null;
        if (row.series_name) {
          const { data: seriesData, error: seriesError } = await supabaseClient
            .from("printer_series")
            .upsert(
              {
                brand_id: brandId,
                series_name: row.series_name,
              },
              { onConflict: "brand_id,series_name" }
            )
            .select()
            .single();

          if (seriesError) {
            stats.errors.push(`Series error for ${row.series_name}: ${seriesError.message}`);
          } else {
            seriesId = seriesData.id;
            const isNewSeries = seriesData.created_at === seriesData.updated_at;
            if (isNewSeries) stats.series_created++;
            else stats.series_updated++;
          }
        }

        // Prepare printer data using helper function
        const printerData = convertPrinterData(row);
        printerData.brand_id = brandId;
        printerData.series_id = seriesId;

        // Check if printer exists
        const { data: existingPrinter } = await supabaseClient
          .from("printers")
          .select("id")
          .eq("printer_id", row.printer_id)
          .maybeSingle();

        if (existingPrinter) {
          // Update existing printer
          console.log(`Updating existing printer ${row.printer_id}`);
          
          try {
            const { error: updateError } = await supabaseClient
              .from("printers")
              .update(printerData)
              .eq("printer_id", row.printer_id);

            if (updateError) {
              console.error(`Update error for ${row.printer_id}:`, updateError);
              console.error('Error details:', JSON.stringify({
                message: updateError.message,
                details: updateError.details,
                hint: updateError.hint,
                code: updateError.code
              }));
              console.error('Problematic fields:', JSON.stringify({
                extruder_count: printerData.extruder_count,
                multi_material_max_spools: printerData.multi_material_max_spools,
                review_count_aggregated: printerData.review_count_aggregated,
                onboard_storage_gb: printerData.onboard_storage_gb
              }));
              stats.errors.push(`Update error for ${row.printer_id}: ${updateError.message}`);
            } else {
              stats.printers_updated++;
            }
          } catch (updateException: any) {
            console.error(`Exception during update for ${row.printer_id}:`, updateException);
            stats.errors.push(`Update exception for ${row.printer_id}: ${updateException.message}`);
          }
        } else {
          // Insert new printer
          console.log(`Inserting new printer ${row.printer_id}`);
          
          try {
            const { error: insertError } = await supabaseClient
              .from("printers")
              .insert(printerData);

            if (insertError) {
              console.error(`Insert error for ${row.printer_id}:`, insertError);
              console.error('Error details:', JSON.stringify({
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint,
                code: insertError.code
              }));
              console.error('Problematic fields:', JSON.stringify({
                extruder_count: printerData.extruder_count,
                multi_material_max_spools: printerData.multi_material_max_spools,
                review_count_aggregated: printerData.review_count_aggregated,
                onboard_storage_gb: printerData.onboard_storage_gb
              }));
              stats.errors.push(`Insert error for ${row.printer_id}: ${insertError.message}`);
            } else {
              stats.printers_created++;
            }
          } catch (insertException: any) {
            console.error(`Exception during insert for ${row.printer_id}:`, insertException);
            stats.errors.push(`Insert exception for ${row.printer_id}: ${insertException.message}`);
          }
        }
      } catch (rowError: any) {
        stats.errors.push(`Row processing error: ${rowError?.message || String(rowError)}`);
      }
    }

    console.log("Import completed:", stats);

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});