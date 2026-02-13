

# Admin Affiliate Hub -- Brand Programs Manager

## Overview
Create a new admin page at `/old-admin/affiliate-hub` that serves as the command center for managing all affiliate programs, discount codes, campaigns, and restrictions across brands and regions. Uses the new `affiliate_programs` schema (not the old `affiliate_configs`).

## File Structure

### New Files to Create

1. **`src/pages/AdminAffiliateHub.tsx`** -- Main page component
   - Uses `AdminLayout` wrapper with `AdminPageHeader`
   - Summary stats bar (6 metric cards)
   - Two top-level tabs: "Brand Programs" and "Click Analytics" (placeholder)
   - Brand Programs tab renders accordion list grouped by `brand_name`

2. **`src/hooks/useAffiliatePrograms.ts`** -- React Query hooks
   - `useAffiliatePrograms()` -- fetches all programs with related data
   - `useAffiliateProgramStats()` -- fetches summary counts
   - `useAffiliateDiscountCodes(programId)` -- codes for a program
   - `useAffiliateCampaigns(programId)` -- campaigns for a program
   - `useAffiliateProgramRestrictions(programId)` -- restrictions
   - `useAffiliateClickCount()` -- 30-day click count
   - Mutation hooks: `useCreateProgram`, `useUpdateProgram`, `useCreateDiscountCode`, `useCreateCampaign`, `useCreateRestriction`, etc.

3. **`src/components/admin/affiliate-hub/BrandAccordionItem.tsx`**
   - Accordion header: brand name, region count, status dots, code/campaign counts
   - Inner content: horizontal Tabs per region_code, plus "+" tab for adding region

4. **`src/components/admin/affiliate-hub/ProgramOverviewCard.tsx`**
   - Section 1: Status badge, two-column grid of program details
   - Link template in monospace code block
   - Status/program notes callouts
   - "Edit Program" and "Test Link" buttons

5. **`src/components/admin/affiliate-hub/LinkGeneratorCard.tsx`**
   - Section 2: Path input, "Generate Link" button, URL output with breakdown
   - Quick copy buttons (Copy Link, Copy with UTM, Copy Homepage Link)
   - Uses `buildAffiliateLinkLocal` from `src/utils/affiliateLinks.ts`

6. **`src/components/admin/affiliate-hub/DiscountCodesCard.tsx`**
   - Section 3: Table of codes with copy buttons, status badges, edit/deactivate
   - "Add Discount Code" dialog with full form
   - Posting restrictions warning callout
   - Filter toggle for expired codes

7. **`src/components/admin/affiliate-hub/CampaignsCard.tsx`**
   - Section 4: Campaign cards sorted by status (active, upcoming, ended)
   - Type badges, date ranges, linked discount codes
   - "Add Campaign" dialog

8. **`src/components/admin/affiliate-hub/RestrictionsCard.tsx`**
   - Section 5: Compact restriction rows with icons by type
   - Severity badges (red/yellow/blue)
   - "Add Restriction" and "Copy All" buttons

9. **`src/components/admin/affiliate-hub/ProgramFormDialog.tsx`**
   - Large dialog/sheet for creating or editing a program
   - 6 organized form sections matching the spec
   - Live link preview in tracking section
   - Validation: brand_name, store_base_url, tracking_parameter, tracking_value required

10. **`src/components/admin/affiliate-hub/AffiliateSummaryStats.tsx`**
    - 6 stat cards: Total Programs, Active Programs, Pending Verification, Clicks (30d), Active Codes, Active Campaigns

## Files to Modify

1. **`src/App.tsx`**
   - Add lazy import for `AdminAffiliateHub`
   - Add route: `<Route path="/old-admin/affiliate-hub" element={<AdminAffiliateHub />} />`

2. **`src/components/admin/AdminSidebar.tsx`**
   - Add "Affiliate Hub" entry to the System nav group (or create a new "Affiliates" group)
   - Uses a suitable icon (e.g., `Handshake` or `DollarSign`)

3. **`src/pages/AdminDashboard.tsx`**
   - Add "Affiliate Hub" to quick actions grid

## Data Flow

- All queries use React Query (`@tanstack/react-query`) with keys like `["affiliate-programs"]`, `["affiliate-discount-codes", programId]`, etc.
- Programs are fetched in a single query, then grouped client-side by `brand_name`
- Related data (codes, campaigns, restrictions) fetched per-program on accordion expand (lazy loading)
- All mutations invalidate parent query keys on success
- Toast notifications via `sonner` for all CRUD operations

## Technical Notes

- All Supabase queries go through the existing `supabase` client from `@/integrations/supabase/client`
- Types from `src/types/affiliate.ts` are already defined and match the DB schema
- The `buildAffiliateLinkLocal` utility from `src/utils/affiliateLinks.ts` is used for the link generator and test link features
- No database changes needed -- all tables and RLS policies already exist
- The old `/old-admin/affiliates` route remains untouched
- Admin access is enforced by `AdminLayout` which checks `useAuth().isAdmin`

