# Memory: architecture/regional-pricing-card-priority-v1
Updated: 2026-02-01

The FilamentCard component implements a **regional price priority system** to prevent inconsistencies between card views and detail views.

## Problem Solved
Cards were showing ~€16.81/kg (USD converted to EUR) while detail pages showed €22.99/kg (actual EUR price from `price_eur` column). This was caused by `useCurrentPrice` fetching live prices from potentially wrong regional URLs and overriding accurate database prices.

## Solution Architecture

1. **Priority Check**: When `isActualRegionalPrice` is true (from `useRegionalPrice` hook), the card trusts the database regional price (e.g., `price_eur`) directly without live price fetching.

2. **Conditional Live Fetching**: `useCurrentPrice` is only called when `shouldFetchLivePrice = !isActualRegionalPrice`. This prevents unnecessary scraping and avoids currency mismatches.

3. **Price Resolution**:
   ```tsx
   const effectivePrice = isActualRegionalPrice 
     ? regionalPrice  // Trust database regional price
     : (isLivePrice && livePrice ? livePrice : regionalPrice);
   ```

## Key Files
- `src/components/FilamentCard.tsx`: Main implementation
- `src/hooks/useRegionalPrice.ts`: Provides `isActualRegionalPrice` flag
- `src/hooks/useCurrentPrice.ts`: Live price fetching (bypassed when regional price exists)

## Data Flow
1. `useRegionalPrice` checks `price_eur`, `price_gbp`, etc. columns
2. If column has value → `isActualRegionalPrice = true`, `regionalPrice = value`
3. FilamentCard skips `useCurrentPrice` call entirely
4. Price displays correctly in native regional currency
