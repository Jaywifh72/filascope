

## Update Affiliate UI for Anycubic UK Support

### Summary
Extend the existing affiliate system to properly handle the Anycubic UK region, focusing on inactive program visibility for admins and graceful empty states for discount codes.

---

### 1. Region Detection -- Already Working
The `detectRegionFromLocale` function in `src/config/regions.ts` already maps `en-GB` to `UK`. The `RegionContext` uses `navigator.language` at priority 3. No changes needed here.

---

### 2. Update `useAffiliateLink` to expose inactive programs for admin preview

**File:** `src/hooks/useAffiliateLink.ts`

Currently, the hook filters `is_active = true` on lines 67 and 81. This means the UK program (is_active=false) is completely invisible.

Changes:
- Add a second query that fetches inactive programs for the current brand+region (only used for admin display)
- Add `inactiveProgram` to the return value
- The `buildLink`, `trackAndOpen`, and `hasAffiliate` remain gated on the **active** program only (no traffic to untracked links)

Return type additions:
```typescript
interface UseAffiliateLinkResult {
  // ... existing fields
  inactiveProgram: AffiliateProgram | null;  // NEW: program found but is_active=false
}
```

---

### 3. Add admin warning banner for inactive programs

**File:** `src/components/affiliate/AffiliateInactiveBanner.tsx` (new)

A small component that renders a yellow warning banner when:
- `inactiveProgram` is not null
- User `isAdmin` is true (from `useAuth()`)

Text: "Affiliate program pending verification -- links are inactive until approved. Activate in Admin > Affiliates once GoAffPro confirms your account."

---

### 4. Integrate inactive banner into product pages

**Files:** Wherever `AffiliateDisclosure` or `AffiliateDiscountBanner` are rendered alongside affiliate buy buttons (filament detail sidebar, printer detail page).

- Import `useAuth` and check `isAdmin`
- If `inactiveProgram` exists and `isAdmin`, render the `AffiliateInactiveBanner`
- Non-admin users see nothing (no buy button, no banner, no disclosure)

---

### 5. Discount code empty state in `AffiliateDiscountBanner`

**File:** `src/components/affiliate/AffiliateDiscountBanner.tsx`

Currently returns `null` when no active codes exist. Update:
- Accept an optional `showEmptyState?: boolean` prop
- When `showEmptyState` is true and no codes exist, render: "No discount codes available for this region currently." in muted text
- When `showEmptyState` is false or omitted, keep current behavior (return null)

---

### 6. No changes needed to edge function or database

The `generate-affiliate-link` edge function already handles UK templates correctly (verified in the previous task). The region config maps, currency formatting, and flag display already support UK/GBP across the codebase.

---

### Technical Details

| File | Action |
|------|--------|
| `src/hooks/useAffiliateLink.ts` | Add inactive program lookup query, expose `inactiveProgram` in return |
| `src/components/affiliate/AffiliateInactiveBanner.tsx` | New component -- yellow admin-only warning |
| `src/components/affiliate/AffiliateDiscountBanner.tsx` | Add optional `showEmptyState` prop |
| `src/components/filament/sidebar/StorePricingDisplay.tsx` | Wire up inactive banner for admin preview |
| `src/pages/FilamentDetail.tsx` | Pass `showEmptyState` where discount banner is used |

