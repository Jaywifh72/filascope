
# Filament Detail Page Content Enhancement

## Summary
Enhance all four filament detail tabs and add a fifth "Reviews & Community" tab to improve content organization, user guidance, and conversion potential.

---

## Current State Analysis

### Existing Structure
- **4 tabs**: Overview, Specifications, Compatibility, Pricing
- **Overview**: Key features, Technical Accordion, Use Case Tags
- **Specifications**: Organized by category (Print Settings, Physical, Mechanical, Thermal, Storage, Appearance, Identifiers)
- **Compatibility**: Printer selector with temp comparison cards and status badges
- **Pricing**: Best price card, retailers list, placeholder for price history chart

### Available Data
- `price_history` table with columns: `filament_id`, `price`, `recorded_at`, `compare_at_price`, `currency`
- `usePriceHistory` hook already fetches 6 months of data with min/max/trend calculations
- `usePriceAlerts` hook exists (localStorage-based) but no UI component
- `PriceSparkline` component exists for visualization
- Filament properties: `use_case_tags`, `ease_of_printing_score`, `high_speed_capable`, `tg_c`, `hdt_045_mpa_c`

---

## Implementation Plan

### Tab 1: Overview Enhancements

**A. Product Summary (AI-generated from specs)**
Add a 2-3 sentence summary at the top that synthesizes key properties:
```
"A high-quality [material] from [brand] optimized for [primary use case]. 
Features [key highlight like high-speed printing or AMS compatibility] with 
[ease level] print difficulty. Best suited for [applications]."
```

Logic for summary generation:
- Pull from: material, vendor, ease_of_printing_score, high_speed_capable, use_case_tags
- Format as prose paragraph with key callouts

**B. "Ideal For" Tags**
Add a new section below summary with positive recommendations:
- Infer from `ease_of_printing_score >= 7`: "Beginners"
- Infer from `use_case_tags` containing "functional": "Functional Parts"  
- Infer from `use_case_tags` containing "art" or "decorative": "High Detail Prints"
- Infer from `high_speed_capable`: "High-Volume Printing"

**C. "Not Recommended For" Warnings**
Add conditional warnings based on properties:
- If `tg_c < 60` or `hdt_045_mpa_c < 70`: "Not for high-heat applications"
- If `is_nozzle_abrasive`: "Requires hardened steel nozzle"
- If `moisture_sensitivity_level === 'High'`: "Needs dry storage"

**Files to modify**: `src/components/filament/tabs/OverviewTabContent.tsx`

---

### Tab 2: Specifications Enhancements

**A. Add Comparison Context**
For each specification group, add contextual benchmarks:
- "Average PLA nozzle temp is 200-220°C — this is [standard/above average/below average]"
- Compare tensile strength to material family averages
- Highlight values that are exceptional (top 10% or bottom 10%)

**B. Visual Indicators**
- Add color-coded indicators for values vs. category averages
- Green badge for "Above Average", Amber for "Standard", Red for "Below Average"

**Files to modify**: `src/components/filament/tabs/SpecificationsTabContent.tsx`

---

### Tab 3: Compatibility Enhancements

**A. Add "Verified Compatible" vs "Should Work" Badges**
- Verified: When we have actual user confirmation or manufacturer data
- Should Work: Based solely on temperature calculations
- Not Recommended: Temperature or feature incompatibility

**B. Highlight User's Printer**
If user has a saved printer via System Config:
- "Compatible with your Bambu Lab H2C" with check icon
- Show this prominently at the top of the tab

**Files to modify**: `src/components/filament/tabs/CompatibilityTabContent.tsx`

---

### Tab 4: Pricing Tab Overhaul

**A. Full Price History Chart**
Replace the placeholder with an actual interactive chart:
- Toggle between 30-day and 90-day views
- Line chart using the existing `usePriceHistory` hook
- Show min/max markers on the chart
- Display date and price on hover

**B. Historical Low Indicator**
Show a prominent callout:
- "Lowest price ever: $12.99 on Nov 15, 2024"
- Compare current price to historical low
- "Current price is X% above the all-time low"

**C. "Set Price Alert" Button**
Create a modal-based price alert system:
- Button: "Set Price Alert" with bell icon
- Modal with slider or input for target price
- Uses existing `usePriceAlerts` hook for localStorage persistence
- Shows "Alert set for $X" confirmation badge

**Files to modify**: 
- `src/components/filament/tabs/PricingTabContent.tsx`
- Create new: `src/components/filament/PriceAlertModal.tsx`
- Create new: `src/components/filament/PriceHistoryChart.tsx`

---

### Tab 5: New "Reviews & Community" Tab

**A. Tab Registration**
Add new tab to FilamentTabNav:
```typescript
type FilamentTab = "overview" | "specifications" | "compatibility" | "pricing" | "community";
```

**B. Community Tab Content**
Create new component with three sections:

1. **Aggregated Reviews** (placeholder for future scraping)
   - Display area for reviews from retailers
   - Currently show: "Reviews coming soon - we're aggregating ratings from trusted sources"

2. **Forum Discussions**
   - Link cards to relevant Reddit discussions
   - Search pattern: `site:reddit.com [brand] [material] filament`
   - Show as external link cards with Reddit icon

3. **Community Photos** (future feature placeholder)
   - Grid area for user-submitted print photos
   - "Upload your print" CTA (links to future feature)
   - Currently show: "Be the first to share a print with this filament"

**Files to create**:
- `src/components/filament/tabs/CommunityTabContent.tsx`

**Files to modify**:
- `src/components/filament/tabs/FilamentTabNav.tsx`
- `src/components/filament/tabs/index.ts`
- `src/pages/FilamentDetail.tsx`

---

## Technical Details

### Component Structure

```text
FilamentDetail.tsx
├── FilamentTabNav (add "Community" tab)
├── OverviewTabContent
│   ├── ProductSummary (new)
│   ├── IdealForTags (new)
│   ├── NotRecommendedWarnings (new)
│   ├── KeyFeatures (existing)
│   └── TechnicalDetailsAccordion (existing)
├── SpecificationsTabContent
│   ├── SpecTable (enhanced with comparison context)
│   └── ComparisonBadge (new helper)
├── CompatibilityTabContent
│   ├── UserPrinterHighlight (new)
│   └── VerifiedBadge (new)
├── PricingTabContent
│   ├── BestPriceCard (existing)
│   ├── PriceHistoryChart (new)
│   ├── HistoricalLowIndicator (new)
│   ├── PriceAlertButton + Modal (new)
│   └── RetailersList (existing)
└── CommunityTabContent (new)
    ├── ReviewsSection
    ├── ForumLinksSection
    └── CommunityPhotosSection
```

### Helper Functions to Add

**generateProductSummary(filament)**
```typescript
function generateProductSummary(filament: Filament): string {
  const easeLabel = getEaseLabel(filament.ease_of_printing_score);
  const highlights = [];
  if (filament.high_speed_capable) highlights.push('high-speed printing support');
  if (filament.spool_ams_fit) highlights.push('AMS compatibility');
  // Generate prose summary
}
```

**inferIdealForTags(filament)**
```typescript
function inferIdealForTags(filament: Filament): string[] {
  const tags: string[] = [];
  if (filament.ease_of_printing_score >= 7) tags.push('Beginners');
  if (filament.use_case_tags?.some(t => t.includes('functional'))) tags.push('Functional Parts');
  // etc.
  return tags;
}
```

**getComparisonContext(material, field, value)**
```typescript
function getComparisonContext(material: string, field: string, value: number): {
  label: string;
  status: 'above' | 'standard' | 'below';
} {
  const averages = MATERIAL_AVERAGES[material];
  // Compare and return context
}
```

### Price Alert Modal Props
```typescript
interface PriceAlertModalProps {
  filamentId: string;
  currentPrice: number;
  isOpen: boolean;
  onClose: () => void;
}
```

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `OverviewTabContent.tsx` | Modify | Add ProductSummary, IdealForTags, NotRecommendedWarnings sections |
| `SpecificationsTabContent.tsx` | Modify | Add comparison context badges to SpecTable |
| `CompatibilityTabContent.tsx` | Modify | Add UserPrinterHighlight and Verified badges |
| `PricingTabContent.tsx` | Modify | Replace placeholder with PriceHistoryChart, add PriceAlertButton |
| `FilamentTabNav.tsx` | Modify | Add "Community" tab to TABS array and type |
| `index.ts` | Modify | Export CommunityTabContent |
| `FilamentDetail.tsx` | Modify | Import and render CommunityTabContent |
| `PriceHistoryChart.tsx` | Create | Interactive chart with 30/90 day toggle |
| `PriceAlertModal.tsx` | Create | Modal for setting price alerts |
| `CommunityTabContent.tsx` | Create | New tab with reviews, forums, photos sections |

---

## Dependencies
- Uses existing `usePriceHistory` hook (no changes needed)
- Uses existing `usePriceAlerts` hook (no changes needed)
- Uses existing `PriceSparkline` as reference for chart styling
- May use `recharts` for the full price history chart (already installed)

---

## Estimated Scope
- 3 new components to create
- 6 existing components to modify
- No database changes required
- No new dependencies needed
