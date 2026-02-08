
# Public User Profile Page

## Overview

Add a public-facing profile page at `/user/:userId` that showcases a user's reviews, public projects, and activity stats. This requires schema changes to the `profiles` table (new columns for bio, social links, public visibility, and username slug), new RLS policies for public profile access, a new page component, and updates to the Settings page for editing the new fields.

## Current State

- `profiles` table exists with: `id`, `email`, `display_name`, `avatar_url`, `created_at`, `updated_at`, plus various preference columns
- RLS on `profiles`: users can only view/update their own profile; admins can view all
- No public profile page or route exists
- No `bio`, `social_links`, `is_public`, or `username_slug` columns
- `product_reviews` already has a public read policy (is_public + published)
- `projects` already has a public read policy (is_public)
- `project_materials` and `project_log_entries` also have public read policies

## Database Changes

### 1. Add columns to `profiles` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `bio` | text | null | Short bio, max 280 chars |
| `is_public` | boolean | false | Master toggle for profile visibility |
| `username_slug` | text | null | Unique URL slug (e.g. "makerjohn") |
| `social_links` | jsonb | '{}' | Links to Printables, Thingiverse, YouTube, Instagram |
| `wishlist_public` | boolean | false | Whether wishlist is shown on public profile |

### 2. Add unique index on `username_slug`

Partial unique index where `username_slug IS NOT NULL` to allow multiple nulls.

### 3. New RLS policy on `profiles`

Add a SELECT policy: "Anyone can view public profiles" with `qual: (is_public = true)`. This allows unauthenticated visitors to fetch basic profile data for public users.

### 4. New RLS policy on `user_favorites`

Add a SELECT policy: "Anyone can view public wishlist" with qual joining to profiles where both `profiles.is_public = true` AND `profiles.wishlist_public = true`.

## Route

- URL pattern: `/user/:userId`
- When a `username_slug` is set, the page also supports `/user/:slug` -- the hook will try UUID first, then fall back to slug lookup
- No authentication required (public page)

## Component Architecture

```text
src/pages/UserProfile.tsx                          (page component)
src/components/profile/ProfileHeader.tsx            (avatar, name, bio, badges, stats)
src/components/profile/ProfileReviewsTab.tsx        (public reviews grid)
src/components/profile/ProfileProjectsTab.tsx       (public projects grid)
src/components/profile/ProfileCollectionTab.tsx     (public wishlist, if enabled)
src/components/profile/ProfileActivityTab.tsx       (recent public actions)
src/hooks/usePublicProfile.ts                       (fetch profile + public data)
```

## Detailed UI Design

### A. Profile Header (`ProfileHeader`)

- Large avatar (with initials fallback) centered or left-aligned
- Display name as heading
- "Member since [month year]" subtitle
- Bio text (if set)
- Badge row: dynamically computed from user's data
  - "Top Reviewer" -- 20+ public reviews
  - "Active Reviewer" -- 5-19 public reviews
  - "Project Creator" -- 1+ public projects
  - "Verified Buyer" -- has verified purchase reviews
- Stats row: "X Reviews" | "X Projects" | "X Helpful Votes"
- Social links row: icon buttons linking to external profiles (Printables, Thingiverse, YouTube, Instagram) -- only shown if configured
- "Follow" button placeholder (disabled, styled, with tooltip "Coming soon")

### B. Tab Navigation

Horizontal tabs using the existing Tabs component:

1. **Reviews** (default) -- all public published reviews
2. **Projects** -- all public projects
3. **Collection** -- public wishlist items (only visible if `wishlist_public = true`)
4. **Activity** -- recent public actions timeline

### C. Reviews Tab (`ProfileReviewsTab`)

- Grid of product cards the user has reviewed
- Each card: product image, product name, star rating overlay, headline snippet
- Click navigates to `/filament/:id` (community tab)
- Sort by: Most Recent | Highest Rated | Most Helpful
- Uses existing `product_reviews` public read policy (no new RLS needed)

### D. Projects Tab (`ProfileProjectsTab`)

- Grid of public project cards: cover gradient, name, type badge, status badge, material count
- Click navigates to `/vault?tab=projects&project=:id` (existing public project view)
- Uses existing `projects` public read policy

### E. Collection Tab (`ProfileCollectionTab`)

- Only rendered if the profile has `wishlist_public = true`
- Shows filament cards from `user_favorites` with product details
- Read-only view -- no add/remove buttons
- Requires new RLS policy on `user_favorites`

### F. Activity Tab (`ProfileActivityTab`)

- Recent public actions aggregated from:
  - Reviews posted (from `product_reviews` where `is_public = true`)
  - Projects created/completed (from `projects` where `is_public = true`)
- Displayed as a simple timeline list: icon, action description, timestamp
- Limited to last 20 items

### G. Own-Profile Detection

When the logged-in user views their own profile:
- Show an "Edit Profile" button linking to `/settings`
- Show a subtle banner: "This is how others see your profile"
- If profile is private (`is_public = false`), show the page content with a warning: "Your profile is currently private. Only you can see this page."

## Settings Page Updates

Add a new "Public Profile" card section to `/settings` with:

1. **Bio** -- textarea, max 280 chars, character counter
2. **Username** -- text input with slug validation (lowercase, alphanumeric + hyphens, 3-30 chars). Shows preview: "filascope.lovable.app/user/[slug]". Validates uniqueness on blur
3. **Social Links** -- four optional URL inputs: Printables, Thingiverse, YouTube, Instagram
4. **Privacy Toggles**:
   - "Make my profile public" -- master toggle
   - "Show my wishlist on my profile" -- secondary toggle (only active if profile is public)
5. **Profile Preview** button -- links to `/user/:userId` in a new tab

## Data Hook: `usePublicProfile`

```text
usePublicProfile(identifier: string)
-- identifier can be a UUID or username slug
-- Returns: { profile, reviews, projects, wishlistItems, activity, isLoading, isOwnProfile }
-- Fetches profile from profiles table (public RLS)
-- Fetches reviews from product_reviews (public RLS) with filament/printer enrichment
-- Fetches projects from projects (public RLS)
-- Conditionally fetches wishlist if wishlist_public is true
-- Computes badges from data
```

## Implementation Sequence

1. Database migration -- add columns to `profiles`, add RLS policies for public profiles and public wishlist
2. Create `usePublicProfile` hook
3. Create `ProfileHeader` component
4. Create `ProfileReviewsTab` component
5. Create `ProfileProjectsTab` component
6. Create `ProfileCollectionTab` component
7. Create `ProfileActivityTab` component
8. Create `UserProfile` page (orchestrator with tabs)
9. Add route `/user/:userId` to App.tsx
10. Update Settings page with bio, username, social links, and privacy toggles
11. Add "View Profile" link to VaultHeroBar

## Edge Cases

- **Profile not found**: Show a 404-style message: "This profile doesn't exist or is set to private"
- **Private profile visited by non-owner**: Same 404 message (do not reveal that the user exists)
- **Username slug conflicts**: Validated at save time with uniqueness check; show inline error
- **No public content**: Profile page shows header but tabs show appropriate empty states ("No public reviews yet")
- **Deleted reviews**: Already filtered by `deleted_at IS NULL` in existing policies
