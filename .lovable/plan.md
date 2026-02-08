

# Community Reviews and Photos: Activation Plan

## Current State Assessment

After a thorough audit, the review and community photo systems are **already fully implemented** in both the database and frontend. Here is what exists:

### Already Built (Database)
- `product_reviews` table with all requested columns (rating, headline, body, pros, cons, print settings, verified purchase, helpful count, status, soft delete)
- `review_photos` table for review image attachments
- `product_review_votes` table for "Was this helpful?" votes
- `community_photos` table with caption, printer, print settings, model source, like count
- `community_photo_files` for multi-photo uploads
- `community_photo_likes` for photo likes with a trigger to auto-update `like_count`
- RLS policies on all tables (read public reviews, users CRUD own data, vote tracking)
- Storage buckets: `review-photos` (public) and `community-photos` (public)

### Already Built (Frontend)
- **ReviewForm** (`src/components/reviews/ReviewForm.tsx`): Full form with star ratings (Quality, Ease, Value, Overall), headline, body, pros/cons tag input, printer selector, print settings (collapsible), photo upload (up to 5), visibility toggle
- **ReviewDisplay** (`src/components/reviews/ReviewDisplay.tsx`): Summary bar with distribution chart, review cards with avatar, verified badge, expand/collapse, photo lightbox, "Helpful" voting, "Report" button, sort (Recent/Highest/Helpful) and filter (Has Photos, Verified)
- **CommunityPhotoGallery** (`src/components/community-photos/CommunityPhotoGallery.tsx`): Masonry grid, sort by recent/popular, filter by printer/mine, likes, lightbox
- **SharePrintDialog** (`src/components/community-photos/SharePrintDialog.tsx`): Drag-and-drop photo upload, caption, printer selector, print settings, model source
- **useProductReviews hook**: Fetches reviews with profiles, printers, photos, vote status; handles submit, vote toggle
- **useCommunityPhotos hook**: Fetches photos with files, profiles, printers, like status; handles upload, like toggle, report, delete
- **Vault "My Reviews" tab** (`src/components/vault/VaultReviewsTab.tsx`): Full management with stats bar, filters, list/grid view, edit dialog, delete confirmation
- **FilamentCard community rating**: Already receives and displays `communityRating` prop with tooltip showing sub-ratings
- **useBulkCommunityRatings / useCommunityReviewStats**: Hooks for listing page and detail page aggregation

### Already Wired Into the Community Tab
The `CommunityTabContent.tsx` already integrates:
- `useProductReviews` hook
- `ReviewForm` component
- `ReviewSummaryBar` and `ReviewList` components
- `CommunityPhotoGallery` component (which includes `SharePrintDialog`)

**There are no "Coming Soon" badges on the Community tab itself.** The "Coming Soon" labels found in the codebase are on unrelated pages (Resources/Profiles, CAD Quiz, Troubleshooting Database, Diagnose tool, etc.).

## What Is Actually Needed

Since the infrastructure is complete, the remaining work falls into two small areas:

### 1. Review Moderation System (New)
The "Report" button on reviews currently has no backend action. A `review_flags` table and basic admin queue are needed.

**Database migration:**
- Create `review_flags` table: `id`, `review_id` (FK to product_reviews), `reporter_id` (user_id), `reason` (enum: spam, inappropriate, fake, other), `details` (text, optional), `status` (pending/reviewed/dismissed), `reviewed_by`, `reviewed_at`, `created_at`
- Add unique constraint on (review_id, reporter_id) to prevent duplicate reports
- RLS: authenticated users can INSERT their own flags, admins can SELECT/UPDATE all
- When a review gets 3+ flags, auto-set its `status` to `'pending'` (moderation hold)

**Frontend changes:**
- Wire the existing "Report" button in `ReviewDisplay.tsx` to open a small dialog asking for a reason (dropdown: Spam, Inappropriate, Fake Review, Other) and optional details, then insert into `review_flags`
- Show toast confirmation after report

### 2. Verified Purchase Badge Logic (Enhancement)
The `is_verified_purchase` column exists but is always `false`. Connect it to the user's wishlist/purchase data.

**Frontend change in ReviewForm:**
- Query the user's `wishlist_items` or purchase collection to check if they own the filament being reviewed
- If found, auto-check a "I own this filament" indicator and set `is_verified_purchase: true` on submission
- Display as a non-editable badge if auto-detected, or allow manual toggle if not auto-detected

### 3. "Lowest Rated" Sort Missing from Community Tab (Minor Fix)
The Community tab's `ReviewList` only has "Recent", "Highest", and "Helpful" sort options. Add "Lowest Rated" to match the Vault's sort options.

## Implementation Phases

### Phase 1: Review Flagging/Moderation
1. Create `review_flags` table with migration (with RLS)
2. Add a `ReportReviewDialog` component with reason selector
3. Wire the existing "Report" button in `ReviewDisplay.tsx` to use it
4. Add a review flag count check: if a review has 3+ unresolved flags, hide it from public view by updating its status to `'flagged'`

### Phase 2: Verified Purchase Auto-Detection
1. In `ReviewForm.tsx`, query user's wishlist items for the current product
2. If found in an "inventory" or "purchased" collection, auto-set `is_verified_purchase` to `true`
3. Show a visual indicator ("Verified Owner" badge) in the form

### Phase 3: Minor Polish
1. Add "Lowest Rated" sort option to `ReviewList` in `ReviewDisplay.tsx`
2. Ensure the "Report" button shows disabled state for non-logged-in users with a sign-in prompt

## Technical Details

### review_flags Table Schema

```text
review_flags
+------------------+------------------------+
| Column           | Type                   |
+------------------+------------------------+
| id               | uuid (PK, default)     |
| review_id        | uuid (FK product_reviews) |
| reporter_id      | uuid (auth.uid)        |
| reason           | text (NOT NULL)        |
| details          | text (nullable)        |
| status           | text (default 'pending') |
| reviewed_by      | uuid (nullable)        |
| reviewed_at      | timestamptz (nullable) |
| created_at       | timestamptz (default now) |
+------------------+------------------------+
UNIQUE(review_id, reporter_id)
```

### RLS Policies for review_flags
- SELECT: Admins only (using `has_role(auth.uid(), 'admin')`) + users can see their own flags
- INSERT: Authenticated users where `auth.uid() = reporter_id`
- UPDATE: Admins only (for status changes)
- No DELETE policy (flags should not be deletable)

### Files to Create
- `src/components/reviews/ReportReviewDialog.tsx` -- Report reason dialog

### Files to Modify
- `src/components/reviews/ReviewDisplay.tsx` -- Wire Report button to dialog, add "Lowest Rated" sort
- `src/components/reviews/ReviewForm.tsx` -- Add verified purchase auto-detection from wishlist
- `src/hooks/useProductReviews.ts` -- Add flag mutation, filter out heavily-flagged reviews from public view

### No Changes Needed
- Database tables (product_reviews, review_photos, product_review_votes, community_photos, community_photo_files, community_photo_likes) -- all exist
- ReviewForm functionality (star ratings, title, body, pros/cons, print settings, photo upload) -- all working
- ReviewDisplay (summary bar, cards, voting, filtering) -- all working  
- CommunityPhotoGallery + SharePrintDialog -- all working
- Vault "My Reviews" tab with edit/delete -- all working
- FilamentCard aggregate ratings -- already wired
- Storage buckets and RLS -- already configured

