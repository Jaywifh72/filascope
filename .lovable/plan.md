

## Printer Detail Page Answer Block

### What Changes

Add a single `<p>` element in `src/components/printer/PrinterHeroSection.tsx` immediately after the H1 heading block (line 138) and before the description paragraph (line 141). This replaces the current `generatePrinterDescription` paragraph with a structured, AI-extractable answer block that includes all 10 requested data points.

### Data Mapping

All data is already available via the `printer` prop:

| Data Point | Source |
|---|---|
| Full printer name | `brand` + `printer.model_name` |
| Printer type | `printer.printer_type` or `printer.printer_technology` (fallback "FDM") |
| Build volume | `printer.build_volume_x_mm/y/z` |
| Max print speed | `printer.max_print_speed_mms` |
| Max nozzle temp | `printer.max_nozzle_temp_c` |
| Connectivity | `printer.has_wifi`, `printer.has_ethernet`, `printer.has_usb` |
| Enclosure | `printer.has_enclosure` |
| Multi-material | `printer.multi_material_supported` + `printer.multi_material_max_spools` |
| Price | Not currently passed to hero; will use `printer.current_price_usd_store` or `printer.msrp_usd` |
| Discontinued | `printer.discontinued` |

### Implementation

**File:** `src/components/printer/PrinterHeroSection.tsx` (single edit, ~25 lines)

Replace the existing description `<p>` (lines 141-146, which calls `generatePrinterDescription`) with a dynamically assembled answer block paragraph. The paragraph will read like:

> "The Bambu Lab X1 Carbon is a high-speed, enclosed FDM 3D printer with a build volume of 256 x 256 x 256 mm, maximum print speed of 500 mm/s, and nozzle temperature up to 300C. It features Wi-Fi connectivity, auto bed leveling, and supports 16-color multi-material printing via the AMS system. Note: This printer has been discontinued by Bambu Lab."

Clauses are conditionally included only when data exists. The discontinued note only appears when `printer.discontinued === true`.

### No other files modified
