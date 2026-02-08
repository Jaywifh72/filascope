
# Find by Color -- Visual Color Search Feature

## Overview

Add a dedicated `/colors` page with an interactive HSL color picker, hex code input, popular color shortcuts, and live-filtered filament results sorted by color proximity. Integrate this into the homepage, existing sidebar filters, and product detail pages.

## Current Infrastructure

The codebase already has substantial color matching infrastructure:
- **`colorMatchUtils.ts`**: Redmean color distance, `getColorMatchPercent`, `hslToHex`, `hexToRgb` utilities
- **`colorIntelligence.ts`**: 230+ color names mapped to hex codes, `extractColorFromText`, `getColorSuggestions`, `getColorFamily`
- **`COLOR_FAMILIES`** (16 families): Used in `MoreFiltersModal` color grid and `Finder.tsx` filtering
- **Database**: 8,063 filaments with `color_hex` values, 1,402 unique colors
- **Existing filter flow**: `Finder.tsx` already supports `hexSearch` + `colorTolerance` URL params and filters by color distance
- **HueForge page**: `/hueforge` already queries filaments with TD values

## Implementation Plan

### 1. New Page: `/colors` -- Find by Color

**File: `src/pages/ColorFinder.tsx`**

The main dedicated page with three zones:

**Zone A -- Color Picker (top)**
- An HSL spectrum canvas (not a library -- pure canvas with mouse/touch tracking)
- Horizontal hue bar (0-360 degrees) + square saturation/lightness area
- Live preview circle showing the selected color
- Hex code display: "Selected: #FF5733" with copy button
- Manual hex input field: "Enter hex code: #______" with validation using existing `isValidHexColor`
- When user moves cursor on the canvas, convert position to HSL, then use existing `hslToHex` to get the hex code

**Zone B -- Popular Color Shortcuts (below picker)**
- Grid of 16 color family buttons reusing `COLOR_FAMILIES` from `colorMatchUtils.ts`
- Clicking one sets the hex to that family's representative color
- Additional row of "trending" colors pulled from the database (most common `color_hex` values)

**Zone C -- Results (below shortcuts)**
- Query filaments from Supabase: `select id, product_title, vendor, material, color_hex, color_family, variant_price, net_weight_g, featured_image, product_handle, transmission_distance, pack_quantity, price_cad, price_eur, price_gbp, price_aud, price_jpy`
- Client-side sort by `colorDistance` (existing utility) from the selected hex
- Each result card shows:
  - Color swatch (the filament's actual `color_hex`)
  - Match percentage badge using existing `getColorMatchPercent`
  - Product name, brand, material type badge (reuse `MaterialBadge`)
  - Regional price (reuse `useCurrency` hook)
  - TD value badge if available (reuse existing TD badge pattern)
- Filter controls on the results: material type dropdown, brand dropdown, price range slider
- Sort options: "Best Color Match" (default), "Lowest Price", "Highest Rated"
- Limit display to top 50 matches (with "Load More")
- URL state: `?hex=FF5733&tolerance=30&material=PLA` for shareability

### 2. Color Picker Canvas Component

**File: `src/components/color-finder/ColorPickerCanvas.tsx`**

A reusable HSL color picker built with HTML Canvas:
- Hue strip (horizontal bar, 360px wide): renders all hues at full saturation
- Saturation-Lightness square (below hue strip): given the selected hue, renders the full S/L range
- Mouse/touch events update the selected color in real-time
- Debounced output (50ms) to avoid excessive re-renders during drag
- Mobile-friendly: touch events with `touch-action: none` to prevent scroll interference
- Converts canvas position to HSL values, then uses `hslToHex` from `colorMatchUtils.ts`

### 3. Color Result Card Component

**File: `src/components/color-finder/ColorResultCard.tsx`**

Compact card for color search results:
- Large color swatch (left side, 48x48px rounded)
- Product info (right side): title, vendor, material badge
- Match percentage badge: "98% match" with color-coded background (green >90%, yellow >70%, orange >50%)
- Regional price using `useCurrency`
- TD badge if `transmission_distance` is not null (gold Lightbulb icon pattern)
- Click navigates to `/filaments/[product_handle]`

### 4. HueForge Color Stack Builder

**File: `src/components/color-finder/HueForgeStackBuilder.tsx`**

A mode toggle on the `/colors` page:
- "Single Color" mode (default) vs "HueForge Stack" mode
- In stack mode, user can select 4-5 color slots
- Each slot has its own color picker (simplified -- just a hex input + popular colors)
- For each slot, shows the top 5 matching filaments that have TD values
- Each result displays the TD value prominently
- Summary panel shows the complete stack with all selected filaments and their TD values
- "Copy Stack" button formats the selection as text for sharing

### 5. Homepage Integration

**File: `src/components/HeroSection.tsx`**

Add a 5th quick start card to the hero section grid:
- Title: "Find by Color"
- Icon: `Palette` from lucide-react
- Description: "Match any color to real filaments"
- Link: `/colors`
- Color theme: pink/magenta (`border-pink-500/30`, etc.)
- Update grid from `grid-cols-2 sm:grid-cols-4` to `grid-cols-2 sm:grid-cols-5` (5 cards fit well at the sm breakpoint)

### 6. Sidebar Color Swatch Filter Enhancement

**File: `src/components/TechnicalConsoleSidebar.tsx`**

The existing sidebar already handles material/brand/spool filters. Add a collapsible "Color" section:
- Show the 16 `COLOR_FAMILIES` as clickable swatches (same pattern as `MoreFiltersModal`)
- A "Custom Color" link that opens a popover with hex input
- When a color is selected, set `hexSearch` URL param and redirect to the Finder with the filter active
- This connects to the existing `hexSearch` + `colorTolerance` filtering logic in `Finder.tsx`

### 7. Product Detail Page -- "Find Similar Colors" Link

**File: `src/components/filament/hero/LargeColorSwatchGrid.tsx`**

Add a small "Find similar colors from other brands" link below the color swatch grid:
- Links to `/colors?hex=[current_color_hex]`
- Only shows when the filament has a valid `color_hex`
- Uses the existing `Palette` icon + text link pattern

### 8. Route Registration

**File: `src/App.tsx`**

- Add: `<Route path="/colors" element={<ColorFinder />} />`
- Lazy-load the page for bundle size optimization

## Technical Details

### Color Distance Algorithm

The existing `colorDistance` in `colorMatchUtils.ts` uses the **Redmean** formula, which is a good perceptual approximation. The plan references CIEDE2000, but Redmean is already implemented and performs well for the use case. Upgrading to CIEDE2000 would require LAB color space conversion and is significantly more complex -- the existing Redmean approach provides sufficient perceptual accuracy for filament color matching and avoids adding a dependency or 100+ lines of color science code.

### Data Query Strategy

Rather than creating a new Supabase RPC, the page will fetch filaments with `color_hex IS NOT NULL` (8,063 rows) and perform color distance calculations client-side. This is fast because:
- The data is already cached via React Query from the Finder page
- Color distance is a simple arithmetic operation (sub-millisecond per filament)
- Sorting 8,000 items by distance takes <10ms in JS

The query will select only the columns needed for display (no TDS data, no full specs) to keep payload small.

### URL State for Shareability

The page will use `useSearchParams` to sync:
- `hex` -- the selected color (6-char hex, no #)
- `tolerance` -- color distance tolerance (default 30)
- `material` -- optional material filter
- `brand` -- optional brand filter
- `mode` -- "single" or "hueforge"
- `stack` -- comma-separated hex codes for HueForge mode

This enables shareable URLs like `/colors?hex=FF5733&material=PLA`.

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/ColorFinder.tsx` | Create | Main Find by Color page |
| `src/components/color-finder/ColorPickerCanvas.tsx` | Create | HSL canvas color picker |
| `src/components/color-finder/ColorResultCard.tsx` | Create | Compact result card with match % |
| `src/components/color-finder/PopularColors.tsx` | Create | Popular color shortcuts grid |
| `src/components/color-finder/ColorFinderResults.tsx` | Create | Results list with filters and sorting |
| `src/components/color-finder/HueForgeStackBuilder.tsx` | Create | Multi-color stack builder for HueForge |
| `src/components/HeroSection.tsx` | Edit | Add 5th "Find by Color" quick start card |
| `src/components/TechnicalConsoleSidebar.tsx` | Edit | Add color swatch section to sidebar |
| `src/components/filament/hero/LargeColorSwatchGrid.tsx` | Edit | Add "Find similar colors" link |
| `src/App.tsx` | Edit | Register `/colors` route |

No database changes required -- all data already exists in the `filaments` table.
