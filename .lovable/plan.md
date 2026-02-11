

## Simplify Seller Row to Remove Redundant Brand Name

### What changes
The store region info row (lines 515-544 in `src/components/deals/GroupedDealCard.tsx`) will be updated to avoid repeating the brand name when the store name matches the vendor/brand.

### Technical details

**File: `src/components/deals/GroupedDealCard.tsx`**

Update the three branches of the store region info section (lines 516-544):

**Branch 1 — Local store (line 517-524):**
Currently: `{flag} {storeName} . Local`
Change to: If `group.storeName` matches `group.representativeDeal.vendor` (or storeName contains the vendor name), show `{flag} Local seller` in emerald. Otherwise keep the full format with store name.

```tsx
{isStoreLocal ? (
  <>
    <span className="text-sm">{group.regionFlag}</span>
    {group.storeName && group.storeName !== group.representativeDeal.vendor ? (
      <>
        <span>{group.storeName}</span>
        <span>-</span>
      </>
    ) : null}
    <span className="text-emerald-400 font-medium">Local seller</span>
  </>
)
```

**Branch 2 — Local alternative (lines 525-535):**
Currently: `{localStore.storeName} . Also at {flag} {storeName}`
Apply the same logic: if `group.storeName` matches the vendor, omit it from the "Also at" portion, showing just the flag. The local store name stays since it's a different seller.

```tsx
) : hasLocalAlternative && localStore ? (
  <>
    <span className="text-emerald-400 font-medium">{localStore.storeName}</span>
    <span>-</span>
    <span className="text-muted-foreground/70">
      Also at <span className="text-sm">{group.regionFlag}</span>
      {group.storeName && group.storeName !== group.representativeDeal.vendor
        ? ` ${group.storeName}`
        : null}
    </span>
  </>
```

**Branch 3 — International, no local store (lines 536-542):**
Currently: `{flag} {storeName} . International`
If store name matches vendor, simplify to `{flag} International seller`.

```tsx
) : group.storeName && group.regionFlag ? (
  <>
    <span className="text-sm">{group.regionFlag}</span>
    {group.storeName !== group.representativeDeal.vendor ? (
      <>
        <span>{group.storeName}</span>
        <span>-</span>
      </>
    ) : null}
    <span>International seller</span>
  </>
```

All flag emojis get wrapped in `<span className="text-sm">` for consistent sizing.

### Behavior
- When the store name equals the brand/vendor name (the common case), the row shows a cleaner "Local seller" or "International seller" label without repeating the brand.
- When the store differs from the brand (e.g., Amazon selling an Amolen product), both names remain visible.
- No changes to row positioning, color swatches, or CTA buttons.
