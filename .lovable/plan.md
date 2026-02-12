

# Filament Card Redesign for Better Conversion

## Overview
A targeted redesign of `FilamentCard.tsx` to improve conversion, engagement, and trust. The card currently has 5 visual sections (brand row, badges, price, meta/score, CTA). We'll restructure these while keeping card dimensions and the dark theme intact.

## Data Availability Analysis

Before designing, here's what data the card already has access to:

| Data Point | Available? | Source |
|---|---|---|
| Color hex swatch | Yes | `filament.color_hex` |
| Brand logo | Yes | `getBrandLogo()` |
| Product name | Yes | `filament.product_title` |
| Price per kg | Yes | `useResolvedPrice()` |
| Nozzle temp range | Yes | `filament.nozzle_temp_min_c / max_c` |
| TD (HueForge) | Yes | `filament.transmission_distance` |
| Material type | Yes | `filament.material` |
| FilaScore | Yes | `calculateUnifiedScore()` |
| Store/retailer name | **No** | Only `product_url` exists on card data; retailer names are in the listings system |
| Community rating | Yes (optional) | `communityRating` prop |
| Compare state | Yes | `useCompare()` hook |

**Key finding**: The "store name" (e.g., "at Eryone") is NOT available at the card level. The filament `vendor` is the brand (e.g., "Bambu Lab"), not the retailer. Retailer data lives in `filament_listings` table, queried per-filament on the detail page. Adding per-card retailer queries for hundreds of cards would be expensive. Instead, the "store" link will show a domain extracted from `product_url` (e.g., "eryone.com") or omit it if unavailable.

## Changes by Section

### 1. Brand Logo (Smaller) + Color Swatch Next to Name
- Shrink brand logo from current size to `h-6` max
- Keep existing color swatch system (already w-5 h-5 circles) but ensure a single swatch appears next to product name when `color_hex` exists and there are no multi-variant swatches
- Add tooltip on single color swatch showing hex value

### 2. Product Name
- Already has `line-clamp-3`; add `title` attribute for full name on hover (tooltip for truncated names)

### 3. Price Row (Visual Anchor)
- Make price `text-lg font-bold text-white` (currently `text-primary` which is cyan -- keep cyan as it's the brand color but make it more prominent)
- Add "From" prefix text when price varies (grouped products)
- Add `/kg` unit in `text-xs text-slate-500`
- Below price, show store domain extracted from `product_url` as a small cyan link: "at eryone.com" in `text-cyan-400 text-xs hover:underline`. This opens the product URL. Falls back to nothing if no URL.

### 4. Specs Row (Compact)
- Add nozzle temp display as a compact icon+value pair: thermometer icon + "190-220C" in `text-xs text-slate-400`
- TD badge is already present and well-styled (purple); keep it

### 5. Rating Fix
- The "10.0" scores showing are FilaScore values, not user ratings. The scoring algorithm (`calculateUnifiedScore`) produces these. Rather than hiding them entirely, we'll add logic: if more than 80% of visible cards have the same score (within 0.5), dim the score display and add a "preliminary" label. This maintains data transparency without undermining trust.
- Community ratings (star icon) already only show when `reviewCount > 0`, which is correct.

### 6. Bottom CTA: Two-Button Layout
- Replace single "View Details" button with a split layout:
  - **Primary** (left, flex-1): "View Prices" with arrow icon, linking to `/filament/{id}?tab=pricing`. Uses `bg-cyan-500 hover:bg-cyan-400 text-black` styling.
  - **Secondary** (right, w-10): Compare toggle icon button with `Columns` icon. Border style: `border border-slate-600 hover:border-cyan-500`. When active: `bg-cyan-500/20` with cyan icon.
- This replaces BOTH the current bottom CTA and the "Compare" pill in the meta row (removes duplication).
- The top-right checkbox compare toggle remains for discoverability.

### 7. Hover State
- Add `hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/5` (partially exists already as `hover:-translate-y-1 hover:shadow-cyan-500/10`)
- Replace translate with scale for smoother feel
- Primary button brightens on card hover (already implemented with `group-hover:bg-cyan-500`)
- Compare icon opacity: 60% default, 100% on hover (via `group-hover:opacity-100`)

## Files to Modify

1. **`src/components/FilamentCard.tsx`** -- Main changes:
   - Restructure sections 1-5 as described
   - Add store domain extraction utility
   - Modify CTA section to two-button layout
   - Adjust hover classes
   - Remove redundant "Compare" pill from meta row
   - Add nozzle temp compact display

2. **`src/components/LabReadoutCard.tsx`** -- Table/list view parity:
   - Verify CTA text matches ("View Prices" vs "View Details")
   - Ensure compare toggle is accessible in list view

3. **`src/components/FilamentCardSkeleton.tsx`** -- Update skeleton to match new layout proportions (two-button CTA area)

## Technical Details

### Store Domain Extraction
```text
function extractStoreDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch { return null; }
}
```

### Score Uniformity Detection
Rather than checking all visible cards (which requires cross-card state), simply hide the numeric score when `scoreConfidence` is `'low'` AND `hasLimitedData` is true. This is a simpler proxy that achieves the same trust goal.

### Two-Button CTA Layout
```text
<div className="px-6 py-4 flex gap-2">
  <Button asChild className="flex-1 ...primary styles...">
    <Link to={`/filament/${id}?tab=pricing`}>
      View Prices <ArrowRight />
    </Link>
  </Button>
  <Button onClick={handleCompareToggle} className="w-10 ...secondary styles...">
    <Columns className="w-4 h-4" />
  </Button>
</div>
```
