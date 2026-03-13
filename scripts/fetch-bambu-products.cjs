#!/usr/bin/env node
/**
 * Pre-fetch Bambu Lab products via JSON-LD from product pages.
 *
 * 1. Fetches sitemap_products_1.xml to discover product handles
 * 2. Filters to filament products only
 * 3. Fetches each product page and parses JSON-LD
 * 4. Converts to Shopify-compatible product format
 * 5. Saves to scripts/bambu-products.json for browser-side sync to load
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://ca.store.bambulab.com';
const DELAY_MS = 500;

// Known filament product handles from Bambu Lab sitemap
// These are curated to exclude printers, accessories, parts
const FILAMENT_HANDLES = [
  'pla-basic-filament',
  'pla-matte',
  'pla-silk-upgrade',    // PLA Silk+
  'pla-tough-upgrade',   // PLA Tough+
  'pla-cf',
  'pla-aero',
  'pla-metal',
  'pla-sparkle',
  'pla-galaxy',
  'pla-glow',
  'pla-marble',
  'pla-gradient-rainbow',
  'pla-translucent',
  'pla-impact',
  'abs-filament',
  'abs-gf',
  'asa-filament',
  'asa-aero',
  'petg-hf',
  'petg-cf',
  'petg-translucent',
  'tpu-95a',
  'tpu-for-ams',
  'pc-filament',
  'pa6-cf',
  'paht-cf',
  'ppa-cf',
  'pa6-gf',
  'pet-cf',
  'pps-cf',
  'support-for-pa-pet',
  'support-for-pla',
  'pva-filament',
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FilaScope/1.0)' },
      timeout: 15000,
    }, (res) => {
      // Follow redirects
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

function parseJsonLd(html) {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'ProductGroup') {
        return data;
      }
    } catch (e) { /* skip invalid JSON-LD blocks */ }
  }
  return null;
}

function jsonLdToShopifyProduct(jsonLd, handle) {
  // Convert JSON-LD ProductGroup to Shopify-like product format
  // so it can be processed by the existing extraction pipeline
  const variants = (jsonLd.hasVariant || []).map((v, idx) => {
    const offers = v.offers || {};
    const name = v.name || '';

    // Parse variant name: "PLA Basic - Jade White (10100) / Refill / 1kg"
    const parts = name.split(' / ');
    const colorPart = parts[0] || ''; // "PLA Basic - Jade White (10100)"
    const spoolType = parts[1] || ''; // "Refill" or "Filament with spool"
    const weight = parts[2] || '';     // "1kg"

    // Extract color name and code
    const colorMatch = colorPart.match(/- (.+?)(?:\s*\((\d+)\))?$/);
    const colorName = colorMatch ? colorMatch[1].trim() : '';
    const colorCode = colorMatch ? colorMatch[2] || '' : '';

    return {
      id: v.sku || idx,
      title: `${colorName}${spoolType ? ' / ' + spoolType : ''}${weight ? ' / ' + weight : ''}`,
      option1: colorName || null,
      option2: weight || '1kg',
      option3: spoolType || null,
      price: offers.price || '0',
      sku: v.sku || null,
      available: offers.availability ? offers.availability.includes('InStock') : true,
      featured_image: v.image ? { src: v.image } : null,
    };
  });

  // Extract currency from first variant
  const firstVariant = jsonLd.hasVariant?.[0];
  const currency = firstVariant?.offers?.priceCurrency || 'CAD';

  return {
    id: jsonLd.productGroupID || handle,
    title: jsonLd.name || handle,
    handle: handle,
    body_html: jsonLd.description || '',
    product_type: 'Filament',
    vendor: 'Bambu Lab',
    tags: 'filament',
    variants: variants,
    images: variants
      .filter(v => v.featured_image)
      .map(v => ({ src: v.featured_image.src }))
      .filter((img, i, arr) => arr.findIndex(x => x.src === img.src) === i), // dedupe
    options: [
      { name: 'Color', position: 1 },
      { name: 'Weight', position: 2 },
      { name: 'Spool Type', position: 3 },
    ],
    _currency: currency,
    _source: 'jsonld',
  };
}

async function main() {
  console.log(`Fetching ${FILAMENT_HANDLES.length} Bambu Lab filament products...`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  const products = [];
  const failed = [];

  for (let i = 0; i < FILAMENT_HANDLES.length; i++) {
    const handle = FILAMENT_HANDLES[i];
    const url = `${BASE_URL}/products/${handle}`;
    process.stdout.write(`[${i + 1}/${FILAMENT_HANDLES.length}] ${handle}... `);

    try {
      const { status, body } = await fetchUrl(url);
      if (status !== 200) {
        console.log(`HTTP ${status}`);
        failed.push({ handle, error: `HTTP ${status}` });
        continue;
      }

      const jsonLd = parseJsonLd(body);
      if (!jsonLd) {
        console.log('No JSON-LD ProductGroup found');
        failed.push({ handle, error: 'No JSON-LD' });
        continue;
      }

      const product = jsonLdToShopifyProduct(jsonLd, handle);
      products.push(product);
      console.log(`OK - ${product.title} (${product.variants.length} variants, ${product._currency})`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
      failed.push({ handle, error: e.message });
    }

    // Rate limit
    if (i < FILAMENT_HANDLES.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log('');
  console.log(`Results: ${products.length} products fetched, ${failed.length} failed`);
  if (failed.length > 0) {
    console.log('Failed:', failed.map(f => f.handle).join(', '));
  }

  // Count total variants
  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  console.log(`Total variants: ${totalVariants}`);

  // Save to file
  const outPath = path.join(__dirname, 'bambu-products.json');
  fs.writeFileSync(outPath, JSON.stringify({ products, failed, fetchedAt: new Date().toISOString() }, null, 2));
  console.log(`\nSaved to: ${outPath}`);
}

main().catch(e => console.error('Fatal error:', e));
