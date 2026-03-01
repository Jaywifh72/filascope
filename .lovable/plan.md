

# Reorder TD Database Page: Tools First, Education Second

## What Changes

The page currently renders ~3,500px of educational text and the Top 10 grid **above** the interactive database table. We will reorder sections so users reach the tool immediately, while keeping every word of educational content in the DOM for SEO crawlers.

## New Section Order

```text
1. Hero (unchanged) + NEW "Search the Database" jump CTA + bouncing arrow
2. Browse Filaments table (moved up from current position 4)
3. Top 10 Most Popular grid (moved up from position 3)
4. --- visual separator: "Understanding TD Values" ---
5. Educational content (4 sections, moved down -- all text intact)
6. Filaments Needing TD (unchanged)
7. TD Substitute Finder (unchanged)
8. Layer Preview Compact (unchanged)
9. FAQ accordion (unchanged)
10. Cross-links (unchanged)
11. People Also Ask (unchanged)
12. Related Content (unchanged)
```

## Specific Changes

### 1. Add "Search the Database" CTA after stats counters (line ~438)
- A large cyan button: "Search the Database" that smooth-scrolls to `#td-browser`
- Styled: `bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-lg text-lg`
- Below it: a bouncing `ChevronDown` arrow icon with `animate-bounce opacity-60`
- Secondary text link: "Or learn about TD values below" scrolling to `#td-education`
- The existing row of tool buttons remains unchanged below this new CTA

### 2. Reorder JSX sections in the return statement
- Move the "Browse Filaments by TD Value" section (currently lines 668-841, `id="td-table"`) to render immediately after the hero section, changing its `id` to `td-browser`
- Move the "Top 10 Most Popular" section (lines 613-665) to render right after the browse table
- Move all 4 educational content blocks (lines 478-611) to render after the Top 10, wrapped in a new container with `id="td-education"`

### 3. Add visual separator above educational content
- A `div` with `border-t border-gray-800 pt-12 mt-12`
- Brief intro text: "New to HueForge TD values? Read our complete guide below."
- The existing H2 headings within the educational sections remain untouched

### 4. Update scroll target in hero button
- The existing "Find Filaments by TD Value" button (line 442) currently scrolls to `#td-table` -- update to `#td-browser` to match the new section id

## What Does NOT Change
- No content is hidden, collapsed, or removed from the DOM
- All 4 structured data schemas (BreadcrumbList, Dataset, FAQPage, HowTo) remain identical
- All H2/H3 headings keep their text and hierarchy
- All internal links within educational text remain functional
- Canonical URL unchanged
- FAQ and PAA accordion sections stay in their current position (after educational content)
- No sticky navigation bar in this change (kept simple)

## Technical Details

**File modified:** `src/pages/HueForgeTDDatabase.tsx` only

The implementation is purely a JSX reorder within the existing return statement plus inserting a new CTA button element after the stats counters. No new components, no new files, no new dependencies.

**New imports needed:** `ChevronDown` from `lucide-react` (for the bouncing arrow)

