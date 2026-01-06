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
const IMAGE_SWATCH_BRANDS = ['3d-fuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'overture', 'anycubic', 'azurefilm', 'bambu-lab'];

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
  bambuLabSpecialist: {
    title: 'Bambu Lab Integration Specialist',
    triggers: ['bambu', 's5', 's7', 'bblcdn', 'variant url', 'petg-hf', 'pla-basic'],
    capabilities: [
      'Bambu Lab custom Next.js platform analysis (NOT Shopify)',
      'S5 vs S7 CDN image extraction and validation',
      'JavaScript-loaded dynamic content strategies',
      'Firecrawl HTML scraping with waitFor timing',
      'Hardcoded fallback mapping maintenance',
      'Color variant ID extraction for Buy Now links'
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

// Brand-specific lessons learned - evolves with each sync cycle
const BRAND_LESSONS_LEARNED: Record<string, {
  platform: string;
  knownLimitations: string[];
  workingSolutions: string[];
  failedApproaches: string[];
  currentStatus: Record<string, string>;
  keyFiles: string[];
  extractionPriority?: string[];
  manualExtractionProcess?: string[];
  productSlugReference?: Record<string, string>;
  lastUpdated: string;
}> = {
  'bambu-lab': {
    platform: 'Custom Next.js storefront (NOT Shopify) - us.store.bambulab.com',
    knownLimitations: [
      '❌ S5 gallery images are loaded dynamically via JavaScript when clicking color swatches - CANNOT be scraped with Firecrawl',
      '❌ Variant IDs (?id= parameters) require JavaScript interaction - NOT available in static HTML',
      '❌ __NEXT_DATA__ JSON does NOT contain S5 image GUIDs or variant IDs for Buy Now links',
      '❌ Static HTML only contains S7 swatch thumbnails (~50x50px) - these are NOT product images',
      '❌ Collection pages do not expose individual product variant data',
      '❌ No public Shopify JSON API (products.json) exists for this store'
    ],
    workingSolutions: [
      '✅ Use hardcoded S5_PRODUCT_IMAGES mapping in sync-bambulab-products/index.ts (lines 99-305)',
      '✅ Product slugs extracted from collection page HTML reliably work for product URLs',
      '✅ Firecrawl with waitFor:2000 successfully extracts H1 titles and basic product info',
      '✅ Color names can be extracted from __NEXT_DATA__ productOptions array',
      '✅ Manual browser DevTools (Network tab) extraction for S5 GUIDs is the ONLY reliable method',
      '✅ s5Url() helper function generates correct CDN URLs from GUIDs',
      '✅ Use BAMBULAB_VARIANT_IDS mapping in update-bambulab-urls/index.ts for variant-specific Buy Now links',
      '✅ Run update-bambulab-urls edge function after sync to populate ?id= parameters'
    ],
    failedApproaches: [
      '⚠️ Attempting to scrape __NEXT_DATA__ for variant IDs - data structure does not contain them',
      '⚠️ Using Firecrawl waitFor for dynamic S5 images - still returns only S7 swatch URLs',
      '⚠️ Treating Bambu Lab as Shopify store - no /products.json or /collections.json APIs exist',
      '⚠️ Trying to extract variant IDs from HTML data attributes - IDs are injected by JavaScript',
      '⚠️ Using wrong product slugs (e.g., "petg-hf-filament" instead of "petg-hf") breaks S5 mapping',
      '⚠️ Using wrong PRODUCT_LINE_SLUG_MAP key format (use bambulab__material__variant, not bambulab-material)'
    ],
    currentStatus: {
      's5ImagesComplete': 'ABS (12), PLA Tough+ (8), PETG HF (14), PETG Translucent (9) = 43 colors ✅',
      's5ImagesPending': 'PLA Basic (30), PLA Matte (24), PLA Silk+ (13), PLA Translucent (10), PLA Silk Multi-Color (5), PLA Basic Gradient (3), PLA Sparkle (6), PLA Metal (5), PLA Galaxy (3), PLA Wood (4), Support for PLA (2), Support W (1), PA6-GF (8), ABS-GF (8), PAHT-CF (3), PET-CF (2), PETG-CF (3), PETG Basic (4), ASA (5), TPU 95A HF (7), PA-CF (3), PC (3) = ~145 colors ⏳',
      'variantUrls': 'Managed via BAMBULAB_VARIANT_IDS mapping - run update-bambulab-urls to populate',
      'totalProductCount': '227 filament variants in database',
      'completionPercentage': '~23% S5 coverage (43/188 multi-color products)'
    },
    keyFiles: [
      'supabase/functions/sync-bambulab-products/index.ts - Main sync function with S5_PRODUCT_IMAGES constant',
      'supabase/functions/_shared/bambulab-defaults.ts - COLOR_HEX_MAP and brand configuration',
      'S5_PRODUCT_IMAGES constant (lines 99-305) - Hardcoded S5 image GUID mappings by product slug',
      'supabase/functions/update-bambulab-urls/index.ts - Variant ID mapping and URL update function'
    ],
    extractionPriority: [
      '1. PLA Basic (30 colors) - highest impact, most popular product',
      '2. PLA Matte (24 colors) - second highest color count',
      '3. PLA Silk+ (13 colors) - popular specialty line',
      '4. PLA Translucent (10 colors)',
      '5. Remaining specialty lines (~68 colors total)'
    ],
    manualExtractionProcess: [
      '1. Open product page: https://us.store.bambulab.com/products/{product-slug}',
      '2. Open DevTools (F12) → Network tab',
      '3. Filter by "s5" in the search box',
      '4. Click each color swatch one by one',
      '5. Find request to: store.bblcdn.com/s5/default/{GUID}.jpg',
      '6. Copy the 32-character GUID',
      '7. Add to S5_PRODUCT_IMAGES: \'color name\': s5Url(\'GUID\'),'
    ],
    productSlugReference: {
      'abs-filament': 'ABS',
      'pla-basic-filament': 'PLA Basic',
      'pla-matte': 'PLA Matte',
      'pla-silk-upgrade': 'PLA Silk+',
      'pla-translucent': 'PLA Translucent',
      'pla-tough-upgrade': 'PLA Tough+',
      'petg-hf': 'PETG HF',
      'petg-translucent': 'PETG Translucent',
      'petg-basic': 'PETG Basic',
      'pla-silk-multicolor': 'PLA Silk Multi-Color',
      'pla-basic-gradient': 'PLA Basic Gradient',
      'pla-sparkle': 'PLA Sparkle',
      'pla-metal': 'PLA Metal',
      'pla-galaxy': 'PLA Galaxy',
      'pla-wood': 'PLA Wood',
      'support-for-pla': 'Support for PLA',
      'support-w': 'Support W',
      'asa': 'ASA',
      'tpu-95a-hf': 'TPU 95A HF',
      'pa6-gf': 'PA6-GF',
      'abs-gf': 'ABS-GF',
      'paht-cf': 'PAHT-CF',
      'pet-cf': 'PET-CF',
      'petg-cf': 'PETG-CF',
      'pa-cf': 'PA-CF',
      'pc': 'PC'
    },
    lastUpdated: '2026-01-05'
  }
};

/**
 * Determine the best AI role based on failing check types and brand
 */
function determineAIRole(checks: CheckResult[], brandSlug?: string): { title: string; capabilities: string[] } {
  // Prioritize Bambu Lab specialist for Bambu Lab brand
  if (brandSlug === 'bambu-lab') {
    return AI_ROLES.bambuLabSpecialist;
  }
  
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

/**
 * Generate Bambu Lab-specific AI Fix Prompt with lessons learned
 */
function generateBambuLabFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['bambu-lab'];
  const role = AI_ROLES.bambuLabSpecialist;
  
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warningChecks = checks.filter(c => c.status === 'warning');
  
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

  // AI insights section
  let aiInsightsSection = '';
  if (aiAnalysis) {
    aiInsightsSection = `
---

## AI Website Analysis Results

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

---`;
  }

  return `You are the **${role.title}** for Filascope, a comprehensive 3D printing filament database.

## CRITICAL PLATFORM CONTEXT

**Platform**: ${lessons.platform}
**This is NOT a Shopify store** - do NOT use Shopify JSON APIs, /products.json, or Shopify-specific patterns.

---

## CORE CAPABILITIES

${role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n')}

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `- ❌ ${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE APPROACHES)

${lessons.workingSolutions.map(s => `- ✅ ${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID REPEATING)

${lessons.failedApproaches.map(f => `- ⚠️ ${f}`).join('\n')}

---

## CURRENT S5 IMAGE STATUS

| Category | Status |
|----------|--------|
| **Populated** | ${lessons.currentStatus.s5ImagesComplete} |
| **Pending** | ${lessons.currentStatus.s5ImagesPending} |
| **Variant URLs** | ${lessons.currentStatus.variantUrls} |
| **Total Products** | ${lessons.currentStatus.totalProductCount} |

---

## KEY FILES FOR BAMBU LAB

${lessons.keyFiles.map(f => `- \`${f}\``).join('\n')}

---

## Fix Post Sync Check Issues for Bambu Lab

### Summary
- **Brand**: ${brand} (slug: bambu-lab)
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

## Required Actions for Bambu Lab

### 1. For S5 Image Issues (CRITICAL)

The sync function uses hardcoded \`S5_PRODUCT_IMAGES\` in \`sync-bambulab-products/index.ts\`.

**Manual S5 Extraction Process:**
1. Open product page in browser with DevTools Network tab
2. Click each color swatch one by one
3. Look for requests to \`store.bblcdn.com/s5/default/GUID.jpg\`
4. Copy the 32-character GUID
5. Add to \`S5_PRODUCT_IMAGES\`:

\`\`\`typescript
'product-slug': {
  'color name': s5Url('32-character-guid'),
  // ... more colors
},
\`\`\`

**DO NOT ATTEMPT:**
- Scraping S5 images via Firecrawl (returns S7 only)
- Parsing __NEXT_DATA__ for S5 image GUIDs (not present)
- Using wrong product slugs (e.g., "petg-hf-filament" instead of "petg-hf")

### 2. For Variant URL Issues (WARNING ONLY)

Variant IDs (?id= parameter) require JavaScript interaction and CANNOT be scraped.
**This is an accepted limitation** - Buy Now links go to default color.

**Future Options (not currently implemented):**
- Puppeteer/Playwright browser automation
- Manual extraction and hardcoded mapping
- Bambu Lab API access (if available)

### 3. For New Product Lines

When Bambu Lab adds new filament products:
1. Run Clean Slate sync to discover new products
2. Run Post Sync Check to identify S5 image gaps
3. Manually extract S5 GUIDs via browser DevTools
4. Add to \`S5_PRODUCT_IMAGES\` constant with correct product slug
5. Redeploy edge function and re-sync

### 4. Product Slug Reference

Correct slugs for S5_PRODUCT_IMAGES keys:
- \`abs-filament\` (not abs)
- \`petg-hf\` (not petg-hf-filament)
- \`pla-tough-upgrade\` (for PLA Tough+)
- \`petg-translucent\` (not petg-translucent-filament)
- \`pla-basic-filament\` (for PLA Basic)
- \`pla-matte\` (for PLA Matte)
- \`pla-silk-upgrade\` (for PLA Silk+)

---

## Firecrawl API Usage

Firecrawl is pre-configured and available via \`FIRECRAWL_API_KEY\`.

**Best Uses for Bambu Lab:**
- Extracting product page H1 titles
- Discovering new products from collection pages
- Getting color names from __NEXT_DATA__ JSON

**Example:**
\`\`\`typescript
const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${Deno.env.get('FIRECRAWL_API_KEY')}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: productUrl,
    formats: ['html'],
    onlyMainContent: false,
    waitFor: 2000,
  }),
});
\`\`\`

---

## Verification Steps

After making fixes:
1. Run a **Clean Slate** sync for Bambu Lab
2. Run **Post Sync Check** again to verify issues are resolved
3. Check that S5 images are used (not S7 swatches) for updated product lines

---

*Last Updated: ${lessons.lastUpdated}*`;
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
  
  // Use brand-specific prompt generator for Bambu Lab
  if (brandSlug === 'bambu-lab') {
    return generateBambuLabFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Determine the best AI role for this specific set of issues
  const role = determineAIRole(checks, brandSlug);
  
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
  
  // Check for Bambu Lab S5 image issues
  const hasBambuLabS5Issues = brandSlug === 'bambu-lab' && [...failedChecks, ...warningChecks].some(c =>
    c.checkName === 'Color-Specific Images' && 
    c.products?.some(p => p.issue?.toLowerCase().includes('s7') || p.issue?.toLowerCase().includes('s5'))
  );
  
  const bambuLabS5Section = hasBambuLabS5Issues ? `
### 7. For Bambu Lab S5 Gallery Image Issues (CRITICAL)

The Post Sync Check detected products using S7 swatch thumbnails instead of S5 gallery images.

**WHY THIS IS CRITICAL:**
- S7 images are tiny (~50x50px) color swatch thumbnails from the color picker UI
- S5 images are full product gallery photos (1920px) shown when a color is selected
- Users expect to see the actual product photo, not a tiny swatch icon

**WHY S5 IMAGES CANNOT BE SCRAPED:**
- S5 gallery images are loaded dynamically via JavaScript when clicking a color swatch
- Firecrawl captures static HTML which only contains S7 swatch URLs
- The \`sync-bambulab-products\` function cannot extract S5 images automatically

**THE SOLUTION: Hardcoded S5_PRODUCT_IMAGES Mapping**

The sync function uses a hardcoded \`S5_PRODUCT_IMAGES\` constant in \`supabase/functions/sync-bambulab-products/index.ts\`.

**Manual S5 Image Extraction Process:**

1. Open the product page in a browser (e.g., https://us.store.bambulab.com/products/pla-basic-filament)
2. Open browser DevTools (F12) → Network tab
3. Click on each color swatch one by one
4. Look for image requests to \`store.bblcdn.com/s5/default/GUID.jpg\`
5. Copy the GUID (32-character hex string)
6. Add to \`S5_PRODUCT_IMAGES\` constant:

\`\`\`typescript
// In supabase/functions/sync-bambulab-products/index.ts
const S5_PRODUCT_IMAGES: Record<string, Record<string, string>> = {
  'pla-basic-filament': {
    'jade white': s5Url('7a8d8c5b6e4f4c2a9b1e3d5f7a9c2b4e'),
    'ivory white': s5Url('c4b7b9d8e3a54f6b8c1d2e4f6a8b9c1d'),
    // ... add more colors
  },
  // ... add more products
};
\`\`\`

**After Adding S5 Mappings:**
1. Deploy the updated edge function
2. Run a Clean Slate sync for Bambu Lab
3. Run Post Sync Check to verify S5 images are now used

` : '';

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
${promotionalSection}${bambuLabS5Section}
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
    // Bambu Lab promotional bundles/kits
    'set of', 'coaster holder', 'clock kit', 'modular clock',
    'starter kit', 'bundle', 'combo pack', 'sample set',
    // MakerWorld model names (from "Related Models" sections on Bambu Lab pages)
    'door stopper', 'damper', 'puck', 'türstopper',
    'floor sign', 'wet floor', 'caution wet',
    'garden hose', 'coupling fittings',
    'phone cage', 'phone photography',
    'filament spool', 'spool winder',
    'hot air balloon', 'tolerance test',
    'ultramax engine', 'engine block',
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

    // Check: No Gift/Non-Filament Products
    // Detect products with excluded keywords that shouldn't be in the database
    const excludedKeywords = ['gift card', 'gift', '3d pen', 'arch support', 'insoles'];
    let nonFilamentProducts: Array<{ id: string; product_title: string; matched_keyword: string }> = [];

    for (const keyword of excludedKeywords) {
      const { data: matchedProducts } = await supabase
        .from("filaments")
        .select("id, product_title")
        .ilike("vendor", brandName)
        .ilike("product_title", `%${keyword}%`)
        .limit(20);
      
      if (matchedProducts && matchedProducts.length > 0) {
        nonFilamentProducts.push(...matchedProducts.map(p => ({
          id: p.id,
          product_title: p.product_title,
          matched_keyword: keyword,
        })));
      }
    }

    // Deduplicate by id (in case same product matches multiple keywords)
    const uniqueNonFilament = [...new Map(nonFilamentProducts.map(p => [p.id, p])).values()];

    checks.push({
      checkName: "No Gift/Non-Filament Products",
      status: uniqueNonFilament.length === 0 ? "pass" : "fail",
      count: uniqueNonFilament.length,
      details: uniqueNonFilament.length 
        ? `Found ${uniqueNonFilament.length} non-filament products that should be deleted` 
        : "No gift cards, 3D pens, or other non-filament products found",
      products: uniqueNonFilament.slice(0, 15).map((p) => ({
        id: p.id,
        title: p.product_title,
        issue: `Contains excluded keyword: "${p.matched_keyword}"`,
      })),
    });

    // Check: Product Images Coverage
    // Verify that products have featured_image populated for detail page display
    const { data: allProductsForImages } = await supabase
      .from("filaments")
      .select("id, product_title, featured_image, product_line_id")
      .ilike("vendor", brandName);

    const totalWithImages = allProductsForImages?.filter(p => p.featured_image).length || 0;
    const totalWithoutImages = (allProductsForImages?.length || 0) - totalWithImages;
    const imagePercentage = allProductsForImages?.length 
      ? Math.round((totalWithImages / allProductsForImages.length) * 100) 
      : 0;

    // Group by product_line_id to check if any lines are missing images entirely
    const lineImageCoverage: Record<string, { total: number; withImage: number; sampleTitle: string }> = {};
    for (const product of allProductsForImages || []) {
      const lineId = product.product_line_id || 'unknown';
      if (!lineImageCoverage[lineId]) {
        lineImageCoverage[lineId] = { total: 0, withImage: 0, sampleTitle: product.product_title };
      }
      lineImageCoverage[lineId].total++;
      if (product.featured_image) lineImageCoverage[lineId].withImage++;
    }

    const linesWithNoImages = Object.entries(lineImageCoverage)
      .filter(([_, data]) => data.withImage === 0 && data.total > 0)
      .map(([lineId, data]) => ({
        id: lineId,
        title: lineId,
        issue: `0/${data.total} variants have images`,
      }));

    // Get sample products missing images for detailed reporting
    const productsMissingImages = totalWithoutImages > 0 
      ? allProductsForImages?.filter(p => !p.featured_image).slice(0, 10).map(p => ({
          id: p.id,
          title: p.product_title,
          issue: "Missing featured_image",
        }))
      : undefined;

    checks.push({
      checkName: "Product Images Coverage",
      status: totalWithoutImages === 0 ? "pass" : 
              imagePercentage >= 90 ? "warning" : "fail",
      count: totalWithImages,
      details: `${totalWithImages}/${allProductsForImages?.length || 0} products have featured_image (${imagePercentage}%)`,
      products: linesWithNoImages.length > 0 ? linesWithNoImages : productsMissingImages,
    });

    // Validate a sample of image URLs are actually accessible (not 404)
    const productsWithImages = allProductsForImages?.filter(p => p.featured_image).slice(0, 5) || [];
    const brokenImageUrls: Array<{ id: string; title: string; issue: string }> = [];

    for (const product of productsWithImages) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(product.featured_image!, { 
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          brokenImageUrls.push({
            id: product.id,
            title: product.product_title,
            issue: `Image URL returns HTTP ${response.status}`,
          });
        }
      } catch (error) {
        brokenImageUrls.push({
          id: product.id,
          title: product.product_title,
          issue: `Image URL unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    if (productsWithImages.length > 0) {
      checks.push({
        checkName: "Image URLs Valid",
        status: brokenImageUrls.length === 0 ? "pass" : "fail",
        count: productsWithImages.length - brokenImageUrls.length,
        details: `${productsWithImages.length - brokenImageUrls.length}/${productsWithImages.length} sampled image URLs are accessible`,
        products: brokenImageUrls.length > 0 ? brokenImageUrls : undefined,
      });
    }

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

      // Brands where Refill + Standard spool variants share the same color hex (by design)
      // For these brands, duplicates like "PETG Black" and "Refill PETG Black" are EXPECTED
      const refillDuplicateExpectedBrands = ['azurefilm'];
      const isRefillBrand = refillDuplicateExpectedBrands.includes(brandSlug);
      
      // Only flag as duplicate if DIFFERENT color names share the same hex
      for (const [hex, colorNames] of Object.entries(colorHexMap)) {
        if (colorNames.length > 1) {
          // For refill brands, check if duplicates are just Refill vs Standard variants
          if (isRefillBrand) {
            const hasRefill = colorNames.some(name => /refill/i.test(name));
            const hasNonRefill = colorNames.some(name => !/refill/i.test(name));
            if (hasRefill && hasNonRefill && colorNames.length === 2) {
              // This is expected - skip this duplicate (Refill + Spool same color)
              continue;
            }
          }
          
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
    const extractColorIdentifierFromTitle = (title: string, brand?: string): string | null => {
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
      
      // Pattern (Atomic Filament): "Color Name Material Filament AMS Compatible"
      // E.g., "Illusion Cherry Iridescent PLA Filament AMS Compatible"
      // E.g., "Mysterious Abyss v2 Pearl PETG PRO AMS Compatible"
      if (brand === 'atomic-filament') {
        const atomicPattern = title.match(/^(.+?)\s+(PLA|PETG|ABS|TPU|ASA|Nylon|PA|PC)\b/i);
        if (atomicPattern) {
          return atomicPattern[1].trim().toLowerCase();
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
        // Try to extract color from title first (pass brand slug for brand-specific patterns)
        const colorFromTitle = extractColorIdentifierFromTitle(variant.product_title, brandSlug);
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
      
      // ATOMIC FILAMENT: Extract product line name from the 2-part ID
      // Format: "atomic-filament__pla" → "PLA", "atomic-filament__pla-silk" → "PLA Silk"
      // This ensures card titles show "PLA", "PETG", "PLA Silk" instead of individual product names
      if (parts[0] === 'atomic-filament' && parts.length === 2) {
        const materialSlug = parts[1]; // e.g., "pla", "pla-silk", "petg", "abs", "asa"
        const displayName = materialSlug
          .replace(/-/g, ' ')
          .toUpperCase()
          .replace('SILK', 'Silk'); // "PLA SILK" → "PLA Silk"
        return displayName;
      }
      
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

    // ============= FILAMENT CARD COUNT CHECK (NEW) =============
    // Validates the number of distinct product cards that will display in the UI
    // This catches grouping issues like PLA Silk merged with PLA
    const { data: cardCountData } = await supabase
      .from("filaments")
      .select("product_line_id")
      .ilike("vendor", brandName)
      .not("product_line_id", "is", null);

    const uniqueProductLineIds: string[] = [...new Set(
      (cardCountData || [])
        .map((f: { product_line_id: string }) => f.product_line_id)
        .filter(Boolean)
    )] as string[];

    // Brand-specific expected card counts (from collection architecture)
    // These are known stable brands with well-defined product line structures
    const EXPECTED_CARD_COUNTS: Record<string, number> = {
      // High-confidence counts (verified architecture)
      'atomic-filament': 6,     // PLA, PETG, ABS, ASA, PLA Silk, Hi-Flow Pro PLA
      'elegoo': 12,             // PLA, PLA+, PETG, ABS, ASA, TPU, Rapid, Marble, Silk, Matte, Glow, Wood
      'anycubic': 19,           // PLA+, PLA Silk, PLA Galaxy, PLA High Speed, PETG, ABS, ASA, TPU, etc.
      'push-plastic': 15,       // PLA, PETG, ABS, ASA, Nylon, PC, PEI, etc.
      'proto-pasta': 15,        // PLA, HTPLA, PLA Composites, CFPLA, etc.
      '3d-fuel': 8,             // Standard PLA, Pro PLA, PETG, ABS, Biome3D, Buzzed, Entwined, Landfillament
      '3dxtech': 25,            // PEEK, PEKK, PEI, Carbon Fiber variants, etc.
      'eryone': 24,             // PLA, PLA+, PETG, Silk, Galaxy, Matte, Marble, TPU, etc.
      '3dhojor': 12,            // PLA, PETG, Silk, Matte, Marble, etc.
      'sunlu': 9,               // PLA, PLA+, PETG, TPU, Silk, ABS, ASA, etc.
      'siraya-tech': 17,        // Resin types - Fast, Blu, Build, Sculpt, Tenacious, etc.
      'sovol': 6,               // PLA, PETG, TPU, ABS, Silk, Carbon
      'flashforge': 8,          // PLA, ABS, PETG, TPU, Adventurer series
      'duramic-3d': 3,          // PLA, PETG, TPU
      
      // Medium-confidence counts (product_line_id may need population)
      'overture': 15,           // PLA, PLA Pro, PETG, TPU, ABS, Silk, Matte, etc.
      'bambu-lab': 39,          // PLA, PETG, ABS, ASA, TPU, PLA-CF, PAHT-CF, Marble, Silk, Sparkle, etc.
      'fillamentum': 25,        // PLA, ASA, PETG, Flexfill, CPE, Nylon, Timberfill, etc.
      'azurefilm': 19,          // ABS (Plus, Prime), ASA (Standard, Prime), Carbon Fiber (PAHT-CF, PET-CF), PC-ABS, PCTG (Standard, Translucent), PETG (Hyper Speed, Translucent), PLA (Original, Standard, Matte HS, Silk, Translucent, Strongman), LumberLay, PVA
      'ninjatek': 10,           // Cheetah, NinjaFlex, Armadillo, Eel, SemiFlex, etc.
      'polymaker': 25,          // PolyLite, PolyTerra, PolyMax, PolyMide, PolyDissolve, etc.
      'colorfabb': 20,          // PLA Economy, PETG, nGen, PA, Amphora, XT, etc.
      'prusament': 12,          // PLA, PETG, ASA, PC Blend, PA11-CF, PVB, etc.
      'matter3d': 15,           // Performance, Standard, Specialty lines
      'esun': 18,               // PLA+, PETG, ABS+, eSilk, eMarble, TPU, etc.
      'creality': 12,           // Hyper Series, Ender PLA, etc.
      'fiberlogy': 15,          // Easy PLA, HD PLA, PETG, PA12, etc.
      'amolen': 33,             // Silk, Matte, Dual Color, Galaxy, Rainbow, Glow, Wood, Marble, etc.
      'hatchbox': 12,           // PLA, PETG, ABS, TPU, Silk, etc.
      'formfutura': 18,         // EasyFil, HDglass, ApolloX, etc.
      'extrudr': 15,            // GreenTEC, BioFusion, DuraPro, etc.
      'geeetech': 12,           // PLA, ABS, PETG, Silk, etc.
      'fusion-filaments': 11,   // PLA, PETG, ABS, TPU, etc.
      'spectrum-filaments': 30, // Large catalog with ReFill options
      'ultimaker': 10,          // S-Series materials
      'numakers': 8,            // PLA, PETG, TPU lines
      'recreus': 6,             // FilaFlex series
      'treed-filaments': 15,    // Ecogenius, Shogun, Carbonio, etc.
      'voxelpla': 5,            // Basic PLA lines
      'ziro': 10,               // PLA, PETG, Silk, etc.
      'paramount-3d': 8,        // FlexPLA, Stone, Shimmer lines
      'cc3d': 10,               // PLA, PETG, Ceramic, Metal lines
      'kingroon': 6,            // Basic filament lines
      'ic3d-printers': 8,       // Industrial materials
      'yousu': 8,               // PLA, PETG, Silk lines
    };

    const expectedCards = EXPECTED_CARD_COUNTS[brandSlug] || null;
    const actualCards = uniqueProductLineIds.length;
    const cardCountIssues: Array<{ id: string; title: string; issue: string }> = [];

    if (expectedCards !== null && actualCards !== expectedCards) {
      cardCountIssues.push({
        id: 'card-count-mismatch',
        title: `Expected ${expectedCards} cards, found ${actualCards}`,
        issue: `Missing product lines: ${expectedCards - actualCards} cards. Likely grouping issue (e.g., PLA Silk merged with PLA). Found: ${uniqueProductLineIds.join(', ')}`,
      });
      console.log(`[PostSyncCheck] Card Count: Found product_line_ids: ${uniqueProductLineIds.join(', ')}`);
    }

    checks.push({
      checkName: "Filament Card Count (UI Cards Displayed)",
      status: cardCountIssues.length === 0 ? "pass" : "fail",
      count: actualCards,
      details: expectedCards !== null
        ? (cardCountIssues.length === 0
            ? `✓ ${actualCards} distinct product cards will display (expected ${expectedCards})`
            : `CRITICAL: ${actualCards} cards found, expected ${expectedCards}`)
        : `${actualCards} distinct product cards will display`,
      products: cardCountIssues.length > 0 ? cardCountIssues : undefined,
    });

    console.log(`[PostSyncCheck] Filament Card Count complete: ${actualCards} cards${expectedCards !== null ? ` (expected ${expectedCards})` : ''}`);

    // ============= CARD TITLE FORMAT CHECK (ENHANCED) =============
    // Validates that card titles are product LINE names, not individual variant names
    // Good: "PLA", "PETG", "PLA Silk", "PolyLite PLA", "Easy PLA"
    // Bad: "Groovy Purple PLA Shade-Shifting Filament", "Indigo Golden Sparkle v3 Translucent PLA"
    
    // Brand-specific valid product line name patterns
    // If a display name matches ANY of these patterns, it's considered valid
    const VALID_PRODUCT_LINE_PATTERNS: Record<string, RegExp[]> = {
      'atomic-filament': [/^(PLA|PETG|ABS|ASA|PLA Silk|TPU|Nylon)$/i],
      'elegoo': [/^(PLA|PLA\s*\+?|PETG|ABS|ASA|TPU|Rapid|Marble|Silk|Matte|Glow|Wood|High\s*Speed)/i],
      'anycubic': [/^(PLA|PLA\s*\+|PLA Basic|PLA Silk|PLA High Speed|PETG|ABS|ASA|TPU|High Speed)/i],
      'polymaker': [/^(PolyLite|PolyTerra|PolyMax|PolyMide|PolyDissolve|PolySmooth|PolyCast|PolyFlex)/i],
      'prusament': [/^(PLA|PETG|ASA|PC Blend|PA11|PVB|rPLA)/i],
      'bambu-lab': [/^(PLA|PETG|ABS|ASA|TPU|PLA-CF|PAHT-CF|PA6-CF|Marble|Silk|Sparkle|Matte|Glow|Galaxy|Metal|Wood)/i],
      'fillamentum': [/^(Extrafill|Flexfill|NonOilen|CPE|ASA|Timberfill|Vinyl)/i],
      'azurefilm': [/^(PLA|PETG|ABS|ASA|Silk|Wood|Hyper Speed|High Speed|LumberLay|Lumos)/i],
      'ninjatek': [/^(Cheetah|NinjaFlex|Armadillo|Eel|SemiFlex)/i],
      'fiberlogy': [/^(Easy PLA|HD PLA|PETG|PA12|PCTG|FiberFlex)/i],
      'overture': [/^(PLA|PLA Pro|PLA\s*\+|PETG|TPU|ABS|Silk|Matte|Rock|Air)/i],
      'hatchbox': [/^(PLA|PLA\s*\+|PETG|ABS|TPU|Silk|Wood|Reload)/i],
      'sunlu': [/^(PLA|PLA\s*\+|PETG|TPU|ABS|ASA|Silk|Meta|E-ABS)/i],
      'eryone': [/^(PLA|PLA\s*\+|PETG|TPU|Silk|Galaxy|Matte|Marble|Tri-Color|Dual-Color)/i],
      '3d-fuel': [/^(Standard PLA|Pro PLA|Tough Pro|Pro PETG|Pro PCTG|Biome3D|Buzzed|Entwined|Wound Up|Landfillament)/i],
      '3dxtech': [/^(PEEK|PEKK|PEI|ULTEM|CarbonX|ESD|PETG|ABS|ASA|Nylon|PA|PC)/i],
      'proto-pasta': [/^(PLA|HTPLA|CFPLA|Carbon Fiber|Stainless Steel|Copper|Bronze|Iron)/i],
      'esun': [/^(PLA\s*\+|PETG|ABS\s*\+|eSilk|eMarble|TPU|ePLA|ePC|ePA)/i],
      'creality': [/^(Hyper|Ender|PLA|PETG|ABS|TPU|High Speed)/i],
      'colorfabb': [/^(PLA Economy|nGen|PETG|PA|Amphora|XT|Corkfill|Woodfill|Bronzefill)/i],
      'formfutura': [/^(EasyFil|HDglass|ApolloX|Volcano|Flexifil|Galaxy)/i],
      'amolen': [/^(PLA|PETG|TPU|Silk|Matte|Dual Color|Galaxy|Rainbow|Glow|Wood|Marble|Metal)/i],
      'siraya-tech': [/^(Fast|Blu|Build|Sculpt|Tenacious|Smoky|Brilliant|Infinite)/i],
    };
    
    const cardTitleIssues: Array<{ id: string; title: string; issue: string }> = [];

    // Get one representative product per product_line_id
    const { data: representativeProducts } = await supabase
      .from("filaments")
      .select("id, product_title, product_line_id")
      .ilike("vendor", brandName)
      .not("product_line_id", "is", null);

    const checkedLines = new Set<string>();
    for (const product of representativeProducts || []) {
      if (checkedLines.has(product.product_line_id)) continue;
      checkedLines.add(product.product_line_id);

      const displayName = simulateUIDisplayName(product.product_line_id, product.product_title);
      
      // First check: Does it match brand-specific valid patterns?
      const brandPatterns = VALID_PRODUCT_LINE_PATTERNS[brandSlug] || [];
      const matchesBrandPattern = brandPatterns.some(p => p.test(displayName));
      
      if (matchesBrandPattern) {
        // Valid product line name for this brand
        continue;
      }

      // Second check: Generic color pattern detection (for brands without specific patterns)
      const colorPatterns = [
        /\b(Red|Blue|Green|Yellow|Orange|Purple|Pink|Black|White|Gray|Grey|Brown|Silver|Gold|Copper|Navy|Teal|Aqua|Maroon|Indigo|Violet)\b/i,
        /\b(Groovy|Sparkle|Iridescent|Shimmer|Glitter|Metallic|Neon)\s+\w+/i,
        /v\d+\s+(Pearl|Translucent|Clear)/i,
        /\b(Cherry|Abyss|Aurora|Sunset|Ocean|Forest|Desert|Fire)\b/i, // Common color/theme names
      ];

      const looksLikeVariantTitle = colorPatterns.some(p => p.test(displayName));
      const isTooLong = displayName.split(' ').length > 5;

      // Only flag if it looks like a variant title AND doesn't match brand patterns
      if (looksLikeVariantTitle || isTooLong) {
        const expectedName = product.product_line_id.split('__').pop()?.replace(/-/g, ' ').toUpperCase() || 'Unknown';
        cardTitleIssues.push({
          id: product.id,
          title: displayName,
          issue: `Card shows individual variant name instead of product line. Expected: "${expectedName}"`,
        });
      }
    }

    checks.push({
      checkName: "Card Title Format (Product Line Names)",
      status: cardTitleIssues.length === 0 ? "pass" : cardTitleIssues.length <= 2 ? "warning" : "fail",
      count: checkedLines.size - cardTitleIssues.length,
      details: cardTitleIssues.length === 0
        ? `All ${checkedLines.size} cards show clean product line names`
        : `CRITICAL: ${cardTitleIssues.length} cards show individual variant names instead of product lines`,
      products: cardTitleIssues.length > 0 ? cardTitleIssues : undefined,
    });

    console.log(`[PostSyncCheck] Card Title Format complete: ${checkedLines.size - cardTitleIssues.length}/${checkedLines.size} correct`);

    // ============= FILAMENT DETAIL PAGE CONTENT CHECK (NEW) =============
    // Validates that each product_line_id has consistent variant data
    const { data: detailPageVariants } = await supabase
      .from("filaments")
      .select("id, product_title, product_line_id, material, color_hex, color_family, featured_image, product_url")
      .ilike("vendor", brandName)
      .not("product_line_id", "is", null);

    const detailPageIssues: Array<{ id: string; title: string; issue: string }> = [];
    const checkedDetailLines = new Set<string>();

    // Group variants by product_line_id
    const variantsByLine: Record<string, Array<{ id: string; product_title: string; material: string | null; color_hex: string | null; color_family: string | null; featured_image: string | null; product_url: string | null }>> = {};
    for (const variant of detailPageVariants || []) {
      const lineId = variant.product_line_id;
      if (!variantsByLine[lineId]) variantsByLine[lineId] = [];
      variantsByLine[lineId].push(variant);
    }

    for (const [productLineId, variants] of Object.entries(variantsByLine)) {
      if (checkedDetailLines.has(productLineId) || variants.length === 0) continue;
      checkedDetailLines.add(productLineId);

      // Check: All variants should have same material
      const materials = [...new Set(variants.map(v => v.material).filter(Boolean))];
      if (materials.length > 1) {
        detailPageIssues.push({
          id: variants[0].id,
          title: productLineId,
          issue: `Mixed materials in same product line: ${materials.join(', ')}. Detail page will show inconsistent data.`,
        });
      }

      // Check: Variants should have color data for swatches
      const variantsWithColors = variants.filter(v => v.color_hex);
      const colorCoverage = Math.round((variantsWithColors.length / variants.length) * 100);

      if (colorCoverage < 50 && variants.length > 1) {
        detailPageIssues.push({
          id: variants[0].id,
          title: productLineId,
          issue: `Only ${colorCoverage}% of variants have color_hex. Detail page swatches will be incomplete.`,
        });
      }
    }

    checks.push({
      checkName: "Filament Detail Page Content (Variant Consistency)",
      status: detailPageIssues.length === 0 ? "pass" : "fail",
      count: checkedDetailLines.size - detailPageIssues.length,
      details: detailPageIssues.length === 0
        ? `All ${checkedDetailLines.size} product lines have consistent variant data for detail pages`
        : `${detailPageIssues.length} product lines have issues that will affect detail page display`,
      products: detailPageIssues.length > 0 ? detailPageIssues : undefined,
    });

    console.log(`[PostSyncCheck] Filament Detail Page Content complete: ${checkedDetailLines.size - detailPageIssues.length}/${checkedDetailLines.size} consistent`);

    // ============= PRODUCT LINE ID COVERAGE CHECK (NEW) =============
    // Products without product_line_id won't group into cards - CRITICAL for UI display
    const { data: missingProductLineIdData } = await supabase
      .from("filaments")
      .select("id, product_title")
      .ilike("vendor", brandName)
      .is("product_line_id", null)
      .limit(20);

    const missingProductLineIds = missingProductLineIdData || [];
    const totalWithoutLineId = missingProductLineIds.length;

    const productLineIdIssues: Array<{ id: string; title: string; issue: string }> = 
      missingProductLineIds.map((p: { id: string; product_title: string }) => ({
        id: p.id,
        title: p.product_title,
        issue: 'Missing product_line_id - will not display in card grid',
      }));

    // Determine severity: if many products missing, it's critical
    const productLineIdStatus = totalWithoutLineId === 0 ? "pass" : 
      (totalWithoutLineId <= 5 || totalWithoutLineId < (totalProducts || 0) * 0.1) ? "warning" : "fail";

    checks.push({
      checkName: "Product Line ID Coverage (UI Card Grouping)",
      status: productLineIdStatus,
      count: (totalProducts || 0) - totalWithoutLineId,
      details: totalWithoutLineId === 0
        ? `All ${totalProducts || 0} products have product_line_id assigned for card grouping`
        : `CRITICAL: ${totalWithoutLineId}+ products missing product_line_id - won't display in UI card grid`,
      products: productLineIdIssues.length > 0 ? productLineIdIssues : undefined,
    });

    console.log(`[PostSyncCheck] Product Line ID Coverage: ${(totalProducts || 0) - totalWithoutLineId}/${totalProducts || 0} have product_line_id`);

    // ============= VISUAL HIERARCHY VALIDATION CHECK (NEW) =============
    // Validates the logical product hierarchy for UI display:
    // Brand → Product Lines (Cards) → Color Variants (Swatches)
    const hierarchyIssues: Array<{ id: string; title: string; issue: string }> = [];

    // Check 1: Each product line should have >= 1 variant (shouldn't happen but defensive)
    for (const [productLineId, variants] of Object.entries(variantsByLine)) {
      const variantArray = variants as Array<{ id: string; product_title: string }>;
      if (!variantArray || variantArray.length === 0) {
        hierarchyIssues.push({
          id: 'empty-line',
          title: productLineId,
          issue: 'Product line has 0 variants - empty card will display',
        });
      }
    }

    // Check 2: No single product_line_id should have >100 variants (likely incorrect grouping)
    for (const [productLineId, variants] of Object.entries(variantsByLine)) {
      const variantArray = variants as Array<{ id: string; product_title: string }>;
      if (variantArray && variantArray.length > 100) {
        hierarchyIssues.push({
          id: variantArray[0].id,
          title: productLineId,
          issue: `Product line has ${variantArray.length} variants - likely incorrect grouping (should be multiple product lines)`,
        });
      }
    }

    // Check 3: Product line ID should follow naming convention (brand__product format)
    for (const productLineId of Object.keys(variantsByLine)) {
      if (!productLineId.includes('__')) {
        const variants = variantsByLine[productLineId] as Array<{ id: string }>;
        hierarchyIssues.push({
          id: variants?.[0]?.id || 'invalid-format',
          title: productLineId,
          issue: 'Invalid product_line_id format - missing brand__product separator',
        });
      }
    }

    checks.push({
      checkName: "Visual Hierarchy Validation (Card → Swatch Structure)",
      status: hierarchyIssues.length === 0 ? "pass" : hierarchyIssues.length <= 3 ? "warning" : "fail",
      count: Object.keys(variantsByLine).length - hierarchyIssues.length,
      details: hierarchyIssues.length === 0
        ? `Visual hierarchy is correct: ${Object.keys(variantsByLine).length} product cards with proper variant grouping`
        : `${hierarchyIssues.length} hierarchy issues will affect UI display`,
      products: hierarchyIssues.length > 0 ? hierarchyIssues : undefined,
    });

    console.log(`[PostSyncCheck] Visual Hierarchy Validation: ${hierarchyIssues.length} issues found`);

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
        
        // === SKIP URL CONSISTENCY FOR ATOMIC FILAMENT ===
        // Atomic Filament has 57+ different product URLs grouped into 5 product_line_ids
        // Each color variant IS a completely separate Shopify product with its own URL
        // This is by design - the product_line_id groups them correctly
        const skipUrlCheckBrands = ['atomic-filament', 'azurefilm'];
        if (skipUrlCheckBrands.includes(brandSlug)) {
          // Skip - expected architecture for this brand
          continue;
        }
        
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

    // ============= HEX-COLOR ACCURACY CHECK (NEW) =============
    // Validates that color_hex matches the color name in product_title/color_family
    // Flags products where the hex is obviously wrong for the stated color (e.g., gold with blue hex)
    
    /**
     * Extract the primary color name from product title or color_family
     * Uses position-based priority and excludes modifiers/negatives
     */
    function extractPrimaryColor(title: string, colorFamily?: string | null): string | null {
      const colorPatterns = [
        'gold', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 
        'cyan', 'teal', 'green', 'brown', 'black', 'white', 'gray', 
        'grey', 'silver', 'bronze', 'copper', 'beige', 'natural', 'indigo',
        'lilac', 'violet', 'olive', 'maroon', 'navy', 'crimson', 'coral'
      ];
      
      let text = (title + ' ' + (colorFamily || '')).toLowerCase();
      
      // Skip gift cards, bundles, multi-color products (rainbow, gradient, galaxy, etc.)
      const skipPatterns = [
        'gift card', 'rainbow', 'gradient', 'galaxy', 'multicolor', 'multi-color',
        'dual color', 'dual-color', 'chameleon', 'shade-shifting', 'groovy',
        'illusion', 'cosmic', 'nebula', 'aurora', 'tri-color', 'tricolor'
      ];
      for (const skip of skipPatterns) {
        if (text.includes(skip)) return null;
      }
      
      // Skip negative patterns - "NO YELLOW HUE" should NOT match yellow
      const negativePatterns = ['no yellow', 'no blue', 'no red', 'no green', 'no color'];
      for (const neg of negativePatterns) {
        if (text.includes(neg)) return null;
      }
      
      // Remove color MODIFIERS that indicate shimmer/effect, not base color
      // "golden sparkle" = sparkle effect, NOT gold color
      // "golden blood diamond" = red, NOT gold
      const modifierPatterns = [
        'golden sparkle', 'golden blood', 'golden diamond', 'gold flake',
        'silver sparkle', 'silver flake', 'copper sparkle', 'copper flake',
        'bronze sparkle', 'bronze flake'
      ];
      for (const mod of modifierPatterns) {
        text = text.replace(mod, '');
      }
      
      // Handle compound specialty colors FIRST (before single-word detection)
      const compoundColors: Record<string, string> = {
        'olive drab': 'green',           // Olive drab IS green
        'smoke black': 'gray',           // Smoke black is translucent gray
        'translucent black': 'gray',     // Translucent black appears gray
        'translucent smoke': 'gray',     // Smoke variants are gray
        'black marble': 'gray',          // Marble has gray veins
        'blood diamond': 'red',          // Blood diamond is red
        'offshore mist': 'blue',         // Mist is blue-ish
        'electric blue': 'blue',         // Electric blue IS blue
        'pastel lilac': 'purple',        // Lilac IS purple
        'gun metal': 'gray',             // Gun metal is gray
        'gunmetal': 'gray',              // Gun metal is gray
        
        // === ATOMIC FILAMENT SPECIALTY COLORS ===
        'rose gold': 'pink',             // Rose gold is pink-metallic, not gold
        'pearly peach': 'orange',        // Peach IS orange family
        'salmon': 'pink',                // Salmon is pink/coral family
        'starlight gray': 'gray',        // Starlight gray IS gray
        'starlight grey': 'gray',        // Alternate spelling
      };
      for (const [compound, baseColor] of Object.entries(compoundColors)) {
        if (text.includes(compound)) return baseColor;
      }
      
      // Find ALL colors with their positions and return the FIRST one found
      // This ensures "Indigo Golden Sparkle" returns "indigo" (pos 0) not "gold" (pos 7)
      const matches: Array<{ color: string; index: number }> = [];
      for (const color of colorPatterns) {
        const idx = text.indexOf(color);
        if (idx !== -1) {
          // Make sure it's a word boundary (not part of another word)
          const beforeChar = idx > 0 ? text[idx - 1] : ' ';
          const afterChar = idx + color.length < text.length ? text[idx + color.length] : ' ';
          if ((beforeChar === ' ' || beforeChar === '-' || beforeChar === '/') &&
              (afterChar === ' ' || afterChar === '-' || afterChar === '/' || afterChar === ',')) {
            matches.push({ color, index: idx });
          }
        }
      }
      
      // Sort by position and return the first color found
      matches.sort((a, b) => a.index - b.index);
      return matches[0]?.color || null;
    }

    /**
     * Convert hex to RGB
     */
    function hexToRgbLocal(hex: string): { r: number; g: number; b: number } | null {
      const clean = hex.replace('#', '');
      if (clean.length !== 6) return null;
      
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      
      if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
      return { r, g, b };
    }

    /**
     * Validate hex matches expected color family using RGB analysis
     * More lenient for translucent and specialty variants
     */
    function isHexValidForColorName(hex: string, colorName: string, productTitle?: string): boolean {
      const rgb = hexToRgbLocal(hex);
      if (!rgb) return true; // Can't validate, assume OK
      
      const { r, g, b } = rgb;
      const brightness = (r + g + b) / 3;
      const titleLower = (productTitle || '').toLowerCase();
      const isTranslucent = titleLower.includes('translucent') || titleLower.includes('smoke') || titleLower.includes('clear');
      
      // === SPECIAL HANDLING FOR COMPOUND SPECIALTY COLORS ===
      // These specialty colors don't fit standard categories - validate more leniently
      if (titleLower.includes('rose gold')) {
        // Rose gold: pink-ish metallic (high R, medium-high G, some B)
        return r > 120 && r > b - 30;
      }
      if (titleLower.includes('pearly peach') || (titleLower.includes('peach') && !titleLower.includes('peachy'))) {
        // Peach: light orange/pink (warm color, high brightness)
        return r > 150 && g > 100 && brightness > 150;
      }
      if (titleLower.includes('starlight')) {
        // Starlight variants - metallic effects, allow any gray-ish color
        return Math.abs(r - g) < 80 && Math.abs(g - b) < 80;
      }
      
      switch (colorName) {
        case 'gold':
        case 'yellow':
          // Gold/Yellow should have high R+G, low B
          return r > 150 && g > 100 && b < r - 50;
        case 'blue':
        case 'cyan':
        case 'navy':
          // Blue should have high B, lower R
          return b > r && b > 80;
        case 'indigo':
          // Indigo is blue-purple, high B and some R
          return b > 80 && (b > g || r > 60);
        case 'red':
        case 'crimson':
        case 'maroon':
          // Red should have high R, low G+B
          return r > 120 && r > g && r > b;
        case 'green':
        case 'teal':
        case 'olive':
          // Green/Teal should have high G (relaxed for olive tones)
          return g >= r - 30 && g > 60;
        case 'black':
          // Black should be dark, but translucent black can be lighter
          if (isTranslucent) return brightness < 150;
          return brightness < 100;
        case 'white':
        case 'natural':
          // White/natural should be bright (relaxed for cream/ivory variants)
          return brightness > 170;
        case 'pink':
        case 'coral':
          // Pink should have high R and some B
          return r > 120 && r > g;
        case 'purple':
        case 'violet':
        case 'lilac':
          // Purple should have high R and B, lower G
          return (r > 60 || b > 60) && b >= g - 30;
        case 'orange':
          // Orange should have high R, medium G, low B
          return r > 150 && g > 40 && b < 150;
        case 'brown':
          // Brown is dark orange/red
          return r > g && brightness < 180;
        case 'gray':
        case 'grey':
          // Gray should have similar RGB values (not saturated) - very relaxed
          return Math.abs(r - g) < 60 && Math.abs(g - b) < 60 && Math.abs(r - b) < 60;
        case 'silver':
          // Silver is bright gray
          return Math.abs(r - g) < 50 && Math.abs(g - b) < 50 && brightness > 140;
        case 'bronze':
        case 'copper':
          // Bronze/copper is warm metallic (reddish-brown)
          return r > g && r > 100;
        case 'beige':
          // Beige is warm light color
          return brightness > 150 && r >= g;
        default:
          return true;
      }
    }

    // Run hex-color accuracy check
    const colorMismatches: Array<{ id: string; title: string; issue: string; url?: string }> = [];

    const { data: allProductsForColorCheck } = await supabase
      .from("filaments")
      .select("id, product_title, color_hex, color_family, product_url")
      .ilike("vendor", brandName)
      .not("color_hex", "is", null);

    for (const product of allProductsForColorCheck || []) {
      const colorName = extractPrimaryColor(product.product_title, product.color_family);
      if (!colorName || !product.color_hex) continue;
      
      const isValid = isHexValidForColorName(product.color_hex, colorName, product.product_title);
      if (!isValid) {
        colorMismatches.push({
          id: product.id,
          title: product.product_title,
          issue: `Hex ${product.color_hex} doesn't match color "${colorName}" - swatch shows wrong color`,
          url: product.product_url || undefined,
        });
      }
    }

    checks.push({
      checkName: "Hex-Color Accuracy",
      status: colorMismatches.length === 0 ? "pass" : 
              colorMismatches.length <= 5 ? "warning" : "fail",
      count: (allProductsForColorCheck?.length || 0) - colorMismatches.length,
      details: colorMismatches.length === 0 
        ? `All ${allProductsForColorCheck?.length || 0} products have hex codes matching their color names` 
        : `${colorMismatches.length} products have hex codes that don't match their stated color`,
      products: colorMismatches.length > 0 ? colorMismatches.slice(0, 15) : undefined,
    });

    console.log(`[PostSyncCheck] Hex-Color Accuracy: ${colorMismatches.length} mismatches found`);

    // ============= LOGO IMAGE DETECTION CHECK (NEW) =============
    // Flag when many products share the same image URL (indicates logo fallback, not real product images)
    const { data: allProductsForImageCheck } = await supabase
      .from("filaments")
      .select("id, product_title, featured_image")
      .ilike("vendor", brandName);

    const imageUrlCounts: Record<string, number> = {};
    for (const product of allProductsForImageCheck || []) {
      if (product.featured_image) {
        imageUrlCounts[product.featured_image] = (imageUrlCounts[product.featured_image] || 0) + 1;
      }
    }

    const totalProductsWithImages = (allProductsForImageCheck || []).filter(p => p.featured_image).length;
    const totalProductsCount = allProductsForImageCheck?.length || 0;
    const uniqueImageCount = Object.keys(imageUrlCounts).length;
    
    // Find the most common image
    const sortedImageCounts = Object.entries(imageUrlCounts).sort((a, b) => b[1] - a[1]);
    const mostCommonImage = sortedImageCounts[0];
    
    const logoImageIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Issue 1: Check if most products share the same image (indicates logo)
    const isLogoImage = mostCommonImage && (
      mostCommonImage[0].toLowerCase().includes('logo') || 
      mostCommonImage[1] > totalProductsCount * 0.5
    );
    
    if (isLogoImage) {
      logoImageIssues.push({
        id: 'shared-logo-image',
        title: 'Shared Logo Image Detected',
        issue: `${mostCommonImage[1]}/${totalProductsCount} products share the same image URL (likely a logo, not product images)`,
      });
    }
    
    // Issue 2: Check if too many products are missing images entirely
    const missingImageCount = totalProductsCount - totalProductsWithImages;
    if (missingImageCount > totalProductsCount * 0.3) {
      logoImageIssues.push({
        id: 'missing-images',
        title: 'Missing Product Images',
        issue: `${missingImageCount}/${totalProductsCount} products have no featured_image`,
      });
    }
    
    // Issue 3: Check image uniqueness ratio (for color variants, each should ideally have a unique image)
    // Whitelist brands that use product-level images (not color-level images) - this is expected behavior
    // Brands that use product-level images (not color-level images) - this is expected behavior
    // Note: Bambu Lab DOES have color-specific images so it's no longer whitelisted
    const PRODUCT_LEVEL_IMAGE_BRANDS = ['atomic filament', 'azurefilm'];
    const isProductLevelImageBrand = PRODUCT_LEVEL_IMAGE_BRANDS.some(b => 
      brandSlug?.toLowerCase().includes(b.replace(' ', '-')) || 
      brandSlug?.toLowerCase().includes(b.replace(' ', ''))
    );
    
    const imageUniquenessRatio = uniqueImageCount / Math.max(totalProductsCount, 1);
    if (totalProductsCount > 10 && imageUniquenessRatio < 0.3 && !isLogoImage && !isProductLevelImageBrand) {
      logoImageIssues.push({
        id: 'low-image-variety',
        title: 'Low Image Variety',
        issue: `Only ${uniqueImageCount} unique images across ${totalProductsCount} products (${Math.round(imageUniquenessRatio * 100)}% uniqueness)`,
      });
    }

    checks.push({
      checkName: "Product Image Quality (Logo Detection)",
      status: logoImageIssues.length === 0 ? "pass" : logoImageIssues.length === 1 ? "warning" : "fail",
      count: uniqueImageCount,
      details: logoImageIssues.length === 0
        ? `${uniqueImageCount} unique product images across ${totalProductsCount} products`
        : `CRITICAL: ${logoImageIssues.length} image quality issues detected`,
      products: logoImageIssues.length > 0 ? logoImageIssues : undefined,
    });

    console.log(`[PostSyncCheck] Product Image Quality: ${uniqueImageCount} unique images, ${logoImageIssues.length} issues`);

    // ============= COLOR VARIANT COUNT PER PRODUCT LINE CHECK (NEW) =============
    // Validates that each product_line_id has the expected number of color variants
    // This catches sync issues where only 1 row per product is created instead of 1 row per color
    const variantCountIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Group products by product_line_id and count
    const productsByLineForCount: Record<string, Array<{ id: string; product_title: string; color_hex: string | null }>> = {};
    for (const variant of detailPageVariants || []) {
      const lineId = variant.product_line_id;
      if (!productsByLineForCount[lineId]) productsByLineForCount[lineId] = [];
      productsByLineForCount[lineId].push({
        id: variant.id,
        product_title: variant.product_title,
        color_hex: variant.color_hex,
      });
    }

    // Check each product line for suspiciously low variant counts
    for (const [lineId, variants] of Object.entries(productsByLineForCount)) {
      // If a product line has only 1 variant but should have multiple colors, flag it
      // This is a heuristic: most filament product lines have 5+ color variants
      if (variants.length === 1) {
        // Skip single-color products (CF, GF, specialty materials, support, aero, etc.)
        // These legitimately only come in 1 color
        // Use [_-] to match both hyphens (3d-fuel) and underscores (bambulab__pva__standard)
        const isSingleColorProduct = /[_-](cf|gf|pva|support|ht|pa6|pps|peek|pei|aero)[_-]?/i.test(lineId) ||
                                     /\b(carbon|glass|support|aero|composite)\b/i.test(lineId) ||
                                     lineId.includes('__support__') ||
                                     lineId.includes('support-') ||
                                     lineId.includes('__pva__') ||
                                     lineId.includes('paht-cf') ||
                                     lineId.includes('pa-cf') ||
                                     lineId.includes('asa-aero') ||
                                     lineId.includes('__asa__aero');
        
        if (!isSingleColorProduct) {
          variantCountIssues.push({
            id: variants[0].id,
            title: lineId,
            issue: `Only 1 variant in DB - sync likely created 1 row per product instead of 1 row per color`,
          });
        }
      }
      
      // Also flag if many variants in a product line share NULL color_hex (missing color data)
      const variantsWithNullHex = variants.filter(v => !v.color_hex);
      if (variantsWithNullHex.length > variants.length * 0.5 && variants.length > 1) {
        variantCountIssues.push({
          id: variants[0].id,
          title: lineId,
          issue: `${variantsWithNullHex.length}/${variants.length} variants missing color_hex - color swatches won't display`,
        });
      }
    }

    checks.push({
      checkName: "Color Variant Count per Product Line",
      status: variantCountIssues.length === 0 ? "pass" : variantCountIssues.length <= 3 ? "warning" : "fail",
      count: Object.keys(productsByLineForCount).length - variantCountIssues.length,
      details: variantCountIssues.length === 0
        ? `All ${Object.keys(productsByLineForCount).length} product lines have proper color variant counts`
        : `CRITICAL: ${variantCountIssues.length} product lines have variant count issues - swatches won't display correctly`,
      products: variantCountIssues.length > 0 ? variantCountIssues.slice(0, 15) : undefined,
    });

    console.log(`[PostSyncCheck] Color Variant Count: ${variantCountIssues.length} issues found`);

    // ============= COLOR-SPECIFIC IMAGE CHECK (ENHANCED) =============
    // For product lines with multiple color variants, verify each color has a unique image
    // (not all variants sharing the same generic product image)
    // 
    // BAMBU LAB SPECIAL CHECK: Verify S5 gallery images (not S7 swatch thumbnails)
    // - S5 CDN (store.bblcdn.com/s5/): Full product photos (CORRECT)
    // - S7 CDN (store.bblcdn.com/s7/): Tiny swatch thumbnails (WRONG)
    // 
    // TIERED S5 REQUIREMENT (Bambu Lab only):
    // - Tier 1: Single-color products (1-2 variants, CF/GF/Support/PVA) - S7 acceptable
    // - Tier 2: Multi-color products (3+ variants) - S5 REQUIRED (flag if using S7)
    const colorImageIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Group by product_line_id to check image uniqueness within each line
    const productsByLineForImageCheck: Record<string, Array<{
      id: string;
      product_title: string;
      color_family: string | null;
      featured_image: string | null;
    }>> = {};
    
    for (const variant of detailPageVariants || []) {
      const lineId = variant.product_line_id;
      if (!productsByLineForImageCheck[lineId]) productsByLineForImageCheck[lineId] = [];
      productsByLineForImageCheck[lineId].push({
        id: variant.id,
        product_title: variant.product_title,
        color_family: variant.color_family,
        featured_image: variant.featured_image,
      });
    }
    
    // Check each product line with 3+ color variants
    for (const [lineId, variants] of Object.entries(productsByLineForImageCheck)) {
      if (variants.length < 3) continue; // Skip small variant sets - S7 acceptable for 1-2 variants
      
      // Skip known single-color product types (CF, GF, etc.) - S7 acceptable
      // These legitimately only come in 1-2 colors, so swatch thumbnails are fine
      const isSingleColorProduct = /[_-](cf|gf|pva|support|ht|pa6|pps|peek|pei|aero)[_-]?/i.test(lineId) ||
                                   /\b(carbon|glass|support|aero|composite)\b/i.test(lineId) ||
                                   lineId.includes('__support__') ||
                                   lineId.includes('support-') ||
                                   lineId.includes('__pva__') ||
                                   lineId.includes('paht-cf') ||
                                   lineId.includes('pa-cf') ||
                                   lineId.includes('asa-aero') ||
                                   lineId.includes('__asa__aero');
      if (isSingleColorProduct) continue;
      
      // Count unique images (excluding null/undefined)
      const imagesWithValues = variants.map(v => v.featured_image).filter(Boolean);
      const uniqueImages = new Set(imagesWithValues);
      
      // BAMBU LAB SPECIFIC: Check if using S7 swatch thumbnails instead of S5 gallery images
      // S5 gallery images (1920px) are REQUIRED - S7 swatch thumbnails (~50px) are NOT acceptable
      if (brandSlug === 'bambu-lab') {
        const s7SwatchImages = imagesWithValues.filter(img => img?.includes('store.bblcdn.com/s7/'));
        const s5GalleryImages = imagesWithValues.filter(img => img?.includes('store.bblcdn.com/s5/'));
        
        // CRITICAL: Multi-color products MUST use S5 gallery images
        if (s7SwatchImages.length > 0 && s5GalleryImages.length === 0) {
          colorImageIssues.push({
            id: lineId,
            title: lineId,
            issue: `CRITICAL: Using S7 swatch thumbnails (~50px) instead of S5 product gallery images (1920px). All ${s7SwatchImages.length} images are wrong type.`,
          });
          continue; // Skip other checks for this line
        }
        
        // Warn if mixed S7/S5 (some colors have wrong images)
        if (s7SwatchImages.length > 0 && s5GalleryImages.length > 0) {
          colorImageIssues.push({
            id: lineId,
            title: lineId,
            issue: `Mixed image types: ${s5GalleryImages.length} S5 gallery (correct), ${s7SwatchImages.length} S7 swatch (wrong). Fix S7 images.`,
          });
          continue;
        }
      }
      
      // If all variants share the same image, flag it
      if (uniqueImages.size === 1 && variants.length >= 3) {
        colorImageIssues.push({
          id: lineId,
          title: lineId,
          issue: `All ${variants.length} color variants share the same image (expected unique images per color)`,
        });
      }
      
      // Also flag if less than 50% of variants have unique images for larger sets
      else if (uniqueImages.size < variants.length * 0.5 && variants.length >= 5 && imagesWithValues.length >= 3) {
        colorImageIssues.push({
          id: lineId,
          title: lineId,
          issue: `Only ${uniqueImages.size}/${variants.length} variants have unique images - colors may show wrong product photos`,
        });
      }
    }
    
    checks.push({
      checkName: "Color-Specific Images",
      status: colorImageIssues.length === 0 ? "pass" : colorImageIssues.length <= 3 ? "warning" : "fail",
      count: Object.keys(productsByLineForImageCheck).length - colorImageIssues.length,
      details: colorImageIssues.length === 0
        ? `All multi-color product lines have unique images per color variant${brandSlug === 'bambu-lab' ? ' (S5 gallery verified)' : ''}`
        : `${colorImageIssues.length} product lines have image issues`,
      products: colorImageIssues.length > 0 ? colorImageIssues.slice(0, 15) : undefined,
    });
    
    console.log(`[PostSyncCheck] Color-Specific Images: ${colorImageIssues.length} issues found`);

    // ========== BAMBU LAB SPECIFIC: Variant URL Parameter Check (ENHANCED) ==========
    // Verify that every Bambu Lab color variant has a variant-specific URL with ?id= parameter
    // This ensures "Buy Now" links go directly to the selected color variant
    if (brandSlug === 'bambu-lab') {
      const variantUrlIssues: { id: string; title: string; issue: string }[] = [];
      const variantUrlStats = {
        totalVariants: 0,
        variantsWithUrl: 0,
        variantsMissingUrl: 0,
        productLinesChecked: new Set<string>(),
      };
      
      // Check EVERY variant individually (not just product lines)
      for (const variant of detailPageVariants || []) {
        variantUrlStats.totalVariants++;
        const url = variant.product_url || '';
        const hasVariantId = url.includes('?id=') || url.includes('&id=');
        
        if (hasVariantId) {
          variantUrlStats.variantsWithUrl++;
        } else {
          variantUrlStats.variantsMissingUrl++;
        }
        
        variantUrlStats.productLinesChecked.add(variant.product_line_id || 'unknown');
      }
      
      // Group by product line for detailed issue reporting
      const productLineStats: Record<string, { total: number; withUrl: number; missingColors: string[] }> = {};
      
      for (const variant of detailPageVariants || []) {
        const lineId = variant.product_line_id || 'unknown';
        if (!productLineStats[lineId]) {
          productLineStats[lineId] = { total: 0, withUrl: 0, missingColors: [] };
        }
        productLineStats[lineId].total++;
        
        const url = variant.product_url || '';
        const hasVariantId = url.includes('?id=') || url.includes('&id=');
        
        if (hasVariantId) {
          productLineStats[lineId].withUrl++;
        } else {
          productLineStats[lineId].missingColors.push(variant.color_family || 'Unknown');
        }
      }
      
      // Report product lines with missing variant URLs
      for (const [lineId, stats] of Object.entries(productLineStats)) {
        if (stats.withUrl < stats.total) {
          const coveragePercent = Math.round((stats.withUrl / stats.total) * 100);
          variantUrlIssues.push({
            id: lineId,
            title: lineId.replace('bambulab__', '').replace(/__/g, ' ').toUpperCase(),
            issue: `${stats.withUrl}/${stats.total} variants have ?id= (${coveragePercent}%). Missing: ${stats.missingColors.slice(0, 5).join(', ')}${stats.missingColors.length > 5 ? '...' : ''}`,
          });
        }
      }
      
      // Calculate overall coverage percentage
      const coveragePercent = variantUrlStats.totalVariants > 0 
        ? Math.round((variantUrlStats.variantsWithUrl / variantUrlStats.totalVariants) * 100)
        : 0;
      
      // Determine status based on coverage
      let variantUrlStatus: 'pass' | 'warning' | 'fail' = 'pass';
      if (coveragePercent < 50) variantUrlStatus = 'fail';
      else if (coveragePercent < 100) variantUrlStatus = 'warning';
      
      checks.push({
        checkName: "Variant URL Parameters (Bambu Lab)",
        status: variantUrlStatus,
        count: variantUrlStats.variantsWithUrl,
        details: coveragePercent === 100
          ? `All ${variantUrlStats.totalVariants} variants have ?id= parameter for direct Buy Now linking`
          : `${variantUrlStats.variantsWithUrl}/${variantUrlStats.totalVariants} variants have ?id= parameter (${coveragePercent}% coverage). Run update-bambulab-urls to fix.`,
        products: variantUrlIssues.length > 0 ? variantUrlIssues.slice(0, 15) : undefined,
      });
      
      console.log(`[PostSyncCheck] Variant URL Parameters: ${variantUrlStats.variantsWithUrl}/${variantUrlStats.totalVariants} (${coveragePercent}%)`);
      
      // ========== BAMBU LAB: Filament Detail Page Display Validation ==========
      // Validates what users actually see on the Filament Detail page for each product line
      const detailPageIssues: { id: string; title: string; issue: string }[] = [];
      
      // Group by product_line_id to simulate FilamentDetail page
      const variantsByLine: Record<string, Array<{
        id: string;
        product_line_id: string;
        product_title: string;
        color_family: string | null;
        featured_image: string | null;
        product_url: string | null;
      }>> = {};
      for (const variant of detailPageVariants || []) {
        const lineId = variant.product_line_id || 'unknown';
        if (!variantsByLine[lineId]) variantsByLine[lineId] = [];
        variantsByLine[lineId].push(variant);
      }
      
      for (const [lineId, lineVariants] of Object.entries(variantsByLine)) {
        if (!lineVariants || lineVariants.length === 0) continue;
        
        // Check 1: Every variant should have a unique featured_image (for multi-color lines)
        if (lineVariants.length > 2) {
          const imagesSet = new Set(lineVariants.map(v => v.featured_image).filter(Boolean));
          if (imagesSet.size === 1) {
            detailPageIssues.push({
              id: lineId,
              title: lineVariants[0]?.product_title || lineId,
              issue: `All ${lineVariants.length} colors share same image - color selection won't update photo`,
            });
          }
        }
        
        // Check 2: Every variant should have a product_url
        const variantsWithoutUrl = lineVariants.filter(v => !v.product_url);
        if (variantsWithoutUrl.length > 0) {
          detailPageIssues.push({
            id: lineId,
            title: lineVariants[0]?.product_title || lineId,
            issue: `${variantsWithoutUrl.length}/${lineVariants.length} variants have no product_url - Buy Now button will fail`,
          });
        }
        
        // Check 3: Featured images should be S5 (1920px) not S7 (thumbnails) for multi-color lines
        if (lineVariants.length > 2) {
          const s7Variants = lineVariants.filter(v => v.featured_image?.includes('/s7/'));
          if (s7Variants.length > 0) {
            detailPageIssues.push({
              id: lineId,
              title: lineVariants[0]?.product_title || lineId,
              issue: `${s7Variants.length} variants using S7 thumbnails (50px) instead of S5 gallery images (1920px)`,
            });
          }
        }
      }
      
      checks.push({
        checkName: "Filament Detail Page Display (Bambu Lab)",
        status: detailPageIssues.length === 0 ? "pass" : detailPageIssues.length <= 3 ? "warning" : "fail",
        count: Object.keys(variantsByLine).length - detailPageIssues.length,
        details: detailPageIssues.length === 0
          ? `All ${Object.keys(variantsByLine).length} product lines display correctly with unique images and valid Buy Now URLs per color`
          : `${detailPageIssues.length} product lines have display issues`,
        products: detailPageIssues.length > 0 ? detailPageIssues.slice(0, 15) : undefined,
      });
      
      console.log(`[PostSyncCheck] Filament Detail Page Display: ${detailPageIssues.length} issues found`);
    }

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
