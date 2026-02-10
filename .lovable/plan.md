

# Deduplicate Supabase API Calls on Homepage

## Problem

Two hooks cause redundant network requests because they lack centralized caching:

1. **`useAuth`** (108 consumers) -- plain `useState`/`useEffect` with no shared state. Every component calling `useAuth()` creates its own instance, each independently calling `supabase.auth.getSession()` and querying `user_roles`. On the homepage, ~8 components mount it simultaneously = 8 identical `user_roles` queries.

2. **`useBrowseHistory`** (12 consumers) -- uses React Query but includes `limit` in the query key (`["browse-history", userId, limit]`). Components request different limits (5, 11, 20, 100), creating separate cached entries. The homepage mounts it with limit=5 (ContinueBrowsing), limit=6 (Sidebar), and limit=11 (RecentlyViewed) = 3 separate Supabase queries for the same data plus the sync POST loop.

## Solution

### Step 1: Convert `useAuth` to a React Context Provider

Create `src/contexts/AuthContext.tsx` with a single `AuthProvider` that:
- Calls `supabase.auth.getSession()` once on mount
- Subscribes to `onAuthStateChange` once
- Queries `user_roles` once per login
- Exposes `{ user, isAdmin, loading }` via context

Then update `src/hooks/useAuth.tsx` to simply consume the context (keeping the same return signature so no consumer changes are needed):

```
export const useAuth = () => useContext(AuthContext);
```

Wrap the app in `AuthProvider` in `src/App.tsx`, above all other providers.

**Result:** 8 `user_roles` queries reduced to 1. Zero changes needed in 108 consumer files.

### Step 2: Normalize `useBrowseHistory` Query Key

Change the React Query key from `["browse-history", userId, limit]` to just `["browse-history", userId]` and always fetch with a generous limit (e.g., 50). Each consumer then slices the cached result to its own desired limit.

In `src/hooks/useBrowseHistory.ts`:
- Remove `limit` from the query key so all consumers share one cache entry
- Fetch with a fixed internal limit (50)
- Slice the result to the caller's `limit` in the return value

**Result:** 3+ browse history GETs reduced to 1. All consumers (limit=5, 6, 11, 20) read from the same cache.

### Step 3: Batch the localStorage Sync POSTs

The current sync loop (lines 216-228) does individual `INSERT` calls for each localStorage item:

```ts
for (const item of localItems.slice(0, 10)) {
  await supabase.from("user_browse_history").insert({...});
}
```

Replace with a single batch insert:

```ts
await supabase.from("user_browse_history").insert(
  localItems.slice(0, 10).map(item => ({...}))
);
```

**Result:** Up to 10 sequential POSTs reduced to 1.

## Files Changed

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | **New file** -- AuthProvider with single auth + role query |
| `src/hooks/useAuth.tsx` | Replace implementation with context consumer (same API) |
| `src/App.tsx` | Wrap app in `<AuthProvider>` |
| `src/hooks/useBrowseHistory.ts` | Remove `limit` from query key, fetch fixed limit, slice on return, batch sync inserts |

## What Does NOT Change

- No UI changes whatsoever
- No changes to any of the 108 `useAuth()` consumers or 12 `useBrowseHistory()` consumers
- The return signatures of both hooks remain identical
- All existing functionality (admin checks, browse history tracking, clear/remove) works as before

## Expected Impact

- `user_roles` queries: 8 per page load reduced to 1
- `user_browse_history` GETs: 3+ per page load reduced to 1
- `user_browse_history` sync POSTs: up to 10 reduced to 1
- Estimated total homepage Supabase requests: from ~39 down to ~15 or fewer

