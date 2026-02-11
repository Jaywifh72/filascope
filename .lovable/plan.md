

## Printer Card Alignment Improvements

Visual-only changes to `src/components/printers/MediumStandardPrinterCard.tsx` to ensure consistent card alignment across rows.

### 1. Card Container -- Min Height and Flex Column
Add `min-h-[480px]` to the main card container div (line 139) and ensure `flex flex-col` is applied on desktop. The card already has `h-full flex flex-row sm:flex-col`, so we add `sm:min-h-[480px]` to enforce consistent height on desktop only.

### 2. View Details Button -- Push to Bottom with mt-auto
The content wrapper div (line 201) already has `flex flex-col`. Add `mt-auto` to the "View Details" button (line 266) so it always sits at the card bottom regardless of content height.

### 3. Spec Summary Row -- Fixed Min Height
The simplified specs paragraph (line 261) currently collapses when specs are missing. Add `min-h-[24px]` to ensure consistent vertical space.

### 4. Feature Badge Row -- Fixed Min Height
The badge container (line 173-184) is conditionally rendered only when `badges.length > 0`. Change this to always render the container with `min-h-[28px]`, showing badges when present and empty space when not, so images align across cards.

### 5. "Price TBD" Styling
The "Price TBD" fallback (line 247) currently uses generic muted styling. Change to `text-gray-500 font-mono text-sm italic` to visually distinguish it from real prices.

---

### Technical Details

**File:** `src/components/printers/MediumStandardPrinterCard.tsx`

| Area | Line(s) | Change |
|------|---------|--------|
| Card container | 139 | Add `sm:min-h-[480px]` to the className |
| Badge container | 173-184 | Always render the wrapper div (remove `badges.length > 0` condition), add `min-h-[28px]` |
| Specs row | 261 | Add `min-h-[24px]` to the paragraph |
| Price TBD | 247 | Change className to `text-gray-500 font-mono text-sm italic` |
| View Details button | 267 | Add `mt-auto` to push button to bottom of card |

