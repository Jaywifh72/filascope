#!/usr/bin/env node
/**
 * Pre-fetch Paramount 3D filament products using a curated product catalog.
 *
 * Paramount 3D sells primarily through Amazon and their Wix-based website
 * (paramount-3d.com). Neither platform exposes a CORS-enabled product API,
 * so this script uses a manually curated product list based on their
 * storefront, Amazon listings, and sample pack contents.
 *
 * Usage:
 *   node scripts/fetch-paramount-3d-products.cjs
 *
 * Output:
 *   scripts/paramount-3d-products.json      (raw data)
 *   public/data/paramount-3d-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// Paramount 3D product catalog - curated from paramount-3d.com + Amazon listings
// Prices in USD, standard spool weight 1000g (1kg), diameter 1.75mm
// Price reference: ~$29.99 for PETG, ~$24.99-29.99 for PLA, ~$29.99 for ABS
const PARAMOUNT_PRODUCTS = [
  // ── PLA (Full Spectrum ~40 colors) ──────────────────────────
  { title: 'Paramount 3D PLA Filament 1.75mm', handle: 'pla', material: 'PLA', price: '24.99', weight: 1000,
    colors: [
      'White', 'Black', 'Matte Black',
      'Prototype Gray', 'Stealth Gray', 'Steel Gray', 'Battleship Gray',
      'Castle Limestone Gray', 'Graphite Gray', 'Game Cartridge Gray',
      'Enzo Red', 'Iron Red', 'Hannibal Red',
      'Harajuku Pink', 'Caribbean Coral',
      'Volcano Orange', 'McLaren Orange',
      'Simpson Yellow', 'Egg Yolk Yellow',
      'British Racing Green', 'St Andrews Green', 'Military Green', 'Leviathan Green Blue',
      'Autobot Blue', 'Cadet Blue', 'Fighter Jet Blue', 'Tuxedo Midnight Blue', 'Mid Century Teal',
      'Decepticon Purple', 'Black Cherry',
      'Gold', 'Silver',
      'Universal Beige', 'Ivory', 'Fair Complexion', 'Dark Complexion', 'Deep Complexion',
      'Terra Cotta', 'Military Khaki', 'Primordial Earth',
    ] },

  // ── PETG (~21 colors) ──────────────────────────────────────
  { title: 'Paramount 3D PETG Filament 1.75mm', handle: 'petg', material: 'PETG', price: '29.99', weight: 1000,
    colors: [
      'White', 'Black',
      'Prototype Gray', 'Stealth Gray', 'Graphite Gray',
      'Iron Red', 'Hannibal Red', 'Enzo Red',
      'Harajuku Pink',
      'McLaren Orange',
      'Military Green', 'British Racing Green',
      'Autobot Blue', 'Fighter Jet Blue', 'Mid Century Teal',
      'Decepticon Purple', 'Black Cherry',
      'Universal Beige', 'Military Khaki',
      'Military MBT Brown', 'Primordial Earth',
    ] },

  // ── PETG Carbon Fiber ──────────────────────────────────────
  { title: 'Paramount 3D PETG-CF Filament 1.75mm', handle: 'petg-cf', material: 'PETG-CF', price: '39.99', weight: 1000,
    colors: ['Steampunk Black'] },

  // ── ABS (~26 colors) ───────────────────────────────────────
  { title: 'Paramount 3D ABS Filament 1.75mm', handle: 'abs', material: 'ABS', price: '29.99', weight: 1000,
    colors: [
      'White', 'Black', 'Clear',
      'Prototype Gray', 'Light Gray', 'Steel Gray', 'Battleship Gray',
      'Castle Limestone Gray', 'Graphite Gray', 'Game Cartridge Gray',
      'Enzo Red', 'Iron Red',
      'Harajuku Pink',
      'McLaren Orange',
      'Simpson Yellow',
      'British Racing Green', 'Military Green',
      'Autobot Blue', 'Fighter Jet Blue',
      'Decepticon Purple',
      'Gold', 'Gold Krugerrand', 'Silver',
      'Universal Beige', 'Ivory', 'Fair Complexion', 'Dark Complexion',
      'Terra Cotta', 'Military Khaki', 'Military MBT Brown', 'Primordial Earth',
    ] },

  // ── ABS Carbon Fiber ──────────────────────────────────────
  { title: 'Paramount 3D ABS-CF Filament 1.75mm', handle: 'abs-cf', material: 'ABS-CF', price: '39.99', weight: 1000,
    colors: ['Black'] },

  // ── FlexPLA ────────────────────────────────────────────────
  { title: 'Paramount 3D FlexPLA Filament 1.75mm', handle: 'flexpla', material: 'FlexPLA', price: '29.99', weight: 1000,
    colors: [
      'Black', 'Graphite Gray', 'Iron Red', 'Military Green', 'Military Khaki',
    ] },

  // ── ASA ────────────────────────────────────────────────────
  { title: 'Paramount 3D ASA Filament 1.75mm', handle: 'asa', material: 'ASA', price: '32.99', weight: 1000,
    colors: [
      'Black', 'White', 'Prototype Gray', 'Primordial Earth',
    ] },

  // ── TPU ────────────────────────────────────────────────────
  { title: 'Paramount 3D TPU Filament 1.75mm', handle: 'tpu', material: 'TPU', price: '34.99', weight: 1000,
    colors: ['Black', 'White'] },

  // ── Nylon ──────────────────────────────────────────────────
  { title: 'Paramount 3D Nylon Filament 1.75mm', handle: 'nylon', material: 'Nylon', price: '39.99', weight: 1000,
    colors: ['Natural'] },

  // ── PVA ────────────────────────────────────────────────────
  { title: 'Paramount 3D PVA Filament 1.75mm', handle: 'pva', material: 'PVA', price: '49.99', weight: 500,
    colors: ['Natural'] },
];

function main() {
  console.log('Building Paramount 3D product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of PARAMOUNT_PRODUCTS) {
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
        vendor: 'Paramount 3D',
        tags: entry.material,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `PARAMOUNT-${handle}`,
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
  const outPath = path.join(__dirname, 'paramount-3d-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'paramount-3d-catalog-curated',
    currency: 'USD',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'paramount-3d-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
