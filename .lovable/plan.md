

## Add "How to Store Filament" Guide

### Overview
Add a new guide page at `/guides/how-to-store-filament` following the established config-driven pattern. Requires adding a new `how-to` category type and the full config entry.

### Changes

#### 1. `src/components/guides/guideConfigs.ts`

**Extend category type** on the `GuideConfig` interface (line 34) to include `'how-to'`:
```
'buying-guide' | 'comparison' | 'beginner' | 'hueforge' | 'printer-specific' | 'material-guide' | 'how-to'
```

**Add config entry** `'how-to-store-filament'` to `BUYING_GUIDE_CONFIGS` with:
- slug, title ("How to Store 3D Printer Filament Properly"), seoTitle, seoDescription as specified
- category: `'how-to'`
- readTime: 10, publishedAt/updatedAt: `'2026-02-28'`
- layout: `'editorial'`
- filters: `{ sortBy: 'score', limit: 5 }`
- quickAnswer: The provided 60-word moisture/storage paragraph
- howTo: 5 steps (Identify moisture symptoms, Set dryer temperature, Dry for recommended time, Print test piece, Store immediately)

**Editorial sections** (4 sections, all `position: 'before'`):
1. "Why Does Filament Moisture Matter?" -- Explains hygroscopic properties, print quality degradation
2. "Which Filaments Are Most Sensitive to Moisture?" -- HTML table with columns: Material, Sensitivity Level, Max Recommended Humidity, Symptoms When Wet, Drying Temp (C), Drying Time (hours). Rows for PLA, PETG, ABS, TPU, Nylon, PVA, ASA
3. "Best Filament Storage Methods" -- Covers dry boxes, vacuum bags, desiccant, airtight containers
4. "How to Tell If Your Filament Has Absorbed Moisture" -- Visual and audible signs
5. "How to Dry Wet Filament" -- Dehydrator/dryer instructions by material

**FAQs**: All 6 specified questions/answers

**Related Questions**: 3-4 PAA entries (e.g., "Does PLA go bad over time?", "Can wet filament damage my printer?", "How much silica gel do I need per spool?")

**relatedSlugs**: `['how-to-choose-filament', 'strongest-3d-printer-filament', 'best-pla-filaments', 'filament-temperature-guide']`

#### 2. `src/components/guides/BuyingGuideTemplate.tsx`

Add `'how-to'` case to both `getCategoryBadgeStyle` and `getCategoryLabel`:
- Style: `'bg-teal-500/10 text-teal-400 border-teal-500/20'`
- Label: `'How-To Guide'`

#### 3. `public/sitemap.xml`

Add entry for `https://filascope.com/guides/how-to-store-filament` with weekly changefreq and 0.8 priority.

### Automatic behavior (no changes needed)
- Route: Handled by `/guides/:slug` catch-all
- JSON-LD: ArticleSchema, FAQPage, HowToSchema, and BreadcrumbList all rendered automatically by BuyingGuideTemplate
- Quick Answer block rendered from `quickAnswer` field

### Files modified
- `src/components/guides/guideConfigs.ts` (type extension + new config entry)
- `src/components/guides/BuyingGuideTemplate.tsx` (2-line category additions)
- `public/sitemap.xml` (new URL entry)
