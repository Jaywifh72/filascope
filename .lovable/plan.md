
## IndexNow: Status Audit & Gap Fix

### What Already Exists (Do Not Re-implement)

The IndexNow protocol is fully implemented on this project:

| Component | Status | Location |
|---|---|---|
| API key secret | Configured | `INDEXNOW_API_KEY` env secret |
| Key verification file | Deployed | `public/a3f8c2d7e1b5049f6a2c8d3e7f1b4a9c.txt` |
| `indexnow` edge function | Deployed | `supabase/functions/indexnow/index.ts` |
| `indexnow-batch` edge function | Deployed | `supabase/functions/indexnow-batch/index.ts` |
| `pingIndexNow()` client utility | Exists | `src/lib/indexnow.ts` |
| `indexNowUrl` URL builders | Exists | `src/lib/indexnow.ts` |
| `indexnow_submissions` log table | Exists | Database |
| DB trigger on filament price change | Exists | `ping_indexnow_on_filament_price_change()` function |
| DB trigger on new brand insert | Exists | `ping_indexnow_on_brand_insert()` function |

### The Real Gap: `pingIndexNow` is Never Called from the App

`pingIndexNow()` exists in `src/lib/indexnow.ts` but is **never imported or called** anywhere in `src/`. The DB triggers cover price changes and new brands, but the following events have no IndexNow ping:

| Event | Current Hook | Missing ping |
|---|---|---|
| New filament created | `useCreateFilament.ts → onSuccess` | No IndexNow call |
| New printer created | `useCreatePrinter.ts → onSuccess` | No IndexNow call |
| Filament metadata updated | `useProductMutations.ts → useUpdateFilament → onSuccess` | No IndexNow call |
| Printer metadata updated | `useProductMutations.ts → useUpdatePrinter → onSuccess` | No IndexNow call |

### Fix: Wire `pingIndexNow` into the Four Mutation Hooks

**1. `src/hooks/useCreateFilament.ts`** — In `onSuccess`, after the toast, call:
```typescript
import { pingIndexNow, indexNowUrl } from '@/lib/indexnow';

// inside onSuccess:
if (result.product_handle || result.id) {
  pingIndexNow(indexNowUrl.filament(result.product_handle || result.id));
}
```

**2. `src/hooks/useCreatePrinter.ts`** — In `onSuccess`, after the toast, call:
```typescript
import { pingIndexNow, indexNowUrl } from '@/lib/indexnow';

// inside onSuccess:
if (result.printer_id || result.id) {
  pingIndexNow(indexNowUrl.printer(result.printer_id || result.id));
}
```

**3. `src/hooks/useProductMutations.ts → useUpdateFilament`** — In `onSuccess(result)`:
```typescript
import { pingIndexNow, indexNowUrl } from '@/lib/indexnow';

// inside onSuccess:
if (result.product_handle || result.id) {
  pingIndexNow(indexNowUrl.filament(result.product_handle || result.id));
}
```

**4. `src/hooks/useProductMutations.ts → useUpdatePrinter`** — In `onSuccess(result)`:
```typescript
import { pingIndexNow, indexNowUrl } from '@/lib/indexnow';

// inside onSuccess:
if (result.printer_id || result.id) {
  pingIndexNow(indexNowUrl.printer(result.printer_id || result.id));
}
```

### What Does NOT Change

- No new edge functions — `indexnow` already handles everything.
- No new key file — `a3f8c2d7e1b5049f6a2c8d3e7f1b4a9c.txt` already exists at the root.
- No new DB triggers — price-change and brand-insert triggers already exist.
- No new secrets — `INDEXNOW_API_KEY` is already configured.
- The `indexnow-batch` scheduled function covers the remaining content types (guides, static pages, materials, colors) through its full-site crawl.

### Files to Change

1. `src/hooks/useCreateFilament.ts` — add `pingIndexNow` call in `onSuccess`
2. `src/hooks/useCreatePrinter.ts` — add `pingIndexNow` call in `onSuccess`
3. `src/hooks/useProductMutations.ts` — add `pingIndexNow` call in both `useUpdateFilament` and `useUpdatePrinter` `onSuccess` handlers

These are the only three files that need touching — 3–4 lines of change per file.
