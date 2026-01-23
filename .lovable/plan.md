
# Compare Button Ghost Style Update

## Overview
Update the Compare button across all viewport sizes (desktop, tablet, mobile) to use a consistent ghost button style that differentiates it from primary CTA buttons.

## Current State vs Target

| Property | Current (Desktop/Tablet) | Current (Mobile) | Target |
|----------|-------------------------|------------------|--------|
| Background | `bg-transparent` | `bg-primary/10` | `bg-transparent` |
| Border | `border border-primary` | `border border-primary` | `border border-teal-500` |
| Text Color | `text-gray-400` | `text-primary` | `text-teal-400` |
| Hover BG | `hover:bg-primary/10` | `hover:bg-primary/20` | `hover:bg-teal-500/10` |
| Hover Text | `hover:text-white` | (none) | Keep `text-teal-400` |
| Padding | `px-4 py-2` | `px-4 py-3` | `px-4 py-2` (mobile: `py-3`) |
| Border Radius | `rounded-lg` | `rounded-lg` | `rounded-lg` |

## Changes

### File: `src/components/Navbar.tsx`

#### 1. Desktop Compare Button (lines 270-276)
Update classes to use explicit teal colors:
- Change `border-primary` → `border-teal-500`
- Keep `bg-transparent`
- Change `hover:bg-primary/10` → `hover:bg-teal-500/10`
- Change `text-gray-400 hover:text-white` → `text-teal-400`
- Active state: `bg-teal-500/10 text-teal-400`

#### 2. Tablet Compare Button (lines 324-330)
Apply same changes as desktop:
- `border-teal-500`
- `bg-transparent`
- `hover:bg-teal-500/10`
- `text-teal-400`

#### 3. Mobile Compare Button (lines 441-448)
Update to match ghost style while keeping it prominent:
- Change `bg-primary/10` → `bg-transparent`
- Change `hover:bg-primary/20` → `hover:bg-teal-500/10`
- Change `border-primary` → `border-teal-500`
- Keep `text-primary` or change to `text-teal-400`

## Visual Hierarchy Result

| Button Type | Style | Use Case |
|-------------|-------|----------|
| Ghost (Compare) | Transparent + teal border | Nav actions, secondary actions |
| Filled (Material Wizard) | Solid teal background | Primary CTAs in content area |

## Technical Notes
- Using explicit `teal-500` and `teal-400` colors instead of CSS variables (`primary`) ensures the ghost style is visually distinct
- The `hover:bg-teal-500/10` provides subtle feedback without competing with filled buttons
- Keeping `rounded-lg` maintains consistency with site-wide button styling
