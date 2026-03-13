#!/usr/bin/env node
/**
 * Pre-fetch Extrudr filament products from extrudr.com.
 *
 * Extrudr uses a Saleor/Next.js GraphQL backend. The collection page
 * embeds product data in __NEXT_DATA__. This script fetches the collection
 * page, extracts product slugs, then fetches each product page for details.
 *
 * Usage:
 *   node scripts/fetch-extrudr-products.cjs
 *
 * Output:
 *   scripts/extrudr-products.json      (raw data)
 *   public/data/extrudr-products.json   (for browser-side sync)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.extrudr.com';
const COLLECTION_URL = `${BASE_URL}/de/at/collection/filament/`;
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

// Known Extrudr filament products with their materials
// Extracted from the collection page slug list
const EXTRUDR_PRODUCTS = [
  { slug: 'biofusion', name: 'BioFusion', material: 'PLA' },
  { slug: 'durapro-abs', name: 'DuraPro ABS', material: 'ABS' },
  { slug: 'durapro-abs-cf', name: 'DuraPro ABS CF', material: 'ABS-CF' },
  { slug: 'durapro-asa', name: 'DuraPro ASA', material: 'ASA' },
  { slug: 'durapro-asa-cf', name: 'DuraPro ASA CF', material: 'ASA-CF' },
  { slug: 'durapro-asa-gf', name: 'DuraPro ASA GF', material: 'ASA-GF' },
  { slug: 'durapro-pa12', name: 'DuraPro PA12', material: 'PA' },
  { slug: 'durapro-pa12-cf', name: 'DuraPro PA12 CF', material: 'PA-CF' },
  { slug: 'durapro-pc-fr-v0', name: 'DuraPro PC FR V0', material: 'PC' },
  { slug: 'durapro-pc-pbt', name: 'DuraPro PC/PBT', material: 'PC' },
  { slug: 'durapro-pc-pbt-cf', name: 'DuraPro PC/PBT CF', material: 'PC-CF' },
  { slug: 'flax', name: 'FLAX', material: 'PLA' },
  { slug: 'flex-hard', name: 'FLEX Hard', material: 'TPU' },
  { slug: 'flex-hard-cf', name: 'FLEX Hard CF', material: 'TPU-CF' },
  { slug: 'flex-medium', name: 'FLEX Medium', material: 'TPU' },
  { slug: 'flex-medium-esd', name: 'FLEX Medium ESD', material: 'TPU' },
  { slug: 'flex-medium-matt', name: 'FLEX Medium MATT', material: 'TPU' },
  { slug: 'flex-semisoft', name: 'FLEX Semisoft', material: 'TPU' },
  { slug: 'greentec', name: 'GreenTEC', material: 'PLA' },
  { slug: 'greentec-pro', name: 'GreenTEC Pro', material: 'PLA' },
  { slug: 'greentec-pro-cf', name: 'GreenTEC Pro CF', material: 'PLA-CF' },
  { slug: 'pctg', name: 'PCTG', material: 'PCTG' },
  { slug: 'pearl', name: 'PEARL', material: 'PLA' },
  { slug: 'petg', name: 'PETG', material: 'PETG' },
  { slug: 'pla-basic', name: 'PLA Basic', material: 'PLA' },
  { slug: 'pla-basic-cf', name: 'PLA Basic CF', material: 'PLA-CF' },
  { slug: 'pla-basic-cmyk', name: 'PLA Basic CMYK', material: 'PLA' },
  { slug: 'pla-hs', name: 'PLA HS', material: 'PLA' },
  { slug: 'pla-nx2-matt', name: 'PLA NX2 MATT', material: 'Matte PLA' },
  { slug: 'wood', name: 'WOOD', material: 'Wood PLA' },
  { slug: 'xpetg-cf', name: 'XPETG CF', material: 'PETG-CF' },
  { slug: 'xpetg-matt', name: 'XPETG MATT', material: 'Matte PETG' },
];

// Extrudr colors with hex codes (from the collection page data)
const COLOR_MAP = {
  'black': '#000000',
  'blue': '#0066FF',
  'brown': '#714B30',
  'green': '#3ABE2F',
  'grey/silver': '#B5B4B4',
  'nature/beige': '#E4D4C1',
  'orange': '#F38B2B',
  'pink': '#F206BE',
  'purple': '#8B4FBF',
  'red': '#E83030',
  'white': '#FFFFFF',
  'yellow/gold': '#F5D718',
};

// Standard Extrudr colors available for most products
const STANDARD_COLORS = ['black', 'white', 'grey/silver', 'nature/beige', 'red', 'blue', 'green', 'yellow/gold', 'orange'];

/**
 * Try to fetch product page for variant/color data.
 */
async function fetchProductColors(slug) {
  try {
    const url = `${BASE_URL}/de/at/product/${slug}`;
    const { status, body } = await fetchUrl(url);
    if (status !== 200) return null;

    // Extract __NEXT_DATA__ for product details
    const nextDataMatch = body.match(/__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!nextDataMatch) return null;

    try {
      const json = JSON.parse(nextDataMatch[1]);
      const pp = json.props?.pageProps;
      if (pp?.product) {
        const product = pp.product;
        return {
          name: product.name,
          slug: product.slug,
          variants: product.variants || [],
          description: product.description || '',
        };
      }
    } catch { /* skip parse errors */ }
  } catch { /* skip fetch errors */ }
  return null;
}

async function main() {
  console.log('Building Extrudr product catalog...');
  console.log(`Known products: ${EXTRUDR_PRODUCTS.length}`);
  console.log('');

  const products = [];

  for (let i = 0; i < EXTRUDR_PRODUCTS.length; i++) {
    const p = EXTRUDR_PRODUCTS[i];
    process.stdout.write(`[${i + 1}/${EXTRUDR_PRODUCTS.length}] ${p.name}... `);

    // Try to fetch the product page for details
    const details = await fetchProductColors(p.slug);

    if (details && details.variants && details.variants.length > 0) {
      // Use real variant data
      const variants = details.variants.map((v, vi) => {
        const colorName = v.name || `Variant ${vi + 1}`;
        return {
          id: (i * 100) + vi + 1,
          title: colorName,
          price: v.pricing?.price?.gross?.amount ? String(v.pricing.price.gross.amount) : null,
          compare_at_price: null,
          sku: v.sku || `EXT-${p.slug}-${vi}`,
          option1: colorName,
          option2: null,
          option3: null,
          available: v.quantityAvailable > 0,
          grams: 1100, // Extrudr typically 1.1kg spools
        };
      });

      products.push({
        id: (i + 1) * 100,
        title: `Extrudr ${p.name}`,
        handle: p.slug,
        product_type: p.material,
        vendor: 'Extrudr',
        tags: p.material,
        variants,
        options: [{ name: 'Color', position: 1, values: variants.map(v => v.option1) }],
        images: [],
        body_html: details.description || '',
        published_at: new Date().toISOString(),
      });
      console.log(`${variants.length} variants (from page)`);
    } else {
      // Fallback: create product with default variant
      const variant = {
        id: (i * 100) + 1,
        title: 'Default',
        price: null,
        compare_at_price: null,
        sku: `EXT-${p.slug}`,
        option1: 'Default',
        option2: null,
        option3: null,
        available: true,
        grams: 1100,
      };

      products.push({
        id: (i + 1) * 100,
        title: `Extrudr ${p.name}`,
        handle: p.slug,
        product_type: p.material,
        vendor: 'Extrudr',
        tags: p.material,
        variants: [variant],
        options: [{ name: 'Color', position: 1, values: ['Default'] }],
        images: [],
        body_html: '',
        published_at: new Date().toISOString(),
      });
      console.log('fallback (no page data)');
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log('');
  console.log(`Results: ${products.length} products`);

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
  const outPath = path.join(__dirname, 'extrudr-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'extrudr-saleor-scrape',
    currency: 'EUR',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'extrudr-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main().catch(e => console.error('Fatal error:', e));
