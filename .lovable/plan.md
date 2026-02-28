

## Add "How to Dry Filament" Guide

### Overview
Add a new guide at `/guides/how-to-dry-filament` using the existing config-driven pattern. Only one file needs editing -- the `how-to` category and all template features (quickAnswer, howTo schema, HTML tables) are already supported.

### Changes

#### 1. `src/components/guides/guideConfigs.ts`

Add `'how-to-dry-filament'` entry to `BUYING_GUIDE_CONFIGS` with:
- **slug**: `how-to-dry-filament`
- **title**: `How to Dry 3D Printer Filament — Complete Temperature & Time Guide`
- **seoTitle/seoDescription**: As specified
- **category**: `'how-to'` (already supported, renders "How-To Guide" badge)
- **readTime**: 8
- **publishedAt/updatedAt**: `'2026-02-28'`
- **layout**: `'editorial'`
- **filters**: `{ sortBy: 'score', limit: 5 }`
- **quickAnswer**: The provided paragraph about drying temperatures
- **howTo**: 6 steps (Remove from packaging, Set temperature, Place spool, Dry for time, Test print, Store immediately)

**Editorial sections** (all `position: 'before'`):
1. **"Filament Drying Temperature and Time Chart"** -- HTML table: Material, Drying Temp (C), Drying Time (hours), Glass Transition Temp (C), Notes. Rows for PLA, PETG, ABS, Nylon, TPU, ASA, PVA
2. **"Drying Methods Compared"** -- Filament dryer vs food dehydrator vs oven, with pros/cons
3. **"Step-by-Step: How to Dry Filament"** -- Detailed walkthrough matching the HowTo schema steps
4. **"How to Know When Filament Is Dry"** -- Test print indicators, visual/audible signs

**FAQs**: All 5 specified questions/answers

**Related Questions (People Also Ask)**: 3 entries (e.g., "Does wet filament ruin prints permanently?", "Can I microwave filament to dry it?", "What is the best budget filament dryer?")

**relatedSlugs**: `['how-to-store-filament', 'how-to-choose-filament', 'strongest-3d-printer-filament', 'best-pla-filaments']`

### Automatic behavior (no changes needed)
- Route: Handled by `/guides/:slug` catch-all
- Sitemap: Dynamic from config keys
- JSON-LD: Article, FAQPage, HowTo, and BreadcrumbList all rendered automatically
- Badge styling: `how-to` category already configured
- Quick Answer block: Already rendered from `quickAnswer` field

### Files modified
- `src/components/guides/guideConfigs.ts` (new config entry only)

