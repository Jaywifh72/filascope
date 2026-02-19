
## Fix: Store Region UX — Clarify "Ships From" vs. User's Region

### Problem Summary

In both the filament detail sidebar (`FilamentPurchaseSidebar`) and the printer detail sidebar (`PurchaseSidebar`), the store-region display is visually ambiguous. When a Canadian user (region = CA) sees a US store for a product, the UI currently renders:

```
🇺🇸 United States store   ← font-medium, prominent
Ships from United States
International shipping • Duties may apply
```

This hierarchy makes it look like the "United States" label is describing the user's region (as if the region switch didn't work), when it actually means "this product is sold from a US store."

---

### Changes Required

#### 1. `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`

**Block 1 — Amber warning box (lines 310–327):**

Change the label structure so "Ships from:" is the primary phrase, and the region name is secondary:

Before:
```
🇺🇸 United States store        ← font-medium, prominent
Ships from United States
International shipping • Duties may apply
```

After:
```
Ships from: 🇺🇸 United States   ← "Ships from:" is the lead
Duties & import fees may apply  ← secondary note
```

Specifically:
- Remove the `{regionFlag} {regionName} store` line as the heading
- Replace it with `Ships from: {regionFlag} {regionName}` as the only label
- Keep the "International shipping • Duties may apply" note as muted subtext
- Remove the redundant `regionalPriceResult?.store?.shipsFrom` sub-line (it repeats the same info)

**Block 2 — Region pill (lines 425–441):**

The centered pill at the bottom currently shows "United States Store" in the same visual style as if it's a status indicator. For international stores, reframe it:

Before:
```
🇺🇸 United States Store   ← pill, muted text (no "Local" badge)
```

After (international):
```
Ships from 🇺🇸 United States   ← pill, leading with "Ships from"
```

After (local):
```
🇨🇦 Canada Store  Local   ← unchanged (green pill, Local badge) — this is clear
```

Additionally, add a small "Your region: CA" indicator above or near the pill when the store is NOT the user's region, so the user can see both pieces of info at once:

```
Your region: 🇨🇦 CA  |  Ships from: 🇺🇸 US
```

This can be implemented as a two-column micro-row inside the same pill area.

---

#### 2. `src/components/printer/PurchaseSidebar.tsx`

Apply the same fix to the printer sidebar's fallback region warning (lines 111–128):

Before:
```
🇺🇸 United States store
Ships from United States
International shipping • Duties may apply
```

After:
```
Ships from: 🇺🇸 United States
Duties & import fees may apply
```

Also add the "Your region" context to make the distinction clear. Since `PurchaseSidebar` already receives `storeRegion` as a prop, the user's region can be read via `useRegion()`.

---

#### 3. `src/components/filament/sidebar/StorePricingDisplay.tsx`

Apply the same label fix to the region badge (lines 160–176) and the international shipping warning (lines 178–195):

The region badge that currently reads `{regionName} Store` for non-local stores should read `Ships from {regionName}`.

---

### Visual Hierarchy After Fix

**For CA user, US store (international):**
```
┌─────────────────────────────────────┐
│  ~C$47.99/kg                        │
│  (USD 35.00)                        │
│                                     │
│  ┌─ amber box ──────────────────┐   │
│  │ 🚚 Ships from: 🇺🇸 United States│   │
│  │    Duties & fees may apply   │   │
│  └──────────────────────────────┘   │
│                                     │
│  [Buy at Polymaker Store]           │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ Your region: 🇨🇦 CA           │   │
│  │ Ships from:  🇺🇸 US           │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**For CA user, CA store (local):**
```
┌─────────────────────────────────────┐
│  C$47.99/kg                         │
│                                     │
│  [Buy at Polymaker Store]           │
│                                     │
│  ✅ 🇨🇦 Canada Store  Local          │
└─────────────────────────────────────┘
```

---

### Technical Notes

- `useRegion()` is already imported in `FilamentPurchaseSidebar` (line 241); can be used for the "Your region" display.
- `PurchaseSidebar` (printer) does not currently import `useRegion` — will need to add it.
- No data flow or prop changes needed — only the JSX rendering of the existing `storeRegionCode`, `isLocalStore`, `storeRegionFlag`, and `shipsFrom` values changes.
- The `PricingTabContent` already has a reasonable "International" label in the store list row — no change needed there.
- The `StorePricingDisplay` component is used in a context where users are explicitly looking at store comparisons, so the fix there is lighter: just change the region pill label text from `{name} Store` to `Ships from {name}` for non-local stores.

### Files to Modify

1. `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` — Amber warning (lines 310–327) + Region pill (lines 425–441)
2. `src/components/printer/PurchaseSidebar.tsx` — Amber warning (lines 111–128), add `useRegion` import
3. `src/components/filament/sidebar/StorePricingDisplay.tsx` — Region badge text (lines 160–176)
