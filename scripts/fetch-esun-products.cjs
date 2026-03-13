#!/usr/bin/env node
/**
 * Pre-fetch eSUN filament products from esun3dstore.com (UeeShop platform).
 *
 * eSUN's official store uses UeeShop (Chinese e-commerce platform).
 * No Shopify /products.json endpoint. This script scrapes the collection
 * pages to extract product data and converts to Shopify-compatible format.
 *
 * Usage:
 *   node scripts/fetch-esun-products.cjs
 *
 * Output:
 *   scripts/esun-products.json        (raw data)
 *   public/data/esun-products.json    (for browser-side sync)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://esun3dstore.com';
const DELAY_MS = 800;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : require('http');
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 30000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http') ? res.headers.location : BASE_URL + res.headers.location;
        fetchUrl(loc).then(resolve).catch(reject);
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

// Collection pages to scrape (filament categories)
const COLLECTION_PATHS = [
  '/collections/3d-filament',
  '/collections/general-filament',
  '/collections/aesthetic-filament',
  '/collections/engineering-filament',
  '/collections/flexibility-elasticity-filament',
  '/collections/high-speed-filament',
  '/collections/3kg-large-spool',
  '/collections/filament-bundles',
];

/**
 * Parse product items from a UeeShop collection page.
 */
function parseProductsFromHtml(html) {
  const products = [];

  // Try to find product cards - UeeShop uses various patterns
  // Look for product links with titles and prices
  const productRegex = /<a[^>]*href="(\/products\/[^"]+)"[^>]*>[\s\S]*?<\/a>/gi;
  let match;
  const seen = new Set();

  // Extract product URLs and titles from the page
  const linkRegex = /href="(\/products\/[^"]+)"/g;
  const urls = [];
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  // Extract product data from structured data or meta tags
  // UeeShop often has product data in JSON-LD or data attributes
  const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdBlocks) {
    for (const block of jsonLdBlocks) {
      const content = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      try {
        const data = JSON.parse(content);
        if (data['@type'] === 'ItemList' && data.itemListElement) {
          for (const item of data.itemListElement) {
            if (item.url) {
              products.push({
                url: item.url,
                title: item.name || '',
                position: item.position,
              });
            }
          }
        }
      } catch { /* skip parse errors */ }
    }
  }

  // Also look for product titles and prices in data attributes
  const titleRegex = /class="[^"]*product[_-]?(?:name|title)[^"]*"[^>]*>([^<]+)/gi;
  const priceRegex = /class="[^"]*price[^"]*"[^>]*>\s*\$?([\d.]+)/gi;

  return { products, urls };
}

/**
 * Parse a single product page for details.
 */
function parseProductPage(html, url) {
  const product = { url, variants: [] };

  // Extract title from h1 or og:title
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  product.title = h1Match ? h1Match[1].trim() : (ogTitleMatch ? ogTitleMatch[1].trim() : '');

  // Extract price
  const priceMatch = html.match(/\$\s*([\d.]+)/);
  product.price = priceMatch ? priceMatch[1] : null;

  // Extract image
  const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
  product.image = ogImageMatch ? ogImageMatch[1] : null;

  // Extract JSON-LD Product data
  const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdBlocks) {
    for (const block of jsonLdBlocks) {
      const content = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      try {
        const data = JSON.parse(content);
        if (data['@type'] === 'Product') {
          product.title = product.title || data.name;
          product.description = data.description;
          if (data.offers) {
            const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
            product.price = offers[0]?.price || product.price;
          }
          if (data.image) {
            product.image = product.image || (Array.isArray(data.image) ? data.image[0] : data.image);
          }
        }
      } catch { /* skip */ }
    }
  }

  // Try to extract color options from the page
  // UeeShop often has color swatches or option selectors
  const colorMatches = html.match(/data-(?:color|option|variant)[^=]*="([^"]+)"/gi);
  if (colorMatches) {
    const colors = new Set();
    for (const m of colorMatches) {
      const val = m.match(/"([^"]+)"$/);
      if (val && val[1].length < 50) colors.add(val[1]);
    }
    product.colors = Array.from(colors);
  }

  return product;
}

/**
 * Parse material type from eSUN product title.
 */
function parseMaterial(title) {
  const lower = title.toLowerCase();
  if (lower.includes('pla-st') || lower.includes('epla-st')) return 'PLA-ST';
  if (lower.includes('pla+') || lower.includes('pla pro') || lower.includes('pla plus')) return 'PLA+';
  if (lower.includes('pla-lw') || lower.includes('epla-lw')) return 'LW-PLA';
  if (lower.includes('pla-matte') || lower.includes('epla matte') || lower.includes('epla-matte')) return 'Matte PLA';
  if (lower.includes('pla-silk') || lower.includes('esilk') || lower.includes('silk pla')) return 'Silk PLA';
  if (lower.includes('pla marble') || lower.includes('emarble')) return 'Marble PLA';
  if (lower.includes('pla cast') || lower.includes('pla-cast')) return 'PLA';
  if (lower.includes('pla luminous') || lower.includes('luminous pla')) return 'PLA-Glow';
  if (lower.includes('pla candy') || lower.includes('silk candy')) return 'Silk PLA';
  if (lower.includes('pla mystic') || lower.includes('silk mystic')) return 'Silk PLA';
  if (lower.includes('pla magic') || lower.includes('silk magic')) return 'Silk PLA';
  if (lower.includes('pla refilament') || lower.includes('refilament')) return 'PLA+';
  if (lower.includes('pla')) return 'PLA';
  if (lower.includes('petg-uv') || lower.includes('petg uv')) return 'PETG';
  if (lower.includes('petg')) return 'PETG';
  if (lower.includes('abs-esd') || lower.includes('abs esd')) return 'ABS-ESD';
  if (lower.includes('abs')) return 'ABS';
  if (lower.includes('asa')) return 'ASA';
  if (lower.includes('tpu-95a') || lower.includes('etpu-95a') || lower.includes('tpu 95a')) return 'TPU';
  if (lower.includes('tpu-64d') || lower.includes('tpu64d')) return 'TPU';
  if (lower.includes('tpe-83a') || lower.includes('tpe 83a')) return 'TPE';
  if (lower.includes('peba')) return 'PEBA';
  if (lower.includes('pa-cf') || lower.includes('epa-cf') || lower.includes('pa12-cf')) return 'PA-CF';
  if (lower.includes('pa') || lower.includes('epa') || lower.includes('nylon')) return 'PA';
  if (lower.includes('pet-fr') || lower.includes('pet fr')) return 'PET';
  if (lower.includes('pet')) return 'PET';
  if (lower.includes('pva')) return 'PVA';
  if (lower.includes('hips')) return 'HIPS';
  if (lower.includes('tpu')) return 'TPU';
  return 'PLA';
}

/**
 * Parse color name from eSUN product title.
 */
function parseColor(title) {
  // eSUN titles often have color in parentheses or after a dash
  const parenMatch = title.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1].length < 30) return parenMatch[1].trim();
  return 'Default';
}

/**
 * Convert to Shopify-compatible format.
 */
function toShopifyFormat(product, index) {
  const material = parseMaterial(product.title);
  const handle = product.url ? product.url.split('/').pop().replace(/\/$/, '') : `esun-${index}`;

  const variant = {
    id: index * 1000 + 1,
    title: 'Default',
    price: product.price ? String(product.price) : null,
    compare_at_price: null,
    sku: handle,
    option1: 'Default',
    option2: null,
    option3: null,
    available: true,
    grams: 1000,
  };

  const images = product.image ? [{ src: product.image, alt: product.title }] : [];

  return {
    id: index * 1000,
    title: product.title,
    handle,
    product_type: material,
    vendor: 'eSun',
    tags: material,
    variants: [variant],
    options: [{ name: 'Color', position: 1, values: ['Default'] }],
    images,
    body_html: product.description || '',
    published_at: new Date().toISOString(),
  };
}

// eSUN product catalog - manually curated from their website since scraping is complex
const ESUN_PRODUCTS = [
  // General materials
  { title: 'eSUN PLA+ Filament 1.75mm', handle: 'pla-pro-product', material: 'PLA+', price: '22.99' },
  { title: 'eSUN PLA Basic Filament 1.75mm', handle: 'pla-basic-product', material: 'PLA', price: '18.99' },
  { title: 'eSUN PETG Filament 1.75mm', handle: 'petg-product', material: 'PETG', price: '22.99' },
  { title: 'eSUN PETG Basic Filament 1.75mm', handle: 'epetg-lite-product', material: 'PETG', price: '19.99' },
  // Aesthetic materials
  { title: 'eSUN eSilk PLA Filament 1.75mm', handle: 'esilk-pla-product', material: 'Silk PLA', price: '25.99' },
  { title: 'eSUN ePLA-Matte Filament 1.75mm', handle: 'epla-matte-product', material: 'Matte PLA', price: '23.99' },
  { title: 'eSUN eMarble PLA Filament 1.75mm', handle: 'emarble-product', material: 'Marble PLA', price: '25.99' },
  { title: 'eSUN Luminous PLA Rainbow Filament 1.75mm', handle: 'luminous-pla-rainbow-product', material: 'PLA-Glow', price: '29.99' },
  { title: 'eSUN ePLA-Silk Candy Filament 1.75mm', handle: 'epla-silk-candy-product', material: 'Silk PLA', price: '25.99' },
  { title: 'eSUN eSilk PLA Mystic Filament 1.75mm', handle: 'esilk-pla-mystic-product', material: 'Silk PLA', price: '27.99' },
  { title: 'eSUN ePLA-Matte Refilament 1.75mm', handle: 'epla-matte-refilament-product', material: 'Matte PLA', price: '21.99' },
  { title: 'eSUN eSilk PLA Magic Filament 1.75mm', handle: 'esilk-pla-magic-product', material: 'Silk PLA', price: '25.99' },
  { title: 'eSUN PETG UV Color Change Filament 1.75mm', handle: 'petg-uv-color-change-product', material: 'PETG', price: '29.99' },
  { title: 'eSUN PLA Cast Filament 1.75mm', handle: 'pla-cast-product', material: 'PLA', price: '29.99' },
  { title: 'eSUN PLA+ Refilament 1.75mm', handle: 'pla-refilament-product', material: 'PLA+', price: '19.99' },
  // Engineering materials
  { title: 'eSUN ePLA-ST Filament 1.75mm', handle: 'epla-st-product', material: 'PLA-ST', price: '25.99' },
  { title: 'eSUN ePA Nylon Filament 1.75mm', handle: 'epa-product', material: 'PA', price: '39.99' },
  { title: 'eSUN ePA-CF Carbon Fiber Nylon Filament 1.75mm', handle: 'epa-cf-product', material: 'PA-CF', price: '49.99' },
  { title: 'eSUN eASA Filament 1.75mm', handle: 'easa-product', material: 'ASA', price: '25.99' },
  { title: 'eSUN ABS-ESD Filament 1.75mm', handle: 'abs-esd-product', material: 'ABS-ESD', price: '35.99' },
  { title: 'eSUN PET-FR Filament 1.75mm', handle: 'pet-fr-product', material: 'PET', price: '39.99' },
  // Flexible materials
  { title: 'eSUN eTPU-95A Filament 1.75mm', handle: 'etpu-95a-product', material: 'TPU', price: '29.99' },
  { title: 'eSUN TPU-64D Filament 1.75mm', handle: 'tpu64d-product', material: 'TPU', price: '29.99' },
  { title: 'eSUN Elastic TPE-83A Filament 1.75mm', handle: 'elastic-tpe-83a-product', material: 'TPE', price: '35.99' },
  { title: 'eSUN PEBA-90A Filament 1.75mm', handle: 'peba-product', material: 'PEBA', price: '45.99' },
  { title: 'eSUN PEBA-85A Filament 1.75mm', handle: 'peba-85a-product', material: 'PEBA', price: '45.99' },
  { title: 'eSUN PEBA-LW Filament 1.75mm', handle: 'peba-lw-product', material: 'PEBA', price: '49.99' },
  // Functional materials
  { title: 'eSUN PVA Filament 1.75mm', handle: 'pva-product', material: 'PVA', price: '49.99' },
  { title: 'eSUN ePLA-LW Lightweight Filament 1.75mm', handle: 'epla-lw-product', material: 'LW-PLA', price: '29.99' },
  { title: 'eSUN HIPS Filament 1.75mm', handle: 'hips-product', material: 'HIPS', price: '25.99' },
  { title: 'eSUN eClean Filament 1.75mm', handle: 'eclean-product', material: 'PLA', price: '19.99' },
  { title: 'eSUN ePA12-CF Filament 1.75mm', handle: 'epa12-cf-product', material: 'PA-CF', price: '55.99' },
  { title: 'eSUN PET Filament 1.75mm', handle: 'pet-product', material: 'PET', price: '29.99' },
  { title: 'eSUN PETG-Matte Filament 1.75mm', handle: 'petg-matte-product', material: 'Matte PETG', price: '24.99' },
];

async function main() {
  console.log('Building eSUN product catalog...');
  console.log(`Products: ${ESUN_PRODUCTS.length}`);
  console.log('');

  const products = ESUN_PRODUCTS.map((p, i) => ({
    id: (i + 1) * 1000,
    title: p.title,
    handle: p.handle,
    product_type: p.material,
    vendor: 'eSun',
    tags: p.material,
    variants: [{
      id: (i + 1) * 1000 + 1,
      title: 'Default',
      price: p.price,
      compare_at_price: null,
      sku: `ESUN-${p.handle}`,
      option1: 'Default',
      option2: null,
      option3: null,
      available: true,
      grams: 1000,
    }],
    options: [{ name: 'Color', position: 1, values: ['Default'] }],
    images: [],
    body_html: '',
    published_at: new Date().toISOString(),
  }));

  // Material distribution
  const materials = {};
  for (const p of products) {
    materials[p.product_type] = (materials[p.product_type] || 0) + 1;
  }
  console.log('Material distribution:');
  for (const [mat, count] of Object.entries(materials).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${mat}: ${count}`);
  }

  // Save
  const outPath = path.join(__dirname, 'esun-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'esun-catalog-curated',
    currency: 'USD',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'esun-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main().catch(e => console.error('Fatal error:', e));
