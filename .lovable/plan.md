
# Honest Price Display Transformation Plan

## Overview

Transform the price display system from showing potentially inaccurate "exact" prices to an honest, confidence-based approach that sets correct user expectations while still providing value. The core principle: **be honest about what we know and don't know**.

---

## Current Problem Analysis

Based on the investigation of product `5d9dde33-21a9-4ad3-adb8-4249c65994be`:

| Issue | Current State | Impact |
|-------|--------------|--------|
| Price accuracy | Shows $34.99, actual store price is $18.99 (sale) or $34.25 (regular) | Users feel misled |
| Data freshness | Price last scraped 18+ days ago | Stale data presented as current |
| Confidence distribution | 71% of products have "low" confidence | Most prices are unreliable |
| CTA wording | "BUY NOW" implies ready transaction | Sets wrong expectations |

---

## Solution: Confidence-Based Display Strategy

### Display Logic Based on Confidence Level

| Confidence | Age | Display Approach |
|------------|-----|------------------|
| **High** | < 24 hours | Show specific price with green indicator |
| **Medium** | 1-7 days | Show price with "~" prefix and blue indicator |
| **Low** | 7-30 days | Show "Estimated" label with amber warning |
| **Stale/Unknown** | > 30 days or none | Show "Price varies" with CTA to check store |

---

## Implementation Details

### Step 1: Create HonestPriceDisplay Component

**New File: `src/components/price/HonestPriceDisplay.tsx`**

A new unified component that intelligently displays pricing based on confidence:

**Component Props:**
- `price: number | null` - The database price
- `confidence: PriceConfidence` - Freshness level
- `lastVerifiedAt: string | Date | null` - Timestamp
- `storeName: string` - Retailer name for CTA
- `storeUrl: string | null` - Link to store
- `isConverted: boolean` - If currency was converted
- `currency: string` - Display currency

**Rendering Logic:**

1. **High Confidence (< 24h):**
   - Shows bold price with green checkmark
   - Label: "Current price"
   - Small text: "Verified today"

2. **Medium Confidence (1-7 days):**
   - Shows price with "~" prefix (approximate)
   - Label: "Recent price"
   - Small text: "Last checked X days ago"

3. **Low Confidence (7-30 days):**
   - Shows price in muted styling
   - Label: "Estimated price"
   - Warning: "May have changed - verify at store"
   - Prominent CTA button

4. **Stale/Unknown (> 30 days):**
   - No specific price shown
   - Icon + "Price varies"
   - Subtext: "Check {storeName} for current pricing"
   - Primary action: "View at {storeName}" button

### Step 2: Update FilamentPurchaseSidebar

**File: `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`**

**Changes:**
1. Replace current price display section with `<HonestPriceDisplay />` component
2. Change "BUY NOW" CTA text based on confidence:
   - High/Medium: "Buy Now" (standard)
   - Low/Stale: "Check Current Price" (sets expectations)
3. Add external link icon to all purchase CTAs
4. Remove any "Live price" terminology
5. Keep the existing conversion tooltip logic for regional prices

### Step 3: Update FilamentHeroPurchaseCard

**File: `src/components/filament/hero/FilamentHeroPurchaseCard.tsx`**

**Changes:**
1. Replace large price display with confidence-aware version
2. For stale prices, show a helpful message instead of potentially wrong number
3. Update CTA button text to match sidebar logic
4. Ensure mobile/desktop parity

### Step 4: Update FilamentMobileBottomBar

**File: `src/components/filament/sidebar/FilamentMobileBottomBar.tsx`**

**Changes:**
1. Use compact version of `HonestPriceDisplay`
2. Update button text based on confidence
3. Ensure touch-friendly sizing maintained

### Step 5: Update PriceWithFreshness Component

**File: `src/components/price/PriceWithFreshness.tsx`**

**Changes:**
1. Add support for "stale mode" where price is hidden
2. Update freshness text to be more explicit about uncertainty
3. Remove any "Verified" language for stale prices (misleading)
4. Add helper text encouraging users to check current price

### Step 6: Update PriceFreshnessIndicator 

**File: `src/components/price/PriceFreshnessIndicator.tsx`**

**Changes:**
1. Update labels for better clarity:
   - High: "Updated today" (keep)
   - Medium: "Updated this week" (clearer)
   - Low: "Last checked {X} ago - may be outdated"
   - Stale: "Price data outdated - verify at store"
2. Add more actionable tooltip text
3. For unknown: "No price data - check store"

---

## Visual Design Specifications

### High Confidence Display
```text
┌─────────────────────────────────────┐
│  Current price                      │
│  $34.99 /kg                        │
│  ✓ Updated today                    │
│                                     │
│  [═══════ BUY NOW ═══════]         │
└─────────────────────────────────────┘
```

### Low Confidence Display
```text
┌─────────────────────────────────────┐
│  Estimated price                    │
│  ~$34.99 /kg                       │
│  ⚠ Last checked 18 days ago        │
│  Price may have changed             │
│                                     │
│  [══ Check Current Price ══]       │
└─────────────────────────────────────┘
```

### Stale/Unknown Display
```text
┌─────────────────────────────────────┐
│  💲 Price varies                    │
│  Check Creality for current pricing │
│                                     │
│  [══ View at Creality ══]          │
│  Prices change with sales and stock │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### HonestPriceDisplay Component Structure

```typescript
interface HonestPriceDisplayProps {
  price: number | null;
  confidence: PriceConfidence;
  lastVerifiedAt: string | Date | null;
  storeName: string;
  storeUrl: string | null;
  isConverted?: boolean;
  currency?: string;
  conversionTooltip?: string | null;
  onBuyClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showCTA?: boolean;
}
```

**Key Logic:**
1. Determine display mode based on confidence
2. Format price with appropriate prefix (~, "from", or none)
3. Select appropriate label and helper text
4. Choose CTA text and styling
5. Handle currency conversion indicators

### Button Text Mapping

| Confidence | Button Text | Button Style |
|------------|-------------|--------------|
| high | "Buy Now" | Primary gradient |
| medium | "Buy Now" | Primary gradient |
| low | "Check Current Price" | Primary outline |
| stale | "View at {Store}" | Secondary |
| unknown | "Find Price" | Outline |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/price/HonestPriceDisplay.tsx` | Main confidence-aware price component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Integrate HonestPriceDisplay, update CTAs |
| `src/components/filament/hero/FilamentHeroPurchaseCard.tsx` | Integrate HonestPriceDisplay, update CTAs |
| `src/components/filament/sidebar/FilamentMobileBottomBar.tsx` | Use compact honest display |
| `src/components/price/PriceWithFreshness.tsx` | Add stale mode, update language |
| `src/components/price/PriceFreshnessIndicator.tsx` | Update labels for clarity |

---

## User Experience Benefits

1. **Trust Building**: Honest communication builds long-term user trust
2. **Reduced Frustration**: Users won't be surprised by different prices at store
3. **Clear Expectations**: CTAs tell users what to expect (checking vs buying)
4. **Value Preservation**: Still provides useful price guidance when data is fresh
5. **Action-Oriented**: Always gives users a clear next step

## Backward Compatibility

- All existing props remain supported
- Confidence calculation logic unchanged
- Regional pricing and conversion still work
- No database changes required
