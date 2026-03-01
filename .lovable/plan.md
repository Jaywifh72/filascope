

# Add Persistent HueForge Tools Sub-Navigation Bar

## Overview
Create a shared sticky tab bar that appears at the top of all 6 HueForge tool pages, providing instant navigation between tools without losing context. This replaces the ad-hoc button row in the TD Database hero and complements the existing bottom cross-links.

## New Component: `HueForgeToolsNav`

**File:** `src/components/hueforge/HueForgeToolsNav.tsx`

A horizontal tab bar driven by the existing `HUEFORGE_TOOLS` data in `HueForgeToolsData.ts`, plus an "Export CSV" action tab.

- Uses `useLocation()` to highlight the active tab with a cyan bottom border
- Each tab renders the tool's Lucide icon + short name, linking via React Router `<Link>`
- The "Export CSV" tab receives an optional `onExportCsv` callback prop -- when provided and clicked, it triggers the export and shows a toast; when not provided (non-TD-Database pages), it's hidden
- Sticky positioning: `sticky top-16 z-30` (below the 64px main navbar)
- Adds a bottom shadow when scrolled via the existing `useStickyElement` hook pattern

**Styling:**
- Container: `bg-background/80 backdrop-blur-sm border-b border-border`
- Active tab: `border-b-2 border-cyan-500 text-cyan-400 font-medium`
- Inactive tab: `text-muted-foreground hover:text-foreground transition-colors`
- Each tab: `px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2`

**Mobile:**
- `overflow-x-auto` with `snap-x snap-mandatory`, each tab `snap-start`
- Right-edge fade gradient via a `::after` pseudo-element (CSS class or inline div) to hint at scrollability
- On screens under 480px, hide tab labels and show icons only using a responsive utility class

## Pages to Update (5 files)

Each page gets `<HueForgeToolsNav />` inserted right after the `<Breadcrumbs>` component and before the main content wrapper. On the TD Database page, the `onExportCsv` prop is passed so the Export CSV tab works.

### 1. `src/pages/HueForgeTDDatabase.tsx`
- Add `<HueForgeToolsNav onExportCsv={exportCSV} />` after breadcrumbs
- Remove the 6-button row in the hero section (lines ~480-516) since the sticky nav replaces it -- keep the "Search the Database" CTA and "learn about TD values" link

### 2. `src/pages/HueForgeSubstituteFinder.tsx`
- Add `<HueForgeToolsNav />` after `<Breadcrumbs>`

### 3. `src/pages/HueForgeLayerPreview.tsx`
- Add `<HueForgeToolsNav />` after `<Breadcrumbs>`

### 4. `src/pages/HueForgeColorMatcher.tsx`
- Add `<HueForgeToolsNav />` after breadcrumbs (need to check if breadcrumbs exist; add if missing)

### 5. `src/pages/HueForgeProjectPlanner.tsx`
- Add `<HueForgeToolsNav />` after `<Breadcrumbs>`

## Breadcrumb Consistency
Ensure all 5 sub-tool pages use the same breadcrumb pattern:
- Visible: `HueForge TD Database > [Tool Name]`
- Schema: `Home > HueForge TD Database > [Tool Name]`

The TD Database page itself keeps: `Home > HueForge TD Database`

## No Changes To
- `HueForgeToolsData.ts` -- reused as-is
- `HueForgeToolsCrossLinks.tsx` -- kept as bottom-of-page cross-links (complementary, not replaced)
- Routing, footer, or navbar

## Implementation Order
1. Create `HueForgeToolsNav.tsx` component
2. Update `HueForgeTDDatabase.tsx` -- add nav, remove redundant hero button row
3. Update the other 4 tool pages -- add nav + fix breadcrumbs if needed
