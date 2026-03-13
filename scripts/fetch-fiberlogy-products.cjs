#!/usr/bin/env node
/**
 * Pre-fetch Fiberlogy filament products using a curated product catalog.
 *
 * Fiberlogy runs on Shoper.pl, a Polish e-commerce platform that does not
 * serve JSON-LD structured data in a way that can be reliably scraped.
 * This script uses a manually curated product list instead.
 *
 * Usage:
 *   node scripts/fetch-fiberlogy-products.cjs
 *
 * Output:
 *   scripts/fiberlogy-products.json      (raw data)
 *   public/data/fiberlogy-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// Fiberlogy product catalog - curated from fiberlogy.com
// Prices in EUR, standard spool weight 0.85kg, diameter 1.75mm
const FIBERLOGY_PRODUCTS = [
  // ── Easy PLA ────────────────────────────────────────────────
  { title: 'Fiberlogy Easy PLA Filament 1.75mm', handle: 'easy-pla', material: 'PLA', price: '15.90', weight: 850,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Pink', 'Navy Blue', 'Beige', 'Brown', 'Vertigo (Transparent)', 'Natural (Transparent)'] },

  // ── Easy PLA Refill ─────────────────────────────────────────
  { title: 'Fiberlogy Easy PLA Refill 1.75mm', handle: 'easy-pla-refill', material: 'PLA', price: '13.90', weight: 850,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Orange'] },

  // ── Easy PETG ───────────────────────────────────────────────
  { title: 'Fiberlogy Easy PETG Filament 1.75mm', handle: 'easy-petg', material: 'PETG', price: '15.90', weight: 850,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Orange', 'Yellow', 'Transparent', 'Navy Blue'] },

  // ── Easy PET-G Refill ───────────────────────────────────────
  { title: 'Fiberlogy Easy PET-G Refill 1.75mm', handle: 'easy-petg-refill', material: 'PETG', price: '13.90', weight: 850,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Transparent'] },

  // ── Easy ABS ────────────────────────────────────────────────
  { title: 'Fiberlogy Easy ABS Filament 1.75mm', handle: 'easy-abs', material: 'ABS', price: '16.90', weight: 750,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Natural'] },

  // ── Easy ASA ────────────────────────────────────────────────
  { title: 'Fiberlogy Easy ASA Filament 1.75mm', handle: 'easy-asa', material: 'ASA', price: '18.90', weight: 750,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Natural'] },

  // ── Impact PLA ──────────────────────────────────────────────
  { title: 'Fiberlogy Impact PLA Filament 1.75mm', handle: 'impact-pla', material: 'PLA', price: '19.90', weight: 850,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Orange', 'Yellow'] },

  // ── HD PLA ──────────────────────────────────────────────────
  { title: 'Fiberlogy HD PLA Filament 1.75mm', handle: 'hd-pla', material: 'PLA', price: '19.90', weight: 850,
    colors: ['Black', 'White', 'Grey', 'Natural'] },

  // ── Antibacterial PLA ───────────────────────────────────────
  { title: 'Fiberlogy Antibacterial PLA Filament 1.75mm', handle: 'antibacterial-pla', material: 'PLA', price: '22.90', weight: 850,
    colors: ['White', 'Natural'] },

  // ── FiberFlex 40D ───────────────────────────────────────────
  { title: 'Fiberlogy FiberFlex 40D Filament 1.75mm', handle: 'fiberflex-40d', material: 'TPU', price: '24.90', weight: 850,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Transparent'] },

  // ── FiberFlex 30D ───────────────────────────────────────────
  { title: 'Fiberlogy FiberFlex 30D Filament 1.75mm', handle: 'fiberflex-30d', material: 'TPU', price: '26.90', weight: 850,
    colors: ['Black', 'White', 'Transparent'] },

  // ── Nylon PA12 ──────────────────────────────────────────────
  { title: 'Fiberlogy Nylon PA12 Filament 1.75mm', handle: 'nylon-pa12', material: 'PA', price: '29.90', weight: 750,
    colors: ['Natural', 'Black'] },

  // ── Nylon PA12+CF15 ─────────────────────────────────────────
  { title: 'Fiberlogy Nylon PA12+CF15 Filament 1.75mm', handle: 'nylon-pa12-cf15', material: 'PA-CF', price: '44.90', weight: 500,
    colors: ['Black'] },

  // ── HIPS ────────────────────────────────────────────────────
  { title: 'Fiberlogy HIPS Filament 1.75mm', handle: 'hips', material: 'HIPS', price: '16.90', weight: 850,
    colors: ['Natural', 'Black', 'White'] },

  // ── FiberSilk Metallic ──────────────────────────────────────
  { title: 'Fiberlogy FiberSilk Metallic PLA Filament 1.75mm', handle: 'fibersilk-metallic', material: 'Silk PLA', price: '21.90', weight: 850,
    colors: ['Gold', 'Silver', 'Copper', 'Bronze', 'Blue', 'Green', 'Red', 'Rose Gold'] },

  // ── FiberSatin ──────────────────────────────────────────────
  { title: 'Fiberlogy FiberSatin PLA Filament 1.75mm', handle: 'fibersatin', material: 'PLA', price: '21.90', weight: 850,
    colors: ['Pearl White', 'Cream', 'Graphite', 'Navy Blue', 'Burgundy'] },

  // ── FiberWood ───────────────────────────────────────────────
  { title: 'Fiberlogy FiberWood PLA Filament 1.75mm', handle: 'fiberwood', material: 'Wood PLA', price: '23.90', weight: 750,
    colors: ['Natural'] },
];

function main() {
  console.log('Building Fiberlogy product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of FIBERLOGY_PRODUCTS) {
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
        vendor: 'Fiberlogy',
        tags: entry.material,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `FIBERLOGY-${handle}`,
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
  const outPath = path.join(__dirname, 'fiberlogy-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'fiberlogy-catalog-curated',
    currency: 'EUR',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'fiberlogy-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
