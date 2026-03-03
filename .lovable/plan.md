

# Enhance Brand Description Paragraph

## Overview
Improve the SEO-rich description paragraph between the CTAs and tab navigation with visual emphasis on key data points, a mobile-friendly expandable pattern, and inline micro-stats -- all without changing the text content.

## Changes (all in `src/pages/BrandDetail.tsx`)

### 1. Bold Key Data Points
Replace the inline text interpolations for product count, variant count, material count, and price range with `<strong className="text-white font-semibold">` wrappers. The surrounding text stays `text-muted-foreground`. No text content changes -- only adding emphasis tags around the dynamic values that are already rendered.

### 2. Mobile Expandable (CSS-only)
Wrap the `<p>` in a container that applies `md:line-clamp-none line-clamp-2` by default on mobile. Add a "Read more / Read less" toggle button (`text-cyan-400 text-xs`) visible only below `md` breakpoint (`md:hidden`). Toggle controls a local state that removes the `line-clamp-2` class. The full text stays in the DOM at all times (CSS overflow only, no conditional rendering) so crawlers always see it.

### 3. Key Metrics Inline Callout
Below the paragraph, add a single `<div>` with `flex flex-wrap gap-4 text-xs text-gray-500 mt-3`:
- "Made in {location}" (or omit if no location data)
- "{materialCount} Material Types"
- "From {formatPrice(minPrice)}/spool" (or omit if no price data)

Each item is a plain `<span>` with an emoji prefix. Data is derived from existing `brandInfo`, `availableMaterials`, and `brandPriceRange` variables already in scope.

## Technical Notes
- Only `src/pages/BrandDetail.tsx` is modified (lines ~719-734 area)
- A single `useState<boolean>` is added for the mobile expand toggle
- No new components or files needed
- All existing text content, structured data, and SEO elements remain untouched per the SEO preservation protocol
- The `<p>` tag and its text remain identical -- only `<strong>` tags are inserted around dynamic values

