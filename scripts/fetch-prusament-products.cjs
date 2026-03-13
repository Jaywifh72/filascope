#!/usr/bin/env node
/**
 * Pre-fetch Prusament filament products using a curated product catalog.
 *
 * Prusa Research runs a custom e-commerce platform at prusa3d.com (not Shopify).
 * No CORS-enabled product API is available, so this script uses a manually
 * curated product list based on their storefront, prusament.com material pages,
 * and verified product listings.
 *
 * Usage:
 *   node scripts/fetch-prusament-products.cjs
 *
 * Output:
 *   scripts/prusament-products.json      (raw data)
 *   public/data/prusament-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// Prusament product catalog - curated from prusa3d.com and prusament.com
// Prices in EUR (Prusa sells primarily in EUR), spool weights vary
const PRUSAMENT_PRODUCTS = [
  // ── PLA (standard colors) ──────────────────────────────────
  { title: 'Prusament PLA 1.75mm', handle: 'pla', material: 'PLA', price: '24.99', weight: 1000,
    colors: [
      'Prusa Galaxy Black', 'Jet Black', 'Pristine White', 'Vanilla White', 'Natural',
      'Prusa Orange', 'Lipstick Red', 'Blood Red',
      'Pineapple Yellow',
      'Azure Blue', 'Chalky Blue',
      'Galaxy Silver', 'Pearl Mouse',
      'Galaxy Purple', 'Galaxy Red', 'Galaxy Green',
      'Prusa Pro Green', 'Simply Green', 'Opal Green', 'Army Green',
      'Emerald Green', 'Electric Green', 'Pistachio Green',
      'Gentleman\'s Grey', 'Marble Grey', 'Gravity Grey', 'Anthracite Grey',
      'Lime Green',
      'Mystic Brown', 'Mystic Green',
      'Noctua Beige', 'Noctua Brown',
    ] },

  // ── PLA Blend (970g spools) ────────────────────────────────
  { title: 'Prusament PLA Blend 1.75mm', handle: 'pla-blend', material: 'PLA', price: '27.99', weight: 970,
    colors: [
      'Royal Blue', 'Ms. Pink', 'Oh My Gold', 'Viva La Bronze',
      'Pearl White', 'My Silverness',
    ] },

  // ── PLA Recycled ───────────────────────────────────────────
  { title: 'Prusament PLA Recycled 1.75mm', handle: 'pla-recycled', material: 'PLA', price: '19.99', weight: 1000,
    colors: ['Motley Bluff'] },

  // ── rPLA ───────────────────────────────────────────────────
  { title: 'Prusament rPLA 1.75mm', handle: 'rpla', material: 'PLA', price: '19.99', weight: 1000,
    colors: ['Neon Green', 'Matte Black'] },

  // ── PETG (standard colors) ─────────────────────────────────
  { title: 'Prusament PETG 1.75mm', handle: 'petg', material: 'PETG', price: '24.99', weight: 1000,
    colors: [
      'Jet Black', 'Matte Black', 'Signal White', 'Clear',
      'Prusa Orange', 'Lipstick Red', 'Carmine Red',
      'Yellow Gold', 'Mango Yellow',
      'Prusa Pro Green', 'Neon Green', 'Jungle Green', 'Pistachio Green',
      'Ultramarine Blue', 'Ocean Blue', 'Chalky Blue',
      'Urban Grey', 'Anthracite Grey',
      'Terracotta Light',
      'Orange Transparent',
      'Galaxy Black',
    ] },

  // ── PETG Carbon Fiber ──────────────────────────────────────
  { title: 'Prusament PETG Carbon Fiber 1.75mm', handle: 'petg-cf', material: 'PETG-CF', price: '39.99', weight: 500,
    colors: ['Jet Black'] },

  // ── PETG Tungsten 75% ──────────────────────────────────────
  { title: 'Prusament PETG Tungsten 75% 1.75mm', handle: 'petg-tungsten', material: 'PETG', price: '99.99', weight: 500,
    colors: ['Tungsten Grey'] },

  // ── PETG V0 (self-extinguishing) ───────────────────────────
  { title: 'Prusament PETG V0 1.75mm', handle: 'petg-v0', material: 'PETG', price: '34.99', weight: 500,
    colors: ['Natural', 'Jet Black'] },

  // ── PETG Recycled ──────────────────────────────────────────
  { title: 'Prusament PETG Recycled 1.75mm', handle: 'petg-recycled', material: 'PETG', price: '19.99', weight: 1000,
    colors: ['Black'] },

  // ── PETG Magnetite 40% ─────────────────────────────────────
  { title: 'Prusament PETG Magnetite 40% 1.75mm', handle: 'petg-magnetite', material: 'PETG', price: '49.99', weight: 500,
    colors: ['Magnetite Black'] },

  // ── ASA ────────────────────────────────────────────────────
  { title: 'Prusament ASA 1.75mm', handle: 'asa', material: 'ASA', price: '29.99', weight: 850,
    colors: [
      'Prusa Orange', 'Jet Black', 'Prusa Galaxy Black',
      'Urban Grey', 'Signal White', 'Prusa Pro Green',
    ] },

  // ── PVB (smoothable) ──────────────────────────────────────
  { title: 'Prusament PVB 1.75mm', handle: 'pvb', material: 'PVB', price: '34.99', weight: 500,
    colors: ['Natural Transparent', 'Smoky Black Transparent'] },

  // ── PC Blend ──────────────────────────────────────────────
  { title: 'Prusament PC Blend 1.75mm', handle: 'pc-blend', material: 'PC', price: '39.99', weight: 970,
    colors: ['Jet Black', 'Natural'] },

  // ── PC Blend Carbon Fiber ─────────────────────────────────
  { title: 'Prusament PC Blend Carbon Fiber 1.75mm', handle: 'pc-blend-cf', material: 'PC-CF', price: '59.99', weight: 500,
    colors: ['Jet Black'] },

  // ── PA11 Carbon Fiber ─────────────────────────────────────
  { title: 'Prusament PA11 Carbon Fiber 1.75mm', handle: 'pa11-cf', material: 'PA-CF', price: '69.99', weight: 500,
    colors: ['Natural'] },

  // ── TPU 95A ───────────────────────────────────────────────
  { title: 'Prusament TPU 95A 1.75mm', handle: 'tpu-95a', material: 'TPU', price: '34.99', weight: 500,
    colors: ['Prusa Orange'] },

  // ── Woodfill ──────────────────────────────────────────────
  { title: 'Prusament Woodfill 1.75mm', handle: 'woodfill', material: 'Wood PLA', price: '34.99', weight: 750,
    colors: ['Wood'] },

  // ── PP Glass Fiber ────────────────────────────────────────
  { title: 'Prusament PP Glass Fiber 1.75mm', handle: 'pp-gf', material: 'PP-GF', price: '39.99', weight: 500,
    colors: ['Natural'] },

  // ── PP Carbon Fiber ───────────────────────────────────────
  { title: 'Prusament PP Carbon Fiber 1.75mm', handle: 'pp-cf', material: 'PP-CF', price: '49.99', weight: 500,
    colors: ['Black'] },

  // ── PEI 1010 ──────────────────────────────────────────────
  { title: 'Prusament PEI 1010 1.75mm', handle: 'pei-1010', material: 'PEI', price: '129.99', weight: 500,
    colors: ['Amber'] },

  // ── PC Space Grade ────────────────────────────────────────
  { title: 'Prusament PC Space Grade 1.75mm', handle: 'pc-space-grade', material: 'PC', price: '89.99', weight: 500,
    colors: ['Natural'] },
];

function main() {
  console.log('Building Prusament product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of PRUSAMENT_PRODUCTS) {
    const colors = entry.colors || ['Default'];

    for (const color of colors) {
      const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const handle = `${entry.handle}-${colorSlug}`;
      const title = color !== 'Default'
        ? `${entry.title.replace(' 1.75mm', '')} ${color} 1.75mm`
        : entry.title;

      products.push({
        id: idCounter * 1000,
        title,
        handle,
        product_type: entry.material,
        vendor: 'Prusament',
        tags: entry.material,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `PRUSAMENT-${handle}`,
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
  const outPath = path.join(__dirname, 'prusament-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'prusament-catalog-curated',
    currency: 'EUR',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'prusament-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
