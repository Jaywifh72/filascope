

## Fix Creality Product URLs - Database Migration

### Current State Analysis

| Product | Current Slug | Correct Slug | Records |
|---------|--------------|--------------|---------|
| Hyper Rainbow PLA | `4-pack-hyper-pla-rfid` ❌ | `hyper-rainbow-pla-3d-printing-filament-1kg` | 3 |
| Hyper PETG-CF | `bfcm-hyper-petg-4` ❌ | `hyper-petg-cf-3d-printing-filament-1kg` | 8 |

All other Creality products already have correct URLs.

### Migration SQL (Simplified)

```sql
-- Migration: fix_creality_product_urls
-- Fix incorrect Creality product URL slugs

-- 1. Fix Hyper Rainbow PLA (currently pointing to bundle)
UPDATE filaments 
SET product_url = 'https://store.creality.com/products/hyper-rainbow-pla-3d-printing-filament-1kg'
WHERE vendor = 'Creality' 
  AND product_title LIKE '%Hyper Rainbow%';

-- 2. Fix Hyper PETG-CF (currently pointing to BFCM promo)
UPDATE filaments 
SET product_url = 'https://store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg'
WHERE vendor = 'Creality' 
  AND product_title LIKE '%PETG-CF%';
```

### What This Fixes

| Before | After |
|--------|-------|
| `store.creality.com/products/4-pack-hyper-pla-rfid` | `store.creality.com/products/hyper-rainbow-pla-3d-printing-filament-1kg` |
| `store.creality.com/products/bfcm-hyper-petg-4` | `store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg` |

### Technical Notes

- Uses `vendor = 'Creality'` instead of brand lookup (simpler, matches schema)
- Uses `product_title` for matching (actual column name)
- Only 11 records need updating (3 Rainbow + 8 PETG-CF)
- All other Creality products already have correct URLs

