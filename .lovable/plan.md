

# Skeleton Loading Component System

## Overview

Create a composable skeleton primitive system and add missing skeleton components for Brand Cards, Guide Cards, and Table views. The project already has working skeletons for Filament, Printer, and Deal cards -- those will NOT be modified. New primitives provide a consistent building-block API for future skeletons.

---

## What Already Exists (No Changes)

- `src/components/ui/skeleton.tsx` -- base `Skeleton` with `animate-pulse` + `skeleton-shimmer`
- `src/components/FilamentCardSkeleton.tsx` -- used on `/filaments`, Finder
- `src/components/printers/PrinterCardSkeleton.tsx` -- used on `/printers`
- `src/components/deals/DealCardSkeleton.tsx` -- used on `/deals`
- `src/components/skeletons/` -- barrel file with BentoGrid, Filter, ProductDetail, Compare, Search, Page, Price, Vault skeletons
- `src/index.css` -- `.skeleton-shimmer` and `.skeleton-animated` CSS classes
- `tailwind.config.ts` -- existing keyframes (no shimmer yet)

---

## Step 1: Add `shimmer` keyframe to Tailwind config

Add to `tailwind.config.ts` keyframes:

```text
shimmer: {
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(100%)' }
}
```

And animation: `shimmer: 'shimmer 1.8s ease-in-out infinite'`

This enables `animate-shimmer` utility class for pseudo-element overlays.

---

## Step 2: Create skeleton primitives

**New file:** `src/components/ui/skeleton-primitives.tsx`

Four atomic components:

- **SkeletonBox** -- Rounded rectangle with shimmer pseudo-element overlay. Props: `width?`, `height?`, `className?`. Uses `bg-white/[0.06]` base with `::after` gradient sweep using `animate-shimmer`.

- **SkeletonText** -- Renders N lines of SkeletonBox at text heights (`h-3`/`h-4`/`h-6` for sm/md/lg). Last line at 60% width. Props: `lines?` (default 3), `size?` ('sm' | 'md' | 'lg').

- **SkeletonCircle** -- Circular skeleton element. Props: `size?` (number, default 40).

- **SkeletonImage** -- Aspect-ratio container with centered Lucide `ImageIcon` at `opacity-[0.15]`. Props: `aspectRatio?` (default '1/1'), `className?`.

All use CSS-only animation (no framer-motion). The shimmer is a `::after` pseudo-element so base color remains visible.

---

## Step 3: Create BrandCardSkeleton

**New file:** `src/components/skeletons/BrandCardSkeleton.tsx`

Matches `BrandCard.tsx` layout exactly:
- Outer: `min-h-[260px] rounded-xl border border-border overflow-hidden`
- Color accent bar: `h-1 w-full` skeleton
- Logo area: `h-[88px] bg-gray-800/60` with centered skeleton
- Price tier badge: top-left small skeleton
- Brand name: `h-6 w-2/3`
- Stats row: product count + rating skeletons
- Material badges: 3 small rounded-full skeletons
- Color dots: 8 small circles
- CTA: full-width `h-10 rounded-lg` with border-t

**BrandCardSkeletonGrid**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` (matches `/brands` grid), default 12 cards.

---

## Step 4: Create GuideCardSkeleton

**New file:** `src/components/skeletons/GuideCardSkeleton.tsx`

Matches `GuideCard` in LearningCenter.tsx:
- Outer: `bg-card/50 border-border rounded-xl` card
- Category badge: skeleton `h-5 w-20 rounded-full`
- Title: 2-line skeleton at `h-5`
- Description: 2-line skeleton at `h-4`
- Footer: read time (`h-4 w-20`) + date (`h-4 w-24`)

**GuideCardSkeletonGrid**: `grid sm:grid-cols-2 lg:grid-cols-3 gap-6`, default 6 cards.

---

## Step 5: Create TableSkeleton

**New file:** `src/components/skeletons/TableSkeleton.tsx`

For table view on `/filaments` and comparison pages:
- Header row: flex of 6-8 SkeletonBox at varying widths, `bg-white/[0.04]`
- Body rows (default 10): flex of matching-width skeletons, alternating `bg-white/[0.02]` for zebra striping
- Props: `rows?` (default 10), `columns?` (default 6)

---

## Step 6: Update barrel file

Update `src/components/skeletons/index.ts` to export all new components:
- `BrandCardSkeleton`, `BrandCardSkeletonGrid`
- `GuideCardSkeleton`, `GuideCardSkeletonGrid`
- `TableSkeleton`

---

## Step 7: Integration Points (identified, not implemented)

Pages currently using spinners/`Loading...` that should eventually use skeletons:

| File | Current Loading | Recommended Skeleton |
|------|----------------|---------------------|
| `src/pages/Brands.tsx` | Likely spinner | BrandCardSkeletonGrid |
| `src/pages/LearningCenter.tsx` | Likely spinner | GuideCardSkeletonGrid |
| `src/pages/AdminAffiliates.tsx` | `Loading...` text | (admin, low priority) |
| `src/pages/AdminScheduler.tsx` | `Loading...` text | (admin, low priority) |
| `src/pages/AdminSiteSettings.tsx` | `Loading...` text | (admin, low priority) |
| `src/pages/UserProfile.tsx` | Loader2 spinner | PageLoadingSkeleton |
| `src/pages/AdminDataHealth.tsx` | Loader2 spinner | (admin, low priority) |
| `src/pages/SharedWishlist.tsx` | Skeleton (partial) | Already has some |

These replacements are **out of scope** for this task per the constraints -- just documented for a follow-up step.

---

## Files Created/Modified

| Action | File |
|--------|------|
| MODIFY | `tailwind.config.ts` (add shimmer keyframe + animation) |
| CREATE | `src/components/ui/skeleton-primitives.tsx` |
| CREATE | `src/components/skeletons/BrandCardSkeleton.tsx` |
| CREATE | `src/components/skeletons/GuideCardSkeleton.tsx` |
| CREATE | `src/components/skeletons/TableSkeleton.tsx` |
| MODIFY | `src/components/skeletons/index.ts` (add new exports) |

No existing components, pages, data fetching, or routing will be touched.

