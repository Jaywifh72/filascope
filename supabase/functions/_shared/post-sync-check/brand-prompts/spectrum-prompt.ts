// Spectrum Filaments AI Fix Prompt Generator
// Moved from run-post-sync-check/index.ts for modularization

import { CheckResult } from '../types.ts';

/**
 * AI Analysis for Spectrum-specific checks
 */
export interface SpectrumAIAnalysis {
  swatchType?: string;
  rootCause?: string;
  wrongDecisions?: string[];
  correctBehavior?: string;
}

/**
 * Generate Spectrum Filaments-specific AI Fix Prompt
 */
export function generateSpectrumFilamentsFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: SpectrumAIAnalysis | null
): string {
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

  // AI insights section
  let aiInsightsSection = '';
  if (aiAnalysis) {
    const wrongDecisionsText = aiAnalysis.wrongDecisions?.length 
      ? `### Wrong Decisions Identified\n${aiAnalysis.wrongDecisions.map(d => `- ${d}`).join('\n')}\n`
      : '';
    
    aiInsightsSection = `
---

## 🤖 AI Website Analysis Results

**Swatch Architecture Detected**: ${aiAnalysis.swatchType || 'image-based'}

${aiAnalysis.rootCause ? `### Root Cause Analysis\n${aiAnalysis.rootCause}\n` : ''}

${wrongDecisionsText}

${aiAnalysis.correctBehavior ? `### Correct Behavior Expected\n${aiAnalysis.correctBehavior}\n` : ''}

---`;
  }

  return `You are the **Spectrum Filaments Sync Specialist** for Filascope.

## PLATFORM CONTEXT

**Platform**: WooCommerce (spectrumfilaments.com - PLN primary)
**Currency**: PLN (primary), EUR, USD
**Architecture**: CSV-seeded sync pipeline (~400+ products)

---

## CORE CAPABILITIES

1. **WooCommerce JSON API expertise**
2. **PLN-to-USD currency conversion**
3. **Polish color name handling** (e.g., Czerwony, Niebieski, Biały)
4. **Smart-ABS and specialty material detection**

---

## CSV-SEEDED SYNC ARCHITECTURE

Spectrum sync uses a **hardcoded CSV seed** as the primary data source:

1. **SPECTRUM_PRODUCT_SEED** in \`spectrum-seed-data.ts\` contains:
   - Product names, colors, hex codes, product URLs
   - Only 1.75mm, consumer-focused spool sizes
   
2. **Filtering Rules Applied:**
   - EXCLUDE: 2.85mm/3.0mm diameter, samples (<300g), bulk (>5.5kg)
   - DEDUPLICATE: Same color with multiple weight variants
   
3. **SPECTRUM_COLOR_MAPPING** provides hex codes including Polish names

---

## ROOT CAUSE ANALYSIS FRAMEWORK

- **RC1**: CSV seed missing products/colors
- **RC2**: Color-to-hex mapping gaps (including Polish names)
- **RC3**: Material normalization bugs (Smart-ABS, PLA Glitter, etc.)
- **RC4**: Product line ID grouping issues
- **RC5**: PLN price conversion failures

---

## KEY FILES

- \`supabase/functions/_shared/spectrum-seed-data.ts\` - CSV seed data
- \`supabase/functions/_shared/spectrum-defaults.ts\` - Enrichment, hex mapping
- \`supabase/functions/sync-spectrum-products/index.ts\` - Sync function

---
${aiInsightsSection}

## Fix Post Sync Check Issues for ${brand}

### Summary
- **Brand**: ${brand} (slug: spectrum-filaments)
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

1. Run **Clean Slate** sync for Spectrum Filaments
2. Run **Post Sync Check** to verify 0 failures
3. Confirm product line counts match expectations
4. Verify Polish color names are mapped correctly
5. Check PLN-to-USD price conversion is accurate

---

## SQL Verification Queries

\`\`\`sql
-- 1. Total product count
SELECT COUNT(*) as total FROM filaments WHERE vendor = 'Spectrum';

-- 2. Product line distribution
SELECT product_line_id, COUNT(*) as variants
FROM filaments WHERE vendor = 'Spectrum'
GROUP BY product_line_id ORDER BY product_line_id;

-- 3. Hex coverage (target: 100%)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE color_hex IS NOT NULL) as with_hex,
  ROUND(100.0 * COUNT(*) FILTER (WHERE color_hex IS NOT NULL) / COUNT(*), 1) as pct
FROM filaments WHERE vendor = 'Spectrum';

-- 4. Price validation (USD converted from PLN)
SELECT MIN(variant_price), MAX(variant_price), AVG(variant_price)::numeric(10,2)
FROM filaments WHERE vendor = 'Spectrum';
\`\`\`

---

*Last Updated: ${new Date().toISOString().split('T')[0]}*`;
}
