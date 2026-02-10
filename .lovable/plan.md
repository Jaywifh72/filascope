

# Fix Dark Logo Visibility on Brand Cards

## Problem

After migrating logos to Supabase Storage, many brand logos with dark content on transparent backgrounds are nearly invisible against the dark card backgrounds. The current backdrop (`dark:bg-white/[0.07]`) provides almost no contrast.

## Changes

### 1. Increase logo backdrop opacity in BrandCard (`src/components/brands/BrandCard.tsx`, line 73)

Change the logo container background from `dark:bg-white/[0.07]` to `dark:bg-white/20`. This creates a visible semi-transparent light pill behind all logos in dark mode, making dark logos readable while not washing out bright/colorful ones.

```
Before: bg-white/10 dark:bg-white/[0.07]
After:  bg-white/10 dark:bg-white/20
```

### 2. Apply a mild global brightness boost in BrandLogo (`src/components/ui/BrandLogo.tsx`, line 61)

Add `dark:brightness-150` to ALL logo images (not just Fiberlogy). A 1.5x brightness lift makes dark logos more visible while having negligible effect on already-bright logos. The Fiberlogy-specific `dark:brightness-[2.5]` override remains and takes precedence since it's more specific.

```
Before: needsBrightness && "dark:brightness-[2.5]"
After:  "dark:brightness-150", needsBrightness && "dark:brightness-[2.5]"
```

Since Tailwind's `brightness-150` outputs `filter: brightness(1.5)` and the Fiberlogy check adds `brightness-[2.5]`, the last matching class wins for Fiberlogy, preserving its stronger boost.

## Files Changed

| File | Line | Change |
|------|------|--------|
| `src/components/brands/BrandCard.tsx` | 73 | `dark:bg-white/[0.07]` to `dark:bg-white/20` |
| `src/components/ui/BrandLogo.tsx` | 61 | Add `"dark:brightness-150"` to all logo images |

## Impact

- Anycubic, FormFutura, Proto-Pasta, Eryone -- dark logos become clearly visible
- Polymaker, eSun, Amolen, Bambu Lab -- bright logos unaffected (1.5x on already-bright colors is imperceptible)
- Fiberlogy -- retains its 2.5x boost
- Light mode -- no change (filters are `dark:` prefixed)
- Other pages using BrandLogo (filament cards, admin health grid) -- get the same mild brightness boost, improving consistency

