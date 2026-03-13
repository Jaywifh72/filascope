#!/usr/bin/env node
/**
 * Pre-fetch Geeetech filament products using a curated product catalog.
 *
 * Geeetech is a Chinese 3D printer manufacturer running a custom e-commerce
 * platform (not Shopify) at geeetech.com. This script uses a manually curated
 * product list based on their storefront and verified product listings.
 *
 * Usage:
 *   node scripts/fetch-geeetech-products.cjs
 *
 * Output:
 *   scripts/geeetech-products.json      (raw data)
 *   public/data/geeetech-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// Geeetech product catalog - curated from geeetech.com
// Prices in USD, standard spool weight 1000g (1kg), diameter 1.75mm
const GEEETECH_PRODUCTS = [
  // ── Standard PLA ──────────────────────────────────────────────
  { title: 'Geeetech PLA Filament 1.75mm', handle: 'pla', material: 'PLA', price: '10.79', weight: 1000,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Silver', 'Transparent', 'Warm White', 'Water Blue', 'Apple Green', 'Brown'] },

  // ── Matte PLA ─────────────────────────────────────────────────
  { title: 'Geeetech Matte PLA Filament 1.75mm', handle: 'matte-pla', material: 'Matte PLA', price: '12.49', weight: 1000,
    colors: ['Matte Black', 'Matte White', 'Matte Grey', 'Matte Green', 'Matte Orange', 'Matte Brown', 'Matte Olive Green', 'Matte Skin', 'Matte Terracotta'] },

  // ── Silk PLA (Single Color) ───────────────────────────────────
  { title: 'Geeetech Silk PLA Filament 1.75mm', handle: 'silk-pla', material: 'Silk PLA', price: '12.49', weight: 1000,
    colors: ['Gold', 'Silver', 'Copper', 'White', 'Green', 'Magenta', 'Black', 'Blue', 'Red'] },

  // ── Silk PLA Rainbow ──────────────────────────────────────────
  { title: 'Geeetech Silk PLA Rainbow Filament 1.75mm', handle: 'silk-pla-rainbow', material: 'Silk PLA', price: '15.49', weight: 1000,
    colors: ['Rainbow', 'Rainbow Light Color'] },

  // ── Silk PLA Dual Color ───────────────────────────────────────
  { title: 'Geeetech Silk PLA Dual Color Filament 1.75mm', handle: 'silk-pla-dual', material: 'Silk PLA', price: '13.49', weight: 1000,
    colors: ['Gold+Silver', 'Gold+Red', 'Gold+Purple', 'Gold+Copper', 'Gold+Black', 'Black+Red', 'Green+Red', 'Blue+Green', 'Yellow+Green'] },

  // ── Silk PLA Tri Color ────────────────────────────────────────
  { title: 'Geeetech Silk PLA Tricolor Filament 1.75mm', handle: 'silk-pla-tricolor', material: 'Silk PLA', price: '14.49', weight: 1000,
    colors: ['Red+Gold+Purple', 'Red+Blue+Green', 'Red+Gold+Black', 'Blue+Purple+Black', 'Gold+Silver+Copper'] },

  // ── High Speed PLA (HS-PLA) ───────────────────────────────────
  { title: 'Geeetech High Speed PLA Filament 1.75mm', handle: 'hs-pla', material: 'PLA', price: '12.59', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Apple Green', 'Brown', 'Transparent', 'Purple'] },

  // ── Sparkly PLA ───────────────────────────────────────────────
  { title: 'Geeetech Sparkly PLA Filament 1.75mm', handle: 'sparkly-pla', material: 'Glitter PLA', price: '15.49', weight: 1000,
    colors: ['Sparkly Blue', 'Sparkly Purple', 'Sparkly Silver'] },

  // ── Glow in the Dark PLA ──────────────────────────────────────
  { title: 'Geeetech Luminous PLA Filament 1.75mm', handle: 'luminous-pla', material: 'Glow PLA', price: '15.99', weight: 1000,
    colors: ['Luminous Green', 'Luminous Blue', 'Luminous Orange', 'Luminous Yellow', 'Luminous White', 'Luminous Purple', 'Luminous Rose Red', 'Luminous Multicolor'] },

  // ── Marble PLA ────────────────────────────────────────────────
  { title: 'Geeetech Marble PLA Filament 1.75mm', handle: 'marble-pla', material: 'Marble PLA', price: '14.50', weight: 1000,
    colors: ['Marble Grey'] },

  // ── Gradient Color PLA ────────────────────────────────────────
  { title: 'Geeetech Gradient Color PLA Filament 1.75mm', handle: 'gradient-pla', material: 'PLA', price: '14.50', weight: 1000,
    colors: ['Gradient Multicolor'] },

  // ── Carbon Fiber PLA ──────────────────────────────────────────
  { title: 'Geeetech Carbon Fiber PLA Filament 1.75mm', handle: 'cf-pla', material: 'PLA-CF', price: '13.99', weight: 1000,
    colors: ['Black', 'Blue', 'Brick Red', 'Matcha Green'] },

  // ── Wood PLA ──────────────────────────────────────────────────
  { title: 'Geeetech Wood PLA Filament 1.75mm', handle: 'wood-pla', material: 'Wood PLA', price: '15.75', weight: 1000,
    colors: ['Wood', 'Black Walnut', 'Ebony', 'Rose'] },

  // ── PETG ──────────────────────────────────────────────────────
  { title: 'Geeetech PETG Filament 1.75mm', handle: 'petg', material: 'PETG', price: '10.49', weight: 1000,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Orange', 'Transparent', 'Pink', 'Brown', 'Skin', 'Yellow', 'Purple'] },

  // ── PETG Metallic ─────────────────────────────────────────────
  { title: 'Geeetech PETG Metallic Filament 1.75mm', handle: 'petg-metallic', material: 'PETG', price: '14.99', weight: 1000,
    colors: ['Metallic Pink'] },

  // ── ABS+ ──────────────────────────────────────────────────────
  { title: 'Geeetech ABS+ Filament 1.75mm', handle: 'abs-plus', material: 'ABS', price: '10.69', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Grey', 'Orange', 'Purple', 'Apple Green'] },

  // ── TPU ───────────────────────────────────────────────────────
  { title: 'Geeetech TPU Filament 1.75mm', handle: 'tpu', material: 'TPU', price: '16.89', weight: 1000,
    colors: ['Black', 'White', 'Orange', 'Grey', 'Transparent', 'Transparent Red', 'Transparent Blue', 'Transparent Purple', 'Transparent Yellow', 'Transparent Brown'] },

  // ── ASA ───────────────────────────────────────────────────────
  { title: 'Geeetech ASA Filament 1.75mm', handle: 'asa', material: 'ASA', price: '19.99', weight: 1000,
    colors: ['Black', 'White', 'Green', 'Blue', 'Orange', 'Purple'] },
];

function main() {
  console.log('Building Geeetech product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of GEEETECH_PRODUCTS) {
    const colors = entry.colors || ['Default'];

    for (const color of colors) {
      const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const handle = `${entry.handle}-${colorSlug}`;
      const title = color !== 'Default'
        ? `${entry.title.replace(' Filament 1.75mm', '')} ${color} Filament 1.75mm`
        : entry.title;

      products.push({
        id: idCounter * 1000,
        title,
        handle,
        product_type: entry.material,
        vendor: 'Geeetech',
        tags: entry.material,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `GEEETECH-${handle}`,
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
  const outPath = path.join(__dirname, 'geeetech-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'geeetech-catalog-curated',
    currency: 'USD',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'geeetech-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
