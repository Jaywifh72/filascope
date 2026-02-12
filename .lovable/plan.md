

# Filament Product Card Overhaul

This plan upgrades `FilamentCard.tsx` for better visual engagement and affiliate click-through, targeting 6 areas: color swatch prominence, hover states, price display, direct store link, score credibility, and badge cleanup.

---

## 1. Color Swatch Prominence

**Current**: A small 20px color circle is tucked into the brand row alongside variant swatches.

**Change**: Add a prominent 48x48px rounded-lg color swatch block at the very top of the card (inside the brand row area, above the product name). Below it, show the hex code in `text-[10px] text-gray-500 font-mono`. When no `color_hex` exists, render a neutral gray placeholder with "Color N/A" text.

For grouped products with multiple color variants, the swatch shows the primary (first) color and the existing variant swatch row remains as-is below it.

## 2. Card Hover State

**Current**: `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-slate-600/80`

**Change**:
- Lift: `hover:scale-[1.02]` (remove translate, use scale for smoother feel)
- Shadow: `hover:shadow-xl hover:shadow-black/30`
- Border: `hover:border-cyan-500/30`
- Transition: `transition-all duration-200 ease-out` (already present)
- Active press: keep existing `active:scale-[0.99]`

A "Quick Compare" icon button fades in on hover at the bottom-right corner of the card (absolute positioned). It uses the existing `handleCompareToggle` logic. Styled as a 32x32 rounded-full button with `opacity-0 group-hover:opacity-100 transition-opacity duration-150`, `bg-cyan-500/20 hover:bg-cyan-500/40`, using the `Columns` icon.

## 3. Price Display Enhancement

**Current**: Price is already `text-lg font-bold` with a `/kg` suffix and store domain link.

**Change**:
- Add a `From` label above the price in `text-xs text-gray-500` (always, not just for price ranges)
- Store attribution "at [store name]" already exists via the `extractStoreDomain` link -- keep it as-is, it serves this purpose

No structural change needed here since the current layout already matches the spec closely.

## 4. "View on Store" Direct Affiliate Link

**Current**: The CTA row has "View Prices" + a Compare button. Clicking goes to the detail page.

**Change**: Add a secondary text link below the CTA button row:
- Text: `"View on [store domain] -->"` (e.g., "View on amazon.com")
- Styling: `text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors text-center`
- Links directly to the affiliate-tagged product URL (using `useAffiliateLinks` + `regionalUrl`)
- Opens in new tab with `rel="noopener noreferrer"`
- Only shown when a valid product URL exists and the product is in stock
- This is the direct affiliate click path, skipping the detail page

## 5. Rating/Score Credibility Fix

**Current**: FilaScore shows computed scores like "7.2/10" with a detailed hover breakdown. Community ratings only display when `reviewCount > 0`.

**Change**: The FilaScore is NOT showing "10.0" on every card -- it's a computed score with variance. The request likely refers to the `value_score` or visual appearance. After reviewing the code, the score system already has confidence levels and "Limited" badges. No scores are hardcoded to 10.0.

However, to improve credibility:
- When `scoreConfidence === 'low'`, change the FilaScore display label from the numeric score to "Verified specs" with a green checkmark, styled as `bg-emerald-500/15 border-emerald-500/30 text-emerald-400`
- This avoids showing potentially misleading numeric scores for products with insufficient data
- Keep the full numeric score for `medium` and `high` confidence levels

## 6. Badge Cleanup

**Current**: Cards show material badge, standout feature badges, printer compatibility, "New", "Popular", plus "Local" indicator via `MapPin` icon and "Compare" via the bottom button.

**Change**:
- Remove the inline "Compare" text from the bottom CTA row's expanding label (the hover Quick Compare button from change #2 replaces it)
- Actually -- keep the bottom Compare button as-is since it's the primary compare interaction on mobile (no hover). The Quick Compare overlay from #2 is desktop-only supplementary.
- For "Local" indicator: Replace the `MapPin` icon + "Local:" text line in the price section with a tiny green dot (8px) positioned near the store domain text. Use `bg-emerald-400 rounded-full w-2 h-2 inline-block` next to the "at [domain]" link.

---

## Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `src/components/FilamentCard.tsx` | All 6 changes above -- color swatch block, hover classes, Quick Compare overlay, "View on Store" link, low-confidence score label, local dot indicator |

### No new files, dependencies, or database changes required

All data fields (`color_hex`, `product_url`, score confidence, regional URLs) are already available in the component props and hooks. The `useAffiliateLinks` hook is already imported indirectly via `useRegionalPrice`. We'll add a direct import for the affiliate store link.

### Key Implementation Notes

- The `useAffiliateLinks` hook will be imported directly in FilamentCard to generate the affiliate URL for the "View on Store" link
- The Quick Compare hover button uses absolute positioning (`absolute bottom-4 right-4`) and is hidden on mobile to avoid interfering with the checkbox
- Color swatch uses `filament.color_hex` with the existing hex normalization pattern (prepend `#` if missing)
- The "View on Store" link only renders when `regionalUrl` is truthy and product is in stock

