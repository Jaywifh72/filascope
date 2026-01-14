// VoxelPLA-specific AI Fix Prompt Generator
// Expert in high-speed PLA+ and PETG+ filaments

import { CheckResult } from '../types.ts';

interface VoxelPLAAIAnalysis {
  swatchType?: string;
  rootCause?: string;
  wrongDecisions?: string[];
  correctBehavior?: string;
}

/**
 * Generate VoxelPLA-specific AI fix prompt
 * Uses CSV-seeded architecture with 38 products across 3 product lines
 */
export function generateVoxelPLAFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: VoxelPLAAIAnalysis | null
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

  // Build root cause sections dynamically
  const rootCauseSections: string[] = [];
  
  // RC0: Product count issues
  if (totalProducts !== 38) {
    rootCauseSections.push(`### RC0: Product Count Mismatch
**Expected**: 38 filament variants
**Actual**: ${totalProducts}

**Fix**: Update \`VOXELPLA_PRODUCT_SEED\` in \`voxelpla-seed.ts\` to include exactly 38 products:
- PLA+ HS: 23 colors
- PETG+ HS: 11 colors  
- Galaxy PETG+ HS: 4 colors

\`\`\`sql
-- Verify product count
SELECT COUNT(*) FROM filaments WHERE vendor = 'VoxelPLA';
\`\`\``);
  }

  // Check for specific issues
  const hasHexIssues = checks.some(c => c.checkName.includes('Hex') && c.status !== 'pass');
  const hasTitleIssues = checks.some(c => c.checkName.includes('Title') && c.status !== 'pass');
  const hasImageIssues = checks.some(c => c.checkName.includes('Image') && c.status !== 'pass');
  const hasPriceIssues = checks.some(c => c.checkName.includes('Price') && c.status !== 'pass');
  const hasProductLineIssues = checks.some(c => c.checkName.includes('Product Line') && c.status !== 'pass');

  if (hasHexIssues) {
    rootCauseSections.push(`### RC1: Color Hex Mapping Gaps

**File**: \`supabase/functions/_shared/voxelpla-seed.ts\`

Missing hex codes detected. Add to \`VOXELPLA_COLOR_HEX_MAP\`:

\`\`\`typescript
export const VOXELPLA_COLOR_HEX_MAP: Record<string, string> = {
  // PLA+ HS Colors (23 total)
  'voxel black': '#1A1A1A',
  'cool white': '#F5F5F5',
  'voxel grey': '#808080',
  'fire engine red': '#DC2626',
  'voxel royal blue': '#4169E1',
  'fire orange': '#FF6B35',
  'ice clear': '#E8E8E8',
  'forest green': '#228B22',
  'lavender purple': '#E6E6FA',
  'yellow': '#FACC15',
  'brown': '#8B4513',
  'silver': '#C0C0C0',
  'voxel phantom blue': '#1E3A5F',
  'dark purple': '#4B0082',
  'army green': '#4B5320',
  'pink': '#EC4899',
  'sky blue': '#87CEEB',
  'witch green': '#228B22',
  'wood': '#DEB887',
  'gold': '#FFD700',
  'magenta': '#FF00FF',
  'gunmetal blue': '#2C3539',
  'champagne beige': '#F5DEB3',
  // PETG+ HS Colors (11 total)
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'blue': '#2563EB',
  'red': '#DC2626',
  'crystal clear': '#F0F0F0',
  'green': '#16A34A',
  'orange': '#EA580C',
  'yellow petg': '#FACC15',
  'purple': '#7C3AED',
  'pink petg': '#EC4899',
  // Galaxy PETG+ HS Colors (4 total)
  'midnight blue': '#191970',
  'emerald gold': '#50C878',
  'gioiello purple': '#9932CC',
  'aurora green': '#00FF7F',
};
\`\`\``);
  }

  if (hasProductLineIssues) {
    rootCauseSections.push(`### RC2: Product Line ID Generation

**File**: \`supabase/functions/_shared/voxelpla-seed.ts\`

Ensure \`getVoxelPLAProductLineId()\` correctly maps materials:

\`\`\`typescript
export function getVoxelPLAProductLineId(material: string): string {
  switch (material) {
    case 'PLA+ HS': return 'voxelpla__pla-plus__hs-pro';
    case 'PETG+ HS': return 'voxelpla__petg__hs-pro';
    case 'Galaxy PETG+ HS': return 'voxelpla__petg__galaxy';
    default: return 'voxelpla__unknown';
  }
}
\`\`\`

**Expected product lines** (3 total):
| Product Line | Material | Colors | product_line_id |
|--------------|----------|--------|-----------------|
| PLA+ HS (Pro) | PLA+ | 23 | \`voxelpla__pla-plus__hs-pro\` |
| PETG+ HS (Pro) | PETG | 11 | \`voxelpla__petg__hs-pro\` |
| Galaxy PETG+ HS | PETG | 4 | \`voxelpla__petg__galaxy\` |`);
  }

  if (hasTitleIssues) {
    rootCauseSections.push(`### RC3: Title Format Issues

**Expected title format**: \`VoxelPLA {Material} - {Color}\`

Examples:
- VoxelPLA PLA+ HS - Voxel Black
- VoxelPLA PETG+ HS - Crystal Clear
- VoxelPLA Galaxy PETG+ HS - Midnight Blue

**File**: \`supabase/functions/sync-voxelpla-products/index.ts\`

Ensure title generation follows pattern:
\`\`\`typescript
const productTitle = \`VoxelPLA \${seed.material} - \${seed.color}\`;
\`\`\``);
  }

  if (hasImageIssues) {
    rootCauseSections.push(`### RC4: Image URL Issues

**File**: \`supabase/functions/_shared/voxelpla-seed.ts\`

Ensure each seed product has a valid \`imageUrl\` from CSV.
All VoxelPLA products have color-specific images.

\`\`\`typescript
// Each seed entry must have imageUrl
{ 
  material: 'PLA+ HS', 
  color: 'Voxel Black', 
  imageUrl: 'https://voxelpla.com/cdn/shop/products/IMG_0065-Edit.png',
  ...
}
\`\`\``);
  }

  if (hasPriceIssues) {
    rootCauseSections.push(`### RC5: Price Validation Issues

**Expected price range**: $25-$35 USD per 1kg spool

**File**: \`supabase/functions/sync-voxelpla-products/index.ts\`

Prices are scraped from Shopify JSON API:
\`\`\`typescript
const shopifyResponse = await fetch(\`\${productUrl}.json\`);
const shopifyData = await shopifyResponse.json();
const price = parseFloat(shopifyData.product.variants[0].price);
\`\`\`

If prices are missing, use fallback from seed:
\`\`\`typescript
const defaultPrice = seed.material.includes('Galaxy') ? 32.99 : 29.99;
\`\`\``);
  }

  return `You are the **VoxelPLA Integration Specialist** for Filascope.

## PLATFORM CONTEXT

**Website**: voxelpla.com (Shopify platform)
**Currency**: USD only
**Region**: US-focused brand
**Architecture**: CSV-seeded sync from \`voxelpla-seed.ts\` (38 variants)
**Specialty**: High-Speed PLA+ and PETG+ filaments for fast printing

---

## CORE CAPABILITIES

1. **VoxelPLA Product Knowledge** - Expert on PLA+ HS, PETG+ HS, Galaxy PETG+ HS lines
2. **CSV-Seeded Sync Architecture** - Manages 38 hardcoded product variants
3. **Shopify Price Scraping** - Fetches live prices from Shopify JSON API
4. **Color Hex Mapping** - Maintains accurate hex codes for all 38 colors
5. **Post Sync Quality Assurance** - Validates data integrity after sync

---

## CSV-SEEDED SYNC ARCHITECTURE

VoxelPLA sync uses a **hardcoded CSV seed** as the primary data source:

1. **VOXELPLA_PRODUCT_SEED** (38 products) in \`voxelpla-seed.ts\` contains:
   - Material, color, productUrl, imageUrl, tdsUrl for each variant
   - Only 1.75mm diameter, 1kg spool weight
   
2. **Filtering Rules Applied:**
   - EXCLUDE: HEPA filters, carbon filters, silica gel (accessories)
   - EXCLUDE: Bento Box, Vento, dry storage (non-filament)
   - EXCLUDE: 2.85mm diameter, samples (<300g), bulk (>5.5kg)
   
3. **VOXELPLA_COLOR_HEX_MAP** provides hex codes for all 38 colors

---

## PRODUCT LINE ARCHITECTURE (3 Lines, 38 Variants)

| Product Line | Material | Colors | product_line_id |
|--------------|----------|--------|-----------------|
| PLA+ HS (Pro) | PLA+ | 23 | \`voxelpla__pla-plus__hs-pro\` |
| PETG+ HS (Pro) | PETG | 11 | \`voxelpla__petg__hs-pro\` |
| Galaxy PETG+ HS | PETG | 4 | \`voxelpla__petg__galaxy\` |

---

## PRINT SETTINGS BY MATERIAL

| Material | Nozzle Temp | Bed Temp | Max Speed |
|----------|-------------|----------|-----------|
| PLA+ | 200-220°C | 45-60°C | 300mm/s |
| PETG | 230-250°C | 60-80°C | 250mm/s |

---

## ROOT CAUSE ANALYSIS FRAMEWORK

${rootCauseSections.length > 0 ? rootCauseSections.join('\n\n---\n\n') : '**All checks passing!**'}

---

## KEY FILES

- \`supabase/functions/_shared/voxelpla-seed.ts\` - CSV seed data (38 products)
- \`supabase/functions/_shared/voxelpla-defaults.ts\` - Accessory patterns, color enrichment
- \`supabase/functions/sync-voxelpla-products/index.ts\` - Sync function (delete-then-insert)

---

${aiInsightsSection}

## Fix Post Sync Check Issues for ${brand}

### Summary
- **Brand**: ${brand} (slug: voxelpla)
- **Total Products**: ${totalProducts} (target: 38)
- **Failed Checks**: ${failedChecks.length}
- **Warning Checks**: ${warningChecks.length}

### Issues Found
${issuesSummary || 'All checks passing!'}

---

## Detailed Issues

${detailedIssues || 'No issues to display.'}

---

## STEP-BY-STEP FIX IMPLEMENTATION ORDER

1. **Fix seed data** in \`voxelpla-seed.ts\` if product count is wrong
2. **Add missing hex codes** to \`VOXELPLA_COLOR_HEX_MAP\`
3. **Update accessory patterns** in \`voxelpla-defaults.ts\` if accessories leaking
4. **Fix product_line_id generation** if grouping is incorrect
5. **Run Clean Slate sync** to apply all fixes
6. **Run Post Sync Check** to verify 0 failures

---

## COMPREHENSIVE VERIFICATION QUERIES

\`\`\`sql
-- 1. Product count (target: 38)
SELECT COUNT(*) FROM filaments WHERE vendor = 'VoxelPLA';

-- 2. Product line count (target: 3)
SELECT COUNT(DISTINCT product_line_id) FROM filaments WHERE vendor = 'VoxelPLA';

-- 3. Product line distribution
SELECT product_line_id, material, COUNT(*) as variants
FROM filaments WHERE vendor = 'VoxelPLA'
GROUP BY product_line_id, material ORDER BY product_line_id;

-- 4. Hex coverage (target: 100%)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE color_hex IS NOT NULL) as with_hex,
  ROUND(100.0 * COUNT(*) FILTER (WHERE color_hex IS NOT NULL) / COUNT(*), 1) as pct
FROM filaments WHERE vendor = 'VoxelPLA';

-- 5. Price validation ($25-$35 expected)
SELECT MIN(variant_price), MAX(variant_price), AVG(variant_price)::numeric(10,2)
FROM filaments WHERE vendor = 'VoxelPLA';

-- 6. Check for accessories (target: 0)
SELECT product_title FROM filaments 
WHERE vendor = 'VoxelPLA' 
AND (product_title ILIKE '%filter%' OR product_title ILIKE '%beads%' OR product_title ILIKE '%bento%');

-- 7. Verify all product_line_ids are set (target: 0 nulls)
SELECT COUNT(*) FROM filaments 
WHERE vendor = 'VoxelPLA' AND product_line_id IS NULL;
\`\`\`

---

*Last Updated: 2026-01-14*`;
}
