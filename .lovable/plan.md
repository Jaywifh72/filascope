

## Make Filter Parameters Sidebar Sticky with Custom Scrollbar

The sidebar is already partially sticky (`sticky top-20` on the outer container, and uses a `ScrollArea` component internally). The changes needed are minor adjustments to match the exact requested styling.

### Changes

**File: `src/components/printers/PrintersLeftSidebar.tsx`**

1. **Update the outer container** (line 138): Confirm `sticky top-20` is present (already is), and add `max-h-[calc(100vh-5rem)] overflow-y-auto` directly to the outer div.

2. **Replace the ScrollArea component** (line 148): Remove the `<ScrollArea>` wrapper (which uses Radix's custom scrollbar) and replace it with a plain `<div>` that inherits the parent's overflow scrolling. The custom scrollbar classes `scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent` will be applied to the outer sticky container.

3. **No other changes**: Sidebar content, expand/collapse behavior, Sort By section, sidebar width (w-72), and main content grid remain untouched.

### Technical Details

- The outer `<div>` at line 136-139 becomes: `w-72 shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent`
- The `<ScrollArea className="max-h-[calc(100vh-180px)]">` on line 148 is replaced with a plain `<div>` (no className needed for height/overflow since the parent handles it)
- Tailwind's `scrollbar-thin` utilities require the `tailwind-scrollbar` plugin; if not installed, we will add it as a dependency. Alternatively, we can use inline CSS or a utility class with custom CSS for the thin scrollbar styling.
- The `ScrollArea` import from `@/components/ui/scroll-area` can be removed if no longer used in this file.

