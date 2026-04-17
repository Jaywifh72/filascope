/**
 * BAMBU LAB SYNC FUNCTION - MINIMAL TEST VERSION
 * This is a test to verify deployment works
 */

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    
    // Test variables that were causing issues
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    console.log(`[BambuLab] Test: created=${created}, updated=${updated}, skipped=${skipped}, errors=${errors}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Minimal test function works',
        dryRun,
        summary: { created, updated, skipped, errors }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
