

# Filament Scoring System Fix

## Problem Analysis

### Root Cause 1: Inconsistent Score Sources
The Card view and Table view use **different score sources**:

| View | Score Source | Result |
|------|--------------|--------|
| **FilamentCard.tsx** | `filament.ease_of_printing_score ?? calculateEaseBreakdown().score` | Dynamic (varies per product) |
| **FilamentTableView.tsx** | `filament.value_score \|\| 7.0` | Hardcoded fallback of 7.0 |
| **LabReadoutCard.tsx** | `filament.ease_of_printing_score ?? calculateEaseBreakdown().score` | Dynamic (varies per product) |

The Table view defaults to `7.0` when `value_score` is null, which explains why all products show 7.0 in table view.

### Root Cause 2: Most Products Show 10.0 in Cards
The `calculateEaseBreakdown()` function in `scoreCalculation.ts` starts at 10 and only deducts for:
- Material difficulty (e.g., PLA only deducts 0.45 points: 1.5 × 0.3)
- Narrow temperature windows
- High temps, drying requirements, abrasive nozzles

For a typical PLA with minimal data, the score calculates as:
- Start: 10.0
- Material deduction (PLA = 1.5 difficulty): -0.45
- **Final: ~9.55, rounded to 9.6**

Since most products lack negative factors, they cluster at 9.5-10.0.

### Root Cause 3: Different Scoring Philosophies
- `calculateEaseBreakdown()` = "Ease of Printing" (penalty-based from 10)
- `filamentScoring.ts` = "Overall Value" (additive from 0, considers price, brand, features)
- `value_score` database column = Often null

---

## Solution Design

### Strategy: Unified Scoring Function
Create a single, comprehensive scoring function that:
1. Is used by **both** Card and Table views
2. Considers multiple data points for differentiation
3. Shows "Unrated" when insufficient data exists
4. Provides tooltip breakdown of score factors

### Scoring Formula (0-10 Scale)

```text
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED FILAMENT SCORE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BASE SCORE (max 3.0)                                          │
│  ├── Material ease baseline: 0-2.5 points                      │
│  │   (PLA=2.5, PETG=2.0, ABS=1.5, PA/PC=1.0, PEEK=0.5)        │
│  └── Has material defined: +0.5                                │
│                                                                 │
│  DATA COMPLETENESS (max 2.5)                                   │
│  ├── TDS available: +0.5                                       │
│  ├── Temperature specs (nozzle + bed): +0.5                    │
│  ├── Mechanical data (tensile/flexural): +0.5                  │
│  ├── Has product image: +0.5                                   │
│  └── Has color hex defined: +0.5                               │
│                                                                 │
│  PRICE & AVAILABILITY (max 2.0)                                │
│  ├── Has pricing data: +0.5                                    │
│  ├── Regional pricing (CAD/EUR/GBP/AUD): +0.1 each (max 0.4)  │
│  ├── Multiple purchase options (Amazon + store): +0.3         │
│  └── Price competitiveness vs material avg: +0.3              │
│                                                                 │
│  BRAND & QUALITY (max 1.5)                                     │
│  ├── Premium brand: +1.0                                       │
│  ├── Mid-tier brand: +0.5                                      │
│  └── Unknown brand: +0.0                                       │
│                                                                 │
│  FEATURES (max 1.0)                                            │
│  ├── High-speed capable: +0.4                                  │
│  ├── Specialty finish (silk/matte/sparkle): +0.3              │
│  └── Reinforced (CF/GF): +0.3                                  │
│                                                                 │
│  TOTAL: 0-10 (capped)                                          │
│  MINIMUM DATA: material OR (price + image) required            │
│  Otherwise: "Unrated"                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Step 1: Create Unified Score Utility
**File: `src/lib/unifiedFilamentScore.ts`**

Create a new scoring module with:
- `calculateUnifiedScore(filament): ScoreResult`
- `ScoreResult` interface with: `score: number | null`, `factors: Factor[]`, `confidence: 'high' | 'medium' | 'low' | 'insufficient'`
- Export `getScoreLabel(score)` for text labels ("Excellent", "Good", "Average", etc.)
- Export `getScoreColor(score)` for consistent color coding

### Step 2: Update FilamentTableView
**File: `src/components/FilamentTableView.tsx`**

Current (line 94):
```typescript
const overallScore = filament.value_score || 7.0;
```

Change to:
```typescript
import { calculateUnifiedScore } from '@/lib/unifiedFilamentScore';

// Inside component
const { score: overallScore } = calculateUnifiedScore(filament);
```

Update the score display (lines 217-224) to:
- Show "—" when score is null
- Add tooltip on hover explaining score breakdown
- Use consistent color coding

### Step 3: Update FilamentCard
**File: `src/components/FilamentCard.tsx`**

Current (lines 272-278):
```typescript
const dynamicScore = useMemo(() => {
  const breakdown = calculateEaseBreakdown(filament);
  return breakdown.score;
}, [filament]);

const overallScore = filament.ease_of_printing_score ?? dynamicScore ?? null;
```

Change to:
```typescript
import { calculateUnifiedScore } from '@/lib/unifiedFilamentScore';

const { score: overallScore, factors, confidence } = useMemo(() => 
  calculateUnifiedScore(filament),
  [filament]
);
```

Update the score tooltip (HoverCardContent) to show the unified breakdown factors.

### Step 4: Update LabReadoutCard
**File: `src/components/LabReadoutCard.tsx`**

Apply same changes as FilamentCard for consistency.

### Step 5: Extend Filament Interface for Table
**File: `src/components/FilamentTableView.tsx`**

Add missing fields to the `Filament` interface that are needed for scoring:
```typescript
interface Filament {
  // existing fields...
  high_speed_capable?: boolean | null;
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  tds_url?: string | null;
  price_cad?: number | null;
  price_eur?: number | null;
  price_gbp?: number | null;
  price_aud?: number | null;
  // etc.
}
```

---

## Score Interpretation

| Score Range | Label | Color | Meaning |
|-------------|-------|-------|---------|
| 8.5-10.0 | Excellent | Green (#22c55e) | Top-tier, complete data, great value |
| 7.0-8.4 | Great | Cyan (#06b6d4) | Well-documented, good brand/price |
| 5.5-6.9 | Good | Primary | Solid option, some data gaps |
| 4.0-5.4 | Average | Orange (#f59e0b) | Limited info or pricey |
| 1.0-3.9 | Limited | Red (#ef4444) | Missing key data |
| null | Unrated | Gray | Insufficient data to score |

---

## Tooltip/Hover Content

When hovering over the score, show a breakdown:
```text
┌────────────────────────────────────┐
│  Score Breakdown                   │
├────────────────────────────────────┤
│  ✓ Material (PLA)         +2.5    │
│  ✓ Complete specs         +1.5    │
│  ✓ Polymaker brand        +1.0    │
│  ✓ Has regional pricing   +0.8    │
│  ✓ High-speed capable     +0.4    │
│  ────────────────────────────     │
│  Total: 6.2 / 10                  │
│                                    │
│  Confidence: High                  │
│  (Based on 8 data points)          │
└────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/unifiedFilamentScore.ts` | **Create** | New unified scoring function |
| `src/components/FilamentTableView.tsx` | Modify | Use unified score, add tooltip |
| `src/components/FilamentCard.tsx` | Modify | Use unified score |
| `src/components/LabReadoutCard.tsx` | Modify | Use unified score |

---

## Validation Checklist

After implementation, verify:
- [ ] Scores vary meaningfully (not all 10.0 or 7.0)
- [ ] Same product shows same score in Card vs Table view
- [ ] Scores use 0-10 scale with clear meaning
- [ ] Hover tooltip explains score breakdown
- [ ] Products with minimal data show "Unrated" instead of default number
- [ ] Existing sort functionality still works with new scores

