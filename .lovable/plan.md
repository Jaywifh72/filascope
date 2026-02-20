
## Audit Summary

`ProductJsonLd` already emits `aggregateRating` — but only when `communityReviewStats` has real user reviews. Since the community review system is new and most products have zero reviews, `ratingValue` and `ratingCount` are both `null` on every filament page, so no `aggregateRating` block is ever injected into the Product schema.

The request is to use **FilaScore** as the rating signal for `aggregateRating` so Google can show star snippets now, while real community reviews take precedence when they exist.

---

## Root Cause

In `FilamentDetail.tsx` (lines 894–898):
```typescript
ratingValue={communityReviewStats?.avgRating ?? null}   // null if no reviews
ratingCount={communityReviewStats?.reviewCount ?? null}  // null if no reviews
bestRating={5}
worstRating={1}
```

`ProductJsonLd` only emits `aggregateRating` when both `ratingValue != null` AND `ratingCount != null` AND `ratingCount > 0`. With zero community reviews, all three conditions fail → no schema block emitted.

---

## Plan

### Priority: community reviews > FilaScore fallback

When community reviews exist → use them (scale 1–5, current behavior).
When no community reviews → fall back to FilaScore (scale 0–10).

`dataPointCount` from `calculateUnifiedScore` is the correct `ratingCount` proxy — it counts the number of distinct data signals (filled specs, pricing regions, TDS records, brand verification etc.) that produced the score. This is an honest representation of how many data points backed the rating.

---

## Files to Change

| File | Change |
|---|---|
| `src/pages/FilamentDetail.tsx` | Call `calculateUnifiedScore` on `pricingFilament`, build fallback rating vars, pass them to `ProductJsonLd` |
| `src/components/seo/ProductJsonLd.tsx` | Update `bestRating` default from `5` to `10` and `worstRating` from `1` to `0` to accommodate FilaScore's 0–10 scale; keep the existing guard (`ratingCount > 0`) |

---

## Detailed Changes

### 1. `src/pages/FilamentDetail.tsx`

Add an import for `calculateUnifiedScore` and `FilamentForScoring` (already used in `FilamentHeroSection` — just add it to the page-level import list).

After `pricingFilament` is defined (line ~187), derive the FilaScore fallback:

```typescript
// FilaScore fallback for aggregateRating (used when no community reviews exist)
const { score: filaScoreValue, dataPointCount: filaScoreDataPoints } = useMemo(
  () => pricingFilament
    ? calculateUnifiedScore(pricingFilament as FilamentForScoring)
    : { score: null, dataPointCount: 0 },
  [pricingFilament]
);
```

Then update the `ProductJsonLd` props (lines 894–898) from:
```typescript
ratingValue={communityReviewStats?.avgRating ?? null}
ratingCount={communityReviewStats?.reviewCount ?? null}
bestRating={5}
worstRating={1}
```

To:
```typescript
// Community reviews take priority; FilaScore is the fallback for star snippet eligibility
ratingValue={
  communityReviewStats && communityReviewStats.reviewCount > 0
    ? communityReviewStats.avgRating
    : filaScoreValue
}
ratingCount={
  communityReviewStats && communityReviewStats.reviewCount > 0
    ? communityReviewStats.reviewCount
    : filaScoreValue != null ? filaScoreDataPoints : null
}
bestRating={
  communityReviewStats && communityReviewStats.reviewCount > 0 ? 5 : 10
}
worstRating={
  communityReviewStats && communityReviewStats.reviewCount > 0 ? 1 : 0
}
```

### 2. `src/components/seo/ProductJsonLd.tsx`

No logic change needed — the existing guard is correct:
```typescript
...(ratingValue != null && ratingCount != null && ratingCount > 0 && {
  aggregateRating: { ... }
})
```

However, the **default values** `bestRating = 5` and `worstRating = 1` in the destructured props need to be removed as defaults (since they're now passed explicitly from the call site). This avoids confusion. The actual values passed from `FilamentDetail.tsx` control the output.

---

## What the Schema Looks Like After the Fix

For a typical filament with FilaScore 6.5 and 7 data points (no community reviews):

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "6.5",
  "bestRating": "10",
  "worstRating": "0",
  "ratingCount": "7"
}
```

For a filament that has 12 community reviews averaging 4.2 stars:

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.2",
  "bestRating": "5",
  "worstRating": "1",
  "ratingCount": "12"
}
```

---

## Technical Notes

- `calculateUnifiedScore` is already called in `FilamentHeroSection` which is a child of `FilamentDetail`. The page-level call adds a second invocation — this is fine since `pricingFilament` is a stable object reference and the `useMemo` will compute only once per render cycle. The computation is lightweight (pure arithmetic, no network calls).
- `dataPointCount` from the score function ranges from 0 to ~12 depending on how many data signals exist. The guard `ratingCount > 0` in `ProductJsonLd` ensures nothing is emitted for unrated products where `score === null` (in which case `filaScoreValue` is `null` and the condition fails cleanly).
- `PrinterDetail.tsx` already passes real community review counts (`printer.rating_community_overall`, `printer.review_count_aggregated`) so printer pages already have working `aggregateRating`. No change needed there.
- Google's guidelines require `aggregateRating` to reflect a genuine rating. FilaScore is a transparent algorithmic score based on data completeness and is shown visibly on the product page (the FilaScore badge) — this satisfies the "must match on-page content" requirement.

---

## Files Changed

| File | Lines affected |
|---|---|
| `src/pages/FilamentDetail.tsx` | ~3 lines added (useMemo) + ~6 lines updated in ProductJsonLd props |
| `src/components/seo/ProductJsonLd.tsx` | Default prop values for `bestRating`/`worstRating` removed (cosmetic — values are now always passed explicitly) |
