/**
 * UPDATE BAMBU LAB VARIANT URLS
 * 
 * One-time migration function to update existing Bambu Lab filaments
 * with variant-specific product URLs from the CSV data.
 * 
 * This ensures "Buy Now" buttons on filament detail pages open
 * the correct color variant page on the Bambu Lab store.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== VARIANT ID MAPPING FROM CSV DATA ==========
// Maps product slug + normalized color name to Bambu Lab variant ID
const BAMBULAB_VARIANT_IDS: Record<string, Record<string, string>> = {
  // ========== PLA BASIC ==========
  'pla-basic-filament': {
    'jade white': '43115681841392',
    'beige': '43115681972464',
    'light gray': '46130966691056',
    'yellow': '43115682300144',
    'sunflower yellow': '46130953814256',
    'gold': '43115682234608',
    'pumpkin orange': '46130944770288',
    'orange': '43115682169072',
    'bright green': '46130957711600',
    'bambu green': '43115682103536',
    'mistletoe green': '46130961252592',
    'pink': '43115682332912',
    'hot pink': '46130959087856',
    'magenta': '43115682038000',
    'red': '43115681939696',
    'maroon red': '46130949750000',
    'purple': '46130970329328',
    'indigo purple': '46130955516144',
    'turquoise': '46130943525104',
    'cyan': '46311971913968',
    'cobalt blue': '46130948701424',
    'blue': '46130971902192',
    'brown': '46311969980656',
    'cocoa brown': '46130960892144',
    'bronze': '43115681906928',
    'gray': '46311972241648',
    'silver': '43115682267376',
    'blue grey': '46311970176240',
    'dark gray': '46541052608752',
    'black': '46311973454064',
  },
  // ========== PLA MATTE ==========
  'pla-matte': {
    'matte ivory white': '43197757661424',
    'matte bone white': '46334124245232',
    'matte lemon yellow': '43197757759728',
    'matte mandarin orange': '43197757792496',
    'matte sakura pink': '43197757825264',
    'matte lilac purple': '43197757858032',
    'matte plum': '46334126997744',
    'matte scarlet red': '43197757890800',
    'matte dark red': '43197757923568',
    'matte apple green': '46334121787632',
    'matte grass green': '43197757956336',
    'matte dark green': '43197757989104',
    'matte ice blue': '43197758021872',
    'matte sky blue': '46334125457648',
    'matte marine blue': '43197758054640',
    'matte dark blue': '43197758087408',
    'matte desert tan': '43197758120176',
    'matte latte brown': '43197758152944',
    'matte caramel': '46334117822704',
    'matte terracotta': '46334123327728',
    'matte dark brown': '43197758185712',
    'matte dark chocolate': '46334119886064',
    'matte ash gray': '43197758218480',
    'matte nardo gray': '46334115333360',
    'matte charcoal': '43197758251248',
  },
  // ========== PLA SILK+ ==========
  'pla-silk-upgrade': {
    'gold': '46334133027056',
    'titan gray': '46334134927600',
    'silver': '46334136008944',
    'white': '46334134010096',
    'candy red': '46334130188528',
    'candy green': '46334128648432',
    'mint': '46334132175088',
    'blue': '46130990971120',
    'baby blue': '46334131290352',
    'purple': '46130993516784',
    'rose gold': '46130984122608',
    'pink': '46130986210544',
    'champagne': '46130980321520',
  },
  // ========== PLA TRANSLUCENT ==========
  'pla-translucent': {
    'teal': '46334115922160',
    'blue': '46334114349296',
    'purple': '46334117003504',
    'orange': '46334111334640',
    'red': '46334112776432',
    'light jade': '46334105567472',
    'mellow yellow': '46334110155056',
    'cherry pink': '46334108615024',
    'ice blue': '46334106812656',
    'lavender': '46541073383664',
  },
  // ========== PLA TOUGH+ ==========
  'pla-tough-upgrade': {
    'yellow': '46840345624816',
    'white': '46840343462128',
    'orange': '46840347885808',
    'gray': '46840350081264',
    'silver': '46840352211184',
    'cyan': '46840354406640',
    'black': '46840356536560',
  },
  // ========== PLA BASIC GRADIENT ==========
  'pla-basic-gradient': {
    'ocean to meadow': '46611824443632',
    'solar breeze': '46611822281040',
    'arctic whisper': '46611826606224',
    'pink citrus': '45520665657584',
    'mint lime': '45520670736624',
    'dusk glare': '45520668573936',
    'blueberry bubblegum': '45520672899312',
    'cotton candy cloud': '45520675061904',
  },
  // ========== PLA WOOD ==========
  'pla-wood': {
    'black walnut': '46334094130416',
    'rosewood': '46334092524784',
    'clay brown': '46334090886384',
    'classic birch': '46334089281776',
    'white oak': '46334087676144',
    'ochre yellow': '46334085972208',
  },
  // ========== PLA MARBLE ==========
  'pla-marble': {
    'red granite': '46611794297072',
    'white marble': '46611792068848',
  },
  // ========== PLA METAL ==========
  'pla-metal': {
    'cobalt blue metallic': '46611854524656',
    'oxide green metallic': '46611856523504',
    'iridium gold metallic': '46611858358512',
    'copper brown metallic': '46611860357360',
    'iron gray metallic': '46611852394736',
  },
  // ========== PLA SILK MULTI-COLOR ==========
  'pla-silk-multi-color': {
    'dawn radiance': '46130992402672',
    'aurora purple': '46130994696368',
    'south beach': '46130982505712',
    'phantom blue': '46130986538224',
    'mystic magenta': '46130988462320',
    'velvet eclipse': '46130990316784',
    'neon city': '46611832897776',
    'midnight blaze': '46611834798320',
    'gilded rose': '46611838534896',
    'blue hawaii': '46611836599536',
  },
  // ========== PLA GALAXY ==========
  'pla-galaxy': {
    'purple': '46611807469808',
    'green': '46611805536496',
    'nebulae': '46611809303792',
    'brown': '46611803603184',
  },
  // ========== PLA GLOW ==========
  'pla-glow': {
    'glow green': '46611816055024',
    'glow pink': '46611818053872',
    'glow blue': '46611819987184',
    'glow orange': '46611821821168',
    'glow yellow': '46611813958896',
  },
  // ========== PLA SPARKLE ==========
  'pla-sparkle': {
    'alpine green sparkle': '46611844529392',
    'royal purple sparkle': '46611846462704',
    'slate gray sparkle': '46611848428784',
    'crimson red sparkle': '46611850362096',
    'onyx black sparkle': '46611840694512',
    'classic gold sparkle': '46611842594960',
  },
  // ========== PLA-CF ==========
  'pla-cf': {
    'burgundy red': '46611884409072',
    'jeans blue': '46611886375152',
    'black': '44135628243184',
    'matcha green': '46611888243056',
    'royal blue': '685556159890481155',
    'iris purple': '46611890144624',
    'lava gray': '46611892012528',
  },
  // ========== PLA AERO ==========
  'pla-aero': {
    'white': '45636548755696',
    'black': '45636550721776',
    'gray': '45636553802992',
  },
  // ========== ABS ==========
  'abs-filament': {
    'black': '43115678859504',
    'silver': '46541030883568',
    'white': '43115678892272',
    'bambu green': '46130964955376',
    'olive': '46311956513008',
    'azure': '46311955202288',
    'blue': '43115678990576',
    'navy blue': '46311953203440',
    'tangerine yellow': '46311958282480',
    'orange': '46130970886384',
    'red': '43115678925040',
    'purple': '46541030916336',
  },
  // ========== ASA ==========
  'asa-filament': {
    'white': '44173925744880',
    'green': '44173925646576',
    'gray': '44173925777648',
    'red': '44173925613808',
    'blue': '44173925679344',
    'black': '44173925712112',
  },
  // ========== ASA AERO ==========
  'asa-aero': {
    'white': '45647640101104',
  },
  // ========== ABS-GF ==========
  'abs-gf': {
    'orange': '45758386569456',
    'green': '45758386667760',
    'red': '45758386634992',
    'yellow': '45758386602224',
    'blue': '46010148454640',
    'white': '45758386438384',
    'gray': '45758386536688',
    'black': '45758386503920',
  },
  // ========== ASA-CF ==========
  'asa-cf': {
    'black': '46611883360496',
  },
  // ========== PETG HF ==========
  'petg-hf': {
    'red': '46336540737776',
    'black': '46336540803312',
    'lake blue': '46547460489456',
    'blue': '46336540934384',
    'white': '46336540868848',
    'gray': '46336540999920',
    'dark gray': '46547453608176',
    'cream': '46547456131312',
    'yellow': '46336540541168',
    'lime green': '46547458588912',
    'green': '46336540672240',
    'forest green': '46547440304368',
    'orange': '46336540606704',
    'peanut brown': '46547447644400',
  },
  // ========== PETG TRANSLUCENT ==========
  'petg-translucent': {
    'clear': '46311961984240',
    'translucent gray': '46311963196656',
    'translucent light blue': '46311962508528',
    'translucent teal': '46311962279152',
    'translucent olive': '46334027956464',
    'translucent brown': '46352469885168',
    'translucent orange': '46311964246256',
    'translucent pink': '46311967850736',
    'translucent purple': '46311965098224',
  },
  // ========== PETG-CF ==========
  'petg-cf': {
    'indigo blue': '44180162150640',
    'brick red': '44180162117872',
    'malachite green': '44180162183408',
    'violet purple': '44180162085104',
    'black': '43887125266672',
    'titan gray': '44326019367152',
  },
  // ========== PA6-GF ==========
  'pa6-gf': {
    'blue': '45444547805424',
    'orange': '45444547838192',
    'yellow': '45444547870960',
    'lime': '45444547903728',
    'brown': '45444547936496',
    'white': '45444547969264',
    'gray': '45444548002032',
    'black': '45444548034800',
  },
  // ========== PA6-CF ==========
  'pa6-cf': {
    'black': '45444548067568',
  },
  // ========== PAHT-CF ==========
  'paht-cf': {
    'black': '44142217371888',
  },
  // ========== PET-CF ==========
  'pet-cf': {
    'black': '44142217404656',
  },
  // ========== PPA-CF ==========
  'ppa-cf': {
    'black': '46498167718128',
  },
  // ========== PC ==========
  'pc-filament': {
    'transparent': '44080188621040',
    'clear black': '44080188588272',
    'black': '43584501842160',
    'white': '43584501874928',
  },
  // ========== PC FR ==========
  'pc-fr': {
    'black': '546460344590610440',
    'white': '546460344590610446',
    'gray': '546460344590610452',
  },
  // ========== PPS-CF ==========
  'pps-cf': {
    'black': '46512619127024',
  },
  // ========== SUPPORT MATERIALS ==========
  'pva': {
    'clear': '45303868227824',
  },
  'support-for-pla-petg': {
    'nature': '46214534594800',
    'black': '46840425578736',
  },
  'support-for-pla-new': {
    'white': '579081062845280263',
  },
  'support-for-pa-pet': {
    'green': '43181727580400',
  },
  'support-for-abs': {
    'white': '46333844160752',
  },
  // ========== TPU 85A/90A ==========
  'tpu-85a-tpu-90a': {
    'frozen': '573761482377510924',
    'blaze': '573761482377510930',
    'white': '672317379708768257',
    'black': '573761482377510942',
    'grape jelly': '679919043689914375',
    'crystal blue': '679919043689914381',
    'cocoa brown': '679919043689914387',
    'neon orange': '668354619028484097',
    'light cyan': '573761482377510954',
    'flesh': '679919043689914399',
    'lime green': '679919043689914405',
  },
  // ========== TPU 95A HF ==========
  'tpu-95a-hf': {
    'white': '44405012300016',
    'black': '44405012201712',
    'gray': '44405012332784',
    'yellow': '44405012365552',
    'blue': '44405012398320',
    'red': '44405012431088',
  },
  // ========== TPU FOR AMS ==========
  'tpu-for-ams': {
    'blue': '46779647361264',
    'gray': '46779647459568',
    'black': '46779647492336',
    'orange': '46779647525104',
    'bambu green': '46779647557872',
    'yellow': '46779647328496',
    'red': '46779647295728',
    'neon green': '46779647394032',
    'white': '46779647426800',
  },
};

// Product slug mappings for product_line_id normalization
// Maps product_line_id (double underscore format) to product slug for variant lookup
const PRODUCT_LINE_SLUG_MAP: Record<string, string> = {
  // PLA variants
  'bambulab__pla__basic': 'pla-basic-filament',
  'bambulab__pla__matte': 'pla-matte',
  'bambulab__pla__silk': 'pla-silk-upgrade',
  'bambulab__pla__translucent': 'pla-translucent',
  'bambulab__pla__tough': 'pla-tough-upgrade',
  'bambulab__pla__basic-gradient': 'pla-basic-gradient',
  'bambulab__pla__wood': 'pla-wood',
  'bambulab__pla__marble': 'pla-marble',
  'bambulab__pla__metal': 'pla-metal',
  'bambulab__pla__silk-multicolor': 'pla-silk-multi-color',
  'bambulab__pla__galaxy': 'pla-galaxy',
  'bambulab__pla__glow': 'pla-glow',
  'bambulab__pla__sparkle': 'pla-sparkle',
  'bambulab__pla__aero': 'pla-aero',
  // PLA-CF
  'bambulab__pla-cf__composite': 'pla-cf',
  // ABS variants
  'bambulab__abs__standard': 'abs-filament',
  'bambulab__abs-gf__composite': 'abs-gf',
  // ASA variants
  'bambulab__asa__standard': 'asa-filament',
  'bambulab__asa__aero': 'asa-aero',
  'bambulab__asa-cf__composite': 'asa-cf',
  // PETG variants
  'bambulab__petg__hf': 'petg-hf',
  'bambulab__petg__translucent': 'petg-translucent',
  'bambulab__petg-cf__composite': 'petg-cf',
  // PA variants
  'bambulab__pa-gf__pa6': 'pa6-gf',
  'bambulab__pa-cf__pa6': 'pa6-cf',
  'bambulab__pa-cf__paht': 'paht-cf',
  'bambulab__pa-cf__ppa': 'ppa-cf',
  // PC variants
  'bambulab__pc__standard': 'pc-filament',
  'bambulab__pc__fr': 'pc-fr',
  // Other composites
  'bambulab__pps-cf__composite': 'pps-cf',
  'bambulab__pet-cf__composite': 'pet-cf',
  // Support materials
  'bambulab__pva__standard': 'pva',
  'bambulab__support__pla-petg': 'support-for-pla-petg',
  'bambulab__support__pla-new': 'support-for-pla-new',
  'bambulab__support__pa-pet': 'support-for-pa-pet',
  'bambulab__support__abs': 'support-for-abs',
  // TPU variants
  'bambulab__tpu__85a-90a': 'tpu-85a-tpu-90a',
  'bambulab__tpu__95a-hf': 'tpu-95a-hf',
  'bambulab__tpu__ams': 'tpu-for-ams',
};

function normalizeColorName(colorFamily: string | null, productTitle: string): string {
  // Try color_family first
  if (colorFamily) {
    return colorFamily.toLowerCase().trim();
  }
  
  // Extract color from product title as fallback
  const match = productTitle.match(/(?:PLA|PETG|ABS|ASA|TPU|PA|PC|PPS|PVA)[\w\s+-]*?\s+(.+)$/i);
  if (match) {
    return match[1].toLowerCase().trim();
  }
  
  return productTitle.toLowerCase().trim();
}

function getProductSlug(productLineId: string | null, productTitle: string): string | null {
  // Try direct mapping from product_line_id
  if (productLineId) {
    const slug = PRODUCT_LINE_SLUG_MAP[productLineId.toLowerCase()];
    if (slug) return slug;
  }
  
  // Try to infer from product title
  const titleLower = productTitle.toLowerCase();
  
  if (titleLower.includes('pla basic gradient') || titleLower.includes('pla gradient')) {
    return 'pla-basic-gradient';
  }
  if (titleLower.includes('pla basic')) return 'pla-basic-filament';
  if (titleLower.includes('pla matte')) return 'pla-matte';
  if (titleLower.includes('pla silk') && titleLower.includes('multi')) return 'pla-silk-multi-color';
  if (titleLower.includes('pla silk')) return 'pla-silk-upgrade';
  if (titleLower.includes('pla translucent')) return 'pla-translucent';
  if (titleLower.includes('pla tough')) return 'pla-tough-upgrade';
  if (titleLower.includes('pla wood')) return 'pla-wood';
  if (titleLower.includes('pla marble')) return 'pla-marble';
  if (titleLower.includes('pla metal')) return 'pla-metal';
  if (titleLower.includes('pla galaxy')) return 'pla-galaxy';
  if (titleLower.includes('pla glow')) return 'pla-glow';
  if (titleLower.includes('pla sparkle')) return 'pla-sparkle';
  if (titleLower.includes('pla-cf') || titleLower.includes('pla cf')) return 'pla-cf';
  if (titleLower.includes('pla aero')) return 'pla-aero';
  if (titleLower.includes('abs-gf') || titleLower.includes('abs gf')) return 'abs-gf';
  if (titleLower.includes('asa-cf') || titleLower.includes('asa cf')) return 'asa-cf';
  if (titleLower.includes('asa aero')) return 'asa-aero';
  if (titleLower.includes('asa')) return 'asa-filament';
  if (titleLower.includes('abs')) return 'abs-filament';
  if (titleLower.includes('petg hf') || titleLower.includes('petg-hf')) return 'petg-hf';
  if (titleLower.includes('petg translucent')) return 'petg-translucent';
  if (titleLower.includes('petg-cf') || titleLower.includes('petg cf')) return 'petg-cf';
  if (titleLower.includes('pa6-gf') || titleLower.includes('pa6 gf')) return 'pa6-gf';
  if (titleLower.includes('ppa-cf') || titleLower.includes('ppa cf')) return 'ppa-cf';
  if (titleLower.includes('pc fr') || titleLower.includes('pc-fr')) return 'pc-fr';
  if (titleLower.includes('pc ')) return 'pc-filament';
  if (titleLower.includes('pps-cf') || titleLower.includes('pps cf')) return 'pps-cf';
  if (titleLower.includes('pva')) return 'pva';
  if (titleLower.includes('support') && titleLower.includes('pla') && titleLower.includes('petg')) return 'support-for-pla-petg';
  if (titleLower.includes('support') && titleLower.includes('pla')) return 'support-for-pla-new';
  if (titleLower.includes('support') && (titleLower.includes('pa') || titleLower.includes('pet'))) return 'support-for-pa-pet';
  if (titleLower.includes('support') && titleLower.includes('abs')) return 'support-for-abs';
  if (titleLower.includes('tpu') && titleLower.includes('ams')) return 'tpu-for-ams';
  if (titleLower.includes('tpu 95a') || titleLower.includes('tpu-95a')) return 'tpu-95a-hf';
  if (titleLower.includes('tpu 85a') || titleLower.includes('tpu 90a')) return 'tpu-85a-tpu-90a';
  
  return null;
}

function getVariantUrl(productSlug: string, colorName: string): string | null {
  const normalizedColor = colorName.toLowerCase().trim();
  const variantId = BAMBULAB_VARIANT_IDS[productSlug]?.[normalizedColor];
  
  if (!variantId) return null;
  
  return `https://us.store.bambulab.com/products/${productSlug}?id=${variantId}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Starting Bambu Lab URL update...');

    // Fetch all Bambu Lab filaments
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, color_family, product_line_id')
      .eq('vendor', 'Bambu Lab');

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} Bambu Lab filaments`);

    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    const updates: Array<{ id: string; newUrl: string; oldUrl: string | null }> = [];
    const notFoundList: Array<{ title: string; slug: string | null; color: string }> = [];

    for (const filament of filaments || []) {
      const productSlug = getProductSlug(filament.product_line_id, filament.product_title);
      
      if (!productSlug) {
        skipped++;
        continue;
      }

      const colorName = normalizeColorName(filament.color_family, filament.product_title);
      const newUrl = getVariantUrl(productSlug, colorName);

      if (!newUrl) {
        notFound++;
        notFoundList.push({
          title: filament.product_title,
          slug: productSlug,
          color: colorName,
        });
        continue;
      }

      // Check if URL already has variant ID
      if (filament.product_url?.includes('?id=')) {
        skipped++;
        continue;
      }

      updates.push({
        id: filament.id,
        newUrl,
        oldUrl: filament.product_url,
      });
    }

    console.log(`Updates to perform: ${updates.length}`);
    console.log(`Skipped (already has variant ID): ${skipped}`);
    console.log(`Not found in mapping: ${notFound}`);

    // Perform batch updates
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ product_url: update.newUrl })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Failed to update ${update.id}: ${updateError.message}`);
      } else {
        updated++;
        console.log(`Updated: ${update.oldUrl} -> ${update.newUrl}`);
      }
    }

    // Log first 10 not found for debugging
    if (notFoundList.length > 0) {
      console.log('Sample not found entries:');
      notFoundList.slice(0, 10).forEach(nf => {
        console.log(`  - ${nf.title} (slug: ${nf.slug}, color: ${nf.color})`);
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Updated ${updated} Bambu Lab filaments with variant-specific URLs`,
      stats: {
        total: filaments?.length || 0,
        updated,
        skipped,
        notFound,
        notFoundSample: notFoundList.slice(0, 10),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
