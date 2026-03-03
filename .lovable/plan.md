

# Homepage Section Reordering: Products Above the Fold

## Goal
Reduce scroll distance from hero to first product card by moving SEO/marketing content below the catalog and eliminating redundant sections.

## New Section Order

### ZONE 1 -- ORIENT (Hero, compact)
Keep `HeroSection` but modify it:
- **Remove** the 5 Quick Action cards grid (the `quickStartPaths` array and its rendering block)
- **Remove** the `HeroProductGrid` brand logos from the right column (remove the entire right column, making the hero single-column and more compact)
- Keep: H1, stats line, search bar, "New here? Filament Quiz" link

**File: `src/components/HeroSection.tsx`**
- Delete `quickStartPaths` array and the grid rendering (lines ~139-368)
- Delete the right-column `HeroProductGrid` div (lines ~372-377)
- Remove the `lg:grid-cols-2` layout, make it single-column centered
- Remove `HeroProductGrid` import
- Reduce bottom padding (`pb-1` stays minimal)

### ZONE 2 -- DISCOVER (compact, immediately after hero)
**File: `src/pages/Finder.tsx`**

Reorder sections after HeroSection to:
1. `TrendingSection` -- move from line 1107 to immediately after HeroSection (line ~1089)
2. **New "Quick Paths" row** -- replace the full `DiscoveryZone` component with a single row of compact pill/chip links combining the DiscoveryZone categories and comparison links

**Create: `src/components/QuickPathsPills.tsx`**
A simple horizontal scroll row of pill links combining:
- "Best for Beginners", "HueForge Ready", "Engineering Grade", "Under $20/kg" (from DiscoveryZone QUICK_PICKS -- as filter-applying buttons)
- "PLA vs PETG", "Best PETG under $25", "Silk PLA" (from DiscoveryZone COMPARISONS)

Styling: `inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 transition-all`

### ZONE 3 -- BROWSE (catalog)
- **Remove** the "Explore the Filament Catalog" heading + subtext (lines 1119-1127)
- Keep HueForge TD banner, ResultsHeader, filters, product grid, pagination -- all unchanged

### ZONE 4 -- SEO + TRUST (below catalog, before footer)
Move these sections from their current positions to after the pagination/empty state, before `HomeSEOContent`:
- "What is FilaScope?" explainer (currently lines 1091-1099)
- `WhyFilaScope` value props (currently line 1104) -- change "Start Exploring" button to "Back to Top"
- `HeroProductGrid` brand logos as a trust signal section

Current SEO content already at bottom stays: `HomeSEOContent`, `HomeFAQSection`

## Files Changed

| File | Action |
|------|--------|
| `src/components/HeroSection.tsx` | Remove Quick Action cards, remove HeroProductGrid right column, simplify to single-column |
| `src/components/QuickPathsPills.tsx` | **New** -- compact pill row combining DiscoveryZone + comparison links |
| `src/pages/Finder.tsx` | Reorder sections: Hero -> Trending -> QuickPaths -> HueForge banner -> Catalog. Move WhyFilaScope + "What is FilaScope?" to below catalog. Remove "Explore the Filament Catalog" heading. Remove DiscoveryZone import. |
| `src/components/WhyFilaScope.tsx` | Change "Start Exploring" button text to "Back to Top" with scroll-to-top behavior |

## Sections Removed
- 5 Quick Action cards (redundant with nav + search)
- "Explore the Filament Catalog" transition heading (redundant)

## Sections Preserved (repositioned)
- "What is FilaScope?" -- moved below catalog
- WhyFilaScope 3-column value props -- moved below catalog
- Brand logos -- moved below catalog as trust signal
- DiscoveryZone content -- condensed into QuickPathsPills
- Rotating tip banner -- removed (low value, adds height)

## Estimated Scroll Reduction
Current: ~1.7 screens to first product card
Target: ~0.7 screens (hero ~400px + trending ~200px + pills ~50px + filter bar ~100px = ~750px before first card)
