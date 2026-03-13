#!/usr/bin/env node
/**
 * Pre-fetch Gizmo Dorks filament products using a curated product catalog.
 *
 * Gizmo Dorks runs on BigCommerce — no Shopify /products.json endpoint
 * available. This script uses a manually curated product list based on
 * their gizmodorks.com storefront and Amazon/eBay listings.
 *
 * Usage:
 *   node scripts/fetch-gizmo-dorks-products.cjs
 *
 * Output:
 *   scripts/gizmo-dorks-products.json      (raw data)
 *   public/data/gizmo-dorks-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// Gizmo Dorks product catalog - curated from gizmodorks.com, Amazon, and eBay
// Prices in USD, standard spool weight 1kg (1000g), diameters 1.75mm and 3mm
const GIZMO_DORKS_PRODUCTS = [
  // ── PLA 1.75mm 1kg ─────────────────────────────────────────────
  { title: 'Gizmo Dorks PLA Filament 1.75mm', handle: 'pla-175', material: 'PLA', price: '20.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Dark Purple', 'Pink', 'Pink Rose', 'Silver', 'Transparent', 'Violet', 'Red Lava', 'Green Grass', 'Light Yellow', 'Lemon Yellow', 'Brown', 'Gold', 'Natural', 'Translucent Red', 'Translucent Orange', 'Translucent Pink', 'Translucent Purple', 'Skin', 'Teal', 'Navy Blue', 'Cream'] },

  // ── PLA 3mm 1kg ─────────────────────────────────────────────────
  { title: 'Gizmo Dorks PLA Filament 3mm', handle: 'pla-3mm', material: 'PLA', price: '20.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Dark Purple', 'Pink', 'Pink Rose', 'Silver', 'Transparent', 'Violet', 'Red Lava', 'Green Grass', 'Light Yellow', 'Brown', 'Gold', 'Natural', 'Translucent Red', 'Translucent Orange', 'Translucent Pink', 'Translucent Purple', 'Skin', 'Teal', 'Navy Blue', 'Cream'] },

  // ── PLA Glow in the Dark 1.75mm 1kg ─────────────────────────────
  { title: 'Gizmo Dorks PLA Glow in the Dark Filament 1.75mm', handle: 'pla-glow-175', material: 'PLA', price: '26.95', weight: 1000,
    colors: ['Glow Green'] },

  // ── PLA Glow in the Dark 3mm 1kg ────────────────────────────────
  { title: 'Gizmo Dorks PLA Glow in the Dark Filament 3mm', handle: 'pla-glow-3mm', material: 'PLA', price: '26.95', weight: 1000,
    colors: ['Glow Green'] },

  // ── PLA Fluorescent 1.75mm 1kg ──────────────────────────────────
  { title: 'Gizmo Dorks PLA Fluorescent Filament 1.75mm', handle: 'pla-fluorescent-175', material: 'PLA', price: '21.95', weight: 1000,
    colors: ['Fluorescent Green', 'Fluorescent Blue', 'Fluorescent Orange', 'Fluorescent Yellow', 'Red Ruby'] },

  // ── PLA Fluorescent 3mm 1kg ─────────────────────────────────────
  { title: 'Gizmo Dorks PLA Fluorescent Filament 3mm', handle: 'pla-fluorescent-3mm', material: 'PLA', price: '21.95', weight: 1000,
    colors: ['Fluorescent Green', 'Fluorescent Blue', 'Fluorescent Orange', 'Fluorescent Yellow', 'Red Ruby'] },

  // ── PLA Color Change 1.75mm 1kg ─────────────────────────────────
  { title: 'Gizmo Dorks PLA Color Change Filament 1.75mm', handle: 'pla-color-change-175', material: 'PLA', price: '33.95', weight: 1000,
    colors: ['Green to Yellow', 'Gray to White', 'Purple to Pink', 'Blue to White'] },

  // ── PLA Color Change 3mm 1kg ────────────────────────────────────
  { title: 'Gizmo Dorks PLA Color Change Filament 3mm', handle: 'pla-color-change-3mm', material: 'PLA', price: '33.95', weight: 1000,
    colors: ['Green to Yellow', 'Gray to White', 'Purple to Pink', 'Blue to White'] },

  // ── PLA Marble 1.75mm 1kg ───────────────────────────────────────
  { title: 'Gizmo Dorks PLA Marble Filament 1.75mm', handle: 'pla-marble-175', material: 'PLA', price: '22.95', weight: 1000,
    colors: ['Marble'] },

  // ── PLA Glitter 1.75mm 1kg ──────────────────────────────────────
  { title: 'Gizmo Dorks PLA Glitter Filament 1.75mm', handle: 'pla-glitter-175', material: 'PLA', price: '22.95', weight: 1000,
    colors: ['Glitter Blue'] },

  // ── Silk PLA 1.75mm 1kg ─────────────────────────────────────────
  { title: 'Gizmo Dorks Silk PLA Filament 1.75mm', handle: 'silk-pla-175', material: 'Silk PLA', price: '22.95', weight: 1000,
    colors: ['Ocean Blue', 'Red Pink', 'Teal', 'Yellow Gold', 'Green', 'Blue'] },

  // ── Silk PLA 3mm 1kg ────────────────────────────────────────────
  { title: 'Gizmo Dorks Silk PLA Filament 3mm', handle: 'silk-pla-3mm', material: 'Silk PLA', price: '22.95', weight: 1000,
    colors: ['Ocean Blue', 'Red Pink', 'Teal', 'Yellow Gold', 'Green', 'Blue'] },

  // ── Silk PLA Dual Color 1.75mm 1kg ──────────────────────────────
  { title: 'Gizmo Dorks Silk PLA Dual Color Filament 1.75mm', handle: 'silk-pla-dual-175', material: 'Silk PLA', price: '24.95', weight: 1000,
    colors: ['Gold Red', 'Green Blue', 'Red Green Blue'] },

  // ── ABS 1.75mm 1kg ─────────────────────────────────────────────
  { title: 'Gizmo Dorks ABS Filament 1.75mm', handle: 'abs-175', material: 'ABS', price: '20.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Pink', 'Silver', 'Gold', 'Brown', 'Transparent', 'Red Lava', 'Green Grass', 'Light Yellow', 'Violet', 'Skin', 'Teal', 'Natural'] },

  // ── ABS 3mm 1kg ─────────────────────────────────────────────────
  { title: 'Gizmo Dorks ABS Filament 3mm', handle: 'abs-3mm', material: 'ABS', price: '20.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Pink', 'Silver', 'Gold', 'Brown', 'Transparent', 'Red Lava', 'Green Grass', 'Light Yellow', 'Violet', 'Skin', 'Teal', 'Natural'] },

  // ── ABS Glow in the Dark 1.75mm 1kg ─────────────────────────────
  { title: 'Gizmo Dorks ABS Glow in the Dark Filament 1.75mm', handle: 'abs-glow-175', material: 'ABS', price: '23.95', weight: 1000,
    colors: ['Glow Green'] },

  // ── ABS Glow in the Dark 3mm 1kg ────────────────────────────────
  { title: 'Gizmo Dorks ABS Glow in the Dark Filament 3mm', handle: 'abs-glow-3mm', material: 'ABS', price: '23.95', weight: 1000,
    colors: ['Glow Green'] },

  // ── ABS Fluorescent 1.75mm 1kg ──────────────────────────────────
  { title: 'Gizmo Dorks ABS Fluorescent Filament 1.75mm', handle: 'abs-fluorescent-175', material: 'ABS', price: '21.95', weight: 1000,
    colors: ['Fluorescent Green', 'Fluorescent Blue', 'Fluorescent Orange', 'Fluorescent Yellow'] },

  // ── ABS Fluorescent 3mm 1kg ─────────────────────────────────────
  { title: 'Gizmo Dorks ABS Fluorescent Filament 3mm', handle: 'abs-fluorescent-3mm', material: 'ABS', price: '21.95', weight: 1000,
    colors: ['Fluorescent Green', 'Fluorescent Blue', 'Fluorescent Orange', 'Fluorescent Yellow'] },

  // ── ABS Color Change (Hyper Color) 1.75mm 1kg ───────────────────
  { title: 'Gizmo Dorks ABS Color Change Filament 1.75mm', handle: 'abs-color-change-175', material: 'ABS', price: '32.95', weight: 1000,
    colors: ['Green to Yellow', 'Gray to White', 'Purple to Pink', 'Blue to White'] },

  // ── ABS Color Change (Hyper Color) 3mm 1kg ──────────────────────
  { title: 'Gizmo Dorks ABS Color Change Filament 3mm', handle: 'abs-color-change-3mm', material: 'ABS', price: '32.95', weight: 1000,
    colors: ['Green to Yellow', 'Gray to White', 'Purple to Pink', 'Blue to White'] },

  // ── ABS Conductive 1.75mm 1kg ───────────────────────────────────
  { title: 'Gizmo Dorks ABS Conductive Filament 1.75mm', handle: 'abs-conductive-175', material: 'ABS', price: '29.95', weight: 1000,
    colors: ['Black'] },

  // ── ABS Conductive 3mm 1kg ──────────────────────────────────────
  { title: 'Gizmo Dorks ABS Conductive Filament 3mm', handle: 'abs-conductive-3mm', material: 'ABS', price: '29.95', weight: 1000,
    colors: ['Black'] },

  // ── Low Odor ABS 1.75mm 1kg ─────────────────────────────────────
  { title: 'Gizmo Dorks Low Odor ABS Filament 1.75mm', handle: 'low-odor-abs-175', material: 'ABS', price: '22.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Grey', 'Pink', 'Teal', 'Purple', 'Sky Blue', 'Orange', 'Glow in the Dark Blue'] },

  // ── Low Odor ABS 3mm 1kg ────────────────────────────────────────
  { title: 'Gizmo Dorks Low Odor ABS Filament 3mm', handle: 'low-odor-abs-3mm', material: 'ABS', price: '22.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Grey', 'Pink', 'Teal', 'Purple', 'Sky Blue', 'Orange', 'Glow in the Dark Blue'] },

  // ── PETG 1.75mm 1kg ─────────────────────────────────────────────
  { title: 'Gizmo Dorks PETG Filament 1.75mm', handle: 'petg-175', material: 'PETG', price: '22.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Transparent', 'Orange', 'Yellow', 'Grey', 'Purple', 'Pink'] },

  // ── PETG 3mm 1kg ────────────────────────────────────────────────
  { title: 'Gizmo Dorks PETG Filament 3mm', handle: 'petg-3mm', material: 'PETG', price: '22.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Transparent', 'Orange', 'Yellow', 'Grey', 'Purple', 'Pink'] },

  // ── HIPS 1.75mm 1kg ─────────────────────────────────────────────
  { title: 'Gizmo Dorks HIPS Filament 1.75mm', handle: 'hips-175', material: 'HIPS', price: '20.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Natural'] },

  // ── HIPS 3mm 1kg ────────────────────────────────────────────────
  { title: 'Gizmo Dorks HIPS Filament 3mm', handle: 'hips-3mm', material: 'HIPS', price: '20.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Natural'] },

  // ── HIPS Glow in the Dark 1.75mm 1kg ────────────────────────────
  { title: 'Gizmo Dorks HIPS Glow in the Dark Filament 1.75mm', handle: 'hips-glow-175', material: 'HIPS', price: '23.95', weight: 1000,
    colors: ['Glow Green'] },

  // ── HIPS Glow in the Dark 3mm 1kg ───────────────────────────────
  { title: 'Gizmo Dorks HIPS Glow in the Dark Filament 3mm', handle: 'hips-glow-3mm', material: 'HIPS', price: '23.95', weight: 1000,
    colors: ['Glow Green'] },

  // ── Nylon 1.75mm 1kg ────────────────────────────────────────────
  { title: 'Gizmo Dorks Nylon Filament 1.75mm', handle: 'nylon-175', material: 'Nylon', price: '29.95', weight: 1000,
    colors: ['Natural', 'Black', 'White'] },

  // ── Nylon 3mm 1kg ───────────────────────────────────────────────
  { title: 'Gizmo Dorks Nylon Filament 3mm', handle: 'nylon-3mm', material: 'Nylon', price: '29.95', weight: 1000,
    colors: ['Natural', 'Black', 'White'] },

  // ── Polycarbonate (PC) 1.75mm 1kg ──────────────────────────────
  { title: 'Gizmo Dorks Polycarbonate Filament 1.75mm', handle: 'pc-175', material: 'PC', price: '29.95', weight: 1000,
    colors: ['Black', 'White', 'Blue', 'Transparent'] },

  // ── Polycarbonate (PC) 3mm 1kg ─────────────────────────────────
  { title: 'Gizmo Dorks Polycarbonate Filament 3mm', handle: 'pc-3mm', material: 'PC', price: '29.95', weight: 1000,
    colors: ['Black', 'White', 'Blue', 'Transparent'] },

  // ── TPU Flexible 1.75mm 1kg ─────────────────────────────────────
  { title: 'Gizmo Dorks Flexible TPU Filament 1.75mm', handle: 'tpu-175', material: 'TPU', price: '29.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Transparent', 'Purple', 'Pink'] },

  // ── TPU Flexible 3mm 1kg ────────────────────────────────────────
  { title: 'Gizmo Dorks Flexible TPU Filament 3mm', handle: 'tpu-3mm', material: 'TPU', price: '29.95', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Transparent', 'Purple', 'Pink'] },

  // ── Carbon Fiber ABS 1.75mm 1kg ─────────────────────────────────
  { title: 'Gizmo Dorks Carbon Fiber ABS Filament 1.75mm', handle: 'carbon-fiber-abs-175', material: 'ABS-CF', price: '34.95', weight: 1000,
    colors: ['Black'] },

  // ── Carbon Fiber ABS 3mm 1kg ────────────────────────────────────
  { title: 'Gizmo Dorks Carbon Fiber ABS Filament 3mm', handle: 'carbon-fiber-abs-3mm', material: 'ABS-CF', price: '34.95', weight: 1000,
    colors: ['Black'] },

  // ── Wood PLA 1.75mm 1kg ─────────────────────────────────────────
  { title: 'Gizmo Dorks Wood Filament 1.75mm', handle: 'wood-175', material: 'Wood PLA', price: '24.95', weight: 1000,
    colors: ['Natural'] },

  // ── Wood PLA 3mm 1kg ────────────────────────────────────────────
  { title: 'Gizmo Dorks Wood Filament 3mm', handle: 'wood-3mm', material: 'Wood PLA', price: '24.95', weight: 1000,
    colors: ['Natural'] },

  // ── Metal Fill Bronze PLA 1.75mm 1kg ────────────────────────────
  { title: 'Gizmo Dorks Metal Bronze Filament 1.75mm', handle: 'metal-bronze-175', material: 'Metal PLA', price: '29.95', weight: 1000,
    colors: ['Bronze'] },

  // ── Metal Fill Bronze PLA 3mm 1kg ───────────────────────────────
  { title: 'Gizmo Dorks Metal Bronze Filament 3mm', handle: 'metal-bronze-3mm', material: 'Metal PLA', price: '29.95', weight: 1000,
    colors: ['Bronze'] },

  // ── Metal Fill Copper PLA 1.75mm 1kg ────────────────────────────
  { title: 'Gizmo Dorks Metal Copper Filament 1.75mm', handle: 'metal-copper-175', material: 'Metal PLA', price: '29.95', weight: 1000,
    colors: ['Copper'] },

  // ── Metal Fill Copper PLA 3mm 1kg ───────────────────────────────
  { title: 'Gizmo Dorks Metal Copper Filament 3mm', handle: 'metal-copper-3mm', material: 'Metal PLA', price: '29.95', weight: 1000,
    colors: ['Copper'] },

  // ── Acetal (POM) 1.75mm 1kg ─────────────────────────────────────
  { title: 'Gizmo Dorks Acetal POM Filament 1.75mm', handle: 'acetal-175', material: 'POM', price: '29.95', weight: 1000,
    colors: ['Natural', 'Black', 'White'] },

  // ── Acetal (POM) 3mm 1kg ────────────────────────────────────────
  { title: 'Gizmo Dorks Acetal POM Filament 3mm', handle: 'acetal-3mm', material: 'POM', price: '29.95', weight: 1000,
    colors: ['Natural', 'Black', 'White'] },

  // ── PLA 5kg 1.75mm ──────────────────────────────────────────────
  { title: 'Gizmo Dorks PLA Filament 1.75mm 5kg', handle: 'pla-175-5kg', material: 'PLA', price: '104.95', weight: 5000,
    colors: ['Black', 'White', 'Grey'] },

  // ── PLA 5kg 3mm ─────────────────────────────────────────────────
  { title: 'Gizmo Dorks PLA Filament 3mm 5kg', handle: 'pla-3mm-5kg', material: 'PLA', price: '104.95', weight: 5000,
    colors: ['Black', 'White', 'Grey'] },

  // ── PETG 5kg 1.75mm ─────────────────────────────────────────────
  { title: 'Gizmo Dorks PETG Filament 1.75mm 5kg', handle: 'petg-175-5kg', material: 'PETG', price: '109.95', weight: 5000,
    colors: ['Black', 'White', 'Transparent'] },

  // ── PETG 5kg 3mm ────────────────────────────────────────────────
  { title: 'Gizmo Dorks PETG Filament 3mm 5kg', handle: 'petg-3mm-5kg', material: 'PETG', price: '109.95', weight: 5000,
    colors: ['Black', 'White', 'Transparent'] },

  // ── ABS 5kg 1.75mm ──────────────────────────────────────────────
  { title: 'Gizmo Dorks ABS Filament 1.75mm 5kg', handle: 'abs-175-5kg', material: 'ABS', price: '104.95', weight: 5000,
    colors: ['Black', 'White', 'Grey'] },

  // ── ABS 5kg 3mm ─────────────────────────────────────────────────
  { title: 'Gizmo Dorks ABS Filament 3mm 5kg', handle: 'abs-3mm-5kg', material: 'ABS', price: '104.95', weight: 5000,
    colors: ['Black', 'White', 'Grey'] },

  // ── HIPS 5kg 1.75mm ─────────────────────────────────────────────
  { title: 'Gizmo Dorks HIPS Filament 1.75mm 5kg', handle: 'hips-175-5kg', material: 'HIPS', price: '104.95', weight: 5000,
    colors: ['Black', 'White', 'Grey'] },

  // ── HIPS 5kg 3mm ────────────────────────────────────────────────
  { title: 'Gizmo Dorks HIPS Filament 3mm 5kg', handle: 'hips-3mm-5kg', material: 'HIPS', price: '104.95', weight: 5000,
    colors: ['Black', 'White', 'Grey'] },
];

function main() {
  console.log('Building Gizmo Dorks product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of GIZMO_DORKS_PRODUCTS) {
    const colors = entry.colors || ['Default'];

    for (const color of colors) {
      const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const handle = `${entry.handle}-${colorSlug}`;

      // Build the title: remove the trailing size marker for color insertion
      const sizePattern = / Filament \d+(?:\.\d+)?mm(?: \dkg)?$/;
      const sizeMatch = entry.title.match(sizePattern);
      const sizeSuffix = sizeMatch ? sizeMatch[0] : '';
      const titleBase = sizeMatch ? entry.title.replace(sizePattern, '') : entry.title;
      const title = color !== 'Default'
        ? `${titleBase} ${color}${sizeSuffix}`
        : entry.title;

      products.push({
        id: idCounter * 1000,
        title,
        handle,
        product_type: entry.material,
        vendor: 'Gizmo Dorks',
        tags: entry.material,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `GIZMODORKS-${handle}`,
          option1: color,
          option2: null,
          option3: null,
          available: true,
          grams: entry.weight,
        }],
        options: [{ name: 'Color', position: 1, values: [color] }],
        images: [],
        body_html: '',
        published_at: new Date().toISOString(),
      });

      idCounter++;
    }
  }

  console.log(`Total products (with color variants): ${products.length}`);

  // Material distribution
  const materials = {};
  for (const p of products) {
    materials[p.product_type] = (materials[p.product_type] || 0) + 1;
  }
  console.log('\nMaterial distribution:');
  for (const [mat, count] of Object.entries(materials).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${mat}: ${count}`);
  }

  // Save to scripts/
  const outPath = path.join(__dirname, 'gizmo-dorks-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'gizmo-dorks-catalog-curated',
    currency: 'USD',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'gizmo-dorks-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
