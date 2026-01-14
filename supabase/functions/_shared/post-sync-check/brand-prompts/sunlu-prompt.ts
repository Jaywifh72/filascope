// Sunlu AI Fix Prompt Generator
// Moved from run-post-sync-check/index.ts for modularization

import { CheckResult } from '../types.ts';

/**
 * AI Analysis for Sunlu-specific checks
 */
export interface SunluAIAnalysis {
  swatchType?: string;
  rootCause?: string;
  wrongDecisions?: string[];
  correctBehavior?: string;
}

// Helper function to suggest hex codes based on common color names
function getSuggestedHexForColor(colorName: string): string {
  const lower = colorName.toLowerCase().trim();
  
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
  
  if (suggestions[lower]) return suggestions[lower];
  
  for (const [key, hex] of Object.entries(suggestions)) {
    if (lower.includes(key)) return hex;
  }
  
  return 'XXXXXX';
}

/**
 * Generate Sunlu-specific AI Fix Prompt
 */
export function generateSunluFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: SunluAIAnalysis | null
): string {
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

**ROOT CAUSE:** Product URLs or image URLs from Shopify API are returning 404s

**FIX LOCATION:** \`supabase/functions/sync-sunlu-products/index.ts\`
`;
    priorityFixes.push('**PRIORITY 1:** Fix Invalid URLs (RC1)');
  }

  // RC2: Missing Hex Codes
  if (missingHexChecks.length > 0) {
    const missingColors = missingHexChecks.flatMap(c => c.products || []).slice(0, 15);
    const colorNamesToAdd = missingColors.map(p => {
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

**FIX LOCATION:** \`supabase/functions/_shared/sunlu-seed.ts\` → \`SUNLU_EXTENDED_HEX_MAP\`

**COLORS TO ADD:**
\`\`\`typescript
${colorNamesToAdd.slice(0, 12).map(colorName => {
  const suggestedHex = getSuggestedHexForColor(colorName);
  return `  '${colorName}': '${suggestedHex}',`;
}).join('\n')}
\`\`\`
`;
    priorityFixes.push('**PRIORITY 2:** Fix Missing Hex Codes (RC2)');
  }

  // RC3: NULL Prices
  if (priceChecks.length > 0) {
    rootCauseSections += `
### RC3: Missing Prices (NULL variant_price)

**SEVERITY:** 🟡 HIGH - Products without prices can't be compared

**FIX LOCATION:** \`supabase/functions/sync-sunlu-products/index.ts\` → price extraction
`;
    priorityFixes.push('**PRIORITY 3:** Fix NULL Prices (RC3)');
  }

  // RC4: Card Count Mismatch
  if (cardCountChecks.length > 0) {
    rootCauseSections += `
### RC4: Product Line Count Mismatch

**FIX LOCATION:** \`supabase/functions/_shared/sunlu-seed.ts\` → \`normalizeSunluMaterialFromTitle()\`
`;
    priorityFixes.push('**PRIORITY 4:** Fix Product Line Detection (RC4)');
  }

  // RC5: Low Variant Counts
  if (colorVariantChecks.length > 0) {
    rootCauseSections += `
### RC5: Low Color Variant Counts (Single-Variant Lines)

**FIX LOCATION:** Whitelist engineering materials in \`isSingleColorProduct()\`
`;
    priorityFixes.push('**PRIORITY 5:** Fix Variant Counts (RC5)');
  }

  // RC6: UI Display Issues
  if (uiDisplayChecks.length > 0) {
    rootCauseSections += `
### RC6: UI Display Name Issues

**FIX LOCATION:** \`src/utils/productNameUtils.ts\` → \`formatProductLineIdForDisplay()\`
`;
    priorityFixes.push('**PRIORITY 6:** Fix UI Display Names (RC6)');
  }

  // RC7: Image Issues
  if (imageChecks.length > 0) {
    rootCauseSections += `
### RC7: Missing or Invalid Product Images

**FIX LOCATION:** \`supabase/functions/sync-sunlu-products/index.ts\` → image extraction
`;
    priorityFixes.push('**PRIORITY 7:** Fix Missing Images (RC7)');
  }

  const prioritySection = priorityFixes.length > 0 ? `
## 📋 STEP-BY-STEP FIX IMPLEMENTATION ORDER

${priorityFixes.join('\n')}
` : '';

  const issuesSummary = [
    ...failedChecks.map(c => `❌ ${c.checkName}: ${c.count} issues`),
    ...warningChecks.map(c => `⚠️ ${c.checkName}: ${c.count} issues`)
  ].join('\n');

  return `You are the **Sunlu Sync Specialist** for Filascope.

## 🎯 MISSION
Fix ALL Post Sync Check issues for Sunlu in a SINGLE implementation pass.

## PLATFORM CONTEXT
- **Platform**: Shopify
- **Store URL**: https://store.sunlu.com/
- **API**: Shopify JSON API (products.json)
- **Architecture**: Live API sync with curated enrichment

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

${rootCauseSections || 'No specific issues detected.'}

${prioritySection}

## 📁 KEY FILE LOCATIONS

| File | Purpose |
|------|---------|
| \`sync-sunlu-products/index.ts\` | Main sync function |
| \`_shared/sunlu-seed.ts\` | Color mappings, exclusions |
| \`_shared/sunlu-defaults.ts\` | Price fallbacks |

---

*Generated: ${new Date().toISOString().split('T')[0]}*`;
}
