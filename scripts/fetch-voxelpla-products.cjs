#!/usr/bin/env node
/**
 * Pre-fetch VoxelPLA filament products from their Shopify store.
 *
 * VoxelPLA (voxelpla.com) is a Shopify store but does not serve
 * CORS headers, so the browser-side catalog sync cannot fetch directly.
 * This script fetches from /products.json server-side and filters
 * to filament-only products.
 *
 * Usage:
 *   node scripts/fetch-voxelpla-products.cjs
 *
 * Output:
 *   scripts/voxelpla-products.json      (raw data)
 *   public/data/voxelpla-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://voxelpla.com';
const BRAND = 'voxelpla';
const VENDOR = 'VoxelPLA';

// Keywords that indicate a product is a filament (case-insensitive title match)
const FILAMENT_KEYWORDS = [
  'filament', 'pla', 'petg', 'abs', 'tpu', 'asa', 'nylon',
  'galaxy petg', 'voxelpla', 'voxelpetg',
];

// Keywords that indicate a product is NOT a filament
const EXCLUDE_KEYWORDS = [
  'filter', 'fan ', 'bento', 'drawer', 'enclosure', 'light bar',
  'damper', 'hardware kit', 'silica gel', 'dry box', 'ams upgrade',
  'python', 'hydra', 'hula', 'vision enclosure', 'vento', 'ventobox',
  'replacement', 'carbon', 'hepa', 'bundle',
];

function isFilament(product) {
  const title = product.title.toLowerCase();
  // Exclude non-filament products first
  if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) return false;
  // Include if title contains filament keywords
  return FILAMENT_KEYWORDS.some(kw => title.includes(kw));
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

  // Show what was excluded for verification
  const excludedProducts = allProducts.filter(p => !isFilament(p));
  if (excludedProducts.length > 0) {
    console.log('\nExcluded products:');
    for (const p of excludedProducts) {
      console.log(`  - ${p.title}`);
    }
  }

  // Material distribution
  const materials = {};
  for (const p of filaments) {
    const title = p.title.toLowerCase();
    let mat = 'Other';
    if (title.includes('galaxy petg') || title.includes('voxelpetg') || title.includes('petg')) mat = 'PETG';
    else if (title.includes('pla')) mat = 'PLA';
    else if (title.includes('abs')) mat = 'ABS';
    else if (title.includes('tpu')) mat = 'TPU';
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
