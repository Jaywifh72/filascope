#!/usr/bin/env node
/**
 * Pre-fetch 3DXTech products via Shopify /products.json.
 *
 * 3DXTech is a standard Shopify store but has no CORS headers,
 * so browser-side fetch fails. This script fetches server-side
 * and saves the JSON for the browser sync to load.
 *
 * Usage:
 *   node scripts/fetch-3dxtech-products.cjs
 *
 * Output:
 *   scripts/3dxtech-products.json   (raw data)
 *   public/data/3dxtech-products.json  (for browser-side sync)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.3dxtech.com';
const MAX_PAGES = 5;
const DELAY_MS = 500;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FilaScope/1.0)' },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`  Redirect: ${res.headers.location}`);
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Filament product types from 3DXTech store
const FILAMENT_PRODUCT_TYPES = [
  'FGREEL2', 'FGREEL040', 'FGREEL024', 'FGREEL052', 'MITSUBISHI',
];

async function main() {
  console.log('Fetching 3DXTech products from Shopify API...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  const allProducts = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const url = `${BASE_URL}/products.json?limit=250&page=${page}`;
    process.stdout.write(`[Page ${page}] Fetching... `);

    try {
      const { status, body } = await fetchUrl(url);
      if (status !== 200) {
        console.log(`HTTP ${status}`);
        break;
      }

      const data = JSON.parse(body);
      const products = data?.products;
      if (!products || !Array.isArray(products) || products.length === 0) {
        console.log('No more products');
        break;
      }

      allProducts.push(...products);
      console.log(`${products.length} products (total: ${allProducts.length})`);

      if (products.length < 250) break;
      page++;
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (e) {
      console.log(`Error: ${e.message}`);
      break;
    }
  }

  // Filter to filament products by product_type
  const filamentProducts = allProducts.filter(p => {
    const pt = (p.product_type || '').trim();
    if (FILAMENT_PRODUCT_TYPES.includes(pt)) return true;
    // Fallback: check title for filament keywords
    const title = (p.title || '').toLowerCase();
    if (title.includes('filament') && !title.includes('dryer') && !title.includes('nozzle')) return true;
    return false;
  });

  // Exclude non-filament items (pellets, nozzles, accessories, equipment)
  const excludedTypes = ['PELLETS', 'NOZZLES', 'ACCESSORY', 'GBXFG', 'GBXNOZZLE'];
  const excludedTitles = ['nozzle', 'dryer', 'maintainer', 'accessory', 'swag'];
  const finalProducts = filamentProducts.filter(p => {
    const pt = (p.product_type || '').trim();
    if (excludedTypes.includes(pt)) return false;
    const title = (p.title || '').toLowerCase();
    return !excludedTitles.some(ex => title.includes(ex));
  });

  // Only keep products from 3DXTech vendor (exclude third-party)
  const brandProducts = finalProducts.filter(p => {
    const vendor = (p.vendor || '').toLowerCase();
    return vendor.includes('3dx') || vendor === '';
  });

  console.log('');
  console.log(`Results: ${allProducts.length} total products, ${filamentProducts.length} filament products`);
  console.log(`After exclusions: ${finalProducts.length} products`);
  console.log(`After vendor filter (3DXTech only): ${brandProducts.length} products`);

  // Count total variants
  const totalVariants = brandProducts.reduce((sum, p) => sum + p.variants.length, 0);
  console.log(`Total variants: ${totalVariants}`);

  // Show product type distribution
  const types = {};
  for (const p of brandProducts) {
    const pt = (p.product_type || 'Unknown').trim();
    types[pt] = (types[pt] || 0) + 1;
  }
  console.log('\nProduct type distribution:');
  for (const [t, count] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${count}`);
  }

  // Show vendor distribution
  const vendors = {};
  for (const p of brandProducts) {
    const v = (p.vendor || 'Unknown').trim();
    vendors[v] = (vendors[v] || 0) + 1;
  }
  console.log('\nVendor distribution:');
  for (const [v, count] of Object.entries(vendors).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v}: ${count}`);
  }

  // Save to scripts/ directory
  const outPath = path.join(__dirname, '3dxtech-products.json');
  const output = {
    products: brandProducts,
    excluded: allProducts.length - brandProducts.length,
    fetchedAt: new Date().toISOString(),
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Also copy to public/data/ for browser access
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, '3dxtech-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main().catch(e => console.error('Fatal error:', e));
