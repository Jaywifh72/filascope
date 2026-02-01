# Memory: data/creality-url-management-standards-v5-final
Updated: 2026-02-01

## URL Pattern
Creality uses **path-based** regional URLs, NOT subdomain-based:
- US: `store.creality.com/products/{slug}` (no regional path prefix)
- EU: `store.creality.com/eu/products/{slug}`
- UK: `store.creality.com/uk/products/{slug}`
- AU: `store.creality.com/au/products/{slug}`

## Critical: Slug Mismatch
Creality EU slugs are **DIFFERENT** from US slugs. Automatic transformation is NOT possible.

| Product | US Slug | EU Slug |
|---------|---------|---------|
| Hyper PLA RFID Stardust | `hyper-pla-rfid-stardust-3d-printing-filament-1kg` | `hyper-pla-rfid-stardust` |
| Hyper PLA RFID | `hyper-pla-rfid-3d-printing-filament-1kg` | `rfid-hyper-pla-filament` |
| HP ASA | `creality-hp-asa-3d-printing-filament` | `creality-hp-asa` |

## Data Strategy
1. **product_url**: Stores US URL (primary)
2. **product_url_eu**: Stores full EU URL with correct slug
3. **product_url_uk**, **product_url_au**: Store regional URLs when different from US

## Configuration
- `brandRegionalStores.ts`: Updated to use `pattern: 'path'` with `pathPrefix` per region
- `brand_regional_stores` table: Has EU/UK/AU entries with `product_url_pattern`
- `useRegionalStore.ts`: Path transformation logic handles `/eu/`, `/uk/` prefix insertion/replacement

## Fallback Behavior
When regional URL is not stored, the system:
1. Falls back to US store URL
2. Shows "Ships from United States" warning
3. Does NOT attempt to auto-transform slugs (known to cause 404s)
