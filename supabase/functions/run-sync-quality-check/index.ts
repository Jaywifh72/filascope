import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskResult {
  task: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  value: string | null;
  message?: string;
}

interface FilamentDetail {
  id: string;
  productTitle: string;
  material: string;
  colorFamily: string | null;
  overallStatus: 'pass' | 'warning' | 'fail';
  taskResults: TaskResult[];
}

interface TaskSummary {
  taskName: string;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  total: number;
  passRate: string;
}

interface QualityReport {
  generatedAt: string;
  totalFilaments: number;
  taskSummary: TaskSummary[];
  filamentDetails: FilamentDetail[];
  overallStats: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Quality Check] Starting comprehensive sync quality audit...');

    // Fetch all Elegoo filaments with relevant fields
    const { data: filaments, error } = await supabase
      .from('filaments')
      .select(`
        id,
        product_title,
        material,
        color_family,
        color_hex,
        variant_price,
        price_cad,
        price_eur,
        price_gbp,
        price_aud,
        price_jpy,
        product_url,
        product_url_ca,
        product_url_eu,
        product_url_uk,
        product_url_au,
        product_url_jp,
        featured_image,
        product_line_id,
        tds_url,
        nozzle_temp_min_c,
        nozzle_temp_max_c,
        bed_temp_min_c,
        bed_temp_max_c,
        drying_temp_c,
        drying_time_hours,
        density_g_cm3,
        vendor
      `)
      .eq('vendor', 'Elegoo')
      .order('product_title');

    if (error) {
      throw new Error(`Failed to fetch filaments: ${error.message}`);
    }

    console.log(`[Quality Check] Fetched ${filaments?.length || 0} Elegoo filaments`);

    const taskNames = [
      'Regional Prices',
      'Regional URLs',
      'Product Images',
      'Color Extraction',
      'Color Family',
      'Product Line Grouping',
      'TDS URL Captured',
      'TDS Temps Parsed',
      'TDS Drying Parsed',
      'TDS Density Parsed'
    ];

    // Initialize task summary
    const taskSummaryMap: Record<string, TaskSummary> = {};
    taskNames.forEach(name => {
      taskSummaryMap[name] = {
        taskName: name,
        passed: 0,
        failed: 0,
        warnings: 0,
        skipped: 0,
        total: 0,
        passRate: '0%'
      };
    });

    const filamentDetails: FilamentDetail[] = [];
    let overallPassed = 0;
    let overallWarnings = 0;
    let overallFailed = 0;

    for (const filament of filaments || []) {
      const taskResults: TaskResult[] = [];

      // 1. Regional Prices Check
      const prices = [
        { region: 'USD', value: filament.variant_price },
        { region: 'CAD', value: filament.price_cad },
        { region: 'EUR', value: filament.price_eur },
        { region: 'GBP', value: filament.price_gbp },
        { region: 'AUD', value: filament.price_aud },
        { region: 'JPY', value: filament.price_jpy }
      ].filter(p => p.value != null);
      
      const priceDisplay = prices.map(p => `${p.region}: ${p.value}`).join(', ') || 'None';
      if (prices.length >= 3) {
        taskResults.push({ task: 'Regional Prices', status: 'pass', value: priceDisplay });
        taskSummaryMap['Regional Prices'].passed++;
      } else if (prices.length >= 1) {
        taskResults.push({ task: 'Regional Prices', status: 'warning', value: priceDisplay, message: `Only ${prices.length} region(s)` });
        taskSummaryMap['Regional Prices'].warnings++;
      } else {
        taskResults.push({ task: 'Regional Prices', status: 'fail', value: null, message: 'No prices found' });
        taskSummaryMap['Regional Prices'].failed++;
      }
      taskSummaryMap['Regional Prices'].total++;

      // 2. Regional URLs Check
      const urls = [
        { region: 'US', value: filament.product_url },
        { region: 'CA', value: filament.product_url_ca },
        { region: 'EU', value: filament.product_url_eu },
        { region: 'UK', value: filament.product_url_uk },
        { region: 'AU', value: filament.product_url_au },
        { region: 'JP', value: filament.product_url_jp }
      ].filter(u => u.value != null);

      const urlDisplay = urls.map(u => u.region).join(', ') || 'None';
      if (urls.length >= 3) {
        taskResults.push({ task: 'Regional URLs', status: 'pass', value: urlDisplay });
        taskSummaryMap['Regional URLs'].passed++;
      } else if (urls.length >= 1) {
        taskResults.push({ task: 'Regional URLs', status: 'warning', value: urlDisplay, message: `Only ${urls.length} region(s)` });
        taskSummaryMap['Regional URLs'].warnings++;
      } else {
        taskResults.push({ task: 'Regional URLs', status: 'fail', value: null, message: 'No URLs found' });
        taskSummaryMap['Regional URLs'].failed++;
      }
      taskSummaryMap['Regional URLs'].total++;

      // 3. Product Images Check
      if (filament.featured_image) {
        taskResults.push({ task: 'Product Images', status: 'pass', value: '✓' });
        taskSummaryMap['Product Images'].passed++;
      } else {
        taskResults.push({ task: 'Product Images', status: 'warning', value: null, message: 'No image' });
        taskSummaryMap['Product Images'].warnings++;
      }
      taskSummaryMap['Product Images'].total++;

      // 4. Color Extraction Check
      if (filament.color_hex) {
        taskResults.push({ task: 'Color Extraction', status: 'pass', value: filament.color_hex });
        taskSummaryMap['Color Extraction'].passed++;
      } else {
        taskResults.push({ task: 'Color Extraction', status: 'warning', value: null, message: 'No hex color' });
        taskSummaryMap['Color Extraction'].warnings++;
      }
      taskSummaryMap['Color Extraction'].total++;

      // 5. Color Family Check
      if (filament.color_family) {
        taskResults.push({ task: 'Color Family', status: 'pass', value: filament.color_family });
        taskSummaryMap['Color Family'].passed++;
      } else {
        taskResults.push({ task: 'Color Family', status: 'warning', value: null, message: 'No color family' });
        taskSummaryMap['Color Family'].warnings++;
      }
      taskSummaryMap['Color Family'].total++;

      // 6. Product Line Grouping Check
      if (filament.product_line_id) {
        taskResults.push({ task: 'Product Line Grouping', status: 'pass', value: filament.product_line_id });
        taskSummaryMap['Product Line Grouping'].passed++;
      } else {
        taskResults.push({ task: 'Product Line Grouping', status: 'warning', value: null, message: 'Not grouped' });
        taskSummaryMap['Product Line Grouping'].warnings++;
      }
      taskSummaryMap['Product Line Grouping'].total++;

      // 7. TDS URL Captured Check
      const hasTds = !!filament.tds_url;
      if (hasTds) {
        taskResults.push({ task: 'TDS URL Captured', status: 'pass', value: '✓' });
        taskSummaryMap['TDS URL Captured'].passed++;
      } else {
        taskResults.push({ task: 'TDS URL Captured', status: 'skipped', value: null, message: 'No TDS available' });
        taskSummaryMap['TDS URL Captured'].skipped++;
      }
      taskSummaryMap['TDS URL Captured'].total++;

      // 8. TDS Temps Parsed Check (only if TDS exists)
      if (hasTds) {
        const hasTemps = filament.nozzle_temp_min_c != null && filament.nozzle_temp_max_c != null;
        if (hasTemps) {
          taskResults.push({ 
            task: 'TDS Temps Parsed', 
            status: 'pass', 
            value: `${filament.nozzle_temp_min_c}-${filament.nozzle_temp_max_c}°C nozzle, ${filament.bed_temp_min_c || '?'}-${filament.bed_temp_max_c || '?'}°C bed` 
          });
          taskSummaryMap['TDS Temps Parsed'].passed++;
        } else {
          taskResults.push({ task: 'TDS Temps Parsed', status: 'fail', value: null, message: 'Temps not parsed from TDS' });
          taskSummaryMap['TDS Temps Parsed'].failed++;
        }
        taskSummaryMap['TDS Temps Parsed'].total++;
      } else {
        taskResults.push({ task: 'TDS Temps Parsed', status: 'skipped', value: null, message: 'No TDS' });
        taskSummaryMap['TDS Temps Parsed'].skipped++;
        taskSummaryMap['TDS Temps Parsed'].total++;
      }

      // 9. TDS Drying Parsed Check
      if (hasTds) {
        const hasDrying = filament.drying_temp_c != null;
        if (hasDrying) {
          taskResults.push({ 
            task: 'TDS Drying Parsed', 
            status: 'pass', 
            value: `${filament.drying_temp_c}°C for ${filament.drying_time_hours || '?'}h` 
          });
          taskSummaryMap['TDS Drying Parsed'].passed++;
        } else {
          taskResults.push({ task: 'TDS Drying Parsed', status: 'fail', value: null, message: 'Drying info not parsed' });
          taskSummaryMap['TDS Drying Parsed'].failed++;
        }
        taskSummaryMap['TDS Drying Parsed'].total++;
      } else {
        taskResults.push({ task: 'TDS Drying Parsed', status: 'skipped', value: null, message: 'No TDS' });
        taskSummaryMap['TDS Drying Parsed'].skipped++;
        taskSummaryMap['TDS Drying Parsed'].total++;
      }

      // 10. TDS Density Parsed Check
      if (hasTds) {
        const hasDensity = filament.density_g_cm3 != null;
        if (hasDensity) {
          taskResults.push({ task: 'TDS Density Parsed', status: 'pass', value: `${filament.density_g_cm3} g/cm³` });
          taskSummaryMap['TDS Density Parsed'].passed++;
        } else {
          taskResults.push({ task: 'TDS Density Parsed', status: 'fail', value: null, message: 'Density not parsed' });
          taskSummaryMap['TDS Density Parsed'].failed++;
        }
        taskSummaryMap['TDS Density Parsed'].total++;
      } else {
        taskResults.push({ task: 'TDS Density Parsed', status: 'skipped', value: null, message: 'No TDS' });
        taskSummaryMap['TDS Density Parsed'].skipped++;
        taskSummaryMap['TDS Density Parsed'].total++;
      }

      // Calculate overall status for this filament
      const hasFail = taskResults.some(t => t.status === 'fail');
      const hasWarning = taskResults.some(t => t.status === 'warning');
      let overallStatus: 'pass' | 'warning' | 'fail';
      
      if (hasFail) {
        overallStatus = 'fail';
        overallFailed++;
      } else if (hasWarning) {
        overallStatus = 'warning';
        overallWarnings++;
      } else {
        overallStatus = 'pass';
        overallPassed++;
      }

      filamentDetails.push({
        id: filament.id,
        productTitle: filament.product_title,
        material: filament.material || 'Unknown',
        colorFamily: filament.color_family,
        overallStatus,
        taskResults
      });
    }

    // Calculate pass rates for summary
    const taskSummary = Object.values(taskSummaryMap).map(task => {
      const applicable = task.total - task.skipped;
      const passRate = applicable > 0 
        ? ((task.passed / applicable) * 100).toFixed(1) + '%'
        : 'N/A';
      return { ...task, passRate };
    });

    const report: QualityReport = {
      generatedAt: new Date().toISOString(),
      totalFilaments: filaments?.length || 0,
      taskSummary,
      filamentDetails,
      overallStats: {
        passed: overallPassed,
        warnings: overallWarnings,
        failed: overallFailed
      }
    };

    console.log(`[Quality Check] Complete. ${overallPassed} passed, ${overallWarnings} warnings, ${overallFailed} failed`);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Quality Check] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
