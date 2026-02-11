

## Replace Plain Brand Text with Logo + Linked Brand Name

### What changes
The plain `<div>` showing the vendor name (line 358) in each deal card will be replaced with a compact row containing a small brand logo image and a linked brand name, both wrapped in a `Link` to the brand detail page.

### Technical details

**File: `src/components/deals/GroupedDealCard.tsx`**

1. Add imports for `getBrandLogoUrl` from `@/lib/brandLogos` and `toBrandSlug` from `@/utils/brandSlug`.

2. Replace lines 357-360 (the vendor div):
```
{/* Vendor */}
<div className="text-xs text-muted-foreground mb-1">
  {group.representativeDeal.vendor}
</div>
```

With a linked logo + name row:
```tsx
{/* Vendor with logo */}
{group.representativeDeal.vendor && (
  <Link
    to={`/brands/${toBrandSlug(group.representativeDeal.vendor)}`}
    className="flex items-center gap-1.5 mb-1.5 group/brand"
    onClick={(e) => e.stopPropagation()}
  >
    {getBrandLogoUrl(group.representativeDeal.vendor, 60) && (
      <img
        src={getBrandLogoUrl(group.representativeDeal.vendor, 60)!}
        alt={`${group.representativeDeal.vendor} logo`}
        className="h-4 w-auto max-w-[60px] object-contain opacity-70 group-hover/brand:opacity-100 transition-opacity"
        loading="lazy"
        decoding="async"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    )}
    <span className="text-xs text-muted-foreground group-hover/brand:text-primary transition-colors">
      {group.representativeDeal.vendor}
    </span>
  </Link>
)}
```

### Behavior
- Logo loads from the existing `brand-logos` storage bucket at 120px (2x of 60px display) via `getBrandLogoUrl`.
- If a brand has no logo mapped, no `<img>` is rendered (the `getBrandLogoUrl` returns null).
- If the image fails to load, it hides itself via `onError`, leaving the text-only fallback.
- Hover brightens the logo (opacity 70 to 100) and turns text cyan/primary.
- Click navigates to `/brands/{slug}` without interfering with the parent card link.
- Uses nested group naming (`group/brand`) to avoid conflicting with the card's existing `group` hover.

