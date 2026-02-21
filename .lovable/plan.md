
# Activate Anycubic Canada Affiliate Program

## Changes

### 1. Update Discount Code
Update the existing placeholder row (`0cc88a4b-9464-446c-8202-a56f6c8043f6`) in `affiliate_discount_codes`:
- `code` = `JEANJACQUESBOIL`
- `discount_type` = `fixed_amount`
- `discount_value` = `20.00`
- `display_text` = `Save $20 with code JEANJACQUESBOIL`
- `is_assigned` = `true`
- `is_active` = `true`

### 2. Update Program Status
Update the Anycubic CA program (`ae47389d-8908-43da-a671-1923e74806d3`) in `affiliate_programs`:
- `account_status` = `active`

Both are data updates executed via the insert/update tool (not migrations).
