

# Plan: Simplify Pricing Display for Static/Scraped Data

## Summary

Refactor the pricing display across the filament detail page to be honest about the static/scraped nature of the data. Remove terminology that implies live price checking, simplify freshness messaging, and create a cleaner "Where to Buy" experience.

---

## Current State Analysis

| Component | Current State | Issues |
|-----------|--------------|--------|
| `HonestPriceDisplay` | Shows "Estimated price", "Last checked X days ago", "May have changed - verify at store" | Overly complex messaging |
| `LivePriceCheckButton` | "Check Current Price" button with live fetching | Implies real-time when most data is scraped |
| `FilamentPurchaseSidebar` | "Check Current Price" CTA for low-confidence prices | Confusing dual behavior |
| `PricingTabContent` | "Check Price" buttons, "Other Retailers" section | Redundant sections |
| `StorePricingDisplay` | Clean store-based display | Good baseline to build on |

---

## Terminology Changes

| Current | New |
|---------|-----|
| "Check Current Price" | "Buy at [Store Name]" |
| "Estimated price" | "Last Known Price" or just show price |
| "Last checked X days ago" | "Price from [date]" |
| "May have changed - verify at store" | Remove (implied by static nature) |
| "Verified today" | "Updated today" |
| "Check Price" button | "Buy" button |
| "View at Store" | "Buy at [Store Name]" |

---

## Implementation Steps

### Step 1: Update HonestPriceDisplay Component

**File**: `src/components/price/HonestPriceDisplay.tsx`

**Changes**:

1. **Simplify display modes**:
   - Remove `pricePrefix` distinction (always show `~` for converted only)
   - Change labels from "Estimated" to "Last Known"
   - Simplify helper text to just show date

2. **Update CTA text**:
   - Always use "Buy at [Store]" pattern
   - Remove "Check Current Price" variant

3. **Streamline freshness messaging**:
   ```typescript
   // OLD: "Last checked 3 days ago"
   // NEW: "Price from Jan 30, 2026"
   
   function formatPriceDate(date: Date): string {
     return format(date, 'MMM d, yyyy');
   }
   ```

4. **Remove warning text**:
   - Remove "May have changed - verify at store"
   - Keep color-coded freshness indicators (green/yellow/red)

### Step 2: Simplify LivePriceCheckButton

**File**: `src/components/price/LivePriceCheckButton.tsx`

**Changes**:

1. **Change idle state button text**:
   - From: "Check Current Price"
   - To: "Buy at [Store Name]" (direct link, no price fetch)

2. **Convert to simple buy button**:
   - Remove the price fetching functionality
   - Make it a direct "Buy at Store" button
   - Keep stock status indicators if already fetched

3. **OR deprecate entirely**:
   - Since we're being honest about static data, this button's "live check" purpose is misleading
   - Replace all usages with simple buy buttons

### Step 3: Refactor FilamentPurchaseSidebar

**File**: `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`

**New simplified structure**:

```text
┌────────────────────────────────────┐
│  [PLA]                             │
│                                    │
│  £13.05/kg                         │
│  £9.99 per spool                   │
│                                    │
│  from Polymaker UK 🇬🇧              │
│  Price from Feb 2, 2026            │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  🛒 Buy at Polymaker UK      │  │
│  │     → Opens in new tab       │  │
│  └──────────────────────────────┘  │
│                                    │
│  [Compare] button                  │
│                                    │
│  ─────────────────────────────────│
│  Also available at:                │
│  🇺🇸 Amazon US  £12.50  [Buy]      │
│  🇪🇺 Amazon DE  ~£11.99  [Buy]     │
│                                    │
│  ─────────────────────────────────│
│  [Open Print Calculator]           │
└────────────────────────────────────┘
```

**Removals**:
- "Check Current Price" button entirely
- "Add £X for free shipping" progress bar
- "Free shipping on orders $X+" messaging
- "Easy returns policy" trust signal

**Simplifications**:
- Remove confidence-based CTA switching
- Always show "Buy at [Store]" button
- Keep international shipping warnings

### Step 4: Update StorePricingDisplay

**File**: `src/components/filament/sidebar/StorePricingDisplay.tsx`

**Changes**:

1. **Add original price for conversions**:
   ```typescript
   // Show: ~£13.05 ($16.99 USD)
   {storePrice.isConverted && storePrice.originalPrice && (
     <span className="text-sm text-muted-foreground ml-2">
       ({storePrice.originalCurrency} {storePrice.originalPrice.toFixed(2)})
     </span>
   )}
   ```

2. **Add "from [Store]" text below price**:
   ```typescript
   <div className="text-sm text-muted-foreground">
     from {storePrice.storeName} {regionConfig?.flag}
   </div>
   ```

3. **Add price date**:
   ```typescript
   {storePrice.lastVerifiedAt && (
     <div className="text-xs text-muted-foreground">
       Price from {format(new Date(storePrice.lastVerifiedAt), 'MMM d, yyyy')}
     </div>
   )}
   ```

### Step 5: Refactor PricingTabContent

**File**: `src/components/filament/tabs/PricingTabContent.tsx`

**Changes**:

1. **Merge "Where to Buy" and "Other Retailers" into single section**:
   - Title: "Where to Buy"
   - List all stores (official + third-party) together
   - Sort: Local stores first, then international by price

2. **Update StoreCard buttons**:
   - From: "Check Price"
   - To: "Buy" (simple, direct)

3. **Remove disclaimer card** at top:
   - The "Prices change frequently" warning is noise
   - Users understand prices are dynamic

4. **Simplify store card display**:
   ```text
   ┌─────────────────────────────────────────┐
   │ 🇺🇸 Polymaker US                        │
   │ Official Store • Ships from CA, USA    │
   │                                         │
   │                    [Buy] →              │
   └─────────────────────────────────────────┘
   ```

5. **Keep Price History section** (valuable context)

6. **Keep Price Alerts section** (per user preference)

### Step 6: Update FilamentMobileBottomBar

**File**: `src/components/filament/sidebar/FilamentMobileBottomBar.tsx`

**Changes**:

1. **Always show "Buy at Store" button**:
   - Remove confidence-based text switching
   - Always use: "Buy at [Store Name]"

2. **Simplify price display**:
   - Show price without "Estimated" label
   - Show "from [Store]" below
   - Remove "Verify at store" helper text

### Step 7: Update getCtaText Helper

**File**: `src/components/price/HonestPriceDisplay.tsx`

**Update the helper function**:

```typescript
// OLD
export function getCtaText(confidence: PriceConfidence | null | undefined, storeName: string = 'Store'): string {
  switch (confidence) {
    case 'high':
    case 'medium':
      return 'Buy Now';
    case 'low':
      return 'Check Current Price';
    case 'stale':
    case 'unknown':
    default:
      return `View at ${storeName}`;
  }
}

// NEW - Always "Buy at [Store]"
export function getCtaText(storeName: string = 'Store'): string {
  return `Buy at ${storeName}`;
}
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/price/HonestPriceDisplay.tsx` | Modify | Simplify labels, remove "Check Current Price" |
| `src/components/price/LivePriceCheckButton.tsx` | Modify | Convert to simple buy button or deprecate |
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Modify | Simplify layout, remove shipping progress |
| `src/components/filament/sidebar/StorePricingDisplay.tsx` | Modify | Add original price display, date format |
| `src/components/filament/sidebar/FilamentMobileBottomBar.tsx` | Modify | Simplify CTA text |
| `src/components/filament/tabs/PricingTabContent.tsx` | Modify | Merge sections, update buttons |
| `src/components/filament/SecondaryRetailers.tsx` | Minor | Update button text to "Buy" |

---

## Visual Comparison

### Before (Current Sidebar)

```text
┌────────────────────────────────────┐
│  [PLA]                             │
│                                    │
│  Estimated price                   │
│  ~£13.05/kg                        │
│  ⚠️ Last checked 3 days ago        │
│  May have changed - verify at store│
│                                    │
│  ┌──────────────────────────────┐  │
│  │  🔄 Check Current Price      │  │
│  └──────────────────────────────┘  │
│                                    │
│  ━━━━━━━━━━━━━━━░░░░░░░░░░░░░░     │
│  Add £15 for free shipping         │
│                                    │
│  [Compare]                         │
│                                    │
│  Best Price: Polymaker Store       │
│                                    │
│  View All 3 Retailers              │
│  ─────────────────────────────────│
│  ✓ Free shipping available         │
│  ↻ Easy returns policy             │
└────────────────────────────────────┘
```

### After (Simplified Sidebar)

```text
┌────────────────────────────────────┐
│  [PLA]                             │
│                                    │
│  £13.05/kg                         │
│  £9.99 per spool                   │
│                                    │
│  from Polymaker UK 🇬🇧              │
│  Price from Feb 2, 2026            │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  🛒 Buy at Polymaker UK   →  │  │
│  └──────────────────────────────┘  │
│                                    │
│  [Compare]                         │
│                                    │
│  ─────────────────────────────────│
│  Also available at:                │
│  🇺🇸 Amazon US  ~£12.50 ($15.99) [Buy]│
│  🇪🇺 3DJake EU  ~£11.99 (€13.99) [Buy]│
│                                    │
│  [Open Print Calculator]           │
└────────────────────────────────────┘
```

---

## Converted Price Display

For international stores, show original price in parentheses:

```text
~£13.05 ($16.99 USD)
from Amazon US 🇺🇸
Ships internationally • Duties may apply
```

---

## No Database Changes Required

All changes are frontend-only:
- Component refactoring
- Text/label changes
- Layout simplification

