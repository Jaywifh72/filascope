#!/usr/bin/env node
/**
 * Pre-fetch ColorFabb products by scraping their Magento category pages.
 *
 * ColorFabb is a Magento store with no CORS and no public API.
 * This script scrapes the /filaments category listing pages,
 * extracts product data from HTML, and converts to Shopify-compatible
 * format for the browser sync pipeline.
 *
 * Usage:
 *   node scripts/fetch-colorfabb-products.cjs
 *
 * Output:
 *   scripts/colorfabb-products.json      (raw data)
 *   public/data/colorfabb-products.json   (for browser-side sync)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://colorfabb.com';
const CATEGORY_PATH = '/filaments';
const MAX_PAGES = 50;
const DELAY_MS = 800;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
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
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

/**
 * Parse product items from a Magento category page HTML.
 */
function parseProductsFromHtml(html) {
  const products = [];

  // Match product items: <li class="item product product-item">...</li>
  const itemRegex = /<li[^>]*class="[^"]*product-item[^"]*"[\s\S]*?<\/li>/gi;
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const item = match[0];

    // Extract URL
    const urlMatch = item.match(/href="(https:\/\/colorfabb\.com\/[a-z0-9][a-z0-9-]*[a-z0-9])"/);
    if (!urlMatch) continue;
    const url = urlMatch[1];

    // Skip category/material links
    if (url.includes('/filaments/') || url.includes('/materials/')) continue;

    // Extract title from product-item-link
    const titleMatch = item.match(/class="product-item-link"[^>]*>\s*([^<]+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) continue;

    // Extract price (data-price-amount attribute)
    const priceMatch = item.match(/data-price-amount="([^"]+)"/);
    const price = priceMatch ? parseFloat(priceMatch[1]).toFixed(2) : null;

    // Extract image
    const imgMatch = item.match(/src="(https:\/\/colorfabb\.com\/media\/catalog\/[^"]+)"/);
    const image = imgMatch ? imgMatch[1].split('?')[0] : null;

    // Extract product ID
    const idMatch = item.match(/data-product-id="([^"]+)"/);
    const productId = idMatch ? parseInt(idMatch[1]) : Math.floor(Math.random() * 100000);

    // Derive handle from URL
    const handle = url.split('/').pop();

    products.push({ url, title, price, image, productId, handle });
  }

  return products;
}

/**
 * Parse material type from a ColorFabb product title.
 * Titles follow pattern: "MATERIAL COLOR" e.g., "PLA ECONOMY BLACK", "NGEN WHITE"
 */
function parseMaterial(title) {
  const materials = [
    'VARIOSHORE TPU', 'LW-PLA', 'LW-ASA', 'LW-ABS', 'LW PLA', 'LW ASA', 'LW ABS',
    'STEELFILL', 'BRONZEFILL', 'COPPERFILL', 'BRASSFILL', 'WOODFILL',
    'BAMBOOFILL', 'CORKFILL', 'GLOWFILL', 'CARBON',
    'PLA TOUGH', 'PLA ECONOMY', 'PLA SEMI-MATTE', 'PLA SEMI MATTE',
    'PLA/PHA', 'PLA', 'RPLA SEMI-MATTE', 'RPLA',
    'NGEN HT', 'NGEN LUX', 'NGEN FLEX', 'NGEN',
    'HT FILAMENT', 'XT-CF20', 'XT CF20', 'XT-COPOLYESTER', 'XT',
    'RPETG', 'PETG ECONOMY', 'PETG',
    'ASA', 'ABS', 'TPU',
    'PA', 'PC', 'PP',
  ];

  const upper = title.toUpperCase();
  for (const mat of materials) {
    if (upper.startsWith(mat + ' ') || upper.startsWith(mat + '-')) {
      return mat;
    }
  }
  // Fallback: try to find material in title
  for (const mat of materials) {
    if (upper.includes(mat)) return mat;
  }
  return 'PLA';
}

/**
 * Extract color name from title by removing the material prefix.
 */
function parseColor(title, material) {
  let color = title;
  // Remove material prefix (case insensitive)
  const matUpper = material.toUpperCase();
  const titleUpper = title.toUpperCase();
  if (titleUpper.startsWith(matUpper)) {
    color = title.substring(material.length).trim();
  }
  // Clean up dashes/spaces
  color = color.replace(/^[-–—\s]+/, '').trim();
  // Title case
  if (color.length > 0) {
    color = color.split(' ').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');
  }
  return color || 'Default';
}

/**
 * Normalize material name for the sync pipeline.
 */
function normalizeMaterial(raw) {
  const map = {
    'PLA ECONOMY': 'PLA', 'PLA TOUGH': 'Tough PLA', 'PLA SEMI-MATTE': 'Matte PLA',
    'PLA SEMI MATTE': 'Matte PLA', 'PLA/PHA': 'PLA', 'RPLA SEMI-MATTE': 'Matte PLA',
    'RPLA': 'PLA', 'LW-PLA': 'LW-PLA', 'LW PLA': 'LW-PLA',
    'LW-ASA': 'LW-ASA', 'LW ASA': 'LW-ASA', 'LW-ABS': 'LW-ABS', 'LW ABS': 'LW-ABS',
    'VARIOSHORE TPU': 'TPU', 'NGEN': 'nGen', 'NGEN HT': 'nGen HT',
    'NGEN LUX': 'nGen Lux', 'NGEN FLEX': 'nGen Flex',
    'HT FILAMENT': 'HT', 'XT-CF20': 'XT-CF20', 'XT CF20': 'XT-CF20',
    'XT-COPOLYESTER': 'XT', 'XT': 'XT',
    'RPETG': 'PETG', 'PETG ECONOMY': 'PETG',
    'STEELFILL': 'Steel PLA', 'BRONZEFILL': 'Bronze PLA',
    'COPPERFILL': 'Copper PLA', 'BRASSFILL': 'Brass PLA',
    'WOODFILL': 'Wood PLA', 'BAMBOOFILL': 'Bamboo PLA',
    'CORKFILL': 'Cork PLA', 'GLOWFILL': 'PLA-Glow',
    'CARBON': 'Carbon PLA',
  };
  return map[raw.toUpperCase()] || raw;
}

/**
 * Convert a scraped product to Shopify-compatible format.
 */
function toShopifyFormat(product) {
  const rawMaterial = parseMaterial(product.title);
  const material = normalizeMaterial(rawMaterial);
  const color = parseColor(product.title, rawMaterial);

  const variant = {
    id: product.productId,
    title: `${color}`,
    price: product.price,
    compare_at_price: null,
    sku: product.handle || '',
    option1: color,
    option2: null,
    option3: null,
    available: true,
    grams: 750, // ColorFabb default spool weight
  };

  const images = product.image ? [{ src: product.image, alt: product.title }] : [];

  return {
    id: product.productId,
    title: product.title,
    handle: product.handle,
    product_type: material,
    vendor: 'colorFabb',
    tags: material,
    variants: [variant],
    options: [{ name: 'Color', position: 1, values: [color] }],
    images,
    body_html: '',
    published_at: new Date().toISOString(),
  };
}

// Exclude non-filament products
const EXCLUDE_KEYWORDS = [
  'printer', 'nozzle', 'spare', 'tool', 'accessory', 'bed', 'sheet',
  'glue', 'dryer', 'enclosure', 'gift card', 'voucher', 'sample pack',
  'upgrade', 'kit', 'spool holder',
];

async function main() {
  console.log('Fetching ColorFabb products from Magento category pages...');
  console.log(`Base URL: ${BASE_URL}${CATEGORY_PATH}`);
  console.log('');

  const allProducts = [];
  let page = 1;
  let emptyPages = 0;

  while (page <= MAX_PAGES && emptyPages < 2) {
    const url = page === 1
      ? `${BASE_URL}${CATEGORY_PATH}`
      : `${BASE_URL}${CATEGORY_PATH}?p=${page}`;
    process.stdout.write(`[Page ${page}] Fetching... `);

    try {
      const { status, body } = await fetchUrl(url);
      if (status !== 200) {
        console.log(`HTTP ${status}`);
        break;
      }

      const products = parseProductsFromHtml(body);
      if (products.length === 0) {
        console.log('No products found');
        emptyPages++;
        page++;
        continue;
      }

      emptyPages = 0;
      allProducts.push(...products);
      console.log(`${products.length} products (total: ${allProducts.length})`);

      page++;
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (e) {
      console.log(`Error: ${e.message}`);
      break;
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  const unique = allProducts.filter(p => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  // Filter out non-filament items
  const filamentProducts = unique.filter(p => {
    const title = p.title.toLowerCase();
    if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) return false;
    return true;
  });

  console.log('');
  console.log(`Results: ${allProducts.length} total scraped, ${unique.length} unique`);
  console.log(`After filtering: ${filamentProducts.length} filament products`);

  // Convert to Shopify-compatible format
  const shopifyProducts = filamentProducts.map(toShopifyFormat);

  // Show material distribution
  const materials = {};
  for (const p of shopifyProducts) {
    const mat = p.product_type;
    materials[mat] = (materials[mat] || 0) + 1;
  }
  console.log('\nMaterial distribution:');
  for (const [mat, count] of Object.entries(materials).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${mat}: ${count}`);
  }

  // Show price stats
  const prices = shopifyProducts.map(p => parseFloat(p.variants[0]?.price)).filter(p => !isNaN(p));
  console.log(`\nPrice range: €${Math.min(...prices).toFixed(2)} - €${Math.max(...prices).toFixed(2)}`);

  // Save
  const outPath = path.join(__dirname, 'colorfabb-products.json');
  const output = {
    products: shopifyProducts,
    excluded: unique.length - filamentProducts.length,
    fetchedAt: new Date().toISOString(),
    source: 'magento-category-scrape',
    currency: 'EUR',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'colorfabb-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main().catch(e => console.error('Fatal error:', e));
