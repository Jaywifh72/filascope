

# Filament Product Card Redesign

## Overview
Five coordinated changes to the FilamentCard component addressing color accuracy, TD visibility, timestamp noise, out-of-stock clarity, and compare link usability.

## Changes

### 1. Color Swatch Fix (Lines 520-560)
**Problem**: The 28px color dot in the brand row uses `filament.color_hex` directly, which defaults to `#0000FF` for many products.

**Fix**:
- Add a `getReliableColorHex` helper that picks the first non-default hex from `effectiveVariantIndicators.colors` (skipping `#0000ff`, `#000000`, `#ffffff` defaults), then falls back to `filament.color_hex`, then returns `null`.
- Replace the current 28px rounded-lg swatch with a pill shape: `w-12 h-5 rounded` (48x20px, 4px border-radius).
- Inside the pill, if a color name can be derived (from the product title or a simple hex-to-name map), render it in 9px text with contrast-appropriate color (white on dark backgrounds, dark on light backgrounds using a luminance check).
- Remove the old `+N` variant count text below the swatch (it's already shown in the color swatches row below).

### 2. TD Value Badge (New, image area overlay)
**Problem**: TD badge currently lives in the badges row (line 698-710) -- not prominent enough.

**Fix**:
- Add a new absolutely-positioned badge in the top-left of the card (inside the main card div, before the brand row).
- Style: `absolute top-3 left-3 z-10 bg-black/65 text-white text-[10px] font-semibold px-2 py-0.5 rounded`
- Content: `TD {value}` (e.g. "TD 4.8")
- Only rendered when `filament.transmission_distance != null`.
- Keep the existing TD badge in the badges row as well for information density.

### 3. Timestamp Treatment (Lines 1007-1015 and 819-835)
**Problem**: "Checked Xd ago" text is always visible, adding noise.

**Fix**:
- Remove the always-visible reframed freshness text block (lines 1007-1015).
- Replace the existing mini confidence badge (lines 820-835) with a freshness dot: a small colored circle (`w-2 h-2 rounded-full`) using the existing `getFreshnessDotColor` helper (green for high, amber for medium, red for stale).
- The dot is always visible next to the price. Wrap it in a Tooltip showing "Price updated [timeAgo]" on hover.
- On card hover (`isHovered` state already tracked), show a small inline text next to the dot: the compact time ago label (e.g. "3d"). At rest, only the dot is visible.

### 4. Out of Stock Treatment (Lines 448-453, 1025-1045)
**Problem**: Current OOS overlay is a translucent bar across the top -- not prominent enough. CTA still says "View Prices".

**Fix**:
- **(a) Grayscale image**: The card doesn't have a separate product image area (it's text-based with a color swatch). Apply `filter: grayscale(0.6)` to the color swatch and variant color dots when `isOutOfStock` is true.
- **(b) OOS badge**: Replace the current top overlay (lines 448-453) with a centered pill overlaid on the brand/title area: `absolute top-1/3 left-1/2 -translate-x-1/2 z-10`, background `#1a1a1a`, white text, 11px uppercase font, rounded-full padding.
- **(c) CTA**: Already handled -- `ctaText` is "Check Availability" when OOS (line 418). The button variant is already `"outline"` for OOS (line 1027). Update the OOS button styling to use `variant="ghost"` with muted border instead of the current slate-700 background.

### 5. Compare Link Elevation (Lines 1046-1068)
**Problem**: Compare is a small icon button next to the CTA -- hard to discover on mobile.

**Fix**:
- Move the compare action from the CTA row to the badges row (Element 2, line 670).
- Render it as a small ghost button: `border border-current px-2 py-0.5 rounded text-[11px] min-h-[28px] inline-flex items-center gap-1`.
- Position it after the material badge using a flex layout.
- Label: "Compare" with the Columns icon.
- Remove the old compare button from the CTA row (lines 1046-1068) and the floating corner button (lines 1104-1120) to avoid triple-rendering compare.
- Keep the top-right checkbox for quick multi-select -- that serves a different UX pattern.

## Technical Details

### Luminance helper for swatch text contrast
```typescript
function getContrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}
```

### Reliable color hex resolution
```typescript
const DEFAULT_HEXES = new Set(['#0000ff', '#000000', '#ffffff']);

function getReliableColorHex(
  filamentHex: string | null | undefined,
  variantColors: string[]
): string | null {
  // Try first non-default variant color
  for (const hex of variantColors) {
    const normalized = normalizeColorHex(hex).toLowerCase();
    if (!DEFAULT_HEXES.has(normalized)) return normalized;
  }
  // Fall back to filament hex if non-default
  if (filamentHex) {
    const normalized = normalizeColorHex(filamentHex).toLowerCase();
    if (!DEFAULT_HEXES.has(normalized)) return normalized;
  }
  return filamentHex ? normalizeColorHex(filamentHex) : null;
}
```

### Hover-only timestamp
```typescript
{/* Freshness dot - always visible */}
<Tooltip>
  <TooltipTrigger asChild>
    <span className={cn("w-2 h-2 rounded-full inline-block", getFreshnessDotColor(priceConfidence))} />
  </TooltipTrigger>
  <TooltipContent>Price updated {timeAgo || 'unknown'}</TooltipContent>
</Tooltip>
{/* Compact label - hover only */}
{isHovered && compactTimeAgo && (
  <span className="text-[10px] text-muted-foreground animate-in fade-in-0 duration-150">
    {compactTimeAgo}
  </span>
)}
```

## Files Modified
- `src/components/FilamentCard.tsx` -- all 5 changes in a single file

## What Does NOT Change
- FilamentCardSkeleton layout
- Compare hook logic
- Price resolution logic
- Affiliate link handling
- Any other card variants (MiniFilamentCard, CompactFilamentCard, GuideProductCard)

