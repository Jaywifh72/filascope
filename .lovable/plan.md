
# Navbar Styling Polish Plan

## Overview
Refine the navbar component for visual consistency with the site's "High-End Laboratory" design system. This includes updating the Compare button styling, navigation link hover states, user avatar appearance, and overall navbar depth/background.

## Changes Summary

### 1. Compare Button Refinement
**Current**: Uses `border-primary/50` with outline variant
**Target**: Clean ghost button with solid teal border

| Property | Value |
|----------|-------|
| Border | `border border-primary` (solid 1px teal) |
| Background | `bg-transparent` |
| Hover | `hover:bg-primary/10` with border staying solid |
| Border Radius | `rounded-lg` |
| Padding | `px-4 py-2` |
| Transition | `transition-all duration-200` |

### 2. Navigation Link Hover States
**Current**: Default `text-foreground/80`, hover to `text-primary`
**Target**: Start at `text-gray-400`, hover to `text-white`

- Default state: `text-gray-400`
- Hover state: `hover:text-white`
- Active state: `text-primary` (keep teal for active)
- Transition: `transition-colors duration-200` (already present)
- Underline animation: Keep existing teal underline for active state

### 3. User Avatar Circle
**Current**: `w-8 h-8`, `border-border/50`, `bg-muted`
**Target**: Refined dark styling with subtle border

| Property | Value |
|----------|-------|
| Size | `w-8 h-8` (32px - already correct) |
| Background | `bg-gray-800` |
| Border | `border border-gray-700` |
| Initials Color | `text-white` |
| Icon Color (logged out) | `text-gray-400` |
| Hover | `hover:border-primary/50` (keep existing) |

### 4. Overall Navbar Polish
**Current**: Inline styles for background, gradient border
**Target**: Consistent shadow and proper depth

| Property | Value |
|----------|-------|
| Background | Keep `hsla(220, 20%, 4%, 0.9)` with backdrop-blur |
| Position | `sticky top-0 z-50` (already correct) |
| Shadow | `shadow-[0_1px_3px_rgba(0,0,0,0.3)]` applied to nav element |
| Border | Keep subtle gradient border at bottom |

---

## Technical Implementation

### File: `src/components/Navbar.tsx`

**LabNavLink Component (lines 82-98)**
Update the styling for navigation links:
- Change `text-foreground/80` to `text-gray-400`
- Change `hover:text-primary` to `hover:text-white`
- Keep `text-primary` for active state

**Compare Button (lines 207-220)**
Update button classes:
- Remove `variant="outline"` and `size="sm"`
- Apply custom classes: `border border-primary bg-transparent hover:bg-primary/10 rounded-lg px-4 py-2`
- Keep active state styling

**Avatar Components (lines 229-303)**
Update both logged-in and logged-out avatar styles:
- Change `bg-muted` to `bg-gray-800`
- Change `border-border/50` to `border-gray-700`
- Change `text-muted-foreground` to `text-white` for initials
- Change fallback icon color to `text-gray-400`

**Navbar Container (lines 103-115)**
Add shadow class to the nav element:
- Add `shadow-[0_1px_3px_rgba(0,0,0,0.3)]`
- Can remove the inline boxShadow from the border div

---

## Visual Consistency References

These changes align with existing patterns:
- **Compare button**: Matches `SlicerTopPickCard.tsx` pattern with `border-primary/30 hover:border-primary/50 hover:bg-primary/10 rounded-lg`
- **Avatar styling**: Uses `bg-gray-800` which is common in sidebars and cards across the site
- **Shadow depth**: Matches `shadow-md shadow-black/10` used in sticky headers on reference pages
