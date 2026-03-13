#!/usr/bin/env node
/**
 * Pre-fetch AzureFilm products via WooCommerce Store API.
 *
 * AzureFilm is a WooCommerce store with no CORS headers,
 * so browser-side fetch fails. This script fetches server-side
 * and converts the WooCommerce product format to Shopify-compatible
 * format for the browser sync pipeline.
 *
 * Usage:
 *   node scripts/fetch-azurefilm-products.cjs
 *
 * Output:
 *   scripts/azurefilm-products.json      (raw data)
 *   public/data/azurefilm-products.json   (for browser-side sync)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://azurefilm.com';
const API_PATH = '/wp-json/wc/store/v1/products';
const FILAMENT_CATEGORY_ID = 104;
const PER_PAGE = 100;
const MAX_PAGES = 10;
const DELAY_MS = 1000;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FilaScope/1.0)',
        'Accept': 'application/json',
      },
      timeout: 30000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`  Redirect: ${res.headers.location}`);
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        body,
        totalPages: parseInt(res.headers['x-wp-totalpages'] || '0', 10),
        totalItems: parseInt(res.headers['x-wp-total'] || '0', 10),
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

/**
 * Convert a WooCommerce Store API product to Shopify-compatible format.
 * This allows the generic catalog-sync-core pipeline to process it.
 */
function wooToShopifyFormat(wooProduct) {
  // Parse price from cents string to dollars
  const priceEur = wooProduct.prices?.price
    ? (parseInt(wooProduct.prices.price, 10) / 100).toFixed(2)
    : null;
  const regularPriceEur = wooProduct.prices?.regular_price
    ? (parseInt(wooProduct.prices.regular_price, 10) / 100).toFixed(2)
    : null;

  // Extract material and color from product name
  // Names follow pattern: "[Refill] {Material} {Sub-type} {Color}"
  const name = wooProduct.name || '';

  // Build a single variant (AzureFilm products are one-color-per-product)
  const variant = {
    id: wooProduct.id,
    title: name,
    price: priceEur,
    compare_at_price: regularPriceEur !== priceEur ? regularPriceEur : null,
    sku: wooProduct.sku || '',
    option1: name, // Color/product name (will be parsed by pipeline)
    option2: null,
    option3: null,
    available: wooProduct.is_in_stock !== false,
    grams: 1000, // Default 1kg
  };

  // Get the best image
  const images = (wooProduct.images || []).map(img => ({
    src: img.src || img.thumbnail,
    alt: img.alt || name,
  }));

  // Build tags from categories and tags
  const tags = [
    ...(wooProduct.categories || []).map(c => c.name),
    ...(wooProduct.tags || []).map(t => t.name),
  ].join(', ');

  return {
    id: wooProduct.id,
    title: name,
    handle: wooProduct.slug,
    product_type: 'Filament',
    vendor: 'AzureFilm',
    tags,
    variants: [variant],
    options: [{ name: 'Color', position: 1, values: [name] }],
    images,
    body_html: (wooProduct.short_description || wooProduct.description || '').slice(0, 3000),
    published_at: new Date().toISOString(),
  };
}

// Keywords to exclude non-filament products that might slip through
const EXCLUDE_KEYWORDS = [
  'printer', 'nozzle', 'spare', 'part', 'tool', 'resin',
  'accessory', 'bed', 'sheet', 'glue', 'dryer', 'enclosure',
  'gift card', 'voucher', '3d pen',
];

async function main() {
  console.log('Fetching AzureFilm products from WooCommerce Store API...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Category ID: ${FILAMENT_CATEGORY_ID}`);
  console.log('');

  const allProducts = [];
  let page = 1;
  let totalPages = 1;

  while (page <= Math.min(MAX_PAGES, totalPages || MAX_PAGES)) {
    const url = `${BASE_URL}${API_PATH}?per_page=${PER_PAGE}&page=${page}&category=${FILAMENT_CATEGORY_ID}`;
    process.stdout.write(`[Page ${page}] Fetching... `);

    try {
      const { status, body, totalPages: tp, totalItems } = await fetchUrl(url);
      if (status !== 200) {
        console.log(`HTTP ${status}`);
        break;
      }

      if (page === 1) {
        totalPages = tp;
        console.log(`(${totalItems} total items, ${totalPages} pages)`);
      }

      const products = JSON.parse(body);
      if (!Array.isArray(products) || products.length === 0) {
        console.log('No more products');
        break;
      }

      allProducts.push(...products);
      console.log(`${products.length} products (total: ${allProducts.length})`);

      if (products.length < PER_PAGE) break;
      page++;
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (e) {
      console.log(`Error: ${e.message}`);
      break;
    }
  }

  // Filter out non-filament items and samples
  const filamentProducts = allProducts.filter(p => {
    const name = (p.name || '').toLowerCase();
    // Exclude non-filament items
    if (EXCLUDE_KEYWORDS.some(kw => name.includes(kw))) return false;
    // Exclude sample products (50g)
    if (name.includes('sample')) return false;
    return true;
  });

  console.log('');
  console.log(`Results: ${allProducts.length} total products from API`);
  console.log(`After filtering (no samples, no accessories): ${filamentProducts.length} products`);

  // Convert to Shopify-compatible format
  const shopifyProducts = filamentProducts.map(wooToShopifyFormat);

  // Show material distribution (from product names)
  const materials = {};
  for (const p of shopifyProducts) {
    // Try to detect material from title
    const title = p.title.toLowerCase();
    let mat = 'Unknown';
    if (title.includes('petg')) mat = 'PETG';
    else if (title.includes('pla')) mat = 'PLA';
    else if (title.includes('abs')) mat = 'ABS';
    else if (title.includes('asa')) mat = 'ASA';
    else if (title.includes('tpu')) mat = 'TPU';
    else if (title.includes('pc-abs')) mat = 'PC-ABS';
    else if (title.includes('pctg')) mat = 'PCTG';
    else if (title.includes('pet-cf') || title.includes('paht-cf')) mat = 'CF-Composite';
    else if (title.includes('lumberlay') || title.includes('wood')) mat = 'Wood-Fill';
    materials[mat] = (materials[mat] || 0) + 1;
  }
  console.log('\nMaterial distribution:');
  for (const [mat, count] of Object.entries(materials).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${mat}: ${count}`);
  }

  // Count in-stock vs out-of-stock
  const inStock = shopifyProducts.filter(p => p.variants[0]?.available).length;
  console.log(`\nIn stock: ${inStock}, Out of stock: ${shopifyProducts.length - inStock}`);

  // Save to scripts/ directory
  const outPath = path.join(__dirname, 'azurefilm-products.json');
  const output = {
    products: shopifyProducts,
    excluded: allProducts.length - filamentProducts.length,
    fetchedAt: new Date().toISOString(),
    source: 'woocommerce-store-api',
    currency: 'EUR',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Also copy to public/data/ for browser access
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'azurefilm-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main().catch(e => console.error('Fatal error:', e));
