

## Add "Strongest 3D Printer Filament" Guide

### Overview
Add a new guide entry at `/guides/strongest-3d-printer-filament` to the existing `BUYING_GUIDE_CONFIGS` in `guideConfigs.ts`. No new files or template changes needed -- this follows the exact same pattern as the recently added `how-to-choose-filament` guide.

### Changes

#### Single file: `src/components/guides/guideConfigs.ts`

Add a new `'strongest-3d-printer-filament'` key to `BUYING_GUIDE_CONFIGS` with:

- **slug**: `strongest-3d-printer-filament`
- **title**: `What Is the Strongest 3D Printer Filament?`
- **seoTitle**: `What Is the Strongest 3D Printer Filament? — Ranked by Strength | FilaScope`
- **seoDescription**: The provided meta description
- **category**: `buying-guide` (renders as "Material Guide" badge via `getCategoryLabel` override or use existing category -- will use `buying-guide` and the badge text comes from config)
- **readTime**: 12
- **publishedAt / updatedAt**: `2026-02-28`
- **layout**: `editorial`
- **filters**: `{ sortBy: 'score', limit: 5 }`
- **quickAnswer**: The provided quick answer text about Nylon, PA-CF, PC, PETG, and PLA strength values

**Editorial sections** (4 content sections, all `position: 'before'`):
1. **"How Do We Measure Filament Strength?"** -- Explains tensile strength (MPa), impact resistance (Izod/Charpy), heat deflection temperature, and layer adhesion strength
2. **"Filament Strength Rankings -- Tensile Strength Comparison"** -- HTML table with columns: Material, Tensile Strength (MPa), Impact Resistance, Heat Deflection (C), Ease of Printing, Best For. Rows for PA-CF, Nylon, Polycarbonate, ABS, PETG, PLA, TPU
3. **"Best Filaments for Strength by Use Case"** -- Practical recommendations for mechanical parts, outdoor, snap-fits, lightweight structural, etc.
4. **"Strength vs Printability -- Finding the Balance"** -- Trade-off guidance; strongest materials are hardest to print

**FAQs**: All 6 questions/answers as specified

**Related Questions (People Also Ask)**: 3-4 additional strength-related questions for broader coverage

**relatedSlugs**: Links to `how-to-choose-filament`, `best-filaments-for-functional-parts`, `filament-temperature-guide`, `petg-vs-abs`

#### Automatic behavior (no changes needed)
- **Route**: Handled by existing `/guides/:slug` catch-all
- **Sitemap**: Dynamic from `BUYING_GUIDE_CONFIGS` keys
- **JSON-LD**: ArticleSchema, FAQSchema, BreadcrumbList all rendered automatically by `BuyingGuideTemplate`
- **Badge**: The `getCategoryLabel` function currently maps `buying-guide` to "Buying Guide". To show "Material Guide" as the badge, we need to either add a new category or override the label. The simplest approach: add `'material-guide'` case to `getCategoryBadgeStyle` and `getCategoryLabel` in `BuyingGuideTemplate.tsx` (2-line addition each)

### Technical Details
- **Files modified**: `guideConfigs.ts` (new config entry) and `BuyingGuideTemplate.tsx` (add `material-guide` category label/style)
- No new components or hooks
- No database changes
- No other pages modified

