
## Root Cause — Confirmed by Live Testing

Fetching `https://filascope.com/sitemap.xml` returns the SPA's 404 page. Fetching the edge function directly (`https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap.xml`) returns valid XML immediately.

The `_redirects` file already has all the correct 302 rules at lines 3–9, above the SPA catch-all. **The rules are correct but Lovable's hosting infrastructure does not process `_redirects` cross-origin 302 redirects** — only the SPA catch-all `/* /index.html 200` takes effect. Adding `/robots.txt /robots.txt 200` to `_redirects` would also be a no-op for static files (they're already served directly).

The `robots.txt` file itself **already works** — confirmed by live fetch. No change needed there.

---

## The Correct Fix

Since `_redirects` 302s aren't honoured, the redirect must happen **inside the React application** itself, via React Router routes that fire a `window.location.replace()` immediately on mount.

Add explicit routes in `App.tsx` for all sitemap paths **before** the catch-all `*` NotFound route. Each route renders a tiny redirect component that immediately sends the browser to the edge function URL.

This works because:
1. Lovable's hosting serves `index.html` for all non-static paths (the SPA catch-all)
2. React Router picks up `/sitemap.xml` as a client-side route
3. The redirect component fires synchronously and replaces the URL with the edge function endpoint
4. Google/Bing crawlers following 302s will land at the edge function and get valid XML

---

## Files to Change

### 1. `src/App.tsx`

Add a `SitemapRedirect` component at the top of the file (before `App`), then add 8 routes before the `*` catch-all:

```typescript
// Sitemap redirect component — redirects crawlers and browsers to the edge function
function SitemapRedirect({ path }: { path: string }) {
  const EDGE_BASE = "https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=";
  useEffect(() => {
    window.location.replace(EDGE_BASE + path);
  }, [path]);
  // Render nothing — redirect fires immediately
  return null;
}
```

Then add these 8 routes immediately before `<Route path="*" element={<NotFound />} />`:

```tsx
{/* Sitemap routes — redirect to edge function since _redirects 302s aren't processed */}
<Route path="/sitemap.xml"           element={<SitemapRedirect path="/sitemap.xml" />} />
<Route path="/sitemap-pages.xml"     element={<SitemapRedirect path="/sitemap-pages.xml" />} />
<Route path="/sitemap-filaments.xml" element={<SitemapRedirect path="/sitemap-filaments.xml" />} />
<Route path="/sitemap-brands.xml"    element={<SitemapRedirect path="/sitemap-brands.xml" />} />
<Route path="/sitemap-printers.xml"  element={<SitemapRedirect path="/sitemap-printers.xml" />} />
<Route path="/sitemap-guides.xml"    element={<SitemapRedirect path="/sitemap-guides.xml" />} />
<Route path="/sitemap-colors.xml"    element={<SitemapRedirect path="/sitemap-colors.xml" />} />
```

### 2. `public/_redirects`

Add an explicit `/robots.txt /robots.txt 200` rule at the very top, before the sitemap rules. Even though `robots.txt` already works (it's a static file), the explicit rule makes the intent clear and future-proofs it if the platform's static file resolution order ever changes:

```
/robots.txt    /robots.txt    200
```

---

## What Changes and Why

| Path | Before | After |
|---|---|---|
| `/robots.txt` | ✅ Works (static file) | ✅ Still works + explicit rule |
| `/sitemap.xml` | ❌ Returns SPA 404 page | ✅ React route → `window.location.replace` → edge function XML |
| `/sitemap-filaments.xml` | ❌ Returns SPA 404 page | ✅ Same pattern |
| `/sitemap-pages.xml` | ❌ Returns SPA 404 page | ✅ Same pattern |
| (all other sitemap-*.xml) | ❌ Returns SPA 404 page | ✅ Same pattern |

---

## Why Not Other Approaches

- **`_redirects` 302s** — Already present, confirmed not working on Lovable's hosting for cross-origin redirects
- **A new static `sitemap.xml` file in `/public/`** — Would serve a static XML file, but the sitemap needs to be dynamically generated from the live database (1,078+ filament URLs). The edge function handles this correctly.
- **Vite `publicDir` config** — Already defaults to `public/`, already correct, not the issue
- **New edge function as a proxy** — Unnecessary; the existing `sitemap-xml` and `prerender` functions already work perfectly when hit directly

---

## Technical Notes

- `useEffect` with `window.location.replace()` fires synchronously after mount — no visible flash or loading state
- `replace()` (not `href`) avoids adding a history entry so the back button doesn't loop
- Googlebot handles JavaScript redirects — it will follow the redirect and index the XML
- For the initial millisecond before the redirect fires, the component renders `null` (blank page) — crawlers won't see any HTML from the SPA during this window
- The `_redirects` change (adding `/robots.txt /robots.txt 200`) is safe — it reinforces static file serving and is processed first if the platform does honour `_redirects` for same-origin rules

---

## Files Changed

| File | Change |
|---|---|
| `src/App.tsx` | Add `SitemapRedirect` component + 7 sitemap routes before `*` catch-all |
| `public/_redirects` | Add `/robots.txt /robots.txt 200` at top (defensive hardening) |
