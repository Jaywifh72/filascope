

# Redesign "Materials Offered" Section with Grouped Categories

## Overview
Replace the flat grid of 54 material chips with categorized, collapsible groups for better scannability. All material links and crawlable text remain intact.

## Material Category Mapping

The brand's `availableMaterials` array will be sorted into 6 display groups. Classification uses simple keyword/prefix matching against each material name:

| Group | Color Dot | Match Logic |
|-------|-----------|-------------|
| Standard | Cyan (`bg-cyan-400`) | Contains "PLA" or "PETG" (excluding eco/fire/flex matches) |
| Engineering | Amber (`bg-amber-400`) | Contains "ASA", "PA", "Nylon", "PC", "PCTG", "ABS" |
| Specialty | Purple (`bg-purple-400`) | Contains "Silk", "Glitter", "Glow", "Metal", "Wood", "Crystal", "Thermoactive", "Stone", "Galaxy", "Marble", "Iridescent" |
| Flexible | Green (`bg-green-400`) | Contains "S-Flex", "TPU", "TPE", "Flex" |
| Eco & Recycled | Emerald (`bg-emerald-400`) | Starts with "r-" or "r" prefix (rPLA, rPETG), contains "Bio", "Eco", "Recycled" |
| Fire Rated | Red (`bg-red-400`) | Contains "FlameGuard", "FR V0", "FR-" |

Materials matching multiple groups go to the first match in priority order: Fire Rated, Eco, Flexible, Specialty, Engineering, Standard. Any unmatched materials fall into "Standard" as default.

## Implementation

All changes in `src/components/brands/tabs/BrandOverviewTab.tsx`:

### 1. Category grouping logic (useMemo)
- Define the 6 groups with name, color class, and match function
- Iterate `availableMaterials`, classify each into a group
- Filter out empty groups
- Sort materials alphabetically within each group

### 2. Collapsible group UI
- Replace the flat grid with a list of groups
- Each group has a header row: colored dot + group name (`text-xs uppercase tracking-wider text-gray-500 font-medium`) + chip count + clickable expand/collapse chevron
- First 3 non-empty groups default expanded, rest collapsed
- Local state: `expandedGroups: Set<string>` initialized with first 3 group IDs

### 3. Enhanced chip design
- Each chip keeps the existing `<a>` tag with same `href` and `onClick`
- Add a small colored dot (`w-2 h-2 rounded-full`) on the left matching the group color
- Material name + product count (`text-gray-500`) on the right
- Hover: `bg-gray-700/60 border-cyan-500/30`
- Tooltip on hover showing "X products from C$XX" using existing price data from `groupedProducts`

### 4. "Show all" toggle
- Below the groups, a button: "Show all 54 materials" / "Show less"
- `text-cyan-400 hover:text-cyan-300 text-sm`
- Clicking expands all collapsed groups

### 5. Price lookup for tooltips
- Build a `materialPriceRange` memo from `groupedProducts`: for each material, find min price across all products of that material
- Tooltip text: "{count} products from {pricePrefix}{formatPrice(minPrice)}" or "{count} products" if no price data

## Technical Details

- No new components or files needed -- all changes are within `BrandOverviewTab.tsx`
- Collapse/expand uses the same `grid-rows-[1fr]/grid-rows-[0fr]` CSS pattern already used in `CollapsibleSection.tsx`
- All 54 materials remain as crawlable `<a>` links in the DOM (collapsed groups use CSS hiding, not conditional rendering)
- Add `ChevronDown` icon (already imported via lucide) for group toggle indicators

