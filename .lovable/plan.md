
## Fix: Google/Bing Verification Codes + Prerender Crawler Detection

### Problem Summary

There are three distinct problems blocking Google Search Console verification and proper indexing:

1. **index.html has literal placeholder strings** for Google and Bing verification codes. Since `index.html` is a static file processed by Vite, `import.meta.env` expressions do NOT work there — the file is not run through the Vite template engine like JSX components are.

2. **The `CRAWLER_AGENTS` array is missing several key Google crawler variants**, including `google-inspectiontool` (used by the URL Inspection tool in Search Console), `googlebot-image`, `adsbot-google`, `mediapartners-google`, and others. If Google's inspection tool sends requests with those user-agents, `isCrawler()` returns false and they get a redirect to the SPA instead of prerendered HTML.

3. **No logging exists** when `isCrawler()` fires, making it impossible to determine from edge function logs whether Google ever successfully received prerendered content.

Additionally, the path normalization in the Deno handler has a subtle edge case: trailing slashes are stripped (line 797 handles this), but there is no fallback for when `?path=` is missing from the request and the actual path is in the URL `pathname` instead.

---

### Technical Approach

#### Part 1 — Verification codes in `index.html`

`index.meta.env` does NOT interpolate in raw `index.html` files (that syntax only works inside `.tsx`/`.ts` files compiled by Vite). The standard solution for this is a **Vite HTML plugin** that reads env variables at build time and injects them.

Vite supports this natively with the `%VITE_VAR_NAME%` syntax in `index.html` — this IS processed during build/dev. We will:

- Change `content="REPLACE_WITH_GOOGLE_CODE"` → `content="%VITE_GOOGLE_SITE_VERIFICATION%"`
- Change `content="REPLACE_WITH_BING_CODE"` → `content="%VITE_BING_SITE_VERIFICATION%"`

These will be replaced at build time if the environment variables are set. If they are empty, Vite leaves the literal empty string `""` (which is fine — the meta tag won't do anything but won't break the page).

The actual secret values will be stored as Lovable Cloud secrets (`VITE_GOOGLE_SITE_VERIFICATION` and `VITE_BING_SITE_VERIFICATION`), which flow into the build environment automatically.

#### Part 2 — Expand `CRAWLER_AGENTS` in the prerender function

Update the constant at line 15 to include all missing Google-family agents and other major crawlers:

```
"googlebot-image", "googlebot-news", "googlebot-video",
"google-inspectiontool", "storebot-google", "apis-google",
"adsbot-google", "mediapartners-google",
"petalbot", "bytespider"
```

The `isCrawler()` function already does a case-insensitive `.includes()` check, so these string additions are sufficient.

#### Part 3 — Add `[PRERENDER]` logging to the main handler

In `Deno.serve`, after `isCrawler(userAgent)` returns true, add:

```ts
console.log(`[PRERENDER] crawler=${userAgent} path=${path}`);
```

And before returning the HTML response:

```ts
console.log(`[PRERENDER] status=${is404 ? 404 : 200} path=${path}`);
```

This allows filtering logs with `[PRERENDER]` in the Lovable Cloud edge function log viewer to instantly see which bots are hitting the function and whether they get real content or 404s.

#### Part 4 — Path fallback for missing `?path=` parameter

Currently: `let path = url.searchParams.get("path") || "/";`

When the prerender function is called via the inline JS redirect in `index.html`, the path is always passed as `?path=/some/route`. But Google's URL Inspection tool and direct crawl tests might call the function differently.

Add a fallback:

```ts
let path = url.searchParams.get("path") || url.pathname.replace(/^\/prerender/, "") || "/";
```

Also ensure trailing slashes and query parameters on the path itself are cleaned:

```ts
path = path.split("?")[0]; // strip any query params embedded in path
path = path.replace(/\/+$/, "") || "/"; // strip trailing slash
```

---

### Files to Modify

1. **`index.html`** (lines 7–8): Replace placeholder strings with Vite env syntax `%VITE_GOOGLE_SITE_VERIFICATION%` and `%VITE_BING_SITE_VERIFICATION%`

2. **`supabase/functions/prerender/index.ts`**:
   - Lines 15–19: Expand `CRAWLER_AGENTS` array with 10 new entries
   - Lines 795–797: Improve path extraction with query-param stripping and pathname fallback
   - Lines 820–848: Add `[PRERENDER]` console.log calls for crawler hits and response status

### What Changes and What Stays the Same

- All page-building functions (`filamentPage`, `brandPage`, `buildHtml`, etc.) are untouched
- The robots.txt and sitemap serving logic is untouched
- The Supabase client initialization is untouched
- The redirect logic for non-crawlers is untouched
- Only the crawler detection list, the path parsing, and the logging lines change

### After This Fix

- Google Search Console will be verifiable (once you add the actual verification code as an environment variable via the backend settings)
- The URL Inspection tool in Search Console (`google-inspectiontool` UA) will correctly receive prerendered HTML
- Edge function logs will show `[PRERENDER] crawler=Googlebot/2.1 path=/filament/...` entries, making it straightforward to confirm Google is receiving prerendered pages
- The Bing webmaster verification will similarly work once its code is added
