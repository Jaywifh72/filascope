// Generic AI Fix Prompt Generator
// Used for brands without specialized prompt generators

import { CheckResult } from '../types.ts';

interface GenericAIAnalysis {
  swatchType?: string;
  rootCause?: string;
  wrongDecisions?: string[];
  correctBehavior?: string;
  extractionPattern?: string;
  missingReason?: string;
  fixCode?: string;
  colorMappings?: Record<string, string>;
}

interface AIRole {
  title: string;
  capabilities: string[];
}

/**
 * Determine the best AI role based on the types of issues found
 */
export function determineAIRole(checks: CheckResult[], brandSlug: string): AIRole {
  const failedChecks = checks.filter(c => c.status === 'fail');
  
  // Check for specific issue types
  const hasColorIssues = failedChecks.some(c => 
    c.checkName.toLowerCase().includes('color') || 
    c.checkName.toLowerCase().includes('hex') ||
    c.checkName.toLowerCase().includes('swatch')
  );
  
  const hasPriceIssues = failedChecks.some(c => 
    c.checkName.toLowerCase().includes('price')
  );
  
  const hasStructuralIssues = failedChecks.some(c => 
    c.checkName.toLowerCase().includes('product line') ||
    c.checkName.toLowerCase().includes('card count') ||
    c.checkName.toLowerCase().includes('grouping')
  );
  
  const hasTitleIssues = failedChecks.some(c =>
    c.checkName.toLowerCase().includes('title')
  );

  // Return appropriate role
  if (hasColorIssues && hasStructuralIssues) {
    return {
      title: 'Senior Web Scraping Engineer',
      capabilities: [
        'HTML parsing and DOM traversal',
        'Shopify/e-commerce site structure analysis',
        'Anti-bot detection avoidance strategies',
        'Dynamic content extraction',
        'Rate limiting and retry strategies'
      ]
    };
  }
  
  if (hasColorIssues) {
    return {
      title: 'Color Extraction Specialist',
      capabilities: [
        'Color swatch HTML pattern recognition',
        'Alt-text and aria-label parsing',
        'Color name normalization',
        'Hex code extraction from CSS/JS',
        'Image-based color detection'
      ]
    };
  }
  
  if (hasPriceIssues) {
    return {
      title: 'E-commerce Data Specialist',
      capabilities: [
        'Shopify API integration',
        'Price extraction from JSON-LD',
        'Currency normalization',
        'Variant price matching',
        'Promotional price handling'
      ]
    };
  }
  
  if (hasStructuralIssues) {
    return {
      title: 'Product Taxonomy Specialist',
      capabilities: [
        'Product line identification',
        'Material categorization',
        'Variant grouping strategies',
        'Product deduplication',
        'URL pattern analysis'
      ]
    };
  }
  
  if (hasTitleIssues) {
    return {
      title: 'Title Extraction Specialist',
      capabilities: [
        'H1 title extraction',
        'SEO title vs product title differentiation',
        'Title cleaning and normalization',
        'Brand prefix/suffix handling',
        'Title consistency verification'
      ]
    };
  }
  
  // Default role
  return {
    title: 'Senior Web Scraping Engineer',
    capabilities: [
      'HTML parsing and DOM traversal',
      'Shopify/e-commerce site structure analysis',
      'Anti-bot detection avoidance strategies',
      'Dynamic content extraction',
      'Rate limiting and retry strategies'
    ]
  };
}

/**
 * Generate generic AI fix prompt for any brand
 * Falls back when no brand-specific generator exists
 */
export function generateGenericFixPrompt(
  brand: string,
  brandSlug: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: GenericAIAnalysis | null
): string {
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warningChecks = checks.filter(c => c.status === 'warning');
  
  if (failedChecks.length === 0 && warningChecks.length === 0) {
    return `✅ ${brand} sync is healthy! All ${totalProducts} products passed quality checks.`;
  }
  
  // Determine the best AI role for this specific set of issues
  const role = determineAIRole(checks, brandSlug);
  
  // Determine brand-specific sync file path
  const knownBrands = [
    'anycubic', 'amolen', 'polymaker', 'hatchbox', '3d-fuel', 'sunlu', 
    'eryone', 'overture', 'push-plastic', 'proto-pasta', '3dxtech', 
    'ninjatek', 'fiberlogy', 'colorfabb', 'prusament', 'extrudr', 'geeetech'
  ];
  const hasDedicatedSyncFunction = knownBrands.includes(brandSlug);
  
  const syncFilePath = hasDedicatedSyncFunction 
    ? `supabase/functions/sync-${brandSlug}-products/index.ts`
    : `supabase/functions/sync-brand-products/index.ts`;
  
  const defaultsFilePath = `supabase/functions/_shared/${brandSlug}-defaults.ts`;
  
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

## 🤖 AI Website Analysis Results

**Swatch Architecture Detected**: ${aiAnalysis.swatchType || 'Unknown'}

${aiAnalysis.rootCause ? `### Root Cause Analysis
${aiAnalysis.rootCause}
` : ''}

${aiAnalysis.wrongDecisions?.length ? `### Wrong Decisions Identified
${aiAnalysis.wrongDecisions.map(d => `- ${d}`).join('\n')}
` : ''}

${aiAnalysis.correctBehavior ? `### Correct Behavior Expected
${aiAnalysis.correctBehavior}
` : ''}

${aiAnalysis.extractionPattern ? `**Extraction Pattern**:
${aiAnalysis.extractionPattern}
` : ''}

${aiAnalysis.missingReason ? `**Missing Reason**:
${aiAnalysis.missingReason}
` : ''}

${aiAnalysis.fixCode ? `### Recommended Code Fix

Update the sync logic in \`${defaultsFilePath}\`:

\`\`\`typescript
${aiAnalysis.fixCode}
\`\`\`
` : ''}

${aiAnalysis.colorMappings && Object.keys(aiAnalysis.colorMappings).length > 0 ? `### Missing Color Hex Mappings

Add these to the \`COLOR_HEX_MAP\` in \`${defaultsFilePath}\`:

\`\`\`typescript
// Add to COLOR_HEX_MAP
${Object.entries(aiAnalysis.colorMappings).map(([name, hex]) => `'${name.toLowerCase()}': '${hex}',`).join('\n')}
\`\`\`
` : ''}

---`;
  }

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

  return `${roleSection}${availableToolsSection}## Fix Post Sync Check Issues for ${brand}

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
- Some brands show color swatches as LINKS TO OTHER PRODUCTS (cross-linking)
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

---

## The Five Consistency Rules

1. **Names Match**: DB title = Filament Detail title = Product Page <h1> (use actual Shopify title, not constructed)
2. **Color/Swatch Accuracy**: Website swatch COUNT and NAMES match DB for the product_line_id
3. **Color/Hex Uniqueness**: No duplicate hex codes within same product_line_id
4. **Price Match**: DB price matches website price for the specific variant (within 5%)
5. **Structural Integrity**: Each product_line_id groups products of same material and base product type

**Note**: "URL Consistency" is NOT required for cross-product swatch brands where each color is a separate product URL.

---

## Verification Steps

After making fixes:

1. Run a **Clean Slate** sync for ${brand}
2. Run **Post Sync Check** again to verify all issues are resolved
3. Spot-check a few product pages to confirm data accuracy

---

*Last Updated: 2026-01-14*`;
}
