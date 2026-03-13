#!/usr/bin/env node
/**
 * Pre-fetch UltiMaker filament products using a curated product catalog.
 *
 * UltiMaker (formerly Ultimaker/MakerBot) runs a Magento store at
 * store.ultimaker.com. No public API or Shopify endpoint available.
 * This script uses a manually curated product list based on their
 * official store and materials pages.
 *
 * UltiMaker filaments are organized by printer series:
 *  - S Series: 2.85mm diameter, NFC spools, 750g standard
 *  - Method Series: 1.75mm diameter, specialized materials
 *  - Sketch Series: 1.75mm diameter, education-focused PLA
 *
 * Usage:
 *   node scripts/fetch-ultimaker-products.cjs
 *
 * Output:
 *   scripts/ultimaker-products.json      (raw data)
 *   public/data/ultimaker-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// UltiMaker product catalog - curated from store.ultimaker.com
// Prices in USD, diameters vary by series
const ULTIMAKER_PRODUCTS = [
  // ══════════════════════════════════════════════════════════════
  // S Series Materials (2.85mm, NFC, 750g unless noted)
  // ══════════════════════════════════════════════════════════════

  { title: 'UltiMaker S Series PLA', handle: 'ultimaker-s-series-pla', material: 'PLA',
    price: '39.00', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black', 'White', 'Silver Metallic', 'Red', 'Orange', 'Yellow',
             'Green', 'Blue', 'Magenta', 'Pearl White', 'Pearl Gold'] },

  { title: 'UltiMaker S Series Tough PLA', handle: 'ultimaker-s-series-tough-pla', material: 'Tough PLA',
    price: '49.95', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black', 'White', 'Red', 'Green'] },

  { title: 'UltiMaker S Series ABS', handle: 'ultimaker-s-series-abs', material: 'ABS',
    price: '44.99', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black', 'White', 'Silver Metallic', 'Red', 'Orange', 'Yellow',
             'Green', 'Blue', 'Grey', 'Pearl Gold'] },

  { title: 'UltiMaker S Series PETG', handle: 'ultimaker-s-series-petg', material: 'PETG',
    price: '44.99', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black', 'White', 'Red', 'Orange', 'Yellow', 'Green', 'Blue',
             'Grey', 'Transparent'] },

  { title: 'UltiMaker S Series CPE', handle: 'ultimaker-s-series-cpe', material: 'CPE',
    price: '59.95', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black', 'White', 'Red', 'Yellow', 'Green', 'Blue',
             'Dark Grey', 'Transparent', 'Light Grey'] },

  { title: 'UltiMaker S Series CPE+', handle: 'ultimaker-s-series-cpe-plus', material: 'CPE+',
    price: '69.95', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black', 'White', 'Transparent'] },

  { title: 'UltiMaker S Series Nylon', handle: 'ultimaker-s-series-nylon', material: 'Nylon',
    price: '69.95', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black', 'Transparent'] },

  { title: 'UltiMaker S Series PC', handle: 'ultimaker-s-series-pc', material: 'PC',
    price: '69.95', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black', 'White', 'Transparent'] },

  { title: 'UltiMaker S Series TPU 95A', handle: 'ultimaker-s-series-tpu-95a', material: 'TPU',
    price: '79.00', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black', 'White', 'Red', 'Blue'] },

  { title: 'UltiMaker S Series PET CF', handle: 'ultimaker-s-series-pet-cf', material: 'PET-CF',
    price: '139.00', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black'] },

  { title: 'UltiMaker S Series PPS CF', handle: 'ultimaker-s-series-pps-cf', material: 'PPS-CF',
    price: '110.00', weight: 500, diameter: 2.85, series: 'S Series',
    colors: ['Black'] },

  { title: 'UltiMaker S Series Nylon CF Slide', handle: 'ultimaker-s-series-nylon-cf-slide', material: 'Nylon CF',
    price: '99.00', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Black'] },

  { title: 'UltiMaker S Series Breakaway', handle: 'ultimaker-s-series-breakaway', material: 'Breakaway',
    price: '69.95', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['White'] },

  { title: 'UltiMaker S Series PVA', handle: 'ultimaker-s-series-pva', material: 'PVA',
    price: '99.95', weight: 750, diameter: 2.85, series: 'S Series',
    colors: ['Natural'] },

  { title: 'UltiMaker S Series PVA Removal Station', handle: 'ultimaker-s-series-pva-removal', material: 'PVA',
    price: '47.95', weight: 350, diameter: 2.85, series: 'S Series',
    colors: ['Natural'] },

  { title: 'UltiMaker S Series Cleaning Filament', handle: 'ultimaker-s-series-cleaning', material: 'Cleaning',
    price: '17.95', weight: 100, diameter: 2.85, series: 'S Series',
    colors: ['Natural'] },

  // ══════════════════════════════════════════════════════════════
  // Method Series Materials (1.75mm)
  // ══════════════════════════════════════════════════════════════

  { title: 'UltiMaker Method PLA', handle: 'ultimaker-method-pla', material: 'PLA',
    price: '65.00', weight: 750, diameter: 1.75, series: 'Method',
    colors: ['Black', 'White', 'Red', 'True Orange', 'True Yellow',
             'True Green', 'True Blue', 'Cool Gray'] },

  { title: 'UltiMaker Method ABS-R', handle: 'ultimaker-method-abs-r', material: 'ABS',
    price: '109.00', weight: 750, diameter: 1.75, series: 'Method',
    colors: ['Black', 'White', 'Red', 'True Orange', 'True Blue',
             'Cool Gray'] },

  { title: 'UltiMaker Method ABS CF', handle: 'ultimaker-method-abs-cf', material: 'ABS-CF',
    price: '99.00', weight: 650, diameter: 1.75, series: 'Method',
    colors: ['Black'] },

  { title: 'UltiMaker Method ASA', handle: 'ultimaker-method-asa', material: 'ASA',
    price: '72.00', weight: 750, diameter: 1.75, series: 'Method',
    colors: ['Black', 'White'] },

  { title: 'UltiMaker Method PETG', handle: 'ultimaker-method-petg', material: 'PETG',
    price: '59.00', weight: 750, diameter: 1.75, series: 'Method',
    colors: ['Black', 'White', 'Transparent'] },

  { title: 'UltiMaker Method PC-ABS FR', handle: 'ultimaker-method-pc-abs-fr', material: 'PC-ABS',
    price: '94.00', weight: 750, diameter: 1.75, series: 'Method',
    colors: ['Black'] },

  { title: 'UltiMaker Method Nylon 12 CF', handle: 'ultimaker-method-nylon-12-cf', material: 'Nylon CF',
    price: '129.00', weight: 500, diameter: 1.75, series: 'Method',
    colors: ['Black'] },

  { title: 'UltiMaker Method PVA', handle: 'ultimaker-method-pva', material: 'PVA',
    price: '84.00', weight: 300, diameter: 1.75, series: 'Method',
    colors: ['Natural'] },

  { title: 'UltiMaker Method SR-30', handle: 'ultimaker-method-sr-30', material: 'SR-30',
    price: '169.00', weight: 300, diameter: 1.75, series: 'Method',
    colors: ['Natural'] },

  { title: 'UltiMaker Method RapidRinse', handle: 'ultimaker-method-rapidrinse', material: 'RapidRinse',
    price: '169.00', weight: 500, diameter: 1.75, series: 'Method',
    colors: ['Natural'] },

  // ══════════════════════════════════════════════════════════════
  // Sketch Series Materials (1.75mm, education, 1kg)
  // ══════════════════════════════════════════════════════════════

  { title: 'UltiMaker Sketch PLA', handle: 'ultimaker-sketch-pla', material: 'PLA',
    price: '39.00', weight: 1000, diameter: 1.75, series: 'Sketch',
    colors: ['Black', 'White', 'Red', 'Orange', 'Yellow', 'Green', 'Blue'] },

  { title: 'UltiMaker Sketch Tough PLA', handle: 'ultimaker-sketch-tough-pla', material: 'Tough PLA',
    price: '39.00', weight: 1000, diameter: 1.75, series: 'Sketch',
    colors: ['Black', 'White'] },

  // ══════════════════════════════════════════════════════════════
  // Replicator+ Series (legacy MakerBot, 1.75mm)
  // ══════════════════════════════════════════════════════════════

  { title: 'UltiMaker Replicator+ PLA Large', handle: 'ultimaker-replicator-pla-large', material: 'PLA',
    price: '24.75', weight: 900, diameter: 1.75, series: 'Replicator+',
    colors: ['True Black', 'True White', 'True Red', 'True Orange',
             'True Yellow', 'True Green', 'True Blue', 'Cool Gray'] },

  { title: 'UltiMaker Replicator+ Tough', handle: 'ultimaker-replicator-tough', material: 'Tough PLA',
    price: '51.00', weight: 900, diameter: 1.75, series: 'Replicator+',
    colors: ['Onyx Black', 'Stone White', 'Slate Gray'] },
];

function main() {
  console.log('Building UltiMaker product catalog (curated)...');

  const products = [];
  let idCounter = 1;

  for (const entry of ULTIMAKER_PRODUCTS) {
    const colors = entry.colors || ['Default'];

    for (const color of colors) {
      const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const handle = `${entry.handle}-${colorSlug}`;
      const diamStr = entry.diameter === 2.85 ? '2.85mm' : '1.75mm';
      const title = color !== 'Default'
        ? `${entry.title} ${color} ${diamStr}`
        : `${entry.title} ${diamStr}`;

      products.push({
        id: idCounter * 1000,
        title,
        handle,
        product_type: entry.material,
        vendor: 'UltiMaker',
        tags: [entry.material, entry.series, `${entry.diameter}mm`].join(', '),
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `ULTIMAKER-${entry.handle}-${colorSlug}`,
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

  // Series distribution
  const series = {};
  for (const p of products) {
    const s = p.tags.split(', ')[1];
    series[s] = (series[s] || 0) + 1;
  }
  console.log('\nSeries distribution:');
  for (const [s, count] of Object.entries(series).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${count}`);
  }

  // Save output
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'ultimaker-catalog-curated',
    currency: 'USD',
  };

  const outPath = path.join(__dirname, 'ultimaker-products.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'ultimaker-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
