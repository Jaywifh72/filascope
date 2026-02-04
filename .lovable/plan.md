
# Plan: Group Deal Color Variants into Single Cards

## Overview

Transform the Deals page from showing 80+ individual cards (one per color variant) to ~20-30 grouped product cards showing all available colors. This dramatically improves usability by consolidating deals like "Anycubic TPU Filament" with 20 color variants into a single card.

---

## What You'll See After These Changes

**Before (80+ cards):**
```
49% OFF - Anycubic TPU Filament (Red)
49% OFF - Anycubic TPU Filament (Blue)
49% OFF - Anycubic TPU Filament (Black)
... (17 more identical cards)
```

**After (~25 cards):**
```
49% OFF - Anycubic TPU Filament
~£20.48 - ~£24.49
[●] [●] [●] [●] [●] +15 more
🇺🇸 Amazon US • International
```

---

## Technical Approach

### Key Decision: Reuse Existing Infrastructure

The codebase already has robust color variant handling in `useFilamentColorVariants.ts`:
- `getBaseProductName()` - Strips colors from titles
- `getColorFromTitle()` - Extracts color names
- Color swatch display in `FilamentCard` with HoverCard

We'll leverage these for grouping deals.

---

## Implementation Steps

### Step 1: Create Grouping Utility

**New file:** `src/lib/groupDealsByProduct.ts`

```typescript
import { getBaseProductName } from '@/hooks/useFilamentColorVariants';
import type { DealWithMeta } from '@/hooks/useDealsWithFilters';

export interface GroupedDeal {
  groupKey: string;           // Unique key for the group
  baseName: string;           // Product name without color
  representativeDeal: DealWithMeta;  // First/best deal for image etc.
  variants: DealWithMeta[];   // All color variants
  // Aggregated data
  bestDiscount: number;       // Highest discount in group
  priceRange: { min: number; max: number };
  colorHexes: string[];       // Unique color hex values
  colorCount: number;         // Total unique colors
  // Store info from representative deal
  storeName: string;
  storeRegion: string;
  regionFlag: string;
  isLocal: boolean;
}

export function groupDealsByProduct(deals: DealWithMeta[]): GroupedDeal[] {
  const groups = new Map<string, DealWithMeta[]>();
  
  // Group deals by vendor + base product name
  for (const deal of deals) {
    const baseName = getBaseProductName(deal.product_title);
    const groupKey = `${(deal.vendor || 'unknown').toLowerCase()}-${baseName.toLowerCase()}`;
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(deal);
  }
  
  // Convert to grouped deals
  return Array.from(groups.entries()).map(([groupKey, variants]) => {
    // Sort by discount (best first)
    const sorted = [...variants].sort((a, b) => b.discount - a.discount);
    const representative = sorted[0];
    
    // Calculate aggregates
    const prices = variants
      .map(v => v.variant_price)
      .filter((p): p is number => p !== null);
    
    const colorHexes = [...new Set(
      variants
        .map(v => (v as any).color_hex as string | null)
        .filter((hex): hex is string => !!hex)
    )];
    
    return {
      groupKey,
      baseName: getBaseProductName(representative.product_title),
      representativeDeal: representative,
      variants: sorted,
      bestDiscount: representative.discount,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      colorHexes,
      colorCount: variants.length,
      storeName: representative.storeName,
      storeRegion: representative.storeRegion,
      regionFlag: representative.regionFlag,
      isLocal: representative.isLocal,
    };
  }).sort((a, b) => b.bestDiscount - a.bestDiscount);
}
```

### Step 2: Create GroupedDealCard Component

**New file:** `src/components/deals/GroupedDealCard.tsx`

Design features:
- Discount badge showing best discount
- Base product name (without color)
- Price range display when variants have different prices
- Color swatches (first 5 + "+X more" clickable to expand)
- Clicking a color swatch navigates to that variant's detail page
- Store region info (same as current DealCard)
- Share button for the group

```typescript
interface GroupedDealCardProps {
  group: GroupedDeal;
}

export function GroupedDealCard({ group }: GroupedDealCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Show price range if prices differ
  const hasPriceRange = group.priceRange.min !== group.priceRange.max;
  
  return (
    <Card className="relative h-full overflow-hidden hover:scale-[1.02] ...">
      {/* Best Discount Badge */}
      <div className="absolute top-3 left-3 z-10 ...">
        {group.bestDiscount}% OFF
      </div>
      
      {/* Image from representative deal */}
      <div className="relative h-40 bg-gray-800/50 ...">
        <OptimizedImage src={group.representativeDeal.featured_image} ... />
      </div>
      
      <CardContent className="p-4">
        {/* Vendor */}
        <div className="text-xs text-muted-foreground mb-1">
          {group.representativeDeal.vendor}
        </div>
        
        {/* Base Product Name (without color) */}
        <h3 className="font-medium text-sm mb-3 line-clamp-2">
          {group.baseName}
        </h3>
        
        {/* Price Range or Single Price */}
        {hasPriceRange ? (
          <div className="flex items-center gap-1 mb-2">
            <RegionalPrice amount={group.priceRange.min} ... />
            <span>-</span>
            <RegionalPrice amount={group.priceRange.max} ... />
          </div>
        ) : (
          <RegionalPricePair 
            saleAmount={group.priceRange.min}
            originalAmount={group.representativeDeal.variant_compare_at_price}
            ...
          />
        )}
        
        {/* Color Swatches */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {group.colorHexes.slice(0, 5).map((hex, i) => (
            <Link 
              key={i}
              to={`/filament/${group.variants.find(v => v.color_hex === hex)?.id}`}
              className="w-5 h-5 rounded-full border border-white/20 hover:scale-110"
              style={{ backgroundColor: hex }}
            />
          ))}
          {group.colorCount > 5 && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              +{group.colorCount - 5} more
            </button>
          )}
        </div>
        
        {/* Expanded Color Grid (when clicked) */}
        {expanded && (
          <div className="grid grid-cols-6 gap-1.5 mb-3 p-2 bg-muted/30 rounded">
            {group.colorHexes.map((hex, i) => (
              <Link 
                key={i}
                to={`/filament/${group.variants.find(v => v.color_hex === hex)?.id}`}
                className="w-6 h-6 rounded-full border border-white/20 hover:scale-110"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}
        
        {/* Variant Count Badge */}
        <div className="text-xs text-muted-foreground mb-2">
          Available in {group.colorCount} colors
        </div>
        
        {/* Store Region Info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{group.regionFlag}</span>
          <span>{group.storeName}</span>
          <span>•</span>
          {group.isLocal ? (
            <span className="text-emerald-400 font-medium">Local</span>
          ) : (
            <span>International</span>
          )}
        </div>
        
        {/* CTA Button - links to representative deal */}
        <Button variant="outline" size="sm" className="w-full mt-3" asChild>
          <Link to={`/filament/${group.representativeDeal.id}`}>
            View Deal
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Step 3: Update useDealsWithFilters Hook

**File:** `src/hooks/useDealsWithFilters.ts`

Add `color_hex` to the query and provide both raw and grouped deals:

```typescript
// Update select to include color_hex
const { data, error } = await supabase
  .from("filaments")
  .select(
    "id, product_title, vendor, material, featured_image, variant_price, variant_compare_at_price, product_url, net_weight_g, last_scraped_at, created_at, color_hex"
  )
  ...

// Add to return:
return {
  deals: filteredDeals,
  groupedDeals: useMemo(() => 
    groupDealsByProduct(filteredDeals), 
    [filteredDeals]
  ),
  ...
}
```

### Step 4: Update Deals Page

**File:** `src/pages/Deals.tsx`

Replace the deal cards grid with grouped cards:

```typescript
import { GroupedDealCard } from "@/components/deals/GroupedDealCard";

// In the component:
const { deals, groupedDeals, ... } = useDealsWithFilters();

// Stats Row - show grouped count
<span>
  <span className="text-foreground font-medium">{groupedDeals.length}</span> deals
  <span className="text-muted-foreground"> ({deals.length} variants)</span>
</span>

// Grid - render grouped cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {groupedDeals.map((group) => (
    <GroupedDealCard key={group.groupKey} group={group} />
  ))}
</div>
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/groupDealsByProduct.ts` | Grouping logic and types |
| `src/components/deals/GroupedDealCard.tsx` | New grouped card component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useDealsWithFilters.ts` | Add `color_hex` to query, return `groupedDeals` |
| `src/pages/Deals.tsx` | Use `groupedDeals` and `GroupedDealCard` |

---

## Visual Design

**Card Layout:**
```text
┌─────────────────────────────────┐
│ [49% OFF]              [Share]  │
│                                 │
│      [Product Image]            │
│                                 │
├─────────────────────────────────┤
│ Anycubic                        │
│ TPU Filament                    │
│                                 │
│ ~£20.48 - ~£24.49               │
│                                 │
│ [●][●][●][●][●] +15 more        │
│ Available in 20 colors          │
│                                 │
│ 🇺🇸 Amazon US • International   │
│                                 │
│ [      View Deal      ]         │
└─────────────────────────────────┘
```

**Color Swatch Behavior:**
- First 5 colors shown as clickable dots
- "+X more" expands to show all colors in a grid
- Each color dot links to that variant's detail page
- Hover tooltip shows color name if available

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Single color variant | Show as normal card (no "Available in X colors") |
| No color_hex data | Still group by base name, show "Available in X variants" |
| Price range is same | Show single price instead of range |
| All variants same discount | Show single discount percentage |
| Discount range | Show best discount with note "up to X% off" |

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Cards displayed | 80+ | ~25 |
| Page load time | Slower (more cards) | Faster |
| User findability | Hard to scan | Easy to scan |
| Color discovery | Must scroll through all | See all at glance |

---

## No Database Changes Required

Uses existing `color_hex` column already in filaments table.
