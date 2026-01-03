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
  profileUpdated?: boolean;
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
// Also includes cross-product swatch brands where each color is a separate product URL
const IMAGE_SWATCH_BRANDS = ['3d-fuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'overture', 'anycubic'];

// Brands known to block Firecrawl/scrapers (redirect to cart, captcha, etc.)
const SCRAPER_BLOCKED_BRANDS = ['3dhojor'];

// Page titles that indicate the scraper was blocked (not real title mismatches)
const SCRAPER_BLOCKED_TITLES = [
  'shopping cart',
  'access denied',
  'please verify',
  'captcha',
  'robot',
  '403 forbidden',
  'blocked',
  'verification required',
  'just a moment',
  'cloudflare',
];

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
  '3d-fuel', '3dfuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'overture', 'amolen',
  // Generic terms
  'buy', 'add', 'cart', 'shop', 'view', 'select', 'choose', 'now', 'new', 'sale',
  // Product features/packaging (frequently misidentified as colors)
  'vacuum', 'bags', 'bag', 'matte', 'surface', 'texture', 'finish',
  'glossy', 'shiny', 'package', 'packaging', 'roll',
  'printing', 'print', 'printer', '3d', 'quality',
  'material', 'diameter', 'weight', 'net', 'gross', 'tolerance',
  'temperature', 'nozzle', 'bed', 'settings', 'recommended',
  'uv', 'change', 'glow', 'dark', 'flexible', 'basic',
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

// AI Role definitions based on issue types
const AI_ROLES = {
  dataEngineer: {
    title: 'Lead Data Engineer',
    triggers: ['bulk', 'sample', '2.85mm', 'weight', 'diameter', 'filtering'],
    capabilities: [
      'Data validation pipeline design and implementation',
      'Schema optimization and filtering logic',
      'Weight/diameter constraint enforcement',
      'Database query optimization',
      'Bulk data processing strategies'
    ]
  },
  scrapingEngineer: {
    title: 'Senior Web Scraping Engineer',
    triggers: ['title', 'url', 'scrape', 'page', 'consistency', 'mismatch'],
    capabilities: [
      'HTML parsing and DOM traversal',
      'Shopify/e-commerce site structure analysis',
      'Anti-bot detection avoidance strategies',
      'Dynamic content extraction',
      'Rate limiting and retry strategies'
    ]
  },
  colorSpecialist: {
    title: 'Color Data Specialist',
    triggers: ['color', 'swatch', 'hex', 'uniqueness'],
    capabilities: [
      'Color name extraction and normalization',
      'Hex code mapping and validation',
      'Swatch architecture analysis (CSS vs image-based)',
      'Cross-product color linking logic',
      'Color family categorization'
    ]
  },
  pricingAnalyst: {
    title: 'E-Commerce Pricing Analyst',
    triggers: ['price', 'validity', 'currency'],
    capabilities: [
      'Price extraction and validation',
      'Currency conversion and normalization',
      'Compare-at-price logic',
      'Price anomaly detection',
      'Multi-region pricing strategies'
    ]
  },
  architect: {
    title: 'Chief Technical Architect',
    triggers: [], // Fallback for mixed issues
    capabilities: [
      'Full-stack web development',
      'Database architecture and optimization',
      'Web scraping automation',
      'Data quality and validation',
      'System integration and debugging'
    ]
  }
};

/**
 * Determine the best AI role based on failing check types
 */
function determineAIRole(checks: CheckResult[]): { title: string; capabilities: string[] } {
  const failingChecks = checks.filter(c => c.status === 'fail' || c.status === 'warning');
  const checkNames = failingChecks.map(c => c.checkName.toLowerCase()).join(' ');
  
  // Count matches for each role
  const roleScores: Record<string, number> = {};
  
  for (const [key, role] of Object.entries(AI_ROLES)) {
    roleScores[key] = role.triggers.filter(t => 
      checkNames.includes(t.toLowerCase())
    ).length;
  }
  
  // Find role with highest score, default to architect for ties/none
  const bestRole = Object.entries(roleScores)
    .sort((a, b) => b[1] - a[1])
    .find(([key, score]) => score > 0);
  
  if (bestRole) {
    return AI_ROLES[bestRole[0] as keyof typeof AI_ROLES];
  }
  
  return AI_ROLES.architect; // Fallback
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
  
  // Determine the best AI role for this specific set of issues
  const role = determineAIRole(checks);
  
  // Determine brand-specific sync file path
  const hasDedicatedSyncFunction = [
    'anycubic', 'amolen', 'polymaker', 'hatchbox', '3d-fuel', 'sunlu', 
    'eryone', 'overture', 'push-plastic', 'proto-pasta', '3dxtech', 
    'ninjatek', 'fiberlogy', 'colorfabb', 'prusament'
  ].includes(brandSlug);
  
  const syncFilePath = hasDedicatedSyncFunction 
    ? `supabase/functions/sync-${brandSlug}-products/index.ts`
    : `supabase/functions/sync-brand-products/index.ts`;
  
  const defaultsFilePath = `supabase/functions/_shared/${brandSlug}-defaults.ts`;
  
  // Build role preamble section
  const roleSection = `You are the **${role.title}** for Filascope, a comprehensive 3D printing filament database and comparison platform.

### CORE CAPABILITIES YOU MUST APPLY

${role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n')}

### HOW YOU APPROACH PROBLEMS

- **Think Modularly**: Break complex features into discrete, testable components.
- **Anticipate Scale**: Design for growth with proper indexing and optimization.
- **Prioritize Data Quality**: Scraped data must be accurate, consistent, and complete.
- **Iterate Strategically**: Clarify scope first, then execute methodically.

### CONSTRAINTS & GUARDRAILS

- Always check robots.txt and terms of service before scraping
- Keep Edge Functions under 10 second execution time
- Never expose scraping URLs or API keys in frontend code
- Test changes with sample data before full sync

---

`;

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

  // Build promotional product guidance if relevant
  const hasPromotionalIssues = [...failedChecks, ...warningChecks].some(c => 
    c.products?.some(p => 
      p.title?.toLowerCase().includes('buy') || 
      p.title?.toLowerCase().includes('flash') || 
      p.title?.toLowerCase().includes('promo') ||
      p.issue?.toLowerCase().includes('promo')
    )
  );

  const promotionalSection = hasPromotionalIssues ? `
### 6. For Promotional Product Grouping Issues

Promotional products (Buy X Get Y, Flash Sale, etc.) should:
- **Group with regular products** of the same type (NOT separate product_line_ids!)
- Have promotional text stripped BEFORE generating product_line_id
- Use the base product title (e.g., "PLA Silk" not "PLA Silk - Buy 2, Get 1 Free")

**Fix Pattern**:
\`\`\`typescript
// In ${defaultsFilePath}, add stripPromotionalFromTitle():
function stripPromotionalFromTitle(title: string): string {
  return title
    .replace(/\\s*-?\\s*buy\\s+\\d+[,\\s]*get\\s+\\d+(\\s+free)?/gi, '')
    .replace(/\\s*-?\\s*flash\\s+(deal|sale)/gi, '')
    .replace(/\\s*-?\\s*christmas\\s+(box|sale|deal|bulk)/gi, '')
    .replace(/\\s*-?\\s*b2g1/gi, '')
    .trim();
}

// Then use it in generateProductLineId() BEFORE any other processing:
const strippedTitle = stripPromotionalFromTitle(title);
const cleanedTitle = cleanTitle(strippedTitle).toLowerCase();
\`\`\`

**Database Cleanup SQL** (run after deploying fix):
\`\`\`sql
-- Normalize promotional product_line_ids to their base products
UPDATE filaments 
SET product_line_id = REGEXP_REPLACE(product_line_id, '_promo_[^_]+$', ''),
    updated_at = NOW()
WHERE vendor ILIKE '%${brand}%'
AND product_line_id ~ '_promo_';

-- Example: Normalize PLA Silk promo to regular PLA Silk
UPDATE filaments 
SET product_line_id = '${brandSlug}__pla__silk'
WHERE vendor ILIKE '%${brand}%'
AND product_line_id LIKE '%pla%silk%promo%';
\`\`\`

` : '';

  // Available APIs and Tools section
  const availableToolsSection = `
---

## Available APIs and Tools

The following external APIs are pre-configured and available as environment variables in edge functions:

### Firecrawl API (\`FIRECRAWL_API_KEY\`)

A powerful web scraping and crawling API that is **already configured** and available. Use it for:
- **Scrape**: Extract content from a single URL (HTML, markdown, screenshots, links)
- **Map**: Quickly discover all URLs on a website (fast sitemap generation)
- **Search**: Perform web search with optional content scraping
- **Crawl**: Recursively scrape all pages on a website

**Usage in Edge Functions:**

\`\`\`typescript
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

// Scrape a single product page to get H1 title
const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${firecrawlApiKey}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: productUrl,
    formats: ['html'],
    onlyMainContent: false,
    waitFor: 2000,  // Wait for JS to load
  }),
});

const data = await response.json();
const html = data.data?.html || '';

// Extract H1 title
const h1Match = html.match(/<h1[^>]*>([^<]+)<\\/h1>/i);
const pageTitle = h1Match?.[1]?.trim() || null;
\`\`\`

**Key Parameters:**
- \`formats\`: 'html' | 'markdown' | 'screenshot' | 'links' | 'rawHtml'
- \`onlyMainContent\`: true to exclude headers/footers (default: false for full page)
- \`waitFor\`: milliseconds to wait for dynamic content (default: 0)

**Best Practices:**
- Use **parallel batching** (5-10 concurrent requests) for multiple URLs to avoid timeout
- Add **timeout protection** for large syncs (50+ products)
- Cache scraped HTML in decision logs for debugging
- Always access response data via \`data.data?.field\` (nested structure)

---

`;

  const prompt = `${roleSection}${availableToolsSection}## Fix Post Sync Check Issues for ${brand}

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
File: \`${syncFilePath}\`
${hasDedicatedSyncFunction ? '' : `\n(Note: ${brand} uses the generic sync function. Consider checking if brand-specific defaults file exists at \`${defaultsFilePath}\`)`}

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
- Add missing colors to the brand's color hex map in \`${defaultsFilePath}\`
- Ensure \`extractColorFromVariant()\` properly parses swatch names from the page

### 5. For Weight/Diameter Filtering Issues

Use the shared \`variant-filters.ts\` utility:

\`\`\`typescript
import { shouldIncludeVariant } from '../_shared/variant-filters.ts';

const filterResult = shouldIncludeVariant(weightGrams, diameterMm, productTitle);
if (!filterResult.include) {
  console.log(\`Skipping variant: \${filterResult.reason}\`);
  continue;
}
\`\`\`

**Filter Constants**:
- MIN_WEIGHT_GRAMS = 300 (excludes samples)
- MAX_WEIGHT_GRAMS = 5500 (excludes bulk)
- STANDARD_DIAMETER_MM = 1.75 (excludes 2.85mm/3.0mm)
- EXCLUDED_TITLE_KEYWORDS = ['sample', 'pack', 'variety', 'bundle', 'combo', 'starter kit', 'trial']
${promotionalSection}
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
  
  // Skip multi-word non-color phrases (common false positives)
  const nonColorPhrases = [
    'vacuum bags', 'matte surface', 'eco friendly', 'high quality',
    'free shipping', 'add to cart', 'buy now', 'in stock',
    'go to item', 'learn more', 'view details', 'more options',
    'payment options', 'delivery option', 'china to', 'u.s. to',
    'sold out', 'out of stock', 'coming soon', 'pre order',
    // Pricing and cart elements
    'sale price', 'regular price', 'compare at price', 'total price',
    'add selected', 'this item', 'order within',
    // Navigation elements
    'skip to content', 'skip to main', 'skip to product',
    // Related products sections (NestScale, Frequently Bought Together)
    'frequently bought', 'bought together', 'related products',
    'you may also', 'customers also', 'recommended for',
    // Product features mistaken for colors
    'estimated delivery', 'ships from', 'days to ship',
    // Anycubic promotional items / accessories (extracted from upsell widgets)
    'detergent container', 'power adapter', 'washing tray', 
    'motherboard', 'curing table', 'wash & cure', 'wash and cure',
    'cure machine', 'get 1 free', 'free gift', 'wash cure',
  ];
  if (nonColorPhrases.some(phrase => lower.includes(phrase))) return false;
  
  // Skip non-color words
  if (NON_COLOR_WORDS.has(lower)) return false;
  
  // For multi-word names, check if ALL words are non-color words
  const words = lower.split(/\s+/);
  if (words.length > 1 && words.every(word => NON_COLOR_WORDS.has(word))) return false;
  
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
    let trimmed = name.trim();
    
    // Decode common HTML entities before storing/comparing
    trimmed = trimmed
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
    
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
  
  // ========== PATTERN 7: Shopify sr-only spans in swatch labels ==========
  // Common in modern Shopify themes like Amolen
  // SCOPED: Only extract from the main variant-picker, NOT from NestScale or "Frequently Bought Together"
  
  // First, try to isolate the main product's variant picker (exclude third-party apps)
  // Remove NestScale product variant sections and "Frequently Bought Together" before extraction
  let scopedHtml = html
    .replace(/<div[^>]*id="[^"]*nestscale[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*nestscale[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<section[^>]*class="[^"]*frequently-bought[^"]*"[^>]*>[\s\S]*?<\/section>/gi, '')
    .replace(/<div[^>]*class="[^"]*frequently-bought[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    // Anycubic: Remove product recommendations sections that contain accessory upsells
    .replace(/<product-recommendations[^>]*>[\s\S]*?<\/product-recommendations>/gi, '')
    .replace(/<div[^>]*class="[^"]*complementary[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*upsell[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Try to find the main variant-picker element
  const variantPickerMatch = scopedHtml.match(/<variant-picker[^>]*>[\s\S]*?<\/variant-picker>/i);
  const colorPickerHtml = variantPickerMatch ? variantPickerMatch[0] : scopedHtml;
  
  // STRICT: Only extract colors from fieldsets with "Color:" or "Theme:" legend
  // This prevents extracting "black" or other colors from Delivery Option fieldsets, image galleries, etc.
  // Theme: is used by Anycubic for bundle deals
  const colorFieldsetMatch = colorPickerHtml.match(/<fieldset[^>]*>[\s\S]*?<legend[^>]*>\s*(?:Color|Theme):?\s*<\/legend>[\s\S]*?<\/fieldset>/gi);
  
  if (colorFieldsetMatch) {
    for (const fieldset of colorFieldsetMatch) {
      // Extract sr-only spans from labels within this Color/Theme fieldset ONLY
      const srOnlyInFieldset = fieldset.matchAll(/<label[^>]*>[\s\S]*?<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>([^<]+)<\/span>/gi);
      for (const match of srOnlyInFieldset) {
        addColorSwatch(match[1]);
      }
    }
  } else {
    // Fallback: If no Color fieldset found, try swatch labels but be more careful
    // Only extract from explicit swatch labels (not generic spans)
    const srOnlyColorMatches = colorPickerHtml.matchAll(/<label[^>]*(?:swatch|thumbnail-swatch|color-swatch)[^>]*>[\s\S]*?<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>([^<]+)<\/span>/gi);
    for (const match of srOnlyColorMatches) {
      addColorSwatch(match[1]);
    }
  }
  
  // ========== PATTERN 8: Anycubic tooltip-based color swatches ==========
  // Anycubic uses bt-tooltip__inner spans for color names
  // Pattern: <label data-color="blue"><span class="bt-tooltip__inner">Blue</span>
  const tooltipColorMatches = colorPickerHtml.matchAll(
    /<label[^>]*data-color="[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*bt-tooltip__inner[^"]*"[^>]*>([^<]+)<\/span>/gi
  );
  for (const match of tooltipColorMatches) {
    addColorSwatch(match[1]);
  }
  
  // Also try variant-radios pattern (Anycubic specific)
  const variantRadiosMatch = colorPickerHtml.matchAll(
    /<variant-radios[^>]*>[\s\S]*?<label[^>]*>[\s\S]*?<span[^>]*class="[^"]*tooltip[^"]*"[^>]*>([^<]+)<\/span>/gi
  );
  for (const match of variantRadiosMatch) {
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

    // Check 1: Bulk Products (>5.5kg / 5500g) - updated to match variant-filters.ts MAX_WEIGHT_GRAMS
    const { data: bulkProducts, error: bulkError } = await supabase
      .from("filaments")
      .select("id, product_title, net_weight_g")
      .ilike("vendor", brandName)
      .gt("net_weight_g", 5500)
      .limit(20);

    if (bulkError) {
      console.error("[PostSyncCheck] Bulk check error:", bulkError);
    }

    checks.push({
      checkName: "No Bulk Products (>5.5kg)",
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

    // Check 3: Sample Products (<300g) - exclude premium materials that legitimately come in small spools
    const { data: sampleProductsRaw, error: sampleError } = await supabase
      .from("filaments")
      .select("id, product_title, net_weight_g, material")
      .ilike("vendor", brandName)
      .lt("net_weight_g", 300)
      .gt("net_weight_g", 0)
      .limit(50);

    if (sampleError) {
      console.error("[PostSyncCheck] Sample check error:", sampleError);
    }

    // Filter out premium materials that legitimately come in 250g spools (PEI, PEEK, PEKK, ESD, TPI, etc.)
    const premiumMaterialPattern = /^(PEI|PEEK|PEKK|ESD-|TPI|PSU|PPS|PPSU|CeramiX|CARBONX.*PEKK|FIBREX.*PEI)/i;
    const sampleProducts = (sampleProductsRaw || []).filter(p => {
      const isPremium = premiumMaterialPattern.test(p.material || '') || 
                        premiumMaterialPattern.test(p.product_title || '');
      return !isPremium;
    }).slice(0, 20);

    checks.push({
      checkName: "No Sample Products (<300g)",
      status: sampleProducts.length === 0 ? "pass" : "fail",
      count: sampleProducts.length,
      details: sampleProducts.length ? `Found ${sampleProducts.length} sample/mini products (premium materials excluded)` : undefined,
      products: sampleProducts.map((p) => ({
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
      .select("id, product_title, product_url, color_hex, product_line_id, color_family")
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
          // For brands that add color suffixes to titles (like 3DXTech), strip the color
          // before comparing to the page H1 which typically shows just the product name
          if (pageInfo.pageTitle) {
            // Check if scraper was blocked (page shows "Shopping Cart", "Access Denied", etc.)
            const pageTitleLower = pageInfo.pageTitle.toLowerCase().trim();
            const isScraperBlocked = SCRAPER_BLOCKED_TITLES.some(t => 
              pageTitleLower.includes(t) || pageTitleLower === t
            );
            
            if (isScraperBlocked) {
              console.log(`[PostSyncCheck] Skipping title check for ${lineId} - scraper appears blocked (page shows: "${pageInfo.pageTitle}")`);
              scrapeErrors.push(`${lineId}: Scraper blocked - page shows "${pageInfo.pageTitle}" instead of product`);
              // Don't add to titleIssues - this is a scraper issue, not a real title mismatch
            } else {
              // Extract color from the representative's title (usually after " - ")
              const colorMatch = representative.product_title.match(/\s+-\s+([^-]+)$/);
              const extractedColor = colorMatch ? colorMatch[1].trim() : '';
              
              // Create base title without color suffix for comparison
              let dbBaseTitle = representative.product_title;
              if (extractedColor) {
                // Remove the color suffix for comparison
                const colorPattern = new RegExp(`\\s*[-–]\\s*${extractedColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
                dbBaseTitle = representative.product_title.replace(colorPattern, '').trim();
              }
              
              // ALSO strip "Filament" from DB title for fair comparison
              // DB titles often include "Filament" suffix (e.g., "PLA+ Filament") which page titles also have
              dbBaseTitle = dbBaseTitle.replace(/\s+Filament\s*/gi, ' ').replace(/\s+/g, ' ').trim();
              
              // Strip promotional text and size/weight/filament specs from page title for comparison
              // Anycubic pages include "Buy 2, Get 1 Free" or "Flash Sale" in H1
              // Amolen pages include "1.75mm, 1KG/2.2LB" in H1 which isn't in DB titles
              let pageBaseTitle = pageInfo.pageTitle
                // Strip promotional text FIRST (Anycubic-style promotions)
                .replace(/\s*-?\s*buy\s+\d+[,\s]*get\s+\d+(\s+free)?/gi, '')
                .replace(/\s*-?\s*flash\s+(deal|sale)/gi, '')
                .replace(/\s*-?\s*christmas\s+(box|sale|deal|bulk)/gi, '')
                .replace(/\s*-?\s*b2g1/gi, '')
                .replace(/\s*-?\s*promo(tion)?/gi, '')
                .replace(/\s*-?\s*special\s+offer/gi, '')
                .replace(/\s*-?\s*limited\s+(time\s+)?offer/gi, '')
                // Then strip size/weight specs
                .replace(/\s+Filament\s*/gi, ' ')
                .replace(/\s*,?\s*\d+\.?\d*\s*mm\s*/gi, ' ')
                .replace(/\s*,?\s*\d+\.?\d*\s*(kg|g|lb)\s*(\/\s*\d+\.?\d*\s*(kg|g|lb))?\s*/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
              
              const similarity = titleSimilarity(dbBaseTitle, pageBaseTitle);
              console.log(`[PostSyncCheck] Title check: DB="${dbBaseTitle}" (color: "${extractedColor}") vs Page="${pageBaseTitle}" (stripped from: "${pageInfo.pageTitle}") (${similarity}% match)`);
              
              if (similarity < 60) {
                titleIssues.push({
                  id: representative.id,
                  title: representative.product_title,
                  issue: `DB title doesn't match page. Page shows: "${pageInfo.pageTitle}" (${similarity}% similarity)`,
                  url: representative.product_url,
                });
              }
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
                  // Handles both "Title, Color" and "Title - Color" formats
                  const title = v.product_title.toLowerCase();
                  
                  // Try " - " format first (Amolen uses this)
                  const dashMatch = title.match(/\s+-\s+([^-]+)$/);
                  if (dashMatch) {
                    return dashMatch[1].trim();
                  }
                  
                  // Fallback to comma format
                  const parts = title.split(',');
                  if (parts.length >= 2) {
                    return parts[1].trim();
                  }
                  
                  // Also check color_family as fallback
                  if (v.color_family) {
                    return v.color_family.toLowerCase();
                  }
                  
                  return '';
                })
                .filter(Boolean)
            );

            const pageColorNames = new Set(
              pageInfo.colorSwatches.map(s => s.name.toLowerCase())
            );

            // Helper to normalize grey/gray spelling differences
            const normalizeColorSpelling = (color: string): string => {
              return color
                .toLowerCase()
                .replace(/\bgrey\b/g, 'gray')
                .replace(/\bcolour\b/g, 'color')
                .trim();
            };

            // Semantic color aliases - page colors that match DB colors semantically
            const COLOR_SEMANTIC_ALIASES: Record<string, string[]> = {
              'multi': ['rainbow', 'multicolor', 'multi-color', 'gradient'],
              'gray': ['silver', 'grey', 'metal silver', 'translucent grey', 'translucent gray'],
              'brown': ['copper', 'bronze', 'translucent brown', 'beige', 'walnut', 'wood'],
              'gold': ['champagne', 'champaign'],
              'green': ['spring leaf', 'olive', 'olive green', 'translucent olive', 'translucent olive green'],
              'blue': ['metal blue', 'steel blue', 'cyan', 'translucent blue', 'tropical turquoise', 'turquoise', 'teal'],
              'pink': ['magenta', 'rose', 'translucent pink', 'peach'],
              'orange': ['translucent orange'],
              'purple': ['violet', 'translucent purple', 'interstellar violet'],
              'red': ['translucent red'],
              'yellow': ['translucent yellow'],
              'clear': ['translucent', 'translucent white', 'translucent clear', 'transparent'],
            };

            // Get all possible alias matches for a color
            const getColorAliases = (color: string): string[] => {
              const normalized = normalizeColorSpelling(color);
              const results = [normalized];
              
              for (const [canonical, aliases] of Object.entries(COLOR_SEMANTIC_ALIASES)) {
                if (aliases.includes(normalized) || normalized === canonical || normalized.includes(canonical)) {
                  results.push(canonical, ...aliases);
                }
              }
              
              return results;
            };

            // Find colors on page that aren't in DB
            const missingColors: string[] = [];
            for (const pageColor of pageColorNames) {
              let found = false;
              const normalizedPageColor = normalizeColorSpelling(pageColor);
              // Extract base color from compound names (e.g., "texture grey" -> "gray")
              const basePageColor = normalizedPageColor.split(' ').pop() || normalizedPageColor;
              const pageAliases = getColorAliases(pageColor);
              
              for (const dbColor of dbColorNames) {
                const normalizedDbColor = normalizeColorSpelling(dbColor);
                const dbAliases = getColorAliases(dbColor);
                
                // Fuzzy match with normalized values
                if (normalizedDbColor.includes(normalizedPageColor) || 
                    normalizedPageColor.includes(normalizedDbColor) ||
                    normalizeTitle(normalizedDbColor) === normalizeTitle(normalizedPageColor) ||
                    // Also check base color extraction (e.g., "texture grey" matches "gray")
                    normalizedDbColor === basePageColor ||
                    normalizedDbColor.includes(basePageColor) ||
                    // Check semantic aliases (e.g., "rainbow" matches "multi")
                    pageAliases.some(pa => dbAliases.includes(pa)) ||
                    pageAliases.some(pa => normalizedDbColor.includes(pa)) ||
                    dbAliases.some(da => normalizedPageColor.includes(da))) {
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
    // UPDATED: Group by COLOR NAME first, then check for hex uniqueness
    // Different weights of the same color (e.g., "Snow White 1kg" and "Snow White 4kg") should share the same hex
    let swatchIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Helper to extract color name from product title (removes weight/diameter)
    const extractColorFromTitle = (title: string): string => {
      // Remove common suffixes: "1.75mm", "2.85mm", "1kg", "4kg", "500g", etc.
      return title
        .replace(/,?\s*\d+(\.\d+)?\s*(kg|g|mm)\b/gi, '')
        .replace(/,?\s*\d+\s*spool\b/gi, '')
        .trim()
        .toLowerCase();
    };
    
    // Check for duplicate hex codes within product lines (grouped by color name)
    for (const lineId of productLineIds.slice(0, 20)) { // Check more lines
      const variants = productLineGroups[lineId];
      if (!variants || variants.length <= 1) continue;

      // Group variants by normalized color name (ignore weight differences)
      const colorGroups: Record<string, Array<typeof variants[0]>> = {};
      for (const v of variants) {
        const colorKey = extractColorFromTitle(v.product_title);
        if (!colorGroups[colorKey]) colorGroups[colorKey] = [];
        colorGroups[colorKey].push(v);
      }
      
      // Now check for duplicate hex codes across DIFFERENT color names
      const colorHexMap: Record<string, string[]> = {}; // hex -> [color names that use it]
      const nullHexCount = variants.filter(v => !v.color_hex).length;
      
      for (const [colorName, colorVariants] of Object.entries(colorGroups)) {
        // Get the hex used by this color (should be consistent within the color group)
        const hexes = colorVariants.filter(v => v.color_hex).map(v => v.color_hex!.toLowerCase());
        const uniqueHexes = [...new Set(hexes)];
        
        for (const hex of uniqueHexes) {
          if (!colorHexMap[hex]) colorHexMap[hex] = [];
          if (!colorHexMap[hex].includes(colorName)) {
            colorHexMap[hex].push(colorName);
          }
        }
      }

      // Only flag as duplicate if DIFFERENT color names share the same hex
      for (const [hex, colorNames] of Object.entries(colorHexMap)) {
        if (colorNames.length > 1) {
          swatchIssues.push({
            id: variants[0].id,
            title: `${lineId}: ${hex}`,
            issue: `CRITICAL: ${colorNames.length} different colors share same hex code (${colorNames.slice(0, 3).join(', ')})`,
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

    // ============= COLOR DISTINGUISHABILITY CHECK =============
    // Validates that each variant in a product line has a unique color identifier
    // (either from product_title or color_family). This ensures swatches can be properly
    // distinguished and displayed on the FilamentDetail page.
    // 
    // Root cause detection: When rainbow/specialty products have identical titles
    // (e.g., all variants titled "PLA Matte Rainbow" without "- Sunset Rainbow" suffix),
    // the frontend can't distinguish them and shows no swatches.
    const colorDistinguishabilityIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Helper to extract color identifier from title (after " - " separator)
    const extractColorIdentifierFromTitle = (title: string): string | null => {
      // Pattern: "Product Name - Color Name" or "Product Name - Color Name, 1.75mm"
      const dashMatch = title.match(/\s+-\s+([^,]+)/);
      if (dashMatch) return dashMatch[1].trim().toLowerCase();
      
      // Pattern: "Product Name, Color Name, 1.75mm"
      const parts = title.split(',');
      if (parts.length >= 2) {
        const potentialColor = parts[1].trim();
        if (!/\d+\.\d+mm/i.test(potentialColor)) {
          return potentialColor.toLowerCase();
        }
      }
      
      return null;
    };
    
    // Fetch color_family data for all variants to enable fallback color identification
    const { data: variantsWithColorFamily } = await supabase
      .from("filaments")
      .select("id, product_title, product_line_id, color_family")
      .ilike("vendor", brandName)
      .not("product_line_id", "is", null);
    
    // Group by product_line_id for checking
    const colorCheckGroups: Record<string, typeof variantsWithColorFamily> = {};
    for (const v of variantsWithColorFamily || []) {
      const lineId = v.product_line_id!;
      if (!colorCheckGroups[lineId]) colorCheckGroups[lineId] = [];
      colorCheckGroups[lineId].push(v);
    }
    
    for (const [lineId, variants] of Object.entries(colorCheckGroups)) {
      if (!variants || variants.length <= 1) continue;
      
      // Check if variants have distinguishable color identifiers
      const indistinguishableVariants: string[] = [];
      
      for (const variant of variants) {
        // Try to extract color from title first
        const colorFromTitle = extractColorIdentifierFromTitle(variant.product_title);
        // Color family is fallback (stored during sync)
        const colorFromFamily = variant.color_family?.toLowerCase() || null;
        
        const colorKey = colorFromTitle || colorFromFamily;
        
        if (!colorKey) {
          // No color identifier found - this variant can't be distinguished
          indistinguishableVariants.push(variant.product_title);
        }
      }
      
      // Flag if multiple variants have no color identifier
      if (indistinguishableVariants.length > 1) {
        colorDistinguishabilityIssues.push({
          id: variants[0].id,
          title: lineId,
          issue: `${indistinguishableVariants.length}/${variants.length} variants have no color identifier in title or color_family. First: "${indistinguishableVariants[0]}"`,
        });
      }
    }
    
    checks.push({
      checkName: "Color Distinguishability (variants identifiable)",
      status: colorDistinguishabilityIssues.length === 0 ? "pass" : "fail",
      count: colorDistinguishabilityIssues.length,
      details: colorDistinguishabilityIssues.length === 0
        ? "All variants have unique color identifiers for swatch display"
        : `${colorDistinguishabilityIssues.length} product lines have variants that cannot be distinguished by color`,
      products: colorDistinguishabilityIssues.length > 0 ? colorDistinguishabilityIssues : undefined,
    });

    // ============= ANYCUBIC-SPECIFIC CHECK: H1 Title Match =============
    // Validates that Anycubic product_title in DB matches the <h1> from whitelist URLs
    // This enforces the "H1 Title Priority" rule documented in brand-sync-docs.ts
    if (brandSlug === 'anycubic' && firecrawlApiKey) {
      console.log('[PostSyncCheck] Running Anycubic H1 Title Match validation...');
      
      // Anycubic whitelist URLs mapped to product_line_id
      const ANYCUBIC_WHITELIST_URLS: Record<string, { url: string; expectedTitle: string }> = {
        'anycubic__plabasicrefill': { url: 'https://store.anycubic.com/products/pla-basic-refill', expectedTitle: 'PLA Basic Refill' },
        'anycubic__plabasic': { url: 'https://store.anycubic.com/products/pla-filament', expectedTitle: 'PLA Basic' },
        'anycubic__plaplus': { url: 'https://store.anycubic.com/products/pla-plus-filament', expectedTitle: 'PLA+ Filament' },
        'anycubic__plaplusrefill': { url: 'https://store.anycubic.com/products/pla-plus-refill', expectedTitle: 'PLA+ Refill' },
        'anycubic__plahighspeed': { url: 'https://store.anycubic.com/products/high-speed-pla-filament', expectedTitle: 'High Speed PLA' },
        'anycubic__plasilk': { url: 'https://store.anycubic.com/products/silk-pla-filament', expectedTitle: 'Silk PLA Filament' },
        'anycubic__plasilkmulticolor': { url: 'https://ca.anycubic.com/products/pla-silk-dual-tri-color-filament', expectedTitle: 'PLA Silk Dual/Tri-Color Filament' },
        'anycubic__plaspecial': { url: 'https://ca.anycubic.com/products/pla-special', expectedTitle: 'PLA Special' },
        'anycubic__plaglow': { url: 'https://store.anycubic.com/products/pla-glow', expectedTitle: 'PLA Glow' },
        'anycubic__plamarble': { url: 'https://store.anycubic.com/products/pla-marble', expectedTitle: 'PLA Marble' },
        'anycubic__plagalaxy': { url: 'https://store.anycubic.com/products/pla-galaxy', expectedTitle: 'PLA Galaxy' },
        'anycubic__plamatte': { url: 'https://store.anycubic.com/products/matte-pla-filament', expectedTitle: 'Matte PLA Filament' },
        'anycubic__plametal': { url: 'https://store.anycubic.com/products/pla-metal-filament', expectedTitle: 'PLA Metal' },
        'anycubic__petg': { url: 'https://ca.anycubic.com/products/petg', expectedTitle: 'PETG' },
        'anycubic__petgtranslucent': { url: 'https://ca.anycubic.com/products/petg-translucent', expectedTitle: 'PETG Translucent' },
        'anycubic__abs': { url: 'https://store.anycubic.com/products/abs-filament', expectedTitle: 'ABS Filament' },
        'anycubic__asa': { url: 'https://store.anycubic.com/products/asa-filament', expectedTitle: 'ASA Filament' },
        'anycubic__pc': { url: 'https://store.anycubic.com/products/pc-filament', expectedTitle: 'PC Filament' },
        'anycubic__tpu': { url: 'https://store.anycubic.com/products/tpu-filament', expectedTitle: 'TPU Filament' },
      };

      const anycubicH1Issues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
      let anycubicCheckedCount = 0;

      // Get unique Anycubic product lines from DB (use variantsWithColorFamily already fetched)
      const anycubicProductLines = [...new Set(
        (variantsWithColorFamily || [])
          .map(f => f.product_line_id)
          .filter(Boolean)
      )] as string[];

      for (const productLineId of anycubicProductLines.slice(0, 10)) { // Check up to 10 product lines
        const whitelistEntry = ANYCUBIC_WHITELIST_URLS[productLineId];
        if (!whitelistEntry) continue;

        // Get representative DB title for this product line
        const dbFilament = (variantsWithColorFamily || []).find(f => f.product_line_id === productLineId);
        if (!dbFilament) continue;

        const dbTitle = dbFilament.product_title;

        try {
          // Scrape the whitelist URL to get the actual H1 title
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: whitelistEntry.url,
              formats: ['html'],
              onlyMainContent: false,
              waitFor: 2000,
            }),
          });

          if (!scrapeResponse.ok) {
            console.log(`[PostSyncCheck] Anycubic H1 check: Failed to scrape ${whitelistEntry.url}`);
            continue;
          }

          const scrapeData = await scrapeResponse.json();
          const html = scrapeData.data?.html || scrapeData.html || '';

          // Extract H1 from scraped HTML
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          const scrapedH1 = h1Match ? h1Match[1].trim() : null;

          if (!scrapedH1) {
            console.log(`[PostSyncCheck] Anycubic H1 check: No H1 found on ${whitelistEntry.url}`);
            continue;
          }

          anycubicCheckedCount++;

          // Normalize titles for comparison (strip promotional text, specs, "Filament")
          const normalizeForComparison = (title: string): string => {
            return title
              .replace(/\s*-?\s*buy\s+\d+[,\s]*get\s+\d+(\s+free)?/gi, '')
              .replace(/\s*-?\s*flash\s+(deal|sale)/gi, '')
              .replace(/\s*-?\s*christmas\s+(box|sale|deal|bulk)/gi, '')
              .replace(/\s*-?\s*b2g1/gi, '')
              .replace(/\s+Filament\s*/gi, ' ')
              .replace(/\s*,?\s*\d+\.?\d*\s*mm\s*/gi, ' ')
              .replace(/\s*,?\s*\d+\.?\d*\s*(kg|g|lb)\s*(\/\s*\d+\.?\d*\s*(kg|g|lb))?\s*/gi, '')
              .replace(/\s+/g, ' ')
              .trim()
              .toLowerCase();
          };

          const normalizedDb = normalizeForComparison(dbTitle);
          const normalizedH1 = normalizeForComparison(scrapedH1);

          // Calculate similarity
          const similarity = titleSimilarity(normalizedDb, normalizedH1);

          console.log(`[PostSyncCheck] Anycubic H1 check: "${productLineId}" DB="${normalizedDb}" H1="${normalizedH1}" (${similarity}%)`);

          if (similarity < 70) {
            anycubicH1Issues.push({
              id: dbFilament.id,
              title: dbTitle,
              issue: `DB title doesn't match page H1. Page shows: "${scrapedH1}" (${similarity}% similarity)`,
              url: whitelistEntry.url,
            });
          }

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`[PostSyncCheck] Anycubic H1 check error for ${productLineId}:`, error);
        }
      }

      if (anycubicCheckedCount > 0) {
        checks.push({
          checkName: "Anycubic H1 Title Match (DB vs Whitelist URL)",
          status: anycubicH1Issues.length === 0 ? "pass" : anycubicH1Issues.length <= 1 ? "warning" : "fail",
          count: anycubicCheckedCount - anycubicH1Issues.length,
          details: anycubicH1Issues.length === 0
            ? `${anycubicCheckedCount}/${anycubicCheckedCount} Anycubic product titles match their whitelist page <h1> tags`
            : `${anycubicH1Issues.length} Anycubic titles don't match their canonical Buy Now page H1`,
          products: anycubicH1Issues.length > 0 ? anycubicH1Issues : undefined,
        });
      }

      console.log(`[PostSyncCheck] Anycubic H1 Title Match complete: ${anycubicCheckedCount} checked, ${anycubicH1Issues.length} issues`);
    }

    // ============= ATOMIC-SPECIFIC CHECK: H1 Title Match =============
    // Validates that Atomic Filament product_title in DB matches the <h1> from product URLs
    // This enforces the "H1 Title Priority" rule documented in brand-sync-docs.ts
    if (brandSlug === 'atomic-filament' && firecrawlApiKey) {
      console.log('[PostSyncCheck] Running Atomic Filament H1 Title Match validation...');
      
      const atomicH1Issues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
      let atomicCheckedCount = 0;

      // Fetch Atomic filaments with product_url (separate query since variantsWithColorFamily doesn't include it)
      const { data: atomicFilaments } = await supabase
        .from('filaments')
        .select('id, product_title, product_url')
        .eq('vendor', brandName)
        .not('product_url', 'is', null)
        .limit(20);
      
      // Group by unique product URL (variants share same page)
      const uniqueUrls = new Map<string, { id: string; product_title: string; product_url: string }>();
      for (const product of atomicFilaments || []) {
        const baseUrl = product.product_url?.split('?')[0];
        if (baseUrl && !uniqueUrls.has(baseUrl)) {
          uniqueUrls.set(baseUrl, product as { id: string; product_title: string; product_url: string });
        }
        if (uniqueUrls.size >= 10) break;
      }

      for (const [productUrl, dbFilament] of uniqueUrls) {
        const dbTitle = dbFilament.product_title;

        try {
          // Scrape the product URL to get the actual H1 title
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: productUrl,
              formats: ['html'],
              onlyMainContent: false,
              waitFor: 2000,
            }),
          });

          if (!scrapeResponse.ok) {
            console.log(`[PostSyncCheck] Atomic H1 check: Failed to scrape ${productUrl}`);
            continue;
          }

          const scrapeData = await scrapeResponse.json();
          const html = scrapeData.data?.html || scrapeData.html || '';

          // Extract H1 from scraped HTML - multiple patterns for Atomic's Shopify theme
          const h1Patterns = [
            /<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
            /<h1[^>]*class="[^"]*product__title[^"]*"[^>]*>([^<]+)<\/h1>/i,
            /<h1[^>]*>([^<]+)<\/h1>/i,
          ];
          
          let scrapedH1: string | null = null;
          for (const pattern of h1Patterns) {
            const match = html.match(pattern);
            if (match?.[1]) {
              scrapedH1 = match[1].trim()
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
              break;
            }
          }

          if (!scrapedH1) {
            console.log(`[PostSyncCheck] Atomic H1 check: No H1 found on ${productUrl}`);
            continue;
          }

          atomicCheckedCount++;

          // Normalize titles for comparison
          const normalizeForComparison = (title: string): string => {
            return title
              .replace(/\s+Filament\s*/gi, ' ')
              .replace(/\s*,?\s*\d+\.?\d*\s*mm\s*/gi, ' ')
              .replace(/\s*,?\s*\d+\.?\d*\s*(kg|g|lb)\s*(\/\s*\d+\.?\d*\s*(kg|g|lb))?\s*/gi, '')
              .replace(/\s*AMS\s*Compatible\s*/gi, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .toLowerCase();
          };

          const normalizedDb = normalizeForComparison(dbTitle);
          const normalizedH1 = normalizeForComparison(scrapedH1);

          // Calculate similarity
          const similarity = titleSimilarity(normalizedDb, normalizedH1);

          console.log(`[PostSyncCheck] Atomic H1 check: DB="${normalizedDb}" H1="${normalizedH1}" (${similarity}%)`);

          if (similarity < 70) {
            atomicH1Issues.push({
              id: dbFilament.id,
              title: dbTitle,
              issue: `DB title doesn't match page H1. Page shows: "${scrapedH1}" (${similarity}% similarity)`,
              url: productUrl,
            });
          }

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } catch (error) {
          console.error(`[PostSyncCheck] Atomic H1 check error for ${productUrl}:`, error);
        }
      }

      if (atomicCheckedCount > 0) {
        checks.push({
          checkName: "Atomic H1 Title Match (DB vs Product Page)",
          status: atomicH1Issues.length === 0 ? "pass" : atomicH1Issues.length <= 1 ? "warning" : "fail",
          count: atomicCheckedCount - atomicH1Issues.length,
          details: atomicH1Issues.length === 0
            ? `${atomicCheckedCount}/${atomicCheckedCount} Atomic product titles match their page <h1> tags`
            : `${atomicH1Issues.length} Atomic titles don't match their product page H1`,
          products: atomicH1Issues.length > 0 ? atomicH1Issues : undefined,
        });
      }

      console.log(`[PostSyncCheck] Atomic H1 Title Match complete: ${atomicCheckedCount} checked, ${atomicH1Issues.length} issues`);
    }

    // ============= UI DISPLAY NAME MATCH CHECK =============
    // CRITICAL: This check validates what the FRONTEND will actually show to users.
    // It simulates the formatProductLineIdForDisplay() logic from productNameUtils.ts
    // and compares against the actual product_title in the database.
    //
    // This catches frontend rendering bugs (e.g., "PLA High Speed" showing as just "PLA")
    // that occur due to mismatches between product_line_id format and display logic.
    const uiDisplayIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Simulate formatProductLineIdForDisplay logic (from src/lib/productNameUtils.ts)
    const simulateUIDisplayName = (productLineId: string, productTitle: string): string => {
      const parts = productLineId.split('__');
      
      if (parts.length >= 3) {
        // 3+ part format: "vendor__material__line-name"
        const material = parts[1]?.toUpperCase() || '';
        const lineParts = parts.slice(2).join(' ');
        const lineName = lineParts
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
          .trim();
        return `${material} ${lineName}`.trim();
      }
      
      // 2-part format: Use product title with minimal cleanup
      return productTitle
        .replace(/^(Anycubic|Polymaker|Hatchbox|Sunlu|Elegoo|Creality)\s+/gi, '')
        .replace(/\s+Filament\s*$/i, '')
        .replace(/\s*,?\s*\d+\.?\d*\s*mm\b/gi, '')
        .replace(/\s*,?\s*\d+\.?\d*\s*kg\b/gi, '')
        .replace(/\s*,?\s*\d+\.?\d*\s*lb\b/gi, '')
        .trim() || productTitle;
    };
    
    // Get products with product_line_id
    const { data: uiCheckProducts } = await supabase
      .from("filaments")
      .select("id, product_title, product_line_id")
      .ilike("vendor", brandName)
      .not("product_line_id", "is", null);
    
    // Group by product_line_id and check one representative per group
    const checkedProductLines = new Set<string>();
    
    for (const product of uiCheckProducts || []) {
      if (!product.product_line_id || checkedProductLines.has(product.product_line_id)) continue;
      checkedProductLines.add(product.product_line_id);
      
      const uiDisplayName = simulateUIDisplayName(product.product_line_id, product.product_title);
      
      // Normalize for comparison (strip color suffix from DB title, common specs)
      const normalizeForUICheck = (title: string): string => {
        return title
          .replace(/\s*-\s+[A-Za-z][A-Za-z\s]+$/g, '') // Strip " - Color Name" suffix
          .replace(/\s*,?\s*\d+\.?\d*\s*mm\b/gi, '')
          .replace(/\s*,?\s*\d+\.?\d*\s*kg\b/gi, '')
          .replace(/\s*,?\s*\d+\.?\d*\s*lb\b/gi, '')
          .replace(/\s+Filament\b/gi, '')
          .replace(/^(Anycubic|Polymaker|Hatchbox|Sunlu|Elegoo|Creality)\s+/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
      };
      
      const normalizedUI = normalizeForUICheck(uiDisplayName);
      const normalizedDB = normalizeForUICheck(product.product_title);
      
      // Check if UI display is significantly different from DB title
      // This catches bugs like "PLA High Speed" → "PLA" in the UI
      if (normalizedUI !== normalizedDB) {
        // Calculate how much was lost
        const uiWords = new Set(normalizedUI.split(' '));
        const dbWords = new Set(normalizedDB.split(' '));
        const missingWords = [...dbWords].filter(w => !uiWords.has(w) && w.length > 2);
        
        // Only flag if significant words are missing (like "high", "speed", "silk", etc.)
        const significantMissingWords = missingWords.filter(w => 
          ['high', 'speed', 'silk', 'matte', 'marble', 'glow', 'galaxy', 'metal', 'plus', 'basic', 'special', 'translucent'].includes(w)
        );
        
        if (significantMissingWords.length > 0) {
          uiDisplayIssues.push({
            id: product.id,
            title: product.product_title,
            issue: `UI will show "${uiDisplayName}" but DB has "${product.product_title}". Missing: ${significantMissingWords.join(', ')}`,
          });
        }
      }
    }
    
    checks.push({
      checkName: "UI Display Name Match (Frontend Rendering)",
      status: uiDisplayIssues.length === 0 ? "pass" : uiDisplayIssues.length <= 2 ? "warning" : "fail",
      count: checkedProductLines.size - uiDisplayIssues.length,
      details: uiDisplayIssues.length === 0
        ? `${checkedProductLines.size} product lines will display correctly in the UI`
        : `CRITICAL: ${uiDisplayIssues.length} products will show incorrect names in FilamentCard/FilamentDetail`,
      products: uiDisplayIssues.length > 0 ? uiDisplayIssues : undefined,
    });
    
    console.log(`[PostSyncCheck] UI Display Name Match complete: ${checkedProductLines.size} checked, ${uiDisplayIssues.length} issues`);

    // ============= PRICE CONSISTENCY CHECK (UPDATED FOR INDUSTRIAL BRANDS) =============
    // Validate DB prices are reasonable (not $0 or suspicious values)
    // 3DXTech is an industrial brand with expensive specialty materials (PEEK, PEKK, PEI, etc.)
    // Standard threshold is $200, but for industrial brands we use $800
    // Industrial canister/multi-pack products can reach $1600+
    const isIndustrialBrand = brandSlug === '3dxtech';
    const priceUpperThreshold = isIndustrialBrand ? 800 : 200;
    
    // Helper to detect canister/multi-pack products that legitimately cost $800-$1600
    const isCanisterProduct = (title: string): boolean => 
      /canister|^\d+x\s*\d+|multi[- ]?pack|stratasys|10\s*kg/i.test(title);
    
    const { data: priceCheckData } = await supabase
      .from("filaments")
      .select("id, product_title, variant_price, product_url")
      .ilike("vendor", brandName)
      .or(`variant_price.is.null,variant_price.eq.0,variant_price.lt.5,variant_price.gt.${priceUpperThreshold}`);

    const priceIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    for (const p of priceCheckData || []) {
      let issue = '';
      if (p.variant_price === null) issue = 'Price is NULL';
      else if (p.variant_price === 0) issue = 'Price is $0';
      else if (p.variant_price < 5) issue = `Price too low: $${p.variant_price}`;
      else if (p.variant_price > priceUpperThreshold) {
        // Skip flagging very high prices for industrial canister products (up to $1600)
        if (isIndustrialBrand && p.variant_price <= 1600 && isCanisterProduct(p.product_title)) {
          // Allow canister/multi-pack/Stratasys products up to $1600 - legitimate pricing
          continue;
        }
        issue = `Price unusually high: $${p.variant_price}`;
      }
      
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
        ? `All prices are in valid range ($5-$${priceUpperThreshold})` 
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
    // Include Anycubic since they group products across promotional and regular URLs
    // Include Atomic Filament since each color variant IS a different product with its own URL
    const CROSS_PRODUCT_URL_BRANDS = [...IMAGE_SWATCH_BRANDS, 'anycubic', 'atomic-filament'];
    const isCrossProductSwatchBrand = CROSS_PRODUCT_URL_BRANDS.includes(brandSlug);
    
    for (const lineId of productLineIds.slice(0, 15)) {
      const variants = productLineGroups[lineId];
      if (!variants || variants.length <= 1) continue;
      
      const urls = variants.map(v => v.product_url).filter(Boolean);
      
      if (isCrossProductSwatchBrand) {
        // For cross-product brands: Check if URLs belong to same product LINE (pattern-based)
        // Use known product line prefixes to avoid false positives from color names in URLs
        const knownPatterns = [
          // 3D-Fuel patterns
          'tough-pro-pla', 'standard-pla', 'pro-pctg', 'pro-petg',
          'pro-pla', 'pro-abs', 'pro-asa', 'workday-petg', 'workday-abs',
          'workday-pla', 'silk-pla', 'dual-color-silk', 'biome3d', 'buzzed',
          'entwined', 'wound-up', 'landfillament', 'c2renew', 'refuel',
          'pet-cf', 'pla-cf', 'pro-ht-pla', 'htpla',
          // Anycubic patterns
          'pla-plus', 'pla-basic', 'pla-galaxy', 'pla-silk',
          'petg', 'petg-plus', 'petg-translucent',
          'abs', 'abs-plus', 'abs-filament',
          'tpu', 'high-speed', 'pla-cf', 'petg-cf',
          // Atomic Filament patterns (each color is a separate product)
          'atomic', 'meltmiser', 'petg-pro', 'extreme', 
          'illusion', 'mysterious-abyss', 'chameleon', 'sparkle',
          'carbon-fiber', 'silky', 'silk', 'translucent', 'metallic',
          'sample-coil', 'neon', 'uv-reactive', 'glow',
        ];
        
        // Pattern aliases for rebranded products - map old patterns to canonical pattern
        const patternAliases: Record<string, string> = {
          // 3D-Fuel: rebranded "Pro PLA" to "Tough Pro PLA+" but kept legacy URLs
          'pro-pla': 'tough-pro-pla',
          'pro-pla-filament': 'tough-pro-pla',
          'copy-of-pro-pla': 'tough-pro-pla',
          'copy-of-pro': 'tough-pro-pla',
          'copy-of': 'tough-pro-pla',
          // Anycubic: PLA+ variants all map to canonical 'pla-plus'
          'pla-basic': 'pla-plus',
          'pla-basic-refill': 'pla-plus',
          'pla-basic-special': 'pla-plus',
          'pla-plus-filament': 'pla-plus',
          'pla-plus-refill': 'pla-plus',
          'pla-plus-filament-b2g1': 'pla-plus',
          'pla-filament': 'pla-plus',
          'pla-filament-multi': 'pla-plus',
          'high-speed-pla': 'pla-plus',
          'high-speed-pla-filament': 'pla-plus',
        };
        
        const handlePatterns = urls.map(url => {
          try {
            const parsed = new URL(url!);
            const handle = parsed.pathname.split('/products/')[1] || '';
            
            // Match against known product line prefixes first
            for (const pattern of knownPatterns) {
              if (handle.startsWith(pattern)) {
                // Apply alias if it exists, otherwise use the pattern
                return patternAliases[pattern] || pattern;
              }
            }
            
            // Fallback: take first 2 segments only (more conservative)
            const parts = handle.split('-');
            const fallbackPattern = parts.slice(0, 2).join('-');
            // Also check fallback against aliases
            return patternAliases[fallbackPattern] || fallbackPattern;
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

    // Self-healing: Update brand profile with AI discoveries
    let profileUpdated = false;
    if (aiAnalysis?.colorMappings && Object.keys(aiAnalysis.colorMappings).length > 0) {
      try {
        console.log(`[PostSyncCheck] Self-healing: Updating brand profile with ${Object.keys(aiAnalysis.colorMappings).length} new color mappings...`);
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('brand_scraper_profiles')
          .select('id, color_hex_mappings')
          .eq('brand_slug', brandSlug)
          .maybeSingle();
        
        if (existingProfile) {
          // Merge new color mappings with existing ones
          const mergedMappings = {
            ...(existingProfile.color_hex_mappings || {}),
            ...aiAnalysis.colorMappings,
          };
          
          const { error: updateError } = await supabase
            .from('brand_scraper_profiles')
            .update({
              color_hex_mappings: mergedMappings,
              analysis_notes: aiAnalysis.rootCause 
                ? `Last auto-update: ${aiAnalysis.rootCause.slice(0, 200)}`
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingProfile.id);
          
          if (!updateError) {
            profileUpdated = true;
            console.log(`[PostSyncCheck] Self-healing: Brand profile updated successfully`);
          } else {
            console.error(`[PostSyncCheck] Self-healing error:`, updateError.message);
          }
        } else {
          // Create new profile with discovered mappings
          const { error: insertError } = await supabase
            .from('brand_scraper_profiles')
            .insert({
              brand_slug: brandSlug,
              color_hex_mappings: aiAnalysis.colorMappings,
              swatch_type: aiAnalysis.swatchType || 'unknown',
              analysis_notes: `Auto-created from Post Sync Check: ${aiAnalysis.rootCause?.slice(0, 200) || 'AI analysis'}`,
              analysis_confidence: 0.5, // Lower confidence for auto-created
            });
          
          if (!insertError) {
            profileUpdated = true;
            console.log(`[PostSyncCheck] Self-healing: Created new brand profile`);
          } else {
            console.error(`[PostSyncCheck] Self-healing insert error:`, insertError.message);
          }
        }
      } catch (err) {
        console.error(`[PostSyncCheck] Self-healing exception:`, err);
      }
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
      profileUpdated, // Include in report
    } as PostSyncCheckReport;

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
