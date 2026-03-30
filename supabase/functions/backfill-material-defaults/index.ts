import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MATERIAL_DEFAULTS: Record<string, {
  nozzle_min: number; nozzle_max: number; nozzle_sweet: number;
  bed_min: number; bed_max: number;
  drying_temp: number; drying_hours: number;
}> = {
  'PLA':       { nozzle_min: 190, nozzle_max: 220, nozzle_sweet: 210, bed_min: 20, bed_max: 60, drying_temp: 50, drying_hours: 4 },
  'PLA+':      { nozzle_min: 200, nozzle_max: 230, nozzle_sweet: 215, bed_min: 25, bed_max: 65, drying_temp: 55, drying_hours: 4 },
  'PLA-SILK':  { nozzle_min: 195, nozzle_max: 225, nozzle_sweet: 215, bed_min: 25, bed_max: 60, drying_temp: 50, drying_hours: 4 },
  'PLA-MATTE': { nozzle_min: 190, nozzle_max: 230, nozzle_sweet: 210, bed_min: 20, bed_max: 60, drying_temp: 50, drying_hours: 4 },
  'PLA-CF':    { nozzle_min: 200, nozzle_max: 240, nozzle_sweet: 220, bed_min: 25, bed_max: 65, drying_temp: 55, drying_hours: 4 },
  'PLA-WOOD':  { nozzle_min: 190, nozzle_max: 220, nozzle_sweet: 205, bed_min: 20, bed_max: 60, drying_temp: 50, drying_hours: 4 },
  'PLA-GLOW':  { nozzle_min: 190, nozzle_max: 220, nozzle_sweet: 210, bed_min: 20, bed_max: 60, drying_temp: 50, drying_hours: 4 },
  'PLA-HS':    { nozzle_min: 200, nozzle_max: 240, nozzle_sweet: 220, bed_min: 35, bed_max: 65, drying_temp: 55, drying_hours: 4 },
  'PETG':      { nozzle_min: 230, nozzle_max: 250, nozzle_sweet: 240, bed_min: 70, bed_max: 90, drying_temp: 65, drying_hours: 4 },
  'PETG-CF':   { nozzle_min: 240, nozzle_max: 260, nozzle_sweet: 250, bed_min: 70, bed_max: 85, drying_temp: 65, drying_hours: 4 },
  'PETG-HS':   { nozzle_min: 235, nozzle_max: 255, nozzle_sweet: 245, bed_min: 70, bed_max: 90, drying_temp: 65, drying_hours: 4 },
  'ABS':       { nozzle_min: 230, nozzle_max: 250, nozzle_sweet: 240, bed_min: 95, bed_max: 110, drying_temp: 80, drying_hours: 4 },
  'ASA':       { nozzle_min: 240, nozzle_max: 260, nozzle_sweet: 250, bed_min: 95, bed_max: 110, drying_temp: 80, drying_hours: 4 },
  'TPU':       { nozzle_min: 220, nozzle_max: 240, nozzle_sweet: 230, bed_min: 30, bed_max: 60, drying_temp: 60, drying_hours: 4 },
  'TPU-95A':   { nozzle_min: 225, nozzle_max: 245, nozzle_sweet: 235, bed_min: 30, bed_max: 60, drying_temp: 60, drying_hours: 4 },
  'TPU-85A':   { nozzle_min: 215, nozzle_max: 235, nozzle_sweet: 225, bed_min: 25, bed_max: 50, drying_temp: 60, drying_hours: 4 },
  'NYLON':     { nozzle_min: 240, nozzle_max: 270, nozzle_sweet: 255, bed_min: 70, bed_max: 90, drying_temp: 80, drying_hours: 8 },
  'PA6':       { nozzle_min: 240, nozzle_max: 270, nozzle_sweet: 255, bed_min: 70, bed_max: 90, drying_temp: 80, drying_hours: 8 },
  'PA12':      { nozzle_min: 240, nozzle_max: 265, nozzle_sweet: 250, bed_min: 70, bed_max: 90, drying_temp: 80, drying_hours: 8 },
  'PA-CF':     { nozzle_min: 250, nozzle_max: 280, nozzle_sweet: 265, bed_min: 80, bed_max: 100, drying_temp: 90, drying_hours: 8 },
  'PC':        { nozzle_min: 260, nozzle_max: 300, nozzle_sweet: 280, bed_min: 100, bed_max: 120, drying_temp: 80, drying_hours: 8 },
  'PC-ABS':    { nozzle_min: 250, nozzle_max: 270, nozzle_sweet: 260, bed_min: 95, bed_max: 110, drying_temp: 75, drying_hours: 6 },
  'HIPS':      { nozzle_min: 230, nozzle_max: 250, nozzle_sweet: 240, bed_min: 95, bed_max: 110, drying_temp: 65, drying_hours: 4 },
  'PVA':       { nozzle_min: 185, nozzle_max: 200, nozzle_sweet: 195, bed_min: 45, bed_max: 60, drying_temp: 45, drying_hours: 6 },
  'PVB':       { nozzle_min: 195, nozzle_max: 215, nozzle_sweet: 205, bed_min: 45, bed_max: 65, drying_temp: 50, drying_hours: 6 },
  'PEEK':      { nozzle_min: 380, nozzle_max: 420, nozzle_sweet: 400, bed_min: 120, bed_max: 160, drying_temp: 120, drying_hours: 12 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let body: { limit?: number } = {};
    try { body = await req.json(); } catch { /* no body */ }
    const limit = body.limit ?? 10000;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch filaments missing nozzle temp but with a known material
    const { data: filaments, error } = await supabase
      .from('filaments')
      .select('id, material, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, drying_temp_c, drying_time_hours')
      .is('nozzle_temp_min_c', null)
      .not('material', 'is', null)
      .limit(limit);

    if (error) throw error;
    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, updated: 0, by_material: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const patches: Record<string, unknown>[] = [];
    const byMaterial: Record<string, number> = {};

    for (const f of filaments) {
      const mat = (f.material ?? '').toUpperCase();
      // Find best matching key — try exact then prefix
      let defaults = MATERIAL_DEFAULTS[mat];
      if (!defaults) {
        for (const key of Object.keys(MATERIAL_DEFAULTS)) {
          if (mat.startsWith(key) || key.startsWith(mat)) { defaults = MATERIAL_DEFAULTS[key]; break; }
        }
      }
      if (!defaults) continue;

      const patch: Record<string, unknown> = { id: f.id };

      // Only fill NULL fields — never overwrite real data
      if (f.nozzle_temp_min_c === null) patch.nozzle_temp_min_c = defaults.nozzle_min;
      if (f.nozzle_temp_max_c === null) patch.nozzle_temp_max_c = defaults.nozzle_max;
      if (f.bed_temp_min_c    === null) patch.bed_temp_min_c    = defaults.bed_min;
      if (f.bed_temp_max_c    === null) patch.bed_temp_max_c    = defaults.bed_max;
      if (f.drying_temp_c     === null) patch.drying_temp_c     = defaults.drying_temp;
      if (f.drying_time_hours === null) patch.drying_time_hours = defaults.drying_hours;

      // Tag as low-confidence default (use admin_notes to track this)
      patch.admin_notes = `[temp:default:${mat}]`;

      patches.push(patch);
      byMaterial[mat] = (byMaterial[mat] ?? 0) + 1;
    }

    // Batch upsert in groups of 500
    for (let i = 0; i < patches.length; i += 500) {
      await supabase
        .from('filaments')
        .upsert(patches.slice(i, i + 500) as any[], { onConflict: 'id' });
    }

    console.log(`[backfill-material-defaults] processed=${filaments.length} updated=${patches.length}`);

    return new Response(
      JSON.stringify({ success: true, processed: filaments.length, updated: patches.length, by_material: byMaterial }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[backfill-material-defaults] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
