

## Improve Price Presentation, Brand Row, and Card Density on Deal Cards

### Overview
Refine the GroupedDealCard to show clearer price ranges with context labels, consolidate the brand row, strip redundant brand prefixes from product names, simplify color swatches, and improve the local/shipping metadata display.

### Changes (all in `src/components/deals/GroupedDealCard.tsx`)

#### 1. Price Range Context and Formatting (lines 416-440)

**Current**: Price range shows both min and max at equal visual weight with no explanation.

**New behavior**:
- "From" price becomes `text-lg font-bold text-foreground`, upper range becomes `text-sm text-muted-foreground`
- Add context label below the range:
  - If `group.colorCount > 1` and colors exist: `"across {colorCount} colors"` in `text-[10px] text-muted-foreground`
  - If variants have different `net_weight_g` values: `"varies by size"` (check by comparing weights across variants)
  - Otherwise: `"price varies"` as default
- Single-price deals with strikethrough remain unchanged (the RegionalPricePair handles this)

#### 2. Brand Row Consolidation (lines 376-406)

**Current**: Shows brand logo image + brand name text + verified badge, where logo images often fail.

**New behavior**:
- Logo `<img>` already has `onError` that hides itself (`display: 'none'`), which is correct
- Reduce logo to `h-4 w-4` (constrain width too) with `rounded-sm` for a tighter inline look
- Keep the `onError` handler so broken logos vanish silently
- Brand name stays `text-xs text-muted-foreground font-medium`
- Verified badge stays as-is (already compact)

#### 3. Product Name -- Strip Redundant Brand Prefix (lines 408-413)

**Current**: `group.baseName` may include the brand name (e.g., "Amolen PETG" when brand row already shows "Amolen").

**New behavior**:
- Before rendering, strip the vendor name prefix from `baseName` if it starts with the vendor name (case-insensitive)
- Trim any resulting leading whitespace/dashes
- Example: vendor "Amolen", baseName "Amolen PETG" renders as "PETG"
- Keep `line-clamp-2 h-[40px] overflow-hidden` and upgrade to `font-semibold`

#### 4. Color Swatch Overflow (lines 468-540)

**Current**: Shows 5 swatches + "+X more" with expand chevron, plus a separate "Available in X colors" text line below.

**New behavior**:
- Keep max 5 swatches
- Replace the expand button with plain text: `"+{count}"` in `text-[10px] text-muted-foreground` (no chevron, no expand behavior)
- Remove the expanded color grid entirely (lines 505-526)
- Remove the "Available in X colors" / "X variants available" text block (lines 531-540) -- the swatches + count already communicate this
- Remove the `expanded` state variable and `handleExpandClick` function since they're no longer needed
- This saves ~40px of vertical space per card

#### 5. Store Region / Local Seller Display (lines 542-580)

**Current**: Shows region flag + store name + "Local seller" or "International seller" as text.

**New behavior**:
- **Local seller**: Show a compact green badge: `<span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-medium">Local</span>` alongside region flag and store name
- **Ships to region but not local**: Show `Ship` icon + `"Ships to {region}"` in `text-muted-foreground` (keep current behavior but remove "International seller" label)
- **International (no local)**: Show `{regionFlag} {storeName}` with muted "International" tag
- Keep the local alternative logic as-is

### Technical Details

**Files modified**: `src/components/deals/GroupedDealCard.tsx` only

**Removals**:
- `expanded` state, `handleExpandClick`, `ChevronDown`/`ChevronUp` imports (if unused elsewhere)
- Expanded color grid block
- "Available in X colors" text block

**New logic**:
- `displayName` computed by stripping vendor prefix from `group.baseName`
- `priceRangeContext` string computed from variant data (color count vs weight differences)
- Check weight variation: `const hasWeightVariation = new Set(group.variants.map(v => v.net_weight_g).filter(Boolean)).size > 1`

**No new dependencies or files needed.**

