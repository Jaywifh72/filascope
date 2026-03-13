#!/usr/bin/env node
/**
 * Pre-fetch NinjaTek filament products using a curated product catalog.
 *
 * NinjaTek is a premium flexible filament manufacturer (TPU/TPE) running
 * a WooCommerce store at ninjatek.com. Their API requires authentication,
 * so this script uses a manually curated product list based on their
 * storefront and verified product listings.
 *
 * Usage:
 *   node scripts/fetch-ninjatek-products.cjs
 *
 * Output:
 *   scripts/ninjatek-products.json      (raw data)
 *   public/data/ninjatek-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// NinjaTek product catalog - curated from ninjatek.com
// Prices in USD, diameter 1.75mm, spool weights vary
const NINJATEK_PRODUCTS = [
  // ── NinjaFlex 85A (flagship flexible filament) ──────────────
  { title: 'NinjaFlex 85A TPU Filament 1.75mm', handle: 'ninjaflex-85a', material: 'TPU',
    price: '102.46', weight: 1000, shore: '85A',
    colors: ['Midnight Black', 'Snow White', 'Steel Gray', 'Fire Red', 'Lava Orange',
             'Sun Yellow', 'Grass Green', 'Sapphire Blue', 'Flamingo Pink',
             'Neon Glow', 'Water Translucent'] },

  // ── NinjaFlex Edge 83A (improved printability) ──────────────
  { title: 'NinjaFlex Edge 83A TPU Filament 1.75mm', handle: 'ninjaflex-edge-83a', material: 'TPU',
    price: '108.49', weight: 1000, shore: '83A',
    colors: ['Midnight Black', 'Snow White'] },

  // ── Chinchilla 75A (ultra-soft, skin-safe) ──────────────────
  { title: 'Chinchilla 75A TPE Filament 1.75mm', handle: 'chinchilla-75a', material: 'TPE',
    price: '118.14', weight: 1000, shore: '75A',
    colors: ['Midnight Black', 'Snow White', 'Steel Gray', 'Sky Blue'] },

  // ── Cheetah 95A (fast-printing flexible) ────────────────────
  { title: 'Cheetah 95A TPU Filament 1.75mm', handle: 'cheetah-95a', material: 'TPU',
    price: '102.46', weight: 1000, shore: '95A',
    colors: ['Midnight Black', 'Snow White', 'Steel Gray', 'Fire Red', 'Lava Orange',
             'Sun Yellow', 'Grass Green', 'Sapphire Blue', 'Flamingo Pink',
             'Neon Glow', 'Water Translucent'] },

  // ── Eel 90A (conductive flexible) ───────────────────────────
  { title: 'Eel 90A Conductive TPU Filament 1.75mm', handle: 'eel-90a', material: 'TPU',
    price: '174.80', weight: 1000, shore: '90A',
    colors: ['Midnight Black'] },

  // ── Armadillo 75D (rigid TPU — being discontinued) ──────────
  { title: 'Armadillo 75D TPU Filament 1.75mm', handle: 'armadillo-75d', material: 'TPU',
    price: '102.46', weight: 1000, shore: '75D',
    colors: ['Midnight Black', 'Snow White', 'Steel Gray', 'Fire Red', 'Lava Orange',
             'Sun Yellow', 'Grass Green', 'Sapphire Blue', 'Water Translucent'] },
];

function main() {
  console.log('Building NinjaTek product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of NINJATEK_PRODUCTS) {
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
        vendor: 'NinjaTek',
        tags: `${entry.material}, ${entry.shore}`,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `NINJATEK-${handle}`,
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
  const outPath = path.join(__dirname, 'ninjatek-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'ninjatek-catalog-curated',
    currency: 'USD',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'ninjatek-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
