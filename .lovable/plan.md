

## Filament Product Card Improvements

Three visual improvements to `src/components/FilamentCard.tsx`:

### 1. Card Height Consistency
- Change `min-h-[340px]` to `min-h-[420px]` on the card container
- Add `flex flex-col` to the card container
- Add `flex-grow` to the middle content area (between the brand header and the CTA button) so the "View Details" button is pushed to the bottom consistently across all cards in a row

### 2. OUT OF STOCK Badge Repositioning
- Remove the current full-card overlay (lines 374-381) that centers "Out of Stock" text over the entire card and obscures the product name
- Add a small pill badge in the top-left corner of the card (positioned opposite the compare checkbox in the top-right), using: `absolute top-4 left-4 z-10 bg-red-900/80 text-red-200 text-xs font-mono uppercase px-2 py-0.5 rounded`
- Keep the `opacity-70` on the card container for out-of-stock items

### 3. Color Swatch Size Increase
- Increase variant color swatches from `w-3.5 h-3.5` to `w-4 h-4` (line 461)
- Add `ring-1 ring-white/20` to make swatches visible against dark backgrounds
- Apply the same sizing to the single-color swatch (line 519, already `w-4 h-4` but add the ring)

---

### Technical Details

**File: `src/components/FilamentCard.tsx`**

| Line(s) | Current | Change |
|---------|---------|--------|
| 357 | `min-h-[340px]` | `min-h-[420px] flex flex-col` |
| 374-381 | Full overlay div with centered "Out of Stock" | Small pill badge: `absolute top-4 left-4 z-10` |
| 435 (brand section) | No flex-grow | Remains as-is (fixed header) |
| 829-830 (badges section end) | No flex wrapper | Wrap elements 2-4 in a `flex-grow` div |
| 461 | `w-3.5 h-3.5 rounded-full border shadow-sm` | `w-4 h-4 rounded-full border shadow-sm ring-1 ring-white/20` |
| 519 | `w-4 h-4 rounded-full border-2 border-border shadow-sm` | Add `ring-1 ring-white/20` |

No changes to: brand logo bar, product image area, "View Details" button styling, star rating, price formatting, material badge styling, or hover effects.
