#!/usr/bin/env node
/**
 * Pre-fetch Fusion Filaments filament products using a curated product catalog.
 *
 * Fusion Filaments (fusionfilaments.com) runs on an Odoo platform — no Shopify
 * /products.json endpoint available. This script uses a manually curated product
 * list and expands color variants into individual Shopify-compatible products.
 *
 * Usage:
 *   node scripts/fetch-fusion-filaments-products.cjs
 *
 * Output:
 *   scripts/fusion-filaments-products.json        (raw data)
 *   public/data/fusion-filaments-products.json    (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// Fusion Filaments product catalog - curated from fusionfilaments.com
// Prices in USD, standard spool weight 1kg, diameter 1.75mm
const FUSION_PRODUCTS = [
  // ── PLA Filament ─────────────────────────────────────────────
  { title: 'Fusion Filaments PLA Filament 1.75mm', handle: 'pla', material: 'PLA', price: '25.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Pink', 'Brown', 'Natural', 'Navy Blue', 'Light Blue', 'Lime Green'] },

  // ── HT-PLA (High-Temp PLA) ───────────────────────────────────
  { title: 'Fusion Filaments HT-PLA Filament 1.75mm', handle: 'ht-pla', material: 'HT-PLA', price: '27.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Pink', 'Brown', 'Natural'] },

  // ── HT-PET (High-Temp PET) ───────────────────────────────────
  { title: 'Fusion Filaments HT-PET Filament 1.75mm', handle: 'ht-pet', material: 'PETG', price: '29.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Clear', 'Navy Blue', 'Brown'] },

  // ── EasyASA ──────────────────────────────────────────────────
  { title: 'Fusion Filaments EasyASA Filament 1.75mm', handle: 'easy-asa', material: 'ASA', price: '29.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Brown'] },

  // ── Hi-Temp ASA ──────────────────────────────────────────────
  { title: 'Fusion Filaments Hi-Temp ASA Filament 1.75mm', handle: 'hi-temp-asa', material: 'ASA', price: '32.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey'] },

  // ── ABS Matte ────────────────────────────────────────────────
  { title: 'Fusion Filaments ABS Matte Filament 1.75mm', handle: 'abs-matte', material: 'ABS', price: '27.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Pink', 'Brown', 'Natural'] },

  // ── ABS Gloss ────────────────────────────────────────────────
  { title: 'Fusion Filaments ABS Gloss Filament 1.75mm', handle: 'abs-gloss', material: 'ABS', price: '27.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Purple', 'Pink', 'Brown', 'Natural'] },

  // ── Hi-Temp Matte ABS ────────────────────────────────────────
  { title: 'Fusion Filaments Hi-Temp Matte ABS Filament 1.75mm', handle: 'hi-temp-matte-abs', material: 'ABS', price: '32.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Grey', 'Orange', 'Yellow'] },

  // ── PCTG ─────────────────────────────────────────────────────
  { title: 'Fusion Filaments PCTG Filament 1.75mm', handle: 'pctg', material: 'PCTG', price: '29.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Clear', 'Purple'] },
];

function main() {
  console.log('Building Fusion Filaments product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of FUSION_PRODUCTS) {
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
        vendor: 'Fusion Filaments',
        tags: entry.material,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `FUSION-${handle}`,
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
  const outPath = path.join(__dirname, 'fusion-filaments-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'fusion-filaments-catalog-curated',
    currency: 'USD',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'fusion-filaments-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
