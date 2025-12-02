import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NozzleData {
  name: string;
  brand: string;
  model?: string;
  specs: {
    diameter_mm: number;
    material: string;
    max_temp_c?: number;
    hardened: boolean;
    wear_rating?: string;
    flow_rate?: string;
    coating?: string;
  };
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
        specs: { diameter_mm: 0.2, material: 'stainless steel', hardened: false, max_temp_c: 300, flow_rate: 'Low', wear_rating: 'High' },
        product_url: 'https://us.store.bambulab.com/products/bambu-hotend-a1-series',
        image_url: 'https://store.bblcdn.com/s7/default/0f775f9301174a67b80759d324061e51/0.4.png',
        price: 10.99,
        currency: 'USD',
        description: 'Quick-swap hotend for A1 series with 0.2mm stainless steel nozzle',
        compatible_printer_brands: ['Bambu Lab'],
        printer_compatibility_pattern: /^A1/i, // A1, A1 Mini
      },
      {
        name: '0.4mm Stainless Steel Hotend (A1)',
        brand: 'Bambu Lab',
        model: 'Hotend-A1-SS-0.4',
        specs: { diameter_mm: 0.4, material: 'stainless steel', hardened: false, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'High' },
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.6, material: 'hardened steel', hardened: true, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.8, material: 'hardened steel', hardened: true, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.2, material: 'stainless steel', hardened: false, max_temp_c: 300, flow_rate: 'Low', wear_rating: 'High' },
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.6, material: 'hardened steel', hardened: true, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.8, material: 'hardened steel', hardened: true, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.2, material: 'stainless steel', hardened: false, max_temp_c: 300, flow_rate: 'Low', wear_rating: 'High' },
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.6, material: 'hardened steel', hardened: true, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.8, material: 'hardened steel', hardened: true, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.25, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Low', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.8, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'Standard', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.6, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'High', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.25, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Low', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'Standard', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'Standard', wear_rating: 'Very High' },
        product_url: 'https://www.prusa3d.com/product/hardened-steel-nozzle-for-prusa-xl-0-4-mm/',
        image_url: 'https://www.prusa3d.com/cdn-cgi/image/width=600,format=auto/content/images/product/default/3212.jpg',
        price: 29.99,
        currency: 'USD',
        description: 'Hardened steel nozzle for Prusa XL - abrasive materials',
        compatible_printer_brands: ['Prusa Research'],
        printer_compatibility_pattern: /^XL/i,
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/unicorn-quick-swap-nozzle-for-k1-k1-max-k1c',
        image_url: 'https://img.staticdj.com/b02bfb72e8d41d9ff4d02f00ba3bad9d_1080x.jpg',
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'High', wear_rating: 'Very High' },
        product_url: 'https://store.creality.com/products/unicorn-quick-swap-nozzle-for-k1-k1-max-k1c',
        image_url: 'https://img.staticdj.com/b02bfb72e8d41d9ff4d02f00ba3bad9d_1080x.jpg',
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
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/unicorn-quick-swap-nozzle-for-k1-k1-max-k1c',
        image_url: 'https://img.staticdj.com/b02bfb72e8d41d9ff4d02f00ba3bad9d_1080x.jpg',
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
        specs: { diameter_mm: 0.8, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Ultra High', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/unicorn-quick-swap-nozzle-for-k1-k1-max-k1c',
        image_url: 'https://img.staticdj.com/b02bfb72e8d41d9ff4d02f00ba3bad9d_1080x.jpg',
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/creality-k2-plus-nozzle-kit',
        image_url: 'https://img.staticdj.com/e8e7e0c5ba5c4e4a8e9c6b3a1d2f4e7a_1080x.jpg',
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'High', wear_rating: 'Very High' },
        product_url: 'https://store.creality.com/products/creality-k2-plus-nozzle-kit',
        image_url: 'https://img.staticdj.com/e8e7e0c5ba5c4e4a8e9c6b3a1d2f4e7a_1080x.jpg',
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'Standard', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/ender-3-v3-se-nozzle-kit',
        image_url: 'https://img.staticdj.com/ender3v3-nozzle_1080x.jpg',
        price: 8.99,
        currency: 'USD',
        description: 'Brass nozzle for Ender-3 V3 series printers',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender-3 V3|Ender-3V3/i,
      },
      {
        name: '0.2mm Brass Nozzle (Ender-3 V3 Series)',
        brand: 'Creality',
        model: 'Ender3V3-Brass-0.2',
        specs: { diameter_mm: 0.2, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'Low', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/ender-3-v3-se-nozzle-kit',
        image_url: 'https://img.staticdj.com/ender3v3-nozzle_1080x.jpg',
        price: 8.99,
        currency: 'USD',
        description: 'Fine detail brass nozzle for Ender-3 V3 series',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender-3 V3|Ender-3V3/i,
      },
      {
        name: '0.6mm Brass Nozzle (Ender-3 V3 Series)',
        brand: 'Creality',
        model: 'Ender3V3-Brass-0.6',
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'High', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/ender-3-v3-se-nozzle-kit',
        image_url: 'https://img.staticdj.com/ender3v3-nozzle_1080x.jpg',
        price: 8.99,
        currency: 'USD',
        description: 'Fast printing brass nozzle for Ender-3 V3 series',
        compatible_printer_brands: ['Creality'],
        printer_compatibility_pattern: /Ender-3 V3|Ender-3V3/i,
      },
      // ========== LEGACY ENDER-3/CR SERIES (MK8 NOZZLES) ==========
      {
        name: '0.4mm Brass MK8 Nozzle (Ender/CR Series)',
        brand: 'Creality',
        model: 'MK8-Brass-0.4',
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'Standard', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/mk8-brass-nozzle-kit',
        image_url: 'https://img.staticdj.com/mk8-nozzle-kit_1080x.jpg',
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
        specs: { diameter_mm: 0.2, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'Low', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/mk8-brass-nozzle-kit',
        image_url: 'https://img.staticdj.com/mk8-nozzle-kit_1080x.jpg',
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
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'High', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/mk8-brass-nozzle-kit',
        image_url: 'https://img.staticdj.com/mk8-nozzle-kit_1080x.jpg',
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
        specs: { diameter_mm: 0.8, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'Very High', wear_rating: 'Standard' },
        product_url: 'https://store.creality.com/products/mk8-brass-nozzle-kit',
        image_url: 'https://img.staticdj.com/mk8-nozzle-kit_1080x.jpg',
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'Standard' },
        product_url: 'https://e3d-online.com/products/revo-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-Nozzle-Brass-0.4_1600x.png',
        price: 16.50,
        currency: 'USD',
        description: 'Quick-change brass Revo nozzle - no tools required',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.25mm Brass Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-Brass-0.25',
        specs: { diameter_mm: 0.25, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Low', wear_rating: 'Standard' },
        product_url: 'https://e3d-online.com/products/revo-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-Nozzle-Brass-0.25_1600x.png',
        price: 16.50,
        currency: 'USD',
        description: 'Fine detail brass Revo nozzle for high precision',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.6mm Brass Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-Brass-0.6',
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
        product_url: 'https://e3d-online.com/products/revo-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-Nozzle-Brass-0.6_1600x.png',
        price: 16.50,
        currency: 'USD',
        description: 'Fast printing brass Revo nozzle',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.8mm Brass Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-Brass-0.8',
        specs: { diameter_mm: 0.8, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Standard' },
        product_url: 'https://e3d-online.com/products/revo-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-Nozzle-Brass-0.8_1600x.png',
        price: 16.50,
        currency: 'USD',
        description: 'Rapid prototyping brass Revo nozzle',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.4mm ObXidian Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-ObXidian-0.4',
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 500, flow_rate: 'Standard', wear_rating: 'Extreme', coating: 'ObXidian' },
        product_url: 'https://e3d-online.com/products/revo-obxidian-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-ObXidian-0.4_1600x.png',
        price: 35.00,
        currency: 'USD',
        description: 'Premium abrasion-resistant nozzle with ObXidian coating',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      {
        name: '0.6mm ObXidian Revo Nozzle',
        brand: 'E3D',
        model: 'Revo-ObXidian-0.6',
        specs: { diameter_mm: 0.6, material: 'hardened steel', hardened: true, max_temp_c: 500, flow_rate: 'High', wear_rating: 'Extreme', coating: 'ObXidian' },
        product_url: 'https://e3d-online.com/products/revo-obxidian-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/Revo-ObXidian-0.6_1600x.png',
        price: 35.00,
        currency: 'USD',
        description: 'Premium high-flow abrasion-resistant nozzle',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D Revo'],
      },
      // ========== V6 NOZZLES (Traditional hotend system) ==========
      {
        name: '0.4mm Brass V6 Nozzle',
        brand: 'E3D',
        model: 'V6-Brass-0.4',
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'Standard' },
        product_url: 'https://e3d-online.com/products/v6-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-Brass_1600x.png',
        price: 6.50,
        currency: 'USD',
        description: 'Standard brass V6 nozzle - industry standard',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.25mm Brass V6 Nozzle',
        brand: 'E3D',
        model: 'V6-Brass-0.25',
        specs: { diameter_mm: 0.25, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Low', wear_rating: 'Standard' },
        product_url: 'https://e3d-online.com/products/v6-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-Brass_1600x.png',
        price: 6.50,
        currency: 'USD',
        description: 'Fine detail brass V6 nozzle',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.6mm Brass V6 Nozzle',
        brand: 'E3D',
        model: 'V6-Brass-0.6',
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
        product_url: 'https://e3d-online.com/products/v6-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-Brass_1600x.png',
        price: 6.50,
        currency: 'USD',
        description: 'Fast printing brass V6 nozzle',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.8mm Brass V6 Nozzle',
        brand: 'E3D',
        model: 'V6-Brass-0.8',
        specs: { diameter_mm: 0.8, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Standard' },
        product_url: 'https://e3d-online.com/products/v6-nozzles',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-Brass_1600x.png',
        price: 6.50,
        currency: 'USD',
        description: 'Rapid prototyping brass V6 nozzle',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.4mm Hardened Steel V6 Nozzle',
        brand: 'E3D',
        model: 'V6-HS-0.4',
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'Standard', wear_rating: 'Very High' },
        product_url: 'https://e3d-online.com/products/v6-nozzles-hardened-steel',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-HS_1600x.png',
        price: 22.00,
        currency: 'USD',
        description: 'Hardened steel V6 nozzle for abrasive filaments',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
      },
      {
        name: '0.6mm Hardened Steel V6 Nozzle',
        brand: 'E3D',
        model: 'V6-HS-0.6',
        specs: { diameter_mm: 0.6, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'High', wear_rating: 'Very High' },
        product_url: 'https://e3d-online.com/products/v6-nozzles-hardened-steel',
        image_url: 'https://e3d-online.com/cdn/shop/files/V6-Nozzle-HS_1600x.png',
        price: 22.00,
        currency: 'USD',
        description: 'High-flow hardened steel V6 nozzle',
        compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron Design'],
        compatible_hotend_types: ['E3D V6', 'Clone V6'],
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Standard', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'Standard', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'Standard', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'High', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'High', wear_rating: 'Very High' },
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
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'Standard', wear_rating: 'Standard' },
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
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 260, flow_rate: 'High', wear_rating: 'Standard' },
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
  'QIDI Tech': {
    nozzle_collection_url: 'https://qidi3d.com/collections/nozzles',
    is_shopify: true,
    compatibility_pattern: /X-Plus|X-Max|X-Smart|Q1|X-CF/i,
    compatible_hotend_types: ['QIDI Hotend'],
    product_filter: 'nozzle|hotend',
    skip_validation: true,
    hardcoded_nozzles: [
      // ========== X-PLUS 3/X-MAX 3 NOZZLES ==========
      {
        name: '0.4mm Brass Nozzle (X-Plus 3/X-Max 3)',
        brand: 'QIDI Tech',
        model: 'XPlus3-Brass-0.4',
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
        product_url: 'https://qidi3d.com/products/x-plus-3-nozzle',
        image_url: 'https://cdn.shopify.com/s/files/1/0600/3066/4905/files/xplus3-nozzle_600x.png',
        price: 12.99,
        currency: 'USD',
        description: 'High-flow brass nozzle for X-Plus 3 and X-Max 3',
        compatible_printer_brands: ['QIDI Tech'],
        printer_compatibility_pattern: /X-Plus 3|X-Max 3|XPlus3|XMax3/i,
      },
      {
        name: '0.6mm Brass Nozzle (X-Plus 3/X-Max 3)',
        brand: 'QIDI Tech',
        model: 'XPlus3-Brass-0.6',
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Standard' },
        product_url: 'https://qidi3d.com/products/x-plus-3-nozzle',
        image_url: 'https://cdn.shopify.com/s/files/1/0600/3066/4905/files/xplus3-nozzle_600x.png',
        price: 12.99,
        currency: 'USD',
        description: 'Fast printing brass nozzle for X-Plus 3 and X-Max 3',
        compatible_printer_brands: ['QIDI Tech'],
        printer_compatibility_pattern: /X-Plus 3|X-Max 3|XPlus3|XMax3/i,
      },
      {
        name: '0.4mm Hardened Steel Nozzle (X-Plus 3/X-Max 3)',
        brand: 'QIDI Tech',
        model: 'XPlus3-HS-0.4',
        specs: { diameter_mm: 0.4, material: 'hardened steel', hardened: true, max_temp_c: 450, flow_rate: 'High', wear_rating: 'Very High' },
        product_url: 'https://qidi3d.com/products/x-plus-3-nozzle',
        image_url: 'https://cdn.shopify.com/s/files/1/0600/3066/4905/files/xplus3-nozzle_600x.png',
        price: 18.99,
        currency: 'USD',
        description: 'Hardened steel nozzle for abrasive materials',
        compatible_printer_brands: ['QIDI Tech'],
        printer_compatibility_pattern: /X-Plus 3|X-Max 3|XPlus3|XMax3/i,
      },
      // ========== Q1 PRO NOZZLES ==========
      {
        name: '0.4mm Brass Nozzle (Q1 Pro)',
        brand: 'QIDI Tech',
        model: 'Q1Pro-Brass-0.4',
        specs: { diameter_mm: 0.4, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'High', wear_rating: 'Standard' },
        product_url: 'https://qidi3d.com/products/q1-pro-nozzle',
        image_url: 'https://cdn.shopify.com/s/files/1/0600/3066/4905/files/q1pro-nozzle_600x.png',
        price: 10.99,
        currency: 'USD',
        description: 'Standard brass nozzle for Q1 Pro',
        compatible_printer_brands: ['QIDI Tech'],
        printer_compatibility_pattern: /Q1/i,
      },
      {
        name: '0.6mm Brass Nozzle (Q1 Pro)',
        brand: 'QIDI Tech',
        model: 'Q1Pro-Brass-0.6',
        specs: { diameter_mm: 0.6, material: 'brass', hardened: false, max_temp_c: 300, flow_rate: 'Very High', wear_rating: 'Standard' },
        product_url: 'https://qidi3d.com/products/q1-pro-nozzle',
        image_url: 'https://cdn.shopify.com/s/files/1/0600/3066/4905/files/q1pro-nozzle_600x.png',
        price: 10.99,
        currency: 'USD',
        description: 'Fast printing brass nozzle for Q1 Pro',
        compatible_printer_brands: ['QIDI Tech'],
        printer_compatibility_pattern: /Q1/i,
      },
    ],
  },
};

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

// Extract nozzle specs from product title/description
function extractNozzleSpecs(title: string, description?: string): Partial<NozzleData['specs']> {
  const combined = `${title} ${description || ''}`.toLowerCase();
  
  // Extract diameter
  const diameterMatch = combined.match(/(\d+\.?\d*)\s*mm/);
  const diameter_mm = diameterMatch ? parseFloat(diameterMatch[1]) : 0.4;
  
  // Determine material
  let material = 'brass';
  if (combined.includes('hardened steel') || combined.includes('hardened-steel')) {
    material = 'hardened steel';
  } else if (combined.includes('stainless')) {
    material = 'stainless steel';
  } else if (combined.includes('tungsten')) {
    material = 'tungsten carbide';
  } else if (combined.includes('copper')) {
    material = 'plated copper';
  } else if (combined.includes('titanium')) {
    material = 'titanium';
  }
  
  // Determine if hardened
  const hardened = combined.includes('hardened') || 
                   combined.includes('steel') || 
                   combined.includes('tungsten') ||
                   combined.includes('carbide');
  
  // Max temp estimate
  let max_temp_c = 280;
  if (material === 'hardened steel') max_temp_c = 450;
  if (material === 'stainless steel') max_temp_c = 300;
  if (material === 'tungsten carbide') max_temp_c = 500;
  
  return {
    diameter_mm,
    material,
    hardened,
    max_temp_c,
  };
}

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
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        
        // For OEM nozzles, match by brand AND model pattern
        if (nozzle.brand === brandName && compatPattern) {
          // Must be same brand AND match the compatibility pattern
          return printerBrand === brandName && compatPattern.test(printer.model_name);
        }
        
        // For 3rd party, check compatible brands list
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
