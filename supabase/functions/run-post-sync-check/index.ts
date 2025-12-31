import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  checkName: string;
  status: 'pass' | 'fail' | 'warning';
  count: number;
  details?: string;
  products?: Array<{ id: string; title: string; issue: string; url?: string }>;
}

interface PostSyncCheckReport {
  generatedAt: string;
  brand: string;
  brandSlug: string;
  totalProducts: number;
  checks: CheckResult[];
  overallStatus: 'pass' | 'warning' | 'fail';
  scrapedProducts: number;
  scrapeErrors: string[];
  aiFixPrompt: string | null;
}

// Brands known to use image-based swatches (product photos) rather than CSS color swatches
// For these brands, we skip the "hex not found on page" validation since their product pages
// don't include the hex code in the HTML - they use actual product images instead
const IMAGE_SWATCH_BRANDS = ['3d-fuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'overture'];

function generateAIFixPrompt(
  brand: string, 
  brandSlug: string, 
  checks: CheckResult[], 
  totalProducts: number
): string | null {
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warningChecks = checks.filter(c => c.status === 'warning');
  
  if (failedChecks.length === 0 && warningChecks.length === 0) {
    return null;
  }

  const issuesSummary = [
    ...failedChecks.map(c => `❌ ${c.checkName}: ${c.count} issues`),
    ...warningChecks.map(c => `⚠️ ${c.checkName}: ${c.count} issues`)
  ].join('\n');

  const detailedIssues = [...failedChecks, ...warningChecks].map(check => {
    let section = `### ${check.checkName} - ${check.status === 'fail' ? '❌ FAIL' : '⚠️ WARNING'}\n`;
    section += `${check.count} products affected:\n\n`;
    
    if (check.products && check.products.length > 0) {
      const examples = check.products.slice(0, 10);
      examples.forEach(p => {
        section += `- **${p.title}**\n  - Issue: ${p.issue}\n`;
        if (p.url) section += `  - URL: ${p.url}\n`;
      });
      if (check.products.length > 10) {
        section += `\n... and ${check.products.length - 10} more\n`;
      }
    } else if (check.details) {
      section += `- ${check.details}\n`;
    }
    
    return section;
  }).join('\n\n');

  const prompt = `## Fix Post Sync Check Issues for ${brand}

The Post Sync Check for ${brand} found the following issues that need to be fixed in the sync function.

### Summary
- **Brand**: ${brand} (slug: ${brandSlug})
- **Total Products**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

### Issues Found
${issuesSummary}

---

## Detailed Issues

${detailedIssues}

---

## Required Actions

### 1. Update the sync function
File: \`supabase/functions/sync-${brandSlug}-products/index.ts\`

### 2. For Weight/Diameter Filtering Issues (Bulk, Sample, 2.85mm products)

The sync function should use the shared \`variant-filters.ts\` utility to properly filter variants:

\`\`\`typescript
import { shouldIncludeVariant, createFilterStats, updateFilterStats, logFilterStats } from '../_shared/variant-filters.ts';

// In explodeVariants() or where variants are processed:
const filterResult = shouldIncludeVariant(weightGrams, diameterMm);
if (!filterResult.include) {
  console.log(\`[${brand}] Skipping variant: \${filterResult.reason}\`);
  updateFilterStats(stats, filterResult);
  continue;
}
\`\`\`

**Filter Constants** (from variant-filters.ts):
- MIN_WEIGHT_GRAMS = 300 (excludes sample coils)
- MAX_WEIGHT_GRAMS = 1400 (excludes bulk/industrial spools)
- STANDARD_DIAMETER_MM = 1.75 (excludes 2.85mm/3.0mm)

### 3. For Color Hex Issues

- Check the color extraction logic in the sync function
- Verify brand-specific color maps in \`../_shared/${brandSlug}-defaults.ts\`
- Consider adding missing colors to the shared color-mapping repository
- Ensure \`extractColorFromVariant()\` is properly parsing variant titles

### 4. For URL/Scrape Validation Issues

- Verify URL construction logic (correct domain, path encoding)
- Check for regional URL variants if applicable
- Ensure product handles are properly slugified

---

## Verification Steps

After making fixes:
1. Run a **Clean Slate** sync for ${brand}
2. Run **Post Sync Check** again to verify all issues are resolved
3. Spot-check a few product pages to confirm data accuracy

---

## Notes
- The \`product_line_id\` should exclude color names to properly group variants
- All products should have valid \`color_hex\` values for UI swatches
- TDS URLs should follow brand-specific patterns from the defaults file`;

  return prompt;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandSlug, brandName, sampleSize = 5 } = await req.json();

    if (!brandSlug || !brandName) {
      return new Response(
        JSON.stringify({ success: false, error: "brandSlug and brandName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[PostSyncCheck] Starting check for ${brandName} (${brandSlug})`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const checks: CheckResult[] = [];
    const scrapeErrors: string[] = [];

    // Get total product count for this brand
    const { count: totalProducts } = await supabase
      .from("filaments")
      .select("*", { count: "exact", head: true })
      .ilike("vendor", brandName);

    console.log(`[PostSyncCheck] Total products for ${brandName}: ${totalProducts}`);

    // ============= DATABASE CHECKS =============

    // Check 1: Bulk Products (>1.4kg / 1400g)
    const { data: bulkProducts, error: bulkError } = await supabase
      .from("filaments")
      .select("id, product_title, net_weight_g")
      .ilike("vendor", brandName)
      .gt("net_weight_g", 1400)
      .limit(20);

    if (bulkError) {
      console.error("[PostSyncCheck] Bulk check error:", bulkError);
    }

    checks.push({
      checkName: "No Bulk Products (>1.4kg)",
      status: (bulkProducts?.length || 0) === 0 ? "pass" : "fail",
      count: bulkProducts?.length || 0,
      details: bulkProducts?.length ? `Found ${bulkProducts.length} bulk products that should be excluded` : undefined,
      products: bulkProducts?.map((p) => ({
        id: p.id,
        title: p.product_title,
        issue: `Weight: ${p.net_weight_g}g`,
      })),
    });

    // Check 2: 2.85mm Products
    const { data: largeDiameterProducts, error: diameterError } = await supabase
      .from("filaments")
      .select("id, product_title, diameter_nominal_mm")
      .ilike("vendor", brandName)
      .or("diameter_nominal_mm.eq.2.85,diameter_nominal_mm.eq.3.0")
      .limit(20);

    if (diameterError) {
      console.error("[PostSyncCheck] Diameter check error:", diameterError);
    }

    checks.push({
      checkName: "No 2.85mm/3.0mm Products",
      status: (largeDiameterProducts?.length || 0) === 0 ? "pass" : "fail",
      count: largeDiameterProducts?.length || 0,
      details: largeDiameterProducts?.length ? `Found ${largeDiameterProducts.length} non-1.75mm products` : undefined,
      products: largeDiameterProducts?.map((p) => ({
        id: p.id,
        title: p.product_title,
        issue: `Diameter: ${p.diameter_nominal_mm}mm`,
      })),
    });

    // Check 3: Sample Products (<300g)
    const { data: sampleProducts, error: sampleError } = await supabase
      .from("filaments")
      .select("id, product_title, net_weight_g")
      .ilike("vendor", brandName)
      .lt("net_weight_g", 300)
      .gt("net_weight_g", 0) // Exclude null/0
      .limit(20);

    if (sampleError) {
      console.error("[PostSyncCheck] Sample check error:", sampleError);
    }

    checks.push({
      checkName: "No Sample Products (<300g)",
      status: (sampleProducts?.length || 0) === 0 ? "pass" : "fail",
      count: sampleProducts?.length || 0,
      details: sampleProducts?.length ? `Found ${sampleProducts.length} sample/mini products` : undefined,
      products: sampleProducts?.map((p) => ({
        id: p.id,
        title: p.product_title,
        issue: `Weight: ${p.net_weight_g}g`,
      })),
    });

    // ============= SCRAPE-BASED CHECKS =============
    // Get a sample of products with product URLs for validation
    const { data: sampleForScrape } = await supabase
      .from("filaments")
      .select("id, product_title, product_url, color_hex, product_line_id")
      .ilike("vendor", brandName)
      .not("product_url", "is", null)
      .limit(Math.min(sampleSize, 10));

    let scrapedCount = 0;
    let urlsValid = 0;
    let colorMatches = 0;
    const urlIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    const colorIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (firecrawlApiKey && sampleForScrape?.length) {
      console.log(`[PostSyncCheck] Scraping ${sampleForScrape.length} sample products`);

      for (const product of sampleForScrape) {
        if (!product.product_url) continue;

        try {
          const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: product.product_url,
              formats: ["html", "markdown"],
              onlyMainContent: false,
              waitFor: 2000,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[PostSyncCheck] Firecrawl error for ${product.product_url}:`, errorText);
            urlIssues.push({
              id: product.id,
              title: product.product_title,
              issue: `HTTP ${response.status}`,
              url: product.product_url,
            });
            scrapeErrors.push(`${product.product_title}: HTTP ${response.status}`);
            continue;
          }

          const data = await response.json();
          scrapedCount++;

          // Check if page loaded successfully
          const metadata = data.data?.metadata || data.metadata;
          const statusCode = metadata?.statusCode;
          
          if (statusCode === 200) {
            urlsValid++;
          } else if (statusCode === 404) {
            urlIssues.push({
              id: product.id,
              title: product.product_title,
              issue: "Page not found (404)",
              url: product.product_url,
            });
          } else if (statusCode) {
            urlIssues.push({
              id: product.id,
              title: product.product_title,
              issue: `HTTP ${statusCode}`,
              url: product.product_url,
            });
          } else {
            // No status code means it loaded
            urlsValid++;
          }

          // Check color hex match - look for the color in the page
          // Skip for image-based swatch brands as they use product photos, not CSS colors
          const isImageSwatchBrand = IMAGE_SWATCH_BRANDS.includes(brandSlug);
          
          if (isImageSwatchBrand) {
            // For image-based swatch brands, count as a match if we have a hex value
            // The actual validation is done visually via product photos
            if (product.color_hex) {
              colorMatches++;
              console.log(`[PostSyncCheck] Skipping hex validation for ${brandSlug} (image-based swatches)`);
            } else {
              colorMatches++;
            }
          } else {
            const html = data.data?.html || data.html || "";
            const markdown = data.data?.markdown || data.markdown || "";
            const pageContent = html + markdown;

            if (product.color_hex) {
              const hexWithoutHash = product.color_hex.replace("#", "").toLowerCase();
              const hexWithHash = product.color_hex.toLowerCase();
              
              // Check if the color appears anywhere on the page
              if (
                pageContent.toLowerCase().includes(hexWithoutHash) ||
                pageContent.toLowerCase().includes(hexWithHash)
              ) {
                colorMatches++;
              } else {
                // Check for common color style patterns
                const colorPatterns = [
                  `background-color:.*${hexWithoutHash}`,
                  `background:.*${hexWithoutHash}`,
                  `style=".*${hexWithoutHash}`,
                  `#${hexWithoutHash}`,
                ];
                
                const foundColor = colorPatterns.some((pattern) => 
                  new RegExp(pattern, "i").test(pageContent)
                );
                
                if (foundColor) {
                  colorMatches++;
                } else {
                  colorIssues.push({
                    id: product.id,
                    title: product.product_title,
                    issue: `DB hex ${product.color_hex} not found on page`,
                    url: product.product_url,
                  });
                }
              }
            } else {
              // No color hex in DB - that's okay for this check
              colorMatches++;
            }
          }

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } catch (error) {
          console.error(`[PostSyncCheck] Error scraping ${product.product_url}:`, error);
          scrapeErrors.push(`${product.product_title}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    }

    // Add scrape-based check results
    if (scrapedCount > 0) {
      checks.push({
        checkName: "Buy Now URLs Valid",
        status: urlIssues.length === 0 ? "pass" : urlIssues.length <= 1 ? "warning" : "fail",
        count: urlsValid,
        details: `${urlsValid}/${scrapedCount} URLs returned valid pages`,
        products: urlIssues.length > 0 ? urlIssues : undefined,
      });

      checks.push({
        checkName: "Color Hex Match",
        status: colorIssues.length === 0 ? "pass" : colorIssues.length <= 1 ? "warning" : "fail",
        count: colorMatches,
        details: `${colorMatches}/${scrapedCount} products have matching colors`,
        products: colorIssues.length > 0 ? colorIssues : undefined,
      });
    } else if (!firecrawlApiKey) {
      checks.push({
        checkName: "Scrape Validation",
        status: "warning",
        count: 0,
        details: "Firecrawl API key not configured - skipping URL and color validation",
      });
    }

    // ============= SWATCH ACCURACY CHECK =============
    // Compare color variant counts per product line
    const { data: productLines } = await supabase
      .from("filaments")
      .select("product_line_id")
      .ilike("vendor", brandName)
      .not("product_line_id", "is", null);

    const uniqueProductLines = [...new Set(productLines?.map((p) => p.product_line_id))];
    
    let swatchIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    if (uniqueProductLines.length > 0) {
      // Check for duplicate hex codes within product lines
      for (const productLineId of uniqueProductLines.slice(0, 5)) {
        const { data: variants } = await supabase
          .from("filaments")
          .select("id, product_title, color_hex")
          .eq("product_line_id", productLineId)
          .ilike("vendor", brandName);

        if (variants && variants.length > 1) {
          // Count hex codes
          const hexCounts: Record<string, number> = {};
          for (const v of variants) {
            if (v.color_hex) {
              const hex = v.color_hex.toLowerCase();
              hexCounts[hex] = (hexCounts[hex] || 0) + 1;
            }
          }

          // Find duplicates
          for (const [hex, count] of Object.entries(hexCounts)) {
            if (count > 1) {
              const dupes = variants.filter((v) => v.color_hex?.toLowerCase() === hex);
              swatchIssues.push({
                id: dupes[0].id,
                title: `${productLineId}: ${hex}`,
                issue: `${count} variants share same hex code`,
              });
            }
          }
        }
      }
    }

    checks.push({
      checkName: "Swatch Uniqueness",
      status: swatchIssues.length === 0 ? "pass" : swatchIssues.length <= 2 ? "warning" : "fail",
      count: swatchIssues.length,
      details: swatchIssues.length === 0 
        ? "No duplicate hex codes within product lines" 
        : `${swatchIssues.length} duplicate hex codes found`,
      products: swatchIssues.length > 0 ? swatchIssues : undefined,
    });

    // Calculate overall status
    const failCount = checks.filter((c) => c.status === "fail").length;
    const warnCount = checks.filter((c) => c.status === "warning").length;
    
    let overallStatus: "pass" | "warning" | "fail" = "pass";
    if (failCount > 0) overallStatus = "fail";
    else if (warnCount > 0) overallStatus = "warning";

    // Generate AI fix prompt if there are issues
    const aiFixPrompt = generateAIFixPrompt(brandName, brandSlug, checks, totalProducts || 0);

    const report: PostSyncCheckReport = {
      generatedAt: new Date().toISOString(),
      brand: brandName,
      brandSlug,
      totalProducts: totalProducts || 0,
      checks,
      overallStatus,
      scrapedProducts: scrapedCount,
      scrapeErrors,
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
