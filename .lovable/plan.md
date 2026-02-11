

## Normalize GroupedDealCard Heights

### Problem
The `GroupedDealCard` component (used on `/deals`) renders at 5 different heights (432-461px) due to optional content sections that conditionally render or not. This creates a jagged grid.

### Approach
Convert the card's internal layout to a flex column structure where the content area grows to fill available space and the CTA buttons are always anchored at the bottom. Reserve minimum heights for optional sections so cards maintain consistent dimensions.

### Changes (single file: `src/components/deals/GroupedDealCard.tsx`)

#### 1. Make Card a flex column
On the `Card` element (line 268), add `flex flex-col` so child elements participate in flex layout.

#### 2. Make CardContent grow and flex
On `CardContent` (line 320), add `flex-1 flex flex-col` so it stretches to fill the card height.

#### 3. Reserve space for color swatches section
Wrap the color swatches block (lines 386-444) in a container that always renders with `min-h-[28px]`. When `hasColors` is false, render an empty spacer `div` with that min-height.

#### 4. Reserve space for variant count text
Wrap the variant count text (lines 447-453) in a container with `min-h-[20px]`. When `showColorCount` is false, render an empty spacer.

#### 5. Push CTA buttons to bottom
Add `mt-auto` to the CTA button container (line 488) so it's always anchored at the card bottom regardless of how much content is above it.

#### 6. Consistent product title height
Add `min-h-[40px]` to the product title `h3` (line 328) to ensure consistent height for 1-line vs 2-line names.

### Technical Details

```text
Card (flex flex-col, h-full)
  +-- Image (fixed h-40)
  +-- CardContent (flex-1, flex flex-col, p-4)
        +-- Vendor text
        +-- Product name (min-h-[40px], line-clamp-2)
        +-- Price section
        +-- Freshness badge (renders or not -- small impact)
        +-- Quality badge
        +-- Shipping badge
        +-- Color swatches spacer (min-h-[28px])
        +-- Color count spacer (min-h-[20px])
        +-- Store region info
        +-- CTA buttons (mt-auto) <-- always at bottom
```

### What does NOT change
- Card visual design, borders, shadows, hover effects
- Grid layout (grid-cols, gap)
- Image size (h-40)
- Discount badge, share button positioning
- Price styling, badge styles
- CTA button text and behavior
- `DealCard.tsx` (not used on `/deals` page)

### Risk
Low. The flex layout is additive and the spacer divs only add minimum height reservations. All 102 cards should align. Testing recommended across viewport sizes.
