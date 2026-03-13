#!/usr/bin/env node
/**
 * Pre-fetch Ziro filament products from their Shopify store.
 *
 * Ziro (ziro3d.com) is a Shopify store but does not serve
 * CORS headers, so the browser-side catalog sync cannot fetch directly.
 * This script fetches from /products.json server-side with pagination.
 *
 * Usage:
 *   node scripts/fetch-ziro-products.cjs
 *
 * Output:
 *   scripts/ziro-products.json      (raw data)
 *   public/data/ziro-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://ziro3d.com';
const BRAND = 'ziro';
const VENDOR = 'ZIRO';

// Ziro is a pure filament brand — virtually everything is filament.
// Exclude only obvious non-filament items if any.
const EXCLUDE_KEYWORDS = [
  'nozzle', 'bed sheet', 'enclosure', 'toolkit', 'drybox', 'dry box',
  'upgrade kit', 'spare part',
];

function isFilament(product) {
  const title = product.title.toLowerCase();
  if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) return false;
  return true;
}

async function fetchAllProducts() {
  const allProducts = [];
  let page = 1;
  const limit = 250;

  while (true) {
    const url = `${BASE_URL}/products.json?limit=${limit}&page=${page}`;
    console.log(`Fetching page ${page}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const data = await res.json();
    if (!data.products || data.products.length === 0) break;
    allProducts.push(...data.products);
    console.log(`  Got ${data.products.length} products (total: ${allProducts.length})`);
    if (data.products.length < limit) break;
    page++;
    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  return allProducts;
}

async function main() {
  console.log(`Fetching ${VENDOR} products from ${BASE_URL}...`);

  const allProducts = await fetchAllProducts();
  console.log(`Total products fetched: ${allProducts.length}`);

  // Filter to filaments only
  const filaments = allProducts.filter(isFilament);
  const excluded = allProducts.length - filaments.length;
  console.log(`Filaments: ${filaments.length}, Excluded: ${excluded}`);

  if (excluded > 0) {
    const excludedProducts = allProducts.filter(p => !isFilament(p));
    console.log('\nExcluded products:');
    for (const p of excludedProducts) {
      console.log(`  - ${p.title}`);
    }
  }

  // Material distribution
  const materials = {};
  for (const p of filaments) {
    const title = p.title.toUpperCase();
    let mat = 'Other';
    if (title.includes('PETG')) mat = 'PETG';
    else if (title.includes('PLA')) mat = 'PLA';
    else if (title.includes('ABS')) mat = 'ABS';
    else if (title.includes('TPU')) mat = 'TPU';
    else if (title.includes('ASA')) mat = 'ASA';
    else if (title.includes('NYLON') || title.includes(' PA ')) mat = 'Nylon';
    else if (title.includes('PC ') || title.includes('POLYCARBONATE')) mat = 'PC';
    materials[mat] = (materials[mat] || 0) + 1;
  }
  console.log('\nMaterial distribution:');
  for (const [mat, count] of Object.entries(materials).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${mat}: ${count}`);
  }

  // Save output
  const output = {
    products: filaments,
    excluded,
    fetchedAt: new Date().toISOString(),
    source: `${BRAND}-shopify-products-json`,
    currency: 'USD',
  };

  const outPath = path.join(__dirname, `${BRAND}-products.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, `${BRAND}-products.json`);
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
