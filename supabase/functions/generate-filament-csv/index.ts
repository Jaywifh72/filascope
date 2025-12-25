import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Field mappings for CSV export - matching the structure from filamentExportUtils.ts
const FILAMENT_FIELD_MAPPINGS = [
  // Basic Info
  { key: 'product_title', label: 'Product Name', category: 'Basic Info' },
  { key: 'vendor', label: 'Brand', category: 'Basic Info' },
  { key: 'material', label: 'Material', category: 'Basic Info' },
  { key: 'color_family', label: 'Color Family', category: 'Basic Info' },
  { key: 'color_hex', label: 'Color Hex', category: 'Basic Info' },
  { key: 'finish_type', label: 'Finish Type', category: 'Basic Info' },
  { key: 'diameter_nominal_mm', label: 'Diameter', category: 'Basic Info', unit: 'mm' },
  { key: 'net_weight_g', label: 'Net Weight', category: 'Basic Info', unit: 'g' },
  
  // Identifiers
  { key: 'id', label: 'Database ID', category: 'Identifiers' },
  { key: 'product_id', label: 'Product ID', category: 'Identifiers' },
  { key: 'product_handle', label: 'Product Handle', category: 'Identifiers' },
  { key: 'variant_sku', label: 'SKU', category: 'Identifiers' },
  { key: 'mpn', label: 'MPN', category: 'Identifiers' },
  { key: 'ean', label: 'EAN', category: 'Identifiers' },
  { key: 'gtin', label: 'GTIN', category: 'Identifiers' },
  { key: 'upc', label: 'UPC', category: 'Identifiers' },
  
  // Pricing
  { key: 'variant_price', label: 'Price (USD)', category: 'Pricing', unit: '$' },
  { key: 'variant_compare_at_price', label: 'Compare At Price', category: 'Pricing', unit: '$' },
  { key: 'price_eur', label: 'Price (EUR)', category: 'Pricing', unit: '€' },
  { key: 'price_gbp', label: 'Price (GBP)', category: 'Pricing', unit: '£' },
  { key: 'price_cad', label: 'Price (CAD)', category: 'Pricing', unit: 'C$' },
  { key: 'price_aud', label: 'Price (AUD)', category: 'Pricing', unit: 'A$' },
  { key: 'price_jpy', label: 'Price (JPY)', category: 'Pricing', unit: '¥' },
  { key: 'amazon_price_usd', label: 'Amazon Price (USD)', category: 'Pricing', unit: '$' },
  { key: 'variant_available', label: 'Available', category: 'Pricing' },
  
  // Physical Properties
  { key: 'density_g_cm3', label: 'Density', category: 'Physical Properties', unit: 'g/cm³' },
  { key: 'melt_temp_c', label: 'Melt Temperature', category: 'Physical Properties', unit: '°C' },
  { key: 'tg_c', label: 'Glass Transition Temp', category: 'Physical Properties', unit: '°C' },
  { key: 'transmission_distance', label: 'Transmission Distance', category: 'Physical Properties' },
  
  // Print Settings
  { key: 'nozzle_temp_min_c', label: 'Nozzle Temp Min', category: 'Print Settings', unit: '°C' },
  { key: 'nozzle_temp_max_c', label: 'Nozzle Temp Max', category: 'Print Settings', unit: '°C' },
  { key: 'nozzle_temp_sweetspot_c', label: 'Nozzle Sweetspot', category: 'Print Settings', unit: '°C' },
  { key: 'bed_temp_min_c', label: 'Bed Temp Min', category: 'Print Settings', unit: '°C' },
  { key: 'bed_temp_max_c', label: 'Bed Temp Max', category: 'Print Settings', unit: '°C' },
  { key: 'fan_min_percent', label: 'Fan Min', category: 'Print Settings', unit: '%' },
  { key: 'fan_max_percent', label: 'Fan Max', category: 'Print Settings', unit: '%' },
  { key: 'print_speed_max_mms', label: 'Max Print Speed', category: 'Print Settings', unit: 'mm/s' },
  { key: 'high_speed_capable', label: 'High Speed Capable', category: 'Print Settings' },
  { key: 'recommended_nozzle_type', label: 'Recommended Nozzle', category: 'Print Settings' },
  { key: 'is_nozzle_abrasive', label: 'Abrasive', category: 'Print Settings' },
  
  // Mechanical Properties
  { key: 'tensile_strength_xy_mpa', label: 'Tensile Strength XY', category: 'Mechanical Properties', unit: 'MPa' },
  { key: 'tensile_modulus_xy_mpa', label: 'Tensile Modulus XY', category: 'Mechanical Properties', unit: 'MPa' },
  { key: 'elongation_break_xy_percent', label: 'Elongation at Break XY', category: 'Mechanical Properties', unit: '%' },
  { key: 'flexural_strength_mpa', label: 'Flexural Strength', category: 'Mechanical Properties', unit: 'MPa' },
  { key: 'shore_hardness_d', label: 'Shore Hardness D', category: 'Mechanical Properties' },
  { key: 'strength_index', label: 'Strength Index', category: 'Mechanical Properties' },
  
  // Drying & Care
  { key: 'drying_temp_c', label: 'Drying Temperature', category: 'Drying & Care', unit: '°C' },
  { key: 'drying_time_hours', label: 'Drying Time', category: 'Drying & Care', unit: 'hours' },
  { key: 'moisture_sensitivity_level', label: 'Moisture Sensitivity', category: 'Drying & Care' },
  { key: 'moisture_care', label: 'Moisture Care Notes', category: 'Drying & Care' },
  { key: 'nozzle_care', label: 'Nozzle Care Notes', category: 'Drying & Care' },
  
  // Spool Specifications
  { key: 'spool_outer_d_mm', label: 'Spool Outer Diameter', category: 'Spool Specifications', unit: 'mm' },
  { key: 'spool_width_mm', label: 'Spool Width', category: 'Spool Specifications', unit: 'mm' },
  { key: 'spool_material', label: 'Spool Material', category: 'Spool Specifications' },
  { key: 'spool_ams_fit', label: 'AMS Compatible', category: 'Spool Specifications' },
  { key: 'pack_quantity', label: 'Pack Quantity', category: 'Spool Specifications' },
  
  // Material Composition
  { key: 'carbon_fiber_percentage', label: 'Carbon Fiber %', category: 'Material Composition', unit: '%' },
  { key: 'glass_fiber_percentage', label: 'Glass Fiber %', category: 'Material Composition', unit: '%' },
  { key: 'wood_powder_percentage', label: 'Wood Powder %', category: 'Material Composition', unit: '%' },
  { key: 'wood_type', label: 'Wood Type', category: 'Material Composition' },
  { key: 'wood_particle_size_microns', label: 'Wood Particle Size', category: 'Material Composition', unit: 'μm' },
  { key: 'wood_fiber_length_mm', label: 'Wood Fiber Length', category: 'Material Composition', unit: 'mm' },
  { key: 'wood_scent_level', label: 'Wood Scent Level', category: 'Material Composition' },
  { key: 'food_contact_rating', label: 'Food Contact Rating', category: 'Material Composition' },
  
  // Scores & Ratings
  { key: 'printability_index', label: 'Printability Index', category: 'Scores & Ratings' },
  { key: 'ease_of_printing_score', label: 'Ease of Printing', category: 'Scores & Ratings' },
  { key: 'dimensional_accuracy_score', label: 'Dimensional Accuracy', category: 'Scores & Ratings' },
  { key: 'value_score', label: 'Value Score', category: 'Scores & Ratings' },
  
  // Tags & Use Cases
  { key: 'use_case_tags', label: 'Use Case Tags', category: 'Tags & Use Cases' },
  { key: 'industry_tags', label: 'Industry Tags', category: 'Tags & Use Cases' },
  { key: 'available_regions', label: 'Available Regions', category: 'Tags & Use Cases' },
  
  // Product URLs
  { key: 'product_url', label: 'Product URL (US)', category: 'Product URLs' },
  { key: 'product_url_eu', label: 'Product URL (EU)', category: 'Product URLs' },
  { key: 'product_url_uk', label: 'Product URL (UK)', category: 'Product URLs' },
  { key: 'product_url_ca', label: 'Product URL (CA)', category: 'Product URLs' },
  { key: 'product_url_au', label: 'Product URL (AU)', category: 'Product URLs' },
  { key: 'product_url_jp', label: 'Product URL (JP)', category: 'Product URLs' },
  { key: 'featured_image', label: 'Featured Image URL', category: 'Product URLs' },
  { key: 'tds_url', label: 'Technical Data Sheet URL', category: 'Product URLs' },
  
  // Amazon Links
  { key: 'amazon_link_us', label: 'Amazon US', category: 'Amazon Links' },
  { key: 'amazon_link_uk', label: 'Amazon UK', category: 'Amazon Links' },
  { key: 'amazon_link_de', label: 'Amazon DE', category: 'Amazon Links' },
  { key: 'amazon_match_confidence', label: 'Amazon Match Confidence', category: 'Amazon Links' },
  { key: 'amazon_prices_last_updated_at', label: 'Amazon Prices Updated', category: 'Amazon Links' },
  
  // System Metadata
  { key: 'created_at', label: 'Created At', category: 'System Metadata' },
  { key: 'updated_at', label: 'Updated At', category: 'System Metadata' },
  { key: 'published_at', label: 'Published At', category: 'System Metadata' },
  { key: 'last_scraped_at', label: 'Last Scraped', category: 'System Metadata' },
  { key: 'sync_status', label: 'Sync Status', category: 'System Metadata' },
  { key: 'auto_created', label: 'Auto Created', category: 'System Metadata' },
  { key: 'auto_updated', label: 'Auto Updated', category: 'System Metadata' },
];

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join('; ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const vendor = url.searchParams.get('vendor');

    if (!vendor) {
      return new Response(
        JSON.stringify({ error: 'Missing vendor parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating CSV for vendor: ${vendor}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all filaments for the vendor (case-insensitive)
    const { data: filaments, error } = await supabase
      .from('filaments')
      .select('*')
      .ilike('vendor', vendor)
      .order('product_title');

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Database query failed', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filaments?.length || 0} filaments for ${vendor}`);

    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ error: `No filaments found for vendor: ${vendor}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate CSV header
    const headers = FILAMENT_FIELD_MAPPINGS.map(f => f.label);
    const csvLines: string[] = [headers.map(h => escapeCSV(h)).join(',')];

    // Generate CSV rows
    for (const filament of filaments) {
      const row = FILAMENT_FIELD_MAPPINGS.map(field => {
        const value = filament[field.key];
        return escapeCSV(formatValue(value));
      });
      csvLines.push(row.join(','));
    }

    const csvContent = csvLines.join('\n');
    const filename = `${vendor.toLowerCase().replace(/\s+/g, '-')}-filaments-${new Date().toISOString().split('T')[0]}.csv`;

    console.log(`Generated CSV with ${filaments.length} rows, filename: ${filename}`);

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error('Error generating CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
