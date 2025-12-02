import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NozzleData {
  name: string;
  specs: {
    diameter_mm: number;
    material: string;
    max_temp_c?: number;
    hardened: boolean;
  };
  product_url: string;
  price?: number;
  currency?: string;
}

// Predefined nozzle data for each brand (nozzles are standardized products)
const BRAND_NOZZLES: Record<string, { nozzles: NozzleData[]; compatibility_pattern?: RegExp }> = {
  'Bambu Lab': {
    compatibility_pattern: /X1|P1|A1/i,
    nozzles: [
      { name: '0.2mm Stainless Steel Nozzle', specs: { diameter_mm: 0.2, material: 'stainless steel', max_temp_c: 300, hardened: true }, product_url: 'https://us.store.bambulab.com/products/0-2mm-stainless-steel-nozzle', price: 9.99, currency: 'USD' },
      { name: '0.4mm Stainless Steel Nozzle', specs: { diameter_mm: 0.4, material: 'stainless steel', max_temp_c: 300, hardened: true }, product_url: 'https://us.store.bambulab.com/products/0-4mm-stainless-steel-nozzle', price: 9.99, currency: 'USD' },
      { name: '0.6mm Stainless Steel Nozzle', specs: { diameter_mm: 0.6, material: 'stainless steel', max_temp_c: 300, hardened: true }, product_url: 'https://us.store.bambulab.com/products/0-6mm-stainless-steel-nozzle', price: 9.99, currency: 'USD' },
      { name: '0.8mm Stainless Steel Nozzle', specs: { diameter_mm: 0.8, material: 'stainless steel', max_temp_c: 300, hardened: true }, product_url: 'https://us.store.bambulab.com/products/0-8mm-stainless-steel-nozzle', price: 9.99, currency: 'USD' },
      { name: '0.2mm Hardened Steel Nozzle', specs: { diameter_mm: 0.2, material: 'hardened steel', max_temp_c: 300, hardened: true }, product_url: 'https://us.store.bambulab.com/products/0-2mm-hardened-steel-nozzle', price: 14.99, currency: 'USD' },
      { name: '0.4mm Hardened Steel Nozzle', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 300, hardened: true }, product_url: 'https://us.store.bambulab.com/products/0-4mm-hardened-steel-nozzle', price: 14.99, currency: 'USD' },
      { name: '0.6mm Hardened Steel Nozzle', specs: { diameter_mm: 0.6, material: 'hardened steel', max_temp_c: 300, hardened: true }, product_url: 'https://us.store.bambulab.com/products/0-6mm-hardened-steel-nozzle', price: 14.99, currency: 'USD' },
      { name: '0.8mm Hardened Steel Nozzle', specs: { diameter_mm: 0.8, material: 'hardened steel', max_temp_c: 300, hardened: true }, product_url: 'https://us.store.bambulab.com/products/0-8mm-hardened-steel-nozzle', price: 14.99, currency: 'USD' },
    ],
  },
  'Prusa Research': {
    compatibility_pattern: /MK4|MK3|MINI|XL/i,
    nozzles: [
      { name: '0.25mm Brass Nozzle', specs: { diameter_mm: 0.25, material: 'brass', max_temp_c: 280, hardened: false }, product_url: 'https://www.prusa3d.com/product/nozzle-0-25mm/', price: 4.99, currency: 'USD' },
      { name: '0.4mm Brass Nozzle', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 280, hardened: false }, product_url: 'https://www.prusa3d.com/product/nozzle-0-4mm/', price: 4.99, currency: 'USD' },
      { name: '0.6mm Brass Nozzle', specs: { diameter_mm: 0.6, material: 'brass', max_temp_c: 280, hardened: false }, product_url: 'https://www.prusa3d.com/product/nozzle-0-6mm/', price: 4.99, currency: 'USD' },
      { name: '0.8mm Brass Nozzle', specs: { diameter_mm: 0.8, material: 'brass', max_temp_c: 280, hardened: false }, product_url: 'https://www.prusa3d.com/product/nozzle-0-8mm/', price: 4.99, currency: 'USD' },
      { name: '0.4mm Hardened Steel Nozzle', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 450, hardened: true }, product_url: 'https://www.prusa3d.com/product/hardened-steel-nozzle/', price: 24.99, currency: 'USD' },
      { name: '0.6mm Hardened Steel Nozzle', specs: { diameter_mm: 0.6, material: 'hardened steel', max_temp_c: 450, hardened: true }, product_url: 'https://www.prusa3d.com/product/hardened-steel-nozzle-0-6mm/', price: 24.99, currency: 'USD' },
    ],
  },
  'Creality': {
    compatibility_pattern: /K1|Ender|CR-/i,
    nozzles: [
      { name: '0.4mm Brass Nozzle', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 260, hardened: false }, product_url: 'https://store.creality.com/products/brass-nozzle', price: 2.99, currency: 'USD' },
      { name: '0.6mm Brass Nozzle', specs: { diameter_mm: 0.6, material: 'brass', max_temp_c: 260, hardened: false }, product_url: 'https://store.creality.com/products/brass-nozzle-0-6mm', price: 2.99, currency: 'USD' },
      { name: '0.8mm Brass Nozzle', specs: { diameter_mm: 0.8, material: 'brass', max_temp_c: 260, hardened: false }, product_url: 'https://store.creality.com/products/brass-nozzle-0-8mm', price: 2.99, currency: 'USD' },
      { name: '0.4mm Hardened Steel Nozzle', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 300, hardened: true }, product_url: 'https://store.creality.com/products/hardened-steel-nozzle', price: 12.99, currency: 'USD' },
    ],
  },
  'Anycubic': {
    compatibility_pattern: /Kobra/i,
    nozzles: [
      { name: '0.4mm Brass Nozzle', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 260, hardened: false }, product_url: 'https://www.anycubic.com/products/brass-nozzle', price: 3.99, currency: 'USD' },
      { name: '0.6mm Brass Nozzle', specs: { diameter_mm: 0.6, material: 'brass', max_temp_c: 260, hardened: false }, product_url: 'https://www.anycubic.com/products/brass-nozzle-0-6mm', price: 3.99, currency: 'USD' },
      { name: '0.4mm Hardened Steel Nozzle', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 300, hardened: true }, product_url: 'https://www.anycubic.com/products/hardened-steel-nozzle', price: 14.99, currency: 'USD' },
    ],
  },
  'QIDI Tech': {
    compatibility_pattern: /X-|Q[12]|Plus|Max/i,
    nozzles: [
      { name: '0.4mm Brass Nozzle', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 280, hardened: false }, product_url: 'https://ca.qidi3d.com/products/qidi-nozzle', price: 4.99, currency: 'USD' },
      { name: '0.6mm Brass Nozzle', specs: { diameter_mm: 0.6, material: 'brass', max_temp_c: 280, hardened: false }, product_url: 'https://ca.qidi3d.com/products/qidi-nozzle-0-6mm', price: 4.99, currency: 'USD' },
      { name: '0.4mm Hardened Steel Nozzle', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 350, hardened: true }, product_url: 'https://ca.qidi3d.com/products/qidi-hardened-nozzle', price: 19.99, currency: 'USD' },
    ],
  },
  'Elegoo': {
    compatibility_pattern: /Neptune|Centauri/i,
    nozzles: [
      { name: '0.4mm Brass Nozzle', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 260, hardened: false }, product_url: 'https://ca.elegoo.com/products/brass-nozzle', price: 2.99, currency: 'USD' },
      { name: '0.6mm Brass Nozzle', specs: { diameter_mm: 0.6, material: 'brass', max_temp_c: 260, hardened: false }, product_url: 'https://ca.elegoo.com/products/brass-nozzle-0-6mm', price: 2.99, currency: 'USD' },
      { name: '0.4mm Hardened Steel Nozzle', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 300, hardened: true }, product_url: 'https://ca.elegoo.com/products/hardened-steel-nozzle', price: 11.99, currency: 'USD' },
    ],
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { brandId, brandName } = await req.json();

    if (!brandId || !brandName) {
      return new Response(
        JSON.stringify({ error: 'brandId and brandName required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Adding nozzles for brand: ${brandName}`);

    const brandData = BRAND_NOZZLES[brandName];
    if (!brandData) {
      return new Response(
        JSON.stringify({ error: `No nozzle data for brand: ${brandName}. Supported brands: ${Object.keys(BRAND_NOZZLES).join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const allNozzles = brandData.nozzles;
    console.log(`Found ${allNozzles.length} nozzles for ${brandName}`);

    // Get all printers for this brand
    const { data: printers, error: printersError } = await supabase
      .from('printers')
      .select('id, model_name')
      .eq('brand_id', brandId);

    if (printersError) {
      throw printersError;
    }

    // Insert nozzles as accessories for compatible printers
    let insertCount = 0;
    for (const nozzle of allNozzles) {
      for (const printer of printers || []) {
        // Check if nozzle is compatible with printer
        const isCompatible = brandData.compatibility_pattern?.test(printer.model_name) ?? true;

        if (isCompatible) {
          const { error: insertError } = await supabase
            .from('printer_accessories')
            .upsert({
              printer_id: printer.id,
              accessory_type: 'nozzle',
              name: nozzle.name,
              specs: nozzle.specs,
              product_url: nozzle.product_url,
              price: nozzle.price,
              currency: nozzle.currency || 'USD',
            }, {
              onConflict: 'printer_id,name',
              ignoreDuplicates: false,
            });

          if (!insertError) {
            insertCount++;
          } else {
            console.error(`Error inserting nozzle ${nozzle.name} for printer ${printer.model_name}:`, insertError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        brand: brandName,
        nozzles_found: allNozzles.length,
        accessories_created: insertCount,
        printers_updated: printers?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
