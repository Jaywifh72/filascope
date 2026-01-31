import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REGIONS = ['US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN'];

interface RegionResult {
  region: string;
  tested: number;
  passed: number;
  failed: number;
  issues: string[];
}

interface HealthCheckResult {
  timestamp: string;
  overall_pass_rate: number;
  total_tested: number;
  total_passed: number;
  total_failed: number;
  by_region: RegionResult[];
  critical_issues: string[];
  stale_prices_count: number;
  missing_stores_count: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting weekly health check...");

    const results: HealthCheckResult = {
      timestamp: new Date().toISOString(),
      overall_pass_rate: 0,
      total_tested: 0,
      total_passed: 0,
      total_failed: 0,
      by_region: [],
      critical_issues: [],
      stale_prices_count: 0,
      missing_stores_count: 0,
    };

    // Get 10 random products for spot checking
    const { data: randomProducts, error: productsError } = await supabase
      .from("filaments")
      .select("id, product_title, vendor, variant_price, price_cad, price_eur, price_gbp, price_aud, last_scraped_at")
      .eq("variant_available", true)
      .not("variant_price", "is", null)
      .limit(70)
      .order("id");

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    // Randomly select 10 products per region (with overlap)
    const shuffled = randomProducts?.sort(() => Math.random() - 0.5) || [];

    for (const region of REGIONS) {
      const regionResult: RegionResult = {
        region,
        tested: 0,
        passed: 0,
        failed: 0,
        issues: [],
      };

      // Take 10 products for this region
      const testProducts = shuffled.slice(0, 10);

      for (const product of testProducts) {
        regionResult.tested++;
        let hasIssue = false;

        // Check if price exists for region
        let hasPrice = product.variant_price != null;
        
        if (region === 'CA' && !product.price_cad) hasPrice = false;
        if (region === 'EU' && !product.price_eur) hasPrice = false;
        if (region === 'UK' && !product.price_gbp) hasPrice = false;
        if (region === 'AU' && !product.price_aud) hasPrice = false;

        // For regions without direct columns, we rely on conversion
        // So they pass if base USD price exists

        if (!hasPrice && region !== 'US' && region !== 'JP' && region !== 'CN') {
          hasIssue = true;
          regionResult.issues.push(`${product.product_title}: No ${region} price`);
        }

        // Check freshness (> 30 days is a failure)
        if (product.last_scraped_at) {
          const lastScraped = new Date(product.last_scraped_at);
          const daysSince = (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince > 30) {
            hasIssue = true;
            regionResult.issues.push(`${product.product_title}: Price ${Math.round(daysSince)} days old`);
          }
        } else {
          hasIssue = true;
          regionResult.issues.push(`${product.product_title}: Never scraped`);
        }

        if (hasIssue) {
          regionResult.failed++;
        } else {
          regionResult.passed++;
        }
      }

      results.by_region.push(regionResult);
      results.total_tested += regionResult.tested;
      results.total_passed += regionResult.passed;
      results.total_failed += regionResult.failed;
    }

    // Calculate overall pass rate
    results.overall_pass_rate = results.total_tested > 0
      ? Math.round((results.total_passed / results.total_tested) * 100)
      : 0;

    // Count stale prices (> 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: staleCount } = await supabase
      .from("filaments")
      .select("id", { count: "exact", head: true })
      .eq("variant_available", true)
      .not("variant_price", "is", null)
      .or(`last_scraped_at.is.null,last_scraped_at.lt.${sevenDaysAgo}`);
    
    results.stale_prices_count = staleCount || 0;

    // Count brands without regional stores
    const { data: brands } = await supabase
      .from("automated_brands")
      .select("id")
      .eq("is_visible", true);

    const { data: stores } = await supabase
      .from("brand_regional_stores")
      .select("brand_id")
      .eq("is_active", true);

    const brandsWithStores = new Set(stores?.map(s => s.brand_id) || []);
    results.missing_stores_count = (brands?.length || 0) - brandsWithStores.size;

    // Identify critical issues
    if (results.overall_pass_rate < 80) {
      results.critical_issues.push(`Overall pass rate (${results.overall_pass_rate}%) below 80% threshold`);
    }
    if (results.stale_prices_count > 100) {
      results.critical_issues.push(`${results.stale_prices_count} products have stale prices (>7 days)`);
    }
    if (results.missing_stores_count > 10) {
      results.critical_issues.push(`${results.missing_stores_count} brands have no regional stores configured`);
    }

    // Check region-specific issues
    for (const regionResult of results.by_region) {
      const regionPassRate = regionResult.tested > 0
        ? Math.round((regionResult.passed / regionResult.tested) * 100)
        : 0;
      if (regionPassRate < 70) {
        results.critical_issues.push(`${regionResult.region} region has only ${regionPassRate}% pass rate`);
      }
    }

    // Store the result in admin_activity_log
    await supabase.from("admin_activity_log").insert({
      action_type: "weekly_health_check",
      entity_type: "system",
      details: {
        result: results,
        run_type: "automated",
      },
    });

    // Update health check metrics in a dedicated table or key-value store
    // For now, we'll rely on the activity log

    console.log("Weekly health check completed:", {
      passRate: results.overall_pass_rate,
      tested: results.total_tested,
      criticalIssues: results.critical_issues.length,
    });

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in weekly health check:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
