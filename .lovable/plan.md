

# Affiliate Management System — Database Migration

## Overview
Create 6 new database tables for a comprehensive affiliate management system that runs alongside the existing `affiliate_configs` table. This includes program definitions, restrictions, discount codes, campaigns, click tracking, and product overrides.

## Migration Details

### Tables Created
1. **affiliate_programs** — Brand-region affiliate program definitions with link templates, commission info, and account details. References `automated_brands(id)` (not `brands(id)` since that table doesn't exist).
2. **affiliate_program_restrictions** — Rules/restrictions per program (PPC, coupon sites, trademarks, etc.)
3. **affiliate_discount_codes** — Coupon/discount codes tied to programs
4. **affiliate_campaigns** — Active promotions/launches per program
5. **affiliate_clicks** — Outbound click tracking (high-volume analytics table)
6. **affiliate_product_overrides** — Per-product URL overrides or exclusions

### RLS Policy Pattern
Matches existing codebase convention:
- **Read-only tables** (programs, restrictions, codes, campaigns, overrides): `SELECT` open to all (`USING (true)`), write operations restricted to admins via `has_role(auth.uid(), 'admin'::app_role)`
- **affiliate_clicks**: `INSERT` open to `anon` and `authenticated` (public click tracking), `SELECT` admin-only

### Indexes
Performance indexes on affiliate_programs (brand_name, region_code), affiliate_clicks (clicked_at, brand_name, program_id, region_code, source_page), and active-status composite indexes on discount_codes and campaigns.

### Triggers
Reuses the existing `update_updated_at_column()` function for affiliate_programs, affiliate_discount_codes, and affiliate_campaigns.

### Seed Data
Inserts the Anycubic CA program with:
- Full program configuration (GoAffPro network, 5% commission, link template)
- 8 restriction entries (PPC, coupon sites, trademark, redirect links, incentivized traffic, FTC disclosure, content, mobile app)
- 1 unassigned discount code placeholder
- 4 campaign entries (Kobra X Launch, Kobra X Coming Soon, Christmas Sale, Kobra S1 Max Combo)

## Technical Notes
- The `brand_id` column references `automated_brands(id)` which is the correct table in this schema
- The existing `affiliate_configs` table is left untouched
- The `product_id` column in `affiliate_clicks` and `affiliate_product_overrides` is untyped (uuid) without a foreign key since it can reference filaments, printers, or accessories
- All timestamps use `timestamptz` with `DEFAULT now()`
- Single migration file handles all DDL, RLS, indexes, triggers, and seed data

