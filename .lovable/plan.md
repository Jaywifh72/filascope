

## Add Active Filter Count Badges and Clear All Link to Printer Sidebar

**File:** `src/components/printers/PrintersLeftSidebar.tsx`

This sidebar already has count badges on Brand and Features sections, and a "Reset All Filters" button. The plan standardizes badges across all filter sections and replaces the button with the requested styled link.

### Changes

**1. Add count badges to sections that currently only show text indicators:**

| Section | Current Indicator | New Badge |
|---------|------------------|-----------|
| Price Range (line 202-206) | Text label showing selected range | Cyan circle badge with "1" when a non-"all" range is selected |
| Build Size (line 245-249) | Text label showing selected size | Cyan circle badge with "1" when a non-"all" size is selected |
| Motion System (line 345-349) | Text label showing selected option | Cyan circle badge with "1" when not "any" |
| Print Speed (line 393-397) | Text showing range values | Cyan circle badge with "1" when speed range is customized |

**2. Update existing Brand and Features badges to match requested styling:**

Current (lines 289, 438): `min-w-5 h-5 px-1.5 bg-primary rounded-full text-[10px] font-bold text-background`

New: `bg-cyan-500 text-black text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center ml-2`

**3. Replace "Reset All Filters" button with "Clear All Filters" link:**

Replace the current `Button` component (lines 476-486) with a simple text link styled as:
`text-xs text-gray-500 hover:text-cyan-400 font-mono uppercase tracking-wide`

Centered at the bottom of the sidebar, visible only when `hasActiveFilters` is true (existing logic preserved).

### Technical Details

- For Price Range, Build Size, and Motion System: these are single-select filters, so the badge always shows "1" when active
- For Print Speed: badge shows "1" when the range deviates from default (0-1000)
- For Brand and Features: badge shows the count of selected items (existing logic)
- The existing text indicators (showing the active selection label) next to Price/Build/Motion/Speed headers will be replaced by the count badge for visual consistency
- No changes to Sort By section, expand/collapse behavior, or sidebar width/positioning

