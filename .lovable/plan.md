

## Empty State for 0-Product Brands

### Problem
Brands with 0 products (e.g., Gst3d) show an almost empty page. The Overview tab's "Why Choose", "Popular Products", and "Materials Offered" sections are all conditionally hidden, leaving a blank space. The Products tab still renders the full filter sidebar and grid layout with just a "No products found" card.

### Changes

#### 1. Overview Tab (`src/components/brands/tabs/BrandOverviewTab.tsx`)
- Add a check at the top of the render: when `groupedProducts.length === 0`, render a centered empty state card instead of the normal sections.
- The empty state will use:
  - `Package` icon at 48px, `text-muted-foreground`
  - Heading: "Products Coming Soon" (`text-xl font-semibold`)
  - Subtext: "We're working on adding {brandName}'s product catalog. Check back soon!" (`text-muted-foreground`)
  - "Browse Other Brands" outline button linking to `/brands`
  - Container: centered, `max-w-md mx-auto`, `py-16`

#### 2. Products Tab (`src/components/brands/tabs/BrandProductsTab.tsx`)
- Add an early return when `groupedProducts.length === 0` (before the sidebar + grid layout).
- Show a similar centered empty state with the `Package` icon, "No Products Yet" heading, descriptive subtext, and a "Browse Other Brands" button.
- This avoids rendering the filter sidebar and sort controls for an empty catalog.

#### 3. No changes to:
- Hero section, stat boxes, or tab navigation
- About tab (already handles empty state)
- Brands with products (all conditional, no impact)

### Technical Details

**Overview Tab** -- insert before line 165:
```tsx
if (groupedProducts.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
      <Package className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={1.5} />
      <h3 className="text-xl font-semibold text-foreground mb-2">Products Coming Soon</h3>
      <p className="text-sm text-muted-foreground mb-6">
        We're working on adding {brandName}'s product catalog. Check back soon!
      </p>
      <Button variant="outline" onClick={() => navigate('/brands')}>
        Browse Other Brands
      </Button>
    </div>
  );
}
```

**Products Tab** -- insert early return at the beginning of the component body (after hooks, before the main JSX):
```tsx
if (groupedProducts.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
      <Package className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={1.5} />
      <h3 className="text-xl font-semibold text-foreground mb-2">No Products Yet</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {brandName}'s product catalog is being prepared. Check back soon!
      </p>
      <Button variant="outline" onClick={() => navigate('/brands')}>
        Browse Other Brands
      </Button>
    </div>
  );
}
```

Both are minimal, low-risk additions that short-circuit rendering before any complex logic when product count is zero.

