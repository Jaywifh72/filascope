

## Onboard Anycubic Australia — Using Existing Affiliate Tables

### Important Discovery

Your project already has a fully functional affiliate system with these existing tables:
- **`affiliate_programs`** — programs linked to `automated_brands` via `brand_id`, keyed by `brand_name` + `region_code`
- **`affiliate_discount_codes`** — codes linked to programs via `program_id`
- **`affiliate_clicks`** — click tracking with RLS already in place
- **`affiliate_campaigns`** — campaign management

There is **no `brands` table** — the brand entity is `automated_brands`. The Affiliate Hub admin page, the `generate-affiliate-link` edge function, and all hooks (`useAffiliatePrograms`, etc.) all use these existing tables.

**Creating new parallel tables (`brand_affiliate_programs`, `discount_codes`) would fragment the system and break the existing Affiliate Hub.** Instead, the plan seeds Anycubic AU data into the existing tables.

### What Will Be Done

#### Step 1: Ensure Anycubic exists in `automated_brands`

Query for existing Anycubic row (it likely already exists given the codebase references). If not present, insert it with:
- `brand_name`: 'Anycubic', `brand_slug`: 'anycubic', `display_name`: 'Anycubic'
- `base_url`: 'https://store.anycubic.com', `website_url`: 'https://www.anycubic.au'
- `is_visible`: true, `platform_type`: 'shopify'

#### Step 2: Insert into `affiliate_programs`

Using the existing table schema, insert one row:

| Field | Value |
|-------|-------|
| brand_name | Anycubic |
| region_code | AU |
| affiliate_network | GoAffPro |
| affiliate_id | 19374300 |
| portal_url | https://anycubic-au.goaffpro.com/ |
| commission_rate | 5.00 |
| commission_type | percentage |
| link_template | `https://www.anycubic.au/{path}?ref=JEANJACQUESBOILEAU` |
| store_base_url | https://www.anycubic.au |
| tracking_parameter | ref |
| tracking_value | JEANJACQUESBOILEAU |
| is_active | true |
| account_status | active |
| referral_handle | JEANJACQUESBOILEAU |
| account_email | Admin@Filascope.com |
| program_notes | Account: Jean-Jacques Boileau, Registered: 2026-02-21, PayPal: jeanjacquesboileau@gmail.com |
| link_generation_method | url_parameter |

The `brand_id` will be set by looking up the Anycubic row from `automated_brands`.

#### Step 3: Insert 9 discount codes into `affiliate_discount_codes`

Each code linked to the program via `program_id`:

| code | discount_type | discount_value | display_text | is_exclusive |
|------|--------------|----------------|--------------|--------------|
| JEANJACQUESBOIL | fixed | 25.00 | Save $25 AUD on your Anycubic AU order | true |
| FANW3P | fixed | 30.00 | Save $30 AUD on Wash & Cure 3 Plus | false |
| FANW3 | fixed | 20.00 | Save $20 AUD on Wash & Cure 3 | false |
| FANPM4 | fixed | 20.00 | Save $20 AUD on Photon Mono 4 | false |
| FANPM7 | fixed | 50.00 | Save $50 AUD on Photon Mono M7 | false |
| FANS1MC | fixed | 100.00 | Save $100 AUD on Kobra S1 Max Combo | false |
| FANS1M | fixed | 100.00 | Save $100 AUD on Kobra S1 Max | false |
| FANPM7M | fixed | 100.00 | Save $100 AUD on Photon Mono M7 Max | false |
| FANK3MC | fixed | 60.00 | Save $60 AUD on Kobra 3 Max Combo | false |

All with `is_active: true`, `is_assigned: true`, `valid_from: '2026-02-21'`, `valid_until: null`.

#### Step 4: No migration needed

All three tables already exist with appropriate columns and RLS policies. The existing `generate-affiliate-link` edge function already handles `url_parameter` link generation and returns discount codes. No schema changes required.

### Technical Details

- Data insertion will use the database insert tool (not migrations, since this is data seeding)
- The Anycubic brand_id lookup will be done first to get the FK reference
- The program insertion will use the existing `affiliate_programs` schema which already has all needed fields
- The discount codes table uses `program_id` (not `brand_id` directly) so the program must be inserted first
- The existing Affiliate Hub UI at `/admin/affiliate-hub` will automatically display the new program and codes

### No Code Changes Needed

The existing Affiliate Hub, edge function, and hooks already support this data shape. Once seeded, Anycubic AU will appear in the admin dashboard and the `generate-affiliate-link` function will automatically generate links for `brand_name: 'Anycubic', region_code: 'AU'`.

