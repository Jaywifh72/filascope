# Bambu Lab S5 Image Extraction Checklist

**Last Updated**: 2026-01-05  
**Total Pending**: ~145 colors across 22 product lines  
**Completed**: 43 colors (ABS, PLA Tough+, PETG HF, PETG Translucent)

---

## 📋 Extraction Instructions

### Step-by-Step Process

1. **Open Product Page** - Navigate to the URL listed for each product
2. **Open DevTools** - Press `F12` or `Cmd+Option+I` (Mac)
3. **Go to Network Tab** - Click "Network" in DevTools
4. **Filter by "s5"** - Type `s5` in the filter box
5. **Click Each Color Swatch** - One by one on the product page
6. **Copy the GUID** - Look for requests like:
   ```
   store.bblcdn.com/s5/default/{32-CHAR-GUID}.jpg
   ```
7. **Record in this checklist** - Add the GUID next to the color name

### Format for Adding to Code

Once extracted, provide GUIDs in this format:
```typescript
'product-slug': {
  'color name': s5Url('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
  // ... more colors
},
```

---

## 🔴 HIGH PRIORITY (Popular Products)

### PLA Basic (30 colors)
**URL**: https://us.store.bambulab.com/products/pla-basic-filament  
**Slug**: `pla-basic-filament`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | bambu green | | ☐ |
| 2 | beige | | ☐ |
| 3 | black | | ☐ |
| 4 | blue | | ☐ |
| 5 | blue grey | | ☐ |
| 6 | bright green | | ☐ |
| 7 | bronze | | ☐ |
| 8 | brown | | ☐ |
| 9 | cobalt blue | | ☐ |
| 10 | cocoa brown | | ☐ |
| 11 | cyan | | ☐ |
| 12 | dark gray | | ☐ |
| 13 | gold | | ☐ |
| 14 | gray | | ☐ |
| 15 | hot pink | | ☐ |
| 16 | indigo purple | | ☐ |
| 17 | jade white | | ☐ |
| 18 | light gray | | ☐ |
| 19 | magenta | | ☐ |
| 20 | maroon red | | ☐ |
| 21 | mistletoe green | | ☐ |
| 22 | orange | | ☐ |
| 23 | pink | | ☐ |
| 24 | pumpkin orange | | ☐ |
| 25 | purple | | ☐ |
| 26 | red | | ☐ |
| 27 | silver | | ☐ |
| 28 | sunflower yellow | | ☐ |
| 29 | turquoise | | ☐ |
| 30 | yellow | | ☐ |

---

### PLA Matte (24 colors)
**URL**: https://us.store.bambulab.com/products/pla-matte  
**Slug**: `pla-matte`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | ash gray | | ☐ |
| 2 | black | | ☐ |
| 3 | brown | | ☐ |
| 4 | candy pink | | ☐ |
| 5 | charcoal | | ☐ |
| 6 | dark gray | | ☐ |
| 7 | ivory white | | ☐ |
| 8 | lake blue | | ☐ |
| 9 | lemon yellow | | ☐ |
| 10 | lilac | | ☐ |
| 11 | lime green | | ☐ |
| 12 | mandarin orange | | ☐ |
| 13 | mocha brown | | ☐ |
| 14 | purple | | ☐ |
| 15 | red | | ☐ |
| 16 | sakura pink | | ☐ |
| 17 | sand | | ☐ |
| 18 | silver | | ☐ |
| 19 | slate blue | | ☐ |
| 20 | teal | | ☐ |
| 21 | wasabi | | ☐ |
| 22 | white | | ☐ |
| 23 | wine red | | ☐ |
| 24 | yellow | | ☐ |

---

### PLA Silk+ (13 colors)
**URL**: https://us.store.bambulab.com/products/pla-silk-upgrade  
**Slug**: `pla-silk-upgrade`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |
| 2 | blue | | ☐ |
| 3 | dark blue | | ☐ |
| 4 | emerald | | ☐ |
| 5 | gold | | ☐ |
| 6 | green | | ☐ |
| 7 | orange | | ☐ |
| 8 | pink | | ☐ |
| 9 | purple | | ☐ |
| 10 | red | | ☐ |
| 11 | silver | | ☐ |
| 12 | white | | ☐ |
| 13 | yellow | | ☐ |

---

### PLA Translucent (10 colors)
**URL**: https://us.store.bambulab.com/products/pla-translucent  
**Slug**: `pla-translucent`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | translucent blue | | ☐ |
| 2 | translucent clear | | ☐ |
| 3 | translucent green | | ☐ |
| 4 | translucent orange | | ☐ |
| 5 | translucent pink | | ☐ |
| 6 | translucent purple | | ☐ |
| 7 | translucent red | | ☐ |
| 8 | translucent teal | | ☐ |
| 9 | translucent white | | ☐ |
| 10 | translucent yellow | | ☐ |

---

## 🟡 MEDIUM PRIORITY (Specialty Lines)

### PLA Silk Multi-Color (5 colors)
**URL**: https://us.store.bambulab.com/products/pla-silk-multicolor  
**Slug**: `pla-silk-multicolor`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | cosmic latte | | ☐ |
| 2 | golden hour | | ☐ |
| 3 | meadow | | ☐ |
| 4 | morning mist | | ☐ |
| 5 | tropical sunset | | ☐ |

---

### PLA Basic Gradient (3 colors)
**URL**: https://us.store.bambulab.com/products/pla-basic-gradient  
**Slug**: `pla-basic-gradient`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | arctic whisper | | ☐ |
| 2 | mint lime | | ☐ |
| 3 | pink citrus | | ☐ |

---

### PLA Sparkle (6 colors)
**URL**: https://us.store.bambulab.com/products/pla-sparkle  
**Slug**: `pla-sparkle`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | cosmic gray | | ☐ |
| 2 | galaxy purple | | ☐ |
| 3 | meteor gray | | ☐ |
| 4 | nebula blue | | ☐ |
| 5 | starlight purple | | ☐ |
| 6 | twilight | | ☐ |

---

### PLA Metal (5 colors)
**URL**: https://us.store.bambulab.com/products/pla-metal  
**Slug**: `pla-metal`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | antique bronze | | ☐ |
| 2 | copper | | ☐ |
| 3 | iron gray | | ☐ |
| 4 | silver | | ☐ |
| 5 | titanium | | ☐ |

---

### PLA Galaxy (3 colors)
**URL**: https://us.store.bambulab.com/products/pla-galaxy  
**Slug**: `pla-galaxy`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | milky way | | ☐ |
| 2 | nebula | | ☐ |
| 3 | supernova | | ☐ |

---

### PLA Wood (4 colors)
**URL**: https://us.store.bambulab.com/products/pla-wood  
**Slug**: `pla-wood`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | cherry | | ☐ |
| 2 | mahogany | | ☐ |
| 3 | oak | | ☐ |
| 4 | walnut | | ☐ |

---

### PLA Glow (5 colors)
**URL**: https://us.store.bambulab.com/products/pla-glow  
**Slug**: `pla-glow`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | glow blue | | ☐ |
| 2 | glow green | | ☐ |
| 3 | glow orange | | ☐ |
| 4 | glow pink | | ☐ |
| 5 | glow yellow | | ☐ |

---

### PLA Marble (2 colors)
**URL**: https://us.store.bambulab.com/products/pla-marble  
**Slug**: `pla-marble`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | carrara | | ☐ |
| 2 | nero marquina | | ☐ |

---

### PLA-CF (7 colors)
**URL**: https://us.store.bambulab.com/products/pla-cf  
**Slug**: `pla-cf`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |
| 2 | burgundy red | | ☐ |
| 3 | iris purple | | ☐ |
| 4 | jeans blue | | ☐ |
| 5 | lava gray | | ☐ |
| 6 | matcha green | | ☐ |
| 7 | white | | ☐ |

---

## 🔵 LOW PRIORITY (Engineering Materials)

### PETG Basic (10 colors)
**URL**: https://us.store.bambulab.com/products/petg-basic  
**Slug**: `petg-basic`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |
| 2 | blue | | ☐ |
| 3 | gray | | ☐ |
| 4 | green | | ☐ |
| 5 | orange | | ☐ |
| 6 | red | | ☐ |
| 7 | silver | | ☐ |
| 8 | white | | ☐ |
| 9 | yellow | | ☐ |
| 10 | clear | | ☐ |

---

### PETG-CF (6 colors)
**URL**: https://us.store.bambulab.com/products/petg-cf  
**Slug**: `petg-cf`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |
| 2 | brick red | | ☐ |
| 3 | indigo blue | | ☐ |
| 4 | malachite green | | ☐ |
| 5 | titan gray | | ☐ |
| 6 | violet purple | | ☐ |

---

### ABS-GF (8 colors)
**URL**: https://us.store.bambulab.com/products/abs-gf  
**Slug**: `abs-gf`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |
| 2 | blue | | ☐ |
| 3 | gray | | ☐ |
| 4 | green | | ☐ |
| 5 | orange | | ☐ |
| 6 | red | | ☐ |
| 7 | white | | ☐ |
| 8 | yellow | | ☐ |

---

### PA6-GF (8 colors)
**URL**: https://us.store.bambulab.com/products/pa6-gf  
**Slug**: `pa6-gf`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |
| 2 | blue | | ☐ |
| 3 | brown | | ☐ |
| 4 | gray | | ☐ |
| 5 | lime | | ☐ |
| 6 | orange | | ☐ |
| 7 | white | | ☐ |
| 8 | yellow | | ☐ |

---

### ASA (5 colors)
**URL**: https://us.store.bambulab.com/products/asa  
**Slug**: `asa`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |
| 2 | blue | | ☐ |
| 3 | gray | | ☐ |
| 4 | green | | ☐ |
| 5 | red | | ☐ |
| 6 | white | | ☐ |

---

### TPU 95A HF (7 colors)
**URL**: https://us.store.bambulab.com/products/tpu-95a-hf  
**Slug**: `tpu-95a-hf`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |
| 2 | blue | | ☐ |
| 3 | clear | | ☐ |
| 4 | green | | ☐ |
| 5 | orange | | ☐ |
| 6 | red | | ☐ |
| 7 | white | | ☐ |

---

### Support for PLA (2 colors)
**URL**: https://us.store.bambulab.com/products/support-for-pla  
**Slug**: `support-for-pla`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | white | | ☐ |
| 2 | natural | | ☐ |

---

### Support W (1 color)
**URL**: https://us.store.bambulab.com/products/support-w  
**Slug**: `support-w`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | white | | ☐ |

---

### PAHT-CF (1 color)
**URL**: https://us.store.bambulab.com/products/paht-cf  
**Slug**: `paht-cf`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |

---

### PA6-CF (1 color)
**URL**: https://us.store.bambulab.com/products/pa6-cf  
**Slug**: `pa6-cf`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |

---

### PA-CF (1 color)
**URL**: https://us.store.bambulab.com/products/pa-cf  
**Slug**: `pa-cf`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |

---

### PET-CF (1 color)
**URL**: https://us.store.bambulab.com/products/pet-cf  
**Slug**: `pet-cf`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |

---

### PC (3 colors)
**URL**: https://us.store.bambulab.com/products/pc  
**Slug**: `pc`

| # | Color Name | S5 GUID | Extracted? |
|---|------------|---------|------------|
| 1 | black | | ☐ |
| 2 | clear black | | ☐ |
| 3 | gray | | ☐ |
| 4 | white | | ☐ |

---

## ✅ ALREADY COMPLETE (43 colors)

### ABS (12 colors) ✅
All S5 GUIDs extracted and verified.

### PLA Tough+ (8 colors) ✅
All S5 images extracted and verified.

### PETG HF (14 colors) ✅
All S5 images extracted and verified.

### PETG Translucent (9 colors) ✅
All S5 images extracted and verified.

---

## 📝 How to Submit Extracted GUIDs

After extracting GUIDs, paste them here in this format:

```
pla-basic-filament:
- jade white: abc123def456789...
- black: xyz789ghi012345...
```

Or share as a JSON object:
```json
{
  "pla-basic-filament": {
    "jade white": "abc123def456789...",
    "black": "xyz789ghi012345..."
  }
}
```

I will then add them to the `S5_PRODUCT_IMAGES` constant in `sync-bambulab-products/index.ts` and redeploy.
