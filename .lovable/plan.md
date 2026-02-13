

## Redesign Deal Card Freshness Badges, Discount Tiers, and Savings Display

### Overview
Replace the generic amber freshness badges and green discount badges with a tiered color system, remove noisy "Everyday Price" badges, and add "You save $X" anchoring text to deal cards.

### Changes

#### 1. Modify `src/components/deals/GroupedDealCard.tsx`

**Freshness badge rewrite** (lines 22-43, the `DealFreshnessBadge` component):
- Replace the current 4-tier color system with a 5-tier system matching the spec:
  - 0-3 days: `text-emerald-400` with `CheckCircle` icon, text "Verified today" or "Verified Xd ago"
  - 4-7 days: `text-cyan-400` with `Clock` icon, text "Checked Xd ago"
  - 8-14 days: `text-amber-400` with `Clock` icon, text "Checked Xd ago"
  - 15-30 days: `text-orange-400` with `AlertCircle` icon, text "Checked Xw ago"
  - 30+ days: `text-red-400/50` with `AlertTriangle` icon, text "Checked Xmo ago -- price may have changed"
- Simplify from a Badge to an inline `span` with icon + text (lighter visual weight)
- Import `CheckCircle`, `AlertCircle`, `AlertTriangle` from lucide-react

**Discount badge tier system** (lines 313-323):
- Replace the current binary green/amber with 5 tiers:
  - 50%+: `bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold`
  - 35-49%: `bg-emerald-500 text-white font-semibold`
  - 20-34%: `bg-teal-600 text-white font-medium`
  - 10-19%: `bg-gray-600 text-gray-200 font-medium`
  - Under 10%: `bg-gray-700 text-gray-400 font-normal`
- Keep the "Great Deal" label for `isUnusualDiscount`, otherwise show "X% OFF"

**Add "You save $X" line** (after the price section, around line 433):
- Only show when NOT a price range (`!hasPriceRange`) and both sale and compare-at prices exist
- Calculate savings: `variant_compare_at_price - variant_price` (use representative deal)
- Display: `<RegionalPrice>` component in `text-xs text-emerald-400 font-medium` with "You save" prefix

**Remove DealQualityBadge** (lines 440-447):
- Remove the `<DealQualityBadge>` usage entirely -- it adds "Everyday Price" noise
- Remove the import of `DealQualityBadge` (line 11)
- The freshness badge already communicates recency, and the discount badge communicates value

#### 2. Modify `src/components/deals/DealQualityBadge.tsx`
- No changes needed to the file itself; it just won't be imported by `GroupedDealCard` anymore. It may still be used by `DealCard.tsx` (the non-grouped version).

### Technical Details

**Files modified**: `src/components/deals/GroupedDealCard.tsx` only

**New imports**: `CheckCircle`, `AlertCircle`, `AlertTriangle` from lucide-react (replacing some existing icon imports)

**Key implementation notes**:
- The savings calculation uses the representative deal's `variant_compare_at_price` minus `variant_price`, wrapped in the existing `RegionalPrice` component for currency conversion
- The freshness badge becomes a simple inline span instead of a full Badge component, reducing visual noise
- The discount badge gradient for 50%+ uses Tailwind's `bg-gradient-to-r` utility classes
- Touch-safety and hover behavior are unaffected since these changes are purely visual/content

