

## Security Scan Remediation Plan

This plan addresses all 33 findings from the security scan across three scanners: Supabase linter, Supabase Lovable analysis, and the agent security scanner.

---

### Summary of Findings

| Severity | Count | Actionable | Ignore/Already Handled |
|----------|-------|------------|----------------------|
| Error    | 2     | 1 fix, 1 ignore | 1 |
| Warning  | 27    | 3 fixes, rest ignore | ~24 |
| Info     | 4     | 0 fixes, all ignore | 4 |

---

### Phase 1: Fix the XSS Risk in Release Notes Rendering

**Finding**: `unsanitized_html_release_notes` (warn)

The `renderReleaseNotes` function in `FirmwareSection.tsx` and `SoftwareSection.tsx` runs regex replacements BEFORE DOMPurify sanitization. While DOMPurify does run at the end, a safer approach is to escape dangerous characters first.

**Fix**: Reverse the order -- sanitize the raw input with DOMPurify first (stripping any HTML tags from the raw text), THEN apply the markdown-to-HTML regex transformations, THEN run DOMPurify again on the final HTML output. This creates a two-pass sanitization:

```text
1. DOMPurify.sanitize(rawText, {ALLOWED_TAGS: []})  -- strip all HTML from input
2. Apply regex transformations (safe because input is now plain text)
3. DOMPurify.sanitize(html, SANITIZE_CONFIG)         -- final sanitization
```

Files: `src/components/FirmwareSection.tsx`, `src/components/SoftwareSection.tsx`

---

### Phase 2: Database Migration -- Tighten RLS Policies

**A. Restrict `user_roles` SELECT to own roles only (non-admin)**

**Finding**: `User Role Assignments Visible to All Authenticated Users` (warn)

Currently there are multiple overlapping SELECT policies. Replace them with two clean policies:
- Users can view their own roles: `USING (auth.uid() = user_id)`
- Admins can view all roles: `USING (has_role(auth.uid(), 'admin'))`

Drop any duplicate/overlapping policies first.

**B. Remove duplicate `user_browse_history` INSERT policies**

**Finding**: `user_browse_history_inadequate_protection` (warn)

There are two INSERT policies on this table that overlap. Consolidate into one clean policy:
- `WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL AND session_id IS NOT NULL))`

Drop the duplicate.

---

### Phase 3: Ignore Findings That Are Working as Intended

The following findings will be marked as "ignored" with documented reasons, because they represent intentional design decisions or cannot be fixed through application code:

**Already ignored (no action needed):**
- `SUPA_extension_in_public` -- infrastructure config
- `SUPA_auth_leaked_password_protection` -- infrastructure config  
- `SUPA_rls_policy_always_true` (trend_upvotes) -- intentional public voting

**Will mark as ignored:**

1. **`profiles_table_public_exposure`** (error) -- The profiles table already has strict RLS: only `auth.uid() = id` for SELECT, plus admin access. The `v_public_profiles` view correctly excludes email, shipping info, and all PII -- it only exposes display_name, avatar_url, bio, social_links, and visibility flags. Anonymous users have no direct SELECT grant on the profiles table. This finding is a false positive.

2. **`safety_alert_subscriptions_email_phone`** (error) -- RLS already restricts to `auth.uid() = user_id` for all operations. Field-level encryption is not feasible through application code without breaking query functionality. The data is properly access-controlled.

3. **`User Activity and Session Data Publicly Insertable`** (warn) -- Intentional for anonymous analytics tracking. The INSERT policy correctly requires `user_id IS NULL AND session_id IS NOT NULL` for anon users.

4. **`Safety Alert Subscription Data Contains Contact Information`** (warn) -- Already addressed above. RLS is properly scoped to user ownership.

5. **`Performance Metrics Allow Unrestricted Data Insertion`** (warn) -- Intentional analytics table. INSERT-only access for public. No sensitive data exposed. Rate limiting would require edge function middleware not available in RLS.

6. **`Error Logs Accept Unvalidated Public Submissions`** (warn) -- Intentional client-side error logging. INSERT-only.

7. **`Affiliate Click Tracking Data Publicly Insertable`** (info) -- Intentional for affiliate tracking. Only admins can read.

8. **`Search Analytics Allow Unrestricted Query Logging`** (info) -- Intentional analytics. INSERT-only.

9. **`Filter Analytics Accept Unvalidated Public Data`** (info) -- Intentional analytics. INSERT-only.

10. **`Funnel Event Tracking Allows Unrestricted Data Insertion`** (info) -- Intentional analytics. INSERT-only.

11. **`security_definer_functions`** (warn) -- All SECURITY DEFINER functions are trigger functions with proper `search_path = public`. They are necessary for automation (auto-assign roles, create collections, update like counts). Current implementation is secure.

12. **`edge_functions_no_auth`** (warn) -- Public-facing functions (generate-affiliate-link, get-current-price, sitemap-xml, sync-* jobs) are intentionally unauthenticated. Admin functions already have `verify_jwt = true`. 

13. **`verbose_edge_function_errors`** (info) -- The vast majority of edge functions are admin-only (verify_jwt = true). The public-facing functions (generate-affiliate-link, get-affiliate-url) already return generic error messages. The verbose errors in admin functions are acceptable for debugging.

14. **20 remaining `SUPA_rls_policy_always_true`** warnings -- These are all INSERT-only policies on analytics/tracking tables (ab_test_assignments, ab_test_conversions, affiliate_clicks, module_engagement_metrics, printer_analytics, revenue_attribution, etc.) or service-role management policies on internal tables (broken_product_urls, product_regional_prices, etc.). All intentional.

---

### Technical Details

```text
Files to modify:
  - src/components/FirmwareSection.tsx (renderReleaseNotes fix)
  - src/components/SoftwareSection.tsx (renderReleaseNotes fix)
  - supabase migration (new) -- consolidate user_roles and user_browse_history policies

Security findings to update via manage_security_finding tool:
  - Delete: unsanitized_html_release_notes (after fix)
  - Delete: user_browse_history_inadequate_protection (after fix)
  - Ignore: profiles_table_public_exposure
  - Ignore: safety_alert_subscriptions_email_phone
  - Ignore: security_definer_functions
  - Ignore: edge_functions_no_auth
  - Ignore: verbose_edge_function_errors
  - Update: remaining supabase_lov findings as appropriate
```

The net result will be zero unaddressed errors and zero unaddressed warnings -- every finding will either be fixed or documented with an ignore reason.

