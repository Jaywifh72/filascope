

## FilamentCard Visual Redesign

This is a comprehensive restructuring of the FilamentCard component to improve visual hierarchy, scannability, and interactivity. The card retains all existing data points but reorganizes them into a cleaner layout.

### Changes Overview

**File: `src/components/FilamentCard.tsx`** (primary, ~854 lines — significant restructuring)
**File: `src/components/FilamentCardSkeleton.tsx`** (update skeleton to match new layout)

---

### 1. Card Container — Hover State (Issue #1)

Current: `hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50`

Replace with a non-scaling hover that uses border glow + lift:
```
hover:border-cyan-500/30 hover:shadow-[0_8px_24px_rgba(0,207,232,0.12)] hover:-translate-y-0.5
transition-all duration-200 ease-out
```
Remove `hover:scale-[1.02]` — scaling causes layout shift in grids.

---

### 2. Card Layout Reorder — New Visual Hierarchy

Current order: Brand+Name -> Rating -> Community Rating -> Price -> Badges -> CTA

New order:
```
[1] Brand row (logo + name) — compact, top
[2] Product image area (new section, currently missing from card!)
    - Note: Current card has NO image section. The image was removed at some point.
    - We will NOT add an image section since the card never had one in this layout.
    - Instead, position the color swatch more prominently in the brand row.
[3] Product Name — left-aligned, line-clamp-2
[4] Badges row: Material pill + TD badge (when available) + one standout feature
[5] Price block — prominent, own section
[6] Meta row: FilaScore badge + Freshness dot + Compare pill
[7] CTA Button — bottom-anchored
```

---

### 3. TD Badge Visibility (Issue #3)

Currently the TD badge exists (lines 787-793) but is buried in Element 4 among other badges. Move it to sit directly after the material pill in the badges row, giving it priority placement. Keep the amber/gold styling (`bg-amber-500/15 border-amber-500/30 text-amber-400`) with Lightbulb icon.

No code change needed for styling — just ensure it renders second after material in the badge row (before standout features).

---

### 4. Color Swatch Size (Issue #4)

Current: `w-4 h-4` (16px) for both variant swatches and single color dot.

Change to `w-5 h-5` (20px) with `ring-2 ring-white/20` for better visibility. This applies to:
- Line 459: variant color swatches in the HoverCard trigger
- Line 517: single color dot

---

### 5. Product Name Truncation (Issue #5)

Current: `line-clamp-2` on the h3.

Change to `line-clamp-3` to allow more of the product name to show. This trades ~20px vertical space for critical product differentiation. The `min-h-[420px]` card height accommodates this.

---

### 6. Out-of-Stock Visual Treatment (Issue #6)

Current: Only `opacity-70` on the entire card container.

Enhanced treatment:
- Card container: keep `opacity-70` but add `grayscale-[30%]`
- CTA button: switch from filled primary to `variant="outline"` with muted text — change the button class to `bg-transparent border-border text-muted-foreground hover:bg-muted/50` and label to "View Details"
- Out of Stock badge (line 376): keep current position/styling (top-left pill, `bg-red-900/80`)

---

### 7. CTA Button Differentiation (Issue #7)

Current: Same filled primary button for all states.

- In-stock + has price: Keep filled primary `bg-primary` with "View Details" + arrow
- In-stock + no price: Change label to "Check Price" (already partially done at line 845)
- Out-of-stock: Switch to outline variant: `variant="outline"` className `border-border text-muted-foreground`

---

### 8. FilaScore Display (Issue #8)

Current: Star icon + "8.2" + "/10" in a rounded-lg badge with HoverCard.

Replace the star + text with a compact rounded-full pill badge:
```tsx
<div className="bg-primary/10 text-primary text-sm font-semibold px-2.5 py-0.5 rounded-full">
  8.2
</div>
```
Keep the HoverCard wrapping for the score breakdown tooltip. Remove the Star icon, "/10" suffix, and Info icon from the inline display — they move into the hover card only. This makes the score scannable at a glance.

For "Unrated" products, show a muted pill: `bg-muted/60 text-muted-foreground text-xs px-2 py-0.5 rounded-full` with just "—".

---

### 9. Price Display Cleanup (Issue #2)

Current: Price, budget badge, intl indicator, local price, freshness, and local badge all stacked in Element 3.

Simplify:
- Price line: `<span className="text-lg font-bold text-primary">$18.99</span><span className="text-xs text-muted-foreground">/kg</span>` — use `text-primary` (cyan) instead of `text-foreground`
- Move freshness indicator to the meta row (Element 6) as a compact dot+label
- Keep local price secondary line as-is
- Remove the standalone "Local" badge pills — they're redundant with the seller info context

---

### 10. Meta Row — New Element 6

Add a new compact row between badges and CTA that combines:
- FilaScore pill (from redesigned Element 2)
- Freshness dot (moved from price section)
- Compare pill button: small ghost pill `text-[10px] px-2 py-0.5 rounded-full border border-border/50 hover:border-primary/50` showing "Compare" — clicking triggers the same `handleCompareToggle` logic

This consolidates scattered small elements into one scannable row.

---

### 11. Skeleton Update

Update `FilamentCardSkeleton.tsx` to match the new layout order:
- Brand row skeleton
- Name skeleton (3 lines instead of 2)
- Badge row skeleton (2 small pills)
- Price skeleton
- Meta row skeleton (small pill + dot)
- CTA button skeleton

---

### Summary of element order in redesigned card

```text
+----------------------------------+
| [checkbox]              top-right |
| [OOS badge]             top-left  |
|                                   |
| [BrandLogo] VENDOR  [swatches]   |
|                                   |
| Product Name Line 1               |
| Product Name Line 2               |
| Product Name Line 3 (if needed)   |
|                                   |
| [PLA] [TD 4.2] [High Speed]      |
|                                   |
| $18.99/kg                         |
| Local: $21.50/kg                  |
|                                   |
| [8.2] [*24d] [Compare]           |
|                                   |
| [ View Details           -> ]     |
+----------------------------------+
```

### Constraints respected
- Uses existing Shadcn Card, Badge, Button, Checkbox, Tooltip primitives
- Grid stays 4-col desktop / 2 tablet / 1 mobile (no grid changes)
- `min-h-[420px]` with flex-col + flex-grow maintained
- All data points preserved, just reorganized
- `loading="lazy"` on any images preserved
- Animations 150-200ms with ease-out

