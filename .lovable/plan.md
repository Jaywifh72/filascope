

## Add ELEGOO Affiliate Program to the Affiliate Hub

This is a large but well-defined task covering schema changes, data inserts, and UI updates to support Impact.com-style redirect link programs alongside the existing URL parameter model.

---

### Phase 1: Database Schema Enhancement

**Migration** -- Add new columns to three tables:

**affiliate_programs:**
- `impact_campaign_id` (text, nullable)
- `impact_media_partner_id` (text, nullable)
- `tracking_domain` (text, nullable)
- `default_tracking_link` (text, nullable)
- `link_generation_method` (text, default `'url_parameter'`)

**affiliate_discount_codes:**
- `tracking_link` (text, nullable)
- `scope` (text, default `'all_stores'`)
- `coupon_source` (text, nullable)

**affiliate_campaigns:**
- `deal_scope` (text, nullable)
- `target_audience` (text, nullable)
- `region_specific` (text, nullable)

Also make `tracking_parameter` and `tracking_value` nullable on `affiliate_programs` (Impact.com programs don't use them).

---

### Phase 2: Data Inserts

All via SQL insert statements (not migrations):

1. **6 ELEGOO program rows** -- one per region (US, CA, EU, UK, AU, JP) with shared Impact.com configuration and `link_generation_method='redirect_link'`
2. **14 discount codes** -- all linked to the US program_id, with scope values (all_stores, resin_products, pla_filament, specific_product)
3. **13 campaigns/deals** -- with deal_scope, target_audience, and region_specific metadata
4. **10 restrictions** -- linked to the US program_id

---

### Phase 3: TypeScript Type Updates

Update `src/types/affiliate.ts`:
- Add to `AffiliateProgram`: `impact_campaign_id`, `impact_media_partner_id`, `tracking_domain`, `default_tracking_link`, `link_generation_method`
- Add to `AffiliateDiscountCode`: `tracking_link`, `scope`, `coupon_source`
- Add to `AffiliateCampaign`: `deal_scope`, `target_audience`, `region_specific`

---

### Phase 4: UI Updates

#### 4a. Link Generator Card (`LinkGeneratorCard.tsx`)
- Check `program.link_generation_method`
- When `'redirect_link'`: Replace the path input with a prominent copyable default link, an informational notice about creating product-specific links via the network dashboard, and an "Open Dashboard" button linking to `portal_url`
- When `'url_parameter'` (default): Keep current behavior

#### 4b. Program Overview Card (`ProgramOverviewCard.tsx`)
- When `link_generation_method='redirect_link'`, show additional info rows: Tracking Domain, Default Link (copyable), Campaign ID, Partner ID
- Change "Deep Linking: No" to "Deep Linking: Via Dashboard" when method is redirect_link

#### 4c. Discount Codes Card (`DiscountCodesCard.tsx`)
- Add a "Scope" column to the table with color-coded badges:
  - `all_stores` = green "All Stores"
  - `resin_products` = purple "Resin"
  - `pla_filament` = blue "PLA"
  - `specific_product` = orange "Product"

#### 4d. Campaigns Card (`CampaignsCard.tsx`)
- Show `deal_scope` as a badge next to campaign_type
- Show `target_audience` if present
- Show `region_specific` as a small badge (e.g., "EU only", "AU only")

#### 4e. Cross-Region Data Fetching
- Update `useAffiliateDiscountCodes`, `useAffiliateCampaigns`, and `useAffiliateProgramRestrictions` hooks to accept an optional `brandName` parameter
- When `brandName` is provided, fetch by matching all program_ids for that brand (via a subquery or by first fetching program IDs, then filtering)
- Update `BrandAccordionItem.tsx` to pass brand_name to these hooks so data appears on all regional tabs

#### 4f. Edge Function Update (`generate-affiliate-link`)
- Handle `link_generation_method='redirect_link'`: return the `default_tracking_link` directly (with subId params appended if available) instead of building from template placeholders

#### 4g. Client-side link builder (`buildAffiliateLinkLocal`)
- Handle redirect_link method: return `default_tracking_link` with UTM params appended (skip template replacement)

---

### Technical Details

```text
Files to create: None

Files to modify:
  - supabase migration (new)
  - src/types/affiliate.ts
  - src/utils/affiliateLinks.ts
  - src/hooks/useAffiliatePrograms.ts
  - src/components/admin/affiliate-hub/LinkGeneratorCard.tsx
  - src/components/admin/affiliate-hub/ProgramOverviewCard.tsx
  - src/components/admin/affiliate-hub/DiscountCodesCard.tsx
  - src/components/admin/affiliate-hub/CampaignsCard.tsx
  - src/components/admin/affiliate-hub/BrandAccordionItem.tsx
  - supabase/functions/generate-affiliate-link/index.ts
```

The data inserts (programs, codes, campaigns, restrictions) will be done via the insert tool after the schema migration is applied. No existing Anycubic or Creality data will be touched.

