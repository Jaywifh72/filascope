

# Enhanced Filter Pills + Grid Break Moment Cards

## Overview

Three additions to the Finder page: (A) enhanced QuickFilterPills with counts and better active states, (B) contextual "break moment" cards inserted every 8th position in the filament grid, and (C) a circular scroll-progress indicator replacing the existing ScrollToTopButton.

---

## Part A -- Enhanced QuickFilterPills

**File: `src/components/QuickFilterPills.tsx`**

### Changes

1. **Add counts prop**: Accept an optional `counts` record (`Record<string, number>`) from the parent. Display count inside each pill as `(N)` in `text-cyan-400 font-medium text-xs`. If no count available, omit.

2. **Active state upgrade**:
   - Active pill: `bg-cyan-500/20 border-cyan-500/50 text-cyan-300 ring-2 ring-cyan-500/20 scale-100`
   - Inactive pills when one is active: add `opacity-70` class
   - On click: brief CSS `transition-transform duration-150` (the scale is handled by the browser transition, no JS animation needed)

3. **Mobile scroll fade**: Add two gradient overlays (`absolute left-0 / right-0 w-12 h-full pointer-events-none`) using `from-background to-transparent` and vice versa. Add `scroll-snap-type: x mandatory` on container, `scroll-snap-align: center` on each pill.

4. **Results count animation**: Accept an optional `filteredCount` prop. When `activeFilter` changes to non-null, show a brief `"Showing N filaments"` line below the pills that fades in and auto-hides after 2 seconds. The number animates from 0 using a `requestAnimationFrame` countUp over 600ms.

### Parent integration (`src/pages/Finder.tsx`)

Pass `filteredCount={totalCount}` to `QuickFilterPills`. For per-pill counts, compute approximate counts from `filterCounts` or pass `unfilteredProductCount` as a rough indicator. No new API calls.

---

## Part B -- Grid Break Moment Cards

### New file: `src/components/GridBreakCard.tsx`

A single component that renders one of 5 card types based on a `type` prop.

**Props**:
```text
interface GridBreakCardProps {
  type: 'tip' | 'compare' | 'printer' | 'deal' | 'hueforge';
  onAction?: () => void;       // CTA click handler
  dealData?: { name: string; discount: number; pricePerKg: string; slug: string };
  onDismiss?: (type: string) => void;
}
```

**Shared styling**: Same height as product cards (auto via grid), `rounded-xl border p-5 flex flex-col justify-between`. Each type gets a unique gradient + border color as specified. Small X button in top-right calls `onDismiss` which saves to `localStorage` key `dismissed-break-{type}`.

**Entrance animation**: Use IntersectionObserver to add `animate-fade-in` class when the card scrolls into view. The card starts with `opacity-0 translate-y-2` and transitions in.

**Mobile**: `col-span-2` (full width of 2-col grid) with a horizontal layout (flex-row instead of flex-col), reduced padding.

### Card types

| Type | Gradient | Title | Body | CTA |
|------|----------|-------|------|-----|
| tip | cyan-950 to gray-900, border-cyan-800/30 | "Quick Tip" | Rotating tips array (picks based on index) | "Browse [Material] Filaments" |
| compare | amber-950 to gray-900, border-amber-800/30 | "Compare Challenge" | "Which is stronger -- PETG or ABS?" | "Start Comparing" |
| printer | emerald-950 to gray-900, border-emerald-800/30 | "Set Your Printer" | "See only compatible filaments" | "Set My Printer" |
| deal | red-950 to gray-900, border-red-800/30 | "Deal Spotlight" | Dynamic: biggest discount from props | "View Deal" |
| hueforge | purple-950 to gray-900, border-purple-800/30 | "HueForge Artists" | "500+ verified TD values" | "Search TD Values" |

### Integration in `src/pages/Finder.tsx`

In the grid rendering loop (line 1670-1710), insert break cards after every 8th product card:

```text
{displayedGroups.map((group, index) => (
  <React.Fragment key={filament.id}>
    {/* Insert break card after every 8th item */}
    {index > 0 && index % 8 === 0 && !isDismissed(breakType) && (
      <GridBreakCard type={getBreakType(index)} ... />
    )}
    <LabReadoutCard ... />
  </React.Fragment>
))}
```

**Rotation logic** (helper function):
- Position 8: `printer` type if no printer selected, else `tip`
- Position 16: `compare`
- Position 24: `deal`
- Position 32: `hueforge`
- Position 40+: cycle through `tip` variants

**Deal data**: Use existing `useTopDeals` hook or pass the top deal from existing data if available. If no deal data, skip the deal card and show a tip instead.

---

## Part C -- Scroll Progress Ring

**File: `src/components/ScrollToTopButton.tsx`**

Enhance the existing button with a circular SVG progress ring:

- Add scroll progress tracking: calculate `scrollProgress` as percentage of `#filament-grid` scrolled through (grid top to grid bottom relative to viewport)
- Render an SVG circle (r=16, cx=20, cy=20) behind the arrow icon with `stroke-dasharray` and `stroke-dashoffset` based on progress
- Stroke color: `stroke-cyan-500/60`
- Background circle: `stroke-gray-700/40`
- Keep all existing show/hide logic and compare tray offset

---

## Files Summary

| Action | File |
|--------|------|
| MODIFY | `src/components/QuickFilterPills.tsx` -- counts, active states, scroll fade, results animation |
| CREATE | `src/components/GridBreakCard.tsx` -- break moment card component |
| MODIFY | `src/pages/Finder.tsx` -- pass counts to pills, insert break cards in grid loop |
| MODIFY | `src/components/ScrollToTopButton.tsx` -- add SVG progress ring |

No SEO elements, JSON-LD, meta tags, FAQ sections, or content blocks are modified.

