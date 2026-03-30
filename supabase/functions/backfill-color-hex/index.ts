import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getColorHex } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extract candidate color tokens from a product title.
 * Returns an ordered list of strings to try against the color map.
 * "Bambu PLA Matte - Jade White" → ["Jade White", "White"]
 */
function extractColorTokens(title: string): string[] {
  const tokens: string[] = [];

  // After last dash or comma
  const afterDash = title.split(/[-,]/).pop()?.trim();
  if (afterDash) {
    tokens.push(afterDash);
    // Individual words from the suffix
    const words = afterDash.split(/\s+/);
    if (words.length > 1) tokens.push(words[words.length - 1]);
  }

  // Full title (last resort)
  tokens.push(title);

  return [...new Set(tokens.filter(Boolean))];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let body: { limit?: number } = {};
    try { body = await req.json(); } catch { /* no body is fine */ }
    const limit = body.limit ?? 5000;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch filaments missing color_hex
    const { data: filaments, error } = await supabase
      .from('filaments')
      .select('id, product_title, color_family')
      .is('color_hex', null)
      .limit(limit);

    if (error) throw error;
    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, filled: 0, skipped: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let filled = 0;
    let skipped = 0;
    const patches: { id: string; color_hex: string }[] = [];

    for (const f of filaments) {
      let hex: string | null = null;

      // 1. Try color_family directly
      if (f.color_family) {
        hex = getColorHex(f.color_family) ?? null;
      }

      // 2. Try tokens extracted from product_title
      if (!hex && f.product_title) {
        const tokens = extractColorTokens(f.product_title);
        for (const tok of tokens) {
          const candidate = getColorHex(tok);
          if (candidate) { hex = candidate; break; }
        }
      }

      if (hex) {
        // Ensure #RRGGBB format
        const normalized = hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
        patches.push({ id: f.id, color_hex: normalized });
        filled++;
      } else {
        skipped++;
      }
    }

    // Batch update in groups of 500
    for (let i = 0; i < patches.length; i += 500) {
      const batch = patches.slice(i, i + 500);
      await supabase
        .from('filaments')
        .upsert(batch, { onConflict: 'id' });
    }

    console.log(`[backfill-color-hex] processed=${filaments.length} filled=${filled} skipped=${skipped}`);

    return new Response(
      JSON.stringify({ success: true, processed: filaments.length, filled, skipped }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[backfill-color-hex] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
