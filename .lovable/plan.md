
# Plan: Fix Scoring Sort Order Mismatch

## Problem Analysis

The "Scoring: High to Low" sort displays products in unexpected order because:

1. **Sorting uses one score algorithm** (`filamentScoring.ts` - value/brand score)
2. **Cards display a different score algorithm** (`scoreCalculation.ts` - ease of printing score)

This means a product sorted high (8.0 value score) might display a lower ease-of-printing score (e.g., 6.5), making the sort order appear wrong to users.

## Root Cause

| Location | Algorithm | Measures |
|----------|-----------|----------|
| `Finder.tsx` sorting | `scoringContext.getScore()` | Price competitiveness, brand reputation, data quality, features |
| `LabReadoutCard.tsx` display | `calculateEaseBreakdown()` | Material difficulty, temperature range, drying requirements |

Users see the ease-of-printing score on cards but products are sorted by value score - these are fundamentally different metrics.

## Solution

Change the sorting algorithm to use the **same score that's displayed on cards** (ease-of-printing), so what users see matches the sort order.

### Implementation

**File: `src/pages/Finder.tsx`**

1. Import `calculateEaseBreakdown` from `scoreCalculation.ts`
2. Replace the `getScore` function in the sort comparator to use `calculateEaseBreakdown` instead of `scoringContext.getScore()`
3. Remove the unused `scoringContext` creation since it won't be needed for sorting

### Code Changes

```typescript
// Before (lines 1360-1364)
const getScore = (filament: typeof a) => {
  if (!scoringContext) return 5;
  return scoringContext.getScore(filament as FilamentForScoring);
};

// After
const getScore = (filament: typeof a) => {
  // Use the same score calculation as displayed on cards
  const breakdown = calculateEaseBreakdown(filament as FilamentDataForScoring);
  return breakdown.score ?? 5;
};
```

### Why This Works

- **Consistency**: Users see 8.0 on a card → that product sorts as 8.0
- **Predictability**: Products visually appear in the order users expect
- **No UI changes needed**: The cards already display the correct score

### Optional Enhancement: Secondary Sort

When products have the same score, add a secondary sort by:
1. Price per kg (lower is better)
2. Brand name (alphabetical)

```typescript
case "scoring-desc": {
  const scoreA = getScore(a);
  const scoreB = getScore(b);
  if (scoreB !== scoreA) return scoreB - scoreA;
  // Secondary sort by price (lower first)
  return getPricePerKg(a) - getPricePerKg(b);
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Finder.tsx` | Update `getScore` function in sort comparator to use `calculateEaseBreakdown`; optionally remove unused `scoringContext` memoization |

## Testing

After implementation, verify:
- First products shown have scores of ~9.0+ (PLA materials)
- Products are ordered 10.0 → 9.x → 8.x → 7.x etc.
- The score displayed on each card matches its position in the sorted list
- PETG/ABS materials (harder to print) appear lower in the list when sorted by score
