
# Right-Side Utility Section Refinement

## Overview
Polish the navbar's right-side utilities (favorites, currency selector, user avatar) for consistent styling and improved visual hierarchy.

## Current State vs Target

### 1. User Avatar

| Property | Current | Target |
|----------|---------|--------|
| Size | `w-8 h-8` (32px) | `w-9 h-9` (36px) |
| Border | `border border-gray-700` | `border border-gray-700` (keep) |
| Background | `bg-gray-800` | `bg-gray-800` (keep) |
| Logged-out icon | `User` icon, `text-gray-400` | Same (already correct) |
| Logged-in initials | `text-xs font-medium text-white` | `text-sm font-medium text-white` |
| Hover | `hover:border-primary/50` | `hover:border-teal-500/50` with `transition-colors` |

### 2. Favorites Heart Icon

| Property | Current | Target |
|----------|---------|--------|
| Size | `h-5 w-5` (20px) | `w-5 h-5` (keep) |
| Color | `text-muted-foreground` | `text-gray-400` |
| Hover | `hover:text-foreground` | `hover:text-teal-400` |
| Indicator | Number badge (red bg) | Small teal dot (absolute, top-right) |
| Transition | None | `transition-colors duration-200` |

### 3. Currency Selector

| Property | Current | Target |
|----------|---------|--------|
| Text color | `text-foreground` | `text-gray-400` |
| Hover text | None | `hover:text-white` |
| Arrow size | `h-3.5 w-3.5` | `w-3 h-3` |
| Transition | None | `transition-colors duration-200` |

### 4. Utility Spacing

| Property | Current | Target |
|----------|---------|--------|
| Gap | `gap-2 md:gap-4` | `gap-4` (consistent 16px) |
| Divider | None | `h-6 w-px bg-gray-700` between nav and utilities |

---

## Files to Modify

### File 1: `src/components/Navbar.tsx`

**Utility container (line 339)**
- Change `gap-2 md:gap-4` to `gap-4`
- Add vertical divider before WishlistButton

**User Avatar - Logged in (lines 348-353)**
- Change `w-8 h-8` to `w-9 h-9`
- Change `hover:border-primary/50` to `hover:border-teal-500/50`
- Change initials `text-xs` to `text-sm`

**User Avatar - Logged out (lines 413-417)**
- Change `w-8 h-8` to `w-9 h-9`
- Change `hover:border-primary/50` to `hover:border-teal-500/50`

### File 2: `src/components/wishlist/WishlistButton.tsx`

**Button styling (lines 27-35, 41-54)**
- Change `text-muted-foreground` to `text-gray-400`
- Change `hover:text-foreground` to `hover:text-teal-400`
- Add `transition-colors duration-200`
- Replace number badge with small teal dot indicator

### File 3: `src/components/CurrencySelector.tsx`

**SelectTrigger styling (line 17)**
- Change text color to `text-gray-400`
- Add `hover:text-white`
- Add `transition-colors duration-200`

**ChevronDown (line 19)**
- Change `h-3.5 w-3.5` to `w-3 h-3`

---

## Implementation Details

### Teal Dot Indicator for Favorites
Replace the current number badge with a subtle dot:
```tsx
{stats.totalItems > 0 && (
  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-teal-500" />
)}
```

### Vertical Divider Before Utilities
Add before the utilities section in the navbar:
```tsx
<div className="hidden md:block h-6 w-px bg-gray-700" />
```

### Consistent Hover Transitions
Apply `transition-colors duration-200` to all interactive elements for smooth state changes.
