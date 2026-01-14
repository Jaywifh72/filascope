// Ziro-specific AI Fix Prompt Generator
// Enhanced with issue-specific fix sections for single-pass resolution

import { CheckResult } from '../types.ts';

interface ZiroAIAnalysis {
  swatchArchitecture?: string;
  rootCauseAnalysis?: string;
  missingColors?: string[];
  extractionPattern?: string;
}

interface ZiroCheckContext {
  expectedCardCount?: number;
  actualCardCount?: number;
  productLineIds?: string[];
}

/**
 * Generate Ziro-specific AI fix prompt with exhaustive single-pass fix instructions
 * Uses CSV-seeded architecture with 268 products across 30+ product lines
 */
export function generateZiroFixPrompt(
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: ZiroAIAnalysis | null,
  context?: ZiroCheckContext
): string {
  const failingChecks = checks.filter(c => c.status === 'fail');
  const warningChecks = checks.filter(c => c.status === 'warning');
  const allIssues = [...failingChecks, ...warningChecks];
  
  if (allIssues.length === 0) {
    return `✅ Ziro sync is healthy! All ${totalProducts} products passed quality checks.`;
  }

  // Categorize issues by type for targeted fixes
  const titleMismatchChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('title accuracy')
  );
  
  const hexColorChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('hex') && 
    !c.checkName.toLowerCase().includes('uniqueness')
  );
  
  const swatchUniquenessChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('swatch uniqueness') ||
    c.checkName.toLowerCase().includes('duplicate')
  );
  
  const cardCountChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('card count')
  );
  
  const urlConsistencyChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('url consistency')
  );
  
  const colorVariantChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('variant count')
  );
  
  const colorNamesChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('color names')
  );
  
  const colorCountChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('color count match')
  );
  
  const cardTitleFormatChecks = allIssues.filter(c => 
    c.checkName.toLowerCase().includes('card title format')
  );

  // Build root cause sections
  let rootCauseSections = '';
  const priorityFixes: string[] = [];

  // ==========================================================================
  // RC0: Skip Logic Failure (Checks that SHOULD be skipped for CSV-seeded brands)
  // ==========================================================================
  const skipLogicIssues = titleMismatchChecks.length > 0 || 
                          hexColorChecks.length > 0 || 
                          colorNamesChecks.length > 0 ||
                          colorCountChecks.length > 0;
  
  if (skipLogicIssues) {
    const affectedChecks: string[] = [];
    if (titleMismatchChecks.length > 0) affectedChecks.push(`- ❌ Title Accuracy (${titleMismatchChecks[0].count} issues) - Ziro should be in skipTitleCheckBrands`);
    if (hexColorChecks.length > 0) affectedChecks.push(`- ❌ Hex-Color Accuracy (${hexColorChecks[0].count} issues) - Ziro should be in skipHexColorCheckBrands`);
    if (colorNamesChecks.length > 0) affectedChecks.push(`- ⚠️ Color Names Match (${colorNamesChecks[0].count} issues) - Ziro should be in skipColorNameCheckBrands`);
    if (colorCountChecks.length > 0) affectedChecks.push(`- ⚠️ Color Count Match (${colorCountChecks[0].count} issues) - Ziro should be in skipColorCountCheckBrands`);

    rootCauseSections += `
## RC0: Post Sync Check Skip Logic Failure

**SEVERITY:** 🔴 CRITICAL - These checks should be SKIPPED for CSV-seeded brands like Ziro

**Why Ziro Should Skip These Checks:**
- Ziro uses a **curated CSV seed** (\`ziro-seed.ts\`) with 268 pre-defined products
- Titles are intentionally cleaned/standardized (not scraped from website H1)
- Color hex codes are manually mapped in \`ZIRO_COLOR_MAPPING\`
- Color names come from seed data, not live website scraping

**Affected Checks:**
${affectedChecks.join('\n')}

**ROOT CAUSE:** The skip logic in \`run-post-sync-check/index.ts\` logs "skipping" but still adds issues to the failure list

**FIX LOCATION:** \`supabase/functions/run-post-sync-check/index.ts\`

**EXACT FIX PATTERN:**
For each affected check, ensure the skip condition returns early with \`status: 'skipped'\`:

\`\`\`typescript
// ❌ WRONG - logs skip but continues to check and fail
if (skipTitleCheckBrands.includes(brandSlug)) {
  console.log(\`Skipping title check for \${brandSlug}\`);
  // Falls through and still adds failures!
}

// ✅ CORRECT - returns 'skipped' status immediately
if (skipTitleCheckBrands.includes(brandSlug)) {
  titleAccuracyResults.push({
    checkName: 'Title Accuracy (DB matches Page)',
    status: 'skipped',
    count: 0,
    details: \`Skipped for CSV-seeded brand: \${brandSlug}\`
  });
  // Skip the actual check logic
}
\`\`\`

**VERIFY ZIRO IS IN SKIP LISTS:**
\`\`\`typescript
// In run-post-sync-check/index.ts, find these arrays and ensure 'ziro' is included:
const skipTitleCheckBrands = ['eryone', 'esun', 'extrudr', 'ziro', /* ... */];
const skipHexColorCheckBrands = ['eryone', 'esun', 'extrudr', 'ziro', /* ... */];
const skipColorNameCheckBrands = ['ziro', /* ... */];
const skipColorCountCheckBrands = ['sunlu', 'ziro', /* ... */];
\`\`\`
`;
    priorityFixes.push('1. **Fix Skip Logic** - Ensure checks return `status: \'skipped\'` for Ziro (RC0)');
  }

  // ==========================================================================
  // RC1: Swatch Uniqueness (Duplicate Hex Codes)
  // ==========================================================================
  if (swatchUniquenessChecks.length > 0) {
    const duplicates = swatchUniquenessChecks.flatMap(c => c.products || []);
    
    rootCauseSections += `
## RC1: Duplicate Hex Codes in Same Product Line

**SEVERITY:** 🔴 CRITICAL - Colors become indistinguishable in UI swatches

**Affected Products (${duplicates.length} duplicates):**
${duplicates.slice(0, 10).map(p => `- \`${p.title}\`: ${p.issue}`).join('\n')}
${duplicates.length > 10 ? `\n... and ${duplicates.length - 10} more` : ''}

**FIX LOCATION:** \`supabase/functions/_shared/ziro-seed.ts\`

**HOW TO FIX:**
1. Find the duplicate hex codes in the seed data
2. Assign unique hex codes to each color variant
3. Use slight variations for similar colors (e.g., #FFFF00 → #DFFF00)

**EXAMPLE FIX (Translucent Fluo Yellow duplicate):**
\`\`\`typescript
// In ziro-seed.ts, find the entry and change:
{
  product_title: 'ZIRO Translucent PLA - Translucent Fluo Yellow',
  color_hex: '#DFFF00',  // Changed from #FFFF00 to avoid duplicate
  // ...
}
\`\`\`

**VERIFICATION QUERY:**
\`\`\`sql
-- Find all duplicate hex codes within same product line
SELECT product_line_id, color_hex, COUNT(*) as count, 
       array_agg(product_title) as products
FROM filaments 
WHERE vendor = 'Ziro' AND color_hex IS NOT NULL
GROUP BY product_line_id, color_hex
HAVING COUNT(*) > 1
ORDER BY count DESC;
\`\`\`
`;
    priorityFixes.push('2. **Fix Duplicate Hex Codes** - Update `ziro-seed.ts` with unique hex values (RC1)');
  }

  // ==========================================================================
  // RC2: Filament Card Count Mismatch
  // ==========================================================================
  if (cardCountChecks.length > 0) {
    const cardInfo = cardCountChecks[0];
    const expectedCount = context?.expectedCardCount || 30;
    const actualCount = context?.actualCardCount || cardInfo.count;
    const foundLines = cardInfo.products?.[0]?.issue?.match(/Found: (.+)/)?.[1] || '';
    
    rootCauseSections += `
## RC2: Filament Card Count Mismatch

**Expected:** ${expectedCount} cards (defined in EXPECTED_CARD_COUNTS)
**Found:** ${actualCount} cards

**Product Lines Found:**
\`\`\`
${foundLines.split(', ').slice(0, 15).join('\n')}
${foundLines.split(', ').length > 15 ? `... and ${foundLines.split(', ').length - 15} more` : ''}
\`\`\`

**ROOT CAUSE OPTIONS:**
1. \`EXPECTED_CARD_COUNTS['ziro']\` has wrong value
2. \`generateZiroProductLineId()\` creates incorrect groupings  
3. Database has stale product_line_ids from previous syncs

**FIX OPTION 1 (Most Likely):** Update expected count

**File:** \`supabase/functions/_shared/post-sync-check/constants.ts\`
\`\`\`typescript
export const EXPECTED_CARD_COUNTS: Record<string, number> = {
  // ...
  'ziro': 30,  // Update to match actual product line count
};
\`\`\`

**OR in:** \`supabase/functions/run-post-sync-check/index.ts\` (local override ~line 10566)
\`\`\`typescript
'ziro': 30,  // 30 product lines from CSV seed
\`\`\`

**FIX OPTION 2:** Review product line ID generation in \`ziro-defaults.ts\`

**VERIFICATION QUERY:**
\`\`\`sql
-- Count distinct product lines
SELECT COUNT(DISTINCT product_line_id) as product_line_count
FROM filaments WHERE vendor = 'Ziro';

-- List all product lines with variant counts
SELECT product_line_id, COUNT(*) as variants
FROM filaments WHERE vendor = 'Ziro'
GROUP BY product_line_id
ORDER BY product_line_id;
\`\`\`
`;
    priorityFixes.push('3. **Fix Card Count** - Update `EXPECTED_CARD_COUNTS[\'ziro\']` to correct value (RC2)');
  }

  // ==========================================================================
  // RC3: URL Consistency (Expected for Cross-Product Swatch Brands)
  // ==========================================================================
  if (urlConsistencyChecks.length > 0) {
    const urlIssues = urlConsistencyChecks.flatMap(c => c.products || []);
    
    rootCauseSections += `
## RC3: Product Line URL Consistency Failure

**SEVERITY:** 🟢 LOW - This is **EXPECTED BEHAVIOR** for Ziro

**What's Happening:**
${urlIssues.slice(0, 5).map(p => `- \`${p.title}\`: ${p.issue}`).join('\n')}
${urlIssues.length > 5 ? `\n... and ${urlIssues.length - 5} more product lines` : ''}

**WHY THIS IS NOT A BUG:**
Ziro uses a **cross-product swatch architecture** where:
- Each color variant is a **separate Shopify product** with its own URL
- The "swatches" on product pages are links to OTHER products
- Multiple URLs per product_line_id is the **correct behavior**

**ROOT CAUSE OF FAILURE:** Ziro may not be in the skip list

**FIX LOCATION:** \`supabase/functions/_shared/post-sync-check/constants.ts\`

**VERIFY ZIRO IS LISTED:**
\`\`\`typescript
export const CROSS_PRODUCT_URL_BRANDS = [
  '3dfuel',
  'polymaker', 
  'hatchbox',
  'ziro',  // ← MUST be present
  // ...
];
\`\`\`

**ALTERNATIVE FIX:** Add to local skip list in \`run-post-sync-check/index.ts\`
\`\`\`typescript
const skipUrlCheckBrands = ['3dfuel', 'polymaker', 'ziro', /* ... */];
\`\`\`
`;
    priorityFixes.push('4. **Fix URL Consistency** - Add Ziro to `CROSS_PRODUCT_URL_BRANDS` (RC3)');
  }

  // ==========================================================================
  // RC4: Color Variant Count (Single-Variant Product Lines)
  // ==========================================================================
  if (colorVariantChecks.length > 0) {
    const variantIssues = colorVariantChecks.flatMap(c => c.products || []);
    const singleVariantLines = variantIssues
      .filter(p => p.issue?.includes('Only 1 variant'))
      .map(p => p.title);
    
    // Known legitimate single-variant Ziro product lines
    const legitSingleVariants = [
      'ziro__pla__rainbow-glow',
      'ziro__pla__stone-blue-white', 
      'ziro__pla__marble',
      'ziro__pla__straw-fiber'
    ];
    
    rootCauseSections += `
## RC4: Single-Variant Product Lines

**Affected Product Lines (${singleVariantLines.length} with only 1 variant):**
${singleVariantLines.slice(0, 10).map(line => `- \`${line}\``).join('\n')}
${singleVariantLines.length > 10 ? `\n... and ${singleVariantLines.length - 10} more` : ''}

**WHY THESE ARE LEGITIMATE:**
These are **effect-based products** where the effect IS the product:
- \`rainbow-glow\` - Single rainbow gradient color
- \`stone-blue-white\` - Single stone effect
- \`marble\` - Single marble pattern
- \`straw-fiber\` - Single straw-infused material

**FIX LOCATION:** \`supabase/functions/_shared/post-sync-check/constants.ts\`

**ADD TO SINGLE_VARIANT_PRODUCT_LINES:**
\`\`\`typescript
export const SINGLE_VARIANT_PRODUCT_LINES = [
  // Ziro single-variant product lines
  'ziro__pla__rainbow-glow',
  'ziro__pla__stone-blue-white',
  'ziro__pla__marble', 
  'ziro__pla__straw-fiber',
  // ... other brands ...
];
\`\`\`

**ALTERNATIVE:** Add to \`isSingleColorProduct\` check in \`run-post-sync-check/index.ts\`

**VERIFICATION QUERY:**
\`\`\`sql
-- List all single-variant product lines
SELECT product_line_id, COUNT(*) as variant_count, 
       array_agg(product_title) as products
FROM filaments WHERE vendor = 'Ziro'
GROUP BY product_line_id
HAVING COUNT(*) = 1
ORDER BY product_line_id;
\`\`\`
`;
    priorityFixes.push('5. **Fix Variant Count** - Add single-variant lines to `SINGLE_VARIANT_PRODUCT_LINES` (RC4)');
  }

  // ==========================================================================
  // RC5: Card Title Format Issues
  // ==========================================================================
  if (cardTitleFormatChecks.length > 0) {
    const titleIssues = cardTitleFormatChecks.flatMap(c => c.products || []);
    
    rootCauseSections += `
## RC5: Card Title Format Issues

**Affected Titles (${titleIssues.length} issues):**
${titleIssues.slice(0, 10).map(p => `- "${p.title}": ${p.issue}`).join('\n')}
${titleIssues.length > 10 ? `\n... and ${titleIssues.length - 10} more` : ''}

**ROOT CAUSE:** The \`formatProductLineIdForDisplay()\` function may not handle Ziro's product_line_id format correctly

**Expected Format:** Clean product line names like "PLA Silk", "TPU 95A", "Carbon Fiber PLA"
**Actual Format:** May show variant names or raw IDs

**FIX LOCATION:** \`src/utils/productNameUtils.ts\`

**VERIFY FORMATTING LOGIC:**
\`\`\`typescript
// Check that formatProductLineIdForDisplay handles ziro__ prefix
export function formatProductLineIdForDisplay(productLineId: string): string {
  // Should convert: ziro__pla__silk → "PLA Silk"
  // Should convert: ziro__tpu-95a__standard → "TPU 95A"
}
\`\`\`

**ALTERNATIVE:** This may be a false positive if the expected format in the check is wrong
Check \`simulateUIDisplayName()\` in \`run-post-sync-check/index.ts\`
`;
    priorityFixes.push('6. **Fix Card Titles** - Review `formatProductLineIdForDisplay()` for Ziro format (RC5)');
  }

  // ==========================================================================
  // Build Final Prompt
  // ==========================================================================
  let prompt = `# Ziro Post-Sync Check - AI Fix Prompt

## Summary
| Metric | Value |
|--------|-------|
| **Brand** | Ziro (slug: \`ziro\`) |
| **Total Products** | ${totalProducts} |
| **Failed Checks** | ${failingChecks.length} |
| **Warning Checks** | ${warningChecks.length} |
| **Issues to Fix** | ${allIssues.reduce((sum, c) => sum + c.count, 0)} |

## Issue Overview
${failingChecks.map(c => `❌ **${c.checkName}**: ${c.count} issues`).join('\n')}
${warningChecks.map(c => `⚠️ **${c.checkName}**: ${c.count} issues`).join('\n')}

---

${rootCauseSections}

---

## Priority Fix Order

${priorityFixes.length > 0 ? priorityFixes.join('\n') : 'No fixes required.'}

---

## After All Fixes

1. **Deploy** \`run-post-sync-check\` edge function
2. **Run Clean Slate sync** for Ziro (to apply seed changes)
3. **Run Post Sync Check** again
4. **Verify** all checks show ✅ PASS or ⏭️ SKIPPED

---

## Ziro Architecture Reference

### File Locations
| File | Purpose |
|------|---------|
| \`supabase/functions/sync-ziro-products/index.ts\` | Main sync function |
| \`supabase/functions/_shared/ziro-seed.ts\` | 268-product CSV seed data |
| \`supabase/functions/_shared/ziro-defaults.ts\` | Color mapping, material normalization, product line ID generation |
| \`supabase/functions/_shared/post-sync-check/constants.ts\` | Skip lists, expected counts |
| \`supabase/functions/run-post-sync-check/index.ts\` | Post sync check logic |

### Key Architecture Facts
- **Total Products:** 268 variants across 30 product lines
- **Materials:** PLA (20+ finish types), PLA-CF, PLA-HS, TPU-95A
- **Platform:** Shopify (ziro3d.com)
- **Sync Pattern:** CSV-seeded with optional live Shopify price enrichment
- **Swatch Type:** Cross-product (each color = separate Shopify product URL)

### Product Line Distribution
| Category | Lines | Example |
|----------|-------|---------|
| Standard PLA | 1 | Basic PLA |
| Effect PLA | 15+ | Silk, Matte, Gradient, Twinkling, Diamond |
| Specialty PLA | 5+ | Chameleon, Firefly, Fluorescent, Glow |
| Composite | 1 | Carbon Fiber PLA |
| High-Speed | 1 | PLA-HS |
| TPU | 2 | TPU-95A Standard, TPU-95A Gradient |

### Color Mapping
The \`ZIRO_COLOR_MAPPING\` in \`ziro-defaults.ts\` contains 100+ color-to-hex mappings.
When adding new colors, follow this pattern:
\`\`\`typescript
export const ZIRO_COLOR_MAPPING: Record<string, string> = {
  'black': '#000000',
  'white': '#FFFFFF',
  'silver black': '#2F4F4F',  // Compound colors use representative hex
  'galaxy purple': '#663399',  // Effect colors use dominant color
  // ...
};
\`\`\`
`;

  // Add AI Analysis section if provided
  if (aiAnalysis) {
    prompt += `
---

## AI Website Analysis Results

**Swatch Architecture:** ${aiAnalysis.swatchArchitecture || 'cross-product (image-alt based)'}

**Extraction Pattern:** ${aiAnalysis.extractionPattern || 'Color extracted from product title and URL path'}

${aiAnalysis.rootCauseAnalysis ? `**Root Cause Analysis:**\n${aiAnalysis.rootCauseAnalysis}` : ''}

${aiAnalysis.missingColors && aiAnalysis.missingColors.length > 0 ? `
**Missing Colors to Add:**
\`\`\`typescript
// Add to ZIRO_COLOR_MAPPING in ziro-defaults.ts:
${aiAnalysis.missingColors.map(c => `'${c.toLowerCase()}': '#000000', // TODO: Add correct hex`).join('\n')}
\`\`\`
` : ''}
`;
  }

  return prompt;
}
