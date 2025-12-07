import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Expanded specs interface for comprehensive nozzle/hotend data
interface NozzleSpecs {
  // Core nozzle specs
  diameter_mm: number;
  material: string;
  max_temp_c?: number;
  hardened: boolean;
  wear_rating?: string;
  flow_rate?: string;
  coating?: string;
  
  // Thread and geometry
  thread_type?: string; // M6, V6, MK8, Volcano, proprietary
  orifice_geometry?: string; // Standard, CHT (triple-bore), pointed tip, flat tip
  tip_geometry?: string; // Conical, flat, extended
  inner_diameter_mm?: number; // Melt zone inner diameter
  
  // Thermal properties
  thermal_conductivity_notes?: string; // e.g., "High conductivity plated copper core"
  sustained_temp_c?: number; // Max sustained operating temp vs burst
  
  // Hotend/assembly specs (when nozzle is part of assembly)
  heater_cartridge?: {
    voltage?: number; // 12V, 24V
    wattage?: number; // 40W, 50W, 60W
    diameter_mm?: number; // 6mm cartridge
  };
  thermistor_type?: string; // NTC 100K, PT1000, ATC Semitec 104GT-2
  heatbreak_material?: string; // stainless steel, titanium, bi-metal, all-metal
  cooling_method?: string; // passive, active fan, water-cooled
  
  // Compatibility
  supported_filament_types?: string[]; // PLA, ABS, PETG, TPU, CF, GF, metal-filled
  mounting_interface?: string; // V6-style, MK8, Volcano, proprietary
  hotend_system?: string; // E3D V6, Revo, Dragon, Rapido, Mosquito
  
  // Special features
  special_features?: string[]; // ruby tip, sapphire tip, quick-swap, CHT, high-flow
  
  // Data quality
  confidence_score?: number; // 0-1, how confident we are in extracted data
  extraction_notes?: string; // Notes about uncertain or inferred values
}

interface NozzleData {
  name: string;
  brand: string;
  model?: string;
  specs: NozzleSpecs;
  product_url: string;
  image_url?: string;
  price?: number;
  currency?: string;
  description?: string;
  compatible_printer_brands?: string[];
  compatible_hotend_types?: string[];
  // Per-nozzle compatibility pattern (overrides brand-level pattern)
  printer_compatibility_pattern?: RegExp;
}

interface QCReport {
  brand: string;
  total_discovered: number;
  url_validated: number;
  url_failed: number;
  image_validated: number;
  image_failed: number;
  price_found: number;
  specs_complete: number;
  inserted: number;
  errors: string[];
}

// Brand store configurations for dynamic scraping
const BRAND_STORE_CONFIGS: Record<string, {
  nozzle_collection_url: string;
  is_shopify: boolean;
  compatibility_pattern: RegExp;
  compatible_hotend_types: string[];
  brand_filter?: string;
  product_filter?: string;
  // Skip URL validation for hardcoded data that has been manually verified
  skip_validation?: boolean;
  // Hardcoded nozzles for brands without scrapeable stores (like Bambu Lab's custom platform)
  hardcoded_nozzles?: NozzleData[];
}> = {
  'Bambu Lab': {
    // Bambu Lab uses custom platform (not Shopify) - hardcode nozzles with verified URLs
    nozzle_collection_url: 'https://us.store.bambulab.com/collections/spare-parts',
    is_shopify: false,
    compatibility_pattern: /X1|P1|A1|H2|P2/i, // Fallback only
    compatible_hotend_types: ['Bambu Lab Hotend'],
    product_filter: 'nozzle|hotend|hardened|stainless',
    skip_validation: true,
    hardcoded_nozzles: [
      // ========== A1 SERIES HOTENDS (A1, A1 Mini) ==========
      {
        name: '0.2mm Stainless Steel Hotend (A1)',
        brand: 'Bambu Lab',
        model: 'Hotend-A1-SS-0.2',
        specs: { 
          diameter_mm: 0.2, 
          material: 'stainless steel', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Low', 
          wear_rating: 'High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'A1 quick-swap',
          hotend_system: 'Bambu Lab A1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 48 },
          supported_filament_types: ['PLA', 'PETG', 'TPU', 'PVA'],
          special_features: ['Quick-swap hotend', 'Integrated assembly']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-a1-series',
        image_url: 'https://store.bblcdn.com/s7/default/0f775f9301174a67b80759d324061e51/0.4.png',
        price: 10.99,
        currency: 'USD',
        description: 'Quick-swap hotend for A1 series with 0.2mm stainless steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /^A1/i,
      },
      {
        name: '0.4mm Stainless Steel Hotend (A1)',
        brand: 'Bambu Lab',
        model: 'Hotend-A1-SS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'stainless steel', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Standard', 
          wear_rating: 'High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'A1 quick-swap',
          hotend_system: 'Bambu Lab A1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 48 },
          supported_filament_types: ['PLA', 'PETG', 'TPU', 'PVA'],
          special_features: ['Quick-swap hotend', 'Integrated assembly']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-a1-series',
        image_url: 'https://store.bblcdn.com/s7/default/0f775f9301174a67b80759d324061e51/0.4.png',
        price: 10.99,
        currency: 'USD',
        description: 'Quick-swap hotend for A1 series with 0.4mm stainless steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /^A1/i,
      },
      {
        name: '0.4mm Hardened Steel Hotend (A1)',
        brand: 'Bambu Lab',
        model: 'Hotend-A1-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'Standard', 
          wear_rating: 'Very High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'A1 quick-swap',
          hotend_system: 'Bambu Lab A1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 48 },
          supported_filament_types: ['PLA', 'PETG', 'TPU', 'PVA', 'CF-PLA', 'CF-PETG', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'Integrated assembly', 'Abrasive-resistant']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-a1-series',
        image_url: 'https://store.bblcdn.com/s7/default/0f775f9301174a67b80759d324061e51/0.4.png',
        price: 12.99,
        currency: 'USD',
        description: 'Quick-swap hotend for A1 series with 0.4mm hardened steel for abrasive filaments',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /^A1/i,
      },
      {
        name: '0.6mm Hardened Steel Hotend (A1)',
        brand: 'Bambu Lab',
        model: 'Hotend-A1-HS-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'A1 quick-swap',
          hotend_system: 'Bambu Lab A1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 48 },
          supported_filament_types: ['PLA', 'PETG', 'TPU', 'PVA', 'CF-PLA', 'CF-PETG', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'Integrated assembly', 'Abrasive-resistant', 'High flow']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-a1-series',
        image_url: 'https://store.bblcdn.com/s7/default/0f775f9301174a67b80759d324061e51/0.4.png',
        price: 12.99,
        currency: 'USD',
        description: 'Quick-swap hotend for A1 series with 0.6mm hardened steel for fast printing',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /^A1/i,
      },
      {
        name: '0.8mm Hardened Steel Hotend (A1)',
        brand: 'Bambu Lab',
        model: 'Hotend-A1-HS-0.8',
        specs: { 
          diameter_mm: 0.8, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'Very High', 
          wear_rating: 'Very High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'A1 quick-swap',
          hotend_system: 'Bambu Lab A1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 48 },
          supported_filament_types: ['PLA', 'PETG', 'TPU', 'PVA', 'CF-PLA', 'CF-PETG', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'Integrated assembly', 'Abrasive-resistant', 'Very high flow']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-a1-series',
        image_url: 'https://store.bblcdn.com/s7/default/0f775f9301174a67b80759d324061e51/0.4.png',
        price: 12.99,
        currency: 'USD',
        description: 'Quick-swap hotend for A1 series with 0.8mm hardened steel for rapid prints',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /^A1/i,
      },
      // ========== H2/P2S SERIES HOTENDS (H2D, H2C, H2S, P2S) ==========
      {
        name: '0.2mm Stainless Steel Hotend (H2/P2S)',
        brand: 'Bambu Lab',
        model: 'Hotend-H2P2S-SS-0.2',
        specs: { 
          diameter_mm: 0.2, 
          material: 'stainless steel', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Low', 
          wear_rating: 'High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'H2/P2S quick-swap',
          hotend_system: 'Bambu Lab H2/P2S',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 65 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'TPU', 'PVA'],
          special_features: ['Quick-swap hotend', 'High-flow design', 'Enclosed chamber compatible']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-h2-p2s',
        image_url: 'https://store.bblcdn.com/s7/default/e7253f40ef9140d4b4956cc15f5839b5/hotend-1.png',
        price: 20.99,
        currency: 'USD',
        description: 'Quick-swap hotend assembly for H2D/H2C/H2S/P2S with 0.2mm stainless steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /H2D|H2C|H2S|P2S/i,
      },
      {
        name: '0.4mm Hardened Steel Hotend (H2/P2S)',
        brand: 'Bambu Lab',
        model: 'Hotend-H2P2S-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'Standard', 
          wear_rating: 'Very High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'H2/P2S quick-swap',
          hotend_system: 'Bambu Lab H2/P2S',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 65 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'High-flow design', 'Enclosed chamber compatible', 'Abrasive-resistant']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-h2-p2s',
        image_url: 'https://store.bblcdn.com/s7/default/e7253f40ef9140d4b4956cc15f5839b5/hotend-1.png',
        price: 20.99,
        currency: 'USD',
        description: 'Quick-swap hotend assembly for H2D/H2C/H2S/P2S with 0.4mm hardened steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /H2D|H2C|H2S|P2S/i,
      },
      {
        name: '0.6mm Hardened Steel Hotend (H2/P2S)',
        brand: 'Bambu Lab',
        model: 'Hotend-H2P2S-HS-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'H2/P2S quick-swap',
          hotend_system: 'Bambu Lab H2/P2S',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 65 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'High-flow design', 'Enclosed chamber compatible', 'Abrasive-resistant']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-h2-p2s',
        image_url: 'https://store.bblcdn.com/s7/default/e7253f40ef9140d4b4956cc15f5839b5/hotend-1.png',
        price: 20.99,
        currency: 'USD',
        description: 'Quick-swap hotend assembly for H2D/H2C/H2S/P2S with 0.6mm hardened steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /H2D|H2C|H2S|P2S/i,
      },
      {
        name: '0.8mm Hardened Steel Hotend (H2/P2S)',
        brand: 'Bambu Lab',
        model: 'Hotend-H2P2S-HS-0.8',
        specs: { 
          diameter_mm: 0.8, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'Very High', 
          wear_rating: 'Very High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'H2/P2S quick-swap',
          hotend_system: 'Bambu Lab H2/P2S',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 65 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'High-flow design', 'Enclosed chamber compatible', 'Abrasive-resistant', 'Very high flow']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-h2-p2s',
        image_url: 'https://store.bblcdn.com/s7/default/e7253f40ef9140d4b4956cc15f5839b5/hotend-1.png',
        price: 20.99,
        currency: 'USD',
        description: 'Quick-swap hotend assembly for H2D/H2C/H2S/P2S with 0.8mm hardened steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /H2D|H2C|H2S|P2S/i,
      },
      // ========== X1/P1 SERIES HOTENDS (X1C, X1E, P1P, P1S) ==========
      {
        name: '0.2mm Stainless Steel Hotend (X1/P1)',
        brand: 'Bambu Lab',
        model: 'Hotend-X1P1-SS-0.2',
        specs: { 
          diameter_mm: 0.2, 
          material: 'stainless steel', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Low', 
          wear_rating: 'High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'X1/P1 quick-swap',
          hotend_system: 'Bambu Lab X1/P1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 48 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'TPU', 'PVA'],
          special_features: ['Quick-swap hotend', 'Enclosed chamber compatible']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-x1c',
        image_url: 'https://store.bblcdn.com/s7/default/7fb1a1dd8bff49da9a2b41b34f64015b/hotend-1.png',
        price: 19.99,
        currency: 'USD',
        description: 'Complete hotend assembly for X1C/X1E/P1P/P1S with 0.2mm stainless steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /X1|P1P|P1S/i,
      },
      {
        name: '0.4mm Hardened Steel Hotend (X1/P1)',
        brand: 'Bambu Lab',
        model: 'Hotend-X1P1-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'Standard', 
          wear_rating: 'Very High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'X1/P1 quick-swap',
          hotend_system: 'Bambu Lab X1/P1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 48 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'Enclosed chamber compatible', 'Abrasive-resistant']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-x1c',
        image_url: 'https://store.bblcdn.com/s7/default/7fb1a1dd8bff49da9a2b41b34f64015b/hotend-1.png',
        price: 19.99,
        currency: 'USD',
        description: 'Complete hotend assembly for X1C/X1E/P1P/P1S with 0.4mm hardened steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /X1|P1P|P1S/i,
      },
      {
        name: '0.6mm Hardened Steel Hotend (X1/P1)',
        brand: 'Bambu Lab',
        model: 'Hotend-X1P1-HS-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'X1/P1 quick-swap',
          hotend_system: 'Bambu Lab X1/P1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 48 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'Enclosed chamber compatible', 'Abrasive-resistant', 'High flow']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-x1c',
        image_url: 'https://store.bblcdn.com/s7/default/7fb1a1dd8bff49da9a2b41b34f64015b/hotend-1.png',
        price: 19.99,
        currency: 'USD',
        description: 'Complete hotend assembly for X1C/X1E/P1P/P1S with 0.6mm hardened steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /X1|P1P|P1S/i,
      },
      {
        name: '0.8mm Hardened Steel Hotend (X1/P1)',
        brand: 'Bambu Lab',
        model: 'Hotend-X1P1-HS-0.8',
        specs: { 
          diameter_mm: 0.8, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'Very High', 
          wear_rating: 'Very High',
          thread_type: 'Bambu Lab (proprietary)',
          mounting_interface: 'X1/P1 quick-swap',
          hotend_system: 'Bambu Lab X1/P1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 48 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'Enclosed chamber compatible', 'Abrasive-resistant', 'Very high flow']
        },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-x1c',
        image_url: 'https://store.bblcdn.com/s7/default/7fb1a1dd8bff49da9a2b41b34f64015b/hotend-1.png',
        price: 19.99,
        currency: 'USD',
        description: 'Complete hotend assembly for X1C/X1E/P1P/P1S with 0.8mm hardened steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /X1|P1P|P1S/i,
      },
    ],
  },
  'Prusa Research': {
    nozzle_collection_url: 'https://www.prusa3d.com/category/nozzles/',
    is_shopify: false,
    compatibility_pattern: /MK4|MK3|MINI|XL|Core/i,
    compatible_hotend_types: ['E3D V6', 'Prusa Nextruder'],
    skip_validation: true,
    hardcoded_nozzles: [
      // ========== NEXTRUDER NOZZLES (MK4, MK4S, MK3.9, Core One) ==========
      {
        name: '0.25mm Brass Nextruder Nozzle',
        brand: 'Prusa Research',
        model: 'Nextruder-Brass-0.25',
        specs: { 
          diameter_mm: 0.25, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Low', 
          wear_rating: 'Standard',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'PT1000',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Tool-less nozzle change', 'Quick-swap design']
        },
        product_url: 'https://www.prusa3d.com/product/brass-nozzle-for-nextruder-0-25-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3073.jpg',
        price: 7.99,
        currency: 'USD',
        description: 'High-quality brass nozzle for Nextruder - 0.25mm for fine detail prints',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|Core One/i,
      },
      {
        name: '0.4mm Brass Nextruder Nozzle',
        brand: 'Prusa Research',
        model: 'Nextruder-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'PT1000',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Tool-less nozzle change', 'Quick-swap design']
        },
        product_url: 'https://www.prusa3d.com/product/brass-nozzle-for-nextruder-0-4-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3074.jpg',
        price: 7.99,
        currency: 'USD',
        description: 'Standard brass nozzle for Nextruder - 0.4mm all-purpose',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|Core One/i,
      },
      {
        name: '0.6mm Brass Nextruder Nozzle',
        brand: 'Prusa Research',
        model: 'Nextruder-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'PT1000',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Tool-less nozzle change', 'Quick-swap design']
        },
        product_url: 'https://www.prusa3d.com/product/brass-nozzle-for-nextruder-0-6-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3075.jpg',
        price: 7.99,
        currency: 'USD',
        description: 'Brass nozzle for Nextruder - 0.6mm for faster prints',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|Core One/i,
      },
      {
        name: '0.8mm Brass Nextruder Nozzle',
        brand: 'Prusa Research',
        model: 'Nextruder-Brass-0.8',
        specs: { 
          diameter_mm: 0.8, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Very High', 
          wear_rating: 'Standard',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'PT1000',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Tool-less nozzle change', 'Quick-swap design']
        },
        product_url: 'https://www.prusa3d.com/product/brass-nozzle-for-nextruder-0-8-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3076.jpg',
        price: 7.99,
        currency: 'USD',
        description: 'Brass nozzle for Nextruder - 0.8mm for rapid prototyping',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|Core One/i,
      },
      {
        name: '0.4mm Hardened Steel Nextruder Nozzle',
        brand: 'Prusa Research',
        model: 'Nextruder-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 450, 
          flow_rate: 'Standard', 
          wear_rating: 'Very High',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'PT1000',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Tool-less nozzle change', 'Quick-swap design', 'Abrasive-resistant']
        },
        product_url: 'https://www.prusa3d.com/product/hardened-steel-nozzle-for-nextruder-0-4-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3077.jpg',
        price: 24.99,
        currency: 'USD',
        description: 'Hardened steel nozzle for abrasive filaments - 0.4mm',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|Core One/i,
      },
      {
        name: '0.6mm Hardened Steel Nextruder Nozzle',
        brand: 'Prusa Research',
        model: 'Nextruder-HS-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 450, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'PT1000',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Tool-less nozzle change', 'Quick-swap design', 'Abrasive-resistant']
        },
        product_url: 'https://www.prusa3d.com/product/hardened-steel-nozzle-for-nextruder-0-6-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3078.jpg',
        price: 24.99,
        currency: 'USD',
        description: 'Hardened steel nozzle for abrasive filaments - 0.6mm',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|Core One/i,
      },
      // ========== E3D V6 NOZZLES (MK3S+, MINI+, older MK series) ==========
      {
        name: '0.4mm Brass V6 Nozzle',
        brand: 'Prusa Research',
        model: 'V6-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (stainless steel)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['E3D compatible', 'Industry standard']
        },
        product_url: 'https://www.prusa3d.com/product/e3d-brass-nozzle-v6-0-4-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/476.jpg',
        price: 5.99,
        currency: 'USD',
        description: 'E3D V6 brass nozzle for MK3S+ and MINI+',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK3S|MINI/i,
      },
      {
        name: '0.25mm Brass V6 Nozzle',
        brand: 'Prusa Research',
        model: 'V6-Brass-0.25',
        specs: { 
          diameter_mm: 0.25, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Low', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (stainless steel)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['E3D compatible', 'Industry standard', 'Fine detail']
        },
        product_url: 'https://www.prusa3d.com/product/e3d-brass-nozzle-v6-0-25-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/477.jpg',
        price: 5.99,
        currency: 'USD',
        description: 'E3D V6 brass nozzle for fine detail prints',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK3S|MINI/i,
      },
      {
        name: '0.6mm Brass V6 Nozzle',
        brand: 'Prusa Research',
        model: 'V6-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (stainless steel)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['E3D compatible', 'Industry standard', 'High flow']
        },
        product_url: 'https://www.prusa3d.com/product/e3d-brass-nozzle-v6-0-6-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/478.jpg',
        price: 5.99,
        currency: 'USD',
        description: 'E3D V6 brass nozzle for faster prints',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK3S|MINI/i,
      },
      {
        name: '0.4mm Hardened Steel V6 Nozzle',
        brand: 'Prusa Research',
        model: 'V6-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 450, 
          flow_rate: 'Standard', 
          wear_rating: 'Very High',
          thread_type: 'M6',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (stainless steel)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['E3D compatible', 'Industry standard', 'Abrasive-resistant']
        },
        product_url: 'https://www.prusa3d.com/product/e3d-hardened-steel-nozzle-v6-0-4-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/480.jpg',
        price: 19.99,
        currency: 'USD',
        description: 'Hardened steel V6 nozzle for abrasive filaments',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK3S|MINI/i,
      },
      // ========== XL NOZZLES (Prusa XL) ==========
      {
        name: '0.4mm Brass XL Nozzle',
        brand: 'Prusa Research',
        model: 'XL-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'XL (proprietary)',
          mounting_interface: 'XL quick-swap toolhead',
          hotend_system: 'Prusa XL',
          thermistor_type: 'PT1000',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Quick-swap toolhead', 'Multi-tool compatible']
        },
        product_url: 'https://www.prusa3d.com/product/brass-nozzle-for-prusa-xl-0-4-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3210.jpg',
        price: 9.99,
        currency: 'USD',
        description: 'Brass nozzle for Prusa XL - 0.4mm standard',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /^XL/i,
      },
      {
        name: '0.6mm Brass XL Nozzle',
        brand: 'Prusa Research',
        model: 'XL-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'XL (proprietary)',
          mounting_interface: 'XL quick-swap toolhead',
          hotend_system: 'Prusa XL',
          thermistor_type: 'PT1000',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Quick-swap toolhead', 'Multi-tool compatible', 'High flow']
        },
        product_url: 'https://www.prusa3d.com/product/brass-nozzle-for-prusa-xl-0-6-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3211.jpg',
        price: 9.99,
        currency: 'USD',
        description: 'Brass nozzle for Prusa XL - 0.6mm for faster prints',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /^XL/i,
      },
      {
        name: '0.4mm Hardened Steel XL Nozzle',
        brand: 'Prusa Research',
        model: 'XL-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 450, 
          flow_rate: 'Standard', 
          wear_rating: 'Very High',
          thread_type: 'XL (proprietary)',
          mounting_interface: 'XL quick-swap toolhead',
          hotend_system: 'Prusa XL',
          thermistor_type: 'PT1000',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap toolhead', 'Multi-tool compatible', 'Abrasive-resistant']
        },
        product_url: 'https://www.prusa3d.com/product/hardened-steel-nozzle-for-prusa-xl-0-4-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3212.jpg',
        price: 29.99,
        currency: 'USD',
        description: 'Hardened steel nozzle for Prusa XL - abrasive materials',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /^XL/i,
      },
      // ========== COMPLETE HOTEND ASSEMBLIES (from user CSV) ==========
      // Nextruder Hotend brass - 0.40 mm
      {
        name: 'Nextruder Hotend brass - 0.40 mm',
        brand: 'Prusa Research',
        model: 'Nextruder-Hotend-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Complete hotend assembly', 'Pre-assembled', 'Quick-swap design']
        },
        product_url: 'https://www.prusa3d.com/product/nextruder-hotend-brass-0-40-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/c3e684ba-4cb8-477b-98c0-7a1746991977.jpg',
        price: 55.99,
        currency: 'USD',
        description: 'Fully assembled Nextruder hotend with 0.40mm brass nozzle for MK4, MK4S, MK3.9, MK3.9S, XL, CORE One',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|XL|Core One/i,
      },
      // Nextruder Hotend brass - 0.60 mm
      {
        name: 'Nextruder Hotend brass - 0.60 mm',
        brand: 'Prusa Research',
        model: 'Nextruder-Hotend-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Complete hotend assembly', 'Pre-assembled', 'Quick-swap design']
        },
        product_url: 'https://www.prusa3d.com/product/nextruder-hotend-brass-0-60-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/ec39a72e-a8c7-4c80-83c5-1dadccd4edf8.jpg',
        price: 55.99,
        currency: 'USD',
        description: 'Fully assembled Nextruder hotend with 0.60mm brass nozzle for MK4, MK4S, MK3.9, MK3.9S, XL, CORE One',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|XL|Core One/i,
      },
      // Nextruder Hotend brass - 0.80 mm
      {
        name: 'Nextruder Hotend brass - 0.80 mm',
        brand: 'Prusa Research',
        model: 'Nextruder-Hotend-Brass-0.8',
        specs: { 
          diameter_mm: 0.8, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Very High', 
          wear_rating: 'Standard',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Complete hotend assembly', 'Pre-assembled', 'Quick-swap design']
        },
        product_url: 'https://www.prusa3d.com/product/nextruder-hotend-brass-0-80-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/c2b648ef-809b-4255-b5c1-8f71034c73a8.jpg',
        price: 55.99,
        currency: 'USD',
        description: 'Fully assembled Nextruder hotend with 0.80mm brass nozzle for MK4, MK4S, MK3.9, MK3.9S, XL, CORE One',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|XL|Core One/i,
      },
      // Nextruder Hotend brass High Flow - 0.40 mm
      {
        name: 'Nextruder Hotend brass High Flow - 0.40 mm',
        brand: 'Prusa Research',
        model: 'Nextruder-Hotend-HF-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High Flow', 
          wear_rating: 'Standard',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          orifice_geometry: 'CHT (triple-bore)',
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Complete hotend assembly', 'Pre-assembled', 'CHT high flow nozzle', 'Quick-swap design']
        },
        product_url: 'https://www.prusa3d.com/product/nextruder-hotend-brass-high-flow-0-40-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/3653827e-0c0d-4070-abd4-b73d340d426c.jpg',
        price: 55.99,
        currency: 'USD',
        description: 'Fully assembled Nextruder hotend with 0.40mm brass CHT high flow nozzle for MK4, MK4S, MK3.9, MK3.9S, XL, CORE One',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|XL|Core One/i,
      },
      // Nextruder Hotend brass High Flow - 0.60 mm
      {
        name: 'Nextruder Hotend brass High Flow - 0.60 mm',
        brand: 'Prusa Research',
        model: 'Nextruder-Hotend-HF-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Very High Flow', 
          wear_rating: 'Standard',
          thread_type: 'Nextruder (proprietary)',
          mounting_interface: 'Nextruder quick-swap',
          hotend_system: 'Prusa Nextruder',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          orifice_geometry: 'CHT (triple-bore)',
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Complete hotend assembly', 'Pre-assembled', 'CHT high flow nozzle', 'Quick-swap design']
        },
        product_url: 'https://www.prusa3d.com/product/nextruder-hotend-brass-high-flow-0-60-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/0224831b-c644-49cc-819b-7ab16b179884.jpg',
        price: 55.99,
        currency: 'USD',
        description: 'Fully assembled Nextruder hotend with 0.60mm brass CHT high flow nozzle for MK4, MK4S, MK3.9, MK3.9S, XL, CORE One',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|XL|Core One/i,
      },
      // Nextruder V6 Nozzle Adapter
      {
        name: 'Nextruder V6 Nozzle Adapter',
        brand: 'Prusa Research',
        model: 'Nextruder-V6-Adapter',
        specs: { 
          diameter_mm: 0, // Adapter - no nozzle diameter
          material: 'aluminum', 
          hardened: false, 
          thread_type: 'M6 adapter',
          mounting_interface: 'Nextruder to V6',
          hotend_system: 'Prusa Nextruder',
          special_features: ['Allows V6 nozzle compatibility', 'Expands nozzle options']
        },
        product_url: 'https://www.prusa3d.com/product/nextruder-v6-nozzle-adapter/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/5727.jpg',
        price: 21.99,
        currency: 'USD',
        description: 'Adapter to use E3D V6 nozzles on Nextruder hotends for MK4, MK3.9, XL, CORE One',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK4|MK3\.9|XL|Core One/i,
      },
      // Assembled hotend (for MK3 series)
      {
        name: 'Assembled hotend (for MK3 series)',
        brand: 'Prusa Research',
        model: 'E3D-V6-Hotend-MK3',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 285, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (stainless steel)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Complete hotend assembly', 'E3D V6 compatible', 'Pre-assembled']
        },
        product_url: 'https://www.prusa3d.com/product/assembled-hotend-for-mk3-series/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/df643631-3b36-4ddf-8033-4673d3cebc1b.jpg',
        price: 86.99,
        currency: 'USD',
        description: 'Complete assembled E3D V6 hotend replacement for Original Prusa i3 MK3, MK3S, MK3S+',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MK3/i,
      },
      // Assembled hotend MINI/+
      {
        name: 'Assembled hotend MINI/+',
        brand: 'Prusa Research',
        model: 'E3D-V6-Hotend-MINI',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 280, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'V6-style (MINI variant)',
          hotend_system: 'E3D V6 (MINI variant)',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (stainless steel)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'PVA', 'HIPS'],
          special_features: ['Complete hotend assembly', 'Pre-assembled']
        },
        product_url: 'https://www.prusa3d.com/product/assembled-hotend-mini/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=1024,format=auto,quality=85/content/images/product/1706.jpg',
        price: 79.99,
        currency: 'USD',
        description: 'Complete assembled hotend replacement for Original Prusa MINI and MINI+',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /MINI/i,
      },
    ],
  },
  'Creality': {
    nozzle_collection_url: 'https://store.creality.com/collections/nozzles',
    is_shopify: true,
    compatibility_pattern: /K1|K2|Ender|CR-|Sermoon/i,
    compatible_hotend_types: ['MK8', 'Creality Spider', 'Creality Unicorn'],
    product_filter: 'nozzle|hotend',
    skip_validation: true,
    hardcoded_nozzles: [
      // ========== K1/K1 MAX/K1C/K1 SE UNICORN HOTEND ==========
      {
        name: '0.4mm Brass Unicorn Hotend (K1 Series)',
        brand: 'Creality',
        model: 'Unicorn-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'Unicorn (proprietary)',
          mounting_interface: 'K1 quick-swap',
          hotend_system: 'Creality Unicorn',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 60 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU'],
          special_features: ['Quick-swap hotend', 'High flow', 'Tool-less installation']
        },
        product_url: 'https://store.creality.com/products/unicorn-quick-swap-nozzle-for-k1-k1-max-k1c',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 15.99,
        currency: 'USD',
        description: 'Quick-swap Unicorn hotend for K1 series with 0.4mm brass nozzle',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /^K1/i,
      },
      {
        name: '0.4mm Hardened Steel Unicorn Hotend (K1 Series)',
        brand: 'Creality',
        model: 'Unicorn-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 450, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'Unicorn (proprietary)',
          mounting_interface: 'K1 quick-swap',
          hotend_system: 'Creality Unicorn',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 60 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'High flow', 'Abrasive-resistant', 'Tool-less installation']
        },
        product_url: 'https://store.creality.com/products/unicorn-quick-swap-nozzle-for-k1-k1-max-k1c',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 22.99,
        currency: 'USD',
        description: 'Quick-swap Unicorn hotend for K1 series with hardened steel for abrasives',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /^K1/i,
      },
      {
        name: '0.6mm Brass Unicorn Hotend (K1 Series)',
        brand: 'Creality',
        model: 'Unicorn-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Very High', 
          wear_rating: 'Standard',
          thread_type: 'Unicorn (proprietary)',
          mounting_interface: 'K1 quick-swap',
          hotend_system: 'Creality Unicorn',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 60 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU'],
          special_features: ['Quick-swap hotend', 'Very high flow', 'Tool-less installation']
        },
        product_url: 'https://store.creality.com/products/unicorn-quick-swap-nozzle-for-k1-k1-max-k1c',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 15.99,
        currency: 'USD',
        description: 'Quick-swap Unicorn hotend for fast K1 prints',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /^K1/i,
      },
      {
        name: '0.8mm Brass Unicorn Hotend (K1 Series)',
        brand: 'Creality',
        model: 'Unicorn-Brass-0.8',
        specs: { 
          diameter_mm: 0.8, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Ultra High', 
          wear_rating: 'Standard',
          thread_type: 'Unicorn (proprietary)',
          mounting_interface: 'K1 quick-swap',
          hotend_system: 'Creality Unicorn',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 60 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU'],
          special_features: ['Quick-swap hotend', 'Ultra high flow', 'Tool-less installation']
        },
        product_url: 'https://store.creality.com/products/unicorn-quick-swap-nozzle-for-k1-k1-max-k1c',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 15.99,
        currency: 'USD',
        description: 'Quick-swap Unicorn hotend for rapid prototyping',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /^K1/i,
      },
      // ========== K2 PLUS NOZZLES ==========
      {
        name: '0.4mm Brass Nozzle (K2 Plus)',
        brand: 'Creality',
        model: 'K2Plus-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'K2 Plus (proprietary)',
          mounting_interface: 'K2 quick-swap',
          hotend_system: 'Creality K2',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 65 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU', 'PC', 'PA'],
          special_features: ['Quick-swap hotend', 'High flow', 'Enclosed chamber compatible']
        },
        product_url: 'https://store.creality.com/products/creality-k2-plus-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 12.99,
        currency: 'USD',
        description: 'Standard brass nozzle for K2 Plus',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /K2/i,
      },
      {
        name: '0.4mm Hardened Steel Nozzle (K2 Plus)',
        brand: 'Creality',
        model: 'K2Plus-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 450, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'K2 Plus (proprietary)',
          mounting_interface: 'K2 quick-swap',
          hotend_system: 'Creality K2',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 65 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'High flow', 'Abrasive-resistant', 'Enclosed chamber compatible']
        },
        product_url: 'https://store.creality.com/products/creality-k2-plus-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 19.99,
        currency: 'USD',
        description: 'Hardened steel nozzle for K2 Plus abrasive filaments',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /K2/i,
      },
      // ========== ENDER-3 V3/V3 SE/V3 KE/V3 PLUS NOZZLES ==========
      {
        name: '0.4mm Brass Nozzle (Ender-3 V3 Series)',
        brand: 'Creality',
        model: 'Ender3V3-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'Spider (proprietary)',
          mounting_interface: 'Ender-3 V3 Spider',
          hotend_system: 'Creality Spider',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'TPU'],
          special_features: ['Sprite extruder compatible', 'All-metal design']
        },
        product_url: 'https://store.creality.com/products/ender-3-v3-se-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 8.99,
        currency: 'USD',
        description: 'Brass nozzle for Ender-3 V3 series printers',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender[- ]?3 V3|Ender-3V3/i,
      },
      {
        name: '0.2mm Brass Nozzle (Ender-3 V3 Series)',
        brand: 'Creality',
        model: 'Ender3V3-Brass-0.2',
        specs: { 
          diameter_mm: 0.2, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Low', 
          wear_rating: 'Standard',
          thread_type: 'Spider (proprietary)',
          mounting_interface: 'Ender-3 V3 Spider',
          hotend_system: 'Creality Spider',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ABS'],
          special_features: ['Sprite extruder compatible', 'Fine detail', 'All-metal design']
        },
        product_url: 'https://store.creality.com/products/ender-3-v3-se-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 8.99,
        currency: 'USD',
        description: 'Fine detail brass nozzle for Ender-3 V3 series',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender[- ]?3 V3|Ender-3V3/i,
      },
      {
        name: '0.6mm Brass Nozzle (Ender-3 V3 Series)',
        brand: 'Creality',
        model: 'Ender3V3-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'Spider (proprietary)',
          mounting_interface: 'Ender-3 V3 Spider',
          hotend_system: 'Creality Spider',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'TPU'],
          special_features: ['Sprite extruder compatible', 'High flow', 'All-metal design']
        },
        product_url: 'https://store.creality.com/products/ender-3-v3-se-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 8.99,
        currency: 'USD',
        description: 'Fast printing brass nozzle for Ender-3 V3 series',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender[- ]?3 V3|Ender-3V3/i,
      },
      // ========== LEGACY ENDER-3/CR SERIES (MK8 NOZZLES) ==========
      {
        name: '0.4mm Brass MK8 Nozzle (Ender/CR Series)',
        brand: 'Creality',
        model: 'MK8-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'MK8-style',
          hotend_system: 'MK8',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined (all-metal upgrade available)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['Industry standard', 'Widely compatible', 'Easy replacement']
        },
        product_url: 'https://store.creality.com/products/mk8-brass-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 6.99,
        currency: 'USD',
        description: 'MK8 brass nozzle for Ender-3/CR-10 series',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender-3(?! V3)|CR-10|CR-6/i,
      },
      {
        name: '0.2mm Brass MK8 Nozzle (Ender/CR Series)',
        brand: 'Creality',
        model: 'MK8-Brass-0.2',
        specs: { 
          diameter_mm: 0.2, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Low', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'MK8-style',
          hotend_system: 'MK8',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined (all-metal upgrade available)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG'],
          special_features: ['Industry standard', 'Fine detail', 'Easy replacement']
        },
        product_url: 'https://store.creality.com/products/mk8-brass-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 6.99,
        currency: 'USD',
        description: 'Fine detail MK8 nozzle for Ender-3/CR-10 series',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender-3(?! V3)|CR-10|CR-6/i,
      },
      {
        name: '0.6mm Brass MK8 Nozzle (Ender/CR Series)',
        brand: 'Creality',
        model: 'MK8-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'MK8-style',
          hotend_system: 'MK8',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined (all-metal upgrade available)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['Industry standard', 'High flow', 'Easy replacement']
        },
        product_url: 'https://store.creality.com/products/mk8-brass-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 6.99,
        currency: 'USD',
        description: 'Fast printing MK8 nozzle for Ender-3/CR-10 series',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender-3(?! V3)|CR-10|CR-6/i,
      },
      {
        name: '0.8mm Brass MK8 Nozzle (Ender/CR Series)',
        brand: 'Creality',
        model: 'MK8-Brass-0.8',
        specs: { 
          diameter_mm: 0.8, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Very High', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'MK8-style',
          hotend_system: 'MK8',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined (all-metal upgrade available)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['Industry standard', 'Very high flow', 'Easy replacement']
        },
        product_url: 'https://store.creality.com/products/mk8-brass-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0593/2587/4251/files/31f32b14081d0c2894f85e46e2e078f2-removebg-preview.png',
        price: 6.99,
        currency: 'USD',
        description: 'Rapid prototyping MK8 nozzle for Ender-3/CR-10 series',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender-3(?! V3)|CR-10|CR-6/i,
      },
    ],
  },
  'E3D': {
    nozzle_collection_url: 'https://e3d-online.com/collections/nozzles',
    is_shopify: true,
    compatibility_pattern: /.*/i, // Universal compatibility
    compatible_hotend_types: ['E3D V6', 'E3D Revo', 'Clone V6'],
    brand_filter: 'Prusa Research,Creality,Anycubic,Elegoo,Voron',
    product_filter: 'nozzle|hotend|revo',
    skip_validation: true,
    hardcoded_nozzles: [
      // ========== REVO NOZZLES (Universal quick-change system) ==========
      {
        name: '0.4mm Brass Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-Brass-0.4',
        specs: {
          diameter_mm: 0.4,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'Standard',
          wear_rating: 'Standard',
          thread_type: 'Revo (proprietary)',
          orifice_geometry: 'Standard',
          mounting_interface: 'Revo (quick-swap)',
          hotend_system: 'E3D Revo',
          thermistor_type: 'PT1000 (integrated)',
          heatbreak_material: 'Bi-metal (copper/stainless)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Quick-swap', 'Tool-less installation', 'Integrated heater'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU'],
          thermal_conductivity_notes: 'Brass body with integrated heater core for rapid heat-up',
        },
        product_url: 'https://e3d-online.com/products/revo-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-Nozzle-Brass-0.4_1600x.png',
        price: 16.50,
        currency: 'USD',
        description: 'Quick-change brass Revo nozzle - no tools required. Integrated heater core allows cold swaps.',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.25mm Brass Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-Brass-0.25',
        specs: {
          diameter_mm: 0.25,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'Low',
          wear_rating: 'Standard',
          thread_type: 'Revo (proprietary)',
          orifice_geometry: 'Standard',
          mounting_interface: 'Revo (quick-swap)',
          hotend_system: 'E3D Revo',
          thermistor_type: 'PT1000 (integrated)',
          heatbreak_material: 'Bi-metal (copper/stainless)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Quick-swap', 'Tool-less installation', 'Integrated heater', 'Fine detail'],
          supported_filament_types: ['PLA', 'PETG', 'ABS'],
          thermal_conductivity_notes: 'Brass body - excellent heat transfer for detailed prints',
        },
        product_url: 'https://e3d-online.com/products/revo-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-Nozzle-Brass-0.25_1600x.png',
        price: 16.50,
        currency: 'USD',
        description: 'Fine detail brass Revo nozzle for high precision prints',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.6mm Brass Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-Brass-0.6',
        specs: {
          diameter_mm: 0.6,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'High',
          wear_rating: 'Standard',
          thread_type: 'Revo (proprietary)',
          orifice_geometry: 'Standard',
          mounting_interface: 'Revo (quick-swap)',
          hotend_system: 'E3D Revo',
          thermistor_type: 'PT1000 (integrated)',
          heatbreak_material: 'Bi-metal (copper/stainless)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Quick-swap', 'Tool-less installation', 'Integrated heater', 'High-flow'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU'],
          thermal_conductivity_notes: 'Brass body for high thermal conductivity during fast printing',
        },
        product_url: 'https://e3d-online.com/products/revo-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-Nozzle-Brass-0.6_1600x.png',
        price: 16.50,
        currency: 'USD',
        description: 'Fast printing brass Revo nozzle for rapid prototyping',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.8mm Brass Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-Brass-0.8',
        specs: {
          diameter_mm: 0.8,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'Very High',
          wear_rating: 'Standard',
          thread_type: 'Revo (proprietary)',
          orifice_geometry: 'Standard',
          mounting_interface: 'Revo (quick-swap)',
          hotend_system: 'E3D Revo',
          thermistor_type: 'PT1000 (integrated)',
          heatbreak_material: 'Bi-metal (copper/stainless)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Quick-swap', 'Tool-less installation', 'Integrated heater', 'Very high-flow'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA'],
          thermal_conductivity_notes: 'Maximum flow brass nozzle for draft prints',
        },
        product_url: 'https://e3d-online.com/products/revo-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-Nozzle-Brass-0.8_1600x.png',
        price: 16.50,
        currency: 'USD',
        description: 'Rapid prototyping brass Revo nozzle - maximum material flow',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.4mm ObXidian Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-ObXidian-0.4',
        specs: {
          diameter_mm: 0.4,
          material: 'hardened steel',
          hardened: true,
          max_temp_c: 500,
          flow_rate: 'Standard',
          wear_rating: 'Extreme',
          coating: 'ObXidian',
          thread_type: 'Revo (proprietary)',
          orifice_geometry: 'Standard',
          mounting_interface: 'Revo (quick-swap)',
          hotend_system: 'E3D Revo',
          thermistor_type: 'PT1000 (integrated)',
          heatbreak_material: 'Bi-metal (copper/stainless)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Quick-swap', 'Tool-less installation', 'ObXidian coating', 'Abrasive-resistant', 'High-temp capable'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'Nylon/PA', 'PC', 'Carbon Fiber', 'Glass Fiber', 'Metal-filled', 'Glow-in-dark'],
          thermal_conductivity_notes: 'Hardened steel with ObXidian nano-coating for extreme wear resistance',
        },
        product_url: 'https://e3d-online.com/products/revo-obxidian-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-ObXidian-0.4_1600x.png',
        price: 35.00,
        currency: 'USD',
        description: 'Premium abrasion-resistant nozzle with ObXidian coating for carbon fiber and abrasive filaments',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.6mm ObXidian Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-ObXidian-0.6',
        specs: {
          diameter_mm: 0.6,
          material: 'hardened steel',
          hardened: true,
          max_temp_c: 500,
          flow_rate: 'High',
          wear_rating: 'Extreme',
          coating: 'ObXidian',
          thread_type: 'Revo (proprietary)',
          orifice_geometry: 'Standard',
          mounting_interface: 'Revo (quick-swap)',
          hotend_system: 'E3D Revo',
          thermistor_type: 'PT1000 (integrated)',
          heatbreak_material: 'Bi-metal (copper/stainless)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Quick-swap', 'Tool-less installation', 'ObXidian coating', 'Abrasive-resistant', 'High-flow', 'High-temp capable'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'Nylon/PA', 'PC', 'Carbon Fiber', 'Glass Fiber', 'Metal-filled', 'Glow-in-dark'],
          thermal_conductivity_notes: 'High-flow hardened steel with ObXidian coating for abrasive materials at speed',
        },
        product_url: 'https://e3d-online.com/products/revo-obxidian-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-ObXidian-0.6_1600x.png',
        price: 35.00,
        currency: 'USD',
        description: 'Premium high-flow abrasion-resistant nozzle for fast printing with abrasives',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      // ========== V6 NOZZLES (Traditional hotend system - M6 thread) ==========
      {
        name: '0.4mm Brass V6 Nozzle',
        brand: 'E3D',
        model: 'V6-Brass-0.4',
        specs: {
          diameter_mm: 0.4,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'Standard',
          wear_rating: 'Standard',
          thread_type: 'M6',
          orifice_geometry: 'Standard',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Industry standard', 'Wide compatibility'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU'],
          thermal_conductivity_notes: 'Standard brass construction - 380 W/mK thermal conductivity',
        },
        product_url: 'https://e3d-online.com/products/v6-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-Brass_1600x.png',
        price: 6.50,
        currency: 'USD',
        description: 'Standard brass V6 nozzle - the industry standard M6 thread nozzle',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.25mm Brass V6 Nozzle',
        brand: 'E3D',
        model: 'V6-Brass-0.25',
        specs: {
          diameter_mm: 0.25,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'Low',
          wear_rating: 'Standard',
          thread_type: 'M6',
          orifice_geometry: 'Standard',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Fine detail', 'Precision bore'],
          supported_filament_types: ['PLA', 'PETG', 'ABS'],
          thermal_conductivity_notes: 'Precision-machined brass for fine detail work',
        },
        product_url: 'https://e3d-online.com/products/v6-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-Brass_1600x.png',
        price: 6.50,
        currency: 'USD',
        description: 'Fine detail brass V6 nozzle for high-resolution prints',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.6mm Brass V6 Nozzle',
        brand: 'E3D',
        model: 'V6-Brass-0.6',
        specs: {
          diameter_mm: 0.6,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'High',
          wear_rating: 'Standard',
          thread_type: 'M6',
          orifice_geometry: 'Standard',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['High-flow', 'Fast printing'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU'],
          thermal_conductivity_notes: 'High-flow brass nozzle for faster layer times',
        },
        product_url: 'https://e3d-online.com/products/v6-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-Brass_1600x.png',
        price: 6.50,
        currency: 'USD',
        description: 'Fast printing brass V6 nozzle for rapid prototyping',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.8mm Brass V6 Nozzle',
        brand: 'E3D',
        model: 'V6-Brass-0.8',
        specs: {
          diameter_mm: 0.8,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'Very High',
          wear_rating: 'Standard',
          thread_type: 'M6',
          orifice_geometry: 'Standard',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Very high-flow', 'Draft quality'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA'],
          thermal_conductivity_notes: 'Maximum flow brass nozzle - requires adequate hotend heating',
        },
        product_url: 'https://e3d-online.com/products/v6-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-Brass_1600x.png',
        price: 6.50,
        currency: 'USD',
        description: 'Rapid prototyping brass V6 nozzle for maximum material throughput',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.4mm Hardened Steel V6 Nozzle',
        brand: 'E3D',
        model: 'V6-HS-0.4',
        specs: {
          diameter_mm: 0.4,
          material: 'hardened steel',
          hardened: true,
          max_temp_c: 450,
          flow_rate: 'Standard',
          wear_rating: 'Very High',
          thread_type: 'M6',
          orifice_geometry: 'Standard',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Abrasive-resistant', 'High-temp capable'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'Nylon/PA', 'PC', 'Carbon Fiber', 'Glass Fiber', 'Metal-filled', 'Glow-in-dark'],
          thermal_conductivity_notes: 'Hardened tool steel - lower thermal conductivity (50 W/mK) than brass, may need higher temps',
        },
        product_url: 'https://e3d-online.com/products/v6-nozzles-hardened-steel',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-HS_1600x.png',
        price: 22.00,
        currency: 'USD',
        description: 'Hardened steel V6 nozzle for printing abrasive filaments like carbon fiber and glow-in-dark',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.6mm Hardened Steel V6 Nozzle',
        brand: 'E3D',
        model: 'V6-HS-0.6',
        specs: {
          diameter_mm: 0.6,
          material: 'hardened steel',
          hardened: true,
          max_temp_c: 450,
          flow_rate: 'High',
          wear_rating: 'Very High',
          thread_type: 'M6',
          orifice_geometry: 'Standard',
          mounting_interface: 'V6-style',
          hotend_system: 'E3D V6',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          special_features: ['Abrasive-resistant', 'High-flow', 'High-temp capable'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'Nylon/PA', 'PC', 'Carbon Fiber', 'Glass Fiber', 'Metal-filled', 'Glow-in-dark'],
          thermal_conductivity_notes: 'High-flow hardened steel for abrasive materials - adjust temps +5-10°C vs brass',
        },
        product_url: 'https://e3d-online.com/products/v6-nozzles-hardened-steel',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-HS_1600x.png',
        price: 22.00,
        currency: 'USD',
        description: 'High-flow hardened steel V6 nozzle for fast printing with abrasive filaments',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      // ========== VOLCANO NOZZLES (High-flow system) ==========
      {
        name: '0.4mm Brass Volcano Nozzle',
        brand: 'E3D',
        model: 'Volcano-Brass-0.4',
        specs: {
          diameter_mm: 0.4,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'High',
          wear_rating: 'Standard',
          thread_type: 'M6',
          orifice_geometry: 'Extended melt zone',
          mounting_interface: 'Volcano',
          hotend_system: 'E3D Volcano',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          special_features: ['Extended melt zone', 'High volumetric flow'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU'],
          thermal_conductivity_notes: 'Extended brass body provides 3x longer melt zone than V6',
        },
        product_url: 'https://e3d-online.com/products/volcano-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Volcano-Nozzle-Brass_1600x.png',
        price: 8.50,
        currency: 'USD',
        description: 'High-flow Volcano brass nozzle with extended melt zone for faster printing',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Volcano'],
      },
      {
        name: '0.6mm Brass Volcano Nozzle',
        brand: 'E3D',
        model: 'Volcano-Brass-0.6',
        specs: {
          diameter_mm: 0.6,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'Very High',
          wear_rating: 'Standard',
          thread_type: 'M6',
          orifice_geometry: 'Extended melt zone',
          mounting_interface: 'Volcano',
          hotend_system: 'E3D Volcano',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          special_features: ['Extended melt zone', 'Very high volumetric flow'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU'],
          thermal_conductivity_notes: 'High-flow Volcano design with extended melt zone',
        },
        product_url: 'https://e3d-online.com/products/volcano-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Volcano-Nozzle-Brass_1600x.png',
        price: 8.50,
        currency: 'USD',
        description: 'Very high-flow Volcano brass nozzle for rapid prototyping',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Volcano'],
      },
      {
        name: '0.8mm Brass Volcano Nozzle',
        brand: 'E3D',
        model: 'Volcano-Brass-0.8',
        specs: {
          diameter_mm: 0.8,
          material: 'brass',
          hardened: false,
          max_temp_c: 300,
          flow_rate: 'Extreme',
          wear_rating: 'Standard',
          thread_type: 'M6',
          orifice_geometry: 'Extended melt zone',
          mounting_interface: 'Volcano',
          hotend_system: 'E3D Volcano',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          special_features: ['Extended melt zone', 'Extreme volumetric flow', 'Draft printing'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA'],
          thermal_conductivity_notes: 'Maximum flow Volcano nozzle - can exceed 30mm³/s',
        },
        product_url: 'https://e3d-online.com/products/volcano-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Volcano-Nozzle-Brass_1600x.png',
        price: 8.50,
        currency: 'USD',
        description: 'Extreme flow Volcano brass nozzle for draft-quality rapid prints',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Volcano'],
      },
      {
        name: '0.6mm Hardened Steel Volcano Nozzle',
        brand: 'E3D',
        model: 'Volcano-HS-0.6',
        specs: {
          diameter_mm: 0.6,
          material: 'hardened steel',
          hardened: true,
          max_temp_c: 450,
          flow_rate: 'Very High',
          wear_rating: 'Very High',
          thread_type: 'M6',
          orifice_geometry: 'Extended melt zone',
          mounting_interface: 'Volcano',
          hotend_system: 'E3D Volcano',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal (titanium alloy)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          special_features: ['Extended melt zone', 'Abrasive-resistant', 'High-flow'],
          supported_filament_types: ['PLA', 'PETG', 'ABS', 'ASA', 'Nylon/PA', 'PC', 'Carbon Fiber', 'Glass Fiber', 'Metal-filled'],
          thermal_conductivity_notes: 'Hardened steel Volcano for high-speed abrasive printing',
        },
        product_url: 'https://e3d-online.com/products/volcano-nozzles-hardened-steel',
        image_url: 'https://e3d-online.com/cdn/shop/files/Volcano-Nozzle-HS_1600x.png',
        price: 24.00,
        currency: 'USD',
        description: 'High-flow hardened steel Volcano nozzle for abrasive filaments at speed',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Volcano'],
      },
    ],
  },
  'Anycubic': {
    nozzle_collection_url: 'https://store.anycubic.com/collections/parts-and-accessories',
    is_shopify: true,
    compatibility_pattern: /Kobra/i,
    compatible_hotend_types: ['Anycubic Hotend'],
    product_filter: 'nozzle|hotend',
    skip_validation: true,
    hardcoded_nozzles: [
      // ========== KOBRA 3 SERIES NOZZLES ==========
      {
        name: '0.4mm Brass Nozzle (Kobra 3)',
        brand: 'Anycubic',
        model: 'Kobra3-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'Anycubic Kobra 3 (proprietary)',
          mounting_interface: 'Kobra 3 quick-swap',
          hotend_system: 'Anycubic Kobra 3',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU'],
          special_features: ['Quick-swap hotend', 'High flow design']
        },
        product_url: 'https://store.anycubic.com/products/kobra-3-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0245/5519/2380/files/kobra3-nozzle_600x.png',
        price: 9.99,
        currency: 'USD',
        description: 'Standard brass nozzle for Kobra 3 series',
        compatible_printer_brands: ['Anycubic'],
        printer_compatibility_pattern: /Kobra 3|Kobra3/i,
      },
      {
        name: '0.6mm Brass Nozzle (Kobra 3)',
        brand: 'Anycubic',
        model: 'Kobra3-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'Anycubic Kobra 3 (proprietary)',
          mounting_interface: 'Kobra 3 quick-swap',
          hotend_system: 'Anycubic Kobra 3',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU'],
          special_features: ['Quick-swap hotend', 'High flow']
        },
        product_url: 'https://store.anycubic.com/products/kobra-3-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0245/5519/2380/files/kobra3-nozzle_600x.png',
        price: 9.99,
        currency: 'USD',
        description: 'Fast printing brass nozzle for Kobra 3 series',
        compatible_printer_brands: ['Anycubic'],
        printer_compatibility_pattern: /Kobra 3|Kobra3/i,
      },
      {
        name: '0.4mm Hardened Steel Nozzle (Kobra 3)',
        brand: 'Anycubic',
        model: 'Kobra3-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 450, 
          flow_rate: 'Standard', 
          wear_rating: 'Very High',
          thread_type: 'Anycubic Kobra 3 (proprietary)',
          mounting_interface: 'Kobra 3 quick-swap',
          hotend_system: 'Anycubic Kobra 3',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'Abrasive-resistant']
        },
        product_url: 'https://store.anycubic.com/products/kobra-3-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0245/5519/2380/files/kobra3-nozzle_600x.png',
        price: 14.99,
        currency: 'USD',
        description: 'Hardened steel nozzle for abrasive filaments',
        compatible_printer_brands: ['Anycubic'],
        printer_compatibility_pattern: /Kobra 3|Kobra3/i,
      },
      // ========== KOBRA 2 SERIES NOZZLES ==========
      {
        name: '0.4mm Brass Nozzle (Kobra 2)',
        brand: 'Anycubic',
        model: 'Kobra2-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'MK8-style',
          hotend_system: 'MK8',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined (all-metal upgrade available)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['MK8 compatible', 'Industry standard']
        },
        product_url: 'https://store.anycubic.com/products/kobra-2-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0245/5519/2380/files/kobra2-nozzle_600x.png',
        price: 7.99,
        currency: 'USD',
        description: 'Standard brass nozzle for Kobra 2 series',
        compatible_printer_brands: ['Anycubic'],
        printer_compatibility_pattern: /Kobra 2(?! Combo)|Kobra2(?! Combo)/i,
      },
      {
        name: '0.6mm Brass Nozzle (Kobra 2)',
        brand: 'Anycubic',
        model: 'Kobra2-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'MK8-style',
          hotend_system: 'MK8',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined (all-metal upgrade available)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['MK8 compatible', 'High flow']
        },
        product_url: 'https://store.anycubic.com/products/kobra-2-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0245/5519/2380/files/kobra2-nozzle_600x.png',
        price: 7.99,
        currency: 'USD',
        description: 'Fast printing brass nozzle for Kobra 2 series',
        compatible_printer_brands: ['Anycubic'],
        printer_compatibility_pattern: /Kobra 2(?! Combo)|Kobra2(?! Combo)/i,
      },
    ],
  },
  'Elegoo': {
    nozzle_collection_url: 'https://www.elegoo.com/collections/nozzles',
    is_shopify: true,
    compatibility_pattern: /Neptune/i,
    compatible_hotend_types: ['Elegoo Hotend', 'MK8'],
    product_filter: 'nozzle|hotend',
    skip_validation: true,
    hardcoded_nozzles: [
      // ========== NEPTUNE 4 SERIES NOZZLES ==========
      {
        name: '0.4mm Brass Nozzle (Neptune 4)',
        brand: 'Elegoo',
        model: 'Neptune4-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'Elegoo Neptune 4 (proprietary)',
          mounting_interface: 'Neptune 4 quick-swap',
          hotend_system: 'Elegoo Neptune 4',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU'],
          special_features: ['Quick-swap hotend', 'High flow']
        },
        product_url: 'https://www.elegoo.com/products/neptune-4-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0296/9026/5648/files/neptune4-nozzle_600x.png',
        price: 8.99,
        currency: 'USD',
        description: 'High-flow brass nozzle for Neptune 4 series',
        compatible_printer_brands: ['Elegoo'],
        printer_compatibility_pattern: /Neptune 4|Neptune4/i,
      },
      {
        name: '0.6mm Brass Nozzle (Neptune 4)',
        brand: 'Elegoo',
        model: 'Neptune4-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'Very High', 
          wear_rating: 'Standard',
          thread_type: 'Elegoo Neptune 4 (proprietary)',
          mounting_interface: 'Neptune 4 quick-swap',
          hotend_system: 'Elegoo Neptune 4',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU'],
          special_features: ['Quick-swap hotend', 'Very high flow']
        },
        product_url: 'https://www.elegoo.com/products/neptune-4-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0296/9026/5648/files/neptune4-nozzle_600x.png',
        price: 8.99,
        currency: 'USD',
        description: 'Fast printing brass nozzle for Neptune 4 series',
        compatible_printer_brands: ['Elegoo'],
        printer_compatibility_pattern: /Neptune 4|Neptune4/i,
      },
      {
        name: '0.4mm Hardened Steel Nozzle (Neptune 4)',
        brand: 'Elegoo',
        model: 'Neptune4-HS-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'hardened steel', 
          hardened: true, 
          max_temp_c: 450, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'Elegoo Neptune 4 (proprietary)',
          mounting_interface: 'Neptune 4 quick-swap',
          hotend_system: 'Elegoo Neptune 4',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'Abrasive-resistant']
        },
        product_url: 'https://www.elegoo.com/products/neptune-4-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0296/9026/5648/files/neptune4-nozzle_600x.png',
        price: 12.99,
        currency: 'USD',
        description: 'Hardened steel nozzle for abrasive filaments',
        compatible_printer_brands: ['Elegoo'],
        printer_compatibility_pattern: /Neptune 4|Neptune4/i,
      },
      // ========== NEPTUNE 3 SERIES NOZZLES ==========
      {
        name: '0.4mm Brass Nozzle (Neptune 3)',
        brand: 'Elegoo',
        model: 'Neptune3-Brass-0.4',
        specs: { 
          diameter_mm: 0.4, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'MK8-style',
          hotend_system: 'MK8',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined (all-metal upgrade available)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['MK8 compatible', 'Industry standard']
        },
        product_url: 'https://www.elegoo.com/products/neptune-3-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0296/9026/5648/files/neptune3-nozzle_600x.png',
        price: 6.99,
        currency: 'USD',
        description: 'Standard brass nozzle for Neptune 3 series',
        compatible_printer_brands: ['Elegoo'],
        printer_compatibility_pattern: /Neptune 3|Neptune3/i,
      },
      {
        name: '0.6mm Brass Nozzle (Neptune 3)',
        brand: 'Elegoo',
        model: 'Neptune3-Brass-0.6',
        specs: { 
          diameter_mm: 0.6, 
          material: 'brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'M6',
          mounting_interface: 'MK8-style',
          hotend_system: 'MK8',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined (all-metal upgrade available)',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['MK8 compatible', 'High flow']
        },
        product_url: 'https://www.elegoo.com/products/neptune-3-nozzle-kit',
        image_url: 'https://cdn.shopify.com/s/files/1/0296/9026/5648/files/neptune3-nozzle_600x.png',
        price: 6.99,
        currency: 'USD',
        description: 'Fast printing brass nozzle for Neptune 3 series',
        compatible_printer_brands: ['Elegoo'],
        printer_compatibility_pattern: /Neptune 3|Neptune3/i,
      },
    ],
  },
  'QIDI': {
    // QIDI hotends - canonical data from official product table
    nozzle_collection_url: 'https://qidi3d.com/collections/hot-end',
    is_shopify: true,
    compatibility_pattern: /PLUS4|Q1|X-Max|X-Plus|X-Smart|i-Fast|X-CF/i,
    compatible_hotend_types: ['QIDI Hotend'],
    product_filter: 'hotend|hot-end|hot end',
    skip_validation: true,
    hardcoded_nozzles: [
      // ========== 3RD GEN (PLUS4) HOTENDS ==========
      {
        name: 'Plus4 Bimetal Nozzle Hotend',
        brand: 'QIDI',
        model: 'Plus4-Bimetal-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Bimetal', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'High',
          thread_type: 'QIDI Plus4 (proprietary)',
          mounting_interface: 'Plus4 quick-swap',
          hotend_system: 'QIDI Plus4',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 65 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU', 'PC', 'PA'],
          special_features: ['Quick-swap hotend', 'High flow', 'Active chamber heating compatible', 'Bimetal nozzle']
        },
        product_url: 'https://qidi3d.com/products/plus4-bimetal-hot-end',
        image_url: 'https://qidi3d.com/cdn/shop/files/2518731aeb1d7aba0c54b2ce3a6abfd3.jpg?v=1761555003&width=1080',
        price: 31.99,
        currency: 'USD',
        description: 'Bimetal hotend for QIDI PLUS4',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /PLUS4|Plus 4/i,
      },
      // ========== 3RD GEN (Q1 PRO) HOTENDS ==========
      {
        name: 'Q1 Pro Bimetal Hot End',
        brand: 'QIDI',
        model: 'Q1Pro-Bimetal-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Bimetal', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'High',
          thread_type: 'QIDI Q1 (proprietary)',
          mounting_interface: 'Q1 quick-swap',
          hotend_system: 'QIDI Q1',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU', 'PC', 'PA'],
          special_features: ['Quick-swap hotend', 'High flow', 'Enclosed chamber compatible', 'Bimetal nozzle']
        },
        product_url: 'https://qidi3d.com/products/q1-pro-hot-end',
        image_url: 'https://qidi3d.com/cdn/shop/files/hotendV2.5.png?v=1752108211&width=1080',
        price: 34.99,
        currency: 'USD',
        description: 'Bimetal hotend for QIDI Q1 Pro',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /Q1 Pro|Q1Pro/i,
      },
      // ========== 3RD GEN (3 SERIES) HOTENDS ==========
      {
        name: 'X-Max 3/X-Plus 3/X-Smart 3 hot end V2.5',
        brand: 'QIDI',
        model: '3Series-V2.5-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Bimetal', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'High',
          thread_type: 'QIDI 3 Series (proprietary)',
          mounting_interface: '3 Series quick-swap',
          hotend_system: 'QIDI 3 Series V2.5',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 60 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU', 'PC', 'PA'],
          special_features: ['Quick-swap hotend', 'V2.5 upgrade', 'Enclosed chamber compatible', 'Bimetal nozzle included']
        },
        product_url: 'https://qidi3d.com/products/max3-plus3-hot-end-v2-5',
        image_url: 'https://qidi3d.com/cdn/shop/files/hotendV2.5.png?v=1752108211&width=1080',
        price: 34.99,
        currency: 'USD',
        description: 'Upgraded Hot End V2.5 for X-Max 3/X-Plus 3/X-Smart 3 with Bimetal nozzle',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /X-Max 3|X-Plus 3|X-Smart 3|XMax3|XPlus3|XSmart3/i,
      },
      {
        name: 'X-Max 3/X-Plus 3/X-Smart 3 Brass hot end',
        brand: 'QIDI',
        model: '3Series-Brass-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Brass', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'QIDI 3 Series (proprietary)',
          mounting_interface: '3 Series quick-swap',
          hotend_system: 'QIDI 3 Series',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (steel/copper)',
          heater_cartridge: { voltage: 24, wattage: 60 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU'],
          special_features: ['Quick-swap hotend', 'Enclosed chamber compatible']
        },
        product_url: 'https://qidi3d.com/products/x-max-3-x-plus-3-x-smart-3-brass-hot-end',
        image_url: 'https://qidi3d.com/cdn/shop/products/215a627f054138d3d12e7a9121530bb9.png?v=1717739076&width=1080',
        price: 29.99,
        currency: 'USD',
        description: 'Brass hotend for QIDI X-Max 3/X-Plus 3/X-Smart 3',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /X-Max 3|X-Plus 3|X-Smart 3|XMax3|XPlus3|XSmart3/i,
      },
      {
        name: 'X-Max 3/X-Plus 3/X-Smart 3 Copper plated hot end',
        brand: 'QIDI',
        model: '3Series-CopperPlated-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Copper-plated', 
          hardened: false, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'High',
          thread_type: 'QIDI 3 Series (proprietary)',
          mounting_interface: '3 Series quick-swap',
          hotend_system: 'QIDI 3 Series',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 60 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU', 'PC', 'PA'],
          special_features: ['Quick-swap hotend', 'Enclosed chamber compatible', 'Copper plating for thermal performance']
        },
        product_url: 'https://qidi3d.com/products/x-max-3-x-plus-3-x-smart-3-copper-plated-hot-end',
        image_url: 'https://qidi3d.com/cdn/shop/products/9f6cf150cbf9bebdd58cc1376a628f10.png?v=1722828278&width=1080',
        price: 34.99,
        currency: 'USD',
        description: 'Copper plated hotend for QIDI X-Max 3/X-Plus 3/X-Smart 3',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /X-Max 3|X-Plus 3|X-Smart 3|XMax3|XPlus3|XSmart3/i,
      },
      {
        name: 'X-Max 3/X-Plus 3/X-Smart 3 Hardened steel hot end',
        brand: 'QIDI',
        model: '3Series-HardenedSteel-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Hardened Steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'QIDI 3 Series (proprietary)',
          mounting_interface: '3 Series quick-swap',
          hotend_system: 'QIDI 3 Series',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'Bi-metal (titanium/copper)',
          heater_cartridge: { voltage: 24, wattage: 60 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'GF-PA', 'Abrasives'],
          special_features: ['Quick-swap hotend', 'Enclosed chamber compatible', 'Abrasive-resistant']
        },
        product_url: 'https://qidi3d.com/products/x-max-3-x-plus-3-x-smart-3-hardened-steel-hot-end',
        image_url: 'https://qidi3d.com/cdn/shop/products/ee2c263dbaa58aa9546e7a655bd0efde.png?v=1752730522&width=1080',
        price: 34.99,
        currency: 'USD',
        description: 'Hardened steel hotend for QIDI X-Max 3/X-Plus 3/X-Smart 3, suitable for abrasive filaments',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /X-Max 3|X-Plus 3|X-Smart 3|XMax3|XPlus3|XSmart3/i,
      },
      // ========== LEGACY X-SERIES HOTENDS ==========
      {
        name: 'X-Plus/X-Max Normal Hotend',
        brand: 'QIDI',
        model: 'XSeries-Normal-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Standard', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'QIDI Legacy (proprietary)',
          mounting_interface: 'X-Plus/X-Max',
          hotend_system: 'QIDI Legacy X-Series',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['Normal temperature extruder']
        },
        product_url: 'https://qidi3d.com/products/a-normal-hotend-for-qidi-x-plus-x-max-3d-printer',
        image_url: 'https://qidi3d.com/cdn/shop/products/1300fc4a93bd7994bcc230a9b468fa3b.jpg?v=1681139896&width=1080',
        price: 45.00,
        currency: 'USD',
        description: 'Normal hotend for QIDI X-Plus/X-Max legacy series',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /^X-Plus$|^X-Max$/i,
      },
      {
        name: 'X-Plus/X-Max All-metal Hotend (High-temp)',
        brand: 'QIDI',
        model: 'XSeries-AllMetal-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Hardened Steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'QIDI Legacy (proprietary)',
          mounting_interface: 'X-Plus/X-Max high-temp',
          hotend_system: 'QIDI Legacy X-Series',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'Abrasives'],
          special_features: ['All-metal construction', 'High-temp capable', 'Abrasive-resistant']
        },
        product_url: 'https://qidi3d.com/products/hot-end-for-high-temperature-extruder',
        image_url: 'https://qidi3d.com/cdn/shop/products/QQ_20210722163511_115b6edf-ebd8-4b12-90ac-83fa4f3b78f6.png?v=1681139907&width=1080',
        price: 50.00,
        currency: 'USD',
        description: 'All-metal high-temp hotend for X-Plus/X-Max/i-Fast',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /^X-Plus$|^X-Max$|i-Fast/i,
      },
      {
        name: 'X-Plus II / X-Max II Dual Gear Hot Ends',
        brand: 'QIDI',
        model: 'XSeriesII-DualGear-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Standard', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'High', 
          wear_rating: 'Standard',
          thread_type: 'QIDI Legacy II (proprietary)',
          mounting_interface: 'X-Plus II/X-Max II',
          hotend_system: 'QIDI X-Series II',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined',
          heater_cartridge: { voltage: 24, wattage: 45 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['Dual gear extruder', 'Improved filament grip']
        },
        product_url: 'https://qidi3d.com/products/x-plus-ii-dual-gear-hot-ends',
        image_url: 'https://qidi3d.com/cdn/shop/products/max2-_-plus2_682b02a8-f32c-4a40-b811-db74b3a5a1fe.jpg?v=1681140351&width=1080',
        price: 55.00,
        currency: 'USD',
        description: 'Dual gear hotend for QIDI X-Plus II/X-Max II',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /X-Plus II|X-Max II|XPlus2|XMax2/i,
      },
      // ========== I-FAST HOTENDS ==========
      {
        name: 'I-Fast Normal Hotend',
        brand: 'QIDI',
        model: 'IFast-Normal-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Standard', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'QIDI i-Fast (proprietary)',
          mounting_interface: 'i-Fast',
          hotend_system: 'QIDI i-Fast',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['Normal temperature', 'Dual extruder system']
        },
        product_url: 'https://qidi3d.com/products/i-fast-normal-hotend',
        image_url: 'https://qidi3d.com/cdn/shop/files/FAST_4.15_7c303a89-ba3b-4b19-8f1d-40dff88cfe28.jpg?v=1693460744&width=1080',
        price: 50.00,
        currency: 'USD',
        description: 'Normal hotend for QIDI i-Fast',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /i-Fast|iFast/i,
      },
      {
        name: 'I-Fast High-temp Hotend',
        brand: 'QIDI',
        model: 'IFast-HighTemp-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Hardened Steel', 
          hardened: true, 
          max_temp_c: 300, 
          flow_rate: 'High', 
          wear_rating: 'Very High',
          thread_type: 'QIDI i-Fast (proprietary)',
          mounting_interface: 'i-Fast high-temp',
          hotend_system: 'QIDI i-Fast',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'All-metal',
          heater_cartridge: { voltage: 24, wattage: 50 },
          supported_filament_types: ['PLA', 'PETG', 'ASA', 'ABS', 'PC', 'PA', 'CF-PLA', 'CF-PETG', 'CF-PA', 'Abrasives'],
          special_features: ['High-temp capable', 'All-metal construction', 'Abrasive-resistant', 'Dual extruder system']
        },
        product_url: 'https://qidi3d.com/products/i-fast-high-temp-hotend',
        image_url: 'https://qidi3d.com/cdn/shop/files/FAST_4.15.jpg?v=1693459764&width=1080',
        price: 60.00,
        currency: 'USD',
        description: 'High-temp hotend for QIDI i-Fast',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /i-Fast|iFast/i,
      },
      // ========== X-CF PRO HOTENDS ==========
      {
        name: 'X-CF Pro 0.4mm Hotend (Normal)',
        brand: 'QIDI',
        model: 'XCFPro-Normal-Hotend',
        specs: { 
          diameter_mm: 0.4, 
          material: 'Standard', 
          hardened: false, 
          max_temp_c: 260, 
          flow_rate: 'Standard', 
          wear_rating: 'Standard',
          thread_type: 'QIDI X-CF Pro (proprietary)',
          mounting_interface: 'X-CF Pro',
          hotend_system: 'QIDI X-CF Pro',
          thermistor_type: 'NTC 100K',
          heatbreak_material: 'PTFE-lined',
          heater_cartridge: { voltage: 24, wattage: 40 },
          supported_filament_types: ['PLA', 'PETG', 'TPU'],
          special_features: ['Normal temperature extruder', 'Industrial grade']
        },
        product_url: 'https://qidi3d.com/products/x-cf-pro-0-4mm-hotend',
        image_url: 'https://qidi3d.com/cdn/shop/products/15.CF_0.4mm.jpg?v=1689324015&width=1080',
        price: 49.99,
        currency: 'USD',
        description: 'Normal 0.4mm hotend for QIDI X-CF Pro',
        compatible_printer_brands: ['QIDI'],
        printer_compatibility_pattern: /X-CF Pro|XCFPro/i,
      },
    ],
  },
};

// ========== NORMALIZATION UTILITIES ==========

// Standardize material names
function normalizeMaterial(input: string): string {
  const normalized = input.toLowerCase().trim();
  
  const materialMap: Record<string, string> = {
    'brass': 'brass',
    'bronze': 'brass',
    'hardened steel': 'hardened steel',
    'hardened-steel': 'hardened steel',
    'tool steel': 'hardened steel',
    'a2 steel': 'hardened steel',
    'stainless': 'stainless steel',
    'stainless steel': 'stainless steel',
    'ss': 'stainless steel',
    'tungsten': 'tungsten carbide',
    'tungsten carbide': 'tungsten carbide',
    'tc': 'tungsten carbide',
    'copper': 'copper',
    'plated copper': 'plated copper',
    'nickel plated copper': 'nickel-plated copper',
    'titanium': 'titanium',
    'ti': 'titanium',
    'ruby': 'ruby-tipped brass',
    'sapphire': 'sapphire-tipped brass',
    'diamond': 'diamond-tipped',
    'bi-metal': 'bi-metal',
    'bimetal': 'bi-metal',
  };
  
  for (const [key, value] of Object.entries(materialMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return normalized || 'brass';
}

// Standardize thread types
function normalizeThreadType(input: string): string | undefined {
  if (!input) return undefined;
  const normalized = input.toLowerCase().trim();
  
  const threadMap: Record<string, string> = {
    'm6': 'M6',
    'm6x1': 'M6x1',
    'v6': 'V6-style',
    'e3d v6': 'V6-style',
    'mk8': 'MK8',
    'mk10': 'MK10',
    'volcano': 'Volcano',
    'supervolcano': 'SuperVolcano',
    'revo': 'Revo (proprietary)',
    'rapido': 'Rapido (proprietary)',
    'dragon': 'Dragon (proprietary)',
    'mosquito': 'Mosquito (proprietary)',
  };
  
  for (const [key, value] of Object.entries(threadMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return input;
}

// Standardize hotend systems
function normalizeHotendSystem(input: string): string | undefined {
  if (!input) return undefined;
  const normalized = input.toLowerCase().trim();
  
  const systemMap: Record<string, string> = {
    'v6': 'E3D V6',
    'e3d v6': 'E3D V6',
    'revo': 'E3D Revo',
    'volcano': 'E3D Volcano',
    'dragon': 'Phaetus Dragon',
    'dragonfly': 'Phaetus Dragonfly',
    'rapido': 'Phaetus Rapido',
    'mosquito': 'Slice Mosquito',
    'copperhead': 'Slice Copperhead',
    'bambu': 'Bambu Lab Hotend',
    'prusa': 'Prusa Hotend',
    'mk4': 'Prusa MK4 Nextruder',
    'nextruder': 'Prusa Nextruder',
  };
  
  for (const [key, value] of Object.entries(systemMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return input;
}

// Standardize thermistor types
function normalizeThermistorType(input: string): string | undefined {
  if (!input) return undefined;
  const normalized = input.toLowerCase().trim();
  
  const thermistorMap: Record<string, string> = {
    'ntc 100k': 'NTC 100K',
    '100k': 'NTC 100K',
    'pt1000': 'PT1000',
    'pt100': 'PT100',
    'semitec': 'ATC Semitec 104GT-2',
    '104gt': 'ATC Semitec 104GT-2',
    'epcos': 'EPCOS 100K',
  };
  
  for (const [key, value] of Object.entries(thermistorMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return input;
}

// Convert temperature to Celsius if needed
function normalizeTemperature(value: string | number, unit?: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  
  let temp = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(temp)) return undefined;
  
  // Convert Fahrenheit to Celsius if unit indicates or value is suspiciously high
  if (unit?.toLowerCase().includes('f') || temp > 600) {
    temp = Math.round((temp - 32) * 5 / 9);
  }
  
  return temp;
}

// Extract special features from text
function extractSpecialFeatures(text: string): string[] {
  const features: string[] = [];
  const normalized = text.toLowerCase();
  
  const featurePatterns: [RegExp, string][] = [
    [/ruby\s*(tip|nozzle)?/i, 'Ruby tip'],
    [/sapphire\s*(tip|nozzle)?/i, 'Sapphire tip'],
    [/diamond/i, 'Diamond tip'],
    [/cht|clone hot-end tip|triple.?bore/i, 'CHT (high-flow triple-bore)'],
    [/high.?flow/i, 'High-flow design'],
    [/quick.?swap|rapid.?change|tool.?less/i, 'Quick-swap'],
    [/plated/i, 'Plated surface'],
    [/polished/i, 'Polished bore'],
    [/wear.?resistant|abrasive.?resistant/i, 'Abrasive-resistant'],
    [/all.?metal/i, 'All-metal construction'],
    [/bi.?metal/i, 'Bi-metal heatbreak'],
    [/thermal.?break|heat.?break/i, 'Optimized thermal break'],
  ];
  
  for (const [pattern, feature] of featurePatterns) {
    if (pattern.test(normalized) && !features.includes(feature)) {
      features.push(feature);
    }
  }
  
  return features;
}

// Extract supported filament types from text
function extractSupportedFilaments(text: string, isHardened: boolean): string[] {
  const filaments: string[] = ['PLA', 'PETG', 'ABS'];
  const normalized = text.toLowerCase();
  
  // Add TPU if flexible mentioned
  if (/flex|tpu|tpe|soft/i.test(normalized)) {
    filaments.push('TPU', 'TPE');
  }
  
  // Hardened nozzles support abrasives
  if (isHardened || /abrasive|carbon|glass|glow|metal.?fill/i.test(normalized)) {
    filaments.push('Carbon Fiber', 'Glass Fiber', 'Glow-in-dark', 'Metal-filled');
  }
  
  // High temp materials
  if (/nylon|pa|pc|polycarbonate|peek|pei|ultem/i.test(normalized)) {
    filaments.push('Nylon/PA', 'PC', 'PEEK', 'PEI');
  }
  
  // ASA
  if (/asa/i.test(normalized)) {
    filaments.push('ASA');
  }
  
  return [...new Set(filaments)]; // Remove duplicates
}

// ========== SPEC EXTRACTION ==========

// Extract nozzle specs from product title/description
function extractNozzleSpecs(title: string, description?: string): NozzleSpecs {
  const combined = `${title} ${description || ''}`.toLowerCase();
  const combinedOriginal = `${title} ${description || ''}`;
  let confidence = 1.0;
  const extractionNotes: string[] = [];
  
  // Extract diameter
  const diameterMatch = combined.match(/(\d+\.?\d*)\s*mm/);
  const diameter_mm = diameterMatch ? parseFloat(diameterMatch[1]) : 0.4;
  if (!diameterMatch) {
    confidence -= 0.1;
    extractionNotes.push('Diameter defaulted to 0.4mm');
  }
  
  // Determine material (normalized)
  let material = 'brass';
  if (combined.includes('hardened steel') || combined.includes('hardened-steel') || combined.includes('tool steel')) {
    material = 'hardened steel';
  } else if (combined.includes('stainless')) {
    material = 'stainless steel';
  } else if (combined.includes('tungsten') || combined.includes('carbide')) {
    material = 'tungsten carbide';
  } else if (combined.includes('nickel') && combined.includes('copper')) {
    material = 'nickel-plated copper';
  } else if (combined.includes('plated copper') || combined.includes('copper plated')) {
    material = 'plated copper';
  } else if (combined.includes('copper')) {
    material = 'copper';
  } else if (combined.includes('titanium')) {
    material = 'titanium';
  } else if (combined.includes('ruby')) {
    material = 'ruby-tipped brass';
  } else if (combined.includes('sapphire')) {
    material = 'sapphire-tipped brass';
  } else if (!combined.includes('brass')) {
    confidence -= 0.05;
    extractionNotes.push('Material inferred as brass (default)');
  }
  
  // Determine if hardened
  const hardened = combined.includes('hardened') || 
                   material.includes('steel') || 
                   material.includes('tungsten') ||
                   material.includes('carbide') ||
                   combined.includes('abrasive');
  
  // Max temp estimate based on material
  let max_temp_c = 280;
  const tempMatch = combined.match(/(\d{3})\s*°?\s*c/i) || combined.match(/max\.?\s*temp\.?:?\s*(\d{3})/i);
  if (tempMatch) {
    max_temp_c = parseInt(tempMatch[1]);
  } else {
    // Estimate based on material
    if (material === 'hardened steel') max_temp_c = 450;
    else if (material === 'stainless steel') max_temp_c = 300;
    else if (material === 'tungsten carbide') max_temp_c = 500;
    else if (material.includes('copper')) max_temp_c = 350;
    else if (material.includes('ruby') || material.includes('sapphire')) max_temp_c = 500;
    
    confidence -= 0.05;
    extractionNotes.push(`Max temp estimated from material (${max_temp_c}°C)`);
  }
  
  // Extract thread type
  let thread_type: string | undefined;
  const threadMatch = combined.match(/m6|mk8|mk10|volcano|v6|revo/i);
  if (threadMatch) {
    thread_type = normalizeThreadType(threadMatch[0]);
  }
  
  // Extract orifice geometry
  let orifice_geometry: string | undefined;
  if (/cht|triple.?bore|3.?hole/i.test(combined)) {
    orifice_geometry = 'CHT (triple-bore high-flow)';
  } else if (/pointed|sharp\s*tip/i.test(combined)) {
    orifice_geometry = 'Pointed tip';
  } else if (/flat\s*tip/i.test(combined)) {
    orifice_geometry = 'Flat tip';
  } else {
    orifice_geometry = 'Standard';
  }
  
  // Extract hotend system
  let hotend_system: string | undefined;
  const hotendMatch = combined.match(/v6|revo|volcano|dragon|dragonfly|rapido|mosquito|copperhead/i);
  if (hotendMatch) {
    hotend_system = normalizeHotendSystem(hotendMatch[0]);
  }
  
  // Extract heater cartridge specs
  let heater_cartridge: NozzleSpecs['heater_cartridge'] | undefined;
  const voltageMatch = combined.match(/(\d{1,2})\s*v\s/i);
  const wattageMatch = combined.match(/(\d{2,3})\s*w/i);
  if (voltageMatch || wattageMatch) {
    heater_cartridge = {
      voltage: voltageMatch ? parseInt(voltageMatch[1]) : undefined,
      wattage: wattageMatch ? parseInt(wattageMatch[1]) : undefined,
    };
  }
  
  // Extract thermistor type
  let thermistor_type: string | undefined;
  const thermistorMatch = combined.match(/ntc\s*100k|pt1000|pt100|semitec|104gt|epcos/i);
  if (thermistorMatch) {
    thermistor_type = normalizeThermistorType(thermistorMatch[0]);
  }
  
  // Extract heatbreak material
  let heatbreak_material: string | undefined;
  if (/bi.?metal\s*(heat)?break/i.test(combined)) {
    heatbreak_material = 'bi-metal';
  } else if (/titanium\s*(heat)?break/i.test(combined) || /ti\s*(heat)?break/i.test(combined)) {
    heatbreak_material = 'titanium';
  } else if (/all.?metal/i.test(combined)) {
    heatbreak_material = 'all-metal stainless';
  } else if (/ptfe\s*(lined|tube)/i.test(combined)) {
    heatbreak_material = 'PTFE-lined';
  }
  
  // Extract cooling method
  let cooling_method: string | undefined;
  if (/water.?cool/i.test(combined)) {
    cooling_method = 'water-cooled';
  } else if (/active\s*cool|fan\s*cool/i.test(combined)) {
    cooling_method = 'active fan cooling';
  } else if (/passive/i.test(combined)) {
    cooling_method = 'passive';
  }
  
  // Extract mounting interface
  let mounting_interface: string | undefined;
  if (/v6.?style|e3d\s*v6/i.test(combined)) {
    mounting_interface = 'V6-style';
  } else if (/volcano/i.test(combined)) {
    mounting_interface = 'Volcano';
  } else if (/mk8/i.test(combined)) {
    mounting_interface = 'MK8';
  } else if (/revo/i.test(combined)) {
    mounting_interface = 'Revo (quick-swap)';
  }
  
  // Extract special features
  const special_features = extractSpecialFeatures(combinedOriginal);
  
  // Extract supported filaments
  const supported_filament_types = extractSupportedFilaments(combinedOriginal, hardened);
  
  // Estimate flow rate based on diameter
  let flow_rate: string;
  if (diameter_mm <= 0.25) flow_rate = 'Low';
  else if (diameter_mm <= 0.4) flow_rate = 'Standard';
  else if (diameter_mm <= 0.6) flow_rate = 'High';
  else flow_rate = 'Very High';
  
  // CHT nozzles have higher flow
  if (orifice_geometry?.includes('CHT')) {
    flow_rate = flow_rate === 'Standard' ? 'High' : 'Very High';
  }
  
  // Estimate wear rating
  let wear_rating: string;
  if (material.includes('tungsten') || material.includes('ruby') || material.includes('sapphire')) {
    wear_rating = 'Extreme';
  } else if (hardened) {
    wear_rating = 'Very High';
  } else if (material.includes('steel')) {
    wear_rating = 'High';
  } else {
    wear_rating = 'Standard';
  }
  
  // Build final specs object
  const specs: NozzleSpecs = {
    diameter_mm,
    material,
    max_temp_c,
    hardened,
    wear_rating,
    flow_rate,
  };
  
  // Add optional fields only if extracted
  if (thread_type) specs.thread_type = thread_type;
  if (orifice_geometry && orifice_geometry !== 'Standard') specs.orifice_geometry = orifice_geometry;
  if (heater_cartridge) specs.heater_cartridge = heater_cartridge;
  if (thermistor_type) specs.thermistor_type = thermistor_type;
  if (heatbreak_material) specs.heatbreak_material = heatbreak_material;
  if (cooling_method) specs.cooling_method = cooling_method;
  if (mounting_interface) specs.mounting_interface = mounting_interface;
  if (hotend_system) specs.hotend_system = hotend_system;
  if (special_features.length > 0) specs.special_features = special_features;
  if (supported_filament_types.length > 3) specs.supported_filament_types = supported_filament_types;
  
  // Add confidence and notes if any issues
  if (confidence < 1.0) {
    specs.confidence_score = Math.round(confidence * 100) / 100;
  }
  if (extractionNotes.length > 0) {
    specs.extraction_notes = extractionNotes.join('; ');
  }
  
  return specs;
}

// ========== VALIDATION UTILITIES ==========

// Validate URL returns HTTP 200
async function validateUrl(url: string): Promise<{ valid: boolean; status?: number; error?: string }> {
  if (!url || !url.startsWith('http')) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NozzleScraper/1.0)' }
    });
    return { valid: response.ok, status: response.status };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

// Validate image URL
async function validateImageUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  if (!url || !url.startsWith('http')) {
    return { valid: false, error: 'Invalid image URL format' };
  }
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NozzleScraper/1.0)' }
    });
    
    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}` };
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      return { valid: false, error: `Not an image: ${contentType}` };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

// ========== SCRAPING FUNCTIONS ==========

// Scrape Shopify store for nozzles
async function scrapeShopifyNozzles(
  collectionUrl: string, 
  brandName: string,
  firecrawlApiKey: string,
  productFilter?: string
): Promise<NozzleData[]> {
  const nozzles: NozzleData[] = [];
  
  // Build filter regex from productFilter (e.g., "nozzle|hotend|hardened")
  // Default includes both "nozzle" and "hotend" as synonyms
  const filterRegex = productFilter 
    ? new RegExp(productFilter, 'i') 
    : /nozzle|hotend/i;
  
  console.log(`\n🔍 Product filter: ${filterRegex}`);
  
  // Try Shopify JSON API first
  const jsonUrl = collectionUrl.replace(/\/?$/, '') + '/products.json?limit=250';
  console.log(`🔍 Attempting Shopify JSON API: ${jsonUrl}`);
  
  try {
    const response = await fetch(jsonUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NozzleScraper/1.0)' }
    });
    
    console.log(`📡 Shopify API response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      const products = data.products || [];
      
      console.log(`📦 Found ${products.length} total products in Shopify collection`);
      
      if (products.length === 0) {
        console.log(`⚠️ Shopify JSON API returned empty products array`);
      }
      
      // Filter products using regex
      const matchingProducts = products.filter((p: any) => {
        const title = (p.title || '').toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        const productType = (p.product_type || '').toLowerCase();
        const combined = `${title} ${tags} ${productType}`;
        return filterRegex.test(combined);
      });
      
      console.log(`✅ ${matchingProducts.length} products match filter "${productFilter || 'nozzle|hotend'}"`);
      
      // Log first few matching product titles for debugging
      matchingProducts.slice(0, 5).forEach((p: any, i: number) => {
        console.log(`   ${i + 1}. ${p.title}`);
      });
      
      for (const product of matchingProducts) {
        const title = product.title || '';
        const handle = product.handle || '';
        
        // Skip multi-packs, kits (unless they're individual nozzle variants)
        if (title.toLowerCase().includes('pack') && !title.toLowerCase().includes('4-pack')) {
          continue;
        }
        
        const specs = extractNozzleSpecs(title, product.body_html);
        
        // Get first variant price
        const variant = product.variants?.[0];
        const price = variant?.price ? parseFloat(variant.price) : undefined;
        
        // Get product image
        const image = product.images?.[0];
        const imageUrl = image?.src || product.image?.src;
        
        // Build product URL
        const baseUrl = collectionUrl.split('/collections/')[0];
        const productUrl = `${baseUrl}/products/${handle}`;
        
        // Generate model from handle
        const model = handle.toUpperCase().replace(/-/g, '-').slice(0, 20);
        
        nozzles.push({
          name: title,
          brand: brandName,
          model,
          specs: {
            diameter_mm: specs.diameter_mm || 0.4,
            material: specs.material || 'brass',
            hardened: specs.hardened || false,
            max_temp_c: specs.max_temp_c,
          },
          product_url: productUrl,
          image_url: imageUrl,
          price,
          currency: 'USD',
          description: product.body_html?.replace(/<[^>]*>/g, '').slice(0, 200),
          compatible_printer_brands: [brandName],
        });
      }
      
      return nozzles;
    } else {
      console.log(`⚠️ Shopify JSON API failed with status ${response.status}`);
    }
  } catch (error) {
    console.log(`⚠️ Shopify JSON API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Fallback to Firecrawl if JSON API fails
  console.log(`\n🔄 Falling back to Firecrawl scraping...`);
  
  try {
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: collectionUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });
    
    if (firecrawlResponse.ok) {
      const result = await firecrawlResponse.json();
      const links = result.data?.links || [];
      const markdown = result.data?.markdown || '';
      
      console.log(`📄 Firecrawl found ${links.length} links`);
      
      // Filter for product links using the same regex (includes hotend)
      const productLinks = links.filter((link: string) => 
        link.includes('/products/') && filterRegex.test(link)
      );
      
      console.log(`🔗 Found ${productLinks.length} nozzle/hotend product links`);
      
      // Log matched links for debugging
      productLinks.slice(0, 5).forEach((link: string, i: number) => {
        console.log(`   ${i + 1}. ${link}`);
      });
      
      // For each product link, scrape details
      for (const productUrl of productLinks.slice(0, 20)) { // Limit to 20
        try {
          const productResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: productUrl,
              formats: ['markdown'],
              onlyMainContent: true,
            }),
          });
          
          if (productResponse.ok) {
            const productData = await productResponse.json();
            const content = productData.data?.markdown || '';
            const metadata = productData.data?.metadata || {};
            
            const title = metadata.title || productUrl.split('/').pop()?.replace(/-/g, ' ') || 'Unknown Nozzle';
            const specs = extractNozzleSpecs(title, content);
            
            // Try to extract price from content
            const priceMatch = content.match(/\$(\d+\.?\d*)/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;
            
            // Try to extract image from metadata
            const imageUrl = metadata.ogImage || metadata.image;
            
            nozzles.push({
              name: title,
              brand: brandName,
              specs: {
                diameter_mm: specs.diameter_mm || 0.4,
                material: specs.material || 'brass',
                hardened: specs.hardened || false,
                max_temp_c: specs.max_temp_c,
              },
              product_url: productUrl,
              image_url: imageUrl,
              price,
              currency: 'USD',
              compatible_printer_brands: [brandName],
            });
          }
        } catch (productError) {
          console.log(`⚠️ Failed to scrape product: ${productUrl}`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Firecrawl scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return nozzles;
}

// Generate QC Report
function generateQCReport(report: QCReport): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 QC REPORT FOR: ${report.brand}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n📈 DISCOVERY METRICS:`);
  console.log(`   Total nozzles discovered: ${report.total_discovered}`);
  console.log(`\n🔗 URL VALIDATION:`);
  console.log(`   ✅ Product URLs valid: ${report.url_validated}`);
  console.log(`   ❌ Product URLs failed: ${report.url_failed}`);
  console.log(`\n🖼️ IMAGE VALIDATION:`);
  console.log(`   ✅ Images valid: ${report.image_validated}`);
  console.log(`   ❌ Images failed: ${report.image_failed}`);
  console.log(`\n💰 DATA COMPLETENESS:`);
  console.log(`   Prices found: ${report.price_found}/${report.total_discovered}`);
  console.log(`   Specs complete: ${report.specs_complete}/${report.total_discovered}`);
  console.log(`\n💾 DATABASE OPERATIONS:`);
  console.log(`   Accessories inserted/updated: ${report.inserted}`);
  
  if (report.errors.length > 0) {
    console.log(`\n⚠️ ERRORS (${report.errors.length}):`);
    report.errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }
  
  // Calculate quality score
  const urlQuality = report.total_discovered > 0 ? (report.url_validated / report.total_discovered) * 100 : 0;
  const imageQuality = report.total_discovered > 0 ? (report.image_validated / report.total_discovered) * 100 : 0;
  const dataQuality = report.total_discovered > 0 ? (report.price_found / report.total_discovered) * 100 : 0;
  const overallQuality = (urlQuality + imageQuality + dataQuality) / 3;
  
  console.log(`\n🎯 QUALITY SCORES:`);
  console.log(`   URL Quality: ${urlQuality.toFixed(1)}%`);
  console.log(`   Image Quality: ${imageQuality.toFixed(1)}%`);
  console.log(`   Data Completeness: ${dataQuality.toFixed(1)}%`);
  console.log(`   Overall Quality: ${overallQuality.toFixed(1)}%`);
  console.log(`${'='.repeat(60)}\n`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { brandName, validateUrls = true, skipValidation = false } = await req.json();

    if (!brandName) {
      return new Response(
        JSON.stringify({ error: 'brandName is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`\n${'🔧'.repeat(30)}`);
    console.log(`DYNAMIC NOZZLE SCRAPER - Starting`);
    console.log(`Brand: ${brandName}`);
    console.log(`Validate URLs: ${validateUrls}`);
    console.log(`${'🔧'.repeat(30)}\n`);

    // Get all printers for compatibility matching
    const { data: printers, error: printersError } = await supabase
      .from('printers')
      .select('id, model_name, brand_id, printer_brands!inner(brand)');
    
    if (printersError) throw printersError;
    console.log(`📋 Found ${printers?.length || 0} printers in database for compatibility matching`);

    const brandConfig = BRAND_STORE_CONFIGS[brandName];
    if (!brandConfig) {
      return new Response(
        JSON.stringify({ 
          error: `No scraping configuration for brand: ${brandName}`,
          available_brands: Object.keys(BRAND_STORE_CONFIGS)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`\n🏪 Brand Configuration:`);
    console.log(`   Collection URL: ${brandConfig.nozzle_collection_url}`);
    console.log(`   Is Shopify: ${brandConfig.is_shopify}`);
    console.log(`   Compatibility Pattern: ${brandConfig.compatibility_pattern}`);

    // Initialize QC Report
    const qcReport: QCReport = {
      brand: brandName,
      total_discovered: 0,
      url_validated: 0,
      url_failed: 0,
      image_validated: 0,
      image_failed: 0,
      price_found: 0,
      specs_complete: 0,
      inserted: 0,
      errors: [],
    };

    // PHASE 1: DISCOVERY
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`PHASE 1: DISCOVERY`);
    console.log(`${'─'.repeat(40)}`);

    let discoveredNozzles: NozzleData[] = [];

    // Check for hardcoded nozzles first (for brands with non-scrapeable stores)
    if (brandConfig.hardcoded_nozzles && brandConfig.hardcoded_nozzles.length > 0) {
      console.log(`📦 Using hardcoded nozzle data for ${brandName} (non-Shopify platform)`);
      discoveredNozzles = brandConfig.hardcoded_nozzles;
      console.log(`   Found ${discoveredNozzles.length} hardcoded nozzles`);
    } else if (brandConfig.is_shopify) {
      discoveredNozzles = await scrapeShopifyNozzles(
        brandConfig.nozzle_collection_url,
        brandName,
        firecrawlApiKey,
        brandConfig.product_filter
      );
    } else {
      // Non-Shopify scraping (use Firecrawl directly)
      console.log(`⚠️ Non-Shopify store without hardcoded data - using Firecrawl generic scraping`);
      // For now, return empty - can be extended
    }

    qcReport.total_discovered = discoveredNozzles.length;
    console.log(`\n✅ Discovered ${discoveredNozzles.length} nozzles from ${brandName} store`);

    // PHASE 2: VALIDATION
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`PHASE 2: VALIDATION`);
    console.log(`${'─'.repeat(40)}`);

    const validatedNozzles: NozzleData[] = [];
    const shouldSkipValidation = brandConfig.skip_validation || skipValidation;

    for (let i = 0; i < discoveredNozzles.length; i++) {
      const nozzle = discoveredNozzles[i];
      console.log(`\n📌 Validating ${i + 1}/${discoveredNozzles.length}: ${nozzle.name}`);
      
      // Validate product URL (skip if brand config says to)
      if (!shouldSkipValidation && validateUrls) {
        const urlResult = await validateUrl(nozzle.product_url);
        if (urlResult.valid) {
          qcReport.url_validated++;
          console.log(`   ✅ Product URL valid (${urlResult.status})`);
        } else {
          qcReport.url_failed++;
          console.log(`   ❌ Product URL invalid: ${urlResult.error}`);
          qcReport.errors.push(`URL failed for "${nozzle.name}": ${urlResult.error}`);
          continue; // Skip invalid URLs
        }
      } else {
        qcReport.url_validated++;
        if (shouldSkipValidation) {
          console.log(`   ⏭️ URL validation skipped (hardcoded data)`);
        }
      }
      
      // Validate image URL (skip if brand config says to)
      if (nozzle.image_url && !shouldSkipValidation) {
        const imageResult = await validateImageUrl(nozzle.image_url);
        if (imageResult.valid) {
          qcReport.image_validated++;
          console.log(`   ✅ Image URL valid`);
        } else {
          qcReport.image_failed++;
          console.log(`   ⚠️ Image URL invalid: ${imageResult.error}`);
          nozzle.image_url = undefined; // Clear invalid image
        }
      } else if (nozzle.image_url) {
        qcReport.image_validated++;
        if (shouldSkipValidation) {
          console.log(`   ⏭️ Image validation skipped (hardcoded data)`);
        }
      } else {
        qcReport.image_failed++;
      }
      
      // Check data completeness
      if (nozzle.price && nozzle.price > 0) {
        qcReport.price_found++;
        console.log(`   💰 Price: $${nozzle.price}`);
      } else {
        console.log(`   ⚠️ No price found`);
      }
      
      if (nozzle.specs.diameter_mm && nozzle.specs.material) {
        qcReport.specs_complete++;
        console.log(`   📐 Specs: ${nozzle.specs.diameter_mm}mm ${nozzle.specs.material}`);
      }
      
      validatedNozzles.push(nozzle);
    }

    console.log(`\n✅ Validated ${validatedNozzles.length}/${discoveredNozzles.length} nozzles`);

    // PHASE 3: DATABASE INSERT
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`PHASE 3: DATABASE INSERT`);
    console.log(`${'─'.repeat(40)}`);

    for (const nozzle of validatedNozzles) {
      // Find compatible printers using nozzle-specific pattern if available
      const compatiblePrinters = (printers || []).filter((printer: any) => {
        const printerBrand = printer.printer_brands?.brand;
        
        // Use nozzle-specific pattern if defined, otherwise fall back to brand pattern
        const compatPattern = nozzle.printer_compatibility_pattern || brandConfig.compatibility_pattern;
        
        // Check if this is a third-party nozzle (compatible with multiple brands beyond its own)
        const isThirdPartyNozzle = nozzle.compatible_printer_brands && 
          nozzle.compatible_printer_brands.length > 1 &&
          nozzle.compatible_printer_brands.some((b: string) => b !== nozzle.brand);
        
        // For third-party nozzles (like E3D), match against compatible_printer_brands list
        if (isThirdPartyNozzle && nozzle.compatible_printer_brands) {
          return nozzle.compatible_printer_brands.includes(printerBrand);
        }
        
        // For OEM nozzles, match by brand AND model pattern
        if (nozzle.brand === brandName && compatPattern) {
          // Must be same brand AND match the compatibility pattern
          return printerBrand === brandName && compatPattern.test(printer.model_name);
        }
        
        // Fallback: check compatible brands list
        if (nozzle.compatible_printer_brands?.includes(printerBrand)) {
          return true;
        }
        
        return false;
      });

      console.log(`\n📥 Inserting "${nozzle.name}" for ${compatiblePrinters.length} printers`);

      for (const printer of compatiblePrinters) {
        const upsertData = {
          printer_id: printer.id,
          accessory_type: 'nozzle',
          name: nozzle.name,
          brand: nozzle.brand,
          model: nozzle.model,
          specs: nozzle.specs,
          product_url: nozzle.product_url,
          image_url: nozzle.image_url,
          price: nozzle.price,
          currency: nozzle.currency || 'USD',
          description: nozzle.description,
          compatible_printer_brands: nozzle.compatible_printer_brands || [brandName],
          compatible_hotend_types: brandConfig.compatible_hotend_types,
        };

        const { error: insertError } = await supabase
          .from('printer_accessories')
          .upsert(upsertData, {
            onConflict: 'printer_id,name',
            ignoreDuplicates: false,
          });

        if (!insertError) {
          qcReport.inserted++;
        } else {
          qcReport.errors.push(`Insert failed for "${nozzle.name}" on ${printer.model_name}: ${insertError.message}`);
        }
      }
    }

    // PHASE 4: QC REPORT
    generateQCReport(qcReport);

    return new Response(
      JSON.stringify({
        success: true,
        qc_report: {
          brand: qcReport.brand,
          total_discovered: qcReport.total_discovered,
          url_validated: qcReport.url_validated,
          url_failed: qcReport.url_failed,
          image_validated: qcReport.image_validated,
          image_failed: qcReport.image_failed,
          price_found: qcReport.price_found,
          specs_complete: qcReport.specs_complete,
          inserted: qcReport.inserted,
          errors: qcReport.errors.length,
        },
        nozzles: validatedNozzles.map(n => ({
          name: n.name,
          product_url: n.product_url,
          image_url: n.image_url,
          price: n.price,
          specs: n.specs,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
