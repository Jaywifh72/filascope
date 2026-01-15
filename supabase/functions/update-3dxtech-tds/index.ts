import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';
import { get3DXTechTdsUrl } from '../_shared/3dxtech-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateResult {
  id: string;
  product_title: string;
  product_line_id: string | null;
  material: string | null;
  tds_url: string | null;
  status: 'updated' | 'skipped' | 'no_match';
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dryRun = false, forceOverwrite = false } = await req.json().catch(() => ({}));

    console.log(`Starting 3DXtech TDS URL update - dryRun: ${dryRun}, forceOverwrite: ${forceOverwrite}`);

    // Fetch all 3DXtech filaments
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_line_id, material, tds_url')
      .eq('vendor', '3DXtech')
      .order('product_title');

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${filaments?.length || 0} 3DXtech filaments`);

    const results: UpdateResult[] = [];
    let updatedCount = 0;
    let skippedCount = 0;
    let noMatchCount = 0;

    for (const filament of filaments || []) {
      const tdsUrl = get3DXTechTdsUrl(
        filament.product_line_id,
        filament.material,
        filament.product_title
      );

      if (!tdsUrl) {
        noMatchCount++;
        results.push({
          id: filament.id,
          product_title: filament.product_title,
          product_line_id: filament.product_line_id,
          material: filament.material,
          tds_url: null,
          status: 'no_match',
          reason: 'No TDS URL mapping found for this product',
        });
        continue;
      }

      // Skip if already has TDS URL and not forcing overwrite
      if (filament.tds_url && !forceOverwrite) {
        skippedCount++;
        results.push({
          id: filament.id,
          product_title: filament.product_title,
          product_line_id: filament.product_line_id,
          material: filament.material,
          tds_url: filament.tds_url,
          status: 'skipped',
          reason: 'Already has TDS URL',
        });
        continue;
      }

      // Update if not dry run
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ tds_url: tdsUrl, updated_at: new Date().toISOString() })
          .eq('id', filament.id);

        if (updateError) {
          console.error(`Failed to update ${filament.product_title}: ${updateError.message}`);
          results.push({
            id: filament.id,
            product_title: filament.product_title,
            product_line_id: filament.product_line_id,
            material: filament.material,
            tds_url: null,
            status: 'skipped',
            reason: `Update failed: ${updateError.message}`,
          });
          continue;
        }
      }

      updatedCount++;
      results.push({
        id: filament.id,
        product_title: filament.product_title,
        product_line_id: filament.product_line_id,
        material: filament.material,
        tds_url: tdsUrl,
        status: 'updated',
      });
    }

    const summary = {
      total: filaments?.length || 0,
      updated: updatedCount,
      skipped: skippedCount,
      noMatch: noMatchCount,
      dryRun,
      forceOverwrite,
    };

    console.log('Update complete:', summary);

    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
