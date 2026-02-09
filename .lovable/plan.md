

# Fix: Service Worker Caching Stale JavaScript Chunks

## Problem

The Workbox service worker caches `.js` and `.css` files with `StaleWhileRevalidate`, which serves stale (broken) JavaScript chunks to returning users even after a new build is published. This is the reason the blank page persists after deploying the chunking fix.

The core issue: the old `index.html` is precached and served from cache, referencing old chunk filenames that contain the circular dependency bug. Even though new chunks have different content hashes, the cached `index.html` still points to the old ones.

## Fix Plan

### 1. Change JS/CSS caching strategy from `StaleWhileRevalidate` to `NetworkFirst`

In `vite.config.ts`, update the static assets runtime caching rule so that JS and CSS files are always fetched from the network first, falling back to cache only when offline. This ensures users always get the latest build artifacts.

```
Before:  handler: "StaleWhileRevalidate"  (for .js/.css)
After:   handler: "NetworkFirst"          (for .js/.css)
```

### 2. Add a version-based cache-busting mechanism (optional but recommended)

Reduce the `maxAgeSeconds` for the `static-resources` cache from 7 days to 1 day, since Vite already uses content-hashed filenames and stale entries are the primary risk.

### Technical Details

**File: `vite.config.ts`**

Change the static assets caching rule (around line 107-117):

```typescript
{
  // Cache static assets
  urlPattern: /\.(?:js|css)$/,
  handler: "NetworkFirst",  // was "StaleWhileRevalidate"
  options: {
    cacheName: "static-resources",
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24, // 1 day (was 7 days)
    },
  },
},
```

### Post-Deploy

After publishing, existing users with the old service worker will still need one page load for the new SW to activate (`skipWaiting` handles this). On that first load, the new `NetworkFirst` strategy will immediately fetch fresh JS from the server. Users who are currently stuck on the blank page will recover after a single refresh.

