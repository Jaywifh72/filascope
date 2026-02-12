

# FilamentCard Redesign for Engagement and Conversion

This plan redesigns the most revenue-critical component on the site — the filament product card — to maximize affiliate click-through while preserving the existing dark card aesthetic and grid layout.

---

## Change 1: Reduce Brand Logo Area

**Current**: Brand row uses `px-6 pt-6 pb-3` with logo + name + swatches.

**Change**: Reduce top padding from `pt-6` to `pt-4` and bottom padding from `pb-3` to `pb-2`. The logo (`w-5 h-5`) is already compact — the issue is mostly the generous padding. This reclaims ~12px of vertical space for the product name to "start earlier."

---

## Change 2: Out-of-Stock Treatment

**Current**: Out-of-stock cards get `opacity-75` and a red "OUT OF STOCK" badge in the top-left corner. CTA says "View Details."

**Changes**:
- Remove the absolute-positioned red badge (it conflicts with the compare checkbox)
- Add a semi-transparent overlay on the product image area: within the brand/title section, add a subtle dimming effect
- Add a centered "Out of Stock" text overlay on the card image (if present) or as a muted banner
- CTA button: change text to **"Check Availability"** with an arrow, using `bg-slate-700 text-slate-400 hover:bg-slate-600` instead of outline
- Add a secondary **"Watch Price"** text link (`text-xs text-slate-500 underline`) below the CTA button area

---

## Change 3: State-Aware CTA Button

**Current**: CTA says "View Prices" (in stock) or "View Details" (out of stock).

**Changes** — three states:
- **In stock (default)**: Keep current "View Prices" with arrow. The store count data isn't readily available on the card (prices are per-variant, not per-store), so we keep the current text rather than fabricating a count
- **On sale/deal**: If the filament has a `priceTrend` prop with a negative value (price dropped), change button to `bg-amber-500 hover:bg-amber-400 text-black` with text **"View Deal"**
- **Out of stock**: `bg-slate-700 text-slate-400` with text **"Check Availability"**

---

## Change 4: Price Freshness Reframe

**Current**: Shows a colored dot (green/amber/red) with compact time like "25d" next to the FilaScore.

**Changes** — reframe from alarming to informational:
- **< 7 days** (`high` confidence): Green dot + "Updated recently"
- **7-30 days** (`medium`/`low`): No dot, just subtle text "Checked Xd ago" in `text-slate-500`
- **> 30 days** (`stale`): Amber dot + "Price may have changed"

This removes the red/orange dots that subconsciously read as warnings.

---

## Change 5: FilaScore Display Enhancement

**Current**: Shows just "8.0" in a cyan badge with Award icon. The hover card already shows "/10" breakdown.

**Changes**:
- Change display from `{score.toFixed(1)}` to `{score.toFixed(1)}/10` — removes ambiguity
- If score >= 8.5, add a small **"Top Rated"** micro-badge: `bg-amber-500/15 border-amber-500/30 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full` immediately after the score badge
- Update the hover card subtitle from "Score Breakdown" to **"FilaScope Score based on value, specs, and compatibility"**

---

## Change 6: Compare Button Expand on Hover

**Current**: Bottom CTA area has a `w-10` square button with a Columns icon, opacity-60 by default, opacity-100 on group hover.

**Changes**:
- On card hover (`group-hover`): expand the button width with `group-hover:w-auto group-hover:px-3` and show "Compare" text that slides in via `overflow-hidden` + `max-width` transition
- Add a `<span>` with the text "Compare" that has `max-w-0 group-hover:max-w-[80px] overflow-hidden transition-all duration-200 opacity-0 group-hover:opacity-100`
- On non-hover: just the Columns icon as currently

---

## Technical Details

### Files Modified
- **`src/components/FilamentCard.tsx`** — All 6 changes within a single file

### Graceful Degradation
- `priceTrend` prop already exists but may be null — deal CTA only activates when explicitly negative
- Score "/10" always shows when score is present
- "Top Rated" badge only appears for scores >= 8.5
- "Watch Price" link on out-of-stock cards links to the same detail page
- Compare text expansion uses CSS transitions only — no JS state changes needed

### No Breaking Changes
- All prop interfaces remain the same
- Table view is a separate component and is unaffected
- Card still works in 4-column grid (no width changes)
- All existing data points preserved

