

## Redesign Spec Summary Row as Three-Column Micro-Grid

Replace the single-line spec text in `src/components/printers/MediumStandardPrinterCard.tsx` with a structured 3-column icon grid.

### Changes

**1. Add imports** (line 2): Add `Box`, `Zap`, `Thermometer` from `lucide-react`.

**2. Replace spec row** (lines 259-262): Replace the `<p>` element with a `grid grid-cols-3 gap-2` div containing three cells:

```text
+-------------------------------+
|  [Box]   |  [Zap]  | [Therm] |
| 256³mm   | 500mm/s |  300°C  |
+-------------------------------+
```

Each cell:
- `text-center py-1.5`
- Icon: `size={12}`, `text-gray-500`, centered with `mx-auto mb-1`
- Value: `text-xs text-gray-400 font-mono whitespace-nowrap`
- Missing values show `"--"` in `text-gray-600`

**3. Build volume formatting**: Reuse existing logic from `formatSimplifiedSpecs` -- cube notation for equal dims, full notation otherwise.

**4. Keep `min-h-[24px]`** and `hidden sm:grid` (desktop only, matching current behavior).

### Technical Details

**File:** `src/components/printers/MediumStandardPrinterCard.tsx`

| Area | Lines | Change |
|------|-------|--------|
| Imports | 2 | Add `Box, Zap, Thermometer` |
| Spec row | 259-262 | Replace `<p>` with 3-column grid |

The `formatSimplifiedSpecs` function can remain (no harm), or be removed as dead code. The new grid reads printer fields directly.
