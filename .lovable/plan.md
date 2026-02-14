
# Add 5 New Guides to the Learning Center Listing

## Current State

All 5 guide pages are **already fully implemented**:
- Guide configs with editorial content, FAQs, filters, and SEO metadata exist in `guideConfigs.ts`
- Routing works via `/guides/:slug` (wildcard route in App.tsx)
- Sitemap includes all 5 slugs
- `BuyingGuideTemplate` renders Article + FAQ + Breadcrumb schemas automatically

## What's Missing

The 5 new guides are **not listed in the `GUIDES` array** in `src/pages/LearningCenter.tsx`, so they don't appear on the `/learn` page for users to discover.

## Changes Required

### File: `src/pages/LearningCenter.tsx`

Add 5 entries to the `GUIDES` array (after the existing `hueforge-filaments` entry, around line 100):

1. **best-filaments-for-hueforge-lithophanes** -- "Best Filaments for HueForge Lithophanes", buying-guide, 14 min, 2026-02-14
2. **pla-plus-vs-pla-pro** -- "PLA+ vs PLA Pro: Which Should You Choose?", buying-guide, 10 min, 2026-02-14
3. **best-filament-for-bambu-lab-p1s** -- "Best Filaments for Bambu Lab P1S", buying-guide, 13 min, 2026-02-14
4. **silk-pla-comparison** -- "Best Silk PLA Filaments Compared", buying-guide, 11 min, 2026-02-14
5. **asa-vs-abs-outdoor-printing** -- "ASA vs ABS: Which is Better for Outdoor Printing?", buying-guide, 12 min, 2026-02-14

All entries will have `isBuyingGuide: true` so they link to `/guides/:slug`.

No other files need changes -- the guide content, routing, SEO schemas, and sitemap are already in place.
