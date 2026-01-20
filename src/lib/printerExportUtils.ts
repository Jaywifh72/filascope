import { supabase } from "@/integrations/supabase/client";

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Format boolean values for CSV
 */
function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? 'Yes' : 'No';
}

/**
 * Format date values for CSV
 */
function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  return value;
}

/**
 * Extract product images from scraped_data JSON
 */
function extractProductImages(scrapedData: unknown): string {
  if (!scrapedData || typeof scrapedData !== 'object') return '';
  const data = scrapedData as Record<string, unknown>;
  const images = data.images as Record<string, unknown> | undefined;
  if (!images) return '';
  const productImages = images.product_images as string[] | undefined;
  if (!productImages || !Array.isArray(productImages)) return '';
  return productImages.join('; ');
}

// Column mapping for CSV headers
const PRINTER_COLUMNS = [
  // Identity
  { key: 'brand_name', header: 'Brand' },
  { key: 'model_name', header: 'Model Name' },
  { key: 'variant_or_bundle_name', header: 'Variant/Bundle' },
  { key: 'series_name', header: 'Series' },
  { key: 'printer_id', header: 'Printer ID' },
  { key: 'sku', header: 'SKU' },
  { key: 'ean_upc', header: 'EAN/UPC' },
  { key: 'printer_technology', header: 'Technology' },
  
  // Pricing - Store
  { key: 'msrp_usd', header: 'MSRP (USD)' },
  { key: 'current_price_usd_store', header: 'Store Price (USD)' },
  { key: 'current_price_cad_store', header: 'Store Price (CAD)' },
  { key: 'current_price_eur_store', header: 'Store Price (EUR)' },
  { key: 'current_price_gbp_store', header: 'Store Price (GBP)' },
  { key: 'current_price_aud_store', header: 'Store Price (AUD)' },
  { key: 'current_price_jpy_store', header: 'Store Price (JPY)' },
  
  // Pricing - Amazon
  { key: 'current_price_usd_amazon', header: 'Amazon Price (USD)' },
  { key: 'current_price_cad_amazon', header: 'Amazon Price (CAD)' },
  { key: 'current_price_eur_amazon', header: 'Amazon Price (EUR)' },
  { key: 'current_price_gbp_amazon', header: 'Amazon Price (GBP)' },
  { key: 'current_price_aud_amazon', header: 'Amazon Price (AUD)' },
  { key: 'current_price_jpy_amazon', header: 'Amazon Price (JPY)' },
  
  // Build Volume
  { key: 'build_volume_x_mm', header: 'Build Volume X (mm)' },
  { key: 'build_volume_y_mm', header: 'Build Volume Y (mm)' },
  { key: 'build_volume_z_mm', header: 'Build Volume Z (mm)' },
  { key: 'build_volume_shape', header: 'Build Volume Shape' },
  { key: 'max_build_height_with_ams_mm', header: 'Max Build Height with AMS (mm)' },
  
  // Machine Dimensions
  { key: 'machine_width_mm', header: 'Machine Width (mm)' },
  { key: 'machine_depth_mm', header: 'Machine Depth (mm)' },
  { key: 'machine_height_mm', header: 'Machine Height (mm)' },
  { key: 'machine_weight_kg', header: 'Machine Weight (kg)' },
  { key: 'machine_style', header: 'Machine Style' },
  { key: 'frame_material', header: 'Frame Material' },
  
  // Enclosure
  { key: 'has_enclosure', header: 'Has Enclosure' },
  { key: 'enclosure_type', header: 'Enclosure Type' },
  { key: 'enclosure_heated', header: 'Enclosure Heated' },
  { key: 'enclosure_max_temp_c', header: 'Enclosure Max Temp (°C)' },
  
  // Performance
  { key: 'max_print_speed_mms', header: 'Max Print Speed (mm/s)' },
  { key: 'max_travel_speed_xy_mms', header: 'Max Travel Speed XY (mm/s)' },
  { key: 'recommended_quality_speed_mms', header: 'Recommended Quality Speed (mm/s)' },
  { key: 'max_acceleration_xy_mmss', header: 'Max Acceleration XY (mm/s²)' },
  { key: 'max_acceleration_z_mmss', header: 'Max Acceleration Z (mm/s²)' },
  { key: 'input_shaping_supported', header: 'Input Shaping Supported' },
  { key: 'linear_rails_on_axes', header: 'Linear Rails on Axes' },
  { key: 'motion_system_notes', header: 'Motion System Notes' },
  
  // Extruder
  { key: 'extruder_count', header: 'Extruder Count' },
  { key: 'extruder_type', header: 'Extruder Type' },
  { key: 'extruder_drive_type', header: 'Extruder Drive Type' },
  { key: 'filament_diameter_mm', header: 'Filament Diameter (mm)' },
  { key: 'extruder_notes', header: 'Extruder Notes' },
  
  // Hotend
  { key: 'hotend_type', header: 'Hotend Type' },
  { key: 'hotend_brand_model', header: 'Hotend Brand/Model' },
  { key: 'max_nozzle_temp_c', header: 'Max Nozzle Temp (°C)' },
  { key: 'sustained_nozzle_temp_c', header: 'Sustained Nozzle Temp (°C)' },
  { key: 'stock_nozzle_diameter_mm', header: 'Stock Nozzle Diameter (mm)' },
  { key: 'supported_nozzle_diameters_mm', header: 'Supported Nozzle Diameters (mm)' },
  { key: 'nozzle_material', header: 'Nozzle Material' },
  { key: 'max_flow_rate_mm3s', header: 'Max Flow Rate (mm³/s)' },
  { key: 'abrasive_filament_support', header: 'Abrasive Filament Support' },
  
  // Bed
  { key: 'bed_size_x_mm', header: 'Bed Size X (mm)' },
  { key: 'bed_size_y_mm', header: 'Bed Size Y (mm)' },
  { key: 'bed_type', header: 'Bed Type' },
  { key: 'bed_heated', header: 'Bed Heated' },
  { key: 'bed_max_temp_c', header: 'Bed Max Temp (°C)' },
  { key: 'bed_heater_power_w', header: 'Bed Heater Power (W)' },
  { key: 'stock_plate_types', header: 'Stock Plate Types' },
  { key: 'supported_plate_types', header: 'Supported Plate Types' },
  
  // Auto Bed Leveling
  { key: 'auto_bed_leveling', header: 'Auto Bed Leveling' },
  { key: 'abl_technique', header: 'ABL Technique' },
  { key: 'auto_bed_leveling_method', header: 'ABL Method' },
  { key: 'first_layer_assist_features', header: 'First Layer Assist Features' },
  
  // Safety & Sensors
  { key: 'filter_type', header: 'Filter Type' },
  { key: 'internal_lighting', header: 'Internal Lighting' },
  { key: 'door_sensor', header: 'Door Sensor' },
  { key: 'smoke_sensor', header: 'Smoke Sensor' },
  { key: 'temperature_sensors', header: 'Temperature Sensors' },
  { key: 'filament_runout_detection', header: 'Filament Runout Detection' },
  { key: 'power_loss_resume', header: 'Power Loss Resume' },
  
  // Materials
  { key: 'official_supported_materials', header: 'Official Supported Materials' },
  { key: 'recommended_materials', header: 'Recommended Materials' },
  { key: 'abrasive_materials_supported', header: 'Abrasive Materials Supported' },
  { key: 'max_recommended_material_temp_c', header: 'Max Recommended Material Temp (°C)' },
  { key: 'materials_notes', header: 'Materials Notes' },
  
  // Multi-Material
  { key: 'multi_material_supported', header: 'Multi-Material Supported' },
  { key: 'native_multi_material_system', header: 'Native Multi-Material System' },
  { key: 'compatible_multi_material_systems', header: 'Compatible Multi-Material Systems' },
  { key: 'multi_material_max_spools', header: 'Multi-Material Max Spools' },
  { key: 'multi_material_spool_chamber_max_temp_c', header: 'Spool Chamber Max Temp (°C)' },
  { key: 'multi_material_drying_capability', header: 'Drying Capability' },
  { key: 'multi_material_limitations_notes', header: 'Multi-Material Notes' },
  
  // Connectivity
  { key: 'has_wifi', header: 'WiFi' },
  { key: 'has_ethernet', header: 'Ethernet' },
  { key: 'has_bluetooth', header: 'Bluetooth' },
  { key: 'has_usb_a_port', header: 'USB-A Port' },
  { key: 'has_usb_c_port', header: 'USB-C Port' },
  { key: 'has_sd_card', header: 'SD Card' },
  { key: 'has_micro_sd_card', header: 'Micro SD Card' },
  { key: 'onboard_storage_gb', header: 'Onboard Storage (GB)' },
  
  // Display & Control
  { key: 'display_type', header: 'Display Type' },
  { key: 'display_size_inches', header: 'Display Size (inches)' },
  { key: 'display_touchscreen', header: 'Touchscreen' },
  { key: 'onboard_slicer', header: 'Onboard Slicer' },
  
  // Software & Remote
  { key: 'supported_slicers', header: 'Supported Slicers' },
  { key: 'default_slicer', header: 'Default Slicer' },
  { key: 'remote_monitoring_supported', header: 'Remote Monitoring' },
  { key: 'integrated_camera', header: 'Integrated Camera' },
  { key: 'ai_spaghetti_detection', header: 'AI Spaghetti Detection' },
  { key: 'timelapse_supported', header: 'Timelapse Supported' },
  { key: 'cloud_printing', header: 'Cloud Printing' },
  
  // Power
  { key: 'power_input_voltage', header: 'Power Input Voltage' },
  { key: 'power_supply_wattage_w', header: 'Power Supply Wattage (W)' },
  { key: 'avg_power_consumption_w', header: 'Avg Power Consumption (W)' },
  
  // Ratings
  { key: 'rating', header: 'Rating' },
  { key: 'community_score', header: 'Community Score' },
  
  // URLs
  { key: 'official_product_url', header: 'Official Product URL' },
  { key: 'official_store_url', header: 'Official Store URL' },
  { key: 'amazon_url_us', header: 'Amazon URL (US)' },
  { key: 'amazon_url_ca', header: 'Amazon URL (CA)' },
  { key: 'amazon_url_uk', header: 'Amazon URL (UK)' },
  { key: 'other_retailer_urls', header: 'Other Retailer URLs' },
  
  // Firmware
  { key: 'firmware_family', header: 'Firmware Family' },
  { key: 'firmware_open_source', header: 'Firmware Open Source' },
  
  // Status & Dates
  { key: 'status', header: 'Status' },
  { key: 'discontinued', header: 'Discontinued' },
  { key: 'release_date', header: 'Release Date' },
  { key: 'discontinued_date', header: 'Discontinued Date' },
  { key: 'last_verified_at', header: 'Last Verified At' },
  
  // Images
  { key: 'product_images', header: 'Product Images' },
  
  // Internal
  { key: 'id', header: 'Database ID' },
  { key: 'created_at', header: 'Created At' },
  { key: 'updated_at', header: 'Updated At' },
] as const;

// Boolean columns for proper formatting
const BOOLEAN_COLUMNS = new Set([
  'has_enclosure', 'enclosure_heated', 'input_shaping_supported', 'abrasive_filament_support',
  'bed_heated', 'auto_bed_leveling', 'internal_lighting', 'door_sensor', 'smoke_sensor',
  'filament_runout_detection', 'power_loss_resume', 'abrasive_materials_supported',
  'multi_material_supported', 'native_multi_material_system', 'multi_material_drying_capability',
  'has_wifi', 'has_ethernet', 'has_bluetooth', 'has_usb_a_port', 'has_usb_c_port',
  'has_sd_card', 'has_micro_sd_card', 'display_touchscreen', 'onboard_slicer',
  'remote_monitoring_supported', 'integrated_camera', 'ai_spaghetti_detection',
  'timelapse_supported', 'cloud_printing', 'firmware_open_source', 'discontinued',
]);

interface PrinterWithJoins {
  [key: string]: unknown;
  brand?: { brand: string } | null;
  series?: { series_name: string } | null;
  scraped_data?: unknown;
}

/**
 * Export all printers from the database to a CSV file
 */
export async function exportPrinterDatabaseCSV(): Promise<{ success: boolean; count: number; error?: string }> {
  const PAGE_SIZE = 1000;
  const allPrinters: PrinterWithJoins[] = [];

  try {
    // Fetch all printers with pagination
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('printers')
        .select(`
          *,
          brand:printer_brands!brand_id(brand),
          series:printer_series!series_id(series_name)
        `)
        .order('model_name', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (data && data.length > 0) {
        allPrinters.push(...(data as PrinterWithJoins[]));
        hasMore = data.length === PAGE_SIZE;
        page++;
      } else {
        hasMore = false;
      }
    }

    if (allPrinters.length === 0) {
      return { success: false, count: 0, error: 'No printers found in database' };
    }

    // Build CSV content
    const headers = PRINTER_COLUMNS.map(col => col.header);
    const csvRows = [headers.join(',')];

    for (const printer of allPrinters) {
      const row = PRINTER_COLUMNS.map(col => {
        const key = col.key;
        
        // Handle special joined columns
        if (key === 'brand_name') {
          return escapeCSV(printer.brand?.brand || '');
        }
        if (key === 'series_name') {
          return escapeCSV(printer.series?.series_name || '');
        }
        if (key === 'product_images') {
          return escapeCSV(extractProductImages(printer.scraped_data));
        }
        
        const value = printer[key];
        
        // Handle boolean columns
        if (BOOLEAN_COLUMNS.has(key)) {
          return escapeCSV(formatBoolean(value as boolean | null | undefined));
        }
        
        // Handle date columns
        if (key === 'release_date' || key === 'discontinued_date' || key === 'last_verified_at' || key === 'created_at' || key === 'updated_at') {
          return escapeCSV(formatDate(value as string | null | undefined));
        }
        
        // Handle regular values
        return escapeCSV(value as string | number | null | undefined);
      });
      
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `filascope_printers_export_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, count: allPrinters.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return { success: false, count: 0, error: message };
  }
}
