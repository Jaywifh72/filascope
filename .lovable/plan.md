

# Fix Cross-Sell Price Contamination in extractBambuLabPrice

## Problem

The `extractBambuLabPrice` function in `supabase/functions/get-current-price/index.ts` extracts ALL prices from the full page markdown, sorts them ascending, and picks the lowest. This causes it to select cross-sell/accessory prices (e.g., "$11.99 Support for ABS") instead of the main product price ("$19.99 ABS Filament").

This affects Bambu Lab and any other brand with "Frequently Bought Together" or cross-sell widgets on product pages.

## Root Cause

In every price extraction block (EUR, GBP, USD/CAD/AUD, fallback currencies, and last-resort dollar), the pattern is:
```
prices.sort((a, b) => a - b);  // sort ascending
price = prices[0];              // take the LOWEST
```

The lowest price on the page is often an accessory, not the main product.

## Solution

Split the markdown into an "upper section" (before cross-sell markers) and extract prices from there first. Only fall back to the full page if the upper section yields nothing. In the upper section, take the FIRST price found (by page position), not the lowest.

### Changes to `supabase/functions/get-current-price/index.ts`

**1. Add a helper function to split markdown into main product vs. cross-sell sections (~line 1775)**

```typescript
function getMainProductSection(markdown: string): string {
  // Split before cross-sell/accessory sections
  const cutoffPatterns = [
    /(?:frequently\s+bought\s+together|discover\s+more|you\s+may\s+also\s+like|related\s+products|customers\s+also\s+bought|recommended\s+for\s+you|support\s+for\s+\w+.*?\$)/i,
    /add\s+to\s+cart/i,
  ];
  
  let cutoff = markdown.length;
  for (const pattern of cutoffPatterns) {
    const match = markdown.search(pattern);
    if (match > 0 && match < cutoff) {
      cutoff = match;
    }
  }
  
  // Use at least the first 40% of the page if no markers found early
  const minLength = Math.floor(markdown.length * 0.4);
  if (cutoff < minLength) {
    cutoff = minLength;
  }
  
  return markdown.substring(0, cutoff);
}
```

**2. Update `extractBambuLabPrice` to use upper-section-first strategy**

For each price extraction block (EUR at ~line 1803, GBP at ~line 1830, USD/CAD/AUD at ~line 1857, fallback currencies at ~line 1894, and last-resort dollar at ~line 1909):

- First, try extracting from the main product section (upper portion)
- If that yields valid prices, take the FIRST match by page position (not the lowest)
- Only fall back to full-page extraction if upper section yields nothing
- When falling back to full page, still take the first valid price rather than the lowest

The key change in each block is replacing:
```typescript
.sort((a, b) => a - b);
// take prices[0] (lowest)
```
With:
```typescript
// No sort — take first valid match by page position
// take prices[0] (first on page)
```

And wrapping each block to try the upper section first:
```typescript
const upperMarkdown = getMainProductSection(markdown);

// Try upper section first
const upperMatches = [...upperMarkdown.matchAll(pattern)];
if (upperMatches.length > 0) {
  const prices = upperMatches
    .map(m => parseFloat(m[1].replace(',', '.')))
    .filter(p => !isNaN(p) && p > 0 && validateFilamentPrice(p, currency));
  // Take FIRST valid price (by position), not lowest
  if (prices.length > 0) {
    return { price: prices[0], ... };
  }
}

// Fall back to full page
const fullMatches = [...markdown.matchAll(pattern)];
// same logic...
```

**3. Handle compare-at price correctly**

When we take the first price by position instead of the lowest, the compare-at detection also changes. If two prices appear near each other (like "$19.99 ~~$22.99~~"), the first is the current price and the second (if higher by >10%) is the compare-at price. This logic stays the same but now operates on position-ordered prices rather than value-sorted ones.

### No changes needed to other files

- `validateFilamentPrice` is already currency-aware (JPY: 100-30000)
- `shouldAlwaysUseFirecrawl` already includes `store.bambulab.com`
- Geo-redirect Firecrawl-first routing is already active
- `SyncChangeIndicator` UI is already implemented in PricingData.tsx

## Expected Outcome

- Bambu Lab ABS page: extracts $19.99 (main product) instead of $11.99 (cross-sell support material)
- Works for all brands with cross-sell widgets since it uses generic section markers
- No regression for pages without cross-sell sections (falls through to full-page extraction)

