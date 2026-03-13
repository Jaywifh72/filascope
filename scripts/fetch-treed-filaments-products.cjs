#!/usr/bin/env node
/**
 * Pre-fetch TreeD Filaments products using a curated product catalog.
 *
 * TreeD Filaments is an Italian specialty filament manufacturer running
 * a custom web platform at treedfilaments.com (not Shopify). No CORS-enabled
 * product API is available, so this script uses a manually curated product
 * list based on their storefront, reseller listings, and seed data.
 *
 * Usage:
 *   node scripts/fetch-treed-filaments-products.cjs
 *
 * Output:
 *   scripts/treed-filaments-products.json      (raw data)
 *   public/data/treed-filaments-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// TreeD Filaments product catalog - curated from treedfilaments.com + resellers
// Prices in EUR, diameter 1.75mm, weights vary (1000g standard, 500g for TPU/PEEK/PPS)
const TREED_PRODUCTS = [
  // ── PLA Family ────────────────────────────────────────────
  { title: 'TreeD PLA Ecogenius 1.75mm', handle: 'pla-ecogenius', material: 'PLA', price: '29.90', weight: 1000,
    colors: [
      'Osso', 'White', 'Red Race', 'Black Hole', 'Neptune Blue',
      'Natural', 'Yellow Treed', 'Yellow Lemon', 'Violet', 'Alluminium',
      'Bronze', 'Anthracite Grey', 'Green Army', 'Aquamarine', 'Orange',
      'Red Wine', 'Brown', 'Industrial Grey', 'Apple Green', 'Oxford Green',
    ] },

  { title: 'TreeD PLA Fusion 1.75mm', handle: 'pla-fusion', material: 'PLA', price: '32.90', weight: 1000,
    colors: [
      'Industrial Grey', 'Alluminium', 'Black Hole', 'White', 'Natural',
      'Red Race', 'Neptune Blue', 'Yellow Treed', 'Yellow Lemon', 'Violet',
      'Apple Green',
    ] },

  { title: 'TreeD PLA Gonzales 1.75mm', handle: 'pla-gonzales', material: 'PLA', price: '34.90', weight: 1000,
    colors: [
      'White', 'Black Hole', 'Neptune Blue', 'Red Race', 'Yellow Treed',
      'Yellow Lemon', 'Violet', 'Alluminium', 'Bronze', 'Anthracite Grey',
      'Green Army', 'Aquamarine', 'Orange', 'Red Wine', 'Brown',
      'Industrial Grey', 'Apple Green', 'Oxford Green',
    ] },

  { title: 'TreeD PLA Levigo 1.75mm', handle: 'pla-levigo', material: 'PLA', price: '34.90', weight: 1000,
    colors: ['Natural'] },

  { title: 'TreeD PLA Shineless 1.75mm', handle: 'pla-shineless', material: 'PLA', price: '34.90', weight: 1000,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD PLA Shogun 1.75mm', handle: 'pla-shogun', material: 'PLA', price: '32.90', weight: 1000,
    colors: ['Natural'] },

  { title: 'TreeD PLA Fast Forward 1.75mm', handle: 'pla-fast-forward', material: 'PLA', price: '34.90', weight: 1000,
    colors: [
      'Black Hole', 'White', 'Red Race', 'Neptune Blue', 'Yellow Treed',
      'Yellow Lemon', 'Violet', 'Alluminium', 'Bronze', 'Anthracite Grey',
      'Green Army', 'Aquamarine', 'Orange', 'Red Wine', 'Brown',
      'Industrial Grey', 'Apple Green', 'Oxford Green',
    ] },

  { title: 'TreeD PLA XRay 1.75mm', handle: 'pla-xray', material: 'PLA', price: '34.90', weight: 1000,
    colors: ['White Marble'] },

  { title: 'TreeD PLA Kyotoflex 1.75mm', handle: 'pla-kyotoflex', material: 'PLA', price: '39.90', weight: 1000,
    colors: [
      'Chlorophyll Green', 'Yellow Treed', 'Yellow Lemon', 'Violet',
      'Alluminium', 'Bronze', 'Anthracite Grey', 'Green Army', 'Aquamarine',
      'Orange', 'Red Wine', 'Brown', 'Industrial Grey', 'Apple Green',
      'Oxford Green',
    ] },

  { title: 'TreeD PLA High Temperature 1.75mm', handle: 'pla-high-temperature', material: 'PLA', price: '39.90', weight: 1000,
    colors: ['Black Hole', 'White'] },

  // ── PETG Family ───────────────────────────────────────────
  { title: 'TreeD G-PET 1.75mm', handle: 'g-pet', material: 'PETG', price: '29.90', weight: 1000,
    colors: [
      'Ruby', 'Seetrought', 'White', 'Black Hole', 'Azul', 'Alluminium',
      'Yellow Treed', 'Yellow Lemon', 'Violet', 'Bronze', 'Anthracite Grey',
      'Green Army', 'Aquamarine', 'Orange', 'Red Wine', 'Brown',
      'Apple Green', 'Industrial Grey', 'Oxford Green',
    ] },

  { title: 'TreeD PETG Fast Forward 1.75mm', handle: 'petg-fast-forward', material: 'PETG', price: '32.90', weight: 1000,
    colors: ['Seetrought', 'Black Hole', 'White'] },

  // ── ABS Family ────────────────────────────────────────────
  { title: 'TreeD ABS T-MAT 1.75mm', handle: 'abs-t-mat', material: 'ABS', price: '29.90', weight: 1000,
    colors: ['Red Race', 'Black Hole', 'White'] },

  { title: 'TreeD ABS Performance 1.75mm', handle: 'abs-performance', material: 'ABS', price: '34.90', weight: 1000,
    colors: [
      'Natural', 'Neptune Blue', 'Black Hole', 'White', 'Red Race',
      'Industrial Grey', 'Yellow Treed', 'Yellow Lemon', 'Violet',
      'Alluminium', 'Bronze', 'Anthracite Grey', 'Green Army', 'Aquamarine',
      'Orange', 'Red Wine', 'Brown', 'Apple Green',
    ] },

  { title: 'TreeD ABS Zx 1.75mm', handle: 'abs-zx', material: 'ABS', price: '34.90', weight: 1000,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD ABS King 1.75mm', handle: 'abs-king', material: 'ABS', price: '39.90', weight: 1000,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD ABS Food 1.75mm', handle: 'abs-food', material: 'ABS', price: '44.90', weight: 1000,
    colors: ['Natural'] },

  { title: 'TreeD ABS Med 1.75mm', handle: 'abs-med', material: 'ABS', price: '49.90', weight: 1000,
    colors: ['Natural'] },

  { title: 'TreeD ABS ESD 1.75mm', handle: 'abs-esd', material: 'ABS-ESD', price: '79.90', weight: 1000,
    colors: ['Black Hole'] },

  { title: 'TreeD ABS CF 1.75mm', handle: 'abs-cf', material: 'ABS-CF', price: '79.90', weight: 1000,
    colors: ['Carbon Black'] },

  { title: 'TreeD ABS Fast Forward 1.75mm', handle: 'abs-fast-forward', material: 'ABS', price: '34.90', weight: 1000,
    colors: ['Natural', 'White', 'Black Hole'] },

  // ── ASA Family ────────────────────────────────────────────
  { title: 'TreeD ASA Uv729 1.75mm', handle: 'asa-uv729', material: 'ASA', price: '34.90', weight: 1000,
    colors: ['Natural', 'Black Hole', 'White'] },

  { title: 'TreeD Monumental Evo 1.75mm', handle: 'monumental-evo', material: 'ASA', price: '39.90', weight: 1000,
    colors: ['White Marble'] },

  { title: 'TreeD Clay Evo 1.75mm', handle: 'clay-evo', material: 'ASA', price: '39.90', weight: 1000,
    colors: ['Salmon Orange'] },

  // ── HIPS Family (Architectural) ───────────────────────────
  { title: 'TreeD HIPS Stiron 1.75mm', handle: 'hips-stiron', material: 'HIPS', price: '24.90', weight: 1000,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD Monumental 1.75mm', handle: 'monumental', material: 'HIPS', price: '29.90', weight: 1000,
    colors: ['White Marble'] },

  { title: 'TreeD Sandy 1.75mm', handle: 'sandy', material: 'HIPS', price: '29.90', weight: 1000,
    colors: ['Sand'] },

  { title: 'TreeD Clay 1.75mm', handle: 'clay', material: 'HIPS', price: '29.90', weight: 1000,
    colors: ['Salmon Orange'] },

  { title: 'TreeD Dark Stone 1.75mm', handle: 'dark-stone', material: 'HIPS', price: '29.90', weight: 1000,
    colors: ['Slate Grey'] },

  { title: 'TreeD Heritage Brick 1.75mm', handle: 'heritage-brick', material: 'HIPS', price: '29.90', weight: 1000,
    colors: ['Brown'] },

  { title: 'TreeD Caementum 1.75mm', handle: 'caementum', material: 'HIPS', price: '29.90', weight: 1000,
    colors: ['Grey Cement'] },

  // ── PC Family ─────────────────────────────────────────────
  { title: 'TreeD Verum T 1.75mm', handle: 'verum-t', material: 'PC', price: '59.90', weight: 1000,
    colors: ['Seetrought'] },

  { title: 'TreeD PC P51 1.75mm', handle: 'pc-p51', material: 'PC', price: '54.90', weight: 1000,
    colors: ['Seetrought'] },

  { title: 'TreeD PC ABS V0 1.75mm', handle: 'pc-abs-v0', material: 'PC-ABS', price: '69.90', weight: 1000,
    colors: ['Industrial Grey'] },

  { title: 'TreeD PC ABS Tenax 1.75mm', handle: 'pc-abs-tenax', material: 'PC-ABS', price: '64.90', weight: 1000,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD PC PBT B-mat 1.75mm', handle: 'pc-pbt-b-mat', material: 'PC-PBT', price: '69.90', weight: 1000,
    colors: ['Black Hole'] },

  { title: 'TreeD PC PBT GF 1.75mm', handle: 'pc-pbt-gf', material: 'PC-PBT-GF', price: '89.90', weight: 1000,
    colors: ['Anthracite Grey'] },

  // ── PA (Nylon) Family ─────────────────────────────────────
  { title: 'TreeD Structura MA 1.75mm', handle: 'structura-ma', material: 'PA', price: '59.90', weight: 1000,
    colors: ['Carbon Black'] },

  { title: 'TreeD PA KK 1.75mm', handle: 'pa-kk', material: 'PA', price: '54.90', weight: 1000,
    colors: ['Black Hole'] },

  { title: 'TreeD PA Lubratech 1.75mm', handle: 'pa-lubratech', material: 'PA', price: '79.90', weight: 1000,
    colors: ['Black Hole'] },

  { title: 'TreeD PA Longchain 1.75mm', handle: 'pa-longchain', material: 'PA', price: '69.90', weight: 1000,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD PA HP NAT 1.75mm', handle: 'pa-hp-nat', material: 'PA', price: '79.90', weight: 1000,
    colors: ['Natural'] },

  { title: 'TreeD PA HP CF 15 1.75mm', handle: 'pa-hp-cf-15', material: 'PA-CF', price: '129.90', weight: 1000,
    colors: ['Carbon Black'] },

  { title: 'TreeD PA HP GS10 1.75mm', handle: 'pa-hp-gs10', material: 'PA-GF', price: '109.90', weight: 1000,
    colors: ['Carbon Black'] },

  { title: 'TreeD PA CF25 1.75mm', handle: 'pa-cf25', material: 'PA-CF', price: '149.90', weight: 1000,
    colors: ['Carbon Black'] },

  { title: 'TreeD Carbonio CF15 1.75mm', handle: 'carbonio-cf15', material: 'PA-CF', price: '119.90', weight: 1000,
    colors: ['Carbon Black', 'Carbon Red', 'Carbon Green', 'Carbon Blue'] },

  { title: 'TreeD Carbonio Fast Forward 1.75mm', handle: 'carbonio-fast-forward', material: 'PA-CF', price: '129.90', weight: 1000,
    colors: ['Carbon Black'] },

  // ── PP Family ─────────────────────────────────────────────
  { title: 'TreeD Fortis LL 1.75mm', handle: 'fortis-ll', material: 'PP', price: '49.90', weight: 1000,
    colors: ['White'] },

  { title: 'TreeD PP P-lene 4 1.75mm', handle: 'pp-p-lene-4', material: 'PP', price: '44.90', weight: 1000,
    colors: ['Black Hole', 'White', 'Natural'] },

  { title: 'TreeD PP P-Lene 5 1.75mm', handle: 'pp-p-lene-5', material: 'PP', price: '49.90', weight: 1000,
    colors: ['White'] },

  { title: 'TreeD PP P-Lene T15 1.75mm', handle: 'pp-p-lene-t15', material: 'PP', price: '54.90', weight: 1000,
    colors: ['White'] },

  { title: 'TreeD PP GF30 1.75mm', handle: 'pp-gf30', material: 'PP-GF', price: '79.90', weight: 1000,
    colors: ['Slate Grey'] },

  { title: 'TreeD PP CF 18 1.75mm', handle: 'pp-cf-18', material: 'PP-CF', price: '89.90', weight: 1000,
    colors: ['Carbon Black'] },

  // ── Specialty Polymers ────────────────────────────────────
  { title: 'TreeD PE E-lene HD 1.75mm', handle: 'pe-e-lene-hd', material: 'HDPE', price: '44.90', weight: 1000,
    colors: ['White'] },

  { title: 'TreeD PET CF 15 1.75mm', handle: 'pet-cf-15', material: 'PET-CF', price: '99.90', weight: 1000,
    colors: ['Carbon Black'] },

  { title: 'TreeD PMMA Hirma 1.75mm', handle: 'pmma-hirma', material: 'PMMA', price: '49.90', weight: 1000,
    colors: ['Seetrought'] },

  // ── TPU/TPE Family (500g spools) ──────────────────────────
  { title: 'TreeD Flexmark 9 TPU 1.75mm', handle: 'flexmark-9', material: 'TPU', price: '54.90', weight: 500,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD Flexmark 8 TPU 1.75mm', handle: 'flexmark-8', material: 'TPU', price: '54.90', weight: 500,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD Flexmark 7 TPU 1.75mm', handle: 'flexmark-7', material: 'TPU', price: '54.90', weight: 500,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD Ultraflex TPE-E 1.75mm', handle: 'ultraflex', material: 'TPE', price: '59.90', weight: 500,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD Ultraflex+ TPE-E 1.75mm', handle: 'ultraflex-plus', material: 'TPE', price: '64.90', weight: 500,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD Flexability TPA 1.75mm', handle: 'flexability', material: 'TPA', price: '59.90', weight: 500,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD Flexability+ TPA 1.75mm', handle: 'flexability-plus', material: 'TPA', price: '64.90', weight: 500,
    colors: ['Black Hole', 'White'] },

  { title: 'TreeD Pneumatique TPU 1.75mm', handle: 'pneumatique', material: 'TPU', price: '49.90', weight: 500,
    colors: ['Black Hole'] },

  { title: 'TreeD Pure FT TPU 1.75mm', handle: 'pure-ft', material: 'TPU', price: '59.90', weight: 500,
    colors: ['Osso'] },

  { title: 'TreeD Elasto A TPA 1.75mm', handle: 'elasto-a', material: 'TPA', price: '54.90', weight: 500,
    colors: ['White'] },

  // ── PEEK/PPS (500g spools, ultra-high performance) ────────
  { title: 'TreeD PEEK NAT 1.75mm', handle: 'peek-nat', material: 'PEEK', price: '399.90', weight: 500,
    colors: ['Natural'] },

  { title: 'TreeD PEEK CF 15 1.75mm', handle: 'peek-cf-15', material: 'PEEK-CF', price: '449.90', weight: 500,
    colors: ['Black Hole'] },

  { title: 'TreeD PPS GF 25 1.75mm', handle: 'pps-gf-25', material: 'PPS-GF', price: '299.90', weight: 500,
    colors: ['Black Hole'] },

  { title: 'TreeD PPS CF15 1.75mm', handle: 'pps-cf15', material: 'PPS-CF', price: '329.90', weight: 500,
    colors: ['Carbon Black'] },
];

function main() {
  console.log('Building TreeD Filaments product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of TREED_PRODUCTS) {
    const colors = entry.colors || ['Default'];

    for (const color of colors) {
      const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const handle = `${entry.handle}-${colorSlug}`;
      const title = color !== 'Default'
        ? `${entry.title.replace(' 1.75mm', '')} ${color} 1.75mm`
        : entry.title;

      products.push({
        id: idCounter * 1000,
        title,
        handle,
        product_type: entry.material,
        vendor: 'TreeD Filaments',
        tags: entry.material,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `TREED-${handle}`,
          option1: color,
          option2: null,
          option3: null,
          available: true,
          grams: entry.weight,
        }],
        options: [{ name: 'Color', position: 1, values: [color] }],
        images: [],
        body_html: '',
        published_at: new Date().toISOString(),
      });

      idCounter++;
    }
  }

  console.log(`Total products (with color variants): ${products.length}`);

  // Material distribution
  const materials = {};
  for (const p of products) {
    materials[p.product_type] = (materials[p.product_type] || 0) + 1;
  }
  console.log('\nMaterial distribution:');
  for (const [mat, count] of Object.entries(materials).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${mat}: ${count}`);
  }

  // Save to scripts/
  const outPath = path.join(__dirname, 'treed-filaments-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'treed-filaments-catalog-curated',
    currency: 'EUR',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'treed-filaments-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
