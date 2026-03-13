#!/usr/bin/env node
/**
 * Pre-fetch Creality filament products from store.creality.com.
 *
 * Creality uses a custom Next.js frontend with no public product API.
 * This script fetches the product sitemap, identifies filament products,
 * fetches each product page, extracts JSON-LD structured data, and
 * converts to Shopify-compatible format for the browser sync pipeline.
 *
 * Usage:
 *   node scripts/fetch-creality-products.cjs
 *
 * Output:
 *   scripts/creality-products.json        (raw data)
 *   public/data/creality-products.json     (for browser-side sync)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://store.creality.com';
const SITEMAP_URL = `${BASE_URL}/sitemap_products.xml`;
const DELAY_MS = 500;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
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

// Non-filament product handles to exclude
const EXCLUDE_HANDLES = [
  'filament-dryer', 'filament-detector', 'filament-storage',
  'filament-system', 'space-pi', 'cfs-creality',
  'pei-build-plate', 'nozzle', 'enclosure',
];

// Filament-related keywords in handles
const FILAMENT_HANDLE_KEYWORDS = [
  'pla', 'petg', 'abs', 'tpu', 'asa', 'pc-filament',
  'wood', 'silk', 'rainbow', 'filament',
];

/**
 * Parse product handles from the sitemap XML.
 */
function parseSitemap(xml) {
  const handles = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1];
    if (url.includes('/products/')) {
      const handle = url.split('/products/')[1].replace(/\/$/, '').split('?')[0];
      if (handle) handles.push(handle);
    }
  }
  return handles;
}

/**
 * Filter handles to filament products only.
 */
function isFilamentHandle(handle) {
  const h = handle.toLowerCase();
  // Exclude known non-filament items
  if (EXCLUDE_HANDLES.some(ex => h.includes(ex))) return false;
  // Must match filament keywords
  return FILAMENT_HANDLE_KEYWORDS.some(kw => h.includes(kw));
}

/**
 * Extract JSON-LD Product data from a page.
 */
function extractJsonLd(html) {
  const blocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (!blocks) return null;

  for (const block of blocks) {
    const content = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    try {
      const data = JSON.parse(content);
      // Could be an array
      if (Array.isArray(data)) {
        const product = data.find(d => d['@type'] === 'Product');
        if (product) return product;
      }
      if (data['@type'] === 'Product') return data;
    } catch { /* skip parse errors */ }
  }
  return null;
}

/**
 * Parse material type from a Creality product name/handle.
 */
function parseMaterial(name) {
  const lower = name.toLowerCase();
  if (lower.includes('hyper pla') || lower.includes('hp-pla') || lower.includes('hyper series pla')) return 'HSPLA';
  if (lower.includes('cr-silk') || lower.includes('silk pla')) return 'Silk PLA';
  if (lower.includes('cr-wood') || lower.includes('wood')) return 'Wood PLA';
  if (lower.includes('hyper rainbow')) return 'PLA';
  if (lower.includes('hyper pc')) return 'PC';
  if (lower.includes('hp-asa') || lower.includes('hyper asa') || lower.includes('hp asa')) return 'ASA';
  if (lower.includes('hp-abs') || lower.includes('hyper abs')) return 'ABS';
  if (lower.includes('hp-tpu') || lower.includes('hyper tpu') || lower.includes('hp tpu')) return 'TPU';
  if (lower.includes('hp-petg') || lower.includes('hyper petg')) return 'PETG';
  if (lower.includes('ender') && lower.includes('pla')) return 'PLA';
  if (lower.includes('pla')) return 'PLA';
  if (lower.includes('petg')) return 'PETG';
  if (lower.includes('abs')) return 'ABS';
  if (lower.includes('tpu')) return 'TPU';
  if (lower.includes('asa')) return 'ASA';
  return 'PLA';
}

/**
 * Parse color names from JSON-LD offers or product title.
 * Creality titles often list colors: "Hyper PLA 1kg White / Black / Orange / Green"
 */
function parseColors(product, offers) {
  const title = product.name || '';

  // Try to extract from title: "Color1 / Color2 / Color3"
  const slashMatch = title.match(/(?:1kg|1KG|10KG|10kg|spool)\s+([\w\s]+(?:\s*\/\s*[\w\s]+){2,})/);
  if (slashMatch) {
    return slashMatch[1].split('/').map(c => c.trim()).filter(c => c.length > 0);
  }

  // If offers count matches a reasonable number, generate colors from count
  if (offers && offers.length > 0 && offers.length <= 30) {
    // Return null to indicate we should use SKU-based variants
    return null;
  }

  return null;
}

/**
 * Convert a Creality product to Shopify-compatible format.
 */
function toShopifyFormat(handle, jsonLd) {
  const name = jsonLd.name || handle;
  const material = parseMaterial(name);
  const offers = jsonLd.offers || [];
  const colors = parseColors(jsonLd, offers);
  const image = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;

  const variants = [];
  if (colors && colors.length > 0) {
    // Create one variant per color
    for (let i = 0; i < colors.length; i++) {
      const offer = offers[i] || offers[0] || {};
      variants.push({
        id: parseInt(offer.sku || `${handle.hashCode || i}`),
        title: colors[i],
        price: offer.price ? String(offer.price) : null,
        compare_at_price: null,
        sku: offer.sku || '',
        option1: colors[i],
        option2: null,
        option3: null,
        available: offer.availability?.includes('InStock') !== false,
        grams: 1000,
      });
    }
  } else if (offers.length > 0) {
    // Use offers directly — one variant per offer (color unknown, use SKU)
    for (const offer of offers) {
      const varTitle = `Variant ${offer.sku || ''}`.trim();
      variants.push({
        id: parseInt(offer.sku) || Math.floor(Math.random() * 100000),
        title: varTitle,
        price: offer.price ? String(offer.price) : null,
        compare_at_price: null,
        sku: offer.sku || '',
        option1: varTitle,
        option2: null,
        option3: null,
        available: offer.availability?.includes('InStock') !== false,
        grams: 1000,
      });
    }
  } else {
    // No offers — create a single default variant
    variants.push({
      id: Math.floor(Math.random() * 100000),
      title: 'Default',
      price: null,
      sku: '',
      option1: 'Default',
      option2: null,
      option3: null,
      available: true,
      grams: 1000,
    });
  }

  const images = image ? [{ src: image, alt: name }] : [];
  const colorValues = variants.map(v => v.option1);

  return {
    id: parseInt(offers[0]?.sku) || handle.length * 1000,
    title: name,
    handle,
    product_type: material,
    vendor: 'Creality',
    tags: material,
    variants,
    options: [{ name: 'Color', position: 1, values: colorValues }],
    images,
    body_html: jsonLd.description || '',
    published_at: new Date().toISOString(),
  };
}

async function main() {
  console.log('Fetching Creality filament products from store.creality.com...');
  console.log(`Sitemap URL: ${SITEMAP_URL}`);
  console.log('');

  // Step 1: Fetch sitemap
  process.stdout.write('Fetching sitemap... ');
  const { status, body: sitemapXml } = await fetchUrl(SITEMAP_URL);
  if (status !== 200) {
    console.log(`HTTP ${status}`);
    return;
  }

  const allHandles = parseSitemap(sitemapXml);
  console.log(`${allHandles.length} product URLs found`);

  // Step 2: Filter to filament handles
  const filamentHandles = allHandles.filter(isFilamentHandle);
  console.log(`Filament handles: ${filamentHandles.length}`);
  filamentHandles.forEach(h => console.log(`  ${h}`));
  console.log('');

  // Step 3: Fetch each product page and extract JSON-LD
  const products = [];
  for (const handle of filamentHandles) {
    const url = `${BASE_URL}/products/${handle}`;
    process.stdout.write(`[${products.length + 1}/${filamentHandles.length}] ${handle}... `);

    try {
      const { status: pStatus, body: pBody } = await fetchUrl(url);
      if (pStatus !== 200) {
        console.log(`HTTP ${pStatus}`);
        continue;
      }

      const jsonLd = extractJsonLd(pBody);
      if (!jsonLd) {
        console.log('No JSON-LD found');
        continue;
      }

      const shopifyProduct = toShopifyFormat(handle, jsonLd);
      products.push(shopifyProduct);
      console.log(`OK (${shopifyProduct.variants.length} variants, $${shopifyProduct.variants[0]?.price})`);

      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  console.log('');
  console.log(`Results: ${filamentHandles.length} filament URLs, ${products.length} products extracted`);

  // Total variants
  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  console.log(`Total variants: ${totalVariants}`);

  // Material distribution
  const materials = {};
  for (const p of products) {
    materials[p.product_type] = (materials[p.product_type] || 0) + 1;
  }
  console.log('\nMaterial distribution:');
  for (const [mat, count] of Object.entries(materials).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${mat}: ${count}`);
  }

  // Save
  const outPath = path.join(__dirname, 'creality-products.json');
  const output = {
    products,
    excluded: filamentHandles.length - products.length,
    fetchedAt: new Date().toISOString(),
    source: 'store-creality-jsonld-scrape',
    currency: 'USD',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'creality-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main().catch(e => console.error('Fatal error:', e));
