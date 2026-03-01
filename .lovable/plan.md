

# Community TD Submissions & Verification System

## Overview
Build a crowdsourced TD measurement pipeline where authenticated users can submit TD values for filaments missing them (or verify existing ones), with admin review before data goes live. This addresses the gap between 111 filaments with TD data and 8,277+ total filaments.

## 1. Database Changes (Migration)

### New Tables
- **td_submissions** -- User-submitted TD measurements with fields for value, method, layer height, nozzle temp, printer model, photo URL, notes, and review status. Unique constraint on (filament_id, user_id). RLS policies for public read of approved, user CRUD of own, and admin management.
- **td_verifications** -- Community votes (accurate/too_high/too_low) on existing TD values. Unique constraint on (filament_id, user_id). Public read, authenticated insert.
- **td_community_stats** -- SQL VIEW joining filaments with aggregated submission counts, averages, stddev, and verification vote tallies.

### Storage
- Create a public bucket `td-calibration-photos` for user-uploaded calibration print photos.
- RLS on storage.objects: authenticated users can upload to their own path (`{filament_id}/{user_id}/*`), public read.

### RLS Policies
- td_submissions: public SELECT on approved rows, user SELECT/INSERT/UPDATE on own rows (UPDATE only when pending), admin full access via `has_role()`.
- td_verifications: public SELECT, authenticated INSERT on own rows.

## 2. New Components

### User-Facing Components (`src/components/filament/td-community/`)

**TdSubmissionButton.tsx**
- Renders "Submit TD Measurement" or "Verify This TD Value" button depending on whether the filament has a TD value.
- Opens the submission modal on click.
- Shows "Sign in to submit" prompt for unauthenticated users.

**TdSubmissionModal.tsx**
- Dialog form with fields: TD value (0-20, step 0.01), measurement method (select), layer height (select), nozzle temp (number), printer model (text), photo upload (file input), notes (textarea).
- Shows current TD value for reference if one exists.
- Validates with zod schema before insert into `td_submissions`.
- Photo upload to `td-calibration-photos/{filament_id}/{user_id}/{filename}`.
- Success toast with "Under review" message.

**TdVerificationWidget.tsx**
- Displayed below TD value on filament detail pages (only when TD exists).
- Three vote buttons: Accurate (green), Seems High (amber), Seems Low (red).
- Shows vote counts from `td_community_stats` view.
- After voting, highlights user's choice and shows "You voted: X".
- Optional TD input when voting too_high/too_low.
- Requires authentication.

**TdCommunityBadge.tsx**
- Small inline badge/icon for the TD database table rows.
- Green checkmark if 3+ accurate votes; blue people icon if community-submitted.
- Tooltip with details on hover.

**FilamentsNeedingTdSection.tsx**
- Section for the bottom of `/hueforge-td-database` page.
- Queries popular filaments (by name recognition or major brands) where `transmission_distance IS NULL`.
- Shows grid of 8-12 cards with color swatch, brand, name, material, and "Submit TD" button.

### Admin Components (`src/components/admin/td-management/`)

**TdSubmissionsReviewPanel.tsx**
- Table of all td_submissions with filter tabs: Pending, Approved, Rejected, All.
- Columns: Filament name, Submitted By, TD Value, Method, Status, Date.
- Row click opens detail view.

**TdSubmissionDetailModal.tsx**
- Shows all submission fields, calibration photo, current filament TD for comparison.
- Lists other approved submissions for the same filament.
- Shows community verification stats.
- Action buttons: Approve (optionally set filament TD), Reject (requires notes), Flag.

**TdBulkActions.tsx**
- Checkbox selection on submission rows.
- Bulk approve/reject with confirmation dialog.

## 3. Integration Points

### Filament Detail Page (`FilamentDetail.tsx`)
- Add `TdSubmissionButton` in the specs/TD section area (near where transmission_distance is displayed in `SpecificationsContent.tsx` and `FilamentHeroSection.tsx`).
- Add `TdVerificationWidget` below the TD badge in the hero section when TD exists.

### HueForge TD Database Page (`HueForgeTDDatabase.tsx`)
- Add `TdCommunityBadge` next to TD values in the table rows.
- Add `FilamentsNeedingTdSection` after the main table.

### Admin Panel (`TdManagement.tsx`)
- Add a new tab "Submissions" with `TdSubmissionsReviewPanel`.

## 4. Hooks

**useTdSubmission.ts** -- Handles insert/update of td_submissions, photo upload, and submission state.

**useTdVerification.ts** -- Handles insert of td_verifications, fetches user's existing vote, and community stats.

**useTdCommunityStats.ts** -- Queries the td_community_stats view for a given filament_id.

## 5. Implementation Sequence

1. Run database migration: create tables, view, storage bucket, and RLS policies.
2. Create hooks: `useTdSubmission`, `useTdVerification`, `useTdCommunityStats`.
3. Build user-facing components: `TdSubmissionModal`, `TdSubmissionButton`, `TdVerificationWidget`, `TdCommunityBadge`, `FilamentsNeedingTdSection`.
4. Integrate into `FilamentDetail.tsx` (button + verification widget) and `HueForgeTDDatabase.tsx` (badges + needing-TD section).
5. Build admin components: `TdSubmissionsReviewPanel`, `TdSubmissionDetailModal`, `TdBulkActions`.
6. Add "Submissions" tab to `TdManagement.tsx`.

## 6. Constraints and Notes

- No automatic TD value updates -- all submissions go through admin review.
- Client-side rate limit of 10 submissions/day (tracked via localStorage + query count check).
- CHECK constraints in the SQL use simple value range checks (immutable), which are safe. The `status` and `measurement_method` constraints use IN-lists, also immutable and safe.
- The unique constraint `(filament_id, user_id)` means one submission per user per filament -- users can update their pending submission but not create duplicates.
- Photo uploads are optional and capped at 5MB client-side.

