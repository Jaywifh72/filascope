import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PriceValidationEngine } from '../_shared/price-validation-engine.ts';

serve(async (req) => {
  try {
    // Parse request
    const { method } = req;
    
    if (method === 'GET') {
      // Return anomaly statistics
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: anomalies } = await supabase
        .from('price_anomalies')
        .select('*, brand:filaments(brand_slug)')
        .eq('is_resolved', false)
        .order('detected_at', { ascending: false })
        .limit(100);

      const { count } = await supabase
        .from('price_anomalies')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false);

      return new Response(
        JSON.stringify({
          success: true,
          total_unresolved: count,
          recent_anomalies: anomalies,
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST') {
      // Run anomaly detection
      const body = await req.json();
      const { brand_slug, detect_all = false } = body;

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const engine = new PriceValidationEngine();
      
      let results;
      if (detect_all) {
        console.log('Running anomaly detection for all brands...');
        const totalAnomalies = await engine.detectAllAnomalies();
        results = { mode: 'all', total_anomalies: totalAnomalies };
      } else if (brand_slug) {
        console.log(`Running anomaly detection for ${brand_slug}...`);
        results = await engine.validateBrandPrices(brand_slug);
      } else {
        return new Response(
          JSON.stringify({ error: 'Must specify brand_slug or detect_all=true' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get updated anomaly count
      const { count } = await supabase
        .from('price_anomalies')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Price anomaly detection completed',
          results,
          total_unresolved_anomalies: count,
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Price anomaly detection failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
