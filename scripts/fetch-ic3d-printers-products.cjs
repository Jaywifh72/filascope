#!/usr/bin/env node
/**
 * Pre-fetch IC3D Printers filament products using a curated product catalog.
 *
 * IC3D Printers is a US-based filament manufacturer (Columbus, Ohio) known for
 * high-quality, made-in-USA filaments. Their store at ic3dprinters.com runs on
 * a custom platform (not Shopify). This script uses a manually curated product
 * list based on their storefront and authorized retailers.
 *
 * Usage:
 *   node scripts/fetch-ic3d-printers-products.cjs
 *
 * Output:
 *   scripts/ic3d-printers-products.json      (raw data)
 *   public/data/ic3d-printers-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// IC3D Printers product catalog - curated from ic3dprinters.com
// Prices in USD, diameter 1.75mm, standard spool weight 1kg unless noted
const IC3D_PRODUCTS = [
  // ── Impact Modified PLA (Glossy) ────────────────────────────────
  { title: 'IC3D Impact Modified PLA Filament 1.75mm', handle: 'impact-modified-pla', material: 'PLA', price: '34.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Grey', 'Natural'] },

  // ── Matte Impact Modified PLA ───────────────────────────────────
  { title: 'IC3D Matte Impact Modified PLA Filament 1.75mm', handle: 'matte-impact-modified-pla', material: 'PLA', price: '34.99', weight: 1000,
    colors: ['Black', 'White', 'Green'] },

  // ── ABS ─────────────────────────────────────────────────────────
  { title: 'IC3D ABS Filament 1.75mm', handle: 'abs', material: 'ABS', price: '34.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Natural'] },

  // ── PETG ────────────────────────────────────────────────────────
  { title: 'IC3D PETG Filament 1.75mm', handle: 'petg', material: 'PETG', price: '34.99', weight: 1000,
    colors: ['Black', 'White', 'Red', 'Blue', 'Bright Green', 'Yellow', 'Grey', 'Natural'] },

  // ── Recycled PETG ───────────────────────────────────────────────
  { title: 'IC3D Recycled PETG Filament 1.75mm', handle: 'recycled-petg', material: 'PETG', price: '24.99', weight: 1000,
    colors: ['Black', 'White', 'Natural', 'Red', 'Blue Razz', 'Cherry', 'Grape', 'Honey', 'Watermelon'] },

  // ── Matte Recycled PETG ─────────────────────────────────────────
  { title: 'IC3D Matte Recycled PETG Filament 1.75mm', handle: 'matte-recycled-petg', material: 'PETG', price: '27.99', weight: 1000,
    colors: ['Black', 'White', 'Drifting Fog', 'Balanced Beige', 'Graphite Grey'] },

  // ── Carbon Fiber PETG ───────────────────────────────────────────
  { title: 'IC3D Carbon Fiber PETG Filament 1.75mm', handle: 'cf-petg', material: 'PETG-CF', price: '49.99', weight: 1000,
    colors: ['Black'] },

  // ── UV-PETG ─────────────────────────────────────────────────────
  { title: 'IC3D UV-PETG Filament 1.75mm', handle: 'uv-petg', material: 'PETG', price: '39.99', weight: 1000,
    colors: ['Black', 'White', 'Natural'] },

  // ── PolyHex (Hi-Temp PETG) ──────────────────────────────────────
  { title: 'IC3D PolyHex Hi-Temp PETG Filament 1.75mm', handle: 'polyhex', material: 'HT-PETG', price: '48.95', weight: 1000,
    colors: ['Natural'] },
];

function main() {
  console.log('Building IC3D Printers product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of IC3D_PRODUCTS) {
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
        vendor: 'IC3D Printers',
        tags: entry.material,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `IC3D-${handle}`,
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
  const outPath = path.join(__dirname, 'ic3d-printers-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'ic3d-printers-catalog-curated',
    currency: 'USD',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'ic3d-printers-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
