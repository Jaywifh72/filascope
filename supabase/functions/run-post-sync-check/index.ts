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
  colorSwatches: Array<{ name: string; hex?: string; productUrl?: string }>;
  statusCode: number;
}

// Product line synonyms for title matching (handles "Entwined" vs "Entwined v2Hemp")
const PRODUCT_LINE_SYNONYMS: Record<string, string[]> = {
  'entwined': ['entwined hemp', 'entwined v2hemp', 'entwined v2 hemp'],
  'pet-cf': ['petcf', 'pet cf'],
  'pla-cf': ['placf', 'pla cf'],
  'dual color silk': ['dual-color silk', 'dual color silk pla', 'dual-color-silk-pla'],
};

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

interface AIWebsiteAnalysis {
  swatchType: string;
  extractionPattern: string;
  missingReason: string;
  fixCode: string;
  colorMappings: Record<string, string>;
  rootCause?: string;
  wrongDecisions?: string[];
  correctBehavior?: string;
}

interface DecisionLogEntry {
  id: string;
  product_id: string;
  product_title: string;
  decision_type: string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  decision_reason: string;
  success: boolean;
}

/**
 * Fetch decision logs from most recent sync for this brand
 */
async function fetchDecisionLogs(
  supabase: any,
  brandSlug: string,
  failingProductIds: string[]
): Promise<DecisionLogEntry[]> {
  // Get the most recent sync log for this brand
  const { data: recentSyncLog } = await supabase
    .from('brand_sync_logs')
    .select('id')
    .eq('brand_slug', brandSlug)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!recentSyncLog?.id) {
    console.log('[PostSyncCheck] No recent sync log found for decision logs');
    return [];
  }
  
  // Fetch decision logs, prioritizing failures and logs related to failing products
  const { data: decisionLogs, error } = await supabase
    .from('scrape_decision_logs')
    .select('*')
    .eq('sync_log_id', recentSyncLog.id)
    .order('created_at', { ascending: true })
    .limit(200);
  
  if (error) {
    console.error('[PostSyncCheck] Error fetching decision logs:', error.message);
    return [];
  }
  
  // Filter to prioritize logs related to failing products and failures
  const relevantLogs = (decisionLogs || []).filter((log: DecisionLogEntry) => 
    !log.success || 
    failingProductIds.some(id => log.product_id?.includes(id)) ||
    log.decision_type === 'color_extraction' ||
    log.decision_type === 'product_line' ||
    log.decision_type === 'hex_lookup'
  );
  
  console.log(`[PostSyncCheck] Fetched ${relevantLogs.length} relevant decision logs`);
  return relevantLogs.slice(0, 50); // Limit for AI context
}

/**
 * Analyze website patterns using Lovable AI (Gemini)
 * Enhanced with verbose sync decision logs for root cause analysis
 */
async function analyzeWebsiteWithAI(
  brandName: string,
  brandSlug: string,
  htmlSamples: string[],
  failingChecks: CheckResult[],
  dbColorData: Array<{ productLine: string; colors: string[] }>,
  decisionLogs: DecisionLogEntry[] = []
): Promise<AIWebsiteAnalysis | null> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    console.log("[PostSyncCheck] LOVABLE_API_KEY not configured, skipping AI analysis");
    return null;
  }

  // Extract relevant HTML snippets (swatch sections only, to reduce token usage)
  const swatchPatterns: string[] = [];
  for (const html of htmlSamples.slice(0, 2)) {
    // Extract swatch-related HTML sections
    const swatchSection = html.match(/<(?:div|ul|section)[^>]*(?:swatch|color|variant)[^>]*>[\s\S]{0,3000}/gi);
    if (swatchSection) {
      swatchPatterns.push(swatchSection[0].slice(0, 1500));
    }
    // Also extract linked product images with alt text
    const linkedImages = html.match(/<a[^>]*href="[^"]*\/products\/[^"]*"[^>]*>[\s\S]{0,500}<img[^>]*alt="[^"]*"[^>]*>/gi);
    if (linkedImages) {
      swatchPatterns.push(linkedImages.slice(0, 5).join('\n'));
    }
  }

  // Get missing colors from failing checks
  const missingColorsCheck = failingChecks.find(c => c.checkName.includes('Color Names Match'));
  const missingColorsList = missingColorsCheck?.products?.map(p => p.issue).join('\n') || 'None detected';

  // Format decision logs for AI analysis
  const decisionLogsFormatted = decisionLogs.slice(0, 20).map(log => 
    `[${log.decision_type}] ${log.product_title || log.product_id}
  Input: ${JSON.stringify(log.input_data)}
  Output: ${JSON.stringify(log.output_data)}
  Reason: ${log.decision_reason}
  Success: ${log.success}`
  ).join('\n\n');

  // Identify failures from decision logs
  const failedDecisions = decisionLogs.filter(l => !l.success);
  const failedDecisionsFormatted = failedDecisions.slice(0, 10).map(log =>
    `- [${log.decision_type}] "${log.product_title}": ${log.decision_reason}`
  ).join('\n');

  const prompt = `You are a web scraping debugging expert analyzing a 3D printer filament e-commerce website.

BRAND: ${brandName} (slug: ${brandSlug})
SYNC FUNCTION: supabase/functions/sync-${brandSlug}-products/index.ts
DEFAULTS FILE: supabase/functions/_shared/${brandSlug}-defaults.ts

## FAILING CHECKS
${failingChecks.map(c => `- ${c.checkName}: ${c.count} issues`).join('\n')}

## MISSING COLORS DETECTED
${missingColorsList}

## SYNC DECISION LOGS (what the scraper actually did)
${decisionLogsFormatted || 'No decision logs available'}

## FAILED DECISIONS
${failedDecisionsFormatted || 'No explicit failures logged'}

## WEBSITE HTML PATTERNS (what the website shows)
${swatchPatterns.join('\n---\n').slice(0, 3000)}

## DATABASE COLOR DATA (what ended up in DB)
${JSON.stringify(dbColorData.slice(0, 3), null, 2)}

ANALYZE AND RESPOND WITH JSON ONLY (no markdown code blocks):
{
  "rootCause": "explanation of what went wrong based on comparing decision logs vs website patterns",
  "wrongDecisions": ["list of specific wrong decisions from logs"],
  "correctBehavior": "what the scraper SHOULD have done",
  "swatchType": "css-color | image-alt | cross-product-link",
  "extractionPattern": "description of the HTML pattern to extract colors",
  "missingReason": "explanation of why colors are being missed by the sync",
  "fixCode": "TypeScript code snippet to fix the issue (include function name and line context)",
  "colorMappings": {
    "color name": "#hexcode"
  }
}

Focus on:
1. Compare what the scraper LOGGED as its decisions vs what the website actually shows
2. Identify the specific extraction step that went wrong (color_extraction, product_line, hex_lookup)
3. Explain WHY the scraper made the wrong decision based on its logged input/output
4. Provide exact code fix with context from the sync function`;

  try {
    console.log("[PostSyncCheck] Calling Lovable AI for enhanced website analysis with decision logs...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[PostSyncCheck] AI gateway error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("[PostSyncCheck] Empty AI response");
      return null;
    }

    console.log("[PostSyncCheck] AI analysis received, parsing response...");
    
    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const analysis = JSON.parse(jsonStr.trim()) as AIWebsiteAnalysis;
    console.log("[PostSyncCheck] AI analysis parsed successfully:", analysis.swatchType);
    
    return analysis;
  } catch (error) {
    console.error("[PostSyncCheck] AI analysis error:", error);
    return null;
  }
}

function generateAIFixPrompt(
  brand: string, 
  brandSlug: string, 
  checks: CheckResult[], 
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
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

  // Build AI insights section if available
  let aiInsightsSection = '';
  if (aiAnalysis) {
    aiInsightsSection = `
---

## 🤖 AI Website Analysis Results (Enhanced with Sync Logs)

**Swatch Architecture Detected**: ${aiAnalysis.swatchType}

${aiAnalysis.rootCause ? `### Root Cause Analysis
${aiAnalysis.rootCause}
` : ''}

${aiAnalysis.wrongDecisions?.length ? `### Wrong Decisions Identified
${aiAnalysis.wrongDecisions.map(d => `- ${d}`).join('\n')}
` : ''}

${aiAnalysis.correctBehavior ? `### Correct Behavior Expected
${aiAnalysis.correctBehavior}
` : ''}

**Extraction Pattern**:
${aiAnalysis.extractionPattern}

**Missing Reason**:
${aiAnalysis.missingReason}

### Recommended Code Fix

Update the sync logic in \`_shared/${brandSlug}-defaults.ts\`:

\`\`\`typescript
${aiAnalysis.fixCode}
\`\`\`

### Missing Color Hex Mappings

Add these to the \`COLOR_HEX_MAP\` in \`_shared/${brandSlug}-defaults.ts\`:

\`\`\`typescript
// Add to COLOR_HEX_MAP
${Object.entries(aiAnalysis.colorMappings || {}).map(([name, hex]) => `'${name.toLowerCase()}': '${hex}',`).join('\n')}
\`\`\`

---`;
  }

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
${aiInsightsSection}

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

## The Five Consistency Rules

1. **Names Match**: DB title = Filament Detail title = Product Page <h1> (use actual Shopify title, not constructed)
2. **Color/Swatch Accuracy**: Website swatch COUNT and NAMES match DB for the product_line_id
3. **Color/Hex Uniqueness**: No duplicate hex codes within same product_line_id
4. **Price Match**: DB price matches website price for the specific variant (within 5%)
5. **Structural Integrity**: Each product_line_id groups products of same material and base product type

**Note**: "URL Consistency" is NOT required for cross-product swatch brands (3D-Fuel, Polymaker, etc.) where each color is a separate product URL.

---

## Cross-Product Swatch Architecture (CRITICAL)

Brands like 3D-Fuel, Polymaker, Hatchbox, Sunlu show color swatches as LINKS TO OTHER PRODUCTS:
- Each color variant IS a different Shopify product with its own URL
- The "swatches" are linked images with alt text like "Standard PLA+, Desert Tan, 1.75mm"
- This is NOT an error - it's the expected architecture!

The sync MUST:
1. Use the actual Shopify product title (not reconstruct it)
2. Extract color from alt text or variant options correctly
3. Group by product_line_id based on product type, not URL

---

## Multi-Material Product Handling (CRITICAL)

Some products like ReFuel contain multiple materials in ONE Shopify product:
- option1 = Material Type (e.g., "Standard PLA+", "Tough Pro PLA+", "Pro PCTG")
- option3 = Color Name (e.g., "Natural")

The sync MUST:
1. Detect TRUE multi-material products (ReFuel only, containing "recycled")
2. Create SEPARATE product_line_ids for each material (e.g., 3dfuel__refuel-standard-pla, 3dfuel__refuel-tough-pro-pla)
3. Extract color from option3, NOT option1
4. Use deduplication hash (productLineId|colorName|weight) to prevent duplicate entries

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
 * Extract product line name from alt text
 * e.g., "Standard PLA+, Desert Tan, 1.75mm" -> "standard pla+"
 */
function extractProductLineFromAltText(altText: string): string | null {
  const parts = altText.split(',');
  if (parts.length >= 2) {
    return parts[0].trim().toLowerCase();
  }
  return null;
}

/**
 * Check if two product lines are the same (from alt text comparison)
 */
function productLinesMatchByName(line1: string | null, line2: string | null): boolean {
  if (!line1 || !line2) return true; // If we can't determine, allow it
  
  const norm1 = line1.toLowerCase().replace(/[+\-]/g, '').replace(/\s+/g, ' ').trim();
  const norm2 = line2.toLowerCase().replace(/[+\-]/g, '').replace(/\s+/g, ' ').trim();
  
  if (norm1 === norm2) return true;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Check synonyms
  for (const [canonical, synonyms] of Object.entries(PRODUCT_LINE_SYNONYMS)) {
    const allVariants = [canonical, ...synonyms];
    const match1 = allVariants.some(v => norm1.includes(v.replace(/[+\-]/g, '')) || v.replace(/[+\-]/g, '').includes(norm1));
    const match2 = allVariants.some(v => norm2.includes(v.replace(/[+\-]/g, '')) || v.replace(/[+\-]/g, '').includes(norm2));
    if (match1 && match2) return true;
  }
  
  return false;
}

/**
 * Extract product info from scraped page HTML
 * 
 * Key extraction strategy for 3D-Fuel and similar brands:
 * - These brands use cross-product color swatches (links to other products)
 * - The swatch images have alt text like "Standard PLA+, Desert Tan, 1.75mm"
 * - We need to extract just the color name (second part of the comma-separated string)
 * - We filter swatches to only count those matching the current page's product line
 */
function extractProductInfoFromHtml(html: string, markdown: string, currentProductUrl?: string): ScrapedProductInfo {
  const result: ScrapedProductInfo = {
    pageTitle: '',
    colorSwatches: [],
    statusCode: 200,
  };
  
  // We'll determine the current product line from the page title (first extraction)
  let currentProductLine: string | null = null;
  
  const addColorSwatch = (name: string, productUrl?: string) => {
    const trimmed = name.trim();
    if (isValidColorName(trimmed) && 
        !result.colorSwatches.find(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      result.colorSwatches.push({ name: trimmed, productUrl });
    }
  };
  
  // Extract page title from <h1> or meta title
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    result.pageTitle = h1Match[1].trim();
    // Extract current product line from page title (first part before comma)
    currentProductLine = extractProductLineFromAltText(result.pageTitle);
  } else {
    // Try <h3> (3D-Fuel uses this)
    const h3Match = html.match(/<h3[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h3>/i);
    if (h3Match) {
      result.pageTitle = h3Match[1].trim();
      currentProductLine = extractProductLineFromAltText(result.pageTitle);
    } else {
      // Try to get from <title> tag
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        // Clean up title (often has "– Brand Name" suffix)
        result.pageTitle = titleMatch[1].split('–')[0].split('|')[0].trim();
        currentProductLine = extractProductLineFromAltText(result.pageTitle);
      }
    }
  }
  
  console.log(`[PostSyncCheck] Current product line from page: "${currentProductLine}"`);
  
  // ========== PATTERN 1: Linked images with href and alt text ==========
  // Captures both the product URL and color info from swatch links
  // Pattern: <a href="/products/xxx"><img alt="Product Line, Color, 1.75mm"></a>
  const linkedSwatchPattern = /<a[^>]*href="([^"]*\/products\/[^"]+)"[^>]*>(?:\s*<[^>]*>)*\s*<img[^>]*alt="([^"]+)"[^>]*>/gi;
  for (const match of html.matchAll(linkedSwatchPattern)) {
    const productUrl = match[1];
    const altText = match[2];
    const parts = altText.split(',');
    if (parts.length >= 2) {
      // Color is the 2nd part: "Desert Tan" from "Standard PLA+, Desert Tan, 1.75mm"
      const colorName = parts[1].trim();
      if (colorName && !colorName.match(/\d+\.\d+mm$/i)) {
        // Extract product line from the swatch alt text (first part)
        const swatchProductLine = extractProductLineFromAltText(altText);
        
        // Only add if swatch is from the SAME product line (matching by alt text, not URL)
        if (productLinesMatchByName(currentProductLine, swatchProductLine)) {
          addColorSwatch(colorName, productUrl);
        } else {
          console.log(`[PostSyncCheck] Skipping swatch "${colorName}" (product line "${swatchProductLine}" != "${currentProductLine}")`);
        }
      }
    }
  }
  
  // ========== PATTERN 2: Linked images with alt text containing comma-separated values ==========
  // Fallback for when pattern 1 doesn't match
  const imgAltMatches = html.matchAll(/<img[^>]*alt="([^"]*,[^"]+)"[^>]*>/gi);
  for (const match of imgAltMatches) {
    const altText = match[1];
    const parts = altText.split(',');
    if (parts.length >= 2) {
      const potentialColor = parts[1].trim();
      const swatchProductLine = extractProductLineFromAltText(altText);
      // Skip if it looks like a size/diameter, or if product line doesn't match
      if (!potentialColor.match(/\d+\.\d+mm$/i) && !potentialColor.match(/^\d+/)) {
        if (productLinesMatchByName(currentProductLine, swatchProductLine)) {
          addColorSwatch(potentialColor);
        }
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
  
  console.log(`[PostSyncCheck] Found ${result.colorSwatches.length} swatches for product line "${currentProductLine}"`);
  
  return result;
}

// Old URL-based functions removed - now using alt-text based product line matching

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
 * Normalize a product line name to canonical form
 */
function normalizeProductLine(line: string): string {
  let normalized = line.toLowerCase().trim();
  
  // Strip version indicators like "v2", "v2Hemp", "v3"
  normalized = normalized.replace(/\s*v\d+\s*/gi, ' ');
  
  // Strip "hemp" suffix for matching (Entwined == Entwined Hemp)
  normalized = normalized.replace(/\s*hemp\b/gi, '');
  
  // Check synonyms
  for (const [canonical, synonyms] of Object.entries(PRODUCT_LINE_SYNONYMS)) {
    if (synonyms.some(s => normalized.includes(s)) || normalized.includes(canonical)) {
      return canonical;
    }
  }
  
  // Clean up and return
  return normalized
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two titles are equivalent despite different formats
 */
function titlesAreEquivalent(dbTitle: string, pageTitle: string): boolean {
  const dbParts = extractTitleComponents(dbTitle);
  const pageParts = extractTitleComponents(pageTitle);
  
  if (dbParts && pageParts) {
    // Normalize product lines for comparison (handles Entwined vs Entwined v2Hemp)
    const dbLine = normalizeProductLine(dbParts.productLine);
    const pageLine = normalizeProductLine(pageParts.productLine);
    
    const lineMatch = dbLine.includes(pageLine) || 
                      pageLine.includes(dbLine) ||
                      dbLine === pageLine;
    
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

    // Check 4 (CRITICAL): Cross-Material Grouping Detection
    // This detects when product_line_id incorrectly groups products with DIFFERENT materials
    // e.g., PLA+, PCTG, and PETG products all sharing the same product_line_id
    const { data: crossMaterialData, error: crossMaterialError } = await supabase
      .from("filaments")
      .select("id, product_title, product_line_id, material, product_url")
      .ilike("vendor", brandName)
      .not("product_line_id", "is", null)
      .not("material", "is", null);

    if (crossMaterialError) {
      console.error("[PostSyncCheck] Cross-material check error:", crossMaterialError);
    }

    // Group by product_line_id and check for multiple materials
    const lineIdMaterials: Record<string, { materials: Set<string>; products: NonNullable<typeof crossMaterialData> }> = {};
    for (const product of crossMaterialData || []) {
      const lineId = product.product_line_id!;
      if (!lineIdMaterials[lineId]) {
        lineIdMaterials[lineId] = { materials: new Set(), products: [] };
      }
      lineIdMaterials[lineId].materials.add(product.material!);
      lineIdMaterials[lineId].products!.push(product);
    }

    const crossMaterialIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    for (const [lineId, data] of Object.entries(lineIdMaterials)) {
      if (data.materials.size > 1) {
        // This product line groups multiple materials - critical data corruption!
        const materialsList = Array.from(data.materials).join(', ');
        const sampleProduct = data.products[0];
        crossMaterialIssues.push({
          id: sampleProduct.id,
          title: lineId,
          issue: `CRITICAL: Groups ${data.materials.size} different materials (${materialsList}) - should be separate product lines`,
          url: sampleProduct.product_url || undefined,
        });
        console.error(`[PostSyncCheck] CRITICAL: ${lineId} groups materials: ${materialsList}`);
      }
    }

    checks.push({
      checkName: "No Cross-Material Grouping",
      status: crossMaterialIssues.length === 0 ? "pass" : "fail",
      count: crossMaterialIssues.length,
      details: crossMaterialIssues.length 
        ? `CRITICAL: ${crossMaterialIssues.length} product lines incorrectly group different material types together` 
        : "All product lines contain consistent material types",
      products: crossMaterialIssues.length > 0 ? crossMaterialIssues : undefined,
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
    
    // Collect HTML samples for AI analysis
    const htmlSamples: string[] = [];
    const dbColorData: Array<{ productLine: string; colors: string[] }> = [];

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

          // Collect HTML samples for AI analysis (first 3 pages only)
          if (htmlSamples.length < 3 && html.length > 1000) {
            htmlSamples.push(html);
            // Also collect DB color data for this product line
            dbColorData.push({
              productLine: lineId,
              colors: variants.map(v => {
                const title = v.product_title.toLowerCase();
                const parts = title.split(',');
                return parts.length >= 2 ? parts[1].trim() : '';
              }).filter(Boolean),
            });
          }

          // Extract product info from the page, passing URL for product line filtering
          const pageInfo = extractProductInfoFromHtml(html, markdown, representative.product_url);
          
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

    // ============= SWATCH UNIQUENESS CHECK (CRITICAL) =============
    // Duplicate hex codes within same product line indicates data corruption
    let swatchIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Check for duplicate hex codes within product lines
    for (const lineId of productLineIds.slice(0, 20)) { // Check more lines
      const variants = productLineGroups[lineId];
      if (!variants || variants.length <= 1) continue;

      const hexCounts: Record<string, number> = {};
      const nullHexCount = variants.filter(v => !v.color_hex).length;
      
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
            issue: `CRITICAL: ${count} variants share same hex code - causes UI to show wrong color count`,
          });
        }
      }
      
      // Also flag missing hex codes as a data quality issue
      if (nullHexCount > 0 && nullHexCount < variants.length) {
        swatchIssues.push({
          id: variants[0].id,
          title: `${lineId}`,
          issue: `${nullHexCount}/${variants.length} variants missing color_hex`,
        });
      }
    }

    checks.push({
      checkName: "Swatch Uniqueness (No Duplicate Hex)",
      status: swatchIssues.length === 0 ? "pass" : "fail", // CRITICAL - always fail on duplicates
      count: swatchIssues.length,
      details: swatchIssues.length === 0 
        ? "No duplicate hex codes within product lines" 
        : `CRITICAL: ${swatchIssues.length} duplicate/missing hex codes found - causes wrong color counts in UI`,
      products: swatchIssues.length > 0 ? swatchIssues : undefined,
    });

    // ============= PRICE CONSISTENCY CHECK (NEW) =============
    // Validate DB prices are reasonable (not $0 or suspicious values)
    const { data: priceCheckData } = await supabase
      .from("filaments")
      .select("id, product_title, variant_price, product_url")
      .ilike("vendor", brandName)
      .or("variant_price.is.null,variant_price.eq.0,variant_price.lt.5,variant_price.gt.100");

    const priceIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    for (const p of priceCheckData || []) {
      let issue = '';
      if (p.variant_price === null) issue = 'Price is NULL';
      else if (p.variant_price === 0) issue = 'Price is $0';
      else if (p.variant_price < 5) issue = `Price too low: $${p.variant_price}`;
      else if (p.variant_price > 100) issue = `Price unusually high: $${p.variant_price}`;
      
      if (issue) {
        priceIssues.push({
          id: p.id,
          title: p.product_title,
          issue,
          url: p.product_url || undefined,
        });
      }
    }

    checks.push({
      checkName: "Price Validity",
      status: priceIssues.length === 0 ? "pass" : priceIssues.length <= 3 ? "warning" : "fail",
      count: priceIssues.length,
      details: priceIssues.length === 0 
        ? "All prices are in valid range ($5-$100)" 
        : `${priceIssues.length} products have suspicious prices`,
      products: priceIssues.length > 0 ? priceIssues : undefined,
    });

    // ============= PRODUCT LINE URL CONSISTENCY CHECK (UPDATED) =============
    // CRITICAL FIX: 3D-Fuel and similar brands use "cross-product swatch" architecture
    // where each color variant IS a different product with its own URL.
    // This is NOT an error - it's the expected architecture!
    // 
    // Instead of failing on multiple URLs, we:
    // 1. Check if URLs share the same PRODUCT LINE pattern (handle prefix)
    // 2. Only flag as error if URLs point to DIFFERENT product lines
    const urlConsistencyIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    
    // Check if this brand uses cross-product swatch architecture
    const isCrossProductSwatchBrand = IMAGE_SWATCH_BRANDS.includes(brandSlug);
    
    for (const lineId of productLineIds.slice(0, 15)) {
      const variants = productLineGroups[lineId];
      if (!variants || variants.length <= 1) continue;
      
      const urls = variants.map(v => v.product_url).filter(Boolean);
      
      if (isCrossProductSwatchBrand) {
        // For cross-product brands: Check if URLs belong to same product LINE (pattern-based)
        // Extract handle patterns: "standard-pla-*", "tough-pro-pla-*", etc.
        const handlePatterns = urls.map(url => {
          try {
            const parsed = new URL(url!);
            const handle = parsed.pathname.split('/products/')[1] || '';
            // Extract pattern: remove color suffix, keep product line prefix
            // e.g., "standard-pla-desert-tan-1-75mm" -> "standard-pla"
            const parts = handle.split('-');
            // Find where diameter starts (1-75mm or similar)
            const diamIdx = parts.findIndex(p => /^\d/.test(p));
            if (diamIdx > 2) {
              return parts.slice(0, Math.min(diamIdx - 1, 3)).join('-');
            }
            return parts.slice(0, 3).join('-');
          } catch {
            return '';
          }
        }).filter(Boolean);
        
        const uniquePatterns = new Set(handlePatterns);
        
        // Only flag if there are DIFFERENT product line patterns (not just different colors)
        if (uniquePatterns.size > 2) {
          urlConsistencyIssues.push({
            id: variants[0].id,
            title: lineId,
            issue: `${uniquePatterns.size} different product line patterns detected - possible grouping error (patterns: ${Array.from(uniquePatterns).slice(0, 3).join(', ')})`,
            url: variants[0].product_url || undefined,
          });
        }
        // Note: Multiple URLs with same pattern is EXPECTED for cross-product brands
      } else {
        // For regular brands: All variants should point to same product URL
        const uniqueBaseUrls = new Set(urls.map(url => {
          try {
            const parsed = new URL(url!);
            return parsed.pathname;
          } catch {
            return url;
          }
        }));
        
        if (uniqueBaseUrls.size > 1) {
          urlConsistencyIssues.push({
            id: variants[0].id,
            title: lineId,
            issue: `${uniqueBaseUrls.size} different URLs in same product line - possible grouping error`,
            url: variants[0].product_url || undefined,
          });
        }
      }
    }

    checks.push({
      checkName: "Product Line URL Consistency",
      status: urlConsistencyIssues.length === 0 ? "pass" : urlConsistencyIssues.length <= 1 ? "warning" : "fail",
      count: urlConsistencyIssues.length,
      details: urlConsistencyIssues.length === 0 
        ? (isCrossProductSwatchBrand 
            ? "All product lines have consistent URL patterns (cross-product swatch brand)" 
            : "All product lines have consistent URLs")
        : `${urlConsistencyIssues.length} product lines have inconsistent URL patterns`,
      products: urlConsistencyIssues.length > 0 ? urlConsistencyIssues : undefined,
    });

    // Calculate overall status
    const failCount = checks.filter((c) => c.status === "fail").length;
    const warnCount = checks.filter((c) => c.status === "warning").length;
    
    let overallStatus: "pass" | "warning" | "fail" = "pass";
    if (failCount > 0) overallStatus = "fail";
    else if (warnCount > 0) overallStatus = "warning";

    // Run AI analysis if there are failures and we have HTML samples
    let aiAnalysis: AIWebsiteAnalysis | null = null;
    const failingChecks = checks.filter(c => c.status === 'fail' || c.status === 'warning');
    
    // Fetch decision logs for AI analysis
    let decisionLogs: DecisionLogEntry[] = [];
    if (failingChecks.length > 0) {
      const failingProductIds = failingChecks
        .flatMap(c => c.products?.map(p => p.id) || [])
        .filter(Boolean);
      decisionLogs = await fetchDecisionLogs(supabase, brandSlug, failingProductIds);
      console.log(`[PostSyncCheck] Fetched ${decisionLogs.length} decision logs for AI analysis`);
    }
    
    if (failingChecks.length > 0 && (htmlSamples.length > 0 || decisionLogs.length > 0)) {
      console.log(`[PostSyncCheck] Running enhanced AI analysis with ${htmlSamples.length} HTML samples and ${decisionLogs.length} decision logs...`);
      aiAnalysis = await analyzeWebsiteWithAI(
        brandName,
        brandSlug,
        htmlSamples,
        failingChecks,
        dbColorData,
        decisionLogs
      );
    }

    // Generate AI fix prompt if there are issues (now with AI analysis)
    const aiFixPrompt = generateAIFixPrompt(brandName, brandSlug, checks, totalProducts || 0, aiAnalysis);

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
