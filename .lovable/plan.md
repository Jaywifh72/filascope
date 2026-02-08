

# Price Drop Alert Feature -- Gap Analysis and Completion Plan

## Current State

This feature is roughly 70% built already. Here is what exists and what needs to be connected:

**Already working:**
- Database table `price_alerts` with all needed columns (id, user_id, filament_id, target_price, current_price_when_set, email_notifications, triggered_at, triggered_price, is_active, created_at)
- RLS policies (users can only CRUD their own alerts)
- Unique constraint on (user_id, filament_id)
- `DatabasePriceAlertModal` -- a polished modal with slider, email toggle, and login prompt for guests
- `useDatabasePriceAlerts` hook -- full Supabase CRUD with React Query
- `PriceAlertsSection` -- account-level card showing all alerts with triggered status
- Bell button already visible on the Pricing tab of every filament detail page

**What is broken or missing:**
1. The bell button on filament pages uses the OLD localStorage-based modal instead of the database-backed one
2. The `PriceAlertsSection` component exists but is NOT rendered on any page
3. No edge function to check alerts against current prices (Phase 2 of notifications)
4. Guest alert flow (email-only, no account) is not supported by the current schema
5. Hardcoded dark-mode colors in `PriceAlertsSection` need semantic tokens for the new light/dark mode

## Changes Required

### 1. Switch Filament Detail Page to Database-Backed Alerts

**File: `src/components/filament/tabs/PricingTabContent.tsx`**

- Replace the import of `PriceAlertModal` with `DatabasePriceAlertModal`
- Replace the import of `usePriceAlerts` with `useDatabasePriceAlerts`
- Update all references: `hasAlert(filamentId)` becomes `hasAlert(filamentId)` (same API), `existingAlert?.targetPrice` becomes `existingAlert?.target_price`
- Swap the `<PriceAlertModal>` JSX at the bottom for `<DatabasePriceAlertModal>` with the same props
- The bell button, slider, and existing alert status display all stay the same structurally

### 2. Add Price Alerts Tab to My Vault Page

**File: `src/pages/Vault.tsx`**

- Import `PriceAlertsSection` and `Bell` icon
- Add a 5th tab to the TabsList: "Price Alerts" with a bell icon and count from `useDatabasePriceAlerts`
- Add a corresponding `TabsContent` that renders `<PriceAlertsSection />`
- Update grid-cols from 4 to 5

### 3. Fix Theme Compatibility in PriceAlertsSection

**File: `src/components/account/PriceAlertsSection.tsx`**

- Replace hardcoded `bg-gray-800/50 border-gray-700` with `bg-card/50 border-border`
- Replace `bg-gray-700/50` skeleton with `bg-muted`
- Replace `text-gray-400`, `text-gray-500` with `text-muted-foreground`
- Replace `bg-gray-700/30 border-gray-700` on alert rows with `bg-muted/30 border-border`
- Replace `text-white` on filament names with `text-foreground`
- All green triggered-state classes remain as-is (they work in both themes)

### 4. Add Guest Email Alert Support (Database Schema)

**Database migration** -- add an `email` column for non-logged-in users:

```sql
ALTER TABLE price_alerts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE price_alerts ADD COLUMN email TEXT;
ALTER TABLE price_alerts ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE price_alerts ADD COLUMN region TEXT DEFAULT 'US';
```

Add a CHECK constraint ensuring either user_id or email is provided:

```sql
ALTER TABLE price_alerts ADD CONSTRAINT price_alerts_user_or_email 
  CHECK (user_id IS NOT NULL OR email IS NOT NULL);
```

Add RLS policy for anonymous inserts (with email):

```sql
CREATE POLICY "Anyone can create email-based price alerts" 
  ON price_alerts FOR INSERT 
  WITH CHECK (user_id IS NULL AND email IS NOT NULL);
```

### 5. Update DatabasePriceAlertModal for Guest Flow

**File: `src/components/filament/DatabasePriceAlertModal.tsx`**

- When user is NOT logged in, instead of showing "Sign in" prompt, show:
  - The same target price slider/input
  - An email input field: "Enter your email to get notified"
  - A "Set Alert" button that inserts directly with email (no user_id)
- Keep the existing "Sign in for more features" as a secondary CTA below

### 6. Update useDatabasePriceAlerts Hook for Guest Support

**File: `src/hooks/useDatabasePriceAlerts.ts`**

- Add a `setGuestAlert` mutation that inserts with email instead of user_id
- The query for fetching alerts remains user-only (guests can't see their alerts without logging in, which is acceptable)

### 7. Price Check Edge Function (Infrastructure for Phase 2)

**File: `supabase/functions/check-price-alerts/index.ts`**

- Query all active price alerts with their target prices
- Join with current filament prices
- For any alert where current price is at or below target:
  - Update the alert: set `triggered_at = NOW()`, `triggered_price = current_price`
  - Log the trigger event
- This function does NOT send emails yet (Phase 2) -- it just marks alerts as triggered
- Can be called manually or scheduled via cron

### 8. Clean Up Legacy localStorage Code

**Files to remove or deprecate:**
- `src/components/filament/PriceAlertModal.tsx` -- the old localStorage-based modal; delete it
- `src/hooks/usePriceAlerts.tsx` -- the old localStorage hook; delete it (verify no other consumers first)

## Summary of File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/filament/tabs/PricingTabContent.tsx` | Edit | Switch from localStorage modal to database modal |
| `src/pages/Vault.tsx` | Edit | Add "Price Alerts" as 5th tab |
| `src/components/account/PriceAlertsSection.tsx` | Edit | Fix hardcoded colors for light/dark mode |
| `src/components/filament/DatabasePriceAlertModal.tsx` | Edit | Add guest email flow |
| `src/hooks/useDatabasePriceAlerts.ts` | Edit | Add guest alert mutation |
| `supabase/functions/check-price-alerts/index.ts` | Create | Edge function to check and trigger alerts |
| `src/components/filament/PriceAlertModal.tsx` | Delete | Remove legacy localStorage modal |
| `src/hooks/usePriceAlerts.tsx` | Delete | Remove legacy localStorage hook |
| Database migration | Execute | Add email, currency, region columns; update constraints and RLS |

## Technical Notes

- The unique constraint `(user_id, filament_id)` will need to be adjusted since user_id becomes nullable. A partial unique index will replace it: one for logged-in users `(user_id, filament_id) WHERE user_id IS NOT NULL` and one for guests `(email, filament_id) WHERE email IS NOT NULL`.
- The edge function will use `SUPABASE_SERVICE_ROLE_KEY` (already configured) to bypass RLS when querying all alerts.
- No email sending in this implementation -- the edge function only marks alerts as triggered. The `PriceAlertsSection` in the Vault already highlights triggered alerts with green badges.

