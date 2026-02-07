import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeIlikeInput } from "../_shared/sanitize-input.ts";
import { getBrandFixPrompt, MODULARIZED_BRANDS } from '../_shared/post-sync-check/brand-prompts/index.ts';
import { CheckResult, PostSyncCheckReport } from '../_shared/post-sync-check/types.ts';
import { 
  IMAGE_SWATCH_BRANDS, 
  PRODUCT_LEVEL_IMAGE_BRANDS, 
  CSV_SEEDED_BRANDS,
  SCRAPER_BLOCKED_BRANDS,
} from '../_shared/post-sync-check/brand-config.ts';
import { 
  extractColorFromTitle,
  calculateOverallStatus,
  shouldSkipUrlCheck,
  shouldSkipTitleCheck,
  shouldSkipHexCheck,
  shouldSkipPriceCheck,
} from '../_shared/post-sync-check/check-helpers.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Main request handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { brandSlug } = await req.json();
    
    if (!brandSlug) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing brandSlug parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[PostSyncCheck] Starting check for brand: ${brandSlug}`);

    // Fetch brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('brand_name, brand_slug')
      .eq('brand_slug', brandSlug)
      .single();

    if (!brand) {
      return new Response(
        JSON.stringify({ success: false, error: `Brand not found: ${brandSlug}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brandName = brand.brand_name;
    const checks: CheckResult[] = [];

    // Fetch all filaments for this brand
    const { data: filaments, count: totalProducts } = await supabase
      .from('filaments')
      .select('id, product_title, product_line_id, color_hex, color_family, material, variant_price, featured_image, product_url, vendor', { count: 'exact' })
      .ilike('vendor', sanitizeIlikeInput(brandName));

    console.log(`[PostSyncCheck] Found ${totalProducts} products for ${brandName}`);

    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          report: {
            generatedAt: new Date().toISOString(),
            brand: brandName,
            brandSlug,
            totalProducts: 0,
            checks: [],
            overallStatus: 'pass',
            scrapedProducts: 0,
            scrapeErrors: [],
            aiFixPrompt: null,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== CHECK 1: Product Count Validation ==========
    const expectedMinProducts = CSV_SEEDED_BRANDS.includes(brandSlug) ? 10 : 5;
    checks.push({
      checkName: "Product Count",
      status: (totalProducts || 0) >= expectedMinProducts ? "pass" : "warning",
      count: totalProducts || 0,
      details: `Found ${totalProducts} products (minimum expected: ${expectedMinProducts})`,
    });

    // ========== CHECK 2: Price Validity ==========
    if (!shouldSkipPriceCheck(brandSlug)) {
      const productsWithPrice = filaments.filter(f => f.variant_price && f.variant_price > 0);
      const productsWithReasonablePrice = productsWithPrice.filter(f => 
        f.variant_price! >= 5 && f.variant_price! <= 500
      );
      const priceIssues = productsWithPrice.length - productsWithReasonablePrice.length;

      checks.push({
        checkName: "Price Validity",
        status: priceIssues === 0 ? "pass" : priceIssues <= 5 ? "warning" : "fail",
        count: productsWithReasonablePrice.length,
        details: priceIssues === 0 
          ? `All ${productsWithPrice.length} products have valid prices ($5-$500)`
          : `${priceIssues} products have suspicious prices`,
      });
    } else {
      checks.push({
        checkName: "Price Validity",
        status: "skipped",
        count: 0,
        details: `Skipped for ${brandSlug} (complex multi-region pricing)`,
      });
    }

    // ========== CHECK 3: Color Hex Completeness ==========
    if (!shouldSkipHexCheck(brandSlug)) {
      const productsWithHex = filaments.filter(f => f.color_hex);
      const hexCompleteness = (productsWithHex.length / filaments.length) * 100;

      checks.push({
        checkName: "Color Hex Completeness",
        status: hexCompleteness >= 90 ? "pass" : hexCompleteness >= 50 ? "warning" : "fail",
        count: productsWithHex.length,
        details: `${productsWithHex.length}/${filaments.length} products have color_hex (${hexCompleteness.toFixed(1)}%)`,
      });
    } else {
      checks.push({
        checkName: "Color Hex Completeness",
        status: "skipped",
        count: 0,
        details: `Skipped for ${brandSlug} (curated color mappings)`,
      });
    }

    // ========== CHECK 4: Product Line Grouping ==========
    const productsWithProductLine = filaments.filter(f => f.product_line_id);
    const uniqueProductLines = new Set(productsWithProductLine.map(f => f.product_line_id));
    const productLineCompleteness = (productsWithProductLine.length / filaments.length) * 100;

    checks.push({
      checkName: "Product Line Grouping",
      status: productLineCompleteness >= 90 ? "pass" : productLineCompleteness >= 50 ? "warning" : "fail",
      count: uniqueProductLines.size,
      details: `${uniqueProductLines.size} product lines, ${productLineCompleteness.toFixed(1)}% of products grouped`,
    });

    // ========== CHECK 5: Image Availability ==========
    const productsWithImage = filaments.filter(f => f.featured_image);
    const imageCompleteness = (productsWithImage.length / filaments.length) * 100;

    checks.push({
      checkName: "Image Availability",
      status: imageCompleteness >= 80 ? "pass" : imageCompleteness >= 50 ? "warning" : "fail",
      count: productsWithImage.length,
      details: `${productsWithImage.length}/${filaments.length} products have images (${imageCompleteness.toFixed(1)}%)`,
    });

    // ========== CHECK 6: URL Availability ==========
    if (!shouldSkipUrlCheck(brandSlug)) {
      const productsWithUrl = filaments.filter(f => f.product_url);
      const urlCompleteness = (productsWithUrl.length / filaments.length) * 100;

      checks.push({
        checkName: "URL Availability",
        status: urlCompleteness >= 90 ? "pass" : urlCompleteness >= 50 ? "warning" : "fail",
        count: productsWithUrl.length,
        details: `${productsWithUrl.length}/${filaments.length} products have URLs (${urlCompleteness.toFixed(1)}%)`,
      });
    } else {
      checks.push({
        checkName: "URL Availability",
        status: "skipped",
        count: 0,
        details: `Skipped for ${brandSlug} (cross-product swatch architecture)`,
      });
    }

    // ========== CHECK 7: Swatch Uniqueness (No Duplicate Hex) ==========
    if (!shouldSkipHexCheck(brandSlug)) {
      const productsByLine: Record<string, typeof filaments> = {};
      for (const f of filaments) {
        if (f.product_line_id) {
          if (!productsByLine[f.product_line_id]) productsByLine[f.product_line_id] = [];
          productsByLine[f.product_line_id].push(f);
        }
      }

      const swatchIssues: Array<{ id: string; title: string; issue: string }> = [];
      
      for (const [lineId, variants] of Object.entries(productsByLine)) {
        if (variants.length <= 1) continue;

        // Check for duplicate hex codes
        const hexCounts: Record<string, string[]> = {};
        for (const v of variants) {
          if (v.color_hex) {
            const hex = v.color_hex.toLowerCase();
            if (!hexCounts[hex]) hexCounts[hex] = [];
            const colorName = extractColorFromTitle(v.product_title);
            if (!hexCounts[hex].includes(colorName)) {
              hexCounts[hex].push(colorName);
            }
          }
        }

        for (const [hex, colors] of Object.entries(hexCounts)) {
          if (colors.length > 1) {
            swatchIssues.push({
              id: variants[0].id,
              title: `${lineId}: ${hex}`,
              issue: `${colors.length} different colors share same hex (${colors.slice(0, 3).join(', ')})`,
            });
          }
        }
      }

      checks.push({
        checkName: "Swatch Uniqueness",
        status: swatchIssues.length === 0 ? "pass" : "fail",
        count: swatchIssues.length,
        details: swatchIssues.length === 0 
          ? "No duplicate hex codes within product lines"
          : `${swatchIssues.length} duplicate hex codes found`,
        products: swatchIssues.length > 0 ? swatchIssues.slice(0, 15) : undefined,
      });
    } else {
      checks.push({
        checkName: "Swatch Uniqueness",
        status: "skipped",
        count: 0,
        details: `Skipped for ${brandSlug} (curated color mappings)`,
      });
    }

    // ========== CHECK 8: Material Classification ==========
    const productsWithMaterial = filaments.filter(f => f.material);
    const materialCompleteness = (productsWithMaterial.length / filaments.length) * 100;
    const uniqueMaterials = new Set(productsWithMaterial.map(f => f.material));

    checks.push({
      checkName: "Material Classification",
      status: materialCompleteness >= 80 ? "pass" : materialCompleteness >= 50 ? "warning" : "fail",
      count: uniqueMaterials.size,
      details: `${uniqueMaterials.size} materials, ${materialCompleteness.toFixed(1)}% classified`,
    });

    // Calculate overall status
    const overallStatus = calculateOverallStatus(checks);
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warning').length;

    // Generate AI fix prompt if there are issues
    const aiFixPrompt = getBrandFixPrompt(brandName, brandSlug, checks, totalProducts || 0);

    const report: PostSyncCheckReport = {
      generatedAt: new Date().toISOString(),
      brand: brandName,
      brandSlug,
      totalProducts: totalProducts || 0,
      checks,
      overallStatus,
      scrapedProducts: 0,
      scrapeErrors: [],
      aiFixPrompt,
    };

    console.log(`[PostSyncCheck] Completed: ${overallStatus} (${failCount} fails, ${warnCount} warnings)`);

    return new Response(
      JSON.stringify({ success: true, report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[PostSyncCheck] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Force deploy: 2026-01-31 - Refactored to use shared modules
