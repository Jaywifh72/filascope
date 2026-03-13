#!/usr/bin/env node
/**
 * Pre-fetch 3DHOJOR products via Shopify /products.json.
 *
 * 3DHOJOR is a standard Shopify store but has no CORS headers,
 * so browser-side fetch fails. This script fetches server-side
 * and saves the JSON for the browser sync to load.
 *
 * Usage:
 *   node scripts/fetch-3dhojor-products.cjs
 *
 * Output:
 *   scripts/3dhojor-products.json   (raw data)
 *   public/data/3dhojor-products.json  (for browser-side sync)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://3dhojor.com';
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

async function main() {
  console.log('Fetching 3DHOJOR products from Shopify API...');
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

  // Filter to filament products only
  const filamentProducts = allProducts.filter(p => {
    const pt = (p.product_type || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const tags = (p.tags || []).map(t => t.toLowerCase()).join(' ');
    // Include explicit filament types and keyword matches
    if (pt === 'filament') return true;
    if (title.includes('filament') || title.includes('pla') || title.includes('petg') ||
        title.includes('tpu') || title.includes('abs') || title.includes('asa') ||
        title.includes('nylon') || title.includes('silk')) return true;
    if (tags.includes('filament') || tags.includes('pla') || tags.includes('petg')) return true;
    return false;
  });

  // Exclude non-filament items
  const excluded = ['gift card', 'apparel', 't-shirt', 'hoodie', 'dryer', 'enclosure'];
  const finalProducts = filamentProducts.filter(p => {
    const title = (p.title || '').toLowerCase();
    return !excluded.some(ex => title.includes(ex));
  });

  console.log('');
  console.log(`Results: ${allProducts.length} total products, ${filamentProducts.length} filament products`);
  console.log(`After exclusions: ${finalProducts.length} products`);

  // Count total variants
  const totalVariants = finalProducts.reduce((sum, p) => sum + p.variants.length, 0);
  console.log(`Total variants: ${totalVariants}`);

  // Show material distribution
  const materials = {};
  for (const p of finalProducts) {
    const pt = (p.product_type || 'Unknown').trim();
    materials[pt] = (materials[pt] || 0) + 1;
  }
  console.log('\nProduct type distribution:');
  for (const [mat, count] of Object.entries(materials).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${mat}: ${count}`);
  }

  // Save to scripts/ directory
  const outPath = path.join(__dirname, '3dhojor-products.json');
  const output = {
    products: finalProducts,
    excluded: allProducts.length - finalProducts.length,
    fetchedAt: new Date().toISOString(),
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Also copy to public/data/ for browser access
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, '3dhojor-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main().catch(e => console.error('Fatal error:', e));
