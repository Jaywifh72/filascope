

# Enhanced Error States, Contextual Error Recovery, Image Fallbacks and Retry Logic

## Overview

Build a 4-tier error handling system plus an ImageWithFallback component, layered on top of existing infrastructure. The project already has a functional `ErrorBoundary`, `ApiErrorFallback`, `InlineError`, `retryWithBackoff`, `useApiError`, and `FilamentImageFallback`. This plan enhances and extends them.

---

## Step 1: Enhance the full-page ErrorBoundary

**File:** `src/components/analytics/ErrorBoundary.tsx`

All existing error logging (`logError`, `useErrorReporting`, `initializeGlobalErrorHandler`) remains completely untouched. Only the `render()` fallback UI and supporting state/methods change:

**New state fields:** `countdown: number | null`, `hasAutoRetried: boolean`

**New private method** `classifyError(error: Error)` returns one of:
- `'network'` -- `navigator.onLine === false` or message matches fetch/network/offline
- `'timeout'` -- message matches timeout/aborted
- `'server'` -- message matches 500/server/internal
- `'unknown'` -- default

Each type maps to a specific user-facing description string.

**Updated render fallback:**
- Icon container: `w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20` with a subtle `animate-pulse` wrapper at `opacity-30`
- `AlertTriangle` at 48x48 inside it
- Title: "Something went wrong"
- Contextual description based on `classifyError()`
- Error ID badge: `text-[10px] font-mono text-muted-foreground/50 bg-white/[0.04] px-2 py-1 rounded mt-3`, showing first 6 chars
- Three buttons: "Refresh Page" (primary), "Go Home" (outline), "Copy Error ID" (ghost, uses `navigator.clipboard.writeText` + toast)
- Auto-retry countdown (network/timeout only): 5-second countdown with a small 20px SVG circle progress indicator. Uses `componentDidUpdate` + `setInterval`. Checks `sessionStorage` key `error_boundary_retried` to prevent infinite loops. On reaching 0, sets the flag and calls `window.location.reload()`

**New imports added:** `Copy` from lucide-react, `toast` from hooks/use-toast

---

## Step 2: Create SectionError component

**New file:** `src/components/ui/SectionError.tsx`

A section-level error card for partial page failures (e.g., trending section fails but grid works).

- Container: `rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-6`
- Entrance animation: `animate-in fade-in slide-in-from-top-2 duration-300`
- Layout: `flex items-start gap-4`
- Left: `AlertTriangle` 24x24 `text-amber-500 flex-shrink-0`
- Right: title (`text-sm font-medium text-white`), description (`text-xs text-muted-foreground mt-1`, defaults to "This section failed to load. The rest of the page is working normally.")
- Actions row: "Try Again" outline small button (calls `onRetry`), "Dismiss" ghost button (sets internal `dismissed` state to true, returns null)
- Compact mode (`compact` prop): `p-4`, hides description, icon 18px, single-line layout
- Props: `title`, `description?`, `onRetry`, `onDismiss?`, `compact?`, `className?`

---

## Step 3: Enhance InlineError

**File:** `src/components/errors/ApiErrorFallback.tsx`

Update the existing `InlineError` component (lines 148-171) with refined styling:

- Change icon from `AlertTriangle` (w-4) to `AlertCircle` (14px) in `text-amber-500/70`
- Container: `inline-flex items-center gap-1.5` (was `flex items-center gap-2`)
- Text: `text-xs text-muted-foreground` (was `text-sm`)
- Retry link: `text-xs text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer` (was `text-primary hover:underline text-sm`)
- Add `AlertCircle` to imports

Backward compatible -- same props interface.

---

## Step 4: Create ImageWithFallback component

**New file:** `src/components/ui/ImageWithFallback.tsx`

**SEO-critical constraint:** Always renders a real `<img>` tag with `src` and `alt` in the DOM for prerender bots. Uses `opacity-0`/`opacity-100` transitions, never conditional removal.

**State machine:** `useState<'loading' | 'loaded' | 'error'>`:
- No src (null/undefined/empty): immediately `'error'`, `<img>` has `aria-hidden="true"`
- Has src: starts `'loading'`, `onLoad` transitions to `'loaded'`, `onError` triggers single auto-retry after 2s with cache-bust `?_retry=1`, second failure sets `'error'`

**Structure:**
- Outer wrapper: `relative overflow-hidden` with aspect-ratio from prop
- `<img>`: `absolute inset-0 w-full h-full object-cover transition-opacity duration-300`, `loading="lazy"`, opacity based on state
- Overlay (absolute inset-0): Skeleton pulse during loading, contextual fallback during error

**Fallback visuals per type** (all on `bg-white/[0.02]`):
- `"filament"`: Reuses existing `FilamentImageFallback` component (passes through `colorHex` and `material` props)
- `"printer"`: Lucide `Printer` icon at 48px `text-muted-foreground/30`, "Image coming soon" text below
- `"brand"`: First letter of `brandName` as `text-3xl font-bold text-muted-foreground/30`
- `"guide"`: `BookOpen` icon at 40px `text-muted-foreground/20`
- `"generic"`: `ImageOff` icon at 40px `text-muted-foreground/20`

**Props:** `src`, `alt`, `type`, `brandName?`, `colorHex?`, `material?`, `aspectRatio?` (default `'4/3'`), `className?`, `containerClassName?`

---

## Step 5: Create retry utility with jitter

**New file:** `src/lib/retry.ts`

Complements the existing `retryWithBackoff.ts` (which lacks jitter and smart shouldRetry).

```text
RetryOptions {
  maxRetries: number       // default 2
  baseDelay: number        // default 1000ms
  maxDelay: number         // default 8000ms
  backoffMultiplier: number // default 2
  shouldRetry: (error: any) => boolean
}
```

`withRetry<T>(fn, options)`:
- First call immediate
- Retry delays: `min(baseDelay * multiplier^attempt, maxDelay) * (0.8 + Math.random() * 0.4)` (20% jitter)
- Default `shouldRetry`: true for `TypeError` (fetch failures) and 5xx status, false for 4xx

---

## Step 6: Create useRetry hook

**New file:** `src/hooks/useRetry.ts`

React hook wrapper around `withRetry`:
- Returns `retryWithBackoff` function, `isRetrying` boolean, `retryCount` number
- Manages state tracking, resets on success

---

## Step 7: Integration targets (documented, not implemented)

These locations are identified for future integration work:

**ImageWithFallback:**
- Filament card spool images (type="filament" with colorHex/material)
- Printer card images (type="printer")
- Brand card logos (type="brand" with brandName)
- Homepage brand carousel logos (type="brand")
- Deal card product images (type="filament")

**SectionError:**
- Homepage "Trending in [Region]" section
- Homepage "Browse All Filaments" grid
- Homepage brand logo carousel
- Deals page stats bar

---

## Files Created/Modified Summary

| Action | File |
|--------|------|
| MODIFY | `src/components/analytics/ErrorBoundary.tsx` (enhance render UI, add error classification, auto-retry countdown, copy ID) |
| CREATE | `src/components/ui/SectionError.tsx` |
| MODIFY | `src/components/errors/ApiErrorFallback.tsx` (enhance InlineError styling) |
| CREATE | `src/components/ui/ImageWithFallback.tsx` |
| CREATE | `src/lib/retry.ts` |
| CREATE | `src/hooks/useRetry.ts` |

**What will NOT change:** All error logging functions, `useErrorReporting`, `initializeGlobalErrorHandler`, `retryWithBackoff.ts`, `useApiError.ts`, `ApiErrorFallback` (main component), `FilamentImageFallback`, any SEO/AEO elements, data fetching, routing.

