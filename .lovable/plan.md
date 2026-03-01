

# Discovery Zone Section

## Overview

A new `DiscoveryZone` component inserted between the Trending Section and the "Explore the Filament Catalog" heading on the Finder page. It provides 3 curated subsections that give users clear entry points into the catalog.

---

## New File: `src/components/DiscoveryZone.tsx`

### Subsection A -- Quick Picks (horizontal scroll)

6 clickable cards in a horizontally scrollable row using the existing `ScrollCarousel` component.

Each card: `min-w-[220px] h-[120px] rounded-xl` with a unique gradient background, icon (20x20, opacity-60), title, subtitle, and a count pill badge.

| Card | Gradient | Action on Click |
|------|----------|-----------------|
| Best for Beginners | warm (amber to orange) | `resetFilters()`, set materials to PLA+PETG, sort by FilaScore desc |
| HueForge Ready | purple gradient | `resetFilters()`, set `hasTdData: true` |
| Engineering Grade | cool blue-slate | `resetFilters()`, set materials to PC+Nylon+ASA |
| Under $20/kg | green gradient | `resetFilters()`, set `priceRange: [0, 20]` |
| High Speed | red-orange gradient | `resetFilters()`, set `highSpeed: true` |
| Just Added | cyan gradient | `resetFilters()`, set `sortBy: "newest"` |

After applying filters, smooth-scroll to the catalog grid (using a ref or `document.getElementById`).

Count badges will use the existing `unfilteredProductCount` as a rough "N+ filaments" indicator rather than making separate count queries per card.

### Subsection B -- Did You Know? Rotating Fact Strip

A single-line bar (`py-3 bg-gray-800/50 rounded-lg`) with:
- Left: lightbulb emoji in amber
- Center: rotating fact text, crossfade every 8 seconds using `useState` index + `useEffect` interval with `opacity` transition (300ms)
- Right: "Learn more" link pointing to `/guides/how-to-choose-3d-printer-filament`

8 hardcoded facts as specified in the request.

### Subsection C -- Popular Comparisons Quick Links

3-4 pill-shaped links in a centered flex-wrap row. Each links to an existing page:
- "PLA vs PETG" -> `/guides/pla-vs-petg`
- "Bambu Lab vs Polymaker" -> `/brands` (with search pre-filled)
- "Best PETG under $25" -> applies PETG + price filter
- "Silk PLA comparison" -> applies PLA + silk filter

### Container

Full-width section: `bg-gray-900/50 border-y border-gray-800 py-10 px-4`

### Props

```text
interface DiscoveryZoneProps {
  resetFilters: () => void;
  updateFilter: <K>(key: K, value: any) => void;
  catalogRef?: React.RefObject<HTMLElement>;
}
```

---

## Modified File: `src/pages/Finder.tsx`

Insert `<DiscoveryZone>` between line 1100 (`<TrendingSection />`) and line 1103 (spacer). Pass `resetFilters`, `updateFilter`, and a ref to the catalog section for smooth scrolling.

Add an `id="catalog-section"` to the catalog heading div (line 1107) so the Discovery Zone can scroll to it.

No SEO elements, Helmet tags, JSON-LD, FAQ sections, or content blocks are touched.

---

## Files Summary

| Action | File |
|--------|------|
| CREATE | `src/components/DiscoveryZone.tsx` |
| MODIFY | `src/pages/Finder.tsx` (insert component + add catalog id) |

