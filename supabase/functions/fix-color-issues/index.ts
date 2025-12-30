import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a deterministic hex color from a string (product title)
function generateDeterministicHex(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const h = Math.abs(hash % 360);
  const s = 50 + Math.abs((hash >> 8) % 30);
  const l = 45 + Math.abs((hash >> 16) % 25);
  
  const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;
  
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { vendor } = await req.json();

    if (!vendor) {
      return new Response(
        JSON.stringify({ success: false, error: 'vendor is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[fix-color-issues] Fixing color issues for ${vendor}`);

    let nullsFixed = 0;
    let duplicatesFixed = 0;

    // STEP 1: Fix NULL hex codes
    const { data: nullHexFilaments, error: nullError } = await supabase
      .from('filaments')
      .select('id, product_title')
      .ilike('vendor', vendor)
      .is('color_hex', null);

    if (nullError) {
      console.error('[fix-color-issues] Error fetching NULL hex filaments:', nullError);
    } else if (nullHexFilaments?.length) {
      console.log(`[fix-color-issues] Found ${nullHexFilaments.length} filaments with NULL hex codes`);

      for (const filament of nullHexFilaments) {
        const uniqueHex = generateDeterministicHex(filament.product_title);

        const { error: updateError } = await supabase
          .from('filaments')
          .update({ color_hex: uniqueHex })
          .eq('id', filament.id);

        if (!updateError) {
          nullsFixed++;
          console.log(`[fix-color-issues] Fixed NULL hex for "${filament.product_title}" -> ${uniqueHex}`);
        }
      }
    }

    // STEP 2: Fix duplicate hex codes
    const { data: duplicates, error: dupError } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: vendor,
    });

    if (dupError) {
      console.error('[fix-color-issues] Error finding duplicates:', dupError);
    } else if (duplicates?.length) {
      console.log(`[fix-color-issues] Found ${duplicates.length} duplicate hex entries`);

      // Group duplicates by product_line_id and hex
      const groupedDupes: Record<string, any[]> = {};
      for (const dup of duplicates) {
        const key = `${dup.product_line_id}|${dup.color_hex?.toLowerCase()}`;
        if (!groupedDupes[key]) groupedDupes[key] = [];
        groupedDupes[key].push(dup);
      }

      // For each group, generate unique hexes for all but the first
      for (const [key, dupes] of Object.entries(groupedDupes)) {
        // Skip the first one (keep original hex), fix the rest
        for (let i = 1; i < dupes.length; i++) {
          const dup = dupes[i];
          const uniqueHex = generateDeterministicHex(dup.product_title);

          const { error: updateError } = await supabase
            .from('filaments')
            .update({ color_hex: uniqueHex })
            .eq('id', dup.id);

          if (!updateError) {
            duplicatesFixed++;
            console.log(`[fix-color-issues] Fixed duplicate hex for "${dup.product_title}" -> ${uniqueHex}`);
          }
        }
      }
    }

    console.log(`[fix-color-issues] Complete. NULLs fixed: ${nullsFixed}, Duplicates fixed: ${duplicatesFixed}`);

    return new Response(
      JSON.stringify({
        success: true,
        vendor,
        nullsFixed,
        duplicatesFixed,
        totalFixed: nullsFixed + duplicatesFixed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[fix-color-issues] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
