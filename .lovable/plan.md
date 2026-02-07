
# Add Price History Sparkline to Product Detail Sidebar

## Overview
Add a compact, interactive price history sparkline to the filament detail sidebar that provides visual proof of price trends. Clicking it scrolls to (or opens) the full price history chart already in the Pricing tab. For products with insufficient data, show a "Price tracking started [date]" message instead.

## Data Reality Check
- **669** filaments have price history records (out of ~7,500 total)
- **659** of those have only **1 data point** (not enough for a sparkline)
- **10** filaments have 2+ points; **7** have 3+ points
- The sparkline will show for a small subset now, but the infrastructure scales as weekly scraping continues

This means the "insufficient data" fallback state will be the **most commonly seen** state initially, making it critical to design well.

## Implementation Approach

### 1. New Component: `SidebarPriceHistory`
**File:** `src/components/filament/sidebar/SidebarPriceHistory.tsx` (new)

A self-contained component that wraps the existing `usePriceHistory` hook and renders one of three states:

**State A -- Sparkline (3+ data points):**
- Reuses the existing `PriceSparkline` SVG component (zero additional bundle cost -- pure SVG, no Recharts)
- Height: 40px (matching existing sparkline sizing), full sidebar width
- Shows min/max point markers (green dot for low, red for high)
- Below the sparkline: a single-line summary like "Low: $18.50 | Avg: $21.30 | High: $24.00" in small text
- The entire sparkline area is clickable -- clicking scrolls to the Pricing tab and opens the full `PriceHistoryChart`
- Subtle hover effect with "View full history" tooltip

**State B -- Early tracking (1-2 data points):**
- Small text: "Price tracking started [formatted date]" with a clock icon
- No chart rendered, keeping the sidebar clean
- Clickable to scroll to the Pricing tab

**State C -- No data at all:**
- Renders nothing (silent absence, consistent with project convention for missing premium data like TD badges)

### 2. Integrate into `FilamentPurchaseSidebar`
**File:** `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`

- Import and place `SidebarPriceHistory` between the `PriceUrgencyBadge` block (line ~263) and the primary CTA button (line ~268)
- Pass `filamentId`, `currentPrice` (using `displayPricePerKg`), and a callback for scrolling to the pricing tab
- The component uses the user's regional currency via the existing `useRegion` context (already available in the sidebar)

### 3. Add Scroll-to-Pricing-Tab Callback
**File:** `src/pages/FilamentDetail.tsx`

- Add a `handleScrollToPricing` callback that:
  1. Sets the active tab to "pricing" (the tab containing `PriceHistoryChart`)
  2. Scrolls the pricing section into view using `scrollIntoView({ behavior: 'smooth' })`
- Pass this callback down through `FilamentPurchaseSidebar` as a new `onViewPriceHistory` prop

### 4. Currency Integration
- The sparkline component uses `useRegion().formatPrice` for the min/avg/high summary line -- same pattern as the rest of the sidebar
- The `usePriceHistory` hook returns raw numeric values; formatting happens at the display layer
- The `currencySymbol` prop on `PriceHistoryChart` (full chart) already receives the user's currency symbol from `PricingTabContent`

## Component Structure

```text
FilamentPurchaseSidebar
  +-- Material Badge
  +-- HonestPriceDisplay (price)
  +-- PriceUrgencyBadge ("Lowest in 6mo")
  +-- SidebarPriceHistory  <-- NEW
  |     State A: PriceSparkline + min/avg/high stats
  |     State B: "Price tracking started Jan 18" 
  |     State C: (renders nothing)
  +-- Buy Button (CTA)
  +-- Compare Button
  ...
```

## Technical Details

**No new dependencies** -- reuses:
- `PriceSparkline` (existing pure SVG component)
- `usePriceHistory` (existing hook, fetches from `price_history` table)
- `useRegion` (existing context for currency formatting)

**Props for `SidebarPriceHistory`:**
- `filamentId: string`
- `currentPrice: number | null` -- the resolved regional price per kg
- `onViewFullHistory?: () => void` -- callback to scroll/switch to pricing tab

**Performance:**
- The `usePriceHistory` hook is already called by `PriceUrgencyBadge` in the sidebar with the same `filamentId`. Both will share the same Supabase query result via React's render cycle (same effect dependencies). No duplicate network requests.
- The `PriceSparkline` is pure SVG with `useMemo` -- renders in microseconds.

**Responsive behavior:**
- Desktop (lg+): Sparkline appears in the 300px sticky sidebar
- Mobile: Not shown in the mobile bottom bar (too compact). Users can still access the full chart via the Pricing tab. The mobile bar remains focused on price + buy CTA.

## Files Changed

| File | Change |
|------|--------|
| `src/components/filament/sidebar/SidebarPriceHistory.tsx` | New component |
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Add SidebarPriceHistory below urgency badge |
| `src/components/filament/sidebar/index.ts` | Export new component (if needed) |
| `src/pages/FilamentDetail.tsx` | Add `onViewPriceHistory` callback, pass to sidebar |
