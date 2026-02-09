

# Resolving the White Screen on filascope.com

## Problem Summary

The production site (filascope.com and filascope.lovable.app) is showing a completely blank white screen. The **preview environment works perfectly** -- this is purely a production deployment issue.

## Root Cause

The deployment pipeline is failing to upload built assets to Cloudflare R2 (the CDN hosting layer) with a **`429 Too Many Requests`** error:

```
deployment to cloudflare failed: failed to upload files to R2:
StatusCode: 429 - Reduce your concurrent request rate for the same object.
```

This means the latest build output never reached production. The production site is either serving an incomplete/corrupted build, or the R2 bucket has stale or missing assets -- resulting in a white screen (the HTML shell loads, but the JS bundles are missing or broken).

## Why Re-publishing Hasn't Worked

The 429 error is a **rate limit on concurrent writes to the same R2 object**. Every publish attempt triggers the same upload process, which hits the same rate limit. This can happen when:

1. **Too many files** are being uploaded concurrently (the project has a very large asset footprint -- 160+ edge functions, PWA icons, fonts, splash screens, etc.)
2. **Rapid re-publish attempts** make it worse by stacking up requests against the same objects before previous attempts have cleared

## Resolution Plan

Since this is an infrastructure-level deployment issue (Cloudflare R2 rate limiting), the fix involves two approaches -- one immediate and one preventive:

### Step 1: Wait and Retry (Immediate)

R2 rate limits are transient. After allowing a cooldown period (typically 15-30 minutes of no publish attempts), a single clean re-publish should succeed. The key is to **not** rapidly retry, as each failed attempt resets the rate limit window.

**Action**: Wait at least 15-30 minutes from the last publish attempt, then publish once.

### Step 2: Reduce Build Output Size (Preventive)

To reduce the chance of hitting R2 rate limits in future deployments, we can slim down the number of files in the build output:

- **Audit PWA splash screens**: The project has 6 Apple splash screen references in `index.html`. If these images don't exist or aren't critical, removing the references reduces upload count.
- **Consolidate PWA icons**: Currently 8 icon sizes are declared. We can reduce to the 3-4 most critical sizes.
- **Review public/data directory**: Check if there are large or numerous static files that could be served from the database instead.

### Step 3: Add Service Worker Cache Busting (Code Change)

The PWA service worker (`vite-plugin-pwa` with `autoUpdate` registration) may be serving a cached version of the broken deployment even after a successful re-publish. We should ensure the service worker properly clears stale caches on update.

The current Workbox config already has `skipWaiting: true`, `clientsClaim: true`, and `cleanupOutdatedCaches: true`, which is correct. However, users who visited during the broken deployment may have a cached broken state.

**Action**: After a successful deployment, users may need to hard-refresh (Ctrl+Shift+R) or clear their browser cache once to pick up the new service worker.

### Step 4: Verify Post-Deployment

After a successful publish:
1. Verify `https://filascope.lovable.app` loads correctly
2. Verify `https://filascope.com` loads correctly (DNS/custom domain)
3. Test on an incognito/private window to rule out cached service workers
4. Test on mobile

## Technical Details

### What the user sees
The `index.html` likely loads (it sets `background-color: #0A0C10`), but the main JavaScript bundle (`/src/main.tsx`) fails to load because the compiled JS/CSS assets were never uploaded to R2. This produces a dark page with nothing rendered -- appearing as a white/blank screen depending on browser behavior.

### App architecture at risk
- The app has a `MaintenanceModeWrapper` that queries `site_settings` for maintenance mode -- maintenance mode is confirmed **disabled** (`enabled: false`), so this is not the cause.
- The `ErrorBoundary` and `initializeGlobalErrorHandler()` won't help here because the error occurs before React even mounts (missing JS bundles).

### No code changes needed
This issue is not caused by a bug in the application code. The preview environment proves the code works correctly. The fix is purely at the deployment/infrastructure layer -- successfully uploading the build output to the CDN.

## Recommended Immediate Action

1. **Wait 20-30 minutes** without publishing
2. **Publish once** using the Publish button
3. **Verify** in an incognito window on both `filascope.lovable.app` and `filascope.com`
4. If it still fails, we can investigate reducing the build output size or explore alternative deployment strategies

