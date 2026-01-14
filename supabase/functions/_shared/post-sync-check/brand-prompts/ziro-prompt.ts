// Ziro-specific AI Fix Prompt Generator

import { CheckResult } from '../types.ts';

/**
 * Generate Ziro-specific AI fix prompt
 * Uses CSV-seeded architecture with 268 products across 30+ product lines
 */
export function generateZiroFixPrompt(
  checks: CheckResult[],
  totalProducts: number
): string {
  const failingChecks = checks.filter(c => c.status === 'fail' || c.status === 'warning');
  
  if (failingChecks.length === 0) {
    return `✅ Ziro sync is healthy! All ${totalProducts} products passed quality checks.`;
  }
  
  // Analyze root causes from failing checks
  const rootCauses: string[] = [];
  const sqlVerifications: string[] = [];
  
  // RC1: Missing color hex codes
  const hexCheck = failingChecks.find(c => c.checkName.toLowerCase().includes('hex'));
  if (hexCheck) {
    rootCauses.push(`**RC1: Missing Color Hex Codes** (${hexCheck.count} issues)
- Ziro uses extensive color variations (Galaxy, Silk, Sparkle effects)
- Check ZIRO_COLOR_MAPPING in ziro-defaults.ts covers all colors
- Some gradient/tri-color products need representative hex selection`);
    sqlVerifications.push(`-- Verify missing hex codes
SELECT product_title, color_family, color_hex 
FROM filaments 
WHERE vendor = 'Ziro' AND color_hex IS NULL
ORDER BY product_line_id;`);
  }
  
  // RC2: Material classification issues
  const materialCheck = failingChecks.find(c => c.checkName.toLowerCase().includes('material'));
  if (materialCheck) {
    rootCauses.push(`**RC2: Material Classification Issues** (${materialCheck.count} issues)
- Ziro has specialty materials: TPU-95A, PLA-CF, PA-CF, etc.
- normalizeZiroMaterial() in ziro-defaults.ts handles edge cases
- High-Speed variants (PLA-HS) need proper detection`);
    sqlVerifications.push(`-- Verify material classification
SELECT material, COUNT(*) as count
FROM filaments 
WHERE vendor = 'Ziro'
GROUP BY material
ORDER BY count DESC;`);
  }
  
  // RC3: Product line grouping issues
  const variantCheck = failingChecks.find(c => c.checkName.toLowerCase().includes('variant'));
  if (variantCheck) {
    rootCauses.push(`**RC3: Product Line Grouping Issues** (${variantCheck.count} issues)
- Each color variant should be one row in filaments table
- product_line_id should group colors of same material/series
- Check generateZiroProductLineId() in ziro-defaults.ts`);
    sqlVerifications.push(`-- Verify product line distribution
SELECT product_line_id, COUNT(*) as variant_count
FROM filaments 
WHERE vendor = 'Ziro' AND product_line_id IS NOT NULL
GROUP BY product_line_id
ORDER BY variant_count DESC
LIMIT 20;`);
  }
  
  // RC4: Price data issues
  const priceCheck = failingChecks.find(c => c.checkName.toLowerCase().includes('price'));
  if (priceCheck) {
    rootCauses.push(`**RC4: Price Data Issues** (${priceCheck.count} issues)
- Ziro prices from Shopify API (live scrape)
- Seed provides fallback for discontinued products
- Check variant_price is populated from API response`);
    sqlVerifications.push(`-- Verify price coverage
SELECT 
  COUNT(*) as total,
  COUNT(variant_price) as with_price,
  ROUND(AVG(variant_price)::numeric, 2) as avg_price
FROM filaments 
WHERE vendor = 'Ziro';`);
  }
  
  // RC5: Image URL issues
  const imageCheck = failingChecks.find(c => c.checkName.toLowerCase().includes('image'));
  if (imageCheck) {
    rootCauses.push(`**RC5: Image URL Issues** (${imageCheck.count} issues)
- Ziro uses Shopify CDN for product images
- Cross-product swatch architecture (each color = separate product)
- featured_image should be populated from Shopify API`);
    sqlVerifications.push(`-- Verify image coverage
SELECT 
  COUNT(*) as total,
  COUNT(featured_image) as with_image
FROM filaments 
WHERE vendor = 'Ziro';`);
  }
  
  // Build the prompt
  let prompt = `# Ziro Post-Sync Fix Prompt

## Summary
- **Total Products:** ${totalProducts}
- **Failing Checks:** ${failingChecks.length}
- **Issues Detected:** ${failingChecks.map(c => c.checkName).join(', ')}

## Architecture Context
- **Sync Function:** supabase/functions/sync-ziro-products/index.ts
- **Defaults Module:** supabase/functions/_shared/ziro-defaults.ts
- **Seed Data:** supabase/functions/_shared/ziro-seed.ts (268 products)
- **Platform:** Shopify (ziro3d.com)
- **Sync Pattern:** CSV-seeded with live Shopify price enrichment

## Root Cause Analysis

${rootCauses.join('\n\n')}

## Failing Checks Details

${failingChecks.map(c => `### ${c.checkName}
- **Status:** ${c.status.toUpperCase()}
- **Count:** ${c.count}
- **Details:** ${c.details || 'No details'}
${c.products ? `- **Sample Issues:**\n${c.products.slice(0, 5).map(p => `  - ${p.title}: ${p.issue}`).join('\n')}` : ''}`).join('\n\n')}

## SQL Verification Queries

\`\`\`sql
${sqlVerifications.join('\n\n')}
\`\`\`

## Implementation Priority

1. **Seed Data Integrity** - Ensure ziro-seed.ts has all 268 products with correct fields
2. **Color Mapping** - Verify ZIRO_COLOR_MAPPING covers all Ziro color names
3. **Material Normalization** - Check normalizeZiroMaterial() handles all cases
4. **Product Line IDs** - Ensure consistent grouping across series
5. **Live Price Fetch** - Verify Shopify API integration works

## Key Files to Review

1. \`supabase/functions/_shared/ziro-seed.ts\` - CSV seed data
2. \`supabase/functions/_shared/ziro-defaults.ts\` - Brand-specific utilities
3. \`supabase/functions/sync-ziro-products/index.ts\` - Main sync logic

## Ziro-Specific Notes

- **30+ Product Lines:** Galaxy, Silk, Sparkle, Marble, Carbon Fiber, etc.
- **Effects-Based Products:** Multi-color gradients use representative hex
- **High-Speed Variants:** PLA-HS, PETG-HS need detection
- **TPU Shore Hardness:** TPU-95A material classification
- **Specialty Materials:** PA-CF, PLA-CF marked as abrasive
`;

  return prompt;
}
