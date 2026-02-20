
# Root Cause: Complete Diagnosis

## What is actually happening

Three separate systems exist and they are in conflict:

```text
Request: https://filascope.com/robots.txt
         ↓
         Lovable Cloud hosting (filascope.lovable.app custom domain)
         ↓
  Is it a known static file in public/? → YES → serve public/robots.txt
         ↓
  BUT... something is intercepting before this
```

When `https://filascope.com/robots.txt` was fetched live, it returned the **old generic robots.txt content** — the exact same content that is hardcoded at line 1330 of `supabase/functions/prerender/index.ts`. This is the definitive proof: **the prerender function is being called for `/robots.txt`** and it is returning its own stale, outdated copy.

This happens because the `_worker.js` checks `isStaticAsset(pathname)` — and `.txt` files match the `STATIC_EXTENSIONS` regex — so robots.txt should go to `env.ASSETS.fetch()`. BUT: `_worker.js` is a Cloudflare Pages Workers feature. **Lovable's hosting is NOT Cloudflare Pages.** The `_worker.js` and `_redirects` files are completely ignored on Lovable hosting.

Meanwhile, Google's crawler (Googlebot) is a bot. The Lovable hosting platform's own bot detection may be forwarding bot requests to the prerender function — which then hits the `/robots.txt` path and returns the old hardcoded content from line 1330–1350.

## What needs to be fixed (two changes, one file)

The single source of truth for robots.txt served to crawlers is **`supabase/functions/prerender/index.ts`** at lines 1330–1350.

### Fix 1 — Update `prerender/index.ts` ROBOTS_TXT constant (lines 1330–1350)

Replace the old, generic 10-line robots.txt with the full FilaScope policy including all 13 AI bot directives. This is the content that crawlers actually receive.

```text
const ROBOTS_TXT = `# FilaScope robots.txt — AI & Search Engine Crawler Policy
# Updated: 2026-02-20

User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /admin/
Disallow: /_/

Sitemap: https://filascope.com/sitemap.xml

User-agent: GPTBot
Allow: /

... (all 13 AI bot directives)
```

The `Sitemap:` line also needs to point to `https://filascope.com/sitemap.xml` (not the raw Supabase function URL as it currently does via `${FUNCTIONS_URL}/prerender?path=/sitemap.xml`).

### Fix 2 — Add diagnostic logging to the robots.txt handler

To confirm delivery going forward, add a `console.log` in the prerender function's robots.txt handler so every serve is visible in edge function logs:

```typescript
if (path === "/robots.txt") {
  console.log(`[ROBOTS] Serving robots.txt to UA: ${userAgent}`);
  return new Response(ROBOTS_TXT, { ... });
}
```

### Fix 3 — Update `public/robots.txt` Sitemap line

The `public/robots.txt` (served to non-bot human visitors via Lovable hosting) currently has `Sitemap: https://filascope.com/sitemap.xml` which is correct, but this is a secondary file. The primary one is inside `prerender`.

## Why previous fixes did not work

| Attempt | Why it failed |
|---|---|
| `public/robots.txt` file added | Lovable hosting serves it to humans fine — but crawlers hit the prerender function first |
| `_redirects` with 302 to serve-robots | `_redirects` is a Cloudflare Pages feature — Lovable hosting ignores it |
| `_worker.js` robots.txt handler | `_worker.js` is a Cloudflare Pages Worker feature — Lovable hosting ignores it |
| `serve-robots` edge function | Works correctly if called directly, but nothing routes to it on Lovable hosting |

The entire fix is **one change in one file: `supabase/functions/prerender/index.ts`**, lines 1330–1350.

## Technical implementation steps

1. Update `ROBOTS_TXT` constant in `prerender/index.ts` (lines 1330–1350) with the full FilaScope AI-crawler policy.
2. Fix the `Sitemap:` line to point to `https://filascope.com/sitemap.xml` (canonical URL, not the raw Supabase function URL).
3. Add a `console.log` to the robots.txt serve path for ongoing diagnostics.
4. Redeploy the `prerender` edge function.
5. Verify by fetching `https://filascope.com/robots.txt` — it should now return the full FilaScope policy with all AI bot directives.

No changes to `_worker.js`, `_redirects`, `serve-robots`, or any other file are needed.
