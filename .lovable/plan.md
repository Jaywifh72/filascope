
## aggregateRating Fix — FilaScope Score Scaled to 1–5 for Google Rich Results

### What's Already Wired (No Changes Needed Here)
`ProductJsonLd.tsx` already emits `aggregateRating` correctly (lines 475–483):
```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "<ratingValue>.toFixed(1)",
  "bestRating": "<bestRating>.toString()",
  "worstRating": "<worstRating>.toString()",
  "ratingCount": "<ratingCount>.toString()"
}
```
It guards on `ratingValue != null && ratingCount != null && ratingCount > 0` — so it only emits when there is real data. The component interface is already correct.

---

### The Bug — Wrong Scale for FilaScore Fallback

In `FilamentDetail.tsx` lines 904–919, there are **two paths** for the fallback rating:

**Path A — Community reviews (correct):**
- `avgRating` from `product_reviews.overall_rating` → 1–5 scale ✅
- `bestRating: 5`, `worstRating: 1` ✅

**Path B — FilaScore fallback (broken):**
- `filaScoreValue` is passed raw: 0–10 scale ❌ (e.g., `7.4` instead of `3.7`)
- `bestRating: 10` ❌ (Google expects standard 5-star)
- `worstRating: 0` ❌ (should be 1)

Google's Rich Results guidelines require the rating scale to be internally consistent. While any scale is technically allowed, passing `ratingValue: 7.4` with `bestRating: 10` produces no star snippet because Google normalises to 5 internally and deprioritises non-standard scales. Passing it on the 5-star scale is the standard practice that actually triggers snippets.

---

### The Fix — One File: `FilamentDetail.tsx`

**Change 1 — Derive scaled FilaScore (1–5) in the memo:**

The existing memo at lines 191–195 returns `{ score: filaScoreValue, dataPointCount: filaScoreDataPoints }`. Add one more derived variable:

```typescript
// Convert 0-10 FilaScore to 1-5 scale for Google aggregateRating
// Formula: ((score / 10) * 4) + 1 maps 0→1, 5→3, 10→5
const filaScoreRating5 = filaScoreValue != null
  ? Math.round(((filaScoreValue / 10) * 4 + 1) * 10) / 10
  : null;
```

Why `((score / 10) * 4) + 1` instead of `(score / 10) * 5`?
- `(score / 10) * 5` maps 0→0, which means a product with ANY data would get `0` — below Google's `worstRating: 1`, triggering a schema error.
- `((score / 10) * 4) + 1` maps 0→1 (worst) and 10→5 (best), fitting cleanly within `worstRating: 1, bestRating: 5`. This is the correct linear interpolation for a 1–5 scale.

**Change 2 — Pass normalised values to `<ProductJsonLd>`:**

```tsx
// BEFORE (lines 904–919):
ratingValue={
  communityReviewStats?.reviewCount > 0
    ? communityReviewStats.avgRating  // 1-5 ✅
    : filaScoreValue                  // 0-10 ❌
}
ratingCount={...}
bestRating={communityReviewStats?.reviewCount > 0 ? 5 : 10}   // 10 ❌ for fallback
worstRating={communityReviewStats?.reviewCount > 0 ? 1 : 0}   // 0 ❌ for fallback

// AFTER:
ratingValue={
  communityReviewStats?.reviewCount > 0
    ? communityReviewStats.avgRating  // 1-5 ✅
    : filaScoreRating5                // 1-5 ✅ (scaled)
}
ratingCount={...}  // unchanged
bestRating={5}     // always 5 ✅
worstRating={1}    // always 1 ✅
```

This collapses four conditional expressions into two fixed values — cleaner and correct.

---

### Guard Condition Audit

`ProductJsonLd` emits `aggregateRating` only when:
```
ratingValue != null && ratingCount != null && ratingCount > 0
```

With the fix:
- **Community reviews exist:** `avgRating` (1–5), `reviewCount > 0` → emits ✅
- **No reviews, FilaScore exists:** `filaScoreRating5` (1–5), `filaScoreDataPoints > 0` → emits ✅  
- **No reviews, no FilaScore:** `filaScoreRating5 = null` → blocked by guard → no emission ✅
- **FilaScore = 0:** `filaScoreRating5 = 1.0`, `filaScoreDataPoints` likely 0 or very low → blocked by `ratingCount > 0` guard ✅

Edge case: `filaScoreDataPoints` could theoretically be 0 even when `filaScoreValue` is non-null. The guard `ratingCount > 0` handles this correctly — no `aggregateRating` is emitted.

---

### Files Changed

| File | Lines | Change |
|---|---|---|
| `src/pages/FilamentDetail.tsx` | ~193 | Add `filaScoreRating5` derived value after existing memo |
| `src/pages/FilamentDetail.tsx` | 904–919 | Use `filaScoreRating5`, set `bestRating={5}`, `worstRating={1}` unconditionally |

No changes to `ProductJsonLd.tsx` — its interface is already correct.

---

### Expected Outcome

After this fix, every filament page with a FilaScore and at least 1 data point will emit valid JSON-LD like:

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "3.7",
  "bestRating": "5",
  "worstRating": "1",
  "ratingCount": "8"
}
```

Google Search Console → Rich Results Test will validate this. Star snippets typically appear in SERPs within 1–4 weeks of indexation for pages with valid `aggregateRating`.
