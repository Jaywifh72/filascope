
## Fix: Hreflang Tags — Remove Non-English Locales & Correct Regional Mapping

### Problem Summary

The current `HreflangTags.tsx` has three incorrect entries that can cause Google to distrust **all** hreflang signals site-wide:

| Current (wrong) | Issue |
|---|---|
| `hreflang="de" ?region=EU` | `de` = German language — but the page is English. Signal mismatch. |
| `hreflang="ja" ?region=JP` | `ja` = Japanese language — same mismatch. |
| `hreflang="zh" ?region=CN` | `zh` = Chinese language — same mismatch. |

Google's hreflang spec requires the language tag to match the **actual language of the page content**, not the target market. Tagging English pages as German/Japanese/Chinese is a spec violation.

### The Correct Set

| hreflang | href | Why |
|---|---|---|
| `en-US` | `…?region=US` | English, US market |
| `en-CA` | `…?region=CA` | English, Canada market |
| `en-GB` | `…?region=UK` | English, UK market |
| `en-AU` | `…?region=AU` | English, Australia market |
| `en` | `…?region=EU` | Generic English for EU region (no en-EU code exists) |
| `x-default` | `…` (no region param) | Fallback for all other visitors |

JP and CN are dropped entirely — the site has no Japanese or Chinese content so hreflang signals for those regions provide no value and create noise.

### Technical Changes

**File 1: `src/components/seo/HreflangTags.tsx`**

Replace the `REGIONAL_HREFLANGS` array:

```typescript
// BEFORE (incorrect)
const REGIONAL_HREFLANGS = [
  { hreflang: 'en-US', regionParam: 'US' },
  { hreflang: 'en-CA', regionParam: 'CA' },
  { hreflang: 'en-GB', regionParam: 'UK' },
  { hreflang: 'en-AU', regionParam: 'AU' },
  { hreflang: 'de',    regionParam: 'EU' },  // ❌ wrong language code
  { hreflang: 'ja',    regionParam: 'JP' },  // ❌ wrong language code
  { hreflang: 'zh',    regionParam: 'CN' },  // ❌ wrong language code
] as const;

// AFTER (correct)
const REGIONAL_HREFLANGS = [
  { hreflang: 'en-US', regionParam: 'US' },
  { hreflang: 'en-CA', regionParam: 'CA' },
  { hreflang: 'en-GB', regionParam: 'UK' },
  { hreflang: 'en-AU', regionParam: 'AU' },
  { hreflang: 'en',    regionParam: 'EU' },  // ✅ generic English for EU
  // JP and CN removed — no Japanese/Chinese content
] as const;
```

No other logic changes needed — the `useEffect` that injects the `<link>` tags, the `x-default` entry, and the cleanup on route change all remain identical.

**File 2: `src/components/admin/analytics/SeoHealthPanel.tsx`**

Update the `HREFLANGS` display array to match the new set (so the admin SEO health panel shows the correct tags):

```typescript
// BEFORE
const HREFLANGS = ["en-US", "en-CA", "en-GB", "en-AU", "de", "ja", "zh", "x-default"];

// AFTER
const HREFLANGS = ["en-US", "en-CA", "en-GB", "en-AU", "en", "x-default"];
```

### What Stays the Same

- `HreflangTags` is already mounted globally in `App.tsx` → applies to every page automatically.
- The `x-default` logic (pointing to the clean canonical path, no `?region=` param) is already correct.
- The route exclusion list (`/admin`, `/settings`, `/auth`, `/maintenance`) is already correct.
- The canonical URL stripping in `ProductSEO.tsx` is unaffected.

### Files Changed

1. `src/components/seo/HreflangTags.tsx` — update `REGIONAL_HREFLANGS` constant (5 entries instead of 7)
2. `src/components/admin/analytics/SeoHealthPanel.tsx` — update `HREFLANGS` display array
