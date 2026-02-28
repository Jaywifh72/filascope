

## Add "Food Safe Filament" Guide

### Overview
Add a new guide at `/guides/food-safe-filament` using the existing config-driven pattern. The `material-guide` category is already supported. Only `guideConfigs.ts` needs a new entry.

### Changes

#### 1. `src/components/guides/guideConfigs.ts`

Add `'food-safe-filament'` entry to `BUYING_GUIDE_CONFIGS` with:
- **slug**: `food-safe-filament`
- **title**: `What 3D Printer Filament Is Food Safe?`
- **seoTitle**: `What 3D Printer Filament Is Food Safe? — Complete Guide | FilaScope`
- **seoDescription**: As specified
- **category**: `'material-guide'` (already supported, renders "Material Guide" badge with violet styling)
- **readTime**: 10
- **publishedAt/updatedAt**: `'2026-02-28'`
- **layout**: `'editorial'`
- **filters**: `{ sortBy: 'score', limit: 5 }`
- **quickAnswer**: The provided paragraph about PETG, PLA, nozzle material, and layer-line bacteria concerns

**Editorial sections** (4 sections, all `position: 'before'`):

1. **"Which Filaments Have Food Safety Certification?"** -- Comparison of PLA, PETG, PP, and specialty filaments. HTML table with columns: Material, FDA Certified Brands Available, Safe For, Notes. Rows for PETG, PLA (natural), PP, Nylon, ABS, TPU.

2. **"Why Most 3D Prints Are Not Food Safe"** -- Covers three key issues: layer lines harboring bacteria, brass nozzle lead contamination, and non-certified colorants/additives.

3. **"How to Make 3D Prints Safer for Food Contact"** -- Practical steps: use stainless steel nozzle, choose certified filament, apply food-grade epoxy coating, limit to single-use items, and hand-wash only.

4. **"Best Food-Safe Filament Brands"** -- Recommendations for certified PETG and natural PLA brands with brief notes on certifications.

**FAQs**: All 6 specified questions/answers

**Related Questions (People Also Ask)**: 3 entries:
- "Can 3D printed cookie cutters be food safe?" -- Cookie cutters have brief contact with dough, making PLA acceptable for single use, but coat with food-grade epoxy for repeated use.
- "Is resin printing safer for food contact than FDM?" -- Some food-safe resins exist, but most standard resins are toxic. FDM with certified PETG is generally the easier path.
- "Does dishwasher heat warp food-safe filament?" -- PLA warps above 60C. PETG handles up to ~80C but hand-washing is always recommended for 3D prints.

**relatedSlugs**: `['strongest-3d-printer-filament', 'best-petg-filaments', 'best-pla-filaments', 'how-to-choose-filament']`

#### 2. `public/sitemap.xml`

Add entry for `https://filascope.com/guides/food-safe-filament` with weekly changefreq and 0.8 priority.

### Automatic behavior (no changes needed)
- Route: Handled by existing `/guides/:slug` catch-all
- JSON-LD: Article, FAQPage, and BreadcrumbList rendered automatically by BuyingGuideTemplate
- Badge: `material-guide` category already configured with violet styling and "Material Guide" label
- Quick Answer block: Already rendered from `quickAnswer` field

### Files modified
- `src/components/guides/guideConfigs.ts` (new config entry)
- `public/sitemap.xml` (new URL entry)

