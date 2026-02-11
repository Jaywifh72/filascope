

## Fix Brand Card Height Inconsistency

### Problem
Brand cards in the directory grid have inconsistent heights due to varying amounts of material badges and feature tags, causing misaligned rows and an uneven "View Filaments" button position.

### Changes (single file: `src/components/brands/BrandCard.tsx`)

**1. Flex column layout with minimum height**
- Add `flex flex-col min-h-[280px]` to the outer card container (line 68)
- Add `flex-1 flex flex-col` to the bottom info area (line 103) so it stretches to fill remaining space

**2. Anchor "View Filaments" button to bottom**
- Add `mt-auto` to the Button component (line 163) so it always sits at the card bottom regardless of content above

**3. Cap material badges to one row with "+X more" counter**
- Wrap the visible badges in a container with `flex flex-wrap gap-1.5 max-h-[28px] overflow-hidden`
- Show the first 4 badges inside this overflow-clipped container
- Place the "+X more" pill **outside** the overflow container so it's always visible
- Style the "+X more" pill with `text-[10px] text-gray-500 font-mono`

**4. Consistent feature badge spacing**
- Change the feature badges container margin to `mt-1.5` for consistent spacing below material badges

### Technical Detail

The key structural change is making the card a flex column so the info section can grow (`flex-1`) and the button can anchor to the bottom (`mt-auto`). The material badge overflow is handled by splitting the "+X more" counter outside the `overflow-hidden` container so it remains visible even when badges are clipped.

No changes to: logo area, brand name, product count, price indicator, verified badge, star rating, or card border/background colors.
