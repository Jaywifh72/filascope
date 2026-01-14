// Recreus-specific AI Fix Prompt Generator
// Expert in TPU Shore hardness materials and Spanish color naming

import { CheckResult } from '../types.ts';

interface RecreusAIAnalysis {
  swatchType?: string;
  rootCause?: string;
  wrongDecisions?: string[];
  correctBehavior?: string;
}

/**
 * Generate Recreus-specific AI fix prompt with TPU expertise
 * Uses CSV-seeded architecture with ~70 products across 14+ product lines
 */
export function generateRecreusFixPrompt(
  brand: string,
  checks: CheckResult[],
  totalProducts: number,
  aiAnalysis?: RecreusAIAnalysis | null
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

  // Determine the best AI role
  const role = {
    title: 'Recreus TPU Specialist',
    capabilities: [
      'Shore hardness material normalization (60A, 70A, 82A, 95A)',
      'Spanish color name translation (Negro, Blanco, Rojo, Azul)',
      'TPU-Foam vs non-Foam product line differentiation',
      'Pellet/non-filament product exclusion',
      'CSV seed data integrity verification'
    ],
    lessons: [
      'Recreus uses TPU Shore hardness grades - each is a separate product line',
      'Spanish color names must be mapped in RECREUS_COLOR_MAPPING',
      'TPU Foamy products are separate from regular TPU lines',
      'Pellet and industrial products should be excluded from consumer catalog'
    ]
  };

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
  const lessonsText = role.lessons?.map(l => `- ${l}`).join('\n') || '';

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

*Last Updated: 2026-01-14*`;
}
