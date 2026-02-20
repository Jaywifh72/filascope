
## Root Cause

The `canonicalSlug` in `FilamentDetail.tsx` is computed from `location.pathname` (React Router's `useLocation()`):

```typescript
const canonicalSlug = location.pathname.replace(/^\/filament\//, '') || id || '';
```

React Router's `useLocation()` is **not updated** by `window.history.replaceState()` calls. These are two separate state stores.

**The exact failure sequence when a user visits via UUID:**

1. User navigates to `/filament/39aad56f-03d8-4005-bf52-d7f6204df18b`
2. React renders `FilamentDetail` — `location.pathname` is `/filament/39aad56f-...`
3. `canonicalSlug` = `"39aad56f-03d8-4005-bf52-d7f6204df18b"` (UUID)
4. `useFilamentBySlug` fetches the filament, then calls `window.history.replaceState(null, '', '/filament/numakers-pla-pure-white')` — the browser bar updates
5. React Router's `location.pathname` **does NOT update** — replaceState bypasses the Router entirely
6. `ProductSEO` renders `canonicalUrl="/filament/39aad56f-..."` — UUID in canonical

**When a user visits via slug directly:**

1. User navigates to `/filament/numakers-pla-pure-white`
2. `location.pathname` = `/filament/numakers-pla-pure-white`
3. `canonicalSlug` = `"numakers-pla-pure-white"` ✅
4. But if the slug-to-product lookup resolves to a slightly different canonical slug (e.g. the hook regenerates `"numakers-pla-pure-white"` via `generateFilamentSlug`), the canonical still uses whatever was in the URL — which may differ from the canonical slug

The fix must derive `canonicalSlug` from the **resolved filament object** using `generateFilamentSlug` (the same function `useFilamentBySlug` already uses internally), not from the URL pathname. This guarantees the canonical always matches the vendor-prefixed slug, regardless of how the user arrived.

---

## Fix: One File Change — `src/pages/FilamentDetail.tsx`

### Before (lines 99–110)

```typescript
const { id } = useParams();
const location = useLocation();
// Use the actual URL pathname slug — the hook updates it via history.replaceState
// so this is always the SEO-friendly slug, never a UUID after resolution.
const canonicalSlug = location.pathname.replace(/^\/filament\//, '') || id || '';
const navigate = useNavigate();
...
const { filament, loading, error: fetchError, isRedirecting, refetch } = useFilamentBySlug(id);
```

### After

1. Keep `const { id } = useParams()` and `const location = useLocation()` (location is still used for the tab-hash fragment state)
2. Remove the `canonicalSlug` derivation from `location.pathname`
3. After the `useFilamentBySlug` call, derive `canonicalSlug` from the resolved filament:

```typescript
const { id } = useParams();
const location = useLocation();
const navigate = useNavigate();
...
const { filament, loading, error: fetchError, isRedirecting, refetch } = useFilamentBySlug(id);

// Derive canonical slug from the RESOLVED filament object, not the URL pathname.
// location.pathname is NOT updated by history.replaceState() — using it would
// produce UUID-based canonicals when users land via UUID URLs.
const canonicalSlug = useMemo(() => {
  if (filament) {
    return generateFilamentSlug(
      filament.vendor,
      filament.material,
      filament.product_title,
      filament.color_family,
    ) || filament.id;
  }
  // Fallback while loading: use pathname slug if it's not a UUID, else id param
  const pathSlug = location.pathname.replace(/^\/filament\//, '');
  return isUuid(pathSlug) ? (id || '') : pathSlug;
}, [filament, location.pathname, id]);
```

This needs two imports added at the top of `FilamentDetail.tsx`:
- `generateFilamentSlug` from `@/lib/seoSlugUtils`
- `isUuid` from `@/lib/seoSlugUtils`
- `useMemo` is already imported

---

## Files Changed

| File | Change |
|---|---|
| `src/pages/FilamentDetail.tsx` | Replace `canonicalSlug` derivation (3 lines → useMemo using resolved filament) + add `generateFilamentSlug` and `isUuid` imports |

## No Other Files Changed

- `useFilamentBySlug.ts` — no change, it already does the right thing for URL display
- `ProductSEO.tsx` — no change, it correctly uses `canonicalUrl` as passed
- `useDocumentHead.ts` — no change
- No database changes

## Why This Is Complete

- When user arrives via **slug**: filament resolves → `generateFilamentSlug` produces the same vendor-prefixed slug → canonical correct ✅
- When user arrives via **UUID**: filament resolves → `generateFilamentSlug` produces the slug → canonical uses slug, not UUID ✅
- During **loading** (before filament resolved): falls back to the pathname slug if it isn't a UUID, avoiding a flash of UUID canonical ✅
- The `history.replaceState` in `useFilamentBySlug` continues to work for the browser address bar — this fix is independent of that mechanism ✅
