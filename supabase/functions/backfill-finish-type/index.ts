import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type FinishType =
  | 'Silk'
  | 'Matte'
  | 'Galaxy'
  | 'Glow'
  | 'Wood'
  | 'Marble'
  | 'Carbon Fiber'
  | 'Metal'
  | 'Standard';

function inferFinishType(title: string): FinishType {
  const t = title.toLowerCase();
  if (t.includes('silk'))                         return 'Silk';
  if (t.includes('matte'))                        return 'Matte';
  if (t.includes('galaxy') || t.includes('starlight')) return 'Galaxy';
  if (t.includes('glow') || t.includes('luminous'))    return 'Glow';
  if (t.includes('wood'))                         return 'Wood';
  if (t.includes('marble'))                       return 'Marble';
  if (t.includes('carbon') || t.includes(' cf') || t.includes('-cf')) return 'Carbon Fiber';
  if (t.includes('metal') || t.includes('copper') || t.includes('bronze')) return 'Metal';
  return 'Standard';
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

    const { data: filaments, error } = await supabase
      .from('filaments')
      .select('id, product_title')
      .is('finish_type', null)
      .not('product_title', 'is', null)
      .limit(limit);

    if (error) throw error;
    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const patches = filaments.map(f => ({
      id: f.id,
      finish_type: inferFinishType(f.product_title ?? ''),
    }));

    // Count by finish type for reporting
    const counts: Record<string, number> = {};
    for (const p of patches) {
      counts[p.finish_type] = (counts[p.finish_type] ?? 0) + 1;
    }

    // Batch upsert in groups of 500
    for (let i = 0; i < patches.length; i += 500) {
      await supabase
        .from('filaments')
        .upsert(patches.slice(i, i + 500), { onConflict: 'id' });
    }

    console.log(`[backfill-finish-type] processed=${filaments.length} by_type=${JSON.stringify(counts)}`);

    return new Response(
      JSON.stringify({ success: true, processed: filaments.length, updated: patches.length, by_type: counts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[backfill-finish-type] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
