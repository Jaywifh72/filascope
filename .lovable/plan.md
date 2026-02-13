

## Compress Deal Cards on /deals Page

### Goal
Reduce card height from ~350-400px to ~250-280px by merging metadata rows, shrinking the image area, tightening spacing, and renaming CTAs.

### Changes (all in `src/components/deals/GroupedDealCard.tsx`)

#### 1. Remove standalone DealFreshnessBadge and DealQualityBadge rows
- Delete the `DealFreshnessBadge` component definition (lines 22-43) entirely
- Remove the `DealFreshnessBadge` usage (lines 434-436)
- Remove the `DealQualityBadge` usage (lines 439-445)
- Remove the standalone "Ships to" Badge (lines 448-456)
- Replace all three with a **single compact metadata line**:
  - `flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap`
  - Format: `[Clock icon] Checked 11d ago · [Ship icon] Ships to US · [Flag] Local seller`
  - For "Everyday Price" deals (from DealQualityBadge), append a subtle "· Ongoing" tag instead of a full badge
  - For "New Deal" status, append "· New" in green text
  - Skip "vs. MSRP" label (already communicated by the "Great Deal" discount badge)

#### 2. Reduce image area height
- Change `h-40` (160px) to `h-[120px]` on the image container (line 121)
- Reduce placeholder spool circles from `w-16 h-16` to `w-14 h-14` (lines 158, 174)

#### 3. Tighten card spacing
- CardContent: change `p-4` to `p-3` (line 365)
- Product name: change `mb-3` to `mb-1.5`, keep `h-[40px]` reserved height (line 401)
- Brand row: change `mb-1.5` to `mb-1` (line 370)
- Price section: change `mb-2` to `mb-1.5` on price rows (lines 420, 429)
- Store region info: change `mb-3` to `mb-2` (line 533)

#### 4. Add material type badge inline with brand row
- After the vendor name link, add a small inline badge:
  - `text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase tracking-wide`
  - Shows material like "PLA", "PETG", "TPU"

#### 5. Rename CTA button text
- Change "Check if Deal is Active" to "View Deal" (line 587)
- Reduce button padding with `py-1.5` for a slimmer button

#### 6. Color swatches and variant count -- keep as-is
- Already compact enough; no changes needed

### Technical Details

- **Files modified**: `src/components/deals/GroupedDealCard.tsx` only
- **Imports**: Remove `DealQualityBadge` import; remove `Ship` icon import (will use inline); add `differenceInDays` usage for freshness context label (already imported)
- The `DealFreshnessBadge` component can be deleted from this file since it won't be used anywhere else
- The `DealQualityBadge` component file (`src/components/deals/DealQualityBadge.tsx`) will remain in the codebase but won't be imported here -- it may still be used elsewhere (e.g., DealCard.tsx)
- The merged metadata line will compute freshness tier and deal age inline using the same logic previously in both badge components

