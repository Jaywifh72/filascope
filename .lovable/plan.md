

# Mobile Navigation Overhaul: Bottom Tab Bar + Compact Header

## Overview
Replace the current hamburger-only mobile navigation with a native app-style bottom tab bar for instant access to key actions, a compact 48px mobile header, and scroll-aware hide/show behavior on the tab bar.

## Part A: Compact Mobile Header

**File: `src/components/Navbar.tsx`**

Modify the mobile-only portion of the nav (below `md` breakpoint):

- Restructure the top bar contents for screens `< md`:
  - **Left**: FilaScope logo scaled to `max-h-7`
  - **Right**: Search icon (opens existing `SearchCommandPalette`), Region flag (existing `RegionSelector`), hamburger `Menu` icon
  - Remove from mobile header: nav links, Compare button, Saved, Recently Viewed, Theme toggle, Account avatar (all move to bottom tab bar or "More" sheet)
- Keep `sticky top-0 z-50` and the existing scroll-aware background transition
- Constrain mobile header to `h-12` (48px) with `py-0` padding overrides on mobile
- The existing hamburger menu content becomes the fallback for items not in the bottom tab bar (though most items now live in the "More" bottom sheet)

## Part B: Bottom Tab Bar Component

**New file: `src/components/navigation/MobileBottomTabBar.tsx`**

Create a fixed-bottom tab bar, visible only below `md` breakpoint (`md:hidden`), with 5 tabs:

| Tab | Icon | Route/Action |
|-----|------|--------------|
| Browse | `Search` | Navigate to `/` |
| Printers | `Printer` | Navigate to `/printers` |
| Compare | `GitCompareArrows` | Navigate to `/compare` (with badge from `useCompare`) |
| Deals | `Tag` | Navigate to `/deals` (red dot if active deals via `useDealsCount`) |
| More | `Menu` | Opens a bottom sheet |

Styling:
- `fixed bottom-0 left-0 right-0 z-40 md:hidden`
- `h-16 pb-[env(safe-area-inset-bottom)]`
- `bg-background/95 backdrop-blur-xl border-t border-border/50`
- Each tab: `flex flex-col items-center justify-center gap-0.5`, icon `w-5 h-5`, label `text-[10px] font-medium`
- Active tab: `text-primary` with a small 4px dot above the icon
- Tap: `active:scale-95 transition-transform duration-75`
- Compare tab special: badge overlay (same style as desktop), subtle `ring-1 ring-primary/30 rounded-full p-1.5` when items selected

## Part C: "More" Bottom Sheet

**New file: `src/components/navigation/MobileMoreSheet.tsx`**

Uses the existing `BottomSheet` component from `src/components/filament/mobile/BottomSheet.tsx`. Contains organized sections:

1. **Navigation**: Brands, Learn/Guides (Material Knowledge Base, Slicer Directory, HueForge Tools)
2. **Your Activity**: Saved Items, Recently Viewed
3. **Settings**: Theme toggle (inline switch), Region selector
4. **Account**: Sign in / Account + Sign out

Each item rendered as a tappable row with icon + label, consistent with existing `MobileNavLink` styling.

## Part D: Scroll-Aware Tab Bar Hide/Show

**New hook: `src/hooks/useScrollDirection.ts`**

Tracks scroll direction using `requestAnimationFrame`-throttled scroll listener:
- Returns `'up' | 'down' | null`
- Compares `window.scrollY` to previous value
- Used in `MobileBottomTabBar` to apply `translate-y-full` (hidden) on scroll-down and `translate-y-0` (visible) on scroll-up
- Transition: `duration-200 ease-out`

## Part E: Layout Spacing

**File: `src/App.tsx`**

Add `pb-20 md:pb-0` to the `<main>` element to prevent content from being hidden behind the fixed tab bar on mobile.

## Part F: Compare Tray Integration

The existing `UnifiedMobileCompareTray` renders at the bottom on mobile. When it's visible, the tab bar's Compare tab serves as the primary access point. No stacking conflict since navigating to `/compare` replaces the tray with the full compare page. The tab bar sits at `z-40` while compare tray overlays are at `z-50+`.

## Files Changed

| File | Action |
|------|--------|
| `src/components/Navbar.tsx` | Modify mobile header layout (hide utility icons below md, compact height) |
| `src/components/navigation/MobileBottomTabBar.tsx` | **New** — 5-tab bottom bar |
| `src/components/navigation/MobileMoreSheet.tsx` | **New** — "More" bottom sheet content |
| `src/hooks/useScrollDirection.ts` | **New** — scroll direction detection hook |
| `src/App.tsx` | Add bottom tab bar component + mobile padding |

## Technical Notes
- All changes are mobile-only (`md:hidden` / responsive classes) — desktop and tablet nav unchanged
- Uses existing `useCompare`, `useDealsCount`, `useAuth` hooks
- Reuses existing `BottomSheet` component for the "More" menu
- The hamburger menu in the header can remain as a fallback but the bottom tab bar becomes the primary mobile navigation
- `prefers-reduced-motion` respected via `motion-reduce:` Tailwind variants on animations
- Safe area insets handled via `env(safe-area-inset-bottom)` for notched devices

