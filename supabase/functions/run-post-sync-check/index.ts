import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  checkName: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
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
const IMAGE_SWATCH_BRANDS = ['3d-fuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'esun', 'overture', 'anycubic', 'azurefilm', 'bambu-lab', 'colorfabb', 'extrudr', 'fillamentum', 'geeetech', 'gizmo-dorks', 'ic3d-printers', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'paramount-3d', 'prusament', 'push-plastic', 'recreus', 'siraya-tech', 'sovol'];

// Brands that use product-line level images (same image for all color variants)
// Skip Image URLs Valid check for these - some servers return 404 for HEAD requests or don't have color-specific URLs
const PRODUCT_LEVEL_IMAGE_BRANDS = ['ninjatek', 'kingroon', 'gizmo-dorks', 'numakers', 'overture', 'paramount-3d', 'proto-pasta', 'prusament', 'push-plastic', 'siraya-tech', 'sovol', 'sunlu'];

// Brands that use CSV-seeded sync and should skip certain checks
const CSV_SEEDED_BRANDS = ['eryone', 'esun', 'extrudr', 'fillamentum', 'formfutura', 'geeetech', 'gizmo-dorks', 'hatchbox', 'colorfabb', 'fiberlogy', 'fusion-filaments', 'ic3d-printers', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'overture', 'paramount-3d', 'proto-pasta', 'prusament', 'push-plastic', 'recreus', 'siraya-tech', 'sunlu'];

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
  colorFabbSpecialist: {
    title: 'ColorFabb Integration Specialist',
    triggers: ['colorfabb', 'magento', 'varioshore', 'lw-pla', 'ngen', 'bronzefill', 'corkfill'],
    capabilities: [
      'Magento 2 (Adobe Commerce) platform analysis (NOT Shopify)',
      'CSV-seeded sync pipeline architecture',
      'Premium Dutch filament material classification',
      'Specialty material handling (LW-PLA, varioShore TPU, fills)',
      'Firecrawl HTML scraping for TDS extraction',
      'Complex product line normalization (24+ lines)'
    ]
  },
  esunSpecialist: {
    title: 'eSUN Integration Specialist',
    triggers: ['esun', 'ueeshop', 'esun3dstore', 'epla', 'pla-matte', 'pla-silk', 'tpu-95a'],
    capabilities: [
      'eSUN custom ueeshop platform analysis (NOT Shopify)',
      'CSV-seeded sync pipeline architecture (444 products)',
      'Chinese filament brand material classification',
      'Specialty line handling (Silk Magic, Luminous, Rock, Stars)',
      'High-speed variant detection (PLA+HS, PETG+HS, ABS+HS)',
      'Complex product line normalization (45+ lines)'
    ]
  },
  hatchboxSpecialist: {
    title: 'Hatchbox Integration Specialist',
    triggers: ['hatchbox', 'rapid petg', 'pla max', 'reload', 'refill', 'matte pla', 'silk pla', 'metallic pla', '285c', 'pantone', 'lemonade', 'lemon yellow'],
    capabilities: [
      'Shopify platform analysis (hatchbox3d.com)',
      'CSV-seeded sync pipeline architecture (~175 products, 17 product lines)',
      'Popular consumer filament brand material classification',
      'Cross-product swatch architecture (each color = separate URL)',
      'Rapid PETG high-speed variant detection',
      'PLA MAX V2 USA-made premium line handling',
      'Reload/Refill eco-spool product line grouping',
      'Finish type detection (Matte, Silk, Metallic, Glow, Wood, Stone, Rainbow, UV)',
      'Compound color names: Gray Blue, Peacock Blue, Iron Red, Midnight Purple'
    ],
    lessons: [
      'ALWAYS use CSV seed (hatchbox-seed.ts) as primary source - never rely on Shopify API',
      '285C in SKU/URL is a Pantone color code for Light Blue, NOT a 2.85mm diameter',
      'T-shirts and apparel are in Shopify catalog - MUST be filtered with accessory patterns',
      'Hex codes MUST be unique within each product_line_id - differentiate Lemon Yellow (#FFFACD) from Lemonade (#FFF9C4)',
      'Ignore UI limit parameter - CSV-seeded brands always process full curated catalog',
      'Use delete-then-insert pattern with safe threshold (50+ products) for clean slate',
      'Cross-product swatch architecture means URL consistency check should be SKIPPED',
      'Compound colors like Gray Blue have curated hex codes - hex validation is SKIPPED for this brand',
      'Single-variant product lines (Stone, CF) are correct architecture - not a sync error'
    ]
  },
  extrudrSpecialist: {
    title: 'Extrudr Integration Specialist',
    triggers: ['extrudr', 'durapro', 'biofusion', 'greentec', 'flex-medium', 'flex-hard', 'pctg', 'flax'],
    capabilities: [
      'Custom Next.js platform analysis (NOT Shopify)',
      'CSV-seeded sync pipeline architecture (~130 products)',
      'Premium Austrian filament material classification',
      'Bio-based material handling (GreenTEC, BioFusion, FLAX)',
      'TPU Shore hardness variant detection (88A, 92A, 98A)',
      'Engineering plastics expertise (PC-PBT, PA12, ASA-GF)',
      'Cardboard spool eco-friendly packaging'
    ]
  },
  fillamentumSpecialist: {
    title: 'Fillamentum Integration Specialist',
    triggers: ['fillamentum', 'extrafill', 'flexfill', 'timberfill', 'nonoilen', 'cpe-hg100', 'vinyl-303', 'vertigo'],
    capabilities: [
      'Shopify platform (shop.fillamentum.com / fillamentumusa.com)',
      'CSV-seeded sync pipeline architecture (~200 products)',
      'Premium Czech filament material classification',
      'Unique color naming system (Vertigo, Luminous effects)',
      'TPU/TPE Shore hardness variants (98A, 92A, 90A, 96A)',
      'Specialty materials (CPE, Nylon FX256, Vinyl 303, NonOilen)',
      'Cross-product swatch architecture (each color = separate URL)'
    ]
  },
  formFuturaSpecialist: {
    title: 'FormFutura Integration Specialist',
    triggers: ['formfutura', 'odoo', 'hdglass', 'apollox', 'volcano', 'epla', 'easyfil', 'reform', 'luvocom', 'athenax', 'pythonflex', 'styx'],
    capabilities: [
      'Odoo 16 e-commerce platform analysis (NOT Shopify)',
      'CSV-seeded sync pipeline architecture (~80 product lines)',
      'Premium Dutch filament material classification',
      'High-performance materials (PEEK, PEKK, PAHT-CF, PEI ULTEM, PPSU)',
      'Volcano PLA high-speed variant handling (150C)',
      'ReForm recycled material line (rPLA, rPETG, rTPU, rApollo)',
      'Multi-format variants (Spool, Bambu Coil, Cardboard ReFill)',
      'RAL-style color naming system (Traffic, Signal colors)',
      'EUR to USD price conversion (1.08 rate)'
    ]
  },
  polymakerSpecialist: {
    title: 'Polymaker Integration Specialist',
    triggers: ['polymaker', 'panchroma', 'polyterra', 'polylite', 'polymax', 'polysonic', 'polyflex', 'fiberon', 'polymide', 'polycast', 'polysmooth', 'polysupport', 'polydissolve', 'cope', 'uv shift'],
    capabilities: [
      'Shopify platform analysis (us.polymaker.com, ca.polymaker.com - regional subdomains)',
      'Multi-region pricing (US USD, CA CAD, EU EUR, UK GBP, AU AUD)',
      'Panchroma line rebranding (formerly PolyTerra, PolyLite Silk, etc.)',
      'Fiberon engineering composites (CF, GF, ESD materials)',
      'SKU-embedded HEX codes (format: CA04015 | HEX Code:#2F2E30 | TD:0.1)',
      'Transmission Distance (TD) extraction for color matching',
      'Product line detection: Panchroma (25+ sub-variants), PolyLite, PolyMax, PolySonic, PolyFlex, Fiberon',
      'TDS URL generation (Shopify CDN + legacy polymaker.com patterns)',
      '50+ product variants across consumer and engineering lines',
      'High-speed capable lines: PolySonic (300mm/s), PolyFlex TPU95-HF (250mm/s)'
    ],
    lessons: [
      'Polymaker uses regional Shopify stores: us.polymaker.com (USD), ca.polymaker.com (CAD)',
      'Variant format: option1=Diameter, option2=Weight, option3=Color',
      'SKU may contain HEX code and TD value - extractHexFromSku() in polymaker-defaults.ts',
      'CRITICAL: Most SKUs do NOT have HEX data - use extractPolymakerColorFromTitle() as fallback',
      'POLYMAKER_COLOR_MAPPING has 100+ color-to-hex mappings for title-based extraction',
      'Panchroma is the new umbrella brand - "panchroma-standard" is SEPARATE from "panchroma-matte"',
      'EXPLICIT matte check required - do NOT use panchroma-matte as default fallback',
      'panchroma-refill is a SEPARATE product line (cardboard spool)',
      'Fiberon is the engineering brand (formerly PolyMide) - CF/GF/ESD materials',
      'Bundle products MUST be excluded (holiday bundles, sample packs, Hueforge packs)',
      '3D Pen Filaments and Creator Special Editions are NOT standard spools - exclude them',
      'Refill variants (Panchroma PLA Refill) are spools without packaging - valid products',
      'PolySonic and PolySonic Pro are high-speed capable lines (300mm/s)',
      'Dual/Gradient colors show mixed colors - skip hex-color accuracy check for these',
      'Expected 67 product lines for comprehensive consumer + engineering catalog',
      'Cross-product swatch architecture - URL consistency check is SKIPPED',
      'POLYMAKER_COLOR_EXCLUSION_PATTERNS filters marketing text like "you will love it"'
    ]
  },
  paramountSpecialist: {
    title: 'Paramount 3D Integration Specialist',
    triggers: ['paramount', 'paramount 3d', 'paramount-3d', 'geode', 'flexpla', 'stone gray', 'military green', 'master spool', 'wix', 'aztec gold', 'colossus copper'],
    capabilities: [
      'Wix platform analysis (paramount-3d.com - US store)',
      'CSV-seeded sync pipeline architecture (~113 products, 8+ material lines)',
      'US industrial filament supplier (est. 1994)',
      'Themed/creative color names (Military, Automotive, Stone textures, Skin tones)',
      'FlexPLA specialty line (semi-flexible PLA)',
      'Master Spool refill variants',
      'Cross-product swatch architecture (same URL for material, different color variants)',
      'USD pricing with free ground shipping'
    ],
    lessons: [
      'ALWAYS use CSV seed (PARAMOUNT_SEED_DATA) as primary source',
      'Wix platform uses static.wixstatic.com for images',
      'Cross-product swatch architecture - all PLA colors share /pla URL',
      'Stone textures (Geode, Medusa, Karnak) have special finish_type',
      'Master Spool products are refills without spool',
      'FlexPLA is semi-flexible PLA, not TPU',
      'Skip URL consistency check - cross-product swatch brand',
      'Expected 11+ product lines for consumer filaments',
      'PVA and Nylon are single-color products (Natural only)',
      'Curated hex codes in paramount-seed.ts - hex validation is SKIPPED'
    ]
  },
  geeetechSpecialist: {
    title: 'Geeetech Integration Specialist',
    triggers: ['geeetech', 'opencart', 'hs-pla', 'silk-dual', 'silk-tri', 'luminous', 'sparkly', 'gradient'],
    capabilities: [
      'Custom OpenCart-based PHP platform analysis (NOT Shopify)',
      'CSV-seeded sync pipeline architecture (168 products)',
      'Budget Chinese filament brand material classification',
      'Silk multi-color variant handling (Dual, Tri-Color, Rainbow)',
      'High-Speed PLA (HS-PLA) variant detection (300mm/s)',
      'Cross-product swatch architecture (each color = separate URL)',
      'Multi-warehouse pricing (CN vs US shipping)',
      'Specialty finish detection (Sparkly, Gradient, Luminous, Wood, Marble, Carbon Fiber)'
    ]
  },
  ic3dSpecialist: {
    title: 'IC3D Integration Specialist',
    triggers: ['ic3d', 'ic3d-printers', 'polyhex', 'recycled petg', 'rpetg', 'impact modified', 'uv-petg', 'woocommerce avada'],
    capabilities: [
      'WooCommerce with Avada theme platform analysis (NOT Shopify)',
      'CSV-seeded sync pipeline architecture (56 products, 11 product lines)',
      'Premium USA (Ohio) filament brand material classification',
      'Recycled PETG (rPETG) sustainability line handling',
      'Impact Modified PLA (PLA+) variant detection',
      'PolyHex high-temp copolyester specialty product',
      'UV-PETG outdoor/UV-resistant material handling',
      'Carbon Fiber PETG single-variant product line',
      'Translucent fruit-inspired color naming (Blue Razz, Cherry, Grape, Honey, Watermelon)',
      'Matte finish color variants (Balanced Beige, Drifting Fog, Graphite Grey)'
    ],
    lessons: [
      'ALWAYS use CSV seed (ic3d-seed.ts) as primary source - never rely on WooCommerce API',
      'Only sync 1.75mm diameter products (filter out 2.85mm from website)',
      'Only sync 1kg spools (filter out 2.5kg and 10kg bulk options)',
      'PolyHex (Copolyester) and Carbon Fiber PETG are single-color products - not sync errors',
      'Product titles are clean line names without color suffix (CSV-seeded pattern)',
      'Use delete-then-insert pattern with safe threshold (30+ products) for clean slate',
      'Vendor name is "IC3D" (not "IC3D Printers") for database consistency'
    ]
  },
  kingroonSpecialist: {
    title: 'Kingroon Integration Specialist',
    triggers: ['kingroon', 'silk tricolor', 'silk rainbow', 'macaroon', 'candy', 'hs-petg', 'silk gold', 'matte pla', 'warehouse', 'fresh', '10kg', 'bulk'],
    capabilities: [
      'Shopify platform analysis (kingroon.com) with multi-warehouse fulfillment',
      'CSV-seeded sync pipeline architecture (~100 products, 17 product lines)',
      'Budget Chinese filament brand material classification',
      'Multi-warehouse variant filtering (US/EU/UK/CA - sync US only)',
      'Silk Rainbow specialty line handling (Candy, Macaroon, Universer)',
      'Tri-color/Dual-color silk variant detection and representative hex generation',
      'High-Speed PETG (HS-PETG) variant detection (300mm/s)',
      'Carbon Fiber multi-material products (PLA-CF, PETG-CF, ABS-CF, PA-CF)',
      'Bulk pack (2KG, 5KG, 10KG) filtering from sync',
      'Product-line level image architecture (not color-specific)'
    ],
    lessons: [
      'ALWAYS use CSV seed (kingroon-seed.ts) as primary source - never rely on Shopify API',
      'Filter out region-only variants (AU, CA, MX, UK in color field = warehouse selector)',
      'Filter out weight-only variants (2KG, 5KG, 10KG in color field = pack size selector)',
      'Filter out bulk products (10KG PLA, 5KG EU Stock) - only sync standard 1kg spools',
      'Silk Rainbow has sub-variants: Candy, Macaroon, Universer - each is separate product_line_id',
      'Silk Rainbow and Silk Gold are SINGLE-VARIANT products - not sync errors',
      'Carbon Fiber lines (PA-CF, PLA-CF, PETG-CF, ABS-CF) are SINGLE-VARIANT (Black only)',
      'Tri-color products use first color as representative hex (e.g., "Red/Green/Blue" = red hex)',
      'HS-PETG is high-speed variant (300mm/s capable) - separate from standard PETG',
      'All prices are USD regardless of warehouse region',
      'Skip hex validation - product uses swatch images not CSS colors',
      'Skip color-specific image check - images are product-line level (EXPECTED)',
      'Skip price check - multi-warehouse Shopify pricing complexity',
      'Expected 17 product lines, not 6',
      'Product titles follow pattern "Line Name - Color" for variant distinction',
      'Use delete-then-insert pattern with safe threshold (50+ products) for clean slate'
    ]
  },
  matter3dSpecialist: {
    title: 'Matter3D Integration Specialist',
    triggers: ['matter3d', 'basics', 'performance', 'essentials', 'bambu ams', 'canadian', 'high flow', 'matte petg'],
    capabilities: [
      'Shopify platform analysis (matter3d.com) with Size/Color/Spool variant structure',
      'Canadian manufacturer with USD pricing',
      'Basics vs Performance vs Essentials series differentiation',
      'High-flow (HF) PETG variant detection',
      'Bulk (5kg) product line separation',
      'Product filtering (pellets, custom colors, bundles, industrial bulk)',
      'Variant-to-image mapping using Shopify image_id'
    ],
    lessons: [
      'Extract color from variant.option2 (or option1/option3 fallback), NOT from slash-split title',
      'Filter pellets, custom colors, bundles, and items >$200 (non-standard products)',
      'Filter 10kg+ industrial bulk products',
      'Use variant.image_id for color-specific images with alt-text fallback',
      'Differentiate Fuchsia (#FF00FF) from Magenta (#FF0099) to prevent duplicate hexes',
      'Consolidate 500g/1kg variants into main product line, separate only 5kg+ as bulk',
      'Expected 15 product lines after proper consolidation',
      'Skip price check - variable pricing across product lines',
      'Skip hex validation - curated color mappings in matter3d-defaults.ts'
    ]
  },
  ninjatekSpecialist: {
    title: 'NinjaTek Integration Specialist',
    triggers: ['ninjatek', 'ninjaflex', 'cheetah', 'armadillo', 'chinchilla', 'eel', 'edge', 'tpu-85a', 'tpu-95a', 'shore hardness', 'flexible', 'colorfabb'],
    capabilities: [
      'WooCommerce (WordPress) platform analysis (ninjatek.com)',
      'CSV-seeded sync pipeline architecture (~70 products, 10 product lines)',
      'Premium TPU filament specialist (Fenner Precision Polymers)',
      'Shore hardness variant classification (75A, 83A, 85A, 90A, 95A, 75D)',
      'ColorFabb reseller product separation (ASA, PLA, Co-Polyesters, Specials)',
      'TPU print settings optimization (slow speed, low temps)',
      'Specialty material handling (Eel conductive, Chinchilla skin-safe)'
    ],
    lessons: [
      'ALWAYS use CSV seed (ninjatek-seed.csv) as primary source - WooCommerce API is complex',
      'Exclude 2.85mm/3mm diameter products (consumer focus on 1.75mm)',
      'Exclude bulk products (>5.5kg) and sample products (<300g)',
      'Eel 90A (Conductive) and colorFabb PA have diameter-only variants - skip entirely',
      'ColorFabb products sold via NinjaTek have separate product_line_ids (colorfabb-*)',
      'Product titles follow pattern "ProductLine - Color" for variant distinction',
      'Shore hardness stored in shore_hardness_d field as integer (e.g., 85 for 85A)',
      'All NinjaTek TPU products are 0.5kg spools (500g)',
      'Skip hex validation - curated color mappings in ninjatek-defaults.ts',
      'Skip color-specific image check - product-line level images are expected'
    ]
  },
  numakersSpecialist: {
    title: 'Numakers Integration Specialist',
    triggers: ['numakers', 'pla+', 'petg-hs', 'pla silk', 'pla matte', 'pla starlight', 'tri-color', 'cheat sheet', 'printzy', 'nubox', 'hueforge'],
    capabilities: [
      'Shopify platform analysis (numakers.com) - standard JSON API available',
      'CSV-seeded sync pipeline architecture (~130 products, 13 product lines)',
      'US-based filament brand with vibrant creative color naming',
      'High-Speed PETG (PETG-HS) variant handling - designed for 300mm/s printing',
      'PLA Specialty lines (Silk, Matte, Starlight, Glow, Marble, Wood, CF)',
      'Tri-Color Silk PLA gradient products with representative hex generation',
      'Blog-based Cheat Sheets (Cura, PrusaSlicer, Bambu Studio) instead of PDF TDS',
      'Creative color name mapping (Thanos Purple, Ryobix Green, Dragon\'s Hide)',
      'Shopify CDN image URL pattern: Numakers_{Material}_{Color}_Spool_Printzy.png'
    ],
    lessons: [
      'ALWAYS use CSV seed (NUMAKERS_SEED_DATA) as primary source - Shopify JSON lacks curated color-to-hex mappings',
      'Exclude NuBox Surplus products - subscription mystery items with unpredictable colors',
      'Exclude Hueforge Packs - multi-spool bundles, not individual filaments',
      'Exclude Warehouse Clearance - older formula mystery items, not reliable catalog',
      'Tri-color Silk products use first color as representative hex (e.g., "Copper-Silver-Gold" → copper hex #B87333)',
      'PETG-HS and PETG Translucent are SEPARATE product lines (different formulas)',
      'PLA Starlight has glitter/sparkle finish - abrasive, may wear brass nozzles',
      'All prices are USD, no regional variants (US-only shipping)',
      'Cheat Sheets at numakers.com/pages/cheat-sheets used as TDS equivalent',
      'Creative color names require explicit NUMAKERS_COLOR_MAPPING (e.g., "Dragon\'s Hide" → #2F4F4F)',
      'Skip hex validation - curated color mappings in numakers-defaults.ts',
      'Skip price validation - CSV seed contains curated prices',
      'Image URLs follow pattern: {Color}_Spool_Printzy.png on Shopify CDN',
      'Expected 13 product lines: PLA+, PLA Silk, Tri-Color Silk, PLA Matte, PLA Starlight, PLA Glow, PLA Marble, PLA Wood, PLA-CF, PETG-HS, PETG Translucent, ASA, ABS'
    ]
  },
  overtureSpecialist: {
    title: 'Overture Integration Specialist',
    triggers: ['overture', 'overture3d', 'rock pla', 'basic pla', 'matte pla', 'silk pla', 'easy pla', 'super pla', 'high speed tpu', 'pla professional', 'glow pla'],
    capabilities: [
      'Shopify platform analysis (overture3d.ca - Canadian store)',
      'CSV-seeded sync pipeline architecture (~170 products, 15 product lines)',
      'Major Chinese manufacturer with extensive consumer catalog',
      'Rock PLA specialty line (mineral-filled, abrasive to brass nozzles)',
      'Multi-pack/bulk exclusion logic (2-pack, 4-pack, 6-pack, 2kg)',
      'High Speed TPU variant handling (300mm/s capable)',
      'Creative color names (Glacier Blue, Mars Red, Barrier Reef, Alpine Forest)',
      'Canadian pricing in CAD',
      'Shopify CDN image URLs with consistent product-line level images'
    ],
    lessons: [
      'ALWAYS use CSV seed (OVERTURE_SEED_DATA) as primary source - curated 1-pack products only',
      'Exclude multi-pack products (2-pack, 4-pack, 6-pack) - causes swatch duplication',
      'Exclude bulk products (2kg variants) - consumer focus on standard 1kg spools',
      'Rock PLA is abrasive (mineral particles) - mark isNozzleAbrasive: true',
      'Store URL is overture3d.ca (Canadian) NOT overture3d.com (US)',
      'All prices in CAD, not USD',
      'Eco PLA and Refill products may be single-variant - not sync errors',
      'Skip hex validation - curated color mappings in overture-seed.ts',
      'Skip price validation - CSV seed contains curated CAD prices',
      'Product-line level images (not color-specific) are expected architecture',
      'Expected 15 product lines for consumer-focused 1-pack products',
      'PLA Professional is a separate premium line from Basic PLA',
      'High Speed TPU and standard TPU are separate product lines',
      'Safe delete threshold is 50 products for clean slate sync',
      'Use delete-then-insert pattern for consistent data state'
    ]
  },
  pushPlasticSpecialist: {
    title: 'Push Plastic Integration Specialist',
    triggers: ['push-plastic', 'pushplastic', 'pc+pbt', 'pctg', 'hh tough', 'hh pla', 'high heat'],
    capabilities: [
      'Shopify platform analysis (pushplastic.com - US)',
      'CSV-seeded sync pipeline architecture (~200 products, 16 product lines)',
      'Industrial/prosumer filament manufacturer with engineering focus',
      'PC+PBT specialty alloy material expertise',
      'HH Tough PLA (3D870) and HH PLA (3D850) high-heat variants',
      'Carbon fiber composite variants (ABS-CF, PETG-CF, PA-CF, PC-CF)',
      'Multi-spool type handling (AMS vs Standard)',
      'Professional-grade engineering plastics (PEI, PMMA)',
      '45+ color variants with comprehensive hex mapping'
    ],
    lessons: [
      'ALWAYS use CSV seed (pushplastic-seed.ts) as primary source',
      'Exclude bulk products (3kg, 5kg, 10kg, 25kg) - consumer focus on 1kg',
      'Exclude 2.85mm diameter - 1.75mm only',
      'Exclude Factory Seconds, Cases, Pallet Pricing, SiPC products',
      'Exclude subscription products - not standard retail',
      'AMS vs Standard spool types should be deduplicated (prefer standard)',
      'PC+PBT is a specialty alloy - separate product line from PC',
      'HH Tough PLA and HH PLA are distinct high-heat lines',
      'Carbon fiber variants (ABS-CF, PETG-CF, PA-CF, PC-CF) are single-color black',
      'PEI 9085 and PEI 1010 are single-color specialty lines',
      'PMMA is single-color (Natural/Clear)',
      'Prices are USD from pushplastic.com',
      'Expected 16 product lines for consumer-focused products'
    ]
  },
  protoPastaSpecialist: {
    title: 'Proto-Pasta Integration Specialist',
    triggers: ['proto-pasta', 'protopasta', 'htpla', 'heat treatable', 'metal composite', 'brass-filled', 'bronze-filled', 'copper-filled', 'iron-filled', 'conductive pla', 'matte fiber', 'nebula', 'reflective', 'smoothie'],
    capabilities: [
      'Shopify platform analysis (proto-pasta.com - US only)',
      'HTPLA heat-treatable specialty material expertise',
      'Metal composite filaments (Brass, Bronze, Copper, Iron, Steel)',
      'Carbon fiber HTPLA and PLA variants',
      'Electrically conductive and static dissipative materials',
      'Community-inspired color naming (Dereks, Joels, Amies, Stefs, etc.)',
      'Nebula multicolor gradient variants',
      'TDS URL extraction from consolidated Material Data Table',
      '25+ product line detection patterns',
      '100+ color-to-hex mappings'
    ],
    lessons: [
      'Proto-Pasta uses Shopify (proto-pasta.com) - US only, no regional stores',
      'HTPLA is the primary material - heat-treatable PLA with Ingeo 3D850',
      '50g coils are sample products - MUST be filtered (< 300g)',
      'Subscriptions (Endless PLA) must be excluded - not standard products',
      'Metal composites require hardened nozzles (0.5mm+) - isAbrasive=true',
      'Conductive PLA has ~30 ohm-cm resistivity - isConductive=true',
      'Community-inspired colors have creator names (Joels Highfive Blue, Dereks Olive Drab)',
      'Nebula/Multicolor products have gradient effects - single hex is representative',
      'Reflective HTPLA line has retroreflective particles',
      'TDS PDFs are on consolidated Material Data Table - individual PDFs have unpredictable URLs',
      'Title cleaning must remove " - / " artifacts from variant explosion',
      'c-Matte PLA is high-flow PLA (HFPLA) with matte finish',
      'Recycled lines (Still Colorful, Black Recycled) are rPLA/rPETG material',
      'Smoothie line names food items (Blueberry, Dragonfruit, Pineapple Banana)'
    ]
  },
  recreusSpecialist: {
    title: 'Recreus Integration Specialist',
    triggers: ['recreus', 'filaflex', 'tpu-60a', 'tpu-70a', 'tpu-82a', 'tpu-95a', 'foamy', 'sebs', 'balena', 'reciflex', 'shore hardness', 'flexible', 'spanish'],
    capabilities: [
      'Recreus Shopify platform analysis (recreus.com - EUR primary, USD/CAD available)',
      'CSV-seeded sync pipeline architecture (~70 products, 14 product lines)',
      'Spanish TPU specialist with Shore hardness-based material classification',
      'FilaFlex series expertise (60A-95A Shore hardness variants)',
      'Specialty TPU types: Foamy (expanded foam), SEBS, Conductive, Purifier, Bio (Balena)',
      'Multi-region store handling (en-en, es-es, de-de)',
      'TDS management via Google Drive folder links',
      '25+ color variants with comprehensive hex mapping including Spanish names',
    ],
    lessons: [
      'ALWAYS use CSV seed (recreus-seed.ts) as primary source - Shopify API is fallback only',
      'Exclude pellet products - industrial, not consumer filament spools',
      'Exclude Footwearology editions - specialty limited run products',
      'FilaFlex 95A Foamy is SEPARATE product line from FilaFlex 95A (different material properties)',
      'Shore hardness determines material category: 60A (softest) to 95A (firmest)',
      'Spanish color names must be mapped: Negro=Black, Blanco=White, Rojo=Red, etc.',
      'PET-G HF is standard PETG (HF = High Flow), not a separate material',
      'Reciflex is recycled TPU (rTPU) - different product line from virgin FilaFlex',
      'Balena is bio-based TPU - separate from petroleum-based FilaFlex',
      'Expected 14 product lines for consumer-focused products',
      'Currency is EUR for primary store but USD/CAD available via region selector',
    ],
  },
  sunluSpecialist: {
    title: 'Sunlu Integration Specialist',
    triggers: ['sunlu', 'store.sunlu.com', 'pla+', 'pla-meta', 'matte dual-color', 'hspla', 'filadryer'],
    capabilities: [
      'Shopify platform analysis (store.sunlu.com) with multi-region fulfillment',
      'CSV-seeded sync pipeline architecture (~400 products, 38 product lines)',
      'Major Chinese manufacturer with extensive consumer catalog',
      'Multi-region variant handling (Ship to USA/Europe/Canada/Australia)',
      'Complex variant format parsing: "Ship to Region / Material | Color Weight"',
      'High-Speed PLA+ 2.0 and PLA Meta specialty line handling',
      'Matte Dual-Color PLA gradient products',
      'Engineering materials (PEEK, PC, PP, PA-CF, ABS-GF, ABS-FR)',
      'Non-filament product filtering (FilaDryer, 3D pens, resins, build plates)',
      'MOQ product exclusion (10KG bundles not consumer products)'
    ],
    lessons: [
      'ALWAYS use CSV seed (sunlu-seed.ts) as primary source - live Shopify has too many duplicates',
      'Filter out FilaDryer, S4, SP2, FC01, 3D Pens - these are accessories not filaments',
      'Filter out MOQ products ([MOQ: 6KG], 10KG bundles) - industrial, not consumer',
      'Ship to region variants create 4x duplicates - consolidate to US region only',
      'Variant format is complex: "Ship to USA / HSPLA+ 2.0 | Black" - parse with regex',
      'Material must be extracted from variant color, not just product title',
      'Oliver Green is a typo for Olive Green - map to same hex',
      'Dual-color Matte products use "Color1+Color2" format (Red+Yellow, Black+Blue)',
      'Engineering materials (PEEK, PC, PP, PA-CF) have very limited color options (1-3 colors)',
      'Refill products are compatible with Bambu and Sunlu reusable spools',
      'Expected 38 product lines covering all material categories',
      'Skip hex validation - curated color mappings in sunlu-seed.ts',
      'Skip price check - multi-region pricing complexity',
      'Product-line level images (not color-specific) are expected architecture'
    ]
  },
  sirayaTechSpecialist: {
    title: 'Siraya Tech Integration Specialist',
    triggers: ['siraya', 'sirayatech', 'siraya-tech', 'fibreheart', 'flex tpu', 'rebound peba', 'tpu-64d', 'tpu-85a', 'tpu-95a', 'tpu-foam', 'peba-85a', 'peba-95a', 'peba-foam', 'tpu-gf', 'ppa-cf', 'abs-cf', 'abs-gf', 'asa-gf', 'pet-cf', 'pet-gf', 'petg-cf'],
    capabilities: [
      'Siraya Tech Shopify platform analysis (siraya.tech - USD primary)',
      'CSV-seeded sync pipeline architecture (~35 products, 21 product lines)',
      'Engineering filament specialist (Fibreheart line: CF, GF composites)',
      'Flexible filament specialist (Flex TPU, Rebound PEBA)',
      'Shore hardness material classification (64D, 85A, 95A)',
      'Foaming filament detection (TPU Air, PEBA Air)',
      'Multi-region shipping variant deduplication (US, EU, AU, CA)',
      'TDS management via Google Drive links',
      'Fiber-reinforced material expertise (carbon/glass fiber)'
    ],
    lessons: [
      'ALWAYS use CSV seed (sirayatech-seed.ts) as primary source - Shopify API for enrichment only',
      'Exclude Silicone products (Defiant 15/25) - casting material, not filament',
      'Exclude Peopoly products (Lancer, Magneto) - different brand sold on site',
      'TPU Air is foaming TPU (65A-82A) - SEPARATE from TPU-85A',
      'PEBA Air is foaming PEBA (70A-95A) - SEPARATE from PEBA-95A',
      'Shore hardness determines material category: 64D (hardest TPU), 85A, 95A',
      'Most products are Black-only engineering materials',
      'Clear vs White need unique hex codes (#F5F5F5 vs #FFFFFF)',
      'Flat Dark Earth is military tan color (#B5A08E)',
      'Olive Green is tactical green (#556B2F)',
      'Expected 21 product lines for filament collection',
      'All Siraya Tech filaments are 1.75mm diameter, 800g spools',
      'Fibreheart = engineering materials (ABS, ASA, PET, PETG, PPA with CF/GF)',
      'Flex = TPU line (64D, 85A, 95A, Air foam)',
      'Rebound = PEBA line (85A, 95A, Air foam)'
    ],
  },
  prusamentSpecialist: {
    title: 'Prusament Integration Specialist',
    triggers: ['prusament', 'prusa', 'nfc', 'mystic', 'galaxy', 'opal', 'blend', 'rpla', 'woodfill', 'pvb', 'pc blend', 'pa11-cf', 'pp-cf', 'pp-gf', 'pei'],
    capabilities: [
      'Custom WordPress/WooCommerce platform analysis (prusa3d.com)',
      'CSV-seeded sync pipeline architecture (~130 products)',
      'Premium Czech filament material classification',
      'NFC vs non-NFC variant detection and grouping',
      'Refill variant handling (900g cardboard spools)',
      'Galaxy/Blend/Mystic/Premium/Opal/Noctua product line detection',
      'rPLA pigmented recycled line (Algae, Corn, Wine, Risotto)',
      'Specialty materials (PC Blend, PC Space Grade, PA11-CF, PP-CF, PP-GF, PVB, Woodfill, PEI)',
      'Prusa signature colors (Prusa Orange, Prusa Galaxy Black, Prusa Pro Green)',
      'TDS URL generation from prusament.com/media/datasheet/'
    ],
    lessons: [
      'Prusament uses custom WordPress/WooCommerce (NOT Shopify)',
      'ALWAYS use CSV seed (prusament-seed.ts) as primary source',
      'NFC and non-NFC are SEPARATE products with different URLs',
      'Refill spools (900g) are eco-friendly cardboard - valid products',
      '25g/30g/100g samples MUST be excluded (< 300g filter)',
      'Bundles with print sheets are NOT standard filament products',
      'Galaxy colors have glitter finish - Glitter finishType',
      'Blend colors have metallic finish - Metallic finishType',
      'Mystic colors have shimmer finish - Shimmer finishType',
      'rPLA pigmented colors use bio-based dyes',
      'Woodfill is PLA-Wood composite - 30% wood content',
      'PA11-CF, PP-CF, PP-GF, PC-CF require hardened nozzles (is_nozzle_abrasive=true)',
      'Expected ~18 product lines for comprehensive Prusament catalog',
      'Cross-product swatch architecture - URL consistency check is SKIPPED',
      'Noctua partnership colors (Beige, Brown) match Noctua fan colors'
    ]
  },
  spectrumFilamentsSpecialist: {
    title: 'Spectrum Filaments Integration Specialist',
    triggers: ['spectrum', 'spectrum-filaments', 'spectrumfilaments', 'the-filament', 'refill', 's-flex', 'pla-silk', 'flameguard', 'safeguard', 'aquaprint', 'stone-age', 'pastello', 'pet-g-fr-v0', 'pc-ptfe', 'pps-am230', 'thermatech'],
    capabilities: [
      'Live Shopify API sync architecture (ca.spectrumfilaments.com)',
      '662 products across 67 product lines (40+ material types)',
      '"The Filament" sub-brand detection (PLA/PETG/CF/HS variants)',
      'ReFill vs Standard product line suffix handling (__refill vs __standard)',
      'Cross-product swatch architecture analysis',
      '200+ color-to-hex mappings with unique codes for similar colors',
      'Material prefix stripping logic in extractColor()',
      'Specialty material handling (PC/PTFE, PPS AM230, ThermaTech PA, PET-G FR V0)',
      'Product line ID generation with material priority ordering'
    ],
    lessons: [
      'extractColor() uses materialPrefixes array - "Wood" must NOT be included (strips "WOOD" from "WOOD ASH")',
      '"The Filament" products MUST be detected first in generateProductLineId()',
      'Specialty materials (PC/PTFE, PPS AM230, ThermaTech PA, PET-G FR V0) need their own product lines',
      'MATT vs non-MATT colors need UNIQUE hex codes to pass Swatch Uniqueness (e.g., #000075 vs #000080)',
      'Similar NAT/NATURAL variants need unique hex codes (e.g., PPS AM230 NAT #F5E6CE vs ThermaTech PA Natural #F5DCC0)',
      'Gold glitter colors (Aurora, Aztec, Clear) need unique hex codes (#FFD900, #FFCE00, #FFDC00)',
      'ReFill products use __refill suffix, Standard use __standard suffix',
      'Expected 67 product lines (12 The Filament + 18 PLA + 9 PETG + 7 ASA + 11 Engineering + more)',
      'Cross-product swatch brand - URL consistency check is SKIPPED',
      'Stone Age colors (LIGHT, DARK) require fallback hex mappings after material prefix stripping',
      'Metal colors (BRASS, Bronze) require explicit hex mappings in extendedMappings'
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
  },
  'colorfabb': {
    platform: 'Magento 2 (Adobe Commerce) - colorfabb.us (NOT Shopify)',
    knownLimitations: [
      '❌ No Shopify JSON APIs (/products.json) exist - this is Magento 2',
      '❌ TDS PDFs are in expandable "Downloads" tab - may require waitFor if scraping',
      '❌ Prices embedded in data-price-amount attributes, not visible text',
      '❌ Variant options are complex Magento dropdowns, not Shopify-style variants',
      '❌ Category pages use AJAX pagination - cannot scrape all products in one request'
    ],
    workingSolutions: [
      '✅ Use COLORFABB_PRODUCT_SEED (75 products) from CSV as primary data source',
      '✅ All product URLs, images, prices, and SKUs come from hardcoded CSV seed',
      '✅ enrichColorFabbProduct() handles material classification for 24+ lines',
      '✅ Hardcoded COLORFABB_TDS_PATTERNS provides TDS URLs by product line',
      '✅ COLORFABB_COLOR_MAPPING provides hex codes for common colors',
      '✅ Optional Firecrawl scraping for TDS extraction from individual pages',
      '✅ Clean slate sync deletes existing and re-inserts from seed for consistency'
    ],
    failedApproaches: [
      '⚠️ Attempting Shopify /products.json API - store is Magento, not Shopify',
      '⚠️ Scraping product listings from category pages - AJAX pagination blocks this',
      '⚠️ Upsert on product_id - no unique constraint exists, use delete-then-insert',
      '⚠️ Extracting prices from visible text - use data-price-amount attribute instead'
    ],
    currentStatus: {
      'seedProducts': '75 products from CSV (colorfabb.us store)',
      'productLines': '24 unique product lines',
      'materialsNormalized': 'varioShore TPU, LW-PLA, nGen, HT, ASA, PA, fills, economy lines',
      'colorsWithHex': 'Most common colors mapped (40+ in COLORFABB_COLOR_MAPPING)',
      'tdsUrlsCovered': 'Major product lines have hardcoded TDS patterns'
    },
    keyFiles: [
      'supabase/functions/sync-colorfabb-products/index.ts - Main sync function',
      'supabase/functions/_shared/colorfabb-defaults.ts - CSV seed, color mappings, TDS patterns',
      'COLORFABB_PRODUCT_SEED constant - 75 products with URLs, prices, images, SKUs',
      'enrichColorFabbProduct() - Material classification and print settings',
      'COLORFABB_COLOR_MAPPING - Hex codes for common colors'
    ],
    extractionPriority: [
      '1. TDS URLs for products missing them (optional Firecrawl scrape)',
      '2. Color hex codes for specialty colors not in mapping',
      '3. New products added to colorfabb.us store (requires CSV update)'
    ],
    manualExtractionProcess: [
      '1. Export new products from ColorFabb store admin or scrape manually',
      '2. Update COLORFABB_PRODUCT_SEED in colorfabb-defaults.ts',
      '3. Add new colors to COLORFABB_COLOR_MAPPING if needed',
      '4. Add new materials to MATERIAL_PATTERNS regex',
      '5. Run clean slate sync to refresh all data'
    ],
    productSlugReference: {
      'pla-economy': 'PLA Economy',
      'petg-economy': 'PETG Economy',
      'ngen': 'nGen (Amphora AM3300)',
      'ngen-flex': 'nGen Flex',
      'ht': 'HT (Amphora AM1800)',
      'asa': 'ASA',
      'pa': 'PA (Nylon)',
      'varioshore-tpu': 'varioShore TPU',
      'lw-pla': 'LW-PLA (Lightweight)',
      'lw-pla-ht': 'LW-PLA HT (High Temp)',
      'lw-asa': 'LW-ASA',
      'pla-high-speed-pro': 'PLA High Speed Pro',
      'bronzefill': 'bronzeFill',
      'copperfill': 'copperFill',
      'steelfill': 'steelFill',
      'brassfill': 'brassFill',
      'woodfill': 'woodFill',
      'corkfill': 'corkFill',
      'bamboofill': 'bambooFill',
      'stonefill': 'stoneFill',
      'allpha': 'allPHA'
    },
    lastUpdated: '2026-01-06'
  },
  'eryone': {
    platform: 'Shopify store (eryone3d.com) - CSV-seeded sync architecture',
    knownLimitations: [
      '❌ CSV seed contains 419 products (full catalog including all materials)',
      '❌ Product titles in DB append color (e.g., "PLA Filament - Black") which differs from page H1 (intentional for variant distinction)',
      '❌ Website Color Names Check detects UI text like "mixable ), can mix color)" as missing colors (false positive)',
      '❌ Dual-color products may share similar hex codes if not using blended values',
      '❌ Compound materials (PLA-Metal, PLA-Wood) require special product_line_id handling'
    ],
    workingSolutions: [
      '✅ CSV seed (ERYONE_PRODUCT_SEED) in eryone-defaults.ts is the single source of truth - 419 products',
      '✅ Safe delete pattern with threshold >= 350 products before clean slate delete',
      '✅ generateEryoneProductLineId() handles compound materials (PLA-Metal, PLA-Wood, PETG-CF, etc.)',
      '✅ enrichEryoneProduct() provides print settings and finish type detection',
      '✅ Unique blended hex codes for dual-color products (Red & Blue → #7F007F)',
      '✅ cleanEryoneTitle() removes specs like "1.75mm±0.03mm"',
      '✅ find_duplicate_hexes RPC function post-processes to fix remaining duplicates',
      '✅ Color family stored in seed.color, hex stored in seed.colorHex',
      '✅ Material breakdown logging shows 24+ unique materials (PLA, PLA+, PETG, PETG-CF, PETG-GF, ABS, ABS+, ABS-CF, ABS-GF, ABS-PC, ASA, ASA-CF, ASA-GF, TPU, TPU-85A, PA, PA6-CF, PA6-GF, PA12-CF, PA12-GF, PP, PP-CF, PLA-Wood, PLA-Metal)'
    ],
    failedApproaches: [
      '⚠️ Using safe delete threshold of 100/200 when CSV has 419 products - set to 350',
      '⚠️ Constructing product_line_id as eryone__pla__pla (redundant material in line slug)',
      '⚠️ Using same hex code for all variants of dual-color products',
      '⚠️ Trying to scrape Eryone website dynamically - use CSV seed instead (faster, more reliable)',
      '⚠️ Not logging material breakdown - add debug logging to verify full CSV loaded'
    ],
    currentStatus: {
      'csvSeedProducts': '419 variants in ERYONE_PRODUCT_SEED (full catalog)',
      'expectedFilaments': '~419 products (all from CSV seed)',
      'productLines': '~48 unique product lines (cards)',
      'materialsSupported': 'PLA, PLA+, PETG, PETG-CF, PETG-GF, ABS, ABS+, ABS-CF, ABS-GF, ABS-PC, ASA, ASA-CF, ASA-GF, TPU, TPU-85A, PA, PA6-CF, PA6-GF, PA12-CF, PA12-GF, PP, PP-CF, PLA-Wood, PLA-Metal',
      'dualColorHexFixed': 'All dual-color products use unique blended hex codes'
    },
    keyFiles: [
      'supabase/functions/sync-eryone-products/index.ts - Main sync function (CSV-seeded)',
      'supabase/functions/_shared/eryone-defaults.ts - CSV seed, enrichment, product line ID generation',
      'ERYONE_PRODUCT_SEED constant - 419 products with color, colorHex, URLs, images',
      'generateEryoneProductLineId() - Generates eryone__material__line format',
      'enrichEryoneProduct() - Returns print settings, finish type, TDS URL',
      'ERYONE_DEFAULT_PRICES - Default prices by filament line'
    ],
    extractionPriority: [
      '1. Verify all 419 CSV products are processed (check ERYONE_PRODUCT_SEED.length)',
      '2. Verify material breakdown shows 24+ unique materials',
      '3. Ensure no duplicate hex codes within same product_line_id',
      '4. Validate product_line_id format (eryone__material__line, no redundant patterns)',
      '5. Verify safe delete threshold (>= 350) triggers only when sufficient products prepared'
    ],
    manualExtractionProcess: [
      '1. Products come from ERYONE_PRODUCT_SEED in eryone-defaults.ts - DO NOT scrape',
      '2. To add new products: Update the CSV seed array with new entries',
      '3. Each entry needs: material, filamentLine, color, colorHex, productUrl, imageUrl',
      '4. For dual-color products: Use blended hex codes (blend the two primary colors)',
      '5. Run clean slate sync to refresh all data from updated seed'
    ],
    productSlugReference: {
      'pla-standard': 'PLA Standard',
      'pla-plus-standard': 'PLA+ Standard',
      'pla-silk-dual-color': 'PLA Silk Dual-Color',
      'pla-silk-triple-color': 'PLA Silk Triple-Color',
      'pla-silk-rainbow': 'PLA Silk Rainbow',
      'pla-galaxy-sparkly-glitter': 'PLA Galaxy Sparkly Glitter',
      'pla-luminous': 'PLA Luminous (Glow)',
      'pla-marble': 'PLA Marble',
      'pla-carbon-fiber': 'PLA Carbon Fiber',
      'pla-high-speed': 'PLA High-Speed',
      'pla-wood-standard': 'PLA-Wood Standard',
      'pla-metal-lic': 'PLA-Metal Metallic',
      'petg-standard': 'PETG Standard',
      'abs-standard': 'ABS Standard',
      'tpu-standard': 'TPU Standard'
    },
    lastUpdated: '2026-01-07'
  },
  'esun': {
    platform: 'Custom ueeshop store (esun3dstore.com) - CSV-seeded sync architecture',
    knownLimitations: [
      '❌ Website is NOT Shopify - no /products.json API available',
      '❌ Custom ueeshop platform with JavaScript-heavy product pages',
      '❌ No structured color swatch data in HTML - use CSV seed instead',
      '❌ Dynamic pricing requires manual CSV updates when prices change',
      '❌ Product images in seed may point to generic images (not color-specific)'
    ],
    workingSolutions: [
      '✅ CSV seed (ESUN_PRODUCT_SEED) in esun-seed.ts is the single source of truth - 444 products',
      '✅ Safe delete pattern with threshold >= 300 products before clean slate delete',
      '✅ generateProductLineIdFromSeed() handles all eSUN product lines (45+ unique lines)',
      '✅ enrichEsunProduct() provides print settings, finish type, TDS URL from esun-defaults.ts',
      '✅ Curated hex codes in seed eliminate need for color extraction',
      '✅ find_duplicate_hexes RPC function post-processes to fix remaining duplicates',
      '✅ ESUN_DEFAULT_PRICES provides fallback pricing by product line'
    ],
    failedApproaches: [
      '⚠️ Attempting Shopify /products.json API - store is ueeshop, not Shopify',
      '⚠️ Firecrawl scraping for color swatches - JavaScript-rendered, returns incomplete data',
      '⚠️ Using safe delete threshold of 100 when CSV has 444 products - set to 300',
      '⚠️ Trying to extract pricing dynamically - use ESUN_DEFAULT_PRICES map instead'
    ],
    currentStatus: {
      'csvSeedProducts': '444 variants in ESUN_PRODUCT_SEED (full catalog)',
      'expectedFilaments': '~444 products (all from CSV seed)',
      'productLines': '~45 unique product lines (cards)',
      'materialsSupported': 'PLA, PLA+, PLA-Matte, PLA-Silk, PLA-Luminous, PETG, PETG+HS, ABS+, ABS+HS, ASA, TPU-95A, TPU-83A, PA, PA-CF, PA12-CF, PAHT-CF, PC, PVA, HIPS',
      'specialtyLines': 'Silk Magic, Silk Candy, Silk Metal, Silk Rainbow, Luminous Rainbow, Stars, Rock, Chameleon, UV Color Change'
    },
    keyFiles: [
      'supabase/functions/sync-esun-products/index.ts - Main sync function (CSV-seeded)',
      'supabase/functions/_shared/esun-seed.ts - CSV seed data (444 products)',
      'supabase/functions/_shared/esun-defaults.ts - Enrichment, print settings, TDS patterns',
      'ESUN_PRODUCT_SEED constant - 444 products with color, colorHex, URLs, images',
      'ESUN_DEFAULT_PRICES - Default prices by filament line',
      'ESUN_PRINT_SETTINGS - Print settings by material type'
    ],
    extractionPriority: [
      '1. Verify all 444 CSV products are processed (check ESUN_PRODUCT_SEED.length)',
      '2. Verify ~45 unique product lines are created',
      '3. Ensure no duplicate hex codes within same product_line_id',
      '4. Validate product_line_id format (esun__material__line)',
      '5. Check TDS URLs are populated from ESUN_TDS_PATTERNS'
    ],
    manualExtractionProcess: [
      '1. Products come from ESUN_PRODUCT_SEED in esun-seed.ts - DO NOT scrape',
      '2. To add new products: Update the CSV seed array with new entries',
      '3. Each entry needs: material, filamentLine, color, colorHex, productUrl, imageUrl',
      '4. For new product lines: Add TDS URL to ESUN_TDS_PATTERNS if available',
      '5. Run clean slate sync to refresh all data from updated seed'
    ],
    productSlugReference: {
      'pla-basic': 'PLA-Basic (ePLA)',
      'pla-matte': 'PLA-Matte (ePLA-Matte)',
      'pla-silk': 'PLA-Silk (ePLA-Silk)',
      'pla-silk-magic': 'PLA-Silk Magic',
      'pla-luminous': 'PLA-Luminous (Glow)',
      'pla-plus': 'PLA+ (ePLA+)',
      'pla-plus-hs': 'PLA+HS (High Speed)',
      'petg-standard': 'PETG (ePETG)',
      'petg-hs': 'PETG+HS (High Speed)',
      'abs-plus': 'ABS+ (eABS+)',
      'tpu-95a': 'TPU-95A (eTPU-95A)',
      'pa-cf': 'PA-CF (ePA-CF)'
    },
    lastUpdated: '2026-01-07'
  },
  'extrudr': {
    platform: 'Custom Next.js storefront (NOT Shopify) - www.extrudr.com',
    knownLimitations: [
      '❌ Website uses Next.js with dynamic content loading',
      '❌ No Shopify JSON API available',
      '❌ Product variants (colors/weights) require JavaScript interaction',
      '❌ Some hex values stored as JSON objects in source data',
      '❌ Transparent colors have no valid hex code (use placeholder #FFFFFF)'
    ],
    workingSolutions: [
      '✅ Use CSV-seeded sync from EXTRUDR_PRODUCT_SEED (~130+ products)',
      '✅ All color-specific images available from S3 bucket (s3.extrudr.com)',
      '✅ enrichExtrudrProduct() provides complete material enrichment',
      '✅ TDS URLs hardcoded in EXTRUDR_TDS_URLS mapping',
      '✅ Shore hardness correctly mapped for FLEX TPU variants (88A/92A/98A)',
      '✅ Cardboard spool material flag set for eco-friendly packaging'
    ],
    failedApproaches: [
      '⚠️ Firecrawl scraping - timeouts and incomplete data extraction',
      '⚠️ Dynamic URL generation from slugs - missing products',
      '⚠️ Relying on website for color extraction - inconsistent results'
    ],
    currentStatus: {
      'totalProducts': '~130 unique color variants across 17+ product lines',
      'imageCoverage': '100% - all from S3 bucket',
      'hexCoverage': '~95% - transparent variants use #FFFFFF placeholder',
      'tdsCoverage': '100% - all materials have TDS mappings'
    },
    keyFiles: [
      'supabase/functions/_shared/extrudr-seed.ts - CSV-seeded product data',
      'supabase/functions/_shared/extrudr-defaults.ts - Brand enrichment and color mappings',
      'supabase/functions/sync-extrudr-products/index.ts - Main sync function'
    ],
    productSlugReference: {
      'biofusion': 'BioFusion (Silk PLA)',
      'durapro-abs': 'DuraPro ABS',
      'durapro-abs-cf': 'DuraPro ABS CF',
      'durapro-asa': 'DuraPro ASA',
      'flax': 'FLAX (Wood composite)',
      'greentec': 'GreenTEC (Bio)',
      'greentec-pro': 'GreenTEC Pro',
      'pctg': 'PCTG',
      'petg': 'PETG',
      'flex-medium': 'FLEX Medium (TPU-92A)',
      'flex-hard': 'FLEX Hard (TPU-98A)',
      'flex-semisoft': 'FLEX Semisoft (TPU-88A)'
    },
    lastUpdated: '2026-01-08'
  },
  'fillamentum': {
    platform: 'Shopify storefront (shop.fillamentum.com / fillamentumusa.com)',
    knownLimitations: [
      '❌ Each color variant is a separate Shopify product (cross-product architecture)',
      '❌ No variant options within products - URL consistency check will flag false positives',
      '❌ CSV seed data has no prices - price validity check should be skipped',
      '❌ Some specialty colors (Vertigo effects) have unique hex codes not derivable from name'
    ],
    workingSolutions: [
      '✅ Use CSV-seeded sync from FILLAMENTUM_PRODUCT_SEED (~200 products)',
      '✅ All product images come from Shopify CDN with proper protocol',
      '✅ enrichFillamentumProduct() provides complete material/finish enrichment',
      '✅ Color extraction via quoted names: PLA Extrafill "Traffic Black"',
      '✅ Shore hardness correctly mapped for Flexfill variants (98A/92A/90A/96A)',
      '✅ TDS URLs from FILLAMENTUM_PRODUCT_LINES config'
    ],
    failedApproaches: [
      '⚠️ Firecrawl scraping - slow and incomplete due to 200+ individual pages',
      '⚠️ URL consistency checks - false positive due to cross-product architecture',
      '⚠️ Price scraping - requires region-specific store access'
    ],
    currentStatus: {
      'totalProducts': '~200 unique color variants across 24 product lines',
      'imageCoverage': '100% - all from Shopify CDN',
      'hexCoverage': '~95% - specialty Vertigo effects may need manual mapping',
      'tdsCoverage': '100% - all materials have TDS from product line config'
    },
    keyFiles: [
      'supabase/functions/_shared/fillamentum-seed.ts - CSV-seeded product data',
      'supabase/functions/_shared/fillamentum-defaults.ts - Brand enrichment and color mappings',
      'supabase/functions/sync-fillamentum-products/index.ts - Main sync function'
    ],
    productSlugReference: {
      'pla-extrafill': 'PLA Extrafill (standard PLA)',
      'pla-crystal-clear': 'PLA Crystal Clear (transparent)',
      'abs-extrafill': 'ABS Extrafill',
      'asa-extrafill': 'ASA Extrafill',
      'petg': 'PETG',
      'cpe-hg100': 'CPE HG100 (high-temp copolyester)',
      'flexfill-tpu-98a': 'Flexfill TPU 98A (flexible)',
      'flexfill-tpu-92a': 'Flexfill TPU 92A (more flexible)',
      'flexfill-tpe-90a': 'Flexfill TPE 90A',
      'nylon-fx256': 'Nylon FX256 (PA)',
      'nylon-cf15': 'Nylon CF15 Carbon (PA-CF)',
      'timberfill': 'Timberfill (PLA-Wood)',
      'nonoilen': 'NonOilen (Bio-PLA)',
      'vinyl-303': 'Vinyl 303 (PVC)'
    },
    lastUpdated: '2026-01-09'
  },
  'geeetech': {
    platform: 'Custom OpenCart PHP store (NOT Shopify) - www.geeetech.com',
    knownLimitations: [
      '❌ No Shopify JSON API - must use CSV seed (NOT live scraping)',
      '❌ Cross-product swatches - each color is a separate product URL',
      '❌ No formal TDS documents published by manufacturer',
      '❌ Multi-warehouse pricing varies by destination (CN vs US)',
      '❌ Some products only ship from CN warehouse (higher shipping cost)',
      '❌ Product URLs use -p-#### pattern (OpenCart style)'
    ],
    workingSolutions: [
      '✅ CSV-seeded sync with 168 verified products in GEEETECH_PRODUCT_SEED',
      '✅ getGeeetechProductLineFromMaterial() handles all 18 product lines',
      '✅ getGeeetechFinishFromMaterial() extracts finish types (Silk, Matte, Sparkly, etc.)',
      '✅ normalizeGeeetechMaterialFromSeed() normalizes material names for DB',
      '✅ HS-PLA detection from title/material pattern sets high_speed_capable=true, 300mm/s',
      '✅ Carbon Fiber detection sets is_nozzle_abrasive=true',
      '✅ Hex codes provided in CSV seed for most products'
    ],
    failedApproaches: [
      '⚠️ Firecrawl discovery was slow and hit rate limits on OpenCart',
      '⚠️ Some color names have typos in source (e.g., inconsistent capitalization)',
      '⚠️ Bundle/accessory products may appear in category pages - filtered by CSV curation'
    ],
    currentStatus: {
      'csvSeedProducts': '168 products in GEEETECH_PRODUCT_SEED',
      'productLines': '18 unique product lines',
      'materialsSupported': 'PLA, PLA-Silk, PLA-Silk-Dual, PLA-Silk-Tri, PLA-Silk-Rainbow, PLA-Sparkly, PLA-Gradient, PLA-Matte, PLA-Luminous, PLA-CF, PLA-Marble, PLA-Wood, HS-PLA, PETG, PETG-Metallic, ABS+, ASA, TPU',
      'imageCoverage': '100% - all from geeetech.com CDN',
      'hexCoverage': '~95% - most colors have hex codes in seed'
    },
    keyFiles: [
      'supabase/functions/sync-geeetech-products/index.ts - Main sync function (CSV-seeded)',
      'supabase/functions/_shared/geeetech-seed.ts - CSV seed data (168 products)',
      'supabase/functions/_shared/geeetech-defaults.ts - Print settings, TDS (empty), enrichment utilities'
    ],
    productSlugReference: {
      'pla-standard': 'PLA Standard (26 colors)',
      'pla-silk': 'PLA Silk (13 colors)',
      'pla-silk-dual': 'PLA Silk Dual (10 colors)',
      'pla-silk-tri': 'PLA Silk Tri-Color (8 colors)',
      'pla-silk-rainbow': 'PLA Silk Rainbow (3 colors)',
      'pla-sparkly': 'PLA Sparkly (3 colors)',
      'pla-gradient': 'PLA Gradient (1 color)',
      'pla-matte': 'PLA Matte (14 colors)',
      'pla-luminous': 'PLA Luminous (9 colors)',
      'pla-cf': 'PLA Carbon Fiber (4 colors)',
      'pla-marble': 'PLA Marble (3 colors)',
      'pla-wood': 'PLA Wood (5 colors)',
      'hs-pla': 'HS-PLA High Speed (16 colors)',
      'petg-standard': 'PETG Standard (15 colors)',
      'petg-metallic': 'PETG Metallic (3 colors)',
      'abs-plus': 'ABS+ (17 colors)',
      'asa-standard': 'ASA (8 colors)',
      'tpu-standard': 'TPU (24 colors, incl. transparent)'
    },
    lastUpdated: '2026-01-10'
  },
  'kingroon': {
    platform: 'Shopify storefront (kingroon.com) with multi-warehouse fulfillment',
    knownLimitations: [
      '❌ Shopify variants include warehouse region in option2 - creates duplicate entries if not filtered',
      '❌ Some colors in CSV are weight/region selectors, not actual colors (2KG, 10KG, AU, CA, UK)',
      '❌ Product images are shared across all colors (not color-specific)',
      '❌ Tri-color/Rainbow products cannot have single hex representation - use first color',
      '❌ Multi-warehouse pricing varies by region - synced prices are US warehouse only'
    ],
    workingSolutions: [
      '✅ CSV seed file (kingroon-seed.ts) filters to unique color variants only',
      '✅ Skip warehouse variants (process US region only)',
      '✅ product_line_id groups silk rainbow sub-variants correctly',
      '✅ Use representative hex for multi-color products (first color in name)',
      '✅ Skip price check, hex validation, and color-specific image checks',
      '✅ Single-variant products (Silk Gold, Silk Rainbow, Carbon Fiber) whitelisted'
    ],
    failedApproaches: [
      '⚠️ Processing all Shopify variants creates 4x duplicates per color (warehouse regions)',
      '⚠️ Using CSV color field directly without filtering creates invalid entries',
      '⚠️ Expected card count of 6 was incorrect - actual is 17'
    ],
    currentStatus: {
      'csvSeedProducts': '~100 unique color variants in KINGROON_PRODUCT_SEED',
      'productLines': '17 product lines',
      'materialsSupported': 'PLA, PLA+, Silk PLA, Matte PLA, PETG, HS-PETG, TPU, ABS, PA, Carbon Fiber (PLA/PETG/ABS/PA)',
      'imageCoverage': '100% - product-line level images (not color-specific)',
      'hexCoverage': '~95% - most colors have hex codes in seed'
    },
    keyFiles: [
      'supabase/functions/sync-kingroon-products/index.ts - Main sync function',
      'supabase/functions/_shared/kingroon-seed.ts - CSV seed data',
      'supabase/functions/_shared/kingroon-defaults.ts - Material/color mappings and enrichment'
    ],
    productSlugReference: {
      'pla-basic': 'PLA Basic (standard PLA)',
      'matte-pla': 'Matte PLA',
      'silk-gold-pla': 'Silk Gold PLA (single variant)',
      'silk-tricolor-pla': 'Silk Tricolor PLA (multi-color variants)',
      'silk-rainbow-candy': 'Silk Rainbow Candy (single variant)',
      'silk-rainbow-macaroon': 'Silk Rainbow Macaroon (single variant)',
      'silk-rainbow-universer': 'Silk Rainbow Universer (single variant)',
      'petg-standard': 'PETG Standard',
      'hs-petg': 'HS-PETG High Speed (300mm/s)',
      'tpu-standard': 'TPU 95A Standard',
      'abs-standard': 'ABS Standard',
      'marble-pla': 'Marble PLA',
      'glow-in-the-dark-pla': 'Glow PLA',
      'pla-cf': 'PLA Carbon Fiber (single variant - black)',
      'petg-cf': 'PETG Carbon Fiber (single variant - black)',
      'abs-cf': 'ABS Carbon Fiber (single variant - black)',
      'pa-cf': 'PA Carbon Fiber (single variant - black)'
    },
    lastUpdated: '2026-01-11'
  },
'matter3d': {
    platform: 'Shopify store (matter3d.com) - Canadian manufacturer with INCONSISTENT Size/Color/Spool variant structure',
    knownLimitations: [
      '❌ Variant option structure is INCONSISTENT across products:',
      '   - Matte products: option1=Size, option2=Color, option3=SpoolType (Cardboard/Plastic)',
      '   - Performance products: option1=Diameter, option2=Size, option3=Color',
      '   - Simple products: option1=Color or option1=Size only',
      '❌ Pellets and industrial bulk ($1000+) in catalog - must filter',
      '❌ Custom color orders and bundles (CMYK) must be filtered',
      '❌ Weight suffixes in product_line_id cause over-fragmentation (30 vs 18 lines)',
      '❌ Fuchsia (#FF00FF), Magenta (#FF0099), Fuchsia/Magenta (#FF00CC) need unique hex codes'
    ],
    workingSolutions: [
      '✅ Check ALL three options (option2, option1, option3) for color extraction',
      '✅ Use isWeightOrSizeOrSpool() filter to skip weights, sizes, AND spool types',
      '✅ isWeightOrSizeOrSpool() catches "Cardboard", "Plastic", "1 kg", "1.75 mm"',
      '✅ Use $100 price ceiling for consumer products (filter higher)',
      '✅ Filter pellets, custom colors, bundles, "Single" placeholders, "Default Title"',
      '✅ Remove ALL weight suffixes from product_line_id (0.5kg, 1kg, 5kg)',
      '✅ Use variant.image_id for color-specific images',
      '✅ Unique hex codes for similar colors (fuchsia vs magenta)',
      '✅ Derive color_family even when hex lookup fails',
      '✅ Delete-then-insert pattern with safe threshold'
    ],
    failedApproaches: [
      '⚠️ SKIPPING option3 entirely - WRONG for Performance products where option3=Color',
      '⚠️ Slash-split parsing of variant.title - unreliable, misses colors',
      '⚠️ Creating weight-based product lines (0.5kg, 1kg, 5kg separate) - over-fragmentation',
      '⚠️ Same hex code for fuchsia/magenta - causes duplicate hex errors',
      '⚠️ Not filtering products over $100 - includes industrial bulk',
      '⚠️ Title construction with trailing dashes - creates "Performance ASA - - Red"'
    ],
    currentStatus: {
      'totalProducts': '~150-200 filament variants (after filtering bulk/pellets)',
      'expectedCards': '18 product lines (consolidated)',
      'seriesTypes': 'Basics, Performance, Essentials, Standard',
      'materialsSupported': 'PLA, PLA+, PETG, PETG-HF, PETG-CF, ASA, ABS, ABS-CF, PA, PA-CF, TPU-95A'
    },
    keyFiles: [
      'supabase/functions/sync-matter3d-products/index.ts - Main sync with Shopify option extraction',
      'supabase/functions/_shared/matter3d-defaults.ts - Color mappings, product line ID generation',
      'shouldSkipMatter3dProduct() - Filters pellets, bundles, custom, high-price',
      'extractColorFromShopifyVariant() - Checks ALL options with isWeightOrSizeOrSpool() filter',
      'generateMatter3dProductLineId() - Consolidates weights, detects series/finish',
      'deriveColorFamily() - Fallback color family when hex lookup fails'
    ],
    productSlugReference: {
      'basics-pla': 'Basics Series PLA',
      'basics-pla-matte': 'Basics Matte PLA',
      'basics-pla-silk': 'Basics Silk PLA',
      'basics-pla-recycled': 'Basics Recycled PLA',
      'basics-pla-cf': 'Basics PLA Carbon Fiber',
      'performance-petg': 'Performance PETG',
      'performance-petg-matte': 'Performance PETG Matte',
      'performance-petg-hf': 'Performance PETG High-Flow',
      'performance-petg-cf-hf': 'Performance PETG CF High-Flow',
      'performance-asa': 'Performance ASA',
      'performance-abs-cf': 'Performance ABS Carbon Fiber',
      'performance-pla-plus': 'Performance PLA+',
      'performance-pa-cf': 'Performance PA Carbon Fiber',
      'essentials-pla': 'Essentials PLA',
      'standard-petg': 'Standard PETG',
      'standard-pa': 'Standard PA (Nylon)',
    'standard-tpu-95a': 'Standard TPU 95A'
    },
    lastUpdated: '2026-01-11'
  },
  'ninjatek': {
    platform: 'WooCommerce (WordPress) store (ninjatek.com) - CSV-seeded sync architecture',
    knownLimitations: [
      '❌ WooCommerce REST API requires authentication - use CSV seed instead',
      '❌ Eel 90A (Conductive TPU) has only diameter variants (1.75mm, 3mm), no color options - excluded',
      '❌ colorFabb PA (Nylon) has only diameter variants - excluded',
      '❌ 2.85mm/3mm variants must be filtered (consumer focus on 1.75mm)',
      '❌ Product images are product-line level, not color-specific',
      '❌ No live pricing in CSV - prices would need manual update or scraping'
    ],
    workingSolutions: [
      '✅ CSV seed (NINJATEK_SEED_DATA) embedded in sync function - ~70 products',
      '✅ Safe delete pattern for clean slate refresh',
      '✅ enrichNinjatekProduct() provides print settings by Shore hardness',
      '✅ Hardcoded NINJATEK_TDS_URLS for all NinjaTek product lines',
      '✅ NINJATEK_COLOR_MAPPING provides hex codes for all colors (40+)',
      '✅ Separate product_line_ids for NinjaTek TPU vs ColorFabb materials',
      '✅ fixDuplicateHexCodes() post-processes to ensure unique swatches'
    ],
    failedApproaches: [
      '⚠️ Attempting WooCommerce API scraping - requires auth tokens',
      '⚠️ Including Eel/colorFabb PA - these only have diameter variants, not colors',
      '⚠️ Including 2.85mm/3mm variants - not consumer focused',
      '⚠️ Using generic TPU material - must specify Shore hardness (TPU-85A, TPU-95A, etc.)'
    ],
    currentStatus: {
      'csvSeedProducts': '~70 variants (after filtering diameter-only products)',
      'productLines': '10 unique lines (6 NinjaTek TPU + 4 ColorFabb)',
      'ninjatekTPU': 'NinjaFlex 85A (11), Edge 83A (2), Chinchilla 75A (4), Cheetah 95A (11), Armadillo 75D (9)',
      'colorFabb': 'ASA (2), PLA (12), Co-Polyesters (14), Specials (7)',
      'excluded': 'Eel 90A (diameter-only), colorFabb PA (diameter-only)'
    },
    keyFiles: [
      'supabase/functions/sync-ninjatek-products/index.ts - Main sync function (CSV-seeded)',
      'supabase/functions/_shared/ninjatek-defaults.ts - Enrichment, color mappings, TDS URLs',
      'supabase/functions/_shared/ninjatek-seed.csv - Raw CSV data (reference)',
      'NINJATEK_SEED_DATA constant - Embedded CSV in sync function',
      'NINJATEK_COLOR_MAPPING - 40+ color-to-hex mappings',
      'NINJATEK_TDS_URLS - TDS PDF URLs for all NinjaTek product lines'
    ],
    extractionPriority: [
      '1. Verify all CSV products are processed (check for skipped entries)',
      '2. Ensure 10 unique product lines are created',
      '3. Validate Shore hardness is correctly parsed and stored',
      '4. Confirm TDS URLs are populated for NinjaTek lines',
      '5. Verify ColorFabb products are separated into colorfabb-* product_line_ids'
    ],
    manualExtractionProcess: [
      '1. Products come from embedded CSV in sync function - DO NOT scrape WooCommerce',
      '2. To add new products: Update NINJATEK_SEED_DATA in sync function',
      '3. To add new colors: Update NINJATEK_COLOR_MAPPING in ninjatek-defaults.ts',
      '4. To add new TDS URLs: Update NINJATEK_TDS_URLS in ninjatek-defaults.ts',
      '5. Run clean slate sync to refresh all data from updated seed'
    ],
    productSlugReference: {
      'ninjaflex': 'NinjaFlex 85A TPU - Original soft flexible',
      'edge': 'Edge 83A TPU - Improved tear resistance',
      'chinchilla': 'Chinchilla 75A TPU - Softest, skin-safe',
      'cheetah': 'Cheetah 95A TPU - Fastest printing semi-flex',
      'armadillo': 'Armadillo 75D TPU - Rigid, abrasion resistant',
      'eel': 'Eel 90A TPU - Conductive (EXCLUDED)',
      'colorfabb-asa': 'colorFabb ASA',
      'colorfabb-pla': 'colorFabb PLA',
      'colorfabb-co-polyesters': 'colorFabb Co-Polyesters (nGen)',
      'colorfabb-specials': 'colorFabb Specials (Fills)'
    },
    lastUpdated: '2026-01-11'
  },
  'numakers': {
    platform: 'Shopify (numakers.com) - JSON API available but CSV-seeded for color accuracy',
    knownLimitations: [
      '❌ Shopify JSON API lacks curated hex codes - colors like "Thanos Purple" need manual mapping',
      '❌ NuBox Surplus items are subscription mystery products - cannot reliably catalog',
      '❌ Hueforge Packs are multi-spool bundles - not individual filament products',
      '❌ Warehouse Clearance items are older formula mystery colors - not reliable',
      '❌ No PDF TDS files - uses blog-based "Cheat Sheets" for slicer profiles',
      '❌ Tri-color Silk products cannot have single accurate hex - use first color as representative'
    ],
    workingSolutions: [
      '✅ CSV seed (NUMAKERS_SEED_DATA) contains all ~130 curated product variants',
      '✅ NUMAKERS_COLOR_MAPPING provides hex codes for creative color names (70+ colors)',
      '✅ NUMAKERS_CHEAT_SHEETS constant maps materials to blog URLs (Cura, PrusaSlicer, Bambu Studio)',
      '✅ Safe delete pattern with threshold (50+ products) for clean slate sync',
      '✅ Image URLs follow predictable Shopify CDN pattern with "Printzy" suffix',
      '✅ shouldExcludeNumakersProduct() filters NuBox, Hueforge, and Clearance items',
      '✅ Tri-color products use first component color as representative hex'
    ],
    failedApproaches: [
      '⚠️ Relying on Shopify JSON API alone - lacks curated color-to-hex mappings',
      '⚠️ Including NuBox/Hueforge/Clearance products - not standard catalog items',
      '⚠️ Using generic color name lookup - creative names like "Molten Sol" need explicit mapping',
      '⚠️ Attempting to scrape TDS PDFs - Numakers uses blog-based Cheat Sheets instead',
      '⚠️ Treating PETG-HS and PETG Translucent as one product - they are separate formulas'
    ],
    currentStatus: {
      'expectedProductLines': '13 (PLA+, PLA Silk, Tri-Color Silk, PLA Matte, PLA Starlight, PLA Glow, PLA Marble, PLA Wood, PLA-CF, PETG-HS, PETG Translucent, ASA, ABS)',
      'expectedVariants': '~130 individual color variants',
      'cheatSheetCoverage': '6 materials (PLA+, PLA-CF, PETG, ASA, Silk PLA, ABS)',
      'priceRange': '$17.99 - $32.99 USD'
    },
    keyFiles: [
      'supabase/functions/sync-numakers-products/index.ts - Main sync function with CSV seed',
      'supabase/functions/_shared/numakers-defaults.ts - NUMAKERS_SEED_DATA, color mappings, cheat sheet URLs'
    ],
    extractionPriority: [
      '1. Verify all CSV products are processed (check for skipped entries)',
      '2. Ensure 13 unique product lines are created',
      '3. Validate color hex codes are properly assigned',
      '4. Confirm Cheat Sheet URLs are populated for each material',
      '5. Verify excluded products are not synced (NuBox, Hueforge, Clearance)'
    ],
    manualExtractionProcess: [
      '1. Products come from embedded CSV in sync function - DO NOT scrape Shopify',
      '2. To add new products: Update NUMAKERS_SEED_DATA in numakers-defaults.ts',
      '3. To add new colors: Update NUMAKERS_COLOR_MAPPING in numakers-defaults.ts',
      '4. To add new Cheat Sheet URLs: Update NUMAKERS_CHEAT_SHEETS in numakers-defaults.ts',
      '5. Run clean slate sync to refresh all data from updated seed'
    ],
    productSlugReference: {
      'pla-plus': 'PLA+ Filament (35 colors)',
      'pla-silk': 'PLA Silk (11 colors)',
      'tri-color-silk': 'Tri-Color Silk PLA (9 colors)',
      'pla-matte': 'PLA Matte (13 colors)',
      'pla-starlight': 'PLA Starlight (5 colors)',
      'pla-glow': 'PLA Glow in the Dark (5 colors)',
      'pla-marble': 'PLA Marble (1 color)',
      'pla-wood': 'PLA Wood (1 color)',
      'pla-cf': 'PLA-CF (4 colors)',
      'petg-hs': 'PETG-HS Filament (16 colors)',
      'petg-translucent': 'PETG Translucent (9 colors)',
      'asa': 'ASA Filament (8 colors)',
      'abs': 'ABS Filament (8 colors)'
    },
    lastUpdated: '2026-01-12'
  },
  'overture': {
    platform: 'Shopify (overture3d.ca) - Canadian store with JSON API, but CSV-seeded for reliability',
    knownLimitations: [
      '❌ Multi-pack products (2-pack, 4-pack, 6-pack) create duplicate swatches in UI',
      '❌ Bulk 2kg variants should be excluded for consumer-focused catalog',
      '❌ Store has both .com (US) and .ca (Canada) - CSV seed uses .ca store',
      '❌ Rock PLA has mineral particles - abrasive to brass nozzles (requires hardened nozzle)',
      '❌ Some products (Eco PLA, Refill) only have 1 variant - not useful for color swatches',
      '❌ Shopify JSON API does not include curated hex codes for creative color names'
    ],
    workingSolutions: [
      '✅ CSV seed (OVERTURE_SEED_DATA) contains curated ~170 1-pack products only',
      '✅ OVERTURE_EXTENDED_COLOR_MAP provides hex codes for all creative color names',
      '✅ shouldExcludeOvertureProduct() filters multi-packs and bulk products',
      '✅ Safe delete pattern with threshold (50+ products) for clean slate sync',
      '✅ generateOvertureProductLineId() creates consistent product_line_id values',
      '✅ getOvertureDefaultPrice() provides CAD prices by material and line'
    ],
    failedApproaches: [
      '⚠️ Using overture3d.com URL - CSV seed uses .ca (Canadian store)',
      '⚠️ Including multi-pack products - causes swatch duplication in UI',
      '⚠️ Relying on Shopify JSON alone - misses curated hex codes for creative colors',
      '⚠️ Price validation against live API - CAD prices differ from USD expectations'
    ],
    currentStatus: {
      'expectedProductLines': '15 (Basic PLA, Matte PLA, Silk PLA, Easy PLA, Glow PLA, Rock PLA, Super PLA+, PLA Professional, Basic PETG, TPU, High Speed TPU, ABS, ASA, Easy Nylon)',
      'expectedVariants': '~170 individual color variants (1-pack products only)',
      'priceRange': '$17-$40 CAD'
    },
    keyFiles: [
      'supabase/functions/sync-overture-products/index.ts - Main sync function (CSV-seeded)',
      'supabase/functions/_shared/overture-seed.ts - OVERTURE_SEED_DATA, color mappings, exclusion logic',
      'supabase/functions/_shared/overture-defaults.ts - Product line definitions, enrichment'
    ],
    extractionPriority: [
      '1. Verify all CSV products are processed (check for skipped entries)',
      '2. Ensure 15 unique product lines are created',
      '3. Validate color hex codes are properly assigned from OVERTURE_EXTENDED_COLOR_MAP',
      '4. Confirm Rock PLA is marked as abrasive (isNozzleAbrasive: true)',
      '5. Verify excluded products are not synced (2-pack, 4-pack, 6-pack, 2kg)'
    ],
    manualExtractionProcess: [
      '1. Products come from embedded OVERTURE_SEED_DATA - DO NOT scrape Shopify',
      '2. To add new products: Update OVERTURE_SEED_DATA in overture-seed.ts',
      '3. To add new colors: Update OVERTURE_EXTENDED_COLOR_MAP in overture-seed.ts',
      '4. To add new product lines: Update OVERTURE_PRODUCT_LINES in overture-defaults.ts',
      '5. Run clean slate sync to refresh all data from updated seed'
    ],
    productSlugReference: {
      'basic-pla-1-75-mm-1-pack': 'Basic PLA (28 colors)',
      'matte-pla-1-75mm-1-pack': 'Matte PLA (28 colors)',
      'silk-pla1-75mm-1-pack': 'Silk PLA (23 colors)',
      'easy-pla-1-75mm-1-pack': 'Easy PLA (4 colors)',
      'glow-pla-1-75mm-1pack': 'Glow PLA (4 colors)',
      'overture-rock-pla-filament-1-75mm': 'Rock PLA (20 colors)',
      'super-pla-1-75mm-1-pack': 'Super PLA+ (5 colors)',
      'pla-plus-1-75mm-1-pack': 'PLA Professional (16 colors)',
      'basic-petg-1-75mm-1-pack': 'Basic PETG (24 colors)',
      'tpu-1-75mm-1-pack': 'TPU (12 colors)',
      'high-speed-tpu-1-75mm-1-pack-1': 'High Speed TPU (10 colors)',
      'overture-abs-filament-1-75mm': 'ABS (1 color)',
      'overture-asa-filament-1-75mm-white': 'ASA (1 color)',
      'nylon-1-75mm-1-pack': 'Easy Nylon (1 color)'
    },
    lastUpdated: '2026-01-12'
  },
  'proto-pasta': {
    platform: 'Shopify storefront (proto-pasta.com) - US only',
    knownLimitations: [
      '❌ TDS PDFs are on consolidated Material Data Table page - not per-product with predictable URLs',
      '❌ Many products are single-color (metal composites, carbon fiber)',
      '❌ 50g coils are samples - filter out per requirements (< 300g)',
      '❌ Subscriptions (Endless PLA) must be excluded',
      '❌ Workshops and Digital products must be excluded'
    ],
    workingSolutions: [
      '✅ CSV seed from protopasta-seed.ts as primary source',
      '✅ Shopify API for live prices and availability',
      '✅ getProtoPastaColorHex() with 100+ color mappings',
      '✅ generateProtoPastaProductLineId() with 25+ product line patterns',
      '✅ TDS URLs use consolidated Material Data Table page',
      '✅ Title cleaning removes weight/spool info and " - / " artifacts'
    ],
    failedApproaches: [
      '⚠️ Relying on variant title for color - often just size info (50g Coil, 500g Spool)',
      '⚠️ Including 50g coils as products - they are samples',
      '⚠️ Using individual TDS PDF URLs - have unpredictable version suffixes'
    ],
    currentStatus: {
      totalProducts: '~170 filament products (after filtering samples)',
      productLines: '25 unique product lines',
      materials: 'HTPLA, PLA, PETG, TPU, POK, HFPLA, rPLA, rPETG',
      hexCoverage: '100% with expanded color mapping',
      tdsUrls: 'Consolidated Material Data Table page'
    },
    keyFiles: [
      'supabase/functions/sync-protopasta-products/index.ts - Main sync function',
      'supabase/functions/_shared/protopasta-defaults.ts - Color mapping, product lines, TDS URLs',
      'supabase/functions/_shared/protopasta-seed.ts - CSV seed data'
    ],
    productSlugReference: {
      'htpla-reflective': 'HTPLA Reflective (retroreflective particles)',
      'htpla-glitter': 'HTPLA Glitter/Sparkle/Fleck',
      'htpla-translucent': 'HTPLA Translucent/Crystal/Ice',
      'htpla-metallic': 'HTPLA Metallic (Empire, Galactic)',
      'htpla-nebula': 'HTPLA Nebula Multicolor',
      'htpla-matte-fiber': 'HTPLA Matte Fiber',
      'htpla-thermochromic': 'HTPLA Thermochromic (color-change)',
      'htpla-glow': 'HTPLA Glow-in-the-Dark',
      'htpla-smoothie': 'HTPLA Smoothie (food-named colors)',
      'htpla-marble': 'HTPLA Marble',
      'htpla-wood': 'HTPLA Wood (Mahogany, Walnut)',
      'htpla-brass': 'HTPLA Brass-Filled Metal Composite',
      'htpla-bronze': 'HTPLA Bronze-Filled Metal Composite',
      'htpla-copper': 'HTPLA Copper-Filled Metal Composite',
      'pla-iron': 'PLA Iron-Filled Metal Composite',
      'pla-steel': 'PLA Stainless Steel Metal Composite',
      'htpla-cf': 'HTPLA Carbon Fiber',
      'pla-cf': 'PLA Carbon Fiber (Original)',
      'pla-conductive': 'Conductive PLA (30 ohm-cm)',
      'petg-standard': 'Simply PETG',
      'petg-cf': 'PETG Carbon Fiber',
      'hfpla': 'High Flow PLA (c-Matte)',
      'tpu-flexible': 'Flexible TPU',
      'rpla': 'Recycled PLA (Still Colorful)',
      'polyketone': 'Polyketone (POK)'
    },
    lastUpdated: '2026-01-12'
  },
  'polymaker': {
    platform: 'Shopify storefront (us.polymaker.com, ca.polymaker.com) with regional subdomains',
    knownLimitations: [
      '❌ Bundle products (Holiday, CMYK, Hueforge packs) pollute catalog if not filtered',
      '❌ Hardware (PolyDryer, PolyBox, Nebulizer) must be excluded',
      '❌ Virtual products (Gift Card, Shipping Insurance) must be excluded',
      '❌ 3D Pen Filaments and Creator Special Editions are not standard spools',
      '❌ Regional stores have different prices (USD vs CAD) - sync from US, add CA prices separately',
      '❌ Product types "Bundle Packs", "Hardware", "Virtual" indicate non-filament',
      '❌ Most SKUs do NOT contain HEX codes - only format "CA04015 | HEX Code:#2F2E30" has HEX data',
      '❌ Dual/Gradient colors show mixed colors - hex cannot match single color family'
    ],
    workingSolutions: [
      '✅ isFilamentProduct() in polymaker-defaults.ts handles all bundle/hardware exclusions',
      '✅ extractProductLine() detects 67+ unique product lines with EXPLICIT matte check',
      '✅ SKU contains HEX and TD values for SOME products - extractHexFromSku() as primary source',
      '✅ extractPolymakerColorFromTitle() as fallback - extracts color after " - " separator',
      '✅ POLYMAKER_COLOR_MAPPING has 100+ color names with hex codes',
      '✅ POLYMAKER_COLOR_EXCLUSION_PATTERNS filters marketing text like "you will love it"',
      '✅ enrichPolymakerProduct() returns complete print settings from POLYMAKER_PRINT_SETTINGS',
      '✅ Cross-product swatch architecture supported (each color = separate Shopify product)',
      '✅ Panchroma "standard" is SEPARATE from Panchroma "matte" (no fallback to matte)',
      '✅ panchroma-refill is SEPARATE product line (cardboard spool)',
      '✅ Regional CA prices synced via fetchRegionalPrices() from ca.polymaker.com'
    ],
    failedApproaches: [
      '⚠️ Including Bundle Packs product type - must be filtered',
      '⚠️ Not excluding "holidaybundle" tag - creates holiday pack contamination',
      '⚠️ Treating Creator Special Editions as regular filament',
      '⚠️ Using Panchroma-matte as default fallback - causes 186-variant mega-groups',
      '⚠️ Relying solely on SKU HEX extraction - most SKUs lack HEX data',
      '⚠️ Extracting marketing text "you will love it" as color name'
    ],
    currentStatus: {
      'totalProducts': '~600 color variants across 67+ product lines',
      'productLines': '67 (Panchroma 28, PolyLite 12, Fiberon 14, PolyMax 4, PolyFlex 3, PolySonic 2, Specialty 8)',
      'materialsSupported': 'PLA, PETG, ABS, ASA, PC, PC-ABS, PC-PBT, TPU-90A, TPU-95A, PA12-CF, PA6-CF, PA6-GF, PA612-CF, PA612-ESD, PET-CF, PET-GF, PPS-CF, PPS-GF, ASA-CF, PETG-ESD, PETG-rCF, LW-PLA, HT-PLA, HT-PLA-GF, PVB, PVA',
      'hexCoverage': '~70% - SKU extraction + title fallback + 100-color mapping',
      'regionalPricing': 'US (USD) primary, CA (CAD) secondary'
    },
    keyFiles: [
      'supabase/functions/sync-polymaker-products/index.ts - Main sync with Shopify product fetch',
      'supabase/functions/_shared/polymaker-defaults.ts - Product line detection, material normalization, print settings',
      'isFilamentProduct() - Excludes bundles, hardware, virtual, 3D pen, creator editions',
      'extractProductLine() - 67+ specific product line patterns with EXPLICIT matte check',
      'extractPolymakerColorFromTitle() - Fallback color extraction from product title',
      'POLYMAKER_COLOR_MAPPING - 100+ color-to-hex mappings',
      'enrichPolymakerProduct() - Complete print settings from POLYMAKER_PRINT_SETTINGS (45+ entries)',
      'extractHexFromSku() / extractTdFromSku() - Parse "CA04015 | HEX Code:#2F2E30 | TD:0.1" format'
    ],
    productSlugReference: {
      'panchroma-standard': 'Panchroma PLA Standard (base Panchroma line)',
      'panchroma-matte': 'Panchroma Matte PLA (formerly PolyTerra) - EXPLICIT matte only',
      'panchroma-silk': 'Panchroma Silk PLA (formerly PolyLite Silk)',
      'panchroma-dual-silk': 'Panchroma Dual Silk PLA',
      'panchroma-dual-matte': 'Panchroma Dual Matte PLA (formerly PolyTerra Dual)',
      'panchroma-gradient-matte': 'Panchroma Gradient Matte (formerly PolyTerra Gradient)',
      'panchroma-gradient-silk': 'Panchroma Gradient Silk',
      'panchroma-gradient': 'Panchroma Gradient (base gradient line)',
      'panchroma-marble': 'Panchroma Marble PLA',
      'panchroma-galaxy': 'Panchroma Galaxy PLA (formerly PolyLite Galaxy)',
      'panchroma-starlight': 'Panchroma Starlight PLA (formerly PolyLite Starlight)',
      'panchroma-luminous': 'Panchroma Luminous PLA (formerly PolyLite Luminous)',
      'panchroma-luminous-rainbow': 'Panchroma Luminous Rainbow PLA',
      'panchroma-glow': 'Panchroma Glow PLA (formerly PolyLite Glow)',
      'panchroma-neon': 'Panchroma Neon PLA',
      'panchroma-metallic': 'Panchroma Metallic PLA',
      'panchroma-translucent': 'Panchroma Translucent PLA',
      'panchroma-satin': 'Panchroma Satin PLA (formerly PolyTerra PLA+)',
      'panchroma-uv-shift': 'Panchroma UV Shift PLA (formerly PolyLite UV Changing)',
      'panchroma-cope': 'Panchroma CoPE',
      'panchroma-refill': 'Panchroma PLA Refill (cardboard spool)',
      'panchroma-celestial': 'Panchroma Celestial PLA',
      'polylite-pla': 'PolyLite PLA Standard',
      'polylite-pla-pro': 'PolyLite PLA Pro',
      'polylite-pla-cf': 'PolyLite PLA-CF',
      'polylite-lw-pla': 'PolyLite LW-PLA',
      'polylite-abs': 'PolyLite ABS',
      'polylite-petg': 'PolyLite PETG',
      'polylite-petg-translucent': 'PolyLite PETG Translucent',
      'polylite-pc': 'PolyLite PC',
      'polylite-asa': 'PolyLite ASA',
      'polymax-pla': 'PolyMax PLA',
      'polymax-petg': 'PolyMax PETG',
      'polymax-pc': 'PolyMax PC',
      'polymax-pc-fr': 'PolyMax PC-FR (Flame Retardant)',
      'polysonic': 'PolySonic PLA (High Speed)',
      'polysonic-pro': 'PolySonic PLA Pro (High Speed)',
      'polyflex-tpu90': 'PolyFlex TPU90',
      'polyflex-tpu95': 'PolyFlex TPU95',
      'polyflex-tpu95-hf': 'PolyFlex TPU95-HF (High Flow)',
      'fiberon-pa12-cf': 'Fiberon PA12-CF (formerly PolyMide PA12-CF)',
      'fiberon-pa6-cf': 'Fiberon PA6-CF (formerly PolyMide PA6-CF)',
      'fiberon-pa6-gf': 'Fiberon PA6-GF (formerly PolyMide PA6-GF)',
      'fiberon-pa612-cf': 'Fiberon PA612-CF',
      'fiberon-pa612-esd': 'Fiberon PA612-ESD',
      'fiberon-petg': 'Fiberon PETG',
      'fiberon-pet-cf': 'Fiberon PET-CF',
      'fiberon-pet-gf': 'Fiberon PET-GF',
      'fiberon-petg-esd': 'Fiberon PETG-ESD (formerly PolyMax PETG-ESD)',
      'fiberon-petg-rcf': 'Fiberon PETG-rCF',
      'fiberon-asa-cf': 'Fiberon ASA-CF',
      'fiberon-pps-cf': 'Fiberon PPS-CF',
      'fiberon-pps-gf': 'Fiberon PPS-GF',
      'fiberon-copa': 'Fiberon CoPA',
      'polycast': 'PolyCast (Investment Casting PLA)',
      'polysmooth': 'PolySmooth (Polishable PVB)',
      'polydissolve': 'PolyDissolve S1 (PVA Support)',
      'polysupport-pla': 'PolySupport for PLA',
      'polysupport-pa12': 'PolySupport for PA12',
      'ht-pla': 'HT-PLA (High Temperature)',
      'ht-pla-gf': 'HT-PLA-GF',
      'cospla': 'CosPLA (Cosplay-optimized)',
      'wood-pla': 'Wood PLA',
      'pc-abs': 'PC-ABS Alloy',
      'pc-pbt': 'PC-PBT Alloy',
      'galaxy-asa': 'Galaxy ASA',
      'polymaker-asa': 'Polymaker ASA',
      'polymaker-petg': 'Polymaker PETG'
    },
    lastUpdated: '2026-01-12'
  },
  'sunlu': {
    platform: 'Shopify store (store.sunlu.com) - CSV-seeded sync architecture',
    knownLimitations: [
      '❌ Multi-region variants create 4x duplication (Ship to USA/Europe/Canada/Australia)',
      '❌ Many non-filament products in catalog (FilaDryer, 3D pens, resins, build plates)',
      '❌ MOQ bundle products (10KG) mixed with consumer products',
      '❌ Complex variant format: "Ship to Region / Material | Color Weight"',
      '❌ Some color names have typos (Oliver Green vs Olive Green)',
      '❌ Engineering materials (PEEK, PC, PP) have very limited color options',
      '❌ Refill products create separate product lines (not variants of main product)'
    ],
    workingSolutions: [
      '✅ CSV seed (sunlu-seed.ts) with pre-filtered consumer products only',
      '✅ Parse variant format with regex: /Ship to\\s*(\\w+)\\s*\\/\\s*(.+)/i',
      '✅ Material prefix array for clean color extraction',
      '✅ Extended hex mapping with 150+ colors including Silk variants',
      '✅ Region consolidation - prefer US variants, dedupe regions',
      '✅ MOQ pattern exclusion: /\\[moq.*\\]/i for bundles',
      '✅ Non-filament exclusion: filadryer, 3d pen, resin, build plate, connector',
      '✅ Safe delete pattern with threshold (150+ products) for clean slate'
    ],
    failedApproaches: [
      '⚠️ Using live Shopify API without filtering - includes non-filaments and 4x region duplicates',
      '⚠️ Including all regions - creates duplicate products per region',
      '⚠️ Not stripping material prefix from color - "PLA+ Black" vs "Black"',
      '⚠️ Using same hex for Oliver/Olive Green typo variants'
    ],
    currentStatus: {
      'totalProducts': '~400 color variants (after filtering from 2010 raw variants)',
      'expectedProductLines': '38 (PLA, PLA+, PLA Meta, Silk, Matte, PETG, ABS, ASA, TPU, Engineering)',
      'architecture': 'CSV-seeded sync with Safe Delete pattern',
      'regions': 'US, EU, CA, AU (consolidate to US only)',
      'hexMappings': '150+ unique color-to-hex mappings in SUNLU_EXTENDED_HEX_MAP'
    },
    keyFiles: [
      'supabase/functions/sync-sunlu-products/index.ts - Main sync function (CSV-seeded)',
      'supabase/functions/_shared/sunlu-seed.ts - CSV seed data, hex mappings, product line ID generation',
      'supabase/functions/_shared/sunlu-defaults.ts - Material normalization, print settings, enrichment',
      'SUNLU_EXTENDED_HEX_MAP - 150+ color-to-hex mappings',
      'SUNLU_EXPECTED_PRODUCT_LINES - Expected variant counts per product line'
    ],
    extractionPriority: [
      '1. Filter non-filament products (filadryer, pens, resins)',
      '2. Filter MOQ/bulk products (10KG bundles)',
      '3. Consolidate region duplicates (US only)',
      '4. Parse complex variant format for color extraction',
      '5. Map colors to hex codes using SUNLU_EXTENDED_HEX_MAP'
    ],
    manualExtractionProcess: [
      '1. Export Sunlu catalog via Shopify API or CSV export',
      '2. Filter to filament products only (isSunluFilament check)',
      '3. Remove non-consumer products (MOQ, bulk, accessories)',
      '4. Consolidate to US region variants only',
      '5. Update SUNLU_EXTENDED_HEX_MAP for new colors',
      '6. Run clean slate sync to refresh all data'
    ],
    productSlugReference: {
      'pla-standard': 'PLA Standard',
      'pla-plus-standard': 'PLA+ (PLA Plus)',
      'pla-plus-2-high-speed': 'PLA+ 2.0 High Speed (HSPLA+)',
      'pla-meta-standard': 'PLA Meta (Macaron colors)',
      'pla-matte-standard': 'PLA Matte',
      'pla-silk-standard': 'PLA Silk',
      'pla-matte-dual-standard': 'Matte Dual-Color PLA',
      'pla-glow-standard': 'PLA Glow in Dark',
      'pla-marble-standard': 'PLA Marble',
      'pla-wood-standard': 'PLA Wood',
      'pla-rainbow-standard': 'PLA Rainbow',
      'pla-refill-standard': 'PLA Refill (for reusable spool)',
      'petg-standard': 'PETG Standard',
      'petg-matte-standard': 'PETG Matte',
      'petg-cf-standard': 'PETG Carbon Fiber',
      'abs-standard': 'ABS Standard',
      'abs-easy-standard': 'Easy ABS',
      'abs-gf-standard': 'ABS Glass Fiber',
      'abs-fr-standard': 'ABS Flame Retardant',
      'asa-standard': 'ASA',
      'tpu-standard': 'TPU',
      'tpu-90a-standard': 'TPU 90A',
      'pa-cf-standard': 'PA Carbon Fiber',
      'pc-standard': 'PC (Polycarbonate)',
      'pc-abs-standard': 'PC-ABS Alloy',
      'pp-standard': 'PP (Polypropylene)',
      'peek-standard': 'PEEK (High Performance)'
    },
    lastUpdated: '2026-01-14'
  },
  'spectrum-filaments': {
    platform: 'Live Shopify API (ca.spectrumfilaments.com) - NOT CSV-seeded',
    knownLimitations: [
      '❌ "Wood" in materialPrefixes strips "WOOD" from "WOOD ASH" → color becomes just "ASH"',
      '❌ Similar colors (NAT, NATURAL, NT) collide with same #F5F5DC hex → Swatch Uniqueness fails',
      '❌ MATT vs non-MATT colors share same hex → duplicate swatches within product_line_id',
      '❌ Specialty materials (PC/PTFE, PPS AM230, ThermaTech PA, PET-G FR V0) incorrectly grouped into pla-premium',
      '❌ Gold glitter colors (Aurora, Aztec, Clear) share same #FFD700 hex',
      '❌ Stone Age colors (LIGHT, DARK) extracted incorrectly when PLA Stone Age not in materialPrefixes',
      '❌ Metal colors (BRASS, Bronze) require explicit hex mappings'
    ],
    workingSolutions: [
      '✅ Remove "Wood" from materialPrefixes in extractColor() - Wood material detection uses protected pattern in extractMaterial()',
      '✅ Add unique hex codes in extendedMappings for similar colors (e.g., NAT:#F5F0DC, NATURAL:#F5F5DC)',
      '✅ Add specialty material patterns to extractMaterial() BEFORE generic fallbacks',
      '✅ Use suffix variations for visually similar colors (e.g., #A4A4A4 vs #A5A5A5)',
      '✅ MATT colors get slightly darker hex than non-MATT equivalents',
      '✅ Stone Age needs "PLA Stone Age" in materialPrefixes to correctly extract LIGHT/DARK',
      '✅ extendedMappings supports full color names (e.g., "pps am230 nat": "F5E6CE")'
    ],
    failedApproaches: [
      '⚠️ Adding "Wood" to materialPrefixes - breaks WOOD ASH color extraction',
      '⚠️ Using same hex for similar colors - fails Swatch Uniqueness check',
      '⚠️ Putting specialty materials after generic fallbacks in extractMaterial() - incorrect grouping',
      '⚠️ Not updating EXPECTED_CARD_COUNTS after adding specialty material product lines'
    ],
    currentStatus: {
      'totalProducts': '662 color variants from Shopify API',
      'expectedProductLines': '67 (12 The Filament + 18 PLA + 9 PETG + 7 ASA + 11 Engineering + 10 Specialty)',
      'architecture': 'Live Shopify API sync with background 5-step processing',
      'subBrands': '"The Filament" (12 lines), ReFill eco-spools',
      'hexMappings': '200+ unique color-to-hex mappings in extendedMappings'
    },
    keyFiles: [
      'supabase/functions/sync-spectrum-products/index.ts - Main sync function with extractColor(), extractMaterial(), mapSpectrumColorToHex()',
      'supabase/functions/_shared/spectrum-seed.ts - Product line ID generation with generateSpectrumProductLineIdFromSeed(), SPECTRUM_EXPECTED_PRODUCT_LINES',
      'supabase/functions/_shared/spectrum-defaults.ts - Enrichment and shared color mappings'
    ],
    extractionPriority: [
      '1. Fix extractMaterial() to recognize specialty materials BEFORE generic fallbacks',
      '2. Add missing color hex mappings to extendedMappings in mapSpectrumColorToHex()',
      '3. Add unique hex codes for similar colors (MATT vs non-MATT, NAT variants)',
      '4. Update materialPrefixes in extractColor() for new specialty materials',
      '5. Update EXPECTED_CARD_COUNTS in run-post-sync-check after adding product lines'
    ],
    manualExtractionProcess: [
      '1. Run sync to identify missing colors from logs',
      '2. Add missing colors to extendedMappings in mapSpectrumColorToHex()',
      '3. Add unique hex variations for similar colors within same product_line_id',
      '4. Run Clean Slate sync to refresh all data',
      '5. Run Post Sync Check to verify 0 failures'
    ],
    productSlugReference: {
      'the-filament-pla': 'The Filament PLA (12 sub-lines)',
      'pla-premium': 'PLA Premium',
      'pla-silk': 'PLA Silk',
      'pla-pastel': 'PLA Pastello',
      'pla-stone-age': 'PLA Stone Age',
      'pla-metal': 'PLA Metal',
      'pla-glitter': 'PLA Glitter',
      'pet-g-premium': 'PET-G Premium',
      'pet-g-matt': 'PET-G Matt',
      'asa': 'ASA Premium',
      'abs-medical': 'ABS Medical',
      'pc-ptfe': 'PC/PTFE (specialty)',
      'pps-am230': 'PPS AM230 (specialty)',
      'thermatech-pa': 'ThermaTech PA (specialty)',
      'pet-g-fr-v0': 'PET-G FR V0 (fire retardant)',
      's-flex': 'S-Flex TPU series'
    },
    lastUpdated: '2026-01-14'
  }
};

/**
 * Determine the best AI role based on failing check types and brand
 */
function determineAIRole(checks: CheckResult[], brandSlug?: string): { title: string; capabilities: string[] } {
  // Prioritize brand-specific specialists
  if (brandSlug === 'bambu-lab') {
    return AI_ROLES.bambuLabSpecialist;
  }
  if (brandSlug === 'colorfabb') {
    return AI_ROLES.colorFabbSpecialist;
  }
  if (brandSlug === 'fillamentum') {
    return AI_ROLES.fillamentumSpecialist;
  }
  if (brandSlug === 'eryone') {
    return AI_ROLES.colorSpecialist;
  }
  if (brandSlug === 'esun') {
    return AI_ROLES.esunSpecialist;
  }
  if (brandSlug === 'extrudr') {
    return AI_ROLES.extrudrSpecialist;
  }
  if (brandSlug === 'formfutura') {
    return AI_ROLES.formFuturaSpecialist;
  }
  if (brandSlug === 'geeetech') {
    return AI_ROLES.geeetechSpecialist;
  }
  if (brandSlug === 'kingroon') {
    return AI_ROLES.kingroonSpecialist;
  }
  if (brandSlug === 'hatchbox') {
    return AI_ROLES.hatchboxSpecialist;
  }
  if (brandSlug === 'ic3d-printers') {
    return AI_ROLES.ic3dSpecialist;
  }
  if (brandSlug === 'matter3d') {
    return AI_ROLES.matter3dSpecialist;
  }
  if (brandSlug === 'ninjatek') {
    return AI_ROLES.ninjatekSpecialist;
  }
  if (brandSlug === 'polymaker') {
    return AI_ROLES.polymakerSpecialist;
  }
  if (brandSlug === 'numakers') {
    return AI_ROLES.numakersSpecialist;
  }
  if (brandSlug === 'overture') {
    return AI_ROLES.overtureSpecialist;
  }
  if (brandSlug === 'paramount-3d') {
    return AI_ROLES.paramountSpecialist;
  }
  if (brandSlug === 'proto-pasta') {
    return AI_ROLES.protoPastaSpecialist;
  }
  if (brandSlug === 'push-plastic') {
    return AI_ROLES.pushPlasticSpecialist;
  }
  if (brandSlug === 'recreus') {
    return AI_ROLES.recreusSpecialist;
  }
  if (brandSlug === 'spectrum-filaments') {
    return AI_ROLES.spectrumFilamentsSpecialist;
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

/**
 * Generate ColorFabb-specific AI Fix Prompt with Magento platform context
 */
function generateColorFabbFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['colorfabb'];
  const role = AI_ROLES.colorFabbSpecialist;
  
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

## CSV-SEEDED SYNC ARCHITECTURE

ColorFabb sync uses a **hardcoded CSV seed** as the primary data source:

1. **COLORFABB_PRODUCT_SEED** (75 products) in \`colorfabb-defaults.ts\` contains:
   - Product names, URLs, images, prices (USD), SKUs
   - Data sourced from colorfabb.us store export
   
2. **enrichColorFabbProduct()** enriches each seed product with:
   - Material classification (24+ product lines)
   - Finish type detection (Silk, Matte, etc.)
   - product_line_id generation
   - Print settings (temps, speeds)
   - TDS URL from hardcoded patterns
   
3. **COLORFABB_COLOR_MAPPING** provides hex codes for colors

This architecture ensures stable, consistent data without relying on scraping Magento pages.

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `- ${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE APPROACHES)

${lessons.workingSolutions.map(s => `- ${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID REPEATING)

${lessons.failedApproaches.map(f => `- ${f}`).join('\n')}

---

## CURRENT SYNC STATUS

| Category | Status |
|----------|--------|
| **Seed Products** | ${lessons.currentStatus.seedProducts} |
| **Product Lines** | ${lessons.currentStatus.productLines} |
| **Materials** | ${lessons.currentStatus.materialsNormalized} |
| **Colors** | ${lessons.currentStatus.colorsWithHex} |
| **TDS URLs** | ${lessons.currentStatus.tdsUrlsCovered} |

---

## KEY FILES FOR COLORFABB

${lessons.keyFiles.map(f => `- \`${f}\``).join('\n')}

---

## Fix Post Sync Check Issues for ColorFabb

### Summary
- **Brand**: ${brand} (slug: colorfabb)
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

## Required Actions for ColorFabb

### 1. For Missing Products

If products are missing, they need to be added to the CSV seed:

\`\`\`typescript
// In colorfabb-defaults.ts, add to COLORFABB_PRODUCT_SEED:
{
  productName: 'New Product Line Color',
  color: 'Color Name',
  priceUsd: 34.95,
  productUrl: 'https://colorfabb.us/new-product-line-color.html',
  imageUrl: 'https://colorfabb.us/media/catalog/product/...',
  sku: 'SKU-123',
},
\`\`\`

### 2. For Missing Color Hex Codes

Add new colors to COLORFABB_COLOR_MAPPING:

\`\`\`typescript
// In colorfabb-defaults.ts:
export const COLORFABB_COLOR_MAPPING: Record<string, string> = {
  // ... existing colors ...
  'new color': '#HEXCODE',
};
\`\`\`

### 3. For Material Classification Issues

Update MATERIAL_PATTERNS regex or enrichColorFabbProduct() logic:

\`\`\`typescript
// In colorfabb-defaults.ts:
const MATERIAL_PATTERNS: Record<string, RegExp> = {
  // ... existing patterns ...
  'New Material': /new[\\s-]?material/i,
};
\`\`\`

### 4. For TDS URL Issues

Add TDS patterns for product lines:

\`\`\`typescript
// In colorfabb-defaults.ts:
export const COLORFABB_TDS_PATTERNS: Record<string, string> = {
  // ... existing patterns ...
  'new-product-line': 'https://colorfabb.com/media/...',
};
\`\`\`

### 5. For Card Count Mismatch

The expected card count should match unique product_line_id values.
Current: 24 product lines expected (update EXPECTED_CARD_COUNTS if needed).

---

## Optional: Firecrawl TDS Extraction

If TDS URLs are not in hardcoded patterns, you can optionally scrape them:

\`\`\`typescript
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
if (firecrawlApiKey) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${firecrawlApiKey}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: productUrl,
      formats: ['html'],
      waitFor: 2000, // Wait for Magento AJAX to load Downloads tab
    }),
  });
  const data = await response.json();
  const html = data.data?.html || '';
  
  // Extract TDS PDF link from Downloads section
  const tdsMatch = html.match(/href="([^"]+\\.pdf)"/i);
  if (tdsMatch) {
    const tdsUrl = tdsMatch[1];
  }
}
\`\`\`

---

## Product Line Reference

| Slug | Display Name |
|------|--------------|
${Object.entries(lessons.productSlugReference || {}).slice(0, 15).map(([slug, name]) => `| ${slug} | ${name} |`).join('\n')}

---

## Verification Steps

After making fixes:
1. Run a **Clean Slate** sync for ColorFabb
2. Run **Post Sync Check** again to verify issues are resolved
3. Verify product cards display correctly with proper colors and materials

---

*Last Updated: ${lessons.lastUpdated}*`;
}

/**
 * Generate Eryone-specific AI Fix Prompt with lessons learned
 */
function generateEryoneFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['eryone'];
  const role = AI_ROLES.colorSpecialist;
  
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

  return `You are the **${role.title}** for Filascope, a comprehensive 3D printing filament database and comparison platform.

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

## Fix Post Sync Check Issues for ${brand}

The Post Sync Check for ${brand} found the following issues that need to be fixed in the sync function.

### Summary

- **Brand**: ${brand} (slug: eryone)

- **Total Products**: ${totalProducts}

- **Failed Checks**: ${failedChecks.length}

- **Warning Checks**: ${warningChecks.length}

### Issues Found

${issuesSummary}

---

## Detailed Issues

${detailedIssues}

---

## CRITICAL: Eryone CSV-Seeded Architecture

**Eryone uses a CSV-seeded sync, NOT live website scraping.**

### Platform: ${lessons.platform}

All ${totalProducts} products come from \`ERYONE_PRODUCT_SEED\` in \`supabase/functions/_shared/eryone-defaults.ts\`.

### Known Limitations

${lessons.knownLimitations.map(l => `- ${l}`).join('\n')}

### Working Solutions (Use These!)

${lessons.workingSolutions.map(s => `- ${s}`).join('\n')}

### Failed Approaches (Avoid These!)

${lessons.failedApproaches.map(f => `- ${f}`).join('\n')}

---

## Current Status

| Metric | Value |
|--------|-------|
${Object.entries(lessons.currentStatus).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

---

## Key Files to Modify

| File | Purpose |
|------|---------|
${lessons.keyFiles.map(f => `| ${f.split(' - ')[0]} | ${f.split(' - ')[1] || 'See code'} |`).join('\n')}

---

## Fix Instructions by Issue Type

### For Duplicate Hex Codes (Swatch Uniqueness)

1. Open \`supabase/functions/_shared/eryone-defaults.ts\`
2. Find the \`ERYONE_PRODUCT_SEED\` array
3. Locate dual-color products (e.g., "Red & Blue", "Red & Green")
4. Update \`colorHex\` to unique blended values:
   - Red (#FF0000) & Blue (#0000FF) → \`#7F007F\` (purple blend)
   - Red (#FF0000) & Green (#00FF00) → \`#7F7F00\` (olive blend)
   - Black (#000000) & Purple (#800080) → \`#400040\` (dark purple)
   - Rainbow Stone → \`#E8DFD8\` (beige, NOT white #FFFFFF)

**Hex Blending Formula:**
\`\`\`typescript
// Blend two colors: average their RGB components
function blendColors(hex1: string, hex2: string): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);
  
  return \`#\${r.toString(16).padStart(2, '0')}\${g.toString(16).padStart(2, '0')}\${b.toString(16).padStart(2, '0')}\`.toUpperCase();
}
\`\`\`

### For Product Line ID Issues (Card Count)

1. Open \`supabase/functions/_shared/eryone-defaults.ts\`
2. Find \`generateEryoneProductLineId()\` function
3. Ensure format is: \`eryone__\${material}__\${lineSlug}\`
4. Avoid redundant patterns like \`eryone__pla__pla\` (should be \`eryone__pla__standard\`)
5. Handle compound materials:
   - PLA-Metal → \`eryone__pla-metal__metallic\`
   - PLA-Wood → \`eryone__pla-wood__standard\`

### For Title Accuracy Issues

1. Current format: \`\${cleanedTitle} - \${seed.color}\`
2. This is INTENTIONAL to distinguish variants
3. If you need exact H1 match, remove color suffix
4. But variant distinction is more important for swatches

### For Missing Products (Processing Issues)

1. Add debug logging in \`sync-eryone-products/index.ts\`:
\`\`\`typescript
console.log(\`[Eryone Sync] CSV seed length: \${ERYONE_PRODUCT_SEED.length}\`);
console.log(\`[Eryone Sync] Unique materials: \${[...new Set(products.map(p => p.material))].join(', ')}\`);
console.log(\`[Eryone Sync] Products prepared: \${productsToInsert.length}\`);
\`\`\`
2. Check for products being silently skipped in the processing loop
3. Verify safe delete threshold (>= 100) matches expected product count

---

## Manual Extraction Process (For New Products)

${lessons.manualExtractionProcess?.map((step, i) => `${step}`).join('\n') || 'N/A'}

---

## Product Line Reference

| Slug | Display Name |
|------|--------------|
${Object.entries(lessons.productSlugReference || {}).map(([slug, name]) => `| ${slug} | ${name} |`).join('\n')}

---

## Verification Steps

After making fixes:

1. Run a **Clean Slate** sync for Eryone from Brand Sync Manager
2. Check edge function logs for material counts and product totals
3. Run **Post Sync Check** again to verify all issues are resolved
4. Spot-check a few product cards to confirm:
   - Correct card count (~50 product lines)
   - No duplicate color swatches
   - Colors match hex codes visually

---

*Last Updated: ${lessons.lastUpdated}*`;
}

/**
 * Generate Fiberlogy-specific AI Fix Prompt with CSV-seeded architecture context
 */
function generateFiberlogyFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const role = {
    title: 'Fiberlogy Integration Specialist',
    capabilities: [
      'CSV-seeded sync pipeline management for ShopArena platform',
      'Material classification for 19+ Fiberlogy product lines',
      'Transparent and specialty color hex mapping',
      'TDS URL pattern management for Polish manufacturer',
    ],
  };
  
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

**Platform**: ShopArena (Polish e-commerce platform)
**Website**: https://fiberlogy.com
**This is NOT a Shopify store** - do NOT use Shopify JSON APIs, /products.json, or Shopify-specific patterns.

---

## CORE CAPABILITIES

${role.capabilities.map((cap: string, i: number) => `${i + 1}. **${cap}**`).join('\n')}

---

## CSV-SEEDED SYNC ARCHITECTURE

Fiberlogy sync uses a **hardcoded CSV seed** as the primary data source:

1. **FIBERLOGY_PRODUCT_SEED** (~274 products across 19 lines) in \`fiberlogy-seed.ts\` contains:
   - Material, filament name, color, product URL
   - Data sourced from manufacturer CSV export
   
2. **enrichFiberlogyProduct()** in \`fiberlogy-defaults.ts\` enriches each product with:
   - Material classification (Easy PLA, Easy PETG, FiberSilk, etc.)
   - Finish type detection (Silk, Satin, Matte, Glow)
   - Print settings (temps, speeds)
   - TDS URL from FIBERLOGY_TDS_PATTERNS mapping
   
3. **FIBERLOGY_COLOR_MAPPING** provides hex codes for 90+ colors including transparents

---

## PRODUCT LINES REFERENCE

| Product Line | Material | Approx. Colors |
|-------------|----------|----------------|
| Easy PLA | PLA | 47 |
| Easy PETG | PETG | 26 |
| FiberFlex 40D | TPU-40D | 22 |
| PP | PP | 22 |
| Easy ABS | ABS | 19 |
| FiberSilk | PLA | 17 |
| HS PLA Clear | PLA | 15 |
| Impact PLA | PLA | 14 |
| FiberFlex 30D | TPU-30D | 14 |
| FiberSatin | PLA | 12 |
| Nylon PA12 | PA12 | 11 |
| PCTG | PCTG | 10 |
| Matte PLA | PLA | 10 |
| Matte PETG | PETG | 9 |
| MattFlex 40D | TPU-40D | 9 |
| HIPS | HIPS | 8 |
| ASA | ASA | 6 |
| FiberWood | PLA-Wood | 5 |
| FiberSmooth | PVB | 5 |

---

## KNOWN LIMITATIONS

1. ❌ **Do NOT use Firecrawl scraping** - ShopArena pages are JavaScript-heavy
2. ❌ **No color-specific images** - CSV only has product-level images  
3. ❌ **Pricing varies by region** - CSV doesn't include reliable prices

---

## WORKING SOLUTIONS

1. ✅ **Use CSV seed as single source of truth** - reliable product catalog
2. ✅ **Color mapping handles transparent variants** - uses alpha channel hex codes
3. ✅ **TDS URLs derived from product line** - consistent pattern per material
4. ✅ **Delete-then-insert pattern** - prevents stale data accumulation

---

## KEY FILES FOR FIBERLOGY

- \`supabase/functions/_shared/fiberlogy-seed.ts\` - 274 products from CSV
- \`supabase/functions/_shared/fiberlogy-defaults.ts\` - Color mapping, enrichment, TDS URLs
- \`supabase/functions/sync-fiberlogy-products/index.ts\` - CSV-seeded sync function

---

## Fix Post Sync Check Issues for Fiberlogy

### Summary
- **Brand**: ${brand} (slug: fiberlogy)
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

## Required Actions for Fiberlogy

### 1. For Missing Products

If products are missing from the sync:
1. Open \`supabase/functions/_shared/fiberlogy-seed.ts\`
2. Add missing products to \`FIBERLOGY_PRODUCT_SEED\` array
3. Each entry needs: \`material\`, \`filament\`, \`color\`, \`productUrl\`
4. Run clean slate sync to refresh all data

### 2. For Color Hex Issues

If hex codes are incorrect or missing:
1. Open \`supabase/functions/_shared/fiberlogy-defaults.ts\`
2. Update \`FIBERLOGY_COLOR_MAPPING\` with correct hex values
3. For transparent colors, use 8-digit hex with alpha: \`#RRGGBBAA\`

\`\`\`typescript
// In fiberlogy-defaults.ts FIBERLOGY_COLOR_MAPPING
'navy blue transparent': '#00008099',
'pure transparent': '#FEFEFE',
\`\`\`

### 3. For Wrong Material Classification

If materials are incorrectly classified:
1. Open \`supabase/functions/_shared/fiberlogy-defaults.ts\`
2. Update \`FIBERLOGY_MATERIAL_MAPPING\` or \`enrichFiberlogyProduct()\`

### 4. For Missing TDS URLs

If TDS links are missing:
1. Open \`supabase/functions/_shared/fiberlogy-defaults.ts\`  
2. Add pattern to \`FIBERLOGY_TDS_PATTERNS\`
3. Follow format: \`'PRODUCT LINE': 'https://fiberlogy.com/wp-content/uploads/.../TDS.pdf'\`

### 5. For Wrong Product Line IDs

If product_line_id is incorrect:
1. Check \`generateFiberlogyProductLineId()\` logic in defaults file
2. Ensure filament name patterns match expected product lines

---

*Last Updated: ${new Date().toISOString().split('T')[0]}*`;
}

/**
 * Generate Extrudr-specific AI Fix Prompt with CSV-seeded architecture context
 */
function generateExtrudrFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['extrudr'];
  const role = AI_ROLES.extrudrSpecialist;
  
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

## CSV-SEEDED SYNC ARCHITECTURE

Extrudr sync uses a **hardcoded CSV seed** as the primary data source:

1. **EXTRUDR_PRODUCT_SEED** (~130 products) in \`extrudr-seed.ts\` contains:
   - Product names, colors, hex codes, image URLs from S3 bucket
   - Data sourced from manufacturer CSV export
   
2. **enrichExtrudrProduct()** in \`extrudr-defaults.ts\` enriches each product with:
   - Material classification (17+ product lines)
   - Finish type detection (Silk, Matte, etc.)
   - TPU Shore hardness (88A, 92A, 98A)
   - Print settings (temps, speeds)
   - TDS URL from EXTRUDR_TDS_URLS mapping
   
3. **EXTRUDR_COLOR_MAPPING** provides hex codes for colors

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE APPROACHES)

${lessons.workingSolutions.map(s => `${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID REPEATING)

${lessons.failedApproaches.map(f => `${f}`).join('\n')}

---

## CURRENT SYNC STATUS

| Metric | Value |
|--------|-------|
| **Total Products** | ${lessons.currentStatus.totalProducts} |
| **Image Coverage** | ${lessons.currentStatus.imageCoverage} |
| **Hex Coverage** | ${lessons.currentStatus.hexCoverage} |
| **TDS Coverage** | ${lessons.currentStatus.tdsCoverage} |

---

## KEY FILES FOR EXTRUDR

${lessons.keyFiles.map(f => `- \`${f}\``).join('\n')}

---

## Fix Post Sync Check Issues for Extrudr

### Summary
- **Brand**: ${brand} (slug: extrudr)
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

## Required Actions for Extrudr

### 1. For Missing Products

If products are missing from the sync:
1. Open \`supabase/functions/_shared/extrudr-seed.ts\`
2. Add missing products to \`EXTRUDR_PRODUCT_SEED\` array
3. Each entry needs: \`productLine\`, \`material\`, \`color\`, \`hex\`, \`imageUrl\`, \`productUrl\`
4. Run clean slate sync to refresh all data

### 2. For Color Hex Issues

If hex codes are incorrect or missing:
1. Open \`supabase/functions/_shared/extrudr-defaults.ts\`
2. Update \`EXTRUDR_COLOR_MAPPING\` with correct hex values
3. For transparent colors, use \`#FFFFFF\` as placeholder

\`\`\`typescript
// In extrudr-defaults.ts EXTRUDR_COLOR_MAPPING
'color name': '#HEXCODE',
\`\`\`

### 3. For TDS Coverage Issues

If TDS URLs are missing:
1. Open \`supabase/functions/_shared/extrudr-defaults.ts\`
2. Update \`EXTRUDR_TDS_URLS\` mapping with correct URLs
3. TDS PDFs are hosted at extrudr.com/pdf/

### 4. For Shore Hardness Issues

TPU variants should have correct Shore hardness:
- FLEX Semisoft → TPU-88A
- FLEX Medium → TPU-92A
- FLEX Hard → TPU-98A

Check \`enrichExtrudrProduct()\` for Shore hardness logic.

---

## Product Line Reference

| Slug | Display Name |
|------|--------------|
${Object.entries(lessons.productSlugReference || {}).map(([slug, name]) => `| ${slug} | ${name} |`).join('\n')}

---

## Verification Steps

After making fixes:

1. Run a **Clean Slate** sync for Extrudr from Brand Sync Manager
2. Check edge function logs for product counts
3. Run **Post Sync Check** again to verify all issues are resolved
4. Spot-check a few product cards to confirm:
   - Correct card count (~17 product lines)
   - Unique color swatches per product line
   - Colors match hex codes visually
   - TDS URLs are populated

---

*Last Updated: ${lessons.lastUpdated}*`;
}

/**
 * Generate Geeetech-specific AI Fix Prompt with lessons learned
 */
function generateGeeetechFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['geeetech'];
  const role = AI_ROLES.geeetechSpecialist;
  
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

## CSV-SEEDED SYNC ARCHITECTURE

Geeetech sync uses a **hardcoded CSV seed** as the primary data source:

1. **GEEETECH_PRODUCT_SEED** (168 products) in \`geeetech-seed.ts\` contains:
   - Product names, colors, hex codes, image URLs from geeetech.com
   - Data sourced from manually curated product catalog
   
2. **Helper functions** in \`geeetech-seed.ts\`:
   - \`getGeeetechProductLineFromMaterial()\` - Generates product_line_id from material
   - \`getGeeetechFinishFromMaterial()\` - Extracts finish type (Silk, Matte, etc.)
   - \`normalizeGeeetechMaterialFromSeed()\` - Normalizes material names
   
3. **Enrichment** from \`geeetech-defaults.ts\`:
   - \`getGeeetechPrintSettings()\` - Print settings by material type
   - HS-PLA detection sets \`high_speed_capable=true\`, \`print_speed_max_mms=300\`
   - Carbon Fiber detection sets \`is_nozzle_abrasive=true\`

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE APPROACHES)

${lessons.workingSolutions.map(s => `${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID REPEATING)

${lessons.failedApproaches.map(f => `${f}`).join('\n')}

---

## CURRENT SYNC STATUS

| Metric | Value |
|--------|-------|
| **CSV Seed Products** | ${lessons.currentStatus.csvSeedProducts} |
| **Product Lines** | ${lessons.currentStatus.productLines} |
| **Materials Supported** | ${lessons.currentStatus.materialsSupported} |
| **Image Coverage** | ${lessons.currentStatus.imageCoverage} |
| **Hex Coverage** | ${lessons.currentStatus.hexCoverage} |

---

## KEY FILES FOR GEEETECH

${lessons.keyFiles.map(f => `- \`${f}\``).join('\n')}

---

## Fix Post Sync Check Issues for Geeetech

### Summary
- **Brand**: ${brand} (slug: geeetech)
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

## Required Actions for Geeetech

### 1. For Missing Products

If products are missing from the sync:
1. Open \`supabase/functions/_shared/geeetech-seed.ts\`
2. Add missing products to \`GEEETECH_PRODUCT_SEED\` array
3. Each entry needs: \`material\`, \`title\`, \`url\`, \`color\`, \`imageUrl\`, \`hexCode\` (optional)
4. Run clean slate sync to refresh all data

### 2. For Product Line ID Issues

If products are not grouping correctly:
1. Check \`getGeeetechProductLineFromMaterial()\` in \`geeetech-seed.ts\`
2. Material patterns map to product line slugs:
   - 'HS-PLA' → 'hs-pla'
   - 'PLA Silk Dual' → 'pla-silk-dual'
   - 'PLA Matte' → 'pla-matte'
   - 'PLA Luminous' → 'pla-luminous'
   - 'PETG Metallic' → 'petg-metallic'

### 3. For Color Hex Issues

If hex codes are incorrect or missing:
1. Add hex codes directly in \`GEEETECH_PRODUCT_SEED\` entries
2. Use format: \`hexCode: '#FF0000'\`
3. For multi-color products (Dual, Tri, Rainbow), use dominant color

### 4. For High-Speed Detection Issues

HS-PLA products should have:
- \`high_speed_capable: true\`
- \`print_speed_max_mms: 300\`

The sync function detects this from material name containing 'hs-pla' or 'high speed'.

### 5. For Finish Type Issues

Finish types are extracted by \`getGeeetechFinishFromMaterial()\`:
- 'Silk' → Silk finish
- 'Matte' → Matte finish
- 'Luminous' → Glow finish
- 'Sparkly' → Sparkle finish
- 'Gradient' / 'Rainbow' → Gradient finish
- 'Marble' → Marble finish

---

## Product Line Reference

| Slug | Display Name |
|------|--------------|
${Object.entries(lessons.productSlugReference || {}).map(([slug, name]) => `| ${slug} | ${name} |`).join('\n')}

---

## Cross-Product Swatch Architecture

Geeetech uses **cross-product swatches** where each color is a separate product URL:
- This is by design (OpenCart platform limitation)
- URL consistency checks are SKIPPED for this brand
- Grouping is done by \`product_line_id\`, not URL

---

## Verification Steps

After making fixes:

1. Run a **Clean Slate** sync for Geeetech from Brand Sync Manager
2. Check edge function logs for product counts (expect 168 products)
3. Run **Post Sync Check** again to verify all issues are resolved
4. Spot-check a few product cards to confirm:
   - Correct card count (18 product lines)
   - Unique color swatches per product line
   - HS-PLA products show 300mm/s print speed
   - Colors match hex codes visually

---

*Last Updated: ${lessons.lastUpdated}*`;
}

/**
 * Generate Matter3D-specific AI Fix Prompt with comprehensive root cause analysis
 * Goal: Fix ALL issues in a single pass with zero remaining issues after the next sync
 */
function generateMatter3dFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['matter3d'];
  const role = AI_ROLES.matter3dSpecialist;
  
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

## GOAL: Fix ALL Issues in ONE Pass

This prompt is structured to fix every sync issue systematically. Follow the numbered steps in order.
**After implementing these fixes, the next Post Sync Check should show ZERO errors.**

---

## CRITICAL PLATFORM CONTEXT

**Platform**: ${lessons.platform}
**This IS a Shopify store** - but with non-standard variant structure (Size/Color/Spool in options).

---

## CORE CAPABILITIES

${role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n')}

---

## ROOT CAUSE ANALYSIS

The following issues are interconnected. Fixing them in the correct order is critical.

### RC1: Incorrect Color Extraction from Shopify Variant Options
**Affected Checks:**
- Color Names Match (missing colors like "magenta")
- Swatch Uniqueness (missing color_hex)
- Color Variant Count (missing hex)
- Detail Page Content (incomplete swatches)

**Root Cause:** The \`extractColorFromShopifyVariant()\` function fails when:
- option2 contains spool type ("Cardboard", "Plastic") instead of color
- option1 contains size ("1 kg") instead of color
- Some products use 3-option structure: Size/Color/Spool
- Some products use 2-option structure: Size/Color or Color/Size

**Fix Location:** \`supabase/functions/sync-matter3d-products/index.ts\`

### RC2: Over-Granular Product Line IDs
**Affected Checks:**
- Filament Card Count (30 vs 18 expected)

**Root Cause:** Weight suffixes like \`-0.5kg\`, \`-5kg\`, \`-1kg\` are creating separate product lines when they should be consolidated.

**Fix Location:** \`supabase/functions/_shared/matter3d-defaults.ts\` - \`generateMatter3dProductLineId()\`

### RC3: Insufficient Product Filtering
**Affected Checks:**
- Title Accuracy (pellet products in DB)
- Price Validity (industrial bulk pricing)
- Image Quality (pellet product images)

**Root Cause:** \`shouldSkipMatter3dProduct()\` doesn't filter:
- Pellets and industrial products
- Custom color orders
- CMYK bundles
- Products over $100 (non-standard consumer products)
- "Single" placeholder variants

**Fix Location:** \`supabase/functions/sync-matter3d-products/index.ts\`

### RC4: Title Construction Creates Double Dashes
**Affected Checks:**
- Title Accuracy (titles like "Performance ASA - - Red")

**Root Cause:** \`cleanMatter3dTitle()\` leaves trailing dashes, then color is appended with another dash.

**Fix Location:** \`supabase/functions/sync-matter3d-products/index.ts\`

### RC5: Missing Color Hex Mappings
**Affected Checks:**
- Swatch Uniqueness (variants missing color_hex)
- Color Variant Count (missing hex codes)

**Root Cause:** \`MATTER3D_COLOR_MAP\` in \`matter3d-defaults.ts\` is missing mappings for matte colors and some specialty colors.

**Fix Location:** \`supabase/functions/_shared/matter3d-defaults.ts\`

---

## FIX IMPLEMENTATION ORDER (Follow Exactly)

### Step 1: Fix Product Filtering (CRITICAL - Must be done first)

**File:** \`supabase/functions/sync-matter3d-products/index.ts\`

Update \`shouldSkipMatter3dProduct()\` to filter ALL non-standard products:

\`\`\`typescript
function shouldSkipMatter3dProduct(product: ShopifyProduct, variant: ShopifyProduct['variants'][0]): boolean {
  const title = product.title.toLowerCase();
  const variantTitle = (variant.title || '').toLowerCase();
  const price = parseFloat(variant.price || '0');
  
  // Skip pellets (industrial format)
  if (/pellets?|granules?/i.test(title)) {
    console.log(\`[Matter3D] SKIP pellets: \${product.title}\`);
    return true;
  }
  
  // Skip custom color orders
  if (/custom\\s*colou?r/i.test(title)) {
    console.log(\`[Matter3D] SKIP custom color: \${product.title}\`);
    return true;
  }
  
  // Skip bundles and bulk buy multi-packs
  if (/bundle|cmyk|multi.?pack|\\d+\\s*rolls?/i.test(title)) {
    console.log(\`[Matter3D] SKIP bundle: \${product.title}\`);
    return true;
  }
  
  // Skip conductive/specialty materials
  if (/conductive|cnt|esd/i.test(title)) {
    console.log(\`[Matter3D] SKIP specialty: \${product.title}\`);
    return true;
  }
  
  // Skip "Single" placeholder variants (not real color)
  const color = variant.option2 || variant.option1 || '';
  if (/^single$/i.test(color.trim())) {
    console.log(\`[Matter3D] SKIP single placeholder: \${variant.title}\`);
    return true;
  }
  
  // Skip Default Title variants (non-color products)
  if (variant.option1 === 'Default Title') {
    console.log(\`[Matter3D] SKIP default title: \${product.title}\`);
    return true;
  }
  
  // Skip very high price items (>$100 for single unit typically indicates bulk/industrial)
  if (price > 100) {
    console.log(\`[Matter3D] SKIP high price: \${product.title} ($\${price})\`);
    return true;
  }
  
  return false;
}
\`\`\`

---

### Step 2: Fix Color Extraction (CRITICAL - Depends on Step 1)

**File:** \`supabase/functions/sync-matter3d-products/index.ts\`

The current extraction picks up spool types ("Cardboard", "Plastic") as colors. Fix:

\`\`\`typescript
// Add spool type detection to skip non-color values
function isWeightOrSizeOrSpool(value: string | null): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  
  // Weight/size patterns
  if (/^\\d+(\\.\\d+)?\\s*(kg|g|mm|lb|oz)$/i.test(v)) return true;
  if (/^(1\\.75|2\\.85|3\\.0)\\s*mm$/i.test(v)) return true;
  if (/^\\d+\\s*kg$/i.test(v)) return true;
  if (/^(0\\.5|1|2|5|10)\\s*kg$/i.test(v)) return true;
  
  // Spool type patterns - these are NOT colors
  if (/cardboard|plastic/i.test(v)) return true;
  
  // Quantity patterns
  if (/100 kg minimum|quote|single|default/i.test(v)) return true;
  
  return false;
}

function extractColorFromShopifyVariant(variant: any): string | null {
  // Priority: option2 > option1 > option3
  // But skip if it's weight/size/spool
  
  // Option2 is usually the color for Matter3D
  if (variant.option2 && !isWeightOrSizeOrSpool(variant.option2)) {
    return variant.option2.trim();
  }
  
  // Option1 might be color for simple products
  if (variant.option1 && !isWeightOrSizeOrSpool(variant.option1)) {
    return variant.option1.trim();
  }
  
  // Option3 fallback (rare)
  if (variant.option3 && !isWeightOrSizeOrSpool(variant.option3)) {
    return variant.option3.trim();
  }
  
  console.log(\`[Matter3D] No valid color found for variant: \${variant.title}\`);
  return null;
}
\`\`\`

---

### Step 3: Fix Product Line ID Generation (HIGH - Depends on Step 2)

**File:** \`supabase/functions/_shared/matter3d-defaults.ts\`

Remove ALL weight suffixes to consolidate variants:

\`\`\`typescript
export function generateMatter3dProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeMatter3dMaterial(title) || 'unknown';
  const matLower = mat.toLowerCase().replace(/-/g, '_');
  const titleLower = title.toLowerCase();
  
  // Detect series (mutually exclusive)
  const isEssentials = /essentials?/i.test(titleLower);
  const isPerformance = /performance/i.test(titleLower);
  const isBasics = /basics?/i.test(titleLower);
  
  // Detect finish types
  const isMatte = /matte/i.test(titleLower);
  const isSilk = /silk/i.test(titleLower);
  const isCarbon = /carbon|\\bcf\\b/i.test(titleLower);
  const isRecycled = /recycled/i.test(titleLower);
  const isHF = /high.?flow|\\bhf\\b/i.test(titleLower);
  
  // Build base product line ID
  let lineId = \`matter3d__\${matLower}\`;
  
  // Add series suffix
  if (isEssentials) {
    lineId += '__essentials';
  } else if (isPerformance) {
    lineId += '__performance';
  } else if (isBasics) {
    lineId += '__basics';
  } else {
    lineId += '__standard';
  }
  
  // Add finish suffix
  if (isMatte) {
    lineId += '-matte';
  } else if (isSilk) {
    lineId += '-silk';
  } else if (isCarbon && !matLower.includes('cf')) {
    lineId += '-cf';
  } else if (isRecycled) {
    lineId += '-recycled';
  }
  
  // Add high-flow suffix for PETG HF
  if (isHF) {
    lineId += '-hf';
  }
  
  // DO NOT add weight suffixes - consolidate all weights into same product line
  // 500g, 1kg, 5kg variants all belong to the same product line
  
  return lineId;
}
\`\`\`

---

### Step 4: Fix Title Construction (MEDIUM - Depends on Step 2)

**File:** \`supabase/functions/sync-matter3d-products/index.ts\`

Prevent double-dash artifacts:

\`\`\`typescript
function buildVariantTitle(cleanedTitle: string, colorName: string | null): string {
  // Remove any trailing dashes or spaces from cleaned title
  let baseTitle = cleanedTitle.replace(/[\\s-]+$/, '').trim();
  
  if (colorName) {
    // Don't add color if it's already in the title
    const colorLower = colorName.toLowerCase();
    if (!baseTitle.toLowerCase().includes(colorLower)) {
      return \`\${baseTitle} - \${colorName}\`;
    }
  }
  
  return baseTitle;
}
\`\`\`

---

### Step 5: Add Missing Color Hex Mappings (LOW - Independent)

**File:** \`supabase/functions/_shared/matter3d-defaults.ts\`

Add to \`MATTER3D_COLOR_MAP\`:

\`\`\`typescript
// Matte colors (often missing)
'matte black': '1A1A1A',
'matte white': 'F5F5F5',
'matte grey': '808080',
'matte gray': '808080',
'matte red': 'B22222',
'matte blue': '1E3A5F',
'matte green': '228B22',

// Differentiate similar colors (CRITICAL to prevent duplicate hex)
'fuchsia': 'FF00FF',
'magenta': 'FF0099',
'fuchsia/magenta': 'FF00CC',

// Specialty colors
'dark/forest green': '228B22',
'transparent / natural': 'DEB887',
'transparent/natural': 'DEB887',
'fighter jet blue': '1E3A5F',
'ocean blue': '006994',
'cayman blue': '00C5CD',
'clay/brick red': 'CB4154',
'gunmetal grey': '2A3439',
'gunmetal gray': '2A3439',
\`\`\`

---

### Step 6: Update Expected Card Count

**File:** \`supabase/functions/run-post-sync-check/index.ts\`

In \`EXPECTED_CARD_COUNTS\`, set:
\`\`\`typescript
'matter3d': 18,  // Consolidated from 30 after removing weight suffixes
\`\`\`

---

## EXPECTED PRODUCT LINES (18 total)

After fixes, these should be the only product_line_ids:

| Product Line ID | Description |
|-----------------|-------------|
| matter3d__pla__basics | Basics PLA (standard) |
| matter3d__pla__basics-matte | Basics PLA Matte |
| matter3d__pla__basics-silk | Basics PLA Silk |
| matter3d__pla__basics-cf | Basics PLA Carbon Fiber |
| matter3d__pla__basics-recycled | Basics Recycled PLA |
| matter3d__pla__performance | Performance PLA |
| matter3d__pla__performance-matte | Performance PLA Matte |
| matter3d__pla__essentials | Essentials PLA |
| matter3d__pla_plus__performance | Performance PLA+ |
| matter3d__petg__performance | Performance PETG |
| matter3d__petg__performance-matte | Performance PETG Matte |
| matter3d__petg__performance-hf | Performance PETG High-Flow |
| matter3d__petg__performance-cf-hf | Performance PETG CF High-Flow |
| matter3d__petg__standard | Standard PETG |
| matter3d__asa__performance | Performance ASA |
| matter3d__abs__performance-cf | Performance ABS Carbon Fiber |
| matter3d__pa__performance | Performance PA (Nylon) |
| matter3d__pa_cf__performance-cf | Performance PA Carbon Fiber |
| matter3d__tpu_95a__standard | Standard TPU 95A |

---

## VERIFICATION CHECKLIST

After implementing fixes, verify each assertion:

### Filtering Verification
\`\`\`sql
-- Should return 0 rows
SELECT * FROM filaments WHERE vendor ILIKE '%matter3d%' AND product_title ILIKE '%pellet%';

-- Should return 0 rows
SELECT * FROM filaments WHERE vendor ILIKE '%matter3d%' AND variant_price > 100;

-- Should return 0 rows (no bundles)
SELECT * FROM filaments WHERE vendor ILIKE '%matter3d%' AND product_title ILIKE '%cmyk%';
\`\`\`

### Color Extraction Verification
\`\`\`sql
-- Should return 0 rows (no spool types as colors)
SELECT * FROM filaments 
WHERE vendor ILIKE '%matter3d%' 
AND (product_title ILIKE '% - Cardboard%' OR product_title ILIKE '% - Plastic%');

-- Color hex population should be >95%
SELECT 
  COUNT(*) AS total,
  COUNT(color_hex) AS with_hex,
  ROUND(100.0 * COUNT(color_hex) / COUNT(*), 1) AS percent_with_hex
FROM filaments WHERE vendor ILIKE '%matter3d%';
\`\`\`

### Product Line Verification
\`\`\`sql
-- Should return exactly 18 unique product lines (or close to it)
SELECT DISTINCT product_line_id 
FROM filaments 
WHERE vendor ILIKE '%matter3d%' 
ORDER BY product_line_id;

-- Should return 0 rows (no weight suffixes)
SELECT DISTINCT product_line_id 
FROM filaments 
WHERE vendor ILIKE '%matter3d%' 
AND (product_line_id LIKE '%-0.5kg' OR product_line_id LIKE '%-5kg' OR product_line_id LIKE '%-1kg');
\`\`\`

### Title Verification
\`\`\`sql
-- Should return 0 rows (no double dashes)
SELECT * FROM filaments 
WHERE vendor ILIKE '%matter3d%' 
AND product_title LIKE '% - - %';
\`\`\`

---

## CURRENT STATUS

- **Total Products in DB**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

---

## Issues Found

${issuesSummary}

---

## Detailed Issues

${detailedIssues}
${aiInsightsSection}

---

## KEY FILES FOR MATTER3D

- \`supabase/functions/sync-matter3d-products/index.ts\` - Main sync function
- \`supabase/functions/_shared/matter3d-defaults.ts\` - Color mappings, enrichment, product line ID

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE)

${lessons.workingSolutions.map(s => `${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID)

${lessons.failedApproaches.map(f => `${f}`).join('\n')}

---

## SYNC EXECUTION STEPS

1. **Deploy** updated edge functions (\`sync-matter3d-products\` and \`run-post-sync-check\`)
2. **Run Clean Slate** sync for Matter3D from Brand Sync Manager
3. **Check edge function logs** for:
   - "SKIP pellets" messages (filtering working)
   - "No valid color found" messages (should be minimal)
   - Product count around ~150-200 (after filtering bulk/pellets)
4. **Run Post Sync Check** again - should show 0 errors
5. **Spot-check** a few product cards to confirm:
   - Correct card count (~18 product lines)
   - No duplicate color swatches
   - Colors match hex codes visually
   - No double-dash titles

---

*Last Updated: ${lessons.lastUpdated}*`;
}

/**
 * Generate NinjaTek-specific AI Fix Prompt with comprehensive context
 */
function generateNinjatekFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['ninjatek'];
  const role = AI_ROLES.ninjatekSpecialist;
  
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

**Extraction Pattern**:
${aiAnalysis.extractionPattern}

**Missing Reason**:
${aiAnalysis.missingReason}

### Missing Color Hex Mappings

Add these to NINJATEK_COLOR_MAPPING in \`_shared/ninjatek-defaults.ts\`:

\`\`\`typescript
${Object.entries(aiAnalysis.colorMappings || {}).map(([name, hex]) => `'${name.toLowerCase()}': '${hex}',`).join('\n')}
\`\`\`

---`;
  }

  return `# ${role.title} - NinjaTek Post Sync Check Fixes

You are the **${role.title}** for Filascope, a comprehensive 3D printing filament database and comparison platform.

## CORE CAPABILITIES

${role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n')}

## CRITICAL LESSONS LEARNED

${(role as any).lessons?.map((lesson: string) => `- ${lesson}`).join('\n') || 'See BRAND_LESSONS_LEARNED for details.'}

---

## NINJATEK PLATFORM OVERVIEW

**Website**: ninjatek.com (WooCommerce/WordPress)
**Sync Architecture**: CSV-seeded (NOT live scraping)
**Primary Data Source**: NINJATEK_SEED_DATA constant in sync function
**Parent Company**: Fenner Precision Polymers (premium TPU manufacturer)

### Product Line Architecture

NinjaTek sells two categories:
1. **NinjaTek TPU Products** (5 lines) - Premium flexible filaments
   - NinjaFlex 85A (11 colors) - Original soft TPU
   - Edge 83A (2 colors) - Improved tear/chemical resistance
   - Chinchilla 75A (4 colors) - Softest, skin-safe
   - Cheetah 95A (11 colors) - Fastest printing semi-flex
   - Armadillo 75D (9 colors) - Rigid, abrasion resistant
   
2. **ColorFabb Reseller Products** (4 lines) - European materials
   - colorFabb ASA (2 colors)
   - colorFabb PLA (12 colors)
   - colorFabb Co-Polyesters (14 colors) - nGen, HT, XT lines
   - colorFabb Specials (7 colors) - Fills, allPHA

### Excluded Products (NOT synced)

- **Eel 90A (Conductive TPU)**: Only has diameter variants (1.75mm, 3mm), no colors
- **colorFabb PA (Nylon)**: Only has diameter variants, no colors
- **All 2.85mm/3mm variants**: Consumer focus on 1.75mm only
- **Bulk products (>5.5kg)**: Industrial, not consumer
- **Sample products (<300g)**: Non-standard spool sizes

---

## ROOT CAUSE ANALYSIS FRAMEWORK

When diagnosing NinjaTek sync issues, check in this order:

### RC1: CSV Seed Data Issues
- Is the product missing from NINJATEK_SEED_DATA?
- Is the CSV row format correct (material,name,url,color,image)?
- Are excluded products (Eel, colorFabb PA) incorrectly included?

### RC2: Color Extraction Issues
- Is the color correctly extracted from CSV column 4?
- Is the color name normalized for hex lookup?
- Is there a duplicate hex within the product line?

### RC3: Product Line ID Issues
- Is the product_line_id correctly generated (ninjatek__material__line)?
- Are ColorFabb products using colorfabb-* prefix in line slug?
- Is Shore hardness correctly parsed for material type?

### RC4: Material Classification Issues
- Is TPU Shore hardness correctly identified (75A, 83A, 85A, 90A, 95A, 75D)?
- Is ColorFabb material correctly mapped (ASA, PLA, Copolyester)?
- Are nGen/HT/XT correctly classified as Copolyester?

### RC5: Enrichment Issues
- Are print settings correct for the Shore hardness?
- Is TDS URL populated for NinjaTek products?
- Is shore_hardness_d field set correctly?

---

## FIX IMPLEMENTATION ORDER

### Step 1: Check CSV Seed Data

**File:** \`supabase/functions/sync-ninjatek-products/index.ts\`

Verify NINJATEK_SEED_DATA contains the product. Check for:
- Correct row format: \`material,name,url,color,image\`
- No extra whitespace or malformed entries
- Excluded entries in EXCLUDED_ENTRIES constant

### Step 2: Fix Color Extraction

**File:** \`supabase/functions/_shared/ninjatek-defaults.ts\`

The \`extractColorFromTitle()\` function extracts color from CSV. Check:
- Color name normalization (lowercase, trim)
- Multi-word colors handled correctly

### Step 3: Fix Hex Lookup

**File:** \`supabase/functions/_shared/ninjatek-defaults.ts\`

Add missing colors to NINJATEK_COLOR_MAPPING:

\`\`\`typescript
export const NINJATEK_COLOR_MAPPING: Record<string, string> = {
  // NinjaFlex colors
  'midnight': '#1A1A2E',
  'snow': '#FFFAFA',
  'water': '#87CEEB',
  // ... add missing colors here
};
\`\`\`

### Step 4: Fix Product Line ID Generation

**File:** \`supabase/functions/_shared/ninjatek-defaults.ts\`

Check \`generateNinjatekProductLineId()\` logic:

\`\`\`typescript
// NinjaTek TPU products: ninjatek__tpu_85a__ninjaflex
// ColorFabb products: ninjatek__asa__colorfabb-asa
\`\`\`

### Step 5: Fix Material Classification

**File:** \`supabase/functions/_shared/ninjatek-defaults.ts\`

Check \`normalizeNinjatekMaterial()\` and \`extractProductLine()\`:

| Line | Material | Shore Hardness |
|------|----------|----------------|
| NinjaFlex | TPU-85A | 85 (Shore A) |
| Edge | TPU-83A | 83 (Shore A) |
| Chinchilla | TPU-75A | 75 (Shore A) |
| Cheetah | TPU-95A | 95 (Shore A) |
| Armadillo | TPU-75D | 75 (Shore D) |

---

## VERIFICATION QUERIES

### Product Line Count (should be 10)
\`\`\`sql
SELECT COUNT(DISTINCT product_line_id) as product_lines
FROM filaments WHERE vendor ILIKE '%ninjatek%';
\`\`\`

### Product Breakdown by Line
\`\`\`sql
SELECT product_line_id, COUNT(*) as variants
FROM filaments WHERE vendor ILIKE '%ninjatek%'
GROUP BY product_line_id ORDER BY product_line_id;
\`\`\`

### Hex Coverage (should be ~100%)
\`\`\`sql
SELECT 
  COUNT(*) as total,
  COUNT(color_hex) as with_hex,
  ROUND(100.0 * COUNT(color_hex) / COUNT(*), 1) as percent
FROM filaments WHERE vendor ILIKE '%ninjatek%';
\`\`\`

### TDS Coverage (NinjaTek lines only)
\`\`\`sql
SELECT 
  COUNT(*) as total,
  COUNT(tds_url) as with_tds
FROM filaments 
WHERE vendor ILIKE '%ninjatek%'
AND product_line_id NOT LIKE '%colorfabb%';
\`\`\`

### Shore Hardness Verification
\`\`\`sql
SELECT DISTINCT product_line_id, shore_hardness_d
FROM filaments WHERE vendor ILIKE '%ninjatek%'
ORDER BY product_line_id;
\`\`\`

### No Excluded Products
\`\`\`sql
-- Should return 0 rows
SELECT * FROM filaments 
WHERE vendor ILIKE '%ninjatek%' 
AND (product_title ILIKE '%eel%' OR product_title ILIKE '%colorFabb PA%');
\`\`\`

---

## CURRENT STATUS

- **Total Products in DB**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

---

## Issues Found

${issuesSummary}

---

## Detailed Issues

${detailedIssues}
${aiInsightsSection}

---

## KEY FILES FOR NINJATEK

- \`supabase/functions/sync-ninjatek-products/index.ts\` - Main sync function with CSV seed
- \`supabase/functions/_shared/ninjatek-defaults.ts\` - Enrichment, color mappings, TDS URLs

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE)

${lessons.workingSolutions.map(s => `${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID)

${lessons.failedApproaches.map(f => `${f}`).join('\n')}

---

## SYNC EXECUTION STEPS

1. **Deploy** updated edge functions (\`sync-ninjatek-products\` and \`run-post-sync-check\`)
2. **Run Clean Slate** sync for NinjaTek from Brand Sync Manager
3. **Check edge function logs** for:
   - Skipped entries logged (Eel 90A, colorFabb PA)
   - Product count around ~70 variants
   - 10 unique product_line_ids
4. **Run Post Sync Check** again - should show 0 errors
5. **Spot-check** a few product cards to confirm:
   - Correct card count (10 product lines)
   - Shore hardness displayed correctly
   - TDS links work for NinjaTek products
   - ColorFabb products separated correctly

---

*Last Updated: ${lessons.lastUpdated}*`;
}

/**
 * Generate Numakers-specific AI Fix Prompt with comprehensive context
 */
function generateNumakersFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['numakers'];
  const role = AI_ROLES.numakersSpecialist;
  
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

${aiAnalysis.correctBehavior ? `### Correct Behavior Expected
${aiAnalysis.correctBehavior}
` : ''}

**Extraction Pattern**: ${aiAnalysis.extractionPattern}
**Missing Reason**: ${aiAnalysis.missingReason}

### Missing Color Hex Mappings
Add these to NUMAKERS_COLOR_MAPPING in \`_shared/numakers-defaults.ts\`:
\`\`\`typescript
${Object.entries(aiAnalysis.colorMappings || {}).map(([c, h]) => `'${c}': '${h}',`).join('\n')}
\`\`\`
`;
  }

  return `# Numakers Integration Specialist - Post Sync Check Fixes

You are the **${role.title}** for Filascope, a comprehensive 3D printing filament database and comparison platform.

## CORE CAPABILITIES

${role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n')}

## CRITICAL LESSONS LEARNED

${(role.lessons || []).map(l => `- ${l}`).join('\n')}

---

## NUMAKERS PLATFORM OVERVIEW

**Website**: numakers.com (Shopify)
**Sync Architecture**: CSV-seeded (NUMAKERS_SEED_DATA)
**Spool Weight**: 1kg standard (no bulk options sold individually)
**Diameter**: 1.75mm only (no 2.85mm products)
**Currency**: USD only

### Product Line Architecture (13 lines)

| Product Line | Material | Colors | URL |
|--------------|----------|--------|-----|
| PLA+ Filament | PLA+ | 35 | /products/pla-filament |
| PLA Silk | PLA-SILK | 11 | /products/pla-silk |
| Tri-Color Silk PLA | PLA-SILK | 9 | /products/tri-color-silk-pla |
| PLA Matte | PLA-MATTE | 13 | /products/pla-matte |
| PLA Starlight | PLA-STARLIGHT | 5 | /products/pla-starlight |
| PLA Glow in the Dark | PLA-GLOW | 5 | /products/pla-glow-in-the-dark |
| PLA Marble | PLA-MARBLE | 1 | /products/pla-marble |
| PLA Wood | PLA-WOOD | 1 | /products/pla-wood |
| PLA-CF | PLA-CF | 4 | /products/pla-cf |
| PETG-HS Filament | PETG-HS | 16 | /products/petg-hs-filament |
| PETG Translucent | PETG-TRANSLUCENT | 9 | /products/petg-translucent |
| ASA Filament | ASA | 8 | /products/asa-filament |
| ABS Filament | ABS | 8 | /products/abs-filament |

### Excluded Products (NOT synced)
- **NuBox Surplus** (Printzy's Laboratory) - Subscription mystery items
- **Hueforge Packs** - Multi-spool bundles
- **Warehouse Clearance** - Older formula mystery colors

### Cheat Sheet URLs (TDS Equivalent)
- PLA+: numakers.com/blogs/news/pla-plus-{slicer}-settings
- PETG: numakers.com/blogs/news/petg-{slicer}
- ASA: numakers.com/blogs/news/asa-{slicer}
- ABS: numakers.com/blogs/news/abs-filament-{slicer}
- PLA Silk: numakers.com/blogs/news/pla-silk-{slicer}
- PLA-CF: numakers.com/blogs/news/pla-cf-{slicer}

---

## ROOT CAUSE ANALYSIS FRAMEWORK

When diagnosing Numakers sync issues, check in this order:

### RC1: CSV Seed Data Issues
- Is the product missing from NUMAKERS_SEED_DATA?
- Is the entry format correct (material, filamentLine, productUrl, color, imageUrl, colorHex)?
- Are excluded products (NuBox, Hueforge, Clearance) incorrectly included?

### RC2: Color Extraction Issues
- Is the color correctly spelled in the seed data?
- Is there a hex code in colorHex field, or is it falling back to NUMAKERS_COLOR_MAPPING?
- Is the color name normalized correctly for lookup?

### RC3: Product Line ID Issues
- Is generateNumakersProductLineId() producing correct IDs?
- Are Tri-Color Silk products separated from regular Silk?
- Is PETG-HS separated from PETG Translucent?

### RC4: Material Classification Issues
- Is the material field correct (PLA+, PLA-SILK, PETG-HS, etc.)?
- Are specialty lines (Starlight, Glow, Marble, Wood) correctly identified?
- Are finish types (Silk, Matte, etc.) being detected?

### RC5: Image URL Issues
- Does the image URL follow Shopify CDN pattern?
- Is the color name correctly formatted for URL (underscores, no spaces)?
- Are there broken image links in the seed data?

---

## FIX IMPLEMENTATION ORDER

### Step 1: Check CSV Seed Data
**File:** \`supabase/functions/_shared/numakers-defaults.ts\`

Verify NUMAKERS_SEED_DATA contains the product:
\`\`\`typescript
{ 
  material: 'PLA+', 
  filamentLine: 'PLA+ Filament', 
  productUrl: 'https://numakers.com/products/pla-filament', 
  color: 'Thanos Purple', 
  imageUrl: 'https://cdn.shopify.com/...', 
  colorHex: '#663399' 
}
\`\`\`

### Step 2: Fix Color Mapping (if colorHex missing in seed)
**File:** \`supabase/functions/_shared/numakers-defaults.ts\`

Add to NUMAKERS_COLOR_MAPPING:
\`\`\`typescript
export const NUMAKERS_COLOR_MAPPING: Record<string, string> = {
  'thanos purple': '#663399',
  'dragon\\'s hide': '#2F4F4F',
  'ryobix green': '#9ACD32',
  'molten sol': '#FF4500',
  // ... add missing colors
};
\`\`\`

### Step 3: Fix Product Line ID Generation
**File:** \`supabase/functions/_shared/numakers-defaults.ts\`

Check generateNumakersProductLineId() logic ensures:
- PLA+ → numakers__pla-plus__pla-plus-filament
- PLA Silk → numakers__pla-silk__pla-silk
- Tri-Color Silk → numakers__pla-silk__tri-color-silk-pla
- PETG-HS → numakers__petg-hs__petg-hs-filament
- PETG Translucent → numakers__petg-translucent__petg-translucent

### Step 4: Fix Exclusion Logic
**File:** \`supabase/functions/_shared/numakers-defaults.ts\`

Verify shouldExcludeNumakersProduct() catches:
\`\`\`typescript
export function shouldExcludeNumakersProduct(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes('nubox') ||
         t.includes('laboratory') ||
         t.includes('hueforge') ||
         t.includes('clearance') ||
         t.includes('surplus') ||
         t.includes('mystery');
}
\`\`\`

---

## VERIFICATION QUERIES

### Product Line Count (should be 13)
\`\`\`sql
SELECT COUNT(DISTINCT product_line_id) as product_lines
FROM filaments WHERE vendor ILIKE '%numakers%';
\`\`\`

### Product Breakdown by Line
\`\`\`sql
SELECT product_line_id, COUNT(*) as variants
FROM filaments WHERE vendor ILIKE '%numakers%'
GROUP BY product_line_id ORDER BY product_line_id;
\`\`\`

### Hex Coverage (should be 100%)
\`\`\`sql
SELECT 
  COUNT(*) as total,
  COUNT(color_hex) as with_hex,
  ROUND(100.0 * COUNT(color_hex) / COUNT(*), 1) as percent
FROM filaments WHERE vendor ILIKE '%numakers%';
\`\`\`

### Image Coverage (should be 100%)
\`\`\`sql
SELECT 
  COUNT(*) as total,
  COUNT(featured_image) as with_image,
  ROUND(100.0 * COUNT(featured_image) / COUNT(*), 1) as percent
FROM filaments WHERE vendor ILIKE '%numakers%';
\`\`\`

### No Excluded Products (should return 0)
\`\`\`sql
SELECT * FROM filaments 
WHERE vendor ILIKE '%numakers%' 
AND (product_title ILIKE '%nubox%' OR product_title ILIKE '%hueforge%' OR product_title ILIKE '%clearance%');
\`\`\`

### Price Range Validation
\`\`\`sql
SELECT MIN(variant_price) as min_price, MAX(variant_price) as max_price
FROM filaments WHERE vendor ILIKE '%numakers%';
-- Expected: $17.99 - $32.99
\`\`\`

---

## Fix Post Sync Check Issues for Numakers

### Summary
- **Brand**: ${brand} (slug: numakers)
- **Total Products**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

### Issues Found
${issuesSummary || 'None - all checks passing!'}

---

## Detailed Issues

${detailedIssues}
${aiInsightsSection}

---

## KEY FILES FOR NUMAKERS

- \`supabase/functions/sync-numakers-products/index.ts\` - Main sync function with CSV seed
- \`supabase/functions/_shared/numakers-defaults.ts\` - NUMAKERS_SEED_DATA, color mappings, cheat sheets

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE)

${lessons.workingSolutions.map(s => `${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID)

${lessons.failedApproaches.map(f => `${f}`).join('\n')}

---

## SYNC EXECUTION STEPS

1. **Deploy** updated edge functions (\`sync-numakers-products\` and \`run-post-sync-check\`)
2. **Run Clean Slate** sync for Numakers from Brand Sync Manager
3. **Check edge function logs** for:
   - Skipped entries logged (NuBox, Hueforge, Clearance)
   - Product count around ~130 variants
   - 13 unique product_line_ids
4. **Run Post Sync Check** again - should show 0 errors
5. **Spot-check** a few product cards to confirm:
   - Correct card count (13 product lines)
   - Creative color names displayed correctly
   - Cheat Sheet links work
   - Tri-color products show representative hex

---

*Last Updated: ${lessons.lastUpdated}*`;
}

/**
 * Generate Overture-specific AI Fix Prompt with comprehensive context
 */
function generateOvertureFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['overture'];
  const role = AI_ROLES.overtureSpecialist;
  
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

${aiAnalysis.correctBehavior ? `### Correct Behavior Expected
${aiAnalysis.correctBehavior}
` : ''}

**Extraction Pattern**: ${aiAnalysis.extractionPattern}
**Missing Reason**: ${aiAnalysis.missingReason}

### Missing Color Hex Mappings
Add these to OVERTURE_EXTENDED_COLOR_MAP in \`_shared/overture-seed.ts\`:
\`\`\`typescript
${Object.entries(aiAnalysis.colorMappings || {}).map(([c, h]) => `'${c}': '${h}',`).join('\n')}
\`\`\`
`;
  }

  return `# Overture Integration Specialist - Post Sync Check Fixes

You are the **${role.title}** for Filascope, a comprehensive 3D printing filament database and comparison platform.

## CORE CAPABILITIES

${role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n')}

## CRITICAL LESSONS LEARNED

${(role.lessons || []).map(l => `- ${l}`).join('\n')}

---

## OVERTURE PLATFORM OVERVIEW

**Website**: overture3d.ca (Canadian Shopify store)
**Sync Architecture**: CSV-seeded (OVERTURE_SEED_DATA)
**Spool Weight**: 1kg standard (no multi-packs synced)
**Diameter**: 1.75mm only
**Currency**: CAD (Canadian Dollars)

### Product Line Architecture (15 lines)

| Product Line | Material | Colors | URL |
|--------------|----------|--------|-----|
| Basic PLA | PLA | 28 | /products/basic-pla-1-75-mm-1-pack |
| Matte PLA | PLA | 28 | /products/matte-pla-1-75mm-1-pack |
| Silk PLA | PLA | 23 | /products/silk-pla1-75mm-1-pack |
| Easy PLA | PLA | 4 | /products/easy-pla-1-75mm-1-pack |
| Glow PLA | PLA | 4 | /products/glow-pla-1-75mm-1pack |
| Rock PLA | PLA | 20 | /products/overture-rock-pla-filament-1-75mm |
| Super PLA+ | PLA+ | 5 | /products/super-pla-1-75mm-1-pack |
| PLA Professional | PLA-PRO | 16 | /products/pla-plus-1-75mm-1-pack |
| Basic PETG | PETG | 24 | /products/basic-petg-1-75mm-1-pack |
| TPU | TPU | 12 | /products/tpu-1-75mm-1-pack |
| High Speed TPU | TPU | 10 | /products/high-speed-tpu-1-75mm-1-pack-1 |
| ABS | ABS | 1 | /products/overture-abs-filament-1-75mm |
| ASA | ASA | 1 | /products/overture-asa-filament-1-75mm-white |
| Easy Nylon | Nylon | 1 | /products/nylon-1-75mm-1-pack |

### Excluded Products (NOT synced)
- **2-Pack, 4-Pack, 6-Pack** bundles (swatch duplication)
- **2KG bulk** variants (non-consumer)
- **Eco PLA** (single variant only)
- **PLA Refill** (cardboard spool only)

---

## ROOT CAUSE ANALYSIS FRAMEWORK

When diagnosing Overture sync issues, check in this order:

### RC1: CSV Seed Data Issues
- Is the product missing from OVERTURE_SEED_DATA?
- Is the entry format correct (material, filamentLine, productUrl, color, imageUrl, colorHex)?
- Are excluded products (multi-packs, bulk) incorrectly included?
- Is shouldExcludeOvertureProduct() catching the right patterns?

### RC2: Color Extraction Issues
- Is the color correctly spelled in the seed data?
- Is there a hex code in OVERTURE_EXTENDED_COLOR_MAP for this color?
- Is the color name normalized correctly for lookup?
- Are creative color names (Glacier Blue, Mars Red) properly mapped?

### RC3: Product Line ID Issues
- Is generateOvertureProductLineId() producing correct IDs?
- Are Rock PLA products in the correct abrasive product line?
- Is PLA Professional separated from Basic PLA?
- Is High Speed TPU separated from standard TPU?

### RC4: Multi-pack Filtering Issues
- Are 2-pack, 4-pack, 6-pack products being excluded?
- Are 2kg bulk variants being excluded?
- Is the filamentLine field being checked correctly?

### RC5: Image URL Issues
- Does the image URL follow Shopify CDN pattern?
- Are product-line level images being used (not color-specific)?
- Are there broken image links in the seed data?

---

## FIX IMPLEMENTATION ORDER

### Step 1: Check CSV Seed Data
**File:** \`supabase/functions/_shared/overture-seed.ts\`

Verify OVERTURE_SEED_DATA contains the product:
\`\`\`typescript
{ 
  material: 'PLA', 
  filamentLine: 'Basic PLA 1.75MM 1-PACK', 
  productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', 
  color: 'White', 
  imageUrl: 'https://cdn.shopify.com/...', 
  colorHex: '#FFFFFF' 
}
\`\`\`

### Step 2: Fix Color Mapping (if colorHex missing in seed)
**File:** \`supabase/functions/_shared/overture-seed.ts\`

Add to OVERTURE_EXTENDED_COLOR_MAP:
\`\`\`typescript
export const OVERTURE_EXTENDED_COLOR_MAP: Record<string, string> = {
  'glacier blue': '#A5C8E1',
  'mars red': '#B22222',
  'alpine forest': '#228B22',
  'barrier reef': '#1E90FF',
  // ... add missing colors
};
\`\`\`

### Step 3: Fix Product Line ID Generation
**File:** \`supabase/functions/_shared/overture-seed.ts\`

Check generateOvertureProductLineId() logic ensures:
- Basic PLA → overture__pla__basic
- Matte PLA → overture__pla__matte
- Rock PLA → overture__pla__rock (with isNozzleAbrasive: true)
- High Speed TPU → overture__tpu__high-speed
- PLA Professional → overture__pla__professional

### Step 4: Fix Exclusion Logic
**File:** \`supabase/functions/_shared/overture-seed.ts\`

Verify shouldExcludeOvertureProduct() catches:
\`\`\`typescript
export function shouldExcludeOvertureProduct(filamentLine: string, color: string): boolean {
  const line = filamentLine.toLowerCase();
  return /\\d+[\\s-]*(pack|kg)/.test(line) && !/1[\\s-]*(pack|kg)/.test(line) ||
         line.includes('eco pla') ||
         line.includes('refill');
}
\`\`\`

---

## VERIFICATION QUERIES

### Product Line Count (should be 15)
\`\`\`sql
SELECT COUNT(DISTINCT product_line_id) as product_lines
FROM filaments WHERE vendor ILIKE '%overture%';
\`\`\`

### Product Breakdown by Line
\`\`\`sql
SELECT product_line_id, COUNT(*) as variants
FROM filaments WHERE vendor ILIKE '%overture%'
GROUP BY product_line_id ORDER BY product_line_id;
\`\`\`

### Hex Coverage (should be 100%)
\`\`\`sql
SELECT 
  COUNT(*) as total,
  COUNT(color_hex) as with_hex,
  ROUND(100.0 * COUNT(color_hex) / COUNT(*), 1) as percent
FROM filaments WHERE vendor ILIKE '%overture%';
\`\`\`

### Image Coverage (should be 100%)
\`\`\`sql
SELECT 
  COUNT(*) as total,
  COUNT(featured_image) as with_image,
  ROUND(100.0 * COUNT(featured_image) / COUNT(*), 1) as percent
FROM filaments WHERE vendor ILIKE '%overture%';
\`\`\`

### No Multi-pack Products (should return 0)
\`\`\`sql
SELECT * FROM filaments 
WHERE vendor ILIKE '%overture%' 
AND (product_title ILIKE '%2-pack%' OR product_title ILIKE '%4-pack%' OR product_title ILIKE '%6-pack%');
\`\`\`

### Rock PLA Abrasive Check (should have is_nozzle_abrasive = true)
\`\`\`sql
SELECT product_title, is_nozzle_abrasive 
FROM filaments 
WHERE vendor ILIKE '%overture%' AND product_line_id ILIKE '%rock%';
\`\`\`

---

## Fix Post Sync Check Issues for Overture

### Summary
- **Brand**: ${brand} (slug: overture)
- **Total Products**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

### Issues Found
${issuesSummary || 'None - all checks passing!'}

---

## Detailed Issues

${detailedIssues}
${aiInsightsSection}

---

## KEY FILES FOR OVERTURE

- \`supabase/functions/sync-overture-products/index.ts\` - Main sync function with CSV seed
- \`supabase/functions/_shared/overture-seed.ts\` - OVERTURE_SEED_DATA, color mappings, exclusion logic
- \`supabase/functions/_shared/overture-defaults.ts\` - Product line definitions, enrichment

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE)

${lessons.workingSolutions.map(s => `${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID)

${lessons.failedApproaches.map(f => `${f}`).join('\n')}

---

## SYNC EXECUTION STEPS

1. **Deploy** updated edge functions (\`sync-overture-products\` and \`run-post-sync-check\`)
2. **Run Clean Slate** sync for Overture from Brand Sync Manager
3. **Check edge function logs** for:
   - Skipped entries logged (multi-packs, bulk)
   - Product count around ~170 variants
   - 15 unique product_line_ids
4. **Run Post Sync Check** again - should show 0 errors
5. **Spot-check** a few product cards to confirm:
   - Correct card count (15 product lines)
   - Rock PLA marked as abrasive
   - Creative color names displayed correctly
   - Prices in CAD

---

*Last Updated: ${lessons.lastUpdated}*`;
}

/**
 * Generate Polymaker-specific AI Fix Prompt with comprehensive context
 * Covers Panchroma rebranding, Fiberon engineering line, and regional pricing
 */
function generatePolymakerFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['polymaker'];
  const role = AI_ROLES.polymakerSpecialist;
  
  if (!lessons) {
    // Fallback if lessons not defined
    return generateAIFixPrompt(brand, 'polymaker', checks, totalProducts, aiAnalysis) || '';
  }
  
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
**Regional Stores**: us.polymaker.com (USD), ca.polymaker.com (CAD), eu.polymaker.com (EUR)

---

## CORE CAPABILITIES

${role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n')}

---

## LESSONS LEARNED (${role.title})

${(role as typeof AI_ROLES.polymakerSpecialist).lessons?.map(l => `- ${l}`).join('\n') || 'See documentation.'}

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `- ${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE APPROACHES)

${lessons.workingSolutions.map(s => `- ${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID REPEATING)

${lessons.failedApproaches.map(f => `- ${f}`).join('\n')}

---

## POLYMAKER PRODUCT LINE ARCHITECTURE

| Category | Product Lines | Count |
|----------|--------------|-------|
| **Panchroma** | Matte, Silk, Dual Silk, Dual Matte, Gradient (10+ variants), Marble, Galaxy, Starlight, Luminous, Glow, Neon, Metallic, Translucent, Satin, UV Shift, CoPE, Refill | 25+ |
| **PolyLite** | PLA, PLA Pro, PLA-CF, LW-PLA, PETG, PETG Translucent, ABS, Metallic ABS, Neon ABS, Galaxy ABS, ASA, PC | 12+ |
| **Fiberon** | PA12-CF, PA6-CF, PA6-GF, PA612-CF, PA612-ESD, PET-CF, PET-GF, PETG-ESD, PETG-rCF, ASA-CF, PPS-CF, PPS-GF, CoPA | 13+ |
| **PolyMax** | PLA, PETG, PC, PC-FR | 4 |
| **PolyFlex** | TPU90, TPU95, TPU95-HF | 3 |
| **PolySonic** | Standard, Pro | 2 |
| **Specialty** | PolyCast, PolySmooth, PolyDissolve, PolySupport PLA, PolySupport PA12, HT-PLA, HT-PLA-GF, CosPLA, Wood PLA, PC-ABS, PC-PBT | 11 |

---

## CURRENT STATUS

| Metric | Value |
|--------|-------|
| **Total Products** | ${lessons.currentStatus.totalProducts} |
| **Product Lines** | ${lessons.currentStatus.productLines} |
| **Materials** | ${lessons.currentStatus.materialsSupported} |
| **HEX Coverage** | ${lessons.currentStatus.hexCoverage} |
| **Regional Pricing** | ${lessons.currentStatus.regionalPricing} |

---

## KEY FILES FOR POLYMAKER

${lessons.keyFiles.map(f => `- \`${f}\``).join('\n')}

---

## PANCHROMA REBRANDING REFERENCE

| Old Name | New Name | Product Line ID |
|----------|----------|-----------------|
| PolyTerra PLA | Panchroma Matte PLA | \`panchroma-matte\` |
| PolyLite Silk | Panchroma Silk PLA | \`panchroma-silk\` |
| PolyTerra Dual | Panchroma Dual Matte | \`panchroma-dual-matte\` |
| PolyTerra Gradient | Panchroma Gradient Matte | \`panchroma-gradient-matte\` |
| PolyTerra PLA+ | Panchroma Satin PLA | \`panchroma-satin\` |
| PolyLite UV Changing | Panchroma UV Shift | \`panchroma-uv-shift\` |
| PolyLite Galaxy | Panchroma Galaxy | \`panchroma-galaxy\` |
| PolyLite Starlight | Panchroma Starlight | \`panchroma-starlight\` |
| PolyLite Luminous | Panchroma Luminous | \`panchroma-luminous\` |
| PolyLite Glow | Panchroma Glow | \`panchroma-glow\` |
| PolyTerra Marble | Panchroma Marble | \`panchroma-marble\` |
${aiInsightsSection}
---

## Fix Post Sync Check Issues for Polymaker

### Summary

- **Brand**: Polymaker (slug: polymaker)
- **Total Products**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

### Issues Found

${issuesSummary}

---

## Detailed Issues

${detailedIssues}

---

## VERIFICATION QUERIES

\`\`\`sql
-- Product line distribution
SELECT product_line_id, COUNT(*) as variants 
FROM filaments 
WHERE vendor ILIKE 'Polymaker' AND product_line_id IS NOT NULL
GROUP BY product_line_id ORDER BY variants DESC;

-- Missing product_line_id (should be 0)
SELECT COUNT(*) as missing_product_line_id
FROM filaments 
WHERE vendor ILIKE 'Polymaker' AND product_line_id IS NULL;

-- Material breakdown
SELECT material, COUNT(*) as count 
FROM filaments 
WHERE vendor ILIKE 'Polymaker'
GROUP BY material ORDER BY count DESC;

-- Bundles that should be excluded (should be 0)
SELECT product_title, product_url 
FROM filaments 
WHERE vendor ILIKE 'Polymaker' 
AND (product_title ILIKE '%bundle%' OR product_title ILIKE '%dryer%' OR product_title ILIKE '%gift card%');

-- Panchroma line breakdown
SELECT product_line_id, COUNT(*) as variants
FROM filaments 
WHERE vendor ILIKE 'Polymaker' AND product_line_id LIKE '%panchroma%'
GROUP BY product_line_id ORDER BY variants DESC;

-- Fiberon engineering line
SELECT product_line_id, material, COUNT(*) 
FROM filaments 
WHERE vendor ILIKE 'Polymaker' AND product_line_id LIKE '%fiberon%'
GROUP BY product_line_id, material;
\`\`\`

---

## SYNC EXECUTION STEPS

1. **Deploy** updated edge functions (\`sync-polymaker-products\` and \`run-post-sync-check\`)
2. **Run Clean Slate** sync for Polymaker from Brand Sync Manager
3. **Check edge function logs** for:
   - Skipped bundles/hardware logged
   - Product count around ~500 variants
   - 50+ unique product_line_ids
4. **Run Post Sync Check** again - should show 0 errors
5. **Spot-check** a few product cards to confirm:
   - Panchroma lines properly grouped (Matte separate from Silk)
   - Fiberon engineering materials have correct specs
   - Gradient sub-variants are separate product lines
   - HEX codes extracted from SKU

---

*Last Updated: ${lessons.lastUpdated}*`;
}

/**
 * Generate Proto-Pasta-specific AI Fix Prompt with specialty material context
 */
function generateProtoPastaFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['proto-pasta'];
  const role = AI_ROLES.protoPastaSpecialist;
  
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

**Platform**: ${lessons?.platform || 'Shopify storefront (proto-pasta.com) - US only'}
**Specialty**: HTPLA (heat-treatable PLA), Metal Composites, Carbon Fiber, Conductive PLA

---

## CORE CAPABILITIES

${role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n')}

---

## LESSONS LEARNED

${(role as any).lessons?.map((l: string) => `- ${l}`).join('\n') || 'See documentation.'}

---

## KNOWN LIMITATIONS

${lessons?.knownLimitations?.join('\n') || 'None documented.'}

---

## WORKING SOLUTIONS

${lessons?.workingSolutions?.join('\n') || 'None documented.'}

---

## PRODUCT LINE ARCHITECTURE

| Category | Lines | Materials |
|----------|-------|-----------|
| HTPLA Standard | Opaque, Translucent, Glitter, Metallic, Nebula | HTPLA |
| HTPLA Specialty | Reflective, Matte Fiber, Thermochromic, Glow, Marble, Wood | HTPLA |
| HTPLA Smoothie | Blueberry, Dragonfruit, Pineapple Banana, etc. | HTPLA |
| Metal Composites | Brass, Bronze, Copper (HTPLA), Iron, Steel (PLA) | HTPLA/PLA |
| Carbon Fiber | CF-HTPLA, CF-PLA | HTPLA-CF/PLA-CF |
| Conductive/ESD | Conductive PLA, Dissipative PLA/PETG | Specialty |
| PETG | Simply PETG, CF-PETG | PETG |
| High Flow | HFPLA, c-Matte PLA | HFPLA |
| Recycled | Still Colorful, Black Recycled | rPLA/rPETG |
| TPU/TPE | Flexible, Rigid | TPU |
| Specialty | Polyketone (CF/GF), Calcium Carbonate, Glass Fiber | POK/PLA |

---

## CURRENT STATUS

| Metric | Value |
|--------|-------|
| **Total Products** | ${totalProducts} |
| **Expected Lines** | ~25 product lines |
| **HEX Coverage** | 100% with 100+ color mappings |

---
${aiInsightsSection}
## Fix Post Sync Check Issues for ${brand}

### Summary

- **Brand**: ${brand} (slug: proto-pasta)
- **Total Products**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

### Issues Found

${issuesSummary}

---

## Detailed Issues

${detailedIssues}

---

## KEY FILES

- \`supabase/functions/sync-protopasta-products/index.ts\` - Main sync function
- \`supabase/functions/_shared/protopasta-defaults.ts\` - Color mapping, product lines, TDS URLs
- \`supabase/functions/_shared/protopasta-seed.ts\` - CSV seed data

---

## VERIFICATION QUERIES

\`\`\`sql
-- Product line distribution (expect ~25 lines)
SELECT product_line_id, COUNT(*) as variants 
FROM filaments 
WHERE vendor ILIKE 'Proto-Pasta'
GROUP BY product_line_id ORDER BY variants DESC;

-- HEX coverage (should be 100%)
SELECT 
  COUNT(*) as total,
  COUNT(color_hex) as with_hex,
  ROUND(100.0 * COUNT(color_hex) / COUNT(*), 1) as coverage_pct
FROM filaments WHERE vendor ILIKE 'Proto-Pasta';

-- Sample products (should be 0)
SELECT COUNT(*) FROM filaments 
WHERE vendor ILIKE 'Proto-Pasta' AND net_weight_g < 300;

-- Subscriptions (should be 0)
SELECT COUNT(*) FROM filaments 
WHERE vendor ILIKE 'Proto-Pasta' 
AND (product_title ILIKE '%endless%' OR product_title ILIKE '%subscription%');

-- Metal composites (should have is_nozzle_abrasive = true)
SELECT product_title, is_nozzle_abrasive 
FROM filaments 
WHERE vendor ILIKE 'Proto-Pasta' 
AND (product_title ILIKE '%brass%' OR product_title ILIKE '%bronze%' 
     OR product_title ILIKE '%copper%' OR product_title ILIKE '%iron%' 
     OR product_title ILIKE '%steel%');
\`\`\`

---

## SYNC EXECUTION STEPS

1. **Deploy** updated edge functions
2. **Run Clean Slate** sync for Proto-Pasta from Brand Sync Manager
3. **Check edge function logs** for:
   - Sample products (50g coils) skipped
   - Product count around ~170 variants
   - 25+ unique product_line_ids
4. **Run Post Sync Check** again - target 0 errors
5. **Spot-check** a few product cards to confirm:
   - Metal composites have is_nozzle_abrasive = true
   - Carbon fiber products grouped correctly
   - Smoothie line colors extracted properly
   - Community-inspired colors have hex codes

---

*Last Updated: ${lessons?.lastUpdated || '2026-01-12'}*`;
}

/**
 * Generate Push Plastic-specific AI Fix Prompt with CSV-seeded context
 */
function generatePushPlasticFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const role = AI_ROLES.pushPlasticSpecialist;
  
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
      check.products.slice(0, 10).forEach(p => {
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

  return `You are the **${role.title}** for Filascope.

## PLATFORM CONTEXT

**Platform**: Shopify (pushplastic.com - US)
**Currency**: USD
**Architecture**: CSV-seeded sync pipeline (~200 products, 16 product lines)

---

## CORE CAPABILITIES

${role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n')}

---

## CSV-SEEDED SYNC ARCHITECTURE

Push Plastic sync uses a **hardcoded CSV seed** as the primary data source:

1. **PUSHPLASTIC_PRODUCT_SEED** (~200 products) in \`pushplastic-seed.ts\` contains:
   - Product names, colors, hex codes, product URLs
   - Only 1.75mm, 1kg consumer-focused products
   
2. **Filtering Rules Applied:**
   - EXCLUDE: 2.85mm diameter, 3kg/5kg/10kg/25kg bulk, Factory Seconds
   - EXCLUDE: Cases, Pallet Pricing, SiPC, Subscriptions
   - DEDUPLICATE: AMS vs Standard spool types (prefer standard)
   
3. **PUSHPLASTIC_EXTENDED_HEX_MAP** provides hex codes for 45+ colors

---

## KNOWN LESSONS

${role.lessons?.map(l => `- ${l}`).join('\n') || 'See pushPlasticSpecialist role for lessons'}

---

## PRODUCT LINE ARCHITECTURE (16 Lines)

| Material | Product Line ID | Notes |
|----------|-----------------|-------|
| PLA | push-plastic__pla__standard | ~42 colors |
| PETG | push-plastic__petg__standard | ~24 colors |
| PCTG | push-plastic__pctg__standard | ~28 colors |
| ABS | push-plastic__abs__standard | ~28 colors |
| ASA | push-plastic__asa__standard | ~7 colors |
| PC+PBT | push-plastic__pc-pbt__standard | ~8 colors |
| HH Tough PLA | push-plastic__pla-ht__tough | High-heat 3D870 |
| TPU 98A | push-plastic__tpu-98a__standard | ~8 colors |
| HIPS | push-plastic__hips__standard | ~5 colors |
| ABS-CF | push-plastic__abs-cf__carbon | Black only |
| PETG-CF | push-plastic__petg-cf__carbon | Black only |
| PA-CF | push-plastic__pa-cf__carbon | Black only |
| PC-CF | push-plastic__pc-cf__carbon | Black only |
| PEI 9085 | push-plastic__pei__9085 | 1 color |
| PEI 1010 | push-plastic__pei__1010 | 1 color |
| PMMA | push-plastic__pmma__standard | Natural/Clear |

---

## ROOT CAUSE ANALYSIS FRAMEWORK

- **RC1**: CSV seed missing products/colors
- **RC2**: Color-to-hex mapping gaps in PUSHPLASTIC_EXTENDED_HEX_MAP
- **RC3**: Material normalization bugs (extractMaterialFromTitle)
- **RC4**: Product line ID grouping issues (generatePushPlasticProductLineId)
- **RC5**: Weight/diameter filter not excluding bulk products

---

## KEY FILES

- \`supabase/functions/_shared/pushplastic-seed.ts\` - CSV seed data
- \`supabase/functions/_shared/pushplastic-defaults.ts\` - Enrichment, hex mapping
- \`supabase/functions/sync-pushplastic-products/index.ts\` - Sync function

---

## Fix Post Sync Check Issues for ${brand}

### Summary
- **Brand**: ${brand} (slug: push-plastic)
- **Total Products**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

### Issues Found
${issuesSummary}

---

## Detailed Issues

${detailedIssues}

---

## Verification Steps

1. Run **Clean Slate** sync for Push Plastic
2. Run **Post Sync Check** to verify 0 failures
3. Confirm 16 product lines and ~200 products

---

*Last Updated: 2026-01-13*`;
}

/**
 * Generate Sunlu-specific AI Fix Prompt with CSV-seeded context
 */
function generateSunluFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['sunlu'];
  const role = AI_ROLES.sunluSpecialist;
  
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warningChecks = checks.filter(c => c.status === 'warning');
  const allIssues = [...failedChecks, ...warningChecks];
  
  // === CATEGORIZE ISSUES BY ROOT CAUSE TYPE ===
  const missingHexChecks = allIssues.filter(c => 
    c.checkName.includes('Swatch Uniqueness') || 
    c.checkName.includes('Hex') ||
    c.products?.some(p => p.issue?.toLowerCase().includes('missing color_hex') || p.issue?.toLowerCase().includes('null hex'))
  );
  
  const invalidUrlChecks = allIssues.filter(c => 
    (c.checkName.includes('URL') && (c.checkName.includes('Valid') || c.checkName.includes('404'))) ||
    c.products?.some(p => p.issue?.toLowerCase().includes('404') || p.issue?.toLowerCase().includes('invalid url'))
  );
  
  const priceChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('price') ||
    c.products?.some(p => p.issue?.toLowerCase().includes('null price') || p.issue?.toLowerCase().includes('missing price'))
  );
  
  const cardCountChecks = allIssues.filter(c => 
    c.checkName.includes('Card Count') || c.checkName.includes('Product Line Count')
  );
  
  const colorVariantChecks = allIssues.filter(c =>
    c.checkName.includes('Variant Count') || c.checkName.includes('Color Variant')
  );
  
  const uiDisplayChecks = allIssues.filter(c =>
    c.checkName.includes('UI Display') || c.checkName.includes('Card Title')
  );

  const imageChecks = allIssues.filter(c =>
    c.checkName.toLowerCase().includes('image') || 
    c.products?.some(p => p.issue?.toLowerCase().includes('image'))
  );

  // === BUILD DYNAMIC ROOT CAUSE SECTIONS ===
  let rootCauseSections = '';
  const priorityFixes: string[] = [];

  // RC1: Invalid URLs (404s)
  if (invalidUrlChecks.length > 0) {
    const affectedProducts = invalidUrlChecks.flatMap(c => c.products || []).slice(0, 8);
    rootCauseSections += `
### RC1: Invalid Product/Image URLs (404 Errors)

**SEVERITY:** 🔴 CRITICAL - Broken links affect user experience

**Affected Products (${invalidUrlChecks.reduce((sum, c) => sum + (c.count || 0), 0)} total):**
${affectedProducts.map(p => `- \`${p.title}\`: ${p.issue}${p.url ? `\n  URL: ${p.url}` : ''}`).join('\n')}

**ROOT CAUSE:** Product URLs or image URLs from Shopify API are returning 404s, possibly due to:
1. Products removed from store.sunlu.com but not from our database
2. URL format changes on the Sunlu website
3. Stale product handles

**FIX LOCATION:** \`supabase/functions/sync-sunlu-products/index.ts\`

**EXACT CODE CHANGES:**

1. **Add URL validation before upserting** (~line 280):
\`\`\`typescript
// In upsertVariants() before database insert
async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Filter out variants with invalid URLs
const validVariants = [];
for (const variant of variants) {
  if (variant.product_url) {
    const isValid = await validateUrl(variant.product_url);
    if (!isValid) {
      console.log(\`[SKIP] Invalid URL for \${variant.product_title}: \${variant.product_url}\`);
      continue;
    }
  }
  validVariants.push(variant);
}
\`\`\`

2. **Or run a cleanup for existing 404s:**
\`\`\`sql
-- Identify products with likely stale URLs
SELECT id, product_title, product_url 
FROM filaments 
WHERE vendor = 'Sunlu' 
  AND product_url IS NOT NULL
  AND updated_at < NOW() - INTERVAL '30 days';
\`\`\`

**VERIFICATION:**
\`\`\`sql
-- After fix, manually check a few URLs:
SELECT product_url FROM filaments 
WHERE vendor = 'Sunlu' 
ORDER BY updated_at DESC LIMIT 5;
-- Then curl these URLs to verify they return 200
\`\`\`
`;
    priorityFixes.push('**PRIORITY 1:** Fix Invalid URLs (RC1) - Add URL validation or clean up stale entries');
  }

  // RC2: Missing Hex Codes
  if (missingHexChecks.length > 0) {
    const missingColors = missingHexChecks.flatMap(c => c.products || []).slice(0, 15);
    const colorNamesToAdd = missingColors.map(p => {
      // Try to extract color name from issue or title
      const colorMatch = p.issue?.match(/color[:\s]+["']?([^"',]+)/i) ||
                         p.issue?.match(/["']([^"']+)["']/i) ||
                         p.title?.match(/[-–]\s*([A-Za-z\s]+)$/);
      return colorMatch?.[1]?.toLowerCase().trim() || 'unknown';
    }).filter((c, i, arr) => c !== 'unknown' && arr.indexOf(c) === i);

    rootCauseSections += `
### RC2: Missing Color Hex Mappings

**SEVERITY:** 🟡 HIGH - Affects color swatch display in UI

**Affected Colors (${missingHexChecks.reduce((sum, c) => sum + (c.count || 0), 0)} total):**
${missingColors.slice(0, 10).map(p => `- \`${p.title}\`: ${p.issue}`).join('\n')}

**ROOT CAUSE:** These color names are not in \`SUNLU_EXTENDED_HEX_MAP\`

**FIX LOCATION:** \`supabase/functions/_shared/sunlu-seed.ts\` → \`SUNLU_EXTENDED_HEX_MAP\` (lines 23-245)

**EXACT CODE TO ADD:**
\`\`\`typescript
// Add these to SUNLU_EXTENDED_HEX_MAP object:
export const SUNLU_EXTENDED_HEX_MAP: Record<string, string> = {
  // ... existing mappings ...
  
  // NEW MAPPINGS TO ADD:
${colorNamesToAdd.slice(0, 12).map(colorName => {
  // Suggest a hex based on common color patterns
  const suggestedHex = getSuggestedHexForColor(colorName);
  return `  '${colorName}': '${suggestedHex}', // TODO: Verify from product swatch`;
}).join('\n')}
};
\`\`\`

**HOW TO FIND CORRECT HEX:**
1. Visit product page on store.sunlu.com
2. Use browser dev tools to inspect color swatch
3. Extract hex from background-color CSS or image

**VERIFICATION QUERY:**
\`\`\`sql
-- Count missing hex codes (should be 0 after fix)
SELECT COUNT(*) as missing_hex FROM filaments 
WHERE vendor = 'Sunlu' AND color_hex IS NULL;

-- List remaining missing
SELECT product_title, color_family FROM filaments 
WHERE vendor = 'Sunlu' AND color_hex IS NULL
ORDER BY product_title;
\`\`\`
`;
    priorityFixes.push('**PRIORITY 2:** Fix Missing Hex Codes (RC2) - Add mappings to SUNLU_EXTENDED_HEX_MAP');
  }

  // RC3: NULL Prices
  if (priceChecks.length > 0) {
    const priceProducts = priceChecks.flatMap(c => c.products || []).slice(0, 8);
    rootCauseSections += `
### RC3: Missing Prices (NULL variant_price)

**SEVERITY:** 🟡 HIGH - Products without prices can't be compared

**Affected Products (${priceChecks.reduce((sum, c) => sum + (c.count || 0), 0)} total):**
${priceProducts.map(p => `- \`${p.title}\`: ${p.issue}`).join('\n')}

**ROOT CAUSE OPTIONS:**
1. Shopify API variant.price is empty or "0.00"
2. Price extraction failing for specific variant formats
3. \`getSunluDefaultPrice()\` fallback not covering the material

**FIX LOCATION 1:** \`supabase/functions/sync-sunlu-products/index.ts\` → \`explodeVariants()\` (~line 203)

**EXACT CODE TO VERIFY:**
\`\`\`typescript
// Ensure price extraction with fallback (around line 203-210)
const rawPrice = parseFloat(variant.price || '0');
const price = rawPrice > 0 ? rawPrice : getSunluDefaultPrice(material);

// Log when falling back to default
if (rawPrice <= 0) {
  console.log(\`[PRICE] Using default for \${title}: \${material} → $\${price}\`);
}
\`\`\`

**FIX LOCATION 2:** \`supabase/functions/_shared/sunlu-defaults.ts\` → \`SUNLU_DEFAULT_PRICES\`

**ADD MISSING MATERIAL FALLBACKS:**
\`\`\`typescript
export const SUNLU_DEFAULT_PRICES: Record<string, number> = {
  'PLA': 15.99,
  'PLA+': 17.99,
  'PETG': 18.99,
  'ABS': 17.99,
  'TPU': 24.99,
  'ASA': 22.99,
  'PLA Silk': 19.99,
  'PLA Matte': 18.99,
  // ADD ANY MISSING:
  'PLA Meta': 21.99,
  'PLA+ 2.0 HS': 19.99,
  'PLA AntiString': 18.99,
};
\`\`\`

**VERIFICATION QUERY:**
\`\`\`sql
-- Count NULL prices (should be 0)
SELECT COUNT(*) as null_prices FROM filaments 
WHERE vendor = 'Sunlu' AND variant_price IS NULL;

-- Check price distribution
SELECT material, AVG(variant_price) as avg_price, COUNT(*) as count
FROM filaments WHERE vendor = 'Sunlu' AND variant_price IS NOT NULL
GROUP BY material ORDER BY material;
\`\`\`
`;
    priorityFixes.push('**PRIORITY 3:** Fix NULL Prices (RC3) - Ensure price extraction and fallbacks');
  }

  // RC4: Card Count Mismatch
  if (cardCountChecks.length > 0) {
    const cardInfo = cardCountChecks[0]?.products?.[0];
    const foundMatch = cardInfo?.issue?.match(/Found[:\s]+(\d+)/i);
    const expectedMatch = cardInfo?.issue?.match(/Expected[:\s]+(\d+)/i);
    const foundCards = foundMatch?.[1] || 'unknown';
    const expectedCards = expectedMatch?.[1] || '38';

    rootCauseSections += `
### RC4: Product Line Count Mismatch

**SEVERITY:** 🟠 MEDIUM - Affects product grouping and UI card count

**Current:** ${foundCards} product lines
**Expected:** ${expectedCards} product lines
**Details:** ${cardInfo?.issue || 'Card count does not match expected'}

**ROOT CAUSE OPTIONS:**
1. \`normalizeSunluMaterialFromTitle()\` not detecting all specialty materials
2. \`generateSunluProductLineId()\` creating too broad/narrow groupings
3. New products added by Sunlu not covered by patterns

**FIX LOCATION 1:** \`supabase/functions/_shared/sunlu-seed.ts\` → \`normalizeSunluMaterialFromTitle()\` (lines 413-465)

**PATTERNS TO CHECK/ADD:**
\`\`\`typescript
export function normalizeSunluMaterialFromTitle(title: string): string {
  const lower = title.toLowerCase();
  
  // HIGH-SPEED VARIANTS (check FIRST - order matters!)
  if (/\\bhspla\\+?\\s*2\\.?0\\b|\\bpla\\+?\\s*2\\.?0\\s*hs\\b/i.test(lower)) return 'PLA+ 2.0 HS';
  if (/\\bhigh[\\-\\s]?speed\\s*pla/i.test(lower)) return 'HS-PLA';
  
  // SPECIALTY PLA VARIANTS
  if (/\\bpla[\\-\\s]?meta\\b/i.test(lower)) return 'PLA Meta';
  if (/\\bantistring\\b|\\banti[\\-\\s]?string\\b/i.test(lower)) return 'PLA AntiString';
  if (/\\bdual[\\-\\s]?color[\\-\\s]?matte\\b/i.test(lower)) return 'PLA Matte Dual-Color';
  if (/\\bmatte[\\-\\s]?dual[\\-\\s]?color\\b/i.test(lower)) return 'PLA Matte Dual-Color';
  if (/\\bpla\\s*silk/i.test(lower)) return 'PLA Silk';
  if (/\\bpla\\s*matte/i.test(lower)) return 'PLA Matte';
  if (/\\bpla\\s*marble/i.test(lower)) return 'PLA Marble';
  if (/\\bpla\\s*rainbow/i.test(lower)) return 'PLA Rainbow';
  if (/\\bpla\\s*glow/i.test(lower)) return 'PLA Glow';
  if (/\\bpla\\s*wood/i.test(lower)) return 'PLA Wood';
  
  // ENGINEERING MATERIALS
  if (/\\bpetg[\\-\\s]?cf\\b/i.test(lower)) return 'PETG-CF';
  if (/\\bpla[\\-\\s]?cf\\b/i.test(lower)) return 'PLA-CF';
  if (/\\babs[\\-\\s]?gf\\b/i.test(lower)) return 'ABS-GF';
  if (/\\btpu\\b/i.test(lower)) return 'TPU';
  if (/\\basa\\b/i.test(lower)) return 'ASA';
  if (/\\bpetg\\b/i.test(lower)) return 'PETG';
  if (/\\babs\\b/i.test(lower)) return 'ABS';
  if (/\\bpla\\+/i.test(lower)) return 'PLA+';
  if (/\\bpla\\b/i.test(lower)) return 'PLA';
  
  return 'Unknown';
}
\`\`\`

**FIX LOCATION 2:** Update expected count in \`run-post-sync-check/index.ts\` → \`EXPECTED_CARD_COUNTS\`

\`\`\`typescript
const EXPECTED_CARD_COUNTS: Record<string, number> = {
  // ... other brands ...
  'sunlu': ${foundCards !== 'unknown' ? foundCards : 38}, // Update if current grouping is correct
};
\`\`\`

**VERIFICATION QUERY:**
\`\`\`sql
-- List all product lines with counts
SELECT product_line_id, COUNT(*) as variant_count
FROM filaments WHERE vendor = 'Sunlu'
GROUP BY product_line_id
ORDER BY product_line_id;

-- Count distinct product lines
SELECT COUNT(DISTINCT product_line_id) as total_lines
FROM filaments WHERE vendor = 'Sunlu';
\`\`\`
`;
    priorityFixes.push('**PRIORITY 4:** Fix Product Line Detection (RC4) - Update normalizeSunluMaterialFromTitle()');
  }

  // RC5: Low Variant Counts
  if (colorVariantChecks.length > 0) {
    const lowVariantLines = colorVariantChecks.flatMap(c => c.products || []).slice(0, 12);
    const engineeringMaterials = lowVariantLines
      .filter(p => /cf|gf|carbon|glass|peek|pa12|pc__|pp__|abs-|hips/i.test(p.title || ''))
      .map(p => p.title);

    rootCauseSections += `
### RC5: Low Color Variant Counts (Single-Variant Lines)

**SEVERITY:** 🟢 LOW - May be expected for engineering materials

**Affected Product Lines (${colorVariantChecks.reduce((sum, c) => sum + (c.count || 0), 0)} total):**
${lowVariantLines.map(p => `- \`${p.title}\`: ${p.issue}`).join('\n')}

**ROOT CAUSE ANALYSIS:**
${engineeringMaterials.length > 0 ? `
✅ **EXPECTED (Engineering Materials):** These legitimately have 1-3 colors:
${engineeringMaterials.slice(0, 5).map(m => `   - ${m}`).join('\n')}

→ Whitelist these in \`isSingleColorProduct()\`
` : ''}
❓ **UNEXPECTED:** If consumer materials (PLA, PETG) show low variants, check:
   1. Color extraction failing for specific products
   2. Products incorrectly excluded by \`SUNLU_EXCLUDED_PATTERNS\`
   3. Region filtering too aggressive

**FIX LOCATION:** \`supabase/functions/run-post-sync-check/index.ts\` → \`isSingleColorProduct()\`

**EXACT CODE TO ADD:**
\`\`\`typescript
function isSingleColorProduct(lineId: string): boolean {
  // ... existing logic ...
  
  // Sunlu engineering materials with limited colors
  if (lineId.includes('sunlu__')) {
    const sunluEngineering = [
      'petg-cf', 'pla-cf', 'abs-gf', 'abs-fr',
      'peek', 'pa12-cf', 'pc__', 'pp__', 'hips',
      'tpu-95a', // Often limited colors
    ];
    if (sunluEngineering.some(mat => lineId.toLowerCase().includes(mat))) {
      return true;
    }
  }
  
  return false;
}
\`\`\`

**VERIFICATION QUERY:**
\`\`\`sql
-- Check variant counts by product line
SELECT product_line_id, COUNT(*) as variants, 
       array_agg(DISTINCT color_family) as color_families
FROM filaments WHERE vendor = 'Sunlu'
GROUP BY product_line_id
HAVING COUNT(*) < 3
ORDER BY variants, product_line_id;
\`\`\`
`;
    priorityFixes.push('**PRIORITY 5:** Fix Variant Counts (RC5) - Whitelist engineering materials in isSingleColorProduct()');
  }

  // RC6: UI Display Issues
  if (uiDisplayChecks.length > 0) {
    const uiProducts = uiDisplayChecks.flatMap(c => c.products || []).slice(0, 8);
    rootCauseSections += `
### RC6: UI Display Name Issues

**SEVERITY:** 🟢 LOW - Affects card title formatting

**Affected Products:**
${uiProducts.map(p => `- \`${p.title}\`: ${p.issue}`).join('\n')}

**ROOT CAUSE:** \`formatProductLineIdForDisplay()\` not handling Sunlu-specific patterns

**FIX LOCATION:** \`src/utils/productNameUtils.ts\` → \`formatProductLineIdForDisplay()\`

**CHECK/ADD SUNLU PATTERNS:**
\`\`\`typescript
export function formatProductLineIdForDisplay(lineId: string): string {
  if (lineId.startsWith('sunlu__')) {
    const suffix = lineId.replace('sunlu__', '');
    // Handle underscore-separated materials
    return suffix
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/Pla/g, 'PLA')
      .replace(/Petg/g, 'PETG')
      .replace(/Abs/g, 'ABS')
      .replace(/Tpu/g, 'TPU')
      .replace(/Hs/g, 'HS');
  }
  // ... rest of function
}
\`\`\`

**VERIFICATION:** Check card titles in UI at /brands/sunlu
`;
    priorityFixes.push('**PRIORITY 6:** Fix UI Display Names (RC6) - Update formatProductLineIdForDisplay()');
  }

  // RC7: Image Issues
  if (imageChecks.length > 0) {
    const imageProducts = imageChecks.flatMap(c => c.products || []).slice(0, 8);
    rootCauseSections += `
### RC7: Missing or Invalid Product Images

**SEVERITY:** 🟡 HIGH - Affects visual browsing experience

**Affected Products:**
${imageProducts.map(p => `- \`${p.title}\`: ${p.issue}`).join('\n')}

**ROOT CAUSE:** Shopify API image URLs not being extracted or stored correctly

**FIX LOCATION:** \`supabase/functions/sync-sunlu-products/index.ts\` → \`explodeVariants()\`

**VERIFY IMAGE EXTRACTION (~line 195-200):**
\`\`\`typescript
// Ensure image is extracted from Shopify product
const featuredImage = product.images?.[0]?.src || 
                      variant.featured_image?.src || 
                      null;

if (!featuredImage) {
  console.log(\`[WARN] No image for \${title}\`);
}
\`\`\`

**VERIFICATION QUERY:**
\`\`\`sql
-- Count products without images
SELECT COUNT(*) as missing_images FROM filaments 
WHERE vendor = 'Sunlu' AND featured_image IS NULL;
\`\`\`
`;
    priorityFixes.push('**PRIORITY 7:** Fix Missing Images (RC7) - Verify image extraction in explodeVariants()');
  }

  // === BUILD PRIORITY ORDER ===
  const prioritySection = priorityFixes.length > 0 ? `
## 📋 STEP-BY-STEP FIX IMPLEMENTATION ORDER

${priorityFixes.join('\n')}

**NOTE:** Fix issues in priority order. Each fix may resolve multiple check failures.
` : '';

  // === COMPREHENSIVE VERIFICATION SECTION ===
  const verificationSection = `
## ✅ COMPREHENSIVE VERIFICATION

After implementing fixes, run these queries to verify ALL issues are resolved:

\`\`\`sql
-- 1. Total product count (target: 200-500 consumer products)
SELECT COUNT(*) as total_products FROM filaments WHERE vendor = 'Sunlu';

-- 2. Product line count (target: ~38)
SELECT COUNT(DISTINCT product_line_id) as product_lines FROM filaments WHERE vendor = 'Sunlu';

-- 3. Missing hex codes (target: 0)
SELECT COUNT(*) as missing_hex FROM filaments WHERE vendor = 'Sunlu' AND color_hex IS NULL;

-- 4. NULL prices (target: 0)
SELECT COUNT(*) as null_prices FROM filaments WHERE vendor = 'Sunlu' AND variant_price IS NULL;

-- 5. Missing images (target: 0)
SELECT COUNT(*) as missing_images FROM filaments WHERE vendor = 'Sunlu' AND featured_image IS NULL;

-- 6. Product line distribution (verify no unexpected single-variant consumer lines)
SELECT product_line_id, COUNT(*) as variants, 
       ROUND(AVG(variant_price)::numeric, 2) as avg_price
FROM filaments WHERE vendor = 'Sunlu'
GROUP BY product_line_id
ORDER BY variants DESC;

-- 7. Sample data quality check
SELECT product_title, material, color_family, color_hex, 
       variant_price, featured_image IS NOT NULL as has_image
FROM filaments WHERE vendor = 'Sunlu'
ORDER BY RANDOM() LIMIT 10;
\`\`\`

**THEN:** Re-run Post Sync Check for Sunlu to verify 0 errors, 0 warnings.
`;

  // === KEY FILES REFERENCE ===
  const keyFilesSection = `
## 📁 KEY FILE LOCATIONS

| Function | File | Purpose |
|----------|------|---------|
| \`fetchShopifyProducts()\` | sync-sunlu-products/index.ts | Fetches live data from Shopify API |
| \`explodeVariants()\` | sync-sunlu-products/index.ts | Processes variants, extracts data |
| \`upsertVariants()\` | sync-sunlu-products/index.ts | Writes to database |
| \`SUNLU_EXTENDED_HEX_MAP\` | sunlu-seed.ts | 150+ color-to-hex mappings |
| \`SUNLU_EXCLUDED_PATTERNS\` | sunlu-seed.ts | Non-filament product filters |
| \`normalizeSunluMaterialFromTitle()\` | sunlu-seed.ts | Material extraction from title |
| \`generateSunluProductLineId()\` | sunlu-seed.ts | Product line ID generation |
| \`getSunluDefaultPrice()\` | sunlu-defaults.ts | Price fallback by material |
| \`isSingleColorProduct()\` | run-post-sync-check/index.ts | Engineering material whitelist |
`;

  // === BUILD SUMMARY ===
  const issuesSummary = [
    ...failedChecks.map(c => `❌ ${c.checkName}: ${c.count} issues`),
    ...warningChecks.map(c => `⚠️ ${c.checkName}: ${c.count} issues`)
  ].join('\n');

  const capabilitiesText = role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n');

  return `You are the **${role.title}** for Filascope.

## 🎯 MISSION
Fix ALL Post Sync Check issues for Sunlu in a SINGLE implementation pass.

## PLATFORM CONTEXT
- **Platform**: ${lessons.platform}
- **Store URL**: https://store.sunlu.com/
- **API**: Shopify JSON API (products.json)
- **Architecture**: Live API sync with curated enrichment

## CORE CAPABILITIES
${capabilitiesText}

## CURRENT SYNC STATUS
| Metric | Value |
|--------|-------|
| **Brand** | ${brand} (slug: sunlu) |
| **Total Products in DB** | ${totalProducts} |
| **Failed Checks** | ${failedChecks.length} |
| **Warning Checks** | ${warningChecks.length} |

## ISSUES SUMMARY
${issuesSummary || '✅ All checks passing!'}

---

## 🔍 ROOT CAUSE ANALYSIS & FIXES

${rootCauseSections || 'No specific issues detected. All checks are passing!'}

${prioritySection}

${keyFilesSection}

${verificationSection}

---

*Generated: ${new Date().toISOString().split('T')[0]} | Sync Check Version: Enhanced Self-Evolving v2*`;
}

// Helper function to suggest hex codes based on common color names
function getSuggestedHexForColor(colorName: string): string {
  const lower = colorName.toLowerCase().trim();
  
  // Common color mappings
  const suggestions: Record<string, string> = {
    'black': '1A1A1A',
    'white': 'FAFAFA',
    'red': 'DC2626',
    'blue': '2563EB',
    'green': '16A34A',
    'yellow': 'FACC15',
    'orange': 'EA580C',
    'purple': '9333EA',
    'pink': 'EC4899',
    'gray': '6B7280',
    'grey': '6B7280',
    'brown': '92400E',
    'gold': 'D4AF37',
    'silver': 'C0C0C0',
    'clear': 'E5E7EB',
    'natural': 'F5F5DC',
    'beige': 'F5F5DC',
    'cyan': '06B6D4',
    'teal': '14B8A6',
    'navy': '1E3A5F',
  };
  
  // Check for exact match
  if (suggestions[lower]) return suggestions[lower];
  
  // Check for partial matches
  for (const [key, hex] of Object.entries(suggestions)) {
    if (lower.includes(key)) return hex;
  }
  
  // Default placeholder
  return 'XXXXXX';
}

/**
 * Generate Recreus-specific AI Fix Prompt with CSV-seeded context
 */
/**
 * Generate Spectrum Filaments-specific AI Fix Prompt with comprehensive context
 * This is the most detailed fix prompt for high-fidelity zero-issue data quality
 */
function generateSpectrumFilamentsFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const lessons = BRAND_LESSONS_LEARNED['spectrum-filaments'];
  const role = AI_ROLES.spectrumFilamentsSpecialist;
  
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
      check.products.slice(0, 15).forEach(p => {
        section += `- **${p.title}**\n  - Issue: ${p.issue}\n`;
        if (p.url) section += `  - URL: ${p.url}\n`;
      });
      if (check.products.length > 15) {
        section += `\n... and ${check.products.length - 15} more\n`;
      }
    } else if (check.details) {
      section += `- ${check.details}\n`;
    }
    return section;
  }).join('\n\n');

  // Categorize issues by root cause
  const missingHexChecks = [...failedChecks, ...warningChecks].filter(c => 
    c.checkName.includes('Color Hex') || c.products?.some(p => p.issue?.includes('hex'))
  );
  const duplicateHexChecks = [...failedChecks, ...warningChecks].filter(c => 
    c.checkName.includes('Swatch Uniqueness') || c.checkName.includes('duplicate')
  );
  const cardCountChecks = [...failedChecks, ...warningChecks].filter(c => 
    c.checkName.includes('Card Count') || c.checkName.includes('product line')
  );
  const colorExtractionChecks = [...failedChecks, ...warningChecks].filter(c =>
    c.checkName.includes('Color') && !c.checkName.includes('Hex')
  );

  // Build root cause sections based on detected issues
  let rootCauseSection = '';
  
  if (missingHexChecks.length > 0) {
    const missingColors = missingHexChecks.flatMap(c => c.products || []).slice(0, 10);
    rootCauseSection += `
### RC2: Missing Color Hex Mappings (mapSpectrumColorToHex())

**Affected Products:**
${missingColors.map(p => `- ${p.title}: ${p.issue}`).join('\n')}

**FIX LOCATION:** \`supabase/functions/sync-spectrum-products/index.ts\` → \`mapSpectrumColorToHex()\` → \`extendedMappings\`

**EXACT CODE TO ADD:**
\`\`\`typescript
// Add to extendedMappings object (around line 953-1200)
// Missing color mappings based on above products:
${missingColors.slice(0, 8).map(p => {
  const colorMatch = p.issue?.match(/color[:\s]+["']?([^"',]+)/i);
  const colorName = colorMatch?.[1]?.toLowerCase().trim() || p.title?.split(' - ')[1]?.toLowerCase() || 'unknown';
  return `'${colorName}': 'XXXXXX', // TODO: Extract hex from product page`;
}).join('\n')}
\`\`\`

**VERIFICATION QUERY:**
\`\`\`sql
SELECT product_title, color_family, color_hex 
FROM filaments 
WHERE vendor = 'Spectrum Filaments' AND color_hex IS NULL
ORDER BY product_title;
\`\`\`
`;
  }

  if (duplicateHexChecks.length > 0) {
    const duplicateColors = duplicateHexChecks.flatMap(c => c.products || []).slice(0, 10);
    rootCauseSection += `
### RC3: Duplicate Hex Codes (Swatch Uniqueness failures)

**Affected Products:**
${duplicateColors.map(p => `- ${p.title}: ${p.issue}`).join('\n')}

**ROOT CAUSE:** Similar colors within the same product_line_id share identical hex codes. This causes duplicate swatches in the UI.

**FIX LOCATION:** \`supabase/functions/sync-spectrum-products/index.ts\` → \`mapSpectrumColorToHex()\` → \`extendedMappings\`

**FIX STRATEGY:**
1. Identify all colors sharing the same hex within a product_line_id
2. Assign UNIQUE hex codes with slight variations (e.g., #A4A4A4 vs #A5A5A5)
3. MATT variants should be slightly darker than non-MATT equivalents

**EXACT CODE TO ADD:**
\`\`\`typescript
// Add to extendedMappings object - UNIQUE hex codes for similar colors

// === NATURAL/BEIGE VARIANTS (prevent #F5F5DC collision) ===
'nat': 'F5F0DC',                    // NAT abbreviation (cream)
'natural': 'F5F5DC',                // Standard natural (keep)
'pps am230 nat': 'F5E6CE',          // PPS material natural (tan)
'thermatech pa natural': 'F5DCC0', // ThermaTech natural (warm)
'gf30 nat': 'F0E8D0',               // Glass-filled natural
'/ptfe nat': 'F5EBD0',              // PC/PTFE NAT

// === BLACK VARIANTS (prevent #1A1A1A collision) ===
'carbon black': '181818',           // Carbon-filled black
'cf carbon black': '141414',        // PC CF carbon black
'gf30 black': '1C1C1C',             // Glass-filled black
'thermatech pa black': '161616',   // ThermaTech black
'pet-g fr v0 black': '121212',      // FR V0 black

// === GOLD GLITTER VARIANTS (prevent #FFD700 collision) ===
'aurora gold': 'FFD900',            // Glitter gold 1 (brighter)
'aztec gold': 'FFCE00',             // Glitter gold 2 (warmer)
'clear gold': 'FFDC00',             // Glitter gold 3 (yellow-gold)

// === MATT VS NON-MATT VARIANTS ===
'matt navy blue': '000075',         // Slightly darker than #000080
'matt deep black': '080808',        // Slightly different from deep black
'matt olive green': '228B1E',       // Slightly different from #228B22
'matt dark grey': '4E4E4E',         // Slightly different from #505050
'matt bloody red': 'B50000',        // Slightly different from #B80000
'matt lion orange': 'FF8800',       // Slightly different from #FF8C00
\`\`\`

**VERIFICATION QUERY:**
\`\`\`sql
-- Find duplicate hex codes within same product_line_id
SELECT product_line_id, color_hex, 
       array_agg(DISTINCT color_family) as colors, 
       COUNT(DISTINCT color_family) as color_count
FROM filaments 
WHERE vendor = 'Spectrum Filaments'
GROUP BY product_line_id, color_hex
HAVING COUNT(DISTINCT color_family) > 1
ORDER BY color_count DESC;
\`\`\`
`;
  }

  if (cardCountChecks.length > 0 || colorExtractionChecks.length > 0) {
    rootCauseSection += `
### RC4: Product Line Grouping Issues (extractMaterial() / generateProductLineId())

**ROOT CAUSE:** Specialty materials are not detected and incorrectly grouped into generic lines (pla-premium, pet-g-premium).

**SPECIALTY MATERIALS THAT NEED OWN PRODUCT LINES:**
- PC/PTFE → \`spectrum__pc-ptfe__standard\`
- PPS AM230 → \`spectrum__pps-am230__standard\`
- ThermaTech PA → \`spectrum__thermatech-pa__standard\`
- PET-G FR V0 → \`spectrum__pet-g-fr-v0__standard\`
- ABS Medical → \`spectrum__abs-medical__standard\`

**FIX LOCATION 1:** \`supabase/functions/sync-spectrum-products/index.ts\` → \`extractMaterial()\` (lines 160-254)

**EXACT CODE TO ADD to extractMaterial() patterns BEFORE generic fallbacks:**
\`\`\`typescript
// Add these BEFORE generic PC, PA, PET-G patterns
[/PC[\\s\\/-]*PTFE/i, 'PC PTFE'],         // Must be before PC-275
[/PPS\\s*AM230/i, 'PPS AM230'],           // High-temp specialty
[/ThermaTech\\s*PA/i, 'ThermaTech PA'],   // High-temp PA
[/PET-?G\\s*FR\\s*V0/i, 'PET-G FR V0'],   // Fire retardant PETG
[/ABS\\s*Medical/i, 'ABS Medical'],       // Medical-grade ABS
\`\`\`

**FIX LOCATION 2:** \`supabase/functions/sync-spectrum-products/index.ts\` → \`extractColor()\` → \`materialPrefixes\` (lines 272-306)

**EXACT CODE TO ADD to materialPrefixes array:**
\`\`\`typescript
// Add to materialPrefixes array for proper color extraction
'PC/PTFE', 'PC PTFE', 'PC-PTFE',
'PPS AM230',
'ThermaTech PA',
'PET-G FR V0', 'PETG FR V0',
'ABS Medical',
'PLA Stone Age',  // Prevents "LIGHT" from being extracted alone
\`\`\`

**FIX LOCATION 3:** \`supabase/functions/run-post-sync-check/index.ts\` → \`EXPECTED_CARD_COUNTS\`

**EXACT CODE TO UPDATE:**
\`\`\`typescript
// Update spectrum-filaments expected count (should be 67 or higher with specialty lines)
'spectrum-filaments': 67,  // Was 55, now 67 with specialty lines
\`\`\`

**FIX LOCATION 4:** \`supabase/functions/_shared/spectrum-seed.ts\` → \`SPECTRUM_EXPECTED_PRODUCT_LINES\`

**EXACT CODE TO ADD:**
\`\`\`typescript
// Add new specialty product lines to SPECTRUM_EXPECTED_PRODUCT_LINES
'spectrum__pc-ptfe__standard': 2,
'spectrum__pps-am230__standard': 2,
'spectrum__thermatech-pa__standard': 2,
'spectrum__pet-g-fr-v0__standard': 2,
'spectrum__abs-medical__standard': 2,
\`\`\`

**VERIFICATION QUERY:**
\`\`\`sql
-- Check product line distribution
SELECT product_line_id, COUNT(*) as variant_count
FROM filaments
WHERE vendor = 'Spectrum Filaments'
GROUP BY product_line_id
ORDER BY product_line_id;
\`\`\`
`;
  }

  // Build AI insights section if available
  let aiInsightsSection = '';
  if (aiAnalysis) {
    const wrongDecisionsText = aiAnalysis.wrongDecisions?.length 
      ? `### Wrong Decisions Identified\n${aiAnalysis.wrongDecisions.map(d => `- ${d}`).join('\n')}\n`
      : '';
    
    aiInsightsSection = `
---

## 🤖 AI Website Analysis Results

**Swatch Architecture Detected**: ${aiAnalysis.swatchType}

${aiAnalysis.rootCause ? `### Root Cause Analysis\n${aiAnalysis.rootCause}\n` : ''}

${wrongDecisionsText}

${aiAnalysis.correctBehavior ? `### Correct Behavior Expected\n${aiAnalysis.correctBehavior}\n` : ''}

---`;
  }

  const capabilitiesText = role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n');
  const lessonsText = role.lessons?.map(l => `- ${l}`).join('\n') || 'See spectrumFilamentsSpecialist role for lessons';

  return `You are the **${role.title}** for Filascope, a comprehensive 3D printing filament database.

## CRITICAL PLATFORM CONTEXT

**Platform**: ${lessons.platform}
**Store URL**: https://ca.spectrumfilaments.com/
**Architecture**: Live Shopify API sync with background 5-step processing (NOT CSV-seeded)

---

## CORE CAPABILITIES

${capabilitiesText}

---

## SPECTRUM FILAMENTS SYNC ARCHITECTURE

This brand uses a **LIVE Shopify API** sync with complex processing:

1. **Discovery Phase**: Fetches all products from Shopify API
2. **Variant Explosion**: Creates individual records for each color variant
3. **Material Extraction**: Uses \`extractMaterial()\` with priority-ordered pattern matching
4. **Color Extraction**: Uses \`extractColor()\` with materialPrefixes array
5. **Hex Mapping**: Uses \`mapSpectrumColorToHex()\` with 200+ extendedMappings

**CRITICAL FUNCTION LOCATIONS:**
- \`extractMaterial()\` - Lines 160-254 in sync-spectrum-products/index.ts
- \`extractColor()\` - Lines 259-320 (materialPrefixes at lines 272-306)
- \`mapSpectrumColorToHex()\` - Lines 946-1200+ (extendedMappings)
- \`generateProductLineId()\` - Uses spectrum-seed.ts generateSpectrumProductLineIdFromSeed()

---

## LESSONS LEARNED (CRITICAL)

${lessonsText}

---

## PRODUCT LINE ARCHITECTURE (67 Lines)

| Category | Product Lines | Count |
|----------|--------------|-------|
| **The Filament** | PLA, PETG, CF, HS variants (NFC-compatible) | 12 |
| **PLA** | Premium, Silk, Pastel, Stone Age, Metal, Glitter, Wood, Matt, Refill | 18 |
| **PET-G** | Premium, Matt, HT, FR V0, Refill | 9 |
| **ASA** | Premium, 275, Matt | 7 |
| **Engineering** | PC, PA, HIPS, PC-275, ABS, PC/PTFE, PPS AM230, ThermaTech PA | 11 |
| **Specialty** | S-Flex TPU, AquaPrint, FlameGuard, SafeGuard, ABS Medical | 10 |

---

## ROOT CAUSE ANALYSIS FRAMEWORK

Use this framework to diagnose issues:

- **RC1**: Color extraction failures (extractColor() / materialPrefixes issues)
- **RC2**: Missing hex mappings (mapSpectrumColorToHex() / extendedMappings gaps)
- **RC3**: Duplicate hex codes (similar colors sharing same hex → Swatch Uniqueness fails)
- **RC4**: Product line grouping issues (extractMaterial() / generateProductLineId() bugs)
- **RC5**: Expected card count mismatch (EXPECTED_CARD_COUNTS needs updating)

---

## CURRENT STATUS

| Metric | Value |
|--------|-------|
| **Total Products** | ${lessons.currentStatus.totalProducts} |
| **Expected Product Lines** | ${lessons.currentStatus.expectedProductLines} |
| **Architecture** | ${lessons.currentStatus.architecture} |
| **Sub-Brands** | ${lessons.currentStatus.subBrands} |
| **Hex Mappings** | ${lessons.currentStatus.hexMappings} |

---

## KEY FILES

${lessons.keyFiles.map(f => `- \`${f}\``).join('\n')}

---

## KNOWN LIMITATIONS (DO NOT ATTEMPT THESE)

${lessons.knownLimitations.map(l => `${l}`).join('\n')}

---

## WORKING SOLUTIONS (USE THESE)

${lessons.workingSolutions.map(s => `${s}`).join('\n')}

---

## FAILED APPROACHES (AVOID)

${lessons.failedApproaches.map(f => `${f}`).join('\n')}

---
${rootCauseSection}
${aiInsightsSection}

## Fix Post Sync Check Issues for ${brand}

### Summary
- **Brand**: ${brand} (slug: spectrum-filaments)
- **Total Products**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

### Issues Found
${issuesSummary || 'All checks passing!'}

---

## Detailed Issues

${detailedIssues || 'No issues to display.'}

---

## STEP-BY-STEP FIX IMPLEMENTATION ORDER

**PRIORITY 1: Fix Missing Hex Mappings (RC2)**
1. Open \`supabase/functions/sync-spectrum-products/index.ts\`
2. Find \`mapSpectrumColorToHex()\` function (around line 946)
3. Add missing colors to \`extendedMappings\` object
4. Use unique hex codes for similar colors

**PRIORITY 2: Fix Duplicate Hex Codes (RC3)**
1. Identify all colors sharing the same hex within a product_line_id
2. Assign UNIQUE hex codes with slight variations
3. MATT variants should be slightly darker than non-MATT equivalents

**PRIORITY 3: Fix Color Extraction (RC1)**
1. Open \`supabase/functions/sync-spectrum-products/index.ts\`
2. Find \`extractColor()\` function (around line 259)
3. Add missing material prefixes to \`materialPrefixes\` array (lines 272-306)
4. CRITICAL: Do NOT add "Wood" - it breaks "WOOD ASH" extraction

**PRIORITY 4: Fix Product Line Grouping (RC4)**
1. Update \`extractMaterial()\` patterns for specialty materials
2. Add specialty patterns BEFORE generic fallbacks
3. Update \`SPECTRUM_EXPECTED_PRODUCT_LINES\` in spectrum-seed.ts

**PRIORITY 5: Update Expected Card Count (RC5)**
1. Open \`supabase/functions/run-post-sync-check/index.ts\`
2. Update \`EXPECTED_CARD_COUNTS['spectrum-filaments']\` to 67

---

## COMPREHENSIVE VERIFICATION QUERIES

\`\`\`sql
-- 1. Check for missing color_hex (should be 0)
SELECT COUNT(*) as missing_hex_count
FROM filaments 
WHERE vendor = 'Spectrum Filaments' AND color_hex IS NULL;

-- 2. List products with missing hex
SELECT product_title, color_family, product_line_id
FROM filaments 
WHERE vendor = 'Spectrum Filaments' AND color_hex IS NULL
ORDER BY product_line_id, color_family;

-- 3. Check for duplicate hex codes within product_line_id (should be 0)
SELECT product_line_id, color_hex, 
       array_agg(DISTINCT color_family) as colors, 
       COUNT(DISTINCT color_family) as duplicate_count
FROM filaments 
WHERE vendor = 'Spectrum Filaments' AND color_hex IS NOT NULL
GROUP BY product_line_id, color_hex
HAVING COUNT(DISTINCT color_family) > 1
ORDER BY duplicate_count DESC;

-- 4. Check product line count (should be 67)
SELECT COUNT(DISTINCT product_line_id) as product_line_count
FROM filaments 
WHERE vendor = 'Spectrum Filaments';

-- 5. Product line distribution
SELECT product_line_id, COUNT(*) as variant_count
FROM filaments
WHERE vendor = 'Spectrum Filaments'
GROUP BY product_line_id
ORDER BY product_line_id;

-- 6. Check specialty materials are correctly grouped
SELECT product_line_id, product_title
FROM filaments
WHERE vendor = 'Spectrum Filaments'
AND (
  product_title ILIKE '%PC/PTFE%' OR
  product_title ILIKE '%PPS AM230%' OR
  product_title ILIKE '%ThermaTech%' OR
  product_title ILIKE '%FR V0%' OR
  product_title ILIKE '%Medical%'
)
ORDER BY product_line_id;

-- 7. Verify Stone Age colors extracted correctly
SELECT product_title, color_family, color_hex
FROM filaments
WHERE vendor = 'Spectrum Filaments' 
AND product_title ILIKE '%Stone Age%';
\`\`\`

---

## SYNC EXECUTION STEPS

1. **Deploy** updated edge functions (\`sync-spectrum-products\` and \`run-post-sync-check\`)
2. **Run Clean Slate** sync for Spectrum Filaments from Brand Sync Manager
3. **Check edge function logs** for:
   - Total products processed (~662)
   - Product line count (~67)
   - Any color extraction warnings
4. **Run Post Sync Check** again - should show 0 failures
5. **Spot-check** UI to confirm:
   - Correct card count (67 product lines)
   - Unique swatches per product line
   - Specialty materials have their own cards

---

*Last Updated: 2026-01-14*`;
}

function generateRecreusFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: AIWebsiteAnalysis | null
): string {
  const role = AI_ROLES.recreusSpecialist;
  
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
      check.products.slice(0, 10).forEach(p => {
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

  // AI insights section if available
  let aiInsightsSection = '';
  if (aiAnalysis) {
    const wrongDecisionsText = aiAnalysis.wrongDecisions?.length 
      ? `### Wrong Decisions Identified\n${aiAnalysis.wrongDecisions.map(d => `- ${d}`).join('\n')}\n`
      : '';
    
    aiInsightsSection = `
---

## 🤖 AI Website Analysis Results

**Swatch Architecture Detected**: ${aiAnalysis.swatchType}

${aiAnalysis.rootCause ? `### Root Cause Analysis\n${aiAnalysis.rootCause}\n` : ''}

${wrongDecisionsText}

${aiAnalysis.correctBehavior ? `### Correct Behavior Expected\n${aiAnalysis.correctBehavior}\n` : ''}

---`;
  }

  const capabilitiesText = role.capabilities.map((cap, i) => `${i + 1}. **${cap}**`).join('\n');
  const lessonsText = role.lessons?.map(l => `- ${l}`).join('\n') || 'See recreusSpecialist role for lessons';

  return `You are the **${role.title}** for Filascope.

## PLATFORM CONTEXT

**Platform**: Shopify (recreus.com - EUR primary, USD/CAD available)
**Currency**: EUR (primary), USD, CAD
**Architecture**: CSV-seeded sync pipeline (~70 products, 14 product lines)

---

## CORE CAPABILITIES

${capabilitiesText}

---

## CSV-SEEDED SYNC ARCHITECTURE

Recreus sync uses a **hardcoded CSV seed** as the primary data source:

1. **RECREUS_PRODUCT_SEED** (~70 products) in \`recreus-seed.ts\` contains:
   - Product names, colors, hex codes, product URLs
   - Only 1.75mm, consumer-focused spool sizes (500g-1kg)
   
2. **Filtering Rules Applied:**
   - EXCLUDE: Pellet products (industrial, not consumer)
   - EXCLUDE: Footwearology editions (specialty limited run)
   - EXCLUDE: PP3D Primer (not filament)
   - EXCLUDE: 2.85mm/3.0mm diameter, samples (<300g), bulk (>5.5kg)
   - DEDUPLICATE: Same color with multiple weight variants
   
3. **RECREUS_COLOR_MAPPING** provides hex codes for 40+ colors including Spanish names

---

## KNOWN LESSONS

${lessonsText}

---

## PRODUCT LINE ARCHITECTURE (14 Lines)

| Material | Product Line ID | Notes |
|----------|-----------------|-------|
| TPU-60A | recreus__tpu-60a__standard | Softest, ~3 colors |
| TPU-70A | recreus__tpu-70a__standard | ~6 colors |
| TPU-82A | recreus__tpu-82a__standard | Most popular, 15+ colors |
| TPU-95A | recreus__tpu-95a__standard | Firmest, 10+ colors |
| TPU-FOAM | recreus__tpu-foam__standard | Expanded foam, 7 colors |
| TPU-SEBS | recreus__tpu-sebs__standard | 2 colors |
| TPU-Conductive | recreus__tpu-conductive__standard | Black only |
| TPU-Purifier | recreus__tpu-purifier__standard | Mineral only |
| TPU-Bio | recreus__tpu-bio__standard | Balena series, 2 colors |
| rTPU | recreus__rtpu__standard | Reciflex recycled, Black only |
| PLA | recreus__pla__standard | Basic PLA, 4 colors |
| PLA-LW | recreus__pla-lw__standard | Lightweight, 2 colors |
| PETG | recreus__petg__standard | PET-G HF, 10+ colors |
| PETG-CF | recreus__petg-cf__standard | Carbon fiber, 1 color |
| PP | recreus__pp__standard | Polypropylene, 2 colors |

---

## ROOT CAUSE ANALYSIS FRAMEWORK

- **RC1**: CSV seed missing products/colors
- **RC2**: Color-to-hex mapping gaps (including Spanish names like Negro, Blanco, Rojo)
- **RC3**: Material normalization bugs (Shore hardness detection: 60A, 70A, 82A, 95A)
- **RC4**: Product line ID grouping issues (Foamy vs non-Foamy confusion)
- **RC5**: Pellet/non-filament products not excluded

---

## SPANISH COLOR NAME MAPPINGS

| Spanish | English | Hex |
|---------|---------|-----|
| Negro | Black | #1C1C1C |
| Blanco | White | #FFFFFF |
| Rojo | Red | #C41E3A |
| Azul | Blue | #0066CC |
| Verde | Green | #228B22 |
| Amarillo | Yellow | #FFD700 |
| Naranja | Orange | #FF6B35 |
| Transparente | Transparent | #FFFFFF |
| Azul Marino | Navy Blue | #000080 |

---

## KEY FILES

- \`supabase/functions/_shared/recreus-seed.ts\` - CSV seed data
- \`supabase/functions/_shared/recreus-defaults.ts\` - Enrichment, hex mapping
- \`supabase/functions/sync-recreus-products/index.ts\` - Sync function

---
${aiInsightsSection}

## Fix Post Sync Check Issues for ${brand}

### Summary
- **Brand**: ${brand} (slug: recreus)
- **Total Products**: ${totalProducts}
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

### Issues Found
${issuesSummary}

---

## Detailed Issues

${detailedIssues}

---

## Verification Steps

1. Run **Clean Slate** sync for Recreus
2. Run **Post Sync Check** to verify 0 failures
3. Confirm 14 product lines and ~70 products
4. Verify Spanish color names are mapped correctly
5. Check that FilaFlex 95A Foamy is separate from FilaFlex 95A

---

*Last Updated: 2026-01-13*`;
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
  
  // Use brand-specific prompt generator for ColorFabb
  if (brandSlug === 'colorfabb') {
    return generateColorFabbFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Eryone
  if (brandSlug === 'eryone') {
    return generateEryoneFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Extrudr
  if (brandSlug === 'extrudr') {
    return generateExtrudrFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Fiberlogy
  if (brandSlug === 'fiberlogy') {
    return generateFiberlogyFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Geeetech
  if (brandSlug === 'geeetech') {
    return generateGeeetechFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Matter3D
  if (brandSlug === 'matter3d') {
    return generateMatter3dFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for NinjaTek
  if (brandSlug === 'ninjatek') {
    return generateNinjatekFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Numakers
  if (brandSlug === 'numakers') {
    return generateNumakersFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Overture
  if (brandSlug === 'overture') {
    return generateOvertureFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Polymaker
  if (brandSlug === 'polymaker') {
    return generatePolymakerFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Proto-Pasta
  if (brandSlug === 'proto-pasta') {
    return generateProtoPastaFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Push Plastic
  if (brandSlug === 'push-plastic') {
    return generatePushPlasticFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Recreus
  if (brandSlug === 'recreus') {
    return generateRecreusFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Sunlu
  if (brandSlug === 'sunlu') {
    return generateSunluFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Use brand-specific prompt generator for Spectrum Filaments
  if (brandSlug === 'spectrum-filaments') {
    return generateSpectrumFilamentsFixPrompt(brand, checks, totalProducts, aiAnalysis);
  }
  
  // Determine the best AI role for this specific set of issues
  const role = determineAIRole(checks, brandSlug);
  
  // Determine brand-specific sync file path
  const hasDedicatedSyncFunction = [
    'anycubic', 'amolen', 'polymaker', 'hatchbox', '3d-fuel', 'sunlu', 
    'eryone', 'overture', 'push-plastic', 'proto-pasta', '3dxtech', 
    'ninjatek', 'fiberlogy', 'colorfabb', 'prusament', 'extrudr', 'geeetech'
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
    // Review widget UI text (Yotpo, Judge.me, Stamped.io, etc.)
    'all ratings', 'star rating', 'reviews', 'write a review',
    'read reviews', 'customer reviews', 'verified purchase',
    'based on', 'average rating', 'sort by', 'filter by',
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

    // ============= CRITICAL VISIBILITY CHECK =============
    // Verify that automated_brands.brand_name matches filaments.vendor case-sensitively
    // This is critical because the UI uses case-sensitive filtering
    
    const { data: automatedBrand } = await supabase
      .from("automated_brands")
      .select("brand_name, display_name")
      .eq("brand_slug", brandSlug)
      .single();
    
    if (automatedBrand) {
      // Get the actual vendor values used in filaments for this brand
      const { data: vendorSample } = await supabase
        .from("filaments")
        .select("vendor")
        .ilike("vendor", brandName)
        .limit(1);
      
      const actualVendor = vendorSample?.[0]?.vendor;
      const brandNameMatches = actualVendor === automatedBrand.brand_name;
      
      checks.push({
        checkName: "Brand Name UI Visibility",
        status: brandNameMatches ? "pass" : "fail",
        count: brandNameMatches ? 1 : 0,
        details: brandNameMatches 
          ? `Brand name "${automatedBrand.brand_name}" matches filaments vendor "${actualVendor}"` 
          : `CRITICAL: automated_brands.brand_name="${automatedBrand.brand_name}" does NOT match filaments.vendor="${actualVendor}". Products will NOT appear in Finder UI!`,
        products: !brandNameMatches && actualVendor ? [{
          id: brandSlug,
          title: `Fix automated_brands.brand_name`,
          issue: `Change "${automatedBrand.brand_name}" to "${actualVendor}" in automated_brands table`,
        }] : undefined,
      });
    }

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
    
    // Skip image coverage check for CSV-seeded brands with no image data (known limitation)
    const NO_IMAGE_BRANDS = ['extrudr', 'fiberlogy', 'gizmo-dorks', 'paramount-3d', 'prusament'];
    const isNoImageBrand = NO_IMAGE_BRANDS.some(b => 
      brandSlug?.toLowerCase() === b || brandName?.toLowerCase() === b
    );

    if (isNoImageBrand) {
      checks.push({
        checkName: "Product Images Coverage",
        status: "pass",
        count: 0,
        details: `Image coverage check skipped - ${brandName} uses CSV-seeded data without image URLs (known limitation)`,
        products: undefined,
      });
    } else {
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
      // Skip for brands that use product-line level images (servers may return 404 for HEAD requests)
      const brandSlugLower = brandSlug.toLowerCase();
      if (PRODUCT_LEVEL_IMAGE_BRANDS.includes(brandSlugLower)) {
        const productsWithImagesCount = allProductsForImages?.filter(p => p.featured_image).length || 0;
        checks.push({
          checkName: "Image URLs Valid",
          status: "pass",
          count: productsWithImagesCount,
          details: `Skipped for ${brandName} (uses product-line level images)`,
        });
      } else {
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
      }
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
          // Skip for CSV-seeded brands where DB titles intentionally include color suffix
          const skipTitleCheckBrands = ['eryone', 'esun', 'extrudr', 'fusion-filaments', 'geeetech', 'hatchbox', 'ic3d-printers', 'matter3d', 'ninjatek', 'overture', 'paramount-3d', 'polymaker', 'prusament', 'push-plastic', 'recreus', 'siraya-tech']; // CSV-seeded brands and Shopify brands with intentional " - Color" suffixes
          const shouldSkipTitleCheck = skipTitleCheckBrands.includes(brandSlug);
          
          if (shouldSkipTitleCheck) {
            console.log(`[PostSyncCheck] Skipping title accuracy check for ${brandSlug} - CSV-seeded with intentional color suffixes`);
          } else if (pageInfo.pageTitle) {
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
          // Skip for brands with known website scraping false positives (e.g., page shows unrelated colors)
          // - matter3d: website HTML shows incorrect "magenta" from other page elements
          // - polymaker: website shows "you will love it" marketing text as color option
          // - proto-pasta: website scraping picks up navigation text like "makers of protopasta, scroll to top"
          const skipColorNameCheckBrands = ['matter3d', 'polymaker', 'proto-pasta', 'recreus', 'siraya-tech'];
          const shouldSkipColorNameCheck = skipColorNameCheckBrands.includes(brandSlug);
          
          if (pageInfo.colorSwatches.length > 0 && !shouldSkipColorNameCheck) {
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

            // UI text patterns to filter out (not actual color names)
            const UI_TEXT_PATTERNS = [
              /mixable/i,
              /can mix color/i,
              /out of stock/i,
              /select option/i,
              /choose a/i,
              /sold out/i,
              /coming soon/i,
              /pre[-\s]?order/i,
              /notify me/i,
              /^\s*\)?\s*$/,  // Empty or just parentheses
              /^[\d\s.,]+$/,  // Just numbers (prices, weights)
            ];

            const pageColorNames = new Set(
              pageInfo.colorSwatches
                .map(s => s.name.toLowerCase())
                .filter(name => !UI_TEXT_PATTERNS.some(pattern => pattern.test(name)))
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
    
    // Helper to extract color name from product title (removes weight/diameter/NFC/Refill suffixes)
    const extractColorFromTitle = (title: string): string => {
      // Remove common suffixes: "1.75mm", "2.85mm", "1kg", "4kg", "500g", NFC, Refill, etc.
      return title
        .replace(/,?\s*\d+(\.\d+)?\s*(kg|g|mm)\b/gi, '')  // Weight/diameter
        .replace(/,?\s*\d+\s*spool\b/gi, '')              // Spool count
        .replace(/\s*\(nfc\s*compatible\)\s*/gi, '')      // NFC Compatible suffix
        .replace(/\s*\(nfc\)\s*/gi, '')                   // NFC suffix
        .replace(/\s*refill\s*/gi, ' ')                   // Refill keyword
        .replace(/\s+/g, ' ')                             // Normalize spaces
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
      const refillDuplicateExpectedBrands = ['azurefilm', 'prusament'];
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
    
    // Skip brands that use verbose seed titles but have clean UI display names (by design)
    const skipUIDisplayNameBrands = ['gizmo-dorks', 'polymaker', 'proto-pasta', 'prusament', 'push-plastic', 'sovol', 'spectrum-filaments'];
    const uiDisplayIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Simulate formatProductLineIdForDisplay logic (from src/lib/productNameUtils.ts)
    const simulateUIDisplayName = (productLineId: string, productTitle: string): string => {
      const parts = productLineId.split('__');
      
      // FORMFUTURA: Use cleaned product_title directly (removes color suffix)
      // The product_title is authoritative, e.g., "High Gloss PLA ColorMorph - Lava" → "High Gloss PLA ColorMorph"
      if (parts[0] === 'formfutura' && productTitle) {
        const cleaned = productTitle
          .replace(/\s*-\s*[^-]+$/, '')  // Remove trailing color suffix: "High Gloss PLA ColorMorph - Lava" → "High Gloss PLA ColorMorph"
          .replace(/^FormFutura\s+/gi, '')
          .replace(/\s+Filament\s*$/i, '')
          .replace(/\s*,?\s*\d+\.?\d*\s*mm\b/gi, '')
          .replace(/\s*,?\s*\d+\.?\d*\s*kg\b/gi, '')
          .trim();
        return cleaned || productTitle;
      }
      
      // ELEGOO: Use the database product_title directly (from Shopify H1)
      // The product_title is the authoritative source, not the product_line_id
      // This ensures card titles match detail page titles exactly
      if (parts[0] === 'elegoo' && productTitle) {
        // Clean the title - remove brand name, "Filament" suffix, and weight/diameter specs
        const cleaned = productTitle
          .replace(/^Elegoo\s+/gi, '')
          .replace(/\s+Filament\s*$/i, '')
          .replace(/\s*,?\s*\d+\.?\d*\s*mm\b/gi, '')
          .replace(/\s*,?\s*\d+\.?\d*\s*kg\b/gi, '')
          .trim();
        return cleaned || productTitle;
      }
      
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
      
      // EXTRUDR: Use product_line_id slug with custom display name mapping
      // Format: "extrudr__biofusion" → "BioFusion", "extrudr__flex-medium" → "FLEX Medium"
      if (parts[0] === 'extrudr' && parts.length === 2) {
        const productSlug = parts[1];
        
        // Map slugs to proper display names (matching formatProductLineIdForDisplay in productNameUtils.ts)
        const EXTRUDR_DISPLAY_NAMES: Record<string, string> = {
          'biofusion': 'BioFusion',
          'durapro-abs': 'DuraPro ABS',
          'durapro-abs-cf': 'DuraPro ABS CF',
          'durapro-asa': 'DuraPro ASA',
          'durapro-pa12': 'DuraPro PA12',
          'durapro-pc-pbt': 'DuraPro PC-PBT',
          'flax': 'FLAX',
          'flex-hard': 'FLEX Hard',
          'flex-medium': 'FLEX Medium',
          'flex-semisoft': 'FLEX Semisoft',
          'greentec': 'GreenTEC',
          'greentec-pro': 'GreenTEC Pro',
          'greentec-pro-carbon': 'GreenTEC Pro Carbon',
          'pctg': 'PCTG',
          'petg': 'PETG',
          'xpetg': 'xPETG',
          'xpetg-cf': 'xPETG CF',
          'pla-nx2-matt': 'PLA NX2 Matt',
        };
        
        return EXTRUDR_DISPLAY_NAMES[productSlug] || 
          productSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      
      // NUMAKERS: Handle underscore-based material slugs
      // Format: numakers__pla_silk__pla-silk → "PLA Silk"
      //         numakers__petg_hs__petg-hs-filament → "PETG-HS"
      //         numakers__pla_starlight__pla-starlight → "PLA Starlight"
      if (parts[0] === 'numakers' && parts.length >= 3) {
        const materialSlug = parts[1]; // e.g., "pla_silk", "petg_hs", "pla+"
        const lineSlug = parts[2];     // e.g., "pla-silk", "petg-hs-filament"
        
        // Map material slugs to clean display names
        const NUMAKERS_MATERIAL_DISPLAY: Record<string, string> = {
          'pla+': 'PLA+',
          'pla_silk': 'PLA Silk',
          'pla_matte': 'PLA Matte',
          'pla_starlight': 'PLA Starlight',
          'pla_glow': 'PLA Glow in the Dark',
          'pla_marble': 'PLA Marble',
          'pla_wood': 'PLA Wood',
          'pla_cf': 'PLA-CF',
          'petg_hs': 'PETG-HS',
          'petg_translucent': 'PETG Translucent',
          'asa': 'ASA',
          'abs': 'ABS',
        };
        
        // Check for special line slug patterns
        if (lineSlug === 'tri-color-silk-pla') {
          return 'Tri-Color Silk PLA';
        }
        
        return NUMAKERS_MATERIAL_DISPLAY[materialSlug] || 
          materialSlug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      
      // OVERTURE: Handle product line names from CSV seed
      // Format: overture__pla__basic → "Basic PLA"
      //         overture__pla__matte → "Matte PLA"
      //         overture__pla__rock → "Rock PLA"
      //         overture__tpu__high-speed → "High Speed TPU"
      if (parts[0] === 'overture' && parts.length >= 3) {
        const materialSlug = parts[1]; // e.g., "pla", "petg", "tpu"
        const lineSlug = parts[2];     // e.g., "basic", "matte", "rock", "high-speed"
        
        // Map line slugs to clean display names
        const OVERTURE_LINE_DISPLAY: Record<string, string> = {
          'basic': 'Basic',
          'matte': 'Matte',
          'silk': 'Silk',
          'easy': 'Easy',
          'glow': 'Glow',
          'rock': 'Rock',
          'super': 'Super',
          'professional': 'Professional',
          'high-speed': 'High Speed',
          'translucent': 'Translucent',
          'refill': 'Refill',
        };
        
        const material = materialSlug.toUpperCase();
        const line = OVERTURE_LINE_DISPLAY[lineSlug] || 
          lineSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        return `${line} ${material}`.trim();
      }
      
      // GEEETECH: Handle underscore-based slugs in product_line_id
      // Examples: geeetech__pla__silk_tri → "PLA Silk Tri-Color"
      //           geeetech__pla__hs_pla → "PLA High Speed"
      //           geeetech__pla_marble__standard → "PLA Marble"
      if (parts[0] === 'geeetech' && parts.length >= 3) {
        const materialSlug = parts[1]; // e.g., "pla", "pla_cf", "pla_marble"
        const lineSlug = parts[2];     // e.g., "silk_tri", "standard", "hs_pla"
        
        // Build material name from slug
        let material = materialSlug
          .replace(/_/g, ' ')
          .toUpperCase()
          .replace(/\bCF\b/g, '-CF')     // "PLA CF" → "PLA-CF"
          .replace(/\bGF\b/g, '-GF')     // "PETG GF" → "PETG-GF"
          .replace(/\bMARBLE\b/g, 'Marble')  // "PLA MARBLE" → "PLA Marble"
          .replace(/\bWOOD\b/g, 'Wood')      // "PLA WOOD" → "PLA Wood"
          .trim();
        
        // Format line name (skip "standard")
        let lineName = '';
        if (lineSlug && lineSlug !== 'standard') {
          lineName = lineSlug
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            // Fix specific Geeetech patterns
            .replace(/^Silk Tri$/i, 'Silk Tri-Color')
            .replace(/^Silk Dual$/i, 'Silk Dual-Color')
            .replace(/^Silk Rainbow$/i, 'Silk Rainbow')
            .replace(/^Hs Pla$/i, 'High Speed')
            .replace(/^Hs$/i, 'High Speed')
            .replace(/\bPla\b/g, '')  // Remove redundant "Pla" from line name
            .trim();
        }
        
        // Combine material and line name
        return lineName ? `${material} ${lineName}`.trim() : material.trim();
      }
      
      if (parts.length >= 3) {
        // 3+ part format: "vendor__material__line-name"
        const material = parts[1]?.toUpperCase() || '';
        const lineParts = parts.slice(2).join(' ');
        let lineName = lineParts
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
          .replace(/\bHs\b/g, 'HS')
          .trim();
        
        // Only strip internal tags, keep product line identifiers like "Matte", "Silk"
        lineName = lineName.replace(/\b(Composite|Standard)\b/gi, '').trim();
        
        // Strip redundant suffixes only if already in material slug
        const materialLower = material.toLowerCase();
        const redundantSuffixes = ['Metallic', 'Silk', 'Galaxy', 'Marble', 'Matte', 'Sparkle', 'Wood', 'Carbon Fiber', 'Glass Fiber'];
        for (const suffix of redundantSuffixes) {
          const suffixKey = suffix.toLowerCase().replace(' ', '').replace('-', '');
          if (materialLower.includes(suffixKey) || materialLower.includes(suffix.toLowerCase().split(' ')[0])) {
            lineName = lineName.replace(new RegExp(`\\b${suffix}\\b`, 'gi'), '').trim();
          }
        }
        
        if (!lineName) return material;
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
    
    // Skip brands that use verbose seed titles but have clean UI display names (by design)
    const skipUIDisplayCheck = skipUIDisplayNameBrands.includes(brandSlug);
    
    // Group by product_line_id and check one representative per group
    const checkedProductLines = new Set<string>();
    
    for (const product of uiCheckProducts || []) {
      if (skipUIDisplayCheck) {
        // Just track for count, don't validate
        if (product.product_line_id) checkedProductLines.add(product.product_line_id);
        continue;
      }
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
        // Exclude "glow" for FormFutura since "Glow in the Dark" products have glow in line name
        const significantMissingWords = missingWords.filter(w => {
          if (brandSlug === 'formfutura' && w === 'glow') return false;
          return ['high', 'speed', 'silk', 'matte', 'marble', 'glow', 'galaxy', 'metal', 'plus', 'basic', 'special', 'translucent'].includes(w);
        });
        
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
      status: skipUIDisplayCheck ? "skipped" : (uiDisplayIssues.length === 0 ? "pass" : uiDisplayIssues.length <= 2 ? "warning" : "fail"),
      count: checkedProductLines.size - uiDisplayIssues.length,
      details: skipUIDisplayCheck 
        ? `Skipped for ${brandName} (uses verbose seed titles with clean UI display)`
        : (uiDisplayIssues.length === 0
          ? `${checkedProductLines.size} product lines will display correctly in the UI`
          : `CRITICAL: ${uiDisplayIssues.length} products will show incorrect names in FilamentCard/FilamentDetail`),
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
      'elegoo': 13,             // PLA Standard, Silk, Matte, Sparkle, Galaxy, Marble, Metal, Wood, PLA-CF, PETG Pro, PETG-CF, PETG-GF, Rapid PETG
      'anycubic': 19,           // PLA+, PLA Silk, PLA Galaxy, PLA High Speed, PETG, ABS, ASA, TPU, etc.
      'push-plastic': 14,       // CSV-seeded: PLA, PETG, PCTG, ABS, ABS-Matte, ASA, PC+PBT, PLA-HT, TPU-98A, HIPS, ABS-CF, PETG-CF, PA-CF, PC-CF (PEI/PMMA discontinued for consumer sizes)
      'proto-pasta': 31,        // 31 distinct product lines: HTPLA (standard, opaque, translucent, glitter, metallic, nebula, reflective, thermochromic, smoothie, glow, marble, matte-fiber, wood, brass, bronze, copper), PLA (iron, steel, cf, conductive, esd, calcium-carbonate), PETG (standard, cf, esd), HFPLA (c-matte), POK (cf), TPU (flexible, rigid), HTPLA-CF, HTPLA-GF
      '3d-fuel': 8,             // Standard PLA, Pro PLA, PETG, ABS, Biome3D, Buzzed, Entwined, Landfillament
      '3dxtech': 25,            // PEEK, PEKK, PEI, Carbon Fiber variants, etc.
      'eryone': 54,             // 54 distinct filament lines from 318-product CSV seed (PLA, PLA+, PETG, ABS, ASA, TPU, PA, PP + all variants)
      '3dhojor': 12,            // PLA, PETG, Silk, Matte, Marble, etc.
      'sunlu': 18,              // Updated: 18 product lines after aggressive MOQ/3kg/5kg filtering - actual obtainable lines from Shopify API
      'siraya-tech': 21,        // CSV-seeded filaments: 15 Fibreheart (engineering) + 4 Flex (TPU) + 2 Rebound (PEBA) = 21 product lines
      'sovol': 4,               // PLA, PETG, Silk PLA, Glow PLA (after bulk filtering)
      'flashforge': 8,          // PLA, ABS, PETG, TPU, Adventurer series
      'duramic-3d': 3,          // PLA, PETG, TPU
      
      // Medium-confidence counts (product_line_id may need population)
      'overture': 15,           // PLA, PLA Pro, PETG, TPU, ABS, Silk, Matte, etc.
      'bambu-lab': 40,          // PLA, PETG, ABS, ASA, TPU 85A, TPU 90A, TPU 95A HF, PLA-CF, PAHT-CF, Marble, Silk, Sparkle, etc.
      'fillamentum': 22,        // PLA Extrafill, Crystal Clear, ASA, ABS, PETG, CPE HG100, CPE-CF, Flexfill TPU 98A/92A, TPE-90A/96A, Nylon FX256, Nylon CF15, Nylon AF80, Timberfill, HIPS, Vinyl, PP, NonOilen, 0rCA, Porthcurno
      'azurefilm': 19,          // ABS (Plus, Prime), ASA (Standard, Prime), Carbon Fiber (PAHT-CF, PET-CF), PC-ABS, PCTG (Standard, Translucent), PETG (Hyper Speed, Translucent), PLA (Original, Standard, Matte HS, Silk, Translucent, Strongman), LumberLay, PVA
      'ninjatek': 9,            // NinjaFlex 85A, Edge 83A, Chinchilla 75A, Cheetah 95A, Armadillo 75D + colorFabb ASA, PLA, Co-Polyesters, Specials (Eel/PA excluded - diameter-only variants)
      'polymaker': 78,          // Panchroma (28 sub-lines) + PolyLite (12) + PolyMax (4) + PolyFlex (3) + Fiberon (14) + PolySonic (2) + Specialty (9) + Polymaker ASA/PETG (2) + New lines (4)
      'colorfabb': 25,          // varioShore TPU (foaming + prosthetic), LW-PLA, LW-PLA-HT, LW-ASA, PLA High Speed Pro, PLA-HP, PLA Silk, nGen, nGen Flex, nGen CF, XT, XT-CF, HT, ASA, PETG Economy, PLA Economy, PA, bronzeFill, copperFill, steelFill, corkFill, woodFill, bambooFill, stoneFill, allPHA
      'prusament': 26,          // CSV-seeded: PLA, PLA Galaxy, PLA Blend, PLA Premium, PLA Marble, PLA Noctua, PLA Opal, PLA Recycled, PETG, PETG Matte, PETG Shimmer, PETG Tungsten, PETG Magnetite, PETG Recycled, ASA, PC Blend, PC Carbon, PC Space-Grade, PA11-CF, PP-CF, PP-GF, PVB, PEI ULTEM, TPU-95A, rPLA, Woodfill
      'matter3d': 18,           // Consolidated lines: pla__basics, pla__basics-matte, pla__basics-silk, pla__basics-cf, pla__basics-recycled, pla__performance, pla__performance-matte, pla__essentials, pla_plus__performance, petg__performance, petg__performance-matte, petg__performance-hf, petg__performance-cf-hf, petg__standard, asa__performance, abs__performance-cf, pa__performance, tpu_95a__standard
      'esun': 39,               // CSV-seeded: 39 distinct product lines from 360+ products (PLA-Basic, PLA-Matte, PLA-Silk, PLA+HS, PETG, ABS+, TPU-95A, etc.)
      'creality': 17,           // Hyper Series (PLA/PETG/ABS/PC), RFID, Stardust, Rainbow, Soleyin Ultra, CR-Silk, CR-Wood, Ender Fast, HP-ASA, HP-TPU, PPA-CF, CF variants
      'fiberlogy': 19,          // CSV-seeded: ABS, ABS Plus, Easy ABS, ASA, Easy PLA, Easy PETG, FiberFlex 30D/40D, FiberSilk, FiberWood, HIPS, HS PLA Clear, Impact PLA, Matte PLA, Matte PETG, MattFlex 40D, Nylon PA12, PCTG, PP
      'amolen': 33,             // Silk, Matte, Dual Color, Galaxy, Rainbow, Glow, Wood, Marble, etc.
      'hatchbox': 17,           // CSV-seeded: pla-standard, pla-matte, pla-silk, pla-metallic, pla-glow, pla-wood, pla-stone, pla-rainbow, pla-reload, pla-cf, pla-color-change, pla-pro-plus, pla-max-v2, petg-standard, petg-rapid, abs-standard, tpu-standard
      'formfutura': 80,         // CSV-seeded: 80 product lines (EasyFil ePLA, Volcano PLA, HDglass, ApolloX, AthenaX, LUVOCOM, PEI ULTEM, etc.)
      'extrudr': 18,            // BioFusion, DuraPro (ABS/ASA/PA12/PC-PBT + CF variants), FLAX, FLEX (3), GreenTEC (3), PCTG, PETG, xPETG (2), PLA NX2 Matt
      'geeetech': 18,           // CSV-seeded: 18 product lines (PLA, Silk, Silk Dual/Tri/Rainbow, Sparkly, CF, Marble, Wood, Matte, Luminous, HS-PLA, PETG, PETG Metallic, ABS+, ASA, TPU)
      'fusion-filaments': 8,    // CSV-seeded: HTPLA+, HT-PET, ASA, EasyASA, ABS Gloss, ABS Matte, HT-ABS Matte, PCTG
      'spectrum-filaments': 68, // Updated: 68 product lines (includes ASA-X CF10 ReFill variant)
      'ultimaker': 10,          // S-Series materials
      'numakers': 13,           // CSV-seeded: PLA+, PLA Silk, Tri-Color Silk, PLA Matte, PLA Starlight, PLA Glow, PLA Marble, PLA Wood, PLA-CF, PETG-HS, PETG Translucent, ASA, ABS
      'recreus': 14,            // CSV-seeded: TPU-60A, TPU-70A, TPU-82A, TPU-95A, TPU-FOAM, TPU-95A-FOAM, TPU-SEBS, TPU-Conductive, TPU-Purifier, TPU-Bio, rTPU, PETG, PLA, PP
      'treed-filaments': 15,    // Ecogenius, Shogun, Carbonio, etc.
      'voxelpla': 5,            // Basic PLA lines
      'ziro': 10,               // PLA, PETG, Silk, etc.
      'paramount-3d': 14,       // CSV-seeded: PLA (7 sub-lines: standard, stone, shimmer, skin-tones, military, matte, masterspool), PETG, ABS, ASA, FlexPLA, TPU, PVA, Nylon = 14 total product lines
      'cc3d': 10,               // PLA, PETG, Ceramic, Metal lines
      'kingroon': 17,           // CSV-seeded: PLA Basic, Matte PLA, Silk Gold, Silk Tricolor, Silk Rainbow (Candy/Macaroon/Universer), PETG Standard, HS-PETG, TPU Standard, ABS Standard, Marble PLA, Glow PLA, PLA-CF, PETG-CF, ABS-CF, PA-CF
      'ic3d-printers': 10,      // 10 product lines: ABS, PETG, PETG-CF, PLA, PLA+, Matte PLA+, UV-PETG, rPETG, Matte rPETG, PolyHex
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
      'polymaker': [/^(Panchroma|PolyLite|PolyTerra|PolyMax|PolyMide|PolyDissolve|PolySmooth|PolyCast|PolyFlex|PolySonic|PolySupport|Fiberon|HT-PLA|CosPLA|Draft|Wood|Galaxy|PC-|Matte PLA)/i],
      'prusament': [/^(PLA|PETG|ASA|PC Blend|PA11|PVB|rPLA)/i],
      'bambu-lab': [/^(PLA|PETG|ABS|ASA|TPU|PLA-CF|PAHT-CF|PA6-CF|Marble|Silk|Sparkle|Matte|Glow|Galaxy|Metal|Wood)/i],
      'fillamentum': [/^(Extrafill|Flexfill|NonOilen|CPE|ASA|Timberfill|Vinyl)/i],
      'azurefilm': [/^(PLA|PETG|ABS|ASA|Silk|Wood|Hyper Speed|High Speed|LumberLay|Lumos)/i],
      'ninjatek': [/^(Cheetah|NinjaFlex|Armadillo|Eel|SemiFlex)/i],
      'fiberlogy': [/^(ABS|ABS Plus|Easy ABS|ASA|Easy PLA|Easy PETG|FiberFlex|FiberSilk|FiberWood|HIPS|HS PLA|Impact PLA|Matte PLA|Matte PETG|MattFlex|Nylon PA12|PCTG|PP)/i],
      'overture': [/^(PLA|PLA Pro|PLA\s*\+|PETG|TPU|ABS|Silk|Matte|Rock|Air)/i],
      'hatchbox': [/^(PLA|PLA\s*\+|PETG|ABS|TPU|Silk|Wood|Reload)/i],
      'sunlu': [/^(PLA|PLA\s*\+|PETG|TPU|ABS|ASA|Silk|Meta|E-ABS)/i],
      'eryone': [/^(PLA|PLA\s*\+|PETG|TPU|Silk|Galaxy|Matte|Marble|Tri-Color|Dual-Color)/i],
      '3d-fuel': [/^(Standard PLA|Pro PLA|Tough Pro|Pro PETG|Pro PCTG|Biome3D|Buzzed|Entwined|Wound Up|Landfillament)/i],
      '3dxtech': [/^(PEEK|PEKK|PEI|ULTEM|CarbonX|ESD|PETG|ABS|ASA|Nylon|PA|PC)/i],
      'proto-pasta': [/^(PLA|HTPLA|CFPLA|Carbon Fiber|Stainless Steel|Copper|Bronze|Iron)/i],
      'esun': [/^(PLA|PLA\s*\+|PLA[\s-]*Basic|PLA[\s-]*Matte|PLA[\s-]*Silk|PETG|ABS|TPU|PA|PC|ASA)/i],
      'creality': [/^(Hyper|Ender|PLA|PETG|ABS|TPU|High Speed)/i],
      'colorfabb': [
        /^(varioShore|LW[- ]?PLA|LW[- ]?ASA)/i,           // Lightweight/specialty foaming materials
        /^(PLA (High Speed Pro|Economy|Silk|Semi[- ]?Matte)|PLA-HP)/i, // PLA variants
        /^(PETG (Economy|Semi[- ]?Matte))/i,              // PETG variants
        /^(nGen|nGen[- ]?Flex|nGen[- ]?CF)/i,             // nGen family (Amphora)
        /^(HT|XT|XT[- ]?CF)/i,                            // High-temp Amphora
        /^(ASA|PA|PA[- ]?CF)/i,                           // Engineering materials
        /^(bronze[Ff]ill|copper[Ff]ill|steel[Ff]ill|brass[Ff]ill)/i, // Metal fills
        /^(wood[Ff]ill|cork[Ff]ill|bamboo[Ff]ill|stone[Ff]ill)/i,    // Natural fills
        /^(allPHA)/i,                                      // Biodegradable
      ],
      'formfutura': [
        /^(EasyFil|HDglass|ApolloX|Volcano|Flexifil|Galaxy|ReForm|Premium|Tough)/i,
        /^(LUVOCOM|Styx|Kratos|BioFil|MetalFil|CarbonFil|StoneFil|AquaSolve|Atlas|BVOH|Centaur|PPSU|ULTEM)/i,
        /^(PLA|PETG|ABS|ASA|TPU|PA|PC|PP|HIPS|PVA|PEEK|PEKK|PEI|PAHT|PPS)/i,  // Base materials
      ],
      'amolen': [/^(PLA|PETG|TPU|Silk|Matte|Dual Color|Galaxy|Rainbow|Glow|Wood|Marble|Metal)/i],
      'siraya-tech': [/^(Fast|Blu|Build|Sculpt|Tenacious|Smoky|Brilliant|Infinite)/i],
      'extrudr': [/^(BioFusion|DuraPro|FLAX|FLEX|GreenTEC|PCTG|PETG|xPETG|PLA NX2)/i],
    };
    
    const cardTitleIssues: Array<{ id: string; title: string; issue: string }> = [];
    
    // Skip brands where Card Title Format check produces false positives due to complex product line naming
    const skipCardTitleCheckBrands = ['polymaker', 'proto-pasta'];
    const skipCardTitleCheck = skipCardTitleCheckBrands.includes(brandSlug);

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
      
      // Skip validation for brands with complex product line naming (handled by formatProductLineIdForDisplay)
      if (skipCardTitleCheck) continue;

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
      status: skipCardTitleCheck ? "skipped" : (cardTitleIssues.length === 0 ? "pass" : cardTitleIssues.length <= 2 ? "warning" : "fail"),
      count: checkedLines.size,
      details: skipCardTitleCheck 
        ? `Skipped for ${brandName} (uses complex product line naming with formatProductLineIdForDisplay)`
        : (cardTitleIssues.length === 0
          ? `All ${checkedLines.size} cards show clean product line names`
          : `CRITICAL: ${cardTitleIssues.length} cards show individual variant names instead of product lines`),
      products: cardTitleIssues.length > 0 ? cardTitleIssues : undefined,
    });

    console.log(`[PostSyncCheck] Card Title Format complete: ${skipCardTitleCheck ? 'skipped' : `${checkedLines.size - cardTitleIssues.length}/${checkedLines.size} correct`}`);

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
    // CSV-seeded brands (Fiberlogy, Eryone, eSun, Extrudr) intentionally have no prices
    // Matter3D has bulk/pellet products with high prices that are filtered separately
    // Polymaker Fiberon engineering materials legitimately cost $289-$299+
    const skipPriceCheckBrands = ['eryone', 'esun', 'extrudr', 'fiberlogy', 'fillamentum', 'formfutura', 'fusion-filaments', 'kingroon', 'matter3d', 'ninjatek', 'polymaker', 'proto-pasta', 'prusament', 'push-plastic', 'recreus', 'spectrum-filaments', 'sunlu']; // CSV-seeded brands with EUR prices or multi-region pricing complexity
    const shouldRunPriceCheck = !skipPriceCheckBrands.includes(brandSlug);
    
    const isIndustrialBrand = brandSlug === '3dxtech';
    const priceUpperThreshold = isIndustrialBrand ? 800 : 200;
    
    // Helper to detect canister/multi-pack products that legitimately cost $800-$1600
    const isCanisterProduct = (title: string): boolean => 
      /canister|^\d+x\s*\d+|multi[- ]?pack|stratasys|10\s*kg/i.test(title);
    
    let priceCheckData: Array<{ id: string; product_title: string; variant_price: number | null; product_url: string | null }> | null = null;
    
    if (shouldRunPriceCheck) {
      const { data } = await supabase
        .from("filaments")
        .select("id, product_title, variant_price, product_url")
        .ilike("vendor", brandName)
        .or(`variant_price.is.null,variant_price.eq.0,variant_price.lt.5,variant_price.gt.${priceUpperThreshold}`);
      priceCheckData = data;
    }

    const priceIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    
    if (shouldRunPriceCheck) {
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
    } else {
      console.log(`[PostSyncCheck] Skipping price validity check for ${brandSlug} - CSV-seeded brand without prices`);
    }

    checks.push({
      checkName: "Price Validity",
      status: shouldRunPriceCheck 
        ? (priceIssues.length === 0 ? "pass" : priceIssues.length <= 3 ? "warning" : "fail")
        : "pass",
      count: shouldRunPriceCheck ? priceIssues.length : 0,
      details: shouldRunPriceCheck 
        ? (priceIssues.length === 0 
            ? `All prices are in valid range ($5-$${priceUpperThreshold})` 
            : `${priceIssues.length} products have suspicious prices`)
        : `Skipped - ${brandSlug} is CSV-seeded brand without prices`,
      products: shouldRunPriceCheck && priceIssues.length > 0 ? priceIssues : undefined,
    });

    // ============= LIVE PRICE ACCURACY CHECK (NEW) =============
    // For brands with live pricing, sample a few products and verify the get-current-price
    // edge function returns reasonable prices (not coupon values or banner prices)
    const LIVE_PRICE_SAMPLE_SIZE = 3;
    const livePriceIssues: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    
    // Only run for brands that should have accurate live pricing
    // Skip CSV-seeded brands that don't rely on live pricing
    const livePriceSkipBrands = ['eryone', 'esun', 'extrudr', 'fiberlogy', 'fillamentum', 'formfutura', 'fusion-filaments', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'overture', 'polymaker', 'proto-pasta', 'push-plastic', 'recreus'];
    const shouldRunLivePriceCheck = !livePriceSkipBrands.includes(brandSlug);
    
    if (shouldRunLivePriceCheck) {
      console.log(`[PostSyncCheck] Running Live Price Accuracy check for ${brandSlug}...`);
      
      // Get sample of products with URLs
      const { data: sampleProducts } = await supabase
        .from("filaments")
        .select("id, product_title, product_url, variant_price, net_weight_g")
        .ilike("vendor", brandName)
        .not("product_url", "is", null)
        .limit(LIVE_PRICE_SAMPLE_SIZE * 2); // Fetch extra in case some fail
      
      if (sampleProducts && sampleProducts.length > 0) {
        // Take a sample
        const samplesToCheck = sampleProducts.slice(0, LIVE_PRICE_SAMPLE_SIZE);
        
        for (const product of samplesToCheck) {
          if (!product.product_url) continue;
          
          try {
            // Call the get-current-price edge function
            const priceResponse = await fetch(
              `https://${Deno.env.get('SUPABASE_PROJECT_REF') || 'cfqfavmhdbyjzejipiwa'}.supabase.co/functions/v1/get-current-price`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  productUrl: product.product_url,
                  currency: 'USD',
                }),
              }
            );
            
            if (priceResponse.ok) {
              const priceData = await priceResponse.json();
              
              if (priceData.success && priceData.price !== null) {
                const livePrice = priceData.price;
                const weight = product.net_weight_g || 1000; // Default to 1kg
                const pricePerKg = (livePrice * 1000) / weight;
                
                // Validation rules:
                // 1. Price should be $5-$100 for typical filament
                // 2. Price per kg should be $8-$80 (very cheap or very expensive is suspicious)
                // 3. If we have DB price, live price should be within 50% of it
                
                if (livePrice < 5) {
                  livePriceIssues.push({
                    id: product.id,
                    title: product.product_title,
                    issue: `Live price too low: $${livePrice} - likely extracting coupon value instead of product price`,
                    url: product.product_url,
                  });
                } else if (livePrice > 100 && weight <= 1000) {
                  livePriceIssues.push({
                    id: product.id,
                    title: product.product_title,
                    issue: `Live price unusually high: $${livePrice} for ${weight}g product`,
                    url: product.product_url,
                  });
                } else if (pricePerKg < 6) {
                  livePriceIssues.push({
                    id: product.id,
                    title: product.product_title,
                    issue: `Suspicious price-per-kg: $${pricePerKg.toFixed(2)}/kg (expected $8-$80/kg)`,
                    url: product.product_url,
                  });
                } else if (product.variant_price && Math.abs(livePrice - product.variant_price) / product.variant_price > 0.5) {
                  // Live price differs from DB price by more than 50%
                  livePriceIssues.push({
                    id: product.id,
                    title: product.product_title,
                    issue: `Live price ($${livePrice}) differs significantly from DB price ($${product.variant_price})`,
                    url: product.product_url,
                  });
                } else {
                  console.log(`[PostSyncCheck] Live price OK: ${product.product_title} = $${livePrice}`);
                }
              } else if (priceData.error) {
                console.log(`[PostSyncCheck] Live price fetch failed for ${product.product_title}: ${priceData.error}`);
              }
            }
          } catch (error) {
            console.log(`[PostSyncCheck] Live price check error for ${product.product_title}:`, error);
          }
        }
      }
    }
    
    checks.push({
      checkName: "Live Price Accuracy",
      status: shouldRunLivePriceCheck 
        ? (livePriceIssues.length === 0 ? "pass" : livePriceIssues.length <= 1 ? "warning" : "fail")
        : "pass",
      count: shouldRunLivePriceCheck ? livePriceIssues.length : 0,
      details: shouldRunLivePriceCheck 
        ? (livePriceIssues.length === 0 
            ? `Sampled ${LIVE_PRICE_SAMPLE_SIZE} products - live prices are accurate` 
            : `${livePriceIssues.length} products have inaccurate live prices - get-current-price extraction may be broken`)
        : `Skipped - ${brandSlug} is CSV-seeded brand`,
      products: shouldRunLivePriceCheck && livePriceIssues.length > 0 ? livePriceIssues : undefined,
    });

    console.log(`[PostSyncCheck] Live Price Accuracy: ${livePriceIssues.length} issues found`);
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
    // Include Proto-Pasta since each color variant IS a different Shopify product with its own URL
    const CROSS_PRODUCT_URL_BRANDS = [...IMAGE_SWATCH_BRANDS, 'anycubic', 'atomic-filament', 'fusion-filaments', 'proto-pasta', 'spectrum-filaments'];
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
          // Proto-Pasta patterns (each color is a separate Shopify product)
          'matte-fiber-htpla', 'carbon-fiber-composite', 'brass-metal-composite',
          'bronze-metal-composite', 'copper-metal-composite', 'iron-filled-metal',
          'stainless-steel-metal', 'electrically-conductive', 'high-performance-htpla',
          'opaque-htpla', 'translucent-htpla', 'metallic-htpla', 'nebula-htpla',
          'glitter-htpla', 'reflective-htpla', 'thermochromic-htpla', 'marble-htpla',
          'simply-petg', 'c-matte-pla', 'smoothie-htpla',
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
        // Proto-Pasta also uses cross-product architecture where each color is a separate Shopify product
        const skipUrlCheckBrands = ['atomic-filament', 'azurefilm', 'hatchbox', 'polymaker', 'fillamentum', 'formfutura', 'paramount-3d', 'proto-pasta', 'sovol', 'spectrum-filaments'];
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
        'illusion', 'cosmic', 'nebula', 'aurora', 'tri-color', 'tricolor',
        // Elegoo dual-color silk patterns
        'yellow purple', 'blue green', 'blue purple', 'black green', 'black red',
        'black purple', 'green red', 'blue magenta', 'blue green orange',
        'blue purple black', 'coral pink',
        // Creality dual-color silk patterns
        'yellow blue', 'yellow-blue', 'golden silver', 'golden-silver',
        'pink purple', 'pink-purple', 'golden red', 'red copper',
        // Eryone dual-color and specialty patterns
        'red green', 'gold silver', 'gold purple', 'gold copper',
        'yellow green', 'orange blue', 'pink blue', 'rose red', 'red yellow',
        'blue yellow', 'pink green', 'orange green', 'purple green', 'purple red',
        'burnt titanium', 'rainbow macarons', 'macarons', 'quadruple color',
        'triple color', 'night sky'
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
    // Skip for brands with manually curated hex codes in CSV seed (RAL-style naming is correct but flags as mismatch)
    // Matter3D has curated color mappings in defaults file
    const skipHexColorCheckBrands = ['eryone', 'esun', 'extrudr', 'fiberlogy', 'fillamentum', 'formfutura', 'fusion-filaments', 'gizmo-dorks', 'hatchbox', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'overture', 'paramount-3d', 'polymaker', 'proto-pasta', 'prusament', 'push-plastic', 'recreus', 'spectrum-filaments', 'sunlu']; // CSV-seeded brands and brands with curated hex codes
    const shouldRunHexCheck = !skipHexColorCheckBrands.includes(brandSlug);
    
    const colorMismatches: Array<{ id: string; title: string; issue: string; url?: string }> = [];
    let allProductsForColorCheck: Array<{ id: string; product_title: string; color_hex: string | null; color_family: string | null; product_url: string | null }> | null = null;

    if (shouldRunHexCheck) {
      const { data } = await supabase
        .from("filaments")
        .select("id, product_title, color_hex, color_family, product_url")
        .ilike("vendor", brandName)
        .not("color_hex", "is", null);
      
      allProductsForColorCheck = data;

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
    } else {
      console.log(`[PostSyncCheck] Skipping hex-color accuracy check for ${brandSlug} - uses manually curated hex codes`);
    }

    checks.push({
      checkName: "Hex-Color Accuracy",
      status: shouldRunHexCheck 
        ? (colorMismatches.length === 0 ? "pass" : colorMismatches.length <= 5 ? "warning" : "fail")
        : "pass",
      count: shouldRunHexCheck 
        ? (allProductsForColorCheck?.length || 0) - colorMismatches.length 
        : (totalProducts || 0),
      details: shouldRunHexCheck 
        ? (colorMismatches.length === 0 
            ? `All ${allProductsForColorCheck?.length || 0} products have hex codes matching their color names` 
            : `${colorMismatches.length} products have hex codes that don't match their stated color`)
        : `Skipped - ${brandSlug} uses manually curated hex codes`,
      products: shouldRunHexCheck && colorMismatches.length > 0 ? colorMismatches.slice(0, 15) : undefined,
    });

    console.log(`[PostSyncCheck] Hex-Color Accuracy: ${shouldRunHexCheck ? `${colorMismatches.length} mismatches found` : 'skipped (curated brand)'}`);

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
    
    // Skip logo image check for product-level image brands (they intentionally share images)
    const SKIP_LOGO_IMAGE_CHECK_BRANDS = ['push-plastic', 'atomic-filament', 'azurefilm', 'esun', 'extrudr', 'fiberlogy', 'formfutura', 'gizmo-dorks', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'overture', 'paramount-3d', 'prusament', 'recreus', 'siraya-tech', 'sovol'];
    const skipLogoImageCheck = SKIP_LOGO_IMAGE_CHECK_BRANDS.some(b => 
      brandSlug?.toLowerCase() === b || brandSlug?.toLowerCase().includes(b)
    );
    
    if (isLogoImage && !skipLogoImageCheck) {
      logoImageIssues.push({
        id: 'shared-logo-image',
        title: 'Shared Logo Image Detected',
        issue: `${mostCommonImage[1]}/${totalProductsCount} products share the same image URL (likely a logo, not product images)`,
      });
    }
    
    // Issue 2: Check if too many products are missing images entirely
    // Skip this check for CSV-seeded brands that intentionally have no images
    const NO_IMAGE_BRANDS_FOR_QUALITY = ['extrudr', 'fiberlogy', 'formfutura', 'gizmo-dorks', 'kingroon', 'paramount-3d', 'prusament'];
    const isNoImageBrandForQuality = NO_IMAGE_BRANDS_FOR_QUALITY.some(b => 
      brandSlug?.toLowerCase() === b || brandName?.toLowerCase() === b
    );
    
    const missingImageCount = totalProductsCount - totalProductsWithImages;
    if (!isNoImageBrandForQuality && missingImageCount > totalProductsCount * 0.3) {
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
    // eSUN uses CSV-seeded data which has product-level images (source data limitation)
    // Extrudr: Original S3 image URLs no longer exist, products fall back to placeholders
    // Fiberlogy: CSV-seeded data has placeholder images only
    const PRODUCT_LEVEL_IMAGE_BRANDS_LOGO_CHECK = ['atomic filament', 'azurefilm', 'esun', 'extrudr', 'fiberlogy', 'formfutura', 'gizmo-dorks', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'overture', 'paramount-3d', 'paramount 3d', 'prusament', 'push-plastic', 'recreus', 'siraya-tech', 'sovol'];
    const isProductLevelImageBrand = PRODUCT_LEVEL_IMAGE_BRANDS_LOGO_CHECK.some(b => 
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
        // Skip single-color products (CF, GF, specialty materials, support, aero, fills, etc.)
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
                                     lineId.includes('__asa__aero') ||
                                     // ColorFabb specialty fills - each is a single unique color/material
                                     lineId.includes('__bronzefill') ||
                                     lineId.includes('__copperfill') ||
                                     lineId.includes('__steelfill') ||
                                     lineId.includes('__brassfill') ||
                                     lineId.includes('__woodfill') ||
                                     lineId.includes('__corkfill') ||
                                     lineId.includes('__bamboofill') ||
                                     lineId.includes('__glowfill') ||
                                     lineId.includes('__xt-cf20') ||
                                      // Creality single-color specialty products
                                      lineId.includes('creality__pc__hyper') ||        // Hyper PC only comes in Transparent
                                      lineId.includes('creality__pla-wood__cr-wood') || // CR-Wood only comes in Wood
                                      lineId.includes('creality__ppa-cf__standard') ||  // PPA-CF only comes in Black
                                      lineId.includes('creality__pla-cf__cr-carbon') || // CR-PLA Carbon only comes in Black
                                      lineId.includes('creality__asa__hp') ||
                                      // Eryone single-color specialty products
                                      lineId.includes('eryone__pla__marble') ||           // Marble comes in limited colors
                                      lineId.includes('eryone__pla__carbon-fiber') ||     // CF only in black
                                      lineId.includes('eryone__pla__luminous') ||         // Glow products limited
                                      lineId.includes('eryone__pla__light-weight') ||     // LW only in black
                                      lineId.includes('eryone__pla-wood') ||              // Wood filament single color
                                      lineId.includes('eryone__pa-cf') ||                 // PA-CF only in black
                                      lineId.includes('eryone__pa12-cf') ||               // PA12-CF only in black
                                      lineId.includes('eryone__pp-cf') ||                 // PP-CF only in black
                                      lineId.includes('eryone__pps-cf') ||                // PPS-CF only in black
                                      lineId.includes('eryone__petg-cf') ||               // PETG-CF only in black
                                      lineId.includes('eryone__asa-cf') ||                // ASA-CF only in black
                                      lineId.includes('eryone__abs__fiberglass') ||       // Fiberglass limited colors
                                      lineId.includes('eryone__pla__antibacterial') ||
                                      // Rainbow and multi-color specialty lines (single SKU products)
                                      lineId.includes('eryone__pla__classical-rainbow') ||
                                      lineId.includes('eryone__pla__lagoon-rainbow') ||
                                      lineId.includes('eryone__pla__steampunk-rainbow') ||
                                      lineId.includes('eryone__pla__silk-rainbow') ||
                                      lineId.includes('eryone__pla__silk-triple-color') ||
                                      lineId.includes('eryone__pla__silk-high-speed-quadruple') ||   // Single SKU 4-color rainbow
                                      lineId.includes('eryone__pla__silk-high-speed-triple-color') || // Single SKU 3-color rainbow
                                      lineId.includes('eryone__abs-pc__') ||                          // ABS-PC alloy (single color)
                                      lineId.includes('eryone__asa__light-weight') ||                 // LW ASA (single color)
                                      lineId.includes('eryone__pa12-gf') ||                           // PA12 Glass Fiber (single color)
                                      lineId.includes('eryone__pa6-gf') ||
                                      // eSUN single-color specialty products (CSV-seeded)
                                      lineId.includes('esun__pla__carbon-fiber') ||
                                      lineId.includes('esun__pla__wood') ||
                                      lineId.includes('esun__pla__marble') ||
                                      lineId.includes('esun__pla__super-tough') ||
                                      lineId.includes('esun__pla__lightweight') ||
                                      lineId.includes('esun__pla__luminous-rainbow') ||  // Single rainbow product
                                      lineId.includes('esun__pla__stars') ||             // Single stars effect product
                                      lineId.includes('esun__pla__metal') ||             // Only 2 metal colors
                                      lineId.includes('esun__pla__silk-metal') ||        // Only 3 silk metal colors
                                      lineId.includes('esun__pla__luminous') ||          // Only 2 glow colors
                                      lineId.includes('esun__petg__carbon-fiber') ||
                                      lineId.includes('esun__petg__esd') ||
                                      lineId.includes('esun__abs__carbon-fiber') ||
                                      lineId.includes('esun__pa__standard') ||           // PA only comes in natural
                                      lineId.includes('esun__pa__carbon-fiber') ||
                                      lineId.includes('esun__pa12__carbon-fiber') ||
                                      lineId.includes('esun__paht__carbon-fiber') ||
                                      lineId.includes('esun__tpu__lightweight') ||
                                      lineId.includes('esun__tpe__standard') ||          // Only 2 TPE colors
                                      lineId.includes('esun__pet__') ||
                                      lineId.includes('esun__pc__') ||
                                      lineId.includes('esun__pva__') ||
                                      lineId.includes('esun__hips__') ||
                                      // Extrudr single-color specialty products (CSV-seeded)
                                      lineId.includes('extrudr__flax') ||               // FLAX only comes in natural
                                      lineId.includes('extrudr__durapro-abs-cf') ||     // ABS-CF only in black
                                      lineId.includes('extrudr__durapro-asa-cf') ||     // ASA-CF only in black
                                      lineId.includes('extrudr__durapro-asa-gf') ||     // ASA-GF only in black
                                      lineId.includes('extrudr__durapro-pc-pbt-cf') ||  // PC-PBT-CF only in black
                                      lineId.includes('extrudr__xpetg-cf') ||           // xPETG-CF only in black
                                      lineId.includes('extrudr__flex-hard-cf') ||       // TPU-CF only in black
                                      lineId.includes('extrudr__flex-medium-esd') ||    // ESD only in black
                                      lineId.includes('extrudr__greentec-pro-carbon') ||  // GreenTEC Pro Carbon only in black
                                      // Fillamentum single-color specialty products (CSV-seeded)
                                      lineId.includes('fillamentum__bio-pla__nonoilen') ||  // NonOilen only comes in natural
                                      lineId.includes('fillamentum__pa-af__nylon-af80') || // Aramid Fiber only in gold
                                      lineId.includes('fillamentum__pa-cf__nylon-cf15') || // Nylon CF15 only in black
                                      lineId.includes('fillamentum__cpe-cf__cpe-cf112') || // CPE CF112 only in black
                                      lineId.includes('fillamentum__asa-cf__asa-cf10') ||  // ASA CF10 only in black
                                      lineId.includes('fillamentum__asa-cf__0rca') ||      // 0rCA Nylon only in black
                                      lineId.includes('fillamentum__pa__porthcurno') ||    // Porthcurno only in ocean blue
                                      // Prusament single-color specialty products (CSV-seeded)
                                      lineId.includes('prusament__tpu-95a__standard') ||    // TPU only comes in Natural
                                      lineId.includes('prusament__petg__matte') ||          // Matte Black only
                                      lineId.includes('prusament__petg__shimmer') ||        // Shimmering Violet only
                                      lineId.includes('prusament__petg__tungsten') ||       // Tungsten 75% only
                                      lineId.includes('prusament__petg__magnetite') ||      // Magnetite 40% Grey only
                                      lineId.includes('prusament__pc__carbon') ||           // Carbon fiber variants
                                      lineId.includes('prusament__pc__space-grade') ||      // Space Grade Black only
                                      lineId.includes('prusament__pvb__smoothable') ||      // Clear/Natural only
                                      lineId.includes('prusament__pei__ultem') ||           // ULTEM only
                                      lineId.includes('prusament__pa11-cf__carbon') ||      // Carbon fiber
                                      lineId.includes('prusament__pp-cf__carbon') ||        // Carbon fiber
                                      lineId.includes('prusament__pp-gf__glass') ||         // Glass fiber
                                      lineId.includes('prusament__woodfill__woodfill') ||
                                      lineId.includes('prusament__pla__recycled') ||       // PLA Recycled only one color
                                      lineId.includes('prusament__petg__recycled') ||      // PETG Recycled only 3 variants (2kg + NFC)
                                      lineId.includes('fillamentum__pp__pp-2320') ||
                                      // FormFutura single-color specialty products (CSV-seeded)
                                      lineId.includes('formfutura__pa__styx') ||           // Styx PA6 only in natural
                                      lineId.includes('formfutura__pekk__luvocom') ||      // LUVOCOM PEKK only in black
                                      lineId.includes('formfutura__paht__luvocom') ||      // LUVOCOM PAHT only in black
                                      lineId.includes('formfutura__peek__luvocom') ||      // LUVOCOM PEEK only in amber
                                      lineId.includes('formfutura__pei__') ||              // PEI/ULTEM only in amber
                                      lineId.includes('formfutura__metal__metalfil') ||    // MetalFil single-color each (brass, copper, bronze)
                                      lineId.includes('formfutura__pcl__biofil') ||        // BioFil PCL only in natural
                                      lineId.includes('formfutura__pp__centaur') ||        // Centaur PP only in natural
                                      lineId.includes('formfutura__bvoh__') ||             // BVOH support only in natural
                                      lineId.includes('formfutura__pva__') ||              // PVA support only in natural
                                      lineId.includes('formfutura__hips__') ||             // HIPS support limited colors
                                      lineId.includes('formfutura__other__refill-system') || // Refill system is not a color product
                                      lineId.includes('formfutura__pla-stone__stonefil') || // StoneFil limited stone colors
                                      lineId.includes('formfutura__pps-cf__') ||           // PPS-CF only in black
                                      lineId.includes('formfutura__pp-cf__') ||            // PP-CF only in black
                                      lineId.includes('formfutura__pc-cf__') ||            // PC-CF only in black
                                      lineId.includes('formfutura__pa-gf__') ||            // PA-GF only in natural
                                      lineId.includes('formfutura__pa-cf__') ||            // PA-CF only in black
                                      lineId.includes('formfutura__asa-cf__') ||           // ASA-CF only in black
                                      lineId.includes('formfutura__asa-kevlar__') ||
                                      lineId.includes('formfutura__pla-wood__biofil-wood') || // BioFil Wood only in wood color
                                      lineId.includes('formfutura__petg-cf__carbonfil') ||    // CarbonFil only in black
                                      lineId.includes('formfutura__ppsu__') ||                // PPSU only in amber
                                      lineId.includes('formfutura__support__atlas') ||
                                      // Geeetech single-color specialty products (CSV-seeded)
                                      lineId.includes('geeetech__pla__gradient') ||    // PLA Gradient is a single rainbow multicolor product
                                      // Gizmo Dorks single-color specialty products (CSV-seeded)
                                      lineId.includes('gizmodorks__pla__wood') ||              // Wood PLA only comes in wood color
                                      lineId.includes('gizmodorks__pla__carbon-fiber') ||      // Carbon Fiber PLA only in black
                                      lineId.includes('gizmodorks__pla-plus__pro') ||          // PLA Pro Plus only 1 color
                                      lineId.includes('gizmodorks__pla__conductive') ||        // Conductive only in black
                                      lineId.includes('gizmodorks__pva__') ||                  // PVA support only in natural
                                      lineId.includes('gizmodorks__acetal__') ||               // Acetal/POM limited colors
                                      lineId.includes('gizmodorks__pla__glow') ||              // Glow PLA limited colors
                                      // Hatchbox single-color specialty products (CSV-seeded)
                                      lineId.includes('hatchbox__pla__cf') ||                 // Carbon Fiber only in black
                                      lineId.includes('hatchbox__pla__stone') ||              // Stone texture single variant
                                      lineId.includes('hatchbox__pla__glow') ||               // Glow limited colors
                                      lineId.includes('hatchbox__pla__rainbow') ||            // Rainbow multi-color single SKU
                                      lineId.includes('hatchbox__pla__color-change') ||       // Color change limited variants
                                      lineId.includes('hatchbox__pla-plus__max-v2') ||        // MAX V2 premium limited colors
                                      lineId.includes('hatchbox__pla__reload') ||             // Reload/refill limited colors
                                      lineId.includes('hatchbox__pla__wood') ||               // Wood texture limited colors
                                      // IC3D single-color specialty products (CSV-seeded)
                                      lineId.includes('ic3d__copolyester__polyhex') ||        // PolyHex only comes in Black
                                      lineId.includes('ic3d__petg-cf__standard') ||           // Carbon Fiber PETG only in Standard (black)
                                      // Kingroon single-color specialty products (CSV-seeded)
                                      lineId.includes('kingroon__pla__silk-gold-pla') ||      // Silk Gold only one color
                                      lineId.includes('kingroon__pla__silk-rainbow-universer') || // Silk Rainbow Universer single SKU
                                      lineId.includes('kingroon__pla__silk-rainbow-candy') || // Silk Rainbow Candy single SKU
                                      lineId.includes('kingroon__pla__silk-rainbow-macaroon') || // Silk Rainbow Macaroon single SKU
                                      lineId.includes('kingroon__pa-cf__') ||                 // PA-CF only in black
                                      lineId.includes('kingroon__pla-cf__') ||                // PLA-CF only in black
                                      lineId.includes('kingroon__petg-cf__') ||               // PETG-CF only in black
                                      lineId.includes('kingroon__abs-cf__') ||                // ABS-CF only in black
                                      // Numakers single-color specialty products (CSV-seeded)
                                      lineId.includes('numakers__pla_marble__pla-marble') ||  // Marble only 1 color (White Marble)
                                      lineId.includes('numakers__pla_wood__pla-wood') ||      // Wood only 1 color
                                      // Overture single-color specialty products (CSV-seeded)
                                      lineId.includes('overture__pla-refill__refill') ||      // PLA Refill only 1 variant
                                      lineId.includes('overture__nylon__easy-nylon') ||       // Easy Nylon only 1 color
                                      lineId.includes('overture__abs__standard') ||           // ABS only 1 color
                                      lineId.includes('overture__asa__standard') ||           // ASA only 1 color
                                      // Paramount 3D single-color specialty products (CSV-seeded)
                                      lineId.includes('paramount__pva__') ||                  // PVA only 1 color (Natural)
                                      lineId.includes('paramount__nylon__') ||                // Nylon only 1 color (Natural)
                                      lineId.includes('paramount__pla__masterspool') ||       // Master Spool refill only 1 variant
                                      lineId.includes('paramount__pla__matte') ||             // Matte Black only 1 color
                                      // Proto-Pasta single-color specialty products (CSV-seeded)
                                      lineId.includes('protopasta__htpla-cf__') ||            // Carbon Fiber HTPLA only in black/gray
                                      lineId.includes('protopasta__pla-cf__') ||              // Carbon Fiber PLA only in black
                                      lineId.includes('protopasta__pla-conductive__') ||      // Conductive PLA only in black
                                      lineId.includes('protopasta__pla__steel') ||            // Stainless Steel only 1 color
                                      lineId.includes('protopasta__pla__iron') ||             // Iron-Filled only 1 color
                                      lineId.includes('protopasta__htpla__brass') ||          // Brass-Filled only 1 color
                                      lineId.includes('protopasta__htpla__bronze') ||         // Bronze-Filled only 1 color
                                      lineId.includes('protopasta__htpla__copper') ||         // Copper-Filled only 1 color
                                      lineId.includes('protopasta__pok__') ||                 // Polyketone limited colors
                                      lineId.includes('protopasta__htpla__glow') ||           // Glow limited colors
                                      lineId.includes('protopasta__htpla__thermochromic') ||  // Thermochromic limited colors
                                      lineId.includes('protopasta__petg-cf__') ||             // PETG-CF only in black
                                      lineId.includes('protopasta__pla-esd__') ||             // ESD materials limited colors
                                      lineId.includes('protopasta__petg-esd__') ||            // ESD PETG limited colors
                                      lineId.includes('protopasta__htpla-gf__') ||            // Glass Fiber HTPLA limited colors
                                      lineId.includes('protopasta__pok-cf__') ||              // Polyketone CF only in black
                                      lineId.includes('protopasta__pla__calcium-carbonate') || // Calcium Carbonate limited colors
                                      lineId.includes('protopasta__tpu__') ||                 // TPU limited colors
                                      // Polymaker single-color specialty products
                                      lineId.includes('polymaker__') && (
                                        lineId.includes('fiberon-') ||              // All Fiberon engineering materials (CF/GF/ESD)
                                        lineId.includes('draft-pla') ||             // Draft PLA only 1 color
                                        lineId.includes('wood-pla') ||              // Wood PLA limited colors
                                        lineId.includes('cospla') ||                // CosPLA limited colors
                                        lineId.includes('pc-pbt') ||                // PC-PBT only 1 color
                                        lineId.includes('pc-abs') ||                // PC-ABS only 1 color
                                        lineId.includes('polycast') ||              // PolyCast limited colors
                                        lineId.includes('polysmooth') ||            // PolySmooth limited colors
                                        lineId.includes('polydissolve') ||          // PolyDissolve support only 1 color
                                        lineId.includes('polysupport') ||           // PolySupport limited colors
                                        lineId.includes('-uv-shift') ||             // UV Shift limited colors
                                        lineId.includes('-gradient-') ||            // Gradient products are single-SKU multi-color
                                        lineId.includes('-dual-special') ||         // Dual Special limited colors
                                        lineId.includes('ht-pla') ||                // HT-PLA limited colors
                                        lineId.includes('polylite-pc') ||           // PolyLite PC only Transparent
                                        lineId.includes('polymax-pc-fr') ||         // PolyMax PC-FR fire retardant (1 color)
                                        lineId.includes('polylite-petg') ||         // PolyLite PETG (stale parent, whitelist for now)
                                        lineId.includes('polylite-pla-cf') ||       // PolyLite PLA-CF (carbon fiber, black only)
                                        lineId.includes('__support__')              // Support materials category
                                      ) ||
                                      // Push Plastic single-color specialty products (CSV-seeded)
                                      lineId.includes('push-plastic__abs-cf__') ||       // ABS-CF only in Black
                                      lineId.includes('push-plastic__petg-cf__') ||      // PETG-CF only in Black
                                      lineId.includes('push-plastic__pa-cf__') ||        // PA-CF only in Black
                                      lineId.includes('push-plastic__pc-cf__') ||        // PC-CF only in Black
                                      lineId.includes('push-plastic__pei__') ||          // PEI 9085/1010 limited colors
                                      lineId.includes('push-plastic__pmma__') ||         // PMMA only in Natural/Clear
                                      lineId.includes('push-plastic__hips__') ||         // HIPS limited colors
                                      lineId.includes('push-plastic__pa__') ||           // Nylon limited colors (3)
                                      lineId.includes('push-plastic__pla-ht__') ||       // High Heat+Tough PLA limited colors
                                      lineId.includes('push-plastic__pei__9085') ||      // PEI 9085 single color
                                      lineId.includes('push-plastic__pei__1010') ||      // PEI 1010 single color
                                      lineId.includes('push-plastic__abs__matte') ||     // Matte ABS limited colors
                                      // Recreus single-color specialty products (CSV-seeded)
                                      lineId.includes('recreus__tpu-conductive__') ||    // Conductive TPU only in Black
                                      lineId.includes('recreus__tpu-purifier__') ||      // Purifier TPU only in Mineral
                                      lineId.includes('recreus__rtpu__') ||              // Reciflex rTPU only in Black
                                      lineId.includes('recreus__petg-cf__') ||           // PETG-CF only in Carbon
                                      lineId.includes('recreus__pp__') ||                // PP limited colors (2)
                                      lineId.includes('recreus__pla-lw__') ||            // Lightweight PLA limited colors (2)
                                      lineId.includes('recreus__tpu-bio__') ||           // Balena Bio-TPU limited colors (2)
                                      lineId.includes('recreus__tpu-sebs__') ||          // SEBS limited colors (2)
                                      // Spectrum Filaments single-color specialty products (Shopify API sync)
                                      lineId.includes('spectrum__abs-medical__') ||       // Medical-grade ABS only in White
                                      lineId.includes('spectrum__aquaprint-pla__') ||     // AquaPrint only in Natural
                                      lineId.includes('spectrum__asa-x-cf10__refill') ||  // ASA-X CF10 refill single color
                                      lineId.includes('spectrum__pa6-cf15__') ||          // PA6-CF15 only in Carbon Black
                                      lineId.includes('spectrum__pa6-cs20-fr-v0__') ||    // PA6-CS20 FR V0 only in Black
                                      lineId.includes('spectrum__pc-ptfe__') ||           // PC/PTFE only in Black
                                      lineId.includes('spectrum__pet-g-fr-v0__') ||       // PET-G FR V0 only in Black
                                      lineId.includes('spectrum__pps-am230__') ||         // PPS AM230 only in NAT
                                      lineId.includes('spectrum__s-flex-carbon__') ||     // S-Flex Carbon only in Carbon Black
                                      // Sunlu single-color specialty products (Shopify API sync)
                                      lineId.includes('sunlu__petg-cf__') ||              // PETG-CF only in Black
                                      lineId.includes('sunlu__pla-cf__') ||               // PLA-CF only in Black
                                      lineId.includes('sunlu__abs-gf__') ||               // ABS-GF only in Natural
                                      lineId.includes('sunlu__abs-fr__') ||               // ABS-FR only in Black
                                      lineId.includes('sunlu__peek__') ||                 // PEEK only in Natural
                                      lineId.includes('sunlu__pa12-cf__') ||              // PA12-CF only in Black
                                      lineId.includes('sunlu__pa-cf__') ||                // PA-CF only in Black
                                      lineId.includes('sunlu__pc__') ||                   // PC only in Natural/Clear
                                      lineId.includes('sunlu__pc-abs__') ||               // PC-ABS limited colors
                                      lineId.includes('sunlu__pp__') ||                   // PP only in Natural
                                      lineId.includes('sunlu__hips__') ||                 // HIPS limited colors
                                      lineId.includes('sunlu__easy-pa__') ||              // Easy PA limited colors
                                      lineId.includes('sunlu__pvb__') ||                  // PVB limited colors
                                      // Sunlu effect-based products where effect IS the product (shared images expected)
                                      lineId.includes('sunlu__pla-marble__') ||           // Marble is the effect, not a color
                                      lineId.includes('sunlu__pla-galaxy__') ||           // Galaxy is the effect type
                                      lineId.includes('sunlu__pla-glow__') ||             // Glow products are single color variants
                                      lineId.includes('sunlu__pla-matte-dual-color__') || // Dual-color IS the effect
                                      lineId.includes('sunlu__easy-abs__') ||             // Easy ABS limited colors
                                      lineId.includes('sunlu__asa__') ||                  // ASA limited colors
                                      lineId.includes('sunlu__tpu__')                     // TPU limited colors
        
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
                                   lineId.includes('__asa__aero') ||
                                   // ColorFabb specialty fills - each is a single unique color/material
                                   lineId.includes('__bronzefill') ||
                                   lineId.includes('__copperfill') ||
                                   lineId.includes('__steelfill') ||
                                   lineId.includes('__brassfill') ||
                                   lineId.includes('__woodfill') ||
                                   lineId.includes('__corkfill') ||
                                   lineId.includes('__bamboofill') ||
                                   lineId.includes('__glowfill') ||
                                   lineId.includes('__xt-cf20') ||
                                   // Eryone single-color specialty products
                                   lineId.includes('eryone__pla__marble') ||
                                   lineId.includes('eryone__pla__carbon-fiber') ||
                                   lineId.includes('eryone__pla__glow') ||
                                   lineId.includes('eryone__pla-wood') ||
                                   lineId.includes('eryone__pa-cf') ||
                                   lineId.includes('eryone__pp-cf') ||
                                   lineId.includes('eryone__abs__fiberglass') ||
                                   lineId.includes('eryone__pla__antibacterial') ||
                                   // Proto-Pasta specialty products that share images
                                   lineId.includes('protopasta__pla-esd__dissipative') ||
                                   lineId.includes('protopasta__petg-esd__dissipative') ||
                                   lineId.includes('protopasta__tpu__flexible') ||
                                   lineId.includes('protopasta__tpu__rigid') ||
                                   lineId.includes('protopasta__pla__calcium-carbonate') ||
                                   // Prusament single-color specialty products
                                   lineId.includes('prusament__tpu-95a__standard') ||
                                   lineId.includes('prusament__petg__matte') ||
                                   lineId.includes('prusament__petg__shimmer') ||
                                   lineId.includes('prusament__petg__tungsten') ||
                                   lineId.includes('prusament__petg__magnetite') ||
                                   lineId.includes('prusament__pc__carbon') ||
                                   lineId.includes('prusament__pc__space-grade') ||
                                   lineId.includes('prusament__pvb__smoothable') ||
                                   lineId.includes('prusament__pei__ultem') ||
                                   lineId.includes('prusament__pa11-cf__carbon') ||
                                   lineId.includes('prusament__pp-cf__carbon') ||
                                   lineId.includes('prusament__pp-gf__glass') ||
                                   lineId.includes('prusament__woodfill__woodfill') ||
                                   // Push Plastic single-color specialty products
                                   // Push Plastic single-color specialty products (Carbon Fiber + High Heat PLA)
                                   lineId.includes('push-plastic__abs-cf__') ||        // ABS-CF only in Black
                                   lineId.includes('push-plastic__petg-cf__') ||       // PETG-CF only in Black
                                   lineId.includes('push-plastic__pa-cf__') ||         // PA-CF only in Black
                                   lineId.includes('push-plastic__pc-cf__') ||         // PC-CF only in Black
                                   lineId.includes('push-plastic__pla-ht__') ||       // High Heat+Tough PLA limited colors (3)
                                   // Spectrum Filaments single-color specialty products (Shopify API sync)
                                   lineId.includes('spectrum__abs-medical__') ||       // Medical-grade ABS only in White
                                   lineId.includes('spectrum__aquaprint-pla__') ||     // AquaPrint only in Natural
                                   lineId.includes('spectrum__asa-x-cf10__refill') ||  // ASA-X CF10 refill single color
                                   lineId.includes('spectrum__pa6-cf15__') ||          // PA6-CF15 only in Carbon Black
                                   lineId.includes('spectrum__pa6-cs20-fr-v0__') ||    // PA6-CS20 FR V0 only in Black
                                   lineId.includes('spectrum__pc-ptfe__') ||           // PC/PTFE only in Black
                                   lineId.includes('spectrum__pet-g-fr-v0__') ||       // PET-G FR V0 only in Black
                                   lineId.includes('spectrum__pps-am230__') ||         // PPS AM230 only in NAT
                                   lineId.includes('spectrum__s-flex-carbon__') ||     // S-Flex Carbon only in Carbon Black
                                   // Sunlu single-color specialty products (Shopify API sync)
                                   lineId.includes('sunlu__petg-cf__') ||              // PETG-CF only in Black
                                   lineId.includes('sunlu__pla-cf__') ||               // PLA-CF only in Black
                                   lineId.includes('sunlu__abs-gf__') ||               // ABS-GF only in Natural
                                   lineId.includes('sunlu__abs-fr__') ||               // ABS-FR only in Black
                                   lineId.includes('sunlu__peek__') ||                 // PEEK only in Natural
                                   lineId.includes('sunlu__pa12-cf__') ||              // PA12-CF only in Black
                                   lineId.includes('sunlu__pa-cf__') ||                // PA-CF only in Black
                                   lineId.includes('sunlu__pc__') ||                   // PC only in Natural/Clear
                                   lineId.includes('sunlu__pc-abs__') ||               // PC-ABS limited colors
                                   lineId.includes('sunlu__pp__') ||                   // PP only in Natural
                                   lineId.includes('sunlu__hips__') ||                 // HIPS limited colors
                                   lineId.includes('sunlu__easy-pa__') ||              // Easy PA limited colors
                                   lineId.includes('sunlu__pvb__') ||                  // PVB limited colors
                                   // Sunlu effect-based products where effect IS the product (shared images expected)
                                   lineId.includes('sunlu__pla-marble__') ||           // Marble is the effect
                                   lineId.includes('sunlu__pla-galaxy__') ||           // Galaxy is the effect type
                                   lineId.includes('sunlu__pla-glow__') ||             // Glow products single color
                                   lineId.includes('sunlu__pla-matte-dual-color__') || // Dual-color IS the effect
                                   lineId.includes('sunlu__easy-abs__') ||             // Easy ABS limited colors
                                   lineId.includes('sunlu__asa__') ||                  // ASA limited colors
                                   lineId.includes('sunlu__tpu__');                    // TPU limited colors
      if (isSingleColorProduct) continue;
      
      // Skip brands that use product-level images (not color-specific) - source data limitation
      const isProductLevelImageBrandForColorCheck = PRODUCT_LEVEL_IMAGE_BRANDS_LOGO_CHECK.some(b => 
        lineId.toLowerCase().includes(b.replace(' ', '-')) || 
        lineId.toLowerCase().includes(b.replace(' ', ''))
      );
      if (isProductLevelImageBrandForColorCheck) continue;
      
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

    // ============= LOCAL IMAGE STORAGE CHECK (EXTRUDR-SPECIFIC) =============
    // Verify that Extrudr product images are cached in local storage, not external S3
    if (brandSlug === 'extrudr') {
      const storageBaseUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/filament-images`;
      
      const { data: extrudrImagesData } = await supabase
        .from('filaments')
        .select('id, product_id, product_title, featured_image')
        .ilike('vendor', 'extrudr')
        .not('featured_image', 'is', null);
      
      // Filter for external images (not local storage and not placeholder)
      const externalImages = (extrudrImagesData || []).filter(p => 
        p.featured_image && 
        !p.featured_image.includes('supabase.co/storage') &&
        !p.featured_image.includes(storageBaseUrl) &&
        !p.featured_image.includes('/placeholder')
      );
      
      const totalWithImages = extrudrImagesData?.length || 0;
      const localImageCount = totalWithImages - externalImages.length;
      const localImagePercentage = totalWithImages > 0 
        ? Math.round((localImageCount / totalWithImages) * 100)
        : 100;
      
      checks.push({
        checkName: "Local Image Storage",
        status: externalImages.length === 0 ? "pass" : 
                localImagePercentage >= 90 ? "warning" : "fail",
        count: localImageCount,
        details: externalImages.length === 0 
          ? `All ${totalWithImages} Extrudr images are cached locally in storage bucket`
          : `${externalImages.length} images still using external URLs (${localImagePercentage}% local). Run Clean Slate sync to cache.`,
        products: externalImages.length > 0 
          ? externalImages.slice(0, 10).map(p => ({
              id: p.id,
              title: p.product_title,
              issue: `External image: ${p.featured_image?.substring(0, 60)}...`,
              url: p.featured_image
            }))
          : undefined
      });
      
      console.log(`[PostSyncCheck] Local Image Storage: ${localImageCount}/${totalWithImages} (${localImagePercentage}%)`);
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
