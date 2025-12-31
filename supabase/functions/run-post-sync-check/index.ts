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

interface ScrapedProductInfo {
  pageTitle: string;
  colorSwatches: Array<{ name: string; hex?: string }>;
  statusCode: number;
}

// Brands known to use image-based swatches (product photos) rather than CSS color swatches
const IMAGE_SWATCH_BRANDS = ['3d-fuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'overture'];

// Words to filter out when extracting color names (NOT actual colors)
const NON_COLOR_WORDS = new Set([
  // Material types
  'pla', 'pla+', 'petg', 'pctg', 'abs', 'asa', 'tpu', 'nylon', 'hips', 'pc', 'pa', 'cf', 'gf',
  // Product terms
  'filament', 'spool', 'standard', 'pro', 'silk', 'tough', 'dual', 'color', 'dual-color',
  'workday', 'refuel', 'biome3d', 'buzzed', 'entwined', 'wound', 'landfillament',
  // Size/weight terms
  '1.75mm', '2.85mm', '1kg', '500g', '750g', '250g', 'kg', 'mm', 'spool',
  // Brand terms  
  '3d-fuel', '3dfuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'overture',
  // Generic terms
  'buy', 'add', 'cart', 'shop', 'view', 'select', 'choose', 'now', 'new', 'sale',
]);

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

### 2. For Title Mismatch Issues
The sync function must extract titles from the actual product page, not construct them from variants:
- Use Firecrawl to scrape the product page and extract the <h1> title
- Store this exact title in product_title to ensure consistency across Filament Cards, Detail pages, and Buy Now pages

### 3. For Color Count Mismatch Issues
The website shows more color swatches than exist in the database. This means:
- The sync function is missing color variants from the website
- 3D-Fuel and similar brands show color swatches as LINKS TO OTHER PRODUCTS (cross-linking)
- The sync must parse color swatches from HTML and create proper product groupings

### 4. For Missing Color Names
Colors exist on the website but not in the database:
- Add missing colors to the brand's color hex map in \`_shared/${brandSlug}-defaults.ts\`
- Ensure \`extractColorFromVariant()\` properly parses swatch names from the page

### 5. For Weight/Diameter Filtering Issues

Use the shared \`variant-filters.ts\` utility:

\`\`\`typescript
import { shouldIncludeVariant } from '../_shared/variant-filters.ts';

const filterResult = shouldIncludeVariant(weightGrams, diameterMm);
if (!filterResult.include) {
  console.log(\`Skipping variant: \${filterResult.reason}\`);
  continue;
}
\`\`\`

**Filter Constants**:
- MIN_WEIGHT_GRAMS = 300 (excludes samples)
- MAX_WEIGHT_GRAMS = 1400 (excludes bulk)
- STANDARD_DIAMETER_MM = 1.75 (excludes 2.85mm/3.0mm)

---

## The Three Consistency Rules

1. **Names Match**: Filament Card title = Filament Detail title = Product Page <h1>
2. **Color Count Match**: Number of swatches on website = Number of variants in DB per product_line_id
3. **Color Names Match**: Swatch names on website = color names in DB for each product_line

---

## Verification Steps

After making fixes:
1. Run a **Clean Slate** sync for ${brand}
2. Run **Post Sync Check** again to verify all issues are resolved
3. Spot-check a few product pages to confirm data accuracy`;

  return prompt;
}

/**
 * Check if a word is a valid color name (not a product/material term)
 */
function isValidColorName(name: string): boolean {
  const lower = name.toLowerCase().trim();
  
  // Skip empty or very short names
  if (!lower || lower.length < 2) return false;
  
  // Skip non-color words
  if (NON_COLOR_WORDS.has(lower)) return false;
  
  // Skip if it contains material identifiers
  if (/\b(pla|petg|pctg|abs|asa|tpu|nylon|filament)\b/i.test(lower)) return false;
  
  // Skip size/weight patterns
  if (/^\d|\d+\s*(g|kg|mm|lb)|\d+\.\d+mm/i.test(lower)) return false;
  
  return true;
}

/**
 * Extract product info from scraped page HTML
 * 
 * Key extraction strategy for 3D-Fuel and similar brands:
 * - These brands use cross-product color swatches (links to other products)
 * - The swatch images have alt text like "Standard PLA+, Desert Tan, 1.75mm"
 * - We need to extract just the color name (second part of the comma-separated string)
 */
function extractProductInfoFromHtml(html: string, markdown: string): ScrapedProductInfo {
  const result: ScrapedProductInfo = {
    pageTitle: '',
    colorSwatches: [],
    statusCode: 200,
  };
  
  const addColorSwatch = (name: string) => {
    const trimmed = name.trim();
    if (isValidColorName(trimmed) && 
        !result.colorSwatches.find(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      result.colorSwatches.push({ name: trimmed });
    }
  };
  
  // Extract page title from <h1> or meta title
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    result.pageTitle = h1Match[1].trim();
  } else {
    // Try to get from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      // Clean up title (often has "– Brand Name" suffix)
      result.pageTitle = titleMatch[1].split('–')[0].split('|')[0].trim();
    }
  }
  
  // ========== PATTERN 1: 3D-Fuel cross-product swatch images ==========
  // Format: [![Standard PLA+, Desert Tan, 1.75mm](image-url)](product-url)
  // The alt text contains "Product Line, Color Name, Diameter"
  const swatchAltMatches = html.matchAll(/alt="([^"]+)"[^>]*>\s*<\/a>\s*<a[^>]*href="[^"]*\/products\//gi);
  for (const match of swatchAltMatches) {
    const altText = match[1];
    const parts = altText.split(',');
    if (parts.length >= 2) {
      // Color is the 2nd part: "Desert Tan" from "Standard PLA+, Desert Tan, 1.75mm"
      const colorName = parts[1].trim();
      if (colorName && !colorName.match(/\d+\.\d+mm$/i)) {
        addColorSwatch(colorName);
      }
    }
  }
  
  // ========== PATTERN 2: Linked images with alt text containing comma-separated values ==========
  // Broader pattern for swatch images with product info in alt text
  const imgAltMatches = html.matchAll(/<img[^>]*alt="([^"]*,[^"]+)"[^>]*>/gi);
  for (const match of imgAltMatches) {
    const altText = match[1];
    const parts = altText.split(',');
    if (parts.length >= 2) {
      const potentialColor = parts[1].trim();
      // Skip if it looks like a size/diameter
      if (!potentialColor.match(/\d+\.\d+mm$/i) && !potentialColor.match(/^\d+/)) {
        addColorSwatch(potentialColor);
      }
    }
  }
  
  // ========== PATTERN 3: Swatch images with class containing "swatch" ==========
  const swatchImgMatches = html.matchAll(/<img[^>]*class="[^"]*swatch[^"]*"[^>]*alt="([^"]+)"[^>]*>/gi);
  for (const match of swatchImgMatches) {
    addColorSwatch(match[1]);
  }
  
  // ========== PATTERN 4: Swatch links with title attribute ==========
  const swatchLinkMatches = html.matchAll(/<a[^>]*(?:class="[^"]*swatch[^"]*"|data-option="[^"]*color[^"]*")[^>]*title="([^"]+)"[^>]*>/gi);
  for (const match of swatchLinkMatches) {
    addColorSwatch(match[1]);
  }
  
  // ========== PATTERN 5: Shopify variant option inputs ==========
  const variantOptionsMatch = html.match(/product-form__option[^>]*value="([^"]+)"/gi);
  if (variantOptionsMatch) {
    for (const optMatch of variantOptionsMatch) {
      const valueMatch = optMatch.match(/value="([^"]+)"/i);
      if (valueMatch) {
        addColorSwatch(valueMatch[1]);
      }
    }
  }
  
  // ========== PATTERN 6: Color option labels from Shopify ==========
  const optionLabelsMatch = html.matchAll(/<label[^>]*for="[^"]*color[^"]*"[^>]*>([^<]+)<\/label>/gi);
  for (const match of optionLabelsMatch) {
    addColorSwatch(match[1]);
  }
  
  // ========== PATTERN 7: Links to color variant products (URL-based) ==========
  // Parse URLs like /products/standard-pla-1-75mm-desert-tan
  const colorLinkMatches = html.matchAll(/href="[^"]*\/products\/[^"]*-([a-z][a-z-]*)-1-75mm"[^>]*/gi);
  for (const match of colorLinkMatches) {
    if (match[1]) {
      const colorSlug = match[1];
      const name = colorSlug
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      addColorSwatch(name);
    }
  }
  
  // ========== PATTERN 8: Alternative URL format - color at end ==========
  // Parse URLs like /products/pro-pctg-coyote-brown-1-75mm
  const altColorLinkMatches = html.matchAll(/href="[^"]*\/products\/[a-z-]+-([a-z][a-z-]+)-1-75mm"/gi);
  for (const match of altColorLinkMatches) {
    if (match[1]) {
      const colorSlug = match[1];
      // Filter out material names that might appear before 1-75mm
      if (!colorSlug.match(/^(pla|petg|pctg|abs|asa|tpu)$/i)) {
        const name = colorSlug
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        addColorSwatch(name);
      }
    }
  }
  
  return result;
}

/**
 * Normalize a title for comparison (lowercase, remove extra spaces/punctuation)
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[,\-–—]/g, ' ')
    .trim();
}

/**
 * Extract the key components from a title for comparison
 * DB format: "3D-Fuel Standard PLA+ - Desert Tan"
 * Page format: "Standard PLA+, Desert Tan, 1.75mm"
 */
function extractTitleComponents(title: string): { productLine: string; color: string } | null {
  const lower = title.toLowerCase();
  
  // DB format: "Brand Product Line - Color"
  const dbMatch = lower.match(/(?:3d-?fuel\s+)?(.+?)\s*-\s*(.+)$/);
  if (dbMatch) {
    return {
      productLine: dbMatch[1].trim(),
      color: dbMatch[2].trim(),
    };
  }
  
  // Page format: "Product Line, Color, 1.75mm"
  const pageMatch = lower.match(/^(.+?),\s*(.+?),\s*[\d.]+mm$/);
  if (pageMatch) {
    return {
      productLine: pageMatch[1].trim(),
      color: pageMatch[2].trim(),
    };
  }
  
  // Simpler comma format: "Product Line, Color"
  const simpleMatch = lower.match(/^(.+?),\s*(.+)$/);
  if (simpleMatch && !simpleMatch[2].includes('mm')) {
    return {
      productLine: simpleMatch[1].trim(),
      color: simpleMatch[2].trim(),
    };
  }
  
  return null;
}

/**
 * Check if two titles are equivalent despite different formats
 */
function titlesAreEquivalent(dbTitle: string, pageTitle: string): boolean {
  const dbParts = extractTitleComponents(dbTitle);
  const pageParts = extractTitleComponents(pageTitle);
  
  if (dbParts && pageParts) {
    // Check if product lines match (one contains the other)
    const lineMatch = dbParts.productLine.includes(pageParts.productLine) || 
                      pageParts.productLine.includes(dbParts.productLine);
    
    // Check if colors match (one contains the other, or exact match after normalization)
    const dbColor = dbParts.color.replace(/[^a-z0-9]/g, '');
    const pageColor = pageParts.color.replace(/[^a-z0-9]/g, '');
    const colorMatch = dbColor === pageColor || 
                       dbColor.includes(pageColor) || 
                       pageColor.includes(dbColor);
    
    return lineMatch && colorMatch;
  }
  
  return false;
}

/**
 * Calculate title similarity (0-100%)
 */
function titleSimilarity(a: string, b: string): number {
  // First try structured comparison
  if (titlesAreEquivalent(a, b)) {
    return 85; // High enough to pass the 60% threshold
  }
  
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);
  
  if (normA === normB) return 100;
  
  // Check if one contains the other
  if (normA.includes(normB) || normB.includes(normA)) {
    const longer = normA.length > normB.length ? normA : normB;
    const shorter = normA.length > normB.length ? normB : normA;
    return Math.round((shorter.length / longer.length) * 100);
  }
  
  // Word-based similarity
  const wordsA = new Set(normA.split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normB.split(' ').filter(w => w.length > 2));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  
  return Math.round((intersection.length / union.size) * 100);
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
      .gt("net_weight_g", 0)
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

    // ============= SCRAPE-BASED VALIDATION =============
    
    // Get product lines with their representative products for validation
    const { data: productLinesData } = await supabase
      .from("filaments")
      .select("id, product_title, product_url, color_hex, product_line_id")
      .ilike("vendor", brandName)
      .not("product_url", "is", null)
      .not("product_line_id", "is", null);

    // Group by product_line_id
    const productLineGroups: Record<string, typeof productLinesData> = {};
    for (const product of productLinesData || []) {
      const lineId = product.product_line_id!;
      if (!productLineGroups[lineId]) {
        productLineGroups[lineId] = [];
      }
      productLineGroups[lineId].push(product);
    }

    // Select sample product lines for validation
    const productLineIds = Object.keys(productLineGroups);
    const sampleLineIds = productLineIds.slice(0, Math.min(sampleSize, 10));

    console.log(`[PostSyncCheck] Validating ${sampleLineIds.length} product lines out of ${productLineIds.length}`);

    let scrapedCount = 0;
    const titleIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    const colorCountIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    const colorNameIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    const urlIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (firecrawlApiKey && sampleLineIds.length > 0) {
      console.log(`[PostSyncCheck] Scraping ${sampleLineIds.length} product lines for validation`);

      for (const lineId of sampleLineIds) {
        const variants = productLineGroups[lineId];
        if (!variants || variants.length === 0) continue;

        // Use the first variant's URL as representative
        const representative = variants[0];
        if (!representative.product_url) continue;

        try {
          const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: representative.product_url,
              formats: ["html", "markdown"],
              onlyMainContent: false,
              waitFor: 2500,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[PostSyncCheck] Firecrawl error for ${representative.product_url}:`, errorText);
            urlIssues.push({
              id: representative.id,
              title: representative.product_title,
              issue: `HTTP ${response.status}`,
              url: representative.product_url,
            });
            scrapeErrors.push(`${lineId}: HTTP ${response.status}`);
            continue;
          }

          const data = await response.json();
          scrapedCount++;

          const html = data.data?.html || data.html || "";
          const markdown = data.data?.markdown || data.markdown || "";
          const metadata = data.data?.metadata || data.metadata;
          const statusCode = metadata?.statusCode;

          // Check URL validity
          if (statusCode === 404) {
            urlIssues.push({
              id: representative.id,
              title: representative.product_title,
              issue: "Page not found (404)",
              url: representative.product_url,
            });
            continue;
          }

          // Extract product info from the page
          const pageInfo = extractProductInfoFromHtml(html, markdown);
          
          // ========== CHECK A: TITLE ACCURACY ==========
          if (pageInfo.pageTitle) {
            const similarity = titleSimilarity(representative.product_title, pageInfo.pageTitle);
            console.log(`[PostSyncCheck] Title check: DB="${representative.product_title}" vs Page="${pageInfo.pageTitle}" (${similarity}% match)`);
            
            if (similarity < 60) {
              titleIssues.push({
                id: representative.id,
                title: representative.product_title,
                issue: `DB title doesn't match page. Page shows: "${pageInfo.pageTitle}" (${similarity}% similarity)`,
                url: representative.product_url,
              });
            }
          }

          // ========== CHECK B: COLOR COUNT VALIDATION ==========
          const dbColorCount = variants.length;
          const pageColorCount = pageInfo.colorSwatches.length;
          
          console.log(`[PostSyncCheck] Color count: DB=${dbColorCount} vs Page=${pageColorCount} for ${lineId}`);
          
          // Only flag if page has significantly more colors (2+ difference)
          // Some pages may not expose all swatches in HTML
          if (pageColorCount > 0 && pageColorCount > dbColorCount + 1) {
            colorCountIssues.push({
              id: representative.id,
              title: lineId,
              issue: `Website shows ${pageColorCount} colors, database has only ${dbColorCount} (missing ${pageColorCount - dbColorCount})`,
              url: representative.product_url,
            });
          }

          // ========== CHECK C: COLOR NAME MATCHING ==========
          if (pageInfo.colorSwatches.length > 0) {
            const dbColorNames = new Set(
              variants
                .map(v => {
                  // Extract color name from product title
                  const title = v.product_title.toLowerCase();
                  const parts = title.split(',');
                  if (parts.length >= 2) {
                    return parts[1].trim();
                  }
                  return '';
                })
                .filter(Boolean)
            );

            const pageColorNames = new Set(
              pageInfo.colorSwatches.map(s => s.name.toLowerCase())
            );

            // Find colors on page that aren't in DB
            const missingColors: string[] = [];
            for (const pageColor of pageColorNames) {
              let found = false;
              for (const dbColor of dbColorNames) {
                // Fuzzy match - check if one contains the other
                if (dbColor.includes(pageColor) || pageColor.includes(dbColor) ||
                    normalizeTitle(dbColor) === normalizeTitle(pageColor)) {
                  found = true;
                  break;
                }
              }
              if (!found) {
                missingColors.push(pageColor);
              }
            }

            if (missingColors.length > 0) {
              console.log(`[PostSyncCheck] Missing colors for ${lineId}: ${missingColors.join(', ')}`);
              colorNameIssues.push({
                id: representative.id,
                title: lineId,
                issue: `Colors on website not in DB: ${missingColors.slice(0, 5).join(', ')}${missingColors.length > 5 ? ` (+${missingColors.length - 5} more)` : ''}`,
                url: representative.product_url,
              });
            }
          }

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } catch (error) {
          console.error(`[PostSyncCheck] Error scraping ${representative.product_url}:`, error);
          scrapeErrors.push(`${lineId}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    }

    // ============= ADD SCRAPE-BASED CHECK RESULTS =============

    if (scrapedCount > 0) {
      // Check A: Title Accuracy
      checks.push({
        checkName: "Title Accuracy (DB matches Page)",
        status: titleIssues.length === 0 ? "pass" : titleIssues.length <= 1 ? "warning" : "fail",
        count: scrapedCount - titleIssues.length,
        details: `${scrapedCount - titleIssues.length}/${scrapedCount} product titles match their Buy Now pages`,
        products: titleIssues.length > 0 ? titleIssues : undefined,
      });

      // Check B: Color Count Validation  
      checks.push({
        checkName: "Color Count Match (DB vs Website)",
        status: colorCountIssues.length === 0 ? "pass" : colorCountIssues.length <= 1 ? "warning" : "fail",
        count: scrapedCount - colorCountIssues.length,
        details: `${scrapedCount - colorCountIssues.length}/${scrapedCount} product lines have correct color counts`,
        products: colorCountIssues.length > 0 ? colorCountIssues : undefined,
      });

      // Check C: Color Name Matching
      checks.push({
        checkName: "Color Names Match (DB has all website colors)",
        status: colorNameIssues.length === 0 ? "pass" : colorNameIssues.length <= 1 ? "warning" : "fail",
        count: scrapedCount - colorNameIssues.length,
        details: `${scrapedCount - colorNameIssues.length}/${scrapedCount} product lines have all colors from website`,
        products: colorNameIssues.length > 0 ? colorNameIssues : undefined,
      });

      // URL Validity Check
      checks.push({
        checkName: "Buy Now URLs Valid",
        status: urlIssues.length === 0 ? "pass" : urlIssues.length <= 1 ? "warning" : "fail",
        count: scrapedCount - urlIssues.length,
        details: `${scrapedCount - urlIssues.length}/${scrapedCount} URLs returned valid pages`,
        products: urlIssues.length > 0 ? urlIssues : undefined,
      });
    } else if (!firecrawlApiKey) {
      checks.push({
        checkName: "Scrape Validation",
        status: "warning",
        count: 0,
        details: "Firecrawl API key not configured - skipping Title, Color Count, and Color Name validation",
      });
    }

    // ============= SWATCH UNIQUENESS CHECK =============
    let swatchIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Check for duplicate hex codes within product lines
    for (const lineId of productLineIds.slice(0, 10)) {
      const variants = productLineGroups[lineId];
      if (!variants || variants.length <= 1) continue;

      const hexCounts: Record<string, number> = {};
      for (const v of variants) {
        if (v.color_hex) {
          const hex = v.color_hex.toLowerCase();
          hexCounts[hex] = (hexCounts[hex] || 0) + 1;
        }
      }

      for (const [hex, count] of Object.entries(hexCounts)) {
        if (count > 1) {
          swatchIssues.push({
            id: variants[0].id,
            title: `${lineId}: ${hex}`,
            issue: `${count} variants share same hex code`,
          });
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
