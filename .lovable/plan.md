
# Plan: Add Store Name and Region Info to Deal Cards

## Overview

This plan adds store/region context to each deal card on the Deals page, showing users which region the deal comes from and whether it's local or international to them.

---

## What You'll See After These Changes

**Current deal card:**
```
76% OFF
Amolen PEBA 90A Flexible - White
~£14.62  ~£61.46  -76%
Found 2 days ago
```

**After changes:**
```
76% OFF
Amolen PEBA 90A Flexible - White
~£14.62  ~£61.46  -76%
🇺🇸 Amazon US • International
Found 2 days ago
```

Plus a new "Show Local Only" toggle button in the filters section.

---

## Technical Implementation

### Step 1: Create Store Region Helper Utility

**New file:** `src/lib/dealStoreRegion.ts`

This utility will:
- Detect store region from product URL patterns (Amazon country domains, regional store URLs)
- Look up brand regional availability to determine if a brand serves the user's region
- Return store name, region code, flag, and local/international status

```typescript
// Key exports:
interface DealStoreInfo {
  storeName: string;           // "Amazon US", "Amolen Store", etc.
  storeRegion: RegionCode;     // 'US' | 'UK' | 'EU' | etc.
  regionFlag: string;          // 🇺🇸, 🇬🇧, etc.
  isLocal: boolean;            // true if store region matches user region
  isAmazon: boolean;           // true if Amazon link
}

function getDealStoreInfo(
  productUrl: string | null,
  vendor: string | null,
  userRegion: RegionCode
): DealStoreInfo
```

URL pattern detection logic:
- `amazon.com` → US
- `amazon.co.uk` → UK
- `amazon.de`, `amazon.fr`, `amazon.it`, `amazon.es` → EU
- `amazon.ca` → CA
- `amazon.com.au` → AU
- `amazon.co.jp` → JP
- Store URLs with `.co.uk`, `-uk.`, `/uk/` → UK
- Store URLs with `.eu`, `-eu.`, `/eu/` → EU
- Default to US for standard `.com` stores

### Step 2: Update DealWithMeta Interface

**File:** `src/hooks/useDealsWithFilters.ts`

Add store region fields to the deal data:

```typescript
export interface DealWithMeta extends DealFilament {
  discount: number;
  savings: number;
  expiresIn?: string | null;
  stockStatus?: "in_stock" | "low_stock" | "limited" | null;
  viewsToday?: number;
  // NEW: Store region info
  storeName: string;
  storeRegion: string;
  regionFlag: string;
}
```

### Step 3: Add "Show Local Only" Filter State

**File:** `src/hooks/useDealsWithFilters.ts`

Add filter state and logic:

```typescript
const [showLocalOnly, setShowLocalOnly] = useState(false);

// In filter logic:
if (showLocalOnly && !deal.isLocal) {
  return false;
}

// Return new state
return {
  // ... existing
  showLocalOnly,
  setShowLocalOnly,
  localDealCount: rawDeals.filter(d => d.isLocal).length,
};
```

### Step 4: Update DealCard Component

**File:** `src/components/deals/DealCard.tsx`

Add store region display after the price section:

```tsx
interface DealCardProps {
  deal: DealFilament;
  discount: number;
  savings: number;
  expiresIn?: string | null;
  stockStatus?: "in_stock" | "low_stock" | "limited" | null;
  viewsToday?: number;
  // NEW props
  storeName?: string;
  storeRegion?: string;
  regionFlag?: string;
  isLocal?: boolean;
}

// In the card content, after price section:
{storeName && (
  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
    <span>{regionFlag}</span>
    <span>{storeName}</span>
    <span>•</span>
    {isLocal ? (
      <span className="text-emerald-400 font-medium">Local</span>
    ) : (
      <span className="text-muted-foreground">International</span>
    )}
  </div>
)}
```

### Step 5: Update DealFilters Component

**File:** `src/components/deals/DealFilters.tsx`

Add "Show Local Only" toggle button:

```tsx
interface DealFiltersProps {
  // ... existing props
  showLocalOnly: boolean;
  onShowLocalOnlyChange: (show: boolean) => void;
  localDealCount: number;
  userRegionFlag: string;
}

// Add toggle before the clear button:
<Button
  variant={showLocalOnly ? "default" : "outline"}
  size="sm"
  onClick={() => onShowLocalOnlyChange(!showLocalOnly)}
  className="gap-2 min-h-[44px]"
>
  {userRegionFlag} Local Only
  {showLocalOnly && (
    <Badge className="ml-1 h-5 px-1.5 text-xs">
      {localDealCount}
    </Badge>
  )}
</Button>
```

### Step 6: Update MobileDealsFilterSheet Component

**File:** `src/components/deals/MobileDealsFilterSheet.tsx`

Add "Show Local Only" as a prominent toggle at the top of the filter sheet:

```tsx
// Add after SheetHeader, before Material filter:
<div className="px-4 py-3 border-b border-border">
  <button
    onClick={() => onShowLocalOnlyChange(!showLocalOnly)}
    className={cn(
      "flex items-center justify-between w-full py-3 px-4 rounded-lg",
      showLocalOnly 
        ? "bg-emerald-500/10 border border-emerald-500/30"
        : "bg-muted/30"
    )}
  >
    <div className="flex items-center gap-3">
      <span className="text-lg">{userRegionFlag}</span>
      <span className="font-medium">Show Local Deals Only</span>
    </div>
    <Switch checked={showLocalOnly} />
  </button>
  <p className="text-xs text-muted-foreground mt-2">
    {localDealCount} deals ship from your region
  </p>
</div>
```

### Step 7: Update Deals Page

**File:** `src/pages/Deals.tsx`

Pass new props to filter components and DealCard:

```tsx
const { region } = useRegion();
const { 
  // ... existing
  showLocalOnly,
  setShowLocalOnly,
  localDealCount,
} = useDealsWithFilters();

// Pass to DealFilters
<DealFilters
  {...existingProps}
  showLocalOnly={showLocalOnly}
  onShowLocalOnlyChange={setShowLocalOnly}
  localDealCount={localDealCount}
  userRegionFlag={REGIONS[region].flag}
/>

// DealCard already receives deal with store info
<DealCard
  key={deal.id}
  deal={deal}
  {...existingProps}
  storeName={deal.storeName}
  storeRegion={deal.storeRegion}
  regionFlag={deal.regionFlag}
  isLocal={deal.isLocal}
/>
```

### Step 8: Add "No Local Deals" Empty State

**File:** `src/pages/Deals.tsx`

Add special message when local filter is on but no results:

```tsx
{deals.length === 0 && showLocalOnly ? (
  <div className="text-center py-16">
    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h2 className="text-xl font-semibold mb-2">No Local Deals Found</h2>
    <p className="text-muted-foreground mb-6">
      We don't have any deals shipping from your region ({region}) right now.
      Try browsing international deals.
    </p>
    <Button variant="outline" onClick={() => setShowLocalOnly(false)}>
      Show International Deals
    </Button>
  </div>
) : (
  // ... existing empty state
)}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/dealStoreRegion.ts` | Helper to detect store region from URL/vendor |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useDealsWithFilters.ts` | Add store info to deals, add local filter state |
| `src/components/deals/DealCard.tsx` | Display store name, flag, Local/International badge |
| `src/components/deals/DealFilters.tsx` | Add "Show Local Only" toggle |
| `src/components/deals/MobileDealsFilterSheet.tsx` | Add "Show Local Only" toggle |
| `src/pages/Deals.tsx` | Pass new props, add "no local deals" empty state |

---

## No Database Changes Required

Store region is derived from existing `product_url` and `vendor` fields using URL pattern detection and the existing `BRAND_REGIONAL_AVAILABILITY` lookup table.

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No product URL | Show vendor name only, no region badge |
| Unknown URL pattern | Default to US region |
| Amazon link detected | Show "Amazon {region}" as store name |
| User in UK, deal from UK | Show "🇬🇧 Store Name • Local" |
| User in UK, deal from US | Show "🇺🇸 Store Name • International" |
| Local filter on, no local deals | Show helpful message with button to clear filter |
